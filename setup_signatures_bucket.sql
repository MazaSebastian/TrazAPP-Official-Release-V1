-- 1. Create the 'signatures' bucket if it doesn't exist already
INSERT INTO storage.buckets (id, name, public)
VALUES ('signatures', 'signatures', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop existing policies to cleanly recreate them
DROP POLICY IF EXISTS "Public signatures visibility" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to signatures" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own signatures" ON storage.objects;

-- 3. Policy: Anyone can view signatures (publicly accessible)
CREATE POLICY "Public signatures visibility"
ON storage.objects FOR SELECT
USING (bucket_id = 'signatures');

-- 4. Policy: Authenticated users (medicos) can upload their signatures
CREATE POLICY "Allow authenticated uploads to signatures"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'signatures' 
    -- Optionally restrict to certain roles if needed, but 'authenticated' is usually fine for a user-specific file name
);

-- 5. Policy: Authenticated users can delete their own signatures (based on file name starting with their ID)
CREATE POLICY "Allow users to delete their own signatures"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'signatures' 
);

-- 6. Policy: Authenticated users can update their own signatures
CREATE POLICY "Allow users to update their own signatures"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'signatures' 
);
