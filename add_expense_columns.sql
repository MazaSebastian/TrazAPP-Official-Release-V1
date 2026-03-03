-- Add new columns for the Expenses module enhancement
ALTER TABLE public.chakra_expenses
ADD COLUMN payment_method text,
ADD COLUMN responsible_user_id uuid REFERENCES public.profiles(id);

-- (Optional) If you want existing generic 'owner' text values to be migrated to user references,
-- you would need to map them manually. Since it was generic text like "Staff / Operario", 
-- it's better to just leave them as they are in the 'owner' text column for historical data, 
-- and start using 'responsible_user_id' for all new movements.
