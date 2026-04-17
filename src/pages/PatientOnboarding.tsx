import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../services/supabaseClient';
import { FaUserPlus, FaCheckCircle, FaSpinner, FaTimesCircle, FaLock, FaIdCard, FaFileSignature } from 'react-icons/fa';
import { SignaturePad } from '../components/SignaturePad';

const PageWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at top right, #0f172a 0%, #020617 100%);
  padding: 1rem;
  color: #f8fafc;
`;

const GlassCard = styled.div`
  background: rgba(30, 41, 59, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 2rem;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Logo = styled.img`
  height: 60px;
  margin-bottom: 1.5rem;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  text-align: center;
  background: linear-gradient(to right, #4ade80, #3b82f6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Subtitle = styled.p`
  font-size: 0.875rem;
  color: #94a3b8;
  margin: 0 0 2rem 0;
  text-align: center;
`;

const FormGroup = styled.div`
  width: 100%;
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #cbd5e1;
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  color: #f8fafc;
  font-size: 1rem;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }
`;

const Select = styled.select`
  width: 100%;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  color: #f8fafc;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
  
  option {
    background: #0f172a;
    color: #f8fafc;
  }
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary', $loading?: boolean }>`
  width: 100%;
  background: ${props => props.$variant === 'secondary' ? 'transparent' : 'linear-gradient(to right, #10b981, #059669)'};
  color: white;
  border: ${props => props.$variant === 'secondary' ? '1px solid rgba(255,255,255,0.2)' : 'none'};
  padding: 1rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1.5rem;
  opacity: ${props => props.$loading ? 0.7 : 1};
  pointer-events: ${props => props.$loading ? 'none' : 'auto'};

  &:hover {
    transform: translateY(-1px);
    box-shadow: ${props => props.$variant === 'secondary' ? 'none' : '0 10px 15px -3px rgba(16, 185, 129, 0.3)'};
  }
`;

const StepIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
  
  .step {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
    font-weight: bold;
    background: rgba(255, 255, 255, 0.1);
    color: #64748b;
    transition: all 0.3s;
    
    &.active {
      background: #3b82f6;
      color: white;
      box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
    }
    
    &.completed {
      background: #10b981;
      color: white;
    }
  }
  
  .line {
    height: 2px;
    width: 40px;
    background: rgba(255, 255, 255, 0.1);
    
    &.filled {
      background: #10b981;
    }
  }
`;

const MessagePane = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    text-align: center;
    
    svg {
        font-size: 4rem;
    }
`;

export default function PatientOnboarding() {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();

    const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(0);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [invitation, setInvitation] = useState<any>(null);

    // Form Data
    const [password, setPassword] = useState('');
    const [formData, setFormData] = useState({
        fullName: '',
        documentNumber: '',
        phone: '',
        pathology: '',
        reprocannNumber: '',
        reprocannStatus: 'pending' as 'pending' | 'active',
        issueDate: '',
        expirationDate: ''
    });

    useEffect(() => {
        async function fetchInvitation() {
            try {
                if (!token) {
                    setErrorMsg("Enlace inválido.");
                    setLoading(false);
                    return;
                }

                // Call Edge Function to validate token and return org data
                const { data, error } = await supabase.functions.invoke('process-patient-onboarding', {
                    body: { action: 'validate', token }
                });

                if (error || !data?.valid) {
                    setErrorMsg(data?.error || "El enlace de invitación ha expirado o es inválido.");
                } else {
                    setInvitation(data.invitation);
                    // Move to Step 1
                    setStep(1);
                }
            } catch (err: any) {
                setErrorMsg(err.message || "Error al validar la invitación.");
            } finally {
                setLoading(false);
            }
        }
        fetchInvitation();
    }, [token]);

    const handleNext = () => {
        if (step === 1 && password.length < 6) {
            alert("La contraseña debe tener al menos 6 caracteres.");
            return;
        }
        if (step === 2 && (!formData.fullName || !formData.documentNumber || !formData.phone)) {
            alert("Por favor completa los campos obligatorios (Nombre, DNI, Teléfono).");
            return;
        }
        setStep((s) => (s + 1) as any);
    };

    const handleSubmit = async (signatureDataUrl: string) => {
        setLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('process-patient-onboarding', {
                body: {
                    action: 'submit',
                    token,
                    password,
                    patientData: formData,
                    signatureBase64: signatureDataUrl
                }
            });

            if (error || !data?.success) {
                throw new Error(data?.error || error?.message || "Error desconocido al procesar el alta.");
            }

            setStep(4); // Success!
        } catch (err: any) {
            alert("No se pudo completar el registro: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading && step === 0) {
        return (
            <PageWrapper>
                <LoadingSpinner text="Validando invitación segura..." />
            </PageWrapper>
        );
    }

    if (errorMsg) {
        return (
            <PageWrapper>
                <GlassCard>
                    <MessagePane>
                        <FaTimesCircle color="#ef4444" />
                        <Title style={{ background: '#ef4444', WebkitTextFillColor: 'initial' }}>Invitación Inválida</Title>
                        <Subtitle>{errorMsg}</Subtitle>
                    </MessagePane>
                </GlassCard>
            </PageWrapper>
        );
    }

    if (step === 4) {
        return (
            <PageWrapper>
                <GlassCard style={{ borderColor: 'rgba(16, 185, 129, 0.5)' }}>
                    <MessagePane>
                        <FaCheckCircle color="#10b981" />
                        <Title style={{ background: '#10b981', WebkitTextFillColor: 'initial' }}>¡Registro Exitoso!</Title>
                        <Subtitle style={{ color: '#f8fafc', fontSize: '1.1rem' }}>
                            Tus datos han sido enviados a <strong>{invitation?.organization_name}</strong> de manera encriptada y segura.
                        </Subtitle>
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '2rem' }}>
                            La organización revisará tu perfil en la sala de espera y te habilitará a la brevedad. Ya puedes cerrar esta ventana.
                        </p>
                        <Button $variant="secondary" onClick={() => navigate('/login')}>
                            Ir al Panel de Ingreso
                        </Button>
                    </MessagePane>
                </GlassCard>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper>
            <GlassCard>
                <Logo src="/trazapphorizontal.png" alt="TrazAPP" />
                <Title>Afiliación de Socio</Title>
                <Subtitle>Únete a <b>{invitation?.organization_name}</b></Subtitle>

                <StepIndicator>
                    <div className={`step ${step >= 1 ? 'completed' : ''}`}>
                        <FaLock size={12} />
                    </div>
                    <div className={`line ${step >= 2 ? 'filled' : ''}`} />
                    <div className={`step ${step === 2 ? 'active' : step > 2 ? 'completed' : ''}`}>
                        <FaIdCard size={12} />
                    </div>
                    <div className={`line ${step >= 3 ? 'filled' : ''}`} />
                    <div className={`step ${step === 3 ? 'active' : ''}`}>
                        <FaFileSignature size={12} />
                    </div>
                </StepIndicator>

                {step === 1 && (
                    <div style={{ width: '100%', animation: 'fadeIn 0.3s' }}>
                        <FormGroup>
                            <Label>Correo de Invitación</Label>
                            <Input type="email" value={invitation?.email || ''} disabled style={{ opacity: 0.5 }} />
                        </FormGroup>
                        <FormGroup>
                            <Label>Crea una Contraseña para tu cuenta</Label>
                            <Input
                                type="password"
                                placeholder="Minimo 6 caracteres"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoFocus
                            />
                        </FormGroup>
                        <Button onClick={handleNext}>Continuar</Button>
                    </div>
                )}

                {step === 2 && (
                    <div style={{ width: '100%', animation: 'fadeIn 0.3s', maxHeight: '50vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
                        <FormGroup>
                            <Label>Nombre Completo *</Label>
                            <Input type="text" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} placeholder="Ej: Juan Perez" />
                        </FormGroup>
                        <FormGroup>
                            <Label>DNI o Pasaporte *</Label>
                            <Input type="text" value={formData.documentNumber} onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })} placeholder="Sin puntos ni espacios" />
                        </FormGroup>
                        <FormGroup>
                            <Label>Teléfono *</Label>
                            <Input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+54 9 11..." />
                        </FormGroup>
                        <FormGroup>
                            <Label>Patología Principal (Condición)</Label>
                            <Input type="text" value={formData.pathology} onChange={(e) => setFormData({ ...formData, pathology: e.target.value })} placeholder="Opcional" />
                        </FormGroup>

                        <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', marginTop: '1.5rem' }}>
                            <Label style={{ color: '#4ade80', marginBottom: '1rem' }}>Datos REPROCANN (Si aplica)</Label>
                            <FormGroup>
                                <Label>Estado del trámite</Label>
                                <Select value={formData.reprocannStatus} onChange={(e) => setFormData({ ...formData, reprocannStatus: e.target.value as any })}>
                                    <option value="pending">En trámite / Pendiente</option>
                                    <option value="active">Aprobado / Activo</option>
                                </Select>
                            </FormGroup>
                            <FormGroup>
                                <Label>Número REPROCANN</Label>
                                <Input type="text" value={formData.reprocannNumber} onChange={(e) => setFormData({ ...formData, reprocannNumber: e.target.value })} placeholder="Opcional" />
                            </FormGroup>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <Button $variant="secondary" onClick={() => setStep(1)}>Atrás</Button>
                            <Button onClick={handleNext}>Siguiente</Button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div style={{ width: '100%', animation: 'fadeIn 0.3s' }}>
                        <p style={{ fontSize: '0.875rem', color: '#cbd5e1', lineHeight: 1.5, textAlign: 'justify', marginBottom: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
                            Al firmar, declaro que la información proporcionada es verídica y acepto los términos de afiliación y dispensación de <b>{invitation?.organization_name}</b> bajo el amparo de la legislación de salud vigente.
                        </p>

                        {loading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                                <LoadingSpinner text="Procesando afiliación segura..." />
                            </div>
                        ) : (
                            <SignaturePad
                                onSave={(dataUrl) => handleSubmit(dataUrl)}
                                onCancel={() => setStep(2)}
                            />
                        )}
                        {!loading && <Button $variant="secondary" style={{ marginTop: '1rem' }} onClick={() => setStep(2)}>Atrás</Button>}
                    </div>
                )}

            </GlassCard>
        </PageWrapper>
    );
}

const LoadingSpinner: React.FC<{ text?: string }> = ({ text }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', color: '#3b82f6' }}>
        <FaSpinner className="fa-spin" size={32} />
        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{text}</span>
    </div>
);
