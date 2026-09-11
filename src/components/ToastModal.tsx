import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import styled, { keyframes, css } from 'styled-components';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
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
  from { transform: scale(0.95) translateY(6px); opacity: 0; }
  to { transform: scale(1) translateY(0); opacity: 1; }
`;

const scaleOut = keyframes`
  from { transform: scale(1) translateY(0); opacity: 1; }
  to { transform: scale(0.95) translateY(6px); opacity: 0; }
`;

const Overlay = styled.div<{ $animate: boolean; $isClosing?: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 11000;
  backdrop-filter: blur(8px);
  animation: ${p => p.$isClosing
    ? css`${fadeOut} 0.18s ease-in forwards`
    : p.$animate ? css`${fadeIn} 0.2s ease-out forwards` : 'none'};
`;

const Content = styled.div<{ $isClosing?: boolean }>`
  background: rgba(15, 23, 42, 0.92);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 2rem 2.25rem;
  border-radius: 1.25rem;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.08);
  animation: ${p => p.$isClosing ? css`${scaleOut} 0.18s ease-in forwards` : css`${scaleIn} 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards`};
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const IconWrapper = styled.div<{ type: 'success' | 'error' | 'info' }>`
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 1.25rem;

  background: ${p =>
    p.type === 'success'
      ? 'rgba(16, 185, 129, 0.12)'
      : p.type === 'error'
      ? 'rgba(239, 68, 68, 0.12)'
      : 'rgba(56, 189, 248, 0.12)'};

  border: 1px solid ${p =>
    p.type === 'success'
      ? 'rgba(16, 185, 129, 0.25)'
      : p.type === 'error'
      ? 'rgba(239, 68, 68, 0.25)'
      : 'rgba(56, 189, 248, 0.25)'};

  color: ${p =>
    p.type === 'success'
      ? '#34d399'
      : p.type === 'error'
      ? '#f87171'
      : '#38bdf8'};
`;

const Message = styled.p`
  color: #f8fafc;
  font-size: 1.05rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  margin: 0 0 1.5rem 0;
  line-height: 1.5;
`;

export interface ToastModalProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
  type?: 'success' | 'error' | 'info';
  animateOverlay?: boolean;
}

export const ToastModal: React.FC<ToastModalProps> = ({
  isOpen,
  message,
  onClose,
  type = 'info',
  animateOverlay = true
}) => {
  const [isClosing, setIsClosing] = React.useState(false);

  useEffect(() => {
    if (isOpen) setIsClosing(false);
  }, [isOpen]);

  const handleClose = React.useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 180);
  }, [onClose]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, handleClose]);

  if (!isOpen && !isClosing) return null;

  return createPortal(
    <Overlay onClick={handleClose} $animate={animateOverlay} $isClosing={isClosing}>
      <Content onClick={e => e.stopPropagation()} $isClosing={isClosing}>
        <IconWrapper type={type}>
          {type === 'success' && <CheckCircle2 size={26} />}
          {type === 'error' && <AlertCircle size={26} />}
          {type === 'info' && <Info size={26} />}
        </IconWrapper>
        <Message>{message}</Message>
        <ShadcnButton
          size="md"
          variant={type === 'error' ? 'destructive' : 'default'}
          onClick={handleClose}
          style={{ minWidth: '140px' }}
        >
          Aceptar
        </ShadcnButton>
      </Content>
    </Overlay>,
    document.body
  );
};

export default ToastModal;
