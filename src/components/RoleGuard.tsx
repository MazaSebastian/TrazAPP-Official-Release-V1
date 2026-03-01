import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useOrganization } from '../context/OrganizationContext';
import { LoadingSpinner } from './LoadingSpinner';

interface RoleGuardProps {
    children: React.ReactElement;
    allowedRoles: string[];
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ children, allowedRoles }) => {
    const { currentRole, isLoading } = useOrganization();
    const location = useLocation();

    // While organization/role is loading, show a spinner
    if (isLoading) {
        return <LoadingSpinner fullScreen duration={1000} />;
    }

    // Role is extracted, let's verify if they have access
    // 'owner' and 'super_admin' generally get access to everything permitted in the app.
    if (currentRole && (allowedRoles.includes(currentRole) || currentRole === 'super_admin' || currentRole === 'owner')) {
        return children;
    }

    // If role is null or not in allowed list, redirect to Dashboard (or unauthorized page)
    return <Navigate to="/" state={{ from: location }} replace />;
};
