import React from 'react';
import styled, { keyframes } from 'styled-components';
import { FaExclamationTriangle, FaArrowRight } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const pulse = keyframes`
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
  70% { transform: scale(1.02); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
`;

const slideDown = keyframes`
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const BannerContainer = styled.div<{ $isUrgent: boolean }>`
  background: ${p => p.$isUrgent
        ? 'linear-gradient(135deg, rgba(127, 29, 29, 0.8), rgba(69, 10, 10, 0.9))'
        : 'linear-gradient(135deg, rgba(153, 27, 27, 0.6), rgba(69, 10, 10, 0.8))'};
  border: 1px solid ${p => p.$isUrgent ? 'rgba(239, 68, 68, 0.5)' : 'rgba(248, 113, 113, 0.3)'};
  border-radius: 1rem;
  padding: 1.5rem 2rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.15);
  animation: ${slideDown} 0.5s ease-out forwards ${p => p.$isUrgent ? `, ${pulse} 2s infinite` : ''};
  backdrop-filter: blur(12px);

  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
    padding: 1.25rem;
  }
`;

const IconWrapper = styled.div<{ $isUrgent: boolean }>`
  font-size: 2.5rem;
  color: ${p => p.$isUrgent ? '#ef4444' : '#f87171'};
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  padding: 1rem;
`;

const TextContent = styled.div`
  flex: 1;

  form { margin: 0; }
  
  h3 {
    margin: 0 0 0.5rem 0;
    color: #f8fafc;
    font-size: 1.25rem;
    font-weight: 700;
  }

  p {
    margin: 0;
    color: #fca5a5;
    font-size: 0.95rem;
    line-height: 1.5;
  }

  strong {
    color: #fecaca;
  }
`;

const ActionButton = styled(Link) <{ $isUrgent: boolean }>`
  background: ${p => p.$isUrgent ? '#ef4444' : '#dc2626'};
  color: #ffffff;
  padding: 0.875rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  white-space: nowrap;
  box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.3);

  &:hover {
    background: ${p => p.$isUrgent ? '#dc2626' : '#b91c1c'};
    transform: translateY(-2px);
    box-shadow: 0 6px 8px -1px rgba(239, 68, 68, 0.4);
  }

  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
  }
`;


export const KYCBanner: React.FC = () => {
    const { kycStatus, daysFromRegistration } = useAuth();

    // Only show if status is pending
    if (kycStatus !== 'pending') return null;

    const daysRemaining = daysFromRegistration !== undefined ? 30 - daysFromRegistration : 30;
    const isUrgent = daysRemaining <= 7;

    return (
        <BannerContainer $isUrgent={isUrgent}>
            <IconWrapper $isUrgent={isUrgent}>
                <FaExclamationTriangle />
            </IconWrapper>
            <TextContent>
                <h3>Completa tu Perfil Organizacional</h3>
                <p>
                    Por razones de auditoría y legales, necesitamos que completes la información de tu organización y proporciones la documentación requerida.
                    {daysRemaining > 0 ? (
                        <> Tienes <strong>{daysRemaining} {daysRemaining === 1 ? 'día' : 'días'} restantes</strong> antes de que se bloqueen algunas funciones.</>
                    ) : (
                        <> El plazo ha expirado. <strong>Por favor, completa tu perfil para evitar restricciones.</strong></>
                    )}
                </p>
            </TextContent>
            <ActionButton to="/account" $isUrgent={isUrgent}>
                Completar Ahora <FaArrowRight />
            </ActionButton>
        </BannerContainer>
    );
};
