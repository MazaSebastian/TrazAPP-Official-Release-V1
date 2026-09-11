import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { PackageCheck, Package, QrCode, Edit3, Trash2, Printer, Plus, AlertCircle } from 'lucide-react';
import QRCode from 'react-qr-code';
import { dispensaryService, DispensaryBatch } from '../services/dispensaryService';
import { patientsService } from '../services/patientsService';
import { geneticsService } from '../services/geneticsService';
import { Genetic } from '../types/genetics';
import { Tooltip } from '../components/Tooltip';
import { CustomSelect } from '../components/CustomSelect';
import { ConfirmModal } from '../components/ConfirmModal';
import { EditDispensaryModal } from '../components/EditDispensaryModal';
import { CreateDispensaryProductModal } from '../components/CreateDispensaryProductModal';
import { useOrganization } from '../context/OrganizationContext';
import { StockLabel } from '../components/StockLabel';
import { useReactToPrint } from 'react-to-print';
import { useAuth } from '../context/AuthContext';
import { ShadcnButton } from '../components/ui/Button';
import { ShadcnBadge } from '../components/ui/Badge';

// --- Styled Components ---

const TabsContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding-bottom: 0.75rem;
  overflow-x: auto;
  
  &::-webkit-scrollbar {
    height: 4px;
  }
`;

const TabButton = styled.button<{ $isActive: boolean }>`
  background: ${props => props.$isActive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.03)'};
  border: 1px solid ${props => props.$isActive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.06)'};
  padding: 0.6rem 1.25rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: ${props => props.$isActive ? '#10b981' : '#94a3b8'};
  cursor: pointer;
  border-radius: 0.75rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;

  &:hover {
    color: ${props => props.$isActive ? '#10b981' : '#f8fafc'};
    background: ${props => props.$isActive ? 'rgba(16, 185, 129, 0.16)' : 'rgba(255, 255, 255, 0.06)'};
  }
`;

const PageContainer = styled.div`
  padding: 2rem 2.5rem;
  max-width: 1560px;
  margin: 0 auto;
  min-height: 100vh;
  color: #f8fafc;

  @media (max-width: 768px) {
    padding: 1.25rem 1rem;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 2.25rem;
  flex-wrap: wrap;
  gap: 1.25rem;

  h1 {
    font-size: clamp(1.75rem, 3.5vw, 2.5rem);
    font-weight: 800;
    letter-spacing: -0.03em;
    background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.85rem;
  }
`;

const EmptyState = styled.div`
text-align: center;
padding: 4rem 2rem;
color: #94a3b8;
display: flex;
flex-direction: column;
align-items: center;
justify-content: center;
background: rgba(30, 41, 59, 0.5);
backdrop-filter: blur(12px);
border: 1px solid rgba(255, 255, 255, 0.05);
border-radius: 1rem;
  
  .empty-icon {
    font-size: 4rem;
    margin-bottom: 1.5rem;
    background: linear-gradient(135deg, #4ade80 0%, #38bdf8 100%);
    -webkit-background-clip: text;
    -webkit-text - fill-color: transparent;
    opacity: 0.8;
}
  
  h3 {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 0.75rem;
    color: #f8fafc;
}
  
  p {
    margin-bottom: 1.5rem;
    font-size: 1.1rem;
    max-width: 400px;
    line-height: 1.5;
}
`;

const Modal = styled.div<{ isOpen: boolean }>`
position: fixed;
top: 0;
left: 0;
right: 0;
bottom: 0;
background: rgba(15, 23, 42, 0.8);
backdrop-filter: blur(8px);
display: ${props => props.isOpen ? 'flex' : 'none'};
align-items: center;
justify-content: center;
z-index: 2000;
padding: 1rem;
opacity: ${props => props.isOpen ? 1 : 0};
transition: opacity 0.3s ease;
`;

const ModalContent = styled.div`
background: rgba(30, 41, 59, 0.95);
backdrop-filter: blur(16px);
border: 1px solid rgba(255, 255, 255, 0.1);
border-radius: 1rem;
padding: 2.5rem;
width: 100%;
max-width: 500px;
box-shadow: 0 25px 50px - 12px rgba(0, 0, 0, 0.5);
transform: translateY(0);
transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);

@media(max-width: 768px) {
    padding: 1.5rem;
}
  
  h2 {
    margin: 0 0 1.5rem 0;
    font-size: 1.5rem;
    font-weight: 700;
    color: #f8fafc;
    display: flex;
    align-items: center;
    gap: 0.75rem;
}
`;

const FormGroup = styled.div`
display: flex;
flex-direction: column;
gap: 0.5rem;
margin-bottom: 1.5rem;
  
  label {
    font-weight: 600;
    color: #cbd5e1;
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

input, select, textarea {
    padding: 0.875rem 1rem;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.75rem;
    color: #f8fafc;
    font-size: 1rem;
    transition: all 0.2s;
    
    &:focus {
        outline: none;
        border-color: #38bdf8;
        box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2);
    }
    
    &::placeholder {
        color: #64748b;
    }

    option {
        background: #1e293b;
        color: #f8fafc;
    }
}
`;

const ModalActions = styled.div`
display: flex;
gap: 0.75rem;
justify-content: flex-end;
margin-top: 1.5rem;

@media(max-width: 768px) {
    flex-direction: column;
}
`;

const Dispensary: React.FC = () => {
    const { user } = useAuth();
    const { currentOrganization } = useOrganization();
    const [activeTab, setActiveTab] = useState<'flower' | 'oil' | 'cream' | 'edible' | 'extract' | 'other'>('flower');
    const [createModalOpen, setCreateModalOpen] = useState(false);

    const [dispensaryBatches, setDispensaryBatches] = useState<DispensaryBatch[]>([]);
    const [dispenseModalOpen, setDispenseModalOpen] = useState(false);
    const [batchToDispense, setBatchToDispense] = useState<DispensaryBatch | null>(null);
    const [dispenseForm, setDispenseForm] = useState({ amount: '', reason: 'dispensing', memberId: '', transactionValue: '' });
    const [deleteDispensaryModalOpen, setDeleteDispensaryModalOpen] = useState(false);
    const [batchToDeleteDispensary, setBatchToDeleteDispensary] = useState<DispensaryBatch | null>(null);
    const [editDispensaryModalOpen, setEditDispensaryModalOpen] = useState(false);
    const [batchToEditDispensary, setBatchToEditDispensary] = useState<DispensaryBatch | null>(null);

    const [patients, setPatients] = useState<any[]>([]);
    const [consumptionStats, setConsumptionStats] = useState<{ current: number, limit: number } | null>(null);
    const [genetics, setGenetics] = useState<Genetic[]>([]);

    /* QR Code Logic */
    const [qrModalOpen, setQrModalOpen] = useState(false);
    const [qrBatch, setQrBatch] = useState<DispensaryBatch | null>(null);
    const labelPrintRef = React.useRef<HTMLDivElement>(null);
    const handlePrintLabel = useReactToPrint({ contentRef: labelPrintRef });

    const loadPatients = async () => {
        const data = await patientsService.getPatients();
        setPatients(data);
    };

    const loadDispensaryStock = async () => {
        const batches = await dispensaryService.getShopBatches();
        setDispensaryBatches(batches);
    };

    const loadGenetics = async () => {
        const data = await geneticsService.getGenetics();
        setGenetics(data);
    };

    useEffect(() => {
        loadPatients();
        loadDispensaryStock();
        loadGenetics();
    }, []);

    // Check consumption when member is selected
    useEffect(() => {
        if (dispenseForm.memberId && dispenseForm.reason === 'dispensing') {
            patientsService.getPatientConsumption(dispenseForm.memberId).then(setConsumptionStats);
        } else {
            setConsumptionStats(null);
        }
    }, [dispenseForm.memberId, dispenseForm.reason]);

    const handleOpenDispense = (batch: DispensaryBatch) => {
        setBatchToDispense(batch);
        setDispenseForm({ amount: '', reason: 'dispensing', memberId: '', transactionValue: '' });
        setDispenseModalOpen(true);
    };

    const getResolvedPrice = (batch: DispensaryBatch | null): number => {
        if (!batch) return 0;
        const genetic = genetics.find(g => g.name === batch.strain_name);
        if (genetic && genetic.default_price_per_gram) {
            return genetic.default_price_per_gram;
        }
        return 0; // No global price fallback
    };

    const resolvedPrice = getResolvedPrice(batchToDispense);

    const confirmDispense = async () => {
        if (!batchToDispense || !dispenseForm.amount) return;
        const amount = parseFloat(dispenseForm.amount);
        if (isNaN(amount) || amount <= 0 || amount > batchToDispense.current_weight) {
            alert("Cantidad inválida");
            return;
        }

        // Calculate transaction value: user input or fallback to amount * generic price
        const fallbackValue = amount * resolvedPrice;
        let txValue = 0;
        if (dispenseForm.transactionValue !== '') {
            txValue = parseFloat(dispenseForm.transactionValue);
            if (isNaN(txValue) || txValue < 0) {
                alert("Valor de transacción inválido");
                return;
            }
        } else {
            txValue = fallbackValue;
        }

        const success = await dispensaryService.dispense(batchToDispense.id, amount, dispenseForm.reason, dispenseForm.memberId, txValue);
        if (success) {
            setDispenseModalOpen(false);
            loadDispensaryStock(); // Refresh stock
        } else {
            alert("Error al dispensar");
        }
    };

    const handleEditDispensary = (batch: DispensaryBatch) => {
        setBatchToEditDispensary(batch);
        setEditDispensaryModalOpen(true);
    };

    const handleDeleteDispensary = (batch: DispensaryBatch) => {
        setBatchToDeleteDispensary(batch);
        setDeleteDispensaryModalOpen(true);
    };

    const confirmDeleteDispensary = async () => {
        if (batchToDeleteDispensary) {
            const success = await dispensaryService.deleteBatch(batchToDeleteDispensary.id);
            if (success) {
                await loadDispensaryStock();
                setDeleteDispensaryModalOpen(false);
                setTimeout(() => {
                    setBatchToDeleteDispensary(null);
                }, 300);
            } else {
                alert("Error al eliminar el lote del dispensario");
            }
        }
    };

    const handleTranslateType = (type: string) => {
        switch (type) {
            case 'flower': return 'Flores';
            case 'oil': return 'Aceites';
            case 'cream': return 'Cremas / Cosmética';
            case 'edible': return 'Comestibles';
            case 'extract': return 'Extractos / Resinas';
            case 'other': return 'Otros';
            default: return 'Flores';
        }
    };


    const filteredBatches = dispensaryBatches.filter(batch => {
        // Fallback for older batches without a product_type
        if (!batch.product_type) {
            return activeTab === 'flower';
        }
        return batch.product_type === activeTab;
    });

    return (
        <PageContainer>
            <Header>
                <div>
                    <h1><PackageCheck size={32} style={{ color: '#10b981' }} />Dispensario</h1>
                    <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: '0.35rem 0 0 0' }}>
                        Gestión de inventario final, pasaportes digitales y dispensación a pacientes
                    </p>
                </div>
                <ShadcnButton onClick={() => setCreateModalOpen(true)}>
                    <Plus size={16} /> Nuevo Producto
                </ShadcnButton>
            </Header>

            <TabsContainer>
                {(['flower', 'extract', 'oil', 'cream', 'edible', 'other'] as const).map(tab => (
                    <TabButton
                        key={tab}
                        $isActive={activeTab === tab}
                        onClick={() => setActiveTab(tab)}
                    >
                        {handleTranslateType(tab)}
                    </TabButton>
                ))}
            </TabsContainer>

            {filteredBatches.length === 0 ? (
                <EmptyState>
                    <div className="empty-icon">
                        <PackageCheck size={56} style={{ color: '#10b981', opacity: 0.8 }} />
                    </div>
                    <h3>El Dispensario está vacío</h3>
                    <p>No hay productos de esta categoría disponibles en stock.</p>
                </EmptyState>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                    {filteredBatches.map(batch => (
                        <div key={batch.id} style={{
                            background: 'rgba(15, 23, 42, 0.75)',
                            backdropFilter: 'blur(16px)',
                            borderRadius: '16px',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            padding: '1.5rem',
                            boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.4)',
                            position: 'relative',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            transition: 'all 0.3s ease'
                        }}>
                            {/* Accent Glow */}
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '2px',
                                background: batch.status === 'available' ? 'linear-gradient(90deg, #10b981, #06b6d4)' : '#f59e0b',
                                opacity: 0.9
                            }} />

                            {/* Status Badge */}
                            <div style={{
                                position: 'absolute',
                                top: '1.25rem',
                                right: '1.25rem'
                            }}>
                                <ShadcnBadge
                                    variant={batch.status === 'available' ? 'emerald' : batch.status === 'curing' ? 'amber' : 'secondary'}
                                    dot
                                >
                                    {batch.status === 'available' ? 'Disponible' : batch.status === 'curing' ? 'Curándose' : batch.status}
                                </ShadcnBadge>
                            </div>

                            <h3 style={{ margin: '0 0 0.5rem 0', color: '#f8fafc', fontSize: '1.35rem', fontWeight: '700', paddingRight: '5.5rem' }}>
                                {batch.product_name || batch.strain_name}
                            </h3>
                            <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: batch.notes ? '0.75rem' : '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'monospace' }}>
                                <Package size={14} style={{ color: '#38bdf8' }} /> {batch.batch_code} {batch.product_name ? `(${batch.strain_name})` : ''}
                            </div>

                            {batch.notes && (
                                <div style={{ color: '#cbd5e1', fontSize: '0.85rem', marginBottom: '1.25rem', fontStyle: 'italic', lineHeight: '1.4' }}>
                                    "{batch.notes}"
                                </div>
                            )}

                            {/* Weight Visualization */}
                            <div style={{ padding: '1rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)', marginBottom: '1.25rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.75rem', color: '#cbd5e1' }}>
                                    <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Stock Actual</span>
                                    <span style={{ fontSize: '1.25rem', fontWeight: '800', color: '#f8fafc' }}>
                                        {batch.current_weight}{batch.unit === 'u' ? ' u' : batch.unit || 'g'}
                                        {batch.unit === 'u' && batch.unit_volume && <span style={{ fontSize: '0.9rem', color: '#94a3b8', marginLeft: '0.25rem' }}>de {batch.unit_volume}{batch.unit_volume_type}</span>}
                                        <span style={{ fontWeight: 'normal', color: '#64748b', fontSize: '0.9rem', marginLeft: '0.25rem' }}>
                                            / {batch.initial_weight}{batch.unit === 'u' ? ' u' : batch.unit || 'g'}
                                        </span>
                                    </span>
                                </div>
                                <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{
                                        width: `${Math.min((batch.current_weight / batch.initial_weight) * 100, 100)}%`,
                                        height: '100%',
                                        background: `linear-gradient(90deg, #10b981 0%, #06b6d4 100%)`,
                                        borderRadius: '3px',
                                        boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)'
                                    }} />
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: 'auto' }}>
                                <ShadcnButton
                                    onClick={() => handleOpenDispense(batch)}
                                    className="w-full"
                                >
                                    <PackageCheck size={16} /> Entregar
                                </ShadcnButton>
                                <div style={{ display: 'grid', gridTemplateColumns: user?.role === 'medico' ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '0.6rem' }}>
                                    <Tooltip text="Ver Código QR">
                                        <ShadcnButton
                                            variant="secondary"
                                            size="icon"
                                            className="w-full"
                                            onClick={() => { setQrBatch(batch); setQrModalOpen(true); }}
                                        >
                                            <QrCode size={15} />
                                        </ShadcnButton>
                                    </Tooltip>
                                    <Tooltip text="Editar Lote">
                                        <ShadcnButton
                                            variant="secondary"
                                            size="icon"
                                            className="w-full"
                                            onClick={() => handleEditDispensary(batch)}
                                        >
                                            <Edit3 size={15} />
                                        </ShadcnButton>
                                    </Tooltip>
                                    {user?.role !== 'medico' && (
                                        <Tooltip text="Eliminar Lote">
                                            <ShadcnButton
                                                variant="destructive"
                                                size="icon"
                                                className="w-full"
                                                onClick={() => handleDeleteDispensary(batch)}
                                            >
                                                <Trash2 size={15} />
                                            </ShadcnButton>
                                        </Tooltip>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Dispense Modal */}
            <Modal isOpen={dispenseModalOpen}>
                <ModalContent>
                    <h2>💊 Entregar Producto</h2>

                    <div style={{
                        margin: '0 0 1.5rem 0',
                        padding: '1rem',
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '0.75rem'
                    }}>
                        <div style={{ marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>PRODUCTO SELECCIONADO</div>
                        <div style={{ color: '#f8fafc', fontSize: '1.25rem', fontWeight: 'bold' }}>{batchToDispense?.product_name || batchToDispense?.strain_name}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                            <span style={{ color: '#cbd5e1' }}>
                                Disponible: <strong style={{ color: '#4ade80' }}>
                                    {batchToDispense?.current_weight}{batchToDispense?.unit === 'u' ? ' u' : batchToDispense?.unit || 'g'}
                                    {batchToDispense?.unit === 'u' && batchToDispense?.unit_volume ? ` de ${batchToDispense?.unit_volume}${batchToDispense?.unit_volume_type}` : ''}
                                </strong>
                            </span>
                            {resolvedPrice > 0 && <span style={{ padding: '0.25rem 0.5rem', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', borderRadius: '0.25rem', fontSize: '0.85rem', fontWeight: 'bold' }}>${resolvedPrice}/{batchToDispense?.unit === 'u' ? 'u' : batchToDispense?.unit || 'g'}</span>}
                        </div>
                    </div>

                    <FormGroup>
                        <label>Cantidad a Entregar ({batchToDispense?.unit === 'u' ? 'Envases/Unidades' : batchToDispense?.unit || 'g'})</label>
                        <input
                            type="number"
                            step={batchToDispense?.unit === 'u' ? "1" : "any"}
                            autoFocus
                            placeholder="0.0"
                            value={dispenseForm.amount}
                            onChange={e => setDispenseForm({ ...dispenseForm, amount: e.target.value })}
                            max={batchToDispense?.current_weight}
                        />
                    </FormGroup>

                    {resolvedPrice > 0 && dispenseForm.amount && !isNaN(parseFloat(dispenseForm.amount)) && dispenseForm.reason === 'dispensing' && (
                        <div style={{
                            marginTop: '1rem',
                            padding: '1rem',
                            background: 'rgba(16, 185, 129, 0.1)',
                            borderRadius: '0.75rem',
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <span style={{ color: '#86efac', fontWeight: '600' }}>Precio Sugerido (Catálogo):</span>
                            <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#4ade80' }}>
                                ${(parseFloat(dispenseForm.amount) * resolvedPrice).toFixed(2)}
                            </span>
                        </div>
                    )}

                    {dispenseForm.reason === 'dispensing' && (
                        <FormGroup style={{ marginTop: '1.5rem' }}>
                            <label>Valor de Transacción / Ingreso ($)</label>
                            <input
                                type="number"
                                step="any"
                                placeholder={resolvedPrice > 0 && dispenseForm.amount ? (parseFloat(dispenseForm.amount) * resolvedPrice).toString() : "0.00"}
                                value={dispenseForm.transactionValue}
                                onChange={e => setDispenseForm({ ...dispenseForm, transactionValue: e.target.value })}
                            />
                            <small style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                                Este valor se registrará como ingreso final para las métricas mensuales. Déjalo en blanco si fue una donación.
                            </small>
                        </FormGroup>
                    )}

                    <FormGroup style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                        <label>Motivo</label>
                        <CustomSelect
                            value={dispenseForm.reason}
                            onChange={val => setDispenseForm({ ...dispenseForm, reason: val })}
                            options={[
                                { value: 'dispensing', label: 'Entrega a Socio/Paciente' },
                                { value: 'quality_control', label: 'Control de Calidad / Cata' },
                                { value: 'adjustment', label: 'Ajuste de Inventario / Merma' }
                            ]}
                        />
                    </FormGroup>

                    {/* Patient Selector */}
                    {dispenseForm.reason === 'dispensing' && (
                        <FormGroup style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
                            <label>Paciente / Socio (Opcional)</label>
                            <CustomSelect
                                value={dispenseForm.memberId}
                                onChange={val => setDispenseForm({ ...dispenseForm, memberId: val })}
                                placeholder="Seleccionar Paciente..."
                                isSearchable={true}
                                options={patients.map(p => ({
                                    value: p.profile_id,
                                    label: `${p.profile?.full_name || 'Sin Nombre'} (Límite: ${p.monthly_limit}g)`
                                }))}
                            />

                            {consumptionStats && batchToDispense?.unit === 'g' && (
                                <div style={{
                                    marginTop: '0.75rem',
                                    padding: '1rem',
                                    background: 'rgba(15, 23, 42, 0.6)',
                                    borderRadius: '0.75rem',
                                    border: '1px solid rgba(255, 255, 255, 0.08)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '600', color: '#cbd5e1' }}>
                                        <span style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Consumo Mensual del Paciente</span>
                                        <span style={{ color: '#f8fafc' }}>{consumptionStats.current}g / {consumptionStats.limit}g</span>
                                    </div>
                                    <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${Math.min((consumptionStats.current / consumptionStats.limit) * 100, 100)}%`,
                                            height: '100%',
                                            background: consumptionStats.current >= consumptionStats.limit ? 'linear-gradient(90deg, #ef4444, #f87171)' : 'linear-gradient(90deg, #10b981, #06b6d4)',
                                            transition: 'width 0.3s'
                                        }}></div>
                                    </div>
                                    {consumptionStats.current >= consumptionStats.limit && (
                                        <div style={{ color: '#fca5a5', fontSize: '0.8rem', marginTop: '0.5rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                            <AlertCircle size={14} /> Límite mensual de flores excedido ({consumptionStats.limit}g)
                                        </div>
                                    )}
                                </div>
                            )}
                        </FormGroup>
                    )}

                    <ModalActions>
                        <ShadcnButton variant="secondary" onClick={() => setDispenseModalOpen(false)}>Cancelar</ShadcnButton>
                        <ShadcnButton onClick={confirmDispense}>Confirmar Entrega</ShadcnButton>
                    </ModalActions>
                </ModalContent>
            </Modal>

            {/* QR Code Modal for Passport */}
            <Modal isOpen={qrModalOpen} onClick={() => setQrModalOpen(false)}>
                <ModalContent onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
                    <h2>📱 Pasaporte Digital</h2>
                    <p style={{ marginBottom: '2rem', color: '#94a3b8' }}>Escanea este código para ver la Ficha Técnica del Lote</p>

                    {qrBatch && (
                        <div style={{ background: 'white', padding: '1rem', display: 'inline-block', border: '1px solid #e2e8f0', borderRadius: '1rem', marginBottom: '1.5rem', boxShadow: '0 0 20px rgba(255, 255, 255, 0.1)' }}>
                            <QRCode
                                value={`${window.location.origin}/passport/${qrBatch.id}`}
                                size={200}
                            />
                        </div>
                    )}

                    <p style={{ fontWeight: 'bold', fontSize: '1.25rem', color: '#f8fafc', marginBottom: '0.25rem' }}>{qrBatch?.strain_name}</p>
                    <p style={{ fontFamily: 'monospace', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '0.25rem 0.75rem', borderRadius: '0.5rem', display: 'inline-block' }}>{qrBatch?.batch_code}</p>

                    <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                        <ShadcnButton variant="secondary" onClick={() => setQrModalOpen(false)}>Cerrar</ShadcnButton>
                        <ShadcnButton onClick={() => handlePrintLabel()}>
                            <Printer size={16} /> Imprimir Etiqueta
                        </ShadcnButton>
                    </div>

                    {/* Printable Content (Hidden until print) */}
                    <div style={{ display: 'none' }}>
                        <div ref={labelPrintRef}>
                            <StockLabel
                                patientName=""
                                legajo={qrBatch?.batch_code || ''}
                                geneticName={qrBatch?.strain_name || ''}
                                weight={qrBatch?.initial_weight ? `${Number(qrBatch.initial_weight).toFixed(2)}g` : '0.00g'}
                                date={new Date().toLocaleDateString('es-AR')}
                                organizationName={currentOrganization?.name || 'TrazAPP'}
                                logoUrl={currentOrganization?.logo_url || ''}
                                settings={currentOrganization?.label_settings as any}
                            />
                        </div>
                    </div>
                </ModalContent>
            </Modal>

            {/* Delete Dispensary Modal */}
            <ConfirmModal
                isOpen={deleteDispensaryModalOpen}
                title="Eliminar Lote del Dispensario"
                message={`¿Estás seguro de que deseas eliminar el lote ${batchToDeleteDispensary?.strain_name} (${batchToDeleteDispensary?.batch_code})? Esta acción no se puede deshacer.`}
                isDanger
                onClose={() => {
                    setDeleteDispensaryModalOpen(false);
                    setTimeout(() => setBatchToDeleteDispensary(null), 300);
                }}
                onConfirm={confirmDeleteDispensary}
            />

            {/* Edit Dispensary Modal */}
            <EditDispensaryModal
                isOpen={editDispensaryModalOpen}
                batch={batchToEditDispensary}
                onClose={() => setEditDispensaryModalOpen(false)}
                onSuccess={() => {
                    setEditDispensaryModalOpen(false);
                    loadDispensaryStock();
                }}
            />
            <CreateDispensaryProductModal
                isOpen={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onSuccess={() => {
                    setCreateModalOpen(false);
                    loadDispensaryStock();
                }}
            />
        </PageContainer>
    );
};

export default Dispensary;
