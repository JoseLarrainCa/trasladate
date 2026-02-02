-- ============================================
-- SCHEMA PARA TRASLADATE - Sistema de Cotización
-- Ejecutar este SQL en Supabase SQL Editor
-- ============================================

-- 1. Tabla de perfiles de usuario (admin)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de cotizaciones
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Datos del cliente
  cliente_nombre TEXT NOT NULL,
  cliente_apellido TEXT,
  cliente_razon_social TEXT,
  telefono TEXT NOT NULL,
  celular TEXT,
  email TEXT,
  
  -- Origen
  origen_direccion TEXT NOT NULL,
  origen_comuna TEXT NOT NULL,
  origen_tipo_vivienda TEXT NOT NULL,
  origen_tiene_ascensor BOOLEAN DEFAULT FALSE,
  origen_piso INTEGER,
  
  -- Destino
  destino_direccion TEXT NOT NULL,
  destino_comuna TEXT NOT NULL,
  destino_tipo_vivienda TEXT NOT NULL,
  destino_tiene_ascensor BOOLEAN DEFAULT FALSE,
  destino_piso INTEGER,
  
  -- Detalles
  tipo_mudanza TEXT NOT NULL CHECK (tipo_mudanza IN ('hogar', 'oficina', 'especial')),
  fecha_traslado DATE,
  fecha_indefinida BOOLEAN DEFAULT FALSE,
  sugerencia_adicional TEXT,
  
  -- Metadatos
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'contactado', 'cotizado', 'confirmado', 'completado', 'cancelado')),
  notas_internas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Para datos importados de Excel
  imported_from_excel BOOLEAN DEFAULT FALSE,
  excel_import_date TIMESTAMPTZ
);

-- 3. Tabla de items/muebles por cotización
CREATE TABLE IF NOT EXISTS quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  item_key TEXT NOT NULL,
  item_name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(quote_id, item_key)
);

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_estado ON quotes(estado);
CREATE INDEX IF NOT EXISTS idx_quotes_cliente ON quotes(cliente_nombre, cliente_apellido);
CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON quote_items(quote_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Políticas para quotes
-- Cualquiera puede insertar (formulario público)
CREATE POLICY "Anyone can insert quotes" ON quotes
  FOR INSERT WITH CHECK (true);

-- Solo usuarios autenticados pueden ver/editar/eliminar
CREATE POLICY "Authenticated users can view quotes" ON quotes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update quotes" ON quotes
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete quotes" ON quotes
  FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas para quote_items
-- Cualquiera puede insertar (junto con quote)
CREATE POLICY "Anyone can insert quote_items" ON quote_items
  FOR INSERT WITH CHECK (true);

-- Solo usuarios autenticados pueden ver
CREATE POLICY "Authenticated users can view quote_items" ON quote_items
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================
-- TRIGGER para actualizar updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TRIGGER para crear perfil automáticamente
-- cuando se registra un usuario
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- FIN DEL SCHEMA
-- ============================================
