import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { FaTrash, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import { CustomSelect } from './CustomSelect';

const fadeIn = keyframes`
  from { opacity: 0; backdrop-filter: blur(0px); }
  to { opacity: 1; backdrop-filter: blur(8px); }
`;

const scaleUp = keyframes`
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(8px);
  z-index: 5000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  animation: ${fadeIn} 0.2s ease-out;
`;

const ModalContainer = styled.div`
  background: rgba(30, 41, 59, 0.95);
  border: 1px solid rgba(239, 68, 68, 0.2);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(239, 68, 68, 0.1);
  border-radius: 1rem;
  width: 100%;
  max-width: 450px;
  padding: 1.5rem;
  animation: ${scaleUp} 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;

  .icon-wrapper {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    padding: 0.75rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .text-content {
    h3 {
      margin: 0 0 0.5rem 0;
      color: #f8fafc;
      font-size: 1.25rem;
      font-weight: 600;
    }
    p {
      margin: 0;
      color: #94a3b8;
      font-size: 0.9rem;
      line-height: 1.4;
    }
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #f8fafc;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  label {
    font-size: 0.85rem;
    color: #cbd5e1;
    font-weight: 500;
  }

  textarea {
    width: 100%;
    background: rgba(15, 23, 42, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #f8fafc;
    border-radius: 0.5rem;
    padding: 0.75rem;
    font-size: 0.9rem;
    font-family: inherit;
    resize: vertical;
    min-height: 80px;

    &:focus {
      outline: none;
      border-color: rgba(239, 68, 68, 0.5);
    }
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 0.5rem;
`;

const Button = styled.button<{ $variant?: 'danger' | 'secondary' }>`
  padding: 0.6rem 1.2rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  ${props => props.$variant === 'danger' ? `
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.3);
    
    &:hover:not(:disabled) {
      background: rgba(239, 68, 68, 0.2);
    }
  ` : `
    background: transparent;
    color: #94a3b8;
    border: 1px solid rgba(255, 255, 255, 0.1);
    
    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.05);
      color: #f8fafc;
    }
  `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
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
        // Reset after success typically handled by unmount, but good practice:
        setTimeout(() => setNotes(''), 300);
    };

    return (
        <Overlay onClick={!isSubmitting ? onCancel : undefined}>
            <ModalContainer onClick={e => e.stopPropagation()}>
                {!isSubmitting && (
                    <CloseButton onClick={onCancel}>
                        <FaTimes />
                    </CloseButton>
                )}

                <Header>
                    <div className="icon-wrapper">
                        <FaExclamationTriangle size={24} />
                    </div>
                    <div className="text-content">
                        <h3>{title}</h3>
                        <p>
                            Estás a punto de eliminar {itemName ? <strong>{itemName}</strong> : 'esta unidad'}.
                            Indica el motivo para mantener las métricas orgánicas actualizadas.
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
                    <Button $variant="secondary" onClick={onCancel} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button $variant="danger" onClick={handleConfirm} disabled={isSubmitting}>
                        <FaTrash />
                        {isSubmitting ? 'Eliminando...' : 'Dar de Baja'}
                    </Button>
                </ButtonGroup>
            </ModalContainer>
        </Overlay>
    );
};
