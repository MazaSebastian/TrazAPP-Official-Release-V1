import React from 'react';
import styled from 'styled-components';
import { FaArrowUp, FaArrowDown, FaMinus } from 'react-icons/fa';

const Card = styled.div<{ $borderColor?: string }>`
  background: rgba(30, 41, 59, 0.6);
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-top: ${p => p.$borderColor ? `4px solid ${p.$borderColor}` : '1px solid rgba(255, 255, 255, 0.05)'};
  backdrop-filter: blur(12px);
  transition: transform 0.2s, box-shadow 0.2s;
  
  &:hover { 
      transform: translateY(-4px); 
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3);
  }

  .desktop-content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    @media (max-width: 768px) {
      display: none;
    }
  }

  .mobile-content {
    display: none;
    @media (max-width: 768px) {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      min-height: 48px; /* Maintain compact height */
    }

    .m-left {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      flex: 1; /* Take up available space to the left */
    }

    .m-title {
      font-size: 0.8rem;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      display: flex;
      align-items: center;
      gap: 0.3rem;
      white-space: nowrap;
    }

    .m-trend {
      font-size: 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.2rem;
      font-weight: 600;
      white-space: nowrap;
      /* Padding to align with text after icon */
      padding-left: 1.2rem;
    }

    .m-right {
      display: flex;
      align-items: center;
      justify-content: flex-end;
    }

    .m-value {
      font-size: 1.1rem;
      font-weight: 800;
      color: #f8fafc;
      white-space: nowrap;
    }
  }

  @media (max-width: 768px) {
    padding: 1rem;
    border-radius: 0.75rem;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    border-left: ${p => p.$borderColor ? `4px solid ${p.$borderColor}` : '1px solid rgba(255, 255, 255, 0.05)'};
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
    <Card $borderColor={color}>
      {/* Vista de Escritorio */}
      <div className="desktop-content">
        <Title>{icon} {title}</Title>
        <Value>{value}</Value>
        {trend !== undefined && (
          <Trend $isPositive={trend >= 0}>
            {trend > 0 ? <FaArrowUp /> : trend < 0 ? <FaArrowDown /> : <FaMinus />}
            {Math.abs(trend)}% {trendLabel}
          </Trend>
        )}
      </div>

      {/* Vista Compacta Móvil (Una sola línea principal estructurada) */}
      <div className="mobile-content">
        <div className="m-left">
          <span className="m-title">{icon} {title}</span>
          {trend !== undefined && (
            <span className="m-trend" style={{ color: trend >= 0 ? '#4ade80' : '#f87171' }}>
              {trend > 0 ? <FaArrowUp size={10} /> : trend < 0 ? <FaArrowDown size={10} /> : <FaMinus size={10} />}
              {Math.abs(trend)}% {trendLabel ? trendLabel : ''}
            </span>
          )}
        </div>

        <div className="m-right">
          <span className="m-value" style={{ fontSize: '1.25rem' }}>{value}</span>
        </div>
      </div>
    </Card>
  );
};
