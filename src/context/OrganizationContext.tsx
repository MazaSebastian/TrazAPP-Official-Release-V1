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
        if (!user?.id) {
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
    }, [memberData, user?.id]);

    // Inject CSS variables for deep White-Label customization
    useEffect(() => {
        if (currentOrganization) {
            const root = document.documentElement;

            const hexToRgb = (hex: string) => {
                const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : null;
            };

            const primary = currentOrganization.primary_color || 'var(--primary-color, #a855f7)';
            const secondary = currentOrganization.secondary_color || 'var(--secondary-color, #7c3aed)';

            // Provide a graceful fallback to original TrazAPP styling
            root.style.setProperty('--primary-color', primary);
            root.style.setProperty('--secondary-color', secondary);
            root.style.setProperty('--primary-color-rgb', hexToRgb(primary) || 'var(--primary-color-rgb, 168, 85, 247)');
            root.style.setProperty('--secondary-color-rgb', hexToRgb(secondary) || 'var(--secondary-color-rgb, 124, 58, 237)');

            // ---- DYNAMIC PWA MANIFEST HOMEPAGE ----
            let manifestLink = document.querySelector('link[rel="manifest"]');
            if (manifestLink) {
                const manifestParams = {
                    short_name: currentOrganization.name,
                    name: `Portal - ${currentOrganization.name}`,
                    icons: [
                        {
                            src: currentOrganization.logo_url || "/apple-touch-icon.png",
                            sizes: "192x192 512x512",
                            type: "image/png"
                        }
                    ],
                    start_url: `/${currentOrganization.slug}/portal`,
                    display: "standalone",
                    theme_color: primary,
                    background_color: "#020617"
                };

                const blob = new Blob([JSON.stringify(manifestParams)], { type: 'application/json' });
                manifestLink.setAttribute('href', URL.createObjectURL(blob));
            }

            let themeMeta = document.querySelector('meta[name="theme-color"]');
            if (themeMeta) {
                themeMeta.setAttribute('content', primary);
            }
            // ---------------------------------------
        }
    }, [currentOrganization]);

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
