import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { AlertTriangle, Trash2, X as LucideX } from 'lucide-react';
import { CustomSelect } from './CustomSelect';
import { Button as ShadcnButton } from './ui/Button';

const fadeIn = keyframes`
  from { opacity: 0; backdrop-filter: blur(0px); }
  to { opacity: 1; backdrop-filter: blur(12px); }
`;

const scaleUp = keyframes`
  from { transform: scale(0.96); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(12px);
  z-index: 5000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  animation: ${fadeIn} 0.2s ease-out;
`;

const ModalContainer = styled.div`
  background: rgba(15, 23, 42, 0.96);
  border: 1px solid rgba(239, 68, 68, 0.25);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(239, 68, 68, 0.12);
  border-radius: 1.25rem;
  width: 100%;
  max-width: 460px;
  padding: 1.75rem;
  animation: ${scaleUp} 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  backdrop-filter: blur(24px);
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;

  .icon-wrapper {
    background: rgba(239, 68, 68, 0.12);
    color: #f87171;
    width: 44px;
    height: 44px;
    border-radius: 0.75rem;
    border: 1px solid rgba(239, 68, 68, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 0 15px rgba(239, 68, 68, 0.15);
  }

  .text-content {
    h3 {
      margin: 0 0 0.25rem 0;
      color: #f8fafc;
      font-size: 1.15rem;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    p {
      margin: 0;
      color: #94a3b8;
      font-size: 0.85rem;
      line-height: 1.4;
    }
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1.25rem;
  right: 1.25rem;
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

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  label {
    font-size: 0.85rem;
    color: #cbd5e1;
    font-weight: 600;
    letter-spacing: -0.01em;
  }

  textarea {
    width: 100%;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: #f8fafc;
    border-radius: 0.625rem;
    padding: 0.75rem;
    font-size: 0.85rem;
    font-family: inherit;
    resize: vertical;
    min-height: 85px;
    box-sizing: border-box;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;

    &:focus {
      border-color: rgba(239, 68, 68, 0.5);
      box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
    }
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
`;

const REASON_OPTIONS = [
    { value: 'Hongos', label: 'Hongos' },
    { value: 'Plagas', label: 'Plagas' },
    { value: 'Estrés', label: 'Estrés' },
    { value: 'Descarte', label: 'Descarte' },
    { value: 'Macho', label: 'Macho' },
    { value: 'Hermafrodita', label: 'Hermafrodita' },
    { value: 'Mala Genética', label: 'Mala Genética' }
];

export interface DeleteReasonModalProps {
    isOpen: boolean;
    title?: string;
    itemName?: string;
    onConfirm: (reason: string, notes: string) => void;
    onCancel: () => void;
    isSubmitting?: boolean;
}

export const DeleteReasonModal: React.FC<DeleteReasonModalProps> = ({
    isOpen,
    title = 'Dar de baja unidad',
    itemName,
    onConfirm,
    onCancel,
    isSubmitting = false
}) => {
    const [reason, setReason] = useState<string>(REASON_OPTIONS[0].value);
    const [notes, setNotes] = useState('');

    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm(reason, notes);
        setTimeout(() => setNotes(''), 300);
    };

    return (
        <Overlay onClick={!isSubmitting ? onCancel : undefined}>
            <ModalContainer onClick={e => e.stopPropagation()}>
                {!isSubmitting && (
                    <CloseButton onClick={onCancel} title="Cerrar modal">
                        <LucideX size={16} />
                    </CloseButton>
                )}

                <Header>
                    <div className="icon-wrapper">
                        <AlertTriangle size={22} />
                    </div>
                    <div className="text-content">
                        <h3>{title}</h3>
                        <p>
                            Estás a punto de eliminar {itemName ? <strong style={{ color: '#f8fafc' }}>{itemName}</strong> : 'esta unidad'}.
                            Indica el motivo para mantener las métricas fitosanitarias actualizadas.
                        </p>
                    </div>
                </Header>

                <FormGroup style={{ zIndex: 10 }}>
                    <label>Motivo principal de baja *</label>
                    <CustomSelect
                        value={reason}
                        onChange={(val) => setReason(val as string)}
                        options={REASON_OPTIONS}
                    />
                </FormGroup>

                <FormGroup>
                    <label>Notas adicionales (Opcional)</label>
                    <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Ej: Aparecieron signos de oídio en las hojas bajas..."
                        disabled={isSubmitting}
                    />
                </FormGroup>

                <ButtonGroup>
                    <ShadcnButton variant="secondary" onClick={onCancel} disabled={isSubmitting}>
                        Cancelar
                    </ShadcnButton>
                    <ShadcnButton variant="destructive" onClick={handleConfirm} disabled={isSubmitting}>
                        <Trash2 size={15} style={{ marginRight: 6 }} />
                        {isSubmitting ? 'Eliminando...' : 'Dar de Baja'}
                    </ShadcnButton>
                </ButtonGroup>
            </ModalContainer>
        </Overlay>
    );
};
