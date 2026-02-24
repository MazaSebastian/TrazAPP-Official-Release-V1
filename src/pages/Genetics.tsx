import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { FaDna, FaPlus, FaClock, FaCalendarAlt, FaLeaf, FaEdit, FaTrash, FaTag } from 'react-icons/fa';
import { geneticsService } from '../services/geneticsService';
import { Genetic, GeneticType } from '../types/genetics';
import { generateUniqueColor } from '../utils/geneticColors';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ConfirmModal } from '../components/ConfirmModal';
import { ToastModal } from '../components/ToastModal';
import { CustomDatePicker } from '../components/CustomDatePicker';
import { useOrganization } from '../context/OrganizationContext';
import UpgradeOverlay from '../components/common/UpgradeOverlay';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const overlayFadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const overlayFadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

const modalSlideIn = keyframes`
  from { opacity: 0; transform: translateY(20px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

const modalSlideOut = keyframes`
  from { opacity: 1; transform: translateY(0) scale(1); }
  to { opacity: 0; transform: translateY(20px) scale(0.95); }
`;

const Container = styled.div`
  padding: 2rem;
  padding-top: 5rem;
  max-width: 1400px;
  margin: 0 auto;
  animation: ${fadeIn} 0.5s ease-in-out;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;

  h1 {
    font-size: 2rem;
    font-weight: 800;
    color: #f8fafc;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
`;


const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: rgba(15, 23, 42, 0.75);
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  h3 {
    margin: 0;
    font-size: 0.9rem;
    color: #cbd5e1;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 700;
  }

  .value {
    font-size: 2.5rem;
    font-weight: 800;
    color: #f8fafc;
    line-height: 1;
  }

  .icon-wrapper {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.25rem;
    color: #a855f7;
  }
`;

const GeneticCard = styled.div`
  background: rgba(15, 23, 42, 0.75);
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
`;

const CardHeader = styled.div`
  background: rgba(30, 41, 59, 0.5);
  padding: 1.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;

  h3 {
    margin: 0;
    color: #f8fafc;
    font-size: 1.1rem;
  }
`;



const CardBody = styled.div`
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;



// Simple Modal Components
const ModalOverlay = styled.div<{ $isClosing?: boolean }>`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.7); z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(4px);
  animation: ${props => props.$isClosing ? overlayFadeOut : overlayFadeIn} 0.3s ease-in-out forwards;
`;

const ModalContent = styled.div<{ $isClosing?: boolean }>`
  background: rgba(15, 23, 42, 0.95);
  padding: 2rem;
  border-radius: 1rem;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(16px);
  color: #f8fafc;
  animation: ${props => props.$isClosing ? modalSlideOut : modalSlideIn} 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  
  /* Styling the scrollbar inside the modal for a consistent dark theme look */
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: rgba(15, 23, 42, 0.5);
    border-radius: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(71, 85, 105, 0.8);
    border-radius: 4px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(100, 116, 139, 1);
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #cbd5e1;
    font-size: 0.9rem;
  }
  input, select, textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.5rem;
    font-size: 0.95rem;
    color: #f8fafc;
    background: rgba(30, 41, 59, 0.5);
    backdrop-filter: blur(8px);
    transition: all 0.2s;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);

    &:focus {
      outline: none;
      border-color: rgba(56, 189, 248, 0.5);
      box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.1);
    }
    &::placeholder {
      color: #64748b;
    }
  }
  .hint { font-size: 0.8rem; color: #94a3b8; margin-top: 0.25rem; }
`;

const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const CreateCard = styled.div`
  background: rgba(15, 23, 42, 0.75);
  border-radius: 1rem;
  border: 2px dashed rgba(255, 255, 255, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  min-height: 250px;
  gap: 1rem;
  transition: all 0.2s ease;
  opacity: 0.8;
  color: #a0aec0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(12px);

  &:hover {
    border-color: #805ad5;
    color: #805ad5;
    background: rgba(30, 41, 59, 0.75);
    opacity: 1;
    transform: translateY(-2px);
  }
`;

const DashedCircle = styled.div`
  width: 60px;
  height: 60px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: inherit;
  transition: all 0.5s ease;

  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    border-radius: 50%;
    border: 2px dashed currentColor;
    transition: all 0.5s ease;
  }

  ${CreateCard}:hover &::before {
    animation: ${rotate} 10s linear infinite;
  }
`;

const Genetics: React.FC = () => {
    const { currentOrganization } = useOrganization();
    const plan = currentOrganization?.plan || 'individual';
    const planLevel = ['ong', 'enterprise'].includes(plan) ? 3 :
        ['equipo', 'pro'].includes(plan) ? 2 : 1;

    const [genetics, setGenetics] = useState<Genetic[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isClosingModal, setIsClosingModal] = useState(false);
    const [newGenetic, setNewGenetic] = useState<Partial<Genetic>>({
        name: '',
        nomenclatura: '',
        type: 'photoperiodic',
        vegetative_weeks: 4,
        flowering_weeks: 9,
        description: '',
        color: '#48BB78' // default hex
    });

    useEffect(() => {
        loadGenetics();
    }, []);

    const loadGenetics = async () => {
        setLoading(true);
        try {
            const data = await geneticsService.getGenetics();
            setGenetics(data);
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setLoading(false);
        }
    };

    // Delete Modal State
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [geneticToDelete, setGeneticToDelete] = useState<Genetic | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [toastAnimate, setToastAnimate] = useState(true);
    const [toastOpen, setToastOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

    const [editingId, setEditingId] = useState<string | null>(null);

    const handleEdit = (genetic: Genetic) => {
        setEditingId(genetic.id);
        setNewGenetic(genetic);
        setIsModalOpen(true);
    };

    const handleDeleteClick = async (genetic: Genetic) => {
        // Prevent deletion if active clones exist
        const activeCount = await geneticsService.getActiveBatchesCountForGenetic(genetic.id);
        if (activeCount > 0) {
            setToastMessage(`No puedes eliminar "${genetic.name}". Tienes ${activeCount} lote(s) activos de esta madre. Elimínalos o finalízalos primero.`);
            setToastType('error');
            setToastAnimate(true);
            setToastOpen(true);
            return;
        }

        setGeneticToDelete(genetic);
        setConfirmDeleteOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!geneticToDelete) return;

        setIsDeleting(true);
        const success = await geneticsService.deleteGenetic(geneticToDelete.id);
        setIsDeleting(false);

        if (success) {
            setGenetics(genetics.filter(g => g.id !== geneticToDelete.id));
            // Show Success Toast
            setToastMessage(`La madre "${geneticToDelete.name}" ha sido eliminada correctamente.`);
            setToastType('success');
            setToastAnimate(false);
            setToastOpen(true);
        } else {
            setToastMessage("Error al eliminar la Madre. Inténtalo de nuevo.");
            setToastType('error');
            setToastAnimate(true);
            setToastOpen(true);
        }
        setConfirmDeleteOpen(false);
        setGeneticToDelete(null);
    };

    const handleSave = async () => {
        if (!newGenetic.name) return;

        const geneticData = {
            name: newGenetic.name,
            nomenclatura: newGenetic.nomenclatura, // Added missing field
            type: newGenetic.type as GeneticType,
            vegetative_weeks: newGenetic.vegetative_weeks || 0,
            flowering_weeks: newGenetic.flowering_weeks || 0,
            description: newGenetic.description || '',
            acquisition_date: newGenetic.acquisition_date,
            thc_percent: newGenetic.thc_percent,
            cbd_percent: newGenetic.cbd_percent,
            estimated_yield_g: newGenetic.estimated_yield_g,
            default_price_per_gram: newGenetic.default_price_per_gram,
            color: newGenetic.color || '#48BB78'
        };

        if (editingId) {
            const success = await geneticsService.updateGenetic(editingId, geneticData);
            if (success) {
                setGenetics(genetics.map(g => g.id === editingId ? { ...g, ...geneticData } : g));
                closeModal();
            }
        } else {
            const created = await geneticsService.createGenetic(geneticData);
            if (created) {
                setGenetics([...genetics, created]);
                closeModal();
            }
        }
    };

    const closeModal = () => {
        setIsClosingModal(true);
        setTimeout(() => {
            setIsModalOpen(false);
            setIsClosingModal(false);
            setEditingId(null);
            setNewGenetic({
                name: '',
                type: 'photoperiodic',
                vegetative_weeks: 4,
                flowering_weeks: 9,
                description: '',
                acquisition_date: '',
                thc_percent: 0,
                cbd_percent: 0,
                estimated_yield_g: 0,
                color: '#48BB78'
            });
        }, 300);
    };

    const handleOpenCreateModal = () => {
        const existingColors = genetics.map(g => g.color || '');
        const newColor = generateUniqueColor(existingColors);

        setNewGenetic({
            name: '',
            type: 'photoperiodic',
            vegetative_weeks: 4,
            flowering_weeks: 9,
            description: '',
            acquisition_date: '',
            thc_percent: 0,
            cbd_percent: 0,
            estimated_yield_g: 0,
            color: newColor
        });
        setIsModalOpen(true);
    };

    if (loading) return <LoadingSpinner text="Cargando madres..." fullScreen />;

    return (
        <Container style={{ position: 'relative', overflow: 'hidden' }}>
            {planLevel < 2 && <UpgradeOverlay requiredPlanName="Equipo o superior" />}

            <div style={{ filter: planLevel < 2 ? 'blur(4px)' : 'none', pointerEvents: planLevel < 2 ? 'none' : 'auto', userSelect: planLevel < 2 ? 'none' : 'auto', opacity: planLevel < 2 ? 0.5 : 1 }}>
                <Header>
                    <h1><FaDna /> Gestión de Madres</h1>
                </Header>

                <StatsGrid>
                    <StatCard>
                        <div className="icon-wrapper">
                            <FaDna size={20} />
                            <h3>Total de Genéticas</h3>
                        </div>
                        <div className="value">{genetics.length}</div>
                    </StatCard>
                </StatsGrid>

                <ContentGrid>
                    {genetics.map(gen => (
                        <GeneticCard key={gen.id}>
                            <CardHeader>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {gen.color && (
                                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: gen.color, border: '1px solid rgba(255,255,255,0.2)' }} title="Color de Genética" />
                                    )}
                                    {gen.name}
                                </h3>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => handleEdit(gen)}
                                        style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)', cursor: 'pointer', color: '#38bdf8', padding: '0.4rem', borderRadius: '0.25rem', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        title="Editar"
                                        onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.2)'; }}
                                        onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)'; }}
                                    >
                                        <FaEdit />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(gen)}
                                        style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', cursor: 'pointer', color: '#f87171', padding: '0.4rem', borderRadius: '0.25rem', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        title="Eliminar"
                                        onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; }}
                                        onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            </CardHeader>
                            <CardBody>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#cbd5e1', fontSize: '0.95rem' }}>
                                    <FaLeaf color="#a855f7" /> <strong>Vege:</strong> {gen.vegetative_weeks} semanas
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#cbd5e1', fontSize: '0.95rem' }}>
                                    <FaClock color="#a855f7" /> <strong>Flora:</strong> {gen.flowering_weeks} semanas
                                </div>
                                <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '0.85rem', color: '#94a3b8' }}>
                                    <FaCalendarAlt style={{ marginRight: '0.5rem', color: '#64748b' }} />
                                    Ciclo Total Est.: {gen.vegetative_weeks + gen.flowering_weeks} semanas
                                </div>
                                {gen.description && (
                                    <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>{gen.description}</p>
                                )}
                                {gen.acquisition_date && (
                                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem', fontStyle: 'italic' }}>
                                        Inicio: {gen.acquisition_date.split('-').reverse().join('/')}
                                    </div>
                                )}
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                    {(gen.thc_percent !== undefined) && (
                                        <span style={{ fontSize: '0.7rem', background: 'rgba(74, 222, 128, 0.1)', color: '#4ade80', border: '1px solid rgba(74, 222, 128, 0.3)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 'bold' }}>
                                            THC: {gen.thc_percent}%
                                        </span>
                                    )}
                                    {(gen.cbd_percent !== undefined) && (
                                        <span style={{ fontSize: '0.7rem', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 'bold' }}>
                                            CBD: {gen.cbd_percent}%
                                        </span>
                                    )}
                                    {(gen.estimated_yield_g !== undefined) && (
                                        <span style={{ fontSize: '0.7rem', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 'bold' }}>
                                            Prod: {gen.estimated_yield_g}g
                                        </span>
                                    )}
                                    {gen.default_price_per_gram && (
                                        <span style={{ fontSize: '0.7rem', background: 'rgba(250, 204, 21, 0.1)', color: '#facc15', border: '1px solid rgba(250, 204, 21, 0.3)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                            <FaTag size={10} /> ${gen.default_price_per_gram}/g
                                        </span>
                                    )}
                                </div>
                            </CardBody>
                        </GeneticCard>
                    ))}
                    <CreateCard onClick={handleOpenCreateModal}>
                        <DashedCircle>
                            <FaPlus />
                        </DashedCircle>
                        <span style={{ fontWeight: 600, fontSize: '1rem', color: 'inherit', textAlign: 'center', padding: '0 1rem' }}>Nueva Madre</span>
                    </CreateCard>
                </ContentGrid>

                {
                    isModalOpen && (
                        <ModalOverlay $isClosing={isClosingModal}>
                            <ModalContent $isClosing={isClosingModal}>
                                <h2>{editingId ? 'Editar Madre' : 'Nueva Madre'}</h2>

                                <FormGroup>
                                    <label>Nombre</label>
                                    <input
                                        type="text"
                                        value={newGenetic.name}
                                        onChange={e => setNewGenetic({ ...newGenetic, name: e.target.value })}
                                        placeholder="Ej: Gorilla Glue #4"
                                    />
                                </FormGroup>

                                <FormGroup>
                                    <label>Nomenclatura (Código)</label>
                                    <input
                                        type="text"
                                        value={newGenetic.nomenclatura || ''}
                                        onChange={e => setNewGenetic({ ...newGenetic, nomenclatura: e.target.value })}
                                        placeholder="Ej: GG4"
                                    />
                                </FormGroup>

                                <FormGroup>
                                    <label>Fecha de inicio</label>
                                    <CustomDatePicker
                                        selected={newGenetic.acquisition_date ? new Date(newGenetic.acquisition_date + 'T12:00:00') : null}
                                        onChange={(date: Date | null) => setNewGenetic({ ...newGenetic, acquisition_date: date ? date.toISOString().split('T')[0] : '' })}
                                        placeholderText="Seleccionar fecha"
                                    />
                                </FormGroup>

                                <FormGroup>
                                    <label>Color en Mapa/Gráficos</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <input
                                            type="color"
                                            value={newGenetic.color || '#48BB78'}
                                            onChange={e => setNewGenetic({ ...newGenetic, color: e.target.value })}
                                            style={{ width: '50px', height: '40px', padding: '0', cursor: 'pointer', border: 'none', background: 'transparent' }}
                                        />
                                        <span style={{ color: '#cbd5e1', fontSize: '0.9rem', fontFamily: 'monospace' }}>{newGenetic.color?.toUpperCase() || '#48BB78'}</span>
                                    </div>
                                    <div className="hint">Este será el color con el que los lotes de esta madre aparecerán en el mapa de Esquejes.</div>
                                </FormGroup>

                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <FormGroup style={{ flex: 1 }}>
                                        <label>Prod. Est. (g)</label>
                                        <input
                                            type="number"
                                            value={newGenetic.estimated_yield_g || ''}
                                            onChange={e => setNewGenetic({ ...newGenetic, estimated_yield_g: parseFloat(e.target.value) })}
                                            placeholder="Ej: 500"
                                        />
                                    </FormGroup>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <FormGroup style={{ flex: 1 }}>
                                        <label>% THC (Opcional)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={newGenetic.thc_percent || ''}
                                            onChange={e => setNewGenetic({ ...newGenetic, thc_percent: parseFloat(e.target.value) })}
                                            placeholder="Ej: 22.5"
                                        />
                                    </FormGroup>
                                    <FormGroup style={{ flex: 1 }}>
                                        <label>% CBD (Opcional)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={newGenetic.cbd_percent || ''}
                                            onChange={e => setNewGenetic({ ...newGenetic, cbd_percent: parseFloat(e.target.value) })}
                                            placeholder="Ej: 0.5"
                                        />
                                    </FormGroup>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <FormGroup style={{ flex: 1 }}>
                                        <label>Semanas Vege</label>
                                        <input
                                            type="number"
                                            value={newGenetic.vegetative_weeks}
                                            onChange={e => setNewGenetic({ ...newGenetic, vegetative_weeks: parseInt(e.target.value) })}
                                        />
                                        <div className="hint">Desde semilla hasta cambio de ciclo</div>
                                    </FormGroup>
                                    <FormGroup style={{ flex: 1 }}>
                                        <label>Semanas Flora</label>
                                        <input
                                            type="number"
                                            value={newGenetic.flowering_weeks}
                                            onChange={e => setNewGenetic({ ...newGenetic, flowering_weeks: parseInt(e.target.value) })}
                                        />
                                        <div className="hint">Duración de la fase de floración</div>
                                    </FormGroup>
                                </div>

                                <FormGroup>
                                    <label>Descripción / Notas</label>
                                    <textarea
                                        rows={3}
                                        value={newGenetic.description}
                                        onChange={e => setNewGenetic({ ...newGenetic, description: e.target.value })}
                                        placeholder="Información adicional..."
                                    />
                                </FormGroup>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                    <button
                                        onClick={closeModal}
                                        style={{
                                            padding: '0.75rem 1.5rem',
                                            background: 'rgba(30, 41, 59, 0.6)',
                                            color: '#cbd5e1',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '0.5rem',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            transition: 'all 0.2s',
                                            backdropFilter: 'blur(8px)'
                                        }}
                                        onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.color = '#f8fafc'; }}
                                        onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(30, 41, 59, 0.6)'; e.currentTarget.style.color = '#cbd5e1'; }}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        style={{
                                            padding: '0.75rem 1.5rem',
                                            background: 'rgba(168, 85, 247, 0.2)',
                                            color: '#c084fc',
                                            border: '1px solid rgba(168, 85, 247, 0.5)',
                                            borderRadius: '0.5rem',
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                            transition: 'all 0.2s',
                                            backdropFilter: 'blur(8px)'
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(168, 85, 247, 0.3)'}
                                        onMouseOut={(e) => e.currentTarget.style.background = 'rgba(168, 85, 247, 0.2)'}
                                    >
                                        {editingId ? 'Actualizar' : 'Guardar Madre'}
                                    </button>
                                </div>
                            </ModalContent>
                        </ModalOverlay>
                    )}

                {/* Confirm Delete Modal */}
                <ConfirmModal
                    isOpen={confirmDeleteOpen}
                    title="Eliminar Madre"
                    message={`¿Estás seguro de que deseas eliminar la madre "${geneticToDelete?.name}"? Esta acción no se puede deshacer.`}
                    onClose={() => setConfirmDeleteOpen(false)}
                    onConfirm={handleConfirmDelete}
                    confirmText="Eliminar"
                    isDanger
                    isLoading={isDeleting}
                />

                <ToastModal
                    isOpen={toastOpen}
                    message={toastMessage}
                    type={toastType}
                    onClose={() => setToastOpen(false)}
                    animateOverlay={toastAnimate}
                />
            </div>
        </Container >
    );
};

export default Genetics;
