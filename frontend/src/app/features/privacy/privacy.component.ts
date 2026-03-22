import { Component } from '@angular/core';

@Component({
  selector: 'app-privacy',
  standalone: true,
  template: `
    <div class="max-w-3xl mx-auto pt-10 px-4">
      <div class="bg-dark-surface rounded-[2rem] p-8 md:p-12 border border-white/5 relative overflow-hidden shadow-2xl">
        <h1 class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-500 to-primary-600 mb-6">
          Privacy Policy
        </h1>
        
        <div class="prose prose-invert prose-emerald max-w-none text-dark-muted">
          <p class="text-lg text-white mb-6">
            La tutela della tua privacy è fondamentale per l'AI-Powered Price Tracker.
          </p>
          
          <h2 class="text-xl font-semibold text-white mt-8 mb-4">Quali dati raccogliamo</h2>
          <p>
            Questo servizio <strong>non richiede alcuna registrazione</strong> e non raccoglie dati personali (es. email, numero di telefono, nome).
            L'unica informazione che il sistema accetta è l'<strong>URL pubblico</strong> di un prodotto e-commerce (Amazon o Temu) che inserisci volontariamente nella Dashboard.
          </p>

          <h2 class="text-xl font-semibold text-white mt-8 mb-4">Come utilizziamo gli URL</h2>
          <p>
            L'URL incollato viene utilizzato esclusivamente dal nostro motore di intelligenza artificiale per:
          </p>
          <ul class="list-disc pl-5 mt-2 space-y-2 mb-6">
            <li>Scraping effimero del testo (innerText) della pagina prodotto.</li>
            <li>Estrazione strutturata di Prezzo, Nome Prodotto e Valuta.</li>
            <li>Monitoraggio periodico (refresh automatico) per rilevare variazioni storiche di prezzo.</li>
          </ul>

          <h2 class="text-xl font-semibold text-white mt-8 mb-4">Dati condivisi con terze parti</h2>
          <p>
            Il nostro backend serverless sfrutta API esterne sicure. I dati della pagina (mai i tuoi dati personali) vengono elaborati da <strong>Anthropic (Claude 3 Haiku)</strong> tramite la Serverless Application (AWS Lambda). Nessun ID utente o profilazione comportamentale viene associata ai link che inserisci.
          </p>

          <h2 class="text-xl font-semibold text-white mt-8 mb-4">Cookie e Tracciamento</h2>
          <p>
            Questa applicazione frontend Angular utilizza esclusivamente LocalStorage e SessionStorage per necessità puramente tecniche o di mantenimento dell'interfaccia (es. preferenze tema se implementate). <strong>Non utilizziamo Google Analytics</strong>, pixel di tracking di Facebook o nessun altro cookie di profilazione terze parti.
          </p>

          <div class="mt-12 pt-8 border-t border-white/10 text-sm">
            Ultimo aggiornamento: Marzo 2026. Per richieste, non esitare a ignorare l'inesistenza del pulsante Contattaci.
          </div>
        </div>
      </div>
    </div>
  `
})
export class PrivacyComponent {}
