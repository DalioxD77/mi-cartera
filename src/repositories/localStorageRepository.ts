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

function leerStorage<T>(clave: string, valorPorDefecto: T[]): T[] {
  if (typeof window === "undefined") {
    return valorPorDefecto;
  }

  const raw = window.localStorage.getItem(clave);

  if (!raw) {
    return valorPorDefecto;
  }

  try {
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : valorPorDefecto;
  } catch {
    return valorPorDefecto;
  }
}

function guardarStorage<T>(clave: string, valor: T[]): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(clave, JSON.stringify(valor));
}

export class InversionesLocalStorageRepository implements InversionesRepository {
  private clave = "mi-cartera:compras";

  async obtenerCompras(): Promise<Compra[]> {
    return leerStorage<Compra>(this.clave, []);
  }

  async guardarCompra(compra: Compra): Promise<void> {
    const compras = await this.obtenerCompras();
    const index = compras.findIndex((item) => item.id === compra.id);

    if (index >= 0) {
      compras[index] = compra;
    } else {
      compras.push(compra);
    }

    guardarStorage(this.clave, compras);
  }

  async eliminarCompra(id: string): Promise<void> {
    const compras = (await this.obtenerCompras()).filter((compra) => compra.id !== id);
    guardarStorage(this.clave, compras);
  }
}

export class ActivosLocalStorageRepository implements ActivosRepository {
  private clave = "mi-cartera:activos";

  async obtenerActivos(): Promise<Activo[]> {
    return leerStorage<Activo>(this.clave, []);
  }

  async obtenerActivo(id: string): Promise<Activo | undefined> {
    return (await this.obtenerActivos()).find((activo) => activo.id === id);
  }

  async guardarActivo(activo: Activo): Promise<void> {
    const activos = await this.obtenerActivos();
    const index = activos.findIndex((item) => item.id === activo.id);

    if (index >= 0) {
      activos[index] = activo;
    } else {
      activos.push(activo);
    }

    guardarStorage(this.clave, activos);
  }

  async eliminarActivo(id: string): Promise<void> {
    const activos = (await this.obtenerActivos()).filter((activo) => activo.id !== id);
    guardarStorage(this.clave, activos);
  }
}

export class AlertasLocalStorageRepository implements AlertasRepository {
  private clave = "mi-cartera:alertas";

  async obtenerAlertas(): Promise<Alerta[]> {
    return leerStorage<Alerta>(this.clave, []);
  }

  async obtenerAlertasActivas(): Promise<Alerta[]> {
    return (await this.obtenerAlertas()).filter((alerta) => alerta.activa);
  }

  async guardarAlerta(alerta: Alerta): Promise<void> {
    const alertas = await this.obtenerAlertas();
    const index = alertas.findIndex((item) => item.id === alerta.id);

    if (index >= 0) {
      alertas[index] = alerta;
    } else {
      alertas.push(alerta);
    }

    guardarStorage(this.clave, alertas);
  }

  async eliminarAlerta(id: string): Promise<void> {
    const alertas = (await this.obtenerAlertas()).filter((alerta) => alerta.id !== id);
    guardarStorage(this.clave, alertas);
  }
}

export class EventosAlertaLocalStorageRepository implements EventosAlertaRepository {
  private clave = "mi-cartera:eventos-alerta";

  async obtenerEventos(): Promise<EventoAlerta[]> {
    return leerStorage<EventoAlerta>(this.clave, []);
  }

  async guardarEvento(evento: EventoAlerta): Promise<void> {
    const eventos = await this.obtenerEventos();
    eventos.push(evento);
    guardarStorage(this.clave, eventos);
  }
}

export class EstadoAlertaLocalStorageRepository implements EstadoAlertaRepository {
  private clave = "mi-cartera:estado-alertas";

  async obtenerEstado(alertaId: string): Promise<EstadoAlerta | undefined> {
    const estados = leerStorage<EstadoAlerta>(this.clave, []);
    return estados.find((estado) => estado.alertaId === alertaId);
  }

  async guardarEstado(estado: EstadoAlerta): Promise<void> {
    const estados = leerStorage<EstadoAlerta>(this.clave, []);
    const index = estados.findIndex((item) => item.alertaId === estado.alertaId);

    if (index >= 0) {
      estados[index] = estado;
    } else {
      estados.push(estado);
    }

    guardarStorage(this.clave, estados);
  }
}
