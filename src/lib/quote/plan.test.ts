import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { DEFAULT_CONFIG, buildVars, planPorDia, planAuto, type DocState } from './document';
import { ACCION_KEYS, MATERIALES_DOMICILIO, OBSERVACION_KEYS } from './defaults';
import DocMarco from '@/components/admin/pdf/DocMarco';

const base = (textos: Record<string, string>): DocState => ({
  folio: 1, formato: 'marco', fecha_servicio: '', hora_inicio: '', hora_fin: '', titulo_servicio: 'TRASLADO + EMBALAJE',
  saludo: 'Estimado', tipo_servicio: '',
  cliente: { nombre: 'Ana Pérez', origenDir: 'A 1', origenComuna: 'Las Condes', origenAscensor: true, origenTipo: 'departamento', destinoDir: 'B 2', destinoComuna: 'Vitacura', destinoAscensor: true, destinoTipo: 'casa' },
  camion: 'camion25', camion_qty: 1, personas: 3, con_embalaje: true, armado_camas: true, sin_iva: true, con_galeria: false,
  cuota1: 50, cuota2: 50, recargo_escala: 0, recargo_rampa: 0, recargo_estac: 0, recargo_otro: 0, precio_calculado: 1000, precio_final: 1000,
  textos, materiales: [...MATERIALES_DOMICILIO], observaciones: [...OBSERVACION_KEYS], acciones: [...ACCION_KEYS], inventario: [],
});
const plan = (d: DocState) => planPorDia(d, DEFAULT_CONFIG, buildVars(d, DEFAULT_CONFIG));

describe('plan por día', () => {
  it('un solo día no genera plan', () => expect(plan(base({}))).toEqual([]));
  it('N días de embalaje + el día de la mudanza', () => {
    const p = plan(base({ dias_embalaje: '3' }));
    expect(p).toHaveLength(4);
    expect(p[3].final).toBe(true);
    expect(p[0].lineas[0].texto).toContain('personas operativas');
  });
  it('un texto escrito a mano reemplaza solo ese día', () => {
    const d = base({ dias_embalaje: '1', dia_0: 'Cocina y loza\nDormitorios' });
    const p = plan(d);
    expect(p[0].lineas.map((l) => l.texto)).toEqual(['Cocina y loza', 'Dormitorios']);
    expect(p[1].lineas).toEqual(planAuto(d, DEFAULT_CONFIG, buildVars(d, DEFAULT_CONFIG))[1].lineas);
  });
  it('el PDF de Marco marca cada día y cada texto como editable', () => {
    const html = renderToStaticMarkup(createElement(DocMarco, { doc: base({ dias_embalaje: '1' }), cfg: DEFAULT_CONFIG }));
    for (const k of ['dia_0', 'dia_1', 'saludo_cuerpo', 'pago_saldo', 'fila_chofer']) expect(html).toContain(k);
  });
});
