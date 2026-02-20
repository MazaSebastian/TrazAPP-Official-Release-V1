-- 1. Crear tabla app_members si no existe
CREATE TABLE IF NOT EXISTS public.app_members (
  user_id uuid PRIMARY KEY,
  created_at timestamptz DEFAULT now()
);

-- 2. Insertar usuarios autorizados (se puede expandir luego)
-- Esto previene errores de "relation does not exist" en las politicas de otras tablas
