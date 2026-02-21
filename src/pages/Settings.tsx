import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaCog, FaSave, FaDna } from 'react-icons/fa';
import { geneticsService } from '../services/geneticsService';
import { ToastModal } from '../components/ToastModal';
import { Genetic } from '../types/genetics';
import { useOrganization } from '../context/OrganizationContext';
import { useAuth } from '../context/AuthContext';
import { organizationService } from '../services/organizationService';
import { planService } from '../services/planService';
import { Plan } from '../types';
import { FaUserPlus, FaUserShield, FaTrash, FaCopy, FaExclamationTriangle } from 'react-icons/fa';

const PageContainer = styled.div`
  padding: 1rem;
  padding-top: 5rem;
  max-width: 800px;
  margin: 0 auto;
  min-height: 100vh;
  color: #f8fafc;
  
  @media (max-width: 768px) {
    padding: 0.5rem;
    padding-top: 4rem;
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
  gap: 0.5rem;
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

const Select = styled.select`
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #f8fafc;
  padding: 0.5rem;
  border-radius: 0.25rem;
  outline: none;
  &:focus {
    border-color: rgba(168, 85, 247, 0.5);
  }
  option {
    background: #0f172a;
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

const Settings: React.FC = () => {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [genetics, setGenetics] = useState<Genetic[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [orgPlan, setOrgPlan] = useState<Plan | null>(null);

  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('grower');
  const [newUserName, setNewUserName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');

  const [inviting, setInviting] = useState(false);

  const [toast, setToast] = useState<{ isOpen: boolean, message: string, type: 'success' | 'error' }>({
    isOpen: false,
    message: '',
    type: 'success'
  });

  useEffect(() => {
    loadData();
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
    if (!currentOrganization || !window.confirm('¿Estás seguro de que deseas eliminar a este usuario de la organización?')) return;
    try {
      await organizationService.removeMember(currentOrganization.id, userId);
      setToast({ isOpen: true, message: 'Usuario eliminado', type: 'success' });
      const mData = await organizationService.getOrganizationMembers(currentOrganization.id);
      setMembers(mData || []);
    } catch (error: any) {
      setToast({ isOpen: true, message: error.message || 'Error al eliminar usuario', type: 'error' });
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

  if (loading) return <PageContainer>Cargando configuración...</PageContainer>;

  return (
    <PageContainer>
      <Header>
        <h1><FaCog /> Configuración</h1>
      </Header>



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

      {currentOrganization && (
        <Section>
          <SectionHeader style={{ justifyContent: 'space-between' }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                <input
                  type="text"
                  placeholder="Nombre completo"
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(30,41,59,0.5)', color: '#fff' }}
                />
                <input
                  type="email"
                  placeholder="Email del usuario"
                  value={newUserEmail}
                  onChange={e => setNewUserEmail(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(30,41,59,0.5)', color: '#fff' }}
                />
                <input
                  type="password"
                  placeholder="Contraseña (Mín. 6 caracteres)"
                  value={newUserPassword}
                  onChange={e => setNewUserPassword(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(30,41,59,0.5)', color: '#fff' }}
                />
                <Select value={newUserRole} onChange={e => setNewUserRole(e.target.value)} style={{ width: '100%' }}>
                  <option value="owner">Dueño</option>
                  <option value="admin">Administrador</option>
                  <option value="grower">Grower / Director de Cultivo</option>
                  <option value="medico">Médico / Director Médico</option>
                  <option value="staff">Staff / Operario</option>
                </Select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <SaveButton
                  onClick={handleCreateUser}
                  disabled={inviting || !newUserEmail || !newUserPassword || !newUserName || (orgPlan ? members.length >= orgPlan.limits.max_users : false)}
                  style={{ background: '#22c55e', color: 'white', maxWidth: '250px' }}
                >
                  <FaUserPlus /> {inviting ? 'Creando...' : 'Crear Usuario y Añadir'}
                </SaveButton>
              </div>
            </div>
          )}

          <div style={{ overflowX: 'auto' }}>
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
                        <Select
                          value={member.role}
                          onChange={e => handleRoleChange(member.user_id, e.target.value)}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'center' }}
                        >
                          <option value="owner">Dueño</option>
                          <option value="admin">Administrador</option>
                          <option value="grower">Grower</option>
                          <option value="medico">Médico</option>
                          <option value="staff">Staff</option>
                        </Select>
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
        </Section>
      )}

      <ToastModal
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={closeToast}
      />
    </PageContainer>
  );
};

export default Settings;
