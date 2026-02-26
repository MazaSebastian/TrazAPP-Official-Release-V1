import React, { useState, useMemo } from 'react';
import styled, { keyframes } from 'styled-components';
import { Batch, Room } from '../../types/rooms';
import { FaTimes, FaCut, FaCheck, FaLeaf } from 'react-icons/fa';
import { CustomSelect } from '../CustomSelect';

interface HarvestModalProps {
    isOpen: boolean;
    isClosing?: boolean;
    onClose: () => void;
    batches: Batch[]; // Batches in the current room
    rooms: Room[]; // Available rooms to potentially move to (Drying)
    onConfirm: (selectedBatchesData: { id: string, weight: number }[], targetRoomId?: string) => Promise<void>;
    overrideGroupName?: string;
}

const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;
const fadeOut = keyframes`from { opacity: 1; } to { opacity: 0; }`;
const scaleIn = keyframes`from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; }`;
const scaleOut = keyframes`from { transform: scale(1); opacity: 1; } to { transform: scale(0.95); opacity: 0; }`;

const Overlay = styled.div<{ $isClosing?: boolean }>`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5); z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(2px);
  animation: ${p => p.$isClosing ? fadeOut : fadeIn} 0.3s forwards;
`;

const Content = styled.div<{ $isClosing?: boolean }>`
  background: rgba(15, 23, 42, 0.95); padding: 0; border-radius: 1rem;
  width: 90%; max-width: 600px; max-height: 85vh;
  display: flex; flex-direction: column;
  box-shadow: 0 10px 25px rgba(0,0,0,0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  animation: ${p => p.$isClosing ? scaleOut : scaleIn} 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;

  @media (max-width: 768px) {
    width: 95%; /* More width on mobile */
    max-height: 90vh;
  }
`;

const Header = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex; justify-content: space-between; align-items: center;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const Title = styled.h2`
  margin: 0; font-size: 1.25rem; color: #f8fafc;
  display: flex; align-items: center; gap: 0.5rem;
`;

const CloseButton = styled.button`
  background: none; border: none; color: #94a3b8; cursor: pointer;
  font-size: 1.25rem; transition: color 0.2s;
  &:hover { color: #f87171; }
`;

const Body = styled.div`
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const Footer = styled.div`
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(15, 23, 42, 0.6);
  display: flex; justify-content: flex-end; gap: 1rem;
  border-radius: 0 0 1rem 1rem;

  @media (max-width: 768px) {
    padding: 1rem;
    flex-direction: column-reverse; /* Stack buttons with confirm on top/bottom based on design (usually cancel on bottom) */
    gap: 0.75rem;
  }
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  border: ${p => p.$variant === 'secondary' ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid transparent'};
  background: ${p => p.$variant === 'primary' ? 'rgba(74, 222, 128, 0.2)' : p.$variant === 'danger' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.05)'};
  color: ${p => p.$variant === 'primary' ? '#4ade80' : p.$variant === 'danger' ? '#f87171' : '#cbd5e1'};
  border-color: ${p => p.$variant === 'primary' ? 'rgba(74, 222, 128, 0.5)' : p.$variant === 'danger' ? 'rgba(239, 68, 68, 0.5)' : undefined};
  transition: all 0.2s;
  backdrop-filter: blur(8px);

  &:hover {
    background: ${p => p.$variant === 'primary' ? 'rgba(74, 222, 128, 0.3)' : p.$variant === 'danger' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.1)'};
    transform: translateY(-1px);
    color: ${p => p.$variant === 'secondary' ? '#f8fafc' : undefined};
  }
  &:disabled {
    opacity: 0.5; cursor: not-allowed; transform: none;
  }

  @media (max-width: 768px) {
    width: 100%; /* Full width buttons on mobile */
    padding: 0.875rem 1rem;
    font-size: 1rem;
  }
`;

const BatchList = styled.div`
  display: flex; flex-direction: column; gap: 0.5rem;
`;

const GeneticGroup = styled.div`
  margin-bottom: 0.5rem;
`;

const GroupHeader = styled.div`
  font-weight: 700; color: #f8fafc; margin-bottom: 0.75rem;
  display: flex; align-items: center; justify-content: space-between;
  background: rgba(30, 41, 59, 0.6); padding: 0.75rem 1rem; border-radius: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: all 0.2s;
  backdrop-filter: blur(12px);

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
`;

const BatchItem = styled.div<{ $selected: boolean }>`
  display: flex; align-items: center; justify-content: space-between; gap: 1rem;
  padding: 0.5rem 1rem;
  background: ${p => p.$selected ? 'rgba(74, 222, 128, 0.1)' : 'rgba(15, 23, 42, 0.4)'};
  border: 1px solid ${p => p.$selected ? 'rgba(74, 222, 128, 0.5)' : 'rgba(255, 255, 255, 0.05)'};
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.1s ease;
  user-select: none; /* Important for Shift+Click to avoid text selection */

  &:hover {
    background: ${p => p.$selected ? 'rgba(74, 222, 128, 0.15)' : 'rgba(255, 255, 255, 0.05)'};
    border-color: ${p => p.$selected ? '#4ade80' : 'rgba(255, 255, 255, 0.2)'};
  }
`;



const Checkbox = styled.div<{ $checked: boolean }>`
  width: 20px; height: 20px;
  border: 2px solid ${p => p.$checked ? '#4ade80' : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 4px;
  display: flex; align-items: center; justify-content: center;
  background: ${p => p.$checked ? '#4ade80' : 'rgba(15, 23, 42, 0.6)'};
  color: #0f172a; font-size: 0.8rem;
`;

export const HarvestModal: React.FC<HarvestModalProps> = ({ isOpen, isClosing, onClose, batches, rooms, onConfirm, overrideGroupName }) => {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set()); // Track expanded groups
    const [targetRoomId, setTargetRoomId] = useState<string>('');
    const [loading, setLoading] = useState(false);

    // Initial Selection (Select All by default)
    React.useEffect(() => {
        if (isOpen && batches.length > 0) {
            setSelectedIds(new Set(batches.map(b => b.id)));
        }
    }, [isOpen, batches]);

    // Filter Drying Rooms (Expanded for Curing)
    const dryingRooms = useMemo(() => {
        return rooms.filter(r => {
            const t = (r.type || '').toLowerCase();
            return ['drying', 'secado', 'curing', 'curado'].some(type => t.includes(type));
        });
    }, [rooms]);

    // Prepare Options for CustomSelect
    const roomOptions = useMemo(() => {
        return [
            { value: "", label: "Seleccione Sala de Secado de destino" },
            ...dryingRooms.map(r => ({ value: r.id, label: r.name }))
        ];
    }, [dryingRooms]);



    // Group batches by Lote (Parent Batch) -> Genetic
    const groupedBatches = useMemo(() => {
        const groups: Record<string, Batch[]> = {};
        batches.forEach(b => {
            // 1. Check for Override (Map Context)
            if (overrideGroupName) {
                if (!groups[overrideGroupName]) groups[overrideGroupName] = [];
                groups[overrideGroupName].push(b);
                return;
            }

            // 2. Check for Custom Group [Grupo: X]
            const groupMatch = b.notes?.match(/\[Grupo:\s*(.*?)\]/);
            const customGroupName = groupMatch ? groupMatch[1].trim() : null;

            // 3. Use custom group name if available, otherwise parent_batch name, otherwise fallback to Genetic
            const loteName = customGroupName || b.parent_batch?.name || `Lote ${b.genetic?.name || 'Desconocido'}`;
            const groupKey = loteName;

            if (!groups[groupKey]) groups[groupKey] = [];
            groups[groupKey].push(b);
        });
        return groups;
    }, [batches, overrideGroupName]);

    const toggleBatch = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
                // Optionally clear weight when unselected, but maybe keep it in case they re-select
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const toggleGroupSelection = (batchIds: string[], e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent toggling expansion
        const allSelected = batchIds.every(id => selectedIds.has(id));
        setSelectedIds(prev => {
            const next = new Set(prev);
            batchIds.forEach(id => {
                if (allSelected) next.delete(id);
                else next.add(id);
            });
            return next;
        });
    };

    const toggleGroupExpansion = (groupName: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            if (next.has(groupName)) next.delete(groupName);
            else next.add(groupName);
            return next;
        });
    };

    const handleBatchClick = (id: string, e: React.MouseEvent) => {
        // Only trigger selection toggle if the click wasn't on the input field
        if ((e.target as HTMLElement).tagName.toLowerCase() === 'input' && (e.target as HTMLInputElement).type === 'number') {
            return;
        }

        if (e.shiftKey && lastSelectedId) {
            // Range Selection
            const allBatches = Object.values(groupedBatches).flat();
            const currentIndex = allBatches.findIndex(b => b.id === id);
            const lastIndex = allBatches.findIndex(b => b.id === lastSelectedId);

            if (currentIndex !== -1 && lastIndex !== -1) {
                const start = Math.min(currentIndex, lastIndex);
                const end = Math.max(currentIndex, lastIndex);
                const range = allBatches.slice(start, end + 1).map(b => b.id);

                const newSet = new Set(selectedIds);
                range.forEach(rid => newSet.add(rid));
                setSelectedIds(newSet);
            }
        } else {
            // Standard Toggle
            toggleBatch(id);
        }
        setLastSelectedId(id);
    };

    const isConfirmDisabled = useMemo(() => {
        if (loading || selectedIds.size === 0 || !targetRoomId) return true;
        return false;
    }, [loading, selectedIds, targetRoomId]);

    const handleConfirm = async () => {
        if (isConfirmDisabled) return;
        setLoading(true);
        try {
            const payload = Array.from(selectedIds).map(id => ({
                id,
                weight: 0 // Weight is no longer collected here
            }));
            await onConfirm(payload, targetRoomId || undefined);
            // Parent handles loading state if needed, but we close here implies success?
            // Actually parent usually reloads. We should wait for promise.
            // onConfirm is async props.
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            onClose();
        }
    };

    if (!isOpen && !isClosing) return null;

    return (
        <Overlay $isClosing={isClosing}>
            <Content $isClosing={isClosing}>
                <Header>
                    <Title><FaCut /> Cosechar Plantas</Title>
                    <CloseButton onClick={onClose}><FaTimes /></CloseButton>
                </Header>
                <Body>
                    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>
                        Sala de Destino (Secado)
                    </label>
                    <div style={{ marginBottom: '1.5rem', position: 'relative', zIndex: 10 }}>
                        <CustomSelect
                            value={targetRoomId}
                            onChange={setTargetRoomId}
                            options={roomOptions}
                            placeholder="Seleccionar sala de destino..."
                        />
                    </div>

                    <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ fontWeight: 'bold', color: '#f8fafc' }}>
                            Seleccionadas: {selectedIds.size} de {batches.length}
                        </div>
                    </div>

                    <BatchList>
                        {Object.entries(groupedBatches).map(([genName, groupBatches]) => {
                            const groupIds = groupBatches.map(b => b.id);
                            const allSelected = groupIds.every(id => selectedIds.has(id));
                            const someSelected = groupIds.some(id => selectedIds.has(id));
                            const isExpanded = expandedGroups.has(genName);

                            return (
                                <GeneticGroup key={genName}>
                                    <GroupHeader onClick={() => toggleGroupExpansion(genName)}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', display: 'inline-block' }}>▶</span>
                                            <span>{genName} ({groupBatches.length})</span>
                                        </div>
                                        <div onClick={(e) => toggleGroupSelection(groupIds, e)}>
                                            <Checkbox $checked={allSelected}>
                                                {allSelected && <FaCheck />}
                                                {!allSelected && someSelected && <div style={{ width: 8, height: 2, background: 'white' }} />}
                                            </Checkbox>
                                        </div>
                                    </GroupHeader>
                                    {isExpanded && (
                                        <div style={{ paddingLeft: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {groupBatches.map(batch => {
                                                const isSelected = selectedIds.has(batch.id);
                                                return (
                                                    <BatchItem
                                                        key={batch.id}
                                                        $selected={isSelected}
                                                        onClick={(e) => handleBatchClick(batch.id, e)}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                                                            <Checkbox $checked={isSelected}>
                                                                {isSelected && <FaCheck />}
                                                            </Checkbox>
                                                            <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                <FaLeaf color="#4ade80" size={12} />
                                                                {batch.tracking_code || batch.name}
                                                            </div>
                                                        </div>

                                                        <div style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                            <span><strong style={{ color: '#cbd5e1' }}>{batch.quantity}</strong> u.</span>
                                                            <span style={{ color: 'rgba(255, 255, 255, 0.1)' }}>|</span>
                                                            <span style={{ opacity: 0.5 }}>{batch.stage === 'flowering' ? 'Florando' : batch.stage}</span>
                                                        </div>
                                                    </BatchItem>
                                                );
                                            })}
                                        </div>
                                    )}
                                </GeneticGroup>
                            );
                        })}
                    </BatchList>
                </Body>
                <Footer>
                    <Button $variant="secondary" onClick={onClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button $variant="primary" onClick={handleConfirm} disabled={isConfirmDisabled}>
                        {loading ? 'Procesando...' : `Confirmar Cosecha (${selectedIds.size})`}
                    </Button>
                </Footer>
            </Content>
        </Overlay>
    );
};
