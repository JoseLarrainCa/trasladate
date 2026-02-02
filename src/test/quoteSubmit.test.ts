/**
 * Integration test: simulates form submit (quote + quote_items) against Supabase.
 * Run: npm test -- src/test/quoteSubmit.test.ts
 * Requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (e.g. from .env.local).
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;

const hasEnv = Boolean(supabaseUrl && supabaseAnonKey);

describe('Quote form submit (integration)', () => {
  if (!hasEnv) {
    it.skip('skipped: missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY', () => {});
    return;
  }

  // Using untyped client to avoid type mismatches
  const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

  it('inserts quote and quote_items without 401', async () => {
    const quoteId = crypto.randomUUID();

    const quoteData = {
      id: quoteId,
      cliente_nombre: 'Test Cotización',
      cliente_apellido: 'Prueba',
      telefono: '+56912345678',
      celular: null,
      email: 'test@example.com',
      origen_direccion: 'Av. Test 123',
      origen_comuna: 'Providencia',
      origen_tipo_vivienda: 'departamento',
      origen_tiene_ascensor: true,
      origen_piso: 5,
      destino_direccion: 'Calle Destino 456',
      destino_comuna: 'Las Condes',
      destino_tipo_vivienda: 'departamento',
      destino_tiene_ascensor: false,
      destino_piso: null,
      tipo_mudanza: 'hogar',
      fecha_traslado: null,
      fecha_indefinida: true,
      sugerencia_adicional: 'Prueba automatizada.',
    };

    const { error: quoteError } = await supabase.from('quotes').insert(quoteData);
    expect(quoteError).toBeNull();

    const inventoryItems = [
      {
        quote_id: quoteId,
        item_key: 'living_sofa_3_cuerpos',
        item_name: 'Sofá de 3 cuerpos',
        category: 'LIVING',
        quantity: 1,
      },
      {
        quote_id: quoteId,
        item_key: 'cocina_sillas',
        item_name: 'Sillas de comedor',
        category: 'COCINA-COMEDOR',
        quantity: 4,
      },
    ];

    const { error: itemsError } = await supabase.from('quote_items').insert(inventoryItems);
    expect(itemsError).toBeNull();
  });
});
