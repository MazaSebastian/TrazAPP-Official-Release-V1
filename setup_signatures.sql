-- Create a public bucket for professional signatures
insert into storage.buckets (id, name, public) 
values ('signatures', 'signatures', true)
on conflict (id) do nothing;

-- Add RLS policies for the signatures bucket
create policy "Signatures are publicly accessible" 
on storage.objects for select 
using ( bucket_id = 'signatures' );

create policy "Users can upload their own signatures"
on storage.objects for insert
with check ( bucket_id = 'signatures' and auth.uid() = owner );

create policy "Users can update their own signatures"
on storage.objects for update
using ( bucket_id = 'signatures' and auth.uid() = owner );

create policy "Users can delete their own signatures"
on storage.objects for delete
using ( bucket_id = 'signatures' and auth.uid() = owner );

-- Add the column to the profiles table
alter table public.profiles
add column if not exists professional_signature_url text;
