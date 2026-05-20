import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as base64 from "https://deno.land/std@0.208.0/encoding/base64.ts";

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

    const { action, token, organizationId, email, password, patientData, signatureBase64 } = await req.json()

    let targetEmail = email;
    let targetOrgId = organizationId;

    if (action === 'validate' || action === 'submit') {
      if (!token) {
        throw new Error('Token de invitación no proporcionado')
      }

      // 1. Validar Token de Invitación
      const { data: inv, error: invError } = await supabaseClient
        .from('patient_invitations')
        .select(`
                  *,
                  organizations ( name )
              `)
        .eq('id', token)
        .single()

      if (invError || !inv) {
        throw new Error('La invitación no existe o es inválida.')
      }

      if (inv.status !== 'pending') {
        throw new Error('Esta invitación ya ha sido utilizada o cancelada.')
      }

      if (new Date(inv.expires_at) < new Date()) {
        await supabaseClient.from('patient_invitations').update({ status: 'expired' }).eq('id', token)
        throw new Error('El enlace de invitación ha expirado.')
      }

      targetEmail = inv.email;
      targetOrgId = inv.organization_id;

      // Si la acción es solo validar, retornamos la info
      if (action === 'validate') {
        return new Response(
          JSON.stringify({
            valid: true,
            invitation: {
              email: inv.email,
              organization_name: inv.organizations.name,
              organization_id: inv.organization_id
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Si la acción es Enviar (Submit) o Aplicar (Apply), procesamos alta completa
    if (action === 'submit' || action === 'apply') {
      // Validaciones
      if (!targetEmail) throw new Error('Email es requerido.')
      if (!targetOrgId) throw new Error('ID de organización es requerido.')
      if (!password || password.length < 6) throw new Error('Contraseña demasiado corta.')
      if (!patientData?.fullName || !patientData?.documentNumber) throw new Error('Faltan datos personales requeridos.')



      // 2. Crear cuenta Auth (o recuperarla)
      // Asumimos que el email no está registrado (porque lo invitó la app). Si está registrado, unimos.
      const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
        email: targetEmail,
        password: password,
        email_confirm: true,
        user_metadata: {
          name: patientData.fullName,
          role: 'member'
        }
      })

      let finalUserId = null;

      if (authError) {
        if (authError.message.includes('already been registered')) {
          // Recuperar usuario existente por email iterando (bypassing profile.email=null bug)
          let page = 1;
          let found = false;
          while (!found) {
            const { data: usersData } = await supabaseClient.auth.admin.listUsers({ page, perPage: 1000 });
            if (!usersData || !usersData.users || usersData.users.length === 0) break;

            const match = usersData.users.find((u: any) => u.email?.toLowerCase() === targetEmail.toLowerCase());
            if (match) {
              finalUserId = match.id;
              found = true;
              break;
            }
            page++;
          }

          if (!finalUserId) {
            throw new Error('Error al recuperar cuenta existente para este email.')
          }
        } else {
          throw authError
        }
      } else {
        finalUserId = authData.user.id
      }

      // 3. Procesar y subir firma
      let signatureUrl = null;
      if (signatureBase64 && signatureBase64.startsWith('data:image')) {
        // Separar cabecera de datos en base64
        const base64Data = signatureBase64.replace(/^data:image\/\w+;base64,/, '');
        const buffer = base64.decodeBase64(base64Data);
        const fileName = `${finalUserId}_signature_${Date.now()}.png`;

        const { data: uploadData, error: uploadError } = await supabaseClient
          .storage
          .from('signatures')
          .upload(fileName, buffer, {
            contentType: 'image/png',
            upsert: true
          });

        if (uploadError) {
          console.error("Error upload firm: ", uploadError);
          // Continuamos de igual forma, la firma no bloquea el alta crítica.
        } else if (uploadData) {
          const { data: publicUrlData } = supabaseClient.storage.from('signatures').getPublicUrl(uploadData.path);
          signatureUrl = publicUrlData.publicUrl;
        }
      }

      // 4. Actualizar perfil manualmente (por si el trigger falló)
      await supabaseClient.from('profiles').update({
        full_name: patientData.fullName,
        document_number: patientData.documentNumber,
        phone_mobile: patientData.phone,
        email: targetEmail, // Forzamos esto por el bug detectado antes
        professional_signature_url: signatureUrl
      }).eq('id', finalUserId)

      // 5. Insertar en aurora_patients (Como "Pendiente de Aprobacion")
      const { error: patientError } = await supabaseClient.from('aurora_patients').insert({
        profile_id: finalUserId,
        organization_id: targetOrgId, // Usamos la de la invitación o la proveída
        document_number: patientData.documentNumber,
        reprocann_number: patientData.reprocannNumber || null,
        reprocann_status: patientData.reprocannStatus || 'pending',
        notes: `Patología: ${patientData.pathology || 'No especificada'}. Alta por ${action === 'apply' ? 'solicitud web' : 'invitación'}.`,
        is_approved_by_org: false // El Admin debe aprobarlo luego
      })

      if (patientError) {
        // Si es un error de duplicado (ya está en la organización) no pasa nada
        if (!patientError.message.includes('duplicate key')) {
          throw patientError;
        }
      }

      // 5b. Insertar en organization_members (requerido para que el OrganizationContext lo reconozca)
      const { error: memberError } = await supabaseClient.from('organization_members').insert({
        user_id: finalUserId,
        organization_id: targetOrgId,
        role: 'member'
      })

      if (memberError) {
        if (!memberError.message.includes('duplicate key')) {
          console.error("Error inserting organization_members:", memberError);
        }
      }

      // 5c. (organization binding is handled entirely by organization_members)

      // 6. Marcar invitación como usada si corresponde
      if (action === 'submit' && token) {
        await supabaseClient.from('patient_invitations').update({ status: 'used' }).eq('id', token)
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Onboarding completado exitosamente.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    throw new Error('Invalid action')

  } catch (error: any) {
    console.error(error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
