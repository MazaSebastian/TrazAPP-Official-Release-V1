import React from 'react';
import styled, { keyframes, css } from 'styled-components';
import { AlertTriangle, CheckCircle2, Info, Loader2 } from 'lucide-react';
import { Button as ShadcnButton } from './ui/Button';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

const scaleIn = keyframes`
  from { transform: scale(0.96) translateY(6px); opacity: 0; }
  to { transform: scale(1) translateY(0); opacity: 1; }
`;

const scaleOut = keyframes`
  from { transform: scale(1) translateY(0); opacity: 1; }
  to { transform: scale(0.96) translateY(6px); opacity: 0; }
`;

export interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  variant?: 'primary' | 'danger' | 'success';
  isClosing?: boolean;
  isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  isDestructive = false,
  variant = isDestructive ? 'danger' : 'primary',
  isClosing = false,
  isLoading = false
}) => {
  if (!isOpen && !isClosing) return null;

  return (
    <Overlay $isClosing={isClosing} onClick={onCancel}>
      <ModalContainer onClick={(e) => e.stopPropagation()} $isClosing={isClosing}>
        <IconWrapper $variant={variant}>
          {variant === 'danger' ? (
            <AlertTriangle size={22} />
          ) : variant === 'success' ? (
            <CheckCircle2 size={22} />
          ) : (
            <Info size={22} />
          )}
        </IconWrapper>

        <Title>{title}</Title>
        <Message>{message}</Message>

        <ButtonGroup>
          <ShadcnButton
            type="button"
            variant="secondary"
            size="md"
            onClick={onCancel}
            disabled={isLoading}
            style={{ flex: 1 }}
          >
            {cancelText}
          </ShadcnButton>
          <ShadcnButton
            type="button"
            variant={variant === 'danger' ? 'destructive' : 'default'}
            size="md"
            onClick={onConfirm}
            disabled={isLoading}
            style={{ flex: 1 }}
          >
            {isLoading && <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />}
            {confirmText}
          </ShadcnButton>
        </ButtonGroup>
      </ModalContainer>
    </Overlay>
  );
};

const Overlay = styled.div<{ $isClosing?: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  backdrop-filter: blur(8px);
  animation: ${p => p.$isClosing ? css`${fadeOut} 0.18s ease-in forwards` : css`${fadeIn} 0.2s ease-out forwards`};
`;

const ModalContainer = styled.div<{ $isClosing?: boolean }>`
  background: rgba(15, 23, 42, 0.92);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 1.75rem 2rem;
  border-radius: 1.25rem;
  width: 90%;
  max-width: 420px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  animation: ${p => p.$isClosing ? css`${scaleOut} 0.18s ease-in forwards` : css`${scaleIn} 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards`};
`;

const IconWrapper = styled.div<{ $variant: 'primary' | 'danger' | 'success' }>`
  width: 50px;
  height: 50px;
  border-radius: 14px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 1.1rem;

  background: ${props =>
    props.$variant === 'danger'
      ? 'rgba(239, 68, 68, 0.12)'
      : props.$variant === 'success'
      ? 'rgba(16, 185, 129, 0.12)'
      : 'rgba(56, 189, 248, 0.12)'};

  border: 1px solid ${props =>
    props.$variant === 'danger'
      ? 'rgba(239, 68, 68, 0.25)'
      : props.$variant === 'success'
      ? 'rgba(16, 185, 129, 0.25)'
      : 'rgba(56, 189, 248, 0.25)'};

  color: ${props =>
    props.$variant === 'danger'
      ? '#f87171'
      : props.$variant === 'success'
      ? '#34d399'
      : '#38bdf8'};
`;

const Title = styled.h3`
  margin: 0 0 0.5rem 0;
  color: #f8fafc;
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: -0.02em;
`;

const Message = styled.p`
  color: #94a3b8;
  margin: 0 0 1.5rem 0;
  font-size: 0.925rem;
  line-height: 1.5;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;
  width: 100%;
`;

export default ConfirmationModal;
