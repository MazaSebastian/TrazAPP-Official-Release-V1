import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: any) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verificamos al atacante o enviador (debe ser un admin autenticado)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No authorization header')

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''))
    if (userError || !user) throw new Error('Unauthorized')

    const { email, organization_id } = await req.json()

    if (!email || !organization_id) {
      throw new Error('Faltan parametros email o organization_id')
    }

    // Verificamos que el usuario pertenezca a la organización
    const { data: member, error: memberError } = await supabaseClient
      .from('organization_members')
      .select('*')
      .eq('user_id', user.id)
      .eq('organization_id', organization_id)
      .single()

    if (memberError || !member) {
      throw new Error('No tienes acceso a esta organizacion')
    }

    // Generamos expiración en 48 horas
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);

    // Insertamos invitación segura
    const { data: inv, error: invError } = await supabaseClient
      .from('patient_invitations')
      .insert({
        organization_id: organization_id,
        email: email.toLowerCase(),
        status: 'pending',
        created_by: user.id,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single()

    if (invError || !inv) {
      throw new Error('Error al generar la invitacion: ' + invError?.message)
    }

    // Devolvemos el link token al cliente para que lo copie o comparta
    return new Response(
      JSON.stringify({
        success: true,
        token: inv.id,
        link: `${req.headers.get('origin') || 'https://trazapp.com'}/invite/${inv.id}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error("Error generate invite:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
