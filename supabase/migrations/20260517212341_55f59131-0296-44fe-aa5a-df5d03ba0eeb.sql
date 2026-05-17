
-- quotes
DROP POLICY IF EXISTS "Authenticated users can view quotes" ON public.quotes;
DROP POLICY IF EXISTS "Signed in users can delete quotes" ON public.quotes;
DROP POLICY IF EXISTS "Signed in users can update quotes" ON public.quotes;

CREATE POLICY "Admins can view quotes" ON public.quotes
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update quotes" ON public.quotes
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete quotes" ON public.quotes
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- quote_items
DROP POLICY IF EXISTS "Authenticated users can view quote items" ON public.quote_items;
DROP POLICY IF EXISTS "Signed in users can delete quote items" ON public.quote_items;
DROP POLICY IF EXISTS "Signed in users can update quote items" ON public.quote_items;

CREATE POLICY "Admins can view quote items" ON public.quote_items
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update quote items" ON public.quote_items
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete quote items" ON public.quote_items
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
