import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { supabase } from '../services/supabaseClient';
import { FaFileSignature, FaUpload, FaSpinner, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { ToastModal } from './ToastModal';

const SignatureCard = styled.div`
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  padding: 2rem;
  margin-top: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`;

const SignatureHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  
  h3 {
    margin: 0;
    font-size: 1.25rem;
    color: #f8fafc;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  svg {
    color: #4ade80;
  }
`;

const AlertBanner = styled.div<{ $isSuccess?: boolean }>`
  background: ${p => p.$isSuccess ? 'rgba(74, 222, 128, 0.1)' : 'rgba(239, 68, 68, 0.1)'};
  border: 1px solid ${p => p.$isSuccess ? 'rgba(74, 222, 128, 0.2)' : 'rgba(239, 68, 68, 0.2)'};
  color: ${p => p.$isSuccess ? '#4ade80' : '#fca5a5'};
  padding: 1rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
`;

const UploadZone = styled.div`
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: 1rem;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  background: rgba(30, 41, 59, 0.3);
  position: relative;
  overflow: hidden;

  &:hover {
    border-color: #4ade80;
    background: rgba(74, 222, 128, 0.05);
  }

  p {
    color: #94a3b8;
    margin-top: 1rem;
    text-align: center;
    font-size: 0.9rem;
  }
`;

const PreviewImageContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 400px;
  background: white; /* Important to see signatures with transparent bg clearly */
  padding: 1rem;
  border-radius: 0.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 1rem;

  img {
    max-width: 100%;
    max-height: 150px;
    object-fit: contain;
  }
`;

const UploadButton = styled.button`
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    background: #2563eb;
    transform: translateY(-2px);
  }

  &:disabled {
    background: #475569;
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

const DeleteButton = styled.button`
  background: rgba(239, 68, 68, 0.1);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 1rem;
  
  &:hover:not(:disabled) {
    background: rgba(239, 68, 68, 0.2);
  }
`;

interface ProfessionalSignatureProps {
    userId: string;
    currentSignatureUrl?: string;
    onSignatureUpdate: (newUrl: string | null) => void;
}

export const ProfessionalSignature: React.FC<ProfessionalSignatureProps> = ({
    userId,
    currentSignatureUrl,
    onSignatureUpdate
}) => {
    const [isUploading, setIsUploading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [toastOpen, setToastOpen] = useState(false);
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load preview directly if exists
    useEffect(() => {
        if (currentSignatureUrl) {
            setPreviewUrl(currentSignatureUrl);
        } else {
            setPreviewUrl(null);
        }
    }, [currentSignatureUrl]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];

            // Validate file type
            if (!file.type.includes('image/png') && !file.type.includes('image/jpeg')) {
                Swal.fire({
                    title: 'Formato Inválido',
                    text: 'Solo se admiten archivos PNG o JPEG.',
                    icon: 'error',
                    background: 'rgba(30, 41, 59, 0.95)',
                    color: '#f8fafc',
                    confirmButtonColor: '#3b82f6',
                    customClass: { popup: 'glass-modal border border-white/10 rounded-xl' }
                });
                return;
            }

            // Validate size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                Swal.fire({
                    title: 'Archivo muy grande',
                    text: 'La imagen no debe superar los 2MB.',
                    icon: 'warning',
                    background: 'rgba(30, 41, 59, 0.95)',
                    color: '#f8fafc',
                    confirmButtonColor: '#3b82f6',
                    customClass: { popup: 'glass-modal border border-white/10 rounded-xl' }
                });
                return;
            }

            setPendingFile(file);
            const objUrl = URL.createObjectURL(file);
            setPreviewUrl(objUrl);
        }
    };

    const clearPending = () => {
        setPendingFile(null);
        if (!currentSignatureUrl) {
            setPreviewUrl(null);
        } else {
            setPreviewUrl(currentSignatureUrl);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const uploadSignature = async () => {
        if (!pendingFile || !userId) return;
        setIsUploading(true);

        try {
            const fileExt = pendingFile.name.split('.').pop();
            const fileName = `${userId}_signature_${Date.now()}.${fileExt}`;

            // 1. Upload to storage
            const { error: uploadError } = await supabase.storage
                .from('signatures')
                .upload(fileName, pendingFile, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: publicData } = supabase.storage
                .from('signatures')
                .getPublicUrl(fileName);

            const publicUrl = publicData.publicUrl;

            // 3. Update Profiles Table
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ professional_signature_url: publicUrl })
                .eq('id', userId);

            if (updateError) throw updateError;

            setPendingFile(null);
            setUploadedUrl(publicUrl);
            setToastOpen(true);

        } catch (err: any) {
            console.error('Error uploading signature FULL OBJ:', JSON.stringify(err, null, 2));
            console.error('Error message:', err?.message || err?.error_description);
            console.error('Error details:', err?.details);
            console.error('Error hint:', err?.hint);
            console.error('Error code:', err?.code);
            console.error('Raw error:', err);

            Swal.fire({
                title: 'Error',
                text: `Hubo un error al subir la firma: ${err?.message || 'Error desconocido'}. Revisa la consola para más detalles.`,
                icon: 'error',
                background: 'rgba(30, 41, 59, 0.95)',
                color: '#f8fafc',
                confirmButtonColor: '#ef4444',
                customClass: { popup: 'glass-modal border border-white/10 rounded-xl' }
            });
        } finally {
            setIsUploading(false);
        }
    };

    const deleteSignature = async () => {
        if (!currentSignatureUrl || !userId) return;

        // Extract file name from the URL
        const parts = currentSignatureUrl.split('/');
        const fileName = parts[parts.length - 1];

        setIsDeleting(true);
        try {
            // 1. Remove from bucket
            const { error: deleteError } = await supabase.storage
                .from('signatures')
                .remove([fileName]);

            if (deleteError) {
                console.warn('Could not delete old signature from bucket', deleteError);
                // Continue anyway to clear the profile
            }

            // 2. Clear from profile
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ professional_signature_url: null })
                .eq('id', userId);

            if (updateError) throw updateError;

            Swal.fire({
                title: 'Firma Eliminada',
                text: 'Se ha removido tu firma profesional del sistema.',
                icon: 'info',
                background: 'rgba(30, 41, 59, 0.95)',
                color: '#f8fafc',
                confirmButtonColor: '#3b82f6',
                customClass: { popup: 'glass-modal border border-white/10 rounded-xl' }
            });
            setPreviewUrl(null);
            setPendingFile(null);
            onSignatureUpdate(null);

        } catch (err: any) {
            console.error('Error deleting signature:', err);
            Swal.fire({
                title: 'Error',
                text: 'No se pudo eliminar la firma. Verifica tu conexión.',
                icon: 'error',
                background: 'rgba(30, 41, 59, 0.95)',
                color: '#f8fafc',
                confirmButtonColor: '#ef4444',
                customClass: { popup: 'glass-modal border border-white/10 rounded-xl' }
            });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <SignatureCard>
            <SignatureHeader>
                <FaFileSignature />
                <h3>Firma del Profesional</h3>
            </SignatureHeader>

            {!currentSignatureUrl && !pendingFile && (
                <AlertBanner $isSuccess={false}>
                    <FaExclamationTriangle />
                    <span>
                        <b>Atención:</b> Debes cargar tu firma para poder realizar evoluciones a pacientes. Recomendamos un archivo con fondo blanco o transparente.
                    </span>
                </AlertBanner>
            )}

            {currentSignatureUrl && !pendingFile && (
                <AlertBanner $isSuccess={true}>
                    <FaCheck />
                    <span>
                        Tu firma se encuentra registrada y validada.
                    </span>
                </AlertBanner>
            )}

            {(previewUrl || pendingFile) ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <PreviewImageContainer>
                        <img src={previewUrl as string} alt="Firma Profesional" />
                    </PreviewImageContainer>

                    {pendingFile ? (
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <UploadButton onClick={uploadSignature} disabled={isUploading}>
                                {isUploading ? <FaSpinner className="fa-spin" /> : <FaUpload />}
                                {isUploading ? 'Subiendo...' : 'Confirmar Subida'}
                            </UploadButton>
                            <button
                                onClick={clearPending}
                                disabled={isUploading}
                                style={{
                                    background: 'transparent',
                                    color: '#94a3b8',
                                    border: '1px solid #475569',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '0.5rem',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancelar
                            </button>
                        </div>
                    ) : (
                        <DeleteButton onClick={deleteSignature} disabled={isDeleting}>
                            {isDeleting ? 'Eliminando...' : 'Eliminar Firma Actual'}
                        </DeleteButton>
                    )}
                </div>
            ) : (
                <>
                    <input
                        type="file"
                        accept="image/png, image/jpeg"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                    />
                    <UploadZone onClick={() => fileInputRef.current?.click()}>
                        <FaUpload style={{ fontSize: '2rem', color: '#64748b' }} />
                        <p>
                            Haz click aquí para seleccionar la imagen de tu firma.<br />
                            (Máx. 2MB. Formatos: PNG, JPG)
                        </p>
                    </UploadZone>
                </>
            )}

            <ToastModal
                isOpen={toastOpen}
                message="Firma cargada correctamente!"
                type="success"
                onClose={() => {
                    setToastOpen(false);
                    if (uploadedUrl) {
                        onSignatureUpdate(uploadedUrl);
                    }
                }}
            />
        </SignatureCard>
    );
};
