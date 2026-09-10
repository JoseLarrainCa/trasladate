CREATE TABLE public.web_service_texts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  servicios JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.web_service_texts TO anon;
GRANT SELECT, INSERT, UPDATE ON public.web_service_texts TO authenticated;
GRANT ALL ON public.web_service_texts TO service_role;

ALTER TABLE public.web_service_texts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view service texts" ON public.web_service_texts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated can insert service texts" ON public.web_service_texts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update service texts" ON public.web_service_texts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

INSERT INTO public.web_service_texts (servicios) VALUES ('{}'::jsonb);