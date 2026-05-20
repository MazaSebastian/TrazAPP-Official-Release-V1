import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled, { createGlobalStyle } from 'styled-components';
import { supabase } from '../../services/supabaseClient';
import { FaUserPlus, FaCheckCircle, FaSpinner, FaTimesCircle, FaLock, FaIdCard, FaFileSignature } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { SignaturePad } from '../../components/SignaturePad';
import { useTenantResolver } from '../../hooks/useTenantResolver';

// Brutalist Styles based on TenantLanding
const GlobalBrutalistStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Caveat:wght@700&display=swap');
  html { scroll-behavior: smooth; }
`;

const PageWrapper = styled.div<{ $primaryColor: string }>`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #111111;
  color: #E8E9E1;
  padding: 1rem;
  position: relative;
  
  &::before {
    content: "";
    position: fixed;
    top: 0; left: 0; width: 100vw; height: 100vh;
    opacity: 0.04;
    z-index: 0;
    pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  }
`;

const BrutalCard = styled.div<{ $primaryColor: string }>`
  background: #111;
  border: 4px solid #fff;
  padding: 2rem;
  width: 100%;
  max-width: 500px;
  position: relative;
  z-index: 10;
  box-shadow: 8px 8px 0 ${props => props.$primaryColor};

  @media (max-width: 768px) {
    padding: 1.5rem;
    box-shadow: 4px 4px 0 ${props => props.$primaryColor};
    border-width: 2px;
  }
`;

const Title = styled.h1<{ $primaryColor: string }>`
  font-family: 'Bebas Neue', sans-serif;
  font-size: 3rem;
  text-transform: uppercase;
  margin: 0 0 0.5rem 0;
  text-align: center;
  color: ${props => props.$primaryColor};
  line-height: 1;
`;

const Subtitle = styled.p`
  font-size: 1rem;
  color: #A0A0A0;
  margin: 0 0 2rem 0;
  text-align: center;
  font-family: monospace;
`;

const FormGroup = styled.div`
  width: 100%;
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  font-size: 1rem;
  font-weight: bold;
  color: #fff;
  margin-bottom: 0.5rem;
  font-family: 'Bebas Neue', sans-serif;
  letter-spacing: 1px;
`;

const Input = styled.input`
  width: 100%;
  background: transparent;
  border: 2px solid #fff;
  padding: 0.75rem 1rem;
  color: #f8fafc;
  font-size: 1rem;
  font-family: monospace;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: var(--primary-color, #1FE074);
    background: rgba(255,255,255,0.05);
  }
`;

const Select = styled.select`
  width: 100%;
  background: #111;
  border: 2px solid #fff;
  padding: 0.75rem 1rem;
  color: #f8fafc;
  font-size: 1rem;
  font-family: monospace;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color, #1FE074);
  }
`;

const Button = styled.button<{ $primaryColor: string, $loading?: boolean }>`
  width: 100%;
  background: ${props => props.$primaryColor};
  color: #000;
  border: 2px solid #fff;
  padding: 1rem;
  font-weight: bold;
  font-size: 1.2rem;
  font-family: 'Bebas Neue', sans-serif;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1.5rem;
  text-transform: uppercase;
  opacity: ${props => props.$loading ? 0.7 : 1};
  pointer-events: ${props => props.$loading ? 'none' : 'auto'};

  &:hover {
    transform: translate(-4px, -4px);
    box-shadow: 4px 4px 0 #fff;
  }
`;

const StepIndicator = styled.div<{ $primaryColor: string }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
  justify-content: center;
  
  .step {
    width: 32px;
    height: 32px;
    border-radius: 0;
    border: 2px solid #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    font-family: 'Bebas Neue', sans-serif;
    background: transparent;
    color: #fff;
    transition: all 0.3s;
    
    &.active {
      background: ${props => props.$primaryColor};
      color: #000;
      border-color: ${props => props.$primaryColor};
    }
    
    &.completed {
      background: #fff;
      color: #000;
    }
  }
  
  .line {
    height: 2px;
    width: 40px;
    background: rgba(255, 255, 255, 0.3);
    
    &.filled {
      background: #fff;
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

export default function TenantApply() {
    const { slug } = useParams<{ slug: string }>();
    const { tenant, isLoading: resolvingTenant } = useTenantResolver(slug);
    const navigate = useNavigate();

    const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(0);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Form Data
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [formData, setFormData] = useState({
        fullName: '',
        documentNumber: '',
        phone: '',
        pathology: '',
        reprocannNumber: '',
        reprocannStatus: 'pending' as 'pending' | 'active' | 'none',
        issueDate: '',
        expirationDate: ''
    });

    useEffect(() => {
        console.log("[TenantApply] resolvingTenant:", resolvingTenant, "tenant:", tenant?.slug);
        if (!resolvingTenant) {
            if (tenant) {
                console.log("[TenantApply] tenant found, setting step 1");
                setStep(1); // Start directly on step 1 when tenant is loaded
            } else {
                console.log("[TenantApply] tenant null, setting errorMsg");
                setErrorMsg("No pudimos encontrar este club.");
            }
        }
    }, [tenant, resolvingTenant]);

    const handleNext = () => {
        if (step === 1 && (password.length < 6 || !email)) {
            alert("El email es requerido y la contraseña debe tener al menos 6 caracteres.");
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
        setErrorMsg('');

        try {
            const { data, error } = await supabase.functions.invoke('process-patient-onboarding', {
                body: {
                    action: 'apply',
                    organizationId: tenant?.id,
                    email,
                    password,
                    patientData: formData,
                    signatureBase64: signatureDataUrl
                }
            });

            if (error || !data?.success) {
                throw new Error(data?.error || error?.message || "Ocurrió un error al procesar tu solicitud.");
            }

            setStep(4 as any); // Success step
        } catch (err: any) {
            setErrorMsg(err.message);
        } finally {
            setLoading(false);
        }
    };

    const primaryColor = tenant?.primary_color || '#1FE074';

    if (resolvingTenant || (step === 0 && !errorMsg)) {
        return (
            <PageWrapper $primaryColor={primaryColor}>
                <FaSpinner className="fa-spin" style={{ fontSize: '3rem', color: primaryColor }} />
            </PageWrapper>
        );
    }

    if (errorMsg && step === 0) {
        return (
            <PageWrapper $primaryColor={primaryColor}>
                <BrutalCard $primaryColor={primaryColor}>
                    <MessagePane>
                        <FaTimesCircle style={{ color: '#ef4444' }} />
                        <h2 style={{ fontFamily: 'Bebas Neue', fontSize: '2rem' }}>Error</h2>
                        <p>{errorMsg}</p>
                    </MessagePane>
                </BrutalCard>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper $primaryColor={primaryColor} style={{ '--primary-color': primaryColor } as any}>
            <GlobalBrutalistStyle />
            <BrutalCard $primaryColor={primaryColor}>
                
                {tenant?.logo_url && (
                    <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                        <img src={tenant.logo_url} alt={tenant.name} style={{ maxHeight: '60px' }} />
                    </div>
                )}

                {step !== 4 && (
                    <>
                        <Title $primaryColor={primaryColor}>Unirme al Club</Title>
                        <Subtitle>Completá tus datos para solicitar membresía en {tenant?.name}</Subtitle>

                        <StepIndicator $primaryColor={primaryColor}>
                            <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>1</div>
                            <div className={`line ${step > 1 ? 'filled' : ''}`} />
                            <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>2</div>
                            <div className={`line ${step > 2 ? 'filled' : ''}`} />
                            <div className={`step ${step >= 3 ? 'active' : ''}`}>3</div>
                        </StepIndicator>
                    </>
                )}

                {errorMsg && step !== 4 && (
                    <div style={{ background: '#ef4444', color: 'white', padding: '1rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>
                        {errorMsg}
                    </div>
                )}

                {/* Paso 1: Email y Contraseña */}
                {step === 1 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                        <FormGroup>
                            <Label><FaUserPlus style={{ marginRight: '8px' }} /> CORREO ELECTRÓNICO</Label>
                            <Input
                                type="email"
                                placeholder="tu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </FormGroup>
                        <FormGroup>
                            <Label><FaLock style={{ marginRight: '8px' }} /> CREA UNA CONTRASEÑA</Label>
                            <Input
                                type="password"
                                placeholder="Mínimo 6 caracteres"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </FormGroup>
                        <Button $primaryColor={primaryColor} onClick={handleNext}>Continuar</Button>
                    </motion.div>
                )}

                {/* Paso 2: Datos Personales */}
                {step === 2 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                            <FormGroup style={{ marginBottom: 0 }}>
                                <Label>NOMBRE COMPLETO</Label>
                                <Input
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                />
                            </FormGroup>
                            <FormGroup style={{ marginBottom: 0 }}>
                                <Label>NÚMERO DE DNI</Label>
                                <Input
                                    value={formData.documentNumber}
                                    onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                                />
                            </FormGroup>
                            <FormGroup style={{ marginBottom: 0 }}>
                                <Label>TELÉFONO (WHATSAPP)</Label>
                                <Input
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </FormGroup>
                            <FormGroup style={{ marginBottom: 0 }}>
                                <Label>PATOLOGÍA TRATADA (OPCIONAL)</Label>
                                <Input
                                    value={formData.pathology}
                                    onChange={(e) => setFormData({ ...formData, pathology: e.target.value })}
                                />
                            </FormGroup>
                            
                            <div style={{ marginTop: '1rem', borderTop: '2px dashed rgba(255,255,255,0.2)', paddingTop: '1rem' }}>
                                <Label>ESTADO REPROCANN</Label>
                                <Select
                                    value={formData.reprocannStatus}
                                    onChange={(e) => setFormData({ ...formData, reprocannStatus: e.target.value as any })}
                                    style={{ marginBottom: '1rem' }}
                                >
                                    <option value="none">No tengo</option>
                                    <option value="pending">En Trámite</option>
                                    <option value="active">Activo (Aprobado)</option>
                                </Select>

                                {formData.reprocannStatus === 'active' && (
                                    <FormGroup>
                                        <Label>CÓDIGO DE VINCULACIÓN / NRO. REPROCANN</Label>
                                        <Input
                                            value={formData.reprocannNumber}
                                            onChange={(e) => setFormData({ ...formData, reprocannNumber: e.target.value })}
                                        />
                                    </FormGroup>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <Button $primaryColor="transparent" style={{ color: '#fff' }} onClick={() => setStep(1)}>Atrás</Button>
                            <Button $primaryColor={primaryColor} onClick={handleNext}>Continuar</Button>
                        </div>
                    </motion.div>
                )}

                {/* Paso 3: Firma */}
                {step === 3 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                        <Label style={{ textAlign: 'center', marginBottom: '1rem' }}>
                            <FaFileSignature style={{ marginRight: '8px' }} /> FIRMA DE CONSENTIMIENTO
                        </Label>
                        <p style={{ fontSize: '0.875rem', color: '#94a3b8', textAlign: 'center', marginBottom: '1rem', fontFamily: 'monospace' }}>
                            Declaro que los datos ingresados son reales y solicito la admisión como socio de {tenant?.name}.
                        </p>
                        
                        <div style={{ background: '#fff', borderRadius: '4px', padding: '4px', marginBottom: '1.5rem' }}>
                            <SignaturePad onSave={handleSubmit} />
                        </div>
                        
                        <Button $primaryColor="transparent" style={{ color: '#fff', marginTop: '0' }} onClick={() => setStep(2)} disabled={loading}>
                            Atrás
                        </Button>
                    </motion.div>
                )}

                {/* Paso 4: Éxito */}
                {step === 4 && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                        <MessagePane>
                            <FaCheckCircle style={{ color: primaryColor }} />
                            <Title $primaryColor={primaryColor}>¡SOLICITUD ENVIADA!</Title>
                            <p style={{ fontFamily: 'monospace', color: '#A0A0A0', lineHeight: '1.6' }}>
                                Tu solicitud ha sido enviada exitosamente al club. <br/><br/>
                                La organización revisará tu perfil en la sala de espera y te habilitará a la brevedad. Recibirás un aviso o podrás intentar iniciar sesión más tarde.
                            </p>
                            <Button $primaryColor={primaryColor} onClick={() => navigate(`/${tenant?.slug}`)}>
                                Volver a la web del club
                            </Button>
                        </MessagePane>
                    </motion.div>
                )}

            </BrutalCard>
        </PageWrapper>
    );
}
