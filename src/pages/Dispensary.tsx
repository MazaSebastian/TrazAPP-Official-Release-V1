import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaHandHoldingMedical, FaBoxOpen, FaQrcode, FaEdit, FaTrash, FaPrint } from 'react-icons/fa';
import QRCode from 'react-qr-code';
import { dispensaryService, DispensaryBatch } from '../services/dispensaryService';
import { patientsService } from '../services/patientsService';
import { geneticsService } from '../services/geneticsService';
import { Genetic } from '../types/genetics';
import { Tooltip } from '../components/Tooltip';
import { CustomSelect } from '../components/CustomSelect';
// Wait, Stock.tsx defined its own Button. I should redefine it here or import a shared one.
// Looking at Stock.tsx, Button was defined locally. I will copy the definition.
import { ConfirmModal } from '../components/ConfirmModal';
import { EditDispensaryModal } from '../components/EditDispensaryModal';
import { CreateDispensaryProductModal } from '../components/CreateDispensaryProductModal';
import { useReactToPrint } from 'react-to-print';

// --- Styled Components (Copied from Stock.tsx) ---

const TabsContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 1px;
  overflow-x: auto;
  
  ::-webkit-scrollbar {
    height: 4px;
  }
`;

const TabButton = styled.button<{ $isActive: boolean }>`
  background: none;
  border: none;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: ${props => props.$isActive ? '#3b82f6' : '#94a3b8'};
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;

  &:hover {
    color: ${props => props.$isActive ? '#3b82f6' : '#f8fafc'};
  }

  &::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 2px;
    background: ${props => props.$isActive ? '#3b82f6' : 'transparent'};
    transition: all 0.2s;
  }
`;

const PageContainer = styled.div`
padding: 1rem;
padding-top: 1.5rem;
max-width: 1200px;
margin: 0 auto;
min-height: 100vh;

@media(max-width: 768px) {
    padding: 0.5rem;
    padding-top: 4rem;
}
`;

const Header = styled.div`
display: flex;
align-items: center;
justify-content: space-between;
margin-bottom: 2rem;
flex-wrap: wrap;
gap: 1rem;

@media(max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
}
  
  h1 {
    font-size: 2rem;
    font-weight: 800;
    margin: 0;
    background: linear-gradient(135deg, #4ade80 0%, #38bdf8 100%);
    -webkit-background-clip: text;
    -webkit-text - fill-color: transparent;
    display: flex;
    align-items: center;
    gap: 0.75rem;

    @media(max-width: 768px) {
        font-size: 1.5rem;
    }
}
`;

const ButtonStyled = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
display: flex;
align-items: center;
justify-content: center;
gap: 0.5rem;
padding: 0.75rem 1rem;
border: none;
border-radius: 0.75rem;
font-size: 0.875rem;
font-weight: 600;
cursor: pointer;
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
position: relative;
overflow: hidden;

background: ${props => {
        switch (props.variant) {
            case 'primary': return 'linear-gradient(135deg, rgba(74, 222, 128, 0.2) 0%, rgba(56, 189, 248, 0.2) 100%)';
            case 'danger': return 'rgba(239, 68, 68, 0.1)';
            case 'secondary': return 'rgba(148, 163, 184, 0.1)';
            default: return 'rgba(255, 255, 255, 0.05)';
        }
    }
    };

border: 1px solid ${props => {
        switch (props.variant) {
            case 'primary': return 'rgba(74, 222, 128, 0.3)';
            case 'danger': return 'rgba(239, 68, 68, 0.3)';
            case 'secondary': return 'rgba(148, 163, 184, 0.2)';
            default: return 'rgba(255, 255, 255, 0.1)';
        }
    }
    };

color: ${props => {
        switch (props.variant) {
            case 'primary': return '#f8fafc';
            case 'danger': return '#fca5a5';
            case 'secondary': return '#e2e8f0';
            default: return '#f8fafc';
        }
    }
    };
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px ${props => {
        switch (props.variant) {
            case 'primary': return 'rgba(74, 222, 128, 0.2)';
            case 'danger': return 'rgba(239, 68, 68, 0.2)';
            default: return 'rgba(0, 0, 0, 0.2)';
        }
    }
    };
    background: ${props => {
        switch (props.variant) {
            case 'primary': return 'linear-gradient(135deg, rgba(74, 222, 128, 0.3) 0%, rgba(56, 189, 248, 0.3) 100%)';
            case 'danger': return 'rgba(239, 68, 68, 0.2)';
            case 'secondary': return 'rgba(148, 163, 184, 0.2)';
            default: return 'rgba(255, 255, 255, 0.1)';
        }
    }
    };
}
  
  &:active {
    transform: translateY(0);
}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
}
`;

// Re-using the locally defined ButtonStyled as Button for this file to match Stock.tsx usage
const ButtonComp = ButtonStyled;

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

const PrintableLabel = styled.div`
display: flex;
flex-direction: column;
align-items: center;
justify-content: center;
width: 100mm;
height: 150mm; // Adjust as needed for specific label size
padding: 1rem;
background: white;
text-align: center;

/* Force simple styling for thermal printers */
font-family: sans-serif;
color: black;
  
  h1 {
    font-size: 24pt;
    margin: 10px 0;
    font-weight: 800;
}
  
  h2 {
    font-size: 16pt;
    margin: 5px 0;
    font-weight: normal;
}
  
  .batch-code {
    font-size: 14pt;
    font-family: monospace;
    margin: 10px 0;
    padding: 5px 10px;
    border: 2px solid black;
    border-radius: 5px;
}
  
  .qr-container {
    margin: 20px 0;
    border: 4px solid black;
    padding: 10px;
    background: white;
}
  
  .logo {
    font-size: 12pt;
    margin-top: auto;
    font-weight: bold;
}
`;


const Dispensary: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'flower' | 'oil' | 'cream' | 'edible' | 'extract' | 'other'>('flower');
    const [createModalOpen, setCreateModalOpen] = useState(false);

    const [dispensaryBatches, setDispensaryBatches] = useState<DispensaryBatch[]>([]);
    const [dispenseModalOpen, setDispenseModalOpen] = useState(false);
    const [batchToDispense, setBatchToDispense] = useState<DispensaryBatch | null>(null);
    const [dispenseForm, setDispenseForm] = useState({ amount: '', reason: 'dispensing', memberId: '' });
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
        setDispenseForm({ amount: '', reason: 'dispensing', memberId: '' });
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

        const success = await dispensaryService.dispense(batchToDispense.id, amount, dispenseForm.reason, dispenseForm.memberId, resolvedPrice);
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

    const filteredBatches = dispensaryBatches.filter(b => (b.product_type || 'flower') === activeTab);

    return (
        <PageContainer>
            <Header>
                <h1><FaHandHoldingMedical style={{ marginRight: '10px' }} />Dispensario</h1>
                <ButtonComp variant="primary" onClick={() => setCreateModalOpen(true)}>
                    + Nuevo Producto
                </ButtonComp>
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
                    <div className="empty-icon">🏥</div>
                    <h3>El Dispensario está vacío</h3>
                    <p>Finaliza cultivos para generar stock de producto terminado.</p>
                </EmptyState>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                    {dispensaryBatches.map(batch => (
                        <div key={batch.id} style={{
                            background: 'rgba(30, 41, 59, 0.5)',
                            backdropFilter: 'blur(12px)',
                            borderRadius: '16px',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            padding: '1.5rem',
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
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
                                background: batch.status === 'available' ? 'linear-gradient(90deg, #4ade80, #38bdf8)' : '#f59e0b',
                                opacity: 0.8
                            }} />

                            {/* Status Badge */}
                            <div style={{
                                position: 'absolute',
                                top: '1rem',
                                right: '1rem',
                                background: batch.status === 'available' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                color: batch.status === 'available' ? '#4ade80' : '#fbbf24',
                                border: `1px solid ${batch.status === 'available' ? 'rgba(74, 222, 128, 0.2)' : 'rgba(245, 158, 11, 0.2)'} `,
                                padding: '0.25rem 0.75rem',
                                borderRadius: '999px',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}>
                                {batch.status === 'available' ? 'Disponible' : batch.status === 'curing' ? 'Curándose' : batch.status}
                            </div>

                            <h3 style={{ margin: '0 0 0.5rem 0', color: '#f8fafc', fontSize: '1.5rem', fontWeight: '700' }}>{batch.product_name || batch.strain_name}</h3>
                            <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'monospace' }}>
                                <FaBoxOpen style={{ color: '#38bdf8' }} /> {batch.batch_code} {batch.product_name ? `(${batch.strain_name})` : ''}
                            </div>

                            {/* Weight Visualization */}
                            <div style={{ padding: '1rem', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.02)', marginBottom: '1.5rem' }}>
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
                                <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{
                                        width: `${(batch.current_weight / batch.initial_weight) * 100}% `,
                                        height: '100%',
                                        background: `linear-gradient(90deg, #4ade80 0%, #38bdf8 100%)`,
                                        borderRadius: '3px',
                                        boxShadow: '0 0 10px rgba(74, 222, 128, 0.5)'
                                    }} />
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem', marginTop: 'auto' }}>
                                <ButtonComp
                                    variant="primary"
                                    onClick={() => handleOpenDispense(batch)}
                                    style={{ padding: '0.875rem' }}
                                >
                                    <FaHandHoldingMedical size={18} /> Entregar
                                </ButtonComp>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                                    <Tooltip text="Ver Código QR">
                                        <ButtonComp
                                            variant="secondary"
                                            onClick={() => { setQrBatch(batch); setQrModalOpen(true); }}
                                        >
                                            <FaQrcode size={16} />
                                        </ButtonComp>
                                    </Tooltip>
                                    <Tooltip text="Editar Lote">
                                        <ButtonComp
                                            variant="secondary"
                                            onClick={() => handleEditDispensary(batch)}
                                        >
                                            <FaEdit size={16} />
                                        </ButtonComp>
                                    </Tooltip>
                                    <Tooltip text="Eliminar Lote">
                                        <ButtonComp
                                            variant="danger"
                                            onClick={() => handleDeleteDispensary(batch)}
                                        >
                                            <FaTrash size={16} />
                                        </ButtonComp>
                                    </Tooltip>
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
                        background: 'rgba(15, 23, 42, 0.4)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
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

                    {resolvedPrice > 0 && dispenseForm.amount && !isNaN(parseFloat(dispenseForm.amount)) && (
                        <div style={{
                            marginTop: '1rem',
                            padding: '1rem',
                            background: 'rgba(74, 222, 128, 0.1)',
                            borderRadius: '0.75rem',
                            border: '1px solid rgba(74, 222, 128, 0.2)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <span style={{ color: '#86efac', fontWeight: '600' }}>Costo Total Estimado:</span>
                            <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#4ade80' }}>
                                ${(parseFloat(dispenseForm.amount) * resolvedPrice).toFixed(2)}
                            </span>
                        </div>
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
                                options={patients.map(p => ({
                                    value: p.profile_id,
                                    label: `${p.profile?.full_name || 'Sin Nombre'} (Límite: ${p.monthly_limit}g)`
                                }))}
                            />

                            {consumptionStats && batchToDispense?.unit === 'g' && (
                                <div style={{
                                    marginTop: '0.75rem',
                                    padding: '1rem',
                                    background: 'rgba(15, 23, 42, 0.4)',
                                    borderRadius: '0.75rem',
                                    border: '1px solid rgba(255, 255, 255, 0.05)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '600', color: '#cbd5e1' }}>
                                        <span style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Consumo Mensual del Paciente</span>
                                        <span style={{ color: '#f8fafc' }}>{consumptionStats.current}g / {consumptionStats.limit}g</span>
                                    </div>
                                    <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${Math.min((consumptionStats.current / consumptionStats.limit) * 100, 100)}% `,
                                            height: '100%',
                                            background: consumptionStats.current >= consumptionStats.limit ? 'linear-gradient(90deg, #ef4444, #f87171)' : 'linear-gradient(90deg, #4ade80, #38bdf8)',
                                            transition: 'width 0.3s'
                                        }}></div>
                                    </div>
                                    {consumptionStats.current >= consumptionStats.limit && (
                                        <div style={{ color: '#fca5a5', fontSize: '0.8rem', marginTop: '0.5rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <span>⚠️</span> Límite mensual de flores excedido ({consumptionStats.limit}g)
                                        </div>
                                    )}
                                </div>
                            )}
                        </FormGroup>
                    )}

                    <ModalActions>
                        <ButtonComp variant="secondary" onClick={() => setDispenseModalOpen(false)}>Cancelar</ButtonComp>
                        <ButtonComp variant="primary" onClick={confirmDispense}>Confirmar Entrega</ButtonComp>
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
                                value={`${window.location.origin} /passport/${qrBatch.id} `}
                                size={200}
                            />
                        </div>
                    )}

                    <p style={{ fontWeight: 'bold', fontSize: '1.25rem', color: '#f8fafc', marginBottom: '0.25rem' }}>{qrBatch?.strain_name}</p>
                    <p style={{ fontFamily: 'monospace', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '0.25rem 0.75rem', borderRadius: '0.5rem', display: 'inline-block' }}>{qrBatch?.batch_code}</p>

                    <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                        <ButtonComp variant="secondary" onClick={() => setQrModalOpen(false)}>Cerrar</ButtonComp>
                        <ButtonComp variant="primary" onClick={() => handlePrintLabel()}>
                            <FaPrint /> Imprimir Etiqueta
                        </ButtonComp>
                    </div>

                    {/* Printable Content (Hidden until print) */}
                    <div style={{ display: 'none' }}>
                        <div ref={labelPrintRef}>
                            <PrintableLabel>
                                <h1>{qrBatch?.strain_name}</h1>
                                <div className="qr-container">
                                    <QRCode value={`${window.location.origin} /passport/${qrBatch?.id} `} size={250} />
                                </div>
                                <div className="batch-code">{qrBatch?.batch_code}</div>
                                <h2>{qrBatch?.initial_weight}g / {qrBatch?.status}</h2>
                                <div className="logo">AURORA DEL PLATA</div>
                            </PrintableLabel>
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
