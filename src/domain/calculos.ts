import type { Compra, ResumenActivo, ResumenCartera } from "@/domain/tipos";

function normalizarNumero(valor: number | undefined | null): number {
  if (typeof valor !== "number" || Number.isNaN(valor) || !Number.isFinite(valor)) {
    return 0;
  }
  return valor;
}

// Fórmula: unidades = monto invertido dividido por el precio por unidad.
export function calcularUnidades(monto: number, precio: number): number {
  const montoNormalizado = normalizarNumero(monto);
  const precioNormalizado = normalizarNumero(precio);

  if (montoNormalizado <= 0 || precioNormalizado <= 0) {
    return 0;
  }

  return montoNormalizado / precioNormalizado;
}

// Fórmula: valor actual = unidades multiplicadas por el precio actual.
export function calcularValorActual(unidades: number, precioActual: number): number {
  const unidadesNormalizadas = normalizarNumero(unidades);
  const precioNormalizado = normalizarNumero(precioActual);

  return unidadesNormalizadas * precioNormalizado;
}

// Fórmula: ganancia = valor actual menos el capital invertido.
export function calcularGanancia(valorActual: number, invertido: number): number {
  return calcularValorActual(1, valorActual) - normalizarNumero(invertido);
}

// Fórmula: rentabilidad = ((valor actual - invertido) / invertido) * 100.
export function calcularRentabilidad(valorActual: number, invertido: number): number {
  const valorOperable = normalizarNumero(valorActual);
  const invertidoNormalizado = normalizarNumero(invertido);

  if (invertidoNormalizado === 0) {
    return 0;
  }

  return ((valorOperable - invertidoNormalizado) / invertidoNormalizado) * 100;
}

// Fórmula: precio promedio = costo total (monto + comisiones) / unidades totales.
export function calcularPrecioPromedio(compras: Compra[]): number {
  if (!Array.isArray(compras) || compras.length === 0) {
    return 0;
  }

  const unidadesTotales = compras.reduce((total, compra) => {
    const unidades = normalizarNumero(compra.cantidad);
    return total + unidades;
  }, 0);

  if (unidadesTotales === 0) {
    return 0;
  }

  const costoTotal = compras.reduce((total, compra) => {
    const monto = normalizarNumero(compra.monto);
    const comision = normalizarNumero(compra.comision);
    return total + monto + comision;
  }, 0);

  return costoTotal / unidadesTotales;
}

// Fórmula: punto de equilibrio = costo total incluyendo comisiones / unidades totales.
export function calcularPuntoEquilibrio(compras: Compra[]): number {
  return calcularPrecioPromedio(compras);
}

// Fórmula: resumen por activo = unidades totales, inversion total, valor actual y métricas derivadas.
export function calcularResumenActivo(compras: Compra[], precioActual: number): ResumenActivo {
  const comprasValidas = Array.isArray(compras) ? compras : [];
  const unidades = comprasValidas.reduce((total, compra) => total + normalizarNumero(compra.cantidad), 0);
  const invertido = comprasValidas.reduce(
    (total, compra) => total + normalizarNumero(compra.monto) + normalizarNumero(compra.comision),
    0,
  );
  const valorActual = calcularValorActual(unidades, precioActual);
  const precioPromedio = calcularPrecioPromedio(comprasValidas);
  const puntoEquilibrio = calcularPuntoEquilibrio(comprasValidas);

  return {
    activoId: comprasValidas[0]?.activoId ?? "",
    unidades,
    invertido,
    valorActual,
    ganancia: calcularGanancia(valorActual, invertido),
    rentabilidad: calcularRentabilidad(valorActual, invertido),
    precioPromedio,
    puntoEquilibrio,
  };
}

// Fórmula: resumen total = suma de los resúmenes por activo para obtener el panorama de la cartera.
export function calcularResumenCartera(
  compras: Compra[],
  precios: Record<string, number>,
): ResumenCartera {
  const comprasValidas = Array.isArray(compras) ? compras : [];
  const porActivo = new Map<string, Compra[]>();

  for (const compra of comprasValidas) {
    const lista = porActivo.get(compra.activoId) ?? [];
    lista.push(compra);
    porActivo.set(compra.activoId, lista);
  }

  const activos = Array.from(porActivo.entries()).map(([activoId, comprasDelActivo]) => {
    const precioActual = normalizarNumero(precios[activoId]);
    const resumen = calcularResumenActivo(comprasDelActivo, precioActual);
    return { ...resumen, activoId };
  });

  const invertidoTotal = activos.reduce((total, activo) => total + activo.invertido, 0);
  const valorActualTotal = activos.reduce((total, activo) => total + activo.valorActual, 0);
  const gananciaTotal = calcularGanancia(valorActualTotal, invertidoTotal);

  return {
    invertidoTotal,
    valorActualTotal,
    gananciaTotal,
    rentabilidadTotal: calcularRentabilidad(valorActualTotal, invertidoTotal),
    activos,
  };
}
