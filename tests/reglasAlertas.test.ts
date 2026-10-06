import { describe, expect, it } from "vitest";

import { detectarCruce, evaluarCondicion } from "@/domain/reglasAlertas";
import type { Alerta } from "@/domain/tipos";

describe("dominio: reglas de alertas", () => {
  it("evalúa la condición de precio según el tipo de alerta", () => {
    const alertaMenor: Alerta = {
      id: "a1",
      activoId: "nvda",
      condicion: "menor_igual",
      precioObjetivo: 210,
      activa: true,
    };

    expect(evaluarCondicion(alertaMenor, 211)).toBe(false);
    expect(evaluarCondicion(alertaMenor, 210)).toBe(true);
    expect(evaluarCondicion(alertaMenor, 209)).toBe(true);

    const alertaMayor: Alerta = {
      id: "a2",
      activoId: "btc",
      condicion: "mayor_igual",
      precioObjetivo: 60000,
      activa: true,
    };

    expect(evaluarCondicion(alertaMayor, 59999)).toBe(false);
    expect(evaluarCondicion(alertaMayor, 60000)).toBe(true);
  });

  it("detecta un único cruce en la secuencia 211 → 210 → 209 → 208", () => {
    const alerta: Alerta = {
      id: "a3",
      activoId: "nvda",
      condicion: "menor_igual",
      precioObjetivo: 210,
      activa: true,
    };

    const disparos: boolean[] = [
      detectarCruce(alerta, undefined, 211),
      detectarCruce(alerta, 211, 210),
      detectarCruce(alerta, 210, 209),
      detectarCruce(alerta, 209, 208),
    ];

    expect(disparos.filter(Boolean)).toHaveLength(1);
    expect(disparos[1]).toBe(true);
  });
});
