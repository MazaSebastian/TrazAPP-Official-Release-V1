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
