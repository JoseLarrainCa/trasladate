import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import app, { type Env } from "../../worker/index";
import { crearD1 } from "./d1-sqlite";

const ORIGEN = "https://trasladarte.test";
const datosBuenos = { nombre: "María Pérez", telefono: "+56 9 1234 5678", correo: "maria@ejemplo.cl", servicio: "Automatización de portones", comuna: "Temuco", mensaje: "Quiero cotizar un motor" };
let env: Env;
let resend: ReturnType<typeof vi.fn>;

const enviar = (cuerpo: unknown, origen: string | null = ORIGEN) =>
  app.request(`${ORIGEN}/api/lead`, { method: "POST", headers: { "content-type": "application/json", ...(origen ? { origin: origen } : {}) }, body: JSON.stringify(cuerpo) }, env);
const leads = async () => (await env.leads_flota!.prepare("SELECT * FROM leads").all<any>()).results;

beforeEach(() => {
  env = { DB: crearD1(), leads_flota: crearD1(["tests/worker/leads-flota.sql"]), RESEND_API_KEY: "re_test", ASSETS: { fetch: async () => new Response("") } } as unknown as Env;
  resend = vi.fn(async () => new Response('{"id":"x"}', { status: 200 }));
  vi.stubGlobal("fetch", resend);
});
afterEach(() => vi.unstubAllGlobals());

describe("POST /api/lead", () => {
  it("guarda el lead y avisa por correo SOLO a jose@try-omnis.cl mientras el cliente no dé su casilla", async () => {
    const r = await enviar({ datos: datosBuenos, origen: "Formulario" });
    expect(r.status).toBe(200);
    const [fila] = await leads();
    expect(fila).toMatchObject({ sitio: "trasladarte", nombre: "María Pérez", email: "maria@ejemplo.cl", correo_enviado: 1 });
    const envio = JSON.parse(resend.mock.calls[0][1].body);
    expect(envio.to).toEqual(["jose@try-omnis.cl"]);
    expect(envio.html).toContain("Automatización de portones");
    expect(envio.html).toContain("Temuco");
    expect(envio.reply_to).toBe("maria@ejemplo.cl");
  });

  it("el contacto también queda en el panel (tabla contactos)", async () => {
    await enviar({ datos: datosBuenos, origen: "Formulario" });
    const filas = (await env.DB.prepare("SELECT * FROM contactos").all<any>()).results;
    expect(filas).toHaveLength(1);
    expect(filas[0]).toMatchObject({ nombre: "María Pérez", email: "maria@ejemplo.cl", comuna: "Temuco", atendido: 0 });
  });

  it("si Resend falla, el lead queda guardado con correo_enviado=0 y la persona igual recibe ok", async () => {
    resend.mockResolvedValueOnce(new Response("boom", { status: 403 }));
    const r = await enviar({ datos: datosBuenos, origen: "F" });
    expect(r.status).toBe(200);
    const [fila] = await leads();
    expect(fila.correo_enviado).toBe(0);
    expect(fila.detalle_error).toMatch(/resend-rechazo/);
  });

  it("rechaza teléfono inválido o correo faltante, sin guardar nada", async () => {
    expect((await enviar({ datos: { ...datosBuenos, telefono: "12345" } })).status).toBe(400);
    expect((await enviar({ datos: { ...datosBuenos, correo: "" } })).status).toBe(400);
    expect((await enviar({ datos: { ...datosBuenos, correo: "sin-arroba" } })).status).toBe(400);
    expect(await leads()).toHaveLength(0);
    expect(resend).not.toHaveBeenCalled();
  });

  it("rechaza peticiones de otro sitio o sin Origin", async () => {
    expect((await enviar({ datos: datosBuenos }, "https://malo.example")).status).toBe(403);
    expect((await enviar({ datos: datosBuenos }, null)).status).toBe(403);
  });

  it("el campo trampa lleno responde ok pero no guarda ni manda nada", async () => {
    const r = await enviar({ datos: { ...datosBuenos, website: "http://spam" } });
    expect(r.status).toBe(200);
    expect(await leads()).toHaveLength(0);
    expect(resend).not.toHaveBeenCalled();
  });

  it("un cuerpo enorme se rechaza", async () => {
    expect((await enviar({ datos: { ...datosBuenos, mensaje: "x".repeat(20_000) } })).status).toBe(413);
  });

  it("solo acepta POST", async () => {
    expect((await app.request(`${ORIGEN}/api/lead`, {}, env)).status).toBe(405);
  });
});

describe("POST /api/cotizacion deja respaldo y avisa", () => {
  const cotizacion = {
    quote: {
      cliente_nombre: "Rodrigo", cliente_apellido: "Castro", telefono: "+56 9 1234 5678", email: "rodrigo@ejemplo.cl",
      origen_direccion: "Av. Uno 1", origen_comuna: "Nunoa", origen_tipo_vivienda: "departamento",
      destino_direccion: "Av. Dos 2", destino_comuna: "Providencia", destino_tipo_vivienda: "casa-1", tipo_mudanza: "hogar",
    },
    items: [{ item_key: "sofa", item_name: "Sofa", category: "LIVING", quantity: 1 }],
    resumen: "DATOS DEL CLIENTE: <b>Rodrigo</b>",
  };
  const pedir = () =>
    app.request(`${ORIGEN}/api/cotizacion`, { method: "POST", headers: { "content-type": "application/json", origin: ORIGEN }, body: JSON.stringify(cotizacion) }, env);

  it("guarda en leads-flota, manda el resumen escapado y marca correo_enviado", async () => {
    expect((await pedir()).status).toBe(200);
    const [fila] = await leads();
    expect(fila).toMatchObject({ sitio: "trasladarte", nombre: "Rodrigo Castro", email: "rodrigo@ejemplo.cl", correo_enviado: 1 });
    const envio = JSON.parse(resend.mock.calls[0][1].body);
    expect(envio.to).toEqual(["jose@try-omnis.cl"]);
    expect(envio.subject).toContain("Nunoa a Providencia");
    expect(envio.html).toContain("&lt;b&gt;Rodrigo&lt;/b&gt;");
    expect(envio.reply_to).toBe("rodrigo@ejemplo.cl");
  });

  it("si Resend falla, la cotización igual queda guardada y el respaldo con correo_enviado=0", async () => {
    resend.mockResolvedValueOnce(new Response("boom", { status: 403 }));
    const r = await pedir();
    expect(r.status).toBe(200);
    const [fila] = await leads();
    expect(fila.correo_enviado).toBe(0);
    const quotes = (await env.DB.prepare("SELECT * FROM quotes").all<any>()).results;
    expect(quotes).toHaveLength(1);
  });
});
