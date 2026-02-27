import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { supabase } from '../services/supabaseClient';
import Aurora from '../components/Aurora';
import Antigravity from '../components/Antigravity';
import StarBorder from '../components/StarBorder';

const EmailConfirmed: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [countdown, setCountdown] = useState(5);

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
  }, []);

  // Effect for countdown redirect
  useEffect(() => {
    if (status === 'success') {
      if (countdown > 0) {
        const timerId = setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => clearTimeout(timerId);
      } else {
        navigate('/login', { replace: true });
      }
    }
  }, [status, countdown, navigate]);

  return (
    <Container>
      {/* Background Effects */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
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

      <ConfirmedCardWrapper>
        <StarBorder as="div" color="#4ade80" speed="7s" thickness={3}>
          <LogoWrapper>
            <img src="/logotrazappfix.png" alt="TrazApp Logo" />
          </LogoWrapper>

          {status === 'loading' && (
            <div className="status-content">
              <LoadingPulse>Verificando tu conexión...</LoadingPulse>
            </div>
          )}

          {status === 'success' && (
            <div className="status-content">
              <SuccessIcon>
                <FaCheckCircle />
              </SuccessIcon>
              <Title>¡Correo Confirmado!</Title>
              <Subtitle>
                ¡Hemos confirmado tu acceso al sistema! En breve serás redirigido a la pantalla de inicio de sesión para que puedas disfrutar de la experiencia TrazAPP.
              </Subtitle>
              <ActionButton disabled style={{ cursor: 'wait', opacity: 0.8 }}>
                Redirigiendo en {countdown} segundos...
              </ActionButton>
            </div>
          )}

          {status === 'error' && (
            <div className="status-content">
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
            </div>
          )}
        </StarBorder>
      </ConfirmedCardWrapper>
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

const ConfirmedCardWrapper = styled.div`
  width: 100%;
  max-width: 480px;
  position: relative;
  z-index: 10;
  animation: ${slideUp} 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  
  .star-border-container {
    width: 100%;
    display: block;
    border-radius: 1.5rem !important;
    
    background: rgba(15, 23, 42, 0.5);
    backdrop-filter: blur(24px);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  .inner-content {
    background: transparent !important;
    backdrop-filter: none !important;
    border: none !important;
    box-shadow: none !important;
    padding: 3rem !important;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    text-align: center !important;

    @media (max-width: 640px) {
      padding: 2rem 1.5rem !important;
    }
  }

  .status-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    width: 100%;
  }
`;

const LogoWrapper = styled.div`
  margin-bottom: 2rem;
  
  img {
    width: 120px;
    height: auto;
    filter: drop-shadow(0 6px 8px rgba(0,0,0,0.4));

    @media (max-width: 640px) {
      width: 100px;
    }
  }
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
