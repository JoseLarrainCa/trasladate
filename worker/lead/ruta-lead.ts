// PLANTILLA de la skill onboarding-cliente (Fase 3b).
// Copiar a src/lib/ del repo del cliente. Va junto a correo-lead.ts, aviso-lead.ts y env.ts.
/**
 * `POST /api/lead` — el aviso por correo del formulario, como ruta plana del Worker.
 *
 * Se engancha en el `fetch` de `src/server.ts` con DOS líneas, y por eso vive acá: mientras
 * menos código propio tenga `server.ts`, menos se rompe al actualizarlo entre clientes.
 *
 * 🔴 **No usar `createServerFn` para esto.** Un `createServerFn` a nivel de módulo dejó a
 * Constructora S&S y a Devoltych en 500 durante semanas — en todas las rutas y también en los
 * assets, porque el Worker no arrancaba.
 */

import { datosSirven, enviarAviso, type EntornoCorreo } from "./correo-lead";
import { leerEntorno } from "./env";
import type { DatosLead } from "./correo-lead";
export const RUTA_LEAD = "/api/lead";
import { guardarLead, marcarAvisado } from "./guardar-lead";

/** El slug del cliente. El instalador lo reemplaza con el de `brand.config.json`. */
const SITIO_LEAD = "trasladarte";



function json(cuerpo: unknown, status: number): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

/**
 * Devuelve `undefined` si la petición no es para esta ruta, para que siga su camino normal.
 *
 * Solo contesta a peticiones del propio sitio: el endpoint es público y sin esto cualquiera
 * puede llenar la casilla de avisos desde afuera.
 */
export async function atenderAvisoDeLead(
  request: Request,
  env: unknown,
): Promise<Response | undefined> {
  const url = new URL(request.url);
  if (url.pathname !== RUTA_LEAD) return undefined;
  if (request.method !== "POST") return json({ ok: false, motivo: "metodo" }, 405);

  const origin = request.headers.get("origin");
  if (!origin || new URL(origin).host !== url.host) {
    return json({ ok: false, motivo: "origen" }, 403);
  }

  let cuerpo: { datos?: DatosLead & { website?: string }; origen?: string };
  try {
    const bruto = await request.text();
    if (bruto.length > 10_000) return json({ ok: false, motivo: "grande" }, 413);
    cuerpo = JSON.parse(bruto) as typeof cuerpo;
  } catch {
    return json({ ok: false, motivo: "json" }, 400);
  }

  const datos = cuerpo.datos;
  // Trampa para robots: un campo escondido que una persona nunca llena. Se responde "ok" sin guardar ni avisar.
  if (datos && typeof datos.website === "string" && datos.website.trim() !== "") return json({ ok: true }, 200);
  if (!datos || typeof datos.nombre !== "string" || typeof datos.telefono !== "string") {
    return json({ ok: false, motivo: "datos-invalidos" }, 400);
  }

  // Datos que no sirven (teléfono o correo inválidos) se rechazan ANTES de guardar: si no, quedaban
  // guardados y la ruta respondía ok porque "el lead está a salvo".
  if (!datosSirven(datos)) return json({ ok: false, motivo: "datos-invalidos" }, 400);

  // GUARDAR PRIMERO, AVISAR DESPUES. Si Resend se cae, el lead ya esta a salvo y
  // `correo_enviado = 0` queda como la evidencia — que es lo que revisa el monitor.
  // El `env` del parámetro llega vacío en este Worker (ver env.ts): la base se lee del mismo
  // lugar que las vars. Con el `env` crudo, guardarLead degradaba en silencio y no guardaba nada.
  const entorno = leerEntorno(env);
  const guardado = await guardarLead(entorno, SITIO_LEAD, String(cuerpo.origen ?? ""), datos as unknown as Record<string, unknown>);

  const resultado = await enviarAviso(entorno as EntornoCorreo, datos, String(cuerpo.origen ?? ""));

  if (guardado) {
    await marcarAvisado(entorno, guardado.id, resultado.ok ? undefined : `${resultado.motivo} ${resultado.detalle ?? ""}`);
  }

  if (!resultado.ok) {
    // El detalle de Resend se registra, no se devuelve: no tiene por que salir del servidor.
    console.error(`[lead] el aviso no salio: ${resultado.motivo} ${resultado.detalle ?? ""}`);

    // Si el lead quedo guardado, para la persona que lo escribio SI llego: alguien lo va a
    // ver. Devolver error ahi la haria reintentar o irse, y el lead ya esta a salvo. El
    // error se devuelve solo cuando ademas no hubo donde guardarlo — ahi si se perdio.
    if (guardado) return json({ ok: true, respaldado: true }, 200);

    return json(
      { ok: false, motivo: resultado.motivo },
      resultado.motivo === "datos-invalidos" ? 400 : 502,
    );
  }
  return json({ ok: true }, 200);
}
