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
- Telegram real y automatización.
- Supabase para persistencia real.
- Backtesting más formal.

## Importante

La app solo ofrece seguimiento y aprendizaje. Nunca promete ganancias, no recomienda inversiones personalizadas ni ejecuta compras automáticamente.
