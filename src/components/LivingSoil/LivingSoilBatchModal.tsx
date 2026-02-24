import React, { useState } from 'react';
import styled from 'styled-components';
import { FaTimes, FaTrash, FaLeaf, FaSeedling, FaCannabis, FaCheck } from 'react-icons/fa';
import { Batch, BatchStage } from '../../types/rooms';
import { getGeneticColor } from '../../utils/geneticColors';
import { ConfirmationModal } from '../ConfirmationModal';

interface LivingSoilBatchModalProps {
    isOpen: boolean;
    onClose: () => void;
    batch: Batch;
    onUpdateStage: (batch: Batch, newStage: BatchStage) => void;
    onDeleteBatch: (batch: Batch) => void;
    onSaveNotes: (batch: Batch, notes: string) => void;
}

const Overlay = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(15, 23, 42, 0.75); z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(4px);
`;

const Content = styled.div`
  background: rgba(15, 23, 42, 0.9); padding: 2rem; border-radius: 1rem;
  width: 90%; max-width: 500px;
  display: flex; flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  backdrop-filter: blur(12px);
`;

const Header = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const Title = styled.h2`
  font-size: 1.5rem; color: #f8fafc; margin: 0;
  display: flex; align-items: center; gap: 0.5rem;
  font-weight: 700;
`;

const CloseButton = styled.button`
  background: none; border: none; font-size: 1.5rem; color: #94a3b8; cursor: pointer;
  transition: color 0.2s;
  &:hover { color: #f8fafc; }
`;

const StageButton = styled.button<{ active?: boolean, stageColor?: string }>`
  flex: 1;
  padding: 0.75rem;
  border: 1px solid ${p => p.active ? p.stageColor : 'rgba(255, 255, 255, 0.1)'};
  background: ${p => p.active ? p.stageColor : 'rgba(15, 23, 42, 0.6)'};
  color: ${p => p.active ? '#fff' : '#cbd5e1'};
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  display: flex; flex-direction: column; align-items: center; gap: 0.4rem;
  transition: all 0.2s;
  opacity: ${p => p.active ? 1 : 0.8};

  &:hover {
    transform: translateY(-2px);
    opacity: 1;
    border-color: ${p => p.stageColor};
    background: ${p => p.active ? p.stageColor : 'rgba(255, 255, 255, 0.05)'};
    color: ${p => p.active ? '#fff' : p.stageColor};
  }
`;

const StagesContainer = styled.div`
  display: flex; gap: 0.5rem; margin-bottom: 1.5rem;
`;

const InfoRow = styled.div`
  display: flex; justify-content: space-between; margin-bottom: 0.5rem;
  font-size: 0.95rem; color: #94a3b8;
`;

const ActionRow = styled.div`
  display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem;
`;

const DeleteButton = styled.button`
  background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: #ef4444;
  padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer;
  display: flex; align-items: center; gap: 0.5rem;
  font-weight: 600;
  transition: all 0.2s;
  
  &:hover { background: rgba(239, 68, 68, 0.2); border-color: rgba(239, 68, 68, 0.5); }
`;

const SaveButton = styled.button`
  background: #4de669; color: #0f172a; border: none;
  padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  
  &:hover { 
    background: #42cb5a; 
    box-shadow: 0 0 10px rgba(77, 230, 105, 0.4);
  }
  
  &:disabled {
      opacity: 0.7;
      cursor: not-allowed;
  }
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
                                width: 20, height: 20, borderRadius: '50%',
                                background: geneticParams.bg, border: `1px solid ${geneticParams.border}`
                            }} />
                            {batch.genetic?.name || batch.name}
                        </Title>
                        <CloseButton onClick={onClose}><FaTimes /></CloseButton>
                    </Header>

                    <InfoRow>
                        <span>Posición: <strong>{batch.grid_position}</strong></span>
                        <span>Código: <code>{batch.tracking_code}</code></span>
                    </InfoRow>

                    <h4 style={{ margin: '1rem 0 0.5rem', color: '#f8fafc', fontWeight: 600 }}>Etapa Actual</h4>
                    <StagesContainer>
                        <StageButton
                            active={batch.stage === 'seedling'}
                            stageColor="#38bdf8" // Light Blue
                            onClick={() => handleStageClick('seedling')}
                        >
                            <FaSeedling /> Plántula
                        </StageButton>
                        <StageButton
                            active={batch.stage === 'vegetation'}
                            stageColor="#4ade80" // Green
                            onClick={() => handleStageClick('vegetation')}
                        >
                            <FaLeaf /> Vege
                        </StageButton>
                        <StageButton
                            active={batch.stage === 'flowering'}
                            stageColor="#f87171" // Red
                            onClick={() => handleStageClick('flowering')}
                        >
                            <FaCannabis /> Flora
                        </StageButton>
                        <StageButton
                            active={batch.stage === 'completed'}
                            stageColor="#94a3b8" // Slate
                            onClick={() => handleStageClick('completed')}
                        >
                            <FaCheck /> Fin
                        </StageButton>
                    </StagesContainer>

                    <h4 style={{ margin: '0 0 0.5rem', color: '#f8fafc', fontWeight: 600 }}>Notas / Bitácora</h4>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Registrar eventos, altura, poda..."
                        style={{
                            width: '100%',
                            minHeight: '80px',
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            background: 'rgba(15, 23, 42, 0.6)',
                            color: '#f8fafc',
                            fontFamily: 'inherit',
                            resize: 'vertical'
                        }}
                    />
                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem', fontStyle: 'italic', marginBottom: '1.5rem' }}>
                        (Elimina esta nota por completo para desactivar la alerta de observación)
                    </div>

                    <ActionRow>
                        <DeleteButton onClick={() => onDeleteBatch(batch)}>
                            <FaTrash /> Eliminar
                        </DeleteButton>
                        <SaveButton onClick={handleSave} disabled={loading}>
                            {loading ? 'Guardando...' : 'Guardar y Cerrar'}
                        </SaveButton>
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
