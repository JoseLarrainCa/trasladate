-- Copia del esquema de la base compartida leads-flota (solo para las pruebas).
CREATE TABLE leads (
  id TEXT PRIMARY KEY, sitio TEXT NOT NULL, origen TEXT, nombre TEXT NOT NULL, telefono TEXT,
  email TEXT, mensaje TEXT, datos TEXT, correo_enviado INTEGER NOT NULL DEFAULT 0, detalle_error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
