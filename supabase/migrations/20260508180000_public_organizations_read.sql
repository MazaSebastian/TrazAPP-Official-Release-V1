-- Allow public access to read the organizations table (required for public landing pages)
CREATE POLICY "Allow public read access to organizations" ON "public"."organizations"
FOR SELECT USING (true);
