import React, { useState, useCallback } from 'react';
import Cropper, { Point, Area } from 'react-easy-crop';
import styled from 'styled-components';
import { FaCheck, FaTimes, FaSearchPlus, FaSearchMinus } from 'react-icons/fa';
import getCroppedImg from '../utils/cropImage';

const Overlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(0,0,0,0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 1rem;
`;

const ModalContainer = styled.div`
  background: rgba(30, 41, 59, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  width: 100%;
  max-width: 600px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
`;

const Header = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(15, 23, 42, 0.5);
  
  h3 {
    margin: 0;
    color: #f8fafc;
    font-size: 1.25rem;
  }
`;

const CropArea = styled.div`
  position: relative;
  width: 100%;
  height: 400px;
  background: #0f172a;
`;

const ControlsContainer = styled.div`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: rgba(15, 23, 42, 0.5);
`;

const ZoomControls = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  color: #94a3b8;

  input[type="range"] {
    flex: 1;
    accent-color: var(--primary-color, #10b981);
  }
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  
  background: ${props => props.$variant === 'primary' ? 'var(--primary-color, #10b981)' : 'transparent'};
  color: ${props => props.$variant === 'primary' ? '#fff' : '#cbd5e1'};
  border: ${props => props.$variant === 'primary' ? 'none' : '1px solid rgba(255,255,255,0.2)'};

  &:hover {
    transform: translateY(-1px);
    background: ${props => props.$variant === 'primary' ? 'var(--secondary-color, #059669)' : 'rgba(255,255,255,0.05)'};
  }
`;

interface ImageCropperModalProps {
    imageSrc: string;
    onCropComplete: (croppedFile: File) => void;
    onClose: () => void;
    aspectRatio?: number; // E.g., 1 for square, 16/9 for landscape
    shape?: 'rect' | 'round';
}

export function ImageCropperModal({ imageSrc, onCropComplete, onClose, aspectRatio = 1, shape = 'rect' }: ImageCropperModalProps) {
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const onCropChange = useCallback((location: Point) => {
        setCrop(location);
    }, []);

    const onZoomChange = useCallback((newZoom: number) => {
        setZoom(newZoom);
    }, []);

    const onCropCompleteHandler = useCallback(
        (croppedArea: Area, croppedAreaPixelsOutput: Area) => {
            setCroppedAreaPixels(croppedAreaPixelsOutput);
        },
        []
    );

    const generateCroppedImage = async () => {
        if (!croppedAreaPixels) return;
        setIsProcessing(true);
        try {
            const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
            if (croppedBlob) {
                const file = new File([croppedBlob], 'cropped-image.png', { type: 'image/png' });
                onCropComplete(file);
            }
        } catch (e) {
            console.error(e);
            alert("Error al procesar la imagen");
        } finally {
            setIsProcessing(false);
            onClose();
        }
    };

    return (
        <Overlay>
            <ModalContainer>
                <Header>
                    <h3>Ajustar Imagen</h3>
                    <p style={{ margin: '0.25rem 0 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>Escale y enfoque la parte principal de la imagen.</p>
                </Header>
                <CropArea>
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={aspectRatio}
                        cropShape={shape}
                        onCropChange={onCropChange}
                        onCropComplete={onCropCompleteHandler}
                        onZoomChange={onZoomChange}
                        style={{
                            containerStyle: { backgroundColor: '#0f172a' }
                        }}
                    />
                </CropArea>
                <ControlsContainer>
                    <ZoomControls>
                        <FaSearchMinus />
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            aria-labelledby="Zoom"
                            onChange={(e) => {
                                setZoom(Number(e.target.value))
                            }}
                        />
                        <FaSearchPlus />
                    </ZoomControls>

                    <Actions>
                        <ActionButton type="button" $variant="secondary" onClick={onClose} disabled={isProcessing}>
                            <FaTimes /> Cancelar
                        </ActionButton>
                        <ActionButton type="button" $variant="primary" onClick={generateCroppedImage} disabled={isProcessing}>
                            <FaCheck /> {isProcessing ? 'Procesando...' : 'Aplicar'}
                        </ActionButton>
                    </Actions>
                </ControlsContainer>
            </ModalContainer>
        </Overlay>
    );
}
