import type { Notificador } from "@/services/notificaciones/Notificador";

export class NotificadorConsola implements Notificador {
  async enviar(mensaje: string): Promise<void> {
    console.log(`[Mi Cartera] ${mensaje}`);
  }
}
