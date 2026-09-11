import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { StickyNote, X, Check, Plus, Sparkles } from 'lucide-react';
import { Button as ShadcnButton } from './ui/Button';

export type StickyColor = 'yellow' | 'blue' | 'pink' | 'green';

interface StickyNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (content: string, color: StickyColor) => Promise<void> | void;
  initialContent?: string;
  initialColor?: StickyColor;
  title?: string;
  subtitle?: string;
  placeholder?: string;
  isSaving?: boolean;
}

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

const scaleIn = keyframes`
  from { transform: scale(0.96) translateY(8px); opacity: 0; }
  to { transform: scale(1) translateY(0); opacity: 1; }
`;

const scaleOut = keyframes`
  from { transform: scale(1) translateY(0); opacity: 1; }
  to { transform: scale(0.96) translateY(8px); opacity: 0; }
`;

const COLOR_CONFIG: Record<StickyColor, {
  label: string;
  swatch: string;
  accent: string;
  glow: string;
  bgGlass: string;
  borderActive: string;
}> = {
  yellow: {
    label: 'Cálido',
    swatch: '#fef08a',
    accent: '#facc15',
    glow: 'rgba(250, 204, 21, 0.25)',
    bgGlass: 'rgba(250, 204, 21, 0.08)',
    borderActive: 'rgba(250, 204, 21, 0.5)'
  },
  blue: {
    label: 'Celeste',
    swatch: '#bae6fd',
    accent: '#38bdf8',
    glow: 'rgba(56, 189, 248, 0.25)',
    bgGlass: 'rgba(56, 189, 248, 0.08)',
    borderActive: 'rgba(56, 189, 248, 0.5)'
  },
  pink: {
    label: 'Rosa',
    swatch: '#fbcfe8',
    accent: '#f472b6',
    glow: 'rgba(244, 114, 182, 0.25)',
    bgGlass: 'rgba(244, 114, 182, 0.08)',
    borderActive: 'rgba(244, 114, 182, 0.5)'
  },
  green: {
    label: 'Esmeralda',
    swatch: '#bbf7d0',
    accent: '#4ade80',
    glow: 'rgba(74, 222, 128, 0.25)',
    bgGlass: 'rgba(74, 222, 128, 0.08)',
    borderActive: 'rgba(74, 222, 128, 0.5)'
  }
};

export const StickyNoteModal: React.FC<StickyNoteModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialContent = '',
  initialColor = 'yellow',
  title = 'Nueva Nota Adhesiva',
  subtitle = 'Fija un recordatorio rápido visible para tu equipo',
  placeholder = 'Escribe tu recordatorio, dosificación, nota técnica o tarea...',
  isSaving = false
}) => {
  const [content, setContent] = useState(initialContent);
  const [color, setColor] = useState<StickyColor>(initialColor);
  const [isVisible, setIsVisible] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setContent(initialContent);
      setColor(initialColor);
      setIsVisible(true);
      setIsClosing(false);
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
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
  }, [isOpen, initialContent, initialColor, isVisible, isClosing]);

  const handleClose = () => {
    if (isSaving || isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
      onClose();
    }, 190);
  };

  const handleSubmit = async () => {
    if (!content.trim() || isSaving) return;
    await onSave(content.trim(), color);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!isOpen && !isVisible && !isClosing) return null;

  const currentTheme = COLOR_CONFIG[color];

  return (
    <Overlay $isClosing={isClosing} onClick={handleClose} onKeyDown={handleKeyDown}>
      <DialogContent
        $isClosing={isClosing}
        $accentGlow={currentTheme.glow}
        onClick={e => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <AmbientGlow $color={currentTheme.accent} />

        {/* Header */}
        <HeaderRow>
          <div className="title-group">
            <IconBadge $accent={currentTheme.accent} $bg={currentTheme.bgGlass} $border={currentTheme.borderActive}>
              <StickyNote size={18} strokeWidth={2.4} />
            </IconBadge>
            <div>
              <h3>{title}</h3>
              <p>{subtitle}</p>
            </div>
          </div>
          <button className="close-btn" onClick={handleClose} disabled={isSaving} aria-label="Cerrar modal">
            <X size={18} />
          </button>
        </HeaderRow>

        {/* Color Swatches */}
        <SectionLabel>
          <span>Color del papel</span>
        </SectionLabel>
        <ColorPaletteGrid>
          {(Object.keys(COLOR_CONFIG) as StickyColor[]).map(c => {
            const cfg = COLOR_CONFIG[c];
            const isSelected = color === c;
            return (
              <ColorPill
                key={c}
                type="button"
                $isSelected={isSelected}
                $accent={cfg.accent}
                $glow={cfg.glow}
                $bgGlass={cfg.bgGlass}
                $borderActive={cfg.borderActive}
                onClick={() => setColor(c)}
                disabled={isSaving}
              >
                <SwatchDot $color={cfg.swatch} $isSelected={isSelected}>
                  {isSelected && <Check size={11} strokeWidth={3} color="#0f172a" />}
                </SwatchDot>
                <span className="color-name">{cfg.label}</span>
              </ColorPill>
            );
          })}
        </ColorPaletteGrid>

        {/* Textarea Input */}
        <TextareaContainer $accent={currentTheme.accent} $glow={currentTheme.glow}>
          <textarea
            ref={textareaRef}
            placeholder={placeholder}
            value={content}
            onChange={e => setContent(e.target.value)}
            disabled={isSaving}
            maxLength={1000}
          />
          <TextareaFooter>
            <span className="shortcut-hint">
              <kbd>⌘</kbd> + <kbd>Enter</kbd> para fijar
            </span>
            <span className="char-count">{content.length}/1000</span>
          </TextareaFooter>
        </TextareaContainer>

        {/* Actions */}
        <ActionFooter>
          <ShadcnButton
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isSaving}
          >
            Cancelar
          </ShadcnButton>
          <ShadcnButton
            type="button"
            variant="default"
            onClick={handleSubmit}
            disabled={!content.trim() || isSaving}
            isLoading={isSaving}
          >
            {!isSaving && <Plus size={16} strokeWidth={2.5} style={{ marginRight: '0.4rem' }} />}
            Pegar Nota
          </ShadcnButton>
        </ActionFooter>
      </DialogContent>
    </Overlay>
  );
};

export default StickyNoteModal;

// --- Styled Components ---

const Overlay = styled.div<{ $isClosing: boolean }>`
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.78);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2200;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  animation: ${p => p.$isClosing ? css`${fadeOut} 0.18s ease-in forwards` : css`${fadeIn} 0.22s ease-out forwards`};
`;

const DialogContent = styled.div<{ $isClosing: boolean; $accentGlow: string }>`
  position: relative;
  background: rgba(15, 23, 42, 0.94);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 1.5rem 1.75rem;
  border-radius: 1.35rem;
  width: 92%;
  max-width: 480px;
  box-shadow: 
    0 25px 60px -15px rgba(0, 0, 0, 0.8),
    0 0 35px -5px ${p => p.$accentGlow},
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  overflow: hidden;
  animation: ${p => p.$isClosing ? css`${scaleOut} 0.18s ease-in forwards` : css`${scaleIn} 0.24s cubic-bezier(0.16, 1, 0.3, 1) forwards`};
  transition: box-shadow 0.3s ease;
`;

const AmbientGlow = styled.div<{ $color: string }>`
  position: absolute;
  top: -60px;
  right: -60px;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: radial-gradient(circle, ${p => p.$color}25 0%, transparent 70%);
  pointer-events: none;
  transition: background 0.4s ease;
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1.25rem;
  position: relative;
  z-index: 1;

  .title-group {
    display: flex;
    align-items: center;
    gap: 0.85rem;

    h3 {
      margin: 0;
      color: #f8fafc;
      font-size: 1.2rem;
      font-weight: 700;
      letter-spacing: -0.02em;
    }

    p {
      margin: 0.2rem 0 0;
      color: #94a3b8;
      font-size: 0.84rem;
      font-weight: 400;
    }
  }

  .close-btn {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #94a3b8;
    cursor: pointer;
    padding: 7px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.18s ease;

    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.1);
      color: #f8fafc;
      border-color: rgba(255, 255, 255, 0.2);
      transform: scale(1.05);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
`;

const IconBadge = styled.div<{ $accent: string; $bg: string; $border: string }>`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: ${p => p.$bg};
  border: 1px solid ${p => p.$border};
  color: ${p => p.$accent};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px ${p => p.$bg};
  transition: all 0.3s ease;
`;

const SectionLabel = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.65rem;

  span {
    color: #cbd5e1;
    font-size: 0.82rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }
`;

const ColorPaletteGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
  margin-bottom: 1.25rem;
`;

const ColorPill = styled.button<{
  $isSelected: boolean;
  $accent: string;
  $glow: string;
  $bgGlass: string;
  $borderActive: string;
}>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.65rem;
  border-radius: 0.75rem;
  background: ${p => p.$isSelected ? p.$bgGlass : 'rgba(255, 255, 255, 0.03)'};
  border: 1px solid ${p => p.$isSelected ? p.$borderActive : 'rgba(255, 255, 255, 0.08)'};
  box-shadow: ${p => p.$isSelected ? `0 2px 10px ${p.$glow}, inset 0 1px 0 rgba(255, 255, 255, 0.1)` : 'none'};
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  .color-name {
    font-size: 0.8rem;
    font-weight: ${p => p.$isSelected ? 600 : 500};
    color: ${p => p.$isSelected ? '#f8fafc' : '#94a3b8'};
    transition: color 0.15s;
  }

  &:hover:not(:disabled) {
    background: ${p => p.$isSelected ? p.$bgGlass : 'rgba(255, 255, 255, 0.06)'};
    border-color: ${p => p.$isSelected ? p.$borderActive : 'rgba(255, 255, 255, 0.15)'};
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SwatchDot = styled.div<{ $color: string; $isSelected: boolean }>`
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: ${p => p.$color};
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
  transition: transform 0.2s;
  transform: ${p => p.$isSelected ? 'scale(1.1)' : 'scale(1)'};
`;

const TextareaContainer = styled.div<{ $accent: string; $glow: string }>`
  position: relative;
  background: rgba(2, 6, 23, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.85rem;
  padding: 0.85rem 1rem;
  transition: all 0.2s ease;
  margin-bottom: 1.5rem;

  &:focus-within {
    border-color: ${p => p.$accent};
    box-shadow: 0 0 0 3px ${p => p.$glow}, inset 0 1px 2px rgba(0, 0, 0, 0.4);
    background: rgba(2, 6, 23, 0.85);
  }

  textarea {
    width: 100%;
    min-height: 125px;
    background: transparent;
    border: none;
    outline: none;
    color: #f8fafc;
    font-size: 0.95rem;
    line-height: 1.55;
    font-family: inherit;
    resize: none;

    &::placeholder {
      color: #64748b;
    }

    &:disabled {
      opacity: 0.6;
    }
  }
`;

const TextareaFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);

  .shortcut-hint {
    font-size: 0.76rem;
    color: #64748b;
    display: flex;
    align-items: center;
    gap: 0.25rem;

    kbd {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 4px;
      padding: 1px 5px;
      font-size: 0.72rem;
      color: #94a3b8;
      font-family: monospace;
    }
  }

  .char-count {
    font-size: 0.76rem;
    color: #64748b;
    font-variant-numeric: tabular-nums;
  }
`;

const ActionFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;

  button {
    min-width: 110px;
  }
`;
