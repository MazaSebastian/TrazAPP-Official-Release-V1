-- Migration: Add Tenant Branding Columns to Organizations

ALTER TABLE "public"."organizations"
ADD COLUMN IF NOT EXISTS "logo_url" text,
ADD COLUMN IF NOT EXISTS "primary_color" text,
ADD COLUMN IF NOT EXISTS "secondary_color" text,
ADD COLUMN IF NOT EXISTS "slug" text;

-- Aseguramos que dos clubes no elijan el mismo enlace/slug público
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'organizations_slug_key'
    ) THEN
        ALTER TABLE "public"."organizations" ADD CONSTRAINT organizations_slug_key UNIQUE ("slug");
    END IF;
END $$;

-- Aseguramos que existe el bucket para los logos
INSERT INTO storage.buckets (id, name, public) VALUES ('organizations', 'organizations', true) ON CONFLICT (id) DO NOTHING;

-- Políticas de seguridad (RLS) para el bucket
CREATE POLICY "Public Access for organizations bucket" ON storage.objects FOR SELECT USING (bucket_id = 'organizations');
CREATE POLICY "Authenticated users can upload logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'organizations' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update logos" ON storage.objects FOR UPDATE USING (bucket_id = 'organizations' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete logos" ON storage.objects FOR DELETE USING (bucket_id = 'organizations' AND auth.role() = 'authenticated');
