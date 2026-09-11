import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { 
    X as LucideX, 
    Trash2 as LucideTrash2, 
    Leaf, 
    Sprout, 
    Flower2, 
    CheckCircle2, 
    Save, 
    Check 
} from 'lucide-react';
import { Batch, BatchStage } from '../../types/rooms';
import { getGeneticColor } from '../../utils/geneticColors';
import { ConfirmationModal } from '../ConfirmationModal';
import { Button as ShadcnButton } from '../ui/Button';
import { Badge as ShadcnBadge } from '../ui/Badge';

interface LivingSoilBatchModalProps {
    isOpen: boolean;
    onClose: () => void;
    batch: Batch;
    onUpdateStage: (batch: Batch, newStage: BatchStage) => void;
    onDeleteBatch: (batch: Batch) => void;
    onSaveNotes: (batch: Batch, notes: string) => void;
}

const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;
const scaleIn = keyframes`from { transform: scale(0.96); opacity: 0; } to { transform: scale(1); opacity: 1; }`;

const Overlay = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.75); z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(12px);
  animation: ${fadeIn} 0.2s ease-in-out;
`;

const Content = styled.div`
  background: rgba(15, 23, 42, 0.96); 
  padding: 1.75rem; 
  border-radius: 1.25rem;
  width: 90%; 
  max-width: 520px;
  display: flex; 
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(24px);
  position: relative;
  animation: ${scaleIn} 0.2s cubic-bezier(0.16, 1, 0.3, 1);
`;

const Header = styled.div`
  display: flex; 
  justify-content: space-between; 
  align-items: center;
  margin-bottom: 1.25rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
`;

const Title = styled.h2`
  font-size: 1.25rem; 
  color: #f8fafc; 
  margin: 0;
  display: flex; 
  align-items: center; 
  gap: 0.6rem;
  font-weight: 700;
  letter-spacing: -0.02em;
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

const StageButton = styled.button<{ active?: boolean; stageColor?: string }>`
  flex: 1;
  padding: 0.85rem 0.5rem;
  border: 1.5px solid ${p => p.active ? p.stageColor : 'rgba(255, 255, 255, 0.08)'};
  background: ${p => p.active ? 'rgba(30, 41, 59, 0.9)' : 'rgba(30, 41, 59, 0.4)'};
  color: ${p => p.active ? '#f8fafc' : '#94a3b8'};
  border-radius: 0.75rem;
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  gap: 0.4rem;
  transition: all 0.2s ease;
  box-shadow: ${p => p.active ? `0 0 14px ${p.stageColor}33, inset 0 0 10px ${p.stageColor}22` : 'none'};

  &:hover {
    transform: translateY(-2px);
    border-color: ${p => p.stageColor};
    background: rgba(30, 41, 59, 0.75);
    color: #f8fafc;
  }
`;

const StagesContainer = styled.div`
  display: flex; gap: 0.5rem; margin-bottom: 1.5rem;
`;

const InfoRow = styled.div`
  display: flex; 
  justify-content: space-between; 
  align-items: center;
  margin-bottom: 1.25rem;
  padding: 0.65rem 1rem;
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 0.625rem;
  font-size: 0.85rem; 
  color: #94a3b8;
`;

const ActionRow = styled.div`
  display: flex; 
  justify-content: space-between; 
  align-items: center;
  margin-top: 1.25rem;
  padding-top: 1.25rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
`;

export const LivingSoilBatchModal: React.FC<LivingSoilBatchModalProps> = ({
    isOpen, onClose, batch, onUpdateStage, onDeleteBatch, onSaveNotes
}) => {
    const [notes, setNotes] = useState(batch.notes || '');
    const [loading, setLoading] = useState(false);
    const [pendingStage, setPendingStage] = useState<BatchStage | null>(null);

    if (!isOpen) return null;

    const geneticParams = getGeneticColor(batch.genetic?.name || batch.name);

    const handleStageClick = (stage: BatchStage) => {
        if (stage === batch.stage) return;
        setPendingStage(stage);
    };

    const handleConfirmStageChange = async () => {
        if (!pendingStage) return;
        setLoading(true);
        await onUpdateStage(batch, pendingStage);
        setLoading(false);
        setPendingStage(null);
    };

    const handleSave = async () => {
        setLoading(true);
        await onSaveNotes(batch, notes);
        setLoading(false);
        onClose();
    };

    const getStageConfirmMessage = (stage: BatchStage) => {
        switch (stage) {
            case 'flowering': return "¿Cambiar a etapa de floración?";
            case 'vegetation': return "¿Cambiar a etapa de vegetación?";
            case 'seedling': return "¿Cambiar a etapa de plántula?";
            case 'completed': return "¿Marcar como Corte?";
            default: return `¿Cambiar etapa a ${stage}?`;
        }
    };

    return (
        <>
            <Overlay>
                <Content onClick={e => e.stopPropagation()}>
                    <Header>
                        <Title>
                            <span style={{
                                width: 14, height: 14, borderRadius: '50%',
                                background: geneticParams.bg, border: `2px solid ${geneticParams.border}`,
                                display: 'inline-block',
                                boxShadow: `0 0 10px ${geneticParams.border}`
                            }} />
                            {batch.genetic?.name || batch.name}
                        </Title>
                        <CloseButton onClick={onClose} title="Cerrar modal">
                            <LucideX size={16} />
                        </CloseButton>
                    </Header>

                    <InfoRow>
                        <span>Posición: <strong style={{ color: '#f8fafc' }}>{batch.grid_position || 'N/A'}</strong></span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span>Código:</span>
                            <code style={{ 
                                background: 'rgba(15, 23, 42, 0.8)', 
                                padding: '0.2rem 0.4rem', 
                                borderRadius: '0.35rem', 
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: '#4ade80',
                                fontSize: '0.8rem'
                            }}>
                                {batch.tracking_code}
                            </code>
                        </div>
                    </InfoRow>

                    <h4 style={{ margin: '0 0 0.6rem', color: '#cbd5e1', fontWeight: 600, fontSize: '0.85rem' }}>
                        Etapa Actual
                    </h4>
                    <StagesContainer>
                        <StageButton
                            active={batch.stage === 'seedling'}
                            stageColor="#38bdf8"
                            onClick={() => handleStageClick('seedling')}
                        >
                            <Sprout size={20} color="#38bdf8" /> 
                            <span>Plántula</span>
                        </StageButton>
                        <StageButton
                            active={batch.stage === 'vegetation'}
                            stageColor="#4ade80"
                            onClick={() => handleStageClick('vegetation')}
                        >
                            <Leaf size={20} color="#4ade80" /> 
                            <span>Vege</span>
                        </StageButton>
                        <StageButton
                            active={batch.stage === 'flowering'}
                            stageColor="#f43f5e"
                            onClick={() => handleStageClick('flowering')}
                        >
                            <Flower2 size={20} color="#f43f5e" /> 
                            <span>Flora</span>
                        </StageButton>
                        <StageButton
                            active={batch.stage === 'completed'}
                            stageColor="#a855f7"
                            onClick={() => handleStageClick('completed')}
                        >
                            <CheckCircle2 size={20} color="#a855f7" /> 
                            <span>Fin</span>
                        </StageButton>
                    </StagesContainer>

                    <h4 style={{ margin: '0 0 0.5rem', color: '#cbd5e1', fontWeight: 600, fontSize: '0.85rem' }}>
                        Notas / Bitácora
                    </h4>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Registrar eventos, altura, poda..."
                        style={{
                            width: '100%',
                            minHeight: '85px',
                            padding: '0.75rem',
                            borderRadius: '0.625rem',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            background: 'rgba(15, 23, 42, 0.6)',
                            color: '#f8fafc',
                            fontFamily: 'inherit',
                            fontSize: '0.85rem',
                            resize: 'vertical',
                            boxSizing: 'border-box',
                            outline: 'none'
                        }}
                    />
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem', fontStyle: 'italic', marginBottom: '0.5rem' }}>
                        (Elimina esta nota por completo para desactivar la alerta de observación)
                    </div>

                    <ActionRow>
                        <ShadcnButton 
                            variant="destructive" 
                            onClick={() => onDeleteBatch(batch)}
                        >
                            <LucideTrash2 size={15} style={{ marginRight: 6 }} /> Eliminar
                        </ShadcnButton>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <ShadcnButton variant="secondary" onClick={onClose}>
                                Cancelar
                            </ShadcnButton>
                            <ShadcnButton variant="default" onClick={handleSave} disabled={loading}>
                                {loading ? 'Guardando...' : (
                                    <>
                                        <Save size={15} style={{ marginRight: 6 }} /> Guardar y Cerrar
                                    </>
                                )}
                            </ShadcnButton>
                        </div>
                    </ActionRow>

                </Content>
            </Overlay>

            <ConfirmationModal
                isOpen={!!pendingStage}
                title="Confirmar Cambio de Etapa"
                message={pendingStage ? getStageConfirmMessage(pendingStage) : ''}
                onConfirm={handleConfirmStageChange}
                onCancel={() => setPendingStage(null)}
                confirmText="Confirmar"
                cancelText="Cancelar"
            />
        </>
    );
};
