# ARCHITECTURE: AI-Powered Price Tracker

## Struttura del Workspace (Monorepo)
- `/frontend`: Applicazione Angular
- `/backend`: Logica serverless e Infrastruttura (AWS SAM)

## Stack Tecnologico

### Frontend (User Interface)
- **Framework:** Angular 19+ (TypeScript Strict, Standalone Components, Signals per lo stato). Nessun uso di NgModules.
- **Styling:** Tailwind CSS per un design responsive, moderno e dark-mode nativa.
- **Data Visualization:** Chart.js (o ng2-charts) per i grafici storici.

### Backend (API & Scraper)
- **Runtime:** Node.js con TypeScript.
- **Infrastruttura come Codice (IaC):** AWS SAM (Serverless Application Model) con file `template.yaml`.
- **API:** Amazon API Gateway (con Rate Limiting configurato).
- **Compute:** AWS Lambda.
- **Database:** Amazon DynamoDB (Design Single-Table o Multi-Table semplice).
- **Scraping Engine:** Puppeteer Core (per caricare il DOM e il JS) + Chiamata API a un LLM (es. Claude/Gemini) per l'estrazione dati in JSON.

## Convenzioni di Codice
- Usa ES6+ features e async/await. Nessun `.then()/.catch()`.
- Definisci sempre interfacce TypeScript condivise (es. `Product`, `PriceHistory`) tra frontend e backend per evitare disallineamenti.
- Gestione degli errori centralizzata sia su Angular (Interceptor) che su API Gateway/Lambda.