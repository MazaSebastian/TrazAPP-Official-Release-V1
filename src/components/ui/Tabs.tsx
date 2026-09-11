import React from 'react';
import styled, { css } from 'styled-components';

export const TabsList = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 0.3rem;
  overflow-x: auto;
  user-select: none;
`;

export const TabsTrigger = styled.button<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.45rem 0.95rem;
  border-radius: 9px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  background: transparent;
  color: #94a3b8;
  transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;

  &:hover {
    color: #f1f5f9;
  }

  ${props => props.$active && css`
    background: rgba(30, 41, 59, 0.9);
    color: #f8fafc;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.08);
  `}
`;

export const TabsContent = styled.div<{ $active?: boolean }>`
  display: ${props => props.$active !== false ? 'block' : 'none'};
  width: 100%;
  animation: fadeIn 0.2s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;
