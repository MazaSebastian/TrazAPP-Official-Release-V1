import React from 'react';
import styled from 'styled-components';
import { FaArrowUp, FaArrowDown, FaMinus } from 'react-icons/fa';

const Card = styled.div`
  background: rgba(30, 41, 59, 0.6);
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  transition: transform 0.2s, box-shadow 0.2s;
  &:hover { 
      transform: translateY(-4px); 
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3);
  }
`;

const Title = styled.h3`
  font-size: 0.85rem;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Value = styled.div`
  font-size: 1.8rem;
  font-weight: 800;
  color: #f8fafc;
`;

const Trend = styled.div<{ $isPositive: boolean }>`
  font-size: 0.85rem;
  color: ${p => p.$isPositive ? '#4ade80' : '#f87171'};
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.5rem;
  font-weight: 600;
`;

interface KPICardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: number; // Percent change
  trendLabel?: string;
  color?: string;
}

export const KPICard: React.FC<KPICardProps> = ({ title, value, icon, trend, trendLabel, color }) => {
  return (
    <Card style={color ? { borderTop: `4px solid ${color}` } : {}}>
      <Title>{icon} {title}</Title>
      <Value>{value}</Value>
      {trend !== undefined && (
        <Trend $isPositive={trend >= 0}>
          {trend > 0 ? <FaArrowUp /> : trend < 0 ? <FaArrowDown /> : <FaMinus />}
          {Math.abs(trend)}% {trendLabel}
        </Trend>
      )}
    </Card>
  );
};
