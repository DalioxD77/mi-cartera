import { describe, expect, it } from "vitest";

import {
  calcularGanancia,
  calcularPuntoEquilibrio,
  calcularPrecioPromedio,
  calcularRentabilidad,
  calcularUnidades,
  calcularValorActual,
} from "@/domain/calculos";
import type { Compra } from "@/domain/tipos";

describe("dominio: cálculos", () => {
  it("calcula unidades y valor actual con un ejemplo sencillo", () => {
    const unidades = calcularUnidades(100, 200);
    expect(unidades).toBeCloseTo(0.5, 5);

    const valorActual = calcularValorActual(unidades, 220);
    expect(valorActual).toBeCloseTo(110, 5);
    expect(calcularGanancia(valorActual, 100)).toBeCloseTo(10, 5);
    expect(calcularRentabilidad(valorActual, 100)).toBeCloseTo(10, 5);
  });

  it("maneja casos límite y vacíos sin romper", () => {
    expect(calcularUnidades(0, 200)).toBe(0);
    expect(calcularUnidades(100, 0)).toBe(0);
    expect(calcularValorActual(0, 220)).toBe(0);
    expect(calcularRentabilidad(0, 0)).toBe(0);
    expect(calcularPrecioPromedio([])).toBe(0);
    expect(calcularPuntoEquilibrio([])).toBe(0);
  });

  it("calcula precio promedio y punto de equilibrio con comisiones", () => {
    const compras: Compra[] = [
      {
        id: "c1",
        activoId: "nvda",
        monto: 100,
        precioCompra: 200,
        cantidad: 0.5,
        comision: 5,
        moneda: "USD",
        fecha: "2025-01-01",
      },
      {
        id: "c2",
        activoId: "nvda",
        monto: 80,
        precioCompra: 160,
        cantidad: 0.5,
        comision: 2,
        moneda: "USD",
        fecha: "2025-01-02",
      },
    ];

    expect(calcularPrecioPromedio(compras)).toBeCloseTo(187, 0);
    expect(calcularPuntoEquilibrio(compras)).toBeCloseTo(187, 0);
  });
});
