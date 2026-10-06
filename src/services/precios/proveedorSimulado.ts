import type { ProveedorPrecios } from "@/services/precios/ProveedorPrecios";

const PRECIOS_DEMO: Record<string, number> = {
  BTC: 62000,
  ETH: 3200,
  SOL: 148,
  NVDA: 210,
  AAPL: 220,
  MSFT: 430,
};

export class ProveedorSimulado implements ProveedorPrecios {
  async obtenerPrecio(simbolo: string): Promise<number> {
    const clave = simbolo.toUpperCase();
    const base = PRECIOS_DEMO[clave] ?? 100;
    const variacion = (Math.sin(Date.now() / 3_000 + clave.length) + 1) * 0.03;
    return Number((base * (1 + variacion)).toFixed(2));
  }
}
