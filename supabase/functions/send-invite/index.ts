import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from "npm:resend@2.0.0"

// Configuración CORS estricta para llamadas seguras desde web
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Manejar el preflight request (CORS handshake)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log(`[send-invite] Request received: ${req.method}`)

  try {
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

    // Extraer datos del payload enviado por React UI
    const { email, inviteLink, orgName } = await req.json()

    // Validar parámetros obligatorios
    if (!email || !inviteLink || !orgName) {
      throw new Error('Missing required fields: email, inviteLink, or orgName.')
    }

    const { data, error } = await resend.emails.send({
      // Usando el dominio oficial verificado en Resend
      from: 'TrazAPP <info@trazapp.ar>',
      to: [email],
      subject: `Has sido invitado a unirte a ${orgName} en TrazAPP`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a; padding: 40px 20px; color: #f8fafc; text-align: center;">
          <div style="max-width: 500px; margin: 0 auto; background-color: #1e293b; padding: 40px; border-radius: 12px; border: 1px solid #334155; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);">
            
            <h1 style="color: #4ade80; margin-bottom: 20px; font-size: 24px;">¡Bienvenido a TrazAPP!</h1>
            
            <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
              Has sido invitado para unirte y participar en la organización <strong style="color: #f8fafc;">${orgName}</strong>. 
            </p>
            
            <p style="color: #cbd5e1; font-size: 16px; margin-bottom: 30px;">
              TrazAPP es tu sistema de gestión integral de cultivos y preservación genética.
            </p>
            
            <a href="${inviteLink}" style="display: inline-block; background-color: #4ade80; color: #022c22; padding: 14px 28px; border-radius: 8px; font-weight: bold; text-decoration: none; font-size: 16px; margin-bottom: 30px; transition: background-color 0.2s;">
              Comenzar Registro
            </a>
            
            <hr style="border-color: #334155; margin-bottom: 20px; opacity: 0.5;" />
            <p style="color: #64748b; font-size: 12px;">
              Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:<br>
              <span style="color: #94a3b8; display: block; margin-top: 10px; word-break: break-all;">${inviteLink}</span>
            </p>
          </div>
          <p style="color: #475569; font-size: 12px; margin-top: 30px;">
            © ${new Date().getFullYear()} Aurora Del Plata / TrazAPP. Todos los derechos reservados.
          </p>
        </div>
      `,
    })

    if (error) {
      return new Response(JSON.stringify({ error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
