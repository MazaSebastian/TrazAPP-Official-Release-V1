import { supabase, getSelectedOrgId } from './supabaseClient';
import { Batch } from '../types/rooms';

const getClient = () => {
    if (!supabase) throw new Error("Supabase client not initialized");
    return supabase;
};

export type TraceEventType = 'creation' | 'movement' | 'task' | 'expense' | 'harvest' | 'discard';

export interface TraceEvent {
    id: string;
    type: TraceEventType;
    date: string;
    title: string;
    description: string;
    metadata?: any;
    user?: string;
    icon?: React.ReactNode;
    color?: string; // Hex color for the timeline node
    affected_units?: { id: string, name: string, tracking_code?: string }[];
}

export interface BatchTraceabilityReport {
    batch: Batch;
    events: TraceEvent[];
}

export const reportsService = {
    async getAllBatchesForReporting(): Promise<Batch[]> {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('batches')
            .select(`
                *,
                room:current_room_id(name),
                genetic:genetic_id(name),
                children:batches!parent_batch_id(
                    id, 
                    name, 
                    tracking_code, 
                    discarded_at, 
                    discard_reason,
                    notes,
                    clone_map:clone_map_id(
                        name,
                        room:room_id(name, type)
                    )
                )
            `)
            .or('quantity.gt.1,and(quantity.eq.0,discard_reason.ilike.%Distribuido%)') // Lots are NOT individual plants, BUT we keep the "parents" that were emptied after assignment
            .is('clone_map_id', null) // Exclude active map individual plants just in case
            .eq('organization_id', getSelectedOrgId())
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching all batches for reporting:', error);
            return [];
        }
        return data || [];
    },

    async getBatchTraceability(batchId: string): Promise<BatchTraceabilityReport | null> {
        const supabase = getClient();

        // 1. Fetch Batch Details (Base data)
        const { data: batch, error: batchError } = await supabase
            .from('batches')
            .select(`
                *,
                room:current_room_id(name),
                genetic:genetic_id(name),
                children:batches!parent_batch_id(
                    id, 
                    name, 
                    tracking_code, 
                    discarded_at, 
                    discard_reason,
                    notes,
                    clone_map:clone_map_id(
                        name,
                        room:room_id(name, type)
                    )
                )
            `)
            .eq('id', batchId)
            .single();

        if (batchError || !batch) {
            console.error('Error fetching batch for traceability:', batchError);
            return null;
        }

        const events: TraceEvent[] = [];

        // --- EVENT 1: CREATION ---
        const batchDisplayName = batch.tracking_code ? `[${batch.tracking_code}] ${batch.name}` : batch.name;

        let initialQuantity = batch.quantity;
        const isDistributed = batch.quantity === 0 && batch.discard_reason?.includes('Distribuido en Mapa');
        if (isDistributed && (batch as any).children && (batch as any).children.length > 0) {
            initialQuantity = (batch as any).children[0].count !== undefined ? (batch as any).children[0].count : (batch as any).children.length;
        }

        events.push({
            id: `create-${batch.id}`,
            type: 'creation',
            date: batch.created_at,
            title: `Lote Creado: ${batchDisplayName}`,
            description: `Variedad: ${batch.genetic?.name || batch.strain || 'N/A'}. Cantidad inicial: ${initialQuantity} unidades.`,
            color: '#10b981' // Green
        });

        // 2. Fetch Movements
        const allBatchIds = [batchId];
        if ((batch as any).children) {
            (batch as any).children.forEach((c: any) => allBatchIds.push(c.id));
        }

        const { data: movements } = await supabase
            .from('batch_movements')
            .select(`
                *,
                from_room:from_room_id(name),
                to_room:to_room_id(name, type),
                clonemap:to_room_id(clone_maps(name)),
                batch:batch_id(tracking_code, name, parent_batch_id, group_name)
            `)
            .in('batch_id', allBatchIds)
            .order('moved_at', { ascending: true });

        if (movements) {
            // 1. Group mass events (e.g. 24 plants transplanted at once)
            const groups = new Map<string, any[]>();
            const noteGroups = new Map<string, any[]>();
            const mapGroups = new Map<string, any[]>(); // New group for map assignments
            const harvestGroups = new Map<string, any[]>(); // New group for harvest events
            const standaloneMovements: any[] = [];

            movements.forEach((movement: any) => {
                // Filter out automatic bulk assignments and discard audit logs to avoid cluttering/duplicating in the timeline
                if (movement.notes) {
                    if (
                        movement.notes.includes('Distribución Masiva') ||
                        movement.notes.startsWith('Eliminado/Baja')
                    ) {
                        return;
                    }
                }

                const isChildMove = movement.batch?.parent_batch_id === batchId;
                const isTransplant = movement.notes?.startsWith('Transplante:');
                const isNoteUpdate = movement.notes && (movement.notes.startsWith('Nota actualizada') || movement.notes.startsWith('Observación Registrada'));
                const isMapAssignment = movement.notes?.startsWith('Asignado a Mapa');
                const isHarvest = movement.notes?.startsWith('Cosechado y movido a Secado');

                if (isChildMove && isTransplant) {
                    // Group sibling child-transplants occurring exactly in the same minute
                    const minuteKey = movement.moved_at ? movement.moved_at.substring(0, 16) : 'unknown';
                    // We extract the actual "group name" which could be the manually inputted `group_name` 
                    // OR the automatically assigned child `batch.name` (which defaults to genetic in the UI).
                    let groupNameVal = movement.batch?.group_name || '';
                    if (!groupNameVal && movement.batch?.name) {
                        const parts = movement.batch.name.split('-');
                        if (parts.length > 1) {
                            // If it's a generated individual name like "Lote Zaza-123", we just want "Lote Zaza"
                            parts.pop();
                            groupNameVal = parts.join('-');
                        } else {
                            groupNameVal = movement.batch.name;
                        }
                    }
                    const groupKey = `${minuteKey}_${movement.to_room_id}_${groupNameVal}_${movement.notes}`;

                    if (!groups.has(groupKey)) {
                        groups.set(groupKey, []);
                    }
                    groups.get(groupKey)?.push(movement);
                } else if (isChildMove && isNoteUpdate) {
                    // Group sibling child-notes occurring exactly in the same minute with the same note
                    const minuteKey = movement.moved_at ? movement.moved_at.substring(0, 16) : 'unknown';
                    const groupKey = `NOTE_${minuteKey}_${movement.notes}`;

                    if (!noteGroups.has(groupKey)) {
                        noteGroups.set(groupKey, []);
                    }
                    noteGroups.get(groupKey)?.push(movement);
                } else if (isChildMove && isMapAssignment) {
                    // Group sibling child map assignments occurring exactly in the same minute
                    const minuteKey = movement.moved_at ? movement.moved_at.substring(0, 16) : 'unknown';

                    let groupNameVal = movement.batch?.group_name || '';
                    if (!groupNameVal && movement.batch?.name) {
                        const parts = movement.batch.name.split('-');
                        if (parts.length > 1) {
                            parts.pop();
                            groupNameVal = parts.join('-');
                        } else {
                            groupNameVal = movement.batch.name;
                        }
                    }

                    const groupKey = `MAP_${minuteKey}_${movement.to_room_id}_${groupNameVal}`;

                    if (!mapGroups.has(groupKey)) {
                        mapGroups.set(groupKey, []);
                    }
                    mapGroups.get(groupKey)?.push(movement);
                } else if (isChildMove && isHarvest) {
                    // Group sibling child harvest events occurring exactly in the same minute
                    const minuteKey = movement.moved_at ? movement.moved_at.substring(0, 16) : 'unknown';

                    let groupNameVal = movement.batch?.group_name || '';
                    if (!groupNameVal && movement.batch?.name) {
                        const parts = movement.batch.name.split('-');
                        if (parts.length > 1) {
                            parts.pop();
                            groupNameVal = parts.join('-');
                        } else {
                            groupNameVal = movement.batch.name;
                        }
                    }

                    const groupKey = `HARVEST_${minuteKey}_${movement.to_room_id}_${groupNameVal}`;

                    if (!harvestGroups.has(groupKey)) {
                        harvestGroups.set(groupKey, []);
                    }
                    harvestGroups.get(groupKey)?.push(movement);
                } else {
                    standaloneMovements.push(movement);
                }
            });

            // 2. Process grouped transplants
            const RoomTypeNames: Record<string, string> = {
                vegetation: 'Vegetación', flowering: 'Floración', drying: 'Secado', curing: 'Secado',
                mother: 'Madres', clones: 'Esquejes', general: 'General', germination: 'Germinación', living_soil: 'Living Soil'
            };
            groups.forEach((groupMovements, key) => {
                if (groupMovements.length === 1) {
                    // Just one item? No need to bulk it, treat as standalone
                    standaloneMovements.push(groupMovements[0]);
                } else {
                    const first = groupMovements[0];
                    const toName = first.to_room?.name || 'Destino Desconocido';

                    let groupName = first.batch?.group_name;
                    if (!groupName && first.batch?.name) {
                        const parts = first.batch.name.split('-');
                        if (parts.length > 1) {
                            parts.pop();
                            groupName = parts.join('-');
                        } else {
                            groupName = first.batch.name;
                        }
                    }
                    groupName = groupName?.trim();

                    const trackingCodes = groupMovements.map(m => m.batch?.tracking_code || m.batch?.name).filter(Boolean);
                    let unitsDescription = trackingCodes.join(', ');
                    if (trackingCodes.length > 10) {
                        unitsDescription = trackingCodes.slice(0, 10).join(', ') + `... y ${trackingCodes.length - 10} más`;
                    }

                    const affectedUnitsPayload = groupMovements.map(m => ({
                        id: m.batch?.id,
                        name: m.batch?.name,
                        tracking_code: m.batch?.tracking_code
                    }));

                    let availableQuantity = batch.quantity;
                    const isDistributed = batch.quantity === 0 && batch.discard_reason?.includes('Distribuido en Mapa');
                    if (isDistributed && (batch as any).children) {
                        availableQuantity = (batch as any).children.filter((c: any) => !c.discarded_at).length;
                    }

                    const baseDescription = `${groupMovements.length} plantas seleccionadas de / ${availableQuantity} unidades disponibles`;

                    const roomType = first.to_room?.type;
                    const roomTypeStr = RoomTypeNames[roomType as string] || 'Desconocido';

                    if (groupName) {
                        events.push({
                            id: `mov-group-${first.id}`,
                            type: 'creation', // Using creation to get the leaf/plant icon
                            date: first.moved_at,
                            title: `Acción de transplante - Lote ${batchDisplayName}`,
                            description: `${baseDescription} - Destino: ${toName} [${roomTypeStr}] - Grupo: "${groupName}"`,
                            color: '#10b981', // Emerald Green to match the transplant action button
                            affected_units: affectedUnitsPayload
                        });
                    } else {
                        events.push({
                            id: `mov-group-${first.id}`,
                            type: 'creation', // Using creation to get the leaf/plant icon
                            date: first.moved_at,
                            title: `Acción de transplante - Lote ${batchDisplayName}`,
                            description: `${baseDescription} - Destino: ${toName} [${roomTypeStr}]`,
                            color: '#10b981', // Emerald Green
                            affected_units: affectedUnitsPayload
                        });
                    }
                }
            });

            // 2b. Process grouped notes
            noteGroups.forEach((groupMovements, key) => {
                if (groupMovements.length === 1) {
                    // Just one item? Treat as standalone
                    standaloneMovements.push(groupMovements[0]);
                } else {
                    const first = groupMovements[0];
                    const geneticName = batch.genetic?.name || batch.strain || 'Genética';

                    const unitIdentifiers = groupMovements.map(m => {
                        const name = m.batch?.name || '';
                        const parts = name.split('-');
                        return parts.length > 1 ? parts[parts.length - 1] : name;
                    }).filter(Boolean);

                    let unitsDescription = unitIdentifiers.join(', ');
                    if (unitIdentifiers.length > 15) {
                        unitsDescription = unitIdentifiers.slice(0, 15).join(', ') + `... y ${unitIdentifiers.length - 15} más`;
                    }

                    const affectedUnitsPayload = groupMovements.map(m => ({
                        id: m.batch?.id,
                        name: m.batch?.name,
                        tracking_code: m.batch?.tracking_code
                    }));

                    events.push({
                        id: `mov-note-group-${first.id}`,
                        type: 'task', // task icon for notes
                        date: first.moved_at,
                        title: `Observación en Unidad: ${geneticName} - [${unitsDescription}]`,
                        description: first.notes || '',
                        color: '#f59e0b', // Amber
                        affected_units: affectedUnitsPayload
                    });
                }
            });

            // 2c. Process grouped map assignments
            mapGroups.forEach((groupMovements, key) => {
                if (groupMovements.length === 1) {
                    // Treat as standalone
                    standaloneMovements.push(groupMovements[0]);
                } else {
                    const first = groupMovements[0];
                    const toName = first.to_room?.name || 'Sala Desconocida';

                    let groupName = first.batch?.group_name;
                    if (!groupName && first.batch?.name) {
                        const parts = first.batch.name.split('-');
                        if (parts.length > 1) {
                            parts.pop();
                            groupName = parts.join('-');
                        } else {
                            groupName = first.batch.name;
                        }
                    }
                    groupName = groupName?.trim();
                    const groupDisplayName = groupName ? `Lote ${groupName}` : `Lote ${batchDisplayName}`;

                    const roomType = first.to_room?.type;
                    const roomTypeStr = RoomTypeNames[roomType as string] || 'Desconocido';

                    const affectedUnitsPayload = groupMovements.map(m => ({
                        id: m.batch?.id,
                        name: m.batch?.name,
                        tracking_code: m.batch?.tracking_code
                    }));

                    events.push({
                        id: `mov-map-group-${first.id}`,
                        type: 'movement', // Using movement icon for map assignment
                        date: first.moved_at,
                        title: `Asignación Masiva a Mapa / Mesa`,
                        description: `${groupDisplayName} ubicado en sala ${toName} [${roomTypeStr}]. Incluye ${groupMovements.length} unidades.`,
                        color: '#3b82f6', // Formatting as a blue movement
                        affected_units: affectedUnitsPayload
                    });
                }
            });

            // 2d. Process grouped harvest assignments
            harvestGroups.forEach((groupMovements, key) => {
                if (groupMovements.length === 1) {
                    // Treat as standalone
                    standaloneMovements.push(groupMovements[0]);
                } else {
                    const first = groupMovements[0];
                    const toName = first.to_room?.name || 'Sala Desconocida';

                    let groupName = first.batch?.group_name;
                    if (!groupName && first.batch?.name) {
                        const parts = first.batch.name.split('-');
                        if (parts.length > 1) {
                            parts.pop();
                            groupName = parts.join('-');
                        } else {
                            groupName = first.batch.name;
                        }
                    }
                    groupName = groupName?.trim();
                    const groupDisplayName = groupName ? `Lote ${groupName}` : `Lote ${batchDisplayName}`;

                    const roomType = first.to_room?.type;
                    const roomTypeStr = RoomTypeNames[roomType as string] || 'Secado';

                    // Group by genetic/prefix
                    const byGenetic: Record<string, string[]> = {};
                    groupMovements.forEach(m => {
                        const name = m.batch?.name || '';
                        const parts = name.split('-');
                        const prefix = parts.length > 1 ? parts.slice(0, -1).join('-') : name;
                        const unitNum = parts.length > 1 ? parts[parts.length - 1] : name;

                        if (!byGenetic[prefix]) byGenetic[prefix] = [];
                        byGenetic[prefix].push(unitNum);
                    });

                    let unitsDescription = Object.entries(byGenetic).map(([prefix, units]) => {
                        let unitList = units.join(', ');
                        if (units.length > 10) {
                            unitList = units.slice(0, 10).join(', ') + `... y ${units.length - 10} más`;
                        }
                        return `${prefix} [${unitList}]`;
                    }).join(', ');

                    const affectedUnitsPayload = groupMovements.map(m => ({
                        id: m.batch?.id,
                        name: m.batch?.name,
                        tracking_code: m.batch?.tracking_code
                    }));

                    events.push({
                        id: `mov-harvest-group-${first.id}`,
                        type: 'task', // task icon (could use a scissors/harvest one if available, but task maps to harvest generic usually, or warning)
                        date: first.moved_at,
                        title: `- Cosecha realizada - ${groupDisplayName}`,
                        description: `Cosecha realizada de las unidades [${unitsDescription}] enviado a la sala de ${toName} [${roomTypeStr}]`,
                        color: '#f97316', // Orange as requested
                        affected_units: affectedUnitsPayload
                    });
                }
            });

            // 3. Process regular standalone movements
            standaloneMovements.forEach((movement: any) => {
                const isChildMove = movement.batch?.parent_batch_id === batchId;
                const fromName = movement.from_room?.name || 'Origen Desconocido';
                const toName = movement.to_room?.name || 'Destino Desconocido';
                const isSameRoom = movement.from_room_id === movement.to_room_id;
                const isNoteUpdate = movement.notes && (movement.notes.startsWith('Nota actualizada') || movement.notes.startsWith('Observación Registrada'));
                const isCreationMove = !movement.from_room_id && movement.notes === 'Creación de Lote';

                const childName = movement.batch?.tracking_code ? `[${movement.batch.tracking_code}] ${movement.batch.name || ''}` : (movement.batch?.name || '');

                let title = isSameRoom ? `Reubicación en ${toName}` : `Traslado a ${toName}`;
                if (isChildMove) {
                    title = isSameRoom
                        ? `Reubicación de Unidad: ${childName}`
                        : `Traslado de Unidad: ${childName}`;
                }

                let descPrefix = isSameRoom ? `Movimiento interno en mapa/sala.` : `Movido desde ${fromName}.`;
                let eventColor = '#3b82f6'; // Blue
                let eventIconType = 'movement';

                if (isCreationMove) {
                    const roomTypeStr = RoomTypeNames[movement.to_room?.type as string] || 'Desconocido';
                    title = `Lote ${childName} - Creado por primera vez en sala tipo ${roomTypeStr}`;
                    descPrefix = '';
                    eventColor = '#10b981';
                    eventIconType = 'creation';
                } else if (isNoteUpdate) {
                    // Override if it's strictly a note update acting as a log
                    title = isChildMove
                        ? `Observación en Unidad: ${childName}`
                        : `Observación Registrada`;
                    descPrefix = ''; // Remove movement text
                    eventColor = '#f59e0b'; // Amber
                    eventIconType = 'task';
                }

                events.push({
                    id: `mov-${movement.id}`,
                    type: eventIconType as any,
                    date: movement.moved_at,
                    title: title,
                    description: isCreationMove ? (movement.notes || '') : (isNoteUpdate ? movement.notes : `${descPrefix} ${movement.notes ? `Notas: ${movement.notes}` : ''}`),
                    color: eventColor
                });
            });
        }

        // 3. Fetch Daily Logs (Tasks)
        const { data: logs } = await supabase
            .from('logs')
            .select('*')
            .eq('batch_id', batchId)
            .order('created_at', { ascending: true });

        if (logs) {
            logs.forEach((log: any) => {
                events.push({
                    id: `log-${log.id}`,
                    type: 'task',
                    date: log.created_at,
                    title: `Tarea: ${translateActivityType(log.activity_type)}`,
                    description: log.notes || 'Sin observaciones.',
                    color: '#f59e0b' // Amber
                });
            });
        }

        // 4. Fetch Expenses/Insumos (Optional, depending on DB structure)
        // If expenses are linked via batch_id directly:
        const { data: expenses } = await supabase
            .from('expenses')
            .select('*')
            .eq('batch_id', batchId)
            .order('date', { ascending: true });

        if (expenses) {
            expenses.forEach((expense: any) => {
                events.push({
                    id: `exp-${expense.id}`,
                    type: 'expense',
                    date: expense.date,
                    title: `Aplicación de Insumo`,
                    description: `${expense.description} - Cantidad: ${expense.amount}`,
                    color: '#8b5cf6' // Purple
                });
            });
        }

        // 5. Fetch Harvest/Discards (End of life)
        // Checking if discarded:
        if (batch.discarded_at || batch.status === 'discarded') {
            const isMapDistribution = batch.discard_reason?.includes('Distribuido en Mapa');
            const isFinalized = batch.discard_reason?.includes('Finalizado a Stock');

            let mapDistroDesc = `El lote fue distribuido a un espacio de trabajo activo. (${batch.discard_reason})`;

            if (isMapDistribution && (batch as any).children && (batch as any).children.length > 0) {
                const firstChildMap = (batch as any).children.find((c: any) => c.clone_map)?.clone_map;
                if (firstChildMap) {
                    const RoomTypeNames: Record<string, string> = {
                        vegetation: 'Vegetación', flowering: 'Floración', drying: 'Secado', curing: 'Secado',
                        mother: 'Madres', clones: 'Esquejes', general: 'General', germination: 'Germinación', living_soil: 'Living Soil'
                    };

                    const mapName = firstChildMap.name;
                    const roomName = firstChildMap.room?.name || 'Sala Desconocida';
                    const roomType = firstChildMap.room?.type;
                    const roomTypeStr = RoomTypeNames[roomType as string] || 'Desconocido';

                    mapDistroDesc = `Lote ${mapName} - Ubicado en sala ${roomName} [${roomTypeStr}]`;
                } else {
                    mapDistroDesc = `Distribuido en mapa - Destino Desconocido`;
                }
            }

            let eventTitle = 'Lote Descartado / Finalizado';
            let eventDesc = `Motivo: ${batch.discard_reason || 'Sin especificar'}`;
            let eventColor = '#ef4444'; // Red
            let eventType = 'discard';

            if (isMapDistribution) {
                eventTitle = 'Asignación a Mapa / Mesa';
                eventDesc = mapDistroDesc;
                eventColor = '#3b82f6'; // Blue
                eventType = 'movement';
            } else if (isFinalized) {
                eventTitle = `- Cosecha finalizada - ${batchDisplayName}`;
                eventDesc = `Materia resultante del lote ${batchDisplayName}. ${batch.notes || ''}`;
                eventColor = '#10b981'; // Green for completion
                eventType = 'creation'; // Leaf/Creation icon for successful harvest
            }

            events.push({
                id: `discard-${batch.id}`,
                type: eventType as any,
                date: batch.discarded_at || batch.updated_at,
                title: eventTitle,
                description: eventDesc,
                color: eventColor
            });
        }

        // 6. Integrate Child Events (Discards of individual units)
        const isDistributedAgain = batch.quantity === 0 && batch.discard_reason?.includes('Distribuido en Mapa');
        if (isDistributedAgain && (batch as any).children) {
            const discardGroups = new Map<string, any[]>();
            const standaloneDiscards: any[] = [];

            (batch as any).children.forEach((child: any) => {
                if (child.discarded_at || child.status === 'discarded') {
                    // Group discards occurring in the same minute with the same reason
                    const minuteKey = child.discarded_at ? child.discarded_at.substring(0, 16) : child.updated_at.substring(0, 16);
                    const reasonKey = child.discard_reason || 'Sin especificar';

                    // Extract Genetic prefix (e.g., FNCGUM from FNCGUM-093)
                    const trackingPrefix = child.tracking_code ? child.tracking_code.split('-')[0] : 'Desconocido';

                    const groupKey = `${minuteKey}_${reasonKey}_${trackingPrefix}`;

                    if (!discardGroups.has(groupKey)) {
                        discardGroups.set(groupKey, []);
                    }
                    discardGroups.get(groupKey)?.push(child);
                }
            });

            // Process grouped discards
            discardGroups.forEach((groupDiscards, key) => {
                if (groupDiscards.length === 1) {
                    standaloneDiscards.push(groupDiscards[0]);
                } else {
                    const first = groupDiscards[0];
                    const trackingPrefix = first.tracking_code ? first.tracking_code.split('-')[0] : 'Unidades';

                    // Extract just the suffixes for a cleaner list (e.g., 093, 075)
                    const suffixes = groupDiscards.map(c => {
                        if (c.tracking_code && c.tracking_code.includes('-')) {
                            return c.tracking_code.split('-')[1];
                        }
                        return c.name || 'N/A';
                    }).filter(Boolean);

                    let unitsDescription = suffixes.join(', ');
                    if (suffixes.length > 15) {
                        unitsDescription = suffixes.slice(0, 15).join(', ') + `... y ${suffixes.length - 15} más`;
                    }

                    const isFinalized = first.discard_reason?.includes('Finalizado a Stock');

                    if (isFinalized) {
                        let totalWeight = 0;
                        let customNotes = '';
                        groupDiscards.forEach(c => {
                            const weightMatch = c.notes?.match(/Rinde Total: ([\d.]+)g/);
                            if (weightMatch) {
                                totalWeight += parseFloat(weightMatch[1]);
                            }
                            // Extract user notes if any, removing our injected text
                            if (c.notes && c.notes !== first.notes) {
                                // Skip, just use first notes for custom text to avoid duplication
                            }
                        });

                        // Attempt to extract the custom note from the first item
                        const noteParts = first.notes?.split('g. ');
                        if (noteParts && noteParts.length > 1) {
                            customNotes = noteParts.slice(1).join('g. ').trim();
                        }

                        events.push({
                            id: `discard-group-${first.id}`,
                            type: 'creation', // Green success icon
                            date: first.discarded_at || first.updated_at,
                            title: `- Cosecha finalizada - ${batchDisplayName}`,
                            description: `Cosecha finalizada. Materia resultante del lote ${batchDisplayName} total: ${Math.round(totalWeight)}g. ${customNotes}`,
                            color: '#10b981' // Green
                        });

                    } else {
                        events.push({
                            id: `discard-group-${first.id}`,
                            type: 'discard',
                            date: first.discarded_at || first.updated_at,
                            title: `Baja de Unidad Individual: ${trackingPrefix} - ${unitsDescription}.`,
                            description: `Motivo: ${first.discard_reason || 'Sin especificar'}`,
                            color: '#ef4444' // Red
                        });
                    }
                }
            });

            // Process regular standalone discards
            standaloneDiscards.forEach((child: any) => {
                const isFinalized = child.discard_reason?.includes('Finalizado a Stock');

                if (isFinalized) {
                    let totalWeight = 0;
                    let customNotes = '';
                    const weightMatch = child.notes?.match(/Rinde Total: ([\d.]+)g/);
                    if (weightMatch) {
                        totalWeight = parseFloat(weightMatch[1]);
                    }
                    const noteParts = child.notes?.split('g. ');
                    if (noteParts && noteParts.length > 1) {
                        customNotes = noteParts.slice(1).join('g. ').trim();
                    }

                    events.push({
                        id: `child-discard-${child.id}`,
                        type: 'creation',
                        date: child.discarded_at || child.updated_at,
                        title: `- Cosecha finalizada - ${child.tracking_code || child.name}`,
                        description: `Cosecha finalizada. Materia resultante del lote ${child.tracking_code || child.name} total: ${Math.round(totalWeight)}g. ${customNotes}`,
                        color: '#10b981' // Green
                    });
                } else {
                    events.push({
                        id: `child-discard-${child.id}`,
                        type: 'discard', // Force discard icon
                        date: child.discarded_at || child.updated_at,
                        title: `Baja de Unidad Individual: ${child.tracking_code || child.name}`,
                        description: `Motivo: ${child.discard_reason || 'Sin especificar'}`,
                        color: '#ef4444' // Red
                    });
                }
            });
        }

        // Sort all events chronologically
        events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return {
            batch,
            events
        };
    }
};

function translateActivityType(type: string): string {
    const map: Record<string, string> = {
        'watering': 'Riego',
        'feeding': 'Nutrición',
        'pruning': 'Poda',
        'transplant': 'Trasplante',
        'harvest': 'Cosecha',
        'inspection': 'Inspección',
        'cleaning': 'Limpieza',
        'pest_control': 'Control de Plagas',
        'defoliation': 'Defoliación',
        'training': 'Entrenamiento (LST/HST)',
        'cloning': 'Esquejado',
        'flushing': 'Lavado de Raíces',
        'drying': 'Secado',
        'curing': 'Curado',
        'packaging': 'Empaquetado',
        'testing': 'Análisis de Laboratorio',
        'waste_disposal': 'Descarte de Residuos',
        'other': 'Otra'
    };
    return map[type] || type;
}
