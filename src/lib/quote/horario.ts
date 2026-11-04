// La hora del servicio, que se elige en «Cotizar» junto a la fecha (Daniela y José, 2026-11-03:
// el calendario tiene que mostrar cada servicio con su horario, como Google Calendar).
//
// Texto `HH:MM` en 24 horas, hora de Chile, sin zona ni `Date`: es la hora que se dice por
// teléfono ("a las 10"), no un instante. El término es opcional; sin él es «a las 10:00».

export const HORA_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export interface Horario {
  inicio: string;
  /** Vacío = sin hora de término. */
  fin: string;
}

/** ¿Es una hora `HH:MM` que existe? */
export function esHoraValida(hora: string | null | undefined): boolean {
  return HORA_RE.test((hora ?? '').trim());
}

/** El término tiene que ser después del inicio, y sin inicio no hay término. Vacío es válido. */
export function horarioValido(inicio: string | null | undefined, fin: string | null | undefined): boolean {
  const i = (inicio ?? '').trim();
  const f = (fin ?? '').trim();
  if (!i && !f) return true;
  if (!esHoraValida(i)) return false;
  if (!f) return true;
  return esHoraValida(f) && f > i;
}

/** `10:00` o `10:00 – 13:00`, para la tarjeta del calendario y el Excel. */
export function textoHora(inicio: string | null | undefined, fin: string | null | undefined): string {
  const i = (inicio ?? '').trim();
  const f = (fin ?? '').trim();
  if (!i) return '';
  return f ? `${i} – ${f}` : i;
}

/** «a las 10:00» o «de 10:00 a 13:00», para meter dentro de una frase (la hoja y el correo). */
export function textoHoraEnFrase(inicio: string | null | undefined, fin: string | null | undefined): string {
  const i = (inicio ?? '').trim();
  const f = (fin ?? '').trim();
  if (!i) return '';
  return f ? `de ${i} a ${f}` : `a las ${i}`;
}

/** Ordena por hora de inicio; lo que no tiene hora va al final del día. */
export function compararPorHora(a: string | null | undefined, b: string | null | undefined): number {
  const x = (a ?? '').trim();
  const y = (b ?? '').trim();
  if (x === y) return 0;
  if (!x) return 1;
  if (!y) return -1;
  return x < y ? -1 : 1;
}
