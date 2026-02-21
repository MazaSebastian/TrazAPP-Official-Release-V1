import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Get the JWT from the Authorization header to verify the user calling this
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No Authorization header provided')
    }

    // We create another client with the user's JWT to verify their identity and permissions
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) {
      console.error("Auth Error Object:", userError)
      throw new Error(`Auth Error: ${userError?.message || 'No user found'}`)
    }

    // 2. Parse request body
    const { email, password, name, role, organizationId } = await req.json()
    if (!email || !password || !name || !role || !organizationId) {
      throw new Error('Faltan datos requeridos (email, password, name, role, organizationId)')
    }

    // 3. Verify that the caller is an admin or owner of the organization
    const { data: callerMember, error: callerError } = await userClient
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()

    if (callerError || !callerMember || (callerMember.role !== 'owner' && callerMember.role !== 'admin')) {
      throw new Error('No tienes permisos de Administrador en esta organización')
    }

    // 4. Create the new user using the admin API (Service Role)
    const { data: newUserAuth, error: createError } = await supabaseClient.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        name: name,
        full_name: name,
        role: role
      }
    })

    if (createError) throw createError
    const newUserId = newUserAuth.user.id

    // 5. Create Profile (Service Role to bypass RLS if needed, or RLS should allow insert for own ID, but here we do it on their behalf)
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .upsert({
        id: newUserId,
        email: email,
        full_name: name,
        updated_at: new Date().toISOString()
      })

    if (profileError) console.error("Error creating profile:", profileError)

    // 6. Add to organization_members
    const { error: memberError } = await supabaseClient
      .from('organization_members')
      .insert([{
        organization_id: organizationId,
        user_id: newUserId,
        role: role
      }])

    if (memberError) {
      // Ideally we might rollback user creation here, but for simplicity we log it
      console.error("Error linking user to organization:", memberError)
      throw memberError
    }

    return new Response(JSON.stringify({
      success: true,
      user: { id: newUserId, email }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error("Critical Edge Function Error:", error);
    // Return 200 so the frontend fetch doesn't throw a generic HTTP Error and can read the JSON body
    return new Response(JSON.stringify({
      error: error.message || 'Error desconocido',
      stack: error.stack
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})
