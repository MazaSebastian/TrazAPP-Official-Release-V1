import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient';
import { Organization } from '../types';
import { useAuth } from './AuthContext';

interface OrganizationContextType {
    currentOrganization: Organization | null;
    currentRole: string | null;
    organizations: Organization[];
    isLoading: boolean;
    selectOrganization: (orgId: string) => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isLoading: authIsLoading } = useAuth();

    // Derived local state for the UI
    const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
    const [currentRole, setCurrentRole] = useState<string | null>(null);
    const [organizations, setOrganizations] = useState<Organization[]>([]);

    // React Query declarative fetch: Only runs when auth is definitely finished and user exists
    const { data: memberData, isLoading: queryIsLoading } = useQuery({
        queryKey: ['userOrganizations', user?.id],
        queryFn: async () => {
            console.log('[OrgContext] React Query fetching for user:', user?.id);
            // Just in case, force Supabase to ensure its local session headers are synced
            await supabase.auth.getSession();
            await new Promise(resolve => setTimeout(resolve, 200));

            const { data, error } = await supabase
                .from('organization_members')
                .select(`
                    role,
                    organization_id,
                    organization:organizations(*)
                `)
                .eq('user_id', user?.id);

            if (error) {
                console.error('[OrgContext] Fetch error:', error);
                throw error;
            }
            return data || [];
        },
        enabled: !authIsLoading && !!user?.id,
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes to prevent flickering
        retry: 2 // Try twice if it fails (e.g., if RLS blocks it momentarily)
    });

    // We are loading if Auth is loading, OR if the Query is loading (and we expect it to load because there is a user)
    const isLoading = authIsLoading || (queryIsLoading && !!user?.id);

    // Sync derived state when Query data changes
    useEffect(() => {
        if (!user) {
            setOrganizations([]);
            setCurrentOrganization(null);
            setCurrentRole(null);
            return;
        }

        if (memberData) {
            const orgs = memberData.map((m: any) => m.organization).filter(Boolean) as Organization[];
            setOrganizations(orgs);
            console.log('[OrgContext] Synced orgs from query:', orgs.length);

            // Auto-select
            const storedOrgId = localStorage.getItem('selectedOrganizationId');
            let selectedOrg: Organization | null = null;

            if (storedOrgId) {
                selectedOrg = orgs.find(o => o.id === storedOrgId) || null;
            }
            if (!selectedOrg && orgs.length > 0) {
                selectedOrg = orgs[0];
            }

            if (selectedOrg) {
                setCurrentOrganization(selectedOrg);
                localStorage.setItem('selectedOrganizationId', selectedOrg.id);
                const mem = memberData.find((m: any) => m.organization_id === selectedOrg?.id);
                if (mem) {
                    setCurrentRole(mem.role);
                }
            }
        }
    }, [memberData, user]);

    const selectOrganization = (orgId: string) => {
        const org = organizations.find(o => o.id === orgId);
        if (org) {
            setCurrentOrganization(org);
            localStorage.setItem('selectedOrganizationId', org.id);

            // Re-fetch role for new context instantly from cached query data
            const mem = memberData?.find((m: any) => m.organization_id === org.id);
            if (mem) {
                setCurrentRole(mem.role);
            } else {
                // Fallback direct request
                supabase
                    .from('organization_members')
                    .select('role')
                    .eq('organization_id', org.id)
                    .eq('user_id', user?.id)
                    .single()
                    .then(({ data }) => {
                        if (data) setCurrentRole(data.role);
                    });
            }
        }
    };

    return (
        <OrganizationContext.Provider value={{ currentOrganization, currentRole, organizations, isLoading, selectOrganization }}>
            {children}
        </OrganizationContext.Provider>
    );
};

export const useOrganization = () => {
    const context = useContext(OrganizationContext);
    if (context === undefined) {
        throw new Error('useOrganization must be used within an OrganizationProvider');
    }
    return context;
};
