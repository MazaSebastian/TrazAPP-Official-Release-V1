-- Supabase Schema for Pheno Hunts (Genetics R&D Phase 4)

-- Table to store a "Pheno Hunt" session representing the seeds/offspring of a Cross Node
CREATE TABLE IF NOT EXISTS pheno_hunts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    lineage_node_id TEXT NOT NULL REFERENCES genetics_lineage_nodes(id) ON DELETE CASCADE,
    batch_size INTEGER NOT NULL DEFAULT 0, -- Number of seeds germinated
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'completed', 'abandoned'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table to store individual phenotypes within a Pheno Hunt
CREATE TABLE IF NOT EXISTS phenotypes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    hunt_id UUID NOT NULL REFERENCES pheno_hunts(id) ON DELETE CASCADE,
    pheno_number INTEGER NOT NULL, -- e.g., phenotype #1, #2, #3
    status TEXT NOT NULL DEFAULT 'evaluating', -- 'evaluating', 'discarded', 'keeper'
    sex TEXT, -- 'male', 'female', 'hermin', null (unknown)
    traits JSONB DEFAULT '[]'::jsonb, -- dynamic array of observed traits/notes
    photos JSONB DEFAULT '[]'::jsonb, -- array of photo URLs
    promoted_genetic_id UUID REFERENCES genetics(id) ON DELETE SET NULL, -- If it becomes a keeper, link to the official genetic entry created
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies For Multi-Tenancy
ALTER TABLE pheno_hunts ENABLE ROW LEVEL SECURITY;
ALTER TABLE phenotypes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their organization's pheno hunts" 
ON pheno_hunts FOR ALL 
USING (org_id IN (
  SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
));

CREATE POLICY "Users can manage their organization's phenotypes" 
ON phenotypes FOR ALL 
USING (org_id IN (
  SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
));
