
-- 1. Realtime RLS: only admins can subscribe to channels carrying quotes data
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins only realtime" ON realtime.messages;
CREATE POLICY "Admins only realtime"
ON realtime.messages
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 2. quote_items INSERT: require the referenced quote to exist and be fresh
DROP POLICY IF EXISTS "Visitors can create positive quote items" ON public.quote_items;
CREATE POLICY "Visitors can create positive quote items"
ON public.quote_items
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(trim(item_key)) > 0
  AND length(trim(item_name)) > 0
  AND length(trim(category)) > 0
  AND quantity > 0
  AND EXISTS (
    SELECT 1 FROM public.quotes q
    WHERE q.id = quote_items.quote_id
      AND q.created_at > now() - interval '5 minutes'
  )
);

-- 3. Lock down has_role execute privileges
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
