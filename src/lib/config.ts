import path from "path";

function leerNumero(valor: string | undefined, valorPorDefecto: number): number {
  const parseado = Number(valor ?? String(valorPorDefecto));
  return Number.isFinite(parseado) ? parseado : valorPorDefecto;
}

export const config = {
  cacheTtlMs: leerNumero(process.env.PRECIOS_CACHE_TTL_MS, 60_000),
  maxSymbols: leerNumero(process.env.MAX_SIMBOLOS, 10),
  rateLimitWindowMs: leerNumero(process.env.RATE_LIMIT_WINDOW_MS, 60_000),
  rateLimitMaxRequests: leerNumero(process.env.RATE_LIMIT_MAX_REQUESTS, 30),
  priceApiKey: process.env.PRICE_API_KEY ?? "",
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ?? "",
  telegramChatId: process.env.TELEGRAM_CHAT_ID ?? "",
  alertStateFilePath: path.join(process.cwd(), "data", "estado-alertas.json"),
};
