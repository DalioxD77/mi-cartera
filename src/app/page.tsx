import { calcularResumenCartera } from "@/domain/calculos";
import type { Compra } from "@/domain/tipos";

const compras: Compra[] = [
  {
    id: "cmp-1",
    activoId: "nvda",
    monto: 100,
    precioCompra: 200,
    cantidad: 0.5,
    comision: 5,
    moneda: "USD",
    fecha: "2025-01-05",
  },
  {
    id: "cmp-2",
    activoId: "btc",
    monto: 200,
    precioCompra: 60000,
    cantidad: 0.0033,
    comision: 10,
    moneda: "USD",
    fecha: "2025-02-10",
  },
];

const precios = {
  nvda: 220,
  btc: 62000,
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);

const formatPercent = (value: number) => `${value.toFixed(2)}%`;

export default function Home() {
  const resumen = calcularResumenCartera(compras, precios);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-50">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">Seguimiento de inversiones</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight">Mi Cartera</h1>
        <p className="mt-3 max-w-2xl text-base text-slate-300">
          Herramienta de seguimiento y aprendizaje. No es asesoría financiera ni garantiza ganancias.
        </p>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg shadow-slate-950/30">
            <p className="text-sm text-slate-400">Invertido total</p>
            <p className="mt-2 text-2xl font-semibold">{formatMoney(resumen.invertidoTotal)}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg shadow-slate-950/30">
            <p className="text-sm text-slate-400">Valor actual</p>
            <p className="mt-2 text-2xl font-semibold">{formatMoney(resumen.valorActualTotal)}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg shadow-slate-950/30">
            <p className="text-sm text-slate-400">Rentabilidad</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-400">{formatPercent(resumen.rentabilidadTotal)}</p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="text-xl font-semibold">Resumen por activo</h2>
          <div className="mt-4 space-y-4">
            {resumen.activos.map((activo) => (
              <div key={activo.activoId} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium uppercase tracking-wide text-slate-300">{activo.activoId}</p>
                    <p className="text-sm text-slate-400">
                      {activo.unidades.toFixed(4)} unidades · precio promedio {formatMoney(activo.precioPromedio)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatMoney(activo.valorActual)}</p>
                    <p className={`text-sm ${activo.ganancia >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {activo.ganancia >= 0 ? "+" : "-"}
                      {formatMoney(Math.abs(activo.ganancia))}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
