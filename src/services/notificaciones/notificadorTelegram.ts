import { config } from "@/lib/config";
import type { Notificador } from "@/services/notificaciones/Notificador";

export class NotificadorTelegram implements Notificador {
  async enviar(mensaje: string): Promise<void> {
    if (!config.telegramBotToken || !config.telegramChatId) {
      throw new Error("Faltan TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID en las variables de entorno.");
    }

    const response = await fetch(
      `https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: config.telegramChatId,
          text: mensaje,
          disable_web_page_preview: true,
        }),
      },
    );

    if (!response.ok) {
      const detalle = await response.text();
      throw new Error(`Telegram falló: ${detalle}`);
    }
  }
}
