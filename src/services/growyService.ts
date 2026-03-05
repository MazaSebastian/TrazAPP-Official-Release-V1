import { supabase } from './supabaseClient';

export interface GrowyActionProposal {
    name: string;
    args: any;
}

export interface GrowyResponse {
    type: 'text' | 'actions';
    content?: string;
    actionProposals?: GrowyActionProposal[];
}

export const growyService = {
    async sendMessage(prompt: string, contextState: any = null, orgId?: string, history: any[] = []): Promise<GrowyResponse> {
        try {
            const { data, error } = await supabase.functions.invoke('growy-gemini', {
                body: {
                    prompt,
                    contextState,
                    orgId,
                    history
                },
            });

            if (error) {
                console.error('Error invoking growy-gemini:', error);
                throw error;
            }

            if (data && data.success) {
                if (data.action_proposals && data.action_proposals.length > 0) {
                    return { type: 'actions', actionProposals: data.action_proposals };
                }
                return { type: 'text', content: data.response };
            } else {
                throw new Error(data?.error || 'Unknown error response from Growy');
            }
        } catch (err: any) {
            console.error('Growy Service Error:', err.message);
            throw err; // Propagate the real error instead of masking it to see the list of models
        }
    },
};
