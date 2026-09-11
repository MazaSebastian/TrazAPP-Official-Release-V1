import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { useNavigate } from 'react-router-dom';
import {
  Warehouse,
  Plus,
  Thermometer,
  Droplets,
  Edit3,
  Trash2,
  Map,
  Search,
  ArrowRight,
  Sprout,
  Leaf,
  Clock,
  X as LucideX
} from 'lucide-react';
import { roomsService } from '../services/roomsService';
import { Room } from '../types/rooms';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ConfirmModal } from '../components/ConfirmModal';
import { ToastModal } from '../components/ToastModal';
import { ShadcnButton } from '../components/ui/Button';
import { ShadcnBadge } from '../components/ui/Badge';

const floatIn = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const scaleIn = keyframes`
  from { transform: scale(0.96); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
`;

const Container = styled.div`
  padding: 2rem 2.5rem;
  max-width: 1560px;
  margin: 0 auto;
  min-height: 100vh;
  background: #090d16;
  color: #f8fafc;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  animation: ${floatIn} 0.35s ease-out;

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

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.85rem;
  flex-wrap: wrap;
`;

const KPIGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 250px), 1fr));
  gap: 1.5rem;
  margin-bottom: 2.25rem;
`;

const KPICard = styled.div<{ $glowColor?: string }>`
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(16px);
  border-radius: 1.25rem;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.35);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-3px);
    border-color: ${props => props.$glowColor || 'rgba(16, 185, 129, 0.4)'};
    box-shadow: 0 18px 35px -5px rgba(0, 0, 0, 0.5);
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

    .icon-box {
      width: 28px;
      height: 28px;
      border-radius: 0.45rem;
      background: ${props => (props.$glowColor ? props.$glowColor + '18' : 'rgba(16, 185, 129, 0.15)')};
      border: 1px solid ${props => (props.$glowColor ? props.$glowColor + '33' : 'rgba(16, 185, 129, 0.3)')};
      color: ${props => props.$glowColor || '#34d399'};
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .value {
    font-size: 1.95rem;
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
    background: rgba(15, 23, 42, 0.75);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 0.875rem;
    padding: 0.6rem 1rem;
    display: flex;
    align-items: center;
    gap: 0.65rem;
    width: 320px;
    backdrop-filter: blur(12px);
    transition: border-color 0.2s, box-shadow 0.2s;

    &:focus-within {
      border-color: rgba(16, 185, 129, 0.5);
      box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
    }

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
    flex-wrap: wrap;
  }
`;

const FilterChip = styled.button<{ $active?: boolean }>`
  background: ${props => props.$active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(30, 41, 59, 0.5)'};
  color: ${props => props.$active ? '#34d399' : '#94a3b8'};
  border: 1px solid ${props => props.$active ? 'rgba(16, 185, 129, 0.35)' : 'rgba(255, 255, 255, 0.08)'};
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

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 1.75rem;
`;

const RoomCard = styled.div<{ $stageColor?: string }>`
  background: rgba(15, 23, 42, 0.8);
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
  min-height: 250px;
  cursor: pointer;

  &:hover {
    transform: translateY(-4px);
    border-color: ${props => props.$stageColor || 'rgba(16, 185, 129, 0.4)'};
    box-shadow: 0 20px 40px -5px rgba(0, 0, 0, 0.5);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
    background: ${props => props.$stageColor || 'linear-gradient(90deg, #10b981, #059669)'};
  }

  .room-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.25rem;
  }

  .room-header-left {
    display: flex;
    align-items: center;
    gap: 0.85rem;

    .icon-wrapper {
      width: 44px;
      height: 44px;
      border-radius: 0.875rem;
      background: ${props => props.$stageColor ? props.$stageColor + '18' : 'rgba(16, 185, 129, 0.15)'};
      border: 1px solid ${props => props.$stageColor ? props.$stageColor + '33' : 'rgba(16, 185, 129, 0.3)'};
      color: ${props => props.$stageColor || '#34d399'};
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .room-info {
      .room-name {
        font-size: 1.25rem;
        font-weight: 800;
        color: #f8fafc;
        letter-spacing: -0.02em;
      }

      .room-stage-tag {
        margin-top: 0.25rem;
      }
    }
  }

  .room-actions {
    display: flex;
    align-items: center;
    gap: 0.4rem;

    .action-icon {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 0.5rem;
      padding: 0.45rem;
      cursor: pointer;
      color: #94a3b8;
      display: flex;
      align-items: center;
      justify-content: center;
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

  .telemetry-block {
    background: rgba(30, 41, 59, 0.45);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 0.875rem;
    padding: 0.85rem 1rem;
    display: flex;
    justify-content: space-around;
    align-items: center;
    margin-top: 0.75rem;
    margin-bottom: 0.5rem;

    .telemetry-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.2rem;

      .t-label {
        font-size: 0.725rem;
        color: #94a3b8;
        display: flex;
        align-items: center;
        gap: 0.35rem;
        font-weight: 600;
      }

      .t-value {
        font-size: 0.95rem;
        font-weight: 800;
        color: #f1f5f9;
      }
    }

    .divider {
      width: 1px;
      height: 24px;
      background: rgba(255, 255, 255, 0.08);
    }
  }

  .card-footer {
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    padding-top: 1rem;
    margin-top: 0.85rem;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .enter-link {
      color: #34d399;
      font-weight: 700;
      font-size: 0.875rem;
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

const CreateCard = styled.div`
  background: rgba(15, 23, 42, 0.45);
  border: 2px dashed rgba(16, 185, 129, 0.35);
  backdrop-filter: blur(12px);
  border-radius: 1.5rem;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  min-height: 250px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    border-color: #10b981;
    background: rgba(16, 185, 129, 0.08);
    transform: translateY(-4px);
    box-shadow: 0 15px 30px -5px rgba(16, 185, 129, 0.2);

    .plus-circle {
      transform: scale(1.08);
      background: #10b981;
      color: #042f2e;
      box-shadow: 0 0 20px rgba(16, 185, 129, 0.5);
    }

    .create-text {
      color: #34d399;
    }
  }

  .plus-circle {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(16, 185, 129, 0.3);
    color: #34d399;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1rem;
    transition: all 0.3s ease;
  }

  .create-text {
    font-size: 1.05rem;
    font-weight: 700;
    color: #e2e8f0;
    transition: color 0.2s ease;
    text-align: center;
  }

  .create-sub {
    font-size: 0.825rem;
    color: #64748b;
    margin-top: 0.35rem;
    text-align: center;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(12px);
  padding: 1rem;
  animation: ${fadeIn} 0.2s ease-in-out forwards;
`;

const ModalContent = styled.div`
  background: rgba(15, 23, 42, 0.96);
  backdrop-filter: blur(24px);
  padding: 2.25rem;
  border-radius: 1.25rem;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  animation: ${scaleIn} 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
`;

const ModalHeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.75rem;

  .header-left {
    display: flex;
    align-items: center;
    gap: 0.75rem;

    .icon-badge {
      width: 40px;
      height: 40px;
      border-radius: 0.65rem;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    h2 {
      margin: 0;
      color: #f8fafc;
      font-size: 1.3rem;
      font-weight: 700;
    }
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.45rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  &:hover {
    color: #f1f5f9;
    background: rgba(255, 255, 255, 0.08);
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.25rem;

  label {
    display: block;
    margin-bottom: 0.45rem;
    color: #cbd5e1;
    font-size: 0.85rem;
    font-weight: 600;
  }

  input, select {
    width: 100%;
    padding: 0.75rem 1rem;
    background: rgba(30, 41, 59, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.65rem;
    color: #f8fafc;
    font-size: 0.95rem;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.2s, box-shadow 0.2s;

    &:focus {
      border-color: rgba(16, 185, 129, 0.5);
      box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
    }
  }

  select option {
    background: #0f172a;
    color: #f8fafc;
  }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 2rem;
`;

export const Rooms: React.FC = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: '', type: 'vegetation', capacity: 0 });
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);

  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  useEffect(() => {
    loadRooms(true);
  }, []);

  const loadRooms = async (isInitial = false) => {
    setLoading(true);
    try {
      const data = await roomsService.getRooms();
      setRooms(data);
    } catch (error) {
      console.error("Error loading rooms", error);
      setToastMessage("Error al cargar las salas. Por favor, intenta de nuevo.");
      setToastType('error');
      setToastOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdateRoom = async () => {
    if (!newRoom.name) return;

    if (editingRoomId) {
      const success = await roomsService.updateRoom(editingRoomId, {
        name: newRoom.name,
        type: newRoom.type as any,
        capacity: newRoom.capacity
      });
      if (success) {
        setRooms(rooms.map(r => r.id === editingRoomId ? { ...r, ...newRoom, type: newRoom.type as any } : r));
        closeModal();
        setToastMessage("Sala actualizada correctamente.");
        setToastType('success');
        setToastOpen(true);
      }
    } else {
      const created = await roomsService.createRoom({
        name: newRoom.name,
        type: newRoom.type as any,
        capacity: newRoom.capacity
      });

      if (created) {
        setRooms([...rooms, created]);
        closeModal();
        setToastMessage("Sala creada correctamente.");
        setToastType('success');
        setToastOpen(true);
      }
    }
  };

  const handleEdit = (e: React.MouseEvent, room: Room) => {
    e.stopPropagation();
    setEditingRoomId(room.id);
    setNewRoom({
      name: room.name,
      type: room.type,
      capacity: room.capacity
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const room = rooms.find(r => r.id === id);
    const activeBatches = room?.batches?.filter(b => b.stage !== 'completed') || [];

    if (activeBatches.length > 0) {
      setToastMessage(`No puedes eliminar esta sala porque contiene ${activeBatches.length} lote(s) con plantas vivas.`);
      setToastType('error');
      setToastOpen(true);
      return;
    }

    setRoomToDelete(id);
    setIsConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!roomToDelete) return;
    setIsDeleting(true);
    try {
      const success = await roomsService.deleteRoom(roomToDelete);
      setIsDeleting(false);

      if (success) {
        setRooms(rooms.filter(r => r.id !== roomToDelete));
        setToastMessage(`La sala ha sido eliminada correctamente.`);
        setToastType('success');
        setToastOpen(true);
      } else {
        setToastMessage("Error al eliminar la sala.");
        setToastType('error');
        setToastOpen(true);
      }
    } catch (error: any) {
      setIsDeleting(false);
      setToastMessage(error.message || "Error al eliminar la sala.");
      setToastType('error');
      setToastOpen(true);
    }
    setIsConfirmDeleteOpen(false);
    setRoomToDelete(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRoomId(null);
    setNewRoom({ name: '', type: 'vegetation', capacity: 0 });
  };

  const getStageBadgeVariant = (type: string): 'sky' | 'amber' | 'purple' | 'emerald' | 'default' => {
    switch (type) {
      case 'vegetation':
      case 'clones':
        return 'sky';
      case 'flowering':
        return 'amber';
      case 'drying':
      case 'curing':
        return 'purple';
      case 'living_soil':
        return 'emerald';
      default:
        return 'default';
    }
  };

  const getStageColor = (type: string) => {
    switch (type) {
      case 'vegetation':
      case 'clones':
        return '#38bdf8';
      case 'flowering':
        return '#f59e0b';
      case 'drying':
      case 'curing':
        return '#a855f7';
      case 'living_soil':
        return '#10b981';
      default:
        return '#34d399';
    }
  };

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || room.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const countByType = (t: string) => rooms.filter(r => r.type === t || (t === 'drying' && r.type === 'curing')).length;

  if (loading) return <LoadingSpinner fullScreen duration={1500} />;

  return (
    <Container>
      {/* HEADER SECTION */}
      <HeaderRow>
        <TitleBlock>
          <h1>Salas de Cultivo y Zonas de Producción</h1>
          <p>Gestión de espacios, parámetros ambientales (Temp/Humedad) y capacidad de lotes en tiempo real</p>
        </TitleBlock>

        <ButtonGroup>
          <ShadcnButton variant="secondary" onClick={() => navigate('/rooms/map')}>
            <Map size={16} /> Mapa Interactivo
          </ShadcnButton>

          <ShadcnButton variant="default" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Nueva Sala
          </ShadcnButton>
        </ButtonGroup>
      </HeaderRow>

      {/* KPI OVERVIEW GRID */}
      <KPIGrid>
        <KPICard $glowColor="#10b981">
          <div className="kpi-header">
            <div className="icon-box">
              <Warehouse size={16} />
            </div>
            SALAS TOTALES
          </div>
          <div className="value">{rooms.length} Salas</div>
          <div className="sub">Espacios de producción habilitados</div>
        </KPICard>

        <KPICard $glowColor="#38bdf8">
          <div className="kpi-header">
            <div className="icon-box">
              <Sprout size={16} />
            </div>
            VEGETATIVO & CLONES
          </div>
          <div className="value">{countByType('vegetation') + countByType('clones')} Salas</div>
          <div className="sub">Desarrollo radicular y crecimiento</div>
        </KPICard>

        <KPICard $glowColor="#f59e0b">
          <div className="kpi-header">
            <div className="icon-box">
              <Leaf size={16} />
            </div>
            FLORACIÓN
          </div>
          <div className="value">{countByType('flowering')} Salas</div>
          <div className="sub">Generación de resina y desarrollo de flor</div>
        </KPICard>

        <KPICard $glowColor="#a855f7">
          <div className="kpi-header">
            <div className="icon-box">
              <Clock size={16} />
            </div>
            SECADO & CURADO
          </div>
          <div className="value">{countByType('drying')} Salas</div>
          <div className="sub">Procesamiento post-cosecha controlado</div>
        </KPICard>
      </KPIGrid>

      {/* FILTER & SEARCH ROW */}
      <FilterRow>
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar sala por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-chips">
          <FilterChip $active={typeFilter === 'all'} onClick={() => setTypeFilter('all')}>
            Todas ({rooms.length})
          </FilterChip>
          <FilterChip $active={typeFilter === 'vegetation'} onClick={() => setTypeFilter('vegetation')}>
            Vegetativo ({countByType('vegetation')})
          </FilterChip>
          <FilterChip $active={typeFilter === 'flowering'} onClick={() => setTypeFilter('flowering')}>
            Floración ({countByType('flowering')})
          </FilterChip>
          <FilterChip $active={typeFilter === 'drying'} onClick={() => setTypeFilter('drying')}>
            Secado ({countByType('drying')})
          </FilterChip>
        </div>
      </FilterRow>

      {/* ROOMS GRID */}
      <Grid>
        {filteredRooms.map(room => {
          const stageColor = getStageColor(room.type);
          const badgeVariant = getStageBadgeVariant(room.type);
          return (
            <RoomCard key={room.id} $stageColor={stageColor} onClick={() => navigate(`/rooms/${room.id}`)}>
              <div>
                <div className="room-top">
                  <div className="room-header-left">
                    <div className="icon-wrapper">
                      <Warehouse size={22} />
                    </div>
                    <div className="room-info">
                      <div className="room-name">{room.name}</div>
                      <div className="room-stage-tag">
                        <ShadcnBadge variant={badgeVariant} dot>
                          {room.type === 'living_soil' ? 'AGRO/LIVING SOIL' : room.type === 'curing' ? 'SECADO' : room.type.toUpperCase()}
                        </ShadcnBadge>
                      </div>
                    </div>
                  </div>

                  <div className="room-actions">
                    <div className="action-icon" title="Editar" onClick={(e) => handleEdit(e, room)}>
                      <Edit3 size={15} />
                    </div>
                    <div className="action-icon delete" title="Eliminar" onClick={(e) => handleDeleteClick(e, room.id)}>
                      <Trash2 size={15} />
                    </div>
                  </div>
                </div>

                <div className="telemetry-block">
                  <div className="telemetry-item">
                    <span className="t-label"><Thermometer size={14} style={{ color: '#f43f5e' }} /> TEMP</span>
                    <span className="t-value">24.5 °C</span>
                  </div>
                  <div className="divider" />
                  <div className="telemetry-item">
                    <span className="t-label"><Droplets size={14} style={{ color: '#38bdf8' }} /> HUMEDAD</span>
                    <span className="t-value">62 %</span>
                  </div>
                  <div className="divider" />
                  <div className="telemetry-item">
                    <span className="t-label"><Leaf size={14} style={{ color: '#10b981' }} /> CAPACIDAD</span>
                    <span className="t-value">{room.capacity || '--'} Plantas</span>
                  </div>
                </div>
              </div>

              <div className="card-footer">
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Ver mapa y mesas</span>
                <span className="enter-link">
                  Ver Detalle de Sala <ArrowRight size={15} />
                </span>
              </div>
            </RoomCard>
          );
        })}

        {/* CREATE NEW ROOM CARD */}
        <CreateCard onClick={() => setIsModalOpen(true)}>
          <div className="plus-circle">
            <Plus size={26} />
          </div>
          <div className="create-text">Haz click aquí para crear una nueva sala</div>
          <div className="create-sub">Asigná tipo de sala, capacidad y distribución</div>
        </CreateCard>
      </Grid>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <ModalOverlay onClick={closeModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeaderRow>
              <div className="header-left">
                <div className="icon-badge">
                  <Warehouse size={20} color="#34d399" />
                </div>
                <h2>{editingRoomId ? 'Editar Sala' : 'Nueva Sala de Cultivo'}</h2>
              </div>
              <CloseButton onClick={closeModal} aria-label="Cerrar">
                <LucideX size={20} />
              </CloseButton>
            </ModalHeaderRow>

            <FormGroup>
              <label>Nombre de la Sala</label>
              <input
                type="text"
                placeholder="Ej: Sala Vegetativo A / Floración 1"
                value={newRoom.name}
                onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                autoFocus
              />
            </FormGroup>

            <FormGroup>
              <label>Etapa / Tipo de Sala</label>
              <select
                value={newRoom.type}
                onChange={(e) => setNewRoom({ ...newRoom, type: e.target.value })}
              >
                <option value="vegetation">Vegetativo (Vegetation)</option>
                <option value="flowering">Floración (Flowering)</option>
                <option value="drying">Secado / Curado (Drying)</option>
                <option value="living_soil">Living Soil / Orgánico</option>
              </select>
            </FormGroup>

            <FormGroup>
              <label>Capacidad Estimada (Plantas)</label>
              <input
                type="number"
                placeholder="Ej: 100"
                value={newRoom.capacity || ''}
                onChange={(e) => setNewRoom({ ...newRoom, capacity: parseInt(e.target.value) || 0 })}
              />
            </FormGroup>

            <ModalActions>
              <ShadcnButton variant="secondary" onClick={closeModal}>
                Cancelar
              </ShadcnButton>
              <ShadcnButton variant="default" onClick={handleCreateOrUpdateRoom}>
                {editingRoomId ? 'Guardar Cambios' : 'Crear Sala'}
              </ShadcnButton>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={isConfirmDeleteOpen}
        title="¿Eliminar Sala?"
        message="Esta acción no se puede deshacer. ¿Estás seguro de que deseas eliminar esta sala?"
        onConfirm={handleConfirmDelete}
        onClose={() => {
          setIsConfirmDeleteOpen(false);
          setRoomToDelete(null);
        }}
        confirmText={isDeleting ? 'Eliminando...' : 'Eliminar'}
        cancelText="Cancelar"
      />

      {/* TOAST MODAL */}
      <ToastModal
        isOpen={toastOpen}
        message={toastMessage}
        type={toastType}
        onClose={() => setToastOpen(false)}
      />
    </Container>
  );
};

export default Rooms;
