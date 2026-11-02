import { describe, expect, it } from 'vitest';
import { calcularPrecio, sugerirCamion } from './pricing';
import { CAMIONES, DEFAULT_TARIFAS } from './defaults';
import { diasEmbalaje, nombreDia, personasEmbalaje, type DocState } from './document';

const base = { m3: 20, camion: 'camion35', camionQty: 1, personas: 4, conEmbalaje: true };

describe('mudanza de varios días', () => {
  it('sin días previos el precio es el de siempre', () => {
    expect(calcularPrecio({ ...base, diasEmbalaje: 0 }).subtotal).toBe(calcularPrecio(base).subtotal);
  });

  it('cada día previo suma personas × tarifa de persona', () => {
    const uno = calcularPrecio({ ...base, diasEmbalaje: 1, personasEmbalaje: 4 });
    const dos = calcularPrecio({ ...base, diasEmbalaje: 2, personasEmbalaje: 4 });
    expect(uno.subtotal - calcularPrecio(base).subtotal).toBe(4 * 45000);
    expect(dos.subtotal - uno.subtotal).toBe(4 * 45000);
  });

  it('lee los días y personas desde textos, y sin embalaje no hay días previos', () => {
    const doc = { con_embalaje: true, personas: 3, textos: { dias_embalaje: '2' } } as unknown as DocState;
    expect(diasEmbalaje(doc)).toBe(2);
    expect(personasEmbalaje(doc)).toBe(3);
    expect(diasEmbalaje({ ...doc, con_embalaje: false })).toBe(0);
    expect(nombreDia(0)).toBe('PRIMER DÍA');
    expect(nombreDia(1)).toBe('SEGUNDO DÍA');
  });
});

describe('camiones de Marco (Pick Up y de 15 a 55 m³)', () => {
  it('cada camión de la lista tiene tarifa y se cobra', () => {
    for (const c of CAMIONES) {
      expect(DEFAULT_TARIFAS[c.key as keyof typeof DEFAULT_TARIFAS]).toBeGreaterThan(0);
      const sinCamion = calcularPrecio({ ...base, camion: 'no-existe' }).subtotal;
      expect(calcularPrecio({ ...base, camion: c.key }).subtotal).toBeGreaterThan(sinCamion);
    }
  });

  it('sugiere el primer camión que alcanza, sin sugerir nunca la Pick Up', () => {
    expect(sugerirCamion(1).camion).toBe('camion15');
    expect(sugerirCamion(16).camion).toBe('camion20'); // 16 × 1,15 = 18,4
    expect(sugerirCamion(47).camion).toBe('camion55'); // 54,05
  });

  it('sobre el mayor, varios camiones de 55', () => {
    expect(sugerirCamion(60)).toEqual({ camion: 'camion55', cantidad: 2 });
  });
});
