-- Database Migration Script: WhatsApp Configurations
-- Description: Creates a table to store per-organization WhatsApp API credentials.

CREATE TABLE IF NOT EXISTS public.whatsapp_configurations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL UNIQUE,
    api_token text NOT NULL,
    phone_id text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT whatsapp_configurations_pkey PRIMARY KEY (id),
    CONSTRAINT wc_organization_id_fkey FOREIGN KEY (organization_id)
        REFERENCES public.organizations (id) ON DELETE CASCADE
);

-- RLS Policies
ALTER TABLE public.whatsapp_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage their organization's WhatsApp config"
    ON public.whatsapp_configurations FOR ALL
    USING (
        organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
        AND
        (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('Dueño', 'Encargado')
    )
    WITH CHECK (
        organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
        AND
        (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('Dueño', 'Encargado')
    );

-- Allowed for Edge Functions / Webhooks (bypassed when using service_role key)
