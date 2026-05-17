-- Grant execute on has_role to authenticated so RLS policies can call it
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon;

-- Enable realtime for quotes and quote_items so dashboard refreshes on new submissions
ALTER TABLE public.quotes REPLICA IDENTITY FULL;
ALTER TABLE public.quote_items REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='quotes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.quotes;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='quote_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.quote_items;
  END IF;
END $$;