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
