import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styled, { keyframes } from 'styled-components';
import { Room, Batch, CloneMap } from '../../types/rooms';
import { 
    ArrowRightLeft, 
    Plus as LucidePlus, 
    Trash2 as LucideTrash2, 
    CheckSquare as LucideCheckSquare, 
    Square as LucideSquare, 
    Printer as LucidePrinter, 
    X as LucideX, 
    Sparkles, 
    ChevronRight, 
    ArrowLeft, 
    Check, 
    Layers, 
    Sprout,
    MapPin
} from 'lucide-react';
import { Button as ShadcnButton } from '../ui/Button';
import { Badge as ShadcnBadge } from '../ui/Badge';

import { EsquejeraGrid } from './EsquejeraGrid';
import { PrintableBatchLabels } from './PrintableBatchLabels'; // Import the new component
import { DndContext, useDraggable, useDroppable, DragEndEvent, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import ToastModal from '../ToastModal';
import { CustomSelect } from '../CustomSelect';
import { useReactToPrint } from 'react-to-print';
import { Insumo } from '../../types';

interface TransplantModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentRoom: Room;
    rooms: Room[];
    cloneMaps: CloneMap[];
    insumos?: Insumo[];
    onConfirm: (
        destinationId: string,
        singles: string[],
        groupsPayload: { name: string, batchIds: string[] }[],
        substrateId?: string,
        estimatedVolume?: number
    ) => Promise<void>;
    initialMapId?: string;
    initialSelectedBatchIds?: string[];
    isClosing?: boolean;
}

const fadeIn = keyframes` from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } `;
const fadeOut = keyframes` from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(10px); } `;
const scaleIn = keyframes` from { transform: scale(0.96); opacity: 0; } to { transform: scale(1); opacity: 1; } `;
const scaleOut = keyframes` from { transform: scale(1); opacity: 1; } to { transform: scale(0.96); opacity: 0; } `;

const StepContent = styled.div<{ $isExiting?: boolean }>`
  animation: ${p => p.$isExiting ? fadeOut : fadeIn} 0.3s ease-in-out forwards;
  display: flex; flex-direction: column; flex: 1; min-height: 0;
`;

// Styled Components (Shadcn Dark Glassmorphism)
const Overlay = styled.div<{ isClosing?: boolean }>`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.78);
  z-index: 10001;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  padding: 1rem;
  animation: ${p => p.isClosing ? fadeOut : fadeIn} 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
`;

const Content = styled.div<{ isClosing?: boolean }>`
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(28px);
  -webkit-backdrop-filter: blur(28px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #f8fafc;
  padding: 0;
  border-radius: 1.25rem;
  width: 95%;
  max-width: 1120px;
  height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.06);
  position: relative;
  overflow: hidden;
  animation: ${p => p.isClosing ? scaleOut : scaleIn} 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;

  @media (max-width: 768px) {
    width: 100%;
    height: 100vh;
    border-radius: 0;
    max-height: 100vh;
  }
`;

const AmbientGlow = styled.div`
  position: absolute;
  top: -60px;
  left: 50%;
  transform: translateX(-50%);
  width: 500px;
  height: 140px;
  background: radial-gradient(ellipse at center, rgba(16, 185, 129, 0.18) 0%, rgba(16, 185, 129, 0) 75%);
  pointer-events: none;
`;

const ModalHeader = styled.div`
  padding: 1.5rem 2rem 1.25rem 2rem;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(15, 23, 42, 0.6);
  position: relative;
  z-index: 1;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const HeaderTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.25rem;
`;

const HeaderInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const IconBadge = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 0.75rem;
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #34d399;
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.15);
  flex-shrink: 0;
`;

const Title = styled.h2`
  font-size: 1.35rem;
  font-weight: 700;
  color: #f8fafc;
  margin: 0;
  letter-spacing: -0.02em;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Subtitle = styled.p`
  margin: 0.25rem 0 0 0;
  font-size: 0.85rem;
  color: #94a3b8;
`;

const CloseButton = styled.button`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #94a3b8;
  width: 34px;
  height: 34px;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #f8fafc;
    border-color: rgba(255, 255, 255, 0.18);
    transform: scale(1.05);
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem 2rem;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;

  @media (max-width: 768px) {
    padding: 1rem;
    overflow-y: auto;
  }
`;

const ModalFooter = styled.div`
  padding: 1.25rem 2rem;
  flex-shrink: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.75rem;
  background: rgba(15, 23, 42, 0.8);
  position: relative;
  z-index: 1;

  @media (max-width: 768px) {
    padding: 1rem;
    flex-direction: column-reverse;
    button {
      width: 100%;
    }
  }
`;

const StepFlexContainer = styled.div<{ $overflowHidden?: boolean }>`
  display: flex;
  gap: 1.75rem;
  flex: 1;
  min-height: 0;
  ${p => p.$overflowHidden && 'overflow: hidden;'}

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    overflow: visible;
  }
`;

const ColumnLeft = styled.div`
  flex: 1;
  min-width: 280px;
  max-width: 340px;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;

  @media (max-width: 768px) {
    min-width: 100%;
    max-width: 100%;
    flex: none;
  }
`;

const ColumnRight = styled.div`
  flex: 3;
  display: flex;
  flex-direction: column;
  min-height: 0;

  @media (max-width: 768px) {
    flex: none;
    min-height: 400px;
  }
`;

const Step2Column = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  @media (max-width: 768px) {
    flex: none;
    overflow: visible;
    min-height: 450px;
  }
`;

const Section = styled.div`
  margin-bottom: 0;
`;

const Label = styled.label`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94a3b8;
  margin-bottom: 0.5rem;
`;

const TabContainer = styled.div`
  display: inline-flex;
  gap: 0.25rem;
  background: rgba(255, 255, 255, 0.03);
  padding: 0.25rem;
  border-radius: 0.625rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  width: fit-content;
`;

const Tab = styled.button<{ $active: boolean }>`
  padding: 0.4rem 0.85rem;
  background: ${p => p.$active ? 'rgba(255, 255, 255, 0.08)' : 'transparent'};
  border: 1px solid ${p => p.$active ? 'rgba(255, 255, 255, 0.12)' : 'transparent'};
  border-radius: 0.5rem;
  color: ${p => p.$active ? '#f8fafc' : '#94a3b8'};
  font-weight: ${p => p.$active ? '600' : '500'};
  font-size: 0.8rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  transition: all 0.15s ease;
  box-shadow: ${p => p.$active ? '0 1px 3px rgba(0, 0, 0, 0.3)' : 'none'};

  &:hover {
    color: #ffffff;
    background: ${p => p.$active ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.04)'};
  }
`;

const StepIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const StepPill = styled.div<{ $active: boolean; $completed: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.85rem;
  border-radius: 9999px;
  font-size: 0.775rem;
  font-weight: 600;
  transition: all 0.2s ease;
  background: ${p => p.$active ? 'rgba(16, 185, 129, 0.12)' : p.$completed ? 'rgba(16, 185, 129, 0.06)' : 'rgba(255, 255, 255, 0.03)'};
  border: 1px solid ${p => p.$active ? 'rgba(16, 185, 129, 0.35)' : p.$completed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)'};
  color: ${p => p.$active ? '#34d399' : p.$completed ? '#6ee7b7' : '#64748b'};
  box-shadow: ${p => p.$active ? '0 0 14px rgba(16, 185, 129, 0.2)' : 'none'};
`;

const StepNumber = styled.span<{ $active: boolean; $completed: boolean }>`
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  background: ${p => p.$active ? '#10b981' : p.$completed ? '#059669' : 'rgba(255, 255, 255, 0.1)'};
  color: ${p => p.$active || p.$completed ? '#ffffff' : '#94a3b8'};
  font-weight: 700;
`;

const SelectAllButton = styled.button`
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
  font-weight: 500;
  font-size: 0.8rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.4rem 0.85rem;
  border-radius: 0.5rem;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
    color: #ffffff;
  }

  &:active {
    transform: translateY(1px);
  }
`;

const SummaryCard = styled.div`
  background: linear-gradient(180deg, rgba(16, 185, 129, 0.07) 0%, rgba(15, 23, 42, 0.6) 100%);
  border: 1px solid rgba(16, 185, 129, 0.22);
  border-radius: 0.875rem;
  padding: 1.25rem 1rem;
  text-align: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 140px;
    height: 45px;
    background: radial-gradient(ellipse at top, rgba(16, 185, 129, 0.28) 0%, transparent 70%);
    pointer-events: none;
  }

  .summary-count {
    font-size: 2.5rem;
    font-weight: 800;
    color: #34d399;
    letter-spacing: -0.03em;
    line-height: 1;
    margin-bottom: 0.35rem;
    text-shadow: 0 0 20px rgba(16, 185, 129, 0.35);
  }

  .summary-label {
    color: #94a3b8;
    font-size: 0.825rem;
    font-weight: 500;
    letter-spacing: 0.01em;
  }

  .substrate-estimate {
    margin-top: 0.75rem;
    padding-top: 0.65rem;
    border-top: 1px solid rgba(16, 185, 129, 0.2);
    font-size: 0.8rem;
    color: #6ee7b7;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;

    strong {
      color: #a7f3d0;
      font-weight: 700;
    }
  }
`;

const SubstrateCard = styled.div`
  background: rgba(255, 255, 255, 0.02);
  padding: 0.85rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.07);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.2);

  .volume-row {
    margin-top: 0.85rem;
    padding-top: 0.75rem;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;

    label {
      font-size: 0.8rem;
      color: #94a3b8;
      font-weight: 500;
    }

    .input-wrapper {
      display: flex;
      align-items: center;
      gap: 0.4rem;

      input {
        width: 70px;
        padding: 0.35rem 0.5rem;
        border-radius: 0.5rem;
        border: 1px solid rgba(255, 255, 255, 0.12);
        background: rgba(15, 23, 42, 0.8);
        color: #f8fafc;
        font-size: 0.85rem;
        font-weight: 600;
        text-align: right;
        outline: none;
        transition: border-color 0.15s;

        &:focus {
          border-color: #34d399;
          box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
        }
      }

      span {
        font-size: 0.8rem;
        color: #64748b;
        font-weight: 600;
      }
    }
  }
`;

const GridContainer = styled.div`
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.75rem;
  padding: 0.75rem;
  flex: 1;
  overflow: auto;
  background: rgba(10, 15, 29, 0.5);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const TipBox = styled.div`
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #64748b;
  text-align: center;
  padding: 0.4rem 0.75rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.04);

  strong {
    color: #94a3b8;
  }
`;

const AutoGroupButton = styled.button`
  background: rgba(16, 185, 129, 0.12);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.28);
  border-radius: 0.5rem;
  padding: 0.35rem 0.75rem;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  transition: all 0.2s;
  box-shadow: 0 0 12px rgba(16, 185, 129, 0.1);

  &:hover {
    background: rgba(16, 185, 129, 0.2);
    border-color: rgba(16, 185, 129, 0.45);
    color: #6ee7b7;
    transform: translateY(-1px);
  }
`;

// Drag & Drop Components
const DraggableItem = ({ id, children }: { id: string, children: React.ReactNode }) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });
    const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 1000 } : undefined;
    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
            {children}
        </div>
    );
};

const DroppableContainer = ({ id, children, isOver }: { id: string, children: React.ReactNode, isOver?: boolean }) => {
    const { setNodeRef, isOver: activeIsOver } = useDroppable({ id });
    const isHovered = isOver || activeIsOver;
    return (
        <div ref={setNodeRef} style={{
            background: isHovered ? 'rgba(56, 189, 248, 0.08)' : 'rgba(15, 23, 42, 0.45)',
            border: `2px dashed ${isHovered ? '#38bdf8' : 'rgba(255, 255, 255, 0.1)'}`,
            borderRadius: '0.75rem',
            padding: '1rem',
            minHeight: '120px',
            transition: 'all 0.2s',
            boxShadow: isHovered ? '0 0 16px rgba(56, 189, 248, 0.15)' : 'inset 0 2px 4px rgba(0, 0, 0, 0.2)'
        }}>
            {children}
        </div>
    );
};



export const TransplantModal: React.FC<TransplantModalProps> = ({ isOpen, onClose, currentRoom, rooms, cloneMaps, insumos = [], onConfirm, initialMapId, initialSelectedBatchIds = [], isClosing }) => {
    const [step, setStep] = useState(1); // 1: Selection, 2: Grouping
    const [destinationId, setDestinationId] = useState('');
    const [substrateId, setSubstrateId] = useState('');
    const [volumePerPlant, setVolumePerPlant] = useState<number>(5); // Default 5L per plant
    const [loading, setLoading] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);

    // Toast State
    const [toastOpen, setToastOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToastMessage(message);
        setToastType(type);
        setToastOpen(true);
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    // Step 1: Selection
    const [activeMapId, setActiveMapId] = useState<string | null>(initialMapId || null);
    const [selectedBatchIds, setSelectedBatchIds] = useState<Set<string>>(new Set(initialSelectedBatchIds));

    // Sync state when modal opens or props change
    useEffect(() => {
        if (isOpen) {
            if (initialMapId) setActiveMapId(initialMapId);
            if (initialSelectedBatchIds) {
                // Filter out IDs that don't exist in currentRoom (e.g. recently deleted)
                const validIds = initialSelectedBatchIds.filter(id =>
                    currentRoom.batches?.some(b => b.id === id)
                );
                setSelectedBatchIds(new Set(validIds));
            }
            setStep(1); // Reset to first step
            setGroups([]);
            setSingles([]);
        }
    }, [isOpen, initialMapId, initialSelectedBatchIds, currentRoom.batches]);

    // Step 2: Grouping (Organization)
    const [groups, setGroups] = useState<{ id: string, name: string, batchIds: string[] }[]>([]);
    const [singles, setSingles] = useState<string[]>([]);
    const [organizeSelection, setOrganizeSelection] = useState<Set<string>>(new Set());

    // Selection Box State
    const [selectionBox, setSelectionBox] = useState<{ startX: number, startY: number, currentX: number, currentY: number } | null>(null);
    const singlesContainerRef = React.useRef<HTMLDivElement>(null);

    // Print State
    const [printingGroup, setPrintingGroup] = useState<{ id: string, name: string, batchIds: string[] } | null>(null);
    const labelsPrintRef = React.useRef<HTMLDivElement>(null);
    const handlePrintReact = useReactToPrint({ contentRef: labelsPrintRef });

    const handlePrintLabels = (group: { id: string, name: string, batchIds: string[] }) => {
        setPrintingGroup(group);
        // Allow render to update ref before calling print generator
        setTimeout(() => {
            handlePrintReact();
        }, 100);
    };

    // Initialize Active Map
    useEffect(() => {
        if (cloneMaps.length > 0 && !activeMapId) setActiveMapId(cloneMaps[0].id);
    }, [cloneMaps, activeMapId]);

    // Filter suitable rooms based on current room type
    const targetRooms = rooms.filter(r => {
        if (r.id === currentRoom.id) return false;

        const type = (currentRoom.type || '').toLowerCase();

        // Allow moving to Vegetation or Flowering
        if (['clones', 'esquejera', 'vegetation', 'vegetación'].includes(type)) {
            return r.type === 'vegetation' || r.type === 'flowering';
        }

        // Default fallback (e.g. from General room)
        return r.type === 'vegetation' || r.type === 'flowering';
    });



    const handleBatchClick = (batch: Batch | null) => {
        if (!batch) return;
        setSelectedBatchIds(prev => {
            const next = new Set(prev);
            if (next.has(batch.id)) next.delete(batch.id);
            else next.add(batch.id);
            return next;
        });
    };

    const handleSelectAll = (mapId: string, e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        const map = cloneMaps.find(m => m.id === mapId);
        if (!map) return;

        const mapBatches = currentRoom.batches?.filter(b => b.clone_map_id === map.id) || [];
        const mapBatchIds = mapBatches.map(b => b.id);

        // Check if all valid batches in this map are already selected
        const allSelected = mapBatchIds.length > 0 && mapBatchIds.every(id => selectedBatchIds.has(id));

        console.log('[TransplantModal] Select All Clicked', { allSelected, mapBatchIds: mapBatchIds.length });

        setSelectedBatchIds(prev => {
            const next = new Set(prev);
            if (allSelected) {
                // Deselect all from this map
                console.log('[TransplantModal] Deselecting all');
                mapBatchIds.forEach(id => next.delete(id));
            } else {
                // Select all from this map
                console.log('[TransplantModal] Selecting all');
                mapBatchIds.forEach(id => next.add(id));
            }
            return next;
        });
    };

    const handleSelectionChange = (newSelectedIds: Set<string>) => {
        setSelectedBatchIds(newSelectedIds);
    };

    const handleNextStep = () => {
        if (!destinationId) { showToast("Selecciona una sala de destino", 'error'); return; }
        if (selectedBatchIds.size === 0) { showToast("Selecciona al menos un esqueje", 'error'); return; }

        // Initialize Grouping State
        setSingles(Array.from(selectedBatchIds));
        setGroups([]);

        setIsTransitioning(true);
        setTimeout(() => {
            setStep(2);
            setIsTransitioning(false);
        }, 300);
    };

    const handleBackStep = () => {
        setIsTransitioning(true);
        setTimeout(() => {
            setStep(1);
            setIsTransitioning(false);
        }, 300);
    };

    const handleConfirm = async () => {
        setLoading(true);
        try {
            // Transform internal groups structure for parent
            const groupsPayload = groups.map(g => ({ name: g.name, batchIds: g.batchIds }));

            const totalVolume = selectedBatchIds.size * volumePerPlant;

            await onConfirm(
                destinationId,
                singles,
                groupsPayload,
                substrateId || undefined,
                substrateId ? totalVolume : undefined
            );

            onClose();
        } catch (error) {
            console.error(error);
            showToast("Error al realizar el transplante", 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOrganizeClick = (id: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent drag start interference if any
        setOrganizeSelection(prev => {
            const next = new Set(prev);
            if (e.ctrlKey || e.metaKey) {
                // Toggle
                if (next.has(id)) next.delete(id);
                else next.add(id);
            } else {
                // Exclusive select (unless already selected and dragging - handled by DND?)
                // Simple click usually selects just one.
                next.clear();
                next.add(id);
            }
            return next;
        });
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id as string;
        const targetId = over.id as string;

        // Determine items to move
        let itemsToMove: string[] = [activeId];

        // If dragging a selected item, move ALL selected items
        if (organizeSelection.has(activeId)) {
            itemsToMove = Array.from(organizeSelection);
        }

        // Helper to remove items from any source
        const removeItemsFromSource = (items: string[]) => {
            const itemSet = new Set(items);
            setSingles(prev => prev.filter(id => !itemSet.has(id)));
            setGroups(prev => prev.map(g => ({
                ...g,
                batchIds: g.batchIds.filter(id => !itemSet.has(id))
            })));
        };

        if (targetId === 'singles') {
            removeItemsFromSource(itemsToMove);
            setSingles(prev => [...prev, ...itemsToMove]);
        } else if (targetId.startsWith('group-')) {
            const groupId = targetId.replace('group-', '');
            removeItemsFromSource(itemsToMove);
            setGroups(prev => prev.map(g =>
                g.id === groupId ? { ...g, batchIds: [...g.batchIds, ...itemsToMove] } : g
            ));
        }

        // Clear selection after move? Optional but often expected.
        setOrganizeSelection(new Set());
    };

    const calculateSelection = useCallback((startX: number, startY: number, currentX: number, currentY: number, isLive: boolean) => {
        if (!singlesContainerRef.current) return;

        const boxRect = {
            left: Math.min(startX, currentX),
            top: Math.min(startY, currentY),
            right: Math.max(startX, currentX),
            bottom: Math.max(startY, currentY)
        };

        // If box is too small, ignore (prevents accidental clears on click)
        if (Math.abs(currentX - startX) < 5 && Math.abs(currentY - startY) < 5) return;

        const items = singlesContainerRef.current.querySelectorAll('[data-draggable-id]');

        setOrganizeSelection(prev => {
            const newSelection = new Set(prev);

            items.forEach((item) => {
                const rect = item.getBoundingClientRect();
                // Intersection Check
                const intersects = !(rect.right < boxRect.left ||
                    rect.left > boxRect.right ||
                    rect.bottom < boxRect.top ||
                    rect.top > boxRect.bottom);

                const id = item.getAttribute('data-draggable-id');
                if (id) {
                    if (intersects) {
                        newSelection.add(id);
                    }
                }
            });
            return newSelection;
        });
    }, []);

    // Initialize Active Map
    useEffect(() => {
        if (cloneMaps.length > 0 && !activeMapId) setActiveMapId(cloneMaps[0].id);
    }, [cloneMaps, activeMapId]);

    // Selection Box Logic
    useEffect(() => {
        if (!selectionBox) return;

        const handleMouseMove = (e: MouseEvent) => {
            setSelectionBox(prev => prev ? { ...prev, currentX: e.clientX, currentY: e.clientY } : null);
        };

        const handleMouseUp = () => {
            if (selectionBox && singlesContainerRef.current) {
                calculateSelection(selectionBox.startX, selectionBox.startY, selectionBox.currentX, selectionBox.currentY, false);
            }
            setSelectionBox(null);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [selectionBox, calculateSelection]);

    // Live Selection Calculation (Throttled ideally, but simple for now)
    useEffect(() => {
        if (!selectionBox) return;
        calculateSelection(selectionBox.startX, selectionBox.startY, selectionBox.currentX, selectionBox.currentY, true);
    }, [selectionBox, calculateSelection]);




    const handleContainerMouseDown = (e: React.MouseEvent) => {
        // Only if clicking on valid background
        if ((e.target as HTMLElement).closest('[data-draggable-id]')) return;
        if ((e.target as HTMLElement).closest('button')) return; // Ignore buttons

        e.preventDefault(); // Prevent text selection

        // If Not Ctrl/Shift, clear selection on start
        if (!e.ctrlKey && !e.shiftKey) {
            setOrganizeSelection(new Set());
        }

        setSelectionBox({
            startX: e.clientX,
            startY: e.clientY,
            currentX: e.clientX,
            currentY: e.clientY
        });
    };

    const addGroup = () => {
        const newId = Date.now().toString();
        setGroups(prev => [...prev, { id: newId, name: `Grupo ${prev.length + 1}`, batchIds: [] }]);
    };

    const removeGroup = (groupId: string) => {
        const group = groups.find(g => g.id === groupId);
        if (!group) return;
        // Move items back to singles
        setSingles(prev => [...prev, ...group.batchIds]);
        setGroups(prev => prev.filter(g => g.id !== groupId));
    };

    const autoGroup = () => {
        if (singles.length === 0) return;

        // Group singles by genetic
        const byGenetic: Record<string, string[]> = {};

        singles.forEach(id => {
            const b = getBatch(id);
            const genName = b?.genetic?.name || 'Varios';
            if (!byGenetic[genName]) byGenetic[genName] = [];
            byGenetic[genName].push(id);
        });

        const newGroups: { id: string, name: string, batchIds: string[] }[] = [];
        const timestamp = Date.now();

        Object.entries(byGenetic).forEach(([genName, ids], index) => {
            newGroups.push({
                id: `${timestamp}-${index}`,
                name: `Lote ${genName}`,
                batchIds: ids
            });
        });

        setGroups(prev => [...prev, ...newGroups]);
        setSingles([]);
    };

    if (!isOpen && !isClosing) return null;

    // Helper to get batch details
    const getBatch = (id: string) => currentRoom.batches?.find(b => b.id === id);

    return (
        <Overlay isClosing={isClosing}>
            <Content isClosing={isClosing}>
                <AmbientGlow />
                <ModalHeader>
                    <HeaderTop>
                        <HeaderInfo>
                            <IconBadge>
                                <ArrowRightLeft size={22} />
                            </IconBadge>
                            <div>
                                <Title>Trasplantar Esquejes</Title>
                                <Subtitle>Mueve esquejes seleccionados a una nueva sala y organízalos en lotes</Subtitle>
                            </div>
                        </HeaderInfo>
                        <CloseButton onClick={onClose} title="Cerrar modal">
                            <LucideX size={18} />
                        </CloseButton>
                    </HeaderTop>
                    <StepIndicator>
                        <StepPill $active={step === 1} $completed={step > 1}>
                            <StepNumber $active={step === 1} $completed={step > 1}>
                                {step > 1 ? <Check size={12} strokeWidth={3} /> : '1'}
                            </StepNumber>
                            <span>1. Selección</span>
                        </StepPill>
                        <ChevronRight size={14} color="#64748b" />
                        <StepPill $active={step === 2} $completed={false}>
                            <StepNumber $active={step === 2} $completed={false}>2</StepNumber>
                            <span>2. Organización</span>
                        </StepPill>
                    </StepIndicator>
                </ModalHeader>

                <ModalBody>
                    {step === 1 && (
                        <StepContent key="step1" $isExiting={isTransitioning}>
                            <StepFlexContainer>
                                <ColumnLeft>
                                    <Section>
                                        <Label>
                                            <MapPin size={13} style={{ color: '#38bdf8' }} /> Sala de Destino
                                        </Label>
                                        <CustomSelect
                                            value={destinationId}
                                            onChange={setDestinationId}
                                            placeholder="-- Seleccionar Sala --"
                                            options={targetRooms.map(r => ({
                                                value: r.id,
                                                label: `${r.name} (${r.type === 'flowering' ? 'Flora' : 'Veg'})`,
                                                group: r.spot?.name || 'Cultivo Principal' // Map by crop/spot name
                                            }))}
                                        />
                                    </Section>

                                    <Section>
                                        <Label>
                                            <Layers size={13} style={{ color: '#34d399' }} /> Sustrato (Opcional)
                                        </Label>
                                        <SubstrateCard>
                                            <CustomSelect
                                                value={substrateId}
                                                onChange={setSubstrateId}
                                                placeholder="-- Seleccionar Sustrato --"
                                                options={insumos.map(i => ({
                                                    value: i.id,
                                                    label: `${i.nombre} (${i.current_volume !== undefined ? i.current_volume : i.stock_actual} ${i.unit_of_measurement || i.unidad_medida} disp.)`,
                                                    group: i.categoria
                                                }))}
                                            />
                                            {substrateId && (
                                                <div className="volume-row">
                                                    <label>Volumen por planta</label>
                                                    <div className="input-wrapper">
                                                        <input
                                                            type="number"
                                                            value={volumePerPlant}
                                                            onChange={e => setVolumePerPlant(Number(e.target.value))}
                                                            min="0.1"
                                                            step="0.1"
                                                        />
                                                        <span>L</span>
                                                    </div>
                                                </div>
                                            )}
                                        </SubstrateCard>
                                    </Section>

                                    <Section>
                                        <Label>
                                            <Sparkles size={13} style={{ color: '#34d399' }} /> Resumen
                                        </Label>
                                        <SummaryCard>
                                            <div className="summary-count">{selectedBatchIds.size}</div>
                                            <div className="summary-label">
                                                {selectedBatchIds.size === 1 ? 'Planta seleccionada' : 'Plantas seleccionadas'}
                                            </div>

                                            {substrateId && selectedBatchIds.size > 0 && (
                                                <div className="substrate-estimate">
                                                    <span>Sustrato estimado:</span>
                                                    <strong>{(selectedBatchIds.size * volumePerPlant).toFixed(1)} L</strong>
                                                </div>
                                            )}
                                        </SummaryCard>
                                    </Section>
                                </ColumnLeft>
                                <ColumnRight>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        <Label style={{ marginBottom: 0 }}>
                                            <Sprout size={13} style={{ color: '#34d399' }} /> Seleccionar Esquejes
                                        </Label>
                                        {activeMapId && (() => {
                                            const map = cloneMaps.find(m => m.id === activeMapId);
                                            if (!map) return null;

                                            const mapBatches = currentRoom.batches?.filter(b => b.clone_map_id === map.id) || [];
                                            const allSelected = mapBatches.length > 0 && mapBatches.every(b => selectedBatchIds.has(b.id));

                                            return (
                                                <SelectAllButton onClick={(e) => handleSelectAll(map.id, e)} type="button">
                                                    {allSelected ? <LucideSquare size={14} /> : <LucideCheckSquare size={14} />}
                                                    {allSelected ? 'Desmarcar Todos' : 'Seleccionar Todos'}
                                                </SelectAllButton>
                                            );
                                        })()}
                                    </div>

                                    <div style={{ marginBottom: '0.75rem' }}>
                                        <TabContainer>
                                            {cloneMaps.map(map => (
                                                <Tab key={map.id} $active={activeMapId === map.id} onClick={() => setActiveMapId(map.id)} type="button">
                                                    {map.name}
                                                </Tab>
                                            ))}
                                        </TabContainer>
                                    </div>

                                    {activeMapId && (() => {
                                        const map = cloneMaps.find(m => m.id === activeMapId);
                                        if (!map) return null;

                                        return (
                                            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                                                <GridContainer>
                                                    <EsquejeraGrid
                                                        rows={map.grid_rows} cols={map.grid_columns}
                                                        batches={currentRoom.batches?.filter(b => b.clone_map_id === map.id) || []}
                                                        onBatchClick={handleBatchClick} selectedBatchIds={selectedBatchIds} selectionMode={true}
                                                        onSelectionChange={handleSelectionChange}
                                                    />
                                                </GridContainer>
                                                <TipBox>
                                                    💡 Presiona <strong>Ctrl</strong> (Windows) o <strong>Cmd</strong> (Mac) + Click para seleccionar/deseleccionar unidades de forma individual
                                                </TipBox>
                                            </div>
                                        );
                                    })()}
                                </ColumnRight>
                            </StepFlexContainer>
                        </StepContent>
                    )}

                    {step === 2 && (
                        <DndContext
                            sensors={sensors}
                            onDragEnd={handleDragEnd}
                            autoScroll={false} /* Disable auto-scroll to prevent infinite loop */
                        >
                            <StepContent key="step2" $isExiting={isTransitioning}>
                                <StepFlexContainer $overflowHidden={true}>
                                    {/* Singles Column */}
                                    <Step2Column>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Label style={{ marginBottom: 0 }}>Esquejes Individuales</Label>
                                                <ShadcnBadge variant="secondary">
                                                    {singles.length} disp.
                                                </ShadcnBadge>
                                            </div>
                                            {singles.length > 0 && (
                                                <AutoGroupButton
                                                    onClick={autoGroup}
                                                    type="button"
                                                    title="Agrupar automáticamente por Genética"
                                                >
                                                    <Sparkles size={13} /> Agrupar Todo
                                                </AutoGroupButton>
                                            )}
                                        </div>
                                        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
                                            <DroppableContainer id="singles">
                                                {/* Selection Box Visual - Rendered via Portal to avoid transform issues */}
                                                {selectionBox && createPortal(
                                                    <div style={{
                                                        position: 'fixed',
                                                        left: Math.min(selectionBox.startX, selectionBox.currentX),
                                                        top: Math.min(selectionBox.startY, selectionBox.currentY),
                                                        width: Math.abs(selectionBox.currentX - selectionBox.startX),
                                                        height: Math.abs(selectionBox.currentY - selectionBox.startY),
                                                        background: 'rgba(56, 189, 248, 0.2)',
                                                        border: '1px solid #38bdf8',
                                                        pointerEvents: 'none',
                                                        zIndex: 9999
                                                    }} />,
                                                    document.body
                                                )}

                                                <div
                                                    ref={singlesContainerRef}
                                                    onMouseDown={handleContainerMouseDown}
                                                    style={{ minHeight: '100%', paddingBottom: '2rem' }} // Ensure area to click
                                                >
                                                    {(() => {
                                                        // Group singles by genetic
                                                        const grouped = singles.reduce((acc, id) => {
                                                            const batch = getBatch(id);
                                                            if (!batch) return acc; // Skip invalid/ghost IDs

                                                            // Better fallback: Genetic Name -> Batch Name -> "Sin Nombre"
                                                            const geneticName = batch.genetic?.name || batch.name || 'Sin Nombre';

                                                            if (!acc[geneticName]) acc[geneticName] = [];
                                                            acc[geneticName].push(id);
                                                            return acc;
                                                        }, {} as Record<string, string[]>);

                                                        return Object.entries(grouped).map(([geneticName, ids]) => (
                                                            <div key={geneticName} style={{ marginBottom: '1.25rem' }}>
                                                                <div style={{
                                                                    fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8',
                                                                    marginBottom: '0.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.35rem',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                                                                }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                                        <Sprout size={14} color="#34d399" />
                                                                        <span style={{ color: '#f8fafc' }}>{geneticName}</span>
                                                                    </div>
                                                                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{ids.length} esquejes</span>
                                                                </div>
                                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                                    {ids.map(id => {
                                                                        const b = getBatch(id);
                                                                        const isSelected = organizeSelection.has(id);
                                                                        return (
                                                                            <DraggableItem key={id} id={id}>
                                                                                <div
                                                                                    data-draggable-id={id}
                                                                                    onClick={(e) => handleOrganizeClick(id, e)}
                                                                                    style={{
                                                                                        padding: '0.4rem 0.7rem',
                                                                                        background: isSelected ? 'rgba(56, 189, 248, 0.2)' : 'rgba(30, 41, 59, 0.7)',
                                                                                        border: isSelected ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                                                                                        borderRadius: '0.5rem',
                                                                                        fontSize: '0.8rem', cursor: 'grab',
                                                                                        boxShadow: isSelected ? '0 0 12px rgba(56, 189, 248, 0.3)' : '0 1px 2px rgba(0,0,0,0.2)',
                                                                                        transition: 'all 0.15s ease',
                                                                                        userSelect: 'none',
                                                                                        display: 'flex',
                                                                                        alignItems: 'center',
                                                                                        gap: '0.4rem'
                                                                                    }}>
                                                                                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: isSelected ? '#38bdf8' : '#34d399' }} />
                                                                                    <strong style={{ color: isSelected ? '#38bdf8' : '#e2e8f0' }}>{b?.tracking_code}</strong>
                                                                                </div>
                                                                            </DraggableItem>
                                                                        )
                                                                    })}
                                                                </div>
                                                            </div>
                                                        ));
                                                    })()}
                                                </div>
                                            </DroppableContainer>
                                        </div>
                                    </Step2Column>

                                    {/* Groups Column */}
                                    <Step2Column>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Label style={{ marginBottom: 0 }}>Grupos Nuevos</Label>
                                                <ShadcnBadge variant="emerald">
                                                    {groups.length} creados
                                                </ShadcnBadge>
                                            </div>
                                            <ShadcnButton
                                                variant="default"
                                                size="sm"
                                                onClick={addGroup}
                                                type="button"
                                                style={{ height: 32, padding: '0 0.75rem', fontSize: '0.8rem' }}
                                            >
                                                <LucidePlus size={14} style={{ marginRight: 4 }} /> Nuevo Grupo
                                            </ShadcnButton>
                                        </div>
                                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.25rem' }}>
                                            {groups.map(group => (
                                                <div key={group.id} style={{ 
                                                    border: '1px solid rgba(255, 255, 255, 0.1)', 
                                                    borderRadius: '0.75rem', 
                                                    overflow: 'hidden', 
                                                    flexShrink: 0,
                                                    background: 'rgba(15, 23, 42, 0.5)',
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                                                }}>
                                                    <div style={{ 
                                                        background: 'rgba(30, 41, 59, 0.75)', 
                                                        padding: '0.6rem 0.85rem', 
                                                        display: 'flex', 
                                                        justifyContent: 'space-between', 
                                                        alignItems: 'center',
                                                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                                                            <Layers size={14} color="#34d399" />
                                                            <input
                                                                value={group.name}
                                                                onChange={e => setGroups(prev => prev.map(g => g.id === group.id ? { ...g, name: e.target.value } : g))}
                                                                style={{ 
                                                                    border: '1px solid transparent',
                                                                    borderRadius: '0.375rem',
                                                                    padding: '0.2rem 0.4rem',
                                                                    background: 'transparent', 
                                                                    fontWeight: 600, 
                                                                    fontSize: '0.875rem',
                                                                    color: '#f8fafc',
                                                                    outline: 'none',
                                                                    width: '80%',
                                                                    transition: 'all 0.15s ease'
                                                                }}
                                                            />
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                            <button
                                                                onClick={() => handlePrintLabels(group)}
                                                                title="Imprimir Etiquetas"
                                                                type="button"
                                                                style={{ 
                                                                    color: '#cbd5e1', 
                                                                    border: '1px solid rgba(255, 255, 255, 0.1)', 
                                                                    background: 'rgba(255, 255, 255, 0.05)', 
                                                                    cursor: 'pointer', 
                                                                    width: 28,
                                                                    height: 28,
                                                                    borderRadius: '0.375rem',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    transition: 'all 0.15s ease'
                                                                }}
                                                            >
                                                                <LucidePrinter size={13} />
                                                            </button>
                                                            <button 
                                                                onClick={() => removeGroup(group.id)} 
                                                                title="Eliminar Grupo"
                                                                type="button"
                                                                style={{ 
                                                                    color: '#f87171', 
                                                                    border: '1px solid rgba(248, 113, 113, 0.25)', 
                                                                    background: 'rgba(239, 68, 68, 0.1)', 
                                                                    cursor: 'pointer', 
                                                                    width: 28,
                                                                    height: 28,
                                                                    borderRadius: '0.375rem',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    transition: 'all 0.15s ease'
                                                                }}
                                                            >
                                                                <LucideTrash2 size={13} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <DroppableContainer id={`group-${group.id}`}>
                                                        {group.batchIds.length === 0 && (
                                                            <span style={{ color: '#64748b', fontSize: '0.8rem', fontStyle: 'italic', display: 'block', textAlign: 'center', padding: '0.75rem 0' }}>
                                                                Arrastra esquejes aquí para asignarlos al lote
                                                            </span>
                                                        )}
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                            {group.batchIds.map(id => {
                                                                const b = getBatch(id);
                                                                const isSelected = organizeSelection.has(id);
                                                                return (
                                                                    <DraggableItem key={id} id={id}>
                                                                        <div
                                                                            onClick={(e) => handleOrganizeClick(id, e)}
                                                                            style={{
                                                                                padding: '0.35rem 0.65rem',
                                                                                background: isSelected ? 'rgba(56, 189, 248, 0.2)' : 'rgba(16, 185, 129, 0.12)',
                                                                                borderRadius: '0.5rem',
                                                                                fontSize: '0.75rem', fontWeight: 600,
                                                                                color: isSelected ? '#38bdf8' : '#34d399',
                                                                                cursor: 'grab',
                                                                                border: isSelected ? '1px solid #38bdf8' : '1px solid rgba(16, 185, 129, 0.28)',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                gap: '0.3rem',
                                                                                boxShadow: isSelected ? '0 0 10px rgba(56, 189, 248, 0.25)' : 'none',
                                                                                transition: 'all 0.15s ease'
                                                                            }}>
                                                                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: isSelected ? '#38bdf8' : '#34d399' }} />
                                                                            {b?.tracking_code}
                                                                        </div>
                                                                    </DraggableItem>
                                                                )
                                                            })}
                                                        </div>
                                                    </DroppableContainer>
                                                </div>
                                            ))}
                                        </div>
                                    </Step2Column>
                                </StepFlexContainer>
                            </StepContent>
                        </DndContext>
                    )}
                </ModalBody>

                <ModalFooter>
                    {step === 1 ? (
                        <>
                            <ShadcnButton variant="secondary" onClick={onClose} type="button">
                                Cancelar
                            </ShadcnButton>
                            <ShadcnButton variant="default" onClick={handleNextStep} type="button">
                                Siguiente: Organizar <ChevronRight size={16} style={{ marginLeft: 6 }} />
                            </ShadcnButton>
                        </>
                    ) : (
                        <>
                            <ShadcnButton variant="secondary" onClick={handleBackStep} type="button">
                                <ArrowLeft size={16} style={{ marginRight: 6 }} /> Atrás
                            </ShadcnButton>
                            <ShadcnButton variant="default" onClick={handleConfirm} disabled={loading} type="button">
                                {loading ? 'Procesando...' : (
                                    <>
                                        <Check size={16} style={{ marginRight: 6 }} /> Confirmar Trasplante
                                    </>
                                )}
                            </ShadcnButton>
                        </>
                    )}
                </ModalFooter>
            </Content>

            {/* Hidden Print Area */}
            <div style={{ display: 'none' }}>
                <div ref={labelsPrintRef}>
                    {printingGroup && (
                        <PrintableBatchLabels
                            batches={printingGroup.batchIds.map(id => getBatch(id)).filter(Boolean) as Batch[]}
                        />
                    )}
                </div>
            </div>

            <ToastModal
                isOpen={toastOpen}
                message={toastMessage}
                type={toastType}
                onClose={() => setToastOpen(false)}
            />
        </Overlay >
    );
};
