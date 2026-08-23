import { CAMIONES, DEFAULT_TARIFAS, type Tarifas } from './defaults';

/** 1 m² de bodega = 2.5 m³ de mudanza */
export const M2_FACTOR = 2.5;
/** Holgura de carga del camión */
export const HOLGURA = 1.15;

export const m3ToBodegaM2 = (m3: number) => m3 / M2_FACTOR;

export interface LineaInventario {
  item_key: string;
  name: string;
  qty: number;
  m3: number;
  category?: string;
}

export const totalM3 = (lineas: LineaInventario[]) =>
  lineas.reduce((s, l) => s + (Number(l.m3) || 0) * (Number(l.qty) || 0), 0);

export const totalItems = (lineas: LineaInventario[]) =>
  lineas.reduce((s, l) => s + (Number(l.qty) || 0), 0);

/** Primer camión cuya capacidad ≥ m³ × 1.15; si supera 45 m³, varios camiones de 45. */
export function sugerirCamion(m3: number): { camion: string; cantidad: number } {
  const necesario = m3 * HOLGURA;
  const found = CAMIONES.find((c) => c.capacidad >= necesario);
  if (found) return { camion: found.key, cantidad: 1 };
  return { camion: 'camion45', cantidad: Math.max(1, Math.ceil(necesario / 45)) };
}

export function sugerirPersonas(m3: number): number {
  if (m3 <= 8) return 2;
  if (m3 <= 20) return 3;
  if (m3 <= 32) return 4;
  if (m3 <= 45) return 5;
  return 5 + Math.ceil((m3 - 45) / 12);
}

export interface CalcInput {
  m3: number;
  camion: string;
  camionQty: number;
  personas: number;
  conEmbalaje: boolean;
  recargos?: { escala?: number; rampa?: number; estac?: number; otro?: number };
  tarifas?: Tarifas;
}

export interface CalcResult {
  subtotal: number;
  precioCalculado: number;
  desglose: { label: string; valor: number }[];
}

export function calcularPrecio(input: CalcInput): CalcResult {
  const t = { ...DEFAULT_TARIFAS, ...(input.tarifas || {}) };
  const r = input.recargos || {};
  const tarifaCamion = (t as unknown as Record<string, number>)[input.camion] ?? 0;
  const desglose: { label: string; valor: number }[] = [];

  const camiones = tarifaCamion * input.camionQty;
  const choferes = t.chofer * input.camionQty;
  const personas = t.persona * input.personas;
  const embalaje = input.conEmbalaje ? Math.round(t.embalajeM3 * input.m3) : 0;

  desglose.push({ label: `Camión × ${input.camionQty}`, valor: camiones });
  desglose.push({ label: `Chofer × ${input.camionQty}`, valor: choferes });
  desglose.push({ label: `Personal operativo × ${input.personas}`, valor: personas });
  if (embalaje) desglose.push({ label: `Embalaje (${input.m3.toFixed(1)} m³)`, valor: embalaje });
  if (r.escala) desglose.push({ label: 'Recargo escala', valor: r.escala });
  if (r.rampa) desglose.push({ label: 'Recargo rampa', valor: r.rampa });
  if (r.estac) desglose.push({ label: 'Recargo estacionamiento', valor: r.estac });
  if (r.otro) desglose.push({ label: 'Otro recargo', valor: r.otro });

  const subtotal =
    camiones + choferes + personas + embalaje + (r.escala || 0) + (r.rampa || 0) + (r.estac || 0) + (r.otro || 0);

  return { subtotal, precioCalculado: Math.max(subtotal, t.minimo), desglose };
}

export const formatCLP = (n: number) =>
  '$' + Math.round(Number(n) || 0).toLocaleString('es-CL', { maximumFractionDigits: 0 });

export const camionLabel = (key: string) => CAMIONES.find((c) => c.key === key)?.label || key;
