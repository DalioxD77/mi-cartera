import { NotificadorTelegram } from "@/services/notificaciones/notificadorTelegram";

async function probarTelegram(): Promise<void> {
  await new NotificadorTelegram().enviar("✅ Mi Cartera: la conexión con Telegram funciona.");
  console.log("Mensaje de prueba enviado a Telegram.");
}

if (process.argv[1]?.endsWith("probar-telegram.ts") ?? false) {
  probarTelegram().catch((error: unknown) => {
    const mensaje = error instanceof Error ? error.message : "Error desconocido.";
    console.error("No se pudo probar Telegram:", mensaje);
    process.exitCode = 1;
  });
}
