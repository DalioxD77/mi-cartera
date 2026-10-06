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
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  supabaseOwnerId: process.env.SUPABASE_OWNER_ID ?? "",
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ?? "",
  telegramChatId: process.env.TELEGRAM_CHAT_ID ?? "",
  alertStateFilePath: path.join(process.cwd(), "data", "estado-alertas.json"),
};
