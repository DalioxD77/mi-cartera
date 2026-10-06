import { NextRequest, NextResponse } from "next/server";

import { config } from "@/lib/config";
import { ServicioPrecios } from "@/services/precios/servicioPrecios";

const peticionesPorIp = new Map<string, { contador: number; ventanaInicio: number }>();

function obtenerIp(request: NextRequest): string {
  const ipForwarded = request.headers.get("x-forwarded-for");
  if (ipForwarded) {
    return ipForwarded.split(",")[0]?.trim() ?? "local";
  }

  return request.headers.get("x-real-ip") ?? "local";
}

function validarLimiteIp(ip: string): boolean {
  const ahora = Date.now();
  const estado = peticionesPorIp.get(ip);

  if (!estado || ahora > estado.ventanaInicio + config.rateLimitWindowMs) {
    peticionesPorIp.set(ip, { contador: 1, ventanaInicio: ahora });
    return true;
  }

  if (estado.contador >= config.rateLimitMaxRequests) {
    return false;
  }

  estado.contador += 1;
  peticionesPorIp.set(ip, estado);
  return true;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const simbolosParam = searchParams.get("simbolos") ?? "";
  const tipo = (searchParams.get("tipo") ?? "crypto") as "accion" | "crypto";
  const ip = obtenerIp(request);

  if (!["accion", "crypto"].includes(tipo)) {
    return NextResponse.json({ error: "Tipo inválido. Usa accion o crypto." }, { status: 400 });
  }

  const simbolos = simbolosParam
    .split(",")
    .map((simbolo) => simbolo.trim())
    .filter(Boolean);

  if (simbolos.length === 0 || simbolos.length > config.maxSymbols) {
    return NextResponse.json(
      { error: `Debes incluir entre 1 y ${config.maxSymbols} símbolos válidos.` },
      { status: 400 },
    );
  }

  if (!validarLimiteIp(ip)) {
    return NextResponse.json(
      { error: "Se excedió el límite de peticiones por IP." },
      { status: 429 },
    );
  }

  try {
    const servicio = new ServicioPrecios();
    const precios = await servicio.obtenerPrecios(simbolos, tipo);

    return NextResponse.json(
      {
        ok: true,
        tipo,
        datos: precios,
      },
      { status: 200 },
    );
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error consultando precios.";
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
