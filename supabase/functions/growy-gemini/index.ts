// supabase/functions/growy-gemini/index.ts
// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { growyTools } from "./tools.ts";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// --- Rate Limiter (In-Memory, per Edge Function instance) ---
const rateLimitMap = new Map<string, { count: number, resetAt: number }>();
const RATE_LIMIT_MAX = 30; // Max requests per minute per org
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute

function checkRateLimit(orgId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(orgId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(orgId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

Deno.serve(async (req) => {
  // Manejar OPTIONS para CORS config preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const { prompt, orgId, history = [], imageBase64 } = await req.json();
    if (!prompt) {
      throw new Error("El campo 'prompt' es requerido.");
    }
    if (!orgId) {
      throw new Error("El campo 'orgId' es requerido para aislar la información de la organización (Multitenancy).");
    }
    // Rate Limit Check
    if (!checkRateLimit(orgId)) {
      return new Response(JSON.stringify({
        error: "Has superado el límite de solicitudes por minuto. Intenta nuevamente en unos segundos.",
        success: false
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 429
      });
    }
    // Inicializar Google Gemini
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error("No existe GEMINI_API_KEY configurado en Supabase Secrets.");
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    // Inyectamos Function Declarations (Tools)
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      tools: [
        {
          functionDeclarations: growyTools
        }
      ]
    });
    // Armar el System Prompt / Mensaje base
    const todayStr = new Date().toISOString().split('T')[0];
    const systemInstruction = `
Eres Growy, el Asistente Inteligente de TrazAPP (SaaS de Gestión de Cultivos Cannábicos).
Tu objetivo es ayudar al usuario respondiendo preguntas sobre sus datos, brindando asistencia técnica y proponiendo acciones operativas.
Actúa de manera extremadamente profesional, concisa, amigable e infunde confianza como Master Grower.

FECHA ACTUAL: Hoy es ${todayStr}. Úsala como referencia para cualquier cálculo de fechas relativas (mañana, en 10 días, etc.) y envíalas SIEMPRE en formato YYYY-MM-DD a las herramientas.

ERES UN AGENTE DUAL: CONVERSACIONAL Y EJECUTIVO.

MODO 1: CONVERSACIONAL (PREGUNTAS)
Si el usuario hace una pregunta sobre su cultivo (ej: "¿Cómo vienen mis plantas?", "¿Qué tareas tengo hoy?", "¿Cuándo cosecho?"):
- ESTÁS OBLIGADO a usar las herramientas de lectura (RAG Tools como get_active_crops, get_rooms_for_crop) ANTES de responder.
- Una vez recibas los datos, responde de forma natural, amigable y como un Master Grower.
- Infiere fechas de cosecha sumando las semanas de floración típicas a la fecha de inicio del lote si se te pregunta.
- ANÁLISIS DE IMÁGENES: Si recibes una imagen adjunta, utilízala como contexto principal. Analiza la salud botánica de la planta, posibles plagas, hongos, excesos/deficiencias o madurez de los tricomas.

MODO 2: EJECUTIVO (ÓRDENES Y ACCIONES)
Si el usuario te da una orden explícita para modificar datos (ej: "crea una tarea", "registra un gasto", "inicia una sala"):
- TIENES ESTRICTAMENTE PROHIBIDO responder con texto diciendo que lo hiciste.
- DEBES INVOCAR la herramienta de ACCIÓN correspondiente (ej: create_task, create_expense).
- DEBES pedir confirmación verbal si los parámetros obligatorios no están en la frase del usuario antes de invocar la acción.

REGLAS GENERALES PARA AMBOS MODOS:
1. NUNCA inventes UUIDs corporativos. Búscalos primero usando herramientas read-only si necesitas referencias como 'roomId' o 'cropId'.
2. Si necesitas un UUID de sala, usa 'get_rooms_for_crop'. Si necesitas un UUID de cultivo, usa 'get_active_crops'.

REGLAS ESTRICTAS DE FORMATO Y LECTURA (TEXT-TO-SPEECH):
1. Tu respuesta de texto será leída en voz alta por un motor TTS.
2. NUNCA menciones ni escribas los "ID" o "UUID" de la base de datos.
3. NUNCA devuelvas bloques de texto densos tipo "Clave: Valor".
4. Usa comas y puntos ortográficos generosamente para el TTS.
5. Usa saltos de línea (\\n\\n) tras listas.

REGLA CRÍTICA DE FRESCURA DE DATOS:
- NUNCA respondas preguntas sobre datos (tareas, cultivos, salas, finanzas) usando información de mensajes anteriores del chat.
- SIEMPRE invoca la herramienta de lectura correspondiente para obtener datos FRESCOS, incluso si ya respondiste una pregunta similar antes.
- Si el usuario pregunta "cuales son mis tareas?", DEBES llamar a get_pending_tasks, NO responder desde tu memoria.
`;
    const baseHistory = [
      {
        role: "user",
        parts: [
          {
            text: systemInstruction
          }
        ]
      },
      {
        role: "model",
        parts: [
          {
            text: "Entendido. Soy Growy, el asistente de TrazAPP. ¿En qué te puedo ayudar hoy?"
          }
        ]
      }
    ];
    // Mapeamos el history que nos manda el frontend
    const mappedHistory = history.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [
        {
          text: msg.content
        }
      ]
    }));
    const chat = model.startChat({
      history: [
        ...baseHistory,
        ...mappedHistory
      ],
      generationConfig: {
        maxOutputTokens: 4000,
        temperature: 0.2
      }
    });

    // Procesar imagen si viene adjunta
    let promptParts: any = prompt;
    if (imageBase64) {
      console.log("Se detectó una imagen adjunta. Preparando inlineData para Gemini Vision.");

      // Expected JS format: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ..."
      const match = imageBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      let mimeType = "image/jpeg";
      let base64Data = imageBase64;

      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      } else if (imageBase64.includes(',')) {
        // Fallback simple: agrupar lo que esté después de la primera coma
        base64Data = imageBase64.split(',')[1] || imageBase64;
      }

      promptParts = [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        },
        { text: prompt }
      ];
    }

    // 1. Primer envío a Gemini
    console.log("1. Preparando envío del prompt a Gemini (Modo Multimodal activado):", promptParts);
    console.log("1.1. Tools configuradas:", growyTools.map((t) => t.name).join(", "));
    let result = await chat.sendMessage(promptParts);
    console.log("2. Respuesta recibida exitosamente desde Gemini.");
    let response = result.response;
    // Helper para extraer functionCalls de manera segura
    const getFunctionCalls = (res) => {
      let parsedFunctionCalls = [];
      if (res.candidates && res.candidates.length > 0) {
        const parts = res.candidates[0].content?.parts || [];
        for (const part of parts) {
          if (part.functionCall) parsedFunctionCalls.push(part.functionCall);
        }
      }
      if (parsedFunctionCalls.length === 0 && typeof res.functionCalls === 'function') {
        const calls = res.functionCalls();
        if (calls) parsedFunctionCalls = calls;
      }
      return parsedFunctionCalls;
    };
    let parsedFunctionCalls = getFunctionCalls(response);
    // Listado de tools seguras de lectura (RAG)
    const readOnlyTools = [
      "get_active_crops",
      "get_rooms_for_crop",
      "get_batch_details",
      "get_pending_tasks",
      "get_organization_overview",
      "get_financial_summary",
      "read_financial_report",
      "read_agricultural_report"
    ];
    let currentResponse = response;
    let loopCount = 0;
    const MAX_LOOPS = 4; // Evitar iteración infinita si Gemini se confunde
    while (loopCount < MAX_LOOPS) {
      loopCount++;
      let parsedFunctionCalls = getFunctionCalls(currentResponse);
      // 1. Si NO hay tools solicitadas, significa que Gemini quiere responder con texto
      if (parsedFunctionCalls.length === 0) {
        let finalResponseText = "";
        try {
          finalResponseText = currentResponse.text();
        } catch (e) {
          console.error("Error al extraer texto final de Gemini:", e);
        }
        if (!finalResponseText || finalResponseText.trim() === '') {
          finalResponseText = "He procesado tu comando y navegado los datos exitosamente.";
        }
        console.log(`Bucle completado en ${loopCount} iteraciones. Respuesta:`, finalResponseText);
        return new Response(JSON.stringify({
          response: finalResponseText,
          success: true
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          status: 200
        });
      }
      // 2. Clasificar tools solicitadas en este lote
      const actionCalls = parsedFunctionCalls.filter((c) => !readOnlyTools.includes(c.name));
      const ragCalls = parsedFunctionCalls.filter((c) => readOnlyTools.includes(c.name));
      // 3. Si HAY herramientas de ACCIÓN mutable en el lote -> Rompemos el ciclo y enviamos al Frontend como Lote Atómico
      if (actionCalls.length > 0) {
        console.log(`Herramientas de Acción detectadas (${actionCalls.length}):`, actionCalls.map((c) => c.name));
        // Mapear al nuevo formato de Batch Propsal UI
        const proposalsArray = actionCalls.map((call, index) => ({
          id: `tmp_action_${index}`,
          name: call.name,
          args: call.args
        }));
        return new Response(JSON.stringify({
          success: true,
          action_proposals: proposalsArray
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          status: 200
        });
      }
      // Si no hay acciones, ejecutamos TODOS los RAG tools en paralelo (Tier 3: Multi-turn RAG Paralelo)
      console.log(`RAG paralelo: ejecutando ${ragCalls.length} tools en paralelo:`, ragCalls.map(c => c.name));
      const authHeader = req.headers.get('Authorization');
      const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
        global: {
          headers: {
            Authorization: authHeader
          }
        }
      });

      // Helper: ejecuta un tool y devuelve su response data
      const executeRagTool = async (call) => {
        let functionResponseData = {};
        try {
          if (call.name === "get_active_crops") {
            const { data, error } = await supabaseClient.from('chakra_crops').select('id, name, location, status, start_date').eq('organization_id', orgId).eq('status', 'active').limit(50);
            if (error) console.error("RAG Error crops:", error);
            console.log("Supabase response active crops:", data ? data.length : 0);
            functionResponseData = {
              items: data || []
            };
          } else if (call.name === "get_rooms_for_crop") {
            // --- 1. Fetch Rooms and internal Batches ---
            const { data: roomsData, error: roomsError } = await supabaseClient.from('rooms').select(`
              id,
              name,
              type,
              start_date,
              operational_days,
              active_batches:batches!current_room_id(
                id,
                name,
                parent_batch_id,
                quantity,
                start_date,
                clone_map_id,
                genetic:genetics(name),
                parent_batch:batches!parent_batch_id(name)
              )
            `).eq('spot_id', call.args.cropId);
            if (roomsError) console.error("RAG Error rooms:", roomsError);
            console.log("Supabase response rooms:", roomsData ? roomsData.length : 0);
            let formattedData = [];
            let orgUsersData = [];
            if (roomsData && roomsData.length > 0) {
              const roomIds = roomsData.map((r) => r.id);
              // --- 2. Fetch external relations independently to avoid PostgREST FK errors ---
              let mapsData = [];
              let tasksData = [];
              let stickiesData = [];
              const [mapsRes, tasksRes, stickiesRes, orgUsersRes] = await Promise.all([
                supabaseClient.from('clone_maps').select('id, name, room_id').in('room_id', roomIds).limit(50),
                supabaseClient.from('chakra_tasks').select('id, title, status, due_date, room_id').in('room_id', roomIds).eq('status', 'pending').limit(50),
                supabaseClient.from('chakra_stickies').select('id, content, room_id').in('room_id', roomIds).limit(20),
                supabaseClient.from('profiles_organizations').select('profile_id, profiles(full_name, role)').eq('organization_id', orgId).limit(50)
              ]);
              mapsData = mapsRes.data;
              tasksData = tasksRes.data;
              stickiesData = stickiesRes.data;
              orgUsersData = orgUsersRes.data;
              // Create Lookups
              const mapsByRoom = (mapsData || []).reduce((acc, curr) => {
                if (!acc[curr.room_id]) acc[curr.room_id] = [];
                acc[curr.room_id].push(curr);
                return acc;
              }, {});
              const tasksByRoom = (tasksData || []).reduce((acc, curr) => {
                if (!acc[curr.room_id]) acc[curr.room_id] = [];
                acc[curr.room_id].push({
                  titulo: curr.title,
                  fecha_vencimiento: curr.due_date
                });
                return acc;
              }, {});
              const stickiesByRoom = (stickiesData || []).reduce((acc, curr) => {
                if (!acc[curr.room_id]) acc[curr.room_id] = [];
                acc[curr.room_id].push(curr.content);
                return acc;
              }, {});
              // --- 3. Formateamos la respuesta para Gemini ---
              formattedData = roomsData.map((room) => {
                const total_plants = room.active_batches?.reduce((acc, batch) => acc + (batch.quantity || 0), 0) || 0;
                // --- CÁLCULO DE SEMANA ACTUAL ---
                let effectiveStartDate = room.start_date;
                if (room.active_batches && room.active_batches.length > 0) {
                  const earliestBatchDate = room.active_batches.reduce((min, b) => b.start_date < min ? b.start_date : min, room.active_batches[0].start_date);
                  effectiveStartDate = earliestBatchDate;
                }
                let currentWeek = null;
                if (effectiveStartDate) {
                  const startDate = new Date(effectiveStartDate);
                  const now = new Date();
                  const diffTime = Math.abs(now.getTime() - startDate.getTime());
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  currentWeek = Math.floor(diffDays / 7) + 1;
                }
                // --- CÁLCULO DE DÍAS RESTANTES ---
                let daysRemaining = null;
                if (room.start_date && room.operational_days) {
                  const start = new Date(room.start_date);
                  const end = new Date(start);
                  end.setDate(start.getDate() + room.operational_days);
                  const now = new Date();
                  const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                  daysRemaining = diffDays;
                }
                // --- AGRUPACIÓN DE LOTES (Respetando Lote Origen) ---
                const groupedBatches = {};
                room.active_batches?.forEach((b) => {
                  const loteId = b.parent_batch_id || b.id;
                  let parentName = undefined;
                  if (b.parent_batch) {
                    parentName = Array.isArray(b.parent_batch) ? b.parent_batch[0]?.name : b.parent_batch.name;
                  }
                  const loteName = parentName || b.name || "Lote Sin Nombre";
                  const geneticName = b.genetic?.name || "Desconocida";
                  if (!groupedBatches[loteId]) {
                    groupedBatches[loteId] = {
                      name: loteName,
                      quantity: 0,
                      startDate: b.start_date,
                      genetics: new Set()
                    };
                  }
                  groupedBatches[loteId].quantity += b.quantity || 1;
                  groupedBatches[loteId].genetics.add(geneticName);
                });
                const batches = Object.values(groupedBatches).map((lote) => ({
                  nombre_lote: lote.name,
                  genetitcas: Array.from(lote.genetics).join(", "),
                  fecha_inicio: lote.startDate,
                  cantidad_plantas: lote.quantity
                }));
                // --- MAPAS/MESAS (Calculando asignaciones) ---
                const roomMaps = mapsByRoom[room.id] || [];
                const activeMaps = roomMaps.map((map) => {
                  const plantsInMap = room.active_batches?.filter((b) => b.clone_map_id === map.id).reduce((acc, b) => acc + (b.quantity || 1), 0) || 0;
                  return {
                    map_id: map.id,
                    nombre_mapa: map.name,
                    plantas_asignadas: plantsInMap
                  };
                });
                return {
                  id: room.id,
                  nombre_sala: room.name,
                  tipo_sala: room.type,
                  semana_actual: currentWeek,
                  dias_restantes_vida_util: daysRemaining,
                  plantas_totales_en_sala: total_plants,
                  lotes_activos: batches,
                  mesas_mapas_activos: activeMaps,
                  tareas_pendientes: tasksByRoom[room.id] || [],
                  notas_fijadas: stickiesByRoom[room.id] || []
                };
              });
            }
            const orgMembers = (orgUsersData || []).map((ou) => ({
              usuario_id: ou.profile_id,
              nombre: ou.profiles?.full_name || 'Desconocido',
              rol: ou.profiles?.role || 'user'
            }));
            functionResponseData = {
              items: formattedData || [],
              equipo_de_trabajo: orgMembers
            };
          } else if (call.name === "get_batch_details") {
            let query = supabaseClient.from('batches').select(`
            id,
            name,
            quantity,
            start_date,
            room_id,
            rooms(name),
            genetics(name)
          `).eq('organization_id', orgId).is('discard_reason', null);

            if (call.args?.roomId) {
              query = query.eq('room_id', call.args.roomId);
            }
            if (call.args?.geneticName) {
              query = query.ilike('genetics.name', `%${call.args.geneticName}%`);
            }

            const { data, error } = await query.limit(50);
            if (error) console.error("RAG Error batch details:", error);

            const filteredData = (data || []).filter(b => b.genetics !== null);

            const formattedBatches = filteredData.map((b: any) => {
              let daysAlive = 0;
              if (b.start_date) {
                const start = new Date(b.start_date);
                const now = new Date();
                const diffTime = Math.abs(now.getTime() - start.getTime());
                daysAlive = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              }

              const geneticData = Array.isArray(b.genetics) ? b.genetics[0] : b.genetics;
              const roomData = Array.isArray(b.rooms) ? b.rooms[0] : b.rooms;

              return {
                id: b.id,
                nombre: b.name,
                cantidad: b.quantity,
                fecha_inicio: b.start_date,
                dias_de_vida: daysAlive,
                semanas_de_vida: Math.floor(daysAlive / 7),
                sala: roomData?.name || 'Desconocida',
                genetica: geneticData?.name || 'Desconocida'
              };
            });

            functionResponseData = {
              matches: formattedBatches
            };
          } else if (call.name === "get_pending_tasks") {
            let query = supabaseClient.from('chakra_tasks').select(`
                id, title, due_date, status, type, description,
                profiles:assigned_to(full_name)
            `).eq('organization_id', orgId).in('status', [
              'pending',
              'in_progress'
            ]).order('due_date', {
              ascending: true
            }).limit(50);
            const { data, error } = await query;
            if (error) console.error("RAG Error tasks:", error);
            let filteredData = data || [];
            if (call.args?.assignedToName && filteredData.length > 0) {
              const searchName = call.args.assignedToName.toLowerCase();
              filteredData = filteredData.filter((t) => {
                const fullName = Array.isArray(t.profiles) ? t.profiles[0]?.full_name : t.profiles?.full_name;
                return fullName?.toLowerCase().includes(searchName);
              });
            }
            console.log("Supabase response tasks:", filteredData.length);
            functionResponseData = {
              items: filteredData
            };
          } else if (call.name === "get_financial_summary") {
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            const startStr = startOfMonth.toISOString().split('T')[0];
            const { data, error } = await supabaseClient.from('chakra_expenses').select('amount, type, category, concept, date').eq('organization_id', orgId).gte('date', startStr).limit(100);
            if (error) console.error("RAG Error expenses:", error);
            let totalIncome = 0;
            let totalExpense = 0;
            let breakdown = {};
            if (data) {
              data.forEach((m) => {
                if (m.type === 'INGRESO') totalIncome += m.amount;
                if (m.type === 'EGRESO') {
                  totalExpense += m.amount;
                  breakdown[m.category] = (breakdown[m.category] || 0) + m.amount;
                }
              });
            }
            console.log("Supabase response finance records:", data ? data.length : 0);
            functionResponseData = {
              summary: {
                ingresos_mes_actual: totalIncome,
                gastos_mes_actual: totalExpense,
                flujo_neto: totalIncome - totalExpense,
                gastos_por_categoria: breakdown,
                movimientos_recientes: data ? data.slice(0, 10) : []
              }
            };
          } else if (call.name === "get_organization_overview") {
            // Consultas paralelas para una vista rica de la organización
            const [cropsRes, tasksRes, overdueTasksRes, roomsRes, membersRes] = await Promise.all([
              supabaseClient.from('chakra_crops').select('id', { count: 'exact', head: true })
                .eq('organization_id', orgId).eq('status', 'active'),
              supabaseClient.from('chakra_tasks').select('id', { count: 'exact', head: true })
                .eq('organization_id', orgId).eq('status', 'pending'),
              supabaseClient.from('chakra_tasks').select('id', { count: 'exact', head: true })
                .eq('organization_id', orgId).eq('status', 'pending').lt('due_date', new Date().toISOString()),
              supabaseClient.from('rooms').select('id', { count: 'exact', head: true })
                .eq('organization_id', orgId),
              supabaseClient.from('organization_members').select('id', { count: 'exact', head: true })
                .eq('organization_id', orgId)
            ]);

            functionResponseData = {
              summary: {
                total_active_crops: cropsRes.count || 0,
                total_pending_tasks: tasksRes.count || 0,
                total_overdue_tasks: overdueTasksRes.count || 0,
                total_rooms: roomsRes.count || 0,
                total_team_members: membersRes.count || 0
              }
            };

            // Enriquecer con nombres de tareas pendientes para consistencia
            if ((tasksRes.count || 0) > 0) {
              const { data: taskNames } = await supabaseClient
                .from('chakra_tasks')
                .select('title, due_date')
                .eq('organization_id', orgId)
                .eq('status', 'pending')
                .order('due_date', { ascending: true })
                .limit(5);
              functionResponseData.summary.top_pending_tasks = taskNames || [];
            }
          } else if (call.name === "read_financial_report") {
            const year = call.args?.year || new Date().getFullYear();
            const startStr = `${year}-01-01`;
            const endStr = `${year}-12-31`;

            console.log(`Ejecutando reportes financieros para el año ${year} en la org ${orgId}...`);
            const [mMetricsRes, cBreakdownRes] = await Promise.all([
              supabaseClient.rpc('get_monthly_metrics', { query_year: year }),
              supabaseClient.rpc('get_cost_breakdown', { start_date: startStr, end_date: endStr })
            ]);

            functionResponseData = {
              year,
              monthly_cashflow: mMetricsRes.data || [],
              cost_breakdown_by_category: cBreakdownRes.data || []
            };
          } else if (call.name === "read_agricultural_report") {
            console.log(`Ejecutando reporte agrícola en la org ${orgId}...`);

            const [genPerfRes, mortRes, survRes] = await Promise.all([
              supabaseClient.rpc('get_genetic_performance'),
              supabaseClient.from('batches').select('discard_reason, quantity').not('discard_reason', 'is', null).neq('discard_reason', 'Distribuido en Mapa (Bulk)').eq('organization_id', orgId).limit(500),
              supabaseClient.from('batches').select('discarded_at, discard_reason, quantity, genetics(name)').eq('organization_id', orgId).limit(500)
            ]);

            const mortStats: Record<string, number> = {};
            mortRes.data?.forEach((b: any) => {
              const reasonBase = b.discard_reason.split(' - ')[0];
              mortStats[reasonBase] = (mortStats[reasonBase] || 0) + (b.quantity || 1);
            });
            const parsedMortality = Object.entries(mortStats).map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count);

            const survStats: Record<string, { total: number, discarded: number }> = {};
            survRes.data?.forEach((b: any) => {
              const geneticData = Array.isArray(b.genetics) ? b.genetics[0] : b.genetics;
              const name = geneticData?.name || 'Desconocida';
              if (!survStats[name]) survStats[name] = { total: 0, discarded: 0 };

              const qty = b.quantity || 1;
              survStats[name].total += qty;
              if (b.discarded_at && b.discard_reason !== 'Distribuido en Mapa (Bulk)') {
                survStats[name].discarded += qty;
              }
            });
            const parsedSurvival = Object.entries(survStats).map(([genetic_name, stat]) => ({
              genetic_name,
              total: stat.total,
              discarded: stat.discarded,
              survival_rate: stat.total > 0 ? ((stat.total - stat.discarded) / stat.total) * 100 : 0
            })).sort((a, b) => b.survival_rate - a.survival_rate);

            functionResponseData = {
              genetic_performance: genPerfRes.data || [],
              mortality_reasons: parsedMortality,
              genetic_survival_rates: parsedSurvival
            };
          }
        } catch (e) {
          console.error(`Excepción en consulta RAG [${call.name}]:`, e);
          functionResponseData = { error: "Failed to fetch data from database" };
        }
        return { name: call.name, response: functionResponseData };
      };

      // Ejecutar TODOS los RAG tools en paralelo
      const ragResults = await Promise.all(ragCalls.map(call => executeRagTool(call)));

      // Enviar todas las respuestas a Gemini en un solo mensaje
      const functionResponseParts = ragResults.map(result => ({
        functionResponse: {
          name: result.name,
          response: result.response
        }
      }));
      console.log(`Enviando ${functionResponseParts.length} resultados RAG de vuelta a Gemini...`);
      const nextResult = await chat.sendMessage(functionResponseParts);
      currentResponse = nextResult.response;
    }
    // Si el bucle termina por superar el MAX_LOOPS
    return new Response(JSON.stringify({
      response: "El proceso analizó demasiadas subrutinas y tuve que detenerlo antes de terminar. ¿Puedes ser más directo con tu consulta?",
      success: true
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    console.error("Growy Error:", error);
    // Intentamos recuperar la lista de modelos disponibles para debuggear la API Key
    let availableModels = "";
    try {
      const apiKey = Deno.env.get('GEMINI_API_KEY');
      if (apiKey) {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await res.json();
        if (data.models) {
          const modelNames = data.models.map((m) => m.name.replace('models/', '')).join(', ');
          availableModels = ` | Modelos disponibles: ${modelNames}`;
        }
      }
    } catch (e) {
      console.error("No se pudo obtener la lista de modelos", e);
    }
    return new Response(JSON.stringify({
      error: error.message + availableModels,
      success: false
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  }
});
