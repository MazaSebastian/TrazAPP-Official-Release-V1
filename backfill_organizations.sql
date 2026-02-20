-- Script para migrar datos existentes a Organizaciones
-- Se asume que cada usuario existente tendrá su propia organización "Personal"

DO $$
DECLARE
    user_record RECORD;
    new_org_id UUID;
BEGIN
    -- 1. Iterar sobre todos los usuarios en auth.users
    FOR user_record IN SELECT * FROM auth.users LOOP
        
        -- Verificar si el usuario ya tiene una organización (para no duplicar si se corre 2 veces)
        SELECT organization_id INTO new_org_id 
        FROM public.organization_members 
        WHERE user_id = user_record.id 
        LIMIT 1;

        -- Si no tiene, crearla
        IF new_org_id IS NULL THEN
            INSERT INTO public.organizations (name, plan) 
            VALUES ('Org de ' || COALESCE(user_record.email, 'Usuario'), 'free')
            RETURNING id INTO new_org_id;

            -- Asignar usuario como Owner
            INSERT INTO public.organization_members (organization_id, user_id, role)
            VALUES (new_org_id, user_record.id, 'owner');
        END IF;

        -- 2. Asignar datos "Huérfanos" (que no tienen org_id) creados por este usuario
        -- Esto asume que las tablas tienen columna 'created_by' o similar.
        -- Si no tienen, se quedarán NULL hasta asignación manual o estrategia diferente.
        
        -- Ejemplo: Rooms (no tienen created_by usualmente, pero si es single tenant ad-hoc...)
        -- Estrategia Fallback: Asignar TODO lo que sea NULL al primer usuario que encontremos (Peligroso en prod real, util en migración dev single-tenant)
        -- Si estás seguro de que es single-tenant migracion, y este es EL usuario admin:
        
        -- UPDATE public.rooms SET organization_id = new_org_id WHERE organization_id IS NULL;
        
    END LOOP;
END $$;

-- ESTRATEGIA DE EMERGENCIA PARA SINGLE TENANT -> MULTI TENANT
-- Si esto era una app de un solo dueño, asignamos TODO a la primera organización creada.
DO $$
DECLARE
    first_org_id UUID;
BEGIN
    SELECT id INTO first_org_id FROM public.organizations LIMIT 1;

    IF first_org_id IS NOT NULL THEN
        UPDATE public.rooms SET organization_id = first_org_id WHERE organization_id IS NULL;
        UPDATE public.batches SET organization_id = first_org_id WHERE organization_id IS NULL;
        UPDATE public.genetics SET organization_id = first_org_id WHERE organization_id IS NULL;
        UPDATE public.chakra_crops SET organization_id = first_org_id WHERE organization_id IS NULL;
        UPDATE public.chakra_tasks SET organization_id = first_org_id WHERE organization_id IS NULL;
        UPDATE public.chakra_daily_logs SET organization_id = first_org_id WHERE organization_id IS NULL;
        UPDATE public.chakra_stock_items SET organization_id = first_org_id WHERE organization_id IS NULL;
        UPDATE public.chakra_historial_precios SET organization_id = first_org_id WHERE organization_id IS NULL;
        UPDATE public.chakra_dispensary_batches SET organization_id = first_org_id WHERE organization_id IS NULL;
        UPDATE public.chakra_harvest_logs SET organization_id = first_org_id WHERE organization_id IS NULL;
        UPDATE public.chakra_extractions SET organization_id = first_org_id WHERE organization_id IS NULL;
        UPDATE public.expenses SET organization_id = first_org_id WHERE organization_id IS NULL;
        UPDATE public.compras SET organization_id = first_org_id WHERE organization_id IS NULL;
        UPDATE public.stickies SET organization_id = first_org_id WHERE organization_id IS NULL;
        UPDATE public.announcements SET organization_id = first_org_id WHERE organization_id IS NULL;
        UPDATE public.activities SET organization_id = first_org_id WHERE organization_id IS NULL;
    END IF;
END $$;
