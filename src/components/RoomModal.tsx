import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { Warehouse, X, Layers, Hash, Type } from 'lucide-react';
import { ShadcnButton } from './ui/Button';
import { CustomSelect, Option } from './CustomSelect';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

const scaleIn = keyframes`
  from {
    transform: scale(0.96) translateY(8px);
    opacity: 0;
  }
  to {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
`;

const scaleOut = keyframes`
  from {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
  to {
    transform: scale(0.96) translateY(8px);
    opacity: 0;
  }
`;

const ModalOverlay = styled.div<{ $isClosing: boolean }>`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.78);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  padding: 1rem;
  animation: ${p => p.$isClosing ? fadeOut : fadeIn} 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
`;

const ModalContent = styled.div<{ $isClosing: boolean }>`
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(28px);
  -webkit-backdrop-filter: blur(28px);
  padding: 2.25rem;
  border-radius: 1.25rem;
  width: 92%;
  max-width: 520px;
  box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
  animation: ${p => p.$isClosing ? scaleOut : scaleIn} 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
`;

const AmbientGlow = styled.div`
  position: absolute;
  top: -60px;
  left: 50%;
  transform: translateX(-50%);
  width: 320px;
  height: 140px;
  background: radial-gradient(ellipse at center, rgba(16, 185, 129, 0.22) 0%, rgba(16, 185, 129, 0) 75%);
  pointer-events: none;
`;

const ModalHeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.75rem;

  .header-left {
    display: flex;
    align-items: center;
    gap: 0.85rem;

    .icon-badge {
      width: 44px;
      height: 44px;
      border-radius: 0.75rem;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 20px rgba(16, 185, 129, 0.15);
      flex-shrink: 0;
    }

    .title-texts {
      display: flex;
      flex-direction: column;

      h2 {
        margin: 0;
        color: #f8fafc;
        font-size: 1.35rem;
        font-weight: 700;
        letter-spacing: -0.02em;
      }

      p {
        margin: 0.25rem 0 0 0;
        font-size: 0.825rem;
        color: #94a3b8;
        line-height: 1.3;
      }
    }
  }
`;

const CloseButton = styled.button`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #94a3b8;
  cursor: pointer;
  width: 34px;
  height: 34px;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  flex-shrink: 0;

  &:hover {
    color: #f1f5f9;
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.2);
    transform: scale(1.04);
  }

  &:active {
    transform: scale(0.96);
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.35rem;

  label {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    margin-bottom: 0.5rem;
    color: #cbd5e1;
    font-size: 0.85rem;
    font-weight: 600;

    .label-icon {
      color: #34d399;
    }
  }

  input {
    width: 100%;
    padding: 0.75rem 1rem;
    background: rgba(15, 23, 42, 0.65);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 0.65rem;
    color: #f8fafc;
    font-size: 0.92rem;
    outline: none;
    box-sizing: border-box;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

    &::placeholder {
      color: #64748b;
    }

    &:hover {
      border-color: rgba(255, 255, 255, 0.22);
      background: rgba(15, 23, 42, 0.8);
    }

    &:focus {
      border-color: rgba(16, 185, 129, 0.6);
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.18);
    }
  }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 2rem;
`;

const ROOM_TYPE_OPTIONS: Option[] = [
  { value: 'vegetation', label: 'Vegetativo (Vegetation)' },
  { value: 'flowering', label: 'Floración (Flowering)' },
  { value: 'drying', label: 'Secado / Curado (Drying)' },
  { value: 'living_soil', label: 'Living Soil / Orgánico' },
  { value: 'mother', label: 'Plantas Madre (Mother)' },
  { value: 'clones', label: 'Esquejera / Clones' },
];

export interface RoomFormData {
  name: string;
  type: string;
  capacity: number;
}

interface RoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (room: RoomFormData) => Promise<void> | void;
  initialData?: RoomFormData;
  isEditing?: boolean;
}

export const RoomModal: React.FC<RoomModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData = { name: '', type: 'vegetation', capacity: 0 },
  isEditing = false,
}) => {
  const [formData, setFormData] = useState<RoomFormData>(initialData);
  const [isVisible, setIsVisible] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData(initialData);
      setIsVisible(true);
      setIsClosing(false);
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else if (isVisible && !isClosing) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setIsClosing(false);
      }, 190);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialData, isVisible, isClosing]);

  const handleClose = () => {
    if (isSubmitting || isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
      onClose();
    }, 190);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSave(formData);
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!isOpen && !isVisible && !isClosing) return null;

  return (
    <ModalOverlay $isClosing={isClosing} onClick={handleClose} onKeyDown={handleKeyDown}>
      <ModalContent $isClosing={isClosing} onClick={(e) => e.stopPropagation()}>
        <AmbientGlow />

        <ModalHeaderRow>
          <div className="header-left">
            <div className="icon-badge">
              <Warehouse size={22} color="#34d399" />
            </div>
            <div className="title-texts">
              <h2>{isEditing ? 'Editar Sala' : 'Nueva Sala de Cultivo'}</h2>
              <p>
                {isEditing
                  ? 'Modifica los parámetros y capacidad del espacio de cultivo'
                  : 'Configura un nuevo espacio para la gestión integral de cultivos'}
              </p>
            </div>
          </div>
          <CloseButton onClick={handleClose} aria-label="Cerrar modal">
            <X size={18} />
          </CloseButton>
        </ModalHeaderRow>

        <FormGroup>
          <label>
            <Type size={14} className="label-icon" /> Nombre de la Sala
          </label>
          <input
            ref={inputRef}
            type="text"
            placeholder="Ej: Sala Vegetativo A / Floración 1"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </FormGroup>

        <FormGroup>
          <label>
            <Layers size={14} className="label-icon" /> Etapa / Tipo de Sala
          </label>
          <CustomSelect
            options={ROOM_TYPE_OPTIONS}
            value={formData.type}
            onChange={(val) => setFormData({ ...formData, type: val })}
          />
        </FormGroup>

        <FormGroup>
          <label>
            <Hash size={14} className="label-icon" /> Capacidad Estimada (Plantas)
          </label>
          <input
            type="number"
            placeholder="Ej: 100"
            min={0}
            value={formData.capacity || ''}
            onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
          />
        </FormGroup>

        <ModalActions>
          <ShadcnButton variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </ShadcnButton>
          <ShadcnButton
            variant="default"
            onClick={handleSubmit}
            disabled={!formData.name.trim() || isSubmitting}
            isLoading={isSubmitting}
          >
            {isEditing ? 'Guardar Cambios' : 'Crear Sala'}
          </ShadcnButton>
        </ModalActions>
      </ModalContent>
    </ModalOverlay>
  );
};
