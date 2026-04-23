import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaRobot, FaBoxOpen, FaCheckCircle, FaTimesCircle, FaClock } from 'react-icons/fa';
import { ToastModal } from '../ToastModal';
import {
  InsumoPurchaseOrder,
  getPurchaseOrders,
  updateOrderStatus
} from '../../services/insumoProvidersService';
import { CustomSelect } from '../CustomSelect';

const Container = styled.div`
  animation: fadeIn 0.3s ease-out;
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
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
  grid-template-columns: 2fr 2fr 1.5fr 1fr 1.5fr;
  gap: 1rem;
  padding: 1rem;
  background: rgba(15, 23, 42, 0.4);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  font-weight: 600;
  color: #cbd5e1;
  font-size: 0.875rem;
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: 2fr 2fr 1.5fr 1fr 1.5fr;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  align-items: center;
  color: #f8fafc;
  transition: background-color 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
`;

const StatusBadge = styled.span<{ status: string }>`
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;

  ${props => {
    switch (props.status) {
      case 'DELIVERED':
        return 'background: rgba(74, 222, 128, 0.2); color: #4ade80; border: 1px solid rgba(74, 222, 128, 0.5);';
      case 'SENT':
        return 'background: rgba(56, 189, 248, 0.2); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.5);';
      case 'CANCELLED':
        return 'background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.5);';
      default: // PENDING
        return 'background: rgba(250, 204, 21, 0.2); color: #facc15; border: 1px solid rgba(250, 204, 21, 0.5);';
    }
  }}
`;

export const InsumoOrdersTab: React.FC = () => {
  const [orders, setOrders] = useState<InsumoPurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await getPurchaseOrders();
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
      setToast({ message: 'Error al cargar órdenes de compra.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: InsumoPurchaseOrder['status']) => {
    try {
      await updateOrderStatus(id, newStatus);
      setToast({ message: `Estado actualizado a ${newStatus}`, type: 'success' });
      loadOrders();

      // Optionally, if delivered, we might want to prompt the user to update their physical stock?
      // Just showing a toast is enough for now. The user can go to Inventory to receive it.
      if (newStatus === 'DELIVERED') {
        setTimeout(() => {
          setToast({ message: 'Recuerda sumar este ingreso de stock al inventario.', type: 'info' });
        }, 2500);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setToast({ message: 'Error al actualizar el estado.', type: 'error' });
    }
  };

  const statusOptions = [
    { value: 'PENDING', label: 'Pendiente' },
    { value: 'SENT', label: 'Enviada (Email)' },
    { value: 'DELIVERED', label: 'Entregada/Recibida' },
    { value: 'CANCELLED', label: 'Cancelada' }
  ];

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Cargando órdenes de Growy AI...</div>;
  }

  return (
    <Container>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FaRobot style={{ color: 'var(--primary-color, #a855f7)' }} /> Órdenes de Compra Automáticas
        </h2>
        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>
          Registro de las compras solicitadas automáticamente por Growy AI a los proveedores cuando el stock físico es crítico.
        </p>
      </div>

      {orders.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#94a3b8',
          background: 'rgba(30, 41, 59, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '1rem',
          backdropFilter: 'blur(12px)'
        }}>
          <FaBoxOpen style={{ fontSize: '3rem', margin: '0 auto 1rem', opacity: 0.5, color: '#f8fafc', display: 'block' }} />
          <h3 style={{ color: '#f8fafc' }}>Aún no hay compras automáticas</h3>
          <p>Growy creará una orden aquí cuando un insumo con recompra activada baje de su límite.</p>
        </div>
      ) : (
        <TableContainer>
          <Table>
            <TableHeader>
              <div>Insumo y Unidades</div>
              <div>Proveedor</div>
              <div>Fecha de Pedido</div>
              <div>Estado Global</div>
              <div>Cambiar Estado</div>
            </TableHeader>

            {orders.map(order => (
              <TableRow key={order.id}>
                <div>
                  <div style={{ fontWeight: 600 }}>{order.insumos?.nombre || 'Producto Eliminado'}</div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    Solicitado: {order.quantity_requested} x {order.insumos?.total_volume}{order.insumos?.unit_of_measurement}
                  </div>
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{order.providers?.name || 'Proveedor Eliminado'}</div>
                  {order.ai_generated && <div style={{ fontSize: '0.75rem', color: 'var(--primary-color, #a855f7)' }}>🤖 Solicitado por IA</div>}
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{new Date(order.ordered_at).toLocaleDateString()}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(order.ordered_at).toLocaleTimeString()}</div>
                </div>
                <div>
                  <StatusBadge status={order.status}>
                    {order.status === 'DELIVERED' && <FaCheckCircle />}
                    {order.status === 'SENT' && <FaBoxOpen />}
                    {order.status === 'CANCELLED' && <FaTimesCircle />}
                    {order.status === 'PENDING' && <FaClock />}
                    {statusOptions.find(o => o.value === order.status)?.label || order.status}
                  </StatusBadge>
                </div>
                <div style={{ position: 'relative', zIndex: 10 }}>
                  <CustomSelect
                    value={order.status}
                    onChange={(val) => handleStatusChange(order.id, val as any)}
                    options={statusOptions}
                  />
                </div>
              </TableRow>
            ))}
          </Table>
        </TableContainer>
      )}

      {toast && (
        <ToastModal
          isOpen={!!toast}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </Container>
  );
};
