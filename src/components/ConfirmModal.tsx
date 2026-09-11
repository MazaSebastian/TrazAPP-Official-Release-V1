import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button as ShadcnButton } from './ui/Button';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const Overlay = styled.div<{ $visible: boolean }>`
  position: fixed;
  inset: 0;
  background: rgba(3, 7, 18, 0.82);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(12px);
  opacity: ${p => (p.$visible ? 1 : 0)};
  transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  pointer-events: ${p => (p.$visible ? 'auto' : 'none')};
  padding: 1rem;
`;

const Content = styled.div<{ $visible: boolean; $maxWidth?: string }>`
  background: rgba(15, 23, 42, 0.96);
  backdrop-filter: blur(24px);
  padding: 2rem;
  border-radius: 1.25rem;
  width: 100%;
  max-width: ${p => p.$maxWidth || '440px'};
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 25px 60px -12px rgba(0, 0, 0, 0.7);
  text-align: center;
  transform: ${p => (p.$visible ? 'scale(1) translateY(0)' : 'scale(0.96) translateY(8px)')};
  opacity: ${p => (p.$visible ? 1 : 0)};
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);

  @media (max-width: 768px) {
    padding: 1.5rem;
  }

  h3 {
    margin-top: 1.25rem;
    color: #f8fafc;
    margin-bottom: 0.5rem;
    font-size: 1.25rem;
    font-weight: 700;
    letter-spacing: -0.01em;
  }

  p {
    color: #94a3b8;
    margin-bottom: 1.75rem;
    line-height: 1.55;
    font-size: 0.95rem;
  }
`;

const IconWrapper = styled.div<{ $isDanger?: boolean }>`
  width: 58px;
  height: 58px;
  background: ${p => (p.$isDanger ? 'rgba(239, 68, 68, 0.15)' : 'rgba(74, 222, 128, 0.15)')};
  color: ${p => (p.$isDanger ? '#f87171' : '#4ade80')};
  border: 1px solid ${p => (p.$isDanger ? 'rgba(239, 68, 68, 0.3)' : 'rgba(74, 222, 128, 0.3)')};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  box-shadow: 0 0 24px ${p => (p.$isDanger ? 'rgba(239, 68, 68, 0.2)' : 'rgba(74, 222, 128, 0.2)')};
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.75rem;

  @media (max-width: 768px) {
    flex-direction: column;
    button {
      width: 100%;
    }
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
      const timer = setTimeout(() => setIsVisible(true), 30);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setShouldRender(false), 250);
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
        <IconWrapper $isDanger={isDanger}>
          {isDanger ? <AlertTriangle size={28} /> : <CheckCircle2 size={28} />}
        </IconWrapper>
        <h3>{title}</h3>
        <p>{message}</p>
        <ButtonGroup>
          {cancelText && (
            <ShadcnButton
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
              style={{ minWidth: '110px' }}
            >
              {cancelText}
            </ShadcnButton>
          )}
          <ShadcnButton
            variant={isDanger ? 'destructive' : 'default'}
            onClick={onConfirm}
            isLoading={isLoading}
            style={{ minWidth: '120px' }}
          >
            {confirmText}
          </ShadcnButton>
        </ButtonGroup>
      </Content>
    </Overlay>
  );
};
