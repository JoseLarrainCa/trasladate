import { describe, expect, it } from "vitest";
import { TTL_MS, cookieBorrada, cookieSesion, crearToken, idDelToken, leerCookie } from "../../worker/sesion";

const SECRETO = "s".repeat(64);
const AHORA = 1_800_000_000_000;

describe("cookie de sesión", () => {
  it("un token recién creado devuelve el id del usuario", async () => {
    const token = await crearToken(SECRETO, "usuario-1", AHORA);
    expect(await idDelToken(SECRETO, token, AHORA + 1000)).toBe("usuario-1");
  });

  it("vence a las 12 horas", async () => {
    const token = await crearToken(SECRETO, "usuario-1", AHORA);
    expect(TTL_MS).toBe(12 * 60 * 60 * 1000);
    expect(await idDelToken(SECRETO, token, AHORA + TTL_MS - 1)).toBe("usuario-1");
    expect(await idDelToken(SECRETO, token, AHORA + TTL_MS + 1)).toBeNull();
  });

  it("no acepta un token con el id cambiado a mano", async () => {
    const token = await crearToken(SECRETO, "usuario-1", AHORA);
    const falso = token.replace("usuario-1", "usuario-2");
    expect(await idDelToken(SECRETO, falso, AHORA + 1000)).toBeNull();
  });

  it("no acepta un token con el vencimiento alargado a mano", async () => {
    const token = await crearToken(SECRETO, "usuario-1", AHORA);
    const [id, exp, firma] = token.split(".");
    const falso = `${id}.${Number(exp) + 10 * TTL_MS}.${firma}`;
    expect(await idDelToken(SECRETO, falso, AHORA + TTL_MS + 1000)).toBeNull();
  });

  it("no acepta un token firmado con otro secreto", async () => {
    const token = await crearToken("otro-secreto-distinto", "usuario-1", AHORA);
    expect(await idDelToken(SECRETO, token, AHORA + 1000)).toBeNull();
  });

  it("sin secreto configurado nada es válido (falla cerrado)", async () => {
    const token = await crearToken(SECRETO, "usuario-1", AHORA);
    expect(await idDelToken(undefined, token, AHORA + 1000)).toBeNull();
    expect(await idDelToken("", token, AHORA + 1000)).toBeNull();
  });

  it("rechaza basura", async () => {
    for (const malo of [undefined, "", "a.b", "a.b.c.d", "x.NaN.firma", "..."]) {
      expect(await idDelToken(SECRETO, malo, AHORA)).toBeNull();
    }
  });

  it("lee la cookie correcta entre varias", () => {
    expect(leerCookie("a=1; trasladarte_sesion=abc.def.ghi; b=2", "trasladarte_sesion")).toBe("abc.def.ghi");
    expect(leerCookie(undefined, "trasladarte_sesion")).toBeUndefined();
    expect(leerCookie("otra=1", "trasladarte_sesion")).toBeUndefined();
  });

  it("la cookie sale HttpOnly, Secure y SameSite=Lax; y borrarla la deja con Max-Age=0", () => {
    const c = cookieSesion("tok");
    expect(c).toContain("HttpOnly");
    expect(c).toContain("Secure");
    expect(c).toContain("SameSite=Lax");
    expect(c).toContain(`Max-Age=${TTL_MS / 1000}`);
    expect(cookieBorrada()).toContain("Max-Age=0");
  });
});
