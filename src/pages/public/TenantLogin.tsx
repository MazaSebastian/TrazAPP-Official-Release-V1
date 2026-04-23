import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import Antigravity from '../../components/Antigravity';
import Aurora from '../../components/Aurora';
import BlurText from '../../components/BlurText';
import StarBorder from '../../components/StarBorder';
import { organizationService } from '../../services/organizationService';
import { Organization } from '../../types';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const messageReveal = keyframes`
  from { opacity: 0; transform: translateY(-5px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

const LoginContainer = styled.div`
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-color, #020617);
  padding: 1rem;
  position: relative;
  overflow-x: hidden;
  overflow-y: auto;
  animation: ${fadeIn} 0.5s ease-out forwards;
`;

const LoginCardWrapper = styled.div`
  width: 100%;
  max-width: 420px;
  position: relative;
  z-index: 10;
  
  .star-border-container {
    width: 100%;
    display: block;
    border-radius: 1.5rem !important;
    
    background: rgba(15, 23, 42, 0.4);
    backdrop-filter: blur(24px);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-top: 1px solid rgba(255, 255, 255, 0.15);
  }
  
  .inner-content {
    background: transparent !important;
    backdrop-filter: none !important;
    border: none !important;
    box-shadow: none !important;
    padding: 3rem !important;
    text-align: left !important;

    @media (max-width: 640px) {
      padding: 1.75rem 1rem !important;
    }
  }
`;

const Logo = styled.div`
  text-align: center;
  margin-bottom: 2rem;
  
  .icon-wrapper {
    width: 180px;
    height: 180px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1.5rem;
    background: rgba(255,255,255, 0.05);
    border-radius: 50%;
    padding: 1rem;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    @media (max-width: 640px) {
      width: 130px;
      height: 130px;
      margin: 0 auto 1rem;
    }
  }
  
  h1 {
    font-size: 1.875rem;
    font-weight: 800;
    color: var(--primary-color, #4ade80);
    margin-bottom: 0.5rem;
    letter-spacing: -0.025em;

    @media (max-width: 640px) {
      font-size: 1.5rem;
    }
  }
  
  p.welcome-subtitle {
    color: #94a3b8;
    font-size: 0.95rem;

    @media (max-width: 640px) {
      font-size: 0.85rem;
    }
  }
  
  .blur-text-container p {
    justify-content: center;
    font-size: 1.875rem;
    font-weight: 800;
    color: var(--primary-color, #4ade80);
    margin-bottom: 0.5rem;
    letter-spacing: -0.025em;

    @media (max-width: 640px) {
      font-size: 1.5rem;
    }
  }
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
    border-color: var(--primary-color, #22c55e);
    background: rgba(30, 41, 59, 0.8);
    box-shadow: 0 0 0 3px rgba(var(--primary-color-rgb, 34, 197, 94), 0.15);
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

const LoginButton = styled.button`
  width: 100%;
  padding: 0.875rem;
  background: var(--primary-color, #16a34a);
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 1rem;
  box-shadow: 0 4px 6px -1px rgba(var(--primary-color-rgb, 22, 163, 74), 0.2);

  &:hover {
    filter: brightness(1.1);
    transform: translateY(-1px);
    box-shadow: 0 10px 15px -3px rgba(var(--primary-color-rgb, 22, 163, 74), 0.3);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    background: #9ca3af;
    transform: none;
    box-shadow: none;
  }
`;

const ErrorMessage = styled.div`
  background: rgba(127, 29, 29, 0.2);
  border-left: 4px solid #ef4444;
  color: #fca5a5;
  padding: 0.75rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  animation: ${messageReveal} 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
`;

const TenantLogin: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [tenant, setTenant] = useState<Organization | null>(null);
    const [tenantLoading, setTenantLoading] = useState(true);

    const { login, user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        async function loadTenant() {
            if (!slug) return;
            const org = await organizationService.getOrganizationBySlug(slug);
            if (org) {
                setTenant(org);

                // Inject Theme Colors directly for the login page
                const root = document.documentElement;
                const hexToRgb = (hex: string) => {
                    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : null;
                };

                const primary = org.primary_color || '#a855f7';
                const secondary = org.secondary_color || '#7c3aed';

                root.style.setProperty('--primary-color', primary);
                root.style.setProperty('--secondary-color', secondary);
                root.style.setProperty('--primary-color-rgb', hexToRgb(primary) || '168, 85, 247');
                root.style.setProperty('--secondary-color-rgb', hexToRgb(secondary) || '124, 58, 237');
            }
            setTenantLoading(false);
        }
        loadTenant();
    }, [slug]);

    useEffect(() => {
        if (user && tenant) {
            if (user.role === 'partner') {
                navigate(`/${tenant.slug}/portal`, { replace: true });
            } else {
                navigate('/', { replace: true }); // Admins can go to generic dashboard
            }
        }
    }, [user, navigate, tenant]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const result = await login({ email, password });

            if (result.success) {
                // Redirection logic is handled dynamically by useEffect on 'user' resolution.
                // Wait momentarily to allow state update if necessary (although useEffect might catch it first).
                setTimeout(() => {
                    if (!user) {
                        // Safe default
                        navigate('/', { replace: true });
                    }
                }, 300);
            } else {
                setError(result.error || 'Credenciales inválidas. Intenta de nuevo.');
            }
        } catch (err) {
            console.error('Error en login:', err);
            setError('Error de conexión. Intenta más tarde.');
        } finally {
            setIsLoading(false);
        }
    };

    if (tenantLoading) {
        return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020617', color: '#fff' }}>Cargando portal...</div>;
    }

    if (!tenant) {
        return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020617', color: '#ef4444' }}>Portal de organización no encontrado. Verifica en enlace ingresado.</div>;
    }

    return (
        <LoginContainer>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.6 }}>
                    {/* Dynamic Aurora based on tenant colors */}
                    <Aurora colorStops={[tenant.primary_color || "#a855f7", tenant.secondary_color || "#7c3aed", "#020617"]} amplitude={1} blend={1} />
                </div>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.3 }}>
                    <Antigravity
                        count={800}
                        magnetRadius={10}
                        ringRadius={15}
                        waveSpeed={0.5}
                        waveAmplitude={2.6}
                        particleSize={0.5}
                        lerpSpeed={0.17}
                        color={tenant.primary_color || "#a855f7"}
                        autoAnimate={false}
                        particleVariance={0.8}
                        rotationSpeed={0.1}
                        depthFactor={0.9}
                        pulseSpeed={2.5}
                        particleShape="capsule"
                        fieldStrength={15}
                    />
                </div>
            </div>

            <LoginCardWrapper>
                <StarBorder as="div" color={tenant.primary_color || "#4ade80"} speed="7s" thickness={3}>
                    <Logo>
                        <div className="icon-wrapper">
                            <img src={tenant.logo_url || "/logotrazappfix.png"} alt={`${tenant.name} Logo`} style={{ filter: 'drop-shadow(0 6px 8px rgba(0,0,0,0.4))' }} />
                        </div>
                        <div className="blur-text-container">
                            <BlurText text={tenant.name} delay={50} animateBy="words" direction="bottom" />
                        </div>
                        <p className="welcome-subtitle">Portal exclusivo para socios de {tenant.name}</p>
                    </Logo>

                    <Form onSubmit={handleSubmit}>
                        {error && <ErrorMessage>{error}</ErrorMessage>}

                        <FormGroup>
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="socio@ejemplo.com"
                                required
                            />
                        </FormGroup>

                        <FormGroup>
                            <Label htmlFor="password">Contraseña</Label>
                            <PasswordWrapper>
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                />
                                <ToggleButton type="button" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </ToggleButton>
                            </PasswordWrapper>
                        </FormGroup>

                        <LoginButton type="submit" disabled={isLoading}>
                            {isLoading ? 'Accediendo...' : 'Ingresar al Club'}
                        </LoginButton>
                    </Form>

                </StarBorder>
            </LoginCardWrapper>

        </LoginContainer>
    );
};

export default TenantLogin;
