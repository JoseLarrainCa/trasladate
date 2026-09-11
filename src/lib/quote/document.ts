import { DEFAULT_EMPRESA, DEFAULT_TEXTOS, type Empresa, type Tarifas, DEFAULT_TARIFAS } from './defaults';
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
