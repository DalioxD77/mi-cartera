import type { SupabaseClient } from "@supabase/supabase-js";

import type { Activo, Alerta, EstadoAlerta, EventoAlerta } from "@/domain/tipos";
import type {
  ActivosRepository,
  AlertasRepository,
  EstadoAlertaRepository,
  EventosAlertaRepository,
} from "@/repositories/inversionesRepository";

export class SupabaseActivosRepository implements ActivosRepository {
  constructor(
    private readonly client: SupabaseClient,
    private readonly ownerId: string,
  ) {}

  async obtenerActivos(): Promise<Activo[]> {
    const { data, error } = await this.client
      .from("assets")
      .select("id, name, symbol, type")
      .eq("user_id", this.ownerId);

    if (error) {
      throw new Error(`No se pudieron leer los activos en Supabase: ${error.message}`);
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      nombre: row.name,
      simbolo: row.symbol,
      tipo: row.type,
    }));
  }

  async obtenerActivo(id: string): Promise<Activo | undefined> {
    return (await this.obtenerActivos()).find((activo) => activo.id === id);
  }

  async guardarActivo(activo: Activo): Promise<void> {
    const { error } = await this.client.from("assets").upsert({
      id: activo.id,
      user_id: this.ownerId,
      name: activo.nombre,
      symbol: activo.simbolo,
      type: activo.tipo,
    });

    if (error) {
      throw new Error(`No se pudo guardar el activo en Supabase: ${error.message}`);
    }
  }

  async eliminarActivo(id: string): Promise<void> {
    const { error } = await this.client
      .from("assets")
      .delete()
      .eq("id", id)
      .eq("user_id", this.ownerId);

    if (error) {
      throw new Error(`No se pudo eliminar el activo en Supabase: ${error.message}`);
    }
  }
}

export class SupabaseAlertasRepository implements AlertasRepository {
  constructor(
    private readonly client: SupabaseClient,
    private readonly ownerId: string,
  ) {}

  async obtenerAlertas(): Promise<Alerta[]> {
    const { data, error } = await this.client
      .from("alerts")
      .select("id, asset_id, condition, target_price, is_active")
      .eq("user_id", this.ownerId);

    if (error) {
      throw new Error(`No se pudieron leer las alertas en Supabase: ${error.message}`);
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      activoId: row.asset_id,
      condicion: row.condition,
      precioObjetivo: Number(row.target_price),
      activa: row.is_active,
    }));
  }

  async obtenerAlertasActivas(): Promise<Alerta[]> {
    const { data, error } = await this.client
      .from("alerts")
      .select("id, asset_id, condition, target_price, is_active")
      .eq("user_id", this.ownerId)
      .eq("is_active", true);

    if (error) {
      throw new Error(`No se pudieron leer las alertas activas en Supabase: ${error.message}`);
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      activoId: row.asset_id,
      condicion: row.condition,
      precioObjetivo: Number(row.target_price),
      activa: row.is_active,
    }));
  }

  async guardarAlerta(alerta: Alerta): Promise<void> {
    const { error } = await this.client.from("alerts").upsert({
      id: alerta.id,
      user_id: this.ownerId,
      asset_id: alerta.activoId,
      condition: alerta.condicion,
      target_price: alerta.precioObjetivo,
      is_active: alerta.activa,
    });

    if (error) {
      throw new Error(`No se pudo guardar la alerta en Supabase: ${error.message}`);
    }
  }

  async eliminarAlerta(id: string): Promise<void> {
    const { error } = await this.client
      .from("alerts")
      .delete()
      .eq("id", id)
      .eq("user_id", this.ownerId);

    if (error) {
      throw new Error(`No se pudo eliminar la alerta en Supabase: ${error.message}`);
    }
  }
}

export class SupabaseEstadoAlertaRepository implements EstadoAlertaRepository {
  constructor(
    private readonly client: SupabaseClient,
    private readonly ownerId: string,
  ) {}

  async obtenerEstado(alertaId: string): Promise<EstadoAlerta | undefined> {
    const { data, error } = await this.client
      .from("alert_states")
      .select("alert_id, last_price, condition_met")
      .eq("alert_id", alertaId)
      .eq("user_id", this.ownerId)
      .maybeSingle();

    if (error) {
      throw new Error(`No se pudo leer el estado de la alerta en Supabase: ${error.message}`);
    }

    if (!data) {
      return undefined;
    }

    return {
      alertaId: data.alert_id,
      ultimoPrecio: Number(data.last_price),
      condicionCumplida: data.condition_met,
    };
  }

  async guardarEstado(estado: EstadoAlerta): Promise<void> {
    const { error } = await this.client.from("alert_states").upsert({
      alert_id: estado.alertaId,
      user_id: this.ownerId,
      last_price: estado.ultimoPrecio,
      condition_met: estado.condicionCumplida,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      throw new Error(`No se pudo guardar el estado de la alerta en Supabase: ${error.message}`);
    }
  }
}

export class SupabaseEventosAlertaRepository implements EventosAlertaRepository {
  constructor(
    private readonly client: SupabaseClient,
    private readonly ownerId: string,
  ) {}

  async obtenerEventos(): Promise<EventoAlerta[]> {
    const { data, error } = await this.client
      .from("alert_events")
      .select("id, alert_id, fired_at, price_at_trigger, message")
      .eq("user_id", this.ownerId)
      .order("fired_at", { ascending: false });

    if (error) {
      throw new Error(`No se pudieron leer los eventos en Supabase: ${error.message}`);
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      alertaId: row.alert_id,
      fecha: row.fired_at,
      precioAlDisparar: Number(row.price_at_trigger),
      mensaje: row.message,
    }));
  }

  async guardarEvento(evento: EventoAlerta): Promise<void> {
    const { error } = await this.client.from("alert_events").insert({
      id: evento.id,
      user_id: this.ownerId,
      alert_id: evento.alertaId,
      fired_at: evento.fecha,
      price_at_trigger: evento.precioAlDisparar,
      message: evento.mensaje,
    });

    if (error) {
      throw new Error(`No se pudo guardar el evento de alerta en Supabase: ${error.message}`);
    }
  }
}
