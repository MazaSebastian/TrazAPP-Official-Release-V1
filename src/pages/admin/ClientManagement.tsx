import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { supabase } from '../../services/supabaseClient';
import { Organization } from '../../types';
import { CreateOrgModal } from './CreateOrgModal';
import { ConfirmModal } from '../../components/ConfirmModal';
import { FaPlus, FaUsers, FaTrash, FaCheck, FaBan, FaClock } from 'react-icons/fa';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
  padding: 2rem;
  padding-top: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;
  color: #f8fafc;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  color: #f8fafc;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: rgba(30, 41, 59, 0.6);
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  
  h3 { margin: 0; font-size: 0.875rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
  .value { font-size: 2rem; font-weight: 700; color: #f8fafc; margin-top: 0.5rem; }
`;

const Tabs = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
`;

const Tab = styled.button<{ active: boolean }>`
  background: none;
  border: none;
  padding: 1rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: ${props => props.active ? '#c084fc' : '#94a3b8'};
  border-bottom: 2px solid ${props => props.active ? '#c084fc' : 'transparent'};
  margin-bottom: -2px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: color 0.2s;

  &:hover {
    color: #d8b4fe;
  }
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  animation: ${fadeIn} 0.3s ease-out;
`;

const OrgCard = styled.div<{ status: string }>`
  background: rgba(30, 41, 59, 0.6);
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2);
  border: 1px solid ${props => props.status === 'pending' ? 'rgba(234, 179, 8, 0.5)' : props.status === 'suspended' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(255, 255, 255, 0.05)'};
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(12px);

  ${props => props.status === 'pending' && `
    border-left: 4px solid #facc15;
  `}

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3);
  }
`;

const OrgHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const OrgName = styled.h3`
  margin: 0;
  font-size: 1.25rem;
  color: #f8fafc;
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const PlanBadge = styled.span<{ plan: string }>`
  background: ${props => props.plan === 'pro' ? 'rgba(56, 189, 248, 0.2)' : props.plan === 'enterprise' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(74, 222, 128, 0.2)'};
  color: ${props => props.plan === 'pro' ? '#38bdf8' : props.plan === 'enterprise' ? '#f43f5e' : '#4ade80'};
  border: 1px solid ${props => props.plan === 'pro' ? 'rgba(56, 189, 248, 0.5)' : props.plan === 'enterprise' ? 'rgba(244, 63, 94, 0.5)' : 'rgba(74, 222, 128, 0.5)'};
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  flex-shrink: 0;
  margin-left: 0.5rem;
`;

const StatusBadge = styled.span<{ status: string }>`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  background: ${props => props.status === 'active' ? 'rgba(74, 222, 128, 0.2)' : props.status === 'pending' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(239, 68, 68, 0.2)'};
  color: ${props => props.status === 'active' ? '#4ade80' : props.status === 'pending' ? '#facc15' : '#f87171'};
  border: 1px solid ${props => props.status === 'active' ? 'rgba(74, 222, 128, 0.5)' : props.status === 'pending' ? 'rgba(234, 179, 8, 0.5)' : 'rgba(239, 68, 68, 0.5)'};
  margin-top: 0.5rem;
`;

const ActionButton = styled.button`
  background: rgba(168, 85, 247, 0.2);
  color: #d8b4fe;
  border: 1px solid rgba(168, 85, 247, 0.5);
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  backdrop-filter: blur(8px);
  transition: all 0.2s;

  &:hover {
    background: rgba(168, 85, 247, 0.3);
    box-shadow: 0 4px 6px rgba(0,0,0,0.2);
  }
`;

const CardActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 1rem;
`;

const SmallBtn = styled.button<{ variant: 'success' | 'danger' | 'neutral' }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s;

  background: ${props => props.variant === 'success' ? 'rgba(74, 222, 128, 0.2)' : props.variant === 'danger' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(100, 116, 139, 0.2)'};
  color: ${props => props.variant === 'success' ? '#4ade80' : props.variant === 'danger' ? '#f87171' : '#cbd5e1'};
  border: 1px solid ${props => props.variant === 'success' ? 'rgba(74, 222, 128, 0.5)' : props.variant === 'danger' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(100, 116, 139, 0.5)'};

  &:hover {
    background: ${props => props.variant === 'success' ? 'rgba(74, 222, 128, 0.3)' : props.variant === 'danger' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(100, 116, 139, 0.3)'};
  }
`;

const SearchInput = styled.input`
  padding: 0.75rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  width: 300px;
  font-size: 1rem;
  margin-bottom: 2rem;
  background: rgba(30, 41, 59, 0.5);
  color: #f8fafc;
  
  &:focus {
    outline: none;
    border-color: rgba(168, 85, 247, 0.5);
    box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1);
  }
  
  &::placeholder {
    color: #64748b;
  }
`;

interface OrgWithStats extends Organization {
    member_count?: number;
}

const ClientManagement: React.FC = () => {
    const [orgs, setOrgs] = useState<OrgWithStats[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'active' | 'pending' | 'suspended' | 'all'>('active');
    const [searchTerm, setSearchTerm] = useState('');

    // Modal de Confirmación de Borrado
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean, orgId: string | null, orgName: string }>({
        isOpen: false,
        orgId: null,
        orgName: ''
    });

    // Modal de Confirmación de Cambio de Estado
    const [statusModal, setStatusModal] = useState<{ isOpen: boolean, orgId: string | null, newStatus: 'active' | 'suspended' | null, confirmMsg: string }>({
        isOpen: false,
        orgId: null,
        newStatus: null,
        confirmMsg: ''
    });

    useEffect(() => {
        fetchOrgs();
    }, []);

    const fetchOrgs = async () => {
        setIsLoading(true);
        // Fetch Orgs
        const { data: orgData, error } = await supabase
            .from('organizations')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching orgs:', error);
        } else {
            setOrgs(orgData as OrgWithStats[]);
        }
        setIsLoading(false);
    };

    const handleUpdateStatus = (id: string, newStatus: 'active' | 'suspended') => {
        const confirmMsg = newStatus === 'active'
            ? '¿Aprobar esta organización y darle acceso inmediato?'
            : '¿Suspender el acceso a esta organización?';

        setStatusModal({ isOpen: true, orgId: id, newStatus, confirmMsg });
    };

    const executeUpdateStatus = async () => {
        const { orgId, newStatus } = statusModal;
        if (!orgId || !newStatus) return;

        try {
            const { error } = await supabase.from('organizations').update({ status: newStatus }).eq('id', orgId);
            if (error) throw error;
            // Optimistic update
            setOrgs(prev => prev.map(o => o.id === orgId ? { ...o, status: newStatus } : o));
            setStatusModal({ isOpen: false, orgId: null, newStatus: null, confirmMsg: '' });
        } catch (e: any) {
            alert('Error: ' + e.message);
        }
    };

    const handleDelete = (id: string, name: string) => {
        setDeleteModal({ isOpen: true, orgId: id, orgName: name });
    };

    const executeDelete = async () => {
        const { orgId, orgName } = deleteModal;
        if (!orgId) return;

        try {
            const { error } = await supabase.from('organizations').delete().eq('id', orgId);
            if (error) throw error;
            setOrgs(prev => prev.filter(o => o.id !== orgId));
            setDeleteModal({ isOpen: false, orgId: null, orgName: '' });
        } catch (e: any) {
            alert('Error eliminando:' + e.message);
        }
    };

    // Derived state
    const filteredOrgs = orgs.filter(org => {
        const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            org.id.includes(searchTerm) ||
            org.owner_email?.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        if (activeTab === 'all') return true;
        return (org.status || 'pending') === activeTab;
    });

    const pendingCount = orgs.filter(o => (o.status || 'pending') === 'pending').length;
    const activeCount = orgs.filter(o => o.status === 'active').length;

    return (
        <Container>
            <Header>
                <Title>
                    <FaUsers /> Gestión de Clientes
                </Title>
                <ActionButton onClick={() => setShowModal(true)}>
                    <FaPlus /> Nueva Organización
                </ActionButton>
            </Header>

            <StatsGrid>
                <StatCard>
                    <h3>Total Organizaciones</h3>
                    <div className="value">{orgs.length}</div>
                </StatCard>
                <StatCard style={{ borderLeft: '4px solid #48bb78' }}>
                    <h3>Activas</h3>
                    <div className="value">{activeCount}</div>
                </StatCard>
                <StatCard style={{ borderLeft: '4px solid #ecc94b' }}>
                    <h3>Solicitudes Pendientes</h3>
                    <div className="value" style={{ color: pendingCount > 0 ? '#d69e2e' : 'inherit' }}>{pendingCount}</div>
                </StatCard>
            </StatsGrid>

            {/* Warning if pending items exist */}
            {pendingCount > 0 && (
                <div style={{ background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)', borderLeft: '4px solid #facc15', padding: '1rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', borderRadius: '0.5rem', backdropFilter: 'blur(8px)' }}>
                    <FaClock style={{ fontSize: '1.5rem', color: '#facc15' }} />
                    <div>
                        <strong style={{ color: '#f8fafc' }}>Tienes {pendingCount} solicitud(es) pendiente(s).</strong>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#fde047' }}>Revisa la pestaña "Pendientes" para aprobar los accesos.</p>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <Tabs>
                    <Tab active={activeTab === 'active'} onClick={() => setActiveTab('active')}>
                        Activas ({activeCount})
                    </Tab>
                    <Tab active={activeTab === 'pending'} onClick={() => setActiveTab('pending')}>
                        Pendientes ({pendingCount})
                    </Tab>
                    <Tab active={activeTab === 'suspended'} onClick={() => setActiveTab('suspended')}>
                        Suspendidas
                    </Tab>
                    <Tab active={activeTab === 'all'} onClick={() => setActiveTab('all')}>
                        Todas
                    </Tab>
                </Tabs>

                <SearchInput
                    placeholder="Buscar por nombre, ID o email..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {isLoading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', animation: 'fadeIn 0.3s ease-out' }}>Cargando datos del sistema...</div>
            ) : filteredOrgs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(30, 41, 59, 0.4)', borderRadius: '8px', color: '#94a3b8', border: '1px dashed rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(8px)', animation: 'fadeIn 0.3s ease-out' }}>
                    No se encontraron organizaciones en esta categoría.
                </div>
            ) : (
                <CardGrid key={activeTab}>
                    {filteredOrgs.map(org => (
                        <OrgCard key={org.id} status={org.status || 'pending'}>
                            <OrgHeader>
                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <OrgName title={org.name}>{org.name}</OrgName>
                                        <PlanBadge plan={org.plan || 'free'}>{org.plan || 'Free'}</PlanBadge>
                                    </div>

                                    <small style={{ color: '#64748b', display: 'block', marginTop: '0.25rem' }}>ID: {org.id.substring(0, 8)}...</small>
                                    {org.owner_email && <small style={{ color: '#cbd5e1', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>Owner: {org.owner_email}</small>}
                                    <StatusBadge status={org.status || 'pending'}>{org.status || 'Pendiente'}</StatusBadge>
                                </div>
                            </OrgHeader>

                            <div style={{ fontSize: '0.875rem', color: '#94a3b8', minHeight: '40px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <FaUsers /> {org.member_count || 0} Usuarios activos
                                </div>
                            </div>

                            <CardActions>
                                {org.status === 'pending' && (
                                    <>
                                        <SmallBtn variant="success" onClick={() => handleUpdateStatus(org.id, 'active')}>
                                            <FaCheck /> Aprobar
                                        </SmallBtn>
                                        <SmallBtn variant="danger" onClick={() => handleDelete(org.id, org.name)}>
                                            <FaTrash /> Rechazar
                                        </SmallBtn>
                                    </>
                                )}

                                {org.status === 'active' && (
                                    <>
                                        <SmallBtn variant="neutral" onClick={() => alert('Próximamente: Gestionar')} title="Gestionar (Próximamente)">
                                            Gestionar
                                        </SmallBtn>
                                        <SmallBtn variant="danger" onClick={() => handleUpdateStatus(org.id, 'suspended')} title="Suspender Acceso">
                                            <FaBan /> Suspender
                                        </SmallBtn>
                                        <SmallBtn variant="danger" onClick={() => handleDelete(org.id, org.name)} title="Eliminar Definitivamente">
                                            <FaTrash /> Eliminar
                                        </SmallBtn>
                                    </>
                                )}

                                {org.status === 'suspended' && (
                                    <>
                                        <SmallBtn variant="success" onClick={() => handleUpdateStatus(org.id, 'active')}>
                                            <FaCheck /> Reactivar
                                        </SmallBtn>
                                        <SmallBtn variant="danger" onClick={() => handleDelete(org.id, org.name)}>
                                            <FaTrash /> Eliminar
                                        </SmallBtn>
                                    </>
                                )}
                            </CardActions>
                        </OrgCard>
                    ))}
                </CardGrid>
            )}

            {showModal && (
                <CreateOrgModal
                    onClose={() => setShowModal(false)}
                    onSuccess={fetchOrgs}
                />
            )}

            <ConfirmModal
                isOpen={deleteModal.isOpen}
                title="Eliminar Definivamente"
                message={`PELIGRO: ¿Estás seguro de eliminar la organización "${deleteModal.orgName}"? Esta acción borrará TODOS los datos asociados (cultivos, salas, genéticas, registros) de forma irreversible.`}
                onConfirm={executeDelete}
                onClose={() => setDeleteModal({ isOpen: false, orgId: null, orgName: '' })}
                isDanger={true}
            />

            <ConfirmModal
                isOpen={statusModal.isOpen}
                title={statusModal.newStatus === 'active' ? "Aprobar Organización" : "Suspender Organización"}
                message={statusModal.confirmMsg}
                onConfirm={executeUpdateStatus}
                onClose={() => setStatusModal({ isOpen: false, orgId: null, newStatus: null, confirmMsg: '' })}
                isDanger={statusModal.newStatus === 'suspended'}
            />
        </Container>
    );
};

export default ClientManagement;
