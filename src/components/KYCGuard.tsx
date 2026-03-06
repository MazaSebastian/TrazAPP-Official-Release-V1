import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from './LoadingSpinner';

export const KYCGuard: React.FC<{ children: React.ReactElement }> = ({ children }) => {
    const { kycStatus, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) return <LoadingSpinner fullScreen duration={1000} />;

    // If KYC is blocked and they are trying to access anything other than /account
    if (kycStatus === 'blocked' && location.pathname !== '/account') {
        return <Navigate to="/account" replace />;
    }

    return children;
};
