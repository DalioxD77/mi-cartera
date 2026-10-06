import type { Alerta } from "@/domain/tipos";

// Evalúa la condición del precio contra el umbral de la alerta.
export function evaluarCondicion(alerta: Alerta, precio: number): boolean {
  const precioNormalizado = Number.isFinite(precio) ? precio : Number.NaN;

  if (Number.isNaN(precioNormalizado)) {
    return false;
  }

  if (alerta.condicion === "menor_igual") {
    return precioNormalizado <= alerta.precioObjetivo;
  }

  return precioNormalizado >= alerta.precioObjetivo;
}

// Detecta el cruce de una condición de false a true; no dispara si no hubo precio anterior.
export function detectarCruce(
  alerta: Alerta,
  precioAnterior: number | undefined,
  precioActual: number,
): boolean {
  if (!alerta.activa) {
    return false;
  }

  if (precioAnterior === undefined || !Number.isFinite(precioAnterior)) {
    // Sin precio previo, solo evaluamos la condición actual. No se dispara para evitar duplicados en la primera lectura.
    return false;
  }

  const condicionAnterior = evaluarCondicion(alerta, precioAnterior);
  const condicionActual = evaluarCondicion(alerta, precioActual);

  return condicionActual && !condicionAnterior;
}
