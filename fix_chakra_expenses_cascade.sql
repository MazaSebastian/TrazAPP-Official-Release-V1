-- Fix para el error de foreign key constraint al intentar borrar un perfil/usuario en chakra_expenses
ALTER TABLE public.chakra_expenses 
  DROP CONSTRAINT IF EXISTS chakra_expenses_responsible_user_id_fkey;

ALTER TABLE public.chakra_expenses 
  ADD CONSTRAINT chakra_expenses_responsible_user_id_fkey 
  FOREIGN KEY (responsible_user_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;
