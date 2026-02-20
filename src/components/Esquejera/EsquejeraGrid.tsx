import React from 'react';
import styled from 'styled-components';
import { useDroppable } from '@dnd-kit/core';
import { Batch } from '../../types/rooms';
import { FaLeaf, FaSearchPlus, FaSearchMinus } from 'react-icons/fa';
import { getGeneticColor } from '../../utils/geneticColors';
import { useGridSelection } from '../../hooks/useGridSelection';
import { createPortal } from 'react-dom';


// --- Styled Components ---

// Zoom Controls Components (copied/adapted from LivingSoilGrid)
const ControlsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(12px);
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  width: fit-content;
`;

const ZoomButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  color: #94a3b8;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.25rem;
  transition: all 0.2s;
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #f8fafc;
  }
`;

const ZoomLabel = styled.span`
  font-size: 0.75rem;
  color: #cbd5e1;
  font-family: monospace;
  min-width: 3rem;
  text-align: center;
`;

const GridContainer = styled.div<{ rows: number; cols: number; cellSize: number }>`
  display: grid;
  grid-template-columns: 40px repeat(${p => p.cols}, ${p => p.cellSize}px);
  grid-template-rows: 40px repeat(${p => p.rows}, ${p => p.cellSize}px);
  gap: ${p => p.cellSize < 40 ? '1px' : '4px'};
  overflow: auto;
  max-width: 100%;
  padding: 1rem;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(12px);
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  
  /* Custom Scrollbar to match LivingSoilGrid */
  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  &::-webkit-scrollbar-track {
    background: rgba(15, 23, 42, 0.5);
    border-radius: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    &:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  }

  @media print {
    overflow: visible !important;
    border: 2px solid #000 !important; /* Outer border for the whole grid */
    box-shadow: none;
    max-width: none !important;
    display: grid !important;
    height: auto !important;
    width: 100% !important;
    margin: 0 auto !important;
    background: transparent !important; /* Allow background to show */
    padding: 0 !important;
    
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    
    /* Force grid to fit page width */
    grid-template-columns: 30px repeat(${p => p.cols}, 1fr) !important;
    grid-template-rows: 30px repeat(${p => p.rows}, minmax(30px, auto)) !important;
    gap: 0 !important;
    
    /* Force children to be visible */
    & > * {
      visibility: visible !important;
      /* display: block !important; - Removed to preserve flex on HeaderCell */
    }
  }
`;

const HeaderCell = styled.div<{ cellSize: number }>`
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #94a3b8;
  background: rgba(255, 255, 255, 0.05);
  border-radius: ${p => p.cellSize < 40 ? '1px' : '0.375rem'};
  font-size: ${p => p.cellSize < 40 ? '0.6rem' : '0.85rem'};
  width: 100%;
  height: 100%;

  @media print {
    border: 1px solid #000 !important;
    color: #000 !important;
    background: #e2e8f0 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
`;

const CellStyled = styled.div<{ $isOver?: boolean; $isOccupied?: boolean; $geneticColor?: string; $isPainting?: boolean; $isSelected?: boolean; cellSize: number; $hasAlert?: boolean }>`
  background: ${p => p.$isSelected ? 'rgba(74, 222, 128, 0.2)' : p.$isOccupied ? (p.$geneticColor || 'rgba(30, 41, 59, 0.8)') : p.$isOver ? 'rgba(56, 189, 248, 0.1)' : 'rgba(30, 41, 59, 0.3)'};
  backdrop-filter: ${p => p.$isOccupied ? 'none' : 'blur(4px)'};
  
  /* Border Logic matching LivingSoilGrid */
  border: ${p => p.$isSelected
        ? '2px solid rgba(74, 222, 128, 0.5)'
        : p.cellSize < 40
            ? '1px solid ' + (p.$isOccupied ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)')
            : '2px ' + (p.$isOccupied ? 'solid rgba(255, 255, 255, 0.1)' : 'dashed rgba(255, 255, 255, 0.05)')
    };

  box-sizing: border-box;
  width: 100%;
  height: 100%;
  border-radius: 0.375rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.2s;
  cursor: ${p => p.$isOccupied || p.$isPainting ? 'pointer' : 'default'};
  overflow: hidden;

  /* Alert Overlay Logic */
  ${p => p.$hasAlert && `
    &::after {
      content: '';
      position: absolute;
      top: 2px; right: 2px;
      width: 8px; height: 8px;
      border-radius: 50%;
      background: #ef4444; /* red-500 */
      box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.95);
      z-index: 5;
    }
  `}

  @media print {
    border: 1px solid #000 !important;
    color: #000 !important;
    background: ${p => p.$isOccupied ? (p.$geneticColor || '#ffffff') : '#ffffff'} !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    overflow: visible !important;
    
    /* Ensure content inside doesn't disappear */
    * {
      color: #000 !important;
      text-shadow: none !important;
      visibility: visible !important;
    }
  }

  &:hover {
    border-color: ${p => p.$isPainting && !p.$isOccupied ? 'rgba(74, 222, 128, 0.5)' : 'rgba(56, 189, 248, 0.5)'};
    background: ${p => p.$isPainting && !p.$isOccupied ? 'rgba(74, 222, 128, 0.1)' : p.$isOccupied ? (p.$geneticColor || 'rgba(30, 41, 59, 0.8)') : p.$isOver ? 'rgba(56, 189, 248, 0.1)' : 'rgba(30, 41, 59, 0.5)'};
    transform: ${p => p.$isOccupied || (p.$isPainting && !p.$isOccupied) ? 'scale(1.02)' : 'none'};
    z-index: 10;
    box-shadow: ${p => p.$isOccupied ? '0 4px 6px rgba(0,0,0,0.3)' : 'none'};
  }
`;

const BatchItemStyled = styled.div<{ cellSize: number }>`
  cursor: pointer;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  
  &:active { transform: scale(0.98); }
`;

// --- Tooltip Component ---
const TooltipContainer = styled.div<{ visible: boolean; x: number; y: number }>`
  position: fixed;
  top: ${p => p.y}px;
  left: ${p => p.x}px;
  transform: translate(-50%, -100%);
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3);
  padding: 0.5rem;
  border-radius: 0.5rem;
  z-index: 9999;
  pointer-events: none;
  opacity: ${p => p.visible ? 1 : 0};
  transition: opacity 0.2s ease-in-out;
  margin-top: -8px;
  min-width: 150px;
  text-align: center;
  color: #f8fafc;

  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: rgba(15, 23, 42, 0.95) transparent transparent transparent;
  }
`;

const BatchItem = ({ batch, onClick, cellSize }: { batch: Batch; onClick?: (e: React.MouseEvent<HTMLDivElement>) => void; cellSize: number }) => {
    const [tooltip, setTooltip] = React.useState<{ visible: boolean; x: number; y: number } | null>(null);
    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    const handleMouseEnter = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top;

        // Clear any pending unmount/hide
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        // Delay show to prevent flickering/accidental popups
        timeoutRef.current = setTimeout(() => {
            setTooltip({ visible: true, x, y });
        }, 500);
    };

    const handleMouseLeave = () => {
        // Clear pending show if mouse leaves before delay
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        setTooltip(prev => {
            if (!prev) return null; // If not showing yet, ensure it stays null

            // If it was showing, fade out then unmount
            timeoutRef.current = setTimeout(() => {
                setTooltip(null);
            }, 200);

            return { ...prev, visible: false };
        });
    };

    // Hide details if too small
    if (cellSize < 50) {
        return (
            <>
                <BatchItemStyled
                    cellSize={cellSize}
                    onClick={onClick}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    <div style={{ width: '80%', height: '80%', background: getGeneticColor(batch.genetic?.name || '').bg, borderRadius: '50%' }} />
                </BatchItemStyled>
                {tooltip && createPortal(
                    <TooltipContainer visible={tooltip.visible} x={tooltip.x} y={tooltip.y}>
                        <div style={{ fontWeight: 'bold', color: '#4ade80' }}>{batch.tracking_code}</div>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{batch.genetic?.name}</div>
                    </TooltipContainer>,
                    document.body
                )}
            </>
        );
    }

    return (
        <>
            <BatchItemStyled
                cellSize={cellSize}
                onClick={(e) => {
                    console.log("BatchItem Clicked", batch.tracking_code);
                    onClick?.(e);
                }}
                style={{ touchAction: 'manipulation' }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <FaLeaf style={{ fontSize: cellSize < 70 ? '0.9rem' : '1.2rem', color: 'rgba(0,0,0,0.6)', marginBottom: '0.2rem' }} />
                <span style={{ fontSize: cellSize < 70 ? '0.6rem' : '0.7rem', fontWeight: 'bold', textAlign: 'center', lineHeight: 1.1, color: 'rgba(0,0,0,0.8)' }}>
                    {batch.tracking_code || batch.name}
                </span>
                {batch.tracking_code && cellSize >= 70 && (
                    <span style={{ fontSize: '0.6rem', color: '#1e293b', background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(4px)', borderRadius: '4px', padding: '0 2px', marginTop: '2px' }}>
                        {batch.genetic?.name?.substring(0, 10)}
                    </span>
                )}
            </BatchItemStyled>
            {tooltip && createPortal(
                <TooltipContainer visible={tooltip.visible} x={tooltip.x} y={tooltip.y}>
                    <div style={{ fontWeight: 'bold', color: '#4ade80', marginBottom: '0.25rem' }}>{batch.tracking_code || batch.name}</div>

                    <div style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
                        <FaLeaf size={10} color="#38bdf8" /> {batch.genetic?.name}
                    </div>

                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                        Etapa: <strong style={{ color: '#f8fafc' }}>{
                            (() => {
                                const stageMap: Record<string, string> = {
                                    'seedling': 'Plántula',
                                    'vegetation': 'Vegetación',
                                    'flowering': 'Floración',
                                    'drying': 'Secado',
                                    'curing': 'Curado',
                                    'completed': 'Corte',
                                    'clones': 'Clones/Esquejes'
                                };
                                return stageMap[batch.stage] || (batch.stage.charAt(0).toUpperCase() + batch.stage.slice(1));
                            })()
                        }</strong>
                    </div>

                    {batch.notes && (
                        <div style={{ fontSize: '0.7rem', color: '#718096', marginBottom: '0.25rem', fontStyle: 'italic', maxWidth: '180px', whiteSpace: 'normal', margin: '0 auto' }}>
                            "{batch.notes.length > 60 ? batch.notes.substring(0, 60) + '...' : batch.notes}"
                        </div>
                    )}

                    {batch.start_date && (
                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '0.25rem' }}>
                            {new Date(batch.start_date).toLocaleDateString()}
                        </div>
                    )}
                </TooltipContainer>,
                document.body
            )}
        </>
    );
};

// --- Helper Functions ---
const getRowLabel = (index: number) => String.fromCharCode(65 + index); // 0 -> A, 1 -> B...

// --- Cell Component ---
const GridCell = ({ row, col, batch, onClick, isPainting, isSelected, renderActions, cellSize }: { row: number; col: number; batch?: Batch, onClick: (b: Batch | null) => void, isPainting?: boolean, isSelected?: boolean, renderActions?: (batch: Batch) => React.ReactNode; cellSize: number }) => {
    const positionId = `${getRowLabel(row)}${col + 1}`; // "A1", "B2"

    const { setNodeRef, isOver } = useDroppable({
        id: `cell-${positionId}`,
        data: { type: 'grid-cell', position: positionId }
    });

    const isSmallView = cellSize >= 30 && cellSize < 60;

    return (
        <CellStyled
            ref={setNodeRef}
            $isOver={isOver}
            $isOccupied={!!batch}
            $geneticColor={batch ? getGeneticColor(batch.genetic?.name || batch.name).bg : undefined}
            $isSelected={isSelected}
            $hasAlert={!!batch?.notes}
            cellSize={cellSize}
            onClick={() => {
                // In selection mode, click propagates up.
                if (batch || isSelected === false) onClick(batch || null); // Pass null if empty
            }}
            title={batch ? `${batch.tracking_code || batch.name} (${batch.genetic?.name || 'Desconocida'})` : `Vacío: ${positionId}`}
        >
            {/* Position Label Logic matching LivingSoilGrid */}
            {cellSize >= 30 && (
                <span style={isSmallView ? {
                    width: '100%',
                    textAlign: 'center',
                    fontSize: '0.8em',
                    fontWeight: '800',
                    color: '#94a3b8',
                    opacity: 0.9,
                    pointerEvents: 'none'
                } : {
                    position: 'absolute',
                    top: 2,
                    left: 4,
                    fontSize: '0.6rem',
                    color: '#64748b',
                    fontWeight: 'bold',
                    opacity: 0.7
                }}>
                    {positionId}
                </span>
            )}

            {batch && (
                <>
                    <BatchItem
                        batch={batch}
                        cellSize={cellSize}
                        onClick={(e) => {
                            e?.stopPropagation(); // Prevent parent click
                            console.log("BatchItem Handler in GridCell Triggered");
                            onClick(batch);
                        }}
                    />
                    {renderActions && cellSize >= 60 && (
                        <div style={{ position: 'absolute', top: 2, right: 2, zIndex: 20 }} onClick={e => e.stopPropagation()}>
                            {renderActions(batch)}
                        </div>
                    )}
                </>
            )}
        </CellStyled >
    );
};

interface EsquejeraGridProps {
    rows: number;
    cols: number;
    batches: Batch[];
    onBatchClick: (batch: Batch | null, position?: string) => void;
    paintingMode?: boolean;
    selectedBatchIds?: Set<string>;
    selectionMode?: boolean;
    renderCellActions?: (batch: Batch) => React.ReactNode;
    onSelectionChange?: (selectedIds: Set<string>) => void;
    onToggleSelectionMode?: (isMode: boolean) => void;
}

export const EsquejeraGrid: React.FC<EsquejeraGridProps> = ({ rows, cols, batches, onBatchClick, paintingMode = false, selectedBatchIds, selectionMode = false, renderCellActions, onSelectionChange, onToggleSelectionMode }) => {
    // Map batches by position "A1" -> Batch
    const batchMap = React.useMemo(() => {
        const map: Record<string, Batch> = {};
        batches.forEach(b => {
            if (b.grid_position) {
                map[b.grid_position.trim().toUpperCase()] = b;
            }
        });
        return map;
    }, [batches]);

    // Use Grid Selection Hook
    const {
        isDragging,
        dragStart,
        dragEnd,
        isAdditive,
        handleMouseDown,
        handleMouseEnter,
        getSelectionRect,
        reset
    } = useGridSelection();

    // Effect to commit selection
    React.useEffect(() => {
        if (!isDragging && dragStart && dragEnd) {
            const rect = getSelectionRect();
            if (!rect) {
                reset(); // Reset if no rect
                return;
            }

            const { startRow, endRow, startCol, endCol } = rect;

            // Logic to determine if we should commit the selection
            const isSingleCell = startRow === endRow && startCol === endCol;
            const shouldCommit = selectionMode || isAdditive || !isSingleCell;

            if (shouldCommit) {
                const selectionInRect = new Set<string>();

                for (let r = startRow; r <= endRow; r++) {
                    for (let c = startCol; c <= endCol; c++) {
                        const pos = `${getRowLabel(r)}${c + 1}`;
                        const batch = batchMap[pos];
                        if (batch) selectionInRect.add(batch.id);
                    }
                }

                if (isAdditive && selectedBatchIds) {
                    const combined = new Set(selectedBatchIds);
                    selectionInRect.forEach(id => combined.add(id));
                    onSelectionChange?.(combined);
                } else {
                    onSelectionChange?.(selectionInRect);
                }

                // If we committed a drag selection effectively, ensure selection mode is ON
                if (!selectionMode && onToggleSelectionMode) {
                    onToggleSelectionMode(true);
                }
            }

            // CRITICAL: Reset selection state to prevent infinite loop
            reset();
        }
    }, [isDragging, dragStart, dragEnd, isAdditive, selectedBatchIds, batchMap, onSelectionChange, selectionMode, getSelectionRect, onToggleSelectionMode, reset]);

    // Calculate Selection Box Style using CSS Grid Area
    const getSelectionBoxStyle = () => {
        const rect = getSelectionRect();
        if (!rect || !isDragging) return null;

        const { startRow, endRow, startCol, endCol } = rect;

        // Grid tracks:
        // Column 1 is header. Data starts at Column 2.
        // Row 1 is header. Data starts at Row 2.
        // Indices are 0-based.
        // grid-column-start: colIndex + 2
        // grid-column-end: colIndex + 2 + 1 (for 1 cell span) -> endCol + 3 for range

        const gridRowStart = startRow + 2;
        const gridColumnStart = startCol + 2;
        const gridRowEnd = endRow + 3; // +2 for offset, +1 for exclusive end line
        const gridColumnEnd = endCol + 3;

        return {
            gridArea: `${gridRowStart} / ${gridColumnStart} / ${gridRowEnd} / ${gridColumnEnd}`,
            backgroundColor: 'rgba(66, 153, 225, 0.3)',
            border: '2px solid #4299e1',
            borderRadius: '0.25rem',
            pointerEvents: 'none' as const,
            zIndex: 20, // Above cells
        };
    };

    const isInDragArea = (r: number, c: number) => {
        if (!isDragging || !dragStart || !dragEnd) return false;
        const minR = Math.min(dragStart.row, dragEnd.row);
        const maxR = Math.max(dragStart.row, dragEnd.row);
        const minC = Math.min(dragStart.col, dragEnd.col);
        const maxC = Math.max(dragStart.col, dragEnd.col);
        return r >= minR && r <= maxR && c >= minC && c <= maxC;
    };

    // Zoom State
    const [cellSize, setCellSize] = React.useState(80);
    const handleZoomIn = () => setCellSize(p => Math.min(p + 10, 150));
    const handleZoomOut = () => setCellSize(p => Math.max(p - 10, 30));

    // Headers
    const colHeaders = Array.from({ length: cols }, (_, i) => i + 1);
    const rowHeaders = Array.from({ length: rows }, (_, i) => getRowLabel(i));

    return (
        <div>
            {/* Print Debug Indicator */}
            <div className="print-debug-indicator" style={{ display: 'none', color: 'red', fontWeight: 'bold', fontSize: '20px', padding: '10px' }}>
                DEBUG: ESQUEJERA GRID RENDERED ({rows}x{cols})
            </div>
            <style>{`
                @media print {
                    .print-debug-indicator { display: block !important; }
                }
            `}</style>

            <ControlsContainer>
                <ZoomButton onClick={handleZoomOut} title="Alejar"><FaSearchMinus /></ZoomButton>
                <ZoomLabel>{cellSize}px</ZoomLabel>
                <ZoomButton onClick={handleZoomIn} title="Acercar"><FaSearchPlus /></ZoomButton>
            </ControlsContainer>

            <GridContainer rows={Number(rows)} cols={Number(cols)} cellSize={cellSize} style={{ position: 'relative' }} className="noselect">
                {/* Selection Box Overlay */}
                {isDragging && dragStart && dragEnd && (
                    <div style={getSelectionBoxStyle() || {}} />
                )}

                {/* Top-Left Corner (Empty) - Explicitly placed */}
                <div style={{ gridRow: 1, gridColumn: 1 }} />

                {/* Column Headers - Explicitly placed */}
                {colHeaders.map((c, i) => (
                    <HeaderCell key={`h-${c}`} style={{ gridRow: 1, gridColumn: i + 2 }} cellSize={cellSize}>
                        {c}
                    </HeaderCell>
                ))}

                {/* Rows */}
                {rowHeaders.map((rLabel, rIndex) => (
                    <React.Fragment key={`row-${rLabel}`}>
                        {/* Row Header - Explicitly placed */}
                        <HeaderCell style={{ gridRow: rIndex + 2, gridColumn: 1 }} cellSize={cellSize}>
                            {rLabel}
                        </HeaderCell>

                        {/* Cells */}
                        {colHeaders.map((_, cIndex) => {
                            const pos = `${rLabel}${cIndex + 1}`;
                            const batch = batchMap[pos];
                            const inDrag = isInDragArea(rIndex, cIndex);
                            const isSel = selectedBatchIds?.has(batch?.id || '');

                            return (
                                <div
                                    key={pos}
                                    onMouseDown={(e) => handleMouseDown(rIndex, cIndex, e)}
                                    onMouseEnter={() => handleMouseEnter(rIndex, cIndex)}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        gridRow: rIndex + 2,
                                        gridColumn: cIndex + 2,
                                        // Debug border for print to verify grid cell placement
                                        // border: '1px dotted red' 
                                    }}
                                >
                                    <GridCell
                                        row={rIndex}
                                        col={cIndex}
                                        batch={batch}
                                        onClick={(batch) => onBatchClick(batch, pos)}
                                        // Highlight if selected OR if in drag area (visual feedback)
                                        isSelected={isSel || inDrag}
                                        renderActions={renderCellActions}
                                        cellSize={cellSize}
                                    />
                                </div>
                            );
                        })}
                    </React.Fragment>
                ))}
            </GridContainer>
        </div>
    );
};
