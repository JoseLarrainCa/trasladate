-- Migration: 0003_horario_servicio
-- La hora del servicio se elige al cotizar, junto a la fecha, y el calendario del panel
-- muestra cada servicio con su horario (mismo cambio que Railen, 2026-11-04).
--
-- Texto `HH:MM` en hora de Chile. Los dos son opcionales: una cotización sin hora sigue
-- siendo válida y en el calendario va al final del día. Solo agrega columnas NULL: lo que ya
-- está guardado no se toca.

ALTER TABLE quote_documents ADD COLUMN hora_inicio TEXT;
ALTER TABLE quote_documents ADD COLUMN hora_fin TEXT;
