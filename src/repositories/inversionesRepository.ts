import type { Activo, Alerta, Compra, EstadoAlerta, EventoAlerta } from "@/domain/tipos";

export interface InversionesRepository {
  obtenerCompras(): Promise<Compra[]>;
  guardarCompra(compra: Compra): Promise<void>;
  eliminarCompra(id: string): Promise<void>;
}

export interface ActivosRepository {
  obtenerActivos(): Promise<Activo[]>;
  obtenerActivo(id: string): Promise<Activo | undefined>;
  guardarActivo(activo: Activo): Promise<void>;
  eliminarActivo(id: string): Promise<void>;
}

export interface AlertasRepository {
  obtenerAlertas(): Promise<Alerta[]>;
  obtenerAlertasActivas(): Promise<Alerta[]>;
  guardarAlerta(alerta: Alerta): Promise<void>;
  eliminarAlerta(id: string): Promise<void>;
}

export interface EventosAlertaRepository {
  obtenerEventos(): Promise<EventoAlerta[]>;
  guardarEvento(evento: EventoAlerta): Promise<void>;
}

export interface EstadoAlertaRepository {
  obtenerEstado(alertaId: string): Promise<EstadoAlerta | undefined>;
  guardarEstado(estado: EstadoAlerta): Promise<void>;
}
