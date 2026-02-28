-- ==============================================================================
-- 🚀 SCRIPT PARA ARREGLAR POLÍTICAS DE SEGURIDAD (RLS) EN CHAKRA_TASKS
-- Funcionalidad: Permite que cualquier miembro de la organización pueda crear,
-- ver y editar tareas, sin importar a quién se le asignen, eliminando los 
-- errores 400 en calendarios.
-- ==============================================================================

DO $$ 
BEGIN

    -------------------------------------------------------------------------
    -- 1. Eliminar CUALQUIER política anterior que pueda estar estorbando
    -------------------------------------------------------------------------
    -- Ignoramos si no existen. Simplemente barremos la tabla para empezar de cero.
    DROP POLICY IF EXISTS "Enable read access for all users" ON public.chakra_tasks;
    DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.chakra_tasks;
    DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.chakra_tasks;
    DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.chakra_tasks;
    DROP POLICY IF EXISTS "Tareas visibles por org" ON public.chakra_tasks;
    DROP POLICY IF EXISTS "Crear tareas por org" ON public.chakra_tasks;
    DROP POLICY IF EXISTS "Editar tareas por org" ON public.chakra_tasks;
    DROP POLICY IF EXISTS "Auth read access for chakra_tasks" ON public.chakra_tasks;
    
    -------------------------------------------------------------------------
    -- 2. Asegurarse que RLS está activado
    -------------------------------------------------------------------------
    ALTER TABLE public.chakra_tasks ENABLE ROW LEVEL SECURITY;

    -------------------------------------------------------------------------
    -- 3. Crear Políticas correctas basadas en Organización
    -------------------------------------------------------------------------
    
    -- LECTURA: Un usuario puede ver las tareas si pertenece a la misma organización que la tarea
    CREATE POLICY "Usuarios pueden ver tareas de su organizacion" 
    ON public.chakra_tasks 
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om 
            WHERE om.organization_id = chakra_tasks.organization_id 
            AND om.user_id = auth.uid()
        )
    );

    -- CREACIÓN: Un usuario puede crear tareas en su organización (para él mismo o para otros)
    CREATE POLICY "Usuarios pueden crear tareas en su organizacion" 
    ON public.chakra_tasks 
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.organization_members om 
            WHERE om.organization_id = chakra_tasks.organization_id 
            AND om.user_id = auth.uid()
        )
    );

    -- ACTUALIZACIÓN: Un usuario puede editar tareas de su organización
    CREATE POLICY "Usuarios pueden editar tareas de su organizacion" 
    ON public.chakra_tasks 
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om 
            WHERE om.organization_id = chakra_tasks.organization_id 
            AND om.user_id = auth.uid()
        )
    );

    -- BORRADO: Un usuario puede borrar tareas de su organización
    CREATE POLICY "Usuarios pueden borrar tareas de su organizacion" 
    ON public.chakra_tasks 
    FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om 
            WHERE om.organization_id = chakra_tasks.organization_id 
            AND om.user_id = auth.uid()
        )
    );

END $$;
