"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";

import type { Activo, Alerta, CondicionAlerta, EventoAlerta, TipoActivo } from "@/domain/tipos";
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";

interface AlertaRow {
  id: string;
  asset_id: string;
  condition: CondicionAlerta;
  target_price: number;
  is_active: boolean;
}

interface EventoRow {
  id: string;
  alert_id: string;
  fired_at: string;
  price_at_trigger: number;
  message: string;
}

function mostrarError(error: unknown): string {
  return error instanceof Error ? error.message : "Ocurrió un error inesperado.";
}

function formatoPrecio(precio: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 4,
  }).format(precio);
}

export default function CarteraApp() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [usuario, setUsuario] = useState<User | null>(null);
  const [sesionLista, setSesionLista] = useState(false);
  const sesionComprobada = !supabase || sesionLista;
  const [cargando, setCargando] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [activos, setActivos] = useState<Activo[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [eventos, setEventos] = useState<EventoAlerta[]>([]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombreActivo, setNombreActivo] = useState("");
  const [simbolo, setSimbolo] = useState("");
  const [tipoActivo, setTipoActivo] = useState<TipoActivo>("accion");
  const [activoId, setActivoId] = useState("");
  const [condicion, setCondicion] = useState<CondicionAlerta>("menor_igual");
  const [precioObjetivo, setPrecioObjetivo] = useState("");

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let activa = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (activa) {
        setUsuario(session?.user ?? null);
        setActivos([]);
        setAlertas([]);
        setEventos([]);
        setSesionLista(true);
      }
    });

    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!activa) {
        return;
      }

      if (sessionError) {
        setError(sessionError.message);
      }
      setUsuario(data.session?.user ?? null);
      setSesionLista(true);
    }).catch((sessionError: unknown) => {
      if (activa) {
        setError(`No se pudo comprobar la sesión: ${mostrarError(sessionError)}`);
        setSesionLista(true);
      }
    });

    return () => {
      activa = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const cargarDatos = useCallback(async () => {
    if (!supabase) {
      return;
    }

    setCargando(true);
    setError("");

    try {
      const [activosResult, alertasResult, eventosResult] = await Promise.all([
        supabase.from("assets").select("id, name, symbol, type").order("created_at"),
        supabase.from("alerts").select("id, asset_id, condition, target_price, is_active").order("created_at", { ascending: false }),
        supabase.from("alert_events").select("id, alert_id, fired_at, price_at_trigger, message").order("fired_at", { ascending: false }).limit(10),
      ]);

      if (activosResult.error) {
        throw new Error(`No se pudieron cargar los activos: ${activosResult.error.message}`);
      }
      if (alertasResult.error) {
        throw new Error(`No se pudieron cargar las alertas: ${alertasResult.error.message}`);
      }
      if (eventosResult.error) {
        throw new Error(`No se pudo cargar el historial: ${eventosResult.error.message}`);
      }

      setActivos((activosResult.data ?? []).map((row) => ({
        id: row.id,
        nombre: row.name,
        simbolo: row.symbol,
        tipo: row.type,
      })));
      setAlertas((alertasResult.data ?? []).map((row: AlertaRow) => ({
        id: row.id,
        activoId: row.asset_id,
        condicion: row.condition,
        precioObjetivo: Number(row.target_price),
        activa: row.is_active,
      })));
      setEventos((eventosResult.data ?? []).map((row: EventoRow) => ({
        id: row.id,
        alertaId: row.alert_id,
        fecha: row.fired_at,
        precioAlDisparar: Number(row.price_at_trigger),
        mensaje: row.message,
      })));
    } catch (loadError) {
      setError(mostrarError(loadError));
    } finally {
      setCargando(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (!usuario) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void cargarDatos();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [usuario, cargarDatos]);

  async function iniciarSesion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) {
      return;
    }

    setOcupado(true);
    setError("");
    setAviso("");
    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) {
        setError(`No se pudo iniciar sesión: ${loginError.message}`);
      }
    } catch (loginError: unknown) {
      setError(`No se pudo iniciar sesión: ${mostrarError(loginError)}`);
    } finally {
      setOcupado(false);
    }
  }

  async function cerrarSesion() {
    if (!supabase) {
      return;
    }

    setOcupado(true);
    try {
      const { error: logoutError } = await supabase.auth.signOut();
      if (logoutError) {
        setError(`No se pudo cerrar sesión: ${logoutError.message}`);
      }
    } catch (logoutError: unknown) {
      setError(`No se pudo cerrar sesión: ${mostrarError(logoutError)}`);
    } finally {
      setOcupado(false);
    }
  }

  async function guardarActivo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !nombreActivo.trim() || !simbolo.trim()) {
      setError("Escribe el nombre y el símbolo del activo.");
      return;
    }

    const simboloNormalizado = simbolo.trim().toUpperCase();
    if (!/^[A-Z][A-Z0-9.-]{0,15}$/.test(simboloNormalizado)) {
      setError("El símbolo debe comenzar con una letra y contener hasta 16 letras, números, puntos o guiones.");
      return;
    }

    setOcupado(true);
    setError("");
    try {
      const { data, error: saveError } = await supabase
        .from("assets")
        .insert({ name: nombreActivo.trim(), symbol: simboloNormalizado, type: tipoActivo })
        .select("id")
        .single();

      if (saveError) {
        setError(`No se pudo guardar el activo: ${saveError.message}`);
      } else {
        setNombreActivo("");
        setSimbolo("");
        setActivoId(data.id);
        setAviso("Activo guardado en Supabase.");
        await cargarDatos();
      }
    } catch (saveError: unknown) {
      setError(`No se pudo guardar el activo: ${mostrarError(saveError)}`);
    } finally {
      setOcupado(false);
    }
  }

  async function guardarAlerta(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const objetivo = Number(precioObjetivo);
    if (!supabase || !activoId || !Number.isFinite(objetivo) || objetivo <= 0) {
      setError("Selecciona un activo e indica un precio objetivo mayor que cero.");
      return;
    }

    setOcupado(true);
    setError("");
    try {
      const { error: saveError } = await supabase.from("alerts").insert({
        asset_id: activoId,
        condition: condicion,
        target_price: objetivo,
      });

      if (saveError) {
        setError(`No se pudo guardar la alerta: ${saveError.message}`);
      } else {
        setPrecioObjetivo("");
        setAviso("Alerta guardada. El job revisa los precios cada 15 minutos.");
        await cargarDatos();
      }
    } catch (saveError: unknown) {
      setError(`No se pudo guardar la alerta: ${mostrarError(saveError)}`);
    } finally {
      setOcupado(false);
    }
  }

  async function cambiarEstado(alerta: Alerta) {
    if (!supabase) {
      return;
    }

    setOcupado(true);
    setError("");
    try {
      const { error: updateError } = await supabase
        .from("alerts")
        .update({ is_active: !alerta.activa })
        .eq("id", alerta.id);

      if (updateError) {
        setError(`No se pudo actualizar la alerta: ${updateError.message}`);
      } else {
        setAviso(alerta.activa ? "Alerta pausada." : "Alerta activada.");
        await cargarDatos();
      }
    } catch (updateError: unknown) {
      setError(`No se pudo actualizar la alerta: ${mostrarError(updateError)}`);
    } finally {
      setOcupado(false);
    }
  }

  async function eliminarAlerta(id: string) {
    if (!supabase || !window.confirm("¿Eliminar esta alerta y su historial?")) {
      return;
    }

    setOcupado(true);
    setError("");
    try {
      const { error: deleteError } = await supabase.from("alerts").delete().eq("id", id);
      if (deleteError) {
        setError(`No se pudo eliminar la alerta: ${deleteError.message}`);
      } else {
        setAviso("Alerta eliminada.");
        await cargarDatos();
      }
    } catch (deleteError: unknown) {
      setError(`No se pudo eliminar la alerta: ${mostrarError(deleteError)}`);
    } finally {
      setOcupado(false);
    }
  }

  if (!supabase) {
    return (
      <main className="min-h-screen px-6 py-12 text-slate-50">
        <section className="mx-auto max-w-2xl rounded-2xl border border-amber-700/50 bg-slate-900 p-8">
          <h1 className="text-3xl font-bold">Conecta Supabase</h1>
          <p className="mt-4 text-slate-300">
            Configura <code>NEXT_PUBLIC_SUPABASE_URL</code> y <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> en
            <code> .env.local</code> para habilitar el inicio de sesión y guardar alertas.
          </p>
        </section>
      </main>
    );
  }

  if (!sesionComprobada) {
    return <main className="px-6 py-16 text-center text-slate-300">Comprobando sesión…</main>;
  }

  if (!usuario) {
    return (
      <main className="min-h-screen px-6 py-12 text-slate-50">
        <section className="mx-auto max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">Cartera privada</p>
          <h1 className="mt-3 text-3xl font-bold">Mi Cartera</h1>
          <p className="mt-3 text-slate-300">Inicia sesión para administrar tus activos y alertas.</p>
          <form className="mt-6 space-y-4" onSubmit={iniciarSesion}>
            <label className="block text-sm text-slate-300">
              Correo
              <input
                autoComplete="username"
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                value={email}
              />
            </label>
            <label className="block text-sm text-slate-300">
              Contraseña
              <input
                autoComplete="current-password"
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </label>
            <button
              className="w-full rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-950 disabled:opacity-50"
              disabled={ocupado}
              type="submit"
            >
              {ocupado ? "Ingresando…" : "Iniciar sesión"}
            </button>
          </form>
          <p className="mt-4 text-xs text-slate-500">
            La cuenta se crea desde el panel de Supabase; el registro público está deshabilitado.
          </p>
          {error && <p className="mt-4 rounded-lg bg-rose-950 p-3 text-sm text-rose-200">{error}</p>}
        </section>
      </main>
    );
  }

  const activoPorId = new Map(activos.map((activo) => [activo.id, activo]));

  return (
    <main className="min-h-screen px-6 py-10 text-slate-50">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">Seguimiento de inversiones</p>
            <h1 className="mt-2 text-3xl font-bold">Mi Cartera</h1>
            <p className="mt-2 text-slate-400">Tus activos y alertas se guardan de forma privada en Supabase.</p>
          </div>
          <button
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 disabled:opacity-50"
            disabled={ocupado}
            onClick={() => void cerrarSesion()}
            type="button"
          >
            Cerrar sesión
          </button>
        </header>

        <section className="mt-6 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">ID de usuario para el workflow privado</p>
          <code className="mt-1 block break-all text-sm text-cyan-200">{usuario.id}</code>
          <p className="mt-2 text-xs text-slate-500">
            Guárdalo en GitHub como el secreto <code>SUPABASE_OWNER_ID</code>; no es una contraseña.
          </p>
        </section>

        {error && <p className="mt-5 rounded-lg border border-rose-900 bg-rose-950/80 p-3 text-rose-200">{error}</p>}
        {aviso && <p className="mt-5 rounded-lg border border-emerald-900 bg-emerald-950/60 p-3 text-emerald-200">{aviso}</p>}

        <section className="mt-8 grid gap-6 md:grid-cols-2">
          <form className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-6" onSubmit={guardarActivo}>
            <div>
              <h2 className="text-xl font-semibold">Agregar activo</h2>
              <p className="mt-1 text-sm text-slate-400">Ejemplos: NVIDIA / NVDA o Bitcoin / BTC.</p>
            </div>
            <label className="block text-sm text-slate-300">
              Nombre
              <input className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" onChange={(event) => setNombreActivo(event.target.value)} required value={nombreActivo} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm text-slate-300">
                Símbolo
                <input className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 uppercase" onChange={(event) => setSimbolo(event.target.value)} required value={simbolo} />
              </label>
              <label className="block text-sm text-slate-300">
                Tipo
                <select className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" onChange={(event) => setTipoActivo(event.target.value as TipoActivo)} value={tipoActivo}>
                  <option value="accion">Acción</option>
                  <option value="crypto">Criptomoneda</option>
                </select>
              </label>
            </div>
            <button className="rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-950 disabled:opacity-50" disabled={ocupado} type="submit">
              Guardar activo
            </button>
          </form>

          <form className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-6" onSubmit={guardarAlerta}>
            <div>
              <h2 className="text-xl font-semibold">Crear alerta</h2>
              <p className="mt-1 text-sm text-slate-400">Recibirás un mensaje cuando el precio cruce el objetivo.</p>
            </div>
            <label className="block text-sm text-slate-300">
              Activo
              <select className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" onChange={(event) => setActivoId(event.target.value)} required value={activoId}>
                <option value="">Selecciona un activo</option>
                {activos.map((activo) => <option key={activo.id} value={activo.id}>{activo.nombre} ({activo.simbolo})</option>)}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm text-slate-300">
                Condición
                <select className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" onChange={(event) => setCondicion(event.target.value as CondicionAlerta)} value={condicion}>
                  <option value="menor_igual">Baja a o por debajo</option>
                  <option value="mayor_igual">Sube a o por encima</option>
                </select>
              </label>
              <label className="block text-sm text-slate-300">
                Precio objetivo (USD)
                <input className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" min="0.0001" onChange={(event) => setPrecioObjetivo(event.target.value)} required step="any" type="number" value={precioObjetivo} />
              </label>
            </div>
            <button className="rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-950 disabled:opacity-50" disabled={ocupado || activos.length === 0} type="submit">
              Guardar alerta
            </button>
          </form>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Tus alertas</h2>
              <p className="mt-1 text-sm text-slate-400">El workflow revisa cada 15 minutos; la primera lectura establece el precio de referencia.</p>
            </div>
            <button className="rounded-lg border border-slate-700 px-3 py-2 text-sm disabled:opacity-50" disabled={cargando} onClick={() => void cargarDatos()} type="button">
              {cargando ? "Actualizando…" : "Actualizar"}
            </button>
          </div>
          {alertas.length === 0 ? (
            <p className="mt-5 rounded-lg bg-slate-950/70 p-4 text-slate-400">Aún no tienes alertas. Agrega un activo y crea una alerta arriba.</p>
          ) : (
            <div className="mt-5 space-y-3">
              {alertas.map((alerta) => {
                const activo = activoPorId.get(alerta.activoId);
                return (
                  <article className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/70 p-4" key={alerta.id}>
                    <div>
                      <p className="font-medium">{activo ? `${activo.nombre} (${activo.simbolo})` : "Activo no disponible"}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        {alerta.condicion === "menor_igual" ? "Baja a o por debajo de" : "Sube a o por encima de"} {formatoPrecio(alerta.precioObjetivo)}
                        {" · "}{alerta.activa ? "Activa" : "Pausada"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button className="rounded-lg border border-slate-700 px-3 py-2 text-sm disabled:opacity-50" disabled={ocupado} onClick={() => void cambiarEstado(alerta)} type="button">
                        {alerta.activa ? "Pausar" : "Activar"}
                      </button>
                      <button className="rounded-lg border border-rose-900 px-3 py-2 text-sm text-rose-200 disabled:opacity-50" disabled={ocupado} onClick={() => void eliminarAlerta(alerta.id)} type="button">
                        Eliminar
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="text-xl font-semibold">Últimas notificaciones</h2>
          {eventos.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">Cuando una alerta se dispare, aparecerá aquí.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {eventos.map((evento) => (
                <li className="rounded-lg bg-slate-950/70 p-4" key={evento.id}>
                  <p>{evento.mensaje}</p>
                  <time className="mt-1 block text-xs text-slate-500" dateTime={evento.fecha}>{new Date(evento.fecha).toLocaleString("es")}</time>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="mt-8 text-center text-xs text-slate-500">
          Las cotizaciones pueden tener retraso. Esto es una herramienta de seguimiento, no asesoría financiera.
        </p>
      </div>
    </main>
  );
}
