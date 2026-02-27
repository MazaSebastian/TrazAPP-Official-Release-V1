-- ==============================================================================
-- Borrado Automático de Usuarios al Eliminar una Organización
-- ==============================================================================
-- Este trigger se ejecuta ANTES de que una organización sea eliminada.
-- Busca todos los usuarios (`user_id`) en `organization_members` que pertenecen
-- a esta organización y los elimina de `auth.users`.
-- IMPORTANTE: Al eliminar de `auth.users`, Supabase borrará en cascada 
-- automáticamente su `public.profile` y sus membresías.
-- ==============================================================================

CREATE OR REPLACE FUNCTION delete_users_on_org_delete()
RETURNS TRIGGER
SECURITY DEFINER -- Ejecuta con privilegios elevados (necesario para tocar auth.users)
AS $$
DECLARE
  member_record RECORD;
BEGIN
  -- Encontrar a todos los miembros de esta organización antes de que se borre
  FOR member_record IN 
    SELECT user_id FROM public.organization_members WHERE organization_id = OLD.id
  LOOP
    -- Elimina la cuenta de usuario desde la raíz del sistema de autenticación de Supabase
    DELETE FROM auth.users WHERE id = member_record.user_id;
  END LOOP;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Asegurarse de no duplicar el trigger
DROP TRIGGER IF EXISTS trigger_delete_users_on_org_delete ON public.organizations;

-- Asignar el trigger a la tabla organizations
CREATE TRIGGER trigger_delete_users_on_org_delete
BEFORE DELETE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION delete_users_on_org_delete();
