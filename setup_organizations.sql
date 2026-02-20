-- 1. Tabla de Organizaciones (Los Clientes)
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE, -- para URLs amigables (ej: app.com/aurora)
    plan TEXT DEFAULT 'free', -- free, pro, enterprise
    stripe_customer_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 2. Tabla de Miembros (User <-> Organization)
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    role TEXT DEFAULT 'staff', -- owner, admin, staff, viewer
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

-- Habilitar RLS en organization_members
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Políticas temporales para permitir la inserción inicial (se ajustarán en Phase 2)
CREATE POLICY "Enable all access for now" ON public.organizations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for now" ON public.organization_members FOR ALL USING (true) WITH CHECK (true);
