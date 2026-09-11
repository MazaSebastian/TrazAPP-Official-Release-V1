import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import {
  Sprout,
  X,
  Move,
  ArrowLeft,
  StickyNote,
  Pencil,
  Trash2,
  MapPin,
  FileText,
  Dna
} from 'lucide-react';
import { Batch } from '../types/rooms';
import { ShadcnButton } from './ui/Button';
import { ShadcnBadge } from './ui/Badge';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

const scaleIn = keyframes`
  from {
    transform: scale(0.96) translateY(8px);
    opacity: 0;
  }
  to {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
`;

const scaleOut = keyframes`
  from {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
  to {
    transform: scale(0.96) translateY(8px);
    opacity: 0;
  }
`;

const ModalOverlay = styled.div<{ $isClosing: boolean }>`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.78);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  padding: 1rem;
  animation: ${p => p.$isClosing ? fadeOut : fadeIn} 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
`;

const ModalContent = styled.div<{ $isClosing: boolean }>`
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(28px);
  -webkit-backdrop-filter: blur(28px);
  padding: 2rem;
  border-radius: 1.25rem;
  width: 92%;
  max-width: 480px;
  box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
  animation: ${p => p.$isClosing ? scaleOut : scaleIn} 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
`;

const AmbientGlow = styled.div`
  position: absolute;
  top: -60px;
  left: 50%;
  transform: translateX(-50%);
  width: 300px;
  height: 130px;
  background: radial-gradient(ellipse at center, rgba(56, 189, 248, 0.2) 0%, rgba(56, 189, 248, 0) 75%);
  pointer-events: none;
`;

const ModalHeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;

  .header-left {
    display: flex;
    align-items: center;
    gap: 0.85rem;

    .icon-badge {
      width: 44px;
      height: 44px;
      border-radius: 0.75rem;
      background: rgba(56, 189, 248, 0.12);
      border: 1px solid rgba(56, 189, 248, 0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 20px rgba(56, 189, 248, 0.15);
      flex-shrink: 0;
      color: #38bdf8;
    }

    .title-texts {
      display: flex;
      flex-direction: column;

      h2 {
        margin: 0;
        color: #f8fafc;
        font-size: 1.3rem;
        font-weight: 700;
        letter-spacing: -0.02em;
      }

      .location-tag {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        margin-top: 0.25rem;
        font-size: 0.8rem;
        color: #94a3b8;
        font-weight: 500;
      }
    }
  }
`;

const CloseButton = styled.button`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #94a3b8;
  cursor: pointer;
  width: 34px;
  height: 34px;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  flex-shrink: 0;

  &:hover {
    color: #f1f5f9;
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.2);
    transform: scale(1.04);
  }

  &:active {
    transform: scale(0.96);
  }
`;

const InfoCard = styled.div`
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.85rem;
  padding: 1.15rem;
  margin-bottom: 1.5rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  .info-field {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;

    .info-label {
      font-size: 0.75rem;
      color: #94a3b8;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }

    .info-val {
      font-size: 0.95rem;
      color: #f8fafc;
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .notes-field {
    grid-column: 1 / -1;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    padding-top: 0.75rem;
    margin-top: 0.25rem;

    .notes-text {
      font-size: 0.85rem;
      color: #cbd5e1;
      line-height: 1.4;
      margin: 0.3rem 0 0 0;
    }
  }
`;

const SectionHeader = styled.div`
  font-size: 0.825rem;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;
  padding-bottom: 0.4rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
`;

const ActionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
`;

const ActionCardButton = styled.button<{ $variant?: 'sky' | 'amber' }>`
  width: 100%;
  padding: 0.85rem 1rem;
  border-radius: 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-sizing: border-box;

  ${p => p.$variant === 'amber' ? `
    background: rgba(245, 158, 11, 0.1);
    border: 1px solid rgba(245, 158, 11, 0.3);
    color: #fbbf24;

    &:hover {
      background: rgba(245, 158, 11, 0.18);
      border-color: rgba(245, 158, 11, 0.45);
      box-shadow: 0 4px 14px rgba(245, 158, 11, 0.15);
      transform: translateY(-1px);
    }
  ` : `
    background: rgba(56, 189, 248, 0.1);
    border: 1px solid rgba(56, 189, 248, 0.3);
    color: #38bdf8;

    &:hover {
      background: rgba(56, 189, 248, 0.18);
      border-color: rgba(56, 189, 248, 0.45);
      box-shadow: 0 4px 14px rgba(56, 189, 248, 0.15);
      transform: translateY(-1px);
    }
  `}

  &:active {
    transform: translateY(0);
  }
`;

const SplitRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.65rem;
`;

const SecondaryActionButton = styled.button<{ $isDestructive?: boolean }>`
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-sizing: border-box;

  ${p => p.$isDestructive ? `
    background: rgba(244, 63, 94, 0.08);
    border: 1px solid rgba(244, 63, 94, 0.25);
    color: #fb7185;

    &:hover {
      background: rgba(244, 63, 94, 0.16);
      border-color: rgba(244, 63, 94, 0.4);
      color: #f43f5e;
      box-shadow: 0 4px 12px rgba(244, 63, 94, 0.15);
      transform: translateY(-1px);
    }
  ` : `
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #cbd5e1;

    &:hover {
      background: rgba(255, 255, 255, 0.09);
      border-color: rgba(255, 255, 255, 0.2);
      color: #f8fafc;
      transform: translateY(-1px);
    }
  `}

  &:active {
    transform: translateY(0);
  }
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 1.75rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
`;

export interface LocationActionModalProps {
  isOpen: boolean;
  isClosing?: boolean;
  onClose: () => void;
  batch: Batch | null;
  onRelocate?: (batch: Batch) => void;
  onAssignToMap?: (batch: Batch) => void;
  onAddObservation: (batch: Batch) => void;
  onEdit: (batch: Batch) => void;
  onDelete: (batch: Batch) => void;
}

export const LocationActionModal: React.FC<LocationActionModalProps> = ({
  isOpen,
  isClosing: isClosingProp,
  onClose,
  batch,
  onRelocate,
  onAssignToMap,
  onAddObservation,
  onEdit,
  onDelete
}) => {
  const [internalClosing, setInternalClosing] = useState(false);

  const effectiveClosing = isClosingProp !== undefined ? isClosingProp : internalClosing;

  const handleClose = () => {
    if (isClosingProp !== undefined) {
      onClose();
    } else {
      if (internalClosing) return;
      setInternalClosing(true);
      setTimeout(() => {
        setInternalClosing(false);
        onClose();
      }, 190);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  if (!isOpen && !effectiveClosing) return null;
  if (!batch) return null;

  const getStageBadgeProps = (stage?: string): { variant: 'emerald' | 'purple' | 'amber' | 'secondary', label: string } => {
    switch (stage) {
      case 'vegetation':
        return { variant: 'emerald', label: 'Vegetativo' };
      case 'clones':
      case 'seedling':
        return { variant: 'purple', label: 'Plántula / Esqueje' };
      case 'flowering':
        return { variant: 'amber', label: 'Floración' };
      default:
        return { variant: 'secondary', label: stage || 'Indefinido' };
    }
  };

  const stageProps = getStageBadgeProps(batch.stage);
  const locationLabel = batch.clone_map_id
    ? `Ubicación: ${batch.grid_position || 'N/A'}`
    : `En Stock (Disp: ${(batch as any)._totalQuantity || batch.quantity})`;

  return (
    <ModalOverlay $isClosing={effectiveClosing} onClick={handleClose} onKeyDown={handleKeyDown}>
      <ModalContent $isClosing={effectiveClosing} onClick={(e) => e.stopPropagation()}>
        <AmbientGlow />

        <ModalHeaderRow>
          <div className="header-left">
            <div className="icon-badge">
              <Sprout size={24} />
            </div>
            <div className="title-texts">
              <h2>{batch.tracking_code || 'Lote de Cultivo'}</h2>
              <span className="location-tag">
                <MapPin size={12} style={{ color: '#38bdf8' }} /> {locationLabel}
              </span>
            </div>
          </div>
          <CloseButton onClick={handleClose} aria-label="Cerrar modal">
            <X size={18} />
          </CloseButton>
        </ModalHeaderRow>

        <InfoCard>
          <div className="info-field">
            <span className="info-label">
              <Dna size={12} /> Nombre / Genética
            </span>
            <span className="info-val">{batch.genetic?.name || batch.name || 'Desconocida'}</span>
          </div>

          <div className="info-field">
            <span className="info-label">Fase Actual</span>
            <div>
              <ShadcnBadge variant={stageProps.variant} dot>
                {stageProps.label}
              </ShadcnBadge>
            </div>
          </div>

          {batch.notes && (
            <div className="notes-field">
              <span className="info-label">
                <FileText size={12} /> Notas
              </span>
              <p className="notes-text">{batch.notes}</p>
            </div>
          )}
        </InfoCard>

        <SectionHeader>Acciones Disponibles</SectionHeader>

        <ActionsContainer>
          {batch.clone_map_id && onRelocate ? (
            <ActionCardButton
              $variant="sky"
              onClick={() => {
                handleClose();
                onRelocate(batch);
              }}
            >
              <Move size={17} /> Reubicar en otro lugar
            </ActionCardButton>
          ) : onAssignToMap ? (
            <ActionCardButton
              $variant="sky"
              onClick={() => {
                handleClose();
                onAssignToMap(batch);
              }}
            >
              <ArrowLeft size={17} /> Asignar al Mapa
            </ActionCardButton>
          ) : null}

          <ActionCardButton
            $variant="amber"
            onClick={() => {
              handleClose();
              onAddObservation(batch);
            }}
          >
            <StickyNote size={17} /> Observación / Nota
          </ActionCardButton>

          <SplitRow>
            <SecondaryActionButton
              onClick={() => {
                handleClose();
                onEdit(batch);
              }}
            >
              <Pencil size={15} /> Editar
            </SecondaryActionButton>

            <SecondaryActionButton
              $isDestructive
              onClick={() => {
                handleClose();
                onDelete(batch);
              }}
            >
              <Trash2 size={15} /> Eliminar
            </SecondaryActionButton>
          </SplitRow>
        </ActionsContainer>

        <ModalFooter>
          <ShadcnButton variant="secondary" onClick={handleClose}>
            Cerrar
          </ShadcnButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
};
