-- ========================================================================================
-- SCRIPT DE REPARACIÓN: Vincular Dueños Huérfanos y Arreglar Creación de Nuevas Orgs
-- Instrucciones: Ejecuta todo este script en el SQL Editor de Supabase
-- ========================================================================================

-- PARTE 1: Reparación Retroactiva (Vincular cuentas existentes que quedaron en 0 miembros)
DO $$ 
DECLARE
  org_rec RECORD;
  owner_uid UUID;
BEGIN
  FOR org_rec IN SELECT id, owner_email FROM public.organizations WHERE owner_email IS NOT NULL LOOP
    -- Buscar el ID del usuario dueño
    SELECT id INTO owner_uid FROM public.profiles WHERE email = org_rec.owner_email LIMIT 1;
    
    IF owner_uid IS NOT NULL THEN
      -- Insertarlo como 'owner' si no existe
      INSERT INTO public.organization_members (organization_id, user_id, role)
      VALUES (org_rec.id, owner_uid, 'owner')
      ON CONFLICT (organization_id, user_id) DO NOTHING;
    END IF;
  END LOOP;
END $$;

-- PARTE 2: Parche Preventivo
-- Crear un Trigger que automatice este vínculo cada vez que nace una nueva Organización
CREATE OR REPLACE FUNCTION public.auto_link_organization_owner()
RETURNS TRIGGER AS $$
DECLARE
  owner_uid UUID;
BEGIN
  IF NEW.owner_email IS NOT NULL THEN
    -- Buscar al dueño en profiles
    SELECT id INTO owner_uid FROM public.profiles WHERE email = NEW.owner_email LIMIT 1;
    
    IF owner_uid IS NOT NULL THEN
      -- Inyectarlo silenciosamente en org_members
      INSERT INTO public.organization_members (organization_id, user_id, role)
      VALUES (NEW.id, owner_uid, 'owner')
      ON CONFLICT (organization_id, user_id) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar trigger si existía previamente
DROP TRIGGER IF EXISTS trg_auto_link_organization_owner ON public.organizations;

-- Enganchar el Trigger a la tabla organizations
CREATE TRIGGER trg_auto_link_organization_owner
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_link_organization_owner();
