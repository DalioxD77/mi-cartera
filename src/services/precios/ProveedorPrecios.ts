export type TipoActivoPrecio = "accion" | "crypto";

export interface ProveedorPrecios {
  obtenerPrecio(simbolo: string, tipo?: TipoActivoPrecio): Promise<number>;
}
