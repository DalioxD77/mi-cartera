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
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
PRECIOS_CACHE_TTL_MS=60000
MAX_SIMBOLOS=10
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=30
```

`NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` se usan en el navegador; las políticas RLS de la base protegen los datos. Nunca pongas una clave `service_role` o `sb_secret_` en una variable `NEXT_PUBLIC_`.

## Configurar Supabase

1. En **SQL Editor** del proyecto, abre una consulta nueva, copia y ejecuta todo el contenido de [`supabase/migrations/20261006000000_cartera_alertas.sql`](./supabase/migrations/20261006000000_cartera_alertas.sql). Crea las tablas con seguridad RLS para activos, alertas, estados e historial.
2. En **Authentication → Settings**, desactiva el registro público. En **Authentication → Users**, crea tu único usuario y guarda el correo y contraseña de forma privada.
3. Copia la URL del proyecto y su clave `anon` o `publishable` desde la configuración de API. En tu copia local, guarda esos valores en `.env.local` como `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`. No subas `.env.local`.
4. Ejecuta `npm run dev`, inicia sesión con el usuario creado y añade un activo y una alerta desde la página. El ID de usuario que muestra la app es el valor para el secreto `SUPABASE_OWNER_ID`.
5. En GitHub, agrega estos secretos del repositorio para el workflow programado:
   - `SUPABASE_URL`: URL del proyecto.
   - `SUPABASE_SERVICE_ROLE_KEY`: clave de servidor `service_role` (o la clave secreta del proyecto). Solo la usa GitHub Actions; nunca la pongas en el frontend.
   - `SUPABASE_OWNER_ID`: ID mostrado en la app.
   - Conserva `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID` ya configurados.
6. Para alojar la web, configura `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en las variables de entorno del proveedor de despliegue y vuelve a desplegar.

El workflow **Revisar alertas** consulta las alertas activas de ese usuario, obtiene precios, conserva el último precio en Supabase y manda Telegram cuando detecta un cruce. Su primera revisión guarda el precio de referencia; las siguientes pueden detectar el cruce. Se ejecuta cada 15 minutos y también se puede iniciar manualmente en **Actions**.

### Configurar Telegram

1. Crea un bot con [@BotFather](https://t.me/BotFather), abre el chat con tu bot y envíale `/start`.
2. Agrega el token de BotFather y el ID numérico de ese chat como secretos del repositorio en **Settings → Secrets and variables → Actions → New repository secret**. Usa exactamente los nombres `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID`. Nunca compartas ni publiques el token.
3. Envíale un mensaje al bot. En **Actions**, ejecuta el workflow **Obtener chat ID** con **Run workflow** y copia el ID numérico que aparece en los registros de esa ejecución.
4. Agrega ese ID como otro secreto del repositorio, llamado `TELEGRAM_CHAT_ID`.
5. En **Actions**, ejecuta el workflow **Probar Telegram** con **Run workflow**. Si la configuración es correcta, recibirás un mensaje de prueba del bot.
6. Para desarrollo local, copia `.env.example` como `.env.local` y completa esas dos variables. No subas `.env.local` a Git. Next.js carga ese archivo al ejecutar la app; los comandos de `jobs` ejecutados directamente necesitan recibir las variables en el entorno de la terminal.

Para ver el flujo de alerta de ejemplo, ejecuta **Actions → Demostración alerta Telegram → Run workflow**. Usa precios simulados y no modifica tus alertas guardadas.

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
- `src/repositories`: contratos, implementaciones en memoria/localStorage y acceso de servidor a Supabase.
- `supabase/migrations`: esquema de datos y políticas Row Level Security.
- `src/services/precios`: proveedores, caché y servicio central.
- `src/services/notificaciones`: notificaciones a consola o Telegram.
- `src/lib`: configuración centralizada de entorno.
- `jobs`: job automatizado de revisión de alertas.
- `tests`: pruebas unitarias y del job.

## Hoja de ruta

- Dashboard con datos simulados.
- Formulario de compras y edición.
- Gráficos de rendimiento y cartera.
- Backtesting más formal.

## Importante

La app solo ofrece seguimiento y aprendizaje. Nunca promete ganancias, no recomienda inversiones personalizadas ni ejecuta compras automáticamente.
