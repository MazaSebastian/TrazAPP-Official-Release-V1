import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useOrganization } from '../context/OrganizationContext';
import {
    FaSave, FaCheckCircle, FaSpinner, FaUpload, FaFilePdf, FaImage, FaTrash,
    FaFileContract, FaFileInvoice, FaUserShield, FaUsers, FaIdBadge, FaShieldAlt, FaBuilding, FaSeedling,
    FaUserCog, FaFileAlt
} from 'react-icons/fa';

const FormContainer = styled.div`
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  padding: 2rem;
  margin-top: 2rem;

  @media (max-width: 768px) {
    padding: 1.25rem;
  }
`;

const TabsContainer = styled.div`
  display: flex;
  margin-bottom: 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  overflow-x: auto;
  
  &::-webkit-scrollbar {
    height: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }
`;

const TabButton = styled.button<{ $active: boolean }>`
  background: transparent;
  border: none;
  padding: 1rem 1.5rem;
  color: ${p => p.$active ? '#3b82f6' : '#94a3b8'};
  font-weight: 600;
  font-size: 1.05rem;
  cursor: pointer;
  border-bottom: 2px solid ${p => p.$active ? '#3b82f6' : 'transparent'};
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;

  &:hover {
    color: ${p => p.$active ? '#3b82f6' : '#f8fafc'};
  }
`;

const FormSection = styled.div`
  margin-bottom: 2.5rem;
  animation: fadeIn 0.3s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(5px); }
    to { opacity: 1; transform: translateY(0); }
  }

  h3 {
    font-size: 1.25rem;
    color: #f8fafc;
    margin-bottom: 1.5rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
`;

const InputGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  label {
    font-size: 0.85rem;
    color: #94a3b8;
    font-weight: 600;
  }

  input, select {
    padding: 0.75rem 1rem;
    background: rgba(30, 41, 59, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.5rem;
    color: #f8fafc;
    font-size: 0.95rem;
    transition: border-color 0.2s;

    &:focus {
      outline: none;
      border-color: #3b82f6;
    }
    
    &:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
  }
`;

const SubmitButton = styled.button<{ $loading?: boolean }>`
  background: #3b82f6;
  color: white;
  padding: 0.875rem 2rem;
  border-radius: 0.5rem;
  border: none;
  font-weight: 600;
  font-size: 1rem;
  cursor: ${p => p.$loading ? 'not-allowed' : 'pointer'};
  opacity: ${p => p.$loading ? 0.7 : 1};
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.2s;
  margin-top: 2rem;
  width: 100%;
  justify-content: center;

  @media (min-width: 768px) {
    width: auto;
  }

  &:hover:not(:disabled) {
    background: #2563eb;
    transform: translateY(-2px);
    box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);
  }
`;

const ChecklistGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
`;

const ChecklistItem = styled.div<{ $uploaded: boolean }>`
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid ${p => p.$uploaded ? 'rgba(34, 197, 94, 0.4)' : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 0.75rem;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;

  &::after {
     content: '';
     position: absolute;
     top: 0; left: 0; bottom: 0; 
     width: 4px;
     background: ${p => p.$uploaded ? '#4ade80' : 'transparent'};
  }
`;

const ChecklistHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #f8fafc;
  font-weight: 600;
  
  svg {
    color: #64748b;
    font-size: 1.25rem;
  }
  
  .status {
     margin-left: auto;
     color: #4ade80;
     font-size: 1.25rem;
  }
`;

const UploadAction = styled.label`
   display: flex;
   align-items: center;
   justify-content: center;
   gap: 0.5rem;
   background: rgba(59, 130, 246, 0.1);
   border: 1px dashed rgba(59, 130, 246, 0.5);
   padding: 0.75rem;
   border-radius: 0.5rem;
   color: #60a5fa;
   cursor: pointer;
   font-size: 0.9rem;
   font-weight: 600;
   transition: all 0.2s;

   &:hover {
      background: rgba(59, 130, 246, 0.2);
   }
`;

const FileItemLite = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  background: rgba(15, 23, 42, 0.8);
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.05);

  .file-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #e2e8f0;
    font-size: 0.85rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  button {
    background: none;
    border: none;
    color: #ef4444;
    cursor: pointer;
    padding: 0.25rem;
    flex-shrink: 0;
    
    &:hover { color: #dc2626; }
  }
`;

const Notice = styled.div`
  background: rgba(59, 130, 246, 0.1);
  border-left: 4px solid #3b82f6;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 2rem;
  color: #bfdbfe;
  font-size: 0.95rem;
  line-height: 1.5;
`;

const REQUIRED_DOCUMENTS = [
    { id: 'estatuto', label: 'Estatuto Social', icon: <FaFileContract /> },
    { id: 'cuit', label: 'Constancia de CUIT', icon: <FaFileInvoice /> },
    { id: 'antecedentes', label: 'Antecedentes Penales', icon: <FaUserShield /> },
    { id: 'autoridades', label: 'Designación de Autoridades', icon: <FaUsers /> },
    { id: 'perfiles', label: 'Perfiles Comisión Directiva', icon: <FaIdBadge /> },
    { id: 'seguro', label: 'Póliza de Seguro', icon: <FaShieldAlt /> },
    { id: 'habilitacion', label: 'Habilitación Municipal', icon: <FaBuilding /> },
    { id: 'cultivo', label: 'Plan de Cultivo', icon: <FaSeedling /> },
];

export const KYCForm: React.FC = () => {
    const { user } = useAuth();
    const { currentOrganization } = useOrganization();

    const [activeTab, setActiveTab] = useState<'general' | 'legal'>('general');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    // Profile Data
    const [profileData, setProfileData] = useState({
        document_number: '',
        cuil: '',
        phone_mobile: '',
        phone_landline: '',
        gender: '',
    });

    // Org Data
    const [orgData, setOrgData] = useState({
        company_cuit: '',
        company_legal_name: '',
        company_email: '',
        address_street: '',
        address_number: '',
        address_city: '',
        address_state: '',
        address_country: '',
        address_zip: '',
    });

    // Documents Array (for UI)
    const [documents, setDocuments] = useState<{ type?: string, name: string, path: string }[]>([]);

    useEffect(() => {
        fetchData();
    }, [user, currentOrganization]);

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);

        try {
            // 1. Fetch Profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('document_number, cuil, phone_mobile, phone_landline, gender')
                .eq('id', user.id)
                .single();

            if (profile) {
                setProfileData({
                    document_number: profile.document_number || '',
                    cuil: profile.cuil || '',
                    phone_mobile: profile.phone_mobile || '',
                    phone_landline: profile.phone_landline || '',
                    gender: profile.gender || '',
                });
            }

            // 2. Fetch Org
            if (currentOrganization) {
                const { data: org } = await supabase
                    .from('organizations')
                    .select('*')
                    .eq('id', currentOrganization.id)
                    .single();

                if (org) {
                    setOrgData({
                        company_cuit: org.company_cuit || '',
                        company_legal_name: org.company_legal_name || '',
                        company_email: org.company_email || '',
                        address_street: org.address_street || '',
                        address_number: org.address_number || '',
                        address_city: org.address_city || '',
                        address_state: org.address_state || '',
                        address_country: org.address_country || 'Argentina',
                        address_zip: org.address_zip || '',
                    });

                    if (Array.isArray(org.legal_documents)) {
                        setDocuments(org.legal_documents);
                    } else {
                        setDocuments([]);
                    }
                }
            }
        } catch (e) {
            console.error('Error fetching KYC data', e);
        } finally {
            setLoading(false);
        }
    };

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setProfileData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleOrgChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setOrgData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
        if (!e.target.files || e.target.files.length === 0 || !user || !currentOrganization) return;

        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${docType}_${Math.random()}.${fileExt}`;
        // Path structure: org_id/file_name
        const filePath = `${currentOrganization.id}/${fileName}`;

        setLoading(true);
        try {
            const { error: uploadError } = await supabase.storage
                .from('kyc_documents')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const docsArray = Array.isArray(documents) ? documents : [];
            const existingDoc = docsArray.find(d => d.type === docType);
            if (existingDoc) {
                await supabase.storage.from('kyc_documents').remove([existingDoc.path]).catch(() => { });
            }

            const filteredDocs = docsArray.filter(d => d.type !== docType);
            const newDocs = [...filteredDocs, { type: docType, name: file.name, path: filePath }];
            setDocuments(newDocs);

            // Immediately save to org record
            await supabase.from('organizations')
                .update({ legal_documents: newDocs })
                .eq('id', currentOrganization.id);

        } catch (e) {
            console.error('Upload failed', e);
            alert('Error subiendo archivo');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveFile = async (path: string) => {
        if (!currentOrganization) return;

        try {
            await supabase.storage.from('kyc_documents').remove([path]);
            const docsArray = Array.isArray(documents) ? documents : [];
            const newDocs = docsArray.filter(d => d.path !== path);
            setDocuments(newDocs);

            await supabase.from('organizations')
                .update({ legal_documents: newDocs })
                .eq('id', currentOrganization.id);
        } catch (e) {
            console.error('Delete failed', e);
        }
    };

    const validateForm = () => {
        // Basic validation
        if (!profileData.document_number || !profileData.cuil || !profileData.phone_mobile) {
            alert('Por favor complete todos los datos personales obligatorios (*)');
            setActiveTab('general');
            return false;
        }
        if (!orgData.company_cuit || !orgData.company_legal_name || !orgData.address_street) {
            alert('Por favor complete todos los datos de la empresa obligatorios (*)');
            setActiveTab('general');
            return false;
        }

        // Validate all required documents are uploaded (match by type)
        const docsArray = Array.isArray(documents) ? documents : [];
        const uploadedTypes = docsArray.map(d => d.type);
        const missingDocs = REQUIRED_DOCUMENTS.filter(req => !uploadedTypes.includes(req.id));

        if (missingDocs.length > 0) {
            alert(`Falta documentación legal requerida. Asegúrese de subir: \n- ${missingDocs.map(d => d.label).join('\n- ')}`);
            setActiveTab('legal');
            return false;
        }

        return true;
    };

    const handleSave = async () => {
        if (!user || !currentOrganization) return;
        if (!validateForm()) return;

        setSaving(true);
        setSuccess(false);

        try {
            // 1. Update Profile (mark as completed)
            const { error: profError } = await supabase
                .from('profiles')
                .update({
                    ...profileData,
                    kyc_completed: true
                })
                .eq('id', user.id);

            if (profError) throw profError;

            // 2. Update Org
            const { error: orgError } = await supabase
                .from('organizations')
                .update({
                    ...orgData,
                    legal_documents: documents
                })
                .eq('id', currentOrganization.id);

            if (orgError) throw orgError;

            setSuccess(true);
            // Force reload to update context and UI
            setTimeout(() => {
                window.location.reload();
            }, 1000);

        } catch (e) {
            console.error('Save failed', e);
            alert('Error al guardar los datos');
        } finally {
            setSaving(false);
        }
    };

    if (loading && !profileData.document_number) return <div>Cargando datos...</div>;

    return (
        <FormContainer>
            <Notice>
                <strong>¡Atención!</strong> Debes completar toda la información requerida en ambas secciones para continuar utilizando TrazAPP sin interrupciones.
                Tus datos están protegidos y son confidenciales.
            </Notice>

            <TabsContainer>
                <TabButton
                    $active={activeTab === 'general'}
                    onClick={() => setActiveTab('general')}
                >
                    <FaUserCog /> Información General
                </TabButton>
                <TabButton
                    $active={activeTab === 'legal'}
                    onClick={() => setActiveTab('legal')}
                >
                    <FaFileAlt /> Documentación Legal
                </TabButton>
            </TabsContainer>

            {activeTab === 'general' && (
                <div className="tab-content" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                    <FormSection>
                        <h3>Datos del Apoderado/Responsable</h3>
                        <InputGroup>
                            <Field>
                                <label>DNI / Documento *</label>
                                <input name="document_number" value={profileData.document_number} onChange={handleProfileChange} placeholder="11222333" />
                            </Field>
                            <Field>
                                <label>CUIL / CUIT Personal *</label>
                                <input name="cuil" value={profileData.cuil} onChange={handleProfileChange} placeholder="20-11222333-4" />
                            </Field>
                            <Field>
                                <label>Género</label>
                                <select name="gender" value={profileData.gender} onChange={handleProfileChange}>
                                    <option value="">Seleccione...</option>
                                    <option value="male">Masculino</option>
                                    <option value="female">Femenino</option>
                                    <option value="other">Otro / Prefiero no decirlo</option>
                                </select>
                            </Field>
                        </InputGroup>
                        <InputGroup>
                            <Field>
                                <label>Teléfono Celular *</label>
                                <input name="phone_mobile" value={profileData.phone_mobile} onChange={handleProfileChange} placeholder="+54 9 11 1234-5678" />
                            </Field>
                            <Field>
                                <label>Teléfono Fijo (Opcional)</label>
                                <input name="phone_landline" value={profileData.phone_landline} onChange={handleProfileChange} />
                            </Field>
                        </InputGroup>
                    </FormSection>

                    <FormSection>
                        <h3>Datos de la Empresa / Organización</h3>
                        <InputGroup>
                            <Field>
                                <label>Razón Social / Nombre Legal *</label>
                                <input name="company_legal_name" value={orgData.company_legal_name} onChange={handleOrgChange} />
                            </Field>
                            <Field>
                                <label>CUIT de Empresa *</label>
                                <input name="company_cuit" value={orgData.company_cuit} onChange={handleOrgChange} />
                            </Field>
                            <Field>
                                <label>Email de Contacto Empresarial *</label>
                                <input type="email" name="company_email" value={orgData.company_email} onChange={handleOrgChange} />
                            </Field>
                        </InputGroup>

                        <h4 style={{ color: '#cbd5e1', fontSize: '1rem', marginTop: '1rem', marginBottom: '1rem' }}>Domicilio Legal</h4>
                        <InputGroup>
                            <Field>
                                <label>Calle *</label>
                                <input name="address_street" value={orgData.address_street} onChange={handleOrgChange} />
                            </Field>
                            <Field>
                                <label>Número / Piso / Depto *</label>
                                <input name="address_number" value={orgData.address_number} onChange={handleOrgChange} />
                            </Field>
                        </InputGroup>
                        <InputGroup>
                            <Field>
                                <label>Ciudad *</label>
                                <input name="address_city" value={orgData.address_city} onChange={handleOrgChange} />
                            </Field>
                            <Field>
                                <label>Provincia / Estado *</label>
                                <input name="address_state" value={orgData.address_state} onChange={handleOrgChange} />
                            </Field>
                            <Field>
                                <label>Código Postal</label>
                                <input name="address_zip" value={orgData.address_zip} onChange={handleOrgChange} />
                            </Field>
                        </InputGroup>
                    </FormSection>
                </div>
            )}

            {activeTab === 'legal' && (
                <div className="tab-content" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                    <FormSection>
                        <h3>Archivos Requeridos</h3>
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                            Por favor, adjunta los archivos solicitados en formato PDF, JPG o PNG. Debes completar esta lista para que tu perfil sea aprobado. (Máximo 5MB por archivo).
                        </p>

                        <ChecklistGrid>
                            {REQUIRED_DOCUMENTS.map(docReq => {
                                const docsArray = Array.isArray(documents) ? documents : [];
                                const uploadedDoc = docsArray.find(d => d.type === docReq.id);

                                return (
                                    <ChecklistItem key={docReq.id} $uploaded={!!uploadedDoc}>
                                        <ChecklistHeader>
                                            {docReq.icon}
                                            <span style={{ fontSize: '0.95rem' }}>{docReq.label}</span>
                                            {uploadedDoc && <FaCheckCircle className="status" />}
                                        </ChecklistHeader>

                                        {uploadedDoc ? (
                                            <FileItemLite>
                                                <div className="file-info" title={uploadedDoc.name}>
                                                    {uploadedDoc.name.endsWith('.pdf') ? <FaFilePdf style={{ color: '#ef4444' }} /> : <FaImage style={{ color: '#3b82f6' }} />}
                                                    {uploadedDoc.name}
                                                </div>
                                                <button type="button" onClick={() => handleRemoveFile(uploadedDoc.path)} title="Eliminar archivo">
                                                    <FaTrash />
                                                </button>
                                            </FileItemLite>
                                        ) : (
                                            <UploadAction>
                                                {loading ? <FaSpinner className="fa-spin" /> : <FaUpload />} Subir {docReq.label.split(' ')[0]}
                                                <input
                                                    type="file"
                                                    style={{ display: 'none' }}
                                                    onChange={(e) => handleFileUpload(e, docReq.id)}
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                    disabled={loading}
                                                />
                                            </UploadAction>
                                        )}
                                    </ChecklistItem>
                                );
                            })}
                        </ChecklistGrid>
                    </FormSection>
                </div>
            )}

            <SubmitButton onClick={handleSave} disabled={saving || loading}>
                {saving ? <FaSpinner className="fa-spin" /> : <FaSave />}
                {saving ? 'Guardando y Verificando...' : 'Completar y Guardar Perfil'}
            </SubmitButton>

            {success && (
                <div style={{ marginTop: '1rem', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FaCheckCircle /> Perfil completado exitosamente. Recargando...
                </div>
            )}

        </FormContainer>
    );
};

