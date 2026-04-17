import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import SignatureCanvas from 'react-signature-canvas';
import { FaEraser, FaCheck } from 'react-icons/fa';

interface SignaturePadProps {
    onSave: (signatureDataUrl: string) => void;
    onCancel?: () => void;
}

const PadContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
    align-items: center;
`;

const CanvasWrapper = styled.div`
    width: 100%;
    max-width: 400px; /* Mobile first */
    height: 200px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 12px;
    border: 2px dashed #4ade80; /* Green accent to encourage signing */
    overflow: hidden;
    position: relative;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);

    .sigCanvas {
        width: 100%;
        height: 100%;
    }
`;

const HelpText = styled.p`
    font-size: 0.875rem;
    color: #94a3b8;
    text-align: center;
    margin: 0;
    pointer-events: none;
`;

const ButtonRow = styled.div`
    display: flex;
    gap: 1rem;
    width: 100%;
    max-width: 400px;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.875rem;
    border: none;
    cursor: pointer;
    transition: all 0.2s;

    background: ${props => {
        if (props.$variant === 'primary') return '#10b981';
        if (props.$variant === 'danger') return 'rgba(239, 68, 68, 0.1)';
        return 'rgba(255, 255, 255, 0.05)';
    }};
    
    color: ${props => {
        if (props.$variant === 'primary') return '#ffffff';
        if (props.$variant === 'danger') return '#ef4444';
        return '#f8fafc';
    }};

    border: ${props => props.$variant === 'danger' ? '1px solid rgba(239,68,68,0.3)' : 'none'};

    &:hover {
        transform: translateY(-1px);
        filter: brightness(1.1);
    }
`;

export const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, onCancel }) => {
    const sigPadRef = useRef<any>(null);
    const [isEmpty, setIsEmpty] = useState(true);

    const clear = () => {
        sigPadRef.current?.clear();
        setIsEmpty(true);
    };

    const handleEnd = () => {
        setIsEmpty(sigPadRef.current?.isEmpty() ?? true);
    };

    const save = () => {
        if (!sigPadRef.current?.isEmpty()) {
            // Save as transparent PNG
            const dataUrl = sigPadRef.current?.getCanvas().toDataURL('image/png');
            onSave(dataUrl);
        }
    };

    return (
        <PadContainer>
            <HelpText>Dibuja tu firma con el dedo o el mouse en el recuadro blanco</HelpText>
            <CanvasWrapper>
                <SignatureCanvas
                    ref={sigPadRef}
                    penColor="black"
                    canvasProps={{ className: 'sigCanvas' }}
                    onEnd={handleEnd}
                />
            </CanvasWrapper>
            <ButtonRow>
                <ActionButton $variant="danger" onClick={clear} type="button">
                    <FaEraser /> Borrar
                </ActionButton>
                <ActionButton $variant="primary" onClick={save} disabled={isEmpty} type="button" style={{ opacity: isEmpty ? 0.5 : 1 }}>
                    <FaCheck /> Confirmar Firma
                </ActionButton>
            </ButtonRow>
        </PadContainer>
    );
};
