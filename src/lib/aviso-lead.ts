/**
 * Envía el formulario de contacto al Worker (POST /api/lead), que lo guarda en la base de
 * leads de la flota y le avisa por correo a Omnis.
 *
 * Acá el formulario ES el camino principal (no hay WhatsApp de por medio), así que SÍ se
 * espera la respuesta: si falla, la persona tiene que enterarse y tener otra salida.
 */

export const RUTA_LEAD = "/api/lead";

export interface DatosLead {
  nombre: string;
  telefono: string;
  correo: string;
  servicio?: string;
  region?: string;
  comuna?: string;
  direccion?: string;
  mensaje?: string;
  /** Campo trampa para robots: tiene que ir vacío. */
  website?: string;
}

export async function enviarLead(datos: DatosLead, origen: string): Promise<boolean> {
  try {
    const res = await fetch(RUTA_LEAD, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ datos, origen }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
