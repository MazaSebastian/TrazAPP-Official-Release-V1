-- Helper: Auto-create Organization for New Users
-- This script updates the handle_new_user function to create a default organization.

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
  user_name TEXT;
BEGIN
  -- 1. Create Profile (Existing logic)
  user_name := COALESCE(new.raw_user_meta_data->>'name', new.email);
  
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, user_name, COALESCE(new.raw_user_meta_data->>'role', 'employee'));

  -- 2. Create Default Organization (New Logic)
  -- Uses the user's name to name the org, e.g. "Organización de Seba"
  INSERT INTO public.organizations (name, plan)
  VALUES (user_name || '''s Organization', 'free')
  RETURNING id INTO new_org_id;

  -- 3. Add User as Owner of that Organization
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (new_org_id, new.id, 'owner');

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
