-- Añadir columna custom_domain para el modelo 100% White-Label
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS custom_domain text UNIQUE;

-- Asegurar que los perfiles tengan acceso de lectura a la nueva columna
-- (Esto asume que el RLS existente ya permite la lectura pública de las organizaciones,
-- de lo contrario, se debería agregar una política para permitir buscar por dominio).

COMMENT ON COLUMN public.organizations.custom_domain IS 'Dominio personalizado para alojar el ecosistema del club 100% White-Label';
