import { describe, expect, it } from "vitest";

import { brand } from "./brand.generated";
import { destinoCanonico, respuestaCanonica } from "./host-canonico";

/**
 * Este test existe porque el bug no se ve mirando la página: los dos hosts
 * sirven el sitio correcto, y solo Google nota que son dos. Ver el 2026-09-17,
 * cuando la flota tenía tres sitios así.
 *
 * Los casos van contra `brand.config.json`, no contra strings pegados acá: si
 * alguien cambia el dominio del cliente, el test sigue midiendo lo que importa.
 */

const APEX = new URL(brand.dominioCanonico).host;
const RESPALDO = brand.urlRespaldo ? new URL(brand.urlRespaldo).host : null;

describe("host canónico", () => {
  it("manda el www al apex, cifrado", () => {
    expect(destinoCanonico(`https://www.${APEX}/`)).toBe(`https://${APEX}/`);
  });

  it("manda el http sin cifrar al https", () => {
    expect(destinoCanonico(`http://${APEX}/`)).toBe(`https://${APEX}/`);
  });

  it("el www sin cifrar llega al apex en UN solo salto", () => {
    expect(destinoCanonico(`http://www.${APEX}/contacto`)).toBe(`https://${APEX}/contacto`);
  });

  it("conserva ruta, query y hash — si no, se pierde de dónde vino la visita", () => {
    expect(destinoCanonico(`https://www.${APEX}/planes?utm_source=instagram#precio`)).toBe(
      `https://${APEX}/planes?utm_source=instagram#precio`,
    );
  });

  it("el apex cifrado NO se redirige", () => {
    expect(destinoCanonico(`https://${APEX}/`)).toBeNull();
  });

  it("el .workers.dev NO se redirige: es el respaldo del cliente", () => {
    if (!RESPALDO) return;
    expect(destinoCanonico(`https://${RESPALDO}/`)).toBeNull();
    expect(destinoCanonico(`http://${RESPALDO}/`)).toBeNull();
  });

  it("localhost NO se redirige: rompería el desarrollo", () => {
    expect(destinoCanonico("http://localhost:3000/")).toBeNull();
  });

  it("responde 301 permanente, no 302", () => {
    const r = respuestaCanonica(new Request(`https://www.${APEX}/`));
    expect(r?.status).toBe(301);
    expect(r?.headers.get("location")).toBe(`https://${APEX}/`);
  });

  it("una URL inválida no revienta el Worker", () => {
    expect(destinoCanonico("no-es-una-url")).toBeNull();
  });
});
