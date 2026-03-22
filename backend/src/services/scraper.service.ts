import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import puppeteer, { Browser } from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import * as fs from 'fs';

const ssmClient = new SSMClient({});

// Cache per i parametri SSM (evita chiamate ripetute durante warm start)
const parameterCache: Map<string, { value: string; expiry: number }> = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minuti

/**
 * Recupera un parametro da AWS SSM Parameter Store con caching in-memory.
 */
export async function getSSMParameter(name: string): Promise<string> {
  const cached = parameterCache.get(name);
  if (cached && Date.now() < cached.expiry) {
    return cached.value;
  }

  const stage = process.env['STAGE'] || 'dev';
  
  // Aggiunto supporto mock in locale con SAM Local + env.json
  const envKey = name.toUpperCase().replace(/-/g, '_');
  if (process.env[envKey]) {
    console.log(`[SSM Mock] Utilizzo variabile d'ambiente locale per il parametro: ${name}`);
    return process.env[envKey] as string;
  }

  const parameterName = `/price-tracker/${stage}/${name}`;

  const command = new GetParameterCommand({
    Name: parameterName,
    WithDecryption: true,
  });

  const response = await ssmClient.send(command);
  const value = response.Parameter?.Value;

  if (!value) {
    throw new Error(`SSM Parameter not found: ${parameterName}`);
  }

  parameterCache.set(name, { value, expiry: Date.now() + CACHE_TTL_MS });
  return value;
}

/**
 * Scraper Service
 * Utilizza Puppeteer Core con @sparticuz/chromium per estrarre il testo
 * grezzo (innerText) da una pagina prodotto e-commerce.
 *
 * Strategia:
 * - Lancia un headless browser (Chromium compatibile con Lambda)
 * - Naviga all'URL del prodotto
 * - Attende il rendering completo del JS
 * - Estrae document.body.innerText
 * - Restituisce il testo grezzo per il parsing LLM
 */
export async function scrapeProductPage(url: string): Promise<string> {
  let browser: Browser | null = null;

  try {
    // Configura avvio browser (Locale o Lambda)
    if (process.env.IS_LOCAL === 'true') {
      const localPaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
      ];
      
      const execPath = localPaths.find(p => fs.existsSync(p));
      if (!execPath) {
        throw new Error('Impossibile trovare Chrome o Edge nei percorsi standard di Windows locale.');
      }

      console.log(`[Scraper] Ambiente locale rilevato. Avvio browser da: ${execPath}`);
      browser = await puppeteer.launch({
        executablePath: execPath,
        headless: true,
      });
    } else {
      console.log('[Scraper] Ambiente AWS rilevato. Avvio Sparticuz Chromium...');
      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: null,
        executablePath: await chromium.executablePath(),
        headless: true,
      });
    }

    const page = await browser.newPage();

    // Ottimizzazione Performance Network (Drop CSS/IMG)
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // User-Agent realistico per evitare blocchi basilari
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Naviga alla pagina con timeout generoso (pagine e-commerce pesanti)
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 25000,
    });

    // Attendi un breve periodo per il rendering JS dinamico
    await page.waitForFunction(
      'document.readyState === "complete"',
      { timeout: 10000 }
    );

    // Estrai il testo grezzo della pagina
    const innerText = await page.evaluate(
      'document.body.innerText'
    ) as string;

    if (!innerText || innerText.trim().length < 50) {
      throw new Error(
        'Il testo estratto dalla pagina è troppo corto. La pagina potrebbe essere bloccata da protezioni anti-bot.'
      );
    }

    // Limita il testo a ~8000 caratteri per ottimizzare il consumo di token LLM
    const truncatedText = innerText.substring(0, 8000);

    console.log(`[Scraper] Testo estratto con successo da ${url} (${truncatedText.length} chars)`);
    return truncatedText;

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[Scraper] Errore durante lo scraping di ${url}: ${message}`);
    throw new Error(`Errore scraping: ${message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
