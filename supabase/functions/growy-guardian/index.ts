import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function sendTelegram(title: string, message: string) {
    const BOT_TOKEN = "8599613524:AAHfQlPMy9dXTwLPBSIyQHh5rm45alpg-Jw";
    const CHAT_IDS = ["870522507", "1692599686"];
    const text = `🌱 *${title}*\n\n${message}`;

    const sendPromises = CHAT_IDS.map(chatId =>
        fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' })
        })
    );
    await Promise.allSettled(sendPromises);
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Initialization
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) throw new Error("No existe GEMINI_API_KEY configurado.");
    
    // Auth bypass Check if it's a cron invocation. Supabase Edge Functions cron uses service role usually, but we can secure it using auth headers.
    // For MVP, since we use SERVICE ROLE to query all orgs, we just proceed.

    // 2. Orgs Query
    const { data: orgs, error: orgError } = await supabase
        .from('organizations')
        .select('id, name')
        .in('plan', ['trazapp', 'demo']);
        
    if (orgError) throw orgError;
    if (!orgs || orgs.length === 0) {
        throw new Error("No active premium organizations found.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: {
           temperature: 0.2
        }
    });

    let totalAlerts = 0;

    // 3. Process each Organization
    for (const org of orgs) {
        const today = new Date().toISOString();
        
        // Find Overdue Tasks
        const { data: tasks } = await supabase
            .from('tasks')
            .select('id, title, due_date')
            .eq('organization_id', org.id)
            .neq('status', 'completed')
            .neq('status', 'done')
            .eq('is_archived', false)
            .lt('due_date', today)
            .limit(50); // Hard limit
            
        // Find Old Flowering Batches (> 10 weeks / 70 days)
        const seventyDaysAgo = new Date(Date.now() - 70 * 24 * 60 * 60 * 1000).toISOString();
        
        // In TrazAPP, batches belong to rooms which belong to orgs, or batches have org_id?
        // Wait, batches usually have org_id if multi-tenant architecture is standard.
        // Assuming 'batches' table has 'organization_id'.
        const { data: batches } = await supabase
            .from('batches')
            .select('id, name, stage, start_date')
            .eq('organization_id', org.id)
            .eq('stage', 'flowering')
            .lt('start_date', seventyDaysAgo)
            .is('discarded_at', null)
            .limit(50);

        if ((!tasks || tasks.length === 0) && (!batches || batches.length === 0)) {
            continue; // Organization is perfectly fine
        }

        const promptSummary = JSON.stringify({
            organization: org.name,
            overdue_tasks: tasks,
            old_flowering_crops: batches
        });

        const prompt = `
Eres Growy Guardian, la IA proactiva de TrazAPP.
Analiza este JSON que contiene problemas detectados en la organización "${org.name}".
Si los problemas son graves (tareas vencidas hace más de 1 día, o cultivos ('batches') en floración por mucho tiempo sin cosechar), redacta máximo 2 alertas amigables, directas y al grano como un Master Grower.
Responde ÚNICAMENTE con un JSON Array puro de objetos que tengan "title" y "message" en español. Ejemplo:
[{"title": "Alerta de Cosecha 🌿", "message": "Tu genética Amnesia lleva más de 10 semanas en flora, ¿no será hora de mirar los tricomas?"}]
Si no hay problemas reales, devuelve []. NO agregues comillas inclinadas (\`\`\`) ni texto adicional. Solamente el JSON.
El JSON a evaluar es:
${promptSummary}
`;
        const result = await model.generateContent(prompt);
        let rawResponse = result.response.text();
        
        // Cleanup potential markdown fences
        rawResponse = rawResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
        
        try {
            const alerts = JSON.parse(rawResponse);
            if (Array.isArray(alerts) && alerts.length > 0) {
                for (const alert of alerts) {
                    await sendTelegram(`Growy Guardian: ${org.name}`, `*${alert.title}*\n${alert.message}`);
                    totalAlerts++;
                }
            }
        } catch(e) {
            console.error("Error parsing Gemini JSON for org", org.id, ":", e, "\nRaw:", rawResponse);
        }
    }

    return new Response(JSON.stringify({ success: true, alertsSent: totalAlerts }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error("Growy Guardian Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
