import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { patientsService, Patient } from '../services/patientsService';
import { usersService } from '../services/usersService';
import { useNavigate } from 'react-router-dom';

import { ConfirmModal } from '../components/ConfirmModal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ToastModal } from '../components/ToastModal';
import { FaUserPlus, FaIdCard, FaCheckCircle, FaFileAlt, FaNotesMedical, FaWhatsapp, FaFileImport, FaPen } from 'react-icons/fa';
import { CustomSelect } from '../components/CustomSelect';
import { CustomDatePicker } from '../components/CustomDatePicker';
import { useOrganization } from '../context/OrganizationContext';
import UpgradeOverlay from '../components/common/UpgradeOverlay';
import { ImportPatientsModal, ParsedPatient } from '../components/ImportPatientsModal';
import { InvitePatientModal } from '../components/Patients/InvitePatientModal';
import { supabase } from '../services/supabaseClient';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(20px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

const slideDown = keyframes`
  from { opacity: 1; transform: translateY(0) scale(1); }
  to { opacity: 0; transform: translateY(20px) scale(0.95); }
`;

const PageContainer = styled.div`
  padding: 1rem;
  padding-top: 1.5rem;
  max-width: 1400px; 
  margin: 0 auto;
  min-height: 100vh;
  color: #f8fafc;
  box-sizing: border-box;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
`;

const Title = styled.h1`
  font-size: 1.8rem;
  color: #f8fafc;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  @media (max-width: 768px) {
    justify-content: center;
    text-align: center;
  }
`;

const ActionButton = styled.button`
  background: rgba(var(--primary-color-rgb, 168, 85, 247), 0.2);
  color: #d8b4fe;
  border: 1px solid rgba(var(--primary-color-rgb, 168, 85, 247), 0.5);
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  backdrop-filter: blur(8px);
  justify-content: center;

  &:hover {
    background: rgba(var(--primary-color-rgb, 168, 85, 247), 0.3);
    transform: translateY(-1px);
    box-shadow: 0 4px 6px rgba(0,0,0,0.2);
  }

  &:disabled {
      background: rgba(100, 116, 139, 0.2);
      color: #94a3b8;
      border-color: rgba(100, 116, 139, 0.5);
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
  }
`;

const TabContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 0.5rem;
`;

const TabButton = styled.button<{ $active?: boolean }>`
  background: transparent;
  border: none;
  color: ${props => props.$active ? '#f8fafc' : '#64748b'};
  font-weight: 600;
  font-size: 1rem;
  padding: 0.5rem 1rem;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;

  &:hover {
    color: #e2e8f0;
  }

  &::after {
    content: '';
    position: absolute;
    bottom: -0.6rem;
    left: 0;
    right: 0;
    height: 2px;
    background: ${props => props.$active ? '#3b82f6' : 'transparent'};
    transition: all 0.2s;
  }
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const PatientCard = styled.div`
  background: rgba(30, 41, 59, 0.6);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
  transition: all 0.3s;
  cursor: pointer;
  backdrop-filter: blur(12px);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
    border-color: rgba(var(--primary-color-rgb, 168, 85, 247), 0.3);
  }

  .desktop-content {
    display: block;
    @media (max-width: 768px) {
      display: none;
    }
  }

  .mobile-content {
    display: none;
    @media (max-width: 768px) {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }
    
    .m-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
      font-size: 0.9rem;
    }

    .m-name {
      font-weight: 700;
      color: #f8fafc;
    }
    
    .m-dni {
      color: #94a3b8;
    }
  }

  @media (max-width: 768px) {
    padding: 0.75rem 1rem;
    border-radius: 0.75rem;
  }
`;

const StatusBadge = styled.span<{ status: string }>`
  background: ${props =>
        props.status === 'active' ? 'rgba(74, 222, 128, 0.2)' :
            props.status === 'expired' ? 'rgba(239, 68, 68, 0.2)' :
                props.status === 'pending' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(148, 163, 184, 0.2)'};
  color: ${props =>
        props.status === 'active' ? '#4ade80' :
            props.status === 'expired' ? '#f87171' :
                props.status === 'pending' ? '#facc15' : '#cbd5e1'};
  border: 1px solid ${props =>
        props.status === 'active' ? 'rgba(74, 222, 128, 0.5)' :
            props.status === 'expired' ? 'rgba(239, 68, 68, 0.5)' :
                props.status === 'pending' ? 'rgba(234, 179, 8, 0.5)' : 'rgba(148, 163, 184, 0.5)'};
  padding: 0.25rem 0.5rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: bold;
  text-transform: uppercase;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 1.5rem;
  background: rgba(30, 41, 59, 0.5);
  color: #f8fafc;
  backdrop-filter: blur(8px);
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: rgba(var(--primary-color-rgb, 168, 85, 247), 0.5);
    box-shadow: 0 0 0 3px rgba(var(--primary-color-rgb, 168, 85, 247), 0.1);
  }

  &::placeholder {
    color: #64748b;
  }
`;

// Modal Styles
const Modal = styled.div<{ isOpen: boolean; $isClosing?: boolean }>`
  display: ${props => props.isOpen ? 'flex' : 'none'};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1rem;
  backdrop-filter: blur(4px);
  animation: ${props => props.$isClosing ? fadeOut : fadeIn} 0.3s ease-out forwards;
`;

const ModalContent = styled.div<{ $isClosing?: boolean }>`
  background: rgba(15, 23, 42, 0.95);
  padding: 2rem;
  border-radius: 1rem;
  width: 100%;
  max-width: 800px; /* Wider for full form */
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);
  backdrop-filter: blur(16px);
  color: #f8fafc;
  animation: ${props => props.$isClosing ? slideDown : slideUp} 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #94a3b8;
    font-size: 0.9rem;
  }
  
  input, select, textarea {
    width: 100%;
    padding: 0.6rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.375rem;
    font-size: 0.95rem;
    background: rgba(30, 41, 59, 0.5);
    color: #f8fafc;

    &:focus {
      outline: none;
      border-color: rgba(var(--primary-color-rgb, 168, 85, 247), 0.5);
      box-shadow: 0 0 0 3px rgba(var(--primary-color-rgb, 168, 85, 247), 0.1);
    }
    
    &::placeholder {
      color: #64748b;
    }
  }
`;

const FormRow = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;

    @media (max-width: 600px) {
        grid-template-columns: 1fr;
    }
`;

const ModalGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`;

const SectionHeader = styled.h3`
    font-size: 1.1rem;
    color: #f8fafc;
    margin-top: 1.5rem;
    margin-bottom: 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding-bottom: 0.5rem;
`;

const FileUploadBox = styled.div`
    border: 2px dashed rgba(255, 255, 255, 0.2);
    border-radius: 0.5rem;
    padding: 1.5rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    background: rgba(30, 41, 59, 0.5);

    &:hover {
        border-color: rgba(var(--primary-color-rgb, 168, 85, 247), 0.5);
        background: rgba(var(--primary-color-rgb, 168, 85, 247), 0.1);
    }

    input {
        display: none;
    }
`;

const Patients: React.FC = () => {
    const navigate = useNavigate();
    const { currentOrganization } = useOrganization();
    const plan = currentOrganization?.plan || 'individual';
    const planLevel = ['trazapp', 'demo'].includes(plan) ? 4 :
        ['ong', 'enterprise'].includes(plan) ? 3 :
            ['equipo', 'pro'].includes(plan) ? 2 : 1;

    const [patients, setPatients] = useState<Patient[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal States
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isClosingAdd, setIsClosingAdd] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isClosingEdit, setIsClosingEdit] = useState(false);

    // Edit Patient State
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [editingPatientId, setEditingPatientId] = useState<string | null>(null);

    // Tab and Invite States
    const [activeTab, setActiveTab] = useState<'active' | 'waiting'>('active');
    const [isInviteOpen, setIsInviteOpen] = useState(false);

    // Confirm Modal State
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        isDanger: false
    });

    // Toast State
    const [toastOpen, setToastOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

    // Import Modal State
    const [isImportOpen, setIsImportOpen] = useState(false);

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToastMessage(message);
        setToastType(type);
        setToastOpen(true);
    };

    // Form Data


    const [regForm, setRegForm] = useState({
        fullName: '',
        email: '',
        password: '',
        reprocannNumber: '',
        reprocannStatus: 'pending',
        expirationDate: '',
        issueDate: '',
        documentNumber: '',
        dateOfBirth: '',
        pathology: '',
        phone: '',
        address: '',
        notes: ''
    });

    const [hasReprocann, setHasReprocann] = useState<boolean | null>(null);

    // File States
    const [files, setFiles] = useState<{
        reprocann?: File,
        affidavit?: File,
        consent?: File
    }>({});

    const [isSubmitting, setIsSubmitting] = useState(false);

    const loadData = async () => {
        setIsLoading(true);
        const patientsData = await patientsService.getPatients();
        setPatients(patientsData);



        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleFileChange = (type: 'reprocann' | 'affidavit' | 'consent', e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFiles(prev => ({ ...prev, [type]: e.target.files![0] }));
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        setIsSubmitting(true);
        try {
            if (editingPatientId) {
                const patientToEdit = patients.find(p => p.id === editingPatientId);

                let urlReprocann = patientToEdit?.file_reprocann_url || null;
                let urlAffidavit = patientToEdit?.file_affidavit_url || null;
                let urlConsent = patientToEdit?.file_consent_url || null;

                if (files.reprocann && patientToEdit?.profile_id) {
                    urlReprocann = await patientsService.uploadDocument(files.reprocann, `reprocann/${patientToEdit.profile_id}`);
                }
                if (files.affidavit && patientToEdit?.profile_id) {
                    urlAffidavit = await patientsService.uploadDocument(files.affidavit, `affidavit/${patientToEdit.profile_id}`);
                }
                if (files.consent && patientToEdit?.profile_id) {
                    urlConsent = await patientsService.uploadDocument(files.consent, `consent/${patientToEdit.profile_id}`);
                }

                const updatedData: Partial<Patient> = {
                    id: editingPatientId,
                    reprocann_number: regForm.reprocannNumber,
                    reprocann_status: regForm.reprocannStatus as any,
                    expiration_date: regForm.expirationDate || undefined,
                    reprocann_issue_date: regForm.issueDate || undefined,
                    document_number: regForm.documentNumber,
                    date_of_birth: regForm.dateOfBirth || undefined,
                    pathology: regForm.pathology || undefined,
                    phone: regForm.phone,
                    address: regForm.address,
                    notes: regForm.notes,
                    file_reprocann_url: urlReprocann || undefined,
                    file_affidavit_url: urlAffidavit || undefined,
                    file_consent_url: urlConsent || undefined,
                };

                await patientsService.upsertPatient(updatedData);

                if (patientToEdit?.profile_id) {
                    await usersService.updateProfile(patientToEdit.profile_id, { full_name: regForm.fullName });
                }

                closeAddModal();
                resetForm();
                loadData();
                showToast("Datos del socio actualizados exitosamente.", 'success');
            } else {
                let finalEmail = regForm.email.trim();
                if (!finalEmail) {
                    const uniqueSuffix = regForm.documentNumber ? regForm.documentNumber.replace(/\D/g, '') : Date.now().toString();
                    finalEmail = `socio_${uniqueSuffix}@sin-email.trazapp.ar`;
                }

                const userData = { email: finalEmail, fullName: regForm.fullName, password: regForm.password, documentNumber: regForm.documentNumber };
                const initialPatientData: Partial<Patient> = {
                    reprocann_number: regForm.reprocannNumber,
                    reprocann_status: 'pending',
                    expiration_date: regForm.expirationDate || undefined,
                    reprocann_issue_date: regForm.issueDate || undefined,
                    document_number: regForm.documentNumber,
                    date_of_birth: regForm.dateOfBirth || undefined,
                    pathology: regForm.pathology || undefined,
                    phone: regForm.phone,
                    address: regForm.address,
                    notes: regForm.notes,
                    monthly_limit: 40
                };

                const createdPatient = await patientsService.registerNewPatient(initialPatientData, userData);

                if (!createdPatient || !createdPatient.profile_id) {
                    throw new Error("Failed to create patient");
                }

                const newUserId = createdPatient.profile_id;
                const patientId = createdPatient.id;

                let urlReprocann = null;
                let urlAffidavit = null;
                let urlConsent = null;

                if (files.reprocann) {
                    urlReprocann = await patientsService.uploadDocument(files.reprocann, `reprocann/${newUserId}`);
                }
                if (files.affidavit) {
                    urlAffidavit = await patientsService.uploadDocument(files.affidavit, `affidavit/${newUserId}`);
                }
                if (files.consent) {
                    urlConsent = await patientsService.uploadDocument(files.consent, `consent/${newUserId}`);
                }

                if (urlReprocann || urlAffidavit || urlConsent) {
                    await patientsService.upsertPatient({
                        id: patientId,
                        file_reprocann_url: urlReprocann || undefined,
                        file_affidavit_url: urlAffidavit || undefined,
                        file_consent_url: urlConsent || undefined,
                    });
                }

                closeAddModal();
                resetForm();
                loadData();
                showToast("Socio registrado exitosamente.", 'success');
            }
        } catch (error: any) {
            console.error("Error saving patient:", error);
            showToast("Error al procesar: " + (error.message || 'Check console'), 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setRegForm({
            fullName: '',
            email: '',
            password: '',
            reprocannNumber: '',
            reprocannStatus: 'pending',
            expirationDate: '',
            issueDate: '',
            documentNumber: '',
            dateOfBirth: '',
            pathology: '',
            phone: '',
            address: '',
            notes: ''
        });
        setFiles({});
        setHasReprocann(null);
        setEditingPatientId(null);
    };

    const openFullEdit = (patient: Patient) => {
        setHasReprocann(!!patient.reprocann_number);
        setEditingPatientId(patient.id);

        setRegForm({
            fullName: patient.profile?.full_name || '',
            email: patient.profile?.email || '',
            password: '',
            reprocannNumber: patient.reprocann_number || '',
            reprocannStatus: patient.reprocann_status || 'pending',
            expirationDate: (patient as any).expiration_date || patient.expiration_date || '',
            issueDate: patient.reprocann_issue_date || '',
            documentNumber: patient.document_number || '',
            dateOfBirth: patient.date_of_birth || '',
            pathology: patient.pathology || '',
            phone: patient.phone || '',
            address: patient.address || '',
            notes: patient.notes || ''
        });

        setIsAddOpen(true);
        setIsEditOpen(false);
    };

    const openEdit = (patient: Patient) => {
        setSelectedPatient(patient);
        setIsEditOpen(true);
    };

    const closeAddModal = () => {
        setIsClosingAdd(true);
        setTimeout(() => {
            setIsAddOpen(false);
            setIsClosingAdd(false);
            resetForm();
        }, 300);
    };

    const closeEditModal = () => {
        setIsClosingEdit(true);
        setTimeout(() => {
            setIsEditOpen(false);
            setIsClosingEdit(false);
        }, 300);
    };

    const handleUpdatePatient = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPatient) return;

        try {
            await patientsService.upsertPatient(selectedPatient);
            showToast("Socio actualizado exitosamente.", 'success');
            closeEditModal();
            loadData();
        } catch (error) {
            console.error("Error updating patient:", error);
            showToast("Error al actualizar socio.", 'error');
        }
    };

    const filteredPatients = patients.filter(p =>
        p.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.reprocann_number?.includes(searchTerm)
    );

    const activePatients = filteredPatients.filter(p => p.is_approved_by_org !== false);
    const waitingPatients = filteredPatients.filter(p => p.is_approved_by_org === false);

    const handleProcessImportBatch = async (
        validPatients: ParsedPatient[],
        onConflict: (p: ParsedPatient, existing: Patient) => Promise<'update' | 'skip' | 'duplicate' | 'abort'>
    ) => {
        const finalBatchToImport: ParsedPatient[] = [];

        // 1. Resolver Conflictos uno por uno
        for (const p of validPatients) {
            if (p.validationStatus === 'duplicate' && p.duplicateTargetId) {
                const existing = patients.find(pat => pat.id === p.duplicateTargetId);
                if (existing) {
                    const action = await onConflict(p, existing);
                    if (action === 'abort') {
                        showToast("Importación cancelada.", 'info');
                        throw new Error("Aborted");
                    } else if (action === 'skip') {
                        continue;
                    } else if (action === 'update' || action === 'duplicate') {
                        finalBatchToImport.push({ ...p, validationStatus: action === 'update' ? 'ok' : 'duplicate' });
                        continue;
                    }
                }
            }
            // Si es 'ok' entra directo
            if (p.validationStatus === 'ok') finalBatchToImport.push(p);
        }

        if (finalBatchToImport.length === 0) {
            showToast("No hay registros válidos para importar.", "info");
            return;
        }

        // 2. Enviar a la Edge Function
        showToast("Procesando importación en bloque...", "info");
        try {
            // Invocamos a Edge Function 
            const { data, error } = await supabase.functions.invoke('patient-bulk-import', {
                body: {
                    patients: finalBatchToImport,
                    organization_id: currentOrganization?.id
                }
            });

            if (error) throw error;

            if (data?.errors && data.errors.length > 0) {
                console.error("Errores específicos de filas:", data.errors);
                showToast(`Se importaron ${data.importedCount}. Errores en ${data.errors.length} filas: ${data.errors[0].error}`, 'error');
            } else {
                showToast(`¡Se importaron ${data?.importedCount || 0} pacientes con éxito!`, 'success');
            }

            loadData(); // Recargar la tabla
        } catch (e: any) {
            console.error("Bulk Import Error:", e);
            showToast(`Error al importar: ${e.message}`, 'error');
        }
    };

    return (
        <PageContainer style={{ position: 'relative', overflow: 'hidden' }}>
            {planLevel < 3 && <UpgradeOverlay requiredPlanName="ONG" />}

            <div style={{ filter: planLevel < 3 ? 'blur(4px)' : 'none', pointerEvents: planLevel < 3 ? 'none' : 'auto', userSelect: planLevel < 3 ? 'none' : 'auto', opacity: planLevel < 3 ? 0.5 : 1 }}>
                <Header>
                    <Title><FaIdCard /> Gestión de Socios</Title>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <ActionButton onClick={() => setIsInviteOpen(true)} style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#4ade80', borderColor: 'rgba(16, 185, 129, 0.5)' }}>
                            📨 Invitar Socio
                        </ActionButton>
                        <ActionButton onClick={() => setIsImportOpen(true)} style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', borderColor: 'rgba(59, 130, 246, 0.5)' }}>
                            <FaFileImport /> Importar
                        </ActionButton>
                        <ActionButton onClick={() => { resetForm(); setIsAddOpen(true); }}>
                            <FaUserPlus /> Nuevo Socio
                        </ActionButton>
                    </div>
                </Header>

                <TabContainer>
                    <TabButton $active={activeTab === 'active'} onClick={() => setActiveTab('active')}>
                        Socios Activos ({activePatients.length})
                    </TabButton>
                    <TabButton $active={activeTab === 'waiting'} onClick={() => setActiveTab('waiting')}>
                        Sala de Espera <span style={{ background: waitingPatients.length > 0 ? '#ef4444' : '#64748b', color: 'white', padding: '0.1rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', marginLeft: '0.5rem' }}>{waitingPatients.length}</span>
                    </TabButton>
                </TabContainer>

                <SearchInput
                    placeholder="Buscar por nombre o reprocann..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />

                {isLoading ? (
                    <LoadingSpinner />
                ) : (
                    <CardGrid>
                        {(activeTab === 'active' ? activePatients : waitingPatients).map(patient => (
                            <PatientCard key={patient.id} onClick={() => openEdit(patient)}>
                                {/* Desktop View */}
                                <div className="desktop-content">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <StatusBadge status={patient.is_approved_by_org === false ? 'pending' : patient.reprocann_status}>
                                            {patient.is_approved_by_org === false ? 'EN ESPERA' :
                                                patient.reprocann_status === 'active' ? 'Activo' :
                                                    patient.reprocann_status === 'expired' ? 'Vencido' : 'Pendiente'}
                                        </StatusBadge>
                                        <span style={{ fontSize: '0.8rem', color: '#718096' }}>Límite Mensual: {patient.monthly_limit}g</span>
                                    </div>
                                    <h3 style={{ margin: '0 0 0.25rem 0' }}>{patient.profile?.full_name || 'Sin Nombre'}</h3>
                                    <p style={{ color: '#718096', fontSize: '0.9rem', margin: 0 }}>
                                        {patient.reprocann_number || 'Sin Reprocann'}
                                    </p>
                                    {/* Show extra info if available */}
                                    {patient.document_number && <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>DNI: {patient.document_number}</p>}
                                    {(patient as any).expiration_date && (
                                        <small style={{ color: new Date((patient as any).expiration_date!) < new Date() ? '#f87171' : '#4ade80', display: 'block', marginTop: '0.5rem' }}>
                                            Vence: {(patient as any).expiration_date}
                                        </small>
                                    )}

                                    <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                                        <ActionButton
                                            type="button"
                                            style={{ flex: 1, justifyContent: 'center', padding: '0.75rem 0.5rem', fontSize: '0.9rem' }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/patients/${patient.id || patient.profile_id}`);
                                            }}
                                        >
                                            <FaFileAlt /> H. Clínica
                                        </ActionButton>
                                        <ActionButton
                                            type="button"
                                            style={{ flex: 1, justifyContent: 'center', padding: '0.75rem 0.5rem', fontSize: '0.9rem', backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.4)' }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/patients/${patient.id || patient.profile_id}?action=new_followup`);
                                            }}
                                        >
                                            <FaNotesMedical /> Seguimiento
                                        </ActionButton>
                                    </div>
                                </div>

                                {/* Mobile View (Compact Single Line) */}
                                <div className="mobile-content">
                                    <div className="m-info">
                                        <span className="m-name">{patient.profile?.full_name || 'Sin Nombre'}</span>
                                        <span style={{ color: '#475569' }}>-</span>
                                        <span className="m-dni">{patient.document_number || 'Sin DNI'}</span>
                                    </div>
                                    <StatusBadge status={patient.is_approved_by_org === false ? 'pending' : patient.reprocann_status} style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem' }}>
                                        {patient.is_approved_by_org === false ? 'EN ESPERA' :
                                            patient.reprocann_status === 'active' ? 'Activo' :
                                                patient.reprocann_status === 'expired' ? 'Vencido' : 'Pendiente'}
                                    </StatusBadge>
                                </div>
                            </PatientCard>
                        ))}
                    </CardGrid>
                )}

                {/* Modal: Add Patient (Registration) */}
                <Modal isOpen={isAddOpen || isClosingAdd} $isClosing={isClosingAdd} onMouseDown={closeAddModal}>
                    <ModalContent $isClosing={isClosingAdd} onMouseDown={(e) => e.stopPropagation()}>
                        <h2 style={{ marginBottom: '1.5rem', color: '#f8fafc' }}>📄 {editingPatientId ? 'Editar Datos del Socio' : 'Vinculación de Nuevo Socio'}</h2>

                        {hasReprocann === null ? (
                            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                                <h3 style={{ fontSize: '1.4rem', color: '#f8fafc', marginBottom: '2.5rem', fontWeight: 500 }}>
                                    ¿El socio cuenta con vinculación en REPROCANN?
                                </h3>
                                <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
                                    <ActionButton
                                        type="button"
                                        onClick={() => setHasReprocann(true)}
                                        style={{
                                            padding: '1.5rem 2.5rem',
                                            fontSize: '1.1rem',
                                            flexDirection: 'column',
                                            gap: '1rem',
                                            background: 'rgba(74, 222, 128, 0.1)',
                                            borderColor: 'rgba(74, 222, 128, 0.3)',
                                            color: '#4ade80'
                                        }}
                                    >
                                        <FaCheckCircle size={32} />
                                        SÍ, CUENTA CON REPROCANN
                                    </ActionButton>

                                    <ActionButton
                                        type="button"
                                        onClick={() => setHasReprocann(false)}
                                        style={{
                                            padding: '1.5rem 2.5rem',
                                            fontSize: '1.1rem',
                                            flexDirection: 'column',
                                            gap: '1rem',
                                            background: 'rgba(148, 163, 184, 0.1)',
                                            borderColor: 'rgba(148, 163, 184, 0.3)',
                                            color: '#cbd5e1'
                                        }}
                                    >
                                        <FaNotesMedical size={32} />
                                        NO, AÚN NO
                                    </ActionButton>
                                </div>
                                <div style={{ marginTop: '3rem' }}>
                                    <ActionButton type="button" style={{ margin: '0 auto', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: 'none' }} onClick={() => { closeAddModal(); resetForm(); }}>Cancelar</ActionButton>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleRegister} style={{ animation: 'fadeIn 0.3s ease-out' }}>

                                <SectionHeader>Datos Personales</SectionHeader>

                                <FormGroup>
                                    <label>Nombre Completo</label>
                                    <input
                                        value={regForm.fullName}
                                        onChange={e => setRegForm({ ...regForm, fullName: e.target.value })}
                                        placeholder="Nombre y Apellido"
                                        required
                                    />
                                </FormGroup>

                                <FormRow>
                                    <FormGroup>
                                        <label>Email (Opcional)</label>
                                        <input
                                            type="email"
                                            value={regForm.email}
                                            onChange={e => setRegForm({ ...regForm, email: e.target.value })}
                                            placeholder="email@ejemplo.com (Opcional)"
                                            disabled={!!editingPatientId}
                                            style={{ opacity: editingPatientId ? 0.5 : 1, cursor: editingPatientId ? 'not-allowed' : 'text' }}
                                        />
                                        {!!editingPatientId && <small style={{ color: '#94a3b8', display: 'block', marginTop: '0.2rem' }}>El email no puede ser modificado aquí por seguridad de la cuenta.</small>}
                                    </FormGroup>

                                    {!editingPatientId && (
                                        <FormGroup>
                                            <label>Contraseña (Opcional)</label>
                                            <input
                                                type="text"
                                                value={regForm.password}
                                                onChange={e => setRegForm({ ...regForm, password: e.target.value })}
                                                placeholder="Por defecto usará Nro de Documento"
                                            />
                                        </FormGroup>
                                    )}
                                </FormRow>

                                <FormRow>
                                    <FormGroup>
                                        <label>DNI / Documento</label>
                                        <input
                                            value={regForm.documentNumber}
                                            onChange={e => setRegForm({ ...regForm, documentNumber: e.target.value })}
                                            placeholder="Número de documento"
                                            required
                                        />
                                    </FormGroup>
                                    <FormGroup>
                                        <label>Fecha de Nacimiento</label>
                                        <input
                                            type="date"
                                            value={regForm.dateOfBirth}
                                            onChange={e => setRegForm({ ...regForm, dateOfBirth: e.target.value })}
                                            required
                                        />
                                    </FormGroup>
                                </FormRow>
                                <FormRow>
                                    <FormGroup>
                                        <label>Teléfono</label>
                                        <input
                                            value={regForm.phone}
                                            onChange={e => setRegForm({ ...regForm, phone: e.target.value })}
                                            placeholder="+54 9 ..."
                                        />
                                    </FormGroup>
                                    <FormGroup>
                                        <label>Dirección</label>
                                        <input
                                            value={regForm.address}
                                            onChange={e => setRegForm({ ...regForm, address: e.target.value })}
                                            placeholder="Calle, Altura, Localidad"
                                        />
                                    </FormGroup>
                                </FormRow>
                                <FormRow>
                                    <FormGroup>
                                        <label>Patología / Condición Médica</label>
                                        <input
                                            value={regForm.pathology}
                                            onChange={e => setRegForm({ ...regForm, pathology: e.target.value })}
                                            placeholder="Ej. Dolor crónico, Insomnio, Ansiedad"
                                        />
                                    </FormGroup>
                                </FormRow>

                                {hasReprocann && (
                                    <>
                                        <SectionHeader>Datos REPROCANN</SectionHeader>
                                        <FormGroup>
                                            <label>Código de Vinculación / Número de Trámite</label>
                                            <input
                                                value={regForm.reprocannNumber}
                                                onChange={e => setRegForm({ ...regForm, reprocannNumber: e.target.value })}
                                                placeholder="XXXX-XXXX-XXXX"
                                                required={hasReprocann}
                                            />
                                        </FormGroup>
                                        <FormRow>
                                            <FormGroup style={{ position: 'relative', zIndex: 1001 }}>
                                                <label>Fecha Emisión</label>
                                                <CustomDatePicker
                                                    selected={regForm.issueDate ? new Date(regForm.issueDate) : null}
                                                    onChange={(val) => setRegForm({ ...regForm, issueDate: val ? val.toISOString().split('T')[0] : '' })}
                                                    placeholderText="Seleccionar Fecha"
                                                />
                                            </FormGroup>
                                            <FormGroup style={{ position: 'relative', zIndex: 1001 }}>
                                                <label>Fecha Vencimiento</label>
                                                <CustomDatePicker
                                                    selected={regForm.expirationDate ? new Date(regForm.expirationDate) : null}
                                                    onChange={(val) => setRegForm({ ...regForm, expirationDate: val ? val.toISOString().split('T')[0] : '' })}
                                                    placeholderText="Seleccionar Fecha"
                                                />
                                            </FormGroup>
                                        </FormRow>

                                        {/* TODO: Add File uploads back here if needed */}
                                    </>
                                )}

                                <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                    <ActionButton type="button" onClick={() => { closeAddModal(); resetForm(); }} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#cbd5e1' }}>
                                        Cancelar
                                    </ActionButton>
                                    <ActionButton type="submit" style={{ background: 'linear-gradient(135deg, var(--primary-color, #a855f7) 0%, var(--secondary-color, #7c3aed) 100%)', color: '#fff' }} disabled={isSubmitting}>
                                        {isSubmitting ? (editingPatientId ? 'Guardando...' : 'Registrando...') : (editingPatientId ? 'Guardar Cambios' : 'Finalizar Registro')}
                                    </ActionButton>
                                </div>
                            </form>
                        )}
                    </ModalContent>
                </Modal>

                {/* Modal: View/Edit Patient Details */}
                <Modal isOpen={isEditOpen || isClosingEdit} $isClosing={isClosingEdit} onMouseDown={closeEditModal}>
                    <ModalContent $isClosing={isClosingEdit} onMouseDown={(e) => e.stopPropagation()}>
                        {selectedPatient && (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '1rem' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <h2 style={{ margin: 0, color: '#f8fafc' }}>{selectedPatient.profile?.full_name}</h2>
                                            {selectedPatient.phone && (
                                                <ActionButton
                                                    as="a"
                                                    href={`https://wa.me/${selectedPatient.phone.replace(/\D/g, '')}`}
                                                    target="_blank"
                                                    style={{
                                                        background: '#25D366',
                                                        color: '#fff',
                                                        borderColor: 'transparent',
                                                        padding: '0.4rem 0.8rem',
                                                        fontSize: '0.85rem',
                                                        borderRadius: '2rem'
                                                    }}
                                                >
                                                    <FaWhatsapp size={16} /> WhatsApp
                                                </ActionButton>
                                            )}
                                        </div>
                                        <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>{selectedPatient.profile?.email}</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                                        <StatusBadge status={selectedPatient.is_approved_by_org === false ? 'pending' : selectedPatient.reprocann_status} style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                                            {selectedPatient.is_approved_by_org === false ? 'EN ESPERA' :
                                                selectedPatient.reprocann_status === 'active' ? 'ACTIVO' :
                                                    selectedPatient.reprocann_status === 'expired' ? 'VENCIDO' : 'PENDIENTE'}
                                        </StatusBadge>
                                        <ActionButton
                                            type="button"
                                            onClick={() => openFullEdit(selectedPatient)}
                                            title="Editar información completa del paciente"
                                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', width: '100%', display: 'flex', justifyContent: 'center' }}
                                        >
                                            <FaPen /> Editar Perfil
                                        </ActionButton>
                                    </div>
                                </div>

                                <ModalGrid>
                                    <div>
                                        <SectionHeader style={{ marginTop: 0 }}>Datos Personales</SectionHeader>
                                        <p><strong>DNI:</strong> {selectedPatient.document_number || '-'}</p>
                                        <p><strong>Teléfono:</strong> {selectedPatient.phone || '-'}</p>
                                        <p><strong>Dirección:</strong> {selectedPatient.address || '-'}</p>
                                        <p><strong>Límite Mensual:</strong> {selectedPatient.monthly_limit}g</p>
                                    </div>
                                    <div>
                                        <SectionHeader style={{ marginTop: 0 }}>Datos REPROCANN</SectionHeader>
                                        <p><strong>Código:</strong> {selectedPatient.reprocann_number}</p>
                                        <p><strong>Emisión:</strong> {selectedPatient.reprocann_issue_date || '-'}</p>
                                        <p><strong>Vencimiento:</strong> <span style={{ color: new Date(selectedPatient.expiration_date!) < new Date() ? 'red' : 'inherit' }}>{selectedPatient.expiration_date}</span></p>
                                    </div>
                                </ModalGrid>

                                <SectionHeader>Documentación y Afiliación</SectionHeader>
                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                                    {selectedPatient.file_reprocann_url ? (
                                        <ActionButton as="a" href={selectedPatient.file_reprocann_url} target="_blank" style={{ fontSize: '0.9rem' }}>
                                            <FaFileAlt /> Ver Credencial
                                        </ActionButton>
                                    ) : <span style={{ color: '#64748b', fontSize: '0.9rem', alignSelf: 'center' }}>Sin Credencial</span>}

                                    {selectedPatient.file_affidavit_url ? (
                                        <ActionButton as="a" href={selectedPatient.file_affidavit_url} target="_blank" style={{ fontSize: '0.9rem' }}>
                                            <FaFileAlt /> Ver DDJJ
                                        </ActionButton>
                                    ) : <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Sin DDJJ</span>}

                                    {selectedPatient.file_consent_url ? (
                                        <ActionButton as="a" href={selectedPatient.file_consent_url} target="_blank" style={{ fontSize: '0.9rem' }}>
                                            <FaFileAlt /> Ver Consentimiento
                                        </ActionButton>
                                    ) : <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Sin Consentimiento</span>}
                                </div>

                                {selectedPatient.profile?.professional_signature_url && (
                                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <h4 style={{ margin: '0 0 1rem 0', color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Firma del Paciente (Auto-Alta)</h4>
                                        <img src={selectedPatient.profile.professional_signature_url} alt="Firma" style={{ background: 'white', maxWidth: '100%', maxHeight: '120px', borderRadius: '4px', padding: '0.5rem' }} />
                                    </div>
                                )}

                                <SectionHeader>Gestión de Estado</SectionHeader>

                                {selectedPatient.is_approved_by_org === false ? (
                                    <div style={{ background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1.5rem' }}>
                                        <h4 style={{ margin: '0 0 0.5rem 0', color: '#eab308' }}>⚠️ Ingreso en Sala de Espera</h4>
                                        <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#fef08a' }}>
                                            Este socio ha completado el formulario de afiliación. Revisa sus datos y su firma manuscrita arriba.
                                        </p>
                                        <ActionButton
                                            type="button"
                                            style={{ width: '100%', justifyContent: 'center', background: '#eab308', color: '#000', borderColor: '#ca8a04', fontWeight: 'bold' }}
                                            onClick={() => {
                                                setConfirmModal({
                                                    isOpen: true,
                                                    title: 'Admitir Nuevo Socio',
                                                    message: `¿Confirmas la admisión de ${selectedPatient.profile?.full_name} al consultorio? Su cuenta pasará a estar activa.`,
                                                    onConfirm: async () => {
                                                        try {
                                                            await patientsService.upsertPatient({ ...selectedPatient, is_approved_by_org: true });
                                                            showToast("Socio admitido exitosamente.", 'success');
                                                            setConfirmModal(prev => ({ ...prev, isOpen: false }));
                                                            setIsEditOpen(false);
                                                            loadData();
                                                        } catch (error) {
                                                            console.error(error);
                                                            showToast("Error al admitir socio.", 'error');
                                                        }
                                                    },
                                                    isDanger: false
                                                });
                                            }}
                                        >
                                            <FaCheckCircle /> ADMITIR SOCIO (APROBAR ALTA)
                                        </ActionButton>
                                    </div>
                                ) : selectedPatient.reprocann_status === 'pending' && (
                                    <div style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1.5rem' }}>
                                        <h4 style={{ margin: '0 0 0.5rem 0', color: '#38bdf8' }}>ℹ️ Acción Requerida</h4>
                                        <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#bae6fd' }}>
                                            Renovación pendiente. Si la nueva documentación es correcta, apruébalo.
                                        </p>
                                        <ActionButton
                                            type="button"
                                            style={{ width: '100%', justifyContent: 'center', background: 'rgba(74, 222, 128, 0.2)', color: '#4ade80', borderColor: 'rgba(74, 222, 128, 0.5)' }}
                                            onClick={() => {
                                                setConfirmModal({
                                                    isOpen: true,
                                                    title: 'Aprobar Renovación',
                                                    message: `¿Estás seguro de que deseas aprobar el trámite de ${selectedPatient.profile?.full_name}?`,
                                                    onConfirm: async () => {
                                                        try {
                                                            await patientsService.upsertPatient({ ...selectedPatient, reprocann_status: 'active' });
                                                            showToast("Estado actualizado correctamente.", 'success');
                                                            setConfirmModal(prev => ({ ...prev, isOpen: false }));
                                                            setIsEditOpen(false);
                                                            loadData();
                                                        } catch (error) {
                                                            console.error(error);
                                                            showToast("Error al aprobar.", 'error');
                                                        }
                                                    },
                                                    isDanger: false
                                                });
                                            }}
                                        >
                                            <FaCheckCircle /> APROBAR TRAMITE REPROCANN
                                        </ActionButton>
                                    </div>
                                )}

                                <SectionHeader>Edición Manual</SectionHeader>
                                <form onSubmit={handleUpdatePatient}>
                                    <FormGroup style={{ position: 'relative', zIndex: 1002 }}>
                                        <label>Cambiar Estado</label>
                                        <CustomSelect
                                            value={selectedPatient.reprocann_status}
                                            onChange={val => setSelectedPatient({ ...selectedPatient, reprocann_status: val as any })}
                                            options={[
                                                { value: 'pending', label: 'Pendiente de Revisión' },
                                                { value: 'active', label: 'Activo (Habilitado)' },
                                                { value: 'expired', label: 'Vencido' },
                                                { value: 'rejected', label: 'Rechazado' }
                                            ]}
                                        />
                                    </FormGroup>
                                    <FormGroup>
                                        <label>Actualizar Límite (g)</label>
                                        <input
                                            type="number"
                                            value={selectedPatient.monthly_limit}
                                            onChange={e => setSelectedPatient({ ...selectedPatient, monthly_limit: Number(e.target.value) })}
                                        />
                                    </FormGroup>
                                    <FormGroup>
                                        <label>Notas Internas</label>
                                        <textarea
                                            value={selectedPatient.notes || ''}
                                            onChange={e => setSelectedPatient({ ...selectedPatient, notes: e.target.value })}
                                            rows={2}
                                        />
                                    </FormGroup>

                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <ActionButton
                                            type="button"
                                            style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.5)', fontSize: '0.85rem' }}
                                            onClick={() => {
                                                setConfirmModal({
                                                    isOpen: true,
                                                    title: 'Eliminar Socio',
                                                    message: `¿Estás seguro de que deseas eliminar a ${selectedPatient.profile?.full_name}? Esta acción es irreversible.`,
                                                    onConfirm: async () => {
                                                        try {
                                                            await patientsService.deletePatient(selectedPatient.id);
                                                            setConfirmModal(prev => ({ ...prev, isOpen: false }));
                                                            closeEditModal();
                                                            loadData();
                                                            showToast("Socio eliminado correctamente.", 'success');
                                                        } catch (error) {
                                                            console.error(error);
                                                            showToast("Error al eliminar.", 'error');
                                                        }
                                                    },
                                                    isDanger: true
                                                });
                                            }}
                                        >
                                            Eliminar Paciente
                                        </ActionButton>

                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                            <ActionButton type="button" style={{ background: 'rgba(100, 116, 139, 0.2)', color: '#cbd5e1', borderColor: 'transparent' }} onClick={closeEditModal}>Cerrar</ActionButton>
                                            <ActionButton type="submit">Guardar Cambios</ActionButton>
                                        </div>
                                    </div>
                                </form>
                            </>
                        )}
                    </ModalContent>
                </Modal>

                <ConfirmModal
                    isOpen={confirmModal.isOpen}
                    title={confirmModal.title}
                    message={confirmModal.message}
                    onConfirm={confirmModal.onConfirm}
                    onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                    confirmText="Sí, Aprobar"
                    cancelText="Cancelar"
                    isDanger={confirmModal.isDanger}
                />

                <ImportPatientsModal
                    isOpen={isImportOpen}
                    onClose={() => setIsImportOpen(false)}
                    existingPatients={patients}
                    onProcessBatch={handleProcessImportBatch}
                />

                {isInviteOpen && (
                    <InvitePatientModal
                        onClose={() => setIsInviteOpen(false)}
                        onSuccess={() => { }}
                    />
                )}

                <ToastModal
                    isOpen={toastOpen}
                    message={toastMessage}
                    type={toastType}
                    onClose={() => setToastOpen(false)}
                />
            </div>
        </PageContainer>
    );
};

export default Patients;
