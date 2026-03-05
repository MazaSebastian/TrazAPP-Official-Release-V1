-- Agregar columna map_id a chakra_tasks para vincular tareas con mesas/mapas específicos
ALTER TABLE public.chakra_tasks 
ADD COLUMN IF NOT EXISTS map_id uuid REFERENCES public.clone_maps(id) ON DELETE SET NULL;

-- Crear un índice para optimizar las consultas por map_id
CREATE INDEX IF NOT EXISTS idx_chakra_tasks_map_id ON public.chakra_tasks(map_id);
