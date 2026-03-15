-- Supabase Schema for Genetics R&D Canvas Persistence
-- This table stores all the visual nodes (parents, crosses, phenotypes) positioned on the R&D Canvas.
CREATE TABLE IF NOT EXISTS genetics_lineage_nodes (
    id TEXT PRIMARY KEY, -- Maps directly to React Flow Node ID
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'geneticNode' or 'crossNode'
    position_x NUMERIC NOT NULL,
    position_y NUMERIC NOT NULL,
    data JSONB NOT NULL DEFAULT '{}'::jsonb, -- dynamic data like label, type, crossObjective, strainType
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- This table stores the visual edges (lines) connecting nodes on the canvas.
CREATE TABLE IF NOT EXISTS genetics_lineage_edges (
    id TEXT PRIMARY KEY, -- Maps directly to React Flow Edge ID
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    source TEXT NOT NULL REFERENCES genetics_lineage_nodes(id) ON DELETE CASCADE,
    target TEXT NOT NULL REFERENCES genetics_lineage_nodes(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'smoothstep',
    animated BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies For Multi-Tenancy
ALTER TABLE genetics_lineage_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE genetics_lineage_edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their organization's lineage nodes" 
ON genetics_lineage_nodes FOR ALL 
USING (org_id IN (
  SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
));

CREATE POLICY "Users can manage their organization's lineage edges" 
ON genetics_lineage_edges FOR ALL 
USING (org_id IN (
  SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
));
