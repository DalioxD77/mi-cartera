import { afterEach, describe, expect, it, vi } from "vitest";

import { ProveedorAcciones } from "@/services/precios/proveedorAcciones";

describe("proveedor de precios de acciones", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("lee el precio de mercado sin requerir una clave que no usa", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        chart: {
          result: [{ meta: { regularMarketPrice: 239.24 } }],
        },
      }),
    }));

    await expect(new ProveedorAcciones().obtenerPrecio("NVDA")).resolves.toBe(239.24);
  });
});
