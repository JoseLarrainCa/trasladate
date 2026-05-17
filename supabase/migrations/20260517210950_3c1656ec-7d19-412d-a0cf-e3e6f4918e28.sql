CREATE TYPE public.app_role AS ENUM ('admin', 'viewer');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE TABLE public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_nombre TEXT NOT NULL,
  cliente_apellido TEXT,
  cliente_razon_social TEXT,
  telefono TEXT NOT NULL,
  celular TEXT,
  email TEXT,
  origen_direccion TEXT NOT NULL,
  origen_comuna TEXT NOT NULL,
  origen_tipo_vivienda TEXT NOT NULL,
  origen_tiene_ascensor BOOLEAN NOT NULL DEFAULT false,
  origen_piso INTEGER,
  destino_direccion TEXT NOT NULL,
  destino_comuna TEXT NOT NULL,
  destino_tipo_vivienda TEXT NOT NULL,
  destino_tiene_ascensor BOOLEAN NOT NULL DEFAULT false,
  destino_piso INTEGER,
  tipo_mudanza TEXT NOT NULL CHECK (tipo_mudanza IN ('hogar', 'oficina', 'especial')),
  fecha_traslado DATE,
  fecha_indefinida BOOLEAN NOT NULL DEFAULT false,
  sugerencia_adicional TEXT,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'contactado', 'cotizado', 'confirmado', 'completado', 'cancelado')),
  notas_internas TEXT,
  imported_from_excel BOOLEAN NOT NULL DEFAULT false,
  excel_import_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  item_key TEXT NOT NULL,
  item_name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (quote_id, item_key)
);

CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_quotes_created_at ON public.quotes(created_at DESC);
CREATE INDEX idx_quotes_estado ON public.quotes(estado);
CREATE INDEX idx_quotes_cliente ON public.quotes(cliente_nombre, cliente_apellido);
CREATE INDEX idx_quote_items_quote_id ON public.quote_items(quote_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at
BEFORE UPDATE ON public.quotes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can create quotes"
ON public.quotes
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can view quotes"
ON public.quotes
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can update quotes"
ON public.quotes
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete quotes"
ON public.quotes
FOR DELETE
TO authenticated
USING (true);

CREATE POLICY "Anyone can create quote items"
ON public.quote_items
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can view quote items"
ON public.quote_items
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can update quote items"
ON public.quote_items
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete quote items"
ON public.quote_items
FOR DELETE
TO authenticated
USING (true);