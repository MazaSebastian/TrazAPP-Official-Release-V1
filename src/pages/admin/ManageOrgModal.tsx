import React, { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { supabase } from '../../services/supabaseClient';
import { Organization } from '../../types';
import { FaTimes, FaUserSecret, FaServer, FaFileInvoiceDollar, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { ConfirmModal } from '../../components/ConfirmModal';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Overlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  animation: ${fadeIn} 0.2s ease-out;
`;

const ModalPanel = styled.div`
  background: rgba(30, 41, 59, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  animation: ${slideUp} 0.3s ease-out;
  overflow: hidden;
`;

const Header = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(15, 23, 42, 0.5);

  h2 { margin: 0; font-size: 1.5rem; color: #f8fafc; display: flex; align-items: center; gap: 0.5rem; }
  button {
    background: transparent;
    border: none;
    color: #94a3b8;
    font-size: 1.25rem;
    cursor: pointer;
    transition: color 0.2s;
    &:hover { color: #f87171; }
  }
`;

const Tabs = styled.div`
  display: flex;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(15, 23, 42, 0.3);
`;

const Tab = styled.button<{ $active: boolean }>`
  flex: 1;
  background: ${props => props.$active ? 'rgba(255, 255, 255, 0.05)' : 'transparent'};
  border: none;
  border-bottom: 2px solid ${props => props.$active ? '#c084fc' : 'transparent'};
  color: ${props => props.$active ? '#c084fc' : '#94a3b8'};
  padding: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s;
  
  &:hover {
    color: ${props => props.$active ? '#c084fc' : '#f8fafc'};
    background: rgba(255, 255, 255, 0.02);
  }
`;

const Content = styled.div`
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
  color: #e2e8f0;
`;

const SectionTitle = styled.h3`
  font-size: 1.1rem;
  color: #f8fafc;
  margin-top: 0;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding-bottom: 0.5rem;
`;

const ActionCard = styled.div`
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Button = styled.button<{ $variant?: 'primary' | 'danger' | 'warning' }>`
  background: ${props =>
        props.$variant === 'primary' ? 'rgba(168, 85, 247, 0.2)' :
            props.$variant === 'danger' ? 'rgba(239, 68, 68, 0.2)' :
                props.$variant === 'warning' ? 'rgba(245, 158, 11, 0.2)' :
                    'rgba(255, 255, 255, 0.05)'};
  color: ${props =>
        props.$variant === 'primary' ? '#d8b4fe' :
            props.$variant === 'danger' ? '#fca5a5' :
                props.$variant === 'warning' ? '#fcd34d' :
                    '#f8fafc'};
  border: 1px solid ${props =>
        props.$variant === 'primary' ? 'rgba(168, 85, 247, 0.5)' :
            props.$variant === 'danger' ? 'rgba(239, 68, 68, 0.5)' :
                props.$variant === 'warning' ? 'rgba(245, 158, 11, 0.5)' :
                    'rgba(255, 255, 255, 0.1)'};
  padding: 0.75rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    background: ${props =>
        props.$variant === 'primary' ? 'rgba(168, 85, 247, 0.4)' :
            props.$variant === 'danger' ? 'rgba(239, 68, 68, 0.4)' :
                props.$variant === 'warning' ? 'rgba(245, 158, 11, 0.4)' :
                    'rgba(255, 255, 255, 0.1)'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StyledSelect = styled.select`
  width: 100%;
  padding: 0.875rem 1rem;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #f8fafc;
  border-radius: 0.5rem;
  font-size: 0.95rem;
  font-family: inherit;
  font-weight: 500;
  outline: none;
  transition: all 0.2s ease;
  backdrop-filter: blur(8px);
  appearance: none; /* Removes native dropdown arrow for custom styling if needed, though default works on Mac */

  &:focus {
    border-color: #c084fc;
    box-shadow: 0 0 0 2px rgba(192, 132, 252, 0.2);
    background: rgba(15, 23, 42, 0.8);
  }

  option {
    background: #0f172a; /* Solid dark background for options to be readable */
    color: #f8fafc;
    padding: 0.5rem;
  }
`;

const StyledInput = styled.input`
  width: 100%;
  padding: 0.875rem 1rem;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #f8fafc;
  border-radius: 0.5rem;
  font-size: 0.95rem;
  font-family: inherit;
  font-weight: 500;
  outline: none;
  transition: all 0.2s ease;
  backdrop-filter: blur(8px);

  &:focus {
    border-color: #c084fc;
    box-shadow: 0 0 0 2px rgba(192, 132, 252, 0.2);
    background: rgba(15, 23, 42, 0.8);
  }

  &::-webkit-calendar-picker-indicator {
    filter: invert(1);
    opacity: 0.6;
    cursor: pointer;
    &:hover { opacity: 1; }
  }
`;

const ProgressBarContainer = styled.div`
  background: rgba(15, 23, 42, 0.4);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: 1.5rem;
  margin-bottom: 1rem;
`;

const ProgressInfo = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  color: #f8fafc;
`;

const ProgressTrack = styled.div`
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ $percent: number; $color: string }>`
  height: 100%;
  width: ${props => props.$percent}%;
  background: ${props => props.$color};
  border-radius: 4px;
  transition: width 0.5s ease;
`;

interface ResourceStats {
    users: number;
    crops: number;
    batches: number;
}

const PLAN_LIMITS: Record<string, ResourceStats> = {
    demo: { users: 1, crops: 1, batches: 15 },
    individual: { users: 1, crops: 1, batches: 25 },
    equipo: { users: 3, crops: 3, batches: 50 },
    ong: { users: 6, crops: 4, batches: 500 },
    trazapp: { users: 10, crops: 8, batches: Infinity } // Growy + Ilimitado en Lotes
};

interface ManageOrgModalProps {
    organization: Organization;
    onClose: () => void;
    onUpdate: () => void;
}

export const ManageOrgModal: React.FC<ManageOrgModalProps> = ({ organization, onClose, onUpdate }) => {
    const [activeTab, setActiveTab] = useState<'general' | 'recursos' | 'facturacion'>('general');
    const { user } = useAuth();
    const [isImpersonating, setIsImpersonating] = useState(false);
    const [stats, setStats] = useState<ResourceStats>({ users: 0, crops: 0, batches: 0 });
    const [isStatsLoading, setIsStatsLoading] = useState(false);
    const [confirmImpersonate, setConfirmImpersonate] = useState(false);

    // Billing Edit State
    const [billingForm, setBillingForm] = useState(() => {
        let defaultValidUntil = '';
        if (organization.valid_until) {
            defaultValidUntil = organization.valid_until.split('T')[0];
        } else if (organization.created_at) {
            // Calculate 30 days from creation date if valid_until is missing
            const created = new Date(organization.created_at);
            created.setDate(created.getDate() + (organization.plan === 'demo' ? 15 : 30));
            defaultValidUntil = created.toISOString().split('T')[0];
        }

        return {
            plan: organization.plan || 'demo',
            valid_until: defaultValidUntil,
            is_revenue_exempt: organization.is_revenue_exempt || false
        };
    });
    const [isSavingBilling, setIsSavingBilling] = useState(false);

    // Impersonation feature: Super Admin enters the Org as 'owner' temporarily.
    const handleImpersonateClick = () => {
        if (!user?.id) return;
        setConfirmImpersonate(true);
    };

    const executeImpersonate = async () => {
        setIsImpersonating(true);
        try {
            // 1. Check if we already have a record
            const { data: existing } = await supabase
                .from('organization_members')
                .select('id')
                .eq('organization_id', organization.id)
                .eq('user_id', user!.id)
                .single();

            if (!existing) {
                // Add super admin as owner temporarily
                await supabase.from('organization_members').insert({
                    organization_id: organization.id,
                    user_id: user!.id,
                    role: 'owner'
                });
            }

            // 2. Set the client org as active in local storage
            localStorage.setItem('selectedOrganizationId', organization.id);

            // 3. Force page reload to route to dashboard under new context
            window.location.href = '/dashboard';

        } catch (e: any) {
            alert("Error al impersonar: " + e.message);
            setIsImpersonating(false);
            setConfirmImpersonate(false);
        }
    };

    const handleUpdateBilling = async () => {
        setIsSavingBilling(true);
        try {
            const payload: any = { 
                plan: billingForm.plan,
                is_revenue_exempt: billingForm.is_revenue_exempt 
            };
            if (billingForm.valid_until) {
                payload.valid_until = `${billingForm.valid_until}T23:59:59Z`;
            } else {
                payload.valid_until = null;
            }

            const { error } = await supabase
                .from('organizations')
                .update(payload)
                .eq('id', organization.id);

            if (error) throw error;

            alert("Configuración de facturación guardada exitosamente.");
            onUpdate(); // Trigger refresh in parent
        } catch (e: any) {
            alert("Error al guardar facturación: " + e.message);
        } finally {
            setIsSavingBilling(false);
        }
    };

    // Fetch actual resource limits
    useEffect(() => {
        if (activeTab === 'recursos') {
            const fetchStats = async () => {
                setIsStatsLoading(true);
                try {
                    // Count Users
                    const { count: usersCount } = await supabase
                        .from('organization_members')
                        .select('*', { count: 'exact', head: true })
                        .eq('organization_id', organization.id);

                    // Count Crops
                    const { count: cropsCount } = await supabase
                        .from('crops')
                        .select('*', { count: 'exact', head: true })
                        .eq('organization_id', organization.id);

                    // Count Active Batches
                    const { count: batchesCount } = await supabase
                        .from('batches')
                        .select('*', { count: 'exact', head: true })
                        .eq('organization_id', organization.id)
                        .neq('lifecycle_stage', 'archived')
                        .neq('lifecycle_stage', 'dead');

                    setStats({
                        users: usersCount || 0,
                        crops: cropsCount || 0,
                        batches: batchesCount || 0
                    });
                } catch (e) {
                    console.error("Error fetching quota stats: ", e);
                } finally {
                    setIsStatsLoading(false);
                }
            };

            fetchStats();
        }
    }, [activeTab, organization.id]);

    return (
        <Overlay>
            <ModalPanel>
                <Header>
                    <h2>Gestión de Cliente: {organization.name}</h2>
                    <button onClick={onClose}><FaTimes /></button>
                </Header>

                <Tabs>
                    <Tab $active={activeTab === 'general'} onClick={() => setActiveTab('general')}>
                        <FaUserSecret /> General y Soporte
                    </Tab>
                    <Tab $active={activeTab === 'recursos'} onClick={() => setActiveTab('recursos')}>
                        <FaServer /> Uso de Límites
                    </Tab>
                    <Tab $active={activeTab === 'facturacion'} onClick={() => setActiveTab('facturacion')}>
                        <FaFileInvoiceDollar /> Plan y Vencimientos
                    </Tab>
                </Tabs>

                <Content>
                    {activeTab === 'general' && (
                        <div>
                            <SectionTitle><FaUserSecret /> Impersonation & Soporte TrazAPP</SectionTitle>
                            <ActionCard>
                                <p style={{ margin: 0, color: '#94a3b8', lineHeight: 1.5 }}>
                                    Utiliza la herramienta de "Impersonation" para iniciar sesión en la cuenta de <strong style={{ color: '#f8fafc' }}>{organization.name}</strong>.
                                    Esto te permitirá ver su Dashboard, agregar lotes o visualizar problemas como si fueras el administrador de esa organización.
                                </p>
                                <Button
                                    $variant="primary"
                                    onClick={handleImpersonateClick}
                                    disabled={isImpersonating}
                                >
                                    <FaUserSecret /> {isImpersonating ? "Entrando..." : "Entrar como este Cliente"}
                                </Button>
                            </ActionCard>

                            <SectionTitle style={{ marginTop: '2rem' }}>Información Base</SectionTitle>
                            <ActionCard style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <small style={{ color: '#64748b' }}>Dueño Original</small>
                                    <div style={{ fontWeight: 600 }}>{organization.owner_email || 'No asignado'}</div>
                                </div>
                                <div>
                                    <small style={{ color: '#64748b' }}>Creado el</small>
                                    <div style={{ fontWeight: 600 }}>{new Date(organization.created_at).toLocaleDateString()}</div>
                                </div>
                                <div>
                                    <small style={{ color: '#64748b' }}>ID Interno</small>
                                    <div style={{ fontWeight: 600, fontSize: '0.8rem', opacity: 0.8 }}>{organization.id}</div>
                                </div>
                            </ActionCard>
                        </div>
                    )}

                    {activeTab === 'recursos' && (
                        <div>
                            <SectionTitle><FaServer /> Consumo de Límites del Plan ({organization.plan?.toUpperCase() || 'FREE'})</SectionTitle>

                            {isStatsLoading ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Analizando consumo de datos en tiempo real...</div>
                            ) : (
                                <>
                                    <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                                        Si una organización supera enormemente estos límites, contactalos para ofrecerles un {organization.plan !== 'trazapp' ? 'Upgrade' : 'Plan Especial'}.
                                    </p>

                                    {(() => {
                                        const planType = organization.plan || 'demo';
                                        const limits = PLAN_LIMITS[planType] || PLAN_LIMITS['demo'];

                                        const calculateCol = (current: number, limit: number) => {
                                            if (limit === Infinity) return '#4ade80'; // Siempre verde si es ilimitado
                                            const pct = (current / limit) * 100;
                                            if (pct >= 95) return '#ef4444'; // Red
                                            if (pct >= 80) return '#eab308'; // Yellow
                                            return '#4299e1'; // Blue
                                        };

                                        const renderBar = (label: string, current: number, limit: number) => {
                                            const isUnlimited = limit === Infinity;
                                            let displayLimit = isUnlimited ? '∞ Ilimitado' : limit.toLocaleString();
                                            let pct = isUnlimited ? 100 : Math.min(100, Math.max(0, (current / limit) * 100));

                                            return (
                                                <ProgressBarContainer>
                                                    <ProgressInfo>
                                                        <strong>{label}</strong>
                                                        <span>{current.toLocaleString()} / {displayLimit} {isUnlimited ? '' : `(${(current / limit * 100).toFixed(0)}%)`}</span>
                                                    </ProgressInfo>
                                                    <ProgressTrack>
                                                        <ProgressFill $percent={pct} $color={calculateCol(current, limit)} />
                                                    </ProgressTrack>
                                                </ProgressBarContainer>
                                            );
                                        };

                                        return (
                                            <>
                                                {renderBar("Usuarios Colaboradores Activos", stats.users, limits.users)}
                                                {renderBar("Cultivos / Zonas Abiertas", stats.crops, limits.crops)}
                                                {renderBar("Lotes de Plantas (Vivos)", stats.batches, limits.batches)}
                                            </>
                                        );
                                    })()}
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === 'facturacion' && (
                        <div>
                            <SectionTitle><FaFileInvoiceDollar /> Sobreescritura de Plan y Facturación</SectionTitle>
                            <ActionCard>
                                <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.875rem' }}>
                                    Ajusta manualmente el nivel de suscripción y su fecha de corte. Útil para pagos en efectivo, transferencias directas, o cortesías comerciales.
                                </p>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                                    <label style={{ color: '#cbd5e1', fontSize: '0.875rem', fontWeight: 600 }}>Plan de la Cuenta</label>
                                    <div style={{ position: 'relative' }}>
                                        <StyledSelect
                                            value={billingForm.plan}
                                            onChange={(e) => setBillingForm({ ...billingForm, plan: e.target.value })}
                                        >
                                            <option value="demo">Demo (15 Días)</option>
                                            <option value="individual">Individual</option>
                                            <option value="equipo">Equipo (3 Usuarios)</option>
                                            <option value="ong">ONG/Club (ONG de la Salud)</option>
                                            <option value="trazapp">TrazAPP (Full)</option>
                                        </StyledSelect>
                                        <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8' }}>
                                            ▼
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ color: '#cbd5e1', fontSize: '0.875rem', fontWeight: 600 }}>Fecha de Corte / Vencimiento</label>
                                    <StyledInput
                                        type="date"
                                        value={billingForm.valid_until}
                                        onChange={(e) => setBillingForm({ ...billingForm, valid_until: e.target.value })}
                                    />
                                    <small style={{ color: '#64748b' }}>Dejar en blanco para acceso vitalicio sin cortes.</small>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem', background: 'rgba(15, 23, 42, 0.4)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                    <input 
                                        type="checkbox" 
                                        id="exempt_revenue"
                                        checked={billingForm.is_revenue_exempt}
                                        onChange={(e) => setBillingForm({ ...billingForm, is_revenue_exempt: e.target.checked })}
                                        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#c084fc' }}
                                    />
                                    <label htmlFor="exempt_revenue" style={{ color: '#e2e8f0', fontSize: '0.9rem', cursor: 'pointer', userSelect: 'none' }}>
                                        <strong>Eximir del MRR</strong> <br/>
                                        <small style={{ color: '#94a3b8' }}>Este cliente no sumará a la métrica de Ingresos Mensuales Estimados.</small>
                                    </label>
                                </div>

                                <Button
                                    $variant="warning"
                                    onClick={handleUpdateBilling}
                                    disabled={isSavingBilling}
                                    style={{ marginTop: '1rem', alignSelf: 'flex-end' }}
                                >
                                    <FaCheckCircle /> {isSavingBilling ? 'Guardando...' : 'Aplicar Cambios Manuales'}
                                </Button>
                            </ActionCard>
                        </div>
                    )}
                </Content>
            </ModalPanel>

            <ConfirmModal
                isOpen={confirmImpersonate}
                title="Iniciar Sesión como Cliente"
                message={`ATENCIÓN: Vas a iniciar sesión dentro de la organización "${organization.name}". Tendrás control total. ¿Estás seguro?`}
                onConfirm={executeImpersonate}
                onClose={() => setConfirmImpersonate(false)}
                isDanger={false}
            />
        </Overlay>
    );
};
