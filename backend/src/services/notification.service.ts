import { getSSMParameter } from './scraper.service';

/**
 * Invia un messaggio Telegram utilizzando la Bot API ufficiale.
 * @param message Il testo del messaggio da inviare
 */
export async function sendTelegramNotification(message: string, chatId?: string): Promise<void> {
  try {
    const botToken = await getSSMParameter('telegram-bot-token');
    const targetChatId = chatId || await getSSMParameter('telegram-chat-id');

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: targetChatId,
        text: message,
        parse_mode: 'HTML', // Permette l'uso di link HTML base e grassetto
        disable_web_page_preview: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Notification] Errore API Telegram: ${response.status} - ${errorText}`);
      throw new Error(`Telegram API Error: ${response.status}`);
    }

    console.log(`[Notification] Messaggio Telegram inviato con successo.`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[Notification] Errore durante l'invio della notifica: ${msg}`);
    // Non facciamo throw dell'errore per non bloccare il flusso principale di refresh
  }
}
