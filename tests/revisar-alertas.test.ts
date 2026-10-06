import { describe, expect, it } from "vitest";

import { revisarAlertas } from "../jobs/revisar-alertas";
import type { Activo, Alerta } from "@/domain/tipos";
import { ActivosMemoryRepository, AlertasMemoryRepository, EstadoAlertaMemoryRepository, EventosAlertaMemoryRepository } from "@/repositories/memoriaRepository";
import type { ProveedorPrecios } from "@/services/precios/ProveedorPrecios";
import type { Notificador } from "@/services/notificaciones/Notificador";

class ProveedorFalso implements ProveedorPrecios {
  async obtenerPrecio(): Promise<number> {
    return 210;
  }
}

class NotificadorFalso implements Notificador {
  async enviar(): Promise<void> {
    return;
  }
}

describe("job: revisión de alertas", () => {
  it("dispara solo cuando se cruza el objetivo y guarda el evento", async () => {
    const activosRepo = new ActivosMemoryRepository();
    const alertasRepo = new AlertasMemoryRepository();
    const eventosRepo = new EventosAlertaMemoryRepository();
    const estadoRepo = new EstadoAlertaMemoryRepository();

    const activo: Activo = {
      id: "nvda",
      nombre: "NVIDIA",
      simbolo: "NVDA",
      tipo: "accion",
    };

    const alerta: Alerta = {
      id: "alerta-1",
      activoId: "nvda",
      condicion: "menor_igual",
      precioObjetivo: 210,
      activa: true,
    };

    await activosRepo.guardarActivo(activo);
    await alertasRepo.guardarAlerta(alerta);

    const resultado = await revisarAlertas({
      activos: activosRepo,
      alertas: alertasRepo,
      eventos: eventosRepo,
      estado: estadoRepo,
      proveedorPrecios: new ProveedorFalso(),
      notificador: new NotificadorFalso(),
    });

    expect(resultado.alertasRevisadas).toBe(1);
    expect(resultado.disparadas).toBe(0);

    const eventos = await eventosRepo.obtenerEventos();
    expect(eventos).toHaveLength(0);

    const estado = await estadoRepo.obtenerEstado(alerta.id);
    expect(estado?.ultimoPrecio).toBe(210);
    expect(estado?.condicionCumplida).toBe(true);
  });
});
