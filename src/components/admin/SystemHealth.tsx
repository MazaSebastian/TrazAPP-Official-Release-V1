import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { supabase } from '../../services/supabaseClient';
import { FaCheckCircle, FaExclamationCircle, FaServer, FaDatabase, FaLock, FaHdd, FaSync } from 'react-icons/fa';

const HealthContainer = styled.div`
  background: rgba(30, 41, 59, 0.6);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2);
  margin-bottom: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  
  h3 {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #f8fafc;
    font-size: 1.1rem;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
`;

const StatusItem = styled.div<{ status: 'ok' | 'error' | 'loading' }>`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: ${props => props.status === 'ok' ? '#f0fff4' : props.status === 'error' ? '#fff5f5' : '#f7fafc'};
  border-radius: 8px;
  border: 1px solid ${props => props.status === 'ok' ? '#c6f6d5' : props.status === 'error' ? '#feb2b2' : '#edf2f7'};
  transition: all 0.2s;

  .icon-box {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    color: #4a5568;
    font-size: 1.2rem;
  }

  .info {
    flex: 1;
    h4 { margin: 0; font-size: 0.9rem; color: #4a5568; }
    p { margin: 0; font-size: 0.8rem; color: #718096; font-weight: 500; }
  }

  .status-icon {
    font-size: 1.25rem;
    color: ${props => props.status === 'ok' ? '#48bb78' : props.status === 'error' ? '#f56565' : '#cbd5e0'};
  }
`;

const RefreshButton = styled.button`
  background: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.3);
  color: #38bdf8;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: all 0.2s;
  backdrop-filter: blur(8px);

  &:hover { 
      background: rgba(56, 189, 248, 0.2); 
  }
  &:disabled { 
      opacity: 0.5; 
      cursor: not-allowed; 
  }
`;

interface ServiceStatus {
    name: string;
    status: 'ok' | 'error' | 'loading';
    latency?: number; // ms
    message?: string;
}

export const SystemHealth: React.FC = () => {
    const [dbStatus, setDbStatus] = useState<ServiceStatus>({ name: 'Database', status: 'loading' });
    const [authStatus, setAuthStatus] = useState<ServiceStatus>({ name: 'Auth', status: 'loading' });
    const [storageStatus, setStorageStatus] = useState<ServiceStatus>({ name: 'Storage', status: 'loading' });
    const [isChecking, setIsChecking] = useState(false);
    const [lastCheck, setLastCheck] = useState<Date | null>(null);

    const checkHealth = async () => {
        setIsChecking(true);
        setDbStatus(prev => ({ ...prev, status: 'loading' }));
        setAuthStatus(prev => ({ ...prev, status: 'loading' }));
        setStorageStatus(prev => ({ ...prev, status: 'loading' }));


        // 1. Check Database (Execute simple query)
        try {
            const dbStart = performance.now();
            const { error } = await supabase.from('organizations').select('*', { count: 'exact', head: true });
            const dbEnd = performance.now();

            if (error) throw error;

            setDbStatus({
                name: 'Database',
                status: 'ok',
                latency: Math.round(dbEnd - dbStart),
                message: 'Operational'
            });
        } catch (e: any) {
            setDbStatus({ name: 'Database', status: 'error', message: e.message });
        }

        // 2. Check Auth (Get Session)
        try {
            const authStart = performance.now();
            const { error } = await supabase.auth.getSession();
            const authEnd = performance.now();

            if (error) throw error;

            setAuthStatus({
                name: 'Auth Service',
                status: 'ok',
                latency: Math.round(authEnd - authStart),
                message: 'Active'
            });
        } catch (e: any) {
            setAuthStatus({ name: 'Auth Service', status: 'error', message: e.message });
        }

        // 3. Check Storage (List bucket)
        try {
            const storageStart = performance.now();
            // Try to list files in a public bucket or check bucket existence
            // Assuming 'avatars' bucket exists
            const { error } = await supabase.storage.from('avatars').list('', { limit: 1 });
            const storageEnd = performance.now();

            if (error) throw error;

            setStorageStatus({
                name: 'Storage',
                status: 'ok',
                latency: Math.round(storageEnd - storageStart),
                message: 'Accessible'
            });
        } catch (e: any) {
            setStorageStatus({ name: 'Storage', status: 'error', message: e.message });
        }

        setLastCheck(new Date());
        setIsChecking(false);
    };

    useEffect(() => {
        checkHealth();
    }, []);

    return (
        <HealthContainer>
            <Header>
                <h3><FaServer /> Estado del Sistema</h3>
                <RefreshButton onClick={checkHealth} disabled={isChecking}>
                    <FaSync className={isChecking ? 'fa-spin' : ''} />
                    {isChecking ? 'Verificando...' : 'Actualizar'}
                </RefreshButton>
            </Header>

            <Grid>
                {/* Database */}
                <StatusItem status={dbStatus.status}>
                    <div className="icon-box"><FaDatabase /></div>
                    <div className="info">
                        <h4>Base de Datos</h4>
                        <p>{dbStatus.status === 'loading' ? 'Checking...' : dbStatus.status === 'ok' ? `${dbStatus.latency}ms` : 'Error'}</p>
                    </div>
                    <div className="status-icon">
                        {dbStatus.status === 'ok' ? <FaCheckCircle /> : dbStatus.status === 'error' ? <FaExclamationCircle /> : null}
                    </div>
                </StatusItem>

                {/* Auth */}
                <StatusItem status={authStatus.status}>
                    <div className="icon-box"><FaLock /></div>
                    <div className="info">
                        <h4>Autenticación</h4>
                        <p>{authStatus.status === 'loading' ? 'Checking...' : authStatus.status === 'ok' ? 'Online' : 'Error'}</p>
                    </div>
                    <div className="status-icon">
                        {authStatus.status === 'ok' ? <FaCheckCircle /> : authStatus.status === 'error' ? <FaExclamationCircle /> : null}
                    </div>
                </StatusItem>

                {/* Storage */}
                <StatusItem status={storageStatus.status}>
                    <div className="icon-box"><FaHdd /></div>
                    <div className="info">
                        <h4>Storage</h4>
                        <p>{storageStatus.status === 'loading' ? 'Checking...' : storageStatus.status === 'ok' ? 'Operational' : 'Error'}</p>
                    </div>
                    <div className="status-icon">
                        {storageStatus.status === 'ok' ? <FaCheckCircle /> : storageStatus.status === 'error' ? <FaExclamationCircle /> : null}
                    </div>
                </StatusItem>
            </Grid>

            {lastCheck && (
                <div style={{ marginTop: '1rem', textAlign: 'right', fontSize: '0.75rem', color: '#94a3b8' }}>
                    Última verificación: {lastCheck.toLocaleTimeString()}
                </div>
            )}
        </HealthContainer>
    );
};
