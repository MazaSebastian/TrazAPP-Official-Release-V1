-- Agrega la columna photo_url a la tabla genetics para soportar la subida de fotos del producto (madre)
ALTER TABLE genetics ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- (Opcional) Crea el storage bucket "genetic_photos" si no existe
INSERT INTO storage.buckets (id, name, public) 
VALUES ('genetic_photos', 'genetic_photos', true)
ON CONFLICT (id) DO NOTHING;

-- Configuracion de politicas para el bucket 'genetic_photos'
-- Politica de lectura publica
CREATE POLICY "Imagenes publicas" ON storage.objects FOR SELECT 
USING (bucket_id = 'genetic_photos');

-- Politica de insercion/modificacion para usuarios autenticados
CREATE POLICY "Subida autenticada" ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'genetic_photos' AND auth.role() = 'authenticated');

CREATE POLICY "Act/Borrado autenticado" ON storage.objects FOR UPDATE 
USING (bucket_id = 'genetic_photos' AND auth.role() = 'authenticated');

CREATE POLICY "Borrado autenticado" ON storage.objects FOR DELETE 
USING (bucket_id = 'genetic_photos' AND auth.role() = 'authenticated');
