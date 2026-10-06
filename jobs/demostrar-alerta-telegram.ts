import type { Activo, Alerta, EstadoAlerta } from "@/domain/tipos";
import { revisarAlertas } from "./revisar-alertas";
import {
  ActivosMemoryRepository,
  AlertasMemoryRepository,
  EstadoAlertaMemoryRepository,
  EventosAlertaMemoryRepository,
} from "@/repositories/memoriaRepository";
import { NotificadorTelegram } from "@/services/notificaciones/notificadorTelegram";
import type { ProveedorPrecios } from "@/services/precios/ProveedorPrecios";

const activo: Activo = {
  id: "demo-nvda",
  nombre: "NVIDIA (demo)",
  simbolo: "NVDA",
  tipo: "accion",
};

const alerta: Alerta = {
  id: "demo-alerta-telegram",
  activoId: activo.id,
  condicion: "menor_igual",
  precioObjetivo: 210,
  activa: true,
};

const estadoInicial: EstadoAlerta[] = [
  {
    alertaId: alerta.id,
    ultimoPrecio: 211,
    condicionCumplida: false,
  },
];

const proveedorSimulado: ProveedorPrecios = {
  async obtenerPrecio(): Promise<number> {
    return 209.5;
  },
};

async function demostrarAlertaTelegram(): Promise<void> {
  const activos = new ActivosMemoryRepository();
  const alertas = new AlertasMemoryRepository();
  const eventos = new EventosAlertaMemoryRepository();
  const estado = new EstadoAlertaMemoryRepository();

  await activos.guardarActivo(activo);
  await alertas.guardarAlerta(alerta);

  const resultado = await revisarAlertas({
    activos,
    alertas,
    eventos,
    estado,
    proveedorPrecios: proveedorSimulado,
    notificador: new NotificadorTelegram(),
    estadoInicial,
    persistirEstado: false,
  });

  if (resultado.disparadas !== 1) {
    throw new Error(`La demostración esperaba 1 alerta disparada y obtuvo ${resultado.disparadas}.`);
  }

  console.log("Demostración completada: la alerta de ejemplo cruzó el objetivo y se envió a Telegram.");
  console.log("Precio previo simulado: 211 USD; objetivo: 210 USD; precio actual simulado: 209.5 USD.");
}

if (process.argv[1]?.endsWith("demostrar-alerta-telegram.ts") ?? false) {
  demostrarAlertaTelegram().catch((error: unknown) => {
    const mensaje = error instanceof Error ? error.message : "Error desconocido.";
    console.error("No se pudo ejecutar la demostración:", mensaje);
    process.exitCode = 1;
  });
}
