export type Estrategia = "comprar_y_mantener" | "momentum" | "media_movil" | "personalizada";

export interface ResultadoBacktest {
  numeroOperaciones: number;
  gananciaPerdida: number;
  rentabilidad: number;
  drawdown: number;
  porcentajeOperacionesPositivas: number;
  comparacionComprarMantener: number;
}

export interface BacktestConfig {
  estrategia: Estrategia;
  inicio: string;
  fin: string;
  capitalInicial: number;
}
