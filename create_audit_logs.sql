-- Create Global Audit Logs table for tracking all SaaS activity
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    entity_type VARCHAR(50) NOT NULL, -- e.g., 'crop', 'batch', 'patient', 'user', 'dispensary'
    entity_id UUID,
    action VARCHAR(50) NOT NULL, -- e.g., 'CREATE', 'UPDATE', 'DELETE', 'EXPORT'
    description TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow ONLY Super Admins to read everything
CREATE POLICY "Super Admins can read all audit logs" ON audit_logs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

-- Allow organization members to insert logs for their own organization
CREATE POLICY "Users can insert audit logs for their org" ON audit_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_members.organization_id = audit_logs.organization_id
            AND organization_members.user_id = auth.uid()
        )
    );
