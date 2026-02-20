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
