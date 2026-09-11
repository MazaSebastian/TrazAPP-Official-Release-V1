import React from 'react';
import styled, { css, keyframes } from 'styled-components';

export type BadgeVariant = 'default' | 'emerald' | 'amber' | 'rose' | 'sky' | 'purple' | 'outline' | 'secondary';

const pingAnimation = keyframes`
  75%, 100% {
    transform: scale(2);
    opacity: 0;
  }
`;

const getVariantStyles = (variant: BadgeVariant) => {
  switch (variant) {
    case 'emerald':
    case 'default':
      return css`
        background: rgba(16, 185, 129, 0.12);
        color: #34d399;
        border: 1px solid rgba(16, 185, 129, 0.25);
      `;
    case 'amber':
      return css`
        background: rgba(245, 158, 11, 0.12);
        color: #fbbf24;
        border: 1px solid rgba(245, 158, 11, 0.25);
      `;
    case 'rose':
      return css`
        background: rgba(244, 63, 94, 0.12);
        color: #fb7185;
        border: 1px solid rgba(244, 63, 94, 0.25);
      `;
    case 'sky':
      return css`
        background: rgba(56, 189, 248, 0.12);
        color: #38bdf8;
        border: 1px solid rgba(56, 189, 248, 0.25);
      `;
    case 'purple':
      return css`
        background: rgba(168, 85, 247, 0.12);
        color: #c084fc;
        border: 1px solid rgba(168, 85, 247, 0.25);
      `;
    case 'secondary':
      return css`
        background: rgba(255, 255, 255, 0.06);
        color: #cbd5e1;
        border: 1px solid rgba(255, 255, 255, 0.1);
      `;
    case 'outline':
      return css`
        background: transparent;
        color: #94a3b8;
        border: 1px solid rgba(255, 255, 255, 0.15);
      `;
  }
};

const getPingColor = (variant: BadgeVariant) => {
  switch (variant) {
    case 'amber': return '#f59e0b';
    case 'rose': return '#f43f5e';
    case 'sky': return '#38bdf8';
    case 'purple': return '#a855f7';
    default: return '#10b981';
  }
};

const BadgeWrapper = styled.span<{ $variant: BadgeVariant }>`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.22rem 0.65rem;
  border-radius: 9999px;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  white-space: nowrap;
  user-select: none;
  transition: all 0.2s ease;
  ${props => getVariantStyles(props.$variant)}
`;

const PingDot = styled.span<{ $color: string }>`
  position: relative;
  display: inline-flex;
  width: 6px;
  height: 6px;
  margin-right: 2px;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: ${props => props.$color};
    opacity: 0.75;
    animation: ${pingAnimation} 1.4s cubic-bezier(0, 0, 0.2, 1) infinite;
  }

  &::after {
    content: '';
    position: relative;
    display: inline-flex;
    border-radius: 50%;
    width: 6px;
    height: 6px;
    background: ${props => props.$color};
  }
`;

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  ping?: boolean;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  ping = false,
  children,
  className,
  ...props
}) => {
  return (
    <BadgeWrapper $variant={variant} className={className} {...props}>
      {ping && <PingDot $color={getPingColor(variant)} />}
      {children}
    </BadgeWrapper>
  );
};

export default Badge;
