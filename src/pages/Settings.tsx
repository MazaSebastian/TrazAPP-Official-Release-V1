import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaCog, FaSave, FaDna } from 'react-icons/fa';
import { geneticsService } from '../services/geneticsService';
import { ToastModal } from '../components/ToastModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { CustomSelect } from '../components/CustomSelect';
import { Genetic } from '../types/genetics';
import { useOrganization } from '../context/OrganizationContext';
import { useAuth } from '../context/AuthContext';
import { organizationService } from '../services/organizationService';
import { planService } from '../services/planService';
import { Plan, TaskType } from '../types';
import { tasksService } from '../services/tasksService';
import { FaUserPlus, FaUserShield, FaTrash, FaTimes, FaTasks, FaPlus } from 'react-icons/fa';

// Animación de aparición para modales
import { keyframes } from 'styled-components';
export const fadeIn = keyframes`
  from { opacity: 0; backdrop-filter: blur(0px); }
  to { opacity: 1; backdrop-filter: blur(8px); }
`;
export const scaleUp = keyframes`
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
`;

const PageContainer = styled.div`
  padding: 1rem;
  padding-top: 1.5rem;
  max-width: 800px;
  margin: 0 auto;
  min-height: 100vh;
  color: #f8fafc;
  
  @media (max-width: 768px) {
    padding: 1rem;
    padding-top: 1.5rem; /* Ajustado para eliminar el padding superior excesivo */
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 2rem;
  
  h1 {
    font-size: 1.875rem;
    font-weight: 700;
    color: #f8fafc;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    
    @media (max-width: 768px) {
      justify-content: center;
      width: 100%;
    }
  }
`;

const Section = styled.div`
  background: rgba(30, 41, 59, 0.6);
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
  margin-bottom: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
`;

const SectionHeader = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #f8fafc;
  margin: 0 0 1.5rem 0;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;    /* Centrado global en móviles */
    text-align: center;
    justify-content: center;
    gap: 1rem;
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const SaveButton = styled.button`
  background: rgba(168, 85, 247, 0.2);
  color: #d8b4fe;
  border: 1px solid rgba(168, 85, 247, 0.5);
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  backdrop-filter: blur(8px);
  
  &:hover:not(:disabled) {
    background: rgba(168, 85, 247, 0.3);
    transform: translateY(-1px);
    box-shadow: 0 4px 6px rgba(0,0,0,0.2);
  }
  
  &:disabled {
    background: rgba(100, 116, 139, 0.2);
    color: #94a3b8;
    border-color: rgba(100, 116, 139, 0.5);
    cursor: not-allowed;
    box-shadow: none;
  }
`;

const ActionButton = styled.button<{ $danger?: boolean }>`
  background: none;
  border: none;
  color: ${props => props.$danger ? '#ef4444' : '#94a3b8'};
  cursor: pointer;
  padding: 0.5rem;
  transition: color 0.2s;
  &:hover {
    color: ${props => props.$danger ? '#dc2626' : '#f8fafc'};
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  color: #94a3b8;
  font-weight: 600;
  font-size: 0.85rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  color: #f8fafc;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;

  &:focus {
    border-color: rgba(56, 189, 248, 0.5);
  }
`;

// --- Nuevos estilos para la vista móvil de Usuarios ---
const UserCardWrapper = styled.div`
  background: rgba(30, 41, 59, 0.4);
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: space-between;

  &:hover {
    background: rgba(30, 41, 59, 0.6);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .userInfo {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .u-name {
    font-size: 0.95rem;
    font-weight: 600;
    color: #f8fafc;
  }
  
  .u-email {
    font-size: 0.8rem;
    color: #94a3b8;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
  }

  .u-role {
    font-size: 0.75rem;
    padding: 0.2rem 0.5rem;
    border-radius: 1rem;
    background: rgba(168, 85, 247, 0.2);
    color: #d8b4fe;
    white-space: nowrap;
  }
`;

const DesktopView = styled.div`
  display: block;
  @media (max-width: 768px) {
    display: none;
  }
`;

const MobileView = styled.div`
  display: none;
  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(8px);
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  animation: ${fadeIn} 0.2s ease-out;
`;

const ModalContentDetail = styled.div`
  background: rgba(30, 41, 59, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  border-radius: 1rem;
  width: 100%;
  max-width: 400px;
  padding: 1.5rem;
  animation: ${scaleUp} 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
`;
// ----------------------------------------------------

const Settings: React.FC = () => {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [genetics, setGenetics] = useState<Genetic[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [orgPlan, setOrgPlan] = useState<Plan | null>(null);

  // Task Manager State
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [newTaskTypeName, setNewTaskTypeName] = useState('');
  const [creatingTaskType, setCreatingTaskType] = useState(false);

  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('grower');
  const [newUserName, setNewUserName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');

  const [inviting, setInviting] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null); // Estado para Modal Móvil

  const [toast, setToast] = useState<{ isOpen: boolean, message: string, type: 'success' | 'error' }>({
    isOpen: false,
    message: '',
    type: 'success'
  });

  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean, userId: string | null }>({
    isOpen: false,
    userId: null
  });

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrganization]);

  const loadData = async () => {
    setLoading(true);
    try {
      const gData = await geneticsService.getGenetics();
      setGenetics(gData);

      if (currentOrganization) {
        const mData = await organizationService.getOrganizationMembers(currentOrganization.id);
        setMembers(mData || []);

        const planData = await planService.getPlanBySlug(currentOrganization.plan);
        setOrgPlan(planData);

        const tData = await tasksService.getTaskTypes();
        setTaskTypes(tData);
      }
    } catch (e) {
      console.error("Error loading settings data:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGenetics = async () => {
    setSaving(true);
    let successCount = 0;
    let errorCount = 0;

    for (const gen of genetics) {
      const success = await geneticsService.updateGenetic(gen.id, { default_price_per_gram: gen.default_price_per_gram });
      if (success) successCount++;
      else errorCount++;
    }

    if (errorCount === 0) {
      setToast({ isOpen: true, message: 'Precios de genéticas actualizados', type: 'success' });
    } else {
      setToast({ isOpen: true, message: `Actualizados: ${successCount}.Errores: ${errorCount} `, type: 'error' });
    }
    setSaving(false);
  };

  const updateGeneticPrice = (id: string, price: string) => {
    setGenetics(genetics.map(g =>
      g.id === id ? { ...g, default_price_per_gram: parseFloat(price) || 0 } : g
    ));
  };

  const closeToast = () => setToast({ ...toast, isOpen: false });

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!currentOrganization) return;
    try {
      await organizationService.updateMemberRole(currentOrganization.id, userId, newRole);
      setToast({ isOpen: true, message: 'Rol actualizado exitosamente', type: 'success' });
      const mData = await organizationService.getOrganizationMembers(currentOrganization.id);
      setMembers(mData || []);
    } catch (error: any) {
      setToast({ isOpen: true, message: error.message || 'Error al actualizar el rol', type: 'error' });
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!currentOrganization) return;

    const memberToRemove = members.find(m => m.user_id === userId);
    if (memberToRemove?.role === 'owner') {
      setToast({ isOpen: true, message: 'No puedes eliminar al dueño de la organización', type: 'error' });
      return;
    }

    setConfirmDelete({ isOpen: true, userId });
  };

  const executeRemoveMember = async () => {
    if (!currentOrganization || !confirmDelete.userId) return;

    try {
      await organizationService.removeMember(currentOrganization.id, confirmDelete.userId);
      setToast({ isOpen: true, message: 'Usuario eliminado', type: 'success' });
      const mData = await organizationService.getOrganizationMembers(currentOrganization.id);
      setMembers(mData || []);
      if (selectedUser?.user_id === confirmDelete.userId) {
        setSelectedUser(null);
      }
    } catch (error: any) {
      setToast({ isOpen: true, message: error.message || 'Error al eliminar usuario', type: 'error' });
    } finally {
      setConfirmDelete({ isOpen: false, userId: null });
    }
  };

  const handleCreateUser = async () => {
    if (!currentOrganization || !newUserEmail || !newUserName || !newUserPassword) return;

    // UI double-check limits
    if (orgPlan && members.length >= orgPlan.limits.max_users) {
      setToast({ isOpen: true, message: `Límite alcanzado: ${orgPlan.limits.max_users} usuarios activos.`, type: 'error' });
      return;
    }

    setInviting(true);
    try {
      await organizationService.createUserDirectly(
        currentOrganization.id,
        newUserEmail,
        newUserName,
        newUserRole,
        newUserPassword
      );
      setToast({ isOpen: true, message: 'Usuario creado y añadido exitosamente', type: 'success' });
      const mData = await organizationService.getOrganizationMembers(currentOrganization.id);
      setMembers(mData || []);

      // Reset form
      setNewUserEmail('');
      setNewUserName('');
      setNewUserPassword('');
    } catch (error: any) {
      setToast({ isOpen: true, message: error.message || 'Error al crear el usuario', type: 'error' });
    }
    setInviting(false);
  };

  const currentUserRole = members.find(m => m.user_id === user?.id)?.role;
  const canManageUsers = currentUserRole === 'owner' || currentUserRole === 'admin';
  const canManageTasks = currentUserRole === 'owner' || currentUserRole === 'grower';

  const handleCreateTaskType = async () => {
    if (!newTaskTypeName.trim()) return;
    setCreatingTaskType(true);
    try {
      const newType = await tasksService.createTaskType(newTaskTypeName.trim());
      if (newType) {
        setTaskTypes([...taskTypes, newType]);
        setNewTaskTypeName('');
        setToast({ isOpen: true, message: 'Tipo de tarea creado', type: 'success' });
      }
    } catch (e: any) {
      setToast({ isOpen: true, message: e.message || 'Error al crear la tarea', type: 'error' });
    } finally {
      setCreatingTaskType(false);
    }
  };

  const handleDeleteTaskType = async (id: string) => {
    if (!window.confirm("¿Seguro que deseas eliminar este tipo de tarea? Las tareas existentes con este tipo no se borrarán, pero ya no se podrá seleccionar.")) return;
    try {
      const success = await tasksService.deleteTaskType(id);
      if (success) {
        setTaskTypes(taskTypes.filter(t => t.id !== id));
        setToast({ isOpen: true, message: 'Tipo de tarea eliminado', type: 'success' });
      }
    } catch (e: any) {
      setToast({ isOpen: true, message: 'Error al eliminar la tarea', type: 'error' });
    }
  };

  if (loading) return <PageContainer>Cargando configuración...</PageContainer>;

  return (
    <PageContainer>
      <Header>
        <h1><FaCog /> Configuración</h1>
      </Header>



      {/* Ocultado temporalmente según solicitud */}
      {false && (
        <Section>
          <SectionHeader>
            <FaDna /> Precios por Genética
          </SectionHeader>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {genetics.map(gen => (
              <div key={gen.id} style={{ border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '0.5rem', padding: '1rem', background: 'rgba(30, 41, 59, 0.5)' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#f8fafc' }}>{gen.name}</div>
                <input
                  type="number"
                  placeholder="Precio ($)"
                  value={gen.default_price_per_gram || ''}
                  onChange={e => updateGeneticPrice(gen.id, e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '0.25rem', background: 'rgba(15, 23, 42, 0.5)', color: '#f8fafc', outline: 'none' }}
                />
              </div>
            ))}
          </div>

          <SaveButton onClick={handleSaveGenetics} disabled={saving}>
            <FaSave /> {saving ? 'Guardando...' : 'Guardar Precios Genéticas'}
          </SaveButton>
        </Section>
      )}

      {currentOrganization && (
        <Section>
          <SectionHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FaUserShield /> Roles y Usuarios
            </div>

            <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: orgPlan && members.length >= orgPlan.limits.max_users ? '#ef4444' : '#4ade80', background: 'rgba(15, 23, 42, 0.5)', padding: '0.25rem 0.75rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
              {orgPlan ? `Usuarios Disponibles: ${orgPlan.limits.max_users - members.length} de ${orgPlan.limits.max_users} (${orgPlan.name})` : `Miembros: ${members.length}`}
            </div>
          </SectionHeader>

          {canManageUsers && (
            <div style={{ marginBottom: '1.5rem', background: 'rgba(15, 23, 42, 0.5)', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', color: '#cbd5e1' }}>Crear Usuario Directamente</h3>
              </div>

              <FormGrid>
                <input
                  type="text"
                  placeholder="Nombre completo"
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(30,41,59,0.5)', color: '#fff', boxSizing: 'border-box' }}
                />
                <input
                  type="email"
                  placeholder="Email del usuario"
                  value={newUserEmail}
                  onChange={e => setNewUserEmail(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(30,41,59,0.5)', color: '#fff', boxSizing: 'border-box' }}
                />
                <input
                  type="password"
                  placeholder="Contraseña (Mín. 6 caracteres)"
                  value={newUserPassword}
                  onChange={e => setNewUserPassword(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(30,41,59,0.5)', color: '#fff', boxSizing: 'border-box' }}
                />
                <CustomSelect
                  value={newUserRole}
                  onChange={val => setNewUserRole(val)}
                  options={[
                    { value: 'owner', label: 'Dueño' },
                    { value: 'admin', label: 'Administrador' },
                    { value: 'grower', label: 'Grower / Director de Cultivo' },
                    { value: 'medico', label: 'Médico / Director Médico' },
                    { value: 'staff', label: 'Staff / Operario' }
                  ]}
                  triggerStyle={{ padding: '0.625rem', borderRadius: '0.25rem', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(30,41,59,0.5)', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' }}
                />
              </FormGrid>

              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
                <SaveButton
                  onClick={handleCreateUser}
                  disabled={inviting || !newUserEmail || !newUserPassword || !newUserName || (orgPlan ? members.length >= orgPlan.limits.max_users : false)}
                  style={{ background: '#22c55e', color: 'white', maxWidth: '100%', width: '100%', justifyContent: 'center' }}
                >
                  <FaUserPlus /> {inviting ? 'Creando...' : 'Crear Usuario y Añadir'}
                </SaveButton>
              </div>
            </div>
          )}

          <DesktopView>
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', margin: '0 -1rem', padding: '0 1rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', tableLayout: 'fixed', minWidth: '600px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
                    <th style={{ padding: '0.75rem', width: '22%' }}>Nombre</th>
                    <th style={{ padding: '0.75rem', width: '30%' }}>Email</th>
                    <th style={{ padding: '0.75rem', width: '13%' }}>Ingreso</th>
                    <th style={{ padding: '0.75rem', width: '23%', textAlign: 'center' }}>Rol</th>
                    {canManageUsers && <th style={{ padding: '0.75rem', width: '12%', textAlign: 'right' }}>Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {members.map(member => (
                    <tr key={member.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '0.75rem', color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.profile?.full_name || 'Sin nombre'}</td>
                      <td style={{ padding: '0.75rem', color: '#cbd5e1', wordBreak: 'break-all' }}>{member.profile?.email || 'N/A'}</td>
                      <td style={{ padding: '0.75rem', color: '#94a3b8' }}>{new Date(member.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        {canManageUsers ? (
                          <CustomSelect
                            value={member.role}
                            onChange={val => handleRoleChange(member.user_id, val)}
                            options={[
                              { value: 'owner', label: 'Dueño' },
                              { value: 'admin', label: 'Administrador' },
                              { value: 'grower', label: 'Grower' },
                              { value: 'medico', label: 'Médico' },
                              { value: 'staff', label: 'Staff' }
                            ]}
                            triggerStyle={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem', boxShadow: 'none', fontSize: '0.9rem', justifyContent: 'center' }}
                          />
                        ) : (
                          <span style={{ color: '#cbd5e1' }}>
                            {member.role === 'owner' ? 'Dueño' :
                              member.role === 'admin' ? 'Administrador' :
                                member.role === 'grower' ? 'Grower' :
                                  member.role === 'medico' ? 'Médico' : 'Staff'}
                          </span>
                        )}
                      </td>
                      {canManageUsers && (
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                          <ActionButton $danger onClick={() => handleRemoveMember(member.user_id)} title="Eliminar usuario">
                            <FaTrash />
                          </ActionButton>
                        </td>
                      )}
                    </tr>
                  ))}
                  {members.length === 0 && (
                    <tr>
                      <td colSpan={canManageUsers ? 5 : 4} style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8' }}>No hay miembros registrados</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </DesktopView>

          <MobileView>
            {members.map(member => (
              <UserCardWrapper key={member.id} onClick={() => setSelectedUser(member)}>
                <div className="userInfo">
                  <span className="u-name">{member.profile?.full_name || 'Sin nombre'}</span>
                  <span className="u-email">{member.profile?.email || 'N/A'}</span>
                </div>
                <span className="u-role">
                  {member.role === 'owner' ? 'Dueño' : member.role === 'admin' ? 'Administrador' : member.role === 'grower' ? 'Grower' : member.role === 'medico' ? 'Médico' : 'Staff'}
                </span>
              </UserCardWrapper>
            ))}
            {members.length === 0 && (
              <div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8' }}>No hay miembros registrados</div>
            )}
          </MobileView>
        </Section>
      )}

      {canManageTasks && (
        <Section>
          <SectionHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FaTasks /> Gestor de Tipos de Tarea
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 'normal', color: '#94a3b8' }}>
              Personaliza las tareas disponibles
            </div>
          </SectionHeader>

          <div style={{ marginBottom: '1.5rem', background: 'rgba(15, 23, 42, 0.5)', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#cbd5e1' }}>Añadir Nuevo Tipo</h3>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <FormGroup style={{ flex: '1 1 200px' }}>
                <Label>Nombre de la tarea (Ej: 'Limpieza de filtros')</Label>
                <Input
                  type="text"
                  placeholder="Escriba aquí..."
                  value={newTaskTypeName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTaskTypeName(e.target.value)}
                  onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleCreateTaskType()}
                />
              </FormGroup>
              <SaveButton
                onClick={handleCreateTaskType}
                disabled={creatingTaskType || !newTaskTypeName.trim()}
                style={{ width: 'auto', background: '#22c55e' }}
              >
                {creatingTaskType ? 'Guardando...' : <><FaPlus /> Añadir</>}
              </SaveButton>
            </div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.5)', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
            {taskTypes.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', color: '#94a3b8', fontWeight: 600 }}>TIPO DE TAREA</th>
                    <th style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontWeight: 600, width: '100px' }}>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {taskTypes.map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '1rem', color: '#f8fafc', fontWeight: 500 }}>
                        {t.name}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <ActionButton $danger onClick={() => handleDeleteTaskType(t.id)} title="Eliminar tipo">
                          <FaTrash />
                        </ActionButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                No hay tipos de tarea personalizados registrados.
              </div>
            )}
          </div>
        </Section>
      )}

      {selectedUser && (
        <ModalOverlay onClick={() => setSelectedUser(null)}>
          <ModalContentDetail onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setSelectedUser(null)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            >
              <FaTimes size={20} />
            </button>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#f8fafc', fontSize: '1.25rem' }}>{selectedUser.profile?.full_name || 'Sin nombre'}</h3>
            <p style={{ margin: '0 0 1.5rem 0', color: '#94a3b8', fontSize: '0.9rem' }}>{selectedUser.profile?.email || 'N/A'}</p>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#cbd5e1' }}>Rol del usuario</label>
              {canManageUsers ? (
                <CustomSelect
                  value={selectedUser.role}
                  onChange={val => {
                    setSelectedUser({ ...selectedUser, role: val });
                    handleRoleChange(selectedUser.user_id, val);
                  }}
                  options={[
                    { value: 'owner', label: 'Dueño' },
                    { value: 'admin', label: 'Administrador' },
                    { value: 'grower', label: 'Grower / Director de Cultivo' },
                    { value: 'medico', label: 'Médico / Director Médico' },
                    { value: 'staff', label: 'Staff / Operario' }
                  ]}
                  triggerStyle={{ padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(255,255,255,0.1)', width: '100%', boxSizing: 'border-box' }}
                />
              ) : (
                <div style={{ padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(255,255,255,0.05)', color: '#f8fafc' }}>
                  {selectedUser.role === 'owner' ? 'Dueño' : selectedUser.role === 'admin' ? 'Administrador' : selectedUser.role === 'grower' ? 'Grower' : selectedUser.role === 'medico' ? 'Médico' : 'Staff'}
                </div>
              )}
            </div>

            {canManageUsers && selectedUser.role !== 'owner' && (
              <button
                onClick={() => handleRemoveMember(selectedUser.user_id)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <FaTrash /> Eliminar Usuario
              </button>
            )}
          </ModalContentDetail>
        </ModalOverlay>
      )}

      <ToastModal
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={closeToast}
      />

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        title="Eliminar usuario"
        message="¿Estás seguro de que deseas eliminar a este usuario de la organización?"
        onConfirm={executeRemoveMember}
        onClose={() => setConfirmDelete({ isOpen: false, userId: null })}
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDanger={true}
      />
    </PageContainer>
  );
};

export default Settings;
