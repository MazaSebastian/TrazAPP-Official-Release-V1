import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { ArrowRightLeft, X as LucideX, Check, ArrowRight } from 'lucide-react';
import { Button as ShadcnButton } from './ui/Button';
import { Badge as ShadcnBadge } from './ui/Badge';

const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;
const scaleIn = keyframes`from { transform: scale(0.96); opacity: 0; } to { transform: scale(1); opacity: 1; }`;

const Overlay = styled.div`
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.75);
    z-index: 1200;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(12px);
    animation: ${fadeIn} 0.2s ease-out;
`;

const Content = styled.div`
    background: rgba(15, 23, 42, 0.96);
    border-radius: 1.25rem;
    padding: 1.75rem;
    width: 90%;
    max-width: 480px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.12);
    backdrop-filter: blur(24px);
    animation: ${scaleIn} 0.2s cubic-bezier(0.16, 1, 0.3, 1);
`;

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.25rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
`;

const HeaderInfo = styled.div`
    display: flex;
    align-items: center;
    gap: 0.85rem;
`;

const IconBadge = styled.div`
    width: 42px;
    height: 42px;
    border-radius: 0.75rem;
    background: linear-gradient(135deg, rgba(74, 222, 128, 0.2), rgba(16, 185, 129, 0.05));
    border: 1px solid rgba(74, 222, 128, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #4ade80;
    box-shadow: 0 0 15px rgba(74, 222, 128, 0.15);
`;

const Title = styled.h2`
    margin: 0;
    font-size: 1.15rem;
    font-weight: 700;
    color: #f8fafc;
    letter-spacing: -0.02em;
`;

const Subtitle = styled.p`
    margin: 0.2rem 0 0 0;
    font-size: 0.8rem;
    color: #94a3b8;
`;

const CloseButton = styled.button`
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #94a3b8;
    width: 32px;
    height: 32px;
    border-radius: 0.5rem;
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

const Details = styled.div`
    margin-bottom: 1.25rem;
    padding: 1rem;
    background: rgba(30, 41, 59, 0.45);
    border-radius: 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    flex-direction: column;
    gap: 0.75rem;

    .row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.85rem;
        color: #94a3b8;

        strong {
            color: #f8fafc;
        }
    }

    .transfer-flow {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-top: 0.5rem;
        border-top: 1px solid rgba(255, 255, 255, 0.06);
        font-size: 0.85rem;
    }
`;

const FormGroup = styled.div`
    margin-bottom: 1.25rem;
    label {
        display: block;
        font-weight: 600;
        font-size: 0.85rem;
        margin-bottom: 0.5rem;
        color: #cbd5e1;
    }
    textarea {
        width: 100%;
        padding: 0.75rem;
        background: rgba(15, 23, 42, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 0.625rem;
        min-height: 80px;
        font-family: inherit;
        font-size: 0.85rem;
        color: #f8fafc;
        resize: vertical;
        box-sizing: border-box;
        outline: none;
        transition: border-color 0.2s, box-shadow 0.2s;
        
        &:focus {
            border-color: #4ade80;
            box-shadow: 0 0 0 2px rgba(74, 222, 128, 0.2);
        }
    }
`;

const Actions = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
`;

interface MoveConfirmationModalProps {
    isOpen: boolean;
    batchName: string;
    fromRoomName: string;
    toRoomName: string;
    onClose: () => void;
    onConfirm: (notes: string) => void;
}

export const MoveConfirmationModal: React.FC<MoveConfirmationModalProps> = ({
    isOpen, batchName, fromRoomName, toRoomName, onClose, onConfirm
}) => {
    const [notes, setNotes] = useState('');

    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm(notes);
        setNotes('');
    };

    return (
        <Overlay onClick={onClose}>
            <Content onClick={e => e.stopPropagation()}>
                <Header>
                    <HeaderInfo>
                        <IconBadge>
                            <ArrowRightLeft size={20} />
                        </IconBadge>
                        <div>
                            <Title>Confirmar Movimiento</Title>
                            <Subtitle>Traslado de plantas entre salas de cultivo</Subtitle>
                        </div>
                    </HeaderInfo>
                    <CloseButton onClick={onClose} title="Cerrar modal">
                        <LucideX size={16} />
                    </CloseButton>
                </Header>

                <Details>
                    <div className="row">
                        <span>Lote / Variedad:</span>
                        <strong>{batchName}</strong>
                    </div>
                    <div className="transfer-flow">
                        <div>
                            <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>Origen</span>
                            <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{fromRoomName}</span>
                        </div>
                        <ArrowRight size={16} color="#4ade80" />
                        <div>
                            <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>Destino</span>
                            <ShadcnBadge variant="emerald">{toRoomName}</ShadcnBadge>
                        </div>
                    </div>
                </Details>

                <FormGroup>
                    <label>Notas del movimiento (Opcional)</label>
                    <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Ej: Traslado por cambio a floración..."
                    />
                </FormGroup>

                <Actions>
                    <ShadcnButton variant="secondary" onClick={onClose}>
                        Cancelar
                    </ShadcnButton>
                    <ShadcnButton variant="default" onClick={handleConfirm}>
                        <Check size={16} style={{ marginRight: 6 }} /> Confirmar Mover
                    </ShadcnButton>
                </Actions>
            </Content>
        </Overlay>
    );
};
