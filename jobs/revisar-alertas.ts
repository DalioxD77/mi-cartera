import { randomUUID } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

import { evaluarCondicion } from "@/domain/reglasAlertas";
import type { Activo, Alerta, EstadoAlerta, EventoAlerta } from "@/domain/tipos";
import type {
  ActivosRepository,
  AlertasRepository,
  EstadoAlertaRepository,
  EventosAlertaRepository,
} from "@/repositories/inversionesRepository";
import { config } from "@/lib/config";
import type { ProveedorPrecios } from "@/services/precios/ProveedorPrecios";
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

// El archivo JSON actúa como estado temporal; luego se migrará a Supabase o una BD real.
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

function construirMensaje(alerta: Alerta, activo: Activo, precio: number): string {
  return `${activo.nombre} (${activo.simbolo}) activó la alerta ${alerta.condicion} ${alerta.precioObjetivo}. Precio actual: ${precio}.`;
}

export async function revisarAlertas(deps: RevisarAlertasDeps): Promise<{ alertasRevisadas: number; disparadas: number }> {
  const alertasActivas = await deps.alertas.obtenerAlertasActivas();
  const activos = await deps.activos.obtenerActivos();
  const estadoPersistente = deps.estadoInicial ?? leerEstadoPersistente();
  let disparadas = 0;

  for (const alerta of alertasActivas) {
    const activo = activos.find((item) => item.id === alerta.activoId);

    if (!activo) {
      continue;
    }

    const precioActual = await deps.proveedorPrecios.obtenerPrecio(activo.simbolo, activo.tipo);
    const estadoPrevio = estadoPersistente.find((item) => item.alertaId === alerta.id);
    const precioAnterior = estadoPrevio?.ultimoPrecio;
    const condicionAnterior = precioAnterior !== undefined ? evaluarCondicion(alerta, precioAnterior) : false;
    const condicionActual = evaluarCondicion(alerta, precioActual);
    const cruceDetectado = condicionActual && !condicionAnterior && precioAnterior !== undefined;

    if (cruceDetectado) {
      const mensaje = construirMensaje(alerta, activo, precioActual);
      await deps.notificador.enviar(mensaje);

      const evento: EventoAlerta = {
        id: randomUUID(),
        alertaId: alerta.id,
        fecha: new Date().toISOString(),
        precioAlDisparar: precioActual,
        mensaje,
      };

      await deps.eventos.guardarEvento(evento);
      disparadas += 1;
    }

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
    disparadas,
  };
}

if (process.argv[1]?.endsWith("revisar-alertas.ts") ?? false) {
  const { servicioPrecios } = await import("@/services/precios/servicioPrecios");
  const { NotificadorTelegram } = await import("@/services/notificaciones/notificadorTelegram");
  const {
    ActivosMemoryRepository,
    AlertasMemoryRepository,
    EstadoAlertaMemoryRepository,
    EventosAlertaMemoryRepository,
  } = await import("@/repositories/memoriaRepository");

  const deps: RevisarAlertasDeps = {
    activos: new ActivosMemoryRepository(),
    alertas: new AlertasMemoryRepository(),
    eventos: new EventosAlertaMemoryRepository(),
    estado: new EstadoAlertaMemoryRepository(),
    proveedorPrecios: servicioPrecios,
    notificador: new NotificadorTelegram(),
  };

  revisarAlertas(deps)
    .then((resultado) => {
      console.log(`Alertas revisadas: ${resultado.alertasRevisadas}; disparadas: ${resultado.disparadas}`);
    })
    .catch((error: Error) => {
      console.error("Error al revisar alertas:", error.message);
      process.exitCode = 1;
    });
}
