import { describe, expect, it } from "vitest";
import { VUELTAS, hashearClave, verificarClave } from "../../worker/clave";

describe("claves de los usuarios del panel", () => {
  it("usa 100.000 vueltas: el tope de PBKDF2 en Workers (con más, el login responde 500 en producción)", () => {
    expect(VUELTAS).toBe(100_000);
  });

  it("guarda la clave como pbkdf2$vueltas$sal$hash", async () => {
    const hash = await hashearClave("una-clave-larga");
    expect(hash).toMatch(/^pbkdf2\$100000\$[0-9a-f]{32}\$[0-9a-f]{64}$/);
  });

  it("verifica la clave correcta y rechaza la incorrecta", async () => {
    const hash = await hashearClave("una-clave-larga");
    expect(await verificarClave("una-clave-larga", hash)).toBe(true);
    expect(await verificarClave("una-clave-larga ", hash)).toBe(false);
    expect(await verificarClave("otra", hash)).toBe(false);
  });

  it("la misma clave da hashes distintos (sal propia)", async () => {
    const [a, b] = await Promise.all([hashearClave("igual-igual"), hashearClave("igual-igual")]);
    expect(a).not.toBe(b);
  });

  it("rechaza un hash con más vueltas que el tope en vez de intentar calcularlo", async () => {
    const hash = await hashearClave("una-clave-larga");
    const partes = hash.split("$");
    partes[1] = "600000";
    expect(await verificarClave("una-clave-larga", partes.join("$"))).toBe(false);
  });

  it("un valor guardado con formato roto nunca verifica", async () => {
    expect(await verificarClave("x", "")).toBe(false);
    expect(await verificarClave("x", "pbkdf2$100000$zz")).toBe(false);
    expect(await verificarClave("x", "plain$100000$00$00")).toBe(false);
  });
});
