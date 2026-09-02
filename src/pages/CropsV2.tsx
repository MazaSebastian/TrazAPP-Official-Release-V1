import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import {
  FaSeedling,
  FaPlus,
  FaCalendarAlt,
  FaClock,
  FaEdit,
  FaTrash,
  FaPalette,
  FaBorderAll,
  FaSearch,
  FaArrowRight,
  FaLeaf,
  FaLayerGroup
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

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

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 2.25rem;

  @media (max-width: 900px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1.25rem;
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

const CreateCropButton = styled.button`
  background: linear-gradient(135deg, #10b981, #059669);
  color: #ffffff;
  border: none;
  font-weight: 700;
  font-size: 0.925rem;
  padding: 0.75rem 1.4rem;
  border-radius: 0.875rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.35);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(16, 185, 129, 0.5);
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

const FilterRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.75rem;
  gap: 1rem;
  flex-wrap: wrap;

  .search-box {
    background: rgba(17, 24, 39, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 0.875rem;
    padding: 0.6rem 1rem;
    display: flex;
    align-items: center;
    gap: 0.65rem;
    width: 320px;
    backdrop-filter: blur(12px);

    input {
      background: transparent;
      border: none;
      color: #f1f5f9;
      font-size: 0.9rem;
      width: 100%;
      outline: none;

      &::placeholder {
        color: #64748b;
      }
    }

    svg {
      color: #64748b;
    }
  }

  .filter-chips {
    display: flex;
    gap: 0.5rem;
  }
`;

const FilterChip = styled.button<{ $active?: boolean }>`
  background: ${props => props.$active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(31, 41, 55, 0.5)'};
  color: ${props => props.$active ? '#34d399' : '#94a3b8'};
  border: 1px solid ${props => props.$active ? 'rgba(16, 185, 129, 0.35)' : 'rgba(255, 255, 255, 0.07)'};
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: #f1f5f9;
    border-color: rgba(16, 185, 129, 0.3);
  }
`;

const CropsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 1.75rem;
`;

const CropCard = styled.div<{ $color?: string }>`
  background: rgba(17, 24, 39, 0.7);
  backdrop-filter: blur(16px);
  border-radius: 1.5rem;
  padding: 1.75rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.35);
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 230px;

  &:hover {
    transform: translateY(-5px);
    border-color: ${props => props.$color || 'rgba(16, 185, 129, 0.4)'};
    box-shadow: 0 20px 40px -5px rgba(0, 0, 0, 0.5);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
    background: ${props => props.$color || 'linear-gradient(90deg, #10b981, #059669)'};
  }

  .crop-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
  }

  .crop-header-left {
    display: flex;
    align-items: center;
    gap: 0.85rem;

    .icon-wrapper {
      width: 44px;
      height: 44px;
      border-radius: 0.875rem;
      background: ${props => props.$color ? props.$color + '22' : 'rgba(16, 185, 129, 0.15)'};
      border: 1px solid ${props => props.$color ? props.$color + '44' : 'rgba(16, 185, 129, 0.3)'};
      color: ${props => props.$color || '#34d399'};
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
    }

    .crop-name {
      font-size: 1.25rem;
      font-weight: 800;
      color: #f8fafc;
      letter-spacing: -0.02em;
    }
  }

  .crop-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #64748b;

    .action-icon {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 0.5rem;
      padding: 0.45rem;
      cursor: pointer;
      color: #94a3b8;
      transition: all 0.2s ease;

      &:hover {
        color: #38bdf8;
        border-color: rgba(56, 189, 248, 0.35);
        background: rgba(56, 189, 248, 0.1);
      }

      &.delete:hover {
        color: #f43f5e;
        border-color: rgba(244, 63, 94, 0.35);
        background: rgba(244, 63, 94, 0.1);
      }
    }
  }

  .status-row {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    margin-bottom: 1.15rem;
  }

  .active-badge {
    background: rgba(16, 185, 129, 0.15);
    color: #34d399;
    border: 1px solid rgba(16, 185, 129, 0.3);
    font-size: 0.725rem;
    font-weight: 800;
    padding: 0.25rem 0.65rem;
    border-radius: 9999px;
    letter-spacing: 0.05em;
  }

  .last-activity {
    font-size: 0.8rem;
    color: #64748b;
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  .rooms-badges {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-top: 0.85rem;
  }

  .room-chip {
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.3rem 0.65rem;
    border-radius: 0.6rem;
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;

    &.vege {
      background: rgba(56, 189, 248, 0.15);
      color: #38bdf8;
      border: 1px solid rgba(56, 189, 248, 0.25);
    }
    &.flora {
      background: rgba(245, 158, 11, 0.15);
      color: #f59e0b;
      border: 1px solid rgba(245, 158, 11, 0.25);
    }
    &.secado {
      background: rgba(168, 85, 247, 0.15);
      color: #c084fc;
      border: 1px solid rgba(168, 85, 247, 0.25);
    }
  }

  .card-footer {
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    padding-top: 1rem;
    margin-top: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .enter-link {
      color: #34d399;
      font-weight: 700;
      font-size: 0.875rem;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      transition: all 0.2s ease;

      &:hover {
        gap: 0.6rem;
        color: #6ee7b7;
      }
    }
  }
`;

const CreateNewCard = styled.div`
  background: rgba(17, 24, 39, 0.4);
  border: 2px dashed rgba(16, 185, 129, 0.35);
  backdrop-filter: blur(12px);
  border-radius: 1.5rem;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  min-height: 230px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    border-color: #10b981;
    background: rgba(16, 185, 129, 0.08);
    transform: translateY(-4px);
    box-shadow: 0 15px 30px -5px rgba(16, 185, 129, 0.2);

    .plus-circle {
      transform: scale(1.1);
      background: #10b981;
      color: #042f2e;
      box-shadow: 0 0 20px rgba(16, 185, 129, 0.5);
    }

    .create-text {
      color: #34d399;
    }
  }

  .plus-circle {
    width: 54px;
    height: 54px;
    border-radius: 50%;
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(16, 185, 129, 0.3);
    color: #34d399;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.4rem;
    margin-bottom: 1rem;
    transition: all 0.3s ease;
  }

  .create-text {
    font-size: 1.05rem;
    font-weight: 700;
    color: #e2e8f0;
    transition: color 0.2s ease;
  }

  .create-sub {
    font-size: 0.825rem;
    color: #64748b;
    margin-top: 0.35rem;
  }
`;

export const CropsV2: React.FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'active'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const mockCrops = [
    {
      id: 'c1',
      name: 'Casa de Mario',
      color: '#10b981',
      status: 'ACTIVE',
      lastActivity: 'Hoy 14:30 hs',
      rooms: [
        { type: 'vege', count: 1 },
        { type: 'flora', count: 1 },
        { type: 'secado', count: 1 }
      ]
    },
    {
      id: 'c2',
      name: 'Cultivo 2',
      color: '#38bdf8',
      status: 'ACTIVE',
      lastActivity: 'Ayer 18:10 hs',
      rooms: [
        { type: 'flora', count: 1 }
      ]
    },
    {
      id: 'c3',
      name: 'Cultivo 1',
      color: '#f59e0b',
      status: 'ACTIVE',
      lastActivity: 'Hace 3 días',
      rooms: [
        { type: 'flora', count: 2 }
      ]
    }
  ];

  return (
    <Container>
      {/* HEADER SECTION */}
      <HeaderRow>
        <TitleBlock>
          <h1>Gestión de Cultivos y Lotes</h1>
          <p>Supervisión centralizada de salas de vegetativo, floración, secado y trazabilidad digital</p>
        </TitleBlock>

        <CreateCropButton onClick={() => alert('Abrir modal de creación de cultivo')}>
          <FaPlus /> Crear Nuevo Cultivo
        </CreateCropButton>
      </HeaderRow>

      {/* KPI OVERVIEW GRID */}
      <KPIGrid>
        <KPICard $glowColor="#10b981">
          <div className="kpi-header">
            <FaSeedling className="icon" /> CULTIVOS ACTIVOS
          </div>
          <div className="value">3 Cultivos</div>
          <div className="sub">100% Operativos y trazados</div>
        </KPICard>

        <KPICard $glowColor="#38bdf8">
          <div className="kpi-header">
            <FaBorderAll className="icon" /> SALAS HABILITADAS
          </div>
          <div className="value">6 Salas</div>
          <div className="sub">1 Vege • 4 Flora • 1 Secado</div>
        </KPICard>

        <KPICard $glowColor="#f59e0b">
          <div className="kpi-header">
            <FaLeaf className="icon" /> PLANTAS TOTALES
          </div>
          <div className="value">1,420</div>
          <div className="sub">Etiquetadas en el sistema</div>
        </KPICard>

        <KPICard $glowColor="#a855f7">
          <div className="kpi-header">
            <FaClock className="icon" /> ÚLTIMA ACTIVIDAD
          </div>
          <div className="value" style={{ fontSize: '1.6rem' }}>Hace 15 min</div>
          <div className="sub">Riego registrado en Casa de Mario</div>
        </KPICard>
      </KPIGrid>

      {/* FILTER & SEARCH ROW */}
      <FilterRow>
        <div className="search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Buscar cultivo por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-chips">
          <FilterChip $active={filter === 'all'} onClick={() => setFilter('all')}>
            Todos (3)
          </FilterChip>
          <FilterChip $active={filter === 'active'} onClick={() => setFilter('active')}>
            Activos (3)
          </FilterChip>
        </div>
      </FilterRow>

      {/* CROPS GRID */}
      <CropsGrid>
        {mockCrops.map(crop => (
          <CropCard key={crop.id} $color={crop.color}>
            <div>
              <div className="crop-top">
                <div className="crop-header-left">
                  <div className="icon-wrapper">
                    <FaSeedling />
                  </div>
                  <div className="crop-name">{crop.name}</div>
                </div>

                <div className="crop-actions">
                  <div className="action-icon" title="Editar"><FaEdit /></div>
                  <div className="action-icon" title="Color"><FaPalette /></div>
                  <div className="action-icon delete" title="Eliminar"><FaTrash /></div>
                </div>
              </div>

              <div className="status-row">
                <span className="active-badge">ACTIVE</span>
                <span className="last-activity">
                  <FaClock /> Última actividad: {crop.lastActivity}
                </span>
              </div>

              <div className="rooms-badges">
                {crop.rooms.map((r, idx) => (
                  <span key={idx} className={`room-chip ${r.type}`}>
                    <FaLayerGroup /> {r.count} {r.type.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>

            <div className="card-footer">
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Ver mapa y salas</span>
              <span className="enter-link" onClick={() => navigate('/room-v2')} style={{ cursor: 'pointer' }}>
                Ingresar a Cultivo <FaArrowRight />
              </span>
            </div>
          </CropCard>
        ))}

        {/* CREATE NEW CROP CARD */}
        <CreateNewCard onClick={() => alert('Abrir modal de creación de cultivo')}>
          <div className="plus-circle">
            <FaPlus />
          </div>
          <div className="create-text">Haz click aquí para crear un nuevo cultivo</div>
          <div className="create-sub">Asigná salas, mapas de esquejera y lotes</div>
        </CreateNewCard>
      </CropsGrid>
    </Container>
  );
};

export default CropsV2;
