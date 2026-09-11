import React, { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { Edit3, X } from 'lucide-react';
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

const DialogContent = styled.div<{ $isClosing: boolean }>`
  background: rgba(15, 23, 42, 0.92);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 1.5rem 1.75rem;
  border-radius: 1.25rem;
  width: 90%;
  max-width: 440px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.08);
  animation: ${p => p.$isClosing ? css`${scaleOut} 0.18s ease-in forwards` : css`${scaleIn} 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards`};
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;

  .title-group {
    display: flex;
    align-items: center;
    gap: 0.75rem;

    .icon-wrapper {
      width: 34px;
      height: 34px;
      border-radius: 9px;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.25);
      color: #34d399;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    h3 {
      margin: 0;
      color: #f8fafc;
      font-size: 1.15rem;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
  }

  .close-btn {
    background: transparent;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    padding: 6px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.08);
      color: #f8fafc;
    }
  }
`;

const StyledInput = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.75rem;
  font-size: 0.95rem;
  font-weight: 500;
  margin-bottom: 1.5rem;
  background: rgba(2, 6, 23, 0.55);
  color: #f8fafc;
  box-sizing: border-box;
  transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);

  &:focus {
    outline: none;
    background: rgba(2, 6, 23, 0.75);
    border-color: rgba(16, 185, 129, 0.6);
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.18);
  }

  &::placeholder {
    color: #64748b;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
`;

export interface PromptModalProps {
  isOpen: boolean;
  title: string;
  initialValue?: string;
  placeholder?: string;
  onClose: () => void;
  onConfirm: (value: string) => void;
  confirmButtonColor?: 'primary' | 'green';
}

export const PromptModal: React.FC<PromptModalProps> = ({
  isOpen,
  title,
  initialValue = '',
  placeholder = '',
  onClose,
  onConfirm
}) => {
  const [value, setValue] = useState(initialValue);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setValue(initialValue);
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
  }, [isOpen, initialValue]);

  if (!isVisible && !isOpen) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 180);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    onConfirm(value.trim());
    handleClose();
  };

  return (
    <Overlay $isClosing={isClosing} onClick={handleClose}>
      <DialogContent $isClosing={isClosing} onClick={(e) => e.stopPropagation()}>
        <HeaderRow>
          <div className="title-group">
            <div className="icon-wrapper">
              <Edit3 size={16} />
            </div>
            <h3>{title}</h3>
          </div>
          <button type="button" className="close-btn" onClick={handleClose} title="Cerrar">
            <X size={17} />
          </button>
        </HeaderRow>

        <form onSubmit={handleSubmit}>
          <StyledInput
            autoFocus
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
          />
          <ButtonGroup>
            <ShadcnButton type="button" variant="secondary" size="sm" onClick={handleClose}>
              Cancelar
            </ShadcnButton>
            <ShadcnButton type="submit" variant="default" size="sm" disabled={!value.trim()}>
              Guardar
            </ShadcnButton>
          </ButtonGroup>
        </form>
      </DialogContent>
    </Overlay>
  );
};

export default PromptModal;
