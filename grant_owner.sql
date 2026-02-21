-- Script for assigning a missing user to the primary organization
DO $$ 
DECLARE
  first_org_id UUID;
  target_user_id UUID := 'cf5f6945-ff91-4ec4-ac0f-7651aca3e898'; -- The ID from your console logs
BEGIN

  -- 1. Buscar la primera organización de la base de datos
  SELECT id INTO first_org_id FROM public.organizations ORDER BY created_at ASC LIMIT 1;

  -- 2. Si no hay ninguna tabla de organizaciones, crear una de emergencia
  IF first_org_id IS NULL THEN
      INSERT INTO public.organizations (name, plan)
      VALUES ('TrazAPP Growers', 'ONG')
      RETURNING id INTO first_org_id;
  END IF;

  -- 3. Vincular tu cuenta como Dueño Absoluto (Owner)
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (first_org_id, target_user_id, 'owner')
  ON CONFLICT (organization_id, user_id) 
  DO UPDATE SET role = 'owner';

END $$;
