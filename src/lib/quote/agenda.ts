// El calendario de servicios agendados (mismo cambio que Railen, 2026-11-04): una grilla por
// mes, un puntito en los días con servicios y la lista del día.
//
// Todo con fechas como TEXTO `AAAA-MM-DD` y meses `AAAA-MM`, y sin `Date`: un `AAAA-MM-DD`
// crudo es medianoche UTC y en Chile imprime el día anterior. La semana parte en lunes.

import { compararPorHora } from './horario';

const pad = (n: number) => String(n).padStart(2, '0');

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
export const DIAS_CORTOS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const;
const DIAS_LARGOS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

/** La cotización con su documento (la hoja que se le armó al cliente), si ya tiene. */
export interface CotizacionAgenda {
  id: string;
  estado: string;
  cliente_nombre: string;
  cliente_apellido?: string | null;
  origen_comuna?: string | null;
  destino_comuna?: string | null;
  /** Lo que escribió el cliente en el formulario. */
  fecha_traslado: string | null;
  hoja: {
    id: string;
    folio: number;
    fecha_servicio: string | null;
    hora_inicio: string | null;
    hora_fin: string | null;
    precio: number | null;
  } | null;
}

/** El día de hoy en Chile como `AAAA-MM-DD` (no el de UTC: de noche ya sería mañana). */
export function hoyEnChile(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago' }).format(new Date());
}

const esBisiesto = (a: number) => (a % 4 === 0 && a % 100 !== 0) || a % 400 === 0;

export function diasDelMes(mes: string): number {
  const [a, m] = mes.split('-').map(Number);
  if (m === 2) return esBisiesto(a) ? 29 : 28;
  return [4, 6, 9, 11].includes(m) ? 30 : 31;
}

/** `sumarMeses('2026-12', 1)` = `2027-01`. */
export function sumarMeses(mes: string, n: number): string {
  const [a, m] = mes.split('-').map(Number);
  const total = a * 12 + (m - 1) + n;
  return `${Math.floor(total / 12)}-${pad((total % 12) + 1)}`;
}

export function tituloDelMes(mes: string): string {
  const [a, m] = mes.split('-').map(Number);
  return `${MESES[m - 1]} ${a}`;
}

/** Día de la semana con el lunes en 0 (algoritmo de Sakamoto, sin `Date`). */
export function diaLunesPrimero(fecha: string): number {
  const [a0, m, d] = fecha.split('-').map(Number);
  const t = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
  const a = m < 3 ? a0 - 1 : a0;
  const domingoCero = (a + Math.floor(a / 4) - Math.floor(a / 100) + Math.floor(a / 400) + t[m - 1] + d) % 7;
  return (domingoCero + 6) % 7;
}

/** Las celdas del mes de a siete por semana: `null` antes del 1 y después del último día. */
export function semanasDelMes(mes: string): (string | null)[][] {
  const celdas: (string | null)[] = Array.from({ length: diaLunesPrimero(`${mes}-01`) }, () => null);
  for (let d = 1; d <= diasDelMes(mes); d++) celdas.push(`${mes}-${pad(d)}`);
  while (celdas.length % 7 !== 0) celdas.push(null);
  const semanas: (string | null)[][] = [];
  for (let i = 0; i < celdas.length; i += 7) semanas.push(celdas.slice(i, i + 7));
  return semanas;
}

/** `2026-11-09` → `lunes 9 de noviembre de 2026`. */
export function tituloDelDia(fecha: string): string {
  const [a, m, d] = fecha.split('-').map(Number);
  return `${DIAS_LARGOS[diaLunesPrimero(fecha)]} ${d} de ${MESES[m - 1]} de ${a}`;
}

/** `2026-11-09` → `9 nov 2026`, para la tarjeta. */
export function fechaCorta(fecha: string): string {
  const [a, m, d] = fecha.split('-').map(Number);
  return `${d} ${MESES[m - 1].slice(0, 3)} ${a}`;
}

const FECHA_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

/** Qué estados cuentan como «agendado»: confirmado y completado. Las cotizadas sin confirmar
 *  solo se muestran si se pide (en gris). Las canceladas, nunca. */
export function estadosAgendados(incluirCotizadas: boolean): string[] {
  return incluirCotizadas ? ['confirmado', 'completado', 'cotizado'] : ['confirmado', 'completado'];
}

/** La fecha del servicio: la acordada en la hoja, y si no hay, la del formulario. Solo el día
 *  (el formulario puede traer una hora pegada). Vacío si no es una fecha que exista. */
export function fechaDeAgenda(q: Pick<CotizacionAgenda, 'hoja' | 'fecha_traslado'>): string {
  const cruda = (q.hoja?.fecha_servicio || q.fecha_traslado || '').slice(0, 10);
  return FECHA_RE.test(cruda) ? cruda : '';
}

export interface Agenda {
  /** `AAAA-MM-DD` → las cotizaciones que caen ese día. */
  porDia: Map<string, CotizacionAgenda[]>;
  /** Agendadas pero sin fecha: que no desaparezcan. */
  sinFecha: CotizacionAgenda[];
}

export function armarAgenda(cotizaciones: CotizacionAgenda[], incluirCotizadas = false): Agenda {
  const validos = estadosAgendados(incluirCotizadas);
  const porDia = new Map<string, CotizacionAgenda[]>();
  const sinFecha: CotizacionAgenda[] = [];
  for (const q of cotizaciones) {
    if (!validos.includes(q.estado)) continue;
    const dia = fechaDeAgenda(q);
    if (!dia) {
      sinFecha.push(q);
      continue;
    }
    const lista = porDia.get(dia) ?? [];
    lista.push(q);
    porDia.set(dia, lista);
  }
  // Dentro de cada día, por hora de inicio (lo que no tiene hora va al final), como una agenda.
  for (const lista of porDia.values()) {
    lista.sort((a, b) => compararPorHora(a.hoja?.hora_inicio, b.hoja?.hora_inicio));
  }
  return { porDia, sinFecha };
}

/** Une las cotizaciones con su hoja (una por cotización) para armar la agenda. */
export function unirConHoja(quotes: any[], docs: any[]): CotizacionAgenda[] {
  const hojaDe = new Map<string, any>();
  // Si hubiera más de una hoja por cotización, vale la más reciente.
  const ordenadas = [...docs].sort((a, b) => String(a.updated_at ?? '').localeCompare(String(b.updated_at ?? '')));
  for (const d of ordenadas) if (d.quote_id) hojaDe.set(d.quote_id, d);
  return quotes.map((q) => {
    const d = hojaDe.get(q.id);
    return {
      id: q.id,
      estado: q.estado,
      cliente_nombre: q.cliente_nombre,
      cliente_apellido: q.cliente_apellido,
      origen_comuna: q.origen_comuna,
      destino_comuna: q.destino_comuna,
      fecha_traslado: q.fecha_traslado,
      hoja: d
        ? {
            id: d.id,
            folio: d.folio,
            fecha_servicio: d.fecha_servicio,
            hora_inicio: d.hora_inicio ?? null,
            hora_fin: d.hora_fin ?? null,
            precio: d.precio_final ?? d.precio_calculado ?? null,
          }
        : null,
    };
  });
}
