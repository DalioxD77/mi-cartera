import { afterEach, describe, expect, it, vi } from "vitest";

import { config } from "@/lib/config";
import { NotificadorTelegram } from "@/services/notificaciones/notificadorTelegram";

describe("notificador: Telegram", () => {
  const tokenOriginal = config.telegramBotToken;
  const chatIdOriginal = config.telegramChatId;

  afterEach(() => {
    config.telegramBotToken = tokenOriginal;
    config.telegramChatId = chatIdOriginal;
    vi.unstubAllGlobals();
  });

  it("envía el mensaje al chat configurado", async () => {
    config.telegramBotToken = "token-prueba";
    config.telegramChatId = "12345";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await new NotificadorTelegram().enviar("Alerta de prueba");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.telegram.org/bottoken-prueba/sendMessage",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          chat_id: "12345",
          text: "Alerta de prueba",
          disable_web_page_preview: true,
        }),
      }),
    );
  });

  it("falla con un error explícito si Telegram rechaza el envío", async () => {
    config.telegramBotToken = "token-prueba";
    config.telegramChatId = "12345";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      statusText: "OK",
      json: async () => ({ ok: false, description: "Chat not found" }),
    }));

    await expect(new NotificadorTelegram().enviar("Alerta de prueba"))
      .rejects.toThrow("Telegram falló: Chat not found");
  });
});
