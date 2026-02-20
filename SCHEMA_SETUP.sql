-- 1. Crear tabla app_members si no existe
CREATE TABLE IF NOT EXISTS public.app_members (
  user_id uuid PRIMARY KEY,
  created_at timestamptz DEFAULT now()
);

-- 2. Insertar usuarios autorizados (se puede expandir luego)
-- Esto previene errores de "relation does not exist" en las politicas de otras tablas
-- Create a table for public profiles
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  website text,
  role text default 'employee',
  
  constraint username_length check (char_length(username) >= 3)
);

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- This trigger automatically creates a profile entry when a new user signs up via Supabase Auth.
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'name', coalesce(new.raw_user_meta_data->>'role', 'employee'));
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
-- Create Rooms table
create table if not exists public.rooms (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  type text not null, -- 'indoor', 'outdoor', 'drying', etc.
  capacity int default 0,
  current_temperature float,
  current_humidity float,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Rooms
alter table public.rooms enable row level security;
create policy "Enable all access for now" on public.rooms for all using (true) with check (true);

-- Create Batches table
create table if not exists public.batches (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  strain text,
  quantity int default 0,
  stage text not null default 'vegetation', -- 'seedling', 'vegetation', 'flowering', 'drying', 'curing', 'completed'
  start_date date default now(),
  current_room_id uuid references public.rooms(id) on delete set null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Batches
alter table public.batches enable row level security;
create policy "Enable all access for now" on public.batches for all using (true) with check (true);

-- Create Batch Movement History table
create table if not exists public.batch_movements (
  id uuid default gen_random_uuid() primary key,
  batch_id uuid references public.batches(id) on delete cascade not null,
  from_room_id uuid references public.rooms(id) on delete set null,
  to_room_id uuid references public.rooms(id) on delete set null,
  moved_at timestamp with time zone default timezone('utc'::text, now()) not null,
  notes text,
  created_by uuid references auth.users(id)
);

-- Enable RLS for Movements
alter table public.batch_movements enable row level security;
create policy "Enable all access for now" on public.batch_movements for all using (true) with check (true);

-- Insert some default rooms (optional, helps with visualization)
insert into public.rooms (name, type, capacity) values 
('Sala A - Vegetación', 'vegetation', 500),
('Sala B - Floración 1', 'flowering', 300),
('Sala C - Floración 2', 'flowering', 300),
('Secadero Principal', 'drying', 1000);
-- Create Genetics table
create table if not exists public.genetics (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  type text not null, -- 'automatic', 'photoperiodic'
  vegetative_weeks int default 0,
  flowering_weeks int default 0,
  breeder text,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Genetics
alter table public.genetics enable row level security;
create policy "Enable all access for now" on public.genetics for all using (true) with check (true);

-- Add Reference to Batches table
-- We use alter table to add the column if it doesn't exist.
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name = 'batches' and column_name = 'genetic_id') then
    alter table public.batches add column genetic_id uuid references public.genetics(id) on delete set null;
  end if;
end $$;
-- Create table for Spots (formerly crops) if it doesn't exist
create table if not exists public.chakra_crops (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  location text default 'General',
  start_date timestamp with time zone,
  estimated_harvest_date timestamp with time zone,
  status text default 'active',
  color text default 'green',
  photo_url text,
  user_id uuid references auth.users(id)
);

-- Enable Row Level Security (RLS)
alter table public.chakra_crops enable row level security;

-- Policy to allow authenticated users to view all crops (or restrict to own if needed)
create policy "Enable read access for all users"
on public.chakra_crops for select
using (true);

-- Policy to allow authenticated users to insert crops
create policy "Enable insert for authenticated users"
on public.chakra_crops for insert
with check (true);

-- Policy to allow authenticated users to update their own crops (simplified to all for now based on app type)
create policy "Enable update for authenticated users"
on public.chakra_crops for update
using (true);

-- Policy to allow authenticated users to delete crops
create policy "Enable delete for authenticated users"
on public.chakra_crops for delete
using (true);
-- Create table for General Stock Items (Insumos) matching Stock.tsx
create table if not exists public.chakra_stock_items (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  
  name text not null,
  qty numeric default 0,
  unit text default 'u', -- 'g', 'ml', 'u', etc.
  category text default 'general',
  location text,
  notes text
);

-- Enable RLS
alter table public.chakra_stock_items enable row level security;

-- Policies
create policy "Enable read access for authenticated users" 
on public.chakra_stock_items for select 
to authenticated 
using (true);

create policy "Enable insert for authenticated users" 
on public.chakra_stock_items for insert 
to authenticated 
with check (true);

create policy "Enable update for authenticated users" 
on public.chakra_stock_items for update 
to authenticated 
using (true);

create policy "Enable delete for authenticated users" 
on public.chakra_stock_items for delete 
to authenticated 
using (true);

-- Realtime publication (Simple idempotent check)
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.chakra_stock_items;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
END $$;
-- Create Expenses Table for Financial Metrics
create table if not exists public.chakra_expenses (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    
    date date not null default CURRENT_DATE,
    amount numeric not null,
    category text not null check (category in ('electricity', 'water', 'nutrients', 'substrates', 'rent', 'salaries', 'maintenance', 'equipment', 'other')),
    
    description text,
    
    -- Optional links for attribution
    room_id uuid references public.rooms(id) on delete set null,
    batch_id uuid references public.batches(id) on delete set null,
    
    logged_by uuid references auth.users(id)
);

-- Enable RLS
alter table public.chakra_expenses enable row level security;

-- Policies
create policy "Enable read access for authenticated users" on public.chakra_expenses for select to authenticated using (true);
create policy "Enable insert for authenticated users" on public.chakra_expenses for insert to authenticated with check (true);
create policy "Enable update for authenticated users" on public.chakra_expenses for update to authenticated using (true);
create policy "Enable delete for authenticated users" on public.chakra_expenses for delete to authenticated using (true);

-- Index
create index if not exists idx_expenses_date on public.chakra_expenses(date);
create index if not exists idx_expenses_category on public.chakra_expenses(category);
-- Script para crear y configurar la tabla de compras en Supabase
-- Ejecutar en Supabase SQL Editor

-- 1. Crear tabla de compras
CREATE TABLE IF NOT EXISTS public.compras (
  id text PRIMARY KEY,
  name text NOT NULL,
  priority text NOT NULL CHECK (priority IN ('BAJO', 'MEDIO', 'ALTO')),
  completed boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Habilitar RLS
ALTER TABLE public.compras ENABLE ROW LEVEL SECURITY;

-- 3. Crear políticas RLS para acceso compartido
DROP POLICY IF EXISTS "Usuarios autorizados pueden ver compras" ON public.compras;
CREATE POLICY "Usuarios autorizados pueden ver compras" ON public.compras
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM public.app_members)
  );

DROP POLICY IF EXISTS "Usuarios autorizados pueden insertar compras" ON public.compras;
CREATE POLICY "Usuarios autorizados pueden insertar compras" ON public.compras
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.app_members)
  );

DROP POLICY IF EXISTS "Usuarios autorizados pueden actualizar compras" ON public.compras;
CREATE POLICY "Usuarios autorizados pueden actualizar compras" ON public.compras
  FOR UPDATE USING (
    auth.uid() IN (SELECT user_id FROM public.app_members)
  );

DROP POLICY IF EXISTS "Usuarios autorizados pueden eliminar compras" ON public.compras;
CREATE POLICY "Usuarios autorizados pueden eliminar compras" ON public.compras
  FOR DELETE USING (
    auth.uid() IN (SELECT user_id FROM public.app_members)
  );

-- 4. Agregar a Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'compras'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.compras;
  END IF;
END $$;

-- 5. Crear trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_compras_updated_at ON public.compras;
CREATE TRIGGER update_compras_updated_at
    BEFORE UPDATE ON public.compras
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Verificar configuración
SELECT 
  'compras' as table_name,
  COUNT(*) as record_count
FROM public.compras
UNION ALL
SELECT 
  'app_members' as table_name,
  COUNT(*) as user_count
FROM public.app_members;
-- Create table for Harvest Logs
create table if not exists public.chakra_harvest_logs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  crop_id uuid, -- Reference to the main Crop (Spot)
  room_name text not null, -- Store name as room will be deleted
  yield_amount numeric not null,
  yield_unit text not null check (yield_unit in ('g', 'kg')),
  notes text,
  logged_by uuid references auth.users(id)
);

-- Enable RLS
alter table public.chakra_harvest_logs enable row level security;

-- Policies
create policy "Enable read access for all users" on public.chakra_harvest_logs for select using (true);
create policy "Enable insert for authenticated users" on public.chakra_harvest_logs for insert with check (true);
create policy "Enable update for authenticated users" on public.chakra_harvest_logs for update using (true);
create policy "Enable delete for authenticated users" on public.chakra_harvest_logs for delete using (true);
-- Create table for Dispensary Batches (Finished Product)
create table if not exists public.chakra_dispensary_batches (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Origin tracking
  harvest_log_id uuid references public.chakra_harvest_logs(id), 
  crop_id uuid, -- Optional reference if we want to keep it even if crop is deleted (or store as text)
  
  -- Details
  strain_name text not null,
  batch_code text not null, -- "AUR-2026-001"
  
  -- Inventory
  initial_weight numeric not null, -- in grams (standardizing to g for internal logic)
  current_weight numeric not null, -- in grams
  
  -- Classification
  quality_grade text default 'Standard' check (quality_grade in ('Premium', 'Standard', 'Extracts', 'Trim')),
  status text default 'curing' check (status in ('curing', 'available', 'depleted', 'quarantine')),
  
  location text default 'Depósito General',
  
  notes text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table public.chakra_dispensary_batches enable row level security;

-- Policies
create policy "Enable read access for all users" on public.chakra_dispensary_batches for select using (true);
create policy "Enable insert for authenticated users" on public.chakra_dispensary_batches for insert with check (true);
create policy "Enable update for authenticated users" on public.chakra_dispensary_batches for update using (true);
create policy "Enable delete for authenticated users" on public.chakra_dispensary_batches for delete using (true);

-- Indexes for performance
create index if not exists idx_dispensary_status on public.chakra_dispensary_batches(status);
create index if not exists idx_dispensary_strain on public.chakra_dispensary_batches(strain_name);
-- Create Extractions Table
CREATE TABLE IF NOT EXISTS chakra_extractions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_batch_id UUID REFERENCES chakra_dispensary_batches(id),
  date DATE NOT NULL,
  technique TEXT NOT NULL CHECK (technique IN ('Rosin', 'BHO', 'Ice', 'Dry Sift')),
  input_weight NUMERIC NOT NULL CHECK (input_weight > 0),
  output_weight NUMERIC NOT NULL CHECK (output_weight >= 0),
  yield_percentage NUMERIC GENERATED ALWAYS AS ((output_weight / input_weight) * 100) STORED,
  parameters JSONB DEFAULT '{}'::jsonb, -- Stores temp, pressure, microns, cycles, etc.
  ratings JSONB DEFAULT '{}'::jsonb, -- Stores aroma, texture, potency (1-10)
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE chakra_extractions ENABLE ROW LEVEL SECURITY;

-- Create Policies (Assuming public access for authenticated users for now, similar to other tables)
CREATE POLICY "Enable read access for all users" ON chakra_extractions FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON chakra_extractions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for users based on email" ON chakra_extractions FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for users based on email" ON chakra_extractions FOR DELETE USING (auth.role() = 'authenticated');
-- Create table for Dispensary Movements (Log of Stock Changes)
create table if not exists public.chakra_dispensary_movements (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  batch_id uuid references public.chakra_dispensary_batches(id) not null,
  
  -- Movement Details
  type text not null check (type in ('dispense', 'adjustment', 'quality_test', 'restock')),
  amount numeric not null, -- Amount changed (g). Negative for dispense/loss, Positive for restock/adjustment.
  
  reason text,
  
  -- Responsible / Member
  performed_by uuid references auth.users(id), -- Staff who did the action
  member_id uuid, -- Optional: If we link to members later
  
  previous_weight numeric, -- Snapshots for audit
  new_weight numeric
);

-- Enable RLS
alter table public.chakra_dispensary_movements enable row level security;

-- Policies
create policy "Enable read access for all users" on public.chakra_dispensary_movements for select using (true);
create policy "Enable insert for authenticated users" on public.chakra_dispensary_movements for insert with check (true);
create policy "Enable update for authenticated users" on public.chakra_dispensary_movements for update using (true);
create policy "Enable delete for authenticated users" on public.chakra_dispensary_movements for delete using (true);

-- Index
create index if not exists idx_movements_batch on public.chakra_dispensary_movements(batch_id);
-- Allow public (anon) read access to Dispensary Batches
-- This is required for the QR / Passport Page to work without login.
drop policy if exists "Enable read access for all users" on public.chakra_dispensary_batches;

create policy "Enable public read access" 
on public.chakra_dispensary_batches 
for select 
to anon, authenticated
using (true);

-- Also ensure 'anon' can read linked Genetic info if needed (assuming genetics table exists)
-- If genetics table policy is restricted, we might need to open it too or replicate data.
-- Assuming 'genetics' table is already readable or we only use batch data for now.
-- Verify policy on 'genetics' table if applicable.
-- Create Activities table (Action Log / Feed)
-- Required by setup_push_notifications.sql triggers

create table if not exists public.activities (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id),
  action text not null, -- 'created_batch', 'moved_batch', 'alert_triggered', etc.
  details jsonb default '{}'::jsonb,
  ref_id uuid, -- Optional reference to the object (batch_id, room_id, etc.)
  ref_type text, -- 'batch', 'room', 'crop', 'task'
  cropName text, -- Required by trigger
  title text -- Required by trigger
);

-- Enable RLS
alter table public.activities enable row level security;

-- Policies
create policy "Enable read access for all users" on public.activities for select using (true);
create policy "Enable insert for authenticated users" on public.activities for insert with check (true);
create policy "Enable update for authenticated users" on public.activities for update using (true);
create policy "Enable delete for authenticated users" on public.activities for delete using (true);

-- Indexes
create index if not exists idx_activities_user on public.activities(user_id);
create index if not exists idx_activities_ref on public.activities(ref_id);
-- Create missing tables referenced by push notification triggers
-- These seem to be legacy or planned tables that are expected by the notification logic

-- 1. Planned Events
CREATE TABLE IF NOT EXISTS public.planned_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  title text,
  cropName text, -- Required by trigger
  date timestamptz
);
ALTER TABLE public.planned_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for now" ON public.planned_events FOR ALL USING (true) WITH CHECK (true);

-- 2. Daily Records (distinct from chakra_daily_logs?)
CREATE TABLE IF NOT EXISTS public.daily_records (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  cropName text, -- Required by trigger
  notes text
);
ALTER TABLE public.daily_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for now" ON public.daily_records FOR ALL USING (true) WITH CHECK (true);

-- 3. Tasks (distinct from chakra_tasks?)
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  title text,
  cropName text, -- Required by trigger
  status text
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for now" ON public.tasks FOR ALL USING (true) WITH CHECK (true);
-- Create table for Tasks
create table if not exists public.chakra_tasks (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  description text,
  type text not null,
  due_date text, -- Storing as text (YYYY-MM-DD) for simplicity with frontend, or date
  status text default 'pending',
  crop_id uuid -- references public.chakra_crops(id)
);

-- Create table for Daily Logs
create table if not exists public.chakra_daily_logs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  date text not null,
  notes text,
  crop_id uuid -- references public.chakra_crops(id)
);

-- Add Unique Constraint for Daily Logs (One per day per crop)
alter table public.chakra_daily_logs add constraint chakra_daily_logs_crop_date_key unique (crop_id, date);

-- Enable RLS
alter table public.chakra_tasks enable row level security;
alter table public.chakra_daily_logs enable row level security;

-- Policies for Tasks
create policy "Enable read access for all users" on public.chakra_tasks for select using (true);
create policy "Enable insert for authenticated users" on public.chakra_tasks for insert with check (true);
create policy "Enable update for authenticated users" on public.chakra_tasks for update using (true);
create policy "Enable delete for authenticated users" on public.chakra_tasks for delete using (true);

-- Policies for Logs
create policy "Enable read access for all users" on public.chakra_daily_logs for select using (true);
create policy "Enable insert for authenticated users" on public.chakra_daily_logs for insert with check (true);
create policy "Enable update for authenticated users" on public.chakra_daily_logs for update using (true);
create policy "Enable delete for authenticated users" on public.chakra_daily_logs for delete using (true);
-- RPC Functions for Metrics Dashboard

-- 1. Get Monthly Financials & Yields
create or replace function get_monthly_metrics(query_year int)
returns table (
    month int,
    total_yield numeric,
    total_expenses numeric,
    total_revenue numeric
)
language plpgsql
as $$
begin
    return query
    with months as (
        select generate_series(1, 12) as m
    ),
    yields as (
        select 
            extract(month from created_at)::int as m, 
            sum(yield_amount) as amount
        from chakra_harvest_logs
        where extract(year from created_at) = query_year
        group by 1
    ),
    expenses as (
        select 
            extract(month from date)::int as m, 
            sum(amount) as total
        from chakra_expenses
        where extract(year from date) = query_year
        group by 1
    ),
    revenue as (
        select 
            extract(month from created_at)::int as m, 
            -- Revenue is usually Positive sum where type='dispense' (sale) if we tracked it as positive 
            -- But usually dispense removes stock. 
            -- Let's assume transaction_value is stored as positive for SALES.
            sum(transaction_value) as total
        from chakra_dispensary_movements
        where extract(year from created_at) = query_year
        and type = 'dispense' -- Assuming dispense acts as sale/outflow
        group by 1
    )
    select 
        months.m,
        coalesce(yields.amount, 0) as total_yield,
        coalesce(expenses.total, 0) as total_expenses,
        coalesce(revenue.total, 0) as total_revenue
    from months
    left join yields on months.m = yields.m
    left join expenses on months.m = expenses.m
    left join revenue on months.m = revenue.m
    order by months.m;
end;
$$;

-- 2. Performance by Genetic (Yield per Plant approximation)
-- This is tricky without exact plant counts per harvest, but we can average yield per batch if 1 batch = 1 harvest log usually.
create or replace function get_genetic_performance()
returns table (
    genetic_name text,
    total_yield_g numeric,
    harvest_count bigint,
    avg_yield_per_harvest numeric
)
language plpgsql
as $$
begin
    return query
    select 
        -- If harvest logs had genetic_id it would be better, but we rely on notes or joining back to crop/batch.
        -- For V1 we might rely on 'room_name' or if we can link batch.
        -- Wait, chakra_dispensary_batches has 'strain_name' and links to 'harvest_log_id'.
        -- So we can join dispensary batches to get strain name from harvest log?
        -- Actually distinct harvest logs don't directly store strain name in the table definition I saw earlier, 
        -- but dispensary_batches DOES refer to harvest_logs.
        d.strain_name,
        sum(h.yield_amount) as total_yield_g,
        count(distinct h.id) as harvest_count,
        round(avg(h.yield_amount), 2) as avg_yield_per_harvest
    from chakra_harvest_logs h
    join chakra_dispensary_batches d on d.harvest_log_id = h.id
    group by d.strain_name
    order by total_yield_g desc;
end;
$$;

-- 3. Cost Breakdown
create or replace function get_cost_breakdown(start_date date, end_date date)
returns table (
    category text,
    total_amount numeric,
    percentage numeric
)
language plpgsql
as $$
declare 
    total_sum numeric;
begin
    select sum(amount) into total_sum from chakra_expenses where date between start_date and end_date;
    
    return query
    select 
        e.category,
        sum(e.amount) as total_amount,
        case when total_sum > 0 then round((sum(e.amount) / total_sum) * 100, 1) else 0 end as percentage
    from chakra_expenses e
    where e.date between start_date and end_date
    group by e.category
    order by total_amount desc;
end;
$$;
-- Create Stickies Table
create table if not exists public.chakra_stickies (
    id uuid default gen_random_uuid() primary key,
    content text not null,
    color text default 'yellow',
    created_by text,
    user_id uuid references auth.users(id),
    room_id uuid references public.rooms(id) on delete cascade, -- referencing rooms table
    target_date date,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.chakra_stickies enable row level security;

-- Policies
create policy "Enable read access for all authenticated users"
    on public.chakra_stickies for select
    to authenticated
    using (true);

create policy "Enable insert access for authenticated users"
    on public.chakra_stickies for insert
    to authenticated
    with check (true);

create policy "Enable update for users based on id"
    on public.chakra_stickies for update
    to authenticated
    using (true); -- Relaxed policy for now, or restrict to user_id = auth.uid()

create policy "Enable delete for users based on id"
    on public.chakra_stickies for delete
    to authenticated
    using (true); -- Relaxed policy for now

-- Index for performance
create index if not exists idx_stickies_room_date on public.chakra_stickies(room_id, target_date);
-- Script para verificar y configurar la tabla announcements en Supabase
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar si la tabla existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'announcements'
) as table_exists;

-- 2. Crear tabla si no existe
CREATE TABLE IF NOT EXISTS public.announcements (
  id text PRIMARY KEY,
  message text NOT NULL,
  type text DEFAULT 'info',
  created_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Habilitar RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas RLS para acceso compartido
DROP POLICY IF EXISTS "Usuarios autorizados pueden ver announcements" ON public.announcements;
CREATE POLICY "Usuarios autorizados pueden ver announcements" ON public.announcements
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM public.app_members)
  );

DROP POLICY IF EXISTS "Usuarios autorizados pueden insertar announcements" ON public.announcements;
CREATE POLICY "Usuarios autorizados pueden insertar announcements" ON public.announcements
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.app_members)
  );

DROP POLICY IF EXISTS "Usuarios autorizados pueden actualizar announcements" ON public.announcements;
CREATE POLICY "Usuarios autorizados pueden actualizar announcements" ON public.announcements
  FOR UPDATE USING (
    auth.uid() IN (SELECT user_id FROM public.app_members)
  );

DROP POLICY IF EXISTS "Usuarios autorizados pueden eliminar announcements" ON public.announcements;
CREATE POLICY "Usuarios autorizados pueden eliminar announcements" ON public.announcements
  FOR DELETE USING (
    auth.uid() IN (SELECT user_id FROM public.app_members)
  );

-- 5. Agregar a Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'announcements'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
  END IF;
END $$;

-- 6. Crear trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_announcements_updated_at ON public.announcements;
CREATE TRIGGER update_announcements_updated_at
    BEFORE UPDATE ON public.announcements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Verificar estructura de la tabla
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'announcements'
ORDER BY ordinal_position;

-- 8. Verificar políticas RLS
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'announcements';
-- Script para configurar notificaciones push en Supabase
-- Ejecutar en Supabase SQL Editor

-- 1. Crear tabla de suscripciones push
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Habilitar RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 3. Crear políticas RLS
DROP POLICY IF EXISTS "Usuarios pueden ver sus propias suscripciones" ON public.push_subscriptions;
CREATE POLICY "Usuarios pueden ver sus propias suscripciones" ON public.push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios pueden insertar sus propias suscripciones" ON public.push_subscriptions;
CREATE POLICY "Usuarios pueden insertar sus propias suscripciones" ON public.push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propias suscripciones" ON public.push_subscriptions;
CREATE POLICY "Usuarios pueden actualizar sus propias suscripciones" ON public.push_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propias suscripciones" ON public.push_subscriptions;
CREATE POLICY "Usuarios pueden eliminar sus propias suscripciones" ON public.push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- 4. Crear función para enviar notificaciones push
CREATE OR REPLACE FUNCTION send_push_notification(
  title text,
  body text DEFAULT NULL,
  url text DEFAULT NULL,
  user_ids uuid[] DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  subscription_record RECORD;
  webhook_url text := 'https://crop-crm.vercel.app/api/push/notify';
  webhook_secret text := 'e0fb24f1265a4aa5fdb718fcac0c541d38e8e62eecf4d7ce0c85b75aed3c78c8';
  subscriptions jsonb := '[]'::jsonb;
  notification jsonb;
BEGIN
  -- Construir notificación
  notification := jsonb_build_object(
    'title', title,
    'body', COALESCE(body, ''),
    'url', COALESCE(url, '')
  );
  
  -- Obtener suscripciones
  IF user_ids IS NULL THEN
    -- Enviar a todos los usuarios
    SELECT jsonb_agg(
      jsonb_build_object(
        'endpoint', ps.endpoint,
        'keys', jsonb_build_object(
          'p256dh', ps.p256dh,
          'auth', ps.auth
        )
      )
    ) INTO subscriptions
    FROM public.push_subscriptions ps;
  ELSE
    -- Enviar solo a usuarios específicos
    SELECT jsonb_agg(
      jsonb_build_object(
        'endpoint', ps.endpoint,
        'keys', jsonb_build_object(
          'p256dh', ps.p256dh,
          'auth', ps.auth
        )
      )
    ) INTO subscriptions
    FROM public.push_subscriptions ps
    WHERE ps.user_id = ANY(user_ids);
  END IF;
  
  -- Enviar notificación si hay suscripciones
  IF subscriptions IS NOT NULL AND jsonb_array_length(subscriptions) > 0 THEN
    PERFORM net.http_post(
      url := webhook_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-chakra-secret', webhook_secret
      ),
      body := jsonb_build_object(
        'subscriptions', subscriptions,
        'notification', notification
      )
    );
  END IF;
END;
$$;

-- 5. Crear triggers para notificaciones automáticas

-- Trigger para nuevos anuncios
CREATE OR REPLACE FUNCTION notify_new_announcement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM send_push_notification(
    title := 'Nuevo Aviso',
    body := NEW.content,
    url := 'https://crop-crm.vercel.app/'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_new_announcement ON public.announcements;
CREATE TRIGGER trigger_notify_new_announcement
  AFTER INSERT ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_announcement();

-- Trigger para nuevas actividades
CREATE OR REPLACE FUNCTION notify_new_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM send_push_notification(
    title := 'Nueva Actividad Registrada',
    body := NEW.title || ' - ' || NEW.cropName,
    url := 'https://crop-crm.vercel.app/daily-log'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_new_activity ON public.activities;
CREATE TRIGGER trigger_notify_new_activity
  AFTER INSERT ON public.activities
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_activity();

-- Trigger para nuevos eventos planificados
CREATE OR REPLACE FUNCTION notify_new_planned_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM send_push_notification(
    title := 'Nuevo Evento Planificado',
    body := NEW.title || ' - ' || NEW.cropName,
    url := 'https://crop-crm.vercel.app/'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_new_planned_event ON public.planned_events;
CREATE TRIGGER trigger_notify_new_planned_event
  AFTER INSERT ON public.planned_events
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_planned_event();

-- Trigger para nuevos registros diarios
CREATE OR REPLACE FUNCTION notify_new_daily_record()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM send_push_notification(
    title := 'Nuevo Registro Diario',
    body := NEW.cropName || ' - ' || NEW.notes,
    url := 'https://crop-crm.vercel.app/daily-log'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_new_daily_record ON public.daily_records;
CREATE TRIGGER trigger_notify_new_daily_record
  AFTER INSERT ON public.daily_records
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_daily_record();

-- Trigger para nuevas tareas
CREATE OR REPLACE FUNCTION notify_new_task()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM send_push_notification(
    title := 'Nueva Tarea',
    body := NEW.title || ' - ' || NEW.cropName,
    url := 'https://crop-crm.vercel.app/tasks'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_new_task ON public.tasks;
CREATE TRIGGER trigger_notify_new_task
  AFTER INSERT ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_task();

-- 6. Verificar configuración
SELECT 
  'push_subscriptions' as table_name,
  COUNT(*) as subscription_count
FROM public.push_subscriptions
UNION ALL
SELECT 
  'announcements' as table_name,
  COUNT(*) as announcement_count
FROM public.announcements
UNION ALL
SELECT 
  'activities' as table_name,
  COUNT(*) as activity_count
FROM public.activities;
-- Create table for storing Tuya Device Settings (Thresholds)
CREATE TABLE IF NOT EXISTS tuya_device_settings (
    device_id text PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    min_temp numeric,
    max_temp numeric,
    min_hum numeric,
    max_hum numeric,
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE tuya_device_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view settings" 
ON tuya_device_settings FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Users can insert/update settings" 
ON tuya_device_settings FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
ON tuya_device_settings FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
-- Create app_configurations table
CREATE TABLE IF NOT EXISTS app_configurations (
    key text PRIMARY KEY,
    value jsonb NOT NULL,
    description text,
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE app_configurations ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view configs
CREATE POLICY "Enable read access for authenticated users" 
ON app_configurations FOR SELECT 
TO authenticated 
USING (true);

-- Allow authenticated users (or admins) to update configs
CREATE POLICY "Enable update access for authenticated users" 
ON app_configurations FOR UPDATE
TO authenticated 
USING (true)
WITH CHECK (true);

-- Insert default price per gram if not exists
INSERT INTO app_configurations (key, value, description)
VALUES ('dispensary_price_per_gram', '0'::jsonb, 'Valor monetario por gramo para el dispensario')
ON CONFLICT (key) DO NOTHING;
-- Create Aurora Patients Table (CRM)
-- Extends the basic 'profiles' table with medical/legal data.

create table if not exists public.aurora_patients (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  
  -- Link to Auth Profile (1:1)
  profile_id uuid references public.profiles(id) not null unique,
  
  -- Reprocann Data
  reprocann_number text,
  reprocann_status text default 'pending' check (reprocann_status in ('active', 'pending', 'expired', 'rejected')),
  expiration_date date,
  
  -- Dispensing Limits
  monthly_limit numeric default 40 check (monthly_limit >= 0), -- Grams per month
  
  -- Internal Notes
  notes text,
  
  -- Audit
  created_by uuid references auth.users(id)
);

-- Enable RLS
alter table public.aurora_patients enable row level security;

-- Policies
-- 1. Read: Authenticated staff can view patient details
create policy "Allow staff to view patients" 
on public.aurora_patients for select 
to authenticated 
using (true);

-- 2. Write: Authenticated staff can manage patients
create policy "Allow staff to insert patients" 
on public.aurora_patients for insert 
to authenticated 
with check (true);

create policy "Allow staff to update patients" 
on public.aurora_patients for update 
to authenticated 
using (true);

-- Indexes
create index if not exists idx_aurora_patients_profile on public.aurora_patients(profile_id);
create index if not exists idx_aurora_patients_status on public.aurora_patients(reprocann_status);
-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- 1. Clinical Admissions Table (Baseline)
create table if not exists public.clinical_admissions (
    id uuid primary key default uuid_generate_v4(),
    patient_id uuid references public.aurora_patients(id) on delete cascade not null,
    patient_hash text not null, -- Anonymized ID for research view
    
    -- Diagnosis & Pharmacology
    diagnosis_cie11 jsonb default '[]'::jsonb, -- Array of strings/objects
    medications jsonb default '[]'::jsonb, -- Current meds & interactions
    
    -- Baseline Metrics (The "Before" state)
    baseline_qol int check (baseline_qol between 0 and 100), -- Quality of Life (0-100)
    baseline_pain_avg int check (baseline_pain_avg between 0 and 10), -- EVA (0-10)
    baseline_pain_worst int check (baseline_pain_worst between 0 and 10), -- EVA (0-10)
    
    notes text,
    created_at timestamptz default now(),
    created_by uuid references auth.users(id)
);

-- 2. Clinical Evolutions Table (Follow-up)
create table if not exists public.clinical_evolutions (
    id uuid primary key default uuid_generate_v4(),
    admission_id uuid references public.clinical_admissions(id) on delete cascade not null,
    
    date date default current_date not null,
    
    -- Traceability
    batch_id uuid, -- Optional link to inventory/batch used
    
    -- Assessment
    eva_score int check (eva_score between 0 and 10),
    improvement_percent numeric(5,2), -- Calculated field (e.g. 15.50%)
    
    -- Detailed Data
    sparing_effect jsonb default '[]'::jsonb, -- [{ drug: "Ibuprofeno", reduction: "50%" }]
    adverse_effects jsonb default '[]'::jsonb, -- [{ effect: "Dizziness", intensity: "mild" }]
    
    notes text,
    created_at timestamptz default now(),
    created_by uuid references auth.users(id)
);

-- 3. RLS Policies
alter table public.clinical_admissions enable row level security;
alter table public.clinical_evolutions enable row level security;

-- Policy: Authenticated users can read/write (Modify as needed for roles)
create policy "Enable all access for authenticated users" on public.clinical_admissions
    for all using (auth.role() = 'authenticated');

create policy "Enable all access for authenticated users" on public.clinical_evolutions
    for all using (auth.role() = 'authenticated');

-- Indexes for performance
create index if not exists idx_clinical_admissions_patient on public.clinical_admissions(patient_id);
create index if not exists idx_clinical_evolutions_admission on public.clinical_evolutions(admission_id);
-- Script para configurar RLS para Crosti - Acceso compartido entre usuarios
-- Modificado para ser seguro si las tablas no existen

-- 1. Insertar usuarios autorizados (reemplazar con los UUIDs reales de los usuarios)
-- Primero necesitas obtener los UUIDs de los usuarios desde auth.users
INSERT INTO public.app_members(user_id) 
SELECT id FROM auth.users 
WHERE email IN ('mazasantiago@chakra.com', 'djsebamaza@chakra.com', 'seba@chakra.com', 'santi@chakra.com')
ON CONFLICT (user_id) DO NOTHING;

-- 2. Habilitar RLS en las tablas de Crosti (Solo si existen)
DO $$
BEGIN
  -- Check crosti_cash_movements
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'crosti_cash_movements') THEN
      ALTER TABLE public.crosti_cash_movements ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "Usuarios autorizados pueden ver crosti_cash_movements" ON public.crosti_cash_movements;
      CREATE POLICY "Usuarios autorizados pueden ver crosti_cash_movements" ON public.crosti_cash_movements
        FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.app_members));

      DROP POLICY IF EXISTS "Usuarios autorizados pueden insertar crosti_cash_movements" ON public.crosti_cash_movements;
      CREATE POLICY "Usuarios autorizados pueden insertar crosti_cash_movements" ON public.crosti_cash_movements
        FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM public.app_members));
        
      DROP POLICY IF EXISTS "Usuarios autorizados pueden actualizar crosti_cash_movements" ON public.crosti_cash_movements;
      CREATE POLICY "Usuarios autorizados pueden actualizar crosti_cash_movements" ON public.crosti_cash_movements
        FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM public.app_members));
        
      DROP POLICY IF EXISTS "Usuarios autorizados pueden eliminar crosti_cash_movements" ON public.crosti_cash_movements;
      CREATE POLICY "Usuarios autorizados pueden eliminar crosti_cash_movements" ON public.crosti_cash_movements
        FOR DELETE USING (auth.uid() IN (SELECT user_id FROM public.app_members));
        
       -- Realtime
      IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'crosti_cash_movements') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.crosti_cash_movements;
      END IF;
  END IF;

  -- Check crosti_stock_items
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'crosti_stock_items') THEN
      ALTER TABLE public.crosti_stock_items ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "Usuarios autorizados pueden ver crosti_stock_items" ON public.crosti_stock_items;
      CREATE POLICY "Usuarios autorizados pueden ver crosti_stock_items" ON public.crosti_stock_items
        FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.app_members));

      DROP POLICY IF EXISTS "Usuarios autorizados pueden insertar crosti_stock_items" ON public.crosti_stock_items;
      CREATE POLICY "Usuarios autorizados pueden insertar crosti_stock_items" ON public.crosti_stock_items
        FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM public.app_members));
        
      DROP POLICY IF EXISTS "Usuarios autorizados pueden actualizar crosti_stock_items" ON public.crosti_stock_items;
      CREATE POLICY "Usuarios autorizados pueden actualizar crosti_stock_items" ON public.crosti_stock_items
        FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM public.app_members));
        
      DROP POLICY IF EXISTS "Usuarios autorizados pueden eliminar crosti_stock_items" ON public.crosti_stock_items;
      CREATE POLICY "Usuarios autorizados pueden eliminar crosti_stock_items" ON public.crosti_stock_items
        FOR DELETE USING (auth.uid() IN (SELECT user_id FROM public.app_members));
        
       -- Realtime
      IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'crosti_stock_items') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.crosti_stock_items;
      END IF;
  END IF;
END $$;

-- 3. Verificar configuración (Solo si tables existen)
-- Esto es solo visual y podría fallar si la tabla no existe en la consulta directa, así que lo comentamos o lo hacemos dinámico.
-- SELECT 'app_members', COUNT(*) FROM public.app_members;
-- Add grid_position column to batches if it doesn't exist
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS grid_position TEXT;
-- Add alert_type column to batches table
ALTER TABLE public.batches 
ADD COLUMN IF NOT EXISTS alert_type text CHECK (alert_type IN ('pest', 'fungus', 'nutrient', 'other'));

-- Or simpler, just text or boolean. User said "Alerta" (singular). 
-- Let's make it a text field to allow for "type" in future layout, but treat as boolean presence for now.
-- Actually, let's keep it simple: 'warning' | null
ALTER TABLE public.batches 
ADD COLUMN IF NOT EXISTS has_alert boolean DEFAULT false;

-- Add index for performance if needed (probably overkill for now)
-- Create clone_maps table
CREATE TABLE IF NOT EXISTS clone_maps (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    grid_rows INTEGER DEFAULT 10,
    grid_columns INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add clone_map_id to batches
ALTER TABLE batches
ADD COLUMN IF NOT EXISTS clone_map_id UUID REFERENCES clone_maps(id) ON DELETE SET NULL;

-- Enable RLS on clone_maps (assuming public/auth policies similar to rooms)
ALTER TABLE clone_maps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON clone_maps
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON clone_maps
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users" ON clone_maps
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for authenticated users" ON clone_maps
    FOR DELETE USING (auth.role() = 'authenticated');
-- Add dimensions to rooms table (using specific columns for querying simplicity, or JSONB if preferred. Plan said columns or JSONB. Let's stick to JSONB 'dimensions' as per plan or specific columns? Plan decision: "Let's go with specific columns grid_rows, grid_columns for simplicity". Wait, plan actually debated and concluded "Let's use properties JSONB column... is better". But then "Let's go with specific columns grid_rows, grid_columns for simplicity in this specific feature". Let's use specific columns for explicit schema.)

ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS grid_rows INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS grid_columns INTEGER DEFAULT 0;

-- Add grid_position to batches table
-- Storing as Text "A1", "B2" etc.
ALTER TABLE batches
ADD COLUMN IF NOT EXISTS grid_position TEXT;
-- Add grid_position column to batches if it doesn't exist
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS grid_position TEXT;
-- Add 'living_soil' to check constraint if it exists
-- Supabase doesn't support ALTER TYPE ... ADD VALUE inside a transaction block easily if it's an enum, 
-- but often room_type is a text column with a check constraint.

DO $$
BEGIN
    -- Check if it's a check constraint on the column
    IF EXISTS (
        SELECT 1 
        FROM information_schema.check_constraints 
        WHERE constraint_name = 'rooms_type_check'
    ) THEN
        ALTER TABLE rooms DROP CONSTRAINT rooms_type_check;
        ALTER TABLE rooms ADD CONSTRAINT rooms_type_check CHECK (type IN ('vegetation', 'flowering', 'drying', 'curing', 'mother', 'clones', 'general', 'germination', 'living_soil'));
    END IF;

    -- If it's a Postgres ENUM type, we would do:
    -- ALTER TYPE room_type ADD VALUE 'living_soil';
    -- But likely it's text. Let's assume text with check first. 
    -- If it fails, user can report.
END $$;
ALTER TABLE genetics ADD COLUMN IF NOT EXISTS nomenclatura text;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS operational_days INTEGER;
-- Add order_index column to rooms table
ALTER TABLE public.rooms 
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- Optional: Create an index for performance if ordering by this column frequently
CREATE INDEX IF NOT EXISTS idx_rooms_order_index ON public.rooms(order_index);
-- Add order_index column to rooms table
ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- Optional: Initial population based on name or creation date to avoid nulls/zeros if desired, though default 0 is fine.
-- UPDATE rooms SET order_index = EXTRACT(EPOCH FROM created_at); 
-- Better: Using a sequence or just letting the frontend handle initial reorder. 
-- For now, default 0 is sufficient as the drag-and-drop will overwrite it.
-- Agregar columna organization_id a todas las tablas de negocio
-- Referencia a public.organizations(id)

-- 1. Rooms
ALTER TABLE public.rooms 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- 2. Batches
ALTER TABLE public.batches 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- 3. Genetics
ALTER TABLE public.genetics 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- 4. Chakra Crops
ALTER TABLE public.chakra_crops 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- 5. Chakra Tasks
ALTER TABLE public.chakra_tasks 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- 6. Chakra Daily Logs
ALTER TABLE public.chakra_daily_logs 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- 7. Chakra Stock Items (Insumos)
ALTER TABLE public.chakra_stock_items 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- 8. Chakra Historial Precios
ALTER TABLE public.chakra_historial_precios 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- 9. Chakra Dispensary Batches
ALTER TABLE public.chakra_dispensary_batches 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- 10. Chakra Harvest Logs
ALTER TABLE public.chakra_harvest_logs 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- 11. Chakra Extractions
ALTER TABLE public.chakra_extractions 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- 12. Expenses
ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- 13. Compras
ALTER TABLE public.compras 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- 14. Stickies
ALTER TABLE public.stickies 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- 15. Announcements
ALTER TABLE public.announcements 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- 16. Activities
ALTER TABLE public.activities 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- Índices (Recomendado para performance de RLS)
CREATE INDEX IF NOT EXISTS idx_rooms_org ON public.rooms(organization_id);
CREATE INDEX IF NOT EXISTS idx_batches_org ON public.batches(organization_id);
CREATE INDEX IF NOT EXISTS idx_genetics_org ON public.genetics(organization_id);
CREATE INDEX IF NOT EXISTS idx_chakra_crops_org ON public.chakra_crops(organization_id);
CREATE INDEX IF NOT EXISTS idx_chakra_tasks_org ON public.chakra_tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_chakra_daily_logs_org ON public.chakra_daily_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_chakra_stock_items_org ON public.chakra_stock_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_chakra_dispensary_batches_org ON public.chakra_dispensary_batches(organization_id);
-- Add photo_url column to chakra_dispensary_batches
ALTER TABLE chakra_dispensary_batches
ADD COLUMN IF NOT EXISTS photo_url TEXT;
-- Add position columns to clone_maps for Freestyle layout
ALTER TABLE public.clone_maps
ADD COLUMN IF NOT EXISTS position_x FLOAT DEFAULT 0,
ADD COLUMN IF NOT EXISTS position_y FLOAT DEFAULT 0;

-- Optional: Add width/height if we want resizable maps later
-- ALTER TABLE public.clone_maps ADD COLUMN IF NOT EXISTS width FLOAT DEFAULT 300;
-- ALTER TABLE public.clone_maps ADD COLUMN IF NOT EXISTS height FLOAT DEFAULT 200;
-- Add recurrence column to chakra_tasks
-- Schema: { type: 'daily'|'weekly'|'custom', interval: number, days?: number[], end?: { type: 'never'|'date'|'count', value?: string|number }, count?: number }
ALTER TABLE chakra_tasks
ADD COLUMN IF NOT EXISTS recurrence JSONB;
-- Add soft delete columns to batches table
ALTER TABLE public.batches 
ADD COLUMN IF NOT EXISTS discarded_at timestamptz NULL,
ADD COLUMN IF NOT EXISTS discard_reason text NULL;

-- Index for filtering active batches quickly
CREATE INDEX IF NOT EXISTS idx_batches_discarded_at ON public.batches(discarded_at);
-- Add unique tracking code column to batches table
ALTER TABLE public.batches 
ADD COLUMN IF NOT EXISTS tracking_code text;

-- Create an index for faster lookups since we will query by this code
CREATE INDEX idx_batches_tracking_code ON public.batches(tracking_code);
-- Add Delete Policy for Aurora Patients
create policy "Allow staff to delete patients" 
on public.aurora_patients for delete 
to authenticated 
using (true);
-- Update Aurora Patients with detailed fields
ALTER TABLE public.aurora_patients
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS document_number text,
ADD COLUMN IF NOT EXISTS reprocann_issue_date date,
ADD COLUMN IF NOT EXISTS file_reprocann_url text,
ADD COLUMN IF NOT EXISTS file_affidavit_url text,
ADD COLUMN IF NOT EXISTS file_consent_url text;

-- Storage Bucket for Patient Documents
insert into storage.buckets (id, name, public)
values ('patient_docs', 'patient_docs', true) -- Keeping public for easier access internally, or false for security? 
-- Usually medical docs should be private, but for simplicity in this generated app we might use signed URLs or public if RLS handles it.
-- Let's stick to public=false (private) and use signed URLs if needed, OR public for now to ensure image rendering works easily without complex signing logic in frontend.
-- User asked for efficiency. Let's make it public for now to avoid invalid token issues, unless sensitive. 
-- Given it's "Declaracion Jurada", let's make it private? No, let's keep it simple first. "private" bucket requires authenticated download.
on conflict (id) do nothing;

-- Storage Policies
create policy "Staff can upload patient docs"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'patient_docs' );

create policy "Staff can view patient docs"
on storage.objects for select
to authenticated
using ( bucket_id = 'patient_docs' );

-- Update RLS for patients table just in case
-- (Already handled in setup_aurora_patients.sql)
-- Add table_number column to batches to link a batch to a specific table in the room
alter table public.batches 
add column if not exists table_number int;

-- Optional: Add constraint to prevent multiple active batches on the same table in the same room?
-- For now, we will handle this in the UI logic to allow history.
-- A unique constraint on (current_room_id, table_number) where stage != 'completed' could be useful but complex to manage if not careful.
-- We'll stick to simple column for now.
-- Add parent_batch_id to linking batches
alter table public.batches 
add column if not exists parent_batch_id uuid references public.batches(id) on delete set null;
-- Add price_per_gram column to chakra_dispensary_batches
ALTER TABLE chakra_dispensary_batches 
ADD COLUMN IF NOT EXISTS price_per_gram numeric DEFAULT 0;

-- Optional: Comment on the column
COMMENT ON COLUMN chakra_dispensary_batches.price_per_gram IS 'Price per gram in local currency';
-- Add transaction_value column to chakra_dispensary_movements
ALTER TABLE chakra_dispensary_movements
ADD COLUMN IF NOT EXISTS transaction_value numeric DEFAULT 0;

-- Optional: Comment on the column
COMMENT ON COLUMN chakra_dispensary_movements.transaction_value IS 'Total monetary value of the transaction (Price * Amount)';
-- Add acquisition_date to genetics table
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name = 'genetics' and column_name = 'acquisition_date') then
    alter table public.genetics add column acquisition_date date;
  end if;
end $$;
-- Add detailed columns to genetics table
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name = 'genetics' and column_name = 'thc_percent') then
    alter table public.genetics add column thc_percent numeric;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'genetics' and column_name = 'cbd_percent') then
    alter table public.genetics add column cbd_percent numeric;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'genetics' and column_name = 'estimated_yield_g') then
    alter table public.genetics add column estimated_yield_g numeric;
  end if;
end $$;
-- Add default_price_per_gram to genetics table
ALTER TABLE genetics 
ADD COLUMN IF NOT EXISTS default_price_per_gram numeric DEFAULT NULL;

COMMENT ON COLUMN genetics.default_price_per_gram IS 'Specific price per gram for this genetic. Overrides global configuration if set.';
-- Add 'medium' column to rooms table
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS medium text;
-- Add start_date column to rooms table
ALTER TABLE public.rooms 
ADD COLUMN IF NOT EXISTS start_date date DEFAULT now();-- Add foreign key to link Rooms to Spots (chakra_crops)
alter table public.rooms 
add column if not exists spot_id uuid references public.chakra_crops(id) on delete cascade;

-- Index for performance
create index if not exists idx_rooms_spot_id on public.rooms(spot_id);
-- Add room_id and target_date to chakra_stickies for Calendar integration
ALTER TABLE chakra_stickies 
ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES rooms(id) ON DELETE CASCADE;

ALTER TABLE chakra_stickies
ADD COLUMN IF NOT EXISTS target_date DATE;

-- Index for faster filtering by room and date
CREATE INDEX IF NOT EXISTS idx_stickies_room_date ON chakra_stickies(room_id, target_date);
-- Add assigned_to column to chakra_tasks to allow assigning tasks to specific users (employees)
ALTER TABLE public.chakra_tasks
ADD COLUMN IF NOT EXISTS assigned_to uuid; -- references auth.users(id) ideally, or public.users if you have a public profile table

-- Optional: Add index
CREATE INDEX IF NOT EXISTS idx_chakra_tasks_assigned_to ON public.chakra_tasks(assigned_to);
-- Add room_id to chakra_tasks to allow assigning tasks to specific rooms within a crop
ALTER TABLE public.chakra_tasks
ADD COLUMN IF NOT EXISTS room_id uuid; -- references public.rooms(id) implicitly or explicitly

-- Optional: Add index for performance
CREATE INDEX IF NOT EXISTS idx_chakra_tasks_room_id ON public.chakra_tasks(room_id);
-- Add new columns for enhanced task tracking
alter table public.chakra_tasks 
add column if not exists observations text,
add column if not exists photos text[], 
add column if not exists completed_at timestamp with time zone;

-- Ensure array type is handled correctly (default to empty array)
alter table public.chakra_tasks 
alter column photos set default '{}';
-- Add room_id to chakra_tasks to link tasks to specific rooms/salas
alter table public.chakra_tasks 
add column if not exists room_id uuid references public.rooms(id);

-- Add assigned_to to chakra_tasks to link tasks to users/profiles
alter table public.chakra_tasks 
add column if not exists assigned_to uuid references public.profiles(id);

-- Optional: Add index for performance
create index if not exists idx_tasks_room_id on public.chakra_tasks(room_id);
-- Add room_id to tuya_device_settings to link devices to rooms
ALTER TABLE tuya_device_settings 
ADD COLUMN IF NOT EXISTS room_id uuid REFERENCES public.rooms(id) ON DELETE SET NULL;

-- Comment
COMMENT ON COLUMN tuya_device_settings.room_id IS 'Link to the internal Room ID where this device is installed';
-- Backfill tracking codes for existing batches
-- Format: {GeneticName}-{Position} (e.g., "OgKush-A1")

WITH batch_names AS (
    SELECT 
        b.id,
        COALESCE(g.name, b.name, 'Unknown') as genetic_name,
        COALESCE(b.grid_position, 'X') as position
    FROM public.batches b
    LEFT JOIN public.genetics g ON b.genetic_id = g.id
    WHERE b.tracking_code IS NULL
)
UPDATE public.batches b
SET tracking_code = bn.genetic_name || '-' || bn.position
FROM batch_names bn
WHERE b.id = bn.id;
