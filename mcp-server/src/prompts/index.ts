export const PROMPTS_DEFINITIONS = [
  {
    name: 'trazapp_climate_audit',
    description: 'Instruye al agente para auditar el clima de todas las salas y proponer ajustes agronómicos o tareas automáticas.',
    arguments: [
      {
        name: 'focusRoomId',
        description: 'ID de una sala específica para enfocar la auditoría (opcional)',
        required: false,
      },
    ],
  },
  {
    name: 'trazapp_daily_briefing',
    description: 'Genera un reporte ejecutivo para el director técnico o cultivador con el plan de trabajo del día.',
    arguments: [],
  },
];

export async function handleGetPrompt(name: string, args: any) {
  if (name === 'trazapp_climate_audit') {
    return {
      description: 'Auditoría de Clima y Automatización Agronómica en TrazAPP',
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Actúa como un Agrónomo y Director Técnico de Cultivo especializado en cannabis medicinal y horticultura de precisión.
Tu objetivo es realizar una auditoría integral del clima y las condiciones ambientales en TrazAPP:

1. Ejecuta la herramienta "trazapp_list_rooms" para identificar todas las salas de cultivo activas.
2. Para cada sala (o la sala indicada en "${args?.focusRoomId || 'todas'}"), ejecuta "trazapp_get_room_telemetry" y evalúa:
   - Rango de Temperatura vs. Ideal.
   - Rango de Humedad Relativa vs. Ideal.
   - Cálculo y desviación de VPD (Déficit de Presión de Vapor).
3. Si detectas desviaciones críticas (riesgo de oídio, botrytis, estambrado térmico o cierre estomático), utiliza "trazapp_create_task" para agendar las intervenciones correctivas necesarias (ej. extracción forzada, deshumidificación, calibración de riego).
4. Presenta un informe estructurado y claro con tus conclusiones y tareas creadas.`,
          },
        },
      ],
    };
  }

  if (name === 'trazapp_daily_briefing') {
    return {
      description: 'Reporte Diario de Operaciones en TrazAPP',
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Por favor genera el Briefing Diario de Cultivo de TrazAPP para hoy:
1. Consulta el recurso "trazapp://org/daily-overview" y lista las tareas pendientes con "trazapp_list_tasks".
2. Revisa el stock de insumos críticos con "trazapp_list_insumos" (lowStockOnly=true).
3. Resume las prioridades del día divididas en:
   - Tareas Urgentes de Cultivo (Riegos / Nutrición / Podas)
   - Monitoreo Ambiental / Alertas de Sensores
   - Alertas de Inventario o Insumos por agotar.`,
          },
        },
      ],
    };
  }

  throw new Error(`Prompt no reconocido: ${name}`);
}
