-- Script para permitir el borrado de usuarios ("Profiles")
-- que tengan datos atados en el módulo Médico de Aurora
-- ==========================================================

-- A. Actualizar la llave foránea principal de aurora_patients
ALTER TABLE public.aurora_patients DROP CONSTRAINT IF EXISTS aurora_patients_profile_id_fkey;
ALTER TABLE public.aurora_patients ADD CONSTRAINT aurora_patients_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


