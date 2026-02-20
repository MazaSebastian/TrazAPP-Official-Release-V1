import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { FaExclamationTriangle } from 'react-icons/fa';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

const scaleIn = keyframes`
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
`;

const scaleOut = keyframes`
  from { transform: scale(1); opacity: 1; }
  to { transform: scale(0.95); opacity: 0; }
`;

const Overlay = styled.div<{ isClosing: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(4px);
  animation: ${p => p.isClosing ? fadeOut : fadeIn} 0.2s ease-in-out forwards;
`;

const Content = styled.div<{ isClosing: boolean }>`
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 2rem;
  border-radius: 1rem;
  width: 90%;
  max-width: 450px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
  animation: ${p => p.isClosing ? scaleOut : scaleIn} 0.2s ease-in-out forwards;
  text-align: center;

  h3 {
    margin-top: 1rem;
    color: #f87171;
    margin-bottom: 0.5rem;
    font-size: 1.25rem;
    font-weight: 700;
  }

  p {
    color: #cbd5e1;
    margin-bottom: 1.5rem;
    line-height: 1.5;
  }
`;

const IconWrapper = styled.div`
  width: 60px;
  height: 60px;
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  margin: 0 auto;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(15, 23, 42, 0.6);
  color: #f8fafc;
  border-radius: 0.5rem;
  font-size: 1rem;
  margin-bottom: 0.5rem;
  text-align: center;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: rgba(239, 68, 68, 0.5);
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
  }

  &::placeholder {
    color: #64748b;
  }
`;

const VerificationText = styled.div`
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.5rem;
  border-radius: 0.5rem;
  font-family: monospace;
  font-weight: bold;
  color: #f8fafc;
  margin-bottom: 1rem;
  user-select: all;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 1.5rem;
`;

const Button = styled.button<{ variant?: 'danger' | 'secondary' }>`
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  border: ${p => p.variant === 'secondary' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(239, 68, 68, 0.5)'};
  background: ${p => p.variant === 'secondary' ? 'rgba(30, 41, 59, 0.6)' : 'rgba(239, 68, 68, 0.2)'};
  color: ${p => p.variant === 'secondary' ? '#cbd5e1' : '#f87171'};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 120px;

  &:hover {
    background: ${p => p.variant === 'secondary' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(239, 68, 68, 0.3)'};
    color: ${p => p.variant === 'secondary' ? '#f8fafc' : '#f87171'};
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

interface DeleteProtectionModalProps {
  isOpen: boolean;
  itemType: string; // e.g., "Cultivo", "Sala"
  itemName: string; // e.g., "Aurora"
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
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible && !isOpen) return null;

  const handleClose = () => {
    if (!isLoading) {
      setIsClosing(true);
      setTimeout(onClose, 200);
    }
  };

  const handleConfirm = () => {
    if (inputValue === itemName) {
      onConfirm();
      // Don't animate close here on success as we normally wait for parent update or switch to Toast
      // However, if we want to smooth transition to Toast, we might want to just let parent handle unmount
      // But based on previous tasks, we want seamless transition to Toast.
      // If we animate out here, we might introduce a gap before Toast.
      // The implementation in Crops.tsx sets isLoading then eventually closes.
      // If we animate out, it fades.
      // Let's stick to standard behavior. If user cancels, it fades out.
      // If confirmed, parent closes it.
      // Since parent just sets isOpen=false, the useEffect above will handle the fade out!
      // WAIT. If parent sets isOpen=false immediately on success, the useEffect triggers fade out.
      // But we previously wanted seamless transition to Toast.
      // If it fades out, we see the background, then Toast fades in (or pops).
      // The user wanted " seamless transition".
      // Previous task: "Update Crops.tsx to disable toast animation on delete success".
      // If this modal fades out, that seamless transition might be broken.
      // Actually, if isOpen becomes false, it fades out.
      // We might need a prop to skip animation?
      // Or maybe the user WANTS the fade out now?
      // "When closing with X, it should fade out".
      // The user didn't specify behavior on Confirm.
      // However, on Confirm success, the component is unmounted or isOpen set to false.
      // If I use the useEffect logic, it WILL fade out.
      // This implies a 200ms delay before unmounting.
      // This might introduce a brief flash of the underlying content before the Toast appears,
      // OR if the Toast appears immediately, they might overlap.
      // But Toast covers the screen.
      // Let's implement the generic close animation requested.
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue === itemName) {
      handleConfirm();
    } else if (e.key === 'Escape') {
      handleClose();
    }
  };

  return (
    <Overlay isClosing={isClosing}>
      <Content isClosing={isClosing}>
        <IconWrapper>
          <FaExclamationTriangle />
        </IconWrapper>
        <h3>Zona de Peligro</h3>
        <p>
          Estás a punto de eliminar el {itemType} <strong>"{itemName}"</strong>.<br />
          Esta acción es permanente y no se puede deshacer.
        </p>

        <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Escribe el nombre para confirmar:</p>
        <VerificationText>{itemName}</VerificationText>

        <Input
          autoFocus
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe el nombre aquí..."
          disabled={isLoading}
        />

        <ButtonGroup>
          <Button onClick={handleClose} variant="secondary" disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            variant="danger"
            disabled={inputValue !== itemName || isLoading}
            style={{ opacity: isLoading ? 0.7 : 1, cursor: isLoading ? 'wait' : 'pointer' }}
          >
            {isLoading ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </ButtonGroup>
      </Content>
    </Overlay>
  );
};
