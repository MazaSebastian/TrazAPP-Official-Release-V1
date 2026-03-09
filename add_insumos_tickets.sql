-- 1. Create the storage bucket for supply tickets if it doesn't exist
insert into storage.buckets (id, name, public) 
values ('supply_tickets', 'supply_tickets', true)
on conflict (id) do nothing;

-- 2. Setup RLS Policies for the bucket
create policy "Public Access" 
  on storage.objects for select 
  using ( bucket_id = 'supply_tickets' );

create policy "Auth Insert" 
  on storage.objects for insert 
  with check ( bucket_id = 'supply_tickets' AND auth.role() = 'authenticated' );

create policy "Auth Update" 
  on storage.objects for update 
  with check ( bucket_id = 'supply_tickets' AND auth.role() = 'authenticated' );

create policy "Auth Delete" 
  on storage.objects for delete 
  using ( bucket_id = 'supply_tickets' AND auth.role() = 'authenticated' );

-- 3. Add ticket_url to the main stock items table
alter table public.chakra_stock_items
add column if not exists ticket_url text;

-- 4. Add ticket_url to the price history table
alter table public.chakra_historial_precios
add column if not exists ticket_url text;
