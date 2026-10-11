-- Trasladarte — esquema D1 (SQLite).
--
-- Portado 1:1 de las migraciones de Supabase (supabase/migrations/*.sql), con las
-- diferencias que impone SQLite:
--   · uuid        -> TEXT. Los ids que vienen de la base vieja (uuid con guiones) se
--                    conservan tal cual; los nuevos se generan con randomblob (32 hex).
--   · timestamptz -> TEXT en ISO 8601 UTC.  date -> TEXT 'AAAA-MM-DD'.
--   · boolean     -> INTEGER 0/1 (el Worker lo devuelve como true/false).
--   · jsonb, text[] -> TEXT con JSON (el Worker lo devuelve ya parseado).
--
-- Lo que NO se porta: las políticas RLS, has_role y el tiempo real. Esa seguridad ahora
-- vive en el Worker: el panel pasa por /api/db con sesión de admin, y el público solo
-- puede crear una cotización completa por /api/cotizacion (ver worker/index.ts).

CREATE TABLE quotes (
  id                     TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  cliente_nombre         TEXT NOT NULL,
  cliente_apellido       TEXT,
  cliente_razon_social   TEXT,
  telefono               TEXT NOT NULL,
  celular                TEXT,
  email                  TEXT,
  origen_direccion       TEXT NOT NULL,
  origen_comuna          TEXT NOT NULL,
  origen_tipo_vivienda   TEXT NOT NULL,
  origen_tiene_ascensor  INTEGER NOT NULL DEFAULT 0,
  origen_piso            INTEGER,
  destino_direccion      TEXT NOT NULL,
  destino_comuna         TEXT NOT NULL,
  destino_tipo_vivienda  TEXT NOT NULL,
  destino_tiene_ascensor INTEGER NOT NULL DEFAULT 0,
  destino_piso           INTEGER,
  tipo_mudanza           TEXT NOT NULL CHECK (tipo_mudanza IN ('hogar', 'oficina', 'especial')),
  fecha_traslado         TEXT,
  fecha_indefinida       INTEGER NOT NULL DEFAULT 0,
  sugerencia_adicional   TEXT,
  estado                 TEXT NOT NULL DEFAULT 'pendiente'
                         CHECK (estado IN ('pendiente', 'contactado', 'cotizado', 'confirmado', 'completado', 'cancelado')),
  notas_internas         TEXT,
  imported_from_excel    INTEGER NOT NULL DEFAULT 0,
  excel_import_date      TEXT,
  created_at             TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at             TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX idx_quotes_created_at ON quotes(created_at);
CREATE INDEX idx_quotes_estado ON quotes(estado);

CREATE TABLE quote_items (
  id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  quote_id   TEXT NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  item_key   TEXT NOT NULL,
  item_name  TEXT NOT NULL,
  category   TEXT NOT NULL,
  quantity   INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (quote_id, item_key)
);
CREATE INDEX idx_quote_items_quote_id ON quote_items(quote_id);

-- Una sola fila: tarifas, textos y datos de la empresa para el PDF, y el próximo folio.
CREATE TABLE quote_settings (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tarifas         TEXT NOT NULL DEFAULT '{}',
  textos          TEXT NOT NULL DEFAULT '{}',
  empresa         TEXT NOT NULL DEFAULT '{}',
  materiales      TEXT NOT NULL DEFAULT '[]',
  observaciones   TEXT NOT NULL DEFAULT '[]',
  siguiente_folio INTEGER NOT NULL DEFAULT 3286,
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- La cotización armada en el panel (la que se imprime en PDF), una por solicitud.
CREATE TABLE quote_documents (
  id                  TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  quote_id            TEXT REFERENCES quotes(id) ON DELETE SET NULL,
  folio               INTEGER NOT NULL,
  formato             TEXT NOT NULL DEFAULT 'marco',
  fecha_servicio      TEXT,
  titulo_servicio     TEXT NOT NULL DEFAULT 'TRASLADO + EMBALAJE',
  saludo              TEXT NOT NULL DEFAULT 'Buenos días',
  tipo_servicio       TEXT DEFAULT '',
  cliente             TEXT NOT NULL DEFAULT '{}',
  camion              TEXT NOT NULL DEFAULT 'camion25',
  camion_qty          INTEGER NOT NULL DEFAULT 1,
  personas            INTEGER NOT NULL DEFAULT 3,
  con_embalaje        INTEGER NOT NULL DEFAULT 1,
  armado_camas        INTEGER NOT NULL DEFAULT 1,
  sin_iva             INTEGER NOT NULL DEFAULT 1,
  con_galeria         INTEGER NOT NULL DEFAULT 0,
  cuota1              INTEGER NOT NULL DEFAULT 50,
  cuota2              INTEGER NOT NULL DEFAULT 50,
  recargo_escala      INTEGER NOT NULL DEFAULT 0,
  recargo_rampa       INTEGER NOT NULL DEFAULT 0,
  recargo_estac       INTEGER NOT NULL DEFAULT 0,
  recargo_otro        INTEGER NOT NULL DEFAULT 0,
  precio_calculado    INTEGER NOT NULL DEFAULT 0,
  precio_final        INTEGER,
  textos              TEXT NOT NULL DEFAULT '{}',
  materiales          TEXT NOT NULL DEFAULT '[]',
  observaciones       TEXT NOT NULL DEFAULT '[]',
  acciones            TEXT NOT NULL DEFAULT '[]',
  inventario_override TEXT NOT NULL DEFAULT '[]',
  created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  created_by          TEXT
);
CREATE INDEX idx_quote_documents_quote_id ON quote_documents(quote_id);

-- Los textos de cada tipo de servicio que muestra la página (los edita Marco en el panel).
CREATE TABLE web_service_texts (
  id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  servicios  TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Reemplaza a auth.users + user_roles de Supabase. La clave se guarda como
-- pbkdf2$<vueltas>$<sal>$<hash> (ver worker/clave.ts).
CREATE TABLE users (
  id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'user')),
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- El nombre que muestra el panel. El id es el MISMO del usuario (en Supabase eran distintos
-- y la pantalla de Configuración buscaba por el equivocado).
CREATE TABLE profiles (
  id         TEXT PRIMARY KEY,
  user_id    TEXT UNIQUE,
  email      TEXT NOT NULL,
  full_name  TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Intentos de entrada fallidos, para frenar la fuerza bruta sobre /api/auth/login.
CREATE TABLE login_attempts (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  at    INTEGER NOT NULL
);
CREATE INDEX idx_login_attempts_email ON login_attempts(email, at);

-- Las dos filas únicas que el panel espera encontrar (en Supabase las sembraba la migración).
INSERT INTO quote_settings (id) VALUES ('ajustes');
INSERT INTO web_service_texts (id) VALUES ('servicios');
