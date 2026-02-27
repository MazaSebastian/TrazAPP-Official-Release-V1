-- =========================================================================================
-- FIX: Habilitar borrado en cascada (ON DELETE CASCADE) desde auth.users
-- =========================================================================================
-- Problema:
-- Al "Rechazar" / Eliminar una Organización, el trigger de la base de datos intenta
-- borrar a sus usuarios de `auth.users`. Sin embargo, PostgreSQL bloquea esto porque
-- el usuario ya tiene un registro en `public.profiles` (y posiblemente en 
-- `public.organization_members`) que no tienen la restricción "ON DELETE CASCADE".
-- =========================================================================================

BEGIN;

-- 1. Arreglar tabla public.profiles
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_id_fkey;

ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_id_fkey 
  FOREIGN KEY (id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- 2. Arreglar tabla public.organization_members
ALTER TABLE public.organization_members 
  DROP CONSTRAINT IF EXISTS organization_members_user_id_fkey;

ALTER TABLE public.organization_members 
  ADD CONSTRAINT organization_members_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

COMMIT;

-- Nota: Puedes ejecutar esto de forma segura en el Editor SQL de Supabase.
