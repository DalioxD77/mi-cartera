# Mi Cartera

Mi Cartera es una app personal de seguimiento de inversiones para acciones y criptomonedas. Está pensada como una herramienta de aprendizaje y análisis, no como asesoría financiera ni como promesa de ganancias.

## Qué incluye

- App en Next.js con App Router y TypeScript.
- Lógica de negocio separada en `src/domain`.
- Repositorios para compra, activos, alertas y eventos.
- Proveedores de precios con caché y validación.
- Ruta interna `GET /api/precios` para consultar símbolos del servidor.
- Job de alertas con revisión periódica.
- Ejemplos de pruebas con Vitest.

## Instalación

1. Clona el proyecto.
2. Copia `.env.example` a `.env.local` y completa los valores requeridos.
3. Ejecuta:

```bash
npm install
npm run dev
```

## Variables de entorno

El archivo `.env.example` incluye la configuración mínima:

```env
PRICE_API_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
PRECIOS_CACHE_TTL_MS=60000
MAX_SIMBOLOS=10
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=30
```

Importante: nunca se exponen secretos al frontend; solo se usan variables del servidor (sin prefijo `NEXT_PUBLIC_`).

### Configurar Telegram

1. Crea un bot con [@BotFather](https://t.me/BotFather), abre el chat con tu bot y envíale `/start`.
2. Agrega el token de BotFather y el ID numérico de ese chat como secretos del repositorio en **Settings → Secrets and variables → Actions → New repository secret**. Usa exactamente los nombres `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID`. Nunca compartas ni publiques el token.
3. Envíale un mensaje al bot. En **Actions**, ejecuta el workflow **Obtener chat ID** con **Run workflow** y copia el ID numérico que aparece en los registros de esa ejecución.
4. Agrega ese ID como otro secreto del repositorio, llamado `TELEGRAM_CHAT_ID`.
5. En **Actions**, ejecuta el workflow **Probar Telegram** con **Run workflow**. Si la configuración es correcta, recibirás un mensaje de prueba del bot.
6. Para desarrollo local, copia `.env.example` como `.env.local` y completa esas dos variables. No subas `.env.local` a Git. Next.js carga ese archivo al ejecutar la app; los comandos de `jobs` ejecutados directamente necesitan recibir las variables en el entorno de la terminal.

Para ver el flujo de alerta completo, ejecuta **Actions → Demostración alerta Telegram → Run workflow**. Envía una alerta de ejemplo usando precios simulados (no precios de mercado) y no modifica el estado persistido del job.

El job periódico está preparado para usar Telegram al encontrar una alerta disparada. Actualmente sus repositorios de alertas y activos están en memoria, mientras que la interfaz todavía no guarda alertas; por eso la demostración no representa una alerta real creada en la aplicación. La persistencia y conexión de las alertas reales quedan pendientes.

## Cómo correr las pruebas

```bash
npm test
```

## Cómo ejecutar el job de alertas

```bash
npm run job:alertas
```

## Arquitectura por capas

- `src/app`: rutas y páginas de la app.
- `src/components`: placeholders para componentes futuros.
- `src/domain`: tipos, cálculos, reglas de alertas y backtesting.
- `src/repositories`: contratos y implementaciones en memoria y localStorage.
- `src/services/precios`: proveedores, caché y servicio central.
- `src/services/notificaciones`: notificaciones a consola o Telegram.
- `src/lib`: configuración centralizada de entorno.
- `jobs`: job automatizado de revisión de alertas.
- `tests`: pruebas unitarias y del job.

## Hoja de ruta

- Dashboard con datos simulados.
- Formulario de compras y edición.
- Gráficos de rendimiento y cartera.
- Alertas en la interfaz.
- Supabase para persistencia real.
- Backtesting más formal.

## Importante

La app solo ofrece seguimiento y aprendizaje. Nunca promete ganancias, no recomienda inversiones personalizadas ni ejecuta compras automáticamente.
