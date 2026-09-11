import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { BatchStage } from '../../types/rooms';
import { Sprout, Leaf, Flower2, Wind, CheckCircle2, X as LucideX, Layers } from 'lucide-react';
import { Button as ShadcnButton } from '../ui/Button';

const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;
const scaleIn = keyframes`from { transform: scale(0.96); opacity: 0; } to { transform: scale(1); opacity: 1; }`;

const ModalOverlay = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
  background: rgba(0, 0, 0, 0.75); z-index: 10001;
  display: flex; align-items: center; justify-content: center; 
  backdrop-filter: blur(12px);
  animation: ${fadeIn} 0.2s ease-in-out;
`;

const ModalContent = styled.div`
  background: rgba(15, 23, 42, 0.96);
  padding: 1.5rem; 
  border-radius: 1.25rem; 
  width: 90%; 
  max-width: 440px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(24px);
  animation: ${scaleIn} 0.2s cubic-bezier(0.16, 1, 0.3, 1);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.25rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
`;

const HeaderInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.85rem;
`;

const IconBadge = styled.div`
  width: 42px;
  height: 42px;
  border-radius: 0.75rem;
  background: linear-gradient(135deg, rgba(74, 222, 128, 0.2), rgba(16, 185, 129, 0.05));
  border: 1px solid rgba(74, 222, 128, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4ade80;
  box-shadow: 0 0 15px rgba(74, 222, 128, 0.15);
`;

const Title = styled.h3`
  font-size: 1.15rem; 
  font-weight: 700;
  color: #f8fafc; 
  margin: 0;
  letter-spacing: -0.02em;
`;

const Subtitle = styled.p`
  margin: 0.2rem 0 0 0;
  font-size: 0.8rem;
  color: #94a3b8;
`;

const CloseButton = styled.button`
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #94a3b8;
  width: 32px;
  height: 32px;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #f8fafc;
    border-color: rgba(255, 255, 255, 0.2);
    transform: scale(1.05);
  }
`;

const StageGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.5rem;
`;

const StageOption = styled.button<{ $isActive: boolean; $color: string }>`
  background: ${p => p.$isActive ? 'rgba(30, 41, 59, 0.9)' : 'rgba(30, 41, 59, 0.4)'};
  color: ${p => p.$isActive ? '#f8fafc' : '#94a3b8'};
  border: 1.5px solid ${p => p.$isActive ? p.$color : 'rgba(255, 255, 255, 0.08)'};
  border-radius: 0.75rem;
  padding: 1rem 0.75rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 600;
  font-size: 0.85rem;
  box-shadow: ${p => p.$isActive ? `0 0 16px ${p.$color}33, inset 0 0 12px ${p.$color}22` : 'none'};

  &:hover {
    background: rgba(30, 41, 59, 0.75);
    border-color: ${p => p.$color};
    color: #f8fafc;
    transform: translateY(-2px);
  }
`;

const Actions = styled.div`
  display: flex; 
  justify-content: flex-end; 
  align-items: center;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
`;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (stage: BatchStage) => void;
  currentStage?: BatchStage;
  count: number;
}

const STAGES: { id: BatchStage; label: string; color: string; icon: React.ReactNode }[] = [
  { id: 'seedling', label: 'Plántula', color: '#38bdf8', icon: <Sprout size={22} color="#38bdf8" /> },
  { id: 'vegetation', label: 'Vegetación', color: '#4ade80', icon: <Leaf size={22} color="#4ade80" /> },
  { id: 'flowering', label: 'Floración', color: '#f43f5e', icon: <Flower2 size={22} color="#f43f5e" /> },
  { id: 'drying', label: 'Secado', color: '#fbbf24', icon: <Wind size={22} color="#fbbf24" /> },
  { id: 'completed', label: 'Corte', color: '#a855f7', icon: <CheckCircle2 size={22} color="#a855f7" /> },
];

export const StageSelectionModal: React.FC<Props> = ({ isOpen, onClose, onConfirm, currentStage, count }) => {
  const [selectedStage, setSelectedStage] = useState<BatchStage | null>(null);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedStage) {
      onConfirm(selectedStage);
    }
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <Header>
          <HeaderInfo>
            <IconBadge>
              <Layers size={20} />
            </IconBadge>
            <div>
              <Title>Cambiar Fase</Title>
              <Subtitle>{count} {count === 1 ? 'lote seleccionado' : 'lotes seleccionados'}</Subtitle>
            </div>
          </HeaderInfo>
          <CloseButton onClick={onClose} title="Cerrar modal">
            <LucideX size={16} />
          </CloseButton>
        </Header>

        <StageGrid>
          {STAGES.map(s => (
            <StageOption
              key={s.id}
              $isActive={selectedStage === s.id}
              $color={s.color}
              onClick={() => setSelectedStage(s.id)}
              disabled={s.id === currentStage}
              style={s.id === currentStage ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
            >
              <div>{s.icon}</div>
              <span>{s.label}</span>
            </StageOption>
          ))}
        </StageGrid>

        <Actions>
          <ShadcnButton variant="secondary" onClick={onClose}>
            Cancelar
          </ShadcnButton>
          <ShadcnButton 
            variant="default" 
            onClick={handleConfirm} 
            disabled={!selectedStage}
          >
            Confirmar Cambio
          </ShadcnButton>
        </Actions>
      </ModalContent>
    </ModalOverlay>
  );
};
