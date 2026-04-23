import React from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { DispensaryCatalog } from '../../components/Portal/DispensaryCatalog';

const PortalContainer = styled.div`
  min-height: 100vh;
  background: var(--bg-color, #020617);
  color: #f8fafc;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: var(--font-family, 'Inter', sans-serif);
`;

const Header = styled.header`
  width: 100%;
  max-width: 1200px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 2rem;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  margin-bottom: 2rem;
`;

const Brand = styled.h1`
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--primary-color, #4ade80);
  margin: 0;
`;

const PatientPortal: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate(`/${slug}/login`);
    };

    return (
        <PortalContainer style={{ minHeight: 'auto', padding: '0', background: 'transparent' }}>

            <div style={{ maxWidth: '1200px', width: '100%', padding: '1rem 0 2rem 0' }}>
                <h2 style={{ fontSize: '2rem', color: 'var(--primary-color, #4ade80)' }}>Bienvenido a tu dispensario</h2>
                <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>Selecciona los insumos para tu tratamiento y confirma la reserva.</p>
            </div>
            <DispensaryCatalog />
        </PortalContainer>
    );
};

export default PatientPortal;
