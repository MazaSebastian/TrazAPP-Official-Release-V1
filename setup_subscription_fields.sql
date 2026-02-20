-- Add Subscription Management Fields to Organizations

-- 1. Subscription Status Check Constraint
-- active: Fully paid and working
-- trial: Free trial period
-- past_due: Payment failed or expired, grace period
-- cancelled: Service suspended
-- pending_validation: Bank transfer sent, waiting for admin approval
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial' 
CHECK (subscription_status IN ('active', 'trial', 'past_due', 'cancelled', 'pending_validation'));

-- 2. Validity Date
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS valid_until TIMESTAMP WITH TIME ZONE;

-- 3. Quotas
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS max_users INT DEFAULT 5;

ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS max_storage_gb INT DEFAULT 1;

-- 4. Indexes for Dashboard Filtering
CREATE INDEX IF NOT EXISTS idx_orgs_status ON public.organizations(subscription_status);
CREATE INDEX IF NOT EXISTS idx_orgs_valid_until ON public.organizations(valid_until);

-- 5. RPC to Extend Subscription (Admin Action)
CREATE OR REPLACE FUNCTION public.admin_extend_subscription(
    org_id UUID,
    days_to_add INT
)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
    new_date TIMESTAMP WITH TIME ZONE;
    current_validity TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Check permissions
    IF NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'Access Denied';
    END IF;

    -- Get current date
    SELECT valid_until INTO current_validity FROM public.organizations WHERE id = org_id;
    
    -- If null or expired, start from NOW. If active, add to existing date.
    IF current_validity IS NULL OR current_validity < NOW() THEN
        new_date := NOW() + (days_to_add || ' days')::INTERVAL;
    ELSE
        new_date := current_validity + (days_to_add || ' days')::INTERVAL;
    END IF;

    -- Update
    UPDATE public.organizations 
    SET 
        valid_until = new_date,
        subscription_status = 'active'
    WHERE id = org_id;

    RETURN new_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
