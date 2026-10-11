// Pruebas del Worker completo (Hono + el SQL real de db/migrations sobre node:sqlite).
import { beforeEach, describe, expect, it } from "vitest";
import app, { type Env } from "../../worker/index";
import { hashearClave } from "../../worker/clave";
import { crearD1 } from "./d1-sqlite";

const SECRETO = "s".repeat(64);
const ORIGEN = "https://trasladarte.test";

interface Mundo {
  env: Env;
  llamar: (ruta: string, opts?: { metodo?: string; cuerpo?: unknown; cookie?: string; origen?: string }) => Promise<{
    status: number;
    json: any;
    cookie?: string;
    texto: string;
  }>;
  entrar: (email?: string, clave?: string) => Promise<string>;
  db: (cuerpo: unknown, cookie: string) => ReturnType<Mundo["llamar"]>;
}

async function crearMundo(secreto: string | null = SECRETO): Promise<Mundo> {
  const DB = crearD1(["db/migrations/0001_esquema.sql"]);
  await DB.prepare("INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, 'admin')")
    .bind("u-admin", "admin@trasladarte.test", await hashearClave("clave-admin-1"))
    .run();
  await DB.prepare("INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, 'user')")
    .bind("u-user", "sin-permiso@trasladarte.test", await hashearClave("clave-user-1"))
    .run();
  const env = { DB, SESSION_SECRET: secreto ?? undefined, ASSETS: { fetch: async () => new Response('<div id="root"></div>') } } as unknown as Env;

  const llamar: Mundo["llamar"] = async (ruta, { metodo, cuerpo, cookie, origen } = {}) => {
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (cookie) headers.cookie = cookie;
    if (origen) headers.origin = origen;
    const res = await app.request(
      `${ORIGEN}${ruta}`,
      { method: metodo ?? (cuerpo ? "POST" : "GET"), headers, body: cuerpo ? JSON.stringify(cuerpo) : undefined },
      env,
    );
    const texto = await res.text();
    let json: any = null;
    try {
      json = JSON.parse(texto);
    } catch {
      /* no era JSON */
    }
    return { status: res.status, json, texto, cookie: res.headers.get("set-cookie")?.split(";")[0] };
  };
  const entrar: Mundo["entrar"] = async (email = "admin@trasladarte.test", clave = "clave-admin-1") => {
    const r = await llamar("/api/auth/login", { cuerpo: { email, password: clave } });
    expect(r.status).toBe(200);
    return r.cookie!;
  };
  return { env, llamar, entrar, db: (cuerpo, cookie) => llamar("/api/db", { cuerpo, cookie }) };
}

let m: Mundo;
beforeEach(async () => {
  m = await crearMundo();
});

describe("acceso", () => {
  it("sin sesión, /api/db y /api/auth/me responden 401", async () => {
    expect((await m.db({ tabla: "quotes", op: "select" }, "")).status).toBe(401);
    expect((await m.llamar("/api/auth/me")).status).toBe(401);
  });

  it("una cookie inventada o firmada con otro secreto no abre nada", async () => {
    const r = await m.db({ tabla: "quotes", op: "select" }, "trasladarte_sesion=u-admin.9999999999999.firmafalsa");
    expect(r.status).toBe(401);
  });

  it("login correcto deja cookie HttpOnly y me() responde con el usuario (correo en otras mayúsculas)", async () => {
    const r = await m.llamar("/api/auth/login", { cuerpo: { email: " ADMIN@Trasladarte.test ", password: "clave-admin-1" } });
    expect(r.status).toBe(200);
    const me = await m.llamar("/api/auth/me", { cookie: r.cookie });
    expect(me.json.user).toMatchObject({ email: "admin@trasladarte.test", role: "admin" });
  });

  it("clave mala y correo inexistente dan el mismo mensaje (no delatan qué correos existen)", async () => {
    const a = await m.llamar("/api/auth/login", { cuerpo: { email: "admin@trasladarte.test", password: "mala-mala-1" } });
    const b = await m.llamar("/api/auth/login", { cuerpo: { email: "nadie@trasladarte.test", password: "mala-mala-1" } });
    expect(a.status).toBe(401);
    expect(b.status).toBe(401);
    expect(a.json.error).toBe(b.json.error);
    expect(a.cookie).toBeUndefined();
  });

  it("al sexto intento fallido seguido de un correo, lo bloquea con 429 (y no afecta a otro correo)", async () => {
    let r;
    for (let i = 0; i < 6; i++) {
      r = await m.llamar("/api/auth/login", { cuerpo: { email: "admin@trasladarte.test", password: `mala-${i}-xx` } });
    }
    expect(r!.status).toBe(429);
    // Estando bloqueado, ni la clave buena pasa.
    expect((await m.llamar("/api/auth/login", { cuerpo: { email: "admin@trasladarte.test", password: "clave-admin-1" } })).status).toBe(429);
    expect((await m.llamar("/api/auth/login", { cuerpo: { email: "sin-permiso@trasladarte.test", password: "clave-user-1" } })).status).toBe(200);
  });

  it("un login bueno borra los intentos fallidos anteriores", async () => {
    for (let i = 0; i < 3; i++) await m.llamar("/api/auth/login", { cuerpo: { email: "admin@trasladarte.test", password: `mala-${i}-xx` } });
    await m.entrar();
    for (let i = 0; i < 4; i++) {
      const r = await m.llamar("/api/auth/login", { cuerpo: { email: "admin@trasladarte.test", password: `mala-${i}-yy` } });
      expect(r.status).toBe(401);
    }
  });

  it("un usuario con rol 'user' entra, pero no toca los datos del panel (403)", async () => {
    const cookie = await m.entrar("sin-permiso@trasladarte.test", "clave-user-1");
    expect((await m.db({ tabla: "quotes", op: "select" }, cookie)).status).toBe(403);
  });

  it("borrar al usuario corta su acceso al tiro, aunque su cookie no haya vencido", async () => {
    const cookie = await m.entrar();
    expect((await m.db({ tabla: "quotes", op: "select" }, cookie)).status).toBe(200);
    await m.env.DB.prepare("DELETE FROM users WHERE id = 'u-admin'").run();
    expect((await m.db({ tabla: "quotes", op: "select" }, cookie)).status).toBe(401);
  });

  it("una petición POST desde otro sitio (Origin ajeno) se rechaza con 403", async () => {
    const cookie = await m.entrar();
    const r = await m.llamar("/api/db", { cuerpo: { tabla: "quotes", op: "select" }, cookie, origen: "https://malo.example" });
    expect(r.status).toBe(403);
    const l = await m.llamar("/api/auth/login", { cuerpo: { email: "admin@trasladarte.test", password: "clave-admin-1" }, origen: "https://malo.example" });
    expect(l.status).toBe(403);
  });

  it("sin SESSION_SECRET el login no funciona (falla cerrado, 503)", async () => {
    const sinSecreto = await crearMundo(null);
    const r = await sinSecreto.llamar("/api/auth/login", { cuerpo: { email: "admin@trasladarte.test", password: "clave-admin-1" } });
    expect(r.status).toBe(503);
  });

  it("logout borra la cookie", async () => {
    const r = await m.llamar("/api/auth/logout", { metodo: "POST" });
    expect(r.status).toBe(200);
  });
});

describe("rutas", () => {
  it("lo que no es /api va a los assets (la SPA) y /api desconocida responde 404 JSON", async () => {
    const spa = await m.llamar("/admin/formularios");
    expect(spa.status).toBe(200);
    expect(spa.texto).toContain('id="root"');
    const api = await m.llamar("/api/no-existe");
    expect(api.status).toBe(404);
    expect(api.json.error).toBeTruthy();
  });
});

describe("cabeceras", () => {
  const cabecera = async (url: string, nombre: string) => (await app.request(url, {}, m.env)).headers.get(nombre);

  it("toda respuesta lleva nosniff, política de referrer y X-Frame-Options", async () => {
    for (const ruta of ["/", "/admin", "/api/salud", "/api/no-existe"]) {
      expect(await cabecera(`${ORIGEN}${ruta}`, "X-Content-Type-Options")).toBe("nosniff");
      expect(await cabecera(`${ORIGEN}${ruta}`, "Referrer-Policy")).toBe("strict-origin-when-cross-origin");
      expect(await cabecera(`${ORIGEN}${ruta}`, "X-Frame-Options")).toBe("SAMEORIGIN");
    }
  });

  it("la portada bajo el dominio propio SÍ se puede indexar; el panel, el login y la API, nunca", async () => {
    expect(await cabecera(`${ORIGEN}/`, "X-Robots-Tag")).toBeNull();
    expect(await cabecera(`${ORIGEN}/admin/formularios`, "X-Robots-Tag")).toMatch(/noindex/);
    expect(await cabecera(`${ORIGEN}/login`, "X-Robots-Tag")).toMatch(/noindex/);
    expect(await cabecera(`${ORIGEN}/api/salud`, "X-Robots-Tag")).toMatch(/noindex/);
  });

  it("el respaldo *.workers.dev nunca se indexa, ni siquiera la portada", async () => {
    expect(await cabecera("https://trasladarte.omnis-apps.workers.dev/", "X-Robots-Tag")).toMatch(/noindex/);
  });

  it("la API no se guarda en caché", async () => {
    expect(await cabecera(`${ORIGEN}/api/salud`, "Cache-Control")).toBe("no-store");
  });
});

const cotizacionBuena = () => ({
  quote: {
    cliente_nombre: "Rodrigo",
    cliente_apellido: "Castro",
    telefono: "+56 9 1234 5678",
    email: "rodrigo@ejemplo.cl",
    origen_direccion: "Av. Irarrázaval 1000",
    origen_comuna: "Ñuñoa",
    origen_tipo_vivienda: "departamento",
    origen_tiene_ascensor: true,
    origen_piso: 5,
    destino_direccion: "Av. Providencia 2000",
    destino_comuna: "Providencia",
    destino_tipo_vivienda: "departamento",
    destino_tiene_ascensor: false,
    destino_piso: null,
    tipo_mudanza: "hogar",
    fecha_traslado: "2026-11-20",
    fecha_indefinida: false,
    sugerencia_adicional: "Tipo de servicio: Express",
  },
  items: [
    { item_key: "living_sofa_3_cuerpos", item_name: "Sofá de 3 cuerpos", category: "LIVING", quantity: 1 },
    { item_key: "cajas_medianas", item_name: "Cajas medianas", category: "CAJAS", quantity: 20 },
  ],
  resumen: "DATOS DEL CLIENTE:\nCliente: Rodrigo Castro",
});

describe("POST /api/cotizacion (el formulario público)", () => {
  it("guarda la cotización con sus ítems, sin sesión, en estado pendiente", async () => {
    const r = await m.llamar("/api/cotizacion", { cuerpo: cotizacionBuena() });
    expect(r.status).toBe(200);
    expect(r.json.ok).toBe(true);
    const cookie = await m.entrar();
    const q = await m.db({ tabla: "quotes", op: "select", filtros: [{ col: "id", val: r.json.id }], embeds: ["quote_items"], unico: true }, cookie);
    expect(q.json.data).toMatchObject({ cliente_nombre: "Rodrigo", estado: "pendiente", origen_tiene_ascensor: true, destino_tiene_ascensor: false, origen_piso: 5 });
    expect(q.json.data.quote_items.map((i: any) => i.quantity).sort((a: number, b: number) => a - b)).toEqual([1, 20]);
  });

  it("el visitante no puede elegir el estado, las notas internas ni el id", async () => {
    const c = cotizacionBuena();
    (c.quote as any).estado = "confirmado";
    (c.quote as any).notas_internas = "pagado";
    (c.quote as any).id = "id-elegido";
    const r = await m.llamar("/api/cotizacion", { cuerpo: c });
    expect(r.status).toBe(200);
    expect(r.json.id).not.toBe("id-elegido");
    const cookie = await m.entrar();
    const q = await m.db({ tabla: "quotes", op: "select", filtros: [{ col: "id", val: r.json.id }], unico: true }, cookie);
    expect(q.json.data.estado).toBe("pendiente");
    expect(q.json.data.notas_internas).toBeNull();
  });

  it("sin correo, sin teléfono o sin destino se rechaza y no guarda nada", async () => {
    for (const campo of ["email", "telefono", "destino_comuna"]) {
      const c = cotizacionBuena();
      (c.quote as any)[campo] = "";
      const r = await m.llamar("/api/cotizacion", { cuerpo: c });
      expect(r.status).toBe(400);
    }
    const cookie = await m.entrar();
    expect((await m.db({ tabla: "quotes", op: "select" }, cookie)).json.data).toHaveLength(0);
  });

  it("un ítem con cantidad cero tumba la solicitud entera (no queda una cotización a medias)", async () => {
    const c = cotizacionBuena();
    c.items[1].quantity = 0;
    expect((await m.llamar("/api/cotizacion", { cuerpo: c })).status).toBe(400);
    const cookie = await m.entrar();
    expect((await m.db({ tabla: "quotes", op: "select" }, cookie)).json.data).toHaveLength(0);
  });

  it("un ítem repetido se guarda una sola vez (en Supabase tumbaba el insert)", async () => {
    const c = cotizacionBuena();
    c.items.push({ ...c.items[0] });
    const r = await m.llamar("/api/cotizacion", { cuerpo: c });
    expect(r.status).toBe(200);
    const cookie = await m.entrar();
    const items = await m.db({ tabla: "quote_items", op: "select", filtros: [{ col: "quote_id", val: r.json.id }] }, cookie);
    expect(items.json.data).toHaveLength(2);
  });

  it("desde otro sitio se rechaza; el campo trampa responde ok sin guardar", async () => {
    expect((await m.llamar("/api/cotizacion", { cuerpo: cotizacionBuena(), origen: "https://malo.example" })).status).toBe(403);
    const trampa = await m.llamar("/api/cotizacion", { cuerpo: { ...cotizacionBuena(), website: "spam" } });
    expect(trampa.status).toBe(200);
    const cookie = await m.entrar();
    expect((await m.db({ tabla: "quotes", op: "select" }, cookie)).json.data).toHaveLength(0);
  });
});

describe("GET /api/servicios (textos de la página)", () => {
  it("devuelve lo que Marco guardó en el panel, sin sesión", async () => {
    expect((await m.llamar("/api/servicios")).json.servicios).toEqual({});
    const cookie = await m.entrar();
    await m.db({ tabla: "web_service_texts", op: "update", valores: { servicios: { express: { titulo: "Express" } } }, filtros: [{ col: "id", val: "servicios" }] }, cookie);
    expect((await m.llamar("/api/servicios")).json.servicios.express.titulo).toBe("Express");
  });
});

describe("POST /api/auth/clave", () => {
  it("cambia la clave solo si la actual es correcta", async () => {
    const cookie = await m.entrar();
    const mala = await m.llamar("/api/auth/clave", { cuerpo: { actual: "no-es", nueva: "nueva-clave-1" }, cookie });
    expect(mala.status).toBe(400);
    const buena = await m.llamar("/api/auth/clave", { cuerpo: { actual: "clave-admin-1", nueva: "nueva-clave-1" }, cookie });
    expect(buena.status).toBe(200);
    expect((await m.llamar("/api/auth/login", { cuerpo: { email: "admin@trasladarte.test", password: "clave-admin-1" } })).status).toBe(401);
    expect((await m.llamar("/api/auth/login", { cuerpo: { email: "admin@trasladarte.test", password: "nueva-clave-1" } })).status).toBe(200);
  });

  it("sin sesión responde 401", async () => {
    expect((await m.llamar("/api/auth/clave", { cuerpo: { actual: "x", nueva: "yyyyyyyy" } })).status).toBe(401);
  });
});

describe("datos del panel", () => {
  it("los ajustes vienen en una sola fila: maybeSingle la trae con JSON y listas parseadas", async () => {
    const cookie = await m.entrar();
    const r = await m.db({ tabla: "quote_settings", op: "select", quizas: true }, cookie);
    expect(r.json.data.siguiente_folio).toBe(3286);
    expect(r.json.data.tarifas).toEqual({});
    expect(r.json.data.materiales).toEqual([]);
  });

  it("maybeSingle sin filas devuelve null (no error); single sin filas da PGRST116", async () => {
    const cookie = await m.entrar();
    const nada = await m.db({ tabla: "quote_documents", op: "select", filtros: [{ col: "quote_id", val: "no-hay" }], quizas: true }, cookie);
    expect(nada.status).toBe(200);
    expect(nada.json.data).toBeNull();
    const uno = await m.db({ tabla: "quote_documents", op: "select", filtros: [{ col: "quote_id", val: "no-hay" }], unico: true }, cookie);
    expect(uno.status).toBe(406);
    expect(uno.json.error.code).toBe("PGRST116");
  });

  it("guardar una cotización en PDF sube el folio con neq (como lo hacía el panel)", async () => {
    const cookie = await m.entrar();
    const doc = await m.db(
      { tabla: "quote_documents", op: "insert", devolver: true, unico: true, valores: { folio: 3286, cliente: { nombre: "Ana" }, materiales: ["Cajas"], con_galeria: true, inventario_override: [{ k: "sofa", q: 1 }] } },
      cookie,
    );
    expect(doc.json.data.id).toBeTruthy();
    expect(doc.json.data.cliente.nombre).toBe("Ana");
    expect(doc.json.data.con_galeria).toBe(true);
    await m.db({ tabla: "quote_settings", op: "update", valores: { siguiente_folio: 3287 }, filtros: [{ col: "id", val: "00000000-0000-0000-0000-000000000000", op: "neq" }] }, cookie);
    const s = await m.db({ tabla: "quote_settings", op: "select", quizas: true }, cookie);
    expect(s.json.data.siguiente_folio).toBe(3287);
  });

  it("borrar una solicitud se lleva sus ítems y deja su PDF sin solicitud (como en Supabase)", async () => {
    const r = await m.llamar("/api/cotizacion", { cuerpo: cotizacionBuena() });
    const cookie = await m.entrar();
    await m.db({ tabla: "quote_documents", op: "insert", valores: { quote_id: r.json.id, folio: 1 } }, cookie);
    await m.db({ tabla: "quotes", op: "delete", filtros: [{ col: "id", val: r.json.id }] }, cookie);
    expect((await m.db({ tabla: "quote_items", op: "select" }, cookie)).json.data).toHaveLength(0);
    const docs = await m.db({ tabla: "quote_documents", op: "select" }, cookie);
    expect(docs.json.data).toHaveLength(1);
    expect(docs.json.data[0].quote_id).toBeNull();
  });

  it("cambiar el estado de una solicitud actualiza updated_at", async () => {
    const r = await m.llamar("/api/cotizacion", { cuerpo: cotizacionBuena() });
    const cookie = await m.entrar();
    const antes = (await m.db({ tabla: "quotes", op: "select", filtros: [{ col: "id", val: r.json.id }], unico: true }, cookie)).json.data;
    await new Promise((ok) => setTimeout(ok, 5));
    await m.db({ tabla: "quotes", op: "update", valores: { estado: "contactado" }, filtros: [{ col: "id", val: r.json.id }] }, cookie);
    const despues = (await m.db({ tabla: "quotes", op: "select", filtros: [{ col: "id", val: r.json.id }], unico: true }, cookie)).json.data;
    expect(despues.estado).toBe("contactado");
    expect(despues.updated_at > antes.updated_at).toBe(true);
  });

  it("un estado que no existe lo rechaza la base", async () => {
    const r = await m.llamar("/api/cotizacion", { cuerpo: cotizacionBuena() });
    const cookie = await m.entrar();
    const mal = await m.db({ tabla: "quotes", op: "update", valores: { estado: "inventado" }, filtros: [{ col: "id", val: r.json.id }] }, cookie);
    expect(mal.status).toBe(409);
  });
});

describe("lo que /api/db nunca debe hacer", () => {
  it("la tabla de usuarios no se puede leer ni escribir desde el panel", async () => {
    const cookie = await m.entrar();
    for (const op of ["select", "insert", "update", "delete"]) {
      const r = await m.db({ tabla: "users", op, valores: { email: "x@x.cl" }, filtros: [{ col: "id", val: "u-admin" }] }, cookie);
      expect(r.status).toBe(400);
    }
    const hashes = await m.db({ tabla: "quotes", op: "select", columnas: ["password_hash"] }, cookie);
    expect(hashes.status).toBe(400);
  });

  it("DELETE y UPDATE sin filtro se rechazan y no tocan nada", async () => {
    await m.llamar("/api/cotizacion", { cuerpo: cotizacionBuena() });
    const cookie = await m.entrar();
    expect((await m.db({ tabla: "quotes", op: "delete" }, cookie)).status).toBe(400);
    expect((await m.db({ tabla: "quotes", op: "update", valores: { estado: "cancelado" } }, cookie)).status).toBe(400);
    const todo = await m.db({ tabla: "quotes", op: "select" }, cookie);
    expect(todo.json.data).toHaveLength(1);
    expect(todo.json.data[0].estado).toBe("pendiente");
  });

  it("SQL inyectado en una columna o en un valor no hace nada raro", async () => {
    const cookie = await m.entrar();
    expect((await m.db({ tabla: "quotes", op: "select", columnas: ["id; DROP TABLE quotes"] }, cookie)).status).toBe(400);
    const r = await m.db({ tabla: "quotes", op: "select", filtros: [{ col: "cliente_nombre", val: "x' OR '1'='1" }] }, cookie);
    expect(r.json.data).toEqual([]);
  });

  it("una petición mal formada responde 400 y no revienta", async () => {
    const cookie = await m.entrar();
    expect((await m.db({ tabla: "quotes" }, cookie)).status).toBe(400);
    expect((await m.db({ tabla: "quotes", op: "borrar-todo" }, cookie)).status).toBe(400);
    expect((await m.db("no es un objeto", cookie)).status).toBe(400);
  });
});

describe("video de la galería en iPhone", () => {
  it("un .mp4 pedido por rango responde 206 con el trozo justo", async () => {
    const bytes = new Uint8Array(1000).map((_, i) => i % 256);
    const env = { ...m.env, ASSETS: { fetch: async () => new Response(bytes, { status: 200, headers: { "content-type": "video/mp4" } }) } } as unknown as Env;
    const r = await app.request(`${ORIGEN}/gallery/video3.mp4`, { headers: { range: "bytes=0-99" } }, env);
    expect(r.status).toBe(206);
    expect(r.headers.get("content-range")).toBe("bytes 0-99/1000");
    expect((await r.arrayBuffer()).byteLength).toBe(100);
    const fuera = await app.request(`${ORIGEN}/gallery/video3.mp4`, { headers: { range: "bytes=5000-" } }, env);
    expect(fuera.status).toBe(416);
    const entero = await app.request(`${ORIGEN}/gallery/video3.mp4`, {}, env);
    expect(entero.status).toBe(200);
  });
});
