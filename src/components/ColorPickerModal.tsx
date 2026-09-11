import React from 'react';
import styled, { keyframes, css } from 'styled-components';
import { Palette, X } from 'lucide-react';

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
  padding: 1.5rem 1.75rem;
  border-radius: 1.25rem;
  width: 90%;
  max-width: 360px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.08);
  animation: ${p => p.$isClosing ? css`${scaleOut} 0.18s ease-in forwards` : css`${scaleIn} 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards`};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;

  .title-group {
    display: flex;
    align-items: center;
    gap: 0.65rem;

    .icon-wrapper {
      width: 32px;
      height: 32px;
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
      font-size: 1.1rem;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
  }

  .close-btn {
    background: none;
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

const ColorGrid = styled.div`
  display: flex;
  gap: 0.85rem;
  justify-content: center;
  flex-wrap: wrap;
  padding: 0.5rem 0;
`;

const ColorButton = styled.button<{ $color: string; $isSelected: boolean }>`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: ${p => p.$isSelected ? '3px solid #ffffff' : '2px solid rgba(255, 255, 255, 0.15)'};
  background-color: ${p => p.$color};
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: ${p => p.$isSelected ? `0 0 16px ${p.$color}99, 0 4px 10px rgba(0,0,0,0.4)` : '0 4px 10px rgba(0,0,0,0.3)'};
  transform: ${p => p.$isSelected ? 'scale(1.12)' : 'scale(1)'};

  &:hover {
    transform: scale(1.15);
    box-shadow: 0 0 16px ${p => p.$color}88, 0 4px 12px rgba(0,0,0,0.4);
  }
`;

export interface ColorPickerModalProps {
  isOpen: boolean;
  title?: string;
  colors: string[];
  selectedColor?: string;
  onSelectColor: (color: string) => void;
  onClose: () => void;
  getColorHex?: (colorName: string) => string;
}

const defaultGetColorHex = (c: string) => {
  if (c.startsWith('#')) return c;
  const map: Record<string, string> = {
    green: '#10b981',
    blue: '#38bdf8',
    yellow: '#f59e0b',
    purple: '#a855f7',
    pink: '#ec4899',
    red: '#f43f5e'
  };
  return map[c] || '#10b981';
};

export const ColorPickerModal: React.FC<ColorPickerModalProps> = ({
  isOpen,
  title = "Elegir Color",
  colors,
  selectedColor,
  onSelectColor,
  onClose,
  getColorHex = defaultGetColorHex
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [isClosing, setIsClosing] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
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

  return (
    <Overlay $isClosing={isClosing} onClick={handleClose}>
      <Content $isClosing={isClosing} onClick={(e) => e.stopPropagation()}>
        <Header>
          <div className="title-group">
            <div className="icon-wrapper">
              <Palette size={16} />
            </div>
            <h3>{title}</h3>
          </div>
          <button className="close-btn" onClick={handleClose} title="Cerrar">
            <X size={17} />
          </button>
        </Header>
        <ColorGrid>
          {colors.map(color => (
            <ColorButton
              key={color}
              $color={getColorHex(color)}
              $isSelected={selectedColor === color}
              onClick={() => {
                onSelectColor(color);
                handleClose();
              }}
              title={color}
            />
          ))}
        </ColorGrid>
      </Content>
    </Overlay>
  );
};

export default ColorPickerModal;
