import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { FaExclamationTriangle } from 'react-icons/fa';

const Overlay = styled.div<{ $visible: boolean }>`
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
  backdrop-filter: blur(8px);
  opacity: ${p => p.$visible ? 1 : 0};
  transition: opacity 0.3s ease-in-out;
  pointer-events: ${p => p.$visible ? 'auto' : 'none'};
`;

const Content = styled.div<{ $visible: boolean; $maxWidth?: string }>`
  background: rgba(15, 23, 42, 0.95);
  padding: 2rem;
  border-radius: 1rem;
  width: 90%;
  max-width: ${p => p.$maxWidth || '400px'};
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  text-align: center;
  transform: ${p => p.$visible ? 'scale(1)' : 'scale(0.95)'};
  opacity: ${p => p.$visible ? 1 : 0};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  h3 {
    margin-top: 1rem;
    color: #f8fafc;
    margin-bottom: 0.5rem;
    font-size: 1.25rem;
    font-weight: 700;
  }

  p {
    color: #94a3b8;
    margin-bottom: 1.5rem;
    line-height: 1.5;
  }
`;

const IconWrapper = styled.div`
  width: 56px;
  height: 56px;
  background: rgba(229, 62, 62, 0.15);
  color: #fc8181;
  border: 1px solid rgba(229, 62, 62, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  margin: 0 auto;
  box-shadow: 0 0 20px rgba(229, 62, 62, 0.2);
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.75rem;
`;

const Button = styled.button<{ variant?: 'primary' | 'danger' | 'secondary' }>`
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  border: 1px solid ${p =>
    p.variant === 'secondary' ? 'rgba(255, 255, 255, 0.1)' :
      p.variant === 'danger' ? 'rgba(229, 62, 62, 0.3)' :
        'rgba(74, 222, 128, 0.3)'
  };
  background: ${p =>
    p.variant === 'secondary' ? 'rgba(255, 255, 255, 0.05)' :
      p.variant === 'danger' ? 'rgba(155, 44, 44, 0.3)' :
        'rgba(20, 83, 45, 0.3)'
  };
  color: ${p =>
    p.variant === 'secondary' ? '#94a3b8' :
      p.variant === 'danger' ? '#fc8181' :
        '#4ade80'
  };
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 120px;
  backdrop-filter: blur(4px);
  position: relative;
  overflow: hidden;

  /* Subtle top highlight for glass effect */
  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%);
    pointer-events: none;
  }

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px ${p =>
    p.variant === 'secondary' ? 'rgba(0,0,0,0.4)' :
      p.variant === 'danger' ? 'rgba(229, 62, 62, 0.15)' :
        'rgba(74, 222, 128, 0.15)'
  };
    background: ${p =>
    p.variant === 'secondary' ? 'rgba(255, 255, 255, 0.1)' :
      p.variant === 'danger' ? 'rgba(155, 44, 44, 0.5)' :
        'rgba(20, 83, 45, 0.5)'
  };
    border-color: ${p =>
    p.variant === 'secondary' ? 'rgba(255, 255, 255, 0.2)' :
      p.variant === 'danger' ? '#fc8181' :
        '#4ade80'
  };
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
`;

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  onClose: () => void;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  isLoading?: boolean;
  maxWidth?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  onClose,
  onConfirm,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDanger = false,
  isLoading = false,
  maxWidth
}) => {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Small delay to allow render before transition
      setTimeout(() => setIsVisible(true), 50);
    } else {
      setIsVisible(false);
      // Wait for transition to finish before unmounting
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose, isLoading]);

  if (!shouldRender) return null;

  return (
    <Overlay $visible={isVisible} onClick={onClose}>
      <Content $visible={isVisible} $maxWidth={maxWidth} onClick={e => e.stopPropagation()}>
        <IconWrapper>
          <FaExclamationTriangle />
        </IconWrapper>
        <h3>{title}</h3>
        <p>{message}</p>
        <ButtonGroup>
          {cancelText && (
            <Button onClick={onClose} variant="secondary" disabled={isLoading}>
              {cancelText}
            </Button>
          )}
          <Button
            onClick={onConfirm}
            variant={isDanger ? 'danger' : 'primary'}
            disabled={isLoading}
            style={{ opacity: isLoading ? 0.7 : 1, cursor: isLoading ? 'wait' : 'pointer' }}
          >
            {isLoading ? 'Procesando...' : confirmText}
          </Button>
        </ButtonGroup>
      </Content>
    </Overlay>
  );
};
