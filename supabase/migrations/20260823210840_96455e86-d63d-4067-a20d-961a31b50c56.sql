
CREATE TABLE public.quote_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tarifas JSONB NOT NULL DEFAULT '{}'::jsonb,
  textos JSONB NOT NULL DEFAULT '{}'::jsonb,
  empresa JSONB NOT NULL DEFAULT '{}'::jsonb,
  materiales TEXT[] NOT NULL DEFAULT '{}',
  observaciones TEXT[] NOT NULL DEFAULT '{}',
  siguiente_folio INTEGER NOT NULL DEFAULT 3286,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quote_settings TO authenticated;
GRANT ALL ON public.quote_settings TO service_role;
ALTER TABLE public.quote_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view settings" ON public.quote_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert settings" ON public.quote_settings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update settings" ON public.quote_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.quote_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
  folio INTEGER NOT NULL,
  formato TEXT NOT NULL DEFAULT 'marco',
  fecha_servicio DATE,
  titulo_servicio TEXT NOT NULL DEFAULT 'TRASLADO + EMBALAJE',
  saludo TEXT NOT NULL DEFAULT 'Buenos días',
  cliente JSONB NOT NULL DEFAULT '{}'::jsonb,
  camion TEXT NOT NULL DEFAULT 'camion25',
  camion_qty INTEGER NOT NULL DEFAULT 1,
  personas INTEGER NOT NULL DEFAULT 3,
  con_embalaje BOOLEAN NOT NULL DEFAULT true,
  armado_camas BOOLEAN NOT NULL DEFAULT true,
  sin_iva BOOLEAN NOT NULL DEFAULT true,
  con_galeria BOOLEAN NOT NULL DEFAULT false,
  cuota1 INTEGER NOT NULL DEFAULT 50,
  cuota2 INTEGER NOT NULL DEFAULT 50,
  recargo_escala INTEGER NOT NULL DEFAULT 0,
  recargo_rampa INTEGER NOT NULL DEFAULT 0,
  recargo_estac INTEGER NOT NULL DEFAULT 0,
  recargo_otro INTEGER NOT NULL DEFAULT 0,
  precio_calculado INTEGER NOT NULL DEFAULT 0,
  precio_final INTEGER,
  textos JSONB NOT NULL DEFAULT '{}'::jsonb,
  materiales TEXT[] NOT NULL DEFAULT '{}',
  observaciones TEXT[] NOT NULL DEFAULT '{}',
  acciones TEXT[] NOT NULL DEFAULT '{}',
  inventario_override JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

CREATE INDEX idx_quote_documents_quote_id ON public.quote_documents(quote_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quote_documents TO authenticated;
GRANT ALL ON public.quote_documents TO service_role;
ALTER TABLE public.quote_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view documents" ON public.quote_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert documents" ON public.quote_documents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update documents" ON public.quote_documents FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete documents" ON public.quote_documents FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_quote_settings_updated_at BEFORE UPDATE ON public.quote_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_quote_documents_updated_at BEFORE UPDATE ON public.quote_documents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.quote_settings (id) VALUES (gen_random_uuid());
