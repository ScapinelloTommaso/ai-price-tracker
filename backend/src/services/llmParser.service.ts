import Groq from 'groq-sdk';
import { LlmParsedProduct } from '../models/interfaces';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `Sei un estrattore di dati. Analizza questo testo estratto da un e-commerce. Restituisci un JSON con: productName, price (numero), currency, imageUrl e un campo booleano success.

REGOLE IMPORTANTI:
1. Se il testo sembra una pagina di blocco, un captcha, o se non riesci assolutamente a trovare un prezzo o il nome di un prodotto, imposta success: false.
2. Se c'è un prodotto valido, imposta success: true e converti le virgole dei decimali in punti (es. 29,99 -> 29.99).
3. DEVI RISPONDERE SOLO E UNICAMENTE CON UN OGGETTO JSON. La struttura obbligatoria è: 
{ "success": boolean, "productName": "string", "price": number, "currency": "string", "imageUrl": "string" }`;

/**
 * LLM Parser Service
 * Utilizza Groq LlaMA 3 per analizzare il testo grezzo
 * ed estrarre dati strutturati rigidly in JSON.
 */
export async function parseProductWithLLM(rawText: string): Promise<LlmParsedProduct> {
  if (process.env.IS_LOCAL === 'true') {
    console.log('[LLM Mock] Bypass chiamata a Groq in locale.');
    const mockPrice = parseFloat((Math.random() * 50 + 10).toFixed(2));
    
    return {
      success: true,
      productName: 'Prodotto Simulato ' + Math.floor(Math.random() * 1000),
      price: mockPrice,
      currency: 'EUR'
    };
  }

  const userMessage = `Analizza il seguente testo estratto da una pagina prodotto e-commerce ed estrai le informazioni.\n\nTESTO: ${rawText}`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0,
      response_format: { type: 'json_object' }
    });

    const contentText = chatCompletion.choices[0]?.message?.content || '{}';
    console.log(`[LLM Parser] Risposta raw Groq: ${contentText}`);

    // Parsing JSON formattato
    const parsed = JSON.parse(contentText) as LlmParsedProduct;

    if (parsed.success === false) {
      console.log('[LLM Parser] Il modello ha stabilito success: false (Captcha/Pagina Bloccata)');
      return parsed;
    }

    if (!parsed.productName || typeof parsed.productName !== 'string') {
      throw new Error('Campo "productName" mancante o non valido nella risposta LLM.');
    }
    if (typeof parsed.price !== 'number' || parsed.price < 0) {
      throw new Error('Campo "price" mancante o non valido nella risposta LLM.');
    }

    console.log(`[LLM Parser] Prodotto estratto: "${parsed.productName}" — ${parsed.price} ${parsed.currency}`);
    return parsed;

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[LLM Parser] Errore durante la chiamata a Groq: ${message}`);
    throw new Error(`Errore LLM Parser / Groq: ${message}`);
  }
}
