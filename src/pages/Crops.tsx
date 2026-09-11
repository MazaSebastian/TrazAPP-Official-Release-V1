import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
import { dailyLogsService } from '../services/dailyLogsService';
import { cropsService } from '../services/cropsService';
import { tasksService } from '../services/tasksService';
import { roomsService } from '../services/roomsService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import type { Crop } from '../types';
import { PromptModal } from '../components/PromptModal';
import { DeleteProtectionModal } from '../components/DeleteProtectionModal';
import { ColorPickerModal } from '../components/ColorPickerModal';
import { ToastModal } from '../components/ToastModal';
import { Button as ShadcnButton } from '../components/ui/Button';
import { X, Sprout } from 'lucide-react';

const floatIn = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

const scaleIn = keyframes`
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
`;

const scaleOut = keyframes`
  from { transform: scale(1); opacity: 1; }
  to { transform: scale(0.95); opacity: 0; }
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
  min-height: 240px;
  cursor: pointer;

  &:hover {
    transform: translateY(-5px);
    border-color: ${props => props.$color || 'rgba(16, 185, 129, 0.4)'};
    box-shadow: 0 20px 40px -5px rgba(0, 0, 0, 0.5);

    .enter-link {
      gap: 0.6rem;
      color: #6ee7b7;

      svg {
        transform: translateX(4px);
      }
    }
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
      cursor: pointer;

      svg {
        transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }

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
  min-height: 240px;
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
    text-align: center;
  }

  .create-sub {
    font-size: 0.825rem;
    color: #64748b;
    margin-top: 0.35rem;
    text-align: center;
  }
`;

const ModalOverlay = styled.div<{ $isClosing?: boolean }>`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(8px);
  animation: ${p => p.$isClosing ? fadeOut : fadeIn} 0.2s ease-in-out forwards;
`;

const ModalContent = styled.div<{ $isClosing?: boolean }>`
  background: rgba(17, 24, 39, 0.95);
  backdrop-filter: blur(16px);
  padding: 2rem;
  border-radius: 1.5rem;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 20px 40px -5px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  animation: ${p => p.$isClosing ? scaleOut : scaleIn} 0.2s ease-in-out forwards;

  h2 {
    margin-top: 0;
    color: #f8fafc;
    margin-bottom: 1.5rem;
    font-size: 1.35rem;
    font-weight: 700;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.25rem;

  label {
    display: block;
    margin-bottom: 0.5rem;
    color: #94a3b8;
    font-size: 0.875rem;
    font-weight: 600;
  }

  input {
    width: 100%;
    padding: 0.75rem 1rem;
    background: rgba(31, 41, 55, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.75rem;
    color: #f8fafc;
    font-size: 0.95rem;
    outline: none;

    &:focus {
      border-color: #10b981;
      box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
    }
  }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;

  button {
    padding: 0.65rem 1.25rem;
    border-radius: 0.75rem;
    font-weight: 700;
    font-size: 0.875rem;
    cursor: pointer;
    border: none;
    transition: all 0.2s ease;

    &.cancel {
      background: rgba(255, 255, 255, 0.05);
      color: #94a3b8;
      border: 1px solid rgba(255, 255, 255, 0.1);
      &:hover { background: rgba(255, 255, 255, 0.1); color: #f1f5f9; }
    }

    &.save {
      background: linear-gradient(135deg, #10b981, #059669);
      color: #ffffff;
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
      &:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(16, 185, 129, 0.5); }
    }
  }
`;

export const Crops: React.FC = () => {
  const navigate = useNavigate();
  const { tourStepIndex, setTourStepIndex } = useAuth();
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active'>('all');

  // Modals & Toast State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClosingCreate, setIsClosingCreate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  const [formData, setFormData] = useState({
    name: '',
    startDate: new Date().toISOString().split('T')[0],
    estimatedHarvestDate: '',
    location: '',
    color: 'green',
    geneticId: ''
  });

  const [lastActivityMap, setLastActivityMap] = useState<Record<string, string>>({});

  const loadLastActivities = React.useCallback(async (cropsData: Crop[]) => {
    const activityMap: Record<string, string> = {};

    await Promise.all(cropsData.map(async (crop) => {
      const [tasks, logs] = await Promise.all([
        tasksService.getTasksByCropId(crop.id),
        dailyLogsService.getLogsByCropId(crop.id)
      ]);

      const doneTasks = tasks.filter(t => t.status === 'done');
      let maxDate = 0;

      doneTasks.forEach(t => {
        let dateStr = t.due_date || t.created_at;
        if (dateStr && dateStr.length === 10) dateStr += 'T12:00:00';
        const d = new Date(dateStr).getTime();
        if (d > maxDate) maxDate = d;
      });

      logs.forEach(l => {
        let dateStr = l.date;
        if (dateStr && dateStr.length === 10) dateStr += 'T12:00:00';
        const d = new Date(dateStr).getTime();
        if (d > maxDate) maxDate = d;
      });

      if (maxDate > 0) {
        activityMap[crop.id] = new Date(maxDate).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      }
    }));

    setLastActivityMap(activityMap);
  }, []);

  const loadCrops = React.useCallback(async (isInitial = false, silent = false) => {
    if (!silent) setLoading(true);
    const data = await cropsService.getCrops();
    await loadLastActivities(data);
    setCrops(data);
    if (!silent) setLoading(false);
  }, [loadLastActivities]);

  React.useEffect(() => {
    loadCrops(true);
  }, [loadCrops]);

  // Handle Create Crop
  const handleCreate = async () => {
    if (!formData.name) {
      setToastMessage("Por favor ingresa un nombre para el Cultivo.");
      setToastType('info');
      setToastOpen(true);
      return;
    }

    try {
      setIsCreating(true);
      const normalizedDate = new Date();
      normalizedDate.setHours(12, 0, 0, 0);

      const newCrop = await cropsService.createCrop({
        name: formData.name,
        location: 'Cultivo General',
        startDate: normalizedDate.toISOString(),
        estimatedHarvestDate: undefined,
        color: 'green'
      });

      if (newCrop) {
        setCrops(prev => [newCrop, ...prev]);
        setIsClosingCreate(true);
        setTimeout(() => {
          setIsModalOpen(false);
          setIsClosingCreate(false);
        }, 200);
        setFormData({
          name: '',
          startDate: new Date().toISOString().split('T')[0],
          estimatedHarvestDate: '',
          location: '',
          color: 'green',
          geneticId: ''
        });
        setToastMessage("¡Cultivo creado exitosamente!");
        setToastType('success');
        setToastOpen(true);
      } else {
        setToastMessage("Error al crear el cultivo.");
        setToastType('error');
        setToastOpen(true);
      }
    } catch (error: any) {
      setToastMessage(`Error al crear el cultivo: ${error.message || error}`);
      setToastType('error');
      setToastOpen(true);
    } finally {
      setIsCreating(false);
    }
  };

  // Color & Edit State
  const [editingCrop, setEditingCrop] = useState<Crop | null>(null);
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [colorCropTarget, setColorCropTarget] = useState<Crop | null>(null);

  // Delete State
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cropToDelete, setCropToDelete] = useState<Crop | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteCrop = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    const cropRooms = await roomsService.getRooms(id);
    const hasActiveBatches = cropRooms.some((room: any) =>
      room.batches && room.batches.some((b: any) => b.stage !== 'completed')
    );

    if (hasActiveBatches) {
      setToastMessage(`No puedes eliminar este cultivo porque contiene salas con lotes activos. Mueve o desecha los lotes primero.`);
      setToastType('error');
      setToastOpen(true);
      return;
    }

    setCropToDelete({ id, name, location: '', startDate: '', status: 'active', partners: [], photoUrl: '' });
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!cropToDelete) return;
    try {
      setIsDeleting(true);
      await cropsService.deleteCrop(cropToDelete.id);
      setCrops(prev => prev.filter(c => c.id !== cropToDelete.id));
      setToastMessage(`Cultivo "${cropToDelete.name}" eliminado correctamente.`);
      setToastType('success');
      setToastOpen(true);
    } catch (err: any) {
      setToastMessage(`Error al eliminar: ${err.message || err}`);
      setToastType('error');
      setToastOpen(true);
    } finally {
      setIsDeleting(false);
      setConfirmOpen(false);
      setCropToDelete(null);
    }
  };

  const handleOpenColorPicker = (e: React.MouseEvent, crop: Crop) => {
    e.stopPropagation();
    setColorCropTarget(crop);
    setIsColorPickerOpen(true);
  };

  const handleSelectColor = async (color: string) => {
    if (!colorCropTarget) return;
    try {
      await cropsService.updateCrop(colorCropTarget.id, { color });
      setCrops(prev => prev.map(c => c.id === colorCropTarget.id ? { ...c, color } : c));
      setToastMessage("Color de cultivo actualizado correctamente.");
      setToastType('success');
      setToastOpen(true);
    } catch (err: any) {
      setToastMessage(`Error al cambiar color: ${err.message || err}`);
      setToastType('error');
      setToastOpen(true);
    }
  };

  const filteredCrops = crops.filter(crop => {
    const matchesSearch = crop.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || crop.status === 'active';
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <LoadingSpinner fullScreen duration={2000} />;
  }

  return (
    <Container>
      {/* HEADER SECTION */}
      <HeaderRow>
        <TitleBlock>
          <h1>Gestión de Cultivos y Lotes</h1>
          <p>Supervisión centralizada de salas de vegetativo, floración, secado y trazabilidad digital</p>
        </TitleBlock>

        <CreateCropButton onClick={() => setIsModalOpen(true)}>
          <FaPlus /> Crear Nuevo Cultivo
        </CreateCropButton>
      </HeaderRow>

      {/* KPI OVERVIEW GRID */}
      <KPIGrid>
        <KPICard $glowColor="#10b981">
          <div className="kpi-header">
            <FaSeedling className="icon" /> CULTIVOS ACTIVOS
          </div>
          <div className="value">{crops.length} {crops.length === 1 ? 'Cultivo' : 'Cultivos'}</div>
          <div className="sub">100% Operativos y trazados</div>
        </KPICard>

        <KPICard $glowColor="#38bdf8">
          <div className="kpi-header">
            <FaBorderAll className="icon" /> SALAS HABILITADAS
          </div>
          <div className="value">
            {crops.reduce((acc, c) => acc + (c.rooms?.length || 0), 0) || '6'} Salas
          </div>
          <div className="sub">Distribución multiespacio</div>
        </KPICard>

        <KPICard $glowColor="#f59e0b">
          <div className="kpi-header">
            <FaLeaf className="icon" /> SEGUIMIENTO TOTAL
          </div>
          <div className="value">Trazabilidad</div>
          <div className="sub">Lotes y plantas en tiempo real</div>
        </KPICard>

        <KPICard $glowColor="#a855f7">
          <div className="kpi-header">
            <FaClock className="icon" /> ÚLTIMA ACTIVIDAD
          </div>
          <div className="value" style={{ fontSize: '1.5rem' }}>
            {Object.values(lastActivityMap)[0] || 'Hoy'}
          </div>
          <div className="sub">Registros de riego y tareas</div>
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
          <FilterChip $active={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>
            Todos ({crops.length})
          </FilterChip>
          <FilterChip $active={statusFilter === 'active'} onClick={() => setStatusFilter('active')}>
            Activos ({crops.filter(c => c.status === 'active').length})
          </FilterChip>
        </div>
      </FilterRow>

      {/* CROPS GRID */}
      <CropsGrid>
        {filteredCrops.map(crop => {
          const roomCounts: Record<string, number> = {};
          if (crop.rooms) {
            crop.rooms.forEach((r: any) => {
              const typeKey = (r.type || 'otros').toLowerCase();
              roomCounts[typeKey] = (roomCounts[typeKey] || 0) + 1;
            });
          }

          return (
            <CropCard
              key={crop.id}
              $color={crop.color === 'green' ? '#10b981' : crop.color === 'blue' ? '#38bdf8' : crop.color === 'yellow' ? '#f59e0b' : crop.color || '#10b981'}
              onClick={() => navigate('/rooms')}
            >
              <div>
                <div className="crop-top">
                  <div className="crop-header-left">
                    <div className="icon-wrapper">
                      <FaSeedling />
                    </div>
                    <div className="crop-name">{crop.name}</div>
                  </div>

                  <div className="crop-actions" onClick={(e) => e.stopPropagation()}>
                    <div className="action-icon" title="Editar" onClick={(e) => { e.stopPropagation(); setEditingCrop(crop); setIsPromptOpen(true); }}><FaEdit /></div>
                    <div className="action-icon" title="Color" onClick={(e) => handleOpenColorPicker(e, crop)}><FaPalette /></div>
                    <div className="action-icon delete" title="Eliminar" onClick={(e) => handleDeleteCrop(e, crop.id, crop.name)}><FaTrash /></div>
                  </div>
                </div>

                <div className="status-row">
                  <span className="active-badge">{crop.status ? crop.status.toUpperCase() : 'ACTIVE'}</span>
                  <span className="last-activity">
                    <FaClock /> Última actividad: {lastActivityMap[crop.id] || 'Sin registros'}
                  </span>
                </div>

                <div className="rooms-badges">
                  {Object.keys(roomCounts).length > 0 ? (
                    Object.entries(roomCounts).map(([type, count]) => (
                      <span key={type} className={`room-chip ${type.includes('vege') ? 'vege' : type.includes('flor') ? 'flora' : 'secado'}`}>
                        <FaLayerGroup /> {count} {type.toUpperCase()}
                      </span>
                    ))
                  ) : (
                    <span className="room-chip vege"><FaLayerGroup /> 1 VEGE</span>
                  )}
                </div>
              </div>

              <div className="card-footer">
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Ver salas y lotes</span>
                <span className="enter-link">
                  Ingresar a Cultivo <FaArrowRight />
                </span>
              </div>
            </CropCard>
          );
        })}

        {/* CREATE NEW CROP CARD */}
        <CreateNewCard onClick={() => setIsModalOpen(true)}>
          <div className="plus-circle">
            <FaPlus />
          </div>
          <div className="create-text">Haz click aquí para crear un nuevo cultivo</div>
          <div className="create-sub">Asigná salas, mapas de esquejera y lotes</div>
        </CreateNewCard>
      </CropsGrid>

      {/* CREATE MODAL */}
      {isModalOpen && (
        <ModalOverlay $isClosing={isClosingCreate} onClick={() => setIsModalOpen(false)}>
          <ModalContent $isClosing={isClosingCreate} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{
                  width: '34px', height: '34px', borderRadius: '9px',
                  background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)',
                  color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Sprout size={18} />
                </div>
                <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '1.2rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
                  Crear Nuevo Cultivo
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                title="Cerrar"
                style={{
                  background: 'none', border: 'none', color: '#94a3b8',
                  cursor: 'pointer', padding: '6px', borderRadius: '8px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#f8fafc'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#94a3b8'; }}
              >
                <X size={17} />
              </button>
            </div>

            <FormGroup>
              <label>Nombre del Cultivo</label>
              <input
                type="text"
                placeholder="Ej: Cultivo Central / Sala Norte"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                autoFocus
              />
            </FormGroup>

            <ModalActions>
              <ShadcnButton
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                disabled={isCreating}
              >
                Cancelar
              </ShadcnButton>
              <ShadcnButton
                type="button"
                variant="default"
                size="sm"
                onClick={handleCreate}
                disabled={isCreating || !formData.name.trim()}
              >
                {isCreating ? 'Guardando...' : 'Crear Cultivo'}
              </ShadcnButton>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* PROMPT EDIT MODAL */}
      <PromptModal
        isOpen={isPromptOpen}
        title="Editar Nombre del Cultivo"
        initialValue={editingCrop?.name || ''}
        placeholder="Nuevo nombre..."
        onConfirm={async (newName) => {
          if (editingCrop) {
            try {
              await cropsService.updateCrop(editingCrop.id, { name: newName });
              setCrops(prev => prev.map(c => c.id === editingCrop.id ? { ...c, name: newName } : c));
              setToastMessage("Nombre actualizado correctamente.");
              setToastType('success');
              setToastOpen(true);
            } catch (err: any) {
              setToastMessage(`Error al actualizar: ${err.message || err}`);
              setToastType('error');
              setToastOpen(true);
            }
          }
          setIsPromptOpen(false);
        }}
        onClose={() => setIsPromptOpen(false)}
      />

      {/* COLOR PICKER MODAL */}
      <ColorPickerModal
        isOpen={isColorPickerOpen}
        colors={['green', 'blue', 'yellow', 'purple', 'pink', 'red']}
        selectedColor={colorCropTarget?.color || 'green'}
        onSelectColor={handleSelectColor}
        onClose={() => setIsColorPickerOpen(false)}
      />

      {/* DELETE PROTECTION MODAL */}
      <DeleteProtectionModal
        isOpen={confirmOpen}
        itemType="Cultivo"
        itemName={cropToDelete?.name || ''}
        onConfirm={confirmDelete}
        onClose={() => {
          setConfirmOpen(false);
          setCropToDelete(null);
        }}
        isLoading={isDeleting}
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

export default Crops;
