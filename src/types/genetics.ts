export type GeneticType = 'automatic' | 'photoperiodic';

export interface Genetic {
    id: string;
    name: string;
    type: GeneticType;
    vegetative_weeks: number;
    flowering_weeks: number;
    breeder?: string | null;
    description?: string | null;
    acquisition_date?: string | null;
    thc_percent?: number | null;
    cbd_percent?: number | null;
    estimated_yield_g?: number | null;
    default_price_per_gram?: number | null;
    nomenclatura?: string | null;
    color?: string; // Hex color for distinct chart/map displays
    photo_url?: string | null; // Product/Mother photo
    created_at: string;
}

export interface PhenotypeTrait {
    category: string; // e.g. 'growth', 'yield', 'terpene'
    description: string;
}

export interface Phenotype {
    id: string;
    hunt_id: string;
    pheno_number: number;
    status: 'evaluating' | 'discarded' | 'keeper';
    sex?: 'male' | 'female' | 'hermin' | null;
    traits: PhenotypeTrait[];
    photos: string[];
    promoted_genetic_id?: string | null;
    created_at: string;
    updated_at: string;
}

export interface PhenoHunt {
    id: string;
    lineage_node_id: string; // Refers to the React Flow crossNode ID
    batch_size: number;
    start_date: string;
    status: 'active' | 'completed' | 'abandoned';
    notes?: string | null;
    created_at: string;
    updated_at: string;
    phenotypes?: Phenotype[]; // Populated relation
}
