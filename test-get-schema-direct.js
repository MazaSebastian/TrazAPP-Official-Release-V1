require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);
// Since RLS blocks us, let's just make the script we know we need
// from Insumo interface:
// id, nombre, categoria, unidad_medida, precio_actual, precio_anterior, proveedor, 
// fecha_ultima_compra, fecha_ultimo_precio, stock_actual, stock_minimo, notas, activo, 
// created_at, updated_at, created_by, updated_by
