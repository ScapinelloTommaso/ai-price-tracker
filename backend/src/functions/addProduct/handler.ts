import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';
import { scrapeProductPage } from '../../services/scraper.service';
import { parseProductWithLLM } from '../../services/llmParser.service';
import { Product, PriceHistory, AddProductResponse, AddProductRequest } from '../../models/interfaces';

const isLocal = process.env.IS_LOCAL === 'true';
const ddbClient = new DynamoDBClient(
  isLocal ? { region: 'eu-west-1', credentials: { accessKeyId: 'x', secretAccessKey: 'x' } } : {}
);
const docClient = DynamoDBDocumentClient.from(ddbClient);

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE!;
const PRICE_HISTORY_TABLE = process.env.PRICE_HISTORY_TABLE!;

/**
 * Crea una risposta API Gateway con CORS headers.
 */
function apiResponse(statusCode: number, body: object): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': '*',
    },
    body: JSON.stringify(body),
  };
}

/**
 * POST /products
 *
 * Flusso:
 * 1. Riceve { url } dal body della richiesta
 * 2. Valida l'URL (Amazon o Temu)
 * 3. Scraping della pagina con Puppeteer
 * 4. Parsing del testo con Claude 3 Haiku
 * 5. Salva il prodotto in DynamoDB (Products + primo PriceHistory)
 * 6. Ritorna il prodotto creato
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('[addProduct] Ricevuta richiesta:', JSON.stringify(event.body));

  try {
    // 1. Parsing e validazione del body e headers
    const userId = event.headers['x-user-id'] || event.headers['X-User-Id'];
    if (!userId) {
      return apiResponse(400, {
        message: 'Accesso negato: header x-user-id mancante.',
        statusCode: 400,
        timestamp: new Date().toISOString(),
      });
    }

    if (!event.body) {
      return apiResponse(400, {
        message: 'Il body della richiesta è obbligatorio.',
        statusCode: 400,
        timestamp: new Date().toISOString(),
      });
    }

    const { url, chatId } = JSON.parse(event.body) as AddProductRequest;

    if (!url || typeof url !== 'string') {
      return apiResponse(400, {
        message: 'Il campo "url" è obbligatorio e deve essere una stringa.',
        statusCode: 400,
        timestamp: new Date().toISOString(),
      });
    }

    let source: string;
    try {
      const hostname = new URL(url).hostname.replace('www.', '');
      source = hostname.split('.')[0];
    } catch {
      return apiResponse(400, {
        message: 'L\'URL fornito non è valido.',
        statusCode: 400,
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`[addProduct] Fonte rilevata: ${source}`);

    // 3. Scraping della pagina
    console.log(`[addProduct] Avvio scraping di: ${url}`);
    const rawText = await scrapeProductPage(url);
    console.log(`[addProduct] Testo estratto: ${rawText.length} caratteri`);

    // 4. Parsing con LLM
    console.log('[addProduct] Invio testo al LLM per il parsing...');
    const parsedProduct = await parseProductWithLLM(rawText);
    
    if (
      parsedProduct.success === false ||
      typeof parsedProduct.price !== 'number' ||
      !parsedProduct.productName ||
      !parsedProduct.currency
    ) {
      console.warn('[addProduct] Estrazione fallita dal LLM (dati incompleti o success = false)');
      return apiResponse(400, {
        message: 'Impossibile estrarre le info: il sito non è supportato o ha bloccato la richiesta.',
        statusCode: 400,
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`[addProduct] Prodotto parsato: ${parsedProduct.productName}`);

    // 5. Creazione record nel database
    const now = new Date().toISOString();
    const productId = randomUUID();

    const product: Product = {
      productId,
      url,
      productName: parsedProduct.productName || 'Prodotto Sconosciuto',
      currentPrice: parsedProduct.price ?? 0,
      currency: parsedProduct.currency || 'EUR',
      source,
      createdAt: now,
      updatedAt: now,
      userId,
      ...(chatId && { chatId })
    };

    const priceHistory: PriceHistory = {
      productId,
      timestamp: now,
      price: parsedProduct.price ?? 0,
      currency: parsedProduct.currency || 'EUR',
    };

    // Salva in parallelo su entrambe le tabelle
    await Promise.all([
      docClient.send(
        new PutCommand({
          TableName: PRODUCTS_TABLE,
          Item: product,
        })
      ),
      docClient.send(
        new PutCommand({
          TableName: PRICE_HISTORY_TABLE,
          Item: priceHistory,
        })
      ),
    ]);

    console.log(`[addProduct] Prodotto salvato con ID: ${productId}`);

    // 6. Risposta con il prodotto creato
    const response: AddProductResponse = {
      product,
      priceHistory,
    };

    return apiResponse(201, response);

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Errore interno del server';
    console.error('[addProduct] Errore:', message);

    return apiResponse(500, {
      message: `Errore durante l'aggiunta del prodotto: ${message}`,
      statusCode: 500,
      timestamp: new Date().toISOString(),
    });
  }
};
