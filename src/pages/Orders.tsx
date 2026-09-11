import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { 
  ClipboardList, 
  Plus, 
  Download,
  Building2,
  User,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowLeft,
  XCircle
} from 'lucide-react';
import { Button } from '../components/ui';

// Interfaces
interface Order {
  id: string;
  salon: string;
  dj: string;
  item: string;
  quantity: number;
  description: string;
  status: 'received' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

// Styled Components
const OrdersContainer = styled.div`
  padding: 2rem 2.5rem;
  min-height: 100vh;
  background: transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  max-width: 1200px;
  margin: 0 auto;
  color: #f8fafc;
`;

const HeaderSection = styled.div`
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(16px);
  color: white;
  padding: 1.75rem 2rem;
  border-radius: 1.25rem;
  margin-bottom: 2rem;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-top: 1px solid rgba(255, 255, 255, 0.15);
  width: 100%;
  max-width: 1000px;
`;

const HeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
`;

const HeaderLeft = styled.div`
  h1 {
    font-size: clamp(1.5rem, 3vw, 2.25rem);
    font-weight: 800;
    margin-bottom: 0.35rem;
    background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  p {
    font-size: 0.95rem;
    color: #94a3b8;
    margin: 0;
  }
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  width: 100%;
`;

const ControlsSection = styled.div`
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(16px);
  border-radius: 1.25rem;
  padding: 1.75rem 2rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.35);
  width: 100%;
  max-width: 1000px;
`;

const ControlsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  
  label {
    font-weight: 600;
    color: #cbd5e1;
    font-size: 0.8rem;
  }
  
  input, select {
    padding: 0.625rem 0.85rem;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background: rgba(15, 23, 42, 0.6);
    color: #f8fafc;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    transition: all 0.2s;
    
    &:focus {
      outline: none;
      border-color: #10b981;
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
    }
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
`;

const OrdersGrid = styled.div`
  display: grid;
  gap: 1rem;
  width: 100%;
  max-width: 1000px;
`;

const OrderCard = styled.div<{ status: string }>`
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(16px);
  border-radius: 1.25rem;
  padding: 1.5rem;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-left: 4px solid ${props => {
    switch (props.status) {
      case 'received': return '#f59e0b';
      case 'in-progress': return '#38bdf8';
      case 'completed': return '#10b981';
      default: return '#64748b';
    }
  }};
  transition: all 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 14px 30px -4px rgba(0, 0, 0, 0.45);
    border-color: rgba(255, 255, 255, 0.15);
  }
`;

const OrderHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
  gap: 1rem;
`;

const OrderInfo = styled.div`
  flex: 1;
  
  .order-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: #f8fafc;
    margin-bottom: 0.5rem;
  }
  
  .order-meta {
    display: flex;
    gap: 0.75rem;
    font-size: 0.8rem;
    color: #94a3b8;
    margin-bottom: 0.5rem;
    flex-wrap: wrap;

    span {
      display: flex;
      align-items: center;
      gap: 0.3rem;
    }
  }
  
  .order-description {
    color: #cbd5e1;
    font-size: 0.85rem;
    line-height: 1.5;
  }
`;

const OrderStatus = styled.div<{ status: string }>`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.85rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  
  ${props => {
    switch (props.status) {
      case 'received':
        return `
          background: rgba(245, 158, 11, 0.15);
          color: #fbbf24;
          border: 1px solid rgba(245, 158, 11, 0.3);
        `;
      case 'in-progress':
        return `
          background: rgba(56, 189, 248, 0.15);
          color: #38bdf8;
          border: 1px solid rgba(56, 189, 248, 0.3);
        `;
      case 'completed':
        return `
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.3);
        `;
      default:
        return `
          background: rgba(148, 163, 184, 0.15);
          color: #cbd5e1;
          border: 1px solid rgba(148, 163, 184, 0.3);
        `;
    }
  }}
`;

const OrderActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 0.85rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  justify-content: space-between;
  align-items: center;
`;

const OrderMetaInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #94a3b8;
  
  .last-updated {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }
`;

const StatusBadge = styled.div<{ status: string }>`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  
  ${props => {
    switch (props.status) {
      case 'received':
        return `
          background: rgba(245, 158, 11, 0.15);
          color: #fbbf24;
          border: 1px solid rgba(245, 158, 11, 0.3);
        `;
      case 'in-progress':
        return `
          background: rgba(56, 189, 248, 0.15);
          color: #38bdf8;
          border: 1px solid rgba(56, 189, 248, 0.3);
        `;
      case 'completed':
        return `
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.3);
        `;
      default:
        return `
          background: rgba(148, 163, 184, 0.15);
          color: #cbd5e1;
          border: 1px solid rgba(148, 163, 184, 0.3);
        `;
    }
  }}
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 2rem;
  background: rgba(15, 23, 42, 0.6);
  border-radius: 1.25rem;
  border: 1px dashed rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
  width: 100%;
  
  .empty-icon {
    font-size: 2.5rem;
    color: #64748b;
    margin-bottom: 0.75rem;
  }
  
  h3 {
    color: #f8fafc;
    margin-bottom: 0.5rem;
  }
  
  p {
    color: #94a3b8;
    margin-bottom: 1.25rem;
  }
`;

// Mock Data
const mockOrders: Order[] = [
  {
    id: '1',
    salon: 'San Telmo',
    dj: 'Carlos Rodríguez',
    item: 'Líquido de Humo',
    quantity: 2,
    description: 'Necesito líquido de humo para el evento del sábado',
    status: 'received',
    priority: 'high',
    createdAt: '2025-01-13T10:30:00Z',
    updatedAt: '2025-01-13T10:30:00Z',
    notes: 'Urgente para evento de 200 personas'
  },
  {
    id: '2',
    salon: 'Palermo',
    dj: 'María González',
    item: 'Chispas de Backup',
    quantity: 1,
    description: 'Chispas de respaldo para máquina principal',
    status: 'in-progress',
    priority: 'medium',
    createdAt: '2025-01-12T15:45:00Z',
    updatedAt: '2025-01-13T09:15:00Z'
  },
  {
    id: '3',
    salon: 'Recoleta',
    dj: 'Juan Pérez',
    item: 'Cables XLR',
    quantity: 3,
    description: 'Cables XLR de 5 metros para conexiones',
    status: 'completed',
    priority: 'low',
    createdAt: '2025-01-10T08:20:00Z',
    updatedAt: '2025-01-12T14:30:00Z'
  },
  {
    id: '4',
    salon: 'Belgrano',
    dj: 'Ana Silva',
    item: 'Focos LED RGB',
    quantity: 4,
    description: 'Focos LED RGB para iluminación de escenario',
    status: 'received',
    priority: 'high',
    createdAt: '2025-01-13T11:00:00Z',
    updatedAt: '2025-01-13T11:00:00Z'
  }
];

const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [selectedSalon, setSelectedSalon] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewOrderForm, setShowNewOrderForm] = useState(false);
  
  // New order form state
  const [newOrder, setNewOrder] = useState({
    salon: '',
    dj: '',
    item: '',
    quantity: 1,
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  });

  const handleCreateOrder = () => {
    const order: Order = {
      id: Date.now().toString(),
      salon: newOrder.salon,
      dj: newOrder.dj,
      item: newOrder.item,
      quantity: newOrder.quantity,
      description: newOrder.description,
      status: 'received',
      priority: newOrder.priority,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setOrders(prev => [order, ...prev]);
    setNewOrder({
      salon: '',
      dj: '',
      item: '',
      quantity: 1,
      description: '',
      priority: 'medium'
    });
    setShowNewOrderForm(false);
  };

  const filteredOrders = orders.filter(order => {
    const matchesSalon = !selectedSalon || order.salon === selectedSalon;
    const matchesStatus = !selectedStatus || order.status === selectedStatus;
    const matchesPriority = !selectedPriority || order.priority === selectedPriority;
    const matchesSearch = !searchTerm || 
      order.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.dj.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.salon.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSalon && matchesStatus && matchesPriority && matchesSearch;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'received': return <AlertTriangle size={14} />;
      case 'in-progress': return <Clock size={14} />;
      case 'completed': return <CheckCircle2 size={14} />;
      default: return <XCircle size={14} />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'received': return 'Recibido';
      case 'in-progress': return 'En Proceso';
      case 'completed': return 'Completado';
      default: return 'Desconocido';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'low': return 'Baja';
      case 'medium': return 'Media';
      case 'high': return 'Alta';
      default: return 'Media';
    }
  };

  return (
    <OrdersContainer>
      <HeaderSection>
        <HeaderContent>
          <HeaderLeft>
            <h1>Pedidos Técnicos - DJ</h1>
            <p>Solicitudes al departamento técnico</p>
          </HeaderLeft>
          <HeaderRight>
            <Button 
              size="sm"
              variant="secondary"
              onClick={() => navigate('/dashboard')} 
              title="Volver al Dashboard"
              className="flex items-center gap-1.5"
            >
              <ArrowLeft size={14} /> Dashboard
            </Button>
          </HeaderRight>
        </HeaderContent>
      </HeaderSection>

      <MainContent>
        <ControlsSection>
          <ControlsGrid>
            <FormGroup>
              <label>Filtrar por Salón</label>
              <select 
                value={selectedSalon} 
                onChange={(e) => setSelectedSalon(e.target.value)}
              >
                <option value="">Todos los salones</option>
                <option value="San Telmo">San Telmo</option>
                <option value="Palermo">Palermo</option>
                <option value="Recoleta">Recoleta</option>
                <option value="Belgrano">Belgrano</option>
              </select>
            </FormGroup>

            <FormGroup>
              <label>Filtrar por Estado</label>
              <select 
                value={selectedStatus} 
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="">Todos los estados</option>
                <option value="received">Recibido</option>
                <option value="in-progress">En Proceso</option>
                <option value="completed">Completado</option>
              </select>
            </FormGroup>

            <FormGroup>
              <label>Filtrar por Prioridad</label>
              <select 
                value={selectedPriority} 
                onChange={(e) => setSelectedPriority(e.target.value)}
              >
                <option value="">Todas las prioridades</option>
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
              </select>
            </FormGroup>

            <FormGroup>
              <label>Buscar</label>
              <input 
                type="text" 
                placeholder="Buscar por item, DJ..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </FormGroup>
          </ControlsGrid>
          
          <ActionButtons>
            <Button variant="secondary" className="flex items-center gap-2">
              <Download size={15} /> Exportar
            </Button>
            <Button 
              variant="default" 
              onClick={() => setShowNewOrderForm(!showNewOrderForm)}
              className="flex items-center gap-2"
            >
              <Plus size={15} /> Nuevo Pedido
            </Button>
          </ActionButtons>
        </ControlsSection>

        {showNewOrderForm && (
          <ControlsSection>
            <h3 style={{ marginBottom: '1rem', color: '#f8fafc', fontSize: '1.15rem', fontWeight: 700 }}>Nuevo Pedido</h3>
            <ControlsGrid>
              <FormGroup>
                <label>Salón</label>
                <select 
                  value={newOrder.salon} 
                  onChange={(e) => setNewOrder(prev => ({ ...prev, salon: e.target.value }))}
                >
                  <option value="">Seleccionar salón</option>
                  <option value="San Telmo">San Telmo</option>
                  <option value="Palermo">Palermo</option>
                  <option value="Recoleta">Recoleta</option>
                  <option value="Belgrano">Belgrano</option>
                </select>
              </FormGroup>

              <FormGroup>
                <label>DJ / Solicitante</label>
                <input 
                  type="text" 
                  placeholder="Nombre del DJ" 
                  value={newOrder.dj}
                  onChange={(e) => setNewOrder(prev => ({ ...prev, dj: e.target.value }))}
                />
              </FormGroup>

              <FormGroup>
                <label>Item / Material</label>
                <input 
                  type="text" 
                  placeholder="Ej: Líquido de humo, cables..." 
                  value={newOrder.item}
                  onChange={(e) => setNewOrder(prev => ({ ...prev, item: e.target.value }))}
                />
              </FormGroup>

              <FormGroup>
                <label>Cantidad</label>
                <input 
                  type="number" 
                  min="1" 
                  value={newOrder.quantity}
                  onChange={(e) => setNewOrder(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                />
              </FormGroup>

              <FormGroup>
                <label>Prioridad</label>
                <select 
                  value={newOrder.priority} 
                  onChange={(e) => setNewOrder(prev => ({ ...prev, priority: e.target.value as any }))}
                >
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                </select>
              </FormGroup>
            </ControlsGrid>

            <FormGroup style={{ marginBottom: '1rem' }}>
              <label>Descripción / Observaciones</label>
              <input 
                type="text" 
                placeholder="Detalles adicionales del pedido..." 
                value={newOrder.description}
                onChange={(e) => setNewOrder(prev => ({ ...prev, description: e.target.value }))}
              />
            </FormGroup>

            <ActionButtons>
              <Button 
                variant="secondary" 
                onClick={() => setShowNewOrderForm(false)}
              >
                Cancelar
              </Button>
              <Button 
                variant="default" 
                onClick={handleCreateOrder}
                disabled={!newOrder.salon || !newOrder.dj || !newOrder.item}
              >
                Guardar Pedido
              </Button>
            </ActionButtons>
          </ControlsSection>
        )}

        <OrdersGrid>
          {filteredOrders.length > 0 ? (
            filteredOrders.map(order => (
              <OrderCard key={order.id} status={order.status}>
                <OrderHeader>
                  <OrderInfo>
                    <div className="order-title">{order.item} ({order.quantity} un.)</div>
                    <div className="order-meta">
                      <span><Building2 size={13} /> {order.salon}</span>
                      <span><User size={13} /> {order.dj}</span>
                      <span><Calendar size={13} /> {new Date(order.createdAt).toLocaleDateString()}</span>
                      <span>Prioridad: {getPriorityLabel(order.priority)}</span>
                    </div>
                    <div className="order-description">
                      {order.description}
                    </div>
                  </OrderInfo>
                  <OrderStatus status={order.status}>
                    {getStatusIcon(order.status)}
                    {getStatusLabel(order.status)}
                  </OrderStatus>
                </OrderHeader>
                
                <OrderActions>
                  <OrderMetaInfo>
                    <div className="last-updated">
                      <Calendar size={12} />
                      Última actualización: {new Date(order.updatedAt).toLocaleDateString()} {new Date(order.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </OrderMetaInfo>
                  <StatusBadge status={order.status}>
                    {getStatusIcon(order.status)}
                    {getStatusLabel(order.status)}
                  </StatusBadge>
                </OrderActions>
              </OrderCard>
            ))
          ) : (
            <EmptyState>
              <div className="empty-icon">
                <ClipboardList size={40} className="mx-auto text-slate-500" />
              </div>
              <h3>No hay pedidos</h3>
              <p>No se encontraron pedidos con los filtros aplicados</p>
              <Button variant="default" onClick={() => setShowNewOrderForm(true)} className="flex items-center gap-2 mx-auto">
                <Plus size={15} /> Crear Primer Pedido
              </Button>
            </EmptyState>
          )}
        </OrdersGrid>
      </MainContent>
    </OrdersContainer>
  );
};

export default OrdersPage;
