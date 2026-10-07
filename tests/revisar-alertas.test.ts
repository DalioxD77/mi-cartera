import { describe, expect, it } from "vitest";

import { revisarAlertas } from "../jobs/revisar-alertas";
import type { Activo, Alerta } from "@/domain/tipos";
import { ActivosMemoryRepository, AlertasMemoryRepository, EstadoAlertaMemoryRepository, EventosAlertaMemoryRepository } from "@/repositories/memoriaRepository";
import type { ProveedorPrecios } from "@/services/precios/ProveedorPrecios";

class ProveedorFalso implements ProveedorPrecios {
  constructor(private readonly precio = 210) {}

  async obtenerPrecio(): Promise<number> {
    return this.precio;
  }
}

describe("job: revisión de alertas", () => {
  it("envía una actualización aunque el precio todavía no alcance el objetivo", async () => {
    const activosRepo = new ActivosMemoryRepository();
    const alertasRepo = new AlertasMemoryRepository();
    const eventosRepo = new EventosAlertaMemoryRepository();
    const estadoRepo = new EstadoAlertaMemoryRepository();
    const mensajes: string[] = [];

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
      proveedorPrecios: new ProveedorFalso(211),
      notificador: {
        async enviar(mensaje: string): Promise<void> {
          mensajes.push(mensaje);
        },
      },
      estadoInicial: [],
      persistirEstado: false,
    });

    expect(resultado.alertasRevisadas).toBe(1);
    expect(resultado.notificacionesEnviadas).toBe(1);

    const eventos = await eventosRepo.obtenerEventos();
    expect(eventos).toHaveLength(1);
    expect(mensajes).toHaveLength(1);
    expect(mensajes[0]).toBe(
      "Actualización de NVIDIA (NVDA). Precio actual: 211. Objetivo menor_igual 210: objetivo aún no alcanzado.",
    );

    const estado = await estadoRepo.obtenerEstado(alerta.id);
    expect(estado?.ultimoPrecio).toBe(211);
    expect(estado?.condicionCumplida).toBe(false);
  });

  it("envía una nueva actualización en cada revisión, aunque el precio siga sobre el objetivo", async () => {
    const activosRepo = new ActivosMemoryRepository();
    const alertasRepo = new AlertasMemoryRepository();
    const eventosRepo = new EventosAlertaMemoryRepository();
    const estadoRepo = new EstadoAlertaMemoryRepository();
    const mensajes: string[] = [];

    const activo: Activo = {
      id: "nvda",
      nombre: "NVIDIA",
      simbolo: "NVDA",
      tipo: "accion",
    };

    const alerta: Alerta = {
      id: "alerta-cruce",
      activoId: "nvda",
      condicion: "menor_igual",
      precioObjetivo: 210,
      activa: true,
    };

    await activosRepo.guardarActivo(activo);
    await alertasRepo.guardarAlerta(alerta);
    const deps = {
      activos: activosRepo,
      alertas: alertasRepo,
      eventos: eventosRepo,
      estado: estadoRepo,
      proveedorPrecios: new ProveedorFalso(211),
      notificador: {
        async enviar(mensaje: string): Promise<void> {
          mensajes.push(mensaje);
        },
      },
      estadoInicial: [],
      persistirEstado: false,
    };

    const primeraRevision = await revisarAlertas(deps);
    const segundaRevision = await revisarAlertas(deps);

    expect(primeraRevision.notificacionesEnviadas).toBe(1);
    expect(segundaRevision.notificacionesEnviadas).toBe(1);
    expect(mensajes).toHaveLength(2);
    expect(mensajes[0]).toBe(
      "Actualización de NVIDIA (NVDA). Precio actual: 211. Objetivo menor_igual 210: objetivo aún no alcanzado.",
    );
    expect(await eventosRepo.obtenerEventos()).toHaveLength(2);
  });
});
