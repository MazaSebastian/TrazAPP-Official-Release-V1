-- Add status and control fields to organizations table

DO $$ 
BEGIN 
    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'status') THEN 
        ALTER TABLE public.organizations ADD COLUMN status TEXT DEFAULT 'pending'; 
    END IF;

    -- Add owner_email column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'owner_email') THEN 
        ALTER TABLE public.organizations ADD COLUMN owner_email TEXT; 
    END IF;

    -- Add subscription_plan column if it doesn't exist (renaming/consolidating if needed, but 'plan' already exists in previous schema, let's check)
    -- Schema shows 'plan' column exists. We will use that. 
    -- If we want a separate 'subscription_status' (e.g. trialing, overdue), we can add that.
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'subscription_status') THEN 
         ALTER TABLE public.organizations ADD COLUMN subscription_status TEXT DEFAULT 'trialing';
    END IF;

END $$;

-- Update existing rows to be 'active' so they don't get locked out
UPDATE public.organizations SET status = 'active' WHERE status IS NULL OR status = 'pending';
