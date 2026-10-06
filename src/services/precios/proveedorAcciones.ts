import type { ProveedorPrecios } from "@/services/precios/ProveedorPrecios";

export class ProveedorAcciones implements ProveedorPrecios {
  async obtenerPrecio(simbolo: string): Promise<number> {
    // TODO: migrar a una fuente de precios de acciones estable y documentada.
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${simbolo.toUpperCase()}?interval=1d&range=1mo`,
      {
        headers: {
          accept: "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`No se pudo consultar el precio para ${simbolo}.`);
    }

    const payload = (await response.json()) as {
      chart?: {
        result?: Array<{ meta?: { regularMarketPrice?: number } }>;
      };
    };
    const precio = payload.chart?.result?.[0]?.meta?.regularMarketPrice;

    if (typeof precio !== "number" || Number.isNaN(precio) || precio <= 0) {
      throw new Error(`No se obtuvo un precio válido para ${simbolo}.`);
    }

    return precio;
  }
}
