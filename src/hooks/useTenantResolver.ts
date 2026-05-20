import { useState, useEffect } from 'react';
import { Organization } from '../types';
import { organizationService } from '../services/organizationService';

/**
 * Hook to resolve the organization (tenant) for public white-label pages.
 * It uses the hostname first, and falls back to a provided slug from the URL.
 */
export function useTenantResolver(slugFromUrl?: string) {
    const [tenant, setTenant] = useState<Organization | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        async function loadTenant() {
            try {
                const hostname = window.location.hostname;
                console.log("[useTenantResolver] resolving for hostname:", hostname, "slug:", slugFromUrl);
                const org = await organizationService.getOrganizationByDomainOrSlug(hostname, slugFromUrl);
                console.log("[useTenantResolver] org returned:", org?.slug);
                
                if (isMounted && org) {
                    setTenant(org);

                    // Inject Theme Colors dynamically
                    const root = document.documentElement;
                    const hexToRgb = (hex: string) => {
                        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                        return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : null;
                    };

                    const primary = org.primary_color || '#a855f7';
                    const secondary = org.secondary_color || '#7c3aed';

                    root.style.setProperty('--primary-color', primary);
                    root.style.setProperty('--secondary-color', secondary);
                    root.style.setProperty('--primary-color-rgb', hexToRgb(primary) || '168, 85, 247');
                    root.style.setProperty('--secondary-color-rgb', hexToRgb(secondary) || '124, 58, 237');
                }
            } catch (err) {
                console.error('Error resolving tenant:', err);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        loadTenant();

        return () => {
            isMounted = false;
        };
    }, [slugFromUrl]);

    return { tenant, isLoading };
}
