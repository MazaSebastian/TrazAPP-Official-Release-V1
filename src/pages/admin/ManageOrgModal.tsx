import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { supabase } from '../../services/supabaseClient';
import { Organization } from '../../types';
import { 
    X as LucideX, 
    UserCheck, 
    Server, 
    Receipt, 
    CheckCircle2, 
    Building2, 
    ShieldAlert
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ConfirmModal } from '../../components/ConfirmModal';
import { ShadcnButton } from '../../components/ui/Button';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(12px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  animation: ${fadeIn} 0.2s ease-out;
`;

const ModalPanel = styled.div`
  background: rgba(15, 23, 42, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1.25rem;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  animation: ${slideUp} 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
`;

const Header = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(30, 41, 59, 0.4);

  .title-group {
    display: flex;
    align-items: center;
    gap: 0.75rem;

    .icon-box {
      width: 40px;
      height: 40px;
      border-radius: 0.65rem;
      background: rgba(168, 85, 247, 0.15);
      border: 1px solid rgba(168, 85, 247, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    h2 { 
      margin: 0; 
      font-size: 1.25rem; 
      font-weight: 700;
      color: #f8fafc; 
    }
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover {
    color: #f1f5f9;
    background: rgba(255, 255, 255, 0.08);
  }
`;

const Tabs = styled.div`
  display: flex;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(15, 23, 42, 0.5);
`;

const Tab = styled.button<{ $active: boolean }>`
  flex: 1;
  background: ${props => props.$active ? 'rgba(168, 85, 247, 0.1)' : 'transparent'};
  border: none;
  border-bottom: 2px solid ${props => props.$active ? '#c084fc' : 'transparent'};
  color: ${props => props.$active ? '#d8b4fe' : '#94a3b8'};
  padding: 0.85rem 1rem;
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s;
  
  &:hover {
    color: ${props => props.$active ? '#d8b4fe' : '#f8fafc'};
    background: ${props => props.$active ? 'rgba(168, 85, 247, 0.12)' : 'rgba(255, 255, 255, 0.03)'};
  }
`;

const Content = styled.div`
  padding: 1.75rem;
  overflow-y: auto;
  flex: 1;
  color: #e2e8f0;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 3px;
  }
`;

const SectionTitle = styled.h3`
  font-size: 1.05rem;
  font-weight: 700;
  color: #f8fafc;
  margin-top: 0;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  padding-bottom: 0.5rem;
`;

const ActionCard = styled.div`
  background: rgba(30, 41, 59, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.85rem;
  padding: 1.35rem;
  margin-bottom: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const StyledSelect = styled.select`
  width: 100%;
  padding: 0.75rem 1rem;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #f8fafc;
  border-radius: 0.65rem;
  font-size: 0.95rem;
  outline: none;
  transition: all 0.2s ease;

  &:focus {
    border-color: rgba(168, 85, 247, 0.5);
    box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.2);
  }

  option {
    background: #0f172a;
    color: #f8fafc;
  }
`;

const StyledInput = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #f8fafc;
  border-radius: 0.65rem;
  font-size: 0.95rem;
  outline: none;
  box-sizing: border-box;
  transition: all 0.2s ease;

  &:focus {
    border-color: rgba(168, 85, 247, 0.5);
    box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.2);
  }

  &::-webkit-calendar-picker-indicator {
    filter: invert(1);
    opacity: 0.6;
    cursor: pointer;
    &:hover { opacity: 1; }
  }
`;

const ProgressBarContainer = styled.div`
  background: rgba(30, 41, 59, 0.35);
  border-radius: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 1.25rem;
  margin-bottom: 1rem;
`;

const ProgressInfo = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
  color: #f8fafc;
`;

const ProgressTrack = styled.div`
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.08);
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
    ong: { users: 10, crops: 10, batches: 200 },
    trazapp: { users: Infinity, crops: Infinity, batches: Infinity }
};

interface ManageOrgModalProps {
    organization: Organization;
    onClose: () => void;
    onUpdate: () => void;
}

export const ManageOrgModal: React.FC<ManageOrgModalProps> = ({ organization, onClose, onUpdate }) => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'general' | 'recursos' | 'facturacion'>('general');

    // Impersonate state
    const [confirmImpersonate, setConfirmImpersonate] = useState(false);
    const [isImpersonating, setIsImpersonating] = useState(false);

    // Resources state
    const [stats, setStats] = useState<ResourceStats>({ users: 0, crops: 0, batches: 0 });
    const [isStatsLoading, setIsStatsLoading] = useState(false);

    // Billing override state
    const [billingForm, setBillingForm] = useState({
        plan: organization.plan || 'demo',
        valid_until: organization.valid_until ? organization.valid_until.split('T')[0] : '',
        is_revenue_exempt: organization.is_revenue_exempt || false
    });
    const [isSavingBilling, setIsSavingBilling] = useState(false);

    const handleImpersonateClick = () => {
        if (!user?.id) return;
        setConfirmImpersonate(true);
    };

    const executeImpersonate = async () => {
        setIsImpersonating(true);
        try {
            const { data: existing } = await supabase
                .from('organization_members')
                .select('id')
                .eq('organization_id', organization.id)
                .eq('user_id', user!.id)
                .single();

            if (!existing) {
                await supabase.from('organization_members').insert({
                    organization_id: organization.id,
                    user_id: user!.id,
                    role: 'owner'
                });
            }

            localStorage.setItem('selectedOrganizationId', organization.id);
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
            onUpdate();
        } catch (e: any) {
            alert("Error al guardar facturación: " + e.message);
        } finally {
            setIsSavingBilling(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'recursos') {
            const fetchStats = async () => {
                setIsStatsLoading(true);
                try {
                    const { count: usersCount } = await supabase
                        .from('organization_members')
                        .select('*', { count: 'exact', head: true })
                        .eq('organization_id', organization.id);

                    const { count: cropsCount } = await supabase
                        .from('crops')
                        .select('*', { count: 'exact', head: true })
                        .eq('organization_id', organization.id);

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
                    <div className="title-group">
                        <div className="icon-box">
                            <Building2 size={20} color="#c084fc" />
                        </div>
                        <h2>Gestión de Cliente: {organization.name}</h2>
                    </div>
                    <CloseButton onClick={onClose} aria-label="Cerrar">
                        <LucideX size={20} />
                    </CloseButton>
                </Header>

                <Tabs>
                    <Tab $active={activeTab === 'general'} onClick={() => setActiveTab('general')}>
                        <UserCheck size={16} /> General y Soporte
                    </Tab>
                    <Tab $active={activeTab === 'recursos'} onClick={() => setActiveTab('recursos')}>
                        <Server size={16} /> Uso de Límites
                    </Tab>
                    <Tab $active={activeTab === 'facturacion'} onClick={() => setActiveTab('facturacion')}>
                        <Receipt size={16} /> Plan y Vencimientos
                    </Tab>
                </Tabs>

                <Content>
                    {activeTab === 'general' && (
                        <div>
                            <SectionTitle><ShieldAlert size={18} color="#c084fc" /> Impersonation & Soporte TrazAPP</SectionTitle>
                            <ActionCard>
                                <p style={{ margin: 0, color: '#94a3b8', lineHeight: 1.5, fontSize: '0.9rem' }}>
                                    Utiliza la herramienta de "Impersonation" para iniciar sesión en la cuenta de <strong style={{ color: '#f8fafc' }}>{organization.name}</strong>.
                                    Esto te permitirá ver su Dashboard, agregar lotes o visualizar problemas como si fueras el administrador de esa organización.
                                </p>
                                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                                    <ShadcnButton
                                        variant="default"
                                        onClick={handleImpersonateClick}
                                        isLoading={isImpersonating}
                                    >
                                        <UserCheck size={16} /> {isImpersonating ? "Entrando..." : "Entrar como este Cliente"}
                                    </ShadcnButton>
                                </div>
                            </ActionCard>

                            <SectionTitle style={{ marginTop: '2rem' }}>Información Base</SectionTitle>
                            <ActionCard style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                <div>
                                    <small style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Dueño Original</small>
                                    <div style={{ fontWeight: 600, color: '#f8fafc', marginTop: '0.2rem' }}>{organization.owner_email || 'No asignado'}</div>
                                </div>
                                <div>
                                    <small style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Creado el</small>
                                    <div style={{ fontWeight: 600, color: '#f8fafc', marginTop: '0.2rem' }}>{new Date(organization.created_at).toLocaleDateString()}</div>
                                </div>
                                <div>
                                    <small style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>ID Interno</small>
                                    <div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#94a3b8', fontFamily: 'monospace', marginTop: '0.2rem' }}>{organization.id}</div>
                                </div>
                            </ActionCard>
                        </div>
                    )}

                    {activeTab === 'recursos' && (
                        <div>
                            <SectionTitle><Server size={18} color="#60a5fa" /> Consumo de Límites del Plan ({organization.plan?.toUpperCase() || 'FREE'})</SectionTitle>

                            {isStatsLoading ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Analizando consumo de datos en tiempo real...</div>
                            ) : (
                                <>
                                    <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                                        Si una organización supera ampliamente estos límites, puedes contactarla para ofrecerle un {organization.plan !== 'trazapp' ? 'Upgrade' : 'Plan Especial'}.
                                    </p>

                                    {(() => {
                                        const planType = organization.plan || 'demo';
                                        const limits = PLAN_LIMITS[planType] || PLAN_LIMITS['demo'];

                                        const calculateCol = (current: number, limit: number) => {
                                            if (limit === Infinity) return '#34d399';
                                            const pct = (current / limit) * 100;
                                            if (pct >= 95) return '#ef4444';
                                            if (pct >= 80) return '#f59e0b';
                                            return '#3b82f6';
                                        };

                                        const renderBar = (label: string, current: number, limit: number) => {
                                            const isUnlimited = limit === Infinity;
                                            let displayLimit = isUnlimited ? '∞ Ilimitado' : limit.toLocaleString();
                                            let pct = isUnlimited ? 100 : Math.min(100, Math.max(0, (current / limit) * 100));

                                            return (
                                                <ProgressBarContainer key={label}>
                                                    <ProgressInfo>
                                                        <strong>{label}</strong>
                                                        <span style={{ color: '#94a3b8' }}>
                                                            {current.toLocaleString()} / {displayLimit} {isUnlimited ? '' : `(${(current / limit * 100).toFixed(0)}%)`}
                                                        </span>
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
                            <SectionTitle><Receipt size={18} color="#f59e0b" /> Sobreescritura de Plan y Facturación</SectionTitle>
                            <ActionCard>
                                <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.875rem' }}>
                                    Ajusta manualmente el nivel de suscripción y su fecha de corte. Útil para pagos en efectivo, transferencias directas o cortesías comerciales.
                                </p>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginTop: '0.5rem' }}>
                                    <label style={{ color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 600 }}>Plan de la Cuenta</label>
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
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                                    <label style={{ color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 600 }}>Fecha de Corte / Vencimiento</label>
                                    <StyledInput
                                        type="date"
                                        value={billingForm.valid_until}
                                        onChange={(e) => setBillingForm({ ...billingForm, valid_until: e.target.value })}
                                    />
                                    <small style={{ color: '#64748b' }}>Dejar en blanco para acceso vitalicio sin cortes.</small>
                                </div>

                                <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '0.75rem', 
                                    marginTop: '0.5rem', 
                                    background: 'rgba(15, 23, 42, 0.4)', 
                                    padding: '1rem', 
                                    borderRadius: '0.65rem', 
                                    border: '1px solid rgba(255, 255, 255, 0.05)' 
                                }}>
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

                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                                    <ShadcnButton
                                        variant="default"
                                        onClick={handleUpdateBilling}
                                        isLoading={isSavingBilling}
                                    >
                                        <CheckCircle2 size={16} /> {isSavingBilling ? 'Guardando...' : 'Aplicar Cambios Manuales'}
                                    </ShadcnButton>
                                </div>
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
