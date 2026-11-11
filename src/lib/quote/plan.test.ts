import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { DEFAULT_CONFIG, buildVars, planPorDia, planAuto, type DocState } from './document';
import { ACCION_KEYS, MATERIALES_DOMICILIO, OBSERVACION_KEYS } from './defaults';
import DocMarco from '@/components/admin/pdf/DocMarco';
import DocModerno from '@/components/admin/pdf/DocModerno';

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

describe('tabla de la hoja 2 editable', () => {
  const html = (textos: Record<string, string>) =>
    renderToStaticMarkup(createElement(DocMarco, { doc: base({ dias_embalaje: '2', ...textos }), cfg: DEFAULT_CONFIG }));

  it('por defecto muestra los textos de siempre, cada uno con su enganche para editar', () => {
    const h = html({});
    expect(h).toContain('Personas operativas para EMBALAR en departamento origen');
    expect(h).toContain('data-edit=",banda_1"');
    expect(h).toContain('data-edit=",fila_embalar_0"');
    expect(h).toContain('data-edit=",fila_camion"');
    expect(h).toContain('data-edit=",tabla_total"');
  });
  it('cambiar el segundo día no toca los otros', () => {
    const h = html({ banda_1: 'DÍA DE COCINA', fila_embalar_1: 'Equipo especial para la cocina' });
    expect(h).toContain('Equipo especial para la cocina');
    expect(h.match(/Personas operativas para EMBALAR/g)).toHaveLength(1);
    expect(h.replace(/<[^>]+>/g, '').replace(/\s/g, '')).toContain('DÍADECOCINA');
    expect(h.replace(/<[^>]+>/g, '').replace(/\s/g, '')).toContain('PRIMERDÍA');
  });
  it('camión y total se pueden reescribir', () => {
    const h = html({ fila_camion: 'Camión de 3/4 con baranda', tabla_total: 'TOTAL NETO' });
    expect(h).toContain('Camión de 3/4 con baranda');
    expect(h).toContain('TOTAL NETO');
  });
});

describe('formato Moderno con varios días', () => {
  const mod = (textos: Record<string, string>) =>
    renderToStaticMarkup(createElement(DocModerno, { doc: { ...base({ dias_embalaje: '1', personas_embalaje: '4', ...textos }), formato: 'moderno' }, cfg: DEFAULT_CONFIG }));
  const plano = (h: string) => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

  it('muestra una fila por día: las 4 personas que embalan el primer día y la mudanza del segundo', () => {
    const h = plano(mod({}));
    expect(h).toContain('PRIMER DÍA · EMBALAJE');
    expect(h).toContain('SEGUNDO DÍA · MUDANZA');
    expect(h).toContain('04 personas operativas');
    expect(h).toContain('03 personas operativas');
  });
  it('cada día se puede editar con las mismas claves que en Marco', () => {
    const h = mod({});
    for (const k of ['dia_0', 'dia_1', 'banda_0', 'banda_1']) expect(h).toContain(k);
  });
  it('un texto escrito a mano para un día aparece en el Moderno', () => {
    expect(plano(mod({ dia_0: 'Cocina y loza\nDormitorios', banda_1: 'DÍA DE MUDANZA' }))).toContain('Cocina y loza');
  });
  it('un solo día sigue mostrando «Equipo y personal»', () => {
    const h = plano(renderToStaticMarkup(createElement(DocModerno, { doc: { ...base({}), formato: 'moderno' }, cfg: DEFAULT_CONFIG })));
    expect(h).toContain('Equipo y personal');
    expect(h).not.toContain('EMBALAJE');
  });
});
