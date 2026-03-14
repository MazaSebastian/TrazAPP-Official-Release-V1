-- Fix para el error de foreign key constraint al intentar borrar un usuario (y por ende, su organización)
ALTER TABLE public.chakra_extractions 
  DROP CONSTRAINT IF EXISTS chakra_extractions_created_by_fkey;

ALTER TABLE public.chakra_extractions 
  ADD CONSTRAINT chakra_extractions_created_by_fkey 
  FOREIGN KEY (created_by) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;
