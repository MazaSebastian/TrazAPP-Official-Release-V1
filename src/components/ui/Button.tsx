import React from 'react';
import styled, { css } from 'styled-components';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

const getVariantStyles = (variant: ButtonVariant) => {
  switch (variant) {
    case 'default':
      return css`
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: #ffffff;
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 2px 8px rgba(16, 185, 129, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.25);

        &:hover:not(:disabled) {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.3);
          transform: translateY(-1px);
        }

        &:active:not(:disabled) {
          transform: translateY(0);
        }
      `;
    case 'secondary':
      return css`
        background: rgba(255, 255, 255, 0.05);
        color: #f1f5f9;
        border: 1px solid rgba(255, 255, 255, 0.12);
        backdrop-filter: blur(12px);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.06);

        &:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
          border-color: rgba(255, 255, 255, 0.22);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1);
          transform: translateY(-1px);
        }

        &:active:not(:disabled) {
          transform: translateY(0);
          background: rgba(255, 255, 255, 0.04);
        }
      `;
    case 'outline':
      return css`
        background: rgba(15, 23, 42, 0.35);
        color: #cbd5e1;
        border: 1px solid rgba(255, 255, 255, 0.13);
        backdrop-filter: blur(8px);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.04);

        &:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.07);
          color: #ffffff;
          border-color: rgba(255, 255, 255, 0.24);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
          transform: translateY(-1px);
        }

        &:active:not(:disabled) {
          transform: translateY(0);
          background: transparent;
        }
      `;
    case 'ghost':
      return css`
        background: transparent;
        color: #94a3b8;
        border: 1px solid transparent;

        &:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.06);
          color: #f8fafc;
        }
      `;
    case 'destructive':
      return css`
        background: rgba(239, 68, 68, 0.15);
        color: #fca5a5;
        border: 1px solid rgba(239, 68, 68, 0.3);

        &:hover:not(:disabled) {
          background: rgba(239, 68, 68, 0.25);
          border-color: rgba(239, 68, 68, 0.5);
          color: #fecaca;
        }
      `;
  }
};

const getSizeStyles = (size: ButtonSize) => {
  switch (size) {
    case 'sm':
      return css`
        padding: 0.42rem 0.85rem;
        font-size: 0.8125rem;
        font-weight: 600;
        border-radius: 9px;
        gap: 0.45rem;
      `;
    case 'lg':
      return css`
        padding: 0.75rem 1.5rem;
        font-size: 0.95rem;
        border-radius: 12px;
        gap: 0.6rem;
      `;
    case 'icon':
      return css`
        width: 36px;
        height: 36px;
        padding: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 9px;
      `;
    case 'md':
    default:
      return css`
        padding: 0.55rem 1.1rem;
        font-size: 0.85rem;
        border-radius: 10px;
        gap: 0.5rem;
      `;
  }
};

const StyledButton = styled.button<{ $variant: ButtonVariant; $size: ButtonSize }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  letter-spacing: -0.01em;
  cursor: pointer;
  outline: none;
  user-select: none;
  transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
  ${props => getVariantStyles(props.$variant)}
  ${props => getSizeStyles(props.$size)}

  &:active:not(:disabled) {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'default',
  size = 'md',
  isLoading = false,
  disabled,
  children,
  ...props
}) => {
  return (
    <StyledButton $variant={variant} $size={size} disabled={disabled || isLoading} {...props}>
      {isLoading && <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite', marginRight: '0.4rem' }} />}
      {children}
    </StyledButton>
  );
};

export const ShadcnButton = Button;
export default Button;

