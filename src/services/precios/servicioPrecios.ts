import { config } from "@/lib/config";
import type { ProveedorPrecios, TipoActivoPrecio } from "@/services/precios/ProveedorPrecios";
import { ProveedorAcciones } from "@/services/precios/proveedorAcciones";
import { ProveedorCoinGecko } from "@/services/precios/proveedorCoinGecko";
import { ProveedorSimulado } from "@/services/precios/proveedorSimulado";
import { CachePrecios } from "@/services/precios/cache";

export class ServicioPrecios {
  private readonly cache: CachePrecios;

  constructor(
    private readonly proveedores: Record<TipoActivoPrecio, ProveedorPrecios> = {
      crypto: new ProveedorCoinGecko(),
      accion: new ProveedorAcciones(),
    },
  ) {
    this.cache = new CachePrecios(config.cacheTtlMs);
  }

  private normalizarSimbolo(simbolo: string): string {
    const valor = simbolo.trim().toUpperCase();

    if (!/^[A-Z][A-Z0-9.-]{0,15}$/.test(valor)) {
      throw new Error(`Símbolo inválido: ${simbolo}`);
    }

    return valor;
  }

  async obtenerPrecio(simbolo: string, tipo: TipoActivoPrecio): Promise<number> {
    const simboloNormalizado = this.normalizarSimbolo(simbolo);
    const clave = `${tipo}:${simboloNormalizado}`;
    const valorCacheado = this.cache.get(clave);

    if (valorCacheado !== undefined) {
      return valorCacheado;
    }

    const precio = await this.proveedores[tipo].obtenerPrecio(simboloNormalizado);
    this.cache.set(clave, precio);
    return precio;
  }

  async obtenerPrecios(simbolos: string[], tipo: TipoActivoPrecio): Promise<Record<string, number>> {
    const lista = [...new Set(simbolos.map((simbolo) => this.normalizarSimbolo(simbolo)))];

    if (lista.length === 0) {
      return {};
    }

    if (lista.length > config.maxSymbols) {
      throw new Error(`Máximo permitido: ${config.maxSymbols} símbolos por solicitud.`);
    }

    const precios: Record<string, number> = {};

    for (const simbolo of lista) {
      precios[simbolo] = await this.obtenerPrecio(simbolo, tipo);
    }

    return precios;
  }
}

export const servicioPrecios = new ServicioPrecios();

export const proveedorSimulado = new ProveedorSimulado();
