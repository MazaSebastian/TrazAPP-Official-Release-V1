import React from 'react';
import styled, { css } from 'styled-components';

export type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

const getVariantStyles = (variant: ButtonVariant) => {
  switch (variant) {
    case 'default':
      return css`
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: #ffffff;
        border: 1px solid rgba(255, 255, 255, 0.15);
        box-shadow: 0 2px 10px rgba(16, 185, 129, 0.35);

        &:hover:not(:disabled) {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          box-shadow: 0 4px 16px rgba(16, 185, 129, 0.5);
          transform: translateY(-1px);
        }
      `;
    case 'secondary':
      return css`
        background: rgba(30, 41, 59, 0.7);
        color: #f1f5f9;
        border: 1px solid rgba(255, 255, 255, 0.08);

        &:hover:not(:disabled) {
          background: rgba(51, 65, 85, 0.8);
          color: #ffffff;
          border-color: rgba(255, 255, 255, 0.15);
          transform: translateY(-1px);
        }
      `;
    case 'outline':
      return css`
        background: transparent;
        color: #cbd5e1;
        border: 1px solid rgba(255, 255, 255, 0.15);

        &:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.05);
          color: #ffffff;
          border-color: rgba(255, 255, 255, 0.25);
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
        padding: 0.35rem 0.75rem;
        font-size: 0.78rem;
        border-radius: 8px;
        gap: 0.35rem;
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
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'default',
  size = 'md',
  children,
  ...props
}) => {
  return (
    <StyledButton $variant={variant} $size={size} {...props}>
      {children}
    </StyledButton>
  );
};

export default Button;
