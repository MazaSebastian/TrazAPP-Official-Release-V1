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
