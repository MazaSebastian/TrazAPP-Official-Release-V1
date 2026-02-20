-- Create table for Price History (Historial Precios)
-- Referenced by insumosService.ts

create table if not exists public.chakra_historial_precios (
  id uuid default gen_random_uuid() primary key,
  insumo_id uuid references public.chakra_stock_items(id) on delete cascade,
  precio numeric not null,
  fecha_cambio timestamp with time zone default timezone('utc'::text, now()) not null,
  motivo_cambio text,
  proveedor text,
  cantidad_comprada numeric,
  costo_total numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references auth.users(id)
);

-- Enable RLS
alter table public.chakra_historial_precios enable row level security;

-- Policies
create policy "Enable read access for all users" on public.chakra_historial_precios for select using (true);
create policy "Enable insert for authenticated users" on public.chakra_historial_precios for insert with check (true);
create policy "Enable update for authenticated users" on public.chakra_historial_precios for update using (true);
create policy "Enable delete for authenticated users" on public.chakra_historial_precios for delete using (true);

-- Realtime
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.chakra_historial_precios;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
END $$;
