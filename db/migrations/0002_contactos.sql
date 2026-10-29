-- Los formularios cortos de la página (consulta rápida y Servicios) también llegan al panel.
-- Antes solo iban a la base de leads de Omnis y por correo; el panel solo veía el cotizador.
CREATE TABLE IF NOT EXISTS contactos (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  nombre      TEXT NOT NULL,
  telefono    TEXT NOT NULL,
  email       TEXT,
  servicio    TEXT,
  comuna      TEXT,
  mensaje     TEXT,
  origen      TEXT,
  atendido    INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_contactos_created ON contactos (created_at DESC);
