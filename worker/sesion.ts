// Sesión del panel: una cookie firmada con HMAC-SHA256.
//
// El token es `<idUsuario>.<vencimiento>.<firma>`. La llave de la firma es el secreto
// `SESSION_SECRET` del Worker (se carga con `wrangler secret put`, nunca vive en el
// repo): cambiarlo cierra todas las sesiones abiertas.
//
// Lo que se guarda en la cookie es solo QUIÉN es. Qué puede hacer (su rol) se vuelve
// a leer de la base en cada llamada, así que borrar o bajar de rol a un usuario
// surte efecto al tiro, sin esperar a que venza la cookie.

import { igualSeguro } from "./clave";

export const COOKIE_SESION = "trasladarte_sesion";
const HORAS_SESION = 12;
export const TTL_MS = HORAS_SESION * 60 * 60 * 1000;

const enc = new TextEncoder();

async function firmar(llave: string, mensaje: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(llave),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(mensaje));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function crearToken(secreto: string, idUsuario: string, ahora = Date.now()): Promise<string> {
  const exp = ahora + TTL_MS;
  const cuerpo = `${idUsuario}.${exp}`;
  return `${cuerpo}.${await firmar(secreto, cuerpo)}`;
}

/** Devuelve el id del usuario si el token es válido y no venció; si no, null. */
export async function idDelToken(
  secreto: string | undefined,
  token: string | undefined,
  ahora = Date.now(),
): Promise<string | null> {
  if (!secreto || !token) return null;
  const partes = token.split(".");
  if (partes.length !== 3) return null;
  const [id, expTxt, firma] = partes;
  const exp = Number(expTxt);
  if (!id || !Number.isFinite(exp) || exp < ahora) return null;
  return igualSeguro(firma, await firmar(secreto, `${id}.${expTxt}`)) ? id : null;
}

export function leerCookie(header: string | null | undefined, nombre: string): string | undefined {
  if (!header) return undefined;
  for (const parte of header.split(";")) {
    const [k, ...resto] = parte.trim().split("=");
    if (k === nombre) return resto.join("=");
  }
  return undefined;
}

export function cookieSesion(token: string): string {
  const maxAge = Math.floor(TTL_MS / 1000);
  return `${COOKIE_SESION}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}

export function cookieBorrada(): string {
  return `${COOKIE_SESION}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}
