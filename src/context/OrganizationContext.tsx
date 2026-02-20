import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Organization } from '../types';
import { useAuth } from './AuthContext';

interface OrganizationContextType {
    currentOrganization: Organization | null;
    organizations: Organization[];
    isLoading: boolean;
    selectOrganization: (orgId: string) => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
    const [organizations, setOrganizations] = useState<Organization[]>([]);

    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        if (user) {
            fetchUserOrganizations();
        } else {
            setOrganizations([]);
            setCurrentOrganization(null);
            setIsLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const fetchUserOrganizations = async () => {
        setIsLoading(true);
        try {
            // Fetch members and join organizations
            // Note: RLS should filter this to only my memberships
            const { data, error } = await supabase
                .from('organization_members')
                .select(`
                    *,
                    organization:organizations(*)
                `)
                .eq('user_id', user?.id);

            if (error) {
                console.error('Error fetching organizations:', error);
                return;
            }

            if (data) {
                // Extract organizations from the join
                const orgs = data.map((member: any) => member.organization).filter((org: any) => org !== null) as Organization[];
                setOrganizations(orgs);

                // Auto-select first org if none selected or if only one exists
                const storedOrgId = localStorage.getItem('selectedOrganizationId');
                let selectedOrg = null;

                if (storedOrgId) {
                    selectedOrg = orgs.find(o => o.id === storedOrgId);
                }

                if (!selectedOrg && orgs.length > 0) {
                    selectedOrg = orgs[0];
                }

                if (selectedOrg) {
                    setCurrentOrganization(selectedOrg);
                    localStorage.setItem('selectedOrganizationId', selectedOrg.id);
                    // Fetch plan details for the selected org
                    // In a real app we might cache this or fetch it with the org
                    // For now, we'll fetch it separately if needed, or rely on what we have
                }
            }
        } catch (error) {
            console.error('Unexpected error fetching organizations:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const selectOrganization = (orgId: string) => {
        const org = organizations.find(o => o.id === orgId);
        if (org) {
            setCurrentOrganization(org);
            localStorage.setItem('selectedOrganizationId', org.id);
        }
    };

    return (
        <OrganizationContext.Provider value={{ currentOrganization, organizations, isLoading, selectOrganization }}>
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
