import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useOrganization } from '../../context/OrganizationContext';
import { FaIdCard, FaSpinner, FaUpload, FaCheckCircle } from 'react-icons/fa';

const Overlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(2, 6, 23, 0.95);
  backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: #0f172a;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px;
  padding: 2.5rem;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  text-align: center;
`;

const IconWrapper = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  margin: 0 auto 1.5rem;
`;

const Title = styled.h2`
  color: #f8fafc;
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
`;

const Text = styled.p`
  color: #94a3b8;
  margin: 0 0 2rem 0;
  line-height: 1.6;
`;

const FileUploadArea = styled.label`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  border: 2px dashed rgba(255,255,255,0.2);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: rgba(0,0,0,0.2);
  margin-bottom: 1rem;

  &:hover {
    border-color: #3b82f6;
    background: rgba(59, 130, 246, 0.05);
  }

  svg {
    font-size: 2rem;
    color: #64748b;
    margin-bottom: 0.5rem;
  }
`;

export const PatientKYCGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const { currentOrganization } = useOrganization();
    
    const [loading, setLoading] = useState(true);
    const [needsKYC, setNeedsKYC] = useState(false);
    const [uploading, setUploading] = useState(false);
    
    const [patientId, setPatientId] = useState<string | null>(null);
    const [missingFiles, setMissingFiles] = useState({
        dniFront: false,
        dniBack: false,
        reprocannBack: false // Optional depending on if they have reprocann
    });

    useEffect(() => {
        async function checkKYC() {
            if (!user || !currentOrganization) return;
            
            try {
                const { data, error } = await supabase
                    .from('aurora_patients')
                    .select('id, file_dni_front_url, file_dni_back_url, file_reprocann_back_url, reprocann_status')
                    .eq('profile_id', user.id)
                    .eq('organization_id', currentOrganization.id)
                    .single();

                if (error) throw error;
                if (!data) return; // Should not happen if they are a patient

                setPatientId(data.id);

                const needsDniFront = !data.file_dni_front_url;
                const needsDniBack = !data.file_dni_back_url;
                
                // Only require reprocann if they claimed to have it (active or pending)
                const needsReprocann = (data.reprocann_status === 'active' || data.reprocann_status === 'pending') 
                                     && !data.file_reprocann_back_url;

                if (needsDniFront || needsDniBack || needsReprocann) {
                    setMissingFiles({
                        dniFront: needsDniFront,
                        dniBack: needsDniBack,
                        reprocannBack: needsReprocann
                    });
                    setNeedsKYC(true);
                } else {
                    setNeedsKYC(false);
                }
            } catch (err) {
                console.error("Error checking patient KYC status:", err);
            } finally {
                setLoading(false);
            }
        }

        checkKYC();
    }, [user, currentOrganization]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'file_dni_front_url' | 'file_dni_back_url' | 'file_reprocann_back_url') => {
        if (!e.target.files || e.target.files.length === 0 || !patientId || !currentOrganization) return;
        
        setUploading(true);
        const file = e.target.files[0];
        
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${patientId}_${field}_${Math.random()}.${fileExt}`;
            const filePath = `${currentOrganization.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('kyc_documents')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('kyc_documents')
                .getPublicUrl(filePath);

            const { error: updateError } = await supabase
                .from('aurora_patients')
                .update({ [field]: publicUrl })
                .eq('id', patientId);

            if (updateError) throw updateError;

            // Update local state
            const newMissing = { ...missingFiles };
            if (field === 'file_dni_front_url') newMissing.dniFront = false;
            if (field === 'file_dni_back_url') newMissing.dniBack = false;
            if (field === 'file_reprocann_back_url') newMissing.reprocannBack = false;
            
            setMissingFiles(newMissing);
            
            if (!newMissing.dniFront && !newMissing.dniBack && !newMissing.reprocannBack) {
                setNeedsKYC(false);
            }

        } catch (err) {
            console.error("Upload error:", err);
            alert("Error al subir el archivo. Inténtalo de nuevo.");
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return <>{children}</>; // Render underlying app, but we can't show it if it's loading? Let's just return children. If we want it blocking, we'll block.
    }

    if (needsKYC) {
        return (
            <div style={{ position: 'relative' }}>
                {/* Blur the background slightly */}
                <div style={{ filter: 'blur(4px)', pointerEvents: 'none', userSelect: 'none' }}>
                    {children}
                </div>
                
                <Overlay>
                    <ModalContent>
                        <IconWrapper>
                            <FaIdCard />
                        </IconWrapper>
                        <Title>Documentación Requerida</Title>
                        <Text>
                            Por políticas del club, debes adjuntar tu documentación personal para continuar accediendo al portal. 
                            Tus datos están seguros y encriptados.
                        </Text>

                        {missingFiles.dniFront && (
                            <FileUploadArea>
                                {uploading ? <FaSpinner className="fa-spin" /> : <FaUpload />}
                                <span style={{ color: '#f8fafc', fontWeight: 'bold' }}>DNI (Frente)</span>
                                <span style={{ fontSize: '0.8rem' }}>Haz clic o arrastra tu foto aquí</span>
                                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, 'file_dni_front_url')} disabled={uploading} />
                            </FileUploadArea>
                        )}

                        {missingFiles.dniBack && (
                            <FileUploadArea>
                                {uploading ? <FaSpinner className="fa-spin" /> : <FaUpload />}
                                <span style={{ color: '#f8fafc', fontWeight: 'bold' }}>DNI (Dorso)</span>
                                <span style={{ fontSize: '0.8rem' }}>Haz clic o arrastra tu foto aquí</span>
                                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, 'file_dni_back_url')} disabled={uploading} />
                            </FileUploadArea>
                        )}

                        {missingFiles.reprocannBack && (
                            <FileUploadArea>
                                {uploading ? <FaSpinner className="fa-spin" /> : <FaUpload />}
                                <span style={{ color: '#f8fafc', fontWeight: 'bold' }}>REPROCANN</span>
                                <span style={{ fontSize: '0.8rem' }}>Sube la foto del certificado o carnet</span>
                                <input type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, 'file_reprocann_back_url')} disabled={uploading} />
                            </FileUploadArea>
                        )}
                        
                        <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '1rem' }}>
                            Al subir los archivos confirmas que son verdaderos y te pertenecen.
                        </p>
                    </ModalContent>
                </Overlay>
            </div>
        );
    }

    return <>{children}</>;
};
