GRANT INSERT ON public.quotes TO anon, authenticated;
GRANT INSERT ON public.quote_items TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.quotes TO authenticated;
GRANT SELECT, UPDATE, DELETE ON public.quote_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;