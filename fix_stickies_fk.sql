-- Fix for error: update or delete on table "users" violates foreign key constraint "chakra_stickies_user_id_fkey"
-- This adds the "ON DELETE CASCADE" instruction so that when a user is deleted, their stickies are deleted too.

BEGIN;

-- 1. Eliminar la restricción foránea actual
ALTER TABLE public.chakra_stickies 
DROP CONSTRAINT IF EXISTS chakra_stickies_user_id_fkey;

-- 2. Volver a crearla con ON DELETE CASCADE
ALTER TABLE public.chakra_stickies
ADD CONSTRAINT chakra_stickies_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

COMMIT;
