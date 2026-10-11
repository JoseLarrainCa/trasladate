// POST /api/cotizacion — la solicitud de cotización que deja un visitante en la página.
//
// Reemplaza a los dos INSERT que el formulario hacía directo contra Supabase (quotes y
// quote_items) con la llave pública. Allá las reglas vivían en políticas RLS; acá viven en
// este archivo, y son las mismas:
//   · la cotización tiene que venir completa (nombre, teléfono, origen y destino);
//   · el visitante NO elige el estado, las notas internas ni la fecha de creación;
//   · cada ítem del inventario tiene nombre, categoría y cantidad mayor que cero.
// La cotización y sus ítems se guardan en un solo batch: o entra todo, o nada.
//
// Después se guarda una copia en la base compartida leads-flota y se manda el aviso por
// correo (Resend). Guardar primero, avisar después: si el correo falla, la cotización ya
// está en el panel y `correo_enviado = 0` lo delata en el monitor de los lunes.

import { guardarLead, marcarAvisado } from "./lead/guardar-lead";
import { destinatarios, formatearTelefono, type EntornoCorreo } from "./lead/correo-lead";
import { armarInsert, ErrorConsulta } from "./consulta";

const SITIO_LEAD = "trasladarte";
const REMITENTE = "Trasladarte <contacto@try-omnis.cl>";
const MAX_ITEMS = 400;
const MAX_RESUMEN = 20_000;

/** Lo único que el visitante puede escribir en `quotes`. */
const CAMPOS_PUBLICOS = [
  "cliente_nombre",
  "cliente_apellido",
  "cliente_razon_social",
  "telefono",
  "celular",
  "email",
  "origen_direccion",
  "origen_comuna",
  "origen_tipo_vivienda",
  "origen_tiene_ascensor",
  "origen_piso",
  "destino_direccion",
  "destino_comuna",
  "destino_tipo_vivienda",
  "destino_tiene_ascensor",
  "destino_piso",
  "tipo_mudanza",
  "fecha_traslado",
  "fecha_indefinida",
  "sugerencia_adicional",
] as const;

const OBLIGATORIOS = [
  "cliente_nombre",
  "telefono",
  "email",
  "origen_direccion",
  "origen_comuna",
  "origen_tipo_vivienda",
  "destino_direccion",
  "destino_comuna",
  "destino_tipo_vivienda",
] as const;

export interface EntornoCotizacion extends EntornoCorreo {
  DB: D1Database;
  leads_flota?: D1Database;
}

export type Resultado =
  | { ok: true; id: string; avisado: boolean }
  | { ok: false; status: 400 | 500; motivo: string };

type Fila = Record<string, unknown>;

const texto = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/** Valida y limpia lo que mandó el navegador. Devuelve el motivo si no sirve. */
export function validarSolicitud(
  cuerpo: unknown,
): { ok: true; quote: Fila; items: Fila[]; resumen: string } | { ok: false; motivo: string } {
  if (!cuerpo || typeof cuerpo !== "object") return { ok: false, motivo: "Faltan los datos" };
  const { quote, items, resumen } = cuerpo as { quote?: unknown; items?: unknown; resumen?: unknown };
  if (!quote || typeof quote !== "object" || Array.isArray(quote)) return { ok: false, motivo: "Faltan los datos" };

  const q = quote as Fila;
  const limpio: Fila = {};
  for (const campo of CAMPOS_PUBLICOS) {
    const valor = q[campo];
    if (valor === undefined) continue;
    limpio[campo] = typeof valor === "string" ? valor.trim().slice(0, 2000) : valor;
  }

  for (const campo of OBLIGATORIOS) {
    if (!texto(limpio[campo])) return { ok: false, motivo: `Falta ${campo}` };
  }
  if (texto(limpio.cliente_nombre).length < 2) return { ok: false, motivo: "Falta cliente_nombre" };
  if (limpio.telefono && String(limpio.telefono).replace(/\D/g, "").length < 8) {
    return { ok: false, motivo: "Teléfono inválido" };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(texto(limpio.email))) return { ok: false, motivo: "Correo inválido" };
  if (!["hogar", "oficina", "especial"].includes(texto(limpio.tipo_mudanza))) {
    return { ok: false, motivo: "Tipo de mudanza inválido" };
  }
  const fecha = limpio.fecha_traslado;
  if (fecha !== undefined && fecha !== null && !/^\d{4}-\d{2}-\d{2}$/.test(texto(fecha))) {
    return { ok: false, motivo: "Fecha inválida" };
  }

  const listaItems = Array.isArray(items) ? items : [];
  if (listaItems.length > MAX_ITEMS) return { ok: false, motivo: "Demasiados ítems" };
  const itemsLimpios: Fila[] = [];
  const vistos = new Set<string>();
  for (const bruto of listaItems) {
    if (!bruto || typeof bruto !== "object") return { ok: false, motivo: "Ítem inválido" };
    const it = bruto as Fila;
    const item = {
      item_key: texto(it.item_key).slice(0, 120),
      item_name: texto(it.item_name).slice(0, 200),
      category: texto(it.category).slice(0, 80),
      quantity: Number(it.quantity),
    };
    if (!item.item_key || !item.item_name || !item.category) return { ok: false, motivo: "Ítem incompleto" };
    if (!Number.isInteger(item.quantity) || item.quantity <= 0 || item.quantity > 10_000) {
      return { ok: false, motivo: "Cantidad inválida" };
    }
    // En Supabase había UNIQUE (quote_id, item_key): un duplicado tumbaba el insert entero.
    if (vistos.has(item.item_key)) continue;
    vistos.add(item.item_key);
    itemsLimpios.push(item);
  }

  return {
    ok: true,
    quote: limpio,
    items: itemsLimpios,
    resumen: typeof resumen === "string" ? resumen.slice(0, MAX_RESUMEN) : "",
  };
}

function escapar(t: string): string {
  return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function cuerpoAvisoCotizacion(quote: Fila, resumen: string, cantidadItems: number): string {
  const nombre = [texto(quote.cliente_nombre), texto(quote.cliente_apellido)].filter(Boolean).join(" ");
  const telefono = formatearTelefono(texto(quote.telefono));
  return [
    `<p><strong>${escapar(nombre)}</strong> pidió una cotización de mudanza en trasladarte.com.</p>`,
    "<ul>",
    `<li>Teléfono: <a href="https://wa.me/${telefono.replace(/\D/g, "")}">${escapar(telefono)}</a></li>`,
    `<li>Correo: <a href="mailto:${escapar(texto(quote.email))}">${escapar(texto(quote.email))}</a></li>`,
    `<li>Desde: ${escapar(texto(quote.origen_comuna))} · Hacia: ${escapar(texto(quote.destino_comuna))}</li>`,
    `<li>Ítems del inventario: ${cantidadItems}</li>`,
    "</ul>",
    "<p>Quedó guardada en el panel, en Formularios.</p>",
    resumen ? `<pre style="font-family:inherit;white-space:pre-wrap">${escapar(resumen)}</pre>` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

async function avisar(env: EntornoCorreo, quote: Fila, resumen: string, cantidadItems: number) {
  if (!env.RESEND_API_KEY) return { ok: false as const, detalle: "sin-llave" };
  const nombre = [texto(quote.cliente_nombre), texto(quote.cliente_apellido)].filter(Boolean).join(" ");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: REMITENTE,
      to: destinatarios(env.MAIL_TO),
      subject: `Cotización web: ${nombre} — ${texto(quote.origen_comuna)} a ${texto(quote.destino_comuna)}`,
      html: cuerpoAvisoCotizacion(quote, resumen, cantidadItems),
      reply_to: texto(quote.email),
    }),
  });
  if (!res.ok) return { ok: false as const, detalle: `resend-rechazo ${await res.text()}` };
  return { ok: true as const };
}

export async function crearCotizacion(env: EntornoCotizacion, cuerpo: unknown): Promise<Resultado> {
  const v = validarSolicitud(cuerpo);
  if (!v.ok) return { ok: false, status: 400, motivo: v.motivo };

  const id = crypto.randomUUID();
  const quote: Fila = { ...v.quote, id, estado: "pendiente" };
  const sentencias = [
    ...armarInsert({ tabla: "quotes", op: "insert", valores: quote }),
    ...(v.items.length
      ? armarInsert({ tabla: "quote_items", op: "insert", valores: v.items.map((it) => ({ ...it, quote_id: id })) })
      : []),
  ];
  try {
    await env.DB.batch(sentencias.map((s) => env.DB.prepare(s.sql).bind(...s.params)));
  } catch (e) {
    if (e instanceof ErrorConsulta) return { ok: false, status: 400, motivo: e.message };
    console.error("[cotizacion] no se pudo guardar", e);
    return { ok: false, status: 500, motivo: "No se pudo guardar" };
  }

  const guardado = await guardarLead(env, SITIO_LEAD, "Cotizador de la página", {
    nombre: [texto(quote.cliente_nombre), texto(quote.cliente_apellido)].filter(Boolean).join(" "),
    telefono: texto(quote.telefono),
    email: texto(quote.email),
    mensaje: `${texto(quote.origen_comuna)} → ${texto(quote.destino_comuna)} (${v.items.length} ítems)`,
    cotizacion_id: id,
  });
  const aviso = await avisar(env, quote, v.resumen, v.items.length).catch((e) => ({
    ok: false as const,
    detalle: String(e),
  }));
  if (guardado) await marcarAvisado(env, guardado.id, aviso.ok ? undefined : aviso.detalle);
  if (!aviso.ok) console.error(`[cotizacion] el aviso no salió: ${aviso.detalle}`);

  return { ok: true, id, avisado: aviso.ok };
}
