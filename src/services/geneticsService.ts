import { supabase, getSelectedOrgId } from './supabaseClient';
import { Genetic, PhenoHunt, Phenotype } from '../types/genetics';

const getClient = () => {
    if (!supabase) throw new Error("Supabase client not initialized");
    return supabase;
};

export const geneticsService = {
    async getGenetics(): Promise<Genetic[]> {
        const { data, error } = await getClient()
            .from('genetics')
            .select('*')
            .eq('organization_id', getSelectedOrgId())
            .order('name');

        if (error) {
            console.error('Error fetching genetics:', error);
            return [];
        }
        return data || [];
    },

    async createGenetic(genetic: Omit<Genetic, 'id' | 'created_at'>): Promise<Genetic | null> {
        const { data, error } = await getClient()
            .from('genetics')
            .insert([{ ...genetic, organization_id: getSelectedOrgId() }])
            .select()
            .single();

        if (error) {
            console.error('Error creating genetic:', error);
            return null;
        }
        return data;
    },

    async updateGenetic(id: string, updates: Partial<Genetic>): Promise<boolean> {
        const { error } = await getClient()
            .from('genetics')
            .update(updates)
            .eq('id', id)
            .eq('organization_id', getSelectedOrgId());

        if (error) {
            console.error('Error updating genetic:', error);
            return false;
        }
        return true;
    },

    async deleteGenetic(id: string): Promise<boolean> {
        const { error } = await getClient()
            .from('genetics')
            .delete()
            .eq('id', id)
            .eq('organization_id', getSelectedOrgId());

        if (error) {
            console.error('Error deleting genetic:', error);
            return false;
        }
        return true;
    },

    async getActiveBatchesForGenetic(geneticId: string): Promise<any[]> {
        const { data, error } = await getClient()
            .from('batches')
            .select('quantity, stage, current_room_id, room:rooms(id, name, spot_id, spot:chakra_crops(id, name))')
            .eq('genetic_id', geneticId)
            // exclude 'completed' and 'discarded'
            .neq('stage', 'completed')
            .neq('stage', 'discarded');

        if (error) {
            console.error('Error fetching active batches for genetic:', error);
            return []; // Return empty array on error
        }
        return data || [];
    },

    async discardOrphanedBatches(geneticId: string): Promise<boolean> {
        const { error } = await getClient()
            .from('batches')
            .update({ stage: 'completed' })
            .eq('genetic_id', geneticId)
            .is('current_room_id', null)
            .neq('stage', 'completed');

        if (error) {
            console.error('Error discarding orphaned batches:', error);
            return false;
        }
        return true;
    },

    async uploadPhoto(file: File, geneticId: string): Promise<string | null> {
        const fileExt = file.name.split('.').pop();
        const fileName = `${geneticId}-${Date.now()}.${fileExt}`;
        const filePath = `${getSelectedOrgId()}/${fileName}`;

        const { error: uploadError } = await getClient()
            .storage
            .from('genetic_photos')
            .upload(filePath, file);

        if (uploadError) {
            console.error('Error uploading photo:', uploadError);
            return null;
        }

        const { data } = getClient()
            .storage
            .from('genetic_photos')
            .getPublicUrl(filePath);

        return data.publicUrl;
    },

    // --- R&D Canvas Persistence ---
    async saveCanvasState(nodes: any[], edges: any[]): Promise<boolean> {
        const orgId = getSelectedOrgId();
        if (!orgId) return false;

        const formattedNodes = nodes.map(n => {
            // Extract dimensions directly or from internal measured state
            const width = n.width || n.measured?.width || n.style?.width;
            const height = n.height || n.measured?.height || n.style?.height;
            
            return {
                id: n.id,
                org_id: orgId,
                type: n.type,
                position_x: n.position.x,
                position_y: n.position.y,
                data: { ...n.data, width, height },
                updated_at: new Date().toISOString()
            };
        });

        const formattedEdges = edges.map(e => ({
            id: e.id,
            org_id: orgId,
            source: e.source,
            target: e.target,
            type: e.type || 'smoothstep',
            animated: e.animated !== false
        }));

        try {
            // Upsert Nodes
            if (formattedNodes.length > 0) {
                const { error: nodeError } = await getClient()
                    .from('genetics_lineage_nodes')
                    .upsert(formattedNodes, { onConflict: 'id' });
                if (nodeError) throw nodeError;
            }

            // Upsert Edges
            if (formattedEdges.length > 0) {
                const { error: edgeError } = await getClient()
                    .from('genetics_lineage_edges')
                    .upsert(formattedEdges, { onConflict: 'id' });
                if (edgeError) throw edgeError;
            }

            // Cleanup deleted items
            const nodeIds = formattedNodes.map(n => n.id);
            const edgeIds = formattedEdges.map(e => e.id);

            // If empty array passed, delete all for org. Otherwise delete those not in array
            if (nodeIds.length > 0) {
                await getClient()
                    .from('genetics_lineage_nodes')
                    .delete()
                    .eq('org_id', orgId)
                    .not('id', 'in', `(${nodeIds.join(',')})`);
            } else {
                 await getClient().from('genetics_lineage_nodes').delete().eq('org_id', orgId);
            }

             if (edgeIds.length > 0) {
                await getClient()
                    .from('genetics_lineage_edges')
                    .delete()
                    .eq('org_id', orgId)
                    .not('id', 'in', `(${edgeIds.join(',')})`);
            } else {
                 await getClient().from('genetics_lineage_edges').delete().eq('org_id', orgId);
            }

            return true;
        } catch (error) {
            console.error('Error saving R&D Canvas state:', error);
            return false;
        }
    },

    async loadCanvasState(): Promise<{ nodes: any[], edges: any[] }> {
        const orgId = getSelectedOrgId();
        if (!orgId) return { nodes: [], edges: [] };

        const { data: nodesData, error: nodesError } = await getClient()
            .from('genetics_lineage_nodes')
            .select('*')
            .eq('org_id', orgId);

        if (nodesError) console.error("Error loading nodes:", nodesError);

        const { data: edgesData, error: edgesError } = await getClient()
            .from('genetics_lineage_edges')
            .select('*')
            .eq('org_id', orgId);
            
         if (edgesError) console.error("Error loading edges:", edgesError);

         const formattedNodes = (nodesData || []).map(n => {
             // Rehydrate dimensions back into node style to persist Resizer visuals
             const style = (n.data.width && n.data.height) 
                ? { width: n.data.width, height: n.data.height } 
                : undefined;

             return {
                 id: n.id,
                 type: n.type,
                 position: { x: Number(n.position_x), y: Number(n.position_y) },
                 data: n.data,
                 style
             };
         });

         const formattedEdges = (edgesData || []).map(e => ({
             id: e.id,
             source: e.source,
             target: e.target,
             type: e.type,
             animated: e.animated
         }));

         return { nodes: formattedNodes, edges: formattedEdges };
    },

    // --- Phase 4: Pheno Hunting ---
    async getPhenoHuntByNodeId(nodeId: string): Promise<PhenoHunt | null> {
        const orgId = getSelectedOrgId();
        if (!orgId) return null;

        const { data, error } = await getClient()
            .from('pheno_hunts')
            .select(`
                *,
                phenotypes (*)
            `)
            .eq('org_id', orgId)
            .eq('lineage_node_id', nodeId)
            .single();

        if (error && error.code !== 'PGRST116') { // Ignore "no rows returned" error
            console.error('Error fetching pheno hunt:', error);
            return null;
        }

        if (data) {
            // Sort phenotypes by number
            if (data.phenotypes) {
                data.phenotypes.sort((a: any, b: any) => a.pheno_number - b.pheno_number);
            }
        }
        
        return data as PhenoHunt | null;
    },

    async createPhenoHunt(lineageNodeId: string, batchSize: number): Promise<PhenoHunt | null> {
        const orgId = getSelectedOrgId();
        if (!orgId) return null;

        // 1. Create the Hunt
        const { data: hunt, error: huntError } = await getClient()
            .from('pheno_hunts')
            .insert([{
                org_id: orgId,
                lineage_node_id: lineageNodeId,
                batch_size: batchSize
            }])
            .select()
            .single();

        if (huntError) {
            console.error('Error creating pheno hunt:', huntError);
            return null;
        }

        // 2. Pre-generate the individual phenotypes for the batch
        const phenotypesToCreate = Array.from({ length: batchSize }, (_, i) => ({
            org_id: orgId,
            hunt_id: hunt.id,
            pheno_number: i + 1,
            status: 'evaluating'
        }));

        const { error: phenosError } = await getClient()
            .from('phenotypes')
            .insert(phenotypesToCreate);

        if (phenosError) {
             console.error('Error generating phenotype batch:', phenosError);
             return null;
        }

        // 3. Return full hunt
        return this.getPhenoHuntByNodeId(lineageNodeId);
    },

    async updatePhenotype(id: string, updates: Partial<Phenotype>): Promise<boolean> {
        const orgId = getSelectedOrgId();
        if (!orgId) return false;

        const { error } = await getClient()
            .from('phenotypes')
            .update({...updates, updated_at: new Date().toISOString()})
            .eq('id', id)
            .eq('org_id', orgId);

        if (error) {
            console.error('Error updating phenotype:', error);
            return false;
        }
        return true;
    }
};
