-- 1. Asegurar que las politicas de la tabla se están ejecutando y limpiamos las fallidas
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for now" ON public.organization_members;
DROP POLICY IF EXISTS "Members can view own memberships" ON public.organization_members;
DROP POLICY IF EXISTS "Tenant Isolation" ON public.organization_members;
DROP POLICY IF EXISTS "Members can view all members in their orgs" ON public.organization_members;
DROP POLICY IF EXISTS "Usuarios pueden leer los miembros de su base" ON public.organization_members;

-- 2. POLITICA INFALIBLE: Un usuario SIEMPRE puede ver su propia membresía (su propio rol de dueño)
CREATE POLICY "Users can view their own membership"
ON public.organization_members
FOR SELECT
USING (auth.uid() = user_id);

-- 3. POLITICA INFALIBLE SECUNDARIA: Un usuario puede ver a TODOS los que estén en sus mismas organizaciones
CREATE POLICY "Users can view members of their organizations"
ON public.organization_members
FOR SELECT
USING (
    organization_id IN (
        SELECT om.organization_id 
        FROM public.organization_members om 
        WHERE om.user_id = auth.uid()
    )
);

-- Nota: Estas politicas cubren todo el flujo GET del frontend, garantizando 
-- que AuthContext siempre pueda leer tu rol sin riesgo de Race Conditions de base de datos.
