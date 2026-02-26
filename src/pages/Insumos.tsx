import React, { useState, useEffect, useMemo } from 'react';
import styled, { keyframes } from 'styled-components';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaBoxes,
  FaTimesCircle,
  FaDownload
} from 'react-icons/fa';
import { CustomSelect } from '../components/CustomSelect';
import { useOrganization } from '../context/OrganizationContext';
import UpgradeOverlay from '../components/common/UpgradeOverlay';
import type { Insumo } from '../types';
import {
  getInsumos,
  createInsumo,
  updateInsumo,
  deleteInsumo,
  getInsumosStats
} from '../services/insumosService';

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
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr 1fr auto;
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
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr 1fr auto;
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
  const { currentOrganization } = useOrganization();
  const plan = currentOrganization?.plan || 'individual';
  const planLevel = ['ong', 'enterprise'].includes(plan) ? 3 :
    ['equipo', 'pro'].includes(plan) ? 2 : 1;

  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [filteredInsumos, setFilteredInsumos] = useState<Insumo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClosingModal, setIsClosingModal] = useState(false);
  const [editingInsumo, setEditingInsumo] = useState<Insumo | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: 'semillas' as 'semillas' | 'fertilizantes' | 'sustratos' | 'herramientas' | 'pesticidas' | 'otros',
    unidad_medida: '',
    precio_actual: '',
    proveedor: '',
    stock_actual: '',
    stock_minimo: '',
    notas: ''
  });

  // Cargar insumos desde Supabase
  useEffect(() => {
    loadInsumos();
  }, []);

  const loadInsumos = async () => {
    try {
      const data = await getInsumos();
      setInsumos(data);
    } catch (error) {
      console.error('Error al cargar insumos:', error);
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
        stock_actual: insumo.stock_actual.toString(),
        stock_minimo: insumo.stock_minimo.toString(),
        notas: insumo.notas || ''
      });
    } else {
      setEditingInsumo(null);
      setFormData({
        nombre: '',
        categoria: 'semillas',
        unidad_medida: '',
        precio_actual: '',
        proveedor: '',
        stock_actual: '',
        stock_minimo: '',
        notas: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const newInsumo: Omit<Insumo, 'id' | 'created_at' | 'updated_at'> = {
        nombre: formData.nombre,
        categoria: formData.categoria,
        unidad_medida: formData.unidad_medida,
        precio_actual: parseFloat(formData.precio_actual),
        proveedor: formData.proveedor || undefined,
        fecha_ultimo_precio: new Date().toISOString().split('T')[0],
        stock_actual: parseFloat(formData.stock_actual),
        stock_minimo: parseFloat(formData.stock_minimo),
        notas: formData.notas || undefined,
        activo: true
      };

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
        }
      }

      closeModal();
    } catch (error) {
      console.error('Error al guardar insumo:', error);
      alert('Error al guardar el insumo. Por favor, intenta de nuevo.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este insumo?')) {
      try {
        const success = await deleteInsumo(id);
        if (success) {
          setInsumos(prev => prev.filter(i => i.id !== id));
        } else {
          alert('Error al eliminar el insumo. Por favor, intenta de nuevo.');
        }
      } catch (error) {
        console.error('Error al eliminar insumo:', error);
        alert('Error al eliminar el insumo. Por favor, intenta de nuevo.');
      }
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
          <Button onClick={() => handleOpenModal()}>
            <FaPlus /> Nuevo Insumo
          </Button>
        </Header>

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
            <div className="stat-value">${stats.totalValor.toFixed(2)}</div>
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
                { value: 'semillas', label: 'Semillas' },
                { value: 'fertilizantes', label: 'Fertilizantes' },
                { value: 'sustratos', label: 'Sustratos' },
                { value: 'herramientas', label: 'Herramientas' },
                { value: 'pesticidas', label: 'Pesticidas' },
                { value: 'otros', label: 'Otros' }
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
                    <div style={{ fontWeight: 600 }}>${insumo.precio_actual}</div>
                    {insumo.precio_anterior && (
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Antes: ${insumo.precio_anterior}
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
                      {insumo.stock_actual} {insumo.unidad_medida}
                    </div>
                    {isStockLow && (
                      <div style={{ fontSize: '0.75rem', color: '#ef4444' }}>
                        Stock bajo
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
                      onChange={(val: string) => setFormData(prev => ({ ...prev, categoria: val as any }))}
                      options={[
                        { value: 'semillas', label: 'Semillas' },
                        { value: 'fertilizantes', label: 'Fertilizantes' },
                        { value: 'sustratos', label: 'Sustratos' },
                        { value: 'herramientas', label: 'Herramientas' },
                        { value: 'pesticidas', label: 'Pesticidas' },
                        { value: 'otros', label: 'Otros' }
                      ]}
                    />
                  </div>
                </FormGroup>
              </FormRow>

              <FormRow>
                <FormGroup>
                  <label>Unidad de Medida *</label>
                  <input
                    type="text"
                    value={formData.unidad_medida}
                    onChange={(e) => setFormData(prev => ({ ...prev, unidad_medida: e.target.value }))}
                    required
                    placeholder="Ej: kg, litros, unidades"
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
                  <label>Stock Actual *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.stock_actual}
                    onChange={(e) => setFormData(prev => ({ ...prev, stock_actual: e.target.value }))}
                    required
                    placeholder="0.00"
                  />
                </FormGroup>
                <FormGroup>
                  <label>Stock Mínimo *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.stock_minimo}
                    onChange={(e) => setFormData(prev => ({ ...prev, stock_minimo: e.target.value }))}
                    required
                    placeholder="0.00"
                  />
                </FormGroup>
              </FormRow>

              <FormGroup>
                <label>Proveedor</label>
                <input
                  type="text"
                  value={formData.proveedor}
                  onChange={(e) => setFormData(prev => ({ ...prev, proveedor: e.target.value }))}
                  placeholder="Nombre del proveedor"
                />
              </FormGroup>

              <FormGroup>
                <label>Notas</label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData(prev => ({ ...prev, notas: e.target.value }))}
                  placeholder="Información adicional sobre el insumo..."
                />
              </FormGroup>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', position: 'relative', zIndex: 1 }}>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={closeModal}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingInsumo ? 'Actualizar' : 'Crear'} Insumo
                </Button>
              </div>
            </Form>
          </ModalContent>
        </Modal>
      </div>
    </Page>
  );
};

export default Insumos;
