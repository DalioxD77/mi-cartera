export type TipoActivo = "accion" | "crypto";
export type CondicionAlerta = "menor_igual" | "mayor_igual";

export interface Activo {
  id: string;
  nombre: string;
  simbolo: string;
  tipo: TipoActivo;
}

export interface Compra {
  id: string;
  activoId: string;
  monto: number;
  precioCompra: number;
  cantidad: number;
  comision: number;
  moneda: string;
  fecha: string;
}

export interface Alerta {
  id: string;
  activoId: string;
  condicion: CondicionAlerta;
  precioObjetivo: number;
  activa: boolean;
}

export interface EventoAlerta {
  id: string;
  alertaId: string;
  fecha: string;
  precioAlDisparar: number;
  mensaje: string;
}

export interface EstadoAlerta {
  alertaId: string;
  ultimoPrecio: number;
  condicionCumplida: boolean;
}

export interface ResumenActivo {
  activoId: string;
  unidades: number;
  invertido: number;
  valorActual: number;
  ganancia: number;
  rentabilidad: number;
  precioPromedio: number;
  puntoEquilibrio: number;
}

export interface ResumenCartera {
  invertidoTotal: number;
  valorActualTotal: number;
  gananciaTotal: number;
  rentabilidadTotal: number;
  activos: ResumenActivo[];
}
