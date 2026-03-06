-- Create KYC Documents bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('kyc_documents', 'kyc_documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS for kyc_documents
-- Assuming users can only upload and read their own documents or if they are in the same organization (for simplicity, we let the user who uploads it read it, or any admin in the org)
-- For this release, we tie it to the user who created it (auth.uid()) or org members. Let's start with auth.uid() for simplicity and security.

CREATE POLICY "Users can upload their own KYC docs" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'kyc_documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view their own KYC docs" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'kyc_documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their own KYC docs" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'kyc_documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own KYC docs" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'kyc_documents' AND (storage.foldername(name))[1] = auth.uid()::text);
