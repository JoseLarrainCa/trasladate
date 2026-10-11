// Worker de Trasladarte: sirve la página (assets compilados por Vite) y expone la API
// del panel y del cotizador sobre D1. Reemplaza a Supabase (base + login).
//
//   /api/auth/login   POST  correo + clave -> cookie de sesión
//   /api/auth/logout  POST  borra la cookie
//   /api/auth/me      GET   quién es el usuario de la cookie
//   /api/auth/clave   POST  cambia la clave (pide la actual)
//   /api/db           POST  consultas del panel (ver ./consulta.ts) — solo admin
//   /api/cotizacion   POST  la solicitud que deja un visitante (ver ./cotizacion.ts) — pública
//   /api/servicios    GET   los textos de servicios que muestra la página — pública
//   /api/lead         POST  el formulario corto de contacto — público
//   /api/salud        GET   {ok:true}
//   todo lo demás     -> assets (la SPA; cualquier ruta sin archivo devuelve index.html)

import { Hono } from "hono";
import type { Context } from "hono";
import { esClaveHeredada, gastarTiempoDeVerificacion, hashearClave, verificarClave } from "./clave";
import { crearCotizacion } from "./cotizacion";
import { ErrorConsulta, PeticionSchema, ejecutar } from "./consulta";
import { respuestaCanonica } from "../src/lib/host-canonico";
import { atenderAvisoDeLead } from "./lead/ruta-lead";
import { COOKIE_SESION, cookieBorrada, cookieSesion, crearToken, idDelToken, leerCookie } from "./sesion";

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  /** Llave de las cookies de sesión. `wrangler secret put SESSION_SECRET`. */
  SESSION_SECRET?: string;
  /** Base compartida de leads de toda la flota (binding `leads_flota`). */
  leads_flota?: D1Database;
  /** Llave de Resend (`wrangler secret put RESEND_API_KEY`). */
  RESEND_API_KEY?: string;
  /** Casillas que reciben el aviso, separadas por coma. Sin esto va solo a jose@try-omnis.cl. */
  MAIL_TO?: string;
}

type Ctx = Context<{ Bindings: Env }>;

interface Usuario {
  id: string;
  email: string;
  role: "admin" | "user";
}

const MAX_INTENTOS = 5;
const VENTANA_INTENTOS_MS = 15 * 60 * 1000;
const MAX_BYTES_CUERPO = 1_000_000;

const app = new Hono<{ Bindings: Env }>();

// El www y el http redirigen con 301 al dominio canónico (si no, Google ve dos sitios iguales).
app.use("*", async (c, next) => {
  const redireccion = respuestaCanonica(c.req.raw);
  if (redireccion) return redireccion;
  await next();
});

// Cabeceras para todas las respuestas, incluidas las de la página (assets).
//  · La dirección *.workers.dev es el respaldo, no el sitio: nunca se indexa. Así la copia
//    no compite en Google con el dominio del cliente.
//  · El panel, el login y la API son internos: nunca se indexan, ni siquiera bajo el dominio propio.
app.use("*", async (c, next) => {
  await next();
  const url = new URL(c.req.url);
  const interno =
    url.pathname.startsWith("/admin") || url.pathname.startsWith("/login") || url.pathname.startsWith("/api/");
  // La respuesta de los assets trae cabeceras de solo lectura: se copia antes de tocarla.
  const res = new Response(c.res.body, c.res);
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-Frame-Options", "SAMEORIGIN");
  if (interno || url.hostname.endsWith(".workers.dev")) res.headers.set("X-Robots-Tag", "noindex, nofollow");
  c.res = res;
});

// Nada de la API se guarda en caché del navegador ni del borde.
app.use("/api/*", async (c, next) => {
  await next();
  c.header("Cache-Control", "no-store");
});

/** Una petición que cambia datos tiene que venir de esta misma página. */
function mismoOrigen(c: Ctx): boolean {
  const origen = c.req.header("origin");
  if (!origen) return true; // herramientas que no son un navegador (curl, tests)
  try {
    return new URL(origen).host === new URL(c.req.url).host;
  } catch {
    return false;
  }
}

async function leerJson(c: Ctx): Promise<unknown | null> {
  const largo = Number(c.req.header("content-length") ?? 0);
  if (largo > MAX_BYTES_CUERPO) return null;
  try {
    return await c.req.json();
  } catch {
    return null;
  }
}

async function usuarioDeLaSesion(c: Ctx): Promise<Usuario | null> {
  const token = leerCookie(c.req.header("cookie"), COOKIE_SESION);
  const id = await idDelToken(c.env.SESSION_SECRET, token);
  if (!id) return null;
  const fila = await c.env.DB.prepare("SELECT id, email, role FROM users WHERE id = ?")
    .bind(id)
    .first<Usuario>();
  return fila ?? null;
}

app.all("/api/lead", async (c) => (await atenderAvisoDeLead(c.req.raw, c.env)) ?? c.json({ error: "No existe" }, 404));

app.get("/api/salud", (c) => c.json({ ok: true }));

app.post("/api/cotizacion", async (c) => {
  if (!mismoOrigen(c)) return c.json({ ok: false, motivo: "Origen no permitido" }, 403);
  const cuerpo = await leerJson(c);
  // Trampa para robots: un campo escondido que una persona nunca llena.
  if (cuerpo && typeof (cuerpo as { website?: unknown }).website === "string" && (cuerpo as { website: string }).website.trim()) {
    return c.json({ ok: true, id: null });
  }
  const r = await crearCotizacion(c.env, cuerpo);
  if (!r.ok) return c.json({ ok: false, motivo: r.motivo }, r.status);
  return c.json({ ok: true, id: r.id });
});

// Los textos de servicios los edita Marco en el panel y los lee la página sin sesión.
app.get("/api/servicios", async (c) => {
  const fila = await c.env.DB.prepare("SELECT servicios FROM web_service_texts LIMIT 1").first<{ servicios: string }>();
  let servicios: unknown = {};
  try {
    servicios = fila ? JSON.parse(fila.servicios) : {};
  } catch {
    servicios = {};
  }
  return c.json({ servicios });
});

app.post("/api/auth/login", async (c) => {
  if (!c.env.SESSION_SECRET) return c.json({ error: "El acceso no está configurado" }, 503);
  if (!mismoOrigen(c)) return c.json({ error: "Origen no permitido" }, 403);

  const cuerpo = (await leerJson(c)) as { email?: unknown; password?: unknown } | null;
  const email = typeof cuerpo?.email === "string" ? cuerpo.email.trim().toLowerCase() : "";
  const password = typeof cuerpo?.password === "string" ? cuerpo.password : "";
  if (!email || !password || email.length > 200 || password.length > 200) {
    return c.json({ error: "Escribe tu correo y tu clave" }, 400);
  }

  const ahora = Date.now();
  const recientes = await c.env.DB.prepare("SELECT COUNT(*) AS n FROM login_attempts WHERE email = ? AND at > ?")
    .bind(email, ahora - VENTANA_INTENTOS_MS)
    .first<{ n: number }>();
  if ((recientes?.n ?? 0) >= MAX_INTENTOS) {
    return c.json({ error: "Demasiados intentos. Espera 15 minutos y vuelve a probar." }, 429);
  }

  const usuario = await c.env.DB.prepare("SELECT id, email, role, password_hash FROM users WHERE email = ?")
    .bind(email)
    .first<Usuario & { password_hash: string }>();

  let ok = false;
  if (usuario) ok = await verificarClave(password, usuario.password_hash);
  else await gastarTiempoDeVerificacion(password);

  if (!ok || !usuario) {
    await c.env.DB.batch([
      c.env.DB.prepare("INSERT INTO login_attempts (email, at) VALUES (?, ?)").bind(email, ahora),
      c.env.DB.prepare("DELETE FROM login_attempts WHERE at < ?").bind(ahora - 24 * 60 * 60 * 1000),
    ]);
    return c.json({ error: "Correo o clave incorrectos" }, 401);
  }

  await c.env.DB.prepare("DELETE FROM login_attempts WHERE email = ?").bind(email).run();
  // La clave que venía de Supabase (bcrypt) se pasa a PBKDF2 ahora que la tenemos en la mano.
  if (esClaveHeredada(usuario.password_hash)) {
    await c.env.DB.prepare("UPDATE users SET password_hash = ? WHERE id = ?")
      .bind(await hashearClave(password), usuario.id)
      .run();
  }
  const token = await crearToken(c.env.SESSION_SECRET, usuario.id);
  c.header("Set-Cookie", cookieSesion(token));
  return c.json({ user: { id: usuario.id, email: usuario.email, role: usuario.role } });
});

app.post("/api/auth/logout", (c) => {
  c.header("Set-Cookie", cookieBorrada());
  return c.json({ ok: true });
});

app.post("/api/auth/clave", async (c) => {
  if (!mismoOrigen(c)) return c.json({ error: "Origen no permitido" }, 403);
  const usuario = await usuarioDeLaSesion(c);
  if (!usuario) return c.json({ error: "Tu sesión venció. Entra de nuevo." }, 401);

  const cuerpo = (await leerJson(c)) as { actual?: unknown; nueva?: unknown } | null;
  const actual = typeof cuerpo?.actual === "string" ? cuerpo.actual : "";
  const nueva = typeof cuerpo?.nueva === "string" ? cuerpo.nueva : "";
  if (nueva.length < 6 || nueva.length > 200) return c.json({ error: "La clave nueva tiene que tener al menos 6 caracteres" }, 400);

  const fila = await c.env.DB.prepare("SELECT password_hash FROM users WHERE id = ?")
    .bind(usuario.id)
    .first<{ password_hash: string }>();
  if (!fila || !(await verificarClave(actual, fila.password_hash))) {
    return c.json({ error: "La clave actual no es correcta" }, 400);
  }
  await c.env.DB.prepare("UPDATE users SET password_hash = ? WHERE id = ?")
    .bind(await hashearClave(nueva), usuario.id)
    .run();
  return c.json({ ok: true });
});

app.get("/api/auth/me", async (c) => {
  const usuario = await usuarioDeLaSesion(c);
  if (!usuario) return c.json({ user: null }, 401);
  return c.json({ user: usuario });
});

app.post("/api/db", async (c) => {
  if (!mismoOrigen(c)) return c.json({ data: null, error: { message: "Origen no permitido" } }, 403);

  const usuario = await usuarioDeLaSesion(c);
  if (!usuario) return c.json({ data: null, error: { message: "Tu sesión venció. Entra de nuevo." } }, 401);
  // Igual que las políticas de Supabase: solo el rol admin toca los datos del panel.
  if (usuario.role !== "admin") return c.json({ data: null, error: { message: "No tienes permiso" } }, 403);

  const cuerpo = await leerJson(c);
  const peticion = PeticionSchema.safeParse(cuerpo);
  if (!peticion.success) {
    return c.json({ data: null, error: { message: "Petición inválida", code: "ERR_PETICION" } }, 400);
  }

  try {
    const data = await ejecutar(c.env.DB, peticion.data);
    return c.json({ data, error: null });
  } catch (e) {
    if (e instanceof ErrorConsulta) {
      return c.json({ data: null, error: { message: e.message, code: e.code } }, e.status as 400);
    }
    console.error("db", e);
    return c.json({ data: null, error: { message: "Error interno" } }, 500);
  }
});

app.all("/api/*", (c) => c.json({ error: "No existe" }, 404));

/**
 * El asset store ignora `Range` y devuelve el archivo entero con 200. Safari en iPhone exige
 * 206 para reproducir un video, así que el video de la galería quedaba muerto en el celular.
 * Acá se corta el trozo pedido (medido en Pro Parcelas, 2026-09-23).
 */
export async function conRango(peticion: Request, respuesta: Response): Promise<Response> {
  const rango = peticion.headers.get("range");
  const m = rango?.match(/^bytes=(\d*)-(\d*)$/);
  if (!m || respuesta.status !== 200 || (!m[1] && !m[2])) return respuesta;

  const cuerpo = await respuesta.arrayBuffer();
  const total = cuerpo.byteLength;
  let inicio = m[1] ? Number(m[1]) : Math.max(0, total - Number(m[2]));
  let fin = m[1] && m[2] ? Math.min(Number(m[2]), total - 1) : total - 1;
  if (!m[1]) fin = total - 1;
  if (inicio >= total || inicio > fin) {
    return new Response(null, { status: 416, headers: { "content-range": `bytes */${total}` } });
  }
  inicio = Math.max(0, inicio);
  const headers = new Headers(respuesta.headers);
  headers.set("content-range", `bytes ${inicio}-${fin}/${total}`);
  headers.set("content-length", String(fin - inicio + 1));
  headers.set("accept-ranges", "bytes");
  return new Response(cuerpo.slice(inicio, fin + 1), { status: 206, headers });
}

// Todo lo demás es la página.
app.all("*", async (c) => {
  const respuesta = await c.env.ASSETS.fetch(c.req.raw);
  if (new URL(c.req.url).pathname.endsWith(".mp4")) return conRango(c.req.raw, respuesta);
  return respuesta;
});

export default app;
