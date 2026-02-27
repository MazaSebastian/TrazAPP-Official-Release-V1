import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { supabase } from '../services/supabaseClient';
import Aurora from '../components/Aurora';
import Antigravity from '../components/Antigravity';

const EmailConfirmed: React.FC = () => {
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

    useEffect(() => {
        // Escuchar cambios de sesión que ocurren automáticamente cuando la URL contiene hashes access_token de Supabase
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            // EVENTOS esperados: SIGNED_IN, TOKEN_REFRESHED, INITIAL_SESSION
            if (session?.user) {
                setStatus('success');
            }
        });

        const verifySession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) throw error;

                if (session?.user) {
                    setStatus('success');
                } else {
                    // Si llegamos sin hash ni sesión luego de un delay sutil, marcamos error o expirado.
                    // Le damos un pequeño buffer a Supabase auth listener para que parsee la URL.
                    setTimeout(() => {
                        if (status !== 'success') {
                            setStatus('error');
                        }
                    }, 1500);
                }
            } catch (err) {
                setStatus('error');
            }
        };

        verifySession();

        return () => subscription.unsubscribe();
    }, [status]);

    return (
        <Container>
            {/* Background Effects */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.6 }}>
                    <Aurora colorStops={["#199301", "#7cff67", "#037233"]} amplitude={1} blend={1} />
                </div>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.6 }}>
                    <Antigravity
                        count={500}
                        magnetRadius={10}
                        ringRadius={15}
                        waveSpeed={0.5}
                        waveAmplitude={2.6}
                        particleSize={0.5}
                        lerpSpeed={0.17}
                        color="#00ff59"
                    />
                </div>
            </div>

            <ContentWrapper>
                <LogoWrapper>
                    <img src="/trazapplogo.png" alt="TrazAPP Logo" />
                </LogoWrapper>

                {status === 'loading' && (
                    <GlassCard>
                        <LoadingPulse>Verificando tu conexión...</LoadingPulse>
                    </GlassCard>
                )}

                {status === 'success' && (
                    <GlassCard>
                        <SuccessIcon>
                            <FaCheckCircle />
                        </SuccessIcon>
                        <Title>¡Correo Confirmado!</Title>
                        <Subtitle>
                            Tu dirección de correo electrónico ha sido verificada exitosamente. Ya puedes ingresar a la plataforma y explorar tu escritorio.
                        </Subtitle>
                        <ActionButton onClick={() => navigate('/')}>
                            Ir a mi Panel de Control
                        </ActionButton>
                    </GlassCard>
                )}

                {status === 'error' && (
                    <GlassCard>
                        <ErrorIcon>
                            <FaExclamationTriangle />
                        </ErrorIcon>
                        <Title>El enlace ha expirado</Title>
                        <Subtitle>
                            Parece que este enlace de confirmación caducó o ya fue utilizado. Puedes solicitar uno nuevo intentando iniciar sesión.
                        </Subtitle>
                        <ActionButton onClick={() => navigate('/login')} className="error-btn">
                            Volver al Login
                        </ActionButton>
                    </GlassCard>
                )}

            </ContentWrapper>
        </Container>
    );
};

export default EmailConfirmed;

// Styled Components

const pulse = keyframes`
  0% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
  100% { opacity: 0.6; transform: scale(1); }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #020617;
  position: relative;
  overflow: hidden;
  padding: 2rem;
`;

const ContentWrapper = styled.div`
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 480px;
  animation: ${slideUp} 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
`;

const LogoWrapper = styled.div`
  margin-bottom: 3rem;
  
  img {
    width: 80px;
    height: auto;
    filter: drop-shadow(0 0 20px rgba(34, 197, 94, 0.4));
  }
`;

const GlassCard = styled.div`
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 3rem 2.5rem;
  border-radius: 1.5rem;
  width: 100%;
  text-align: center;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
`;

const LoadingPulse = styled.div`
  color: #94a3b8;
  font-size: 1.1rem;
  font-weight: 500;
  animation: ${pulse} 2s infinite ease-in-out;
`;

const SuccessIcon = styled.div`
  color: #22c55e;
  font-size: 4rem;
  filter: drop-shadow(0 0 20px rgba(34, 197, 94, 0.4));
  margin-bottom: 0.5rem;
`;

const ErrorIcon = styled.div`
  color: #f43f5e;
  font-size: 4rem;
  filter: drop-shadow(0 0 20px rgba(244, 63, 94, 0.4));
  margin-bottom: 0.5rem;
`;

const Title = styled.h1`
  color: #f8fafc;
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.02em;
`;

const Subtitle = styled.p`
  color: #94a3b8;
  font-size: 1.05rem;
  line-height: 1.6;
  margin: 0;
`;

const ActionButton = styled.button`
  background: #22c55e;
  color: #ffffff;
  border: none;
  padding: 1rem 2rem;
  border-radius: 0.75rem;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  margin-top: 1rem;
  box-shadow: 0 4px 15px rgba(34, 197, 94, 0.3);

  &:hover {
    background: #16a34a;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(34, 197, 94, 0.4);
  }

  &.error-btn {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #f8fafc;
    box-shadow: none;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.3);
    }
  }
`;
