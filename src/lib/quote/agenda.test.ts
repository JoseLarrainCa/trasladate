// El calendario de servicios agendados (mismo cambio que Railen). Fechas como texto, sin `Date`.
import { describe, expect, it } from 'vitest';
import {
  armarAgenda,
  diaLunesPrimero,
  diasDelMes,
  fechaDeAgenda,
  semanasDelMes,
  sumarMeses,
  tituloDelDia,
  tituloDelMes,
  unirConHoja,
  type CotizacionAgenda,
} from './agenda';
import { compararPorHora, esHoraValida, horarioValido, textoHora } from './horario';

const q = (
  id: string,
  estado: string,
  fecha: string | null,
  hoja: Partial<NonNullable<CotizacionAgenda['hoja']>> | null = null,
): CotizacionAgenda => ({
  id,
  estado,
  cliente_nombre: id,
  fecha_traslado: fecha,
  hoja: hoja ? { id: `h-${id}`, folio: 1, fecha_servicio: null, hora_inicio: null, hora_fin: null, precio: 1, ...hoja } : null,
});

describe('la grilla del mes (lunes primero)', () => {
  it('noviembre de 2026 parte en domingo: seis celdas vacías antes del 1', () => {
    expect(diaLunesPrimero('2026-11-01')).toBe(6);
    const semanas = semanasDelMes('2026-11');
    expect(semanas[0]).toEqual([null, null, null, null, null, null, '2026-11-01']);
    expect(semanas.every((s) => s.length === 7)).toBe(true);
    expect(semanas.flat().filter(Boolean)).toHaveLength(30);
  });

  it('un mes que parte en lunes no trae celdas vacías al comienzo (junio de 2026)', () => {
    expect(semanasDelMes('2026-06')[0][0]).toBe('2026-06-01');
  });

  it('los días de cada mes, con bisiestos', () => {
    expect(diasDelMes('2026-02')).toBe(28);
    expect(diasDelMes('2028-02')).toBe(29);
    expect(diasDelMes('2100-02')).toBe(28);
    expect(diasDelMes('2026-04')).toBe(30);
  });

  it('suma meses cruzando el año', () => {
    expect(sumarMeses('2026-12', 1)).toBe('2027-01');
    expect(sumarMeses('2026-01', -1)).toBe('2025-12');
  });

  it('los títulos se leen en castellano', () => {
    expect(tituloDelMes('2026-11')).toBe('noviembre 2026');
    expect(tituloDelDia('2026-11-09')).toBe('lunes 9 de noviembre de 2026');
  });
});

describe('qué fecha vale', () => {
  it('la de la hoja manda sobre la del formulario', () => {
    expect(fechaDeAgenda(q('a', 'confirmado', '2026-11-10', { fecha_servicio: '2026-11-20' }))).toBe('2026-11-20');
    expect(fechaDeAgenda(q('a', 'confirmado', '2026-11-10', { fecha_servicio: null }))).toBe('2026-11-10');
  });

  it('el formulario puede traer la hora pegada: cuenta solo el día', () => {
    expect(fechaDeAgenda(q('a', 'confirmado', '2026-11-10T00:00:00.000Z'))).toBe('2026-11-10');
  });

  it('una fecha que no existe no agenda nada (en vez de colgar o pintar mal)', () => {
    expect(fechaDeAgenda(q('a', 'confirmado', 'pronto'))).toBe('');
    expect(fechaDeAgenda(q('a', 'confirmado', '2026-13-40'))).toBe('');
    expect(fechaDeAgenda(q('a', 'confirmado', null))).toBe('');
  });
});

describe('la agenda', () => {
  const lista = [
    q('conf', 'confirmado', '2026-11-10'),
    q('comp', 'completado', '2026-11-10'),
    q('cot', 'cotizado', '2026-11-11'),
    q('canc', 'cancelado', '2026-11-12'),
    q('pend', 'pendiente', '2026-11-13'),
    q('sin', 'confirmado', null),
  ];

  it('solo cuentan confirmadas y completadas; canceladas y pendientes no aparecen', () => {
    const { porDia, sinFecha } = armarAgenda(lista);
    expect(porDia.get('2026-11-10')?.map((x) => x.id)).toEqual(['conf', 'comp']);
    expect(porDia.has('2026-11-11')).toBe(false);
    expect(porDia.has('2026-11-12')).toBe(false);
    expect(porDia.has('2026-11-13')).toBe(false);
    expect(sinFecha.map((x) => x.id)).toEqual(['sin']);
  });

  it('con el interruptor, las cotizadas sin confirmar también salen; las canceladas, nunca', () => {
    const { porDia } = armarAgenda(lista, true);
    expect(porDia.get('2026-11-11')?.map((x) => x.id)).toEqual(['cot']);
    expect(porDia.has('2026-11-12')).toBe(false);
  });

  it('el día se ordena por hora de inicio y lo que no tiene hora va al final', () => {
    const { porDia } = armarAgenda([
      q('sin-hora', 'confirmado', '2026-11-10'),
      q('tarde', 'confirmado', '2026-11-10', { hora_inicio: '15:00' }),
      q('temprano', 'confirmado', '2026-11-10', { hora_inicio: '08:30' }),
    ]);
    expect(porDia.get('2026-11-10')?.map((x) => x.id)).toEqual(['temprano', 'tarde', 'sin-hora']);
  });
});

describe('unir cotizaciones con su hoja', () => {
  it('cada cotización recibe su hoja, con el precio final si lo hay y el calculado si no', () => {
    const quotes = [{ id: 'a', estado: 'confirmado', cliente_nombre: 'Ana', fecha_traslado: null }];
    const docs = [
      { id: 'd1', quote_id: 'a', folio: 3300, fecha_servicio: '2026-11-20', hora_inicio: '10:00', hora_fin: null, precio_final: null, precio_calculado: 380000 },
    ];
    const [r] = unirConHoja(quotes, docs);
    expect(r.hoja).toMatchObject({ id: 'd1', folio: 3300, hora_inicio: '10:00', precio: 380000 });
  });

  it('una cotización sin hoja queda con hoja null, y una hoja huérfana no rompe nada', () => {
    const r = unirConHoja(
      [{ id: 'a', estado: 'confirmado', cliente_nombre: 'Ana', fecha_traslado: '2026-11-02' }],
      [{ id: 'd', quote_id: null, folio: 1 }],
    );
    expect(r[0].hoja).toBeNull();
  });

  it('si una cotización tiene dos hojas, vale la más reciente', () => {
    const [r] = unirConHoja(
      [{ id: 'a', estado: 'confirmado', cliente_nombre: 'Ana', fecha_traslado: null }],
      [
        { id: 'nueva', quote_id: 'a', folio: 2, updated_at: '2026-11-03T10:00:00Z' },
        { id: 'vieja', quote_id: 'a', folio: 1, updated_at: '2026-10-01T10:00:00Z' },
      ],
    );
    expect(r.hoja?.id).toBe('nueva');
  });
});

describe('la hora del servicio', () => {
  it('acepta HH:MM en 24 horas y rechaza lo demás', () => {
    for (const h of ['00:00', '09:30', '23:59']) expect(esHoraValida(h)).toBe(true);
    for (const h of ['24:00', '10:60', '9:30', '10', '']) expect(esHoraValida(h)).toBe(false);
  });

  it('el término tiene que ser después del inicio, y sin inicio no hay término', () => {
    expect(horarioValido('', '')).toBe(true);
    expect(horarioValido('10:00', '')).toBe(true);
    expect(horarioValido('10:00', '13:00')).toBe(true);
    expect(horarioValido('13:00', '10:00')).toBe(false);
    expect(horarioValido('10:00', '10:00')).toBe(false);
    expect(horarioValido('', '13:00')).toBe(false);
  });

  it('se escribe como 10:00 o 10:00 – 13:00, y ordena con lo vacío al final', () => {
    expect(textoHora('10:00', '')).toBe('10:00');
    expect(textoHora('10:00', '13:00')).toBe('10:00 – 13:00');
    expect(textoHora('', '13:00')).toBe('');
    expect(['15:00', '', '08:00'].sort(compararPorHora)).toEqual(['08:00', '15:00', '']);
  });
});
