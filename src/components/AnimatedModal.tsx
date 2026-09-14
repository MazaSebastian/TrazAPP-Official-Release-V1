import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

export const ModalOverlay = styled.div<{ $visible?: boolean }>`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.65); z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  opacity: ${p => p.$visible ? 1 : 0};
  transition: opacity 0.3s ease-in-out;
  pointer-events: ${p => p.$visible ? 'auto' : 'none'};

  @media (max-width: 768px) {
    align-items: flex-end;
  }
`;

export const ModalContent = styled.div<{ $visible?: boolean; wide?: boolean; allowOverflow?: boolean }>`
  background: rgba(15, 23, 42, 0.95); padding: 2rem; border-radius: 1rem; width: 90%; 
  max-width: ${props => props.wide ? '900px' : '500px'};
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
  position: relative;
  transform: ${p => p.$visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)'};
  opacity: ${p => p.$visible ? 1 : 0};
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  max-height: 85vh;
  overflow-y: ${p => p.allowOverflow ? 'visible' : 'auto'};

  @media (max-width: 768px) {
    padding: 1.25rem 1.25rem calc(1.25rem + env(safe-area-inset-bottom, 1rem));
    width: 100%;
    max-width: 100%;
    border-radius: 1.5rem 1.5rem 0 0;
    border-left: none;
    border-right: none;
    border-bottom: none;
    max-height: 90dvh;
    transform: ${p => p.$visible ? 'translateY(0)' : 'translateY(100%)'};
  }
`;

export const CloseIcon = styled.button`
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: none;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    font-size: 1.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    transition: all 0.2s;
    &:hover { color: #f8fafc; background: rgba(255, 255, 255, 0.08); }
`;

const DragHandle = styled.div`
  display: none;
  @media (max-width: 768px) {
    display: block;
    width: 36px;
    height: 4px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 9999px;
    margin: -0.25rem auto 1rem auto;
  }
`;

interface AnimatedModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    wide?: boolean;
    allowOverflow?: boolean;
}

export const AnimatedModal: React.FC<AnimatedModalProps> = ({ isOpen, onClose, children, wide, allowOverflow }) => {
    const [shouldRender, setShouldRender] = useState(isOpen);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            setTimeout(() => setIsVisible(true), 10);
        } else {
            setIsVisible(false);
            const timer = setTimeout(() => setShouldRender(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!shouldRender) return null;

    return (
        <ModalOverlay $visible={isVisible} onClick={onClose}>
            <ModalContent
                $visible={isVisible}
                wide={wide}
                allowOverflow={allowOverflow}
                onClick={e => e.stopPropagation()}
            >
                <DragHandle />
                {children}
            </ModalContent>
        </ModalOverlay>
    );
};
