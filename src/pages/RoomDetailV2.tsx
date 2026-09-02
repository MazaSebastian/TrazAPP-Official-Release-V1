import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import {
  FaArrowLeft,
  FaSeedling,
  FaBorderAll,
  FaThermometerHalf,
  FaCalendarAlt,
  FaStickyNote,
  FaPlus,
  FaHistory,
  FaExchangeAlt,
  FaEdit,
  FaTrash,
  FaBoxes,
  FaTint,
  FaEllipsisV,
  FaInfoCircle
} from 'react-icons/fa';

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

const HeaderNav = styled.div`
  display: flex;
  align-items: center;
  gap: 1.25rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;

  .back-btn {
    background: rgba(31, 41, 55, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #e2e8f0;
    padding: 0.6rem 1.2rem;
    border-radius: 0.75rem;
    font-weight: 600;
    font-size: 0.875rem;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    backdrop-filter: blur(12px);
    transition: all 0.2s ease;

    &:hover {
      background: rgba(16, 185, 129, 0.15);
      border-color: rgba(16, 185, 129, 0.3);
      color: #34d399;
      transform: translateX(-2px);
    }
  }

  .title-group {
    display: flex;
    align-items: center;
    gap: 0.85rem;

    h1 {
      font-size: clamp(1.75rem, 4vw, 2.35rem);
      font-weight: 800;
      letter-spacing: -0.03em;
      color: #ffffff;
      margin: 0;
    }

    .room-badge {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: capitalize;
    }
  }
`;

const KPIGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 250px), 1fr));
  gap: 1.5rem;
  margin-bottom: 2.25rem;
`;

const KPICard = styled.div<{ $glowColor?: string }>`
  background: rgba(17, 24, 39, 0.7);
  backdrop-filter: blur(16px);
  border-radius: 1.25rem;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.35);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-4px);
    border-color: ${props => props.$glowColor || 'rgba(16, 185, 129, 0.4)'};
    box-shadow: 0 20px 35px -5px rgba(0, 0, 0, 0.5);
  }

  .kpi-header {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    color: #94a3b8;
    text-transform: uppercase;
    margin-bottom: 0.75rem;

    .icon {
      color: ${props => props.$glowColor || '#34d399'};
      font-size: 0.95rem;
    }
  }

  .value {
    font-size: 2rem;
    font-weight: 800;
    color: #ffffff;
    margin-bottom: 0.3rem;
  }

  .sub {
    font-size: 0.825rem;
    color: #64748b;
    font-weight: 500;
  }
`;

const StickyNotesSection = styled.div`
  margin-bottom: 2.5rem;

  .section-title {
    font-size: 1.2rem;
    font-weight: 700;
    color: #fbbf24;
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin-bottom: 1rem;
  }
`;

const StickyNotesContainer = styled.div`
  background: rgba(17, 24, 39, 0.5);
  border: 1px dashed rgba(245, 158, 11, 0.3);
  border-radius: 1.25rem;
  padding: 1.5rem;
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }

  .empty-left {
    display: flex;
    align-items: center;
    gap: 1.25rem;

    .plus-circle {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgba(245, 158, 11, 0.15);
      border: 1px solid rgba(245, 158, 11, 0.3);
      color: #fbbf24;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
    }

    .info {
      .head {
        font-size: 1rem;
        font-weight: 700;
        color: #f1f5f9;
      }
      .sub {
        font-size: 0.85rem;
        color: #94a3b8;
        margin-top: 0.15rem;
      }
    }
  }

  .add-btn {
    background: rgba(245, 158, 11, 0.15);
    border: 1px solid rgba(245, 158, 11, 0.35);
    color: #fbbf24;
    font-weight: 700;
    font-size: 0.875rem;
    padding: 0.65rem 1.25rem;
    border-radius: 0.75rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(245, 158, 11, 0.25);
      transform: translateY(-2px);
    }
  }
`;

const ToolbarRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;

  .section-heading {
    font-size: 1.15rem;
    font-weight: 700;
    color: #e2e8f0;
    margin: 0;
  }

  .action-group {
    display: flex;
    gap: 0.85rem;
  }
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'outline' }>`
  background: ${props => props.$variant === 'primary' 
    ? 'linear-gradient(135deg, #10b981, #059669)' 
    : props.$variant === 'secondary'
    ? 'rgba(31, 41, 55, 0.8)'
    : 'rgba(255, 255, 255, 0.05)'};
  color: ${props => props.$variant === 'primary' ? '#ffffff' : '#e2e8f0'};
  border: 1px solid ${props => props.$variant === 'primary' 
    ? 'transparent' 
    : 'rgba(255, 255, 255, 0.1)'};
  font-weight: 700;
  font-size: 0.875rem;
  padding: 0.65rem 1.25rem;
  border-radius: 0.75rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  backdrop-filter: blur(12px);
  box-shadow: ${props => props.$variant === 'primary' ? '0 4px 14px rgba(16, 185, 129, 0.35)' : 'none'};
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: ${props => props.$variant === 'primary' ? 'transparent' : 'rgba(16, 185, 129, 0.4)'};
    color: ${props => props.$variant === 'primary' ? '#ffffff' : '#34d399'};
  }
`;

const SplitLayout = styled.div`
  display: grid;
  grid-template-columns: 2.2fr 1fr;
  gap: 2rem;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }
`;

const SectionBox = styled.div`
  background: rgba(17, 24, 39, 0.7);
  backdrop-filter: blur(16px);
  border-radius: 1.5rem;
  padding: 1.85rem;
  border: 1px solid rgba(255, 255, 255, 0.07);
  box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.35);

  .box-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;

    h3 {
      font-size: 1.15rem;
      font-weight: 700;
      color: #f8fafc;
      margin: 0;
    }
  }
`;

const MesaCard = styled.div`
  background: rgba(31, 41, 55, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1.25rem;
  padding: 1.35rem;
  width: 260px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.25);
  transition: all 0.25s ease;

  &:hover {
    border-color: rgba(16, 185, 129, 0.35);
    transform: translateY(-3px);
  }

  .mesa-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;

    .title {
      font-size: 1.1rem;
      font-weight: 800;
      color: #f1f5f9;
    }

    .actions {
      display: flex;
      gap: 0.5rem;
      color: #64748b;
      font-size: 0.9rem;
      cursor: pointer;

      svg:hover {
        color: #f43f5e;
      }
    }
  }

  .mesa-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
    margin-bottom: 1rem;

    .stat-box {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 0.75rem;
      padding: 0.85rem;
      text-align: center;

      .val {
        font-size: 1.35rem;
        font-weight: 800;
        color: #34d399;
      }

      .lbl {
        font-size: 0.725rem;
        color: #94a3b8;
        font-weight: 600;
        margin-top: 0.2rem;
      }
    }
  }

  .created-date {
    font-size: 0.775rem;
    color: #64748b;
    font-weight: 500;
  }
`;

const BatchCard = styled.div`
  background: rgba(31, 41, 55, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1rem;
  padding: 1.1rem 1.25rem;
  margin-bottom: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.2s ease;

  &:hover {
    border-color: rgba(56, 189, 248, 0.35);
    background: rgba(31, 41, 55, 0.8);
  }

  .batch-info {
    .batch-name {
      font-size: 0.95rem;
      font-weight: 700;
      color: #f1f5f9;
    }

    .batch-details {
      font-size: 0.8rem;
      color: #94a3b8;
      margin-top: 0.25rem;
    }
  }

  .batch-actions {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    color: #64748b;

    .icon-btn {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 0.5rem;
      padding: 0.4rem 0.5rem;
      cursor: pointer;
      color: #94a3b8;
      transition: all 0.2s ease;

      &:hover {
        color: #38bdf8;
        border-color: rgba(56, 189, 248, 0.3);
      }
    }
  }
`;

export const RoomDetailV2: React.FC = () => {
  return (
    <Container>
      {/* HEADER NAVIGATION */}
      <HeaderNav>
        <Link to="/rooms" className="back-btn">
          <FaArrowLeft /> Volver
        </Link>
        <div className="title-group">
          <h1>Sala de Esquejes</h1>
          <span className="room-badge">Clones</span>
        </div>
      </HeaderNav>

      {/* KPI GRID ROW */}
      <KPIGrid>
        <KPICard $glowColor="#10b981">
          <div className="kpi-header">
            <FaSeedling className="icon" /> TOTAL ESQUEJES
          </div>
          <div className="value">15</div>
          <div className="sub">En 1 lotes activos</div>
        </KPICard>

        <KPICard $glowColor="#38bdf8">
          <div className="kpi-header">
            <FaBorderAll className="icon" /> TOTAL DE ESQUEJERAS
          </div>
          <div className="value">1</div>
          <div className="sub">Mapas activos</div>
        </KPICard>

        <KPICard $glowColor="#f59e0b">
          <div className="kpi-header">
            <FaThermometerHalf className="icon" /> AMBIENTE EN VIVO
          </div>
          <div className="value" style={{ fontSize: '1.65rem' }}>24.5°C / 62%</div>
          <div className="sub">Temperatura & Humedad OK</div>
        </KPICard>

        <KPICard $glowColor="#a855f7">
          <div className="kpi-header">
            <FaCalendarAlt className="icon" /> FECHA INICIO
          </div>
          <div className="value" style={{ fontSize: '1.65rem' }}>15 Mar 2026</div>
          <div className="sub">Creado hace 147 días</div>
        </KPICard>
      </KPIGrid>

      {/* PIZARRA DE NOTAS SECTION */}
      <StickyNotesSection>
        <div className="section-title">
          <FaStickyNote /> Pizarra de Notas
        </div>
        <StickyNotesContainer>
          <div className="empty-left">
            <div className="plus-circle">
              <FaPlus />
            </div>
            <div className="info">
              <div className="head">No hay notas fijadas en esta sala</div>
              <div className="sub">Toca para agregar un recordatorio técnico, nutricional o de mantenimiento</div>
            </div>
          </div>
          <button className="add-btn" onClick={() => alert('Abrir modal para nueva nota')}>
            <FaPlus /> Agregar Nota
          </button>
        </StickyNotesContainer>
      </StickyNotesSection>

      {/* ACTION TOOLBAR */}
      <ToolbarRow>
        <h2 className="section-heading">Mapa y Estructura de la Sala</h2>
        <div className="action-group">
          <ActionButton $variant="outline">
            <FaHistory /> Historial
          </ActionButton>
          <ActionButton $variant="primary">
            <FaExchangeAlt /> Transplantar
          </ActionButton>
          <ActionButton $variant="secondary">
            <FaEdit /> Editar Sala
          </ActionButton>
        </div>
      </ToolbarRow>

      {/* MAIN SPLIT VIEW */}
      <SplitLayout>
        {/* LEFT: MESAS ACTIVAS */}
        <SectionBox>
          <div className="box-header">
            <h3>Mesas Activas <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>(Arrastra lotes aquí para crear nuevas)</span></h3>
          </div>

          <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
            <MesaCard>
              <div className="mesa-head">
                <span className="title">b1</span>
                <div className="actions">
                  <FaEdit style={{ cursor: 'pointer' }} />
                  <FaTrash style={{ cursor: 'pointer', color: '#f43f5e' }} />
                </div>
              </div>
              <div className="mesa-stats">
                <div className="stat-box">
                  <div className="val">0</div>
                  <div className="lbl">Plantas</div>
                </div>
                <div className="stat-box">
                  <div className="val" style={{ color: '#38bdf8' }}>0</div>
                  <div className="lbl">Variedades</div>
                </div>
              </div>
              <div className="created-date">📅 Creada: 26 de mar 2026</div>
            </MesaCard>
          </div>
        </SectionBox>

        {/* RIGHT: LOTES DISPONIBLES */}
        <SectionBox>
          <div className="box-header">
            <h3>Lotes Disponibles</h3>
          </div>

          <ActionButton $variant="primary" style={{ width: '100%', justifyContent: 'center', marginBottom: '1.25rem' }}>
            <FaPlus /> Nuevo Lote
          </ActionButton>

          <BatchCard>
            <div className="batch-info">
              <div className="batch-name">▶ 5229 - Mimosa</div>
              <div className="batch-details">09/04/26 17:11 • Total: 15 u.</div>
            </div>
            <div className="batch-actions">
              <div className="icon-btn" title="Editar"><FaEdit size={13} /></div>
              <div className="icon-btn" title="Eliminar"><FaTrash size={13} style={{ color: '#f43f5e' }} /></div>
            </div>
          </BatchCard>
        </SectionBox>
      </SplitLayout>
    </Container>
  );
};

export default RoomDetailV2;
