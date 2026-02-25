import React, { useState, useEffect } from 'react';
import styled, { createGlobalStyle, keyframes } from 'styled-components';
import { useNavigate, Link } from 'react-router-dom';
import {
    FaSearch, FaHistory, FaBarcode, FaExchangeAlt, FaMinusCircle, FaEdit, FaTrash,
    FaCut, FaTimes, FaLevelUpAlt, FaPlus, FaAngleRight, FaAngleDown,
    FaTint, FaLeaf, FaSun, FaCheckCircle, FaDna, FaPrint, FaHashtag
} from 'react-icons/fa';
import { Tooltip } from '../components/Tooltip';
import { roomsService } from '../services/roomsService';
import { geneticsService } from '../services/geneticsService';

import { LoadingSpinner } from '../components/LoadingSpinner';
import { ConfirmModal } from '../components/ConfirmModal';
import { ToastModal } from '../components/ToastModal';

import { Room } from '../types/rooms';
import QRCode from 'react-qr-code';
import { TuyaManager } from '../components/TuyaManager';
import { CustomSelect } from '../components/CustomSelect';
import { CustomDatePicker } from '../components/CustomDatePicker';

import { AnimatedModal, CloseIcon, ModalContent, ModalOverlay } from '../components/AnimatedModal';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;


const Container = styled.div`
    padding: 2rem;
    padding-top: 5rem;
    max-width: 1400px;
    margin: 0 auto;
    animation: ${fadeIn} 0.5s ease-in-out;
    background: transparent; /* Rely on global body background */
`;

// --- New Environment Components ---




const SummaryGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 300px));
    gap: 1.5rem;
    margin-bottom: 2rem;
`;

const SummaryCard = styled.div<{ isTotal?: boolean }>`
    background: rgba(15, 23, 42, 0.4);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    padding: 1.25rem;
    border-radius: 1rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5);
    border: 1px solid ${p => p.isTotal ? 'rgba(74, 222, 128, 0.15)' : 'rgba(255, 255, 255, 0.05)'};
    position: relative;
    overflow: hidden;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.3s;
    cursor: default;

    &:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.6), 0 0 15px 0 ${p => p.isTotal ? 'rgba(74, 222, 128, 0.15)' : 'rgba(148, 163, 184, 0.1)'};
        border: 1px solid ${p => p.isTotal ? 'rgba(74, 222, 128, 0.3)' : 'rgba(255, 255, 255, 0.1)'};
    }

    ${p => p.isTotal && `
        background: rgba(20, 83, 45, 0.15);
    `}

    h3 {
        margin: 0 0 0.25rem 0;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #94a3b8;
        font-weight: 700;
    }

    .value {
        font-size: 1.5rem;
        font-weight: 800;
        color: ${p => p.isTotal ? '#4ade80' : '#f8fafc'};
        line-height: 1.2;
    }

    .icon {
        position: absolute;
        right: 1.25rem;
        top: 50%;
        transform: translateY(-50%);
        font-size: 1.75rem;
        opacity: 0.15;
        color: ${p => p.isTotal ? '#4ade80' : '#cbd5e1'};
    }

    @media (max-width: 768px) {
        display: flex;
        align-items: center;
        justify-content: center; /* Center horizontally overall */
        padding: 1rem;
        gap: 1rem; /* Use gap instead of margins for distribution */
        
        h3 {
            margin: 0;
            font-size: 0.85rem;
            text-align: right; /* To balance near the value */
        }

        .value {
            font-size: 1.2rem;
            margin: 0;
        }
        
        .icon {
            font-size: 1.25rem;
            position: relative; /* Take it out of absolute so it flows inside the flexbox naturally */
            right: auto;
            top: auto;
            transform: none;
        }
    }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;

  h1 {
    font-size: 2rem;
    font-weight: 800;
    color: #e2e8f0;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.75rem;

    @media (max-width: 768px) {
        font-size: 1.5rem;
        justify-content: center;
        width: 100%;
        margin-bottom: 1rem;
    }
  }

  @media (max-width: 768px) {
      flex-direction: column;
      justify-content: center;
      align-items: center;
  }
`;

const CreateButton = styled.button`
background: rgba(74, 222, 128, 0.2);
color: #4ade80;
padding: 0.75rem 1.5rem;
border - radius: 0.75rem;
border: 1px solid rgba(74, 222, 128, 0.5);
font - weight: 600;
cursor: pointer;
display: flex;
align - items: center;
gap: 0.5rem;
transition: all 0.2s;
box - shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
backdrop - filter: blur(8px);

  &:hover {
    background: rgba(74, 222, 128, 0.3);
    transform: translateY(-2px);
    box - shadow: 0 6px 8px rgba(0, 0, 0, 0.3);
}
`;

const HistorySection = styled.div`
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 1rem;
    padding: 1.5rem;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
`;

const FilterContainer = styled.div`
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
    align-items: center;
    flex-wrap: wrap;

    input {
        flex: 1;
        min-width: 200px;
        padding: 0.75rem 1rem;
        background: rgba(15, 23, 42, 0.6);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 0.75rem;
        color: #f8fafc;
        font-size: 0.9rem;
        outline: none;
        transition: all 0.2s ease;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);

        &:focus {
            border-color: rgba(56, 189, 248, 0.5);
            box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2);
        }
        
        &:hover {
            background: rgba(15, 23, 42, 0.8);
            border-color: rgba(255, 255, 255, 0.15);
        }
    }

    /* Container for the custom selects to match input width behavior if needed */
    .filter-select {
        min-width: 180px;
    }
`;

const DeleteAllButton = styled.button`
    background: rgba(229, 62, 62, 0.1);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    color: #fc8181;
    border: 1px solid rgba(229, 62, 62, 0.2);
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);

    &:hover {
        background: rgba(229, 62, 62, 0.25);
        border-color: rgba(229, 62, 62, 0.4);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(229, 62, 62, 0.2);
        color: #fff;
    }

    &:active {
        transform: translateY(0);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    }
`;

const ButtonSpinner = styled.div`
border: 2px solid rgba(255, 255, 255, 0.3);
border - radius: 50 %;
border - top: 2px solid white;
width: 16px;
height: 16px;
animation: spin 1s linear infinite;

@keyframes spin {
    0 % { transform: rotate(0deg); }
    100 % { transform: rotate(360deg); }
}
`;

const HistoryHeader = styled.div`
font - size: 1.5rem;
color: #f8fafc;
margin - bottom: 1.5rem;
display: flex;
align - items: center;
gap: 0.75rem;
`;

const HistoryTable = styled.table`
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;

    th {
        text-align: left;
        padding: 1rem;
        background: rgba(15, 23, 42, 0.8);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        color: #94a3b8;
        font-weight: 600;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    th:first-child {
        border-top-left-radius: 0.5rem;
    }

    th:last-child {
        border-top-right-radius: 0.5rem;
    }

    td {
        padding: 1rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        color: #f8fafc;
        vertical-align: middle;
        transition: background-color 0.2s;
    }

    tr:hover td {
        background-color: rgba(255, 255, 255, 0.015);
    }

    @media (max-width: 768px) {
        display: block;
        
        thead {
            display: none;
        }

        tbody {
            display: block;
        }

        tr {
            display: block;
            margin-bottom: 1rem;
            background: rgba(15, 23, 42, 0.4);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 0.75rem;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.2);
        }

        td {
            display: none !important;
        }

        td[data-label="Lote (Código)"] {
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            padding: 1.25rem 1rem !important;
            border: none !important;
            text-align: center !important;
            width: 100% !important;
        }

        td[data-label="Lote (Código)"]::before {
            display: none !important;
        }

        td[data-label="Lote (Código)"] > div {
            justify-content: center;
            width: 100%;
        }
    }
`;

const ActionButton = styled.button<{ color: string }>`
    background: rgba(15, 23, 42, 0.5);
    backdrop-filter: blur(4px);
    border: 1px solid rgba(255, 255, 255, 0.05);
    color: ${p => p.color};
    width: 40px;
    height: 40px;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    margin-right: 0.5rem;

    &:hover {
        background: ${p => `${p.color}25`};
        border-color: ${p => `${p.color}50`};
        box-shadow: 0 0 12px ${p => `${p.color}30`};
        transform: translateY(-2px) scale(1.05);
        color: #fff;
    }
`;




const BadgeLink = styled.span<{ color: string }>`
    display: inline-block;
    padding: 0.25rem 0.5rem;
    background: ${p => `${p.color}15`};
    color: ${p => p.color};
    border: 1px solid ${p => `${p.color}30`};
    border-radius: 0.5rem;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    white-space: nowrap;

    &:hover {
        background: ${p => `${p.color}25`};
        border-color: ${p => `${p.color}50`};
        transform: translateY(-1px);
        box-shadow: 0 4px 6px ${p => `${p.color}20`};
    }

    &:active {
        transform: translateY(0);
        box-shadow: none;
    }
`;

const GlassToastOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    animation: ${fadeIn} 0.3s cubic-bezier(0.16, 1, 0.3, 1);
`;

const GlassToastContent = styled.div`
    background: rgba(15, 23, 42, 0.7);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 1.5rem;
    padding: 2rem;
    width: 90%;
    max-width: 450px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 20px rgba(56, 189, 248, 0.1);
    position: relative;
    color: #f8fafc;

    @media (max-width: 768px) {
        padding: 1.25rem;
        width: 95%;
    }
`;

const ModalRow = styled.div`
    display: flex;
    gap: 1rem;
    width: 100%;

    @media (max-width: 768px) {
        flex-direction: column;
        gap: 0.5rem;
    }
`;

const ModalActions = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 2rem;

    @media (max-width: 768px) {
        flex-direction: column;
        gap: 0.5rem;

        button {
            width: 100%;
            justify-content: center;
        }
    }
`;


const FormGroup = styled.div`
    margin-bottom: 1.25rem;
    label { 
        display: block; 
        margin-bottom: 0.5rem; 
        font-weight: 600; 
        color: #94a3b8; 
        font-size: 0.9rem;
    }
    input, select, textarea { 
        width: 100%; 
        padding: 0.75rem; 
        background: rgba(15, 23, 42, 0.5); 
        color: #f8fafc; 
        border: 1px solid rgba(255, 255, 255, 0.05); 
        border-radius: 0.5rem; 
        font-size: 0.95rem;
        transition: all 0.2s;

        &:focus {
            outline: none;
            border-color: rgba(56, 189, 248, 0.5);
            box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.1);
            background: rgba(15, 23, 42, 0.8);
        }
    }
`;



const BarcodeDisplay = styled.div`
    background: rgba(15, 23, 42, 0.4);
    padding: 2rem;
    text-align: center;
    border-radius: 0.5rem;
    border: 2px dashed rgba(255, 255, 255, 0.1);
    margin: 1rem 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    .code {
    font - family: 'Courier New', monospace;
    font - size: 1.5rem;
    font - weight: 800;
    letter - spacing: 0.1em;
    color: #f8fafc;
    margin - top: 1rem;
    display: block;
}
    
    .label {
    font - size: 0.85rem;
    color: #94a3b8;
    margin - top: 0.5rem;
}
`;

const PrintableCloneLabel = styled.div`
display: none;

@media print {
    display: flex;
    flex - direction: row; /* Horizontal layout for wide small label */
    align - items: center;
    justify - content: space - between;
    width: 50mm;
    height: 30mm;
    page -break-after: always;
    padding: 2mm;
    box - sizing: border - box;
    overflow: hidden;

    /* Ensure only this is printed */
    position: relative;
    
    .qr - side {
        width: 22mm;
        height: 22mm;
        display: flex;
        align - items: center;
        justify - content: center;
    }

    .info - side {
        flex: 1;
        display: flex;
        flex - direction: column;
        justify - content: center;
        align - items: flex - start;
        padding - left: 2mm;
        font - family: Arial, sans - serif;
    }

    .name {
        font - size: 10pt;
        font - weight: 800;
        color: black;
        margin - bottom: 2px;
    }

    .meta {
        font - size: 7pt;
        color: black;
        line - height: 1.1;
    }
}
`;

const PrintStyles = createGlobalStyle`
@media print {
    @page {
        size: 50mm 30mm;
        margin: 0;
    }
    body * {
        visibility: hidden;
    }
    #printable - clones - area, #printable - clones - area * {
        visibility: visible;
    }
    #printable - clones - area {
        position: absolute;
        left: 0;
        top: 0;
        width: 100 %;
    }
}
`;

const getStatusBadge = (batch: any, onNavigate?: (path: string) => void) => {
    if (batch.clone_map_id) {
        const roomId = batch.room?.id || batch.current_room_id;
        const isClickable = onNavigate && roomId;

        return (
            <span
                onClick={(e) => {
                    if (isClickable) {
                        e.stopPropagation();
                        onNavigate(`/rooms/${roomId}?mapId=${batch.clone_map_id}`);
                    }
                }}
                style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    background: 'rgba(72, 187, 120, 0.1)', color: '#48bb78',
                    padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, border: '1px solid rgba(72, 187, 120, 0.2)',
                    cursor: isClickable ? 'pointer' : 'default',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                }}
                title={isClickable ? "Abrir Mapa Activo" : "En Mapa"}
            >
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#48bb78' }} />
                En Mapa
            </span>
        );
    }
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            background: 'rgba(236, 201, 75, 0.1)', color: '#ecc94b',
            padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, border: '1px solid rgba(236, 201, 75, 0.2)', whiteSpace: 'nowrap'
        }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ecc94b' }} />
            Disponible
        </span>
    );
};

const getStageBadge = (roomType?: string) => {
    switch (roomType) {
        case 'clones':
        case 'esquejera':
            return (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 600 }}>
                    <FaTint style={{ fontSize: '0.6rem' }} /> Clones
                </span>
            );
        case 'vegetation':
            return (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(72, 187, 120, 0.1)', color: '#48bb78', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 600 }}>
                    <FaLeaf style={{ fontSize: '0.6rem' }} /> Vegetación
                </span>
            );
        case 'flowering':
            return (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(159, 122, 234, 0.1)', color: '#9f7aea', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 600 }}>
                    <FaSun style={{ fontSize: '0.6rem' }} /> Floración
                </span>
            );
        default:
            return null; // Return nothing if unknown
    }
};

const BatchGroupRow = ({ group, onBarcodeClick, onMoveClick, onDiscardClick, onEditClick, onDeleteClick, onUnitPrintClick, onUnitDeleteClick, onNavigate, onMobileClick }: any) => {
    const { root, children } = group;
    const [isExpanded, setIsExpanded] = useState(false);

    // Aggregates
    const totalQty = root.quantity + children.reduce((acc: number, child: any) => acc + child.quantity, 0);

    // Formatting Date to match "DD/MM/YY HH:MM" taking the precise creation timestamp (avoids YYYY-MM-DD timezone shift)
    const formatBatchDate = (batchToFormat: any) => {
        const d = new Date(batchToFormat.created_at);
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear().toString().slice(-2);
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');
        return `${day} /${month}/${year} ${hours}:${minutes} `;
    };

    const rootFormattedDate = formatBatchDate(root);

    const units: { batch: any, unitIndex: number, isVirtual: boolean, totalInBatch: number }[] = [];
    let absoluteIndex = 1;

    for (let i = 0; i < root.quantity; i++) {
        units.push({ batch: root, unitIndex: absoluteIndex++, isVirtual: root.quantity > 1, totalInBatch: root.quantity });
    }

    children.forEach((child: any) => {
        for (let i = 0; i < child.quantity; i++) {
            units.push({ batch: child, unitIndex: absoluteIndex++, isVirtual: child.quantity > 1, totalInBatch: child.quantity });
        }
    });

    const isExpandable = units.length > 0;

    const renderRootRow = () => {
        const rowStyle: React.CSSProperties = {
            borderBottom: !isExpanded ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
        };
        const cellStyle: React.CSSProperties = {};

        const quantityDisplay = (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
                <strong>{totalQty} u.</strong>
                {units.length > 1 && (
                    <span style={{ fontSize: '0.75rem', color: '#718096', fontWeight: 'normal' }}>({units.length} un.)</span>
                )}
            </div>
        );

        const geneticName = root.genetic?.name || 'Desconocida';
        const nomenclature = root.genetic?.nomenclatura || geneticName.substring(0, 3).toUpperCase();

        // Exact format requirement: Lote 7684 - PRU - 24/02/26 11:42
        // We use the last 4 digits of the uuid as the "number" or just the name if it's already "Lote XXXX"
        let displayName = root.name;

        if (displayName && displayName.toLowerCase().includes('lote') && displayName.includes('-')) {
            // If it's already the long format, keep it (fallback)
            // But we want to enforce the exact format asked by the user.
            // Let's parse the ID part. Usually root.name is something like "Lote XXXX"
            const idPart = displayName.split('-')[0].trim();
            displayName = `${idPart} - ${nomenclature} - ${rootFormattedDate} `;
        } else if (displayName && displayName.toLowerCase().startsWith('lote')) {
            displayName = `${displayName} - ${nomenclature} - ${rootFormattedDate} `;
        } else {
            // Fallback if the name is entirely different
            const shortId = root.id ? root.id.substring(0, 4).toUpperCase() : '0000';
            displayName = `Lote ${shortId} - ${nomenclature} - ${rootFormattedDate} `;
        }

        const nameDisplay = (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: '0' }}>
                {isExpandable && (
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#319795', display: 'flex', alignItems: 'center', padding: 0 }}
                    >
                        {isExpanded ? <FaAngleDown /> : <FaAngleRight />}
                    </button>
                )}
                <FaBarcode style={{ color: '#f8fafc' }} />
                <strong>{displayName}</strong>
            </div>
        );

        return (
            <tr
                key={`root-${root.id}`}
                style={{ ...rowStyle, cursor: 'pointer' }}
                onClick={(e) => {
                    if (window.innerWidth <= 768 && onMobileClick) {
                        e.stopPropagation();
                        onMobileClick(group);
                    }
                }}
            >
                <td data-label="Fecha" style={cellStyle}>{rootFormattedDate}</td>
                <td data-label="Lote (Código)" style={cellStyle}>{nameDisplay}</td>
                <td data-label="Genética" style={cellStyle}>{geneticName}</td>
                <td data-label="Cantidad" style={cellStyle}>{quantityDisplay}</td>
                <td data-label="Cultivo" style={cellStyle}>
                    {root.room?.spot?.id ? (
                        <BadgeLink
                            color="#38bdf8"
                            onClick={(e) => { e.stopPropagation(); onNavigate(`/crops/${root.room.spot_id}`); }}
                            title="Ver Cultivo"
                        >
                            {root.room?.spot?.name}
                        </BadgeLink>
                    ) : '---'}
                </td>
                <td data-label="Destino" style={cellStyle}>
                    {root.room?.id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '6px' }}>
                            <BadgeLink
                                color="#c084fc"
                                onClick={(e) => { e.stopPropagation(); onNavigate(`/rooms/${root.room.id}`); }}
                                title="Ver Sala"
                            >
                                {root.room?.name}
                            </BadgeLink>
                        </div>
                    ) : 'Desconocido'}
                </td>
                <td data-label="Fase de Cultivo" style={cellStyle}>
                    {root.room?.id ? getStageBadge(root.room?.type) : '---'}
                </td>
                <td data-label="Estado" style={cellStyle}>{getStatusBadge(root, onNavigate)}</td>
                <td data-label="Acciones" style={{ textAlign: 'center', ...cellStyle, justifyContent: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <Tooltip text="Ver Código de Barras">
                            <ActionButton color="#4a5568" onClick={(e) => { e.stopPropagation(); onBarcodeClick({ ...root, clone_units: children, displayName: displayName }); }}><FaBarcode /></ActionButton>
                        </Tooltip>
                        {/* 
                        <Tooltip text="Mover a Sala (Transplante)">
                            <ActionButton color="#ed8936" onClick={(e) => { e.stopPropagation(); onMoveClick(root); }}><FaExchangeAlt /></ActionButton>
                        </Tooltip> 
                        */}
                        <Tooltip text="Dar de Baja (Descarte)">
                            <ActionButton color="#e53e3e" onClick={(e) => {
                                e.stopPropagation();
                                onDiscardClick({
                                    ...root,
                                    isGroup: true,
                                    name: displayName || root.name,
                                    quantity: totalQty,
                                    originalRoot: root,
                                    groupChildren: children
                                });
                            }}><FaMinusCircle /></ActionButton>
                        </Tooltip>
                        <Tooltip text="Editar Lote">
                            <ActionButton color="#3182ce" onClick={(e) => {
                                e.stopPropagation();
                                onEditClick({
                                    ...root,
                                    isGroup: true,
                                    name: displayName || root.name,
                                    quantity: totalQty,
                                    originalRoot: root,
                                    groupChildren: children
                                });
                            }}><FaEdit /></ActionButton>
                        </Tooltip>
                        <Tooltip text="Eliminar Lote">
                            <ActionButton color="#e53e3e" onClick={(e) => { e.stopPropagation(); onDeleteClick(root); }}><FaTrash /></ActionButton>
                        </Tooltip>
                    </div>
                </td>
            </tr>
        );
    };

    const renderUnitRow = (unit: any, isLast: boolean) => {
        const { batch, unitIndex } = unit;
        const rowStyle: React.CSSProperties = {
            borderBottom: isLast ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
            fontSize: '0.9rem',
            color: '#94a3b8',
            background: 'rgba(255, 255, 255, 0.02)'
        };
        const cellStyle: React.CSSProperties = !isLast ? { borderBottom: 'none' } : {};

        // If the batch only has 1 unit, it inherently acts as a unique entity, hide visual UI indexing.
        const displayName = batch.quantity > 1
            ? `${batch.name} - U#${unitIndex.toString().padStart(3, '0')} `
            : batch.name;

        const nameDisplay = (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: '2rem' }}>
                <FaLevelUpAlt style={{ transform: 'rotate(90deg)', color: '#a0aec0', fontSize: '1rem', minWidth: '1rem' }} title="Unidad" />
                <FaBarcode style={{ color: '#94a3b8' }} />
                <span>{displayName}</span>
            </div>
        );

        const unitFormattedDate = formatBatchDate(batch);

        return (
            <tr key={`unit-${batch.id}-${unitIndex}`} style={rowStyle}>
                <td data-label="Fecha" style={cellStyle}>{unitFormattedDate}</td>
                <td data-label="Lote (Código)" style={cellStyle}>{nameDisplay}</td>
                <td data-label="Genética" style={cellStyle}>{batch.genetic?.name || 'Desconocida'}</td>
                <td data-label="Cantidad" style={{ ...cellStyle, whiteSpace: 'nowrap' }}>1 u.</td>
                <td data-label="Cultivo" style={cellStyle}>
                    {batch.room?.spot?.id ? (
                        <BadgeLink
                            color="#38bdf8"
                            onClick={(e) => { e.stopPropagation(); onNavigate(`/crops/${batch.room.spot_id}`); }}
                            title="Ver Cultivo"
                        >
                            {batch.room?.spot?.name}
                        </BadgeLink>
                    ) : '---'}
                </td>
                <td data-label="Destino" style={cellStyle}>
                    {batch.room?.id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '6px' }}>
                            <BadgeLink
                                color="#c084fc"
                                onClick={(e) => { e.stopPropagation(); onNavigate(`/rooms/${batch.room.id}`); }}
                                title="Ver Sala"
                            >
                                {batch.room?.name}
                            </BadgeLink>
                        </div>
                    ) : 'Desconocido'}
                </td>
                <td data-label="Fase de Cultivo" style={cellStyle}>
                    {batch.room?.id ? getStageBadge(batch.room?.type) : '---'}
                </td>
                <td data-label="Estado" style={cellStyle}>{getStatusBadge(batch, onNavigate)}</td>
                <td data-label="Acciones" style={{ textAlign: 'center', ...cellStyle, justifyContent: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <Tooltip text="Ver QR de Genética">
                            <ActionButton color="#4a5568" onClick={(e: any) => { e.stopPropagation(); onUnitPrintClick(batch, unitIndex); }}><FaBarcode /></ActionButton>
                        </Tooltip>
                        <Tooltip text="Imprimir Etiqueta">
                            <ActionButton color="#4ade80" onClick={(e: any) => { e.stopPropagation(); onUnitPrintClick(batch, unitIndex, true); }}><FaPrint /></ActionButton>
                        </Tooltip>
                        <Tooltip text="Eliminar Unidad">
                            <ActionButton color="#e53e3e" onClick={(e: any) => { e.stopPropagation(); onUnitDeleteClick(batch, unitIndex); }}><FaTrash /></ActionButton>
                        </Tooltip>
                    </div>
                </td>
            </tr>
        );
    };

    return (
        <React.Fragment>
            {renderRootRow()}
            {isExpanded && units.map((unit, index) => renderUnitRow(unit, index === units.length - 1))}
        </React.Fragment>
    );
};

const Clones: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [mothersStates, setMothersStates] = useState<any[]>([]);
    const [cloneBatches, setCloneBatches] = useState<any[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [stats, setStats] = useState({ total: 0, byGenetic: {} as Record<string, number> });

    // Environment Data


    // Create Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newBatch, setNewBatch] = useState({
        geneticId: '',
        quantity: '',
        date: new Date().toISOString().split('T')[0]
    });

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingBatch, setEditingBatch] = useState<any>(null);
    const [editForm, setEditForm] = useState({ name: '', quantity: '', date: '' });

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [batchToDelete, setBatchToDelete] = useState<any>(null);
    const [deleteReason, setDeleteReason] = useState("");
    const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);

    // Barcode Modal State
    const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
    const [viewingBatch, setViewingBatch] = useState<any>(null);
    const [allBatchesHistory, setAllBatchesHistory] = useState<any[]>([]); // To calculate sequences

    // Move Modal State
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
    const [batchToMove, setBatchToMove] = useState<any>(null);
    const [moveToRoomId, setMoveToRoomId] = useState('');
    const [moveQuantity, setMoveQuantity] = useState<number>(0);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false); // Success Modal State

    // Print State
    const [printQuantity, setPrintQuantity] = useState(1);

    // Discard Modal State
    const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false);
    const [batchToDiscard, setBatchToDiscard] = useState<any>(null);
    const [discardQuantity, setDiscardQuantity] = useState<number>(0);
    const [discardReason, setDiscardReason] = useState('');

    // Toast State
    const [toastOpen, setToastOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

    // Mobile Detail State
    const [mobileDetailBatch, setMobileDetailBatch] = useState<any>(null);

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToastMessage(message);
        setToastType(type);
        setToastOpen(true);
    };

    const [clonesRoomId, setClonesRoomId] = useState<string | undefined>(undefined);
    const [selectedGeneticFilter, setSelectedGeneticFilter] = useState<string | null>(null);

    // Filter and Search States
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [stageFilter, setStageFilter] = useState('');

    // Breakdown Modal Logic
    const [isBreakdownModalOpen, setIsBreakdownModalOpen] = useState(false);

    const breakdownData = React.useMemo(() => {
        const data: { name: string, quantity: number, percentage: number }[] = [];
        const allBatches: any[] = [];

        // Flatten
        cloneBatches.forEach((group: any) => {
            allBatches.push(group.root);
            group.children.forEach((child: any) => allBatches.push(child));
        });

        const total = allBatches.reduce((acc, b) => acc + (b.quantity || 0), 0);
        if (total === 0) return [];

        const groups = allBatches.reduce((acc, b) => {
            const name = b.genetic?.name || 'Desconocida';
            acc[name] = (acc[name] || 0) + (b.quantity || 0);
            return acc;
        }, {} as Record<string, number>);

        Object.entries(groups).forEach(([name, qty]) => {
            const quantity = qty as number;
            data.push({
                name,
                quantity,
                percentage: (quantity / total) * 100
            });
        });

        return data.sort((a, b) => b.quantity - a.quantity);
    }, [cloneBatches]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async (silent = false) => {
        if (!silent) setLoading(true);

        // Parallel data loading
        const [genetics, batches, allRooms] = await Promise.all([
            geneticsService.getGenetics(),
            roomsService.getBatches(),
            roomsService.getRooms()
        ]);

        setRooms(allRooms);

        const clonesRoom = allRooms.find(r => r.type === 'clones');

        if (clonesRoom) {
            setClonesRoomId(clonesRoom.id);
        }

        // Collect all rooms that are considered clone rooms
        const cloneRoomTypes = ['clones', 'esquejes', 'esquejera'];
        const allCloneRoomIds = allRooms.filter(r => cloneRoomTypes.includes(r.type?.toLowerCase() || '')).map(r => r.id);

        const allClones = batches.filter(b =>
            (b.room && cloneRoomTypes.includes(b.room.type?.toLowerCase() || '')) || // Explicitly include batches in clone rooms
            (b.current_room_id && allCloneRoomIds.includes(b.current_room_id)) || // Fallback explicitly by Room ID
            b.parent_batch_id ||
            (b.name && b.name.startsWith('CL-')) ||
            (b.stage === 'seedling') || // New batches are seedlings
            b.clone_map_id !== null || // Explicitly include if they are in a clone map
            /^[A-Z]+-\d+$/.test(b.name) || // Match new sequential format
            /^[A-Z]+ - .+$/.test(b.name) // Match things like PRUEBA - 20/02/2026
        );

        // Calculate Stats
        let totalQty = 0;
        const geneticBreakdown: Record<string, number> = {};

        allClones.forEach(b => {
            const qty = Number(b.quantity) || 0;
            totalQty += qty;
            const geneticName = b.genetic?.name || 'Desconocida';
            geneticBreakdown[geneticName] = (geneticBreakdown[geneticName] || 0) + qty;
        });

        setStats({ total: totalQty, byGenetic: geneticBreakdown });

        setMothersStates(genetics);
        // Sort grouping logic:
        // 1. Identify Roots (no parent or parent not in this list)
        // 2. Map children to parents
        // 3. Flatten list
        const batchMap = new Map();
        allClones.forEach(b => batchMap.set(b.id, { ...b, children: [] }));

        const roots: any[] = [];
        const orphans: any[] = []; // Sub-batches whose parents are not in the 'clones' view (e.g. parent moved to diff room or deleted)

        allClones.forEach(b => {
            if (b.parent_batch_id && batchMap.has(b.parent_batch_id)) {
                batchMap.get(b.parent_batch_id).children.push(b);
            } else {
                // Check if it's strictly a child (has parent_id) but parent not here
                if (b.parent_batch_id) orphans.push(b);
                else roots.push(batchMap.get(b.id)); // It's a root
            }
        });

        // Sort roots by date desc
        roots.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        // Flatten logic change: Keep as groups { root, children }
        const groups: any[] = [];
        roots.forEach(root => {
            // Sort children by date desc
            root.children.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            groups.push({ root, children: root.children });
        });

        // Wrap orphans in groups
        orphans.forEach(o => groups.push({ root: o, children: [] }));

        // --- SMART GROUPING (Genetic + Date + Room) ---
        // Merge groups that share the same Genetics, Date, and Room to create "Virtual Batches"
        const smartGroups: any[] = [];
        const groupMap = new Map<string, any[]>();

        groups.forEach(group => {
            const { root } = group;
            // Key: GeneticID | Date(DD/MM/YYYY) | RoomID
            const dateKey = new Date(root.start_date || root.created_at).toLocaleDateString();
            const key = `${root.genetic_id || 'unk'}| ${dateKey}| ${root.room_id || root.current_room_id || 'unk'} `; // Handle room_id naming variation if any

            if (!groupMap.has(key)) {
                groupMap.set(key, []);
            }
            groupMap.get(key)!.push(group);
        });

        groupMap.forEach((bundledGroups) => {
            if (bundledGroups.length === 1) {
                smartGroups.push(bundledGroups[0]);
            } else {
                // Merge multiple groups into one
                // Sort by Name (primary) or ID to ensure deterministic root (e.g. lowest number is root)
                bundledGroups.sort((a, b) => a.root.name.localeCompare(b.root.name));

                const primary = bundledGroups[0];
                const rest = bundledGroups.slice(1);

                const mergedChildren = [...primary.children];
                rest.forEach(g => {
                    mergedChildren.push(g.root); // The root of the other group becomes a child
                    mergedChildren.push(...g.children); // And its children are adopted
                });

                // Re-sort merged children
                mergedChildren.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

                smartGroups.push({ root: primary.root, children: mergedChildren });
            }
        });

        // Sort final groups by root date desc
        smartGroups.sort((a, b) => new Date(b.root.created_at).getTime() - new Date(a.root.created_at).getTime());

        setMothersStates(genetics);
        setCloneBatches(smartGroups);
        setAllBatchesHistory(batches); // Store full history

        if (!silent) {
            setLoading(false);
        }
    };

    const generateSequenceName = (geneticName: string) => {
        const prefix = (geneticName || 'UNK').substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');

        // Filter all batches that start with this Genetic Prefix
        // Note: We check specifically for the pattern PREFIX-xxxx
        const pattern = new RegExp(`^ ${prefix} -\\d{ 4 } $`);

        const existing = allBatchesHistory.filter(b => pattern.test(b.name));

        let maxSeq = 0;
        existing.forEach(b => {
            const parts = b.name.split('-');
            if (parts.length === 2) {
                const seq = parseInt(parts[1]);
                if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
            }
        });

        const nextSeq = (maxSeq + 1).toString().padStart(4, '0');
        return `${prefix} -${nextSeq} `;
    };

    const [isCreating, setIsCreating] = useState(false);

    const handleCreateCloneBatch = async () => {
        if (!newBatch.geneticId || !newBatch.quantity) {
            showToast("Por favor completa todos los campos.", 'error');
            return;
        }

        setIsCreating(true);

        const selectedGenetic = mothersStates.find(m => m.id === newBatch.geneticId);
        const barcodeName = generateSequenceName(selectedGenetic?.name || 'GEN');

        const batchData = {
            name: barcodeName,
            quantity: parseInt(newBatch.quantity),
            stage: 'seedling' as const,
            current_room_id: undefined,
            genetic_id: newBatch.geneticId,
            start_date: newBatch.date,
            parent_batch_id: undefined
        };

        const created = await roomsService.createBatch(batchData);

        if (created) {
            loadData(true);
            setIsCreateModalOpen(false);
            setNewBatch({
                geneticId: '',
                quantity: '',
                date: new Date().toISOString().split('T')[0]
            });
            showToast("Lote creado exitosamente", 'success');
        } else {
            showToast("Error al crear el lote.", 'error');
        }
        setIsCreating(false);
    };

    // Actions Handlers
    const handleEditClick = (batch: any) => {
        setEditingBatch(batch);
        setEditForm({
            name: batch.name || '',
            quantity: batch.quantity.toString(),
            date: batch.start_date ? batch.start_date.split('T')[0] : ''
        });
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!editingBatch) return;

        const newQuantity = parseInt(editForm.quantity);
        let success = true;

        if (editingBatch.isGroup) {
            const difference = newQuantity - editingBatch.quantity;

            // 1. Update Name and Date for the root
            await roomsService.updateBatch(editingBatch.originalRoot.id, {
                name: editForm.name,
                start_date: editForm.date
            });

            // If name changed, we update all children as well (append their specific suffix maybe? Or just leave them)
            // It's probably best to only touch the root's name, or set base name for children if needed. 
            // We'll update children's start_date at least:
            if (editingBatch.groupChildren && editingBatch.groupChildren.length > 0) {
                for (const child of editingBatch.groupChildren) {
                    await roomsService.updateBatch(child.id, { start_date: editForm.date });
                }
            }

            // 2. Handle Quantity changes
            if (difference > 0) {
                // Increase: Add to the root batch
                await roomsService.updateBatch(editingBatch.originalRoot.id, {
                    quantity: editingBatch.originalRoot.quantity + difference
                });
            } else if (difference < 0) {
                // Decrease: Same logic as discard
                let remainingToDiscard = Math.abs(difference);
                const allUnits = [editingBatch.originalRoot, ...(editingBatch.groupChildren || [])];

                for (let i = 0; i < allUnits.length && remainingToDiscard > 0; i++) {
                    const unit = allUnits[i];
                    if (unit && unit.quantity > 0) {
                        const toDiscardFromThisUnit = Math.min(unit.quantity, remainingToDiscard);
                        const newQty = unit.quantity - toDiscardFromThisUnit;

                        await roomsService.updateBatch(unit.id, {
                            quantity: newQty,
                            ...(newQty === 0 ? { status: 'Descartado' } : {})
                        });

                        remainingToDiscard -= toDiscardFromThisUnit;
                    }
                }
            }
        } else {
            // Standard single batch update
            success = await roomsService.updateBatch(editingBatch.id, {
                name: editForm.name,
                quantity: newQuantity,
                start_date: editForm.date
            });
        }

        if (success) {
            loadData(true);
            setIsEditModalOpen(false);
            setEditingBatch(null);
            showToast("Lote actualizado correctamente.", 'success');
        } else {
            showToast("Error al actualizar el lote.", 'error');
        }
    };

    // Updated Delete Logic for Groups
    const handleDeleteClick = (batch: any) => {
        // We need to delete the batch AND its children if it's a root of a group
        // The 'batch' object here comes from the aggregated view, so it might have .children attached if it is a group root?
        // Actually, looking at renderBatchRow, 'batch' is passed directly.
        // In the main loop, we construct 'smartGroups' where .root has the batch data, and .children has the array.
        // But 'renderBatchRow' receives the raw batch object.

        // We need to find the group this batch belongs to (or is root of) to delete all of them?
        // OR: If the user clicks delete on a "Group Row" (Root), they expect the whole group to go.
        // If they click on a "Child Row", they might expect just that one?
        // The user says "Eliminar Lote se elimina una sola unidad y no el lote". This implies they click the group row.

        // Let's find if this batch is a root of a smartGroup
        const group = cloneBatches.find(g => g.root.id === batch.id);

        if (group) {
            // It's a root! Select all IDs
            const allIds = [group.root.id, ...group.children.map((c: any) => c.id)];
            setBatchToDelete({ ...batch, idsToDelete: allIds, isGroup: true, count: allIds.length });
        } else {
            // It's a single batch or child (if accessed individually, though UI shows hierarchy)
            // If it's a child row, just delete it.
            setBatchToDelete({ ...batch, idsToDelete: [batch.id], isGroup: false });
        }
        setDeleteReason('');
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!batchToDelete || !batchToDelete.idsToDelete || !deleteReason.trim()) return;

        const actionDetail = `Eliminar Lote. Motivo: ${deleteReason}`;
        const success = await roomsService.deleteBatches(batchToDelete.idsToDelete, actionDetail);
        if (success) {
            loadData();
            setIsDeleteModalOpen(false);
            setBatchToDelete(null);
            setDeleteReason('');
            showToast("Lote eliminado correctamente.", 'success');
        } else {
            showToast("Error al eliminar el lote.", 'error');
        }
    };

    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteAllBatches = async () => {
        setIsDeleting(true);
        try {
            // Flatten all batches from groups
            const allIds: string[] = [];
            cloneBatches.forEach(group => {
                allIds.push(group.root.id);
                group.children.forEach((child: any) => allIds.push(child.id));
            });

            if (allIds.length === 0) {
                setIsDeleteAllModalOpen(false);
                return;
            }

            const success = await roomsService.deleteBatches(allIds, "Borrado Masivo / Limpieza de Sala");

            if (success) {
                loadData(true);
                setToastMessage("Todos los lotes han sido eliminados.");
                setToastType('success');
            } else {
                setToastMessage("Error al eliminar los lotes.");
                setToastType('error');
            }
            setToastOpen(true);
            setIsDeleteAllModalOpen(false);
        } catch (error) {
            console.error("Error deleting all batches:", error);
            setToastMessage("Error inesperado al eliminar los lotes.");
            setToastType('error');
            setToastOpen(true);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleMoveClick = (batch: any) => {
        setBatchToMove(batch);
        setMoveToRoomId('');
        setMoveQuantity(batch.quantity); // Default to all
        setIsMoveModalOpen(true);
    };

    const handleConfirmMove = async () => {
        if (!batchToMove || !moveToRoomId || !moveQuantity) return;

        const success = await roomsService.moveBatch(batchToMove.id, batchToMove.current_room_id, moveToRoomId, "Movimiento desde Gestión de Esquejes", moveQuantity);
        if (success) {
            // alert("✅ Lote movido correctamente"); // Removed native alert
            loadData();
            setIsMoveModalOpen(false);
            setIsSuccessModalOpen(true); // Trigger Success Modal
            setBatchToMove(null);
            setMoveToRoomId('');
            setBatchToMove(null);
            setMoveToRoomId('');
        } else {
            showToast("Error al mover el lote", 'error');
        }
    };

    const handleUnitDeleteClick = async (batch: any, unitIndex: number) => {
        const displayDeleteName = batch.quantity > 1
            ? `la unidad #${unitIndex.toString().padStart(3, '0')} del lote ${batch.name} `
            : `el lote ${batch.name} `;

        if (window.confirm(`¿Seguro que deseas eliminar ${displayDeleteName}?`)) {
            setLoading(true);
            try {
                if (batch.quantity <= 1) {
                    await roomsService.deleteBatches([batch.id], "Eliminación de unidad individual");
                } else {
                    await roomsService.updateBatch(batch.id, { quantity: batch.quantity - 1 }, undefined, "Eliminación de unidad individual");
                }
                loadData(true);
                showToast("Unidad eliminada correctamente.", "success");
            } catch (e) {
                console.error(e);
                showToast("Error al eliminar la unidad.", "error");
            } finally {
                setLoading(false);
            }
        }
    };

    const handleUnitPrintClick = (batch: any, unitIndex: number, autoPrint: boolean = false) => {
        const customBatchName = batch.quantity > 1
            ? `${batch.name} - U#${unitIndex.toString().padStart(3, '0')} `
            : batch.name;

        setViewingBatch({ ...batch, name: customBatchName, quantity: 1 });
        setPrintQuantity(1);
        setIsBarcodeModalOpen(true);
        if (autoPrint) {
            setTimeout(() => {
                window.print();
            }, 500);
        }
    };

    const handleBarcodeClick = (batch: any) => {
        setViewingBatch(batch);
        setPrintQuantity(1); // Reset default
        setIsBarcodeModalOpen(true);
    };

    const handlePrintTickets = () => {
        if (!viewingBatch) return;
        window.print();
    };

    const handleDiscardClick = (batch: any) => {
        setBatchToDiscard(batch);
        setDiscardQuantity(0);
        setDiscardReason('');
        setIsDiscardModalOpen(true);
    };

    const handleConfirmDiscard = async () => {
        if (!batchToDiscard || discardQuantity <= 0) return;

        if (discardQuantity > batchToDiscard.quantity) {
            showToast("No puedes descartar más de la cantidad disponible.", 'error');
            return;
        }

        let success = false;
        const actionDetail = discardReason
            ? `Baja manual de ${discardQuantity} unidades. Motivo: ${discardReason}`
            : `Baja manual de ${discardQuantity} unidades.`;

        if (batchToDiscard.isGroup) {
            const allUnits = [batchToDiscard.originalRoot, ...(batchToDiscard.groupChildren || [])];
            let remainingToDiscard = discardQuantity;

            for (let i = 0; i < allUnits.length && remainingToDiscard > 0; i++) {
                const unit = allUnits[i];
                if (unit && unit.quantity > 0) {
                    const toDiscardFromThisUnit = Math.min(unit.quantity, remainingToDiscard);
                    const newQty = unit.quantity - toDiscardFromThisUnit;

                    await roomsService.updateBatch(unit.id, {
                        quantity: newQty,
                        ...(newQty === 0 ? { status: 'Descartado' } : {})
                    }, undefined, actionDetail);

                    remainingToDiscard -= toDiscardFromThisUnit;
                }
            }
            success = true;
        } else {
            const newQuantity = batchToDiscard.quantity - discardQuantity;
            success = await roomsService.updateBatch(batchToDiscard.id, {
                quantity: newQuantity,
                ...(newQuantity === 0 ? { status: 'Descartado' } : {})
            }, undefined, actionDetail);
        }

        if (success) {
            loadData();
            setIsDiscardModalOpen(false);
            setBatchToDiscard(null);
            setDiscardQuantity(0);
            setDiscardReason('');
            showToast("Unidades descartadas correctamente", "success");
        } else {
            showToast("Error al descartar unidades", "error");
        }
    };


    // Filter logic
    const filteredGroups = selectedGeneticFilter
        ? cloneBatches.filter(g => g.root.genetic?.name === selectedGeneticFilter)
        : cloneBatches;

    const displayedBatches = cloneBatches.filter(group => {
        const root = group.root;
        const matchesSearch = searchTerm === '' ||
            root.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (root.genetic?.name || '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === '' ||
            (statusFilter === 'Disponible' && !root.clone_map_id) ||
            (statusFilter === 'En mapa' && !!root.clone_map_id);
        const matchesStage = stageFilter === '' ||
            root.room?.type === stageFilter ||
            (stageFilter === 'clones' && root.room?.type === 'esquejera');

        return matchesSearch && matchesStatus && matchesStage;
    });

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 100px)', width: '100%' }}>
                <LoadingSpinner text="Cargando esquejes..." />
            </div>
        );
    }

    return (
        <Container>
            <Header>
                <h1><FaCut /> Gestión de Esquejes</h1>

            </Header>

            {clonesRoomId && (
                <div style={{ marginBottom: '2rem' }}>
                    <TuyaManager mode="sensors" roomId={clonesRoomId} compact={true} />
                </div>
            )}

            {/* Content when not loading */}




            {/* Summary Grid */}
            <SummaryGrid>
                <SummaryCard isTotal onClick={() => setSelectedGeneticFilter(null)} style={{ cursor: 'pointer' }}>
                    <h3>Total Esquejes</h3>
                    <div className="value">{stats.total}</div>
                    <div className="icon"><FaCut /></div>
                </SummaryCard>
                <SummaryCard isTotal onClick={() => setIsBreakdownModalOpen(true)} style={{ cursor: 'pointer', background: 'rgba(56, 189, 248, 0.1)', borderColor: 'rgba(56, 189, 248, 0.3)' }}>
                    <h3>Variedades Totales</h3>
                    <div className="value">{Object.keys(stats.byGenetic).length}</div>
                    <div className="icon"><FaDna style={{ color: '#7dd3fc' }} /></div>
                </SummaryCard>
            </SummaryGrid>

            <HistorySection>
                <HistoryHeader>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <FaHistory /> Lotes de Esquejes Activos
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginLeft: 'auto' }}>
                        {cloneBatches.length > 0 && (
                            <DeleteAllButton
                                onClick={() => setIsDeleteAllModalOpen(true)}
                                title="Eliminar todos los lotes visibles"
                            >
                                <FaTrash /> BORRAR TODO
                            </DeleteAllButton>
                        )}
                        {/* Ocultado temporalmente según solicitud */}
                        {false && (
                            <CreateButton onClick={() => setIsCreateModalOpen(true)} style={{ margin: 0 }}>
                                <FaPlus /> Agregar Esquejes
                            </CreateButton>
                        )}
                    </div>
                </HistoryHeader>

                <FilterContainer>
                    <input
                        type="text"
                        placeholder="Buscar por lote o genética..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="filter-select">
                        <CustomSelect
                            value={statusFilter}
                            onChange={setStatusFilter}
                            placeholder="Todos los Estados"
                            options={[
                                { value: '', label: 'Todos los Estados' },
                                { value: 'Disponible', label: 'Disponible' },
                                { value: 'En mapa', label: 'En mapa' }
                            ]}
                            triggerStyle={{
                                background: 'rgba(15, 23, 42, 0.6)',
                                backdropFilter: 'blur(12px)',
                                borderColor: 'rgba(255, 255, 255, 0.08)'
                            }}
                        />
                    </div>
                    <div className="filter-select">
                        <CustomSelect
                            value={stageFilter}
                            onChange={setStageFilter}
                            placeholder="Todas las Etapas"
                            options={[
                                { value: '', label: 'Todas las Etapas' },
                                { value: 'clones', label: 'Plántula/Esqueje' },
                                { value: 'vegetation', label: 'Vegetativo' },
                                { value: 'flowering', label: 'Floración' }
                            ]}
                            triggerStyle={{
                                background: 'rgba(15, 23, 42, 0.6)',
                                backdropFilter: 'blur(12px)',
                                borderColor: 'rgba(255, 255, 255, 0.08)'
                            }}
                        />
                    </div>
                </FilterContainer>

                <div style={{ overflowX: 'auto' }}>
                    <HistoryTable>
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Lote (Código)</th>
                                <th>Genética</th>
                                <th>Cantidad</th>
                                <th>Cultivo</th>
                                <th>Destino</th>
                                <th>Fase de Cultivo</th>
                                <th>Estado</th>
                                <th style={{ textAlign: 'center' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* RENDER BY GROUPS (ALL) - Aggregated View */}
                            {displayedBatches.map(group => {
                                const { root } = group;

                                console.log("🔍 Renderizando BatchGroupRow:", { name: root.name, room: root.room, current_room_id: root.current_room_id });

                                return (
                                    <BatchGroupRow
                                        key={root.id}
                                        group={group}
                                        onBarcodeClick={handleBarcodeClick}
                                        onMoveClick={handleMoveClick}
                                        onDiscardClick={handleDiscardClick}
                                        onEditClick={handleEditClick}
                                        onDeleteClick={handleDeleteClick}
                                        onUnitPrintClick={handleUnitPrintClick}
                                        onUnitDeleteClick={handleUnitDeleteClick}
                                        onNavigate={(path: string) => navigate(path)}
                                        onMobileClick={setMobileDetailBatch}
                                    />
                                );
                            })}
                            {displayedBatches.length === 0 && (
                                <tr>
                                    <td colSpan={9} style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem 1rem' }}>
                                        No hay registros de esquejes.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </HistoryTable>
                </div>
            </HistorySection>

            {
                selectedGeneticFilter && (
                    <ModalOverlay>
                        <ModalContent style={{ maxWidth: '1000px', width: '95%' }}>
                            <CloseIcon onClick={() => setSelectedGeneticFilter(null)}><FaTimes /></CloseIcon>
                            <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FaCut /> Lotes de {selectedGeneticFilter}
                            </h2>

                            <div style={{ overflowX: 'auto', maxHeight: '70vh', overflowY: 'auto' }}>
                                <HistoryTable>
                                    <thead>
                                        <tr>
                                            <th>Fecha</th>
                                            <th>Lote (Código)</th>
                                            <th>Genética</th>
                                            <th>Cantidad</th>
                                            <th>Cultivo</th>
                                            <th>Destino</th>
                                            <th>Fase de Cultivo</th>
                                            <th>Estado</th>
                                            <th style={{ textAlign: 'center' }}>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredGroups.map(group => {
                                            const { root, children } = group;
                                            const rows = [root, ...children];

                                            return (
                                                <React.Fragment key={root.id}>
                                                    {rows.map((batch, index) => {
                                                        const isRoot = batch === root;
                                                        const isLast = index === rows.length - 1;
                                                        const rowStyle: React.CSSProperties = {
                                                            borderBottom: !isLast ? 'none' : undefined,
                                                            fontSize: !isRoot ? '0.9rem' : undefined,
                                                            color: !isRoot ? '#94a3b8' : '#f8fafc'
                                                        };
                                                        const cellStyle = !isLast ? { borderBottom: 'none' } : undefined;

                                                        return (
                                                            <tr
                                                                key={batch.id}
                                                                style={{ ...rowStyle, cursor: 'pointer' }}
                                                                onClick={(e) => {
                                                                    if (window.innerWidth <= 768) {
                                                                        e.stopPropagation();
                                                                        setMobileDetailBatch({ root: batch, children: [] });
                                                                    }
                                                                }}
                                                            >
                                                                <td data-label="Fecha" style={cellStyle}>{new Date(batch.start_date || batch.created_at).toLocaleDateString()}</td>
                                                                <td data-label="Lote (Código)" style={cellStyle}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: batch.parent_batch_id ? '1.5rem' : '0' }}>
                                                                        {batch.parent_batch_id && (
                                                                            <FaLevelUpAlt style={{ transform: 'rotate(90deg)', color: '#64748b', fontSize: '1rem', minWidth: '1rem' }} />
                                                                        )}
                                                                        <FaBarcode style={{ color: batch.parent_batch_id ? '#94a3b8' : '#f8fafc' }} />
                                                                        <strong>{batch.name}</strong>
                                                                        {batch.parent_batch_id && <span style={{ fontSize: '0.7rem', color: '#64748b', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '4px', padding: '0 4px' }}>Sub-lote</span>}
                                                                    </div>
                                                                </td>
                                                                <td data-label="Genética" style={cellStyle}>{batch.genetic?.name || 'Desconocida'}</td>
                                                                <td data-label="Cantidad" style={{ ...cellStyle, whiteSpace: 'nowrap' }}>{batch.quantity} u.</td>
                                                                <td data-label="Cultivo" style={cellStyle}>
                                                                    {batch.room?.spot?.id ? (
                                                                        <BadgeLink
                                                                            color="#38bdf8"
                                                                            onClick={(e) => { e.stopPropagation(); navigate(`/crops/${batch.room.spot_id}`); }}
                                                                            title="Ver Cultivo"
                                                                        >
                                                                            {batch.room?.spot?.name}
                                                                        </BadgeLink>
                                                                    ) : '---'}
                                                                </td>
                                                                <td data-label="Destino" style={cellStyle}>
                                                                    {batch.room?.id ? (
                                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '6px' }}>
                                                                            <BadgeLink
                                                                                color="#c084fc"
                                                                                onClick={(e) => { e.stopPropagation(); navigate(`/rooms/${batch.room.id}`); }}
                                                                                title="Ver Sala"
                                                                            >
                                                                                {batch.room?.name}
                                                                            </BadgeLink>
                                                                        </div>
                                                                    ) : 'Desconocido'}
                                                                </td>
                                                                <td data-label="Fase de Cultivo" style={cellStyle}>
                                                                    {batch.room?.id ? getStageBadge(batch.room?.type) : '---'}
                                                                </td>
                                                                <td data-label="Estado" style={cellStyle}>{getStatusBadge(batch, navigate)}</td>
                                                                <td data-label="Acciones" style={{ textAlign: 'center', ...cellStyle, justifyContent: 'center' }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                                        <Tooltip text="Ver Código de Barras">
                                                                            <ActionButton color="#4a5568" onClick={(e) => { e.stopPropagation(); handleBarcodeClick(batch); }}><FaBarcode /></ActionButton>
                                                                        </Tooltip>
                                                                        <Tooltip text="Mover a Sala (Transplante)">
                                                                            <ActionButton color="#ed8936" onClick={(e) => { e.stopPropagation(); handleMoveClick(batch); }}><FaExchangeAlt /></ActionButton>
                                                                        </Tooltip>
                                                                        <Tooltip text="Dar de Baja (Descarte)">
                                                                            <ActionButton color="#e53e3e" onClick={(e) => { e.stopPropagation(); handleDiscardClick(batch); }}><FaMinusCircle /></ActionButton>
                                                                        </Tooltip>
                                                                        <Tooltip text="Editar Lote">
                                                                            <ActionButton color="#3182ce" onClick={(e) => { e.stopPropagation(); handleEditClick(batch); }}><FaEdit /></ActionButton>
                                                                        </Tooltip>
                                                                        <Tooltip text="Eliminar Lote">
                                                                            <ActionButton color="#e53e3e" onClick={(e) => { e.stopPropagation(); handleDeleteClick(batch); }}><FaTrash /></ActionButton>
                                                                        </Tooltip>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </React.Fragment>
                                            );
                                        })}
                                        {filteredGroups.length === 0 && (
                                            <tr><td colSpan={9} style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem 1rem' }}>No hay lotes activos para esta genética.</td></tr>
                                        )}
                                    </tbody>
                                </HistoryTable>
                            </div>
                        </ModalContent>
                    </ModalOverlay>
                )
            }

            {/* Create Clone Batch Modal */}
            <AnimatedModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} allowOverflow>
                <CloseIcon onClick={() => setIsCreateModalOpen(false)}><FaTimes /></CloseIcon>
                <h2 style={{ marginBottom: '1.5rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FaCut /> Nuevo Lote de Esquejes
                </h2>

                <FormGroup style={{ zIndex: 20 }}>
                    <label>Madre de Origen</label>
                    <CustomSelect
                        value={newBatch.geneticId}
                        onChange={(val) => setNewBatch({ ...newBatch, geneticId: val })}
                        options={mothersStates.map(m => ({ value: m.id, label: m.name }))}
                        placeholder="Seleccionar Madre..."
                    />
                </FormGroup>

                <ModalRow>
                    <FormGroup style={{ flex: 1 }}>
                        <label>Cantidad</label>
                        <input
                            type="number"
                            value={newBatch.quantity}
                            onChange={e => setNewBatch({ ...newBatch, quantity: e.target.value })}
                            placeholder="Ej: 50"
                        />
                    </FormGroup>

                    <FormGroup style={{ flex: 1, zIndex: 15 }}>
                        <label>Fecha</label>
                        <CustomDatePicker
                            selected={newBatch.date ? new Date(newBatch.date + 'T12:00:00') : null}
                            onChange={(date: Date | null) => setNewBatch({
                                ...newBatch,
                                date: date ? date.toISOString().split('T')[0] : ''
                            })}
                            placeholderText="Fecha de inicio"
                        />
                    </FormGroup>
                </ModalRow>

                <ModalActions>
                    <button
                        onClick={() => setIsCreateModalOpen(false)}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: 'rgba(30, 41, 59, 0.6)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '0.5rem',
                            color: '#cbd5e1',
                            cursor: 'pointer',
                            fontWeight: 600,
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.color = '#f8fafc'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(30, 41, 59, 0.6)'; e.currentTarget.style.color = '#cbd5e1'; }}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleCreateCloneBatch}
                        disabled={isCreating}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: isCreating ? 'rgba(74, 222, 128, 0.1)' : 'rgba(74, 222, 128, 0.2)',
                            color: '#4ade80',
                            border: '1px solid rgba(74, 222, 128, 0.5)',
                            borderRadius: '0.5rem',
                            cursor: isCreating ? 'wait' : 'pointer',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => { if (!isCreating) { e.currentTarget.style.background = 'rgba(74, 222, 128, 0.3)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                        onMouseLeave={e => { if (!isCreating) { e.currentTarget.style.background = 'rgba(74, 222, 128, 0.2)'; e.currentTarget.style.transform = 'none'; } }}
                    >
                        {isCreating ? (
                            <>
                                <ButtonSpinner />
                                <span>Creando...</span>
                            </>
                        ) : (
                            'Crear Lote'
                        )}
                    </button>
                </ModalActions>
            </AnimatedModal>

            {/* Edit Batch Modal */}
            {
                isEditModalOpen && (
                    <GlassToastOverlay onClick={() => setIsEditModalOpen(false)}>
                        <GlassToastContent onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                                <h2 style={{ margin: 0, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.25rem' }}>
                                    <FaEdit /> Editar Lote
                                </h2>
                                <button onClick={() => setIsEditModalOpen(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.25rem' }}><FaTimes /></button>
                            </div>

                            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(56, 189, 248, 0.05)', borderRadius: '0.75rem', color: '#bae6fd', fontSize: '0.9rem', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                                <strong style={{ color: '#38bdf8' }}>Genética asignada:</strong> {editingBatch?.genetic?.name || 'Desconocida'} <br />
                                <span style={{ color: '#7dd3fc', opacity: 0.8, fontSize: '0.8rem', marginTop: '0.5rem', display: 'block' }}>Para cambiar la genética, debes eliminar este lote y registrar uno nuevo.</span>
                            </div>

                            <FormGroup style={{ marginBottom: '1rem' }}>
                                <label style={{ color: '#cbd5e1' }}>Nombre del Lote</label>
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', width: '100%', padding: '0.75rem', borderRadius: '0.5rem' }}
                                />
                            </FormGroup>

                            <ModalRow style={{ marginBottom: '0.5rem' }}>
                                <FormGroup style={{ flex: 1 }}>
                                    <label style={{ color: '#cbd5e1' }}>Cantidad Total <span style={{ color: '#38bdf8' }}>*</span></label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={editForm.quantity}
                                        onChange={e => setEditForm(prev => ({ ...prev, quantity: e.target.value }))}
                                        style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', width: '100%', padding: '0.75rem', borderRadius: '0.5rem' }}
                                    />
                                </FormGroup>
                                <FormGroup style={{ flex: 1 }}>
                                    <label style={{ color: '#cbd5e1' }}>Fecha de Inicio</label>
                                    <input
                                        type="date"
                                        value={editForm.date}
                                        onChange={e => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                                        style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', width: '100%', padding: '0.75rem', borderRadius: '0.5rem' }}
                                    />
                                </FormGroup>
                            </ModalRow>

                            <ModalActions>
                                <button
                                    onClick={() => setIsEditModalOpen(false)}
                                    style={{ padding: '0.75rem 1.5rem', background: 'rgba(255,255,255,0.05)', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', cursor: 'pointer', transition: 'all 0.2s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveEdit}
                                    disabled={!editForm.quantity || parseInt(editForm.quantity) < 0}
                                    style={{
                                        padding: '0.75rem 1.5rem',
                                        background: editForm.quantity && parseInt(editForm.quantity) >= 0 ? '#38bdf8' : 'rgba(56, 189, 248, 0.3)',
                                        color: editForm.quantity && parseInt(editForm.quantity) >= 0 ? '#0f172a' : 'rgba(255,255,255,0.5)',
                                        border: 'none',
                                        borderRadius: '0.5rem',
                                        cursor: editForm.quantity && parseInt(editForm.quantity) >= 0 ? 'pointer' : 'not-allowed',
                                        fontWeight: 'bold',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    Guardar Cambios
                                </button>
                            </ModalActions>
                        </GlassToastContent>
                    </GlassToastOverlay>
                )
            }


            {/* Move Batch Modal */}
            {
                isMoveModalOpen && batchToMove && (
                    <ModalOverlay>
                        <ModalContent>
                            <CloseIcon onClick={() => setIsMoveModalOpen(false)}><FaTimes /></CloseIcon>
                            <h2 style={{ marginBottom: '1.5rem', color: '#2d3748', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FaExchangeAlt /> Mover Lote
                            </h2>
                            <p style={{ marginBottom: '1rem' }}>Mover <strong>{batchToMove.name}</strong> a otra sala:</p>

                            <FormGroup>
                                <label>Sala de Destino</label>
                                <select
                                    value={moveToRoomId}
                                    onChange={e => setMoveToRoomId(e.target.value)}
                                >
                                    <option value="">Seleccionar Sala...</option>
                                    {rooms.filter(r => r.id !== batchToMove.current_room_id).map(r => (
                                        <option key={r.id} value={r.id}>{r.name} ({r.type})</option>
                                    ))}
                                </select>
                            </FormGroup>

                            <FormGroup>
                                <label>Cantidad a Mover (Total: {batchToMove.quantity})</label>
                                <input
                                    type="number"
                                    min="1"
                                    max={batchToMove.quantity}
                                    value={moveQuantity}
                                    onChange={e => setMoveQuantity(Math.min(batchToMove.quantity, Math.max(1, parseInt(e.target.value) || 1)))}
                                />
                                <div style={{ fontSize: '0.8rem', color: '#718096', marginTop: '0.25rem' }}>
                                    {moveQuantity < batchToMove.quantity
                                        ? `Se moverán ${moveQuantity} esquejes.Quedarán ${batchToMove.quantity - moveQuantity} en el lote original.`
                                        : 'Se moverá todo el lote.'}
                                </div>
                            </FormGroup>

                            <ModalActions>
                                <button
                                    onClick={() => setIsMoveModalOpen(false)}
                                    style={{ padding: '0.75rem', background: 'none', border: '1px solid #e2e8f0', borderRadius: '0.5rem', cursor: 'pointer' }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleConfirmMove}
                                    style={{ padding: '0.75rem 1.5rem', background: '#ed8936', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    Mover Lote
                                </button>
                            </ModalActions>
                        </ModalContent>
                    </ModalOverlay>
                )
            }

            {/* Barcode Modal */}
            {
                isBarcodeModalOpen && viewingBatch && (
                    <GlassToastOverlay onClick={() => setIsBarcodeModalOpen(false)}>
                        <GlassToastContent onClick={e => e.stopPropagation()}>
                            <CloseIcon onClick={() => setIsBarcodeModalOpen(false)} style={{ color: '#94a3b8' }}><FaTimes /></CloseIcon>
                            <h2 style={{ textAlign: 'center', marginBottom: '0.5rem', color: '#f8fafc', fontSize: '1.4rem' }}>
                                Ficha del Lote
                            </h2>
                            <p style={{ textAlign: 'center', color: '#94a3b8', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                                Escanee para hacer seguimiento a este lote o sus unidades
                            </p>

                            <BarcodeDisplay style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '1rem', padding: '1.5rem', margin: '0 auto 1.5rem' }}>
                                <Link to={`/clones/${viewingBatch.id}`} style={{ textDecoration: 'none' }} title="Clic para ir a la Ficha del Lote">
                                    <div style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem', display: 'inline-block', marginBottom: '1rem', cursor: 'pointer', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                                        <QRCode value={`${window.location.origin}/clones/${viewingBatch.id}`} size={100} />
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <h3 style={{ margin: '0 0 0.5rem 0', color: '#f8fafc', fontSize: '1.25rem', letterSpacing: '0.05em' }}>
                                            {viewingBatch.displayName || viewingBatch.name}
                                        </h3>
                                        <p style={{ margin: '0 0 1.5rem 0', color: '#38bdf8', fontSize: '0.875rem' }}>
                                            {viewingBatch.genetic?.nomenclatura ? `${viewingBatch.genetic.nomenclatura} - ` : ''}
                                            {viewingBatch.genetic?.name || 'Desconocida'} • {(viewingBatch.quantity || 1) + (viewingBatch.clone_units?.length || 0)}u • {new Date(viewingBatch.start_date || viewingBatch.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </Link>
                            </BarcodeDisplay>

                            {viewingBatch.clone_units && viewingBatch.clone_units.length > 0 && (
                                <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.05)', maxHeight: '150px', overflowY: 'auto' }}>
                                    <h4 style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Unidades ({viewingBatch.clone_units.length})</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.5rem' }}>
                                        {[viewingBatch, ...(viewingBatch.clone_units || [])].map((unit: any) => (
                                            <div key={unit.id} style={{ fontSize: '0.75rem', color: '#94a3b8', padding: '0.25rem 0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '0.25rem', textAlign: 'center' }}>
                                                {unit.name}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '0.5rem' }}>
                                    <label style={{ fontWeight: 600, color: '#cbd5e1', fontSize: '0.9rem' }}>Copias a Imprimir:</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={printQuantity}
                                        onChange={(e) => setPrintQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                        style={{ width: '60px', padding: '0.4rem', textAlign: 'center', borderRadius: '0.25rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#f8fafc' }}
                                    />
                                </div>

                                <ModalActions style={{ marginTop: '1rem' }}>
                                    <button onClick={() => setIsBarcodeModalOpen(false)} style={{ flex: 1, padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', cursor: 'pointer', color: '#94a3b8', fontWeight: 600, transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
                                        Volver
                                    </button>
                                    <button onClick={handlePrintTickets} style={{ flex: 1, padding: '0.75rem', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s', boxShadow: '0 4px 6px rgba(0,0,0,0.2)' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.3)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.2)'}>
                                        <FaPrint /> Imprimir Etiquetas
                                    </button>
                                </ModalActions>
                            </div>
                        </GlassToastContent>
                    </GlassToastOverlay>
                )
            }

            {/* Discard Modal */}
            {
                isDiscardModalOpen && batchToDiscard && (
                    <GlassToastOverlay onClick={() => setIsDiscardModalOpen(false)}>
                        <GlassToastContent onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                                <h2 style={{ margin: 0, color: '#e53e3e', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.25rem' }}>
                                    <FaMinusCircle /> Descartar Esquejes
                                </h2>
                                <button onClick={() => setIsDiscardModalOpen(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.25rem' }}><FaTimes /></button>
                            </div>

                            <p style={{ marginBottom: '1.5rem', color: '#94a3b8', fontSize: '0.95rem' }}>
                                Registrar baja de esquejes para el lote <strong style={{ color: '#f8fafc' }}>{batchToDiscard.name}</strong>.
                            </p>

                            <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#fca5a5', fontWeight: 'bold' }}>
                                    <span>Cantidad Actual:</span>
                                    <span>{batchToDiscard.quantity} u.</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#f8fafc' }}>
                                    <span>Nueva Cantidad:</span>
                                    <span>{Math.max(0, batchToDiscard.quantity - discardQuantity)} u.</span>
                                </div>
                            </div>

                            <FormGroup>
                                <label style={{ color: '#cbd5e1' }}>Cantidad a Descartar <span style={{ color: '#e53e3e' }}>*</span></label>
                                <input
                                    type="number"
                                    min="1"
                                    max={batchToDiscard.quantity}
                                    value={discardQuantity}
                                    onChange={e => setDiscardQuantity(Math.min(batchToDiscard.quantity, Math.max(0, parseInt(e.target.value) || 0)))}
                                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                                />
                            </FormGroup>

                            <FormGroup>
                                <label style={{ color: '#cbd5e1' }}>Motivo de la baja <span style={{ color: '#e53e3e' }}>*</span></label>
                                <input
                                    type="text"
                                    placeholder="Ej: Hongos, Dañados, No enraizó..."
                                    value={discardReason}
                                    onChange={e => setDiscardReason(e.target.value)}
                                    autoFocus
                                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                                />
                            </FormGroup>

                            <ModalActions>
                                <button
                                    onClick={() => setIsDiscardModalOpen(false)}
                                    style={{ padding: '0.75rem 1.5rem', background: 'rgba(255,255,255,0.05)', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', cursor: 'pointer', transition: 'all 0.2s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleConfirmDiscard}
                                    disabled={discardQuantity <= 0 || !discardReason.trim()}
                                    style={{
                                        padding: '0.75rem 1.5rem',
                                        background: discardQuantity > 0 && discardReason.trim() ? '#e53e3e' : 'rgba(229, 62, 62, 0.3)',
                                        color: discardQuantity > 0 && discardReason.trim() ? 'white' : 'rgba(255,255,255,0.5)',
                                        border: 'none',
                                        borderRadius: '0.5rem',
                                        cursor: discardQuantity > 0 && discardReason.trim() ? 'pointer' : 'not-allowed',
                                        fontWeight: 'bold',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    Confirmar Baja
                                </button>
                            </ModalActions>
                        </GlassToastContent>
                    </GlassToastOverlay>
                )
            }

            {/* Delete Confirmation */}
            {
                isDeleteModalOpen && (
                    <GlassToastOverlay onClick={() => setIsDeleteModalOpen(false)}>
                        <GlassToastContent onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                                <h2 style={{ margin: 0, color: '#e53e3e', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.25rem' }}>
                                    <FaTrash /> Eliminar Lote
                                </h2>
                                <button onClick={() => setIsDeleteModalOpen(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.25rem' }}><FaTimes /></button>
                            </div>

                            <p style={{ color: '#cbd5e1', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                                {batchToDelete?.idsToDelete?.length > 1
                                    ? `¿Estás seguro de que deseas eliminar estos ${batchToDelete.idsToDelete.length} lotes? Esta acción no se puede deshacer.`
                                    : `¿Estás seguro de que deseas eliminar el lote ${batchToDelete?.name}?`}
                            </p>

                            <FormGroup>
                                <label style={{ color: '#cbd5e1' }}>Motivo de la Eliminación <span style={{ color: '#e53e3e' }}>*</span></label>
                                <input
                                    type="text"
                                    placeholder="Ej: Error de carga, Lote duplicado..."
                                    value={deleteReason}
                                    onChange={e => setDeleteReason(e.target.value)}
                                    autoFocus
                                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', width: '100%', padding: '0.75rem', borderRadius: '0.5rem' }}
                                />
                            </FormGroup>

                            <ModalActions>
                                <button
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    style={{ padding: '0.75rem 1.5rem', background: 'rgba(255,255,255,0.05)', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', cursor: 'pointer', transition: 'all 0.2s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleConfirmDelete}
                                    disabled={!deleteReason.trim()}
                                    style={{
                                        padding: '0.75rem 1.5rem',
                                        background: deleteReason.trim() ? '#e53e3e' : 'rgba(229, 62, 62, 0.3)',
                                        color: deleteReason.trim() ? 'white' : 'rgba(255,255,255,0.5)',
                                        border: 'none',
                                        borderRadius: '0.5rem',
                                        cursor: deleteReason.trim() ? 'pointer' : 'not-allowed',
                                        fontWeight: 'bold',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    Eliminar Lote
                                </button>
                            </ModalActions>
                        </GlassToastContent>
                    </GlassToastOverlay>
                )
            }

            {/* Delete All Confirmation */}
            <ConfirmModal
                isOpen={isDeleteAllModalOpen}
                title="Eliminar TODOS los Lotes"
                message={`¿Estás seguro de que deseas eliminar TODOS los lotes de esquejes visibles ? Esta acción no se puede deshacer.`}
                confirmText="Eliminar Todo"
                isDanger
                isLoading={isDeleting}
                onClose={() => !isDeleting && setIsDeleteAllModalOpen(false)}
                onConfirm={handleDeleteAllBatches}
            />

            {/* Success Modal */}
            <AnimatedModal isOpen={isSuccessModalOpen} onClose={() => setIsSuccessModalOpen(false)}>
                <div style={{ textAlign: 'center', padding: '1rem' }}>
                    <div style={{ color: '#48bb78', fontSize: '3rem', marginBottom: '1rem' }}>
                        <FaCheckCircle />
                    </div>
                    <h3 style={{ fontSize: '1.25rem', color: '#2d3748', marginBottom: '0.5rem' }}>¡Lote Movido!</h3>
                    <p style={{ color: '#718096', marginBottom: '1.5rem' }}>
                        El lote se ha asignado correctamente a la sala de destino.
                    </p>
                    <button
                        onClick={() => setIsSuccessModalOpen(false)}
                        style={{ padding: '0.75rem 2rem', background: '#319795', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        Aceptar
                    </button>
                </div>
            </AnimatedModal>

            {/* Breakdown Modal */}
            <AnimatedModal isOpen={isBreakdownModalOpen} onClose={() => setIsBreakdownModalOpen(false)}>
                <CloseIcon onClick={() => setIsBreakdownModalOpen(false)}><FaTimes /></CloseIcon>
                <h2 style={{ marginBottom: '1.5rem', color: '#2d3748', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FaCut /> Desglose por Genética
                </h2>

                <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                    {breakdownData.map((item, index) => (
                        <div key={index} style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '0.5rem', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.95rem', color: '#f8fafc', fontWeight: '600' }}>
                                <span>{item.name}</span>
                                <span>{item.quantity} u.</span>
                            </div>
                            <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${item.percentage}% `, background: '#38b2ac', borderRadius: '4px' }}></div>
                            </div>
                            <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                                {item.percentage.toFixed(1)}%
                            </div>
                        </div>
                    ))}
                    {breakdownData.length === 0 && (
                        <p style={{ textAlign: 'center', color: '#a0aec0', padding: '2rem' }}>No hay esquejes activos.</p>
                    )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
                    <button
                        onClick={() => setIsBreakdownModalOpen(false)}
                        style={{ padding: '0.75rem 2rem', background: '#2d3748', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        Cerrar
                    </button>
                </div>
            </AnimatedModal>

            {/* Print Area */}
            <PrintStyles />
            <div id="printable-clones-area">
                {viewingBatch && Array.from({ length: printQuantity }).map((_, i) => (
                    <PrintableCloneLabel key={i}>
                        <div className="qr-side">
                            <QRCode
                                value={viewingBatch.genetic_id ? `${window.location.origin}/genetic/${viewingBatch.genetic_id}` : viewingBatch.name}
                                size={64} // sized for 22mm roughly (approx 80px)
                                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                viewBox={`0 0 256 256`}
                            />
                        </div>
                        <div className="info-side">
                            <div className="name">{viewingBatch.name}</div>
                            <div className="meta">{viewingBatch.genetic?.name?.substring(0, 15)}</div>
                            <div className="meta">{new Date(viewingBatch.start_date || viewingBatch.created_at).toLocaleDateString()}</div>
                        </div>
                    </PrintableCloneLabel>
                ))}
            </div>

            {/* Mobile Detail Modal */}
            {mobileDetailBatch && (
                <GlassToastOverlay onClick={() => setMobileDetailBatch(null)}>
                    <GlassToastContent onClick={e => e.stopPropagation()} style={{ padding: '1.5rem', width: '90%', maxWidth: '400px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem' }}>
                            <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FaHashtag style={{ color: '#38bdf8' }} /> Detalle de Lote
                            </h2>
                            <button onClick={() => setMobileDetailBatch(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.25rem' }}><FaTimes /></button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Fecha</span>
                                <strong style={{ color: '#e2e8f0', fontSize: '0.9rem' }}>{new Date(mobileDetailBatch.root.start_date || mobileDetailBatch.root.created_at).toLocaleDateString()}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', alignItems: 'center' }}>
                                <span style={{ color: '#94a3b8', fontSize: '0.85rem', width: '30%' }}>Lote</span>
                                <strong style={{ color: '#e2e8f0', fontSize: '0.8rem', textAlign: 'right', whiteSpace: 'normal', wordBreak: 'break-all' }}>{mobileDetailBatch.root.name}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Genética</span>
                                <strong style={{ color: '#e2e8f0', fontSize: '0.9rem' }}>{mobileDetailBatch.root.genetic?.name || 'Desconocida'}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Cantidad</span>
                                <strong style={{ color: '#e2e8f0', fontSize: '0.9rem' }}>{mobileDetailBatch.root.quantity + (mobileDetailBatch.children?.reduce((acc: number, child: any) => acc + child.quantity, 0) || 0)} u.</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Fase</span>
                                <div>{getStageBadge(mobileDetailBatch.root.room?.type) || <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>---</span>}</div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem' }}>
                                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Estado</span>
                                <div>{getStatusBadge(mobileDetailBatch.root, () => { })}</div>
                            </div>
                        </div>

                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '0.75rem', display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                            <Tooltip text="Código Barras">
                                <ActionButton color="#4a5568" onClick={(e) => { e.stopPropagation(); handleBarcodeClick({ ...mobileDetailBatch.root, clone_units: mobileDetailBatch.children }); setMobileDetailBatch(null); }}><FaBarcode /></ActionButton>
                            </Tooltip>
                            <Tooltip text="Baja">
                                <ActionButton color="#e53e3e" onClick={(e) => {
                                    e.stopPropagation();
                                    handleDiscardClick({
                                        ...mobileDetailBatch.root,
                                        isGroup: true,
                                        name: mobileDetailBatch.root.name,
                                        quantity: mobileDetailBatch.root.quantity + (mobileDetailBatch.children?.reduce((acc: number, child: any) => acc + child.quantity, 0) || 0),
                                        originalRoot: mobileDetailBatch.root,
                                        groupChildren: mobileDetailBatch.children
                                    });
                                    setMobileDetailBatch(null);
                                }}><FaMinusCircle /></ActionButton>
                            </Tooltip>
                            <Tooltip text="Editar">
                                <ActionButton color="#3182ce" onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditClick({
                                        ...mobileDetailBatch.root,
                                        isGroup: true,
                                        name: mobileDetailBatch.root.name,
                                        quantity: mobileDetailBatch.root.quantity + (mobileDetailBatch.children?.reduce((acc: number, child: any) => acc + child.quantity, 0) || 0),
                                        originalRoot: mobileDetailBatch.root,
                                        groupChildren: mobileDetailBatch.children
                                    });
                                    setMobileDetailBatch(null);
                                }}><FaEdit /></ActionButton>
                            </Tooltip>
                            <Tooltip text="Eliminar">
                                <ActionButton color="#e53e3e" onClick={(e) => { e.stopPropagation(); handleDeleteClick(mobileDetailBatch.root); setMobileDetailBatch(null); }}><FaTrash /></ActionButton>
                            </Tooltip>
                        </div>
                    </GlassToastContent>
                </GlassToastOverlay>
            )}

            <ToastModal
                isOpen={toastOpen}
                message={toastMessage}
                type={toastType}
                onClose={() => setToastOpen(false)}
            />
        </Container >
    );
};

export default Clones;
