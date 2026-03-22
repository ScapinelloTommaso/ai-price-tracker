import express from 'express';
import cors from 'cors';
import { handler as addProductHandler } from './src/functions/addProduct/handler';
import { handler as getProductsHandler } from './src/functions/getProducts/handler';
import { handler as getPriceHistoryHandler } from './src/functions/getPriceHistory/handler';
import { handler as refreshPricesHandler } from './src/functions/refreshPrices/handler';

// Configura l'ambiente per l'emulatore locale
process.env.IS_LOCAL = 'true';
process.env.STAGE = 'dev';
process.env.PRODUCTS_TABLE = 'local-products';
process.env.PRICE_HISTORY_TABLE = 'local-price-history';

import fs from 'fs';
import path from 'path';

// Puoi mockare qui le chiavi o caricarle da env.json in locale
try {
  const envPath = path.join(__dirname, 'env.json');
  if (fs.existsSync(envPath)) {
    const envData = JSON.parse(fs.readFileSync(envPath, 'utf8'));
    if (envData.Parameters) {
      Object.entries(envData.Parameters).forEach(([key, value]) => {
        process.env[key] = value as string;
      });
      console.log('✅ Variabili d\'ambiente caricate da env.json');
    }
  }
} catch (e) {
  console.error("Avviso: Impossibile leggere env.json", e);
}

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

// Helper per simulare l'oggetto event di API Gateway HTTP API / REST API
const createEvent = (req: express.Request): any => ({
  body: req.body ? JSON.stringify(req.body) : null,
  pathParameters: req.params,
  queryStringParameters: req.query,
  requestContext: { httpMethod: req.method },
});

// Rotta GET /products
app.get('/products', async (req, res) => {
  try {
    const result = await getProductsHandler(createEvent(req)) as any;
    if (!result) return res.status(500).send('Errore: Handler non ha restituito nulla');
    
    const statusCode = result.statusCode || 200;
    let payload = result.body;
    try { if (payload) payload = JSON.parse(result.body); } catch (e) {}
    
    return res.status(statusCode).json(payload);
  } catch (err) {
    console.error('[Express GET /products] Errore:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Rotta POST /products
app.post('/products', async (req, res) => {
  try {
    const result = await addProductHandler(createEvent(req)) as any;
    if (!result) return res.status(500).send('Errore: Handler non ha restituito nulla');
    
    const statusCode = result.statusCode || 201;
    let payload = result.body;
    try { if (payload) payload = JSON.parse(result.body); } catch (e) {}
    
    return res.status(statusCode).json(payload);
  } catch (err) {
    console.error('[Express POST /products] Errore:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Rotta GET /products/:productId/history
app.get('/products/:productId/history', async (req, res) => {
  try {
    const result = await getPriceHistoryHandler(createEvent(req)) as any;
    if (!result) return res.status(500).send('Errore: Handler non ha restituito nulla');
    
    const statusCode = result.statusCode || 200;
    let payload = result.body;
    try { if (payload) payload = JSON.parse(result.body); } catch (e) {}
    
    return res.status(statusCode).json(payload);
  } catch (err) {
    console.error('[Express GET /history] Errore:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Rotta POST /products/:productId/refresh (Motore di refresh integrato/forzato)
app.post('/products/:productId/refresh', async (req, res) => {
  try {
    const result = await refreshPricesHandler(createEvent(req)) as any;
    if (!result) return res.status(500).send('Errore: Handler non ha restituito nulla');
    
    const statusCode = result.statusCode || 200;
    let payload = result.body;
    try { if (payload) payload = JSON.parse(result.body); } catch (e) {}
    
    return res.status(statusCode).json(payload);
  } catch (err) {
    console.error('[Express POST /refresh] Errore:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Emulatore API Locale avviato su http://localhost:${PORT}`);
  console.log('Ambiente configurato con IS_LOCAL=true e json mock-db fallback abilitato.');
});
