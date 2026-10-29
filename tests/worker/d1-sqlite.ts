// Una D1 de mentira hecha con node:sqlite, para probar el Worker de verdad (con el SQL real
// de db/migrations) sin levantar wrangler. Solo implementa lo que usa el Worker:
// prepare().bind().all() / .first() / .run() y batch().
//
// Ojo con lo que esto NO prueba: el motor es el SQLite de Node, no el de Cloudflare, así
// que no cubre límites propios de D1 (p. ej. 100 parámetros por consulta). Eso se mira
// con `wrangler dev --local` o contra el Worker desplegado.

import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { join } from "node:path";

type Param = string | number | null;

class Sentencia {
  private params: Param[] = [];
  constructor(
    private db: DatabaseSync,
    private sql: string,
  ) {}

  bind(...params: Param[]) {
    this.params = params;
    return this;
  }

  async all<T>() {
    const filas = this.db.prepare(this.sql).all(...this.params) as T[];
    return { results: filas, success: true, meta: {} };
  }

  async first<T>() {
    const fila = this.db.prepare(this.sql).get(...this.params) as T | undefined;
    return fila ?? null;
  }

  async run() {
    this.db.prepare(this.sql).run(...this.params);
    return { success: true, meta: {} };
  }

  /** Para batch(): devuelve las filas si la sentencia tiene RETURNING o es un SELECT. */
  ejecutarEnBatch() {
    const stmt = this.db.prepare(this.sql);
    const devuelve = /\bRETURNING\b/i.test(this.sql) || /^\s*SELECT\b/i.test(this.sql);
    if (devuelve) return { results: stmt.all(...this.params), success: true, meta: {} };
    stmt.run(...this.params);
    return { results: [], success: true, meta: {} };
  }
}

export function crearD1(migraciones = ["db/migrations/0001_esquema.sql", "db/migrations/0002_contactos.sql"], semillas: string[] = []) {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = ON");
  for (const ruta of [...migraciones, ...semillas]) {
    db.exec(readFileSync(join(process.cwd(), ruta), "utf8"));
  }
  return {
    prepare: (sql: string) => new Sentencia(db, sql),
    async batch(sentencias: Sentencia[]) {
      db.exec("BEGIN");
      try {
        const salida = sentencias.map((s) => s.ejecutarEnBatch());
        db.exec("COMMIT");
        return salida;
      } catch (e) {
        db.exec("ROLLBACK");
        throw e;
      }
    },
  } as unknown as D1Database;
}
