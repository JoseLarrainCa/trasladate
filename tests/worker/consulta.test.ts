import { describe, expect, it } from "vitest";
import {
  ErrorConsulta,
  armarDelete,
  armarInsert,
  armarSelect,
  armarUpdate,
  deD1,
  paraD1,
  type Peticion,
} from "../../worker/consulta";

const base = (p: Partial<Peticion>): Peticion => ({ tabla: "quotes", op: "select", ...p }) as Peticion;
const falla = (fn: () => unknown) => {
  try {
    fn();
  } catch (e) {
    expect(e).toBeInstanceOf(ErrorConsulta);
    return (e as ErrorConsulta).message;
  }
  throw new Error("Tenía que fallar y no falló");
};

describe("armarSelect", () => {
  it("arma SELECT * con orden y filtros como parámetros", () => {
    const s = armarSelect(
      base({
        tabla: "quote_items",
        filtros: [{ col: "quote_id", val: "abc" }],
        orden: [{ col: "category", asc: true }],
      }),
    );
    expect(s.sql).toBe('SELECT * FROM "quote_items" WHERE "quote_id" = ? ORDER BY "category" ASC');
    expect(s.params).toEqual(["abc"]);
  });

  it("un valor null filtra con IS NULL, no con = ?", () => {
    const s = armarSelect(base({ filtros: [{ col: "cliente_apellido", val: null }] }));
    expect(s.sql).toContain('"cliente_apellido" IS NULL');
    expect(s.params).toEqual([]);
  });

  it("neq arma <> y, con null, IS NOT NULL", () => {
    const s = armarSelect(base({ filtros: [{ col: "id", val: "x", op: "neq" }, { col: "email", val: null, op: "neq" }] }));
    expect(s.sql).toBe('SELECT * FROM "quotes" WHERE "id" <> ? AND "email" IS NOT NULL');
    expect(s.params).toEqual(["x"]);
  });

  it("un valor con comillas SQL viaja como parámetro y no entra al texto de la consulta", () => {
    const s = armarSelect(base({ filtros: [{ col: "cliente_nombre", val: "x' OR '1'='1" }] }));
    expect(s.sql).not.toContain("OR '1'");
    expect(s.params).toEqual(["x' OR '1'='1"]);
  });

  it("rechaza tablas y columnas que no están en la lista", () => {
    expect(falla(() => armarSelect(base({ tabla: "users" })))).toMatch(/no existe/);
    expect(falla(() => armarSelect(base({ tabla: "constructor" })))).toMatch(/no existe/);
    expect(falla(() => armarSelect(base({ columnas: ['id", (SELECT 1) --'] })))).toMatch(/no existe/);
    expect(falla(() => armarSelect(base({ orden: [{ col: "password_hash", asc: true }] })))).toMatch(/no existe/);
  });
});

describe("armarInsert", () => {
  it("genera el id cuando la tabla lo usa y no viene", () => {
    const [s] = armarInsert(base({ op: "insert", tabla: "web_service_texts", valores: { servicios: {} } }), () => "id-fijo");
    expect(s.sql).toBe('INSERT INTO "web_service_texts" ("servicios", "id") VALUES (?, ?)');
    expect(s.params).toEqual(["{}", "id-fijo"]);
  });

  it("respeta el id que manda quien llama (así se conservan los ids al importar)", () => {
    const [s] = armarInsert(base({ op: "insert", tabla: "web_service_texts", valores: { id: "viejo", servicios: {} } }), () => "x");
    expect(s.params).toContain("viejo");
    expect(s.params).not.toContain("x");
  });

  it("booleanos pasan a 0/1 y listas a JSON", () => {
    const [s] = armarInsert(
      base({ op: "insert", tabla: "quote_documents", valores: { folio: 1, sin_iva: false, materiales: ["a", "b"] } }),
      () => "id",
    );
    expect(s.params).toContain(0);
    expect(s.params).toContain('["a","b"]');
  });

  it("devuelve una sentencia por fila", () => {
    const filas = [
      { quote_id: "q", item_key: "a", item_name: "A", category: "C", quantity: 1 },
      { quote_id: "q", item_key: "b", item_name: "B", category: "C", quantity: 2 },
    ];
    expect(armarInsert(base({ op: "insert", tabla: "quote_items", valores: filas }), () => "i")).toHaveLength(2);
  });

  it("rechaza una columna que no existe en vez de ignorarla", () => {
    expect(falla(() => armarInsert(base({ op: "insert", valores: { cliente_nombre: "A", inventada: 1 } })))).toMatch(
      /inventada/,
    );
  });
});

describe("armarUpdate", () => {
  it("quotes renueva updated_at solo; quote_items (que no lo tiene) no", () => {
    const con = armarUpdate(
      base({ op: "update", valores: { estado: "contactado" }, filtros: [{ col: "id", val: "1" }] }),
      "2026-10-11T00:00:00.000Z",
    );
    expect(con.sql).toContain('"updated_at" = ?');
    expect(con.params).toContain("2026-10-11T00:00:00.000Z");
    const sin = armarUpdate(
      base({ op: "update", tabla: "quote_items", valores: { quantity: 2 }, filtros: [{ col: "id", val: "1" }] }),
      "2026-10-11T00:00:00.000Z",
    );
    expect(sin.sql).not.toContain("updated_at");
  });

  it("exige un filtro: un UPDATE sin WHERE tocaría todas las filas", () => {
    expect(falla(() => armarUpdate(base({ op: "update", valores: { estado: "x" } }), "t"))).toMatch(/filtro/);
  });

  it("no deja cambiar el id de una fila", () => {
    expect(
      falla(() => armarUpdate(base({ op: "update", valores: { id: "otro" }, filtros: [{ col: "id", val: "1" }] }), "t")),
    ).toMatch(/id/);
  });
});

describe("armarDelete", () => {
  it("exige un filtro: un DELETE sin WHERE vaciaría la tabla", () => {
    expect(falla(() => armarDelete(base({ op: "delete" })))).toMatch(/filtro/);
  });

  it("arma el DELETE con su condición", () => {
    const s = armarDelete(base({ op: "delete", filtros: [{ col: "id", val: "q1" }] }));
    expect(s.sql).toBe('DELETE FROM "quotes" WHERE "id" = ?');
    expect(s.params).toEqual(["q1"]);
  });
});

describe("conversión de valores", () => {
  it("enteros: acepta números y texto numérico, rechaza decimales y basura (como Postgres)", () => {
    expect(paraD1("int", 5, "c")).toBe(5);
    expect(paraD1("int", "7", "c")).toBe(7);
    expect(() => paraD1("int", 1.5, "c")).toThrow(/entero/);
    expect(() => paraD1("int", "abc", "c")).toThrow(/número/);
    expect(() => paraD1("int", Infinity, "c")).toThrow(/número/);
  });

  it("decimales: acepta 0.5", () => {
    expect(paraD1("real", 0.5, "c")).toBe(0.5);
  });

  it("booleanos: true/false -> 1/0 y de vuelta", () => {
    expect(paraD1("bool", true, "c")).toBe(1);
    expect(paraD1("bool", false, "c")).toBe(0);
    expect(() => paraD1("bool", "si", "c")).toThrow(/verdadero/);
    expect(deD1("bool", 1)).toBe(true);
    expect(deD1("bool", 0)).toBe(false);
  });

  it("JSON: ida y vuelta, y un JSON roto se devuelve tal cual en vez de lanzar", () => {
    expect(JSON.parse(paraD1("json", { a: [1, 2] }, "c") as string)).toEqual({ a: [1, 2] });
    expect(deD1("json", '{"a":1}')).toEqual({ a: 1 });
    expect(deD1("json", "{roto")).toBe("{roto");
  });

  it("null y undefined quedan como NULL", () => {
    expect(paraD1("text", null, "c")).toBeNull();
    expect(paraD1("int", undefined, "c")).toBeNull();
    expect(deD1("bool", null)).toBeNull();
  });
});
