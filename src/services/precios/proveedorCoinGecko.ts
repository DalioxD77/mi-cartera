import type { ProveedorPrecios } from "@/services/precios/ProveedorPrecios";

const MAPEO_SIMBOLOS: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  ADA: "cardano",
  DOGE: "dogecoin",
  XRP: "ripple",
  USDT: "tether",
  USDC: "usd-coin",
};

export class ProveedorCoinGecko implements ProveedorPrecios {
  async obtenerPrecio(simbolo: string): Promise<number> {
    const simboloNormalizado = simbolo.toUpperCase();
    const id = MAPEO_SIMBOLOS[simboloNormalizado] ?? simboloNormalizado.toLowerCase();

    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`,
      {
        headers: {
          accept: "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`No se pudo consultar CoinGecko para ${simbolo}.`);
    }

    const payload = (await response.json()) as Record<string, { usd?: number }>;
    const precio = payload[id]?.usd;

    if (typeof precio !== "number" || Number.isNaN(precio)) {
      throw new Error(`Precio no disponible para ${simbolo}.`);
    }

    return precio;
  }
}
