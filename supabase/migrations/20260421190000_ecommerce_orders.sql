-- Feature: Patient E-Commerce Orders
-- Creating dedicated tables for patient reservations to keep dispensary_movements strictly for executed logistical transactions.

-- Set up ENUM for Order Status
CREATE TYPE dispensary_order_status AS ENUM ('pending', 'approved', 'rejected', 'completed');

-- 1. Orders Table
CREATE TABLE IF NOT EXISTS dispensary_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    status dispensary_order_status NOT NULL DEFAULT 'pending',
    total_price NUMERIC(10,2) DEFAULT 0,
    notes TEXT,
    staff_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 2. Order Items Table (Many-to-Many relation to batches)
CREATE TABLE IF NOT EXISTS dispensary_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES dispensary_orders(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES chakra_dispensary_batches(id) ON DELETE RESTRICT,
    quantity NUMERIC(10,2) NOT NULL CHECK (quantity > 0),
    price_per_unit NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- RLS: Orders
ALTER TABLE dispensary_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders"
    ON dispensary_orders FOR SELECT
    USING (auth.uid() = member_id OR 
           auth.uid() IN (SELECT user_id FROM organization_members WHERE organization_id = dispensary_orders.organization_id AND role IN ('super_admin', 'admin', 'owner', 'staff')));

CREATE POLICY "Users can insert their own orders"
    ON dispensary_orders FOR INSERT
    WITH CHECK (auth.uid() = member_id);

CREATE POLICY "Admins can update orders"
    ON dispensary_orders FOR UPDATE
    USING (auth.uid() IN (SELECT user_id FROM organization_members WHERE organization_id = dispensary_orders.organization_id AND role IN ('super_admin', 'admin', 'owner', 'staff')));


-- RLS: Order Items
ALTER TABLE dispensary_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own order items"
    ON dispensary_order_items FOR SELECT
    USING (order_id IN (SELECT id FROM dispensary_orders WHERE member_id = auth.uid() OR organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin', 'owner', 'staff')
    )));

CREATE POLICY "Users can insert their own order items"
    ON dispensary_order_items FOR INSERT
    WITH CHECK (order_id IN (SELECT id FROM dispensary_orders WHERE member_id = auth.uid()));

CREATE POLICY "Admins can update order items"
    ON dispensary_order_items FOR UPDATE
    USING (order_id IN (SELECT id FROM dispensary_orders WHERE organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin', 'owner', 'staff')
    )));

-- Add function to update updated_at
CREATE OR REPLACE FUNCTION update_dispensary_order_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_dispensary_orders_updated_at
BEFORE UPDATE ON dispensary_orders
FOR EACH ROW EXECUTE FUNCTION update_dispensary_order_timestamp();
