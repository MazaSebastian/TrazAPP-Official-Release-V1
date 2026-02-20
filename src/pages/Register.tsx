import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { inviteService } from '../services/inviteService';
import { useAuth } from '../context/AuthContext';
import { FaCheckCircle, FaExclamationTriangle, FaEye, FaEyeSlash, FaChevronDown } from 'react-icons/fa';
import ParticleBackground from '../components/ParticleBackground';

const fadeIn = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const fadeOut = `
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
`;

const pulseGlow = `
  @keyframes pulseGlow {
    0% { transform: scale(1); filter: drop-shadow(0 0 10px rgba(34, 197, 94, 0.4)); }
    50% { transform: scale(1.05); filter: drop-shadow(0 0 25px rgba(34, 197, 94, 0.8)); }
    100% { transform: scale(1); filter: drop-shadow(0 0 10px rgba(34, 197, 94, 0.4)); }
  }
`;

const textReveal = `
  @keyframes textReveal {
    from { opacity: 0; transform: translateY(15px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const Container = styled.div`
  ${fadeIn}
  ${fadeOut}
  ${pulseGlow}
  ${textReveal}
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #020617;
  padding: 1rem;
  position: relative;
  overflow: hidden;
`;

const WelcomeOverlay = styled.div<{ $fadingOut?: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #020617; /* Very dark slate to make logo pop */
  z-index: 9999;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  animation: ${props => props.$fadingOut ? 'fadeOut 0.6s ease-out forwards' : 'fadeIn 0.5s ease-out'};
  pointer-events: ${props => props.$fadingOut ? 'none' : 'auto'};
`;

const WelcomeLogo = styled.img`
  width: 120px;
  height: auto;
  margin-bottom: 2rem;
  animation: pulseGlow 2.5s infinite ease-in-out;
  position: relative;
  z-index: 10;
`;

const WelcomeText = styled.h1`
  color: #22c55e;
  font-size: 2.5rem;
  font-weight: 800;
  letter-spacing: -0.025em;
  margin: 0;
  opacity: 0;
  animation: textReveal 1s ease-out forwards;
  animation-delay: 0.5s;
  text-align: center;
  text-shadow: 0 0 15px rgba(34, 197, 94, 0.3);
  position: relative;
  z-index: 10;

  @media (max-width: 640px) {
    font-size: 1.75rem;
  }
`;

const WelcomeSubtext = styled.p`
  color: #94a3b8;
  font-size: 1.1rem;
  margin-top: 1rem;
  opacity: 0;
  animation: textReveal 1s ease-out forwards;
  animation-delay: 1.2s;
  text-align: center;
  position: relative;
  z-index: 10;
`;

const Card = styled.div<{ $fadingIn?: boolean }>`
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(12px);
  border-radius: 1.5rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  padding: 3rem;
  width: 100%;
  max-width: 480px;
  position: relative;
  border: 1px solid rgba(34, 197, 94, 0.2);
  z-index: 10;
  animation: ${props => props.$fadingIn ? 'fadeIn 0.6s ease-out forwards' : 'none'};
  opacity: ${props => props.$fadingIn ? 0 : 1};
`;

const Title = styled.h2`
  text-align: center;
  color: #4ade80;
  font-size: 1.75rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  text-align: center;
  color: #94a3b8;
  font-size: 1rem;
  margin-bottom: 2rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 600;
  color: #cbd5e1;
  font-size: 0.875rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.875rem 1rem;
  border: 1px solid #334155;
  border-radius: 0.75rem;
  font-size: 1rem;
  transition: all 0.2s;
  background: rgba(30, 41, 59, 0.5);
  color: #f8fafc;

  &:focus {
    outline: none;
    border-color: #22c55e;
    background: rgba(30, 41, 59, 0.8);
    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.15);
  }

  &:disabled {
    background: rgba(15, 23, 42, 0.5);
    cursor: not-allowed;
    color: #64748b;
    border-color: #1e293b;
  }
`;

const DropdownContainer = styled.div`
  position: relative;
  width: 100%;
`;

const DropdownHeader = styled.div<{ $isOpen: boolean; $hasValue: boolean }>`
  width: 100%;
  padding: 0.875rem 1rem;
  border: 1px solid ${props => props.$isOpen ? '#22c55e' : '#334155'};
  border-radius: 0.75rem;
  font-size: 1rem;
  transition: all 0.2s;
  background: ${props => props.$isOpen ? 'rgba(30, 41, 59, 0.8)' : 'rgba(30, 41, 59, 0.5)'};
  color: ${props => props.$hasValue ? '#f8fafc' : '#94a3b8'};
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: ${props => props.$isOpen ? '0 0 0 3px rgba(34, 197, 94, 0.15)' : 'none'};

  &:hover {
    border-color: #22c55e;
  }
`;

const DropdownList = styled.ul`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: #1e293b;
  border-radius: 0.75rem;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
  border: 1px solid #334155;
  list-style: none;
  z-index: 50;
  max-height: 250px;
  overflow-y: auto;
  animation: fadeIn 0.2s ease-out;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }
`;

const DropdownItem = styled.li<{ $isSelected: boolean }>`
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.95rem;
  color: ${props => props.$isSelected ? '#4ade80' : '#cbd5e1'};
  background: ${props => props.$isSelected ? 'rgba(34, 197, 94, 0.1)' : 'transparent'};
  transition: all 0.15s;
  font-weight: ${props => props.$isSelected ? '600' : '400'};

  &:hover {
    background: ${props => props.$isSelected ? 'rgba(34, 197, 94, 0.15)' : 'rgba(30, 41, 59, 0.8)'};
  }
`;

const PasswordWrapper = styled.div`
  position: relative;
  
  input {
    padding-right: 2.5rem;
  }
`;

const ToggleButton = styled.button`
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.25rem;
  
  &:hover {
    color: #f8fafc;
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 0.875rem;
  background: #16a34a;
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 1rem;
  box-shadow: 0 4px 6px -1px rgba(22, 163, 74, 0.2);

  &:hover {
    background: #15803d;
    transform: translateY(-1px);
    box-shadow: 0 10px 15px -3px rgba(22, 163, 74, 0.3);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    background: #9ca3af;
    transform: none;
    box-shadow: none;
  }
`;

const Message = styled.div<{ $type: 'error' | 'info' | 'success' }>`
  background: ${props => props.$type === 'error' ? 'rgba(127, 29, 29, 0.2)' : props.$type === 'success' ? 'rgba(20, 83, 45, 0.2)' : 'rgba(30, 58, 138, 0.2)'};
  border-left: 4px solid ${props => props.$type === 'error' ? '#ef4444' : props.$type === 'success' ? '#22c55e' : '#3b82f6'};
  color: ${props => props.$type === 'error' ? '#fca5a5' : props.$type === 'success' ? '#86efac' : '#93c5fd'};
  padding: 0.75rem 1rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  text-align: center;
  color: #94a3b8;
  font-size: 0.875rem;
  margin: 1rem 0;

  &::before,
  &::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid #334155;
  }

  &::before {
    margin-right: .5em;
  }

  &::after {
    margin-left: .5em;
  }
`;

const referralOptions = [
    { value: 'recommendation', label: 'Recomendación de un amigo' },
    { value: 'social_media', label: 'Redes Sociales (Instagram, Meta)' },
    { value: 'web_search', label: 'Búsqueda Web (Google)' },
    { value: 'event', label: 'Evento / Expo' },
    { value: 'other', label: 'Otro' },
];

const Register: React.FC = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();
    const { user } = useAuth(); // Assume auth context provides current user

    const [inviteDetails, setInviteDetails] = useState<any>(null);
    const [status, setStatus] = useState<'validating' | 'valid' | 'invalid' | 'registered'>('validating');
    const [isFadingOut, setIsFadingOut] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const [name, setName] = useState('');
    const [ongName, setOngName] = useState('');
    const [phone, setPhone] = useState('');
    const [referralSource, setReferralSource] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Redirect if already logged in and using a register link
    useEffect(() => {
        if (user) {
            navigate('/', { replace: true });
        }
    }, [user, navigate]);

    useEffect(() => {
        const validateToken = async () => {
            if (!token) {
                setStatus('invalid');
                setErrorMsg('No se proporcionó un token de invitación válido en la URL.');
                return;
            }

            // Force a minimum delay of 3.5 seconds to show the pretty animation
            const minDelay = new Promise(resolve => setTimeout(resolve, 3500));

            try {
                const invitePromise = inviteService.getInviteByToken(token);

                const [invite] = await Promise.all([invitePromise, minDelay]);

                const transition = async (newStatus: 'valid' | 'invalid', msg?: string) => {
                    setIsFadingOut(true);
                    await new Promise(res => setTimeout(res, 500)); // Wait for fade out
                    if (msg) setErrorMsg(msg);
                    setStatus(newStatus);
                };

                if (!invite) {
                    await transition('invalid', 'La invitación no existe o ha sido eliminada.');
                    return;
                }

                if (invite.status !== 'pending') {
                    await transition('invalid', `Esta invitación ya ha sido utilizada o se encuentra en estado: ${invite.status}.`);
                    return;
                }

                if (new Date(invite.expires_at) < new Date()) {
                    await transition('invalid', 'El enlace de invitación ha expirado.');
                    return;
                }

                setInviteDetails(invite);
                await transition('valid');

            } catch (err: any) {
                await minDelay; // Ensure animation finishes even on error
                setIsFadingOut(true);
                await new Promise(res => setTimeout(res, 500));
                setStatus('invalid');
                setErrorMsg('Ocurrió un error al validar la invitación.');
                console.error('Error validating token:', err);
            }
        };

        validateToken();
    }, [token]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');

        if (password !== confirmPassword) {
            setErrorMsg('Las contraseñas no coinciden.');
            return;
        }

        if (password.length < 6) {
            setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        if (!name.trim()) {
            setErrorMsg('Por favor, ingresa tu nombre.');
            return;
        }

        if (!phone.trim()) {
            setErrorMsg('Por favor, ingresa tu número de teléfono.');
            return;
        }

        if (!referralSource) {
            setErrorMsg('Por favor, indícanos cómo nos conociste.');
            return;
        }

        const isOng = inviteDetails?.organization?.plan === 'ong';
        if (isOng && !ongName.trim()) {
            setErrorMsg('Por favor, ingresa el nombre de la ONG.');
            return;
        }

        setIsSubmitting(true);

        try {
            // 1. Sign up user via Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: inviteDetails.email,
                password: password,
                options: {
                    data: {
                        name: name, // Some integrations expect 'name'
                        full_name: name, // The trigger likely expects 'full_name'
                        role: inviteDetails.role === 'owner' ? 'admin' : inviteDetails.role
                    }
                }
            });

            if (authError) {
                throw authError;
            }

            if (!authData.user) {
                throw new Error('No se pudo crear el usuario.');
            }

            const userId = authData.user.id;

            // 2. Insert into public.profiles using ONLY existing columns (id, full_name, updated_at). 
            // Avoid using email or role here as they don't exist and would crash the upsert.
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: userId,
                    full_name: name,
                    updated_at: new Date().toISOString()
                });

            if (profileError) {
                console.error('Error updating profile:', profileError);
                // Non-fatal, continue to link org
            }

            // 3. Link user to organization in organization_members
            const { error: memberError } = await supabase
                .from('organization_members')
                .insert([{
                    organization_id: inviteDetails.organization_id,
                    user_id: userId,
                    role: inviteDetails.role
                }]);

            if (memberError) {
                console.error('Error creating org member:', memberError);
                throw new Error('No se pudo vincular el usuario a la organización.');
            }

            // 4. Update the organization record with the new details
            const orgUpdatePayload: any = {
                owner_name: name,
                phone: phone,
                referral_source: referralSource,
                status: 'active'
            };

            const isOng = inviteDetails?.organization?.plan === 'ong';
            if (isOng && ongName.trim()) {
                orgUpdatePayload.name = ongName.trim();
                orgUpdatePayload.slug = ongName.trim().toLowerCase().replace(/\s+/g, '-');
            }

            const { error: orgUpdateError } = await supabase
                .from('organizations')
                .update(orgUpdatePayload)
                .eq('id', inviteDetails.organization_id);

            if (orgUpdateError) {
                console.error('Error updating organization info:', orgUpdateError);
                // Not throwing here, allow registration to complete
            }

            // 5. Mark invite as accepted
            await inviteService.acceptInvite(token as string);

            setStatus('registered');

            // Redirect to login after a few seconds
            setTimeout(() => {
                navigate('/login?registered=true', { replace: true });
            }, 3000);

        } catch (err: any) {
            setErrorMsg(err.message || 'Ocurrió un error inesperado al registrarte.');
            console.error('Registration error:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Container>
            <ParticleBackground />

            {status === 'validating' && (
                <WelcomeOverlay $fadingOut={isFadingOut}>
                    <ParticleBackground />
                    <WelcomeLogo src="/logotrazappfix.png" alt="TrazAPP Logo" />
                    <WelcomeText>¡Bienvenido a TrazAPP!</WelcomeText>
                    <WelcomeSubtext>Preparando tu entorno de trabajo...</WelcomeSubtext>
                </WelcomeOverlay>
            )}

            {status !== 'validating' && (
                <Card $fadingIn={true}>
                    <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                        <img src="/logotrazappfix.png" alt="Logo" style={{ width: '80px', height: 'auto', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }} />
                    </div>

                    {status === 'invalid' && (
                        <>
                            <Title>Invitación Inválida</Title>
                            <Message $type="error">
                                <FaExclamationTriangle />
                                {errorMsg}
                            </Message>
                            <SubmitButton as="a" href="/login" style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}>
                                Ir al Inicio de Sesión
                            </SubmitButton>
                        </>
                    )}

                    {status === 'registered' && (
                        <>
                            <Title>¡Registro Exitoso!</Title>
                            <Message $type="success">
                                <FaCheckCircle />
                                Tu cuenta ha sido creada. Ahora puedes iniciar sesión en la plataforma.
                            </Message>
                            <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#64748b' }}>
                                Redirigiendo a la pantalla de acceso...
                            </p>
                        </>
                    )}

                    {status === 'valid' && inviteDetails && (
                        <>
                            <Title>Bienvenido a TrazAPP</Title>
                            <Subtitle>
                                Por favor completa los siguientes datos para acceder a tu sistema de gestión integral.
                            </Subtitle>

                            <Form onSubmit={handleRegister}>
                                {errorMsg && (
                                    <Message $type="error">
                                        <FaExclamationTriangle />
                                        {errorMsg}
                                    </Message>
                                )}

                                <FormGroup>
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={inviteDetails.email}
                                        disabled
                                        readOnly
                                    />
                                </FormGroup>

                                <FormGroup>
                                    <Label htmlFor="name">Tu Nombre Completo</Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Ej: Juan Pérez"
                                        required
                                    />
                                </FormGroup>

                                {inviteDetails.organization?.plan === 'ong' && (
                                    <FormGroup>
                                        <Label htmlFor="ongName">Nombre de la ONG</Label>
                                        <Input
                                            id="ongName"
                                            type="text"
                                            value={ongName}
                                            onChange={(e) => setOngName(e.target.value)}
                                            placeholder="Ingrese el nombre de la ONG"
                                            required
                                        />
                                    </FormGroup>
                                )}

                                <FormGroup>
                                    <Label htmlFor="phone">Número de Teléfono</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="+54 9 11 ..."
                                        required
                                    />
                                </FormGroup>

                                <FormGroup>
                                    <Label>¿Cómo nos conociste?</Label>
                                    <DropdownContainer>
                                        <DropdownHeader
                                            $isOpen={isDropdownOpen}
                                            $hasValue={!!referralSource}
                                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        >
                                            {referralSource ? referralOptions.find(o => o.value === referralSource)?.label : 'Seleccionar...'}
                                            <FaChevronDown style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: '#94a3b8' }} />
                                        </DropdownHeader>

                                        {isDropdownOpen && (
                                            <>
                                                <div
                                                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 40 }}
                                                    onClick={() => setIsDropdownOpen(false)}
                                                />
                                                <DropdownList>
                                                    {referralOptions.map(option => (
                                                        <DropdownItem
                                                            key={option.value}
                                                            $isSelected={referralSource === option.value}
                                                            onClick={() => {
                                                                setReferralSource(option.value);
                                                                setIsDropdownOpen(false);
                                                            }}
                                                        >
                                                            {option.label}
                                                        </DropdownItem>
                                                    ))}
                                                </DropdownList>
                                            </>
                                        )}
                                    </DropdownContainer>
                                </FormGroup>

                                <Divider>Seguridad de la Cuenta</Divider>

                                <FormGroup>
                                    <Label htmlFor="password">Crea tu Contraseña</Label>
                                    <PasswordWrapper>
                                        <Input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Min. 6 caracteres"
                                            required
                                            minLength={6}
                                        />
                                        <ToggleButton type="button" onClick={() => setShowPassword(!showPassword)}>
                                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                                        </ToggleButton>
                                    </PasswordWrapper>
                                </FormGroup>

                                <FormGroup>
                                    <Label htmlFor="confirm_password">Repite la Contraseña</Label>
                                    <PasswordWrapper>
                                        <Input
                                            id="confirm_password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Confirmar contraseña"
                                            required
                                            minLength={6}
                                        />
                                    </PasswordWrapper>
                                </FormGroup>

                                <SubmitButton type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? 'Registrando...' : 'Ingresar a la Plataforma'}
                                </SubmitButton>
                            </Form>
                        </>
                    )}
                </Card>
            )}
        </Container>
    );
};

export default Register;
