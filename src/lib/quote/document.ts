import type { CSSProperties } from 'react';
import {
  DEFAULT_EMPRESA,
  DEFAULT_TEXTOS,
  tipoServicioLabel,
  type Empresa,
  type Tarifas,
  DEFAULT_TARIFAS,
} from './defaults';
import { camionLabel, formatCLP, m3ToBodegaM2, totalItems, totalM3, type LineaInventario } from './pricing';
import { dosDigitos, renderTemplate, resolveTexto, type TplVars } from './templates';

export type FormatoPDF = 'marco' | 'moderno';

export interface DocCliente {
  nombre: string;
  razonSocial?: string;
  email?: string;
  telefono?: string;
  origenDir: string;
  origenComuna: string;
  origenPiso?: string;
  origenAscensor: boolean;
  origenTipo: string;
  destinoDir: string;
  destinoComuna: string;
  destinoPiso?: string;
  destinoAscensor: boolean;
  destinoTipo: string;
}

export interface DocState {
  id?: string;
  quote_id?: string | null;
  folio: number;
  formato: FormatoPDF;
  fecha_servicio: string; // yyyy-mm-dd
  /** `HH:MM`, hora de Chile; opcional. Lo muestra el calendario del panel. */
  hora_inicio: string;
  hora_fin: string;
  titulo_servicio: string;
  saludo: string;
  tipo_servicio: string; // 'express' | 'principal' | 'exclusivo' | ''
  cliente: DocCliente;
  camion: string;
  camion_qty: number;
  personas: number;
  con_embalaje: boolean;
  armado_camas: boolean;
  sin_iva: boolean;
  con_galeria: boolean;
  cuota1: number;
  cuota2: number;
  recargo_escala: number;
  recargo_rampa: number;
  recargo_estac: number;
  recargo_otro: number;
  precio_calculado: number;
  precio_final: number | null;
  textos: Record<string, string>;
  materiales: string[]; // keys
  observaciones: string[]; // keys
  acciones: string[]; // keys
  inventario: LineaInventario[];
}

export interface DocConfig {
  empresa: Empresa;
  tarifas: Tarifas;
  textosDefault: Record<string, string>;
}

export const DEFAULT_CONFIG: DocConfig = {
  empresa: DEFAULT_EMPRESA,
  tarifas: DEFAULT_TARIFAS,
  textosDefault: DEFAULT_TEXTOS,
};

const TIPO_LARGO: Record<string, string> = {
  departamento: 'departamento',
  'casa-1': 'casa',
  'casa-2': 'casa',
  casa: 'casa',
  oficina: 'oficina',
  bodega: 'bodega',
};

const TIPO_CORTO: Record<string, string> = {
  departamento: 'Dpto',
  'casa-1': 'Casa',
  'casa-2': 'Casa',
  casa: 'Casa',
  oficina: 'Oficina',
  bodega: 'Bodega',
};

export const tipoLargo = (v: string) => TIPO_LARGO[v] || v || 'domicilio';
export const tipoCorto = (v: string) => TIPO_CORTO[v] || v || 'Domicilio';

export const formatFechaCL = (iso?: string) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${d}-${m}-${y}`;
};

/**
 * Mudanza de varios días: los días de embalaje ANTES de la mudanza y las personas que embalan cada
 * uno. Viven en `textos` (claves `dias_embalaje` y `personas_embalaje`) para no tocar la tabla.
 * 0 días = todo el mismo día, que es como se cotizaba hasta ahora.
 */
export const diasEmbalaje = (doc: DocState) => {
  if (!doc.con_embalaje) return 0;
  const n = Math.floor(Number((doc.textos || {}).dias_embalaje));
  return Number.isFinite(n) && n > 0 ? Math.min(n, 6) : 0;
};

export const personasEmbalaje = (doc: DocState) => {
  const n = Math.floor(Number((doc.textos || {}).personas_embalaje));
  return Number.isFinite(n) && n > 0 ? n : doc.personas;
};

const ORDINALES = ['PRIMER', 'SEGUNDO', 'TERCER', 'CUARTO', 'QUINTO', 'SEXTO', 'SÉPTIMO'];
export const nombreDia = (i: number) => `${ORDINALES[i] ?? `DÍA ${i + 1}`}${i < ORDINALES.length ? ' DÍA' : ''}`;

export const precioFinal = (doc: DocState) =>
  doc.precio_final !== null && doc.precio_final !== undefined ? doc.precio_final : doc.precio_calculado;

export function buildVars(doc: DocState, cfg: DocConfig): TplVars {
  const m3 = totalM3(doc.inventario);
  const m2 = m3ToBodegaM2(m3);
  const precio = precioFinal(doc);
  const nombreCorto = (doc.cliente.nombre || '').split(' ')[0] || '';
  const materiales = doc.materiales
    .map((k) => (doc.textos[k] !== undefined ? doc.textos[k] : cfg.textosDefault[k]))
    .filter(Boolean)
    .join(', ');

  return {
    folio: doc.folio,
    fecha: formatFechaCL(doc.fecha_servicio),
    saludo: doc.saludo,
    nombre: doc.cliente.razonSocial || doc.cliente.nombre,
    nombreCorto,
    razonSocial: doc.cliente.razonSocial || '',
    email: doc.cliente.email || '',
    telefono: doc.cliente.telefono || '',
    tituloServicio: doc.titulo_servicio,
    tipoOrigen: tipoLargo(doc.cliente.origenTipo),
    tipoDestino: tipoLargo(doc.cliente.destinoTipo),
    tipoOrigenCorto: tipoCorto(doc.cliente.origenTipo),
    tipoDestinoCorto: tipoCorto(doc.cliente.destinoTipo),
    origenDir: doc.cliente.origenDir,
    origenComuna: doc.cliente.origenComuna,
    origenPiso: doc.cliente.origenPiso || '',
    origenAscensor: doc.cliente.origenAscensor ? 'con ascensor' : 'sin ascensor',
    destinoDir: doc.cliente.destinoDir,
    destinoComuna: doc.cliente.destinoComuna,
    destinoPiso: doc.cliente.destinoPiso || '',
    destinoAscensor: doc.cliente.destinoAscensor ? 'con ascensor' : 'sin ascensor',
    m3: m3.toFixed(1),
    m2: m2.toFixed(1),
    items: totalItems(doc.inventario),
    camion: camionLabel(doc.camion),
    camiones: doc.camion_qty,
    choferes: doc.camion_qty,
    personas: doc.personas,
    precio: formatCLP(precio),
    cuota1: doc.cuota1,
    cuota2: doc.cuota2,
    montoCuota1: formatCLP(Math.round((precio * doc.cuota1) / 100)),
    montoCuota2: formatCLP(Math.round((precio * doc.cuota2) / 100)),
    listaInventario: doc.inventario.map((l) => `${dosDigitos(l.qty)} ${l.name}`).join(', '),
    listaMateriales: materiales,
    embalaje: doc.con_embalaje,
    armadoCamas: doc.armado_camas,
    // Datos de la empresa (para textos editables del pie y encabezado)
    titular: cfg.empresa.titular,
    rut: cfg.empresa.rut,
    banco: cfg.empresa.banco,
    cuenta: cfg.empresa.cuenta,
    numeroCuenta: cfg.empresa.numero,
    correo: cfg.empresa.correo,
    wsp1: cfg.empresa.wsp1,
    wsp2: cfg.empresa.wsp2,
    web: cfg.empresa.web,
    akikbCorreo: cfg.empresa.akikb_correo,
    akikbWsp: cfg.empresa.akikb_wsp,
    akikbOficina: cfg.empresa.akikb_oficina,
    servicio: tipoServicioLabel(doc.tipo_servicio) ? `${tipoServicioLabel(doc.tipo_servicio)} — ` : '',
    servicioNombre: tipoServicioLabel(doc.tipo_servicio),
  };
}

/** Texto resuelto (override ?? default) e interpolado. */
export function txt(doc: DocState, cfg: DocConfig, key: string, vars: TplVars): string {
  return resolveTexto(key, doc.textos || {}, cfg.textosDefault, vars);
}

export { renderTemplate };

/** ¿Se muestra una sección del documento? Por defecto sí; se oculta con "0". */
export const verSeccion = (doc: DocState, key: string) => (doc.textos || {})[`ver_${key}`] !== '0';

/**
 * Acciones visibles según el estado del documento.
 * - Sin embalaje: se ocultan embalar/desembalar.
 * - Destino bodega: se ocultan desembalar y armado de camas (no aplican en bodega).
 * - Sin armado de camas: se oculta la acción de camas.
 */
export function accionesVisibles(doc: DocState): string[] {
  const esBodega = doc.cliente.destinoTipo === 'bodega';
  return doc.acciones.filter((k) => {
    if (!doc.con_embalaje && (k === 'accion_embalar' || k === 'accion_desembalar')) return false;
    if (esBodega && (k === 'accion_desembalar' || k === 'accion_camas')) return false;
    if (!doc.armado_camas && k === 'accion_camas') return false;
    return true;
  });
}
export function agruparInventario(lineas: LineaInventario[]) {
  const groups: { category: string; items: LineaInventario[] }[] = [];
  lineas.forEach((l) => {
    const cat = l.category || 'OTROS';
    let g = groups.find((x) => x.category === cat);
    if (!g) {
      g = { category: cat, items: [] };
      groups.push(g);
    }
    g.items.push(l);
  });
  return groups;
}

export const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

/* ---------- Tamaño de hoja y de letra (se guardan en `textos`, sin tocar la tabla) ---------- */
export const HOJAS = {
  a4: { label: 'A4 (210 × 297 mm)', w: 210, h: 297 },
  oficio: { label: 'Oficio (216 × 330 mm)', w: 216, h: 330 },
  tabloide: { label: 'Tabloide (279 × 432 mm)', w: 279, h: 432 },
  a3: { label: 'A3 (297 × 420 mm)', w: 297, h: 420 },
} as const;
export type HojaKey = keyof typeof HOJAS;

export const hojaDe = (doc: DocState): HojaKey => {
  const k = ((doc.textos || {}).hoja || '') as HojaKey;
  return k in HOJAS ? k : 'a4';
};

export const LETRA_OPCIONES = [
  { v: '1', label: 'Normal' },
  { v: '1.15', label: 'Grande' },
  { v: '1.3', label: 'Muy grande' },
] as const;

export const escalaLetra = (doc: DocState) => {
  const n = Number((doc.textos || {}).letra);
  return LETRA_OPCIONES.some((o) => Number(o.v) === n) ? n : 1;
};

/** Variables CSS del documento: ancho, alto de hoja y escala de letra. */
export const estiloHoja = (doc: DocState): CSSProperties => {
  const h = HOJAS[hojaDe(doc)];
  return { '--pw': `${h.w}mm`, '--ph': `${h.h}mm`, '--fs': String(escalaLetra(doc)) } as CSSProperties;
};

/* ---------- Plan por día ---------- */
export interface DiaPlan {
  nombre: string;
  final: boolean;
  lineas: { texto: string; equipo?: boolean }[];
}

const ACCIONES_EMBALAJE = ['accion_embalar', 'accion_cocina', 'accion_adornos', 'accion_libros', 'accion_juguetes'];

/**
 * Qué se hace cada día en una mudanza de varios días: los días previos embalan y el último carga,
 * traslada y arma. Sin días previos devuelve [] (un solo día no necesita línea de tiempo).
 */
export function planAuto(doc: DocState, cfg: DocConfig, vars: TplVars): DiaPlan[] {
  const previos = diasEmbalaje(doc);
  if (previos === 0) return [];
  const acciones = accionesVisibles(doc);
  const resolver = (ks: string[]) => ks.map((k) => txt(doc, cfg, k, vars)).filter(Boolean);
  const embalar = resolver(acciones.filter((k) => ACCIONES_EMBALAJE.includes(k)));
  const mudanza = resolver(acciones.filter((k) => !ACCIONES_EMBALAJE.includes(k)));
  const personas = personasEmbalaje(doc);
  const dias: DiaPlan[] = [];
  for (let d = 0; d < previos; d++) {
    dias.push({
      nombre: nombreDia(d),
      final: false,
      lineas: [
        { texto: `${dosDigitos(personas)} personas operativas`, equipo: true },
        ...(embalar.length ? embalar : [`Embalaje en ${vars.tipoOrigen} origen (${vars.origenComuna}).`]).map((t) => ({ texto: t })),
        ...(d === 0 && doc.materiales.length ? [{ texto: 'Incluye materiales de embalaje.' }] : []),
      ],
    });
  }
  dias.push({
    nombre: nombreDia(previos),
    final: true,
    lineas: [
      { texto: `${dosDigitos(doc.camion_qty)} ${camionLabel(doc.camion)} · ${dosDigitos(doc.camion_qty)} chofer · ${dosDigitos(doc.personas)} personas operativas`, equipo: true },
      ...mudanza.map((t) => ({ texto: t })),
    ],
  });
  return dias;
}

/** Texto que el usuario escribió a mano para el día `i` (0 = primer día); undefined = automático. */
export const textoDelDia = (doc: DocState, i: number): string | undefined => (doc.textos || {})[`dia_${i}`];

/** Plan por día con los textos escritos a mano encima de los automáticos (una línea por punto). */
export function planPorDia(doc: DocState, cfg: DocConfig, vars: TplVars): DiaPlan[] {
  return planAuto(doc, cfg, vars).map((d, i) => {
    const manual = textoDelDia(doc, i);
    if (manual === undefined) return d;
    const lineas = manual.split('\n').map((t) => t.trim()).filter(Boolean).map((texto, j) => ({ texto, equipo: j === 0 }));
    return { ...d, lineas };
  });
}
