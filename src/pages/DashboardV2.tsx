import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import {
  FaSeedling,
  FaCalendarCheck,
  FaArrowUp,
  FaBoxes,
  FaUserInjured,
  FaStickyNote,
  FaChevronRight,
  FaMagic,
  FaCheck,
  FaThermometerHalf,
  FaTint,
  FaWind
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

// --- STITCH DESIGN SYSTEM ANIMATIONS & TOKENS ---

const floatIn = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
  padding: 2rem 2.5rem;
  max-width: 1560px;
  margin: 0 auto;
  min-height: 100vh;
  background: #090d16;
  color: #f8fafc;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  animation: ${floatIn} 0.4s ease-out;

  @media (max-width: 768px) {
    padding: 1.25rem 1rem;
  }
`;

const BannerOfficialProposal = styled.div`
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(56, 189, 248, 0.15));
  border: 1px solid rgba(16, 185, 129, 0.3);
  backdrop-filter: blur(12px);
  border-radius: 1rem;
  padding: 1rem 1.5rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }

  .left {
    display: flex;
    align-items: center;
    gap: 0.85rem;
  }

  .badge {
    background: #10b981;
    color: #042f2e;
    font-weight: 800;
    font-size: 0.75rem;
    padding: 0.3rem 0.65rem;
    border-radius: 9999px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .text {
    font-size: 0.95rem;
    font-weight: 600;
    color: #e2e8f0;

    span {
      color: #34d399;
    }
  }

  .actions {
    display: flex;
    gap: 0.75rem;
  }
`;

const ApplyButton = styled.button`
  background: linear-gradient(135deg, #10b981, #059669);
  color: #ffffff;
  border: none;
  font-weight: 700;
  font-size: 0.875rem;
  padding: 0.65rem 1.25rem;
  border-radius: 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.5);
  }
`;

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 2.25rem;

  @media (max-width: 900px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1.5rem;
  }
`;

const TitleBlock = styled.div`
  h1 {
    font-size: clamp(1.75rem, 4vw, 2.5rem);
    font-weight: 800;
    letter-spacing: -0.03em;
    background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0;
  }

  p {
    color: #94a3b8;
    font-size: 0.975rem;
    margin-top: 0.4rem;
    font-weight: 500;
  }
`;

const EnvironmentalTelemetryWidget = styled.div`
  background: rgba(17, 24, 39, 0.75);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1.25rem;
  padding: 0.85rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);

  @media (max-width: 600px) {
    width: 100%;
    justify-content: space-around;
    gap: 0.75rem;
    padding: 0.85rem 0.75rem;
  }

  .tele-item {
    display: flex;
    align-items: center;
    gap: 0.6rem;

    .icon {
      font-size: 1.2rem;
      &.temp { color: #f43f5e; }
      &.hum { color: #38bdf8; }
      &.vpd { color: #f59e0b; }
    }

    .info {
      display: flex;
      flex-direction: column;
      .val {
        font-weight: 700;
        font-size: 0.95rem;
        color: #f1f5f9;
      }
      .lbl {
        font-size: 0.7rem;
        color: #64748b;
        text-transform: uppercase;
        font-weight: 600;
      }
    }
  }

  .divider {
    width: 1px;
    height: 28px;
    background: rgba(255, 255, 255, 0.1);
  }
`;

const KPIGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
  gap: 1.5rem;
  margin-bottom: 2.5rem;
`;

const KPICard = styled.div<{ $glowColor?: string }>`
  background: rgba(17, 24, 39, 0.7);
  backdrop-filter: blur(16px);
  border-radius: 1.25rem;
  padding: 1.65rem;
  border: 1px solid rgba(255, 255, 255, 0.07);
  box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.35);
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-4px);
    border-color: ${props => props.$glowColor || 'rgba(16, 185, 129, 0.4)'};
    box-shadow: 0 20px 35px -5px rgba(0, 0, 0, 0.5);
  }

  .kpi-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.25rem;
  }

  .icon-box {
    width: 44px;
    height: 44px;
    border-radius: 0.875rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.35rem;
    background: rgba(16, 185, 129, 0.15);
    color: ${props => props.$glowColor || '#34d399'};
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .trend-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.3rem 0.65rem;
    border-radius: 9999px;
    background: rgba(16, 185, 129, 0.15);
    color: #34d399;
    border: 1px solid rgba(16, 185, 129, 0.25);
  }

  .label {
    font-size: 0.775rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    color: #94a3b8;
    text-transform: uppercase;
  }

  .value {
    font-size: 2.25rem;
    font-weight: 800;
    color: #ffffff;
    margin: 0.35rem 0 0.5rem 0;
    letter-spacing: -0.02em;
  }

  .subtext {
    font-size: 0.825rem;
    color: #64748b;
    font-weight: 500;
  }

  .progress-bar {
    margin-top: 1rem;
    height: 6px;
    width: 100%;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 9999px;
    overflow: hidden;

    .fill {
      height: 100%;
      background: ${props => props.$glowColor || '#10b981'};
      border-radius: 9999px;
      transition: width 0.6s ease;
    }
  }
`;

const SplitGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }
`;

const MainCard = styled.div`
  background: rgba(17, 24, 39, 0.7);
  backdrop-filter: blur(16px);
  border-radius: 1.5rem;
  padding: 1.85rem;
  border: 1px solid rgba(255, 255, 255, 0.07);
  box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.35);

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;

    h3 {
      font-size: 1.2rem;
      font-weight: 700;
      color: #f8fafc;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }
  }
`;

const TaskItem = styled.div<{ $completed?: boolean }>`
  background: ${props => props.$completed ? 'rgba(15, 23, 42, 0.4)' : 'rgba(31, 41, 55, 0.5)'};
  border: 1px solid ${props => props.$completed ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.08)'};
  border-radius: 1rem;
  padding: 1.1rem 1.25rem;
  margin-bottom: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.2s ease;

  &:hover {
    border-color: rgba(16, 185, 129, 0.3);
    background: rgba(31, 41, 55, 0.7);
  }

  .task-left {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .check-box {
    width: 24px;
    height: 24px;
    border-radius: 0.5rem;
    border: 2px solid ${props => props.$completed ? '#10b981' : '#475569'};
    background: ${props => props.$completed ? '#10b981' : 'transparent'};
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    cursor: pointer;
    font-size: 0.75rem;
    transition: all 0.2s ease;
  }

  .task-content {
    .task-title {
      font-size: 0.95rem;
      font-weight: 600;
      color: ${props => props.$completed ? '#64748b' : '#f1f5f9'};
      text-decoration: ${props => props.$completed ? 'line-through' : 'none'};
    }
    .task-meta {
      font-size: 0.8rem;
      color: #64748b;
      margin-top: 0.2rem;
    }
  }

  .priority-tag {
    font-size: 0.725rem;
    font-weight: 700;
    padding: 0.25rem 0.6rem;
    border-radius: 9999px;

    &.high {
      background: rgba(244, 63, 94, 0.15);
      color: #f43f5e;
      border: 1px solid rgba(244, 63, 94, 0.3);
    }
    &.medium {
      background: rgba(245, 158, 11, 0.15);
      color: #f59e0b;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }
    &.done {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
  }
`;

const QuickActionButton = styled(Link)`
  background: rgba(31, 41, 55, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1rem;
  padding: 1rem 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #f1f5f9;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.925rem;
  transition: all 0.25s ease;
  margin-bottom: 0.85rem;

  &:hover {
    background: rgba(16, 185, 129, 0.12);
    border-color: rgba(16, 185, 129, 0.35);
    transform: translateX(4px);
    color: #34d399;
  }

  .left {
    display: flex;
    align-items: center;
    gap: 0.85rem;

    .icon {
      font-size: 1.1rem;
      color: #34d399;
    }
  }
`;

const StickyNoteCard = styled.div`
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.03));
  border: 1px solid rgba(245, 158, 11, 0.25);
  border-radius: 1rem;
  padding: 1.1rem 1.25rem;
  margin-bottom: 0.85rem;

  .note-head {
    font-size: 0.875rem;
    font-weight: 700;
    color: #fbbf24;
    margin-bottom: 0.35rem;
  }

  .note-body {
    font-size: 0.825rem;
    color: #fde68a;
    line-height: 1.4;
  }
`;

export const DashboardV2: React.FC = () => {
  const { user } = useAuth();

  const [taskState, setTaskState] = useState([
    { id: 1, title: 'Riego y nutrición con EC 1.8 en Sala Floración A', room: 'Sala Floración A', time: '09:30 AM', completed: true, priority: 'done' },
    { id: 2, title: 'Control de IPM / Prevención Biológica en Vegetativo B', room: 'Sala Vegetativo B', time: '14:00 PM', completed: false, priority: 'high' },
    { id: 3, title: 'Revisión y etiquetado de 50 esquejes de Gelato #33', room: 'Esquejera 1', time: '16:30 PM', completed: false, priority: 'medium' }
  ]);

  const toggleTask = (id: number) => {
    setTaskState(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed, priority: !t.completed ? 'done' : 'medium' } : t));
  };

  return (
    <Container>
      {/* BANNER PROPOSAL FOR OFFICIAL GOOGLE STITCH UI */}
      <BannerOfficialProposal>
        <div className="left">
          <span className="badge">NUEVO DISEÑO STITCH</span>
          <div className="text">
            Previsualización en vivo de la <span>UI V2 de TrazAPP</span> basada en Google Stitch System.
          </div>
        </div>
        <div className="actions">
          <ApplyButton onClick={() => alert('¡Estética aprobada! Procederemos a aplicar este sistema a toda la plataforma.')}>
            <FaMagic /> Aplicar como UI Oficial
          </ApplyButton>
        </div>
      </BannerOfficialProposal>

      {/* HEADER SECTION */}
      <HeaderRow>
        <TitleBlock>
          <h1>¡Hola, {user?.name || 'Sebastian'}! 👋</h1>
          <p>Domingo, 9 de Agosto de 2026 • Panel de Control Operativo y Trazo Digital</p>
        </TitleBlock>

        {/* TELEMETRY WIDGET */}
        <EnvironmentalTelemetryWidget>
          <div className="tele-item">
            <FaThermometerHalf className="icon temp" />
            <div className="info">
              <span className="val">24.5 °C</span>
              <span className="lbl">Temperatura</span>
            </div>
          </div>
          <div className="divider" />
          <div className="tele-item">
            <FaTint className="icon hum" />
            <div className="info">
              <span className="val">62 %</span>
              <span className="lbl">Humedad HR</span>
            </div>
          </div>
          <div className="divider" />
          <div className="tele-item">
            <FaWind className="icon vpd" />
            <div className="info">
              <span className="val">1.15 kPa</span>
              <span className="lbl">VPD Objetivo</span>
            </div>
          </div>
        </EnvironmentalTelemetryWidget>
      </HeaderRow>

      {/* KPI METRICS GRID */}
      <KPIGrid>
        {/* KPI 1: PLANTAS EN CULTIVO */}
        <KPICard $glowColor="#10b981">
          <div className="kpi-top">
            <span className="label">PLANTAS EN CULTIVO</span>
            <div className="icon-box">
              <FaSeedling />
            </div>
          </div>
          <div className="value">1,420</div>
          <div className="subtext">
            <span className="trend-badge"><FaArrowUp /> +12.4%</span> este mes
          </div>
          <div className="progress-bar">
            <div className="fill" style={{ width: '78%' }} />
          </div>
        </KPICard>

        {/* KPI 2: TAREAS PENDIENTES */}
        <KPICard $glowColor="#f59e0b">
          <div className="kpi-top">
            <span className="label">TAREAS PENDIENTES</span>
            <div className="icon-box">
              <FaCalendarCheck />
            </div>
          </div>
          <div className="value">8 Tareas</div>
          <div className="subtext">2 Urgentes para el turno de hoy</div>
          <div className="progress-bar">
            <div className="fill" style={{ width: '45%' }} />
          </div>
        </KPICard>

        {/* KPI 3: STOCK INSUMOS */}
        <KPICard $glowColor="#f43f5e">
          <div className="kpi-top">
            <span className="label">STOCK CRÍTICO</span>
            <div className="icon-box">
              <FaBoxes />
            </div>
          </div>
          <div className="value">3 Alertas</div>
          <div className="subtext">Sustrato Coco, Fertilizante A, Alcohol</div>
          <div className="progress-bar">
            <div className="fill" style={{ width: '90%' }} />
          </div>
        </KPICard>

        {/* KPI 4: PACIENTES & DISPENSARIO */}
        <KPICard $glowColor="#38bdf8">
          <div className="kpi-top">
            <span className="label">DISPENSACIONES MES</span>
            <div className="icon-box">
              <FaUserInjured />
            </div>
          </div>
          <div className="value">1,250 g</div>
          <div className="subtext">45 Pacientes atendidos activamente</div>
          <div className="progress-bar">
            <div className="fill" style={{ width: '64%' }} />
          </div>
        </KPICard>
      </KPIGrid>

      {/* MAIN SPLIT VIEW */}
      <SplitGrid>
        {/* LEFT COLUMN: OPERATIONAL CHECKLIST */}
        <MainCard>
          <div className="card-header">
            <h3>
              <FaCalendarCheck style={{ color: '#34d399' }} /> Checklist Operativo de Hoy
            </h3>
            <span style={{ fontSize: '0.825rem', color: '#94a3b8', fontWeight: 600 }}>
              {taskState.filter(t => t.completed).length} de {taskState.length} completadas
            </span>
          </div>

          {taskState.map(task => (
            <TaskItem key={task.id} $completed={task.completed}>
              <div className="task-left">
                <div className="check-box" onClick={() => toggleTask(task.id)}>
                  {task.completed && <FaCheck />}
                </div>
                <div className="task-content">
                  <div className="task-title">{task.title}</div>
                  <div className="task-meta">{task.room} • {task.time}</div>
                </div>
              </div>
              <span className={`priority-tag ${task.priority}`}>
                {task.completed ? 'COMPLETADA' : task.priority === 'high' ? 'URGENTE' : 'PENDIENTE'}
              </span>
            </TaskItem>
          ))}
        </MainCard>

        {/* RIGHT COLUMN: QUICK ACTIONS & STICKIES */}
        <div>
          <MainCard style={{ marginBottom: '1.5rem' }}>
            <div className="card-header">
              <h3><FaMagic style={{ color: '#f59e0b' }} /> Accesos Rápidos</h3>
            </div>
            <QuickActionButton to="/crops">
              <div className="left">
                <FaSeedling className="icon" />
                <span>Gestión de Cultivos y Lotes</span>
              </div>
              <FaChevronRight style={{ fontSize: '0.8rem', color: '#64748b' }} />
            </QuickActionButton>

            <QuickActionButton to="/patients">
              <div className="left">
                <FaUserInjured className="icon" style={{ color: '#38bdf8' }} />
                <span>Registrar Nuevo Paciente</span>
              </div>
              <FaChevronRight style={{ fontSize: '0.8rem', color: '#64748b' }} />
            </QuickActionButton>

            <QuickActionButton to="/insumos">
              <div className="left">
                <FaBoxes className="icon" style={{ color: '#a855f7' }} />
                <span>Stock e Insumos</span>
              </div>
              <FaChevronRight style={{ fontSize: '0.8rem', color: '#64748b' }} />
            </QuickActionButton>
          </MainCard>

          <MainCard>
            <div className="card-header">
              <h3><FaStickyNote style={{ color: '#fbbf24' }} /> Notas Rápidas</h3>
            </div>
            <StickyNoteCard>
              <div className="note-head">Recordatorio Sala 2 (Floración)</div>
              <div className="note-body">
                Verificar calibración del sensor de pH y conductividad a primera hora del lunes.
              </div>
            </StickyNoteCard>

            <StickyNoteCard>
              <div className="note-head">Entrega de Insumos</div>
              <div className="note-body">
                Llega pedido de lámparas LED de repuesto entre 10:00 y 12:00 hs.
              </div>
            </StickyNoteCard>
          </MainCard>
        </div>
      </SplitGrid>
    </Container>
  );
};

export default DashboardV2;
