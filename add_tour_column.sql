-- Migración: Añadir campo de tour completado a los perfiles de usuario
-- Esto permite que la aplicación recuerde si un usuario ya pasó por el tour guiado
-- y no vuelva a mostrárselo en el futuro.

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS has_completed_tour BOOLEAN DEFAULT FALSE;

-- Opcional: Si queremos asegurarnos de que los usuarios antiguos no reciban el tour,
-- podemos forzar a TRUE a todos los usuarios creados antes de hoy.
-- Descomenta la siguiente línea si lo deseas:
-- UPDATE public.profiles SET has_completed_tour = TRUE WHERE created_at < NOW() - INTERVAL '1 day';
