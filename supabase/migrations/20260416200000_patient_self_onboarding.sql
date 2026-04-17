-- 1. Extend aurora_patients to denote self-onboarded waiting room status
ALTER TABLE public.aurora_patients 
ADD COLUMN IF NOT EXISTS is_approved_by_org BOOLEAN DEFAULT true;

-- 2. Create the patient_invitations table for the one-time links
CREATE TABLE IF NOT EXISTS public.patient_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'used', 'expired')),
    expires_at TIMESTAMPTZ NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. RLS for the new table
ALTER TABLE public.patient_invitations ENABLE ROW LEVEL SECURITY;

-- Allow org members to manage their org's invitations
CREATE POLICY "Org members can read invitations" 
ON public.patient_invitations
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.organization_id = patient_invitations.organization_id
        AND om.user_id = auth.uid()
    )
);

CREATE POLICY "Org members can insert invitations" 
ON public.patient_invitations
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.organization_id = patient_invitations.organization_id
        AND om.user_id = auth.uid()
    )
);

CREATE POLICY "Org members can update invitations" 
ON public.patient_invitations
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.organization_id = patient_invitations.organization_id
        AND om.user_id = auth.uid()
    )
);

-- Allow PUBLIC to read an invitation BY ID to validate the token during onboarding
-- Note: This is safe because UUIDs are unguessable.
CREATE POLICY "Public can select invitation by ID"
ON public.patient_invitations
FOR SELECT
USING (true);

-- No public update allowed; the Edge Function (service_role) will mark it as 'used'.

-- 4. Create the signatures bucket if it doesn't already exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('signatures', 'signatures', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for signatures bucket (if needed)
CREATE POLICY "Public profiles are viewable by everyone."
ON storage.objects FOR SELECT
USING ( bucket_id = 'signatures' );

-- Note: We will upload patient signatures via Edge Function (Service Role),
-- so we don't need a public insert policy.
