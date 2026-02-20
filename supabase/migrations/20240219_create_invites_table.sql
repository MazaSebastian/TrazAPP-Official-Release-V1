-- Create organization_invites table
CREATE TABLE IF NOT EXISTS public.organization_invites (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    email text NOT NULL,
    role text NOT NULL DEFAULT 'viewer',
    token text NOT NULL UNIQUE DEFAULT gen_random_uuid(), -- Simple token for link
    status text NOT NULL DEFAULT 'pending', -- pending, accepted, expired
    created_at timestamptz DEFAULT now(),
    expires_at timestamptz DEFAULT (now() + interval '7 days'),
    created_by uuid REFERENCES public.profiles(id)
);

-- RLS
ALTER TABLE public.organization_invites ENABLE ROW LEVEL SECURITY;

-- Allow public read/write for now to facilitate the creating of invites from client side (if using client-side logic)
-- ideally should be service role only for creation, but for this app structure:
CREATE POLICY "Allow public insert to invites" ON public.organization_invites FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select to invites" ON public.organization_invites FOR SELECT USING (true);
CREATE POLICY "Allow public update to invites" ON public.organization_invites FOR UPDATE USING (true);
