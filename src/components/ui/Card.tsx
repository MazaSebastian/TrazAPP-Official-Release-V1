import React from 'react';
import styled, { css } from 'styled-components';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  $glow?: boolean;
  $interactive?: boolean;
}

export const Card = styled.div<CardProps>`
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.45), inset 0 1px 0 0 rgba(255, 255, 255, 0.06);
  color: #f8fafc;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  ${props => props.$interactive && css`
    cursor: pointer;
    &:hover {
      border-color: rgba(16, 185, 129, 0.3);
      transform: translateY(-2px);
      box-shadow: 0 8px 30px -4px rgba(0, 0, 0, 0.6), 0 0 15px rgba(16, 185, 129, 0.08);
    }
  `}

  ${props => props.$glow && css`
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.5), transparent);
    }
  `}
`;

export const CardHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 1.25rem 1.25rem 0.75rem;
`;

export const CardTitle = styled.h3`
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: -0.015em;
  color: #f8fafc;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const CardDescription = styled.p`
  margin: 0;
  font-size: 0.82rem;
  color: #94a3b8;
  line-height: 1.4;
`;

export const CardContent = styled.div`
  padding: 1.25rem;
  padding-top: 0.5rem;
`;

export const CardFooter = styled.div`
  display: flex;
  align-items: center;
  padding: 0.75rem 1.25rem 1.25rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  margin-top: auto;
`;

export default Card;
