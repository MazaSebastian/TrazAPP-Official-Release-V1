import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { FaPlus, FaEdit, FaTrash, FaEnvelope, FaBoxOpen, FaCheck, FaTimes, FaRobot } from 'react-icons/fa';
import { useOrganization } from '../../context/OrganizationContext';
import { ConfirmModal } from '../ConfirmModal';
import { ToastModal } from '../ToastModal';
import {
  InsumoProvider,
  InsumoPurchaseOrder,
  getInsumoProviders,
  createProvider,
  updateProvider,
  deleteProvider,
  getPurchaseOrders,
  updateOrderStatus
} from '../../services/insumoProvidersService';

// Styles (Reused standard patterns from Insumos/Settings)
const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;
const slideUp = keyframes`from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); }`;

const Page = styled.div`
  padding: 1rem;
  max-width: 1400px;
  margin: 0 auto;
  color: #f8fafc;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;

  h1 { font-size: 1.8rem; margin: 0; }
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
      case 'secondary': return `background: rgba(30, 41, 59, 0.6); color: #cbd5e1; border: 1px solid rgba(255, 255, 255, 0.1); &:hover { background: rgba(255, 255, 255, 0.1); color: #f8fafc; }`;
      case 'danger': return `background: rgba(239, 68, 68, 0.1); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.2); &:hover { background: rgba(239, 68, 68, 0.2); }`;
      case 'success': return `background: rgba(74, 222, 128, 0.2); color: #4ade80; border: 1px solid rgba(74, 222, 128, 0.5); &:hover { background: rgba(74, 222, 128, 0.3); }`;
      default: return `background: rgba(168, 85, 247, 0.2); color: #d8b4fe; border: 1px solid rgba(168, 85, 247, 0.5); &:hover { background: rgba(168, 85, 247, 0.3); box-shadow: 0 4px 6px rgba(0,0,0,0.2); }`;
    }
  }}
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 0.5rem;
`;

const Tab = styled.button<{ active: boolean }>`
  background: none;
  border: none;
  color: ${props => props.active ? '#d8b4fe' : '#94a3b8'};
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.5rem 1rem;
  position: relative;
  transition: color 0.2s;

  &:after {
    content: '';
    position: absolute;
    bottom: -0.5rem;
    left: 0;
    width: 100%;
    height: 2px;
    background: #a855f7;
    transform: scaleX(${props => props.active ? 1 : 0});
    transition: transform 0.2s;
  }
  
  &:hover { color: #f8fafc; }
`;

const TableContainer = styled.div`
  width: 100%;
  overflow-x: auto;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  backdrop-filter: blur(12px);
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;

  th, td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  th {
    color: #94a3b8;
    font-size: 0.875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  tr:last-child td { border-bottom: none; }
  tbody tr:hover { background: rgba(255, 255, 255, 0.02); }
`;

const StatusBadge = styled.span<{ status: string; aiGenerated?: boolean }>`
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;

  ${props => {
    switch(props.status) {
      case 'PENDING': return 'background: rgba(250, 204, 21, 0.2); color: #facc15; border: 1px solid rgba(250, 204, 21, 0.5);';
      case 'SENT': return 'background: rgba(56, 189, 248, 0.2); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.5);';
      case 'DELIVERED': return 'background: rgba(74, 222, 128, 0.2); color: #4ade80; border: 1px solid rgba(74, 222, 128, 0.5);';
      case 'CANCELLED': return 'background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.5);';
      default: return 'background: rgba(255, 255, 255, 0.1); color: #cbd5e1;';
    }
  }}
`;

const Form = styled.form`
  display: grid;
  gap: 1.5rem;
  background: rgba(30, 41, 59, 0.6);
  padding: 1.5rem;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  margin-bottom: 2rem;
  
  .form-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  label { display: block; margin-bottom: 0.5rem; color: #94a3b8; font-size: 0.875rem; }
  input {
    width: 100%;
    padding: 0.75rem;
    border-radius: 0.5rem;
    background: rgba(15, 23, 42, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
    &:focus { outline: none; border-color: #a855f7; }
  }
`;

export const InsumoProviders: React.FC = () => {
  const { currentOrganization } = useOrganization();
  const [activeTab, setActiveTab] = useState<'providers' | 'orders'>('providers');
  
  // Data State
  const [providers, setProviders] = useState<InsumoProvider[]>([]);
  const [orders, setOrders] = useState<InsumoPurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', contact_name: '' });

  // Modal State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [providerToDelete, setProviderToDelete] = useState<string | null>(null);
  
  const [toast, setToast] = useState({ open: false, message: '', type: 'success' as 'success' | 'error' });

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'providers') {
        const data = await getInsumoProviders();
        setProviders(data);
      } else {
        const data = await getPurchaseOrders();
        setOrders(data);
      }
    } catch (e) {
      console.error(e);
      showToast('Error cargando información', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentOrganization) loadData();
  }, [currentOrganization, activeTab]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ open: true, message, type });
  };

  // --- Provider Handlers ---
  const handleSaveProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return showToast('El nombre es requerido', 'error');

    try {
      if (isEditing && editingId) {
        await updateProvider(editingId, formData);
        showToast('Proveedor actualizado', 'success');
      } else {
        await createProvider(formData);
        showToast('Proveedor creado', 'success');
      }
      resetForm();
      loadData();
    } catch (e) {
      showToast('Error al guardar', 'error');
    }
  };

  const handleEditClick = (p: InsumoProvider) => {
    setFormData({ name: p.name, email: p.email || '', phone: p.phone || '', contact_name: p.contact_name || '' });
    setEditingId(p.id);
    setIsEditing(true);
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', contact_name: '' });
    setEditingId(null);
    setIsEditing(false);
  };

  const executeDelete = async () => {
    if (!providerToDelete) return;
    try {
      await deleteProvider(providerToDelete);
      showToast('Proveedor eliminado', 'success');
      loadData();
    } catch (e) {
      showToast('Error al eliminar', 'error');
    }
    setDeleteConfirmOpen(false);
    setProviderToDelete(null);
  };

  // --- Order Handlers ---
  const handleStatusChange = async (orderId: string, newStatus: InsumoPurchaseOrder['status']) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      showToast('Estado de orden actualizado', 'success');
      loadData();
    } catch (e) {
      showToast('Error al actualizar estado', 'error');
    }
  };

  return (
    <Page>
      <Header>
        <h1>Proveedores y Pedidos Inteligentes</h1>
      </Header>

      <TabsContainer>
        <Tab active={activeTab === 'providers'} onClick={() => setActiveTab('providers')}>Proveedores</Tab>
        <Tab active={activeTab === 'orders'} onClick={() => setActiveTab('orders')}>Órdenes de Compra (Growy)</Tab>
      </TabsContainer>

      {activeTab === 'providers' && (
        <>
          <Form onSubmit={handleSaveProvider}>
            <h3>{isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h3>
            <div className="form-row">
              <div>
                <label>Nombre de Empresa *</label>
                <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ej: AgroTech Sur" required />
              </div>
              <div>
                <label>Email de Contacto</label>
                <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="Ej: ventas@agrotech.com" />
              </div>
            </div>
            <div className="form-row">
              <div>
                <label>Persona a Cargo</label>
                <input value={formData.contact_name} onChange={e => setFormData({ ...formData, contact_name: e.target.value })} placeholder="Ej: Juan Pérez" />
              </div>
              <div>
                <label>Teléfono</label>
                <input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="Ej: +54 9 11 1234 5678" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <Button type="submit"><FaCheck /> {isEditing ? 'Actualizar' : 'Guardar'}</Button>
              {isEditing && <Button type="button" variant="secondary" onClick={resetForm}><FaTimes /> Cancelar</Button>}
            </div>
          </Form>

          <TableContainer>
            <Table>
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Contacto</th>
                  <th>Email</th>
                  <th>Teléfono</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {providers.map(p => (
                  <tr key={p.id}>
                    <td><strong>{p.name}</strong></td>
                    <td>{p.contact_name || '-'}</td>
                    <td>{p.email || '-'}</td>
                    <td>{p.phone || '-'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <Button variant="secondary" onClick={() => handleEditClick(p)} style={{ padding: '0.5rem' }}><FaEdit /></Button>
                        <Button variant="danger" onClick={() => { setProviderToDelete(p.id); setDeleteConfirmOpen(true); }} style={{ padding: '0.5rem' }}><FaTrash /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {providers.length === 0 && !loading && <tr><td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8' }}>No hay proveedores registrados.</td></tr>}
              </tbody>
            </Table>
          </TableContainer>
        </>
      )}

      {activeTab === 'orders' && (
        <TableContainer>
          <Table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Insumo Requerido</th>
                <th>Proveedor</th>
                <th>Cantidad</th>
                <th>Estado</th>
                <th style={{ textAlign: 'center' }}>Acciones Rápidas</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id}>
                  <td>{new Date(o.ordered_at).toLocaleDateString()}</td>
                  <td>
                    <strong>{o.insumos?.nombre}</strong><br />
                    <small style={{ color: '#94a3b8' }}>Presentación de {o.insumos?.total_volume} {o.insumos?.unit_of_measurement}</small>
                  </td>
                  <td>{o.providers?.name}</td>
                  <td>{o.quantity_requested} unidad(es)</td>
                  <td>
                    <StatusBadge status={o.status} aiGenerated={o.ai_generated}>
                      {o.ai_generated && <FaRobot />} 
                      {o.status === 'PENDING' ? 'Pendiente' : o.status === 'SENT' ? 'Enviado' : o.status === 'DELIVERED' ? 'Recibido' : 'Cancelado'}
                    </StatusBadge>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      {o.status === 'PENDING' && (
                        <Button variant="primary" onClick={() => handleStatusChange(o.id, 'SENT')} style={{ padding: '0.5rem' }} title="Marcar como enviado">
                          <FaEnvelope />
                        </Button>
                      )}
                      {(o.status === 'PENDING' || o.status === 'SENT') && (
                        <Button variant="success" onClick={() => handleStatusChange(o.id, 'DELIVERED')} style={{ padding: '0.5rem' }} title="Marcar como recibido">
                          <FaBoxOpen />
                        </Button>
                      )}
                      {(o.status !== 'CANCELLED' && o.status !== 'DELIVERED') && (
                        <Button variant="danger" onClick={() => handleStatusChange(o.id, 'CANCELLED')} style={{ padding: '0.5rem' }} title="Cancelar orden">
                          <FaTimes />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && !loading && <tr><td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8' }}>No hay órdenes de compra registradas.</td></tr>}
            </tbody>
          </Table>
        </TableContainer>
      )}

      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={executeDelete}
        title="Eliminar Proveedor"
        message="¿Estás seguro de que deseas eliminar este proveedor? Sus órdenes de compra podrían verse afectadas visualmente."
        confirmText={isEditing ? "Eliminando..." : "Eliminar"}
        isDanger
      />
      
      <ToastModal
        isOpen={toast.open}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, open: false })}
      />
    </Page>
  );
};
