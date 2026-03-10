-- FASE 1: INFRAESTRUCTURA DE AUDIO MEDICO ASINCRONO

-- 1. Crear el Bucket de Storage para guardar los audios
insert into storage.buckets (id, name, public)
values ('ai_clinical_audio', 'ai_clinical_audio', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Politicas de RLS para el Bucket (Solo medicos pueden interactuar)
-- Asegurarse de adaptar los 'check' segun la logica de roles del proyecto.
create policy "Medicos pueden insertar audios"
  on storage.objects for insert
  with check (
    bucket_id = 'ai_clinical_audio' 
    -- and auth.uid() in (select user_id from public.profiles where role = 'medico')
  );

create policy "Medicos pueden leer audios"
  on storage.objects for select
  using (
    bucket_id = 'ai_clinical_audio'
    -- and auth.uid() in (select user_id from public.profiles where role = 'medico')
  );

-- 3. Modificar la tabla clinical_evolutions
ALTER TABLE public.clinical_evolutions
ADD COLUMN IF NOT EXISTS audio_url text,
ADD COLUMN IF NOT EXISTS ai_transcript jsonb;

-- Comentario descriptivo de las columnas
COMMENT ON COLUMN public.clinical_evolutions.audio_url IS 'URL apuntando al archivo .webm grabado de la entrevista clínica';
COMMENT ON COLUMN public.clinical_evolutions.ai_transcript IS 'JSON resultante extraído inteligentemente por Gemini post-transcripción de Deepgram';
