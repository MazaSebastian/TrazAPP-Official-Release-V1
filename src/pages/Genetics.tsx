import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { FaDna, FaPlus, FaClock, FaCalendarAlt, FaLeaf, FaEdit, FaTrash, FaTag, FaTimes, FaPrint } from 'react-icons/fa';
import { geneticsService } from '../services/geneticsService';
import { Genetic, GeneticType } from '../types/genetics';
import { generateUniqueColor } from '../utils/geneticColors';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ConfirmModal } from '../components/ConfirmModal';
import { ToastModal } from '../components/ToastModal';
import { CustomDatePicker } from '../components/CustomDatePicker';
import { useOrganization } from '../context/OrganizationContext';
import UpgradeOverlay from '../components/common/UpgradeOverlay';
import { useReactToPrint } from 'react-to-print';
import { PrintableGeneticsCatalog } from '../components/Genetics/PrintableGeneticsCatalog';
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
  padding-top: 1.5rem;
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

    @media (max-width: 768px) {
        font-size: 1.5rem;
        justify-content: center;
        width: 100%;
        margin-bottom: 1rem;
        flex-wrap: wrap;
        text-align: center;
    }
  }

  @media (max-width: 768px) {
      flex-direction: column;
      justify-content: center;
      align-items: center;
  }
`;


const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;

  @media (max-width: 768px) {
      grid-template-columns: 1fr;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
      grid-template-columns: 1fr;
  }
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

  @media (max-width: 768px) {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    gap: 1rem;
    
    .icon-wrapper {
      margin: 0;
      flex-direction: row; 
      
      h3 {
          font-size: 0.85rem;
          text-align: left; 
      }
    }

    .value {
        font-size: 1.25rem;
        margin: 0;
    }
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
const GlassToastOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.2s ease-out;
`;

const GlassToastContent = styled.div`
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  color: #f8fafc;
`;

const DesktopView = styled.div`
  display: contents;
  @media (max-width: 768px) {
    display: none;
  }
`;

const MobileView = styled.div`
  display: none;
  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    padding: 1rem 1.25rem;
    gap: 0.75rem;
  }
`;

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

  @media (max-width: 768px) {
    width: 100%;
    max-width: none;
    height: 100%;
    max-height: 100vh;
    border-radius: 0;
    padding: 1.5rem;
    padding-top: 2rem;
    padding-bottom: 5rem; /* Extra space for mobile scroll */
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;

  @media (max-width: 768px) {
    margin-bottom: 1rem;
  }
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

const FormRow = styled.div`
  display: flex;
  gap: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0;
  }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;

  @media (max-width: 768px) {
    flex-direction: column-reverse;
    margin-top: 2rem;
    
    button {
      width: 100%;
      padding: 1rem !important;
      font-size: 1rem;
    }
  }
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

  @media (max-width: 768px) {
    min-height: auto;
    padding: 2rem;
    flex-direction: row;
    justify-content: center;
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


// Helper component for expandable warning list
const ExpandableLocationList: React.FC<{
    locationEntries: { label: string, qty: number, spotId?: string, roomId?: string, spotName?: string, roomName?: string }[],
    onNavigate: (type: 'spot' | 'room', id: string) => void
}> = ({ locationEntries, onNavigate }) => {
    const [isExpanded, setIsExpanded] = React.useState(false);

    const visibleCount = isExpanded ? locationEntries.length : 5;
    const hasMore = locationEntries.length > 5;
    const hiddenCount = locationEntries.length - 5;

    return (
        <ul style={{ textAlign: 'left', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '0.5rem', marginTop: '1rem', marginBottom: '1rem', listStyle: 'none', maxHeight: isExpanded ? '300px' : 'auto', overflowY: isExpanded ? 'auto' : 'visible' }}>
            {locationEntries.slice(0, visibleCount).map((loc, idx) => (
                <li key={idx} style={{ marginBottom: '0.5rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <FaLeaf color="#4ade80" size={14} style={{ minWidth: '14px' }} />
                    <span><strong>{loc.qty}</strong> plantas en </span>
                    {loc.spotId && loc.spotName !== 'Sin Cultivo Asignado' ? (
                        <button
                            onClick={() => onNavigate('spot', loc.spotId!)}
                            style={{ background: 'none', border: 'none', padding: 0, color: '#38bdf8', textDecoration: 'underline', cursor: 'pointer', textAlign: 'left', fontSize: 'inherit' }}
                        >
                            {loc.spotName}
                        </button>
                    ) : (
                        <span>{loc.spotName || 'Sin Cultivo Asignado'}</span>
                    )}
                    <span>{' - '}</span>
                    {loc.roomId && loc.roomName !== 'Sala Desconocida' ? (
                        <button
                            onClick={() => onNavigate('room', loc.roomId!)}
                            style={{ background: 'none', border: 'none', padding: 0, color: '#c084fc', textDecoration: 'underline', cursor: 'pointer', textAlign: 'left', fontSize: 'inherit' }}
                        >
                            {loc.roomName}
                        </button>
                    ) : (
                        <span>{loc.roomName || 'Sala Desconocida'}</span>
                    )}
                </li>
            ))}

            {hasMore && (
                <li style={{ marginTop: '0.75rem', textAlign: 'center', paddingTop: '0.5rem', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        style={{ background: 'none', border: 'none', color: '#c084fc', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', gap: '0.25rem' }}
                    >
                        {isExpanded ? 'Ocultar listado completo' : `...y en ${hiddenCount} ubicación(es) más. Ver Todo`}
                    </button>
                </li>
            )}
        </ul>
    );
};

// Component for cleaning orphaned batches
const OrphanedBatchesCleaner: React.FC<{
    geneticId: string;
    orphanQty: number;
    onSuccess: () => void;
}> = ({ geneticId, orphanQty, onSuccess }) => {
    const [isLoading, setIsLoading] = React.useState(false);

    const handleDiscard = async () => {
        setIsLoading(true);
        const success = await geneticsService.discardOrphanedBatches(geneticId);
        setIsLoading(false);
        if (success) {
            onSuccess();
        } else {
            alert('Error al intentar desechar los lotes huérfanos. Por favor recarga e intenta nuevamente.');
        }
    };

    return (
        <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '0.5rem' }}>
            <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: '#fca5a5' }}>
                <strong>Detección de Huérfanos:</strong> Se han encontrado <strong>{orphanQty} plantas</strong> de esta Genética en lotes que perdieron su sala asignada (porque la Sala/Cultivo fue eliminada).
            </p>
            <button
                onClick={handleDiscard}
                disabled={isLoading}
                style={{
                    background: isLoading ? '#991b1b' : '#ef4444',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.4rem',
                    border: 'none',
                    fontWeight: 600,
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.9rem',
                    transition: 'background 0.2s'
                }}
            >
                {isLoading ? (
                    <>
                        <div style={{
                            border: '2px solid rgba(255, 255, 255, 0.3)',
                            borderRadius: '50%',
                            borderTop: '2px solid white',
                            width: '14px',
                            height: '14px',
                            animation: 'spin 1s linear infinite'
                        }} />
                        Desechando...
                    </>
                ) : (
                    <>
                        <FaTrash /> Desechar {orphanQty} Plantas Huérfanas
                    </>
                )}
            </button>
        </div>
    );
};

const Genetics: React.FC = () => {
    const navigate = useNavigate();
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

    const [deleteValidationError, setDeleteValidationError] = useState<React.ReactNode | null>(null);

    const [editingId, setEditingId] = useState<string | null>(null);

    const printRef = React.useRef<HTMLDivElement>(null);
    const handlePrintCatalog = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Catalogo_Geneticas_${new Date().toLocaleDateString('es-AR').replace(/\//g, '-')}`,
        pageStyle: `
            @page { size: portrait; margin: 10mm; }
            html, body, #root, [class*="layout"], [class*="container"], main, section {
                background-color: white !important;
                background-image: none !important;
                color: black !important;
            }
            .no-print { display: none !important; }
            .printable-report { background-color: white !important; }
            * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
        `
    });

    // Mobile Detail State
    const [mobileDetailGenetic, setMobileDetailGenetic] = useState<Genetic | null>(null);

    const handleEdit = (genetic: Genetic) => {
        setEditingId(genetic.id);
        setNewGenetic(genetic);
        setIsModalOpen(true);
    };

    const handleDeleteClick = async (genetic: Genetic) => {
        // Prevent deletion if active clones exist
        const activeBatches = await geneticsService.getActiveBatchesForGenetic(genetic.id);

        if (activeBatches && activeBatches.length > 0) {
            // Calculate total plants
            const totalPlants = activeBatches.reduce((acc: number, b: any) => acc + (b.quantity || 1), 0);

            // Group by location
            const groupedLocations = activeBatches.reduce((acc: any, b: any) => {
                const roomName = b.room?.name || 'Sala Desconocida';
                const spotName = b.room?.spot?.name ? `Cultivo: ${b.room.spot.name}` : 'Sin Cultivo Asignado';
                const key = `${spotName} - Sala: ${roomName}`;

                if (!acc[key]) {
                    acc[key] = {
                        qty: 0,
                        spotId: b.room?.spot_id || null,
                        roomId: b.room?.id || null,
                        spotName: spotName,
                        roomName: `Sala: ${roomName}`
                    };
                }
                acc[key].qty += (b.quantity || 1);

                return acc;
            }, {});

            const locationEntries = Object.entries(groupedLocations).map(([key, value]: [string, any]) => ({
                label: key,
                qty: value.qty,
                spotId: value.spotId,
                roomId: value.roomId,
                spotName: value.spotName,
                roomName: value.roomName
            }));

            // Find orphaned batches (no spot or room)
            const orphanEntry = locationEntries.find(loc => !loc.spotId && !loc.roomId && loc.spotName === 'Sin Cultivo Asignado');
            const orphanQty = orphanEntry ? orphanEntry.qty : 0;

            const handleNavigate = (type: 'spot' | 'room', id: string) => {
                setConfirmDeleteOpen(false);
                setDeleteValidationError(null);
                if (type === 'spot') {
                    navigate(`/crops/${id}`);
                } else {
                    navigate(`/rooms/${id}`);
                }
            };

            const handleOrphansDiscardedContext = () => {
                setDeleteValidationError(null);
                setConfirmDeleteOpen(false);
                setToastMessage(`Las plantas huérfanas derivadas de ${genetic.name} han sido desechadas exitosamente.`);
                setToastType('success');
                setToastAnimate(false);
                setToastOpen(true);
                // Call handle delete click again to see if there are more
                setTimeout(() => handleDeleteClick(genetic), 500);
            };

            const locationsListNode = <ExpandableLocationList locationEntries={locationEntries} onNavigate={handleNavigate} />;

            setDeleteValidationError(
                <div>
                    No puedes eliminar la genética <strong>{genetic.name}</strong> porque tienes <strong>{totalPlants} plantas activas</strong> en tu inventario.
                    {locationsListNode}
                    Debes cosechar, desechar o finalizar estas plantas antes de poder borrar la Madre de tu catálogo.

                    {orphanQty > 0 && (
                        <OrphanedBatchesCleaner
                            geneticId={genetic.id}
                            orphanQty={orphanQty}
                            onSuccess={handleOrphansDiscardedContext}
                        />
                    )}
                </div>
            );
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

    if (loading) return <LoadingSpinner fullScreen />;

    return (
        <Container style={{ position: 'relative', overflow: 'hidden' }}>
            {planLevel < 2 && <UpgradeOverlay requiredPlanName="Equipo o superior" />}

            <div style={{ filter: planLevel < 2 ? 'blur(4px)' : 'none', pointerEvents: planLevel < 2 ? 'none' : 'auto', userSelect: planLevel < 2 ? 'none' : 'auto', opacity: planLevel < 2 ? 0.5 : 1 }}>
                <Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1><FaDna /> Gestión de Madres</h1>
                    <button
                        onClick={handlePrintCatalog}
                        className="no-print"
                        title="Imprimir Catálogo"
                        style={{
                            background: 'rgba(15, 23, 42, 0.4)',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '0.5rem',
                            padding: '0.5rem 1rem',
                            fontSize: '0.9rem',
                            color: '#cbd5e1',
                            fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                            e.currentTarget.style.color = '#f8fafc';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(15, 23, 42, 0.4)';
                            e.currentTarget.style.color = '#cbd5e1';
                        }}
                    >
                        <FaPrint /> Imprimir Catálogo
                    </button>
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
                        <GeneticCard key={gen.id} onClick={(e) => {
                            if (window.innerWidth <= 768) {
                                e.stopPropagation();
                                setMobileDetailGenetic(gen);
                            }
                        }} style={{ cursor: window.innerWidth <= 768 ? 'pointer' : 'default' }}>
                            <DesktopView>
                                <CardHeader>
                                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {gen.color && (
                                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: gen.color, border: '1px solid rgba(255,255,255,0.2)' }} title="Color de Genética" />
                                        )}
                                        {gen.name}
                                    </h3>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleEdit(gen); }}
                                            style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)', cursor: 'pointer', color: '#38bdf8', padding: '0.4rem', borderRadius: '0.25rem', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            title="Editar"
                                            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.2)'; }}
                                            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)'; }}
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteClick(gen); }}
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
                            </DesktopView>

                            <MobileView>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#f8fafc', fontSize: '1rem' }}>
                                        {gen.color && (
                                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: gen.color, border: '1px solid rgba(255,255,255,0.2)' }} />
                                        )}
                                        {gen.name}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                    <span style={{ color: '#94a3b8' }}>{gen.acquisition_date ? `Inicio: ${gen.acquisition_date.split('-').reverse().join('/')}` : 'Sin fecha'}</span>

                                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                        {(gen.thc_percent !== undefined) && (
                                            <span style={{ fontSize: '0.65rem', background: 'rgba(74, 222, 128, 0.1)', color: '#4ade80', border: '1px solid rgba(74, 222, 128, 0.3)', padding: '0.1rem 0.3rem', borderRadius: '4px', fontWeight: 'bold' }}>THC: {gen.thc_percent}%</span>
                                        )}
                                        {(gen.cbd_percent !== undefined) && (
                                            <span style={{ fontSize: '0.65rem', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '0.1rem 0.3rem', borderRadius: '4px', fontWeight: 'bold' }}>CBD: {gen.cbd_percent}%</span>
                                        )}
                                        {(gen.estimated_yield_g !== undefined) && (
                                            <span style={{ fontSize: '0.65rem', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.1rem 0.3rem', borderRadius: '4px', fontWeight: 'bold' }}>Prod: {gen.estimated_yield_g}g</span>
                                        )}
                                    </div>
                                </div>
                            </MobileView>
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

                                <FormRow>
                                    <FormGroup style={{ flex: 1 }}>
                                        <label>Prod. Est. (g)</label>
                                        <input
                                            type="number"
                                            value={newGenetic.estimated_yield_g || ''}
                                            onChange={e => setNewGenetic({ ...newGenetic, estimated_yield_g: parseFloat(e.target.value) })}
                                            placeholder="Ej: 500"
                                        />
                                    </FormGroup>
                                </FormRow>

                                <FormRow>
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
                                </FormRow>

                                <FormRow>
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
                                </FormRow>

                                <FormGroup>
                                    <label>Descripción / Notas</label>
                                    <textarea
                                        rows={3}
                                        value={newGenetic.description}
                                        onChange={e => setNewGenetic({ ...newGenetic, description: e.target.value })}
                                        placeholder="Información adicional..."
                                    />
                                </FormGroup>

                                <ModalActions>
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
                                </ModalActions>
                            </ModalContent>
                        </ModalOverlay>
                    )}

                {/* Confirm Delete / Error Modal */}
                <ConfirmModal
                    isOpen={confirmDeleteOpen || !!deleteValidationError}
                    title={deleteValidationError ? "Eliminación Bloqueada" : "Eliminar Madre"}
                    message={deleteValidationError || `¿Estás seguro de que deseas eliminar la madre "${geneticToDelete?.name}"? Esta acción no se puede deshacer.`}
                    onClose={() => {
                        setConfirmDeleteOpen(false);
                        setDeleteValidationError(null);
                    }}
                    onConfirm={deleteValidationError ? () => setDeleteValidationError(null) : handleConfirmDelete}
                    confirmText={deleteValidationError ? "Entendido" : "Eliminar"}
                    cancelText={deleteValidationError ? "" : "Cancelar"}
                    isDanger={!deleteValidationError}
                    isLoading={isDeleting}
                    maxWidth={deleteValidationError ? "550px" : "400px"}
                />

                <ToastModal
                    isOpen={toastOpen}
                    message={toastMessage}
                    type={toastType}
                    onClose={() => setToastOpen(false)}
                    animateOverlay={toastAnimate}
                />

                {/* Mobile Detail Modal */}
                {mobileDetailGenetic && (
                    <GlassToastOverlay onClick={() => setMobileDetailGenetic(null)}>
                        <GlassToastContent onClick={e => e.stopPropagation()} style={{ padding: '1.5rem', width: '90%', maxWidth: '400px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem' }}>
                                <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <FaDna style={{ color: '#38bdf8' }} /> Detalle de Madre
                                </h2>
                                <button onClick={() => setMobileDetailGenetic(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.25rem' }}><FaTimes /></button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                                    <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Genética</span>
                                    <strong style={{ color: '#e2e8f0', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {mobileDetailGenetic.color && (
                                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: mobileDetailGenetic.color, border: '1px solid rgba(255,255,255,0.2)' }} />
                                        )}
                                        {mobileDetailGenetic.name}
                                    </strong>
                                </div>
                                {mobileDetailGenetic.acquisition_date && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                                        <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Inicio</span>
                                        <strong style={{ color: '#e2e8f0', fontSize: '0.9rem' }}>{mobileDetailGenetic.acquisition_date.split('-').reverse().join('/')}</strong>
                                    </div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                                    <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Vege / Flora</span>
                                    <strong style={{ color: '#e2e8f0', fontSize: '0.9rem' }}>{mobileDetailGenetic.vegetative_weeks}sem / {mobileDetailGenetic.flowering_weeks}sem</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                                    <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Ciclo Total</span>
                                    <strong style={{ color: '#e2e8f0', fontSize: '0.9rem' }}>{mobileDetailGenetic.vegetative_weeks + mobileDetailGenetic.flowering_weeks} semanas</strong>
                                </div>
                                {mobileDetailGenetic.description && (
                                    <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: '0.5rem' }}>
                                        <span style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Descripción / Notas</span>
                                        <p style={{ color: '#e2e8f0', fontSize: '0.9rem', margin: 0, fontStyle: 'italic' }}>{mobileDetailGenetic.description}</p>
                                    </div>
                                )}
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                    {(mobileDetailGenetic.thc_percent !== undefined) && (
                                        <span style={{ fontSize: '0.7rem', background: 'rgba(74, 222, 128, 0.1)', color: '#4ade80', border: '1px solid rgba(74, 222, 128, 0.3)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 'bold' }}>
                                            THC: {mobileDetailGenetic.thc_percent}%
                                        </span>
                                    )}
                                    {(mobileDetailGenetic.cbd_percent !== undefined) && (
                                        <span style={{ fontSize: '0.7rem', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 'bold' }}>
                                            CBD: {mobileDetailGenetic.cbd_percent}%
                                        </span>
                                    )}
                                    {(mobileDetailGenetic.estimated_yield_g !== undefined) && (
                                        <span style={{ fontSize: '0.7rem', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 'bold' }}>
                                            Prod: {mobileDetailGenetic.estimated_yield_g}g
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '0.75rem', display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleEdit(mobileDetailGenetic); setMobileDetailGenetic(null); }}
                                    style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)', cursor: 'pointer', color: '#38bdf8', padding: '0.6rem 1rem', borderRadius: '0.5rem', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 600 }}
                                >
                                    <FaEdit /> Editar Madre
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteClick(mobileDetailGenetic); setMobileDetailGenetic(null); }}
                                    style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', cursor: 'pointer', color: '#f87171', padding: '0.6rem 1rem', borderRadius: '0.5rem', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 600 }}
                                >
                                    <FaTrash /> Eliminar
                                </button>
                            </div>
                        </GlassToastContent>
                    </GlassToastOverlay>
                )}
                {/* Printable Catalog Portal */}
                <div style={{ display: 'none' }}>
                    <div ref={printRef}>
                        <PrintableGeneticsCatalog genetics={genetics} />
                    </div>
                </div>

            </div>
        </Container >
    );
};

export default Genetics;
