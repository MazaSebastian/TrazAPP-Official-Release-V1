-- Create System Announcements table for Global Broadcasts
CREATE TABLE IF NOT EXISTS system_announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info', -- Matches our UI variants: 'info', 'warning', 'success', 'danger'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE system_announcements ENABLE ROW LEVEL SECURITY;

-- Allow ANY authenticated user to READ active announcements
CREATE POLICY "Users can read active announcements" ON system_announcements
    FOR SELECT
    TO authenticated
    USING (is_active = true);

-- Allow ONLY Super Admins to manage announcements
CREATE POLICY "Super Admins can manage announcements" ON system_announcements
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );
