import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { ShoppingCart, Plus, Edit3, Trash2, Search, Download, Check, X } from 'lucide-react';
import { Button } from '../components/ui';
import { supabase } from '../services/supabaseClient';

interface CompraItem {
  id: string;
  name: string;
  priority: 'BAJO' | 'MEDIO' | 'ALTO';
  completed: boolean;
  created_at: string;
  notes?: string;
}

const PageContainer = styled.div`
  padding: 1.5rem 2rem;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;
  color: #f8fafc;
  
  @media (max-width: 768px) {
    padding: 1rem;
    padding-top: 2rem;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1.25rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  h1 {
    font-size: 1.875rem;
    font-weight: 700;
    color: #f8fafc;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    letter-spacing: -0.02em;
    
    @media (max-width: 768px) {
      font-size: 1.5rem;
    }
  }
`;

const SearchBar = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex: 1;
  max-width: 420px;
  position: relative;
  
  @media (max-width: 768px) {
    max-width: none;
    width: 100%;
  }

  svg {
    position: absolute;
    left: 0.85rem;
    color: #64748b;
    pointer-events: none;
  }
  
  .search-input {
    width: 100%;
    padding: 0.65rem 1rem 0.65rem 2.5rem;
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 0.5rem;
    font-size: 0.9rem;
    color: #f8fafc;
    transition: all 0.2s ease;
    
    &:focus {
      outline: none;
      border-color: rgba(16, 185, 129, 0.5);
      background: rgba(15, 23, 42, 0.8);
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
    }

    &::placeholder {
      color: #64748b;
    }
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
  
  @media (max-width: 768px) {
    width: 100%;
    justify-content: space-between;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
`;

const StatCard = styled.div`
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.75rem;
  padding: 1.25rem;
  text-align: center;
  transition: border-color 0.2s ease;

  &:hover {
    border-color: rgba(255, 255, 255, 0.15);
  }
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
  
  .stat-value {
    font-size: 1.875rem;
    font-weight: 700;
    color: #f8fafc;
    margin-bottom: 0.25rem;
    
    @media (max-width: 768px) {
      font-size: 1.5rem;
    }
  }
  
  .stat-label {
    color: #94a3b8;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
`;

const FilterTabs = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    justify-content: center;
  }
`;

const FilterTab = styled.button<{ active: boolean }>`
  padding: 0.5rem 1rem;
  border: 1px solid ${props => props.active ? '#10b981' : 'rgba(255, 255, 255, 0.08)'};
  background: ${props => props.active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(15, 23, 42, 0.6)'};
  color: ${props => props.active ? '#34d399' : '#94a3b8'};
  border-radius: 0.5rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(12px);
  
  &:hover {
    background: ${props => props.active ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.05)'};
    color: ${props => props.active ? '#34d399' : '#f8fafc'};
  }
`;

const ComprasList = styled.div`
  display: grid;
  gap: 0.75rem;
`;

const CompraCard = styled.div<{ completed: boolean; priority: string }>`
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-left: 4px solid ${props => {
    if (props.completed) return '#10b981';
    switch (props.priority) {
      case 'ALTO': return '#ef4444';
      case 'MEDIO': return '#f59e0b';
      case 'BAJO': return '#38bdf8';
      default: return '#64748b';
    }
  }};
  border-radius: 0.75rem;
  padding: 1.25rem 1.5rem;
  transition: all 0.2s ease;
  opacity: ${props => props.completed ? 0.6 : 1};
  
  &:hover {
    border-color: rgba(255, 255, 255, 0.15);
    background: rgba(15, 23, 42, 0.8);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  }
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const CompraHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  gap: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
`;

const CompraInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  
  @media (max-width: 768px) {
    width: 100%;
    justify-content: space-between;
  }
`;

const CompraName = styled.h3<{ completed: boolean }>`
  font-size: 1.05rem;
  font-weight: 600;
  color: ${props => props.completed ? '#64748b' : '#f8fafc'};
  margin: 0;
  text-decoration: ${props => props.completed ? 'line-through' : 'none'};
  
  @media (max-width: 768px) {
    font-size: 0.95rem;
  }
`;

const PriorityBadge = styled.span<{ priority: string }>`
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  
  background: ${props => {
    switch (props.priority) {
      case 'ALTO': return 'rgba(239, 68, 68, 0.15)';
      case 'MEDIO': return 'rgba(245, 158, 11, 0.15)';
      case 'BAJO': return 'rgba(56, 189, 248, 0.15)';
      default: return 'rgba(255, 255, 255, 0.05)';
    }
  }};
  
  color: ${props => {
    switch (props.priority) {
      case 'ALTO': return '#f87171';
      case 'MEDIO': return '#fbbf24';
      case 'BAJO': return '#38bdf8';
      default: return '#94a3b8';
    }
  }};

  border: 1px solid ${props => {
    switch (props.priority) {
      case 'ALTO': return 'rgba(239, 68, 68, 0.3)';
      case 'MEDIO': return 'rgba(245, 158, 11, 0.3)';
      case 'BAJO': return 'rgba(56, 189, 248, 0.3)';
      default: return 'rgba(255, 255, 255, 0.1)';
    }
  }};
`;

const CompraActions = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const CompraMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
`;

const CompraDate = styled.span`
  color: #64748b;
  font-size: 0.8rem;
`;

const CompraNotes = styled.p`
  color: #94a3b8;
  font-size: 0.85rem;
  margin: 0.5rem 0 0 0;
  line-height: 1.4;
`;

const Modal = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  display: ${props => props.isOpen ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.75rem;
  padding: 2rem;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  
  @media (max-width: 768px) {
    padding: 1.5rem;
  }
  
  h2 {
    margin: 0 0 1.5rem 0;
    font-size: 1.35rem;
    font-weight: 700;
    color: #f8fafc;
  }
`;

const Form = styled.form`
  display: grid;
  gap: 1.25rem;
`;

const FormGroup = styled.div`
  display: grid;
  gap: 0.5rem;
  
  label {
    font-weight: 600;
    color: #cbd5e1;
    font-size: 0.85rem;
  }
  
  input, select, textarea {
    padding: 0.75rem;
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.5rem;
    font-size: 0.9rem;
    color: #f8fafc;
    transition: all 0.2s ease;
    
    &:focus {
      outline: none;
      border-color: rgba(16, 185, 129, 0.5);
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
      background: rgba(30, 41, 59, 0.8);
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

const ModalActions = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 1rem;
  color: #64748b;
  background: rgba(15, 23, 42, 0.4);
  border: 1px dashed rgba(255, 255, 255, 0.08);
  border-radius: 0.75rem;
  
  .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.6;
  }
  
  h3 {
    font-size: 1.2rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: #e2e8f0;
  }
  
  p {
    margin-bottom: 1.5rem;
    color: #94a3b8;
    font-size: 0.9rem;
  }
`;

const Compras: React.FC = () => {
  const [items, setItems] = useState<CompraItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<CompraItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'TODOS' | 'PENDIENTES' | 'COMPLETADOS'>('TODOS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CompraItem | null>(null);
  const [formData, setFormData] = useState({ name: '', priority: 'MEDIO' as 'BAJO' | 'MEDIO' | 'ALTO', notes: '' });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCompras();
  }, []);

  useEffect(() => {
    let filtered = items.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (activeFilter === 'PENDIENTES') {
      filtered = filtered.filter(item => !item.completed);
    } else if (activeFilter === 'COMPLETADOS') {
      filtered = filtered.filter(item => item.completed);
    }

    setFilteredItems(filtered);
  }, [items, searchTerm, activeFilter]);

  const loadCompras = async () => {
    setIsLoading(true);
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('compras')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading compras:', error);
        } else {
          setItems(data || []);
        }
      }
    } catch (error) {
      console.error('Error loading compras:', error);
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const item: CompraItem = {
      id: editingItem?.id || `compra-${Date.now()}`,
      name: formData.name.trim(),
      priority: formData.priority,
      completed: false,
      created_at: new Date().toISOString(),
      notes: formData.notes.trim() || undefined
    };

    try {
      if (supabase) {
        if (editingItem) {
          const { error } = await supabase
            .from('compras')
            .update({ name: item.name, priority: item.priority, notes: item.notes })
            .eq('id', item.id);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('compras')
            .insert([item]);

          if (error) throw error;
        }

        await loadCompras();
        setIsModalOpen(false);
        setEditingItem(null);
        setFormData({ name: '', priority: 'MEDIO' as 'BAJO' | 'MEDIO' | 'ALTO', notes: '' });
      }
    } catch (error) {
      console.error('Error saving compra:', error);
    }
  };

  const handleEdit = (item: CompraItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      priority: item.priority,
      notes: item.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Eliminar este ítem de la lista de compras?')) {
      try {
        if (supabase) {
          const { error } = await supabase
            .from('compras')
            .delete()
            .eq('id', id);

          if (error) throw error;
          await loadCompras();
        }
      } catch (error) {
        console.error('Error deleting compra:', error);
      }
    }
  };

  const toggleComplete = async (id: string, completed: boolean) => {
    try {
      if (supabase) {
        if (!completed) {
          // Marcar como completada
          const { error } = await supabase
            .from('compras')
            .update({ completed: true })
            .eq('id', id);

          if (error) throw error;
          
          // Mostrar mensaje de confirmación
          setTimeout(() => {
            // Eliminar de la lista después de mostrar el tachado
            deleteCompletedItem(id);
          }, 1000);
        }
        await loadCompras();
      }
    } catch (error) {
      console.error('Error updating compra:', error);
    }
  };

  const deleteCompletedItem = async (id: string) => {
    try {
      if (supabase) {
        const { error } = await supabase
          .from('compras')
          .delete()
          .eq('id', id);

        if (error) throw error;
        await loadCompras();
      }
    } catch (error) {
      console.error('Error deleting completed compra:', error);
    }
  };

  const exportCSV = () => {
    const headers = ['Nombre', 'Prioridad', 'Estado', 'Notas', 'Fecha'];
    const csvContent = [
      headers.join(','),
      ...filteredItems.map(item => [
        `"${item.name}"`,
        item.priority,
        item.completed ? 'Completado' : 'Pendiente',
        `"${item.notes || ''}"`,
        new Date(item.created_at).toLocaleDateString('es-AR')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `compras_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stats = {
    total: items.length,
    pending: items.filter(item => !item.completed).length,
    completed: items.filter(item => item.completed).length,
    highPriority: items.filter(item => item.priority === 'ALTO' && !item.completed).length
  };

  if (isLoading) {
    return (
      <PageContainer>
        <Header>
          <h1><ShoppingCart size={28} style={{ color: '#10b981' }} /> Compras</h1>
        </Header>
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
          Cargando lista de compras...
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Header>
        <h1><ShoppingCart size={28} style={{ color: '#10b981' }} /> Compras</h1>
        <SearchBar>
          <Search size={16} />
          <input
            type="text"
            className="search-input"
            placeholder="Buscar ítems..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchBar>
        <ActionButtons>
          <Button variant="default" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Nuevo Ítem
          </Button>
          <Button variant="secondary" onClick={exportCSV}>
            <Download size={16} /> Exportar
          </Button>
        </ActionButtons>
      </Header>

      <StatsGrid>
        <StatCard>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Ítems</div>
        </StatCard>
        <StatCard>
          <div className="stat-value" style={{ color: '#fbbf24' }}>{stats.pending}</div>
          <div className="stat-label">Pendientes</div>
        </StatCard>
        <StatCard>
          <div className="stat-value" style={{ color: '#34d399' }}>{stats.completed}</div>
          <div className="stat-label">Completados</div>
        </StatCard>
        <StatCard>
          <div className="stat-value" style={{ color: '#f87171' }}>{stats.highPriority}</div>
          <div className="stat-label">Alta Prioridad</div>
        </StatCard>
      </StatsGrid>

      <FilterTabs>
        <FilterTab
          active={activeFilter === 'TODOS'}
          onClick={() => setActiveFilter('TODOS')}
        >
          Todos ({items.length})
        </FilterTab>
        <FilterTab
          active={activeFilter === 'PENDIENTES'}
          onClick={() => setActiveFilter('PENDIENTES')}
        >
          Pendientes ({stats.pending})
        </FilterTab>
        <FilterTab
          active={activeFilter === 'COMPLETADOS'}
          onClick={() => setActiveFilter('COMPLETADOS')}
        >
          Completados ({stats.completed})
        </FilterTab>
      </FilterTabs>

      {filteredItems.length === 0 ? (
        <EmptyState>
          <div className="empty-icon">🛒</div>
          <h3>No hay ítems en la lista</h3>
          <p>Comienza agregando tu primer ítem a la lista de compras</p>
          <Button variant="default" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Agregar Ítem
          </Button>
        </EmptyState>
      ) : (
        <ComprasList>
          {filteredItems.map((item) => (
            <CompraCard key={item.id} completed={item.completed} priority={item.priority}>
              <CompraHeader>
                <CompraInfo>
                  <CompraName completed={item.completed}>{item.name}</CompraName>
                  <PriorityBadge priority={item.priority}>{item.priority}</PriorityBadge>
                </CompraInfo>
                <CompraActions>
                  {!item.completed && (
                    <Button
                      variant="secondary"
                      onClick={() => toggleComplete(item.id, item.completed)}
                      style={{ padding: '0.4rem', height: 'auto' }}
                      title="Marcar como completada"
                    >
                      <Check size={16} style={{ color: '#34d399' }} />
                    </Button>
                  )}
                  {item.completed && (
                    <span style={{ 
                      color: '#34d399', 
                      fontSize: '0.75rem', 
                      fontWeight: '700',
                      padding: '0.35rem 0.65rem',
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '0.375rem'
                    }}>
                      ✓ Completada
                    </span>
                  )}
                  <Button
                    variant="secondary"
                    onClick={() => handleEdit(item)}
                    style={{ padding: '0.4rem', height: 'auto' }}
                    title="Editar"
                  >
                    <Edit3 size={15} />
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDelete(item.id)}
                    style={{ padding: '0.4rem', height: 'auto' }}
                    title="Eliminar"
                  >
                    <Trash2 size={15} />
                  </Button>
                </CompraActions>
              </CompraHeader>
              
              {item.notes && (
                <CompraNotes>{item.notes}</CompraNotes>
              )}
              
              <CompraMeta>
                <CompraDate>
                  {new Date(item.created_at).toLocaleDateString('es-AR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </CompraDate>
              </CompraMeta>
            </CompraCard>
          ))}
        </ComprasList>
      )}

      <Modal isOpen={isModalOpen}>
        <ModalContent>
          <h2>{editingItem ? 'Editar Ítem' : 'Nuevo Ítem'}</h2>
          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <label>Nombre del ítem</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Sustrato, Macetas, Tijeras..."
                required
              />
            </FormGroup>
            
            <FormGroup>
              <label>Prioridad</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'BAJO' | 'MEDIO' | 'ALTO' })}
              >
                <option value="BAJO">Baja</option>
                <option value="MEDIO">Media</option>
                <option value="ALTO">Alta</option>
              </select>
            </FormGroup>
            
            <FormGroup>
              <label>Notas (opcional)</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Detalles adicionales, proveedor específico, etc."
              />
            </FormGroup>
            
            <ModalActions>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingItem(null);
                  setFormData({ name: '', priority: 'MEDIO' as 'BAJO' | 'MEDIO' | 'ALTO', notes: '' });
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="default">
                {editingItem ? 'Actualizar' : 'Crear'}
              </Button>
            </ModalActions>
          </Form>
        </ModalContent>
      </Modal>
    </PageContainer>
  );
};

export default Compras;
