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
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        // Validar header JWT si quisiéramos asegurarnos que solo un admin llama esto
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error('No authorization header')
        }

        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
        if (userError || !user) throw new Error('Unauthorized user')

        // Fetch user data
        const body = await req.json()
        const { patients, organization_id } = body;

        if (!patients || !Array.isArray(patients) || !organization_id) {
            throw new Error("Missing patients array or organization_id");
        }

        let importedCount = 0;
        let errors = [];

        // Batch processing iteration
        for (const p of patients) {
            try {
                let profileId = p.duplicateTargetId;
                let userCreated = false;

                // Si NO es duplicado reconocido, intentamos crear Auth User
                if (!profileId) {
                    const tempPassword = "TempPassword123!"; // Default Password
                    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
                        email: p.email,
                        password: tempPassword,
                        email_confirm: true, // Auto-confirm to avoid sending spam emails
                        user_metadata: {
                            name: p.fullName,
                            role: 'member'
                        }
                    });

                    if (authError) {
                        // El paciente pudo haber sido borrado de TrazAPP (se borra aurora_patients pero NO su cuenta Auth/Profile)
                        // El trigger de base de datos a veces no copia el email a profiles.email (es NULL).
                        // Para ser 100% resilientes, buscamos al usuario directamente en la fuente real: auth.users
                        let profileIdFound = null;
                        let page = 1;
                        let found = false;

                        while (!found) {
                            const { data: usersData, error: listError } = await supabaseClient.auth.admin.listUsers({ page, perPage: 1000 });
                            if (listError || !usersData || !usersData.users || usersData.users.length === 0) {
                                break;
                            }

                            const match = usersData.users.find(u => u.email?.toLowerCase() === p.email.toLowerCase());
                            if (match) {
                                profileIdFound = match.id;
                                found = true;
                                break;
                            }
                            page++;
                        }

                        if (profileIdFound) {
                            profileId = profileIdFound;
                            userCreated = false;
                        } else {
                            throw authError; // Definitivamente no se pudo encontrar
                        }
                    } else {
                        profileId = authData.user.id;
                        userCreated = true;
                    }
                } else {
                    // Es un duplicado existente (actualizamos paciente, tal vez tb perfil si hiciera falta)
                    // Por simplicidad de este importador masivo, dejaremos el nombre del perfil intacto 
                    // y nos centraremos en el registro AuroraPatients.
                }

                if (!profileId) throw new Error("No profileId resolved");

                let patientError;

                if (p.duplicateTargetId) {
                    // Update existing
                    const { error } = await supabaseClient
                        .from('aurora_patients')
                        .update({
                            reprocann_number: p.reprocannNumber,
                            reprocann_status: p.status || 'pending',
                            reprocann_issue_date: p.issueDate || null,
                            expiration_date: p.expirationDate || null,
                            document_number: p.documentNumber,
                            date_of_birth: p.dateOfBirth || null,
                            pathology: p.pathology,
                            phone: p.phone,
                            address: p.address,
                            notes: p.notes,
                            monthly_limit: p.monthlyLimit || 40,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', p.duplicateTargetId);
                    patientError = error;
                } else {
                    // Insert new or update if existing to bypass aurora_patients_profile_id_key constraint
                    // (e.g. if the Excel contains duplicates of the same person, or frontend cache missed it)
                    const { error } = await supabaseClient
                        .from('aurora_patients')
                        .upsert({
                            profile_id: profileId,
                            organization_id: organization_id,
                            reprocann_number: p.reprocannNumber,
                            reprocann_status: p.status || 'pending',
                            reprocann_issue_date: p.issueDate || null,
                            expiration_date: p.expirationDate || null,
                            document_number: p.documentNumber,
                            date_of_birth: p.dateOfBirth || null,
                            pathology: p.pathology,
                            phone: p.phone,
                            address: p.address,
                            notes: p.notes,
                            monthly_limit: p.monthlyLimit || 40,
                            updated_at: new Date().toISOString()
                        }, { onConflict: 'profile_id' });
                    patientError = error;
                }

                if (patientError) {
                    throw patientError;
                }

                importedCount++;

                // Pequeño delay de 50ms para no saturar base de datos
                await new Promise((resolve) => setTimeout(resolve, 50));
            } catch (rowError: any) {
                console.error(`Row Error (${p.email}):`, rowError.message);
                errors.push({ email: p.email, error: rowError.message });
            }
        }

        return new Response(
            JSON.stringify({ success: true, importedCount, errors }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error: any) {
        console.error('Edge Function Error:', error.message)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
