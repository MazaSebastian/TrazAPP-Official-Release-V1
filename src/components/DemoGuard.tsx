import React, { useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { differenceInDays, parseISO } from 'date-fns';
import { useOrganization } from '../context/OrganizationContext';
import { LoadingSpinner } from './LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { FaLock, FaEnvelope } from 'react-icons/fa';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const LockScreenContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  background-color: #0f172a; /* Global Slate 900 */
  color: #f8fafc;
  text-align: center;
`;

const LockBox = styled.div`
  background: rgba(30, 41, 59, 0.7);
  backdrop-filter: blur(12px);
  padding: 4rem 3rem;
  border-radius: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  max-width: 500px;
  width: 100%;
  animation: ${fadeIn} 0.6s ease-out;

  .icon {
    font-size: 4rem;
    color: #ef4444; /* Red for blocked */
    margin-bottom: 1.5rem;
  }

  h1 {
    font-size: 2rem;
    font-weight: 800;
    margin: 0 0 1rem 0;
    color: #f8fafc;
    letter-spacing: -0.025em;
  }

  p {
    color: #94a3b8;
    line-height: 1.6;
    margin-bottom: 2rem;
    font-size: 1.1rem;
  }

  .mail-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    background: #38bdf8; /* TrazApp Blue Accent */
    color: #0c4a6e;
    font-weight: 700;
    padding: 1rem 2rem;
    border-radius: 0.75rem;
    text-decoration: none;
    transition: all 0.2s;

    &:hover {
      background: #0ea5e9;
      transform: translateY(-2px);
      box-shadow: 0 10px 15px -3px rgba(14, 165, 233, 0.3);
    }
  }
  
  .logout-btn {
    margin-top: 1.5rem;
    background: transparent;
    border: none;
    color: #64748b;
    font-weight: 500;
    cursor: pointer;
    text-decoration: underline;
    transition: color 0.2s;
    
    &:hover {
      color: #cbd5e1;
    }
  }
`;

export const DemoGuard: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { currentOrganization, isLoading: orgLoading } = useOrganization();
  const { logout, isLoading: authLoading } = useAuth();

  if (authLoading || orgLoading) {
    return <LoadingSpinner fullScreen duration={3000} />;
  }

  // Check if it's the DEMO plan
  if (currentOrganization && currentOrganization.plan === 'demo') {
    // Determine expiration date based on created_at + 15 days
    // Fallback safely if there's an issue parsing
    const startDate = currentOrganization.created_at 
      ? parseISO(currentOrganization.created_at) 
      : new Date();
      
    // Exact days passed
    const daysPassed = differenceInDays(new Date(), startDate);
    
    // Trial is strictly 15 days length. E.g. passed = 15 means it's over
    if (daysPassed >= 15) {
      return (
        <LockScreenContainer>
          <LockBox>
            <FaLock className="icon" />
            <h1>Prueba DEMO Finalizada</h1>
            <p>
              Tu período de prueba gratuita de 15 días ha concluido. Para continuar gestionando 
              tus cultivos y pacientes sin interrupciones, por favor contacta a nuestro equipo de ventas.
            </p>
            <a href="mailto:sblascovich@apidconsulting.com?subject=TrazAPP%20-%20Actualizar%20Plan%20Demo" className="mail-btn">
              <FaEnvelope /> Contactar a Ventas
            </a>
            <div>
                <button className="logout-btn" onClick={logout}>Cerrar Sesión</button>
            </div>
          </LockBox>
        </LockScreenContainer>
      );
    }
  }

  // Render normal application if no block condition applies
  return children;
};
