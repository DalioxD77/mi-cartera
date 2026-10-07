import { randomUUID } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

import { evaluarCondicion } from "@/domain/reglasAlertas";
import type { Activo, Alerta, EstadoAlerta, EventoAlerta } from "@/domain/tipos";
import type {
  ActivosRepository,
  AlertasRepository,
  EstadoAlertaRepository,
  EventosAlertaRepository,
} from "@/repositories/inversionesRepository";
import { config } from "@/lib/config";
import {
  SupabaseActivosRepository,
  SupabaseAlertasRepository,
  SupabaseEstadoAlertaRepository,
  SupabaseEventosAlertaRepository,
} from "@/repositories/supabaseAlertasRepository";
import {
  NotificadorTelegram,
} from "@/services/notificaciones/notificadorTelegram";
import type { ProveedorPrecios } from "@/services/precios/ProveedorPrecios";
import { servicioPrecios } from "@/services/precios/servicioPrecios";
import type { Notificador } from "@/services/notificaciones/Notificador";

export interface RevisarAlertasDeps {
  activos: ActivosRepository;
  alertas: AlertasRepository;
  eventos: EventosAlertaRepository;
  estado: EstadoAlertaRepository;
  proveedorPrecios: ProveedorPrecios;
  notificador: Notificador;
  estadoInicial?: EstadoAlerta[];
  persistirEstado?: boolean;
}

// El archivo JSON conserva estado en modo local; el workflow usa estado compartido en Supabase.
function asegurarArchivoEstado(): string {
  const dir = path.dirname(config.alertStateFilePath);

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  if (!existsSync(config.alertStateFilePath)) {
    writeFileSync(config.alertStateFilePath, "[]", "utf8");
  }

  return config.alertStateFilePath;
}

function leerEstadoPersistente(): EstadoAlerta[] {
  try {
    const archivo = asegurarArchivoEstado();
    const contenido = readFileSync(archivo, "utf8");
    const parsed = JSON.parse(contenido) as EstadoAlerta[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function guardarEstadoPersistente(estados: EstadoAlerta[]): void {
  const archivo = asegurarArchivoEstado();
  writeFileSync(archivo, JSON.stringify(estados, null, 2), "utf8");
}

function construirMensaje(alerta: Alerta, activo: Activo, precio: number, condicionCumplida: boolean): string {
  const estado = condicionCumplida ? "objetivo alcanzado" : "objetivo aún no alcanzado";
  return `Actualización de ${activo.nombre} (${activo.simbolo}). Precio actual: ${precio}. Objetivo ${alerta.condicion} ${alerta.precioObjetivo}: ${estado}.`;
}

export async function revisarAlertas(deps: RevisarAlertasDeps): Promise<{ alertasRevisadas: number; notificacionesEnviadas: number }> {
  const alertasActivas = await deps.alertas.obtenerAlertasActivas();
  const activos = await deps.activos.obtenerActivos();
  const estadoPersistente = deps.estadoInicial ?? leerEstadoPersistente();
  let notificacionesEnviadas = 0;

  for (const alerta of alertasActivas) {
    const activo = activos.find((item) => item.id === alerta.activoId);

    if (!activo) {
      continue;
    }

    const precioActual = await deps.proveedorPrecios.obtenerPrecio(activo.simbolo, activo.tipo);
    const condicionActual = evaluarCondicion(alerta, precioActual);

    const mensaje = construirMensaje(alerta, activo, precioActual, condicionActual);
    await deps.notificador.enviar(mensaje);

    const evento: EventoAlerta = {
      id: randomUUID(),
      alertaId: alerta.id,
      fecha: new Date().toISOString(),
      precioAlDisparar: precioActual,
      mensaje,
    };

    await deps.eventos.guardarEvento(evento);
    notificacionesEnviadas += 1;

    const siguienteEstado: EstadoAlerta = {
      alertaId: alerta.id,
      ultimoPrecio: precioActual,
      condicionCumplida: condicionActual,
    };

    await deps.estado.guardarEstado(siguienteEstado);

    const sinDuplicados = estadoPersistente.filter((item) => item.alertaId !== alerta.id);
    sinDuplicados.push(siguienteEstado);
    if (deps.persistirEstado !== false) {
      guardarEstadoPersistente(sinDuplicados);
    }
  }

  return {
    alertasRevisadas: alertasActivas.length,
    notificacionesEnviadas,
  };
}

if (process.argv[1]?.endsWith("revisar-alertas.ts") ?? false) {
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey || !config.supabaseOwnerId) {
    throw new Error("Faltan SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY o SUPABASE_OWNER_ID en el entorno.");
  }

  const supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const deps: RevisarAlertasDeps = {
    activos: new SupabaseActivosRepository(supabase, config.supabaseOwnerId),
    alertas: new SupabaseAlertasRepository(supabase, config.supabaseOwnerId),
    eventos: new SupabaseEventosAlertaRepository(supabase, config.supabaseOwnerId),
    estado: new SupabaseEstadoAlertaRepository(supabase, config.supabaseOwnerId),
    proveedorPrecios: servicioPrecios,
    notificador: new NotificadorTelegram(),
    estadoInicial: [],
    persistirEstado: false,
  };

  revisarAlertas(deps)
    .then((resultado) => {
      console.log(`Alertas revisadas: ${resultado.alertasRevisadas}; notificaciones enviadas: ${resultado.notificacionesEnviadas}`);
    })
    .catch((error: Error) => {
      console.error("Error al revisar alertas:", error.message);
      process.exitCode = 1;
    });
}
