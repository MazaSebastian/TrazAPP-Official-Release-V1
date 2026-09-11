import React, { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { AlertTriangle, Loader2 } from 'lucide-react';
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

const Overlay = styled.div<{ $isClosing: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(8px);
  animation: ${p => p.$isClosing ? css`${fadeOut} 0.18s ease-in forwards` : css`${fadeIn} 0.2s ease-out forwards`};
`;

const Content = styled.div<{ $isClosing: boolean }>`
  background: rgba(15, 23, 42, 0.92);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 2rem;
  border-radius: 1.25rem;
  width: 90%;
  max-width: 440px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.08);
  animation: ${p => p.$isClosing ? css`${scaleOut} 0.18s ease-in forwards` : css`${scaleIn} 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards`};
  text-align: center;

  h3 {
    margin-top: 1rem;
    color: #f87171;
    margin-bottom: 0.5rem;
    font-size: 1.25rem;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  p {
    color: #94a3b8;
    margin-bottom: 1.25rem;
    font-size: 0.925rem;
    line-height: 1.5;
  }
`;

const IconWrapper = styled.div`
  width: 52px;
  height: 52px;
  background: rgba(239, 68, 68, 0.12);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(2, 6, 23, 0.55);
  color: #f8fafc;
  border-radius: 0.75rem;
  font-size: 0.95rem;
  margin-bottom: 0.5rem;
  text-align: center;
  box-sizing: border-box;
  transition: all 0.2s;

  &:focus {
    outline: none;
    background: rgba(2, 6, 23, 0.75);
    border-color: rgba(239, 68, 68, 0.6);
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.18);
  }

  &::placeholder {
    color: #64748b;
  }
`;

const VerificationText = styled.div`
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-weight: 700;
  color: #f8fafc;
  margin-bottom: 1rem;
  user-select: all;
  letter-spacing: 0.02em;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 1.5rem;
`;

export interface DeleteProtectionModalProps {
  isOpen: boolean;
  itemType: string;
  itemName: string;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export const DeleteProtectionModal: React.FC<DeleteProtectionModalProps> = ({
  isOpen,
  itemType,
  itemName,
  onClose,
  onConfirm,
  isLoading = false
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setInputValue('');
      setIsVisible(true);
      setIsClosing(false);
    } else {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setIsClosing(false);
      }, 180);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible && !isOpen) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 180);
  };

  const isMatch = inputValue.trim().toLowerCase() === itemName.trim().toLowerCase();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isMatch && !isLoading) {
      onConfirm();
    }
  };

  return (
    <Overlay $isClosing={isClosing} onClick={handleClose}>
      <Content $isClosing={isClosing} onClick={(e) => e.stopPropagation()}>
        <IconWrapper>
          <AlertTriangle size={24} />
        </IconWrapper>

        <h3>Eliminar {itemType}</h3>
        <p>
          Esta acción es destructiva e irreversible. Para confirmar, escribe el nombre del {itemType.toLowerCase()}:
        </p>

        <VerificationText>{itemName}</VerificationText>

        <form onSubmit={handleSubmit}>
          <Input
            autoFocus
            type="text"
            placeholder="Escribe el nombre aquí..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
          />

          <ButtonGroup>
            <ShadcnButton
              type="button"
              variant="secondary"
              size="md"
              onClick={handleClose}
              disabled={isLoading}
              style={{ flex: 1 }}
            >
              Cancelar
            </ShadcnButton>
            <ShadcnButton
              type="submit"
              variant="destructive"
              size="md"
              disabled={!isMatch || isLoading}
              style={{ flex: 1 }}
            >
              {isLoading && <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />}
              Eliminar
            </ShadcnButton>
          </ButtonGroup>
        </form>
      </Content>
    </Overlay>
  );
};

export default DeleteProtectionModal;
