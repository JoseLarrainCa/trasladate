// Cliente de datos del panel de Trasladarte.
//
// Imita la porción de supabase-js que usaban las pantallas (from / select / insert /
// update / delete / eq / neq / order / single / maybeSingle y tablas hijas embebidas), pero en vez de hablar
// con Supabase manda cada consulta a POST /api/db del Worker, que la valida y la corre
// sobre D1 (worker/consulta.ts). Así las pantallas casi no cambian.
//
// Igual que supabase-js, NUNCA lanza: devuelve { data, error }.

export interface ErrorDb {
  message: string;
  code?: string;
}

export interface Resultado<T = any> {
  data: T;
  error: ErrorDb | null;
}

type Escalar = string | number | boolean | null;
type Op = "select" | "insert" | "update" | "delete";

/** Aviso al resto de la app de que el servidor ya no reconoce la sesión. */
export const EVENTO_SESION_VENCIDA = "trasladarte:sesion-vencida";

/**
 * "*, activity_materials(*), activity_labor(*)"  ->  columnas ["*"] y tablas hijas
 * ["activity_materials", "activity_labor"]. Corta por comas solo en el nivel de afuera.
 */
export function parsearColumnas(texto: string): { columnas: string[]; embeds: string[] } {
  const partes: string[] = [];
  let profundidad = 0;
  let actual = "";
  for (const ch of texto) {
    if (ch === "(") profundidad++;
    if (ch === ")") profundidad--;
    if (ch === "," && profundidad === 0) {
      partes.push(actual);
      actual = "";
    } else {
      actual += ch;
    }
  }
  partes.push(actual);

  const columnas: string[] = [];
  const embeds: string[] = [];
  for (const crudo of partes) {
    const parte = crudo.trim();
    if (!parte) continue;
    const abre = parte.indexOf("(");
    if (abre > 0) embeds.push(parte.slice(0, abre).trim());
    else columnas.push(parte);
  }
  return { columnas: columnas.length ? columnas : ["*"], embeds };
}

class Consulta implements PromiseLike<Resultado> {
  private op: Op = "select";
  private columnas: string[] = ["*"];
  private embeds: string[] = [];
  private filtros: { col: string; val: Escalar; op?: "neq" }[] = [];
  private orden: { col: string; asc: boolean }[] = [];
  private unico = false;
  private quizas = false;
  private valores?: Record<string, unknown> | Record<string, unknown>[];
  private devolver = false;

  constructor(private tabla: string) {}

  select(columnas = "*") {
    if (this.op === "select") {
      const p = parsearColumnas(columnas);
      this.columnas = p.columnas;
      this.embeds = p.embeds;
    } else {
      // insert(...).select() / update(...).select(): pedir de vuelta las filas tocadas.
      this.devolver = true;
    }
    return this;
  }

  insert(valores: Record<string, unknown> | Record<string, unknown>[]) {
    this.op = "insert";
    this.valores = valores;
    return this;
  }

  update(valores: Record<string, unknown>) {
    this.op = "update";
    this.valores = valores;
    return this;
  }

  delete() {
    this.op = "delete";
    return this;
  }

  eq(col: string, val: Escalar) {
    this.filtros.push({ col, val });
    return this;
  }

  neq(col: string, val: Escalar) {
    this.filtros.push({ col, val, op: "neq" });
    return this;
  }

  order(col: string, opciones: { ascending?: boolean } = {}) {
    this.orden.push({ col, asc: opciones.ascending !== false });
    return this;
  }

  single() {
    this.unico = true;
    return this;
  }

  /** Una fila o null (sin error si no hay ninguna). */
  maybeSingle() {
    this.quizas = true;
    return this;
  }

  private async ejecutar(): Promise<Resultado> {
    try {
      const res = await fetch("/api/db", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          tabla: this.tabla,
          op: this.op,
          columnas: this.op === "select" ? this.columnas : undefined,
          embeds: this.op === "select" && this.embeds.length ? this.embeds : undefined,
          filtros: this.filtros.length ? this.filtros : undefined,
          orden: this.orden.length ? this.orden : undefined,
          unico: this.unico || undefined,
          quizas: this.quizas || undefined,
          valores: this.valores,
          devolver: this.devolver || undefined,
        }),
      });
      if (res.status === 401 && typeof window !== "undefined") {
        window.dispatchEvent(new Event(EVENTO_SESION_VENCIDA));
      }
      const cuerpo = (await res.json().catch(() => null)) as Resultado | null;
      if (!cuerpo) return { data: null, error: { message: `Error ${res.status}` } };
      return { data: cuerpo.data ?? null, error: cuerpo.error ?? null };
    } catch {
      return { data: null, error: { message: "No se pudo conectar. Revisa tu internet." } };
    }
  }

  then<R1 = Resultado, R2 = never>(
    alExito?: ((valor: Resultado) => R1 | PromiseLike<R1>) | null,
    alFallo?: ((motivo: unknown) => R2 | PromiseLike<R2>) | null,
  ): PromiseLike<R1 | R2> {
    return this.ejecutar().then(alExito, alFallo);
  }
}

export const db = {
  from: (tabla: string) => new Consulta(tabla),
};
