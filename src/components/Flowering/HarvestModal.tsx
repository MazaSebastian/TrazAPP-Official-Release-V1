import React, { useState, useMemo } from 'react';
import styled, { keyframes } from 'styled-components';
import { Batch, Room } from '../../types/rooms';
import { 
    Scissors, 
    Check as LucideCheck, 
    Leaf as LucideLeaf, 
    X as LucideX, 
    ChevronRight as LucideChevronRight, 
    ChevronDown as LucideChevronDown, 
    Sparkles, 
    Layers
} from 'lucide-react';
import { Button as ShadcnButton } from '../ui/Button';
import { Badge as ShadcnBadge } from '../ui/Badge';
import { CustomSelect } from '../CustomSelect';

interface HarvestModalProps {
    isOpen: boolean;
    isClosing?: boolean;
    onClose: () => void;
    batches: Batch[]; // Batches in the current room
    rooms: Room[]; // Available rooms to potentially move to (Drying)
    onConfirm: (selectedBatchesData: { id: string, weight: number }[], targetRoomId?: string) => Promise<void>;
    overrideGroupName?: string;
    maps?: any[]; // Allow passing table/map definitions to group by them
}

const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;
const fadeOut = keyframes`from { opacity: 1; } to { opacity: 0; }`;
const scaleIn = keyframes`from { transform: scale(0.96); opacity: 0; } to { transform: scale(1); opacity: 1; }`;
const scaleOut = keyframes`from { transform: scale(1); opacity: 1; } to { transform: scale(0.96); opacity: 0; }`;

const Overlay = styled.div<{ $isClosing?: boolean }>`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.75); z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(12px);
  animation: ${p => p.$isClosing ? fadeOut : fadeIn} 0.2s ease-in-out forwards;
`;

const Content = styled.div<{ $isClosing?: boolean }>`
  background: rgba(15, 23, 42, 0.96); 
  padding: 0; 
  border-radius: 1.25rem;
  width: 90%; 
  max-width: 620px; 
  max-height: 85vh;
  display: flex; 
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(24px);
  animation: ${p => p.$isClosing ? scaleOut : scaleIn} 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  overflow: hidden;

  @media (max-width: 768px) {
    width: 95%;
    max-height: 90vh;
  }
`;

const Header = styled.div`
  padding: 1.5rem 1.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(15, 23, 42, 0.5);
  display: flex; 
  justify-content: space-between; 
  align-items: flex-start;

  @media (max-width: 768px) {
    padding: 1.25rem 1rem;
  }
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
  background: linear-gradient(135deg, rgba(74, 222, 128, 0.2), rgba(16, 185, 129, 0.05));
  border: 1px solid rgba(74, 222, 128, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4ade80;
  box-shadow: 0 0 20px rgba(74, 222, 128, 0.15);
`;

const Title = styled.h2`
  margin: 0; 
  font-size: 1.25rem; 
  font-weight: 700;
  color: #f8fafc;
  letter-spacing: -0.02em;
  display: flex; 
  align-items: center; 
  gap: 0.5rem;
`;

const Subtitle = styled.p`
  margin: 0.25rem 0 0 0;
  font-size: 0.825rem;
  color: #94a3b8;
`;

const CloseButton = styled.button`
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #94a3b8;
  width: 36px;
  height: 36px;
  border-radius: 0.625rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #f8fafc;
    border-color: rgba(255, 255, 255, 0.2);
    transform: scale(1.05);
  }
`;

const Body = styled.div`
  padding: 1.5rem 1.75rem;
  overflow-y: auto;
  flex: 1;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const Footer = styled.div`
  padding: 1.25rem 1.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(15, 23, 42, 0.6);
  display: flex; 
  justify-content: flex-end; 
  align-items: center;
  gap: 1rem;

  @media (max-width: 768px) {
    padding: 1rem;
    flex-direction: column-reverse;
    gap: 0.75rem;
    button {
      width: 100%;
    }
  }
`;

const BatchList = styled.div`
  display: flex; flex-direction: column; gap: 0.6rem;
`;

const GeneticGroup = styled.div`
  margin-bottom: 0.5rem;
`;

const GroupHeader = styled.div`
  font-weight: 600; 
  color: #f8fafc; 
  margin-bottom: 0.5rem;
  display: flex; 
  align-items: center; 
  justify-content: space-between;
  background: rgba(30, 41, 59, 0.6); 
  padding: 0.65rem 1rem; 
  border-radius: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(12px);

  &:hover {
    background: rgba(30, 41, 59, 0.85);
    border-color: rgba(255, 255, 255, 0.15);
  }
`;

const BatchItem = styled.div<{ $selected: boolean }>`
  display: flex; align-items: center; justify-content: space-between; gap: 1rem;
  padding: 0.6rem 1rem;
  background: ${p => p.$selected ? 'rgba(74, 222, 128, 0.08)' : 'rgba(15, 23, 42, 0.4)'};
  border: 1px solid ${p => p.$selected ? 'rgba(74, 222, 128, 0.4)' : 'rgba(255, 255, 255, 0.06)'};
  border-radius: 0.625rem;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;

  &:hover {
    background: ${p => p.$selected ? 'rgba(74, 222, 128, 0.14)' : 'rgba(255, 255, 255, 0.05)'};
    border-color: ${p => p.$selected ? '#4ade80' : 'rgba(255, 255, 255, 0.18)'};
  }
`;

const Checkbox = styled.div<{ $checked: boolean }>`
  width: 20px; height: 20px;
  border: 1.5px solid ${p => p.$checked ? '#4ade80' : 'rgba(255, 255, 255, 0.25)'};
  border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  background: ${p => p.$checked ? '#4ade80' : 'rgba(15, 23, 42, 0.6)'};
  color: #0f172a; font-size: 0.8rem;
  transition: all 0.15s ease;
`;

export const HarvestModal: React.FC<HarvestModalProps> = ({ isOpen, isClosing, onClose, batches, rooms, onConfirm, overrideGroupName, maps }) => {
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

            // 3. Prioritize map name, parent batch name, or tracking code
            const mapName = b.clone_map_id && maps ? maps.find(m => m.id === b.clone_map_id)?.name : null;
            const parentName = b.parent_batch?.name;
            const ownName = b.tracking_code ? `${b.tracking_code} - ${b.name}` : b.name;
            const fallbackGenetic = `Lote ${b.genetic?.name || 'Desconocida'}`;

            const loteName = overrideGroupName || customGroupName || mapName || parentName || ownName || fallbackGenetic;
            const groupKey = loteName;

            if (!groups[groupKey]) groups[groupKey] = [];
            groups[groupKey].push(b);
        });
        return groups;
    }, [batches, overrideGroupName, maps]);

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
                    <HeaderInfo>
                        <IconBadge>
                            <Scissors size={20} />
                        </IconBadge>
                        <div>
                            <Title>Cosechar Plantas</Title>
                            <Subtitle>Selecciona los lotes y la sala de secado de destino</Subtitle>
                        </div>
                    </HeaderInfo>
                    <CloseButton onClick={onClose} title="Cerrar modal">
                        <LucideX size={18} />
                    </CloseButton>
                </Header>
                <Body>
                    <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontSize: '0.85rem' }}>
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Plantas seleccionadas:</span>
                            <ShadcnBadge variant="emerald">
                                {selectedIds.size} de {batches.length}
                            </ShadcnBadge>
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
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                            <span style={{ 
                                                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', 
                                                transition: 'transform 0.2s ease', 
                                                display: 'flex',
                                                alignItems: 'center',
                                                color: isExpanded ? '#4ade80' : '#94a3b8'
                                            }}>
                                                <LucideChevronRight size={16} />
                                            </span>
                                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{genName}</span>
                                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>({groupBatches.length})</span>
                                        </div>
                                        <div onClick={(e) => toggleGroupSelection(groupIds, e)}>
                                            <Checkbox $checked={allSelected}>
                                                {allSelected && <LucideCheck size={12} strokeWidth={3} />}
                                                {!allSelected && someSelected && <div style={{ width: 8, height: 2, background: 'white', borderRadius: 1 }} />}
                                            </Checkbox>
                                        </div>
                                    </GroupHeader>
                                    {isExpanded && (
                                        <div style={{ paddingLeft: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.25rem' }}>
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
                                                                {isSelected && <LucideCheck size={12} strokeWidth={3} />}
                                                            </Checkbox>
                                                            <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                <LucideLeaf color="#4ade80" size={13} />
                                                                {batch.tracking_code || batch.name}
                                                            </div>
                                                        </div>

                                                        <div style={{ fontSize: '0.825rem', color: '#94a3b8', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                                            <span><strong style={{ color: '#cbd5e1' }}>{batch.quantity}</strong> u.</span>
                                                            <span style={{ color: 'rgba(255, 255, 255, 0.15)' }}>•</span>
                                                            <span style={{ color: '#64748b' }}>{batch.stage === 'flowering' ? 'Florando' : batch.stage}</span>
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
                    <ShadcnButton variant="secondary" onClick={onClose} disabled={loading}>
                        Cancelar
                    </ShadcnButton>
                    <ShadcnButton variant="default" onClick={handleConfirm} disabled={isConfirmDisabled}>
                        {loading ? 'Procesando...' : (
                            <>
                                <Scissors size={15} style={{ marginRight: 6 }} />
                                Confirmar Cosecha ({selectedIds.size})
                            </>
                        )}
                    </ShadcnButton>
                </Footer>
            </Content>
        </Overlay>
    );
};
