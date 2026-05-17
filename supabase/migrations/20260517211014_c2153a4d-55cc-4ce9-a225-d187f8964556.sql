DROP POLICY IF EXISTS "Anyone can create quotes" ON public.quotes;
DROP POLICY IF EXISTS "Authenticated users can update quotes" ON public.quotes;
DROP POLICY IF EXISTS "Authenticated users can delete quotes" ON public.quotes;
DROP POLICY IF EXISTS "Anyone can create quote items" ON public.quote_items;
DROP POLICY IF EXISTS "Authenticated users can update quote items" ON public.quote_items;
DROP POLICY IF EXISTS "Authenticated users can delete quote items" ON public.quote_items;

CREATE POLICY "Visitors can create complete quotes"
ON public.quotes
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(trim(cliente_nombre)) > 0
  AND length(trim(telefono)) > 0
  AND length(trim(origen_direccion)) > 0
  AND length(trim(origen_comuna)) > 0
  AND length(trim(destino_direccion)) > 0
  AND length(trim(destino_comuna)) > 0
);

CREATE POLICY "Signed in users can update quotes"
ON public.quotes
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Signed in users can delete quotes"
ON public.quotes
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Visitors can create positive quote items"
ON public.quote_items
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(trim(item_key)) > 0
  AND length(trim(item_name)) > 0
  AND length(trim(category)) > 0
  AND quantity > 0
);

CREATE POLICY "Signed in users can update quote items"
ON public.quote_items
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Signed in users can delete quote items"
ON public.quote_items
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated;