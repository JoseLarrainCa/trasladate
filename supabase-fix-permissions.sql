-- ============================================
-- FIX: Error 401 al insertar cotizaciones
-- Ejecutar en Supabase SQL Editor
-- ============================================
-- Causa: El rol 'anon' (usuarios no autenticados) necesita:
-- 1. GRANTs explícitos en las tablas
-- 2. Políticas RLS con TO anon
-- ============================================

-- 1. GRANTs para el rol anon
-- Sin estos, el rol anon no puede insertar aunque las políticas RLS lo permitan
GRANT USAGE ON SCHEMA public TO anon;
GRANT INSERT ON public.quotes TO anon;
GRANT INSERT ON public.quote_items TO anon;

-- 2. Políticas RLS con TO anon explícito
-- Supabase recomienda especificar el rol con TO
DROP POLICY IF EXISTS "Anyone can insert quotes" ON quotes;
CREATE POLICY "Anyone can insert quotes" ON quotes
  FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can insert quote_items" ON quote_items;
CREATE POLICY "Anyone can insert quote_items" ON quote_items
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Verificación: ver políticas creadas
-- SELECT * FROM pg_policies WHERE tablename IN ('quotes', 'quote_items');
