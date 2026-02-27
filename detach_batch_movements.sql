-- =========================================================================================
-- Desvincular rastros de auditoría (Audit Trails) faltantes para permitir el borrado de usuarios
-- =========================================================================================

-- 1. batch_movements (Movimientos de Lotes en Salas)
ALTER TABLE public.batch_movements DROP CONSTRAINT IF EXISTS batch_movements_created_by_fkey;
ALTER TABLE public.batch_movements ADD CONSTRAINT batch_movements_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
