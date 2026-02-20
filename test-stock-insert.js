require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);
async function test() {
  const newInsumo = {
        nombre: 'test',
        categoria: 'semillas',
        unidad_medida: 'u',
        precio_actual: 1,
        proveedor: 'test',
        fecha_ultimo_precio: new Date().toISOString().split('T')[0],
        stock_actual: 1,
        stock_minimo: 1,
        notas: 'test',
        activo: true,
        organization_id: '00000000-0000-0000-0000-000000000000'
      };
  const { error } = await supabase.from('chakra_stock_items').insert([newInsumo]).select();
  console.log(error);
}
test();
