# MISSION: AI-Powered Price Tracker

## Obiettivo del Progetto
Costruire una piattaforma serverless per il tracciamento dei prezzi di prodotti e-commerce (focalizzata su Amazon e Temu). Il sistema deve dimostrare competenze architetturali di livello Enterprise, sicurezza informatica e l'integrazione di Intelligenza Artificiale per l'estrazione dei dati.

## Funzionalità Core
1. **Scraping Resiliente basato su AI:** Invece di usare selettori CSS fragili, il backend userà un headless browser per estrarre il testo grezzo della pagina e un LLM per parsare il JSON con "Nome Prodotto" e "Prezzo".
2. **Tracciamento Storico:** I prezzi estratti verranno salvati in un database NoSQL per creare uno storico temporale.
3. **Dashboard Analitica:** Una UI moderna per incollare nuovi URL, visualizzare i prodotti tracciati e i grafici dell'andamento dei prezzi.

## Requisiti di Sicurezza e Professionalità (Must-Have)
- **Zero Hardcoded Secrets:** Nessuna chiave API deve risiedere nel codice. Usare AWS Systems Manager Parameter Store.
- **Principio del Privilegio Minimo (IAM):** Ogni funzione AWS Lambda deve avere permessi strettamente limitati alle risorse che utilizza.
- **Rate Limiting:** Protezione degli endpoint API contro abusi (DDoS o consumo eccessivo di budget LLM).
- **Compliance Visiva:** Il frontend deve includere una pagina di Privacy Policy che spiega il trattamento del solo URL pubblico.