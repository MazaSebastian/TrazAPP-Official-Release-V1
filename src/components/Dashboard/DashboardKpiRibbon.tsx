import React from 'react';
import styled from 'styled-components';
import { Sprout, Activity, CalendarCheck, AlertTriangle, Users, ArrowUpRight } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Link } from 'react-router-dom';

interface DashboardKpiRibbonProps {
  totalPlants: number;
  activeBatchesCount: number;
  avgTemperature: number | null;
  avgHumidity: number | null;
  isClimateOptimal: boolean;
  pendingTasksCount: number;
  urgentTasksCount: number;
  criticalStockCount: number;
  totalPatientsCount?: number;
  role?: string;
}

const RibbonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const KpiCardWrapper = styled(Card)`
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  text-decoration: none;
  color: inherit;
  min-height: 125px;

  .kpi-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.75rem;

    .label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #94a3b8;
    }

    .icon-pill {
      width: 34px;
      height: 34px;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      &.emerald { background: rgba(16, 185, 129, 0.12); color: #34d399; }
      &.sky { background: rgba(56, 189, 248, 0.12); color: #38bdf8; }
      &.amber { background: rgba(245, 158, 11, 0.12); color: #fbbf24; }
      &.purple { background: rgba(168, 85, 247, 0.12); color: #c084fc; }
      &.rose { background: rgba(244, 63, 94, 0.12); color: #fb7185; }
    }
  }

  .kpi-value-row {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    margin-bottom: 0.5rem;

    .main-val {
      font-size: 1.75rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      color: #ffffff;
      line-height: 1;
    }

    .unit {
      font-size: 0.85rem;
      font-weight: 500;
      color: #64748b;
    }
  }

  .kpi-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.75rem;
    color: #94a3b8;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    padding-top: 0.5rem;
    margin-top: auto;

    .subtext {
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }
  }
`;

export const DashboardKpiRibbon: React.FC<DashboardKpiRibbonProps> = ({
  totalPlants,
  activeBatchesCount,
  avgTemperature,
  avgHumidity,
  isClimateOptimal,
  pendingTasksCount,
  urgentTasksCount,
  criticalStockCount,
  totalPatientsCount = 0,
  role = 'owner',
}) => {
  return (
    <RibbonGrid>
      {/* KPI 1: PLANTAS EN CULTIVO */}
      <KpiCardWrapper as={Link} to="/crops" $interactive $glow>
        <div className="kpi-top">
          <span className="label">Plantas en Cultivo</span>
          <div className="icon-pill emerald">
            <Sprout size={18} />
          </div>
        </div>
        <div className="kpi-value-row">
          <span className="main-val">{totalPlants.toLocaleString()}</span>
          <span className="unit">plantas</span>
        </div>
        <div className="kpi-footer">
          <span className="subtext">{activeBatchesCount} lotes activos</span>
          <Badge variant="emerald" ping>Activo</Badge>
        </div>
      </KpiCardWrapper>

      {/* KPI 2: TELEMETRÍA EN VIVO */}
      <KpiCardWrapper as={Link} to="/devices" $interactive>
        <div className="kpi-top">
          <span className="label">Ambiente / Sensores</span>
          <div className="icon-pill sky">
            <Activity size={18} />
          </div>
        </div>
        <div className="kpi-value-row">
          {avgTemperature !== null && avgHumidity !== null ? (
            <>
              <span className="main-val">{avgTemperature}°C</span>
              <span className="unit">• {avgHumidity}% HR</span>
            </>
          ) : (
            <span className="main-val" style={{ fontSize: '1.25rem', color: '#94a3b8' }}>
              En línea
            </span>
          )}
        </div>
        <div className="kpi-footer">
          <span className="subtext">
            {isClimateOptimal ? 'Clima en rango' : 'Chequear salas'}
          </span>
          <Badge variant={isClimateOptimal ? 'emerald' : 'amber'} ping>
            {isClimateOptimal ? 'Óptimo' : 'Atención'}
          </Badge>
        </div>
      </KpiCardWrapper>

      {/* KPI 3: TAREAS PENDIENTES */}
      <KpiCardWrapper as={Link} to="/appointments?tab=tasks" $interactive>
        <div className="kpi-top">
          <span className="label">Tareas Operativas</span>
          <div className="icon-pill amber">
            <CalendarCheck size={18} />
          </div>
        </div>
        <div className="kpi-value-row">
          <span className="main-val">{pendingTasksCount}</span>
          <span className="unit">pendientes</span>
        </div>
        <div className="kpi-footer">
          <span className="subtext">
            {urgentTasksCount > 0 ? `${urgentTasksCount} urgentes hoy` : 'Al día'}
          </span>
          <Badge variant={urgentTasksCount > 0 ? 'rose' : 'secondary'}>
            {urgentTasksCount > 0 ? `${urgentTasksCount} Urgentes` : 'Normal'}
          </Badge>
        </div>
      </KpiCardWrapper>

      {/* KPI 4: PACIENTES O INSUMOS CRÍTICOS */}
      {['medico', 'owner', 'admin'].includes(role) && totalPatientsCount > 0 ? (
        <KpiCardWrapper as={Link} to="/patients" $interactive>
          <div className="kpi-top">
            <span className="label">Socios / Pacientes</span>
            <div className="icon-pill purple">
              <Users size={18} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="main-val">{totalPatientsCount}</span>
            <span className="unit">vinculados</span>
          </div>
          <div className="kpi-footer">
            <span className="subtext">Padrón activo</span>
            <Badge variant="purple">Club ONG</Badge>
          </div>
        </KpiCardWrapper>
      ) : (
        <KpiCardWrapper as={Link} to="/insumos" $interactive>
          <div className="kpi-top">
            <span className="label">Stock Insumos</span>
            <div className="icon-pill rose">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="main-val">{criticalStockCount}</span>
            <span className="unit">alertas</span>
          </div>
          <div className="kpi-footer">
            <span className="subtext">
              {criticalStockCount > 0 ? 'Reponer insumos' : 'Stock suficiente'}
            </span>
            <Badge variant={criticalStockCount > 0 ? 'rose' : 'emerald'}>
              {criticalStockCount > 0 ? 'Crítico' : 'Bien'}
            </Badge>
          </div>
        </KpiCardWrapper>
      )}
    </RibbonGrid>
  );
};

export default DashboardKpiRibbon;
