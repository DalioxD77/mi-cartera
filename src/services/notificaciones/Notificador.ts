export interface Notificador {
  enviar(mensaje: string): Promise<void>;
}
