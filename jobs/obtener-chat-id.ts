import { config } from "@/lib/config";

interface ActualizacionesTelegram {
  ok: boolean;
  description?: string;
  result?: Array<{
    message?: {
      chat: {
        id: number;
        type: string;
      };
    };
  }>;
}

async function obtenerChatId(): Promise<void> {
  if (!config.telegramBotToken) {
    throw new Error("Falta TELEGRAM_BOT_TOKEN en las variables de entorno.");
  }

  const response = await fetch(
    `https://api.telegram.org/bot${config.telegramBotToken}/getUpdates`,
  );
  const resultado = (await response.json()) as ActualizacionesTelegram;

  if (!response.ok || !resultado.ok) {
    throw new Error(`Telegram falló: ${resultado.description ?? response.statusText}`);
  }

  const chats = new Map<number, string>();

  for (const actualizacion of resultado.result ?? []) {
    const chat = actualizacion.message?.chat;

    if (chat) {
      chats.set(chat.id, chat.type);
    }
  }

  if (chats.size === 0) {
    throw new Error("No hay mensajes nuevos. Envía un mensaje al bot y vuelve a ejecutar este workflow.");
  }

  console.log("IDs de chat encontrados (usa el de tu chat privado con el bot):");
  for (const [chatId, tipo] of chats) {
    console.log(`${chatId} (${tipo})`);
  }
}

if (process.argv[1]?.endsWith("obtener-chat-id.ts") ?? false) {
  obtenerChatId().catch((error: unknown) => {
    const mensaje = error instanceof Error ? error.message : "Error desconocido.";
    console.error("No se pudo obtener el chat ID:", mensaje);
    process.exitCode = 1;
  });
}
