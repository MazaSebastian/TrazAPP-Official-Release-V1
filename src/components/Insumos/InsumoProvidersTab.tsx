import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaPlus, FaEdit, FaTrash, FaBuilding, FaTimesCircle } from 'react-icons/fa';
import { ToastModal } from '../ToastModal';
import { ConfirmModal } from '../ConfirmModal';
import {
  InsumoProvider,
  getInsumoProviders,
  createProvider,
  updateProvider,
  deleteProvider
} from '../../services/insumoProvidersService';

const Container = styled.div`
  animation: fadeIn 0.3s ease-out;
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const Controls = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
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
      default:
        return `
          background: rgba(168, 85, 247, 0.2);
          color: #d8b4fe;
          border: 1px solid rgba(168, 85, 247, 0.5);
          &:hover { background: rgba(168, 85, 247, 0.3); box-shadow: 0 4px 6px rgba(0,0,0,0.2); }
        `;
    }
  }}
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
  min-width: 800px;
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 2fr 2fr 1.5fr 1.5fr auto;
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
  grid-template-columns: 2fr 2fr 1.5fr 1.5fr auto;
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

const Modal = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(8px);
  display: ${props => props.isOpen ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
`;

const ModalHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;

  h2 {
    margin: 0;
    font-size: 1.25rem;
    color: #f8fafc;
  }
`;

const Form = styled.form`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  label {
    color: #94a3b8;
    font-weight: 600;
    font-size: 0.9rem;
  }

  input {
    padding: 0.75rem;
    border-radius: 0.5rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(15, 23, 42, 0.6);
    color: #f8fafc;
    font-size: 1rem;

    &:focus {
      outline: none;
      border-color: rgba(168, 85, 247, 0.5);
      box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1);
    }
  }
`;

export const InsumoProvidersTab: React.FC = () => {
  const [providers, setProviders] = useState<InsumoProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<InsumoProvider | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    contact_name: ''
  });

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      setLoading(true);
      const data = await getInsumoProviders();
      setProviders(data);
    } catch (error) {
      console.error('Error loading providers:', error);
      setToast({ message: 'Error al cargar proveedores.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (provider?: InsumoProvider) => {
    if (provider) {
      setEditingProvider(provider);
      setFormData({
        name: provider.name,
        email: provider.email || '',
        phone: provider.phone || '',
        contact_name: provider.contact_name || ''
      });
    } else {
      setEditingProvider(null);
      setFormData({ name: '', email: '', phone: '', contact_name: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProvider(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProvider) {
        await updateProvider(editingProvider.id, formData);
        setToast({ message: 'Proveedor actualizado exitosamente', type: 'success' });
      } else {
        await createProvider(formData as any);
        setToast({ message: 'Proveedor creado exitosamente', type: 'success' });
      }
      closeModal();
      loadProviders();
    } catch (error) {
      console.error('Error saving provider:', error);
      setToast({ message: 'Error al guardar el proveedor', type: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteProvider(deleteConfirm);
      setToast({ message: 'Proveedor eliminado exitosamente', type: 'success' });
      setDeleteConfirm(null);
      loadProviders();
    } catch (error) {
      console.error('Error deleting provider:', error);
      setToast({ message: 'Error al eliminar el proveedor', type: 'error' });
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Cargando proveedores...</div>;
  }

  return (
    <Container>
      <Controls>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#f8fafc' }}>Proveedores de Insumos</h2>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>Administra los proveedores para la recompra automática de Growy.</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <FaPlus /> Nuevo Proveedor
        </Button>
      </Controls>

      {providers.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#94a3b8',
          background: 'rgba(30, 41, 59, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '1rem',
          backdropFilter: 'blur(12px)'
        }}>
          <FaBuilding style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5, color: '#f8fafc' }} />
          <h3 style={{ color: '#f8fafc' }}>No hay proveedores registrados</h3>
          <p>Registra un proveedor para que Growy pueda realizar compras automáticamente cuando el stock sea bajo.</p>
        </div>
      ) : (
        <TableContainer>
          <Table>
            <TableHeader>
              <div>Nombre de la Empresa</div>
              <div>Contacto</div>
              <div>Email (Para Órdenes)</div>
              <div>Teléfono</div>
              <div>Acciones</div>
            </TableHeader>
            {providers.map(provider => (
              <TableRow key={provider.id}>
                <div style={{ fontWeight: 600 }}>{provider.name}</div>
                <div>{provider.contact_name || '—'}</div>
                <div>{provider.email || '—'}</div>
                <div>{provider.phone || '—'}</div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button variant="secondary" onClick={() => handleOpenModal(provider)} style={{ padding: '0.5rem' }}>
                    <FaEdit />
                  </Button>
                  <Button variant="danger" onClick={() => setDeleteConfirm(provider.id)} style={{ padding: '0.5rem' }}>
                    <FaTrash />
                  </Button>
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

      <ConfirmModal
        isOpen={!!deleteConfirm}
        title="Eliminar Proveedor"
        message="¿Estás seguro que deseas eliminar este proveedor? Esto podría afectar la recompra automática en insumos vinculados."
        onConfirm={handleDelete}
        onClose={() => setDeleteConfirm(null)}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />

      <Modal isOpen={isModalOpen} onMouseDown={closeModal}>
        <ModalContent onMouseDown={(e) => e.stopPropagation()}>
          <ModalHeader>
            <h2>{editingProvider ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
            <Button variant="secondary" onClick={closeModal} style={{ padding: '0.5rem' }}><FaTimesCircle /></Button>
          </ModalHeader>
          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <label>Nombre de la Empresa / Distribuidor *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Distribuidora Cultivo Feliz"
              />
            </FormGroup>
            <FormGroup>
              <label>Email de Contacto (Para Órdenes de Growy) *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="Ej: ventas@distribuidora.com"
              />
            </FormGroup>
            <FormGroup>
              <label>Persona de Contacto</label>
              <input
                type="text"
                value={formData.contact_name}
                onChange={e => setFormData({ ...formData, contact_name: e.target.value })}
                placeholder="Ej: Juan Pérez"
              />
            </FormGroup>
            <FormGroup>
              <label>Teléfono / WhatsApp</label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Ej: +54 9 11 2345 6789"
              />
            </FormGroup>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <Button type="button" variant="secondary" onClick={closeModal}>Cancelar</Button>
              <Button type="submit">Guardar Proveedor</Button>
            </div>
          </Form>
        </ModalContent>
      </Modal>
    </Container>
  );
};
