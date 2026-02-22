import { supabase, getSelectedOrgId } from './supabaseClient';

export type FieldType = 'text' | 'textarea' | 'select' | 'checkbox' | 'date' | 'eva';

export interface FormField {
    id: string;
    type: FieldType;
    label: string;
    required: boolean;
    options?: string[]; // Used only if type is 'select' or 'checkbox' multiple
}

export interface ClinicalTemplate {
    id: string;
    organization_id: string;
    created_by: string;
    name: string;
    description: string | null;
    is_active: boolean;
    fields: FormField[];
    created_at?: string;
    updated_at?: string;
}

export const templatesService = {
    // 1. Get all active templates for the organization
    async getTemplates(): Promise<ClinicalTemplate[]> {
        if (!supabase) return [];

        const { data, error } = await supabase
            .from('clinical_templates')
            .select('*')
            .eq('organization_id', getSelectedOrgId())
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching templates:', error);
            return [];
        }
        return data as ClinicalTemplate[];
    },

    // 2. Get a single template by ID
    async getTemplateById(id: string): Promise<ClinicalTemplate | null> {
        if (!supabase) return null;

        const { data, error } = await supabase
            .from('clinical_templates')
            .select('*')
            .eq('id', id)
            .eq('organization_id', getSelectedOrgId())
            .single();

        if (error) {
            console.error('Error fetching template:', error);
            return null;
        }
        return data as ClinicalTemplate;
    },

    // 3. Create a new template (Dynamic JSON fields)
    async createTemplate(templateData: Omit<ClinicalTemplate, 'id' | 'organization_id' | 'created_by' | 'created_at' | 'updated_at'>): Promise<ClinicalTemplate | null> {
        if (!supabase) return null;

        const { data: { user } } = await supabase.auth.getUser();

        const payload = {
            ...templateData,
            organization_id: getSelectedOrgId(),
            created_by: user?.id
        };

        const { data, error } = await supabase
            .from('clinical_templates')
            .insert([payload])
            .select()
            .single();

        if (error) {
            console.error('Error creating template:', error);
            throw error;
        }

        return data as ClinicalTemplate;
    },

    // 4. Update an existing template
    async updateTemplate(id: string, updates: Partial<ClinicalTemplate>): Promise<ClinicalTemplate | null> {
        if (!supabase) return null;

        const { data, error } = await supabase
            .from('clinical_templates')
            .update(updates)
            .eq('id', id)
            .eq('organization_id', getSelectedOrgId())
            .select()
            .single();

        if (error) {
            console.error('Error updating template:', error);
            throw error;
        }

        return data as ClinicalTemplate;
    },

    // 5. Delete (Soft delete by setting is_active = false)
    async deleteTemplate(id: string): Promise<boolean> {
        if (!supabase) return false;

        const { error } = await supabase
            .from('clinical_templates')
            .update({ is_active: false })
            .eq('id', id)
            .eq('organization_id', getSelectedOrgId());

        if (error) {
            console.error('Error deleting template:', error);
            return false;
        }

        return true;
    }
};
