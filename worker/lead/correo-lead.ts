// PLANTILLA de la skill onboarding-cliente (Fase 3b).
// Copiar a src/lib/ del repo del cliente y reemplazar el nombre y el dominio (ya hecho: Trasladarte).
/**
 * El aviso por correo del formulario.
 *
 * En un sitio sin base de datos **el correo ES el registro del lead**: si esto no sale, lo
 * que la persona escribió no existe para nadie. Por eso el aviso se manda apenas aprieta el
 * botón, ANTES de abrir WhatsApp — que es el paso que la persona puede no completar.
 *
 * Autocontenido a propósito: no importa nada del repo, para que instalarlo en un cliente
 * nuevo sea copiar cuatro archivos y no ir enganchando funciones que se llaman distinto en
 * cada sitio.
 */

/** La casilla de la agencia. Mientras el cliente no confirme la suya, el aviso llega solo acá. */
export const DESTINO_POR_DEFECTO = "jose@try-omnis.cl";

/** `try-omnis.cl` está verificado en Resend desde el 2026-05-11 (DKIM + SPF). */
export const REMITENTE = "Trasladarte <contacto@try-omnis.cl>";

/** El sitio, para que el correo diga de dónde viene sin abrir el código. */
export const SITIO = "trasladarte.com";

export interface DatosLead {
  nombre: string;
  telefono: string;
  /** Obligatorio, igual que el teléfono (regla de José: correo y teléfono en todo formulario). */
  correo: string;
  servicio?: string;
  region?: string;
  comuna?: string;
  direccion?: string;
  /** Lo que la persona escribió, si el formulario tiene campo de mensaje. */
  mensaje?: string;
}

export interface EntornoCorreo {
  RESEND_API_KEY?: string;
  /** Uno o varios, separados por coma. Si falta, va solo a la agencia. */
  MAIL_TO?: string;
}

/**
 * Resend rechaza el envío entero si en `to` va un string con comas, y el aviso se cae sin
 * dejar síntoma. Por eso la lista se parte acá, se limpia y se deduplica.
 */
export function destinatarios(valor: string | undefined): string[] {
  const vistos = new Set<string>();
  const salida: string[] = [];
  for (const parte of (valor ?? DESTINO_POR_DEFECTO).split(",")) {
    const correo = parte.trim();
    if (!correo) continue;
    const clave = correo.toLowerCase();
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    salida.push(correo);
  }
  return salida.length > 0 ? salida : [DESTINO_POR_DEFECTO];
}

/** Deja el teléfono chileno en 9 dígitos: sin +56, sin espacios y sin el 0 de arrastre. */
export function normalizarTelefono(entrada: string): string {
  let d = entrada.replace(/\D/g, "");
  if (d.startsWith("56")) d = d.slice(2);
  while (d.startsWith("0")) d = d.slice(1);
  return d;
}

/** "912345678" → "+56 9 1234 5678". Lo que no tenga 9 dígitos vuelve como vino. */
export function formatearTelefono(entrada: string): string {
  const d = normalizarTelefono(entrada);
  if (d.length !== 9) return entrada;
  return `+56 ${d[0]} ${d.slice(1, 5)} ${d.slice(5)}`;
}

/** Validación del servidor. La del navegador es una comodidad, no una defensa. */
export function datosSirven(datos: DatosLead): boolean {
  if (!datos?.nombre || datos.nombre.trim().length < 2) return false;
  const tel = normalizarTelefono(datos.telefono ?? "");
  if (!(tel.length === 9 && tel.startsWith("9"))) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((datos.correo ?? "").trim());
}

function escapar(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function asuntoAviso(datos: DatosLead): string {
  return `${SITIO}: ${datos.nombre.trim()} — ${formatearTelefono(datos.telefono)}`;
}

/**
 * El aviso dice explícitamente que la persona puede NO haber mandado el WhatsApp. Sin esa
 * línea, quien lo lee cree que tiene un mensaje esperando y no llama.
 */
export function cuerpoAviso(datos: DatosLead, origen: string): string {
  const telefono = formatearTelefono(datos.telefono);
  const soloDigitos = telefono.replace(/\D/g, "");
  const correo = (datos.correo ?? "").trim();
  const mensaje = (datos.mensaje ?? "").trim();
  const extra = (nombre: string, valor?: string) =>
    valor && valor.trim() && !/^seleccionar/i.test(valor.trim()) ? `<li>${nombre}: ${escapar(valor.trim())}</li>` : "";

  return [
    `<p><strong>${escapar(datos.nombre.trim())}</strong> dejó sus datos en ${escapar(SITIO)}.</p>`,
    "<ul>",
    `<li>Teléfono: <a href="https://wa.me/${soloDigitos}">${escapar(telefono)}</a></li>`,
    correo ? `<li>Correo: <a href="mailto:${escapar(correo)}">${escapar(correo)}</a></li>` : "",
    extra("Servicio", datos.servicio),
    extra("Región", datos.region),
    extra("Comuna", datos.comuna),
    extra("Dirección", datos.direccion),
    mensaje ? `<li>Mensaje: ${escapar(mensaje)}</li>` : "",
    origen ? `<li>Llegó por: ${escapar(origen)}.</li>` : "",
    "</ul>",
    "<p>Lo escribió en el formulario de la página: respóndele cuanto antes, por teléfono o WhatsApp.</p>",
  ]
    .filter(Boolean)
    .join("\n");
}

export type ResultadoAviso =
  | { ok: true }
  | { ok: false; motivo: "datos-invalidos" | "sin-llave" | "resend-rechazo"; detalle?: string };

export async function enviarAviso(
  env: EntornoCorreo,
  datos: DatosLead,
  origen: string,
): Promise<ResultadoAviso> {
  if (!datosSirven(datos)) return { ok: false, motivo: "datos-invalidos" };

  const llave = env.RESEND_API_KEY;
  if (!llave) return { ok: false, motivo: "sin-llave" };

  const correo = (datos.correo ?? "").trim();
  const respuesta = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${llave}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: REMITENTE,
      to: destinatarios(env.MAIL_TO),
      subject: asuntoAviso(datos),
      html: cuerpoAviso(datos, origen),
      // Para contestarle apretando "Responder", sin copiar la dirección desde el cuerpo.
      ...(correo ? { reply_to: correo } : {}),
    }),
  });

  if (!respuesta.ok) {
    return { ok: false, motivo: "resend-rechazo", detalle: await respuesta.text() };
  }
  return { ok: true };
}
