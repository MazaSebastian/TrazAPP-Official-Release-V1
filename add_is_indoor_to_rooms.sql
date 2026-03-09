-- Migración para añadir soporte de entorno Indoor / Exterior a las Salas

ALTER TABLE rooms ADD COLUMN is_indoor BOOLEAN DEFAULT true;
