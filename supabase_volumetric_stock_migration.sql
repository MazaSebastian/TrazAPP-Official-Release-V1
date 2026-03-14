-- Database Migration Script: Volumetric Stock & Insumo Providers
-- Description: Adds volume tracking to stock items, creates provider and purchase order tables,
-- and implements the necessary RLS policies.

-- 1. Create Insumo Providers table
CREATE TABLE IF NOT EXISTS public.insumo_providers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    contact_name text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT insumo_providers_pkey PRIMARY KEY (id),
    CONSTRAINT insumo_providers_organization_id_fkey FOREIGN KEY (organization_id)
        REFERENCES public.organizations (id) ON DELETE CASCADE
);

-- RLS Policies for insumo_providers
ALTER TABLE public.insumo_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's providers"
    ON public.insumo_providers FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Admins can manage their organization's providers"
    ON public.insumo_providers FOR ALL
    USING (
        organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
        AND
        (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('Dueño', 'Ingeniero Agrónomo', 'Encargado')
    )
    WITH CHECK (
        organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
        AND
        (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('Dueño', 'Ingeniero Agrónomo', 'Encargado')
    );


-- 2. Modify chakra_stock_items to support volumetrics and auto-restock
-- Note: using IF NOT EXISTS or checking column existence is preferred in production, 
-- but Supabase allows straightforward ADD COLUMN if they don't exist yet.

DO $$ 
BEGIN
    BEGIN
        ALTER TABLE public.chakra_stock_items 
            ADD COLUMN current_volume numeric DEFAULT 0,
            ADD COLUMN total_volume numeric DEFAULT 0,
            ADD COLUMN unit_of_measurement text DEFAULT 'unidades',
            ADD COLUMN reorder_threshold numeric DEFAULT 0,
            ADD COLUMN auto_restock_enabled boolean DEFAULT false,
            ADD COLUMN provider_id uuid REFERENCES public.insumo_providers(id) ON DELETE SET NULL;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'Columns already exist in chakra_stock_items.';
    END;
END $$;


-- 3. Create Insumo Purchase Orders table (for Growy AI logic)
CREATE TABLE IF NOT EXISTS public.insumo_purchase_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    insumo_id uuid NOT NULL,
    provider_id uuid NOT NULL,
    status text DEFAULT 'PENDING' NOT NULL CHECK (status IN ('PENDING', 'SENT', 'DELIVERED', 'CANCELLED')),
    quantity_requested integer DEFAULT 1 NOT NULL,
    ordered_at timestamp with time zone DEFAULT now() NOT NULL,
    ai_generated boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT insumo_purchase_orders_pkey PRIMARY KEY (id),
    CONSTRAINT ipo_organization_id_fkey FOREIGN KEY (organization_id)
        REFERENCES public.organizations (id) ON DELETE CASCADE,
    CONSTRAINT ipo_insumo_id_fkey FOREIGN KEY (insumo_id)
        REFERENCES public.chakra_stock_items (id) ON DELETE CASCADE,
    CONSTRAINT ipo_provider_id_fkey FOREIGN KEY (provider_id)
        REFERENCES public.insumo_providers (id) ON DELETE CASCADE
);

-- RLS Policies for insumo_purchase_orders
ALTER TABLE public.insumo_purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's purchase orders"
    ON public.insumo_purchase_orders FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Admins can manage their organization's purchase orders"
    ON public.insumo_purchase_orders FOR ALL
    USING (
        organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
        AND
        (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('Dueño', 'Ingeniero Agrónomo', 'Encargado')
    )
    WITH CHECK (
        organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
        AND
        (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('Dueño', 'Ingeniero Agrónomo', 'Encargado')
    );


-- 4. Create Stock Transactions table (Audit trail for volume changes)
CREATE TABLE IF NOT EXISTS public.stock_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    insumo_id uuid NOT NULL,
    action_type text NOT NULL CHECK (action_type IN ('TRANSPLANT', 'TASK_APPLICATION', 'MANUAL_ADJUSTMENT', 'RESTOCK')),
    amount_deducted numeric NOT NULL,
    performed_by uuid NOT NULL,
    reference_id uuid, -- Link to a task_id, harvest_id, etc. if needed
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT stock_transactions_pkey PRIMARY KEY (id),
    CONSTRAINT st_organization_id_fkey FOREIGN KEY (organization_id)
        REFERENCES public.organizations (id) ON DELETE CASCADE,
    CONSTRAINT st_insumo_id_fkey FOREIGN KEY (insumo_id)
        REFERENCES public.chakra_stock_items (id) ON DELETE CASCADE,
    CONSTRAINT st_performed_by_fkey FOREIGN KEY (performed_by)
        REFERENCES auth.users (id) ON DELETE SET NULL
);

-- RLS Policies for stock_transactions
ALTER TABLE public.stock_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's stock transactions"
    ON public.stock_transactions FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    ));

-- Note: We generally don't want users to manually UPDATE/DELETE transactions. They should be append-only.
CREATE POLICY "Users can insert stock transactions for their organization"
    ON public.stock_transactions FOR INSERT
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    ));
