export class CachePrecios {
  private cache = new Map<string, { valor: number; expiraEn: number }>();

  constructor(private readonly ttlMs: number) {}

  get(clave: string): number | undefined {
    const dato = this.cache.get(clave);

    if (!dato) {
      return undefined;
    }

    if (Date.now() > dato.expiraEn) {
      this.cache.delete(clave);
      return undefined;
    }

    return dato.valor;
  }

  set(clave: string, valor: number): void {
    this.cache.set(clave, { valor, expiraEn: Date.now() + this.ttlMs });
  }

  clear(): void {
    this.cache.clear();
  }
}
