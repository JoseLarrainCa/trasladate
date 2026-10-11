// PLANTILLA de la skill onboarding-cliente (Fase 3b).
// Copiar a src/lib/ del repo del cliente. Va junto a ruta-lead.ts y correo-lead.ts.
/**
 * Guarda el lead en la base de la agencia ANTES de intentar el correo.
 *
 * 🔴 Por qué existe: hasta el 2026-09-22 el formulario mandaba el correo y no guardaba
 * nada. Si Resend fallaba, el lead se perdía entero — sin rastro, sin forma de saber
 * cuántos. Fibravid pasó 32 días sin mandar un solo correo y sus 31 cotizaciones se
 * pudieron rescatar **solo porque estaban guardadas**. Un sitio que no guarda no tiene
 * ese rescate.
 *
 * **Guardar primero, avisar después.** Nunca al revés: si el correo se cae, el lead ya
 * está a salvo, y `correo_enviado = 0` queda como la evidencia de que no salió. Eso es
 * exactamente lo que el monitor `flota-monitor` revisa todos los lunes.
 *
 * Es UNA base para toda la flota (`leads-flota`), no una por cliente: así el monitor
 * tiene un solo lugar donde mirar y un sitio nuevo queda cubierto por nacer con el
 * binding puesto, sin que nadie lo agregue a ninguna lista.
 *
 * Degrada en silencio a propósito: si el sitio no tiene el binding (los que nacieron
 * antes), todo sigue funcionando como siempre y solo se pierde el respaldo.
 */

export type LeadGuardado = { id: string } | null;

type ConBase = { leads_flota?: D1Database };

/** `true` si este sitio tiene la base conectada. */
export function hayBase(env: unknown): boolean {
  return !!(env as ConBase)?.leads_flota;
}

export async function guardarLead(
  env: unknown,
  sitio: string,
  origen: string,
  datos: Record<string, unknown>,
): Promise<LeadGuardado> {
  const db = (env as ConBase)?.leads_flota;
  if (!db) return null;

  const id = crypto.randomUUID();
  const texto = (v: unknown) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null);
  try {
    await db
      .prepare(
        `INSERT INTO leads (id, sitio, origen, nombre, telefono, email, mensaje, datos)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        id,
        sitio,
        origen || null,
        texto(datos.nombre) ?? "(sin nombre)",
        texto(datos.telefono),
        texto(datos.email) ?? texto(datos.correo),
        texto(datos.mensaje) ?? texto(datos.comentario),
        JSON.stringify(datos),
      )
      .run();
    return { id };
  } catch (e) {
    // Que el respaldo falle no puede tumbar el formulario: el correo todavía puede salir.
    console.error(`[lead] no pude guardar el respaldo: ${String(e)}`);
    return null;
  }
}

/** Marca que el correo sí salió. Si esto falla, el correo YA salió: es contabilidad interna. */
export async function marcarAvisado(env: unknown, id: string, error?: string): Promise<void> {
  const db = (env as ConBase)?.leads_flota;
  if (!db) return;
  try {
    if (error) {
      await db.prepare("UPDATE leads SET detalle_error = ? WHERE id = ?").bind(error.slice(0, 300), id).run();
    } else {
      await db.prepare("UPDATE leads SET correo_enviado = 1 WHERE id = ?").bind(id).run();
    }
  } catch {
    /* noop */
  }
}
