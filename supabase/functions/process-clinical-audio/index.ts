import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const DEEPGRAM_API_KEY = Deno.env.get("DEEPGRAM_API_KEY");
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error(`Faltan variables de entorno básicas (URL o KEY).`);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body = await req.json();

    const { evolution_id, audio_url } = body;

    // Normal flow below...
    if (!evolution_id || !audio_url) {
      throw new Error("Se requiere evolution_id y audio_url, ejemplo: ai_clinical_audio/path/to/file.webm");
    }

    let path = audio_url;
    if (path.startsWith("ai_clinical_audio/")) {
      path = path.replace("ai_clinical_audio/", "");
    }
    path = path.replace(/^\/+/, '');

    const folderPath = path.includes('/') ? path.split('/')[0] : '';

    const { data: audioData, error: downloadError } = await supabase
      .storage
      .from("ai_clinical_audio")
      .download(path);

    if (downloadError || !audioData) {
      throw new Error(`Error descargando el audio desde Storage: ${downloadError?.message}. Path intentado: "${path}".`);
    }

    const arrayBuffer = await audioData.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Deepgram
    const deepgramResponse = await fetch("https://api.deepgram.com/v1/listen?model=nova-3&language=es", {
      method: "POST", headers: { "Authorization": `Token ${DEEPGRAM_API_KEY}`, "Content-Type": "audio/webm" }, body: buffer
    });
    if (!deepgramResponse.ok) throw new Error("Error en la API de Deepgram: " + await deepgramResponse.text());

    const deepgramJson = await deepgramResponse.json();
    const transcript = deepgramJson?.results?.channels?.[0]?.alternatives?.[0]?.transcript;
    if (!transcript) throw new Error("La transcripción de Deepgram retornó un texto vacío.");

    // Gemini
    const systemInstruction = `Eres un asistente médico experto. Se te proveerá una transcripción en crudo de una consulta médica. Tu tarea es extraer y limpiar estructuradamente la información más importante para formar el legajo clínico. Devuelve estrictamente un JSON válido con la siguiente estructura, sin usar backticks extra ni bloques markdown:
{
  "resumen_motivo_consulta": "Breve resumen...",
  "sintomas": ["sintoma_1"],
  "observaciones_clinicas": "Detalles médicos...",
  "recomendaciones_tratamiento": "Recomendaciones...",
  "nivel_dolor_eva_mencionado": number | null
}`;
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: `Transcripción en crudo:\n\n${transcript}` }] }], systemInstruction: { parts: [{ text: systemInstruction }] }, generationConfig: { responseMimeType: "application/json" } })
    });

    if (!geminiResponse.ok) throw new Error(`Error en la API de Google Gemini: ${await geminiResponse.text()}`);
    const geminiData = await geminiResponse.json();
    let extractedJsonText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    let parsedJson;
    try {
      extractedJsonText = extractedJsonText.replace(/```json/gi, "").replace(/```/g, "").trim();
      parsedJson = JSON.parse(extractedJsonText);
    } catch (e) {
      throw new Error("El modelo de Lenguaje no devolvió un JSON perfectamente estructurado.");
    }

    const { error: updateError } = await supabase.from("clinical_evolutions").update({ ai_transcript: parsedJson }).eq("id", evolution_id);
    if (updateError) throw new Error("Error inyectando el Legajo IA en la BD: " + updateError.message);

    return new Response(JSON.stringify({ success: true, ai_transcript: parsedJson }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
