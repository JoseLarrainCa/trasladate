import { describe, expect, it } from 'vitest';
import { calcularPrecio } from './pricing';
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
