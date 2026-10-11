// Traduce las peticiones del panel a SQL sobre D1.
//
// El panel se escribió contra supabase-js (`from(t).select().eq().order()...`). En vez
// de reescribir las 8 pantallas, el navegador arma la misma consulta con un cliente
// mínimo (src/integrations/db.ts) y la manda a POST /api/db; este módulo la valida y
// la ejecuta. Solo existen las operaciones que el panel usa de verdad: select / insert
// / update / delete, filtros de igualdad y desigualdad (eq / neq), orden, `single`,
// `maybeSingle` y tablas hijas embebidas.
//
// Seguridad: tabla y columnas pasan SIEMPRE por la lista cerrada de ./schema antes de
// tocar el SQL, y los valores viajan como parámetros (nunca concatenados). Update y
// delete exigen al menos un filtro, para que un descuido no borre una tabla entera.

import { z } from "zod";
import { TABLAS, type Tabla, type Tipo } from "./schema";

export class ErrorConsulta extends Error {
  constructor(
    message: string,
    public code = "ERR_CONSULTA",
    public status = 400,
  ) {
    super(message);
  }
}

const Escalar = z.union([z.string(), z.number(), z.boolean(), z.null()]);

export const PeticionSchema = z.object({
  tabla: z.string().max(64),
  op: z.enum(["select", "insert", "update", "delete"]),
  columnas: z.array(z.string().max(64)).max(40).optional(),
  embeds: z.array(z.string().max(64)).max(4).optional(),
  filtros: z
    .array(z.object({ col: z.string().max(64), val: Escalar, op: z.enum(["eq", "neq"]).optional() }))
    .max(8)
    .optional(),
  orden: z.array(z.object({ col: z.string().max(64), asc: z.boolean() })).max(4).optional(),
  unico: z.boolean().optional(),
  /** Como `unico`, pero cero filas devuelve null en vez de error (maybeSingle de supabase-js). */
  quizas: z.boolean().optional(),
  valores: z.union([z.record(z.unknown()), z.array(z.record(z.unknown())).max(500)]).optional(),
  devolver: z.boolean().optional(),
});
export type Peticion = z.infer<typeof PeticionSchema>;

export type Fila = Record<string, unknown>;

// ───────────────────────── validación de nombres ─────────────────────────

function tablaDe(nombre: string): Tabla {
  if (!Object.hasOwn(TABLAS, nombre)) throw new ErrorConsulta(`La tabla "${nombre}" no existe`, "42P01");
  return TABLAS[nombre];
}

function tipoDe(tabla: Tabla, tablaNombre: string, col: string): Tipo {
  if (!Object.hasOwn(tabla.columnas, col)) {
    throw new ErrorConsulta(`La columna "${col}" no existe en ${tablaNombre}`, "42703");
  }
  return tabla.columnas[col];
}

const comillas = (ident: string) => `"${ident}"`;

// ───────────────────────── conversión de valores ─────────────────────────

/** De lo que manda el navegador a lo que guarda SQLite. */
export function paraD1(tipo: Tipo, valor: unknown, col: string): string | number | null {
  if (valor === null || valor === undefined) return null;
  switch (tipo) {
    case "text":
      if (typeof valor === "string") return valor;
      if (typeof valor === "number" || typeof valor === "boolean") return String(valor);
      throw new ErrorConsulta(`"${col}" tiene que ser texto`, "22P02");
    case "int":
    case "real": {
      const n = typeof valor === "string" && valor.trim() !== "" ? Number(valor) : valor;
      if (typeof n !== "number" || !Number.isFinite(n)) {
        throw new ErrorConsulta(`"${col}" tiene que ser un número`, "22P02");
      }
      if (tipo === "int" && !Number.isInteger(n)) {
        throw new ErrorConsulta(`"${col}" tiene que ser un número entero`, "22P02");
      }
      return n;
    }
    case "bool":
      if (typeof valor === "boolean") return valor ? 1 : 0;
      if (valor === 0 || valor === 1) return valor;
      throw new ErrorConsulta(`"${col}" tiene que ser verdadero o falso`, "22P02");
    case "json":
      return JSON.stringify(valor);
  }
}

/** De lo que devuelve SQLite a lo que espera el panel. */
export function deD1(tipo: Tipo, valor: unknown): unknown {
  if (valor === null || valor === undefined) return null;
  if (tipo === "bool") return Boolean(valor);
  if (tipo === "json" && typeof valor === "string") {
    try {
      return JSON.parse(valor);
    } catch {
      return valor;
    }
  }
  return valor;
}

function leerFila(tabla: Tabla, fila: Fila): Fila {
  const out: Fila = {};
  for (const [k, v] of Object.entries(fila)) {
    out[k] = Object.hasOwn(tabla.columnas, k) ? deD1(tabla.columnas[k], v) : v;
  }
  return out;
}

// ───────────────────────── armado de SQL ─────────────────────────

export interface Sentencia {
  sql: string;
  params: (string | number | null)[];
}

function armarWhere(tablaNombre: string, tabla: Tabla, filtros: Peticion["filtros"]): Sentencia {
  const partes: string[] = [];
  const params: Sentencia["params"] = [];
  for (const f of filtros ?? []) {
    const tipo = tipoDe(tabla, tablaNombre, f.col);
    const valor = paraD1(tipo, f.val, f.col);
    const distinto = f.op === "neq";
    if (valor === null) {
      partes.push(`${comillas(f.col)} IS ${distinto ? "NOT " : ""}NULL`);
    } else {
      // neq de PostgREST no trae las filas con NULL en esa columna; "<>" en SQLite tampoco.
      partes.push(`${comillas(f.col)} ${distinto ? "<>" : "="} ?`);
      params.push(valor);
    }
  }
  return { sql: partes.length ? ` WHERE ${partes.join(" AND ")}` : "", params };
}

function armarOrden(tablaNombre: string, tabla: Tabla, orden: Peticion["orden"]): string {
  if (!orden?.length) return "";
  const partes = orden.map((o) => {
    tipoDe(tabla, tablaNombre, o.col);
    return `${comillas(o.col)} ${o.asc ? "ASC" : "DESC"}`;
  });
  return ` ORDER BY ${partes.join(", ")}`;
}

export function armarSelect(p: Peticion): Sentencia {
  const tabla = tablaDe(p.tabla);
  const cols = p.columnas?.length ? p.columnas : ["*"];
  const lista = cols.includes("*")
    ? "*"
    : cols.map((c) => (tipoDe(tabla, p.tabla, c), comillas(c))).join(", ");
  const where = armarWhere(p.tabla, tabla, p.filtros);
  return {
    sql: `SELECT ${lista} FROM ${comillas(p.tabla)}${where.sql}${armarOrden(p.tabla, tabla, p.orden)}`,
    params: where.params,
  };
}

/** Pares columna/valor ya validados y convertidos. */
function parearValores(tablaNombre: string, tabla: Tabla, fila: Record<string, unknown>) {
  const columnas: string[] = [];
  const params: Sentencia["params"] = [];
  for (const [col, valor] of Object.entries(fila)) {
    if (valor === undefined) continue;
    const tipo = tipoDe(tabla, tablaNombre, col);
    columnas.push(col);
    params.push(paraD1(tipo, valor, col));
  }
  return { columnas, params };
}

export function armarInsert(p: Peticion, idNuevo: () => string = () => crypto.randomUUID()): Sentencia[] {
  const tabla = tablaDe(p.tabla);
  const filas = Array.isArray(p.valores) ? p.valores : p.valores ? [p.valores] : [];
  return filas.map((fila) => {
    const conId = { ...fila };
    if (tabla.columnas.id === "text" && (conId.id === undefined || conId.id === null)) conId.id = idNuevo();
    const { columnas, params } = parearValores(p.tabla, tabla, conId);
    if (!columnas.length) throw new ErrorConsulta("No hay valores para insertar");
    const marcas = columnas.map(() => "?").join(", ");
    return {
      sql: `INSERT INTO ${comillas(p.tabla)} (${columnas.map(comillas).join(", ")}) VALUES (${marcas})${p.devolver ? " RETURNING *" : ""}`,
      params,
    };
  });
}

export function armarUpdate(p: Peticion, ahoraIso: string): Sentencia {
  const tabla = tablaDe(p.tabla);
  if (!p.filtros?.length) throw new ErrorConsulta("Un UPDATE necesita al menos un filtro");
  if (!p.valores || Array.isArray(p.valores)) throw new ErrorConsulta("Un UPDATE necesita un objeto de valores");
  if (Object.hasOwn(p.valores, "id")) throw new ErrorConsulta('No se puede cambiar el "id" de una fila');
  const { columnas, params } = parearValores(p.tabla, tabla, p.valores);
  if (tabla.actualizaEn && !columnas.includes(tabla.actualizaEn)) {
    columnas.push(tabla.actualizaEn);
    params.push(ahoraIso);
  }
  if (!columnas.length) throw new ErrorConsulta("No hay valores para actualizar");
  const where = armarWhere(p.tabla, tabla, p.filtros);
  return {
    sql: `UPDATE ${comillas(p.tabla)} SET ${columnas.map((c) => `${comillas(c)} = ?`).join(", ")}${where.sql}${p.devolver ? " RETURNING *" : ""}`,
    params: [...params, ...where.params],
  };
}

export function armarDelete(p: Peticion): Sentencia {
  const tabla = tablaDe(p.tabla);
  if (!p.filtros?.length) throw new ErrorConsulta("Un DELETE necesita al menos un filtro");
  const where = armarWhere(p.tabla, tabla, p.filtros);
  return {
    sql: `DELETE FROM ${comillas(p.tabla)}${where.sql}${p.devolver ? " RETURNING *" : ""}`,
    params: where.params,
  };
}

// ───────────────────────── ejecución ─────────────────────────

const CODIGO_UNICO = "PGRST116";
const MENSAJE_UNICO = "JSON object requested, multiple (or no) rows returned";

function aUnico(filas: Fila[]): Fila {
  if (filas.length !== 1) throw new ErrorConsulta(MENSAJE_UNICO, CODIGO_UNICO, 406);
  return filas[0];
}

/** single() -> exactamente una; maybeSingle() -> una o null; ninguna -> la lista. */
function aForma(p: Peticion, filas: Fila[]): Fila | Fila[] | null {
  if (p.quizas) {
    if (filas.length > 1) throw new ErrorConsulta(MENSAJE_UNICO, CODIGO_UNICO, 406);
    return filas[0] ?? null;
  }
  return p.unico ? aUnico(filas) : filas;
}

async function todas(db: D1Database, s: Sentencia): Promise<Fila[]> {
  const r = await db.prepare(s.sql).bind(...s.params).all<Fila>();
  return r.results ?? [];
}

export async function ejecutar(
  db: D1Database,
  p: Peticion,
  ahoraIso = new Date().toISOString(),
): Promise<Fila | Fila[] | null> {
  const tabla = tablaDe(p.tabla);

  try {
    if (p.op === "select") {
      const s = armarSelect(p);
      const filas = (await todas(db, s)).map((f) => leerFila(tabla, f));

      // Tablas hijas ("activities" -> "activity_materials"): una consulta por hija, atada
      // a las mismas condiciones del padre, para no mandar listas largas de ids.
      for (const hija of p.embeds ?? []) {
        if (!tabla.hijas || !Object.hasOwn(tabla.hijas, hija)) {
          throw new ErrorConsulta(`"${hija}" no es una tabla hija de ${p.tabla}`, "PGRST200");
        }
        const fk = tabla.hijas[hija];
        const tablaHija = tablaDe(hija);
        const where = armarWhere(p.tabla, tabla, p.filtros);
        const hijas = (
          await todas(db, {
            sql: `SELECT * FROM ${comillas(hija)} WHERE ${comillas(fk)} IN (SELECT "id" FROM ${comillas(p.tabla)}${where.sql})`,
            params: where.params,
          })
        ).map((f) => leerFila(tablaHija, f));
        for (const fila of filas) fila[hija] = hijas.filter((h) => h[fk] === fila.id);
      }
      return aForma(p, filas);
    }

    if (p.op === "insert") {
      const sentencias = armarInsert(p);
      if (!sentencias.length) return p.devolver ? aForma(p, []) : null;
      const resultados = await db.batch<Fila>(sentencias.map((s) => db.prepare(s.sql).bind(...s.params)));
      if (!p.devolver) return null;
      const filas = resultados.flatMap((r) => r.results ?? []).map((f) => leerFila(tabla, f));
      return aForma(p, filas);
    }

    if (p.op === "update") {
      const s = armarUpdate(p, ahoraIso);
      if (!p.devolver) {
        await db.prepare(s.sql).bind(...s.params).run();
        return null;
      }
      const filas = (await todas(db, s)).map((f) => leerFila(tabla, f));
      return aForma(p, filas);
    }

    const s = armarDelete(p);
    if (!p.devolver) {
      await db.prepare(s.sql).bind(...s.params).run();
      return null;
    }
    const filas = (await todas(db, s)).map((f) => leerFila(tabla, f));
    return aForma(p, filas);
  } catch (e) {
    if (e instanceof ErrorConsulta) throw e;
    // Errores de la propia base (clave foránea, NOT NULL, etc.): se muestran tal cual,
    // sin el prefijo interno de D1, para que el toast del panel diga algo útil.
    const msg = e instanceof Error ? e.message.replace(/^D1_ERROR:\s*/, "") : "Error en la base de datos";
    throw new ErrorConsulta(msg, "23000", 409);
  }
}
