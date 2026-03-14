import React, { useState, useEffect, useMemo } from 'react';
import styled, { keyframes } from 'styled-components';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaBoxes,
  FaTimesCircle,
  FaDownload,
  FaPaperclip,
  FaFileInvoice
} from 'react-icons/fa';
import { CustomSelect } from '../components/CustomSelect';
import { useOrganization } from '../context/OrganizationContext';
import UpgradeOverlay from '../components/common/UpgradeOverlay';
import { ConfirmModal } from '../components/ConfirmModal';
import { ToastModal } from '../components/ToastModal';
import type { Insumo, InsumoCategory } from '../types';
import {
  getInsumos,
  createInsumo,
  updateInsumo,
  deleteInsumo,
  getInsumosStats,
  uploadTicket,
  getInsumoCategories
} from '../services/insumosService';
import { getInsumoProviders, InsumoProvider } from '../services/insumoProvidersService';
import { InsumoProvidersTab } from '../components/Insumos/InsumoProvidersTab';
import { InsumoOrdersTab } from '../components/Insumos/InsumoOrdersTab';
import { useAuth } from '../context/AuthContext';
import { usersService } from '../services/usersService';
import { expensesService, CashMovement, getAreaFromRole } from '../services/expensesService';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(20px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

const slideDown = keyframes`
  from { opacity: 1; transform: translateY(0) scale(1); }
  to { opacity: 0; transform: translateY(20px) scale(0.95); }
`;

const Page = styled.div`
  padding: 1rem;
  padding-top: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;
  color: #f8fafc;
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1.5rem;

  h1 {
    font-size: 1.8rem;
    color: #f8fafc;
    margin: 0;
    text-align: center;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(12px);
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
  }

  .stat-value {
    font-size: 1.8rem;
    font-weight: 700;
    color: #f8fafc;
    margin-bottom: 0.5rem;
  }

  .stat-label {
    color: #94a3b8;
    font-size: 0.8rem;
  }

  &.warning .stat-value {
    color: #facc15;
  }

  &.danger .stat-value {
    color: #f87171;
  }

  &.success .stat-value {
    color: #4ade80;
  }
`;

const Controls = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
  
  @media (min-width: 768px) {
    flex-direction: row;
    align-items: center;
    flex-wrap: wrap;
  }
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' | 'success' }>`
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  font-size: 0.875rem;
  backdrop-filter: blur(8px);

  ${props => {
    switch (props.variant) {
      case 'secondary':
        return `
          background: rgba(30, 41, 59, 0.6);
          color: #cbd5e1;
          border: 1px solid rgba(255, 255, 255, 0.1);
          &:hover { background: rgba(255, 255, 255, 0.1); color: #f8fafc; }
        `;
      case 'danger':
        return `
          background: rgba(239, 68, 68, 0.1);
          color: #f87171;
          border: 1px solid rgba(239, 68, 68, 0.2);
          &:hover { background: rgba(239, 68, 68, 0.2); }
        `;
      case 'success':
        return `
          background: rgba(74, 222, 128, 0.2);
          color: #4ade80;
          border: 1px solid rgba(74, 222, 128, 0.5);
          &:hover { background: rgba(74, 222, 128, 0.3); }
        `;
      default:
        return `
          background: rgba(168, 85, 247, 0.2);
          color: #d8b4fe;
          border: 1px solid rgba(168, 85, 247, 0.5);
          &:hover { background: rgba(168, 85, 247, 0.3); box-shadow: 0 4px 6px rgba(0,0,0,0.2); }
        `;
    }
  }}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const SearchInput = styled.input`
  padding: 0.75rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  min-width: 250px;
  background: rgba(30, 41, 59, 0.5);
  color: #f8fafc;
  backdrop-filter: blur(8px);

  &:focus {
    outline: none;
    border-color: rgba(168, 85, 247, 0.5);
    box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1);
  }
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
  &::-webkit-scrollbar { height: 4px; }
  &::-webkit-scrollbar-thumb { background: rgba(168, 85, 247, 0.5); border-radius: 4px; }
`;

const TabButton = styled.button<{ $isActive: boolean }>`
  background: ${props => props.$isActive ? 'rgba(168, 85, 247, 0.2)' : 'rgba(30, 41, 59, 0.6)'};
  color: ${props => props.$isActive ? '#d8b4fe' : '#94a3b8'};
  border: 1px solid ${props => props.$isActive ? 'rgba(168, 85, 247, 0.5)' : 'rgba(255, 255, 255, 0.1)'};
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  backdrop-filter: blur(8px);

  &:hover {
    background: ${props => props.$isActive ? 'rgba(168, 85, 247, 0.3)' : 'rgba(255, 255, 255, 0.1)'};
    color: ${props => props.$isActive ? '#d8b4fe' : '#f8fafc'};
  }
`;

const TableContainer = styled.div`
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
`;

const Table = styled.div`
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(12px);
  min-width: 900px;
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr auto;
  gap: 1rem;
  padding: 1rem;
  background: rgba(15, 23, 42, 0.4);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  font-weight: 600;
  color: #cbd5e1;
  font-size: 0.875rem;
`;

const TableRow = styled.div<{ isSelected?: boolean }>`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr auto;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  align-items: center;
  cursor: pointer;
  transition: background-color 0.2s;
  color: #f8fafc;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  ${props => props.isSelected && `
    background: rgba(56, 189, 248, 0.1);
    border-left: 4px solid #38bdf8;
  `}

  &:last-child {
    border-bottom: none;
  }
`;

const Badge = styled.span<{ variant?: 'green' | 'yellow' | 'red' | 'gray' }>`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  border-radius: 9999px;
  font-weight: 600;
  border: 1px solid transparent;
  background: ${props => {
    switch (props.variant) {
      case 'green': return 'rgba(74, 222, 128, 0.2)';
      case 'yellow': return 'rgba(250, 204, 21, 0.2)';
      case 'red': return 'rgba(239, 68, 68, 0.2)';
      default: return 'rgba(255, 255, 255, 0.1)';
    }
  }};
  border-color: ${props => {
    switch (props.variant) {
      case 'green': return 'rgba(74, 222, 128, 0.5)';
      case 'yellow': return 'rgba(250, 204, 21, 0.5)';
      case 'red': return 'rgba(239, 68, 68, 0.5)';
      default: return 'rgba(255, 255, 255, 0.2)';
    }
  }};
  color: ${props => {
    switch (props.variant) {
      case 'green': return '#4ade80';
      case 'yellow': return '#facc15';
      case 'red': return '#f87171';
      default: return '#cbd5e1';
    }
  }};
`;

const PriceChange = styled.span<{ isPositive: boolean }>`
  color: ${props => props.isPositive ? '#10b981' : '#ef4444'};
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const ProgressBarContainer = styled.div`
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-top: 0.5rem;
`;

const ProgressBarFill = styled.div<{ $percentage: number; $isLow: boolean }>`
  height: 100%;
  width: ${p => p.$percentage}%;
  background: ${p => p.$isLow ? '#ef4444' : '#4ade80'};
  transition: width 0.3s ease, background-color 0.3s ease;
`;

const ProgressLabel = styled.div`
  font-size: 0.7rem;
  color: #94a3b8;
  margin-top: 0.25rem;
  display: flex;
  justify-content: space-between;
`;

const Modal = styled.div<{ isOpen: boolean; $isClosing?: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: ${props => props.isOpen ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
  animation: ${props => props.$isClosing ? fadeOut : fadeIn} 0.3s ease-out forwards;
`;

const ModalContent = styled.div<{ $isClosing?: boolean }>`
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  padding: 2rem;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);
  backdrop-filter: blur(16px);
  color: #f8fafc;
  animation: ${props => props.$isClosing ? slideDown : slideUp} 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 1rem;

  h2 {
    margin: 0;
    color: #f8fafc;
  }
`;

const Form = styled.form`
  display: grid;
  gap: 1rem;
`;

const FormGroup = styled.div`
  display: grid;
  gap: 0.5rem;

  label {
    font-weight: 600;
    color: #cbd5e1;
    font-size: 0.875rem;
  }

  input, select, textarea {
    padding: 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.5rem;
    font-size: 0.875rem;
    background: rgba(30, 41, 59, 0.5);
    color: #f8fafc;
    backdrop-filter: blur(8px);

    &:focus {
      outline: none;
      border-color: rgba(168, 85, 247, 0.5);
      box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1);
    }
    
    &::placeholder {
      color: #64748b;
    }
  }

  textarea {
    resize: vertical;
    min-height: 80px;
  }
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
`;

const Insumos: React.FC = () => {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const plan = currentOrganization?.plan || 'individual';
  const planLevel = ['trazapp', 'demo'].includes(plan) ? 4 :
    ['ong', 'enterprise'].includes(plan) ? 3 :
      ['equipo', 'pro'].includes(plan) ? 2 : 1;

  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [filteredInsumos, setFilteredInsumos] = useState<Insumo[]>([]);
  const [categories, setCategories] = useState<InsumoCategory[]>([]);
  const [providers, setProviders] = useState<InsumoProvider[]>([]); // New State
  const [activeTab, setActiveTab] = useState<'inventory' | 'providers' | 'orders'>('inventory');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClosingModal, setIsClosingModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingInsumo, setEditingInsumo] = useState<Insumo | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: '',
    unidad_medida: '',
    precio_actual: '',
    proveedor: '', // Legacy text, mapped to provider_id in DB if we want, or keep logic. We will use provider_id.
    provider_id: '',
    stock_actual: '',
    stock_minimo: '',
    current_volume: '',
    total_volume: '',
    unit_of_measurement: 'ml', // default
    reorder_threshold: '',
    auto_restock_enabled: false,
    notas: ''
  });
  const [ticketFile, setTicketFile] = useState<File | null>(null);

  // Delete / Edit Modal States
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [insumoToDelete, setInsumoToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast States
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  // Cargar insumos desde Supabase
  useEffect(() => {
    loadInsumos();
  }, [currentOrganization]);

  const loadInsumos = async () => {
    try {
      const [data, cats, provs] = await Promise.all([
        getInsumos(),
        getInsumoCategories(),
        getInsumoProviders()
      ]);
      setInsumos(data);
      setCategories(cats);
      setProviders(provs);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    }
  };

  // Filtrar insumos
  useEffect(() => {
    let filtered = insumos;

    if (searchTerm) {
      filtered = filtered.filter(insumo =>
        insumo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        insumo.proveedor?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(insumo => insumo.categoria === selectedCategory);
    }

    setFilteredInsumos(filtered);
  }, [insumos, searchTerm, selectedCategory]);

  // Calcular estadísticas
  const stats = useMemo(() => {
    const totalInsumos = insumos.length;
    const stockBajo = insumos.filter(i => i.stock_actual <= i.stock_minimo).length;
    const conVariacionPrecio = insumos.filter(i => i.precio_anterior && i.precio_actual !== i.precio_anterior).length;
    const totalValor = insumos.reduce((sum, i) => sum + (i.precio_actual * i.stock_actual), 0);

    return { totalInsumos, stockBajo, conVariacionPrecio, totalValor };
  }, [insumos]);

  // Cargar estadísticas desde Supabase
  useEffect(() => {
    const loadStats = async () => {
      try {
        const supabaseStats = await getInsumosStats();
        if (supabaseStats) {
          // Las estadísticas se calculan localmente por ahora
          // En el futuro se pueden obtener directamente de Supabase
        }
      } catch (error) {
        console.error('Error al cargar estadísticas:', error);
      }
    };

    loadStats();
  }, []);

  // Recargar proveedores al volver a la pestaña de inventario
  useEffect(() => {
    if (activeTab === 'inventory') {
      getInsumoProviders()
        .then(data => setProviders(data))
        .catch(err => console.error("Error recargando proveedores:", err));
    }
  }, [activeTab]);

  // Auto-calcular el volumen total disponible al crear un nuevo insumo
  useEffect(() => {
    if (!editingInsumo && formData.total_volume && formData.stock_actual) {
      const vol = parseFloat(formData.total_volume);
      const stock = parseFloat(formData.stock_actual);
      if (!isNaN(vol) && !isNaN(stock)) {
        setFormData(prev => ({
          ...prev,
          current_volume: (vol * stock).toString()
        }));
      }
    }
  }, [formData.total_volume, formData.stock_actual, editingInsumo]);

  const closeModal = () => {
    setIsClosingModal(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setIsClosingModal(false);
    }, 300);
  };

  const handleOpenModal = (insumo?: Insumo) => {
    if (insumo) {
      setEditingInsumo(insumo);
      setFormData({
        nombre: insumo.nombre,
        categoria: insumo.categoria,
        unidad_medida: insumo.unidad_medida,
        precio_actual: insumo.precio_actual.toString(),
        proveedor: insumo.proveedor || '',
        provider_id: insumo.provider_id || '',
        stock_actual: insumo.stock_actual.toString(),
        stock_minimo: insumo.stock_minimo.toString(),
        current_volume: insumo.current_volume?.toString() || '',
        total_volume: insumo.total_volume?.toString() || '',
        unit_of_measurement: insumo.unit_of_measurement || 'ml',
        reorder_threshold: insumo.reorder_threshold?.toString() || '',
        auto_restock_enabled: !!insumo.auto_restock_enabled,
        notas: insumo.notas || ''
      });
    } else {
      setEditingInsumo(null);
      setFormData({
        nombre: '',
        categoria: categories.length > 0 ? categories[0].name : '',
        unidad_medida: 'unidades', // Default for physical discrete tracking
        precio_actual: '',
        proveedor: '',
        provider_id: '',
        stock_actual: '1', // Default to 1 unit
        stock_minimo: '',
        current_volume: '',
        total_volume: '',
        unit_of_measurement: 'ml',
        reorder_threshold: '',
        auto_restock_enabled: false,
        notas: ''
      });
    }
    setTicketFile(null); // Always clear the file input when opening
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const isVolumetric = formData.current_volume && formData.total_volume;
    
      const newInsumo: Omit<Insumo, 'id' | 'created_at' | 'updated_at'> = {
        nombre: formData.nombre,
        categoria: formData.categoria,
        unidad_medida: formData.unidad_medida, // physical units (e.g. 5 bottles)
        precio_actual: parseFloat(formData.precio_actual),
        proveedor: providers.find(p => p.id === formData.provider_id)?.name || undefined,
        provider_id: formData.provider_id || undefined,
        fecha_ultimo_precio: new Date().toISOString().split('T')[0],
        stock_actual: parseFloat(formData.stock_actual),
        stock_minimo: parseFloat(formData.stock_minimo),
        // AI Volumetrics
        current_volume: isVolumetric ? parseFloat(formData.current_volume) : undefined,
        total_volume: isVolumetric ? parseFloat(formData.total_volume) : undefined,
        unit_of_measurement: isVolumetric ? formData.unit_of_measurement : undefined,
        reorder_threshold: formData.reorder_threshold ? parseFloat(formData.reorder_threshold) : undefined,
        auto_restock_enabled: formData.auto_restock_enabled,
        
        notas: formData.notas || undefined,
        activo: true
      };

      // Handle Ticket File Upload if any
      let uploadedUrl: string | null = null;
      if (ticketFile) {
        uploadedUrl = await uploadTicket(ticketFile);
        if (uploadedUrl) {
          newInsumo.ticket_url = uploadedUrl;
        } else {
          setToastMessage('Error al subir el comprobante. El insumo se guardará sin archivo.');
          setToastType('error');
          setToastOpen(true);
        }
      }

      if (editingInsumo) {
        // Actualizar insumo existente
        const updated = await updateInsumo(editingInsumo.id, newInsumo);
        if (updated) {
          setInsumos(prev => prev.map(i =>
            i.id === editingInsumo.id ? updated : i
          ));
        }
      } else {
        // Crear nuevo insumo
        const created = await createInsumo(newInsumo);
        if (created) {
          setInsumos(prev => [...prev, created]);

          // --- AUTO-GENERATION OF EXPENSE LOGIC ---
          try {
            const orgUsers = await usersService.getUsers();

            // Try to assign the expense to the current user if they have a Cultivo role.
            let responsibleUser = orgUsers.find(u => u.id === user?.id && getAreaFromRole(u.role) === 'Área de Cultivo');

            // Fallback: the first user in the organization with a Cultivo role.
            if (!responsibleUser) {
              responsibleUser = orgUsers.find(u => getAreaFromRole(u.role) === 'Área de Cultivo');
            }

            // If still nobody is found, default to the currently logged in user (or the first member)
            if (!responsibleUser) {
              responsibleUser = orgUsers.find(u => u.id === user?.id) || orgUsers[0];
            }

            if (responsibleUser) {
              const totalCost = newInsumo.precio_actual * newInsumo.stock_actual;

              const expense: CashMovement = {
                id: '',
                date: new Date().toISOString(),
                type: 'EGRESO',
                amount: totalCost,
                concept: `Compra de insumo: ${newInsumo.nombre}`,
                payment_method: 'Efectivo',
                responsible_user_id: responsibleUser.id,
                owner: responsibleUser.full_name,
                organization_id: currentOrganization?.id || ''
              };
              await expensesService.createMovement(expense);
            }
          } catch (expenseError) {
            console.error('Error al auto-generar gasto de insumo:', expenseError);
          }
        }
      }

      closeModal();
    } catch (error) {
      console.error('Error al guardar insumo:', error);
      alert('Error al guardar el insumo. Por favor, intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    setInsumoToDelete(id);
    setConfirmDeleteOpen(true);
  };

  const executeDelete = async () => {
    if (!insumoToDelete) return;
    setIsDeleting(true);

    try {
      const success = await deleteInsumo(insumoToDelete);
      if (success) {
        setInsumos(prev => prev.filter(i => i.id !== insumoToDelete));
        setToastMessage('Insumo eliminado exitosamente');
        setToastType('success');
      } else {
        setToastMessage('Error al eliminar el insumo. Por favor, intenta de nuevo.');
        setToastType('error');
      }
    } catch (error) {
      console.error('Error al eliminar insumo:', error);
      setToastMessage('Error al eliminar el insumo. Por favor, intenta de nuevo.');
      setToastType('error');
    } finally {
      setIsDeleting(false);
      setConfirmDeleteOpen(false);
      setInsumoToDelete(null);
      setToastOpen(true);
    }
  };

  const getPriceChange = (insumo: Insumo) => {
    if (!insumo.precio_anterior) return null;
    const change = insumo.precio_actual - insumo.precio_anterior;
    const percentage = (change / insumo.precio_anterior) * 100;
    return { change, percentage };
  };

  const exportToCSV = () => {
    const headers = ['Nombre', 'Categoría', 'Unidad', 'Precio Actual', 'Stock', 'Proveedor', 'Última Compra'];
    const csvContent = [
      headers.join(','),
      ...filteredInsumos.map(insumo => [
        insumo.nombre,
        insumo.categoria,
        insumo.unidad_medida,
        insumo.precio_actual,
        insumo.stock_actual,
        insumo.proveedor || '',
        insumo.fecha_ultima_compra || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `insumos_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  return (
    <Page style={{ position: 'relative', overflow: 'hidden' }}>
      {planLevel < 2 && <UpgradeOverlay requiredPlanName="Equipo o superior" />}

      <div style={{ filter: planLevel < 2 ? 'blur(4px)' : 'none', pointerEvents: planLevel < 2 ? 'none' : 'auto', userSelect: planLevel < 2 ? 'none' : 'auto', opacity: planLevel < 2 ? 0.5 : 1 }}>
        <Header>
          <h1>Gestión de Insumos</h1>
        </Header>

        <TabsContainer>
          <TabButton $isActive={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')}>
            <FaBoxes style={{ marginRight: '0.5rem' }} /> Inventario
          </TabButton>
          <TabButton $isActive={activeTab === 'providers'} onClick={() => setActiveTab('providers')}>
            Proveedores
          </TabButton>
          <TabButton $isActive={activeTab === 'orders'} onClick={() => setActiveTab('orders')}>
            Órdenes Automáticas (Growy AI)
          </TabButton>
        </TabsContainer>

        {activeTab === 'providers' && <InsumoProvidersTab />}
        {activeTab === 'orders' && <InsumoOrdersTab />}

        {activeTab === 'inventory' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
              <Button className="tour-add-product" onClick={() => handleOpenModal()}>
                <FaPlus /> Nuevo Insumo
              </Button>
            </div>
            <StatsGrid>
          <StatCard>
            <div className="stat-value">{stats.totalInsumos}</div>
            <div className="stat-label">Total Insumos</div>
          </StatCard>
          <StatCard className={stats.stockBajo > 0 ? 'warning' : 'success'}>
            <div className="stat-value">{stats.stockBajo}</div>
            <div className="stat-label">Stock Bajo</div>
          </StatCard>
          <StatCard className={stats.conVariacionPrecio > 0 ? 'warning' : 'success'}>
            <div className="stat-value">{stats.conVariacionPrecio}</div>
            <div className="stat-label">Con Variación</div>
          </StatCard>
          <StatCard>
            <div className="stat-value">${stats.totalValor.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
            <div className="stat-label">Valor Total</div>
          </StatCard>
        </StatsGrid>

        <Controls>
          <SearchInput
            placeholder="Buscar por nombre o proveedor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div style={{ flex: 1, minWidth: '250px' }}>
            <CustomSelect
              value={selectedCategory}
              onChange={(val: string) => setSelectedCategory(val)}
              options={[
                { value: '', label: 'Todas las categorías' },
                ...categories.map(c => ({ value: c.name, label: c.name }))
              ]}
            />
          </div>
          <Button variant="secondary" onClick={exportToCSV}>
            <FaDownload /> Exportar CSV
          </Button>
        </Controls>

        <TableContainer>
          <Table>
            <TableHeader>
              <div>Nombre</div>
              <div>Categoría</div>
              <div>Precio</div>
              <div>Variación</div>
              <div>Stock</div>
              <div>Proveedor</div>
              <div>Última Compra</div>
              <div>Ticket / Factura</div>
              <div>Acciones</div>
            </TableHeader>

            {filteredInsumos.map(insumo => {
              const priceChange = getPriceChange(insumo);
              const isStockLow = insumo.stock_actual <= insumo.stock_minimo;

              return (
                <TableRow key={insumo.id}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{insumo.nombre}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {insumo.unidad_medida}
                    </div>
                  </div>
                  <div>
                    <Badge variant="gray">{insumo.categoria}</Badge>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>${insumo.precio_actual.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                    {insumo.precio_anterior && (
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Antes: ${insumo.precio_anterior.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </div>
                    )}
                  </div>
                  <div>
                    {priceChange ? (
                      <PriceChange isPositive={priceChange.change >= 0}>
                        {priceChange.change >= 0 ? '+' : ''}${priceChange.change.toFixed(2)}
                        <span style={{ fontSize: '0.75rem' }}>
                          ({priceChange.percentage >= 0 ? '+' : ''}{priceChange.percentage.toFixed(1)}%)
                        </span>
                      </PriceChange>
                    ) : (
                      <span style={{ color: '#64748b' }}>—</span>
                    )}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>
                      {insumo.stock_actual} {insumo.unidad_medida} (Físico)
                    </div>
                    {isStockLow && (
                      <div style={{ fontSize: '0.75rem', color: '#ef4444' }}>
                        Alerta Físico Bajo
                      </div>
                    )}
                    
                    {/* Volumetric AI Bar */}
                    {insumo.total_volume && insumo.current_volume !== undefined && (
                      <div style={{ marginTop: '0.5rem' }}>
                         <ProgressBarContainer title={`Threshold: ${insumo.reorder_threshold || 0} ${insumo.unit_of_measurement}`}>
                            <ProgressBarFill 
                              $percentage={Math.min(100, Math.max(0, (insumo.current_volume / insumo.total_volume) * 100))} 
                              $isLow={insumo.reorder_threshold !== undefined && insumo.current_volume <= insumo.reorder_threshold}
                            />
                         </ProgressBarContainer>
                         <ProgressLabel>
                            <span>{insumo.current_volume}/{insumo.total_volume} {insumo.unit_of_measurement}</span>
                            {insumo.auto_restock_enabled && <span style={{ color: '#a855f7' }}>🤖 Auto</span>}
                         </ProgressLabel>
                      </div>
                    )}
                  </div>
                  <div>
                    {insumo.proveedor || '—'}
                  </div>
                  <div>
                    {insumo.fecha_ultima_compra ?
                      new Date(insumo.fecha_ultima_compra).toLocaleDateString('es-AR') :
                      '—'
                    }
                  </div>
                  <div>
                    {insumo.ticket_url ? (
                      <a href={insumo.ticket_url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#38bdf8', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
                        <FaFileInvoice /> Ver Ticket
                      </a>
                    ) : (
                      <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Sin archivo</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button
                      variant="secondary"
                      onClick={() => handleOpenModal(insumo)}
                      style={{ padding: '0.5rem' }}
                    >
                      <FaEdit />
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleDelete(insumo.id)}
                      style={{ padding: '0.5rem' }}
                    >
                      <FaTrash />
                    </Button>
                  </div>
                </TableRow>
              );
            })}
          </Table>
        </TableContainer>

        {filteredInsumos.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: '#94a3b8',
            background: 'rgba(30, 41, 59, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderTop: 'none',
            borderBottomLeftRadius: '0.75rem',
            borderBottomRightRadius: '0.75rem',
            backdropFilter: 'blur(12px)'
          }}>
            <FaBoxes style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5, color: '#f8fafc' }} />
            <h3 style={{ color: '#f8fafc' }}>No hay insumos registrados</h3>
            <p>Comienza agregando tu primer insumo para monitorear precios y stock</p>
          </div>
        )}
        </>
        )}

        <Modal isOpen={isModalOpen || isClosingModal} $isClosing={isClosingModal} onMouseDown={closeModal}>
          <ModalContent $isClosing={isClosingModal} onMouseDown={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h2>{editingInsumo ? 'Editar Insumo' : 'Nuevo Insumo'}</h2>
              <Button
                type="button"
                variant="secondary"
                onClick={closeModal}
                style={{ padding: '0.5rem' }}
              >
                <FaTimesCircle />
              </Button>
            </ModalHeader>

            <Form onSubmit={handleSubmit}>
              <FormRow>
                <FormGroup>
                  <label>Nombre del Insumo *</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                    required
                    placeholder="Ej: Semillas Tomate Cherry"
                  />
                </FormGroup>
                <FormGroup>
                  <label>Categoría *</label>
                  <div style={{ position: 'relative', zIndex: 1001 }}>
                    <CustomSelect
                      value={formData.categoria}
                      onChange={(val: string) => setFormData(prev => ({ ...prev, categoria: val }))}
                      options={categories.map(c => ({ value: c.name, label: c.name }))}
                    />
                  </div>
                </FormGroup>
              </FormRow>

              <FormRow>
                <FormGroup>
                  <label>Presentación (Ej: bolsas, pallets, unidades) *</label>
                  <input
                    type="text"
                    value={formData.unidad_medida}
                    onChange={(e) => setFormData(prev => ({ ...prev, unidad_medida: e.target.value }))}
                    required
                    placeholder="Ej: bolsas, litros, botellas"
                  />
                </FormGroup>
                <FormGroup>
                  <label>Precio Actual *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.precio_actual}
                    onChange={(e) => setFormData(prev => ({ ...prev, precio_actual: e.target.value }))}
                    required
                    placeholder="0.00"
                  />
                </FormGroup>
              </FormRow>

              <FormRow>
                <FormGroup>
                  <label>Cantidad de Envases (Bolsas/Botellas) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.stock_actual}
                    onChange={(e) => setFormData(prev => ({ ...prev, stock_actual: e.target.value }))}
                    required
                    placeholder="Cantidad de envases/paquetes (ej: 1, 5)"
                    title="Cantidad de unidades físicas (botellas, sacos) en inventario"
                  />
                </FormGroup>
                <FormGroup>
                  <label>(Opcional) Alerta Stock Mínimo (Envases) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.stock_minimo}
                    onChange={(e) => setFormData(prev => ({ ...prev, stock_minimo: e.target.value }))}
                    required
                    placeholder="Cuándo alertar visualmente (ej: 1)"
                    title="Alerta básica visual de stock en unidades físicas"
                  />
                </FormGroup>
              </FormRow>

              <div style={{ padding: '1.5rem', background: 'rgba(168, 85, 247, 0.05)', borderRadius: '0.75rem', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                <h4 style={{ color: '#d8b4fe', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span role="img" aria-label="robot">🤖</span> Growy AI: Control Volumétrico (Opcional)
                </h4>
                <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '1.5rem', lineHeight: '1.4' }}>
                  Si configuras el líquido o peso que contiene el envase, Growy podrá descontarlo milimétricamente tras cada riego o aplicación.
                </p>

                <FormRow>
                   <FormGroup>
                      <label>Capacidad por Envase o Paquete</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={formData.total_volume}
                        onChange={(e) => setFormData(prev => ({ ...prev, total_volume: e.target.value }))}
                        placeholder="Ej: 5 (para botella de 5L) o 60 (para bolsa)"
                      />
                    </FormGroup>
                    <FormGroup>
                      <label>Volumen Total en Inventario</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={formData.current_volume}
                        onChange={(e) => setFormData(prev => ({ ...prev, current_volume: e.target.value }))}
                        placeholder="Volumen total (Auto-calculado si es nuevo)"
                        title="Puedes ajustar este valor si uno de los envases está a medias."
                      />
                    </FormGroup>
                     <FormGroup>
                      <label>Unidad de Contenido</label>
                      <div style={{ position: 'relative', zIndex: 999 }}>
                        <CustomSelect
                          value={formData.unit_of_measurement}
                          onChange={(val: string) => setFormData(prev => ({ ...prev, unit_of_measurement: val }))}
                          options={[
                            { value: 'ml', label: 'Mililitros (ml)' },
                            { value: 'L', label: 'Litros (L)' },
                            { value: 'g', label: 'Gramos (g)' },
                            { value: 'kg', label: 'Kilogramos (kg)' }
                          ]}
                        />
                      </div>
                    </FormGroup>
                </FormRow>

                <div style={{ marginTop: '1.5rem', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
                    <FormRow style={{ alignItems: 'flex-end' }}>
                         <FormGroup>
                          <label>Alerta IA (Límite Volumétrico Mínimo)</label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={formData.reorder_threshold}
                            onChange={(e) => setFormData(prev => ({ ...prev, reorder_threshold: e.target.value }))}
                            placeholder={`Alertar a la IA al llegar a X ${formData.unit_of_measurement} en total`}
                            disabled={!formData.total_volume}
                            title="Límite en volumen total (Ej: 20L). Growy comprará cuando el volumen total caiga por debajo de esto."
                          />
                        </FormGroup>
                        <FormGroup>
                          <label>Proveedor Growy</label>
                           <div style={{ position: 'relative', zIndex: 998 }}>
                              <CustomSelect
                                value={formData.provider_id}
                                onChange={(val: string) => setFormData(prev => ({ ...prev, provider_id: val }))}
                                options={[
                                  { value: '', label: 'Seleccionar proveedor (Opcional)' },
                                  ...providers.map(p => ({ value: p.id, label: p.name }))
                                ]}
                                disabled={!formData.total_volume}
                              />
                            </div>
                        </FormGroup>
                    </FormRow>

                    <FormGroup style={{ marginTop: '1.5rem', flexDirection: 'row', alignItems: 'center', gap: '0.75rem' }}>
                      <input
                        type="checkbox"
                        id="autoRestock"
                        checked={formData.auto_restock_enabled}
                        onChange={(e) => setFormData(prev => ({ ...prev, auto_restock_enabled: e.target.checked }))}
                        disabled={!formData.provider_id || !formData.reorder_threshold}
                        style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
                      />
                      <label htmlFor="autoRestock" style={{ cursor: 'pointer', margin: 0, color: formData.provider_id ? '#f8fafc' : '#64748b' }}>
                        Permitir que Growy envíe un WhatsApp automatizado para recomprar al proveedor.
                      </label>
                    </FormGroup>
                </div>
              </div>

              <FormGroup>
                <label>Notas</label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData(prev => ({ ...prev, notas: e.target.value }))}
                  placeholder="Información adicional sobre el insumo..."
                />
              </FormGroup>

              <FormGroup>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FaPaperclip /> Comprobante (Ticket/Factura)
                </label>
                <div style={{
                  border: '1px dashed rgba(168, 85, 247, 0.5)',
                  background: 'rgba(30, 41, 59, 0.4)',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  position: 'relative'
                }}>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setTicketFile(e.target.files[0]);
                      }
                    }}
                    style={{
                      position: 'absolute',
                      top: 0, left: 0, right: 0, bottom: 0,
                      opacity: 0,
                      cursor: 'pointer'
                    }}
                  />
                  {ticketFile ? (
                    <span style={{ color: '#4ade80', fontWeight: 600, fontSize: '0.85rem' }}>
                      Archivo seleccionado: {ticketFile.name}
                    </span>
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                      Clic para adjuntar imagen o PDF
                    </span>
                  )}
                </div>
              </FormGroup>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', position: 'relative', zIndex: 1 }}>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={closeModal}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <div style={{
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '50%',
                        borderTop: '2px solid white',
                        width: '14px',
                        height: '14px',
                        animation: 'spin 1s linear infinite'
                      }} />
                      {editingInsumo ? 'Actualizando...' : 'Creando...'}
                    </>
                  ) : (
                    <>{editingInsumo ? 'Actualizar' : 'Crear'} Insumo</>
                  )}
                </Button>
              </div>
            </Form>
          </ModalContent>
        </Modal>

        {/* Modal de Confirmación de Borrado */}
        <ConfirmModal
          isOpen={confirmDeleteOpen}
          title="Eliminar Insumo"
          message="¿Estás seguro de que deseas eliminar este insumo? Esta acción no se puede deshacer y el registro de stock se perderá."
          onClose={() => setConfirmDeleteOpen(false)}
          onConfirm={executeDelete}
          confirmText="Eliminar"
          cancelText="Cancelar"
          isDanger={true}
          isLoading={isDeleting}
        />

        {/* Notificaciones Toast */}
        <ToastModal
          isOpen={toastOpen}
          message={toastMessage}
          type={toastType}
          onClose={() => setToastOpen(false)}
        />
      </div>
    </Page>
  );
};

export default Insumos;
