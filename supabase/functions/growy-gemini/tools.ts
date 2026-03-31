import { SchemaType } from "npm:@google/generative-ai";
export const growyTools = [
  // --- MÓDULO CULTIVOS ---
  {
    name: "create_crop",
    description: "Crea un nuevo cultivo (Spot) en la organización.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: {
          type: SchemaType.STRING,
          description: "Opcional. ID temporal inventado (ej. 'temp_crop_1') solo si necesitas referenciar este cultivo en otras acciones del mismo lote."
        },
        name: {
          type: SchemaType.STRING,
          description: "Nombre del cultivo (ej. Beccar, Cultivo Facundo)"
        },
        location: {
          type: SchemaType.STRING,
          description: "Ubicación o dirección (ej. Carapachay)"
        },
        startDate: {
          type: SchemaType.STRING,
          description: "Fecha de inicio en formato ISO (YYYY-MM-DD)"
        },
        estimatedHarvestDate: {
          type: SchemaType.STRING,
          description: "Fecha estimada de cosecha (YYYY-MM-DD), opcional"
        },
        color: {
          type: SchemaType.STRING,
          description: "Color de etiqueta (green, blue, purple, red, orange)"
        }
      },
      required: [
        "name",
        "location",
        "startDate"
      ]
    }
  },
  {
    name: "update_crop",
    description: "Edita los detalles de un cultivo existente.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: {
          type: SchemaType.STRING,
          description: "UUID del cultivo a modificar"
        },
        name: {
          type: SchemaType.STRING,
          description: "Nuevo nombre"
        },
        status: {
          type: SchemaType.STRING,
          description: "Estado (active, paused, completed)"
        }
      },
      required: [
        "id"
      ]
    }
  },
  {
    name: "delete_crop",
    description: "Elimina un cultivo. Usa esta función con mucho cuidado, solo si está vacío.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: {
          type: SchemaType.STRING,
          description: "UUID del cultivo a eliminar"
        }
      },
      required: [
        "id"
      ]
    }
  },
  {
    name: "log_harvest",
    description: "Registra una nueva cosecha y su peso.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        cropId: {
          type: SchemaType.STRING,
          description: "UUID del cultivo"
        },
        roomName: {
          type: SchemaType.STRING,
          description: "Nombre de la sala donde se cultivó"
        },
        amount: {
          type: SchemaType.NUMBER,
          description: "Cantidad cosechada"
        },
        unit: {
          type: SchemaType.STRING,
          description: "Unidad (g o kg)"
        },
        notes: {
          type: SchemaType.STRING,
          description: "Notas adicionales de calidad"
        }
      },
      required: [
        "cropId",
        "roomName",
        "amount",
        "unit"
      ]
    }
  },
  // --- MÓDULO SALAS Y PLANTAS ---
  {
    name: "create_room",
    description: "Crea una nueva sala dentro de un cultivo (Vegetación, Flora, Secado).",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: {
          type: SchemaType.STRING,
          description: "Opcional. ID temporal inventado (ej. 'temp_room_1') si necesitas referenciar esta sala en otras acciones del mismo lote (como tareas)."
        },
        name: {
          type: SchemaType.STRING,
          description: "Nombre de la sala (ej. Carpa 1, Sala Principal)"
        },
        type: {
          type: SchemaType.STRING,
          description: "Tipo de sala. Valores válidos sugeridos: vegetation, flowering, drying, curing, mother, clones, germination, general, living_soil. Si el usuario pide esquejes, devulve 'clones'. Si pide madres, devuelve 'mother'."
        },
        spotId: {
          type: SchemaType.STRING,
          description: "UUID del Cultivo al que pertenece la sala"
        }
      },
      required: [
        "name",
        "type",
        "spotId"
      ]
    }
  },
  {
    name: "create_batch",
    description: "Agrega un lote de plantas a una sala.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        roomId: {
          type: SchemaType.STRING,
          description: "UUID de la sala"
        },
        geneticId: {
          type: SchemaType.STRING,
          description: "UUID de la Genética (si existe, sino string vacío)"
        },
        count: {
          type: SchemaType.NUMBER,
          description: "Cantidad de plantas"
        },
        potSize: {
          type: SchemaType.STRING,
          description: "Tamaño de maceta (opcional)"
        }
      },
      required: [
        "roomId",
        "count"
      ]
    }
  },
  {
    name: "move_batch",
    description: "Mueve un lote de plantas de una sala a otra.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        batchId: {
          type: SchemaType.STRING,
          description: "UUID del lote de plantas"
        },
        destinationRoomId: {
          type: SchemaType.STRING,
          description: "UUID de la sala de destino"
        }
      },
      required: [
        "batchId",
        "destinationRoomId"
      ]
    }
  },
  // --- MÓDULO TAREAS ---
  {
    name: "create_task",
    description: "Crea una nueva tarea o recordatorio en el calendario.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        title: {
          type: SchemaType.STRING,
          description: "Título de la tarea (ej. Regar plantas, Aplicar té de compost)"
        },
        description: {
          type: SchemaType.STRING,
          description: "Instrucciones detalladas"
        },
        dueDate: {
          type: SchemaType.STRING,
          description: "Fecha inicial de vencimiento (YYYY-MM-DD)"
        },
        assignedTo: {
          type: SchemaType.STRING,
          description: "UUID del usuario asignado (opcional)"
        },
        assignedToName: {
          type: SchemaType.STRING,
          description: "Nombre del usuario al que se le asigna la tarea (opcional). Úsalo si no sabes el UUID."
        },
        roomId: {
          type: SchemaType.STRING,
          description: "UUID de la sala a la que pertenece la tarea (opcional). OBLIGATORIO usar get_rooms_for_crop para obtener el ID primero."
        },
        mapName: {
          type: SchemaType.STRING,
          description: "Nombre del mapa/mesa específico donde se debe realizar la tarea (opcional)."
        },
        recurrence: {
          type: SchemaType.STRING,
          description: "Patrón de recurrencia en formato humano corto (ej: 'every 10 days', 'every week', 'every month'). Déjalo vacío si es una tarea única."
        }
      },
      required: [
        "title",
        "dueDate"
      ]
    }
  },
  {
    name: "toggle_task_completion",
    description: "Marca una tarea como completada o pendiente.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        taskId: {
          type: SchemaType.STRING,
          description: "UUID de la tarea"
        }
      },
      required: [
        "taskId"
      ]
    }
  },
  {
    name: "create_room_sticky",
    description: "Crea una nota adhesiva/mensaje (Pizarra de Notas) específica para una sala o cultivo. NO ES UNA TAREA DEL CALENDARIO, no requiere fechas estructuradas ni completitud.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: {
          type: SchemaType.STRING,
          description: "Opcional. ID temporal inventado (ej. 'temp_sticky_1') si la nota es generada en lote."
        },
        content: {
          type: SchemaType.STRING,
          description: "Contenido/Mensaje principal de la nota (ej. 'No regar, estamos en lavado de raíces')."
        },
        color: {
          type: SchemaType.STRING,
          description: "Color de la nota. Opciones válidas: yellow, blue, pink, green."
        },
        roomId: {
          type: SchemaType.STRING,
          description: "UUID de la sala a la que pertenece la nota (opcional). OBLIGATORIO usar get_rooms_for_crop para obtener el ID real primero si la sala ya existe. Si la sala se crea en este mismo lote, usa su ID temporal."
        }
      },
      required: [
        "content"
      ]
    }
  },
  {
    name: "create_map",
    description: "Crea un mapa, plano o mesa de trabajo (CloneMap/Esquejera) dentro de una sala específica para ubicar lotes o plantas. Requiere medidas de cuadrícula.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: {
          type: SchemaType.STRING,
          description: "Opcional. ID temporal inventado (ej. 'temp_map_1') si la mesa es generada en lote."
        },
        name: {
          type: SchemaType.STRING,
          description: "Nombre de la mesa de trabajo o plano (ej. 'Mesa 1', 'Mesa de Madres A', 'Rack de Secado')."
        },
        roomId: {
          type: SchemaType.STRING,
          description: "UUID de la sala a la que pertenece la mesa. OBLIGATORIO usar get_rooms_for_crop para obtener el ID real primero si la sala ya existe. Si la sala se crea en este batch, usa su ID temporal."
        },
        grid_rows: {
          type: SchemaType.INTEGER,
          description: "Número de filas de la cuadrícula o mesa (ej. 7). Extrae este valor de las dimensiones de multiplicación (ej. '7x5' -> filas: 7)."
        },
        grid_columns: {
          type: SchemaType.INTEGER,
          description: "Número de columnas de la cuadrícula o mesa (ej. 5). Extrae este valor de las dimensiones de multiplicación (ej. '7x5' -> columnas: 5)."
        }
      },
      required: [
        "name", "grid_rows", "grid_columns"
      ]
    }
  },
  // --- FINANZAS / INVENTARIO ---
  {
    name: "create_expense",
    description: "Registra un movimiento financiero (Gasto o Ingreso/Aporte) para la organización.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        title: {
          type: SchemaType.STRING,
          description: "Motivo o concepto del gasto/ingreso (ej. Compra sustrato, Pago luz, Aporte de socio, Venta de material)"
        },
        amount: {
          type: SchemaType.NUMBER,
          description: "Monto del movimiento financiero (en dinero, números positivos)"
        },
        type: {
          type: SchemaType.STRING,
          description: "Tipo de movimiento. Valores permitidos: INGRESO o EGRESO"
        },
        payment_method: {
          type: SchemaType.STRING,
          description: "Método de pago. Valores sugeridos: Efectivo, Transferencia, Criptomonedas"
        }
      },
      required: [
        "title",
        "amount",
        "type",
        "payment_method"
      ]
    }
  },
  {
    name: "create_insumo",
    description: "Añade un nuevo producto físico, herramienta o suministro al inventario/stock de la organización.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        nombre: {
          type: SchemaType.STRING,
          description: "Nombre del insumo (ej. Semillas Choco OG, Fertilizante Flora, Maceta 10L)"
        },
        categoria: {
          type: SchemaType.STRING,
          description: "Categoría de inventario. Valores sugeridos: semillas, fertilizantes, sustratos, herramientas, pesticidas, otros"
        },
        unidad_medida: {
          type: SchemaType.STRING,
          description: "Unidad dimensional. Valores sugeridos: unidades, litros, ml, kg, gramos"
        },
        precio_actual: {
          type: SchemaType.NUMBER,
          description: "Precio actual por unidad (en dinero)"
        },
        stock_actual: {
          type: SchemaType.NUMBER,
          description: "Cantidad actual en posesión ingresando al inventario"
        },
        stock_minimo: {
          type: SchemaType.NUMBER,
          description: "La cantidad mínima sugerida antes de necesitar reponer. Usa 0 o un valor lógico si el usuario no lo provee."
        }
      },
      required: [
        "nombre",
        "categoria",
        "unidad_medida",
        "precio_actual",
        "stock_actual",
        "stock_minimo"
      ]
    }
  },
  {
    name: "create_sticky",
    description: "Publica una nota adhesiva/mensaje rápido en el Dashboard de todos los usuarios.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        content: {
          type: SchemaType.STRING,
          description: "Contenido del mensaje"
        },
        color: {
          type: SchemaType.STRING,
          description: "Color (yellow, green, pink, blue, purple)"
        }
      },
      required: [
        "content"
      ]
    }
  },
  // --- PACIENTES E HISTORIAL CLÍNICO ---
  {
    name: "create_patient",
    description: "Da de alta a un paciente o socio nuevo en el sistema (requiere rol médico o admin).",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        name: {
          type: SchemaType.STRING,
          description: "Nombre completo del paciente"
        },
        reprocannNumber: {
          type: SchemaType.STRING,
          description: "Número de REPROCANN o licencia (opcional)"
        },
        notes: {
          type: SchemaType.STRING,
          description: "Notas médicas o diagnósticos"
        }
      },
      required: [
        "name"
      ]
    }
  },
  {
    name: "create_medical_evolution",
    description: "Crea un nuevo registro de visita, control médico o evolución clínica para un paciente.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        patientId: {
          type: SchemaType.STRING,
          description: "UUID del paciente. SIEMPRE búscalo antes usando get_patients."
        },
        title: {
          type: SchemaType.STRING,
          description: "Título de la consulta (ej. Control Mensual, Renovación, Primera Consulta)"
        },
        eva_score: {
          type: SchemaType.INTEGER,
          description: "Puntaje de dolor en la Escala Visual Analógica (EVA) del 0 al 10."
        },
        notes: {
          type: SchemaType.STRING,
          description: "Notas clínicas detalladas, diagnóstico y observaciones del médico."
        },
        next_follow_up_months: {
          type: SchemaType.INTEGER,
          description: "Meses para el próximo control médico sugerido (ej. 3, 6, 12). Default: 6"
        }
      },
      required: [
        "patientId",
        "title",
        "eva_score",
        "notes"
      ]
    }
  },
  // --- DISPENSARIO (ACCIÓN) ---
  {
    name: "dispense_stock",
    description: "Registra una entrega, venta o retiro de productos de la asociación hacia un paciente.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        batchId: {
          type: SchemaType.STRING,
          description: "UUID del lote o frasco a descontar. OBLIGATORIO buscarlo con get_dispensary_stock."
        },
        patientId: {
          type: SchemaType.STRING,
          description: "UUID del paciente que retira. OBLIGATORIO buscarlo con get_patients."
        },
        amount: {
          type: SchemaType.NUMBER,
          description: "Cantidad retirada en gramos o unidades."
        },
        reason: {
          type: SchemaType.STRING,
          description: "Motivo, método de pago o nota breve para el ticket de entrega."
        },
        transaction_value: {
          type: SchemaType.NUMBER,
          description: "Monto monetario de la transacción si requiere aporte (opcional)."
        }
      },
      required: [
        "batchId",
        "patientId",
        "amount",
        "reason"
      ]
    }
  },
  // --- LECTURAS (READ-ONLY RAG TOOLS) ---
  {
    name: "get_patients",
    description: "Busca y devuelve la lista de pacientes registrados. Úsalo para obtener UUIDs de pacientes, estado del REPROCANN o buscar el nombre de un socio particular.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        searchName: {
          type: SchemaType.STRING,
          description: "Nombre a buscar (opcional)."
        }
      }
    }
  },
  {
    name: "get_patient_details",
    description: "Obtiene el historial clínico profundo de un paciente: su admisión, evoluciones, seguimientos médicos. Requiere el patientId.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        patientId: {
          type: SchemaType.STRING,
          description: "UUID del paciente a consultar. Búscalo con get_patients si no lo tienes."
        }
      },
      required: ["patientId"]
    }
  },
  {
    name: "get_dispensary_stock",
    description: "Obtiene la carta o inventario actual del dispensario (Flores, Aceites, Extractos). Muestra el stock disponible y el batchId para despachar.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {}
    }
  },
  {
    name: "get_active_crops",
    description: "Busca y devuelve la lista de cultivos (spots) que están activos actualmente. Úsalo cuando necesites saber qué cultivos existen.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {}
    }
  },
  {
    name: "get_rooms_for_crop",
    description: "Obtiene las salas y el detalle de lotes de plantas de un cultivo puntual. Úsalo si te preguntan detalles, ubicación o progreso de plantas en un cultivo.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        cropId: {
          type: SchemaType.STRING,
          description: "UUID del cultivo. ¡Nunca inventes esto! Tráelo primero usando get_active_crops si no lo sabes."
        }
      },
      required: [
        "cropId"
      ]
    }
  },
  {
    name: "get_batch_details",
    description: "Obtiene detalles precisos de las genéticas, fechas de inicio y días de vida de lotes. Úsalo si te preguntan puntualmente por una genética, cuánto le falta para cosechar, o detalles de una raza específica.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        roomId: {
          type: SchemaType.STRING,
          description: "El UUID de la sala (opcional si buscas en toda la granja, pero recomendado)"
        },
        geneticName: {
          type: SchemaType.STRING,
          description: "El nombre de la genética (ej: 'Amnesia', 'White Widow') si el usuario preguntó por ella."
        }
      }
    }
  },
  {
    name: "get_pending_tasks",
    description: "Devuelve la agenda de tareas pendientes en el calendario. Úsalo cuando te pregunten 'qué tengo que hacer', 'tareas de hoy' o temas de planificación.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        assignedToName: {
          type: SchemaType.STRING,
          description: "Nombre de la persona asignada para filtrar (opcional)."
        }
      }
    }
  },
  {
    name: "get_financial_summary",
    description: "Obtiene un resumen de todos los gastos e ingresos financieros del mes en curso para la organización. Úsalo cuando pregunten por plata, gastos, inversiones o ingresos.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {}
    }
  },
  {
    name: "get_organization_overview",
    description: "Consulta un resumen global ultra rápido de TrazAPP: cantidad de cultivos, tareas totales y eventos. Ideal para arrancar una conversación.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {}
    }
  },
  {
    name: "read_financial_report",
    description: "Genera o lee un informe pericial y profesional sobre el estado financiero de la organización anual o histórico. Úsalo si te piden 'resumen de viabilidad comercial', 'analizar flujo de caja', 'en qué gastamos más', etc. Te devolverá ingresos, gastos y estructura de costos.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        year: {
          type: SchemaType.INTEGER,
          description: "Año del que se quieren medir las métricas. Por defecto manda el actual."
        }
      }
    }
  },
  {
    name: "read_agricultural_report",
    description: "Genera o lee un informe pericial y profesional sobre el estado agronómico o de rendimiento empírico del cultivo. Úsalo si te piden 'analizar el rendimiento', 'efectividad de enraizamiento', 'qué genéticas rinden más', 'causas de mortalidad' o 'análisis de laboratorio'.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {}
    }
  }
];
