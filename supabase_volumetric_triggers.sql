-- Database Migration Script: Triggers and Stock Logic
-- Description: Creates the logic for automated stock reduction and low stock detection.

-- 1. Deduct Stock Function
CREATE OR REPLACE FUNCTION public.deduct_insumo_stock(
    p_insumo_id uuid,
    p_amount numeric,
    p_action_type text,
    p_reference_id uuid,
    p_user_id uuid,
    p_org_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Needs to ignore some RLS to update stock behind the scenes
AS $$
DECLARE
    v_current numeric;
BEGIN
    -- Get current stock
    SELECT current_volume INTO v_current
    FROM public.chakra_stock_items
    WHERE id = p_insumo_id AND organization_id = p_org_id
    FOR UPDATE; -- Lock the row

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Insumo not found or access denied';
    END IF;

    -- Update the stock
    UPDATE public.chakra_stock_items
    SET current_volume = current_volume - p_amount,
        updated_at = now()
    WHERE id = p_insumo_id;

    -- Log transaction
    INSERT INTO public.stock_transactions (
        organization_id, insumo_id, action_type, amount_deducted, performed_by, reference_id
    ) VALUES (
        p_org_id, p_insumo_id, p_action_type, p_amount, p_user_id, p_reference_id
    );

    RETURN true;
END;
$$;


-- 2. Trigger for Low Stock (Growy Auto-Restock)
CREATE OR REPLACE FUNCTION public.check_low_stock_threshold()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_provider_id uuid;
    v_org_id uuid;
    v_has_pending boolean;
BEGIN
    -- Only act if stock goes down and falls below or equals threshold
    IF NEW.current_volume < OLD.current_volume AND 
       NEW.current_volume <= NEW.reorder_threshold AND 
       NEW.auto_restock_enabled = true AND 
       NEW.provider_id IS NOT NULL THEN
       
       -- Check if there's *already* a pending order to avoid spamming the provider
       SELECT EXISTS (
           SELECT 1 FROM public.insumo_purchase_orders
           WHERE insumo_id = NEW.id AND status = 'PENDING'
       ) INTO v_has_pending;
       
       IF NOT v_has_pending THEN
           -- Create a pending order
           INSERT INTO public.insumo_purchase_orders (
               organization_id, insumo_id, provider_id, status, quantity_requested, ai_generated
           ) VALUES (
               NEW.organization_id, NEW.id, NEW.provider_id, 'PENDING', 1, true
           );
           
           -- Trigger an HTTP request (Edge Function) or rely on a webhook.
           -- In Supabase, it's safer to use Webhooks on `insumo_purchase_orders` inserts
           -- than doing pg_net requests directly in trigger (to avoid blocking DB).
       END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Attach trigger to stock table
DROP TRIGGER IF EXISTS trg_check_low_stock_threshold ON public.chakra_stock_items;
CREATE TRIGGER trg_check_low_stock_threshold
AFTER UPDATE ON public.chakra_stock_items
FOR EACH ROW
WHEN (NEW.current_volume IS DISTINCT FROM OLD.current_volume)
EXECUTE FUNCTION public.check_low_stock_threshold();
