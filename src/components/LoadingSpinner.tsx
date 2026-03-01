import React from 'react';
import styled, { keyframes } from 'styled-components';



const heartbeat = keyframes`
  0% { transform: scale(1); opacity: 0.8; }
  25% { transform: scale(1.05); opacity: 1; filter: drop-shadow(0 0 8px rgba(74, 222, 128, 0.5)); }
  50% { transform: scale(1); opacity: 0.8; }
  75% { transform: scale(1.05); opacity: 1; filter: drop-shadow(0 0 8px rgba(74, 222, 128, 0.5)); }
  100% { transform: scale(1); opacity: 0.8; }
`;

const Overlay = styled.div<{ $fullScreen?: boolean }>`
  position: ${props => props.$fullScreen ? 'fixed' : 'absolute'};
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #020617; /* Dark Neo-theme background */
  backdrop-filter: blur(2px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 50;
  min-height: 200px;
`;

const SpinnerContainer = styled.div`
  position: relative;
  width: 120px;
  height: 120px;
  margin-bottom: 2rem;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const HeartbeatImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  animation: ${heartbeat} 1.5s ease-in-out infinite;
`;

interface LoadingSpinnerProps {
  fullScreen?: boolean;
  duration?: number;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  fullScreen = false,
  duration = 2000
}) => {
  return (
    <Overlay $fullScreen={fullScreen}>
      <SpinnerContainer>
        <HeartbeatImage src="/carga.png" alt="Cargando..." />
      </SpinnerContainer>
    </Overlay>
  );
};
