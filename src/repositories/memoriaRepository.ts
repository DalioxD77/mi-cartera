import type {
  Activo,
  Alerta,
  Compra,
  EstadoAlerta,
  EventoAlerta,
} from "@/domain/tipos";
import type {
  ActivosRepository,
  AlertasRepository,
  EstadoAlertaRepository,
  EventosAlertaRepository,
  InversionesRepository,
} from "@/repositories/inversionesRepository";

export class InversionesMemoryRepository implements InversionesRepository {
  private compras: Compra[] = [];

  async obtenerCompras(): Promise<Compra[]> {
    return [...this.compras];
  }

  async guardarCompra(compra: Compra): Promise<void> {
    const index = this.compras.findIndex((item) => item.id === compra.id);

    if (index >= 0) {
      this.compras[index] = compra;
      return;
    }

    this.compras.push(compra);
  }

  async eliminarCompra(id: string): Promise<void> {
    this.compras = this.compras.filter((compra) => compra.id !== id);
  }
}

export class ActivosMemoryRepository implements ActivosRepository {
  private activos: Activo[] = [];

  async obtenerActivos(): Promise<Activo[]> {
    return [...this.activos];
  }

  async obtenerActivo(id: string): Promise<Activo | undefined> {
    return this.activos.find((activo) => activo.id === id);
  }

  async guardarActivo(activo: Activo): Promise<void> {
    const index = this.activos.findIndex((item) => item.id === activo.id);

    if (index >= 0) {
      this.activos[index] = activo;
      return;
    }

    this.activos.push(activo);
  }

  async eliminarActivo(id: string): Promise<void> {
    this.activos = this.activos.filter((activo) => activo.id !== id);
  }
}

export class AlertasMemoryRepository implements AlertasRepository {
  private alertas: Alerta[] = [];

  async obtenerAlertas(): Promise<Alerta[]> {
    return [...this.alertas];
  }

  async obtenerAlertasActivas(): Promise<Alerta[]> {
    return this.alertas.filter((alerta) => alerta.activa);
  }

  async guardarAlerta(alerta: Alerta): Promise<void> {
    const index = this.alertas.findIndex((item) => item.id === alerta.id);

    if (index >= 0) {
      this.alertas[index] = alerta;
      return;
    }

    this.alertas.push(alerta);
  }

  async eliminarAlerta(id: string): Promise<void> {
    this.alertas = this.alertas.filter((alerta) => alerta.id !== id);
  }
}

export class EventosAlertaMemoryRepository implements EventosAlertaRepository {
  private eventos: EventoAlerta[] = [];

  async obtenerEventos(): Promise<EventoAlerta[]> {
    return [...this.eventos];
  }

  async guardarEvento(evento: EventoAlerta): Promise<void> {
    this.eventos.push(evento);
  }
}

export class EstadoAlertaMemoryRepository implements EstadoAlertaRepository {
  private estados = new Map<string, EstadoAlerta>();

  async obtenerEstado(alertaId: string): Promise<EstadoAlerta | undefined> {
    return this.estados.get(alertaId);
  }

  async guardarEstado(estado: EstadoAlerta): Promise<void> {
    this.estados.set(estado.alertaId, estado);
  }
}
