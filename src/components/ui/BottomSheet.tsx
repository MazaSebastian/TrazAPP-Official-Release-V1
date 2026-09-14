import React, { useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { X as LucideX } from 'lucide-react';

// ─── Keyframe Animations ──────────────────────────────────────────────────────
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

/* Mobile Bottom Sheet Slide Up */
const sheetSlideUp = keyframes`
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
`;

const sheetSlideDown = keyframes`
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(100%);
  }
`;

/* Desktop Scale Up */
const desktopScaleIn = keyframes`
  from {
    transform: scale(0.96) translateY(12px);
    opacity: 0;
  }
  to {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
`;

const desktopScaleOut = keyframes`
  from {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
  to {
    transform: scale(0.96) translateY(12px);
    opacity: 0;
  }
`;

// ─── Styled Components ───────────────────────────────────────────────────────
const Overlay = styled.div<{ $isClosing?: boolean }>`
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(2, 6, 23, 0.82);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  animation: ${p => p.$isClosing ? fadeOut : fadeIn} 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;

  @media (max-width: 768px) {
    align-items: flex-end;
    padding: 0;
  }
`;

const Container = styled.div<{ $isClosing?: boolean; $maxWidth?: string }>`
  background: rgba(15, 23, 42, 0.96);
  backdrop-filter: blur(28px);
  -webkit-backdrop-filter: blur(28px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1.25rem;
  width: 92%;
  max-width: ${p => p.$maxWidth || '560px'};
  max-height: 88vh;
  box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.06);
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: ${p => p.$isClosing ? desktopScaleOut : desktopScaleIn} 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;

  @media (max-width: 768px) {
    width: 100%;
    max-width: 100%;
    max-height: 90dvh;
    border-radius: 1.5rem 1.5rem 0 0;
    border-bottom: none;
    border-left: none;
    border-right: none;
    box-shadow: 0 -15px 40px rgba(0, 0, 0, 0.7);
    padding-bottom: env(safe-area-inset-bottom);
    animation: ${p => p.$isClosing ? sheetSlideDown : sheetSlideUp} 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
`;

/* Subtle emerald ambient illumination at the top */
const AmbientGlow = styled.div`
  position: absolute;
  top: -50px;
  left: 50%;
  transform: translateX(-50%);
  width: 320px;
  height: 120px;
  background: radial-gradient(ellipse at center, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0) 75%);
  pointer-events: none;
`;

/* Mobile Touch Drag Handle Indicator */
const DragHandle = styled.div`
  display: none;
  width: 38px;
  height: 4px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.25);
  margin: 0.65rem auto 0.25rem;
  flex-shrink: 0;

  @media (max-width: 768px) {
    display: block;
  }
`;

const HeaderWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  position: relative;
  z-index: 1;

  .header-left {
    display: flex;
    align-items: center;
    gap: 0.75rem;

    .icon-box {
      width: 40px;
      height: 40px;
      border-radius: 0.75rem;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.25);
      color: #34d399;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .title-group {
      display: flex;
      flex-direction: column;

      h3 {
        margin: 0;
        font-size: 1.15rem;
        font-weight: 700;
        color: #f8fafc;
        letter-spacing: -0.01em;
      }

      p {
        margin: 2px 0 0;
        font-size: 0.8rem;
        color: #94a3b8;
      }
    }
  }

  .close-btn {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #94a3b8;
    width: 34px;
    height: 34px;
    border-radius: 0.6rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.18s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #f8fafc;
    }

    &:active {
      transform: scale(0.92);
    }
  }
`;

const BodyWrapper = styled.div`
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;

  @media (max-width: 768px) {
    padding: 1.15rem 1.25rem;
  }

  &::-webkit-scrollbar {
    width: 5px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 4px;
  }
`;

const FooterWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
  background: rgba(10, 16, 30, 0.6);
  position: relative;
  z-index: 1;

  @media (max-width: 768px) {
    flex-direction: column-reverse;
    padding: 1rem 1.25rem calc(1rem + env(safe-area-inset-bottom));

    button {
      width: 100%;
      justify-content: center;
    }
  }
`;

// ─── Interfaces ──────────────────────────────────────────────────────────────
export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  isClosing?: boolean;
  maxWidth?: string;
  children: React.ReactNode;
}

export interface BottomSheetHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onClose: () => void;
}

// ─── Exported Compound Components ────────────────────────────────────────────
export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  isClosing,
  maxWidth,
  children
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <Overlay
      $isClosing={isClosing}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <Container $isClosing={isClosing} $maxWidth={maxWidth} onClick={e => e.stopPropagation()}>
        <AmbientGlow />
        <DragHandle />
        {children}
      </Container>
    </Overlay>
  );
};

export const BottomSheetHeader: React.FC<BottomSheetHeaderProps> = ({
  title,
  subtitle,
  icon,
  onClose
}) => (
  <HeaderWrapper>
    <div className="header-left">
      {icon && <div className="icon-box">{icon}</div>}
      <div className="title-group">
        <h3>{title}</h3>
        {subtitle && <p>{subtitle}</p>}
      </div>
    </div>
    <button className="close-btn" onClick={onClose} aria-label="Cerrar modal">
      <LucideX size={18} />
    </button>
  </HeaderWrapper>
);

export const BottomSheetBody: React.FC<{ children: React.ReactNode; className?: string; style?: React.CSSProperties }> = ({
  children,
  className,
  style
}) => (
  <BodyWrapper className={className} style={style}>
    {children}
  </BodyWrapper>
);

export const BottomSheetFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className
}) => (
  <FooterWrapper className={className}>
    {children}
  </FooterWrapper>
);

export default BottomSheet;
