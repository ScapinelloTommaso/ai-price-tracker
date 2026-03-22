import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { Product, PriceHistory } from '../../models/interfaces';
import { scrapeProductPage } from '../../services/scraper.service';
import { parseProductWithLLM } from '../../services/llmParser.service';
import { sendTelegramNotification } from '../../services/notification.service';

const isLocal = process.env.IS_LOCAL === 'true';
const ddbClient = new DynamoDBClient(
  isLocal ? { region: 'eu-west-1', credentials: { accessKeyId: 'x', secretAccessKey: 'x' } } : {}
);
const docClient = DynamoDBDocumentClient.from(ddbClient);

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE!;
const PRICE_HISTORY_TABLE = process.env.PRICE_HISTORY_TABLE!;

// Delay di cortesia per evitare rate-limiting da Amazon (es. 2.5 secondi)
const SCRAPING_DELAY_MS = 2500;
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function apiResponse(statusCode: number, body: object): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
    },
    body: JSON.stringify(body),
  };
}

/**
 * Handler per il refresh periodico (o manuale via API) dei prezzi.
 * Triggerato da EventBridge (in base al template.yaml) o chiamata POST.
 */
export const handler = async (event: APIGatewayProxyEvent | any): Promise<APIGatewayProxyResult | void> => {
  console.log('[refreshPrices] Avvio ciclo di aggiornamento prezzi...');

  try {
    // 1. Scan della tabella Products per ottenere tutti gli URL da controllare
    const scanCommand = new ScanCommand({ TableName: PRODUCTS_TABLE });
    const response = await docClient.send(scanCommand);
    let products = (response.Items || []) as Product[];

    let targetProductId = event.pathParameters?.productId;
    if (event.body) {
      try {
        const bodyObj = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        if (bodyObj?.productId) targetProductId = bodyObj.productId;
      } catch(e) {}
    }
    
    if (targetProductId) {
      products = products.filter(p => p.productId === targetProductId);
    }

    if (products.length === 0) {
      console.log('[refreshPrices] Nessun prodotto da tracciare. Uscita.');
      return apiResponse(200, { message: 'Nessun prodotto da aggiornare' });
    }

    console.log(`[refreshPrices] Trovati ${products.length} prodotti da aggiornare.`);

    let successCount = 0;
    let errorCount = 0;

    // 2. Iterazione sequenziale con delay anti-bot
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      console.log(`[refreshPrices] Elaborazione (${i + 1}/${products.length}): ${product.productName}`);

      try {
        // Estrazione testo pag. e parsing LLM
        const rawText = await scrapeProductPage(product.url);
        const parsedData = await parseProductWithLLM(rawText);

        if (
          parsedData.success === false ||
          typeof parsedData.price !== 'number' ||
          !parsedData.productName ||
          !parsedData.currency
        ) {
          console.warn(`[refreshPrices] Skip prodotto ${product.productId}: impossibile estrarre prezzo o nome validi dal testo.`);
          continue;
        }

        let newPrice = parsedData.price;
        
        // --- INIZIO MOCK TEST TELEGRAM ---
        if (process.env.IS_LOCAL === 'true' && targetProductId && product.currentPrice > 0) {
          newPrice = product.currentPrice * 0.8; // Simulo drop del 20%
          parsedData.price = newPrice;
          console.log(`[Telegram Test] Simulazione drop del 20% (Da ${product.currentPrice} a ${newPrice})`);
        }
        // --- FINE MOCK TEST TELEGRAM ---

        const now = new Date().toISOString();

        console.log(`[refreshPrices] Prezzo corrente DB: ${product.currentPrice} | Nuovo prezzo: ${newPrice}`);

        // Scriviamo SEMPRE lo storico se il prezzo è diverso o se è passato molto tempo (per semplicità
        // e per avere dati grafici continui, qui lo scriviamo sempre come nuovo data-point del refresh)
        
        const priceHistory: PriceHistory = {
          productId: product.productId,
          timestamp: now,
          price: newPrice,
          currency: parsedData.currency || 'EUR',
        };

        const updatedProduct: Product = {
          ...product,
          currentPrice: newPrice,
          updatedAt: now,
          // Aggiorniamo anche il nome in caso sia cambiato, aggiungendo "(Non disponibile)" etc.
          productName: parsedData.productName || product.productName // mantieni nome originale se fallito
        };

        // Salvataggio nel database
        await Promise.all([
          docClient.send(new PutCommand({ TableName: PRODUCTS_TABLE, Item: updatedProduct })),
          docClient.send(new PutCommand({ TableName: PRICE_HISTORY_TABLE, Item: priceHistory })),
        ]);

        // 3. Verifica per Alert Calo di Prezzo
        // Alert solo se c'è un chatId salvato, dropPercent >= 0.15 e newPrice positivo
        const dropPercent = product.currentPrice > 0 ? (product.currentPrice - newPrice) / product.currentPrice : 0;
        
        if (newPrice > 0 && product.currentPrice > 0 && dropPercent >= 0.15 && product.chatId) {
          console.log(`[refreshPrices] ALERT: Prezzo sceso del ${(dropPercent*100).toFixed(1)}% (da ${product.currentPrice} a ${newPrice})`);
          
          const message = `🚨 <b>CALO DI PREZZO (${(dropPercent*100).toFixed(0)}%)!</b>\n\n` +
                          `Il prodotto <i>${parsedData.productName}</i> è sceso!\n` +
                          `Da: <s>${product.currentPrice} ${parsedData.currency}</s>\n` +
                          `A: <b>${newPrice} ${parsedData.currency}</b>\n\n` +
                          `🔗 <a href="${product.url}">Link al Prodotto</a>`;
          
          await sendTelegramNotification(message, product.chatId);
          console.log('[Telegram Test] Notifica inviata per calo di prezzo!');
        }

        successCount++;
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(`[refreshPrices] Errore su prodotto ${product.productId}: ${errMsg}`);
        errorCount++;
      }

      // 4. Delay anti-bot, tranne per l'ultimo elemento
      if (i < products.length - 1) {
        console.log(`[refreshPrices] Attesa di ${SCRAPING_DELAY_MS}ms per limiti anti-bot...`);
        await delay(SCRAPING_DELAY_MS);
      }
    }

    console.log(`[refreshPrices] Ciclo terminato. Successi: ${successCount}, Errori: ${errorCount}`);

    // Se l'invocazione era HTTP, ritorna JSON
    if (event.requestContext) {
      return apiResponse(200, { successCount, errorCount, total: products.length });
    }

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[refreshPrices] Errore critico nel ciclo:', message);
    if (event.requestContext) {
      return apiResponse(500, { message: 'Errore interno nel motore di refresh' });
    }
  }
};
