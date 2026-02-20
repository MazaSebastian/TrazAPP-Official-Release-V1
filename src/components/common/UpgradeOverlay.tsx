import React from 'react';
import styled from 'styled-components';
import { FaLock, FaRocket } from 'react-icons/fa';

const OverlayContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.7); /* Dark Glassmorphism */
  backdrop-filter: blur(8px);
  z-index: 50;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
`;

const LockIcon = styled.div`
  font-size: 3rem;
  color: #94a3b8;
  margin-bottom: 1.5rem;
  filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5));
`;

const Title = styled.h2`
  color: #f8fafc;
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
`;

const Description = styled.p`
  color: #cbd5e1;
  font-size: 1rem;
  max-width: 400px;
  line-height: 1.5;
  margin-bottom: 2rem;
`;

const UpgradeButton = styled.button`
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  box-shadow: 0 4px 6px rgba(16, 185, 129, 0.2);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(16, 185, 129, 0.3);
  }
`;

interface UpgradeOverlayProps {
    requiredPlanName: string; // e.g., 'Equipo' or 'ONG'
}

const UpgradeOverlay: React.FC<UpgradeOverlayProps> = ({ requiredPlanName }) => {
    return (
        <OverlayContainer>
            <LockIcon>
                <FaLock />
            </LockIcon>
            <Title>Función Premium</Title>
            <Description>
                Esta sección está disponible a partir del plan <strong>{requiredPlanName}</strong>.
                Mejora tu suscripción para desbloquear todas las herramientas avanzadas de TrazAPP.
            </Description>
            <UpgradeButton onClick={() => window.location.href = 'mailto:ventas@trazapp.com.ar?subject=Mejorar Plan'}>
                <FaRocket /> Mejorar Plan
            </UpgradeButton>
        </OverlayContainer>
    );
};

export default UpgradeOverlay;
