import {
  listRoomsSchema,
  getRoomDetailsSchema,
  handleListRooms,
  handleGetRoomDetails,
} from './rooms.js';
import {
  listBatchesSchema,
  createBatchSchema,
  updateBatchStageSchema,
  handleListBatches,
  handleCreateBatch,
  handleUpdateBatchStage,
} from './batches.js';
import {
  listCropsSchema,
  createCropSchema,
  handleListCrops,
  handleCreateCrop,
} from './crops.js';
import {
  listTasksSchema,
  createTaskSchema,
  completeTaskSchema,
  handleListTasks,
  handleCreateTask,
  handleCompleteTask,
} from './tasks.js';
import {
  listInsumosSchema,
  handleListInsumos,
} from './insumos.js';
import {
  listDispensaryStockSchema,
  recordDispensaryMovementSchema,
  handleListDispensaryStock,
  handleRecordDispensaryMovement,
} from './dispensary.js';
import {
  getRoomTelemetrySchema,
  listDevicesSchema,
  handleGetRoomTelemetry,
  handleListDevices,
} from './telemetry.js';
import {
  authenticateSchema,
  getClubOverviewSchema,
  getFinancialSummarySchema,
  handleAuthenticate,
  handleGetClubOverview,
  handleGetFinancialSummary,
} from './club.js';

export const TOOLS_DEFINITIONS = [
  // ─── Autenticación Dinámica ───
  {
    name: 'trazapp_authenticate',
    description: 'Vincula la sesión del agente al club correspondiente mediante su API Key (tz_live_...).',
    inputSchema: {
      type: 'object',
      properties: {
        apiKey: {
          type: 'string',
          description: 'API Key del club (tz_live_...)',
        },
      },
      required: ['apiKey'],
    },
  },

  // ─── Balance y Métricas del Club ───
  {
    name: 'trazapp_get_club_overview',
    description: 'Obtiene un resumen integral del club: nombre del tenant, capacidad, salas activas, plantas totales, tareas y miembros.',
    inputSchema: {
      type: 'object',
      properties: {
        organizationId: {
          type: 'string',
          description: 'ID de la organización (opcional, inferido por la clave)',
        },
      },
    },
  },
  {
    name: 'trazapp_get_financial_summary',
    description: 'Calcula el balance financiero del club: ingresos de dispensario, gastos operativos de insumos/cultivo y balance neto.',
    inputSchema: {
      type: 'object',
      properties: {
        year: { type: 'number', description: 'Año a consultar (ej. 2026)' },
        organizationId: { type: 'string', description: 'ID de la organización' },
      },
    },
  },

  // ─── Salas ───
  {
    name: 'trazapp_list_rooms',
    description: 'Lista todas las salas de cultivo activas (Vegetación, Floración, Esquejera, etc.) con sus capacidades y umbrales ideales.',
    inputSchema: {
      type: 'object',
      properties: {
        organizationId: {
          type: 'string',
          description: 'ID de la organización (opcional si está en variables de entorno)',
        },
      },
    },
  },
  {
    name: 'trazapp_get_room_details',
    description: 'Obtiene el detalle completo de una sala de cultivo: parámetros ambientales, lotes activos y tareas pendientes en la sala.',
    inputSchema: {
      type: 'object',
      properties: {
        roomId: { type: 'string', description: 'ID de la sala' },
        organizationId: { type: 'string', description: 'ID de la organización' },
      },
      required: ['roomId'],
    },
  },

  // ─── Lotes / Batches ───
  {
    name: 'trazapp_list_batches',
    description: 'Lista lotes de plantas activos en el cultivo, permitiendo filtrar por sala o etapa fenológica (vegetativo, floración, etc.).',
    inputSchema: {
      type: 'object',
      properties: {
        roomId: { type: 'string', description: 'Filtrar por ID de sala' },
        stage: {
          type: 'string',
          enum: ['germination', 'cloning', 'vegetative', 'pre_flowering', 'flowering', 'drying', 'curing', 'stored', 'harvested', 'destroyed'],
          description: 'Filtrar por etapa fenológica',
        },
        organizationId: { type: 'string', description: 'ID de la organización' },
      },
    },
  },
  {
    name: 'trazapp_create_batch',
    description: 'Crea un nuevo lote de plantas/esquejes en TrazAPP para iniciar un ciclo de cultivo o esquejado.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Nombre descriptivo del lote' },
        trackingCode: { type: 'string', description: 'Código alfanumérico de trazabilidad' },
        geneticsId: { type: 'string', description: 'ID de la genética' },
        roomId: { type: 'string', description: 'ID de la sala' },
        stage: {
          type: 'string',
          enum: ['germination', 'cloning', 'vegetative', 'pre_flowering', 'flowering'],
          description: 'Etapa inicial',
        },
        plantCount: { type: 'number', description: 'Cantidad de plantas o esquejes' },
        parentBatchId: { type: 'string', description: 'ID del lote madre para trazabilidad genealógica' },
        notes: { type: 'string', description: 'Observaciones iniciales' },
        organizationId: { type: 'string', description: 'ID de la organización' },
      },
      required: ['name', 'plantCount'],
    },
  },
  {
    name: 'trazapp_update_batch_stage',
    description: 'Avanza o cambia la etapa fenológica de un lote (ej. pasar de vegetativo a floración, o a secado).',
    inputSchema: {
      type: 'object',
      properties: {
        batchId: { type: 'string', description: 'ID del lote' },
        newStage: {
          type: 'string',
          enum: ['germination', 'cloning', 'vegetative', 'pre_flowering', 'flowering', 'drying', 'curing', 'stored', 'harvested', 'destroyed'],
          description: 'Nueva etapa fenológica',
        },
        newRoomId: { type: 'string', description: 'Nueva sala en caso de trasplante o mudanza' },
        notes: { type: 'string', description: 'Notas del cambio' },
      },
      required: ['batchId', 'newStage'],
    },
  },

  // ─── Cultivos / Crops ───
  {
    name: 'trazapp_list_crops',
    description: 'Lista los ciclos de cultivo registrados en TrazAPP (activos, finalizados o archivados).',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['active', 'completed', 'archived'], description: 'Estado del ciclo' },
        organizationId: { type: 'string', description: 'ID de la organización' },
      },
    },
  },
  {
    name: 'trazapp_create_crop',
    description: 'Registra un nuevo ciclo general de cultivo en TrazAPP.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Nombre del ciclo (ej. Cultivo Temporada Invierno 2026)' },
        season: { type: 'string', description: 'Temporada o descripción' },
        startDate: { type: 'string', description: 'Fecha de inicio (ISO 8601)' },
        organizationId: { type: 'string', description: 'ID de la organización' },
      },
      required: ['name'],
    },
  },

  // ─── Tareas de Cultivo ───
  {
    name: 'trazapp_list_tasks',
    description: 'Lista las tareas pendientes o completadas de cultivo (riegos, fertilizaciones, podas, mantenimiento).',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['pending', 'in_progress', 'done', 'dismissed', 'all'], description: 'Estado de las tareas' },
        roomId: { type: 'string', description: 'Filtrar por ID de sala' },
        cropId: { type: 'string', description: 'Filtrar por ID de cultivo' },
        organizationId: { type: 'string', description: 'ID de la organización' },
      },
    },
  },
  {
    name: 'trazapp_create_task',
    description: 'Agenda una nueva tarea agronómica en el calendario de TrazAPP.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Título de la tarea' },
        description: { type: 'string', description: 'Instrucciones agronómicas detalladas' },
        type: { type: 'string', description: 'Tipo: irrigation, fertilization, pest_control, pruning, harvest, maintenance, general' },
        dueDate: { type: 'string', description: 'Fecha y hora programada (ISO 8601)' },
        roomId: { type: 'string', description: 'ID de la sala' },
        cropId: { type: 'string', description: 'ID del cultivo' },
        assignedTo: { type: 'string', description: 'Persona asignada' },
        organizationId: { type: 'string', description: 'ID de la organización' },
      },
      required: ['title', 'dueDate'],
    },
  },
  {
    name: 'trazapp_complete_task',
    description: 'Marca una tarea del calendario como completada y guarda observaciones del operador o del agente.',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: { type: 'string', description: 'ID de la tarea' },
        observations: { type: 'string', description: 'Observaciones de cierre' },
      },
      required: ['taskId'],
    },
  },

  // ─── Insumos / Stock ───
  {
    name: 'trazapp_list_insumos',
    description: 'Consulta el inventario de insumos (nutrientes, sustratos, preventivos) y alerta sobre stock crítico.',
    inputSchema: {
      type: 'object',
      properties: {
        lowStockOnly: { type: 'boolean', description: 'Filtrar solo los que están por debajo del stock mínimo' },
        categoria: { type: 'string', description: 'Filtrar por categoría' },
        organizationId: { type: 'string', description: 'ID de la organización' },
      },
    },
  },

  // ─── Dispensario ───
  {
    name: 'trazapp_list_dispensary_stock',
    description: 'Consulta el inventario disponible en el dispensario (flores secas, aceites, extractos, cremas) con sus pesos y grados de calidad.',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['available', 'curing', 'quarantine', 'all'], description: 'Estado del stock' },
        productType: { type: 'string', description: 'Tipo de producto: flower, oil, extract, cream, edible' },
        organizationId: { type: 'string', description: 'ID de la organización' },
      },
    },
  },
  {
    name: 'trazapp_record_dispensary_movement',
    description: 'Registra una entrega/dispensa a un paciente o un reingreso de stock en el dispensario, recalculando existencias y trazabilidad.',
    inputSchema: {
      type: 'object',
      properties: {
        batchId: { type: 'string', description: 'ID del lote de dispensario' },
        type: { type: 'string', enum: ['dispense', 'restock', 'adjustment', 'quality_test', 'disposal'], description: 'Tipo de movimiento' },
        amount: { type: 'number', description: 'Cantidad en gramos o ml' },
        memberId: { type: 'string', description: 'ID del socio o paciente' },
        reason: { type: 'string', description: 'Motivo u observación' },
        organizationId: { type: 'string', description: 'ID de la organización' },
      },
      required: ['batchId', 'type', 'amount'],
    },
  },

  // ─── Telemetría e IoT ───
  {
    name: 'trazapp_get_room_telemetry',
    description: 'Obtiene las lecturas en vivo de temperatura, humedad y VPD de una sala, comparándolas contra los rangos ideales agronómicos.',
    inputSchema: {
      type: 'object',
      properties: {
        roomId: { type: 'string', description: 'ID de la sala' },
        organizationId: { type: 'string', description: 'ID de la organización' },
      },
      required: ['roomId'],
    },
  },
  {
    name: 'trazapp_list_iot_devices',
    description: 'Lista los dispositivos IoT y sensores conectados a TrazAPP.',
    inputSchema: {
      type: 'object',
      properties: {
        organizationId: { type: 'string', description: 'ID de la organización' },
      },
    },
  },
];

export async function executeTool(name: string, args: any) {
  switch (name) {
    case 'trazapp_authenticate':
      return handleAuthenticate(authenticateSchema.parse(args));
    case 'trazapp_get_club_overview':
      return handleGetClubOverview(getClubOverviewSchema.parse(args || {}));
    case 'trazapp_get_financial_summary':
      return handleGetFinancialSummary(getFinancialSummarySchema.parse(args || {}));
    case 'trazapp_list_rooms':
      return handleListRooms(listRoomsSchema.parse(args || {}));
    case 'trazapp_get_room_details':
      return handleGetRoomDetails(getRoomDetailsSchema.parse(args));
    case 'trazapp_list_batches':
      return handleListBatches(listBatchesSchema.parse(args || {}));
    case 'trazapp_create_batch':
      return handleCreateBatch(createBatchSchema.parse(args));
    case 'trazapp_update_batch_stage':
      return handleUpdateBatchStage(updateBatchStageSchema.parse(args));
    case 'trazapp_list_crops':
      return handleListCrops(listCropsSchema.parse(args || {}));
    case 'trazapp_create_crop':
      return handleCreateCrop(createCropSchema.parse(args));
    case 'trazapp_list_tasks':
      return handleListTasks(listTasksSchema.parse(args || {}));
    case 'trazapp_create_task':
      return handleCreateTask(createTaskSchema.parse(args));
    case 'trazapp_complete_task':
      return handleCompleteTask(completeTaskSchema.parse(args));
    case 'trazapp_list_insumos':
      return handleListInsumos(listInsumosSchema.parse(args || {}));
    case 'trazapp_list_dispensary_stock':
      return handleListDispensaryStock(listDispensaryStockSchema.parse(args || {}));
    case 'trazapp_record_dispensary_movement':
      return handleRecordDispensaryMovement(recordDispensaryMovementSchema.parse(args));
    case 'trazapp_get_room_telemetry':
      return handleGetRoomTelemetry(getRoomTelemetrySchema.parse(args));
    case 'trazapp_list_iot_devices':
      return handleListDevices(listDevicesSchema.parse(args || {}));
    default:
      throw new Error(`Herramienta no reconocida en TrazAPP MCP: ${name}`);
  }
}
