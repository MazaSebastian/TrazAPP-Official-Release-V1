import React, { useEffect, useState, useRef } from 'react';
import styled from 'styled-components';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { inviteService } from '../services/inviteService';
import { useAuth } from '../context/AuthContext';
import { FaCheckCircle, FaExclamationTriangle, FaEye, FaEyeSlash, FaArrowRight } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

import Antigravity from '../components/Antigravity';
import Aurora from '../components/Aurora';
import BlurText from '../components/BlurText';
import SplitText from '../components/SplitText';
import ShinyText from '../components/ShinyText';
import StarBorder from '../components/StarBorder';

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: #020617;
  padding: 2rem 1rem;
  position: relative;
  overflow: hidden; /* Desktop view */
  color: #f8fafc;
  
  @media (max-width: 768px) {
    overflow-y: auto; /* Allow scroll on very small mobile screens */
    /* Removed padding-top and flex-start to allow natural center flex */
    min-height: 100svh; /* use svh for better iOS Safari handling */
  }
  
  /* Shared Tailwind-like utility classes */
  .text-4xl { font-size: 2.25rem; line-height: 2.5rem; }
  .text-5xl { font-size: 3rem; line-height: 1; }
  .text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
  .text-2xl { font-size: 1.5rem; line-height: 2rem; }
  .font-bold { font-weight: 700; }
  .font-semibold { font-weight: 600; }
  .text-green-400 { color: #4ade80; }
  .mb-12 { margin-bottom: 3rem; }
  .text-center { text-align: center; }
`;

const ContentWrapper = styled.div`
  width: 100%;
  max-width: 800px;
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-grow: 1; /* Allow to take up remaining space in Container */
  
  @media (max-width: 768px) {
    /* Explicitly take up remaining height to give absolute children room to center */
    min-height: calc(100svh - 4rem);
  }
`;

const StepContainer = styled(motion.div)`
  position: absolute;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const InputCardWrapper = styled.div`
  width: 100%;
  max-width: 400px;
  position: relative;
  
  .star-border-container {
    width: 100%;
    display: block;
    border-radius: 1rem !important;
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(24px);
    box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .inner-content {
    background: transparent !important;
    border: none !important;
    padding: 0 !important;
    text-align: left !important;
    display: flex;
    align-items: center;
    border-radius: inherit;
  }
`;

const StyledInput = styled.input`
  flex: 1;
  background: transparent;
  border: none;
  padding: 1rem 1.5rem;
  color: #f8fafc;
  font-size: 1.125rem;
  font-weight: 500;
  outline: none;
  text-align: center;

  &:focus, &:focus-visible {
    outline: none !important;
    box-shadow: none !important;
    border: none !important;
  }

  &::placeholder {
    color: #64748b;
    font-weight: 400;
  }
  
  &:disabled {
    color: #94a3b8;
  }
`;

const IconButton = styled.button`
  background: #22c55e;
  border: none;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-right: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  
  &:hover:not(:disabled) {
    background: #16a34a;
    transform: scale(1.05);
  }
  
  &:disabled {
    background: #334155;
    color: #64748b;
    cursor: not-allowed;
    transform: none;
  }
`;

const ValidationButton = styled.button`
  margin-top: 2rem;
  padding: 0.8rem 2rem;
  background: rgba(34, 197, 94, 0.1); /* Subtle transparent green */
  border: 1px solid rgba(34, 197, 94, 0.4);
  color: #4ade80;
  font-size: 1.1rem;
  font-weight: 500;
  border-radius: 3rem; /* Pill shape */
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);

  &:hover {
    background: rgba(34, 197, 94, 0.2);
    border-color: rgba(34, 197, 94, 0.8);
    box-shadow: 0 0 20px rgba(34, 197, 94, 0.3);
    color: #fff;
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const PasswordToggle = styled.button`
  background: none;
  border: none;
  color: #94a3b8;
  padding: 0 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: #f8fafc;
  }
`;

const SummaryCard = styled.div`
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(34, 197, 94, 0.3);
  padding: 2.5rem 2rem;
  border-radius: 1.5rem;
  backdrop-filter: blur(24px);
  width: 100%;
  max-width: 500px;
  box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  
  @media (max-width: 768px) {
    padding: 1.5rem 1.25rem;
    gap: 0.8rem;
    border-radius: 1rem;
  }
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.1);
  padding-bottom: 1rem;
  
  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
  
  .label {
    color: #94a3b8;
    font-size: 0.95rem;
  }
  
  .value {
    color: #f8fafc;
    font-weight: 500;
    font-size: 1.05rem;
  }
  
  .value.highlight {
    color: #4ade80;
    font-weight: 600;
  }

  @media (max-width: 768px) {
    padding-bottom: 0.75rem;
    
    .label {
      font-size: 0.85rem;
    }
    
    .value {
      font-size: 0.95rem;
    }
  }
`;

const Register: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { user } = useAuth();

  const [status, setStatus] = useState<'validating' | 'invalid'>('validating');
  const [errorMsg, setErrorMsg] = useState('');
  const [inviteDetails, setInviteDetails] = useState<any>(null);

  // Flow State
  // 0: Validating
  // 1: ¡Hola!
  // 2: ¡Bienvenido a TrazAPP!
  // 3: Name Input
  // 4: Email Input (Confirmation)
  // 5: Phone Input
  // 6: Password Input
  // 7: ¡Excelente!
  // 8: Configuring / API Call
  // 9: Success
  const [step, setStep] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showSummaryPassword, setShowSummaryPassword] = useState(false);

  const [data, setData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Only auto-redirect if the user is already logged in before starting the registration flow
    if (user && step === 0) {
      navigate('/', { replace: true });
    }
  }, [user, navigate, step]);

  // Initial Validation
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setStatus('invalid');
        setErrorMsg('No se proporcionó un token de invitación válido.');
        return;
      }

      try {
        const invite = await inviteService.getInviteByToken(token);
        if (!invite || invite.status !== 'pending' || new Date(invite.expires_at) < new Date()) {
          setStatus('invalid');
          setErrorMsg('La invitación no existe, ha expirado o ya fue utilizada.');
          return;
        }

        setInviteDetails(invite);
        setData(prev => ({ ...prev, email: invite.email }));

        // Begin the cinematic flow smoothly
        setTimeout(() => setStep(1), 1000);
      } catch (err: any) {
        setStatus('invalid');
        setErrorMsg('Error al validar invitación.');
      }
    };
    validateToken();
  }, [token]);

  // Auto-advance cinematic text steps
  useEffect(() => {
    if (step === 1) {
      setTimeout(() => setStep(2), 2500); // 1.5s reading time + 1s split animation
    } else if (step === 2) {
      setTimeout(() => setStep(3), 3000);
    } else if (step === 8) {
      setTimeout(() => setStep(9), 3500);
    } else if (step === 9) {
      // Delay the actual API call logic by 1.2s to allow the ShinyText (Step 9) 
      // to smoothly scale and blur in via AnimatePresence before we freeze the JS thread or calculate time.
      setTimeout(() => {
        submitRegistration();
      }, 1200);
    }
  }, [step]);

  // Auto-fill and focus
  useEffect(() => {
    if (step === 3 || step === 5 || step === 6) {
      setInputValue('');
      setTimeout(() => inputRef.current?.focus(), 1500); // wait for text to animate then input to appear
    } else if (step === 4) {
      setInputValue(data.email);
    }
  }, [step, data.email]);

  const handleNext = () => {
    if (step === 3) {
      if (!inputValue.trim()) return;
      setData(prev => ({ ...prev, name: inputValue.trim() }));
      setStep(4);
    } else if (step === 4) {
      setStep(5);
    } else if (step === 5) {
      if (!inputValue.trim()) return;
      setData(prev => ({ ...prev, phone: inputValue.trim() }));
      setStep(6);
    } else if (step === 6) {
      if (inputValue.length < 6) return;
      setData(prev => ({ ...prev, password: inputValue }));
      setStep(7);
    }
  };

  const submitRegistration = async () => {
    try {
      // Record start time to enforce a 10-second cinematic delay for the ShinyText step
      const startTime = Date.now();
      let userId = '';

      // TACTIC: Attempt signIn first to recover orphaned users from previous failed attempts
      // due to the old DB bugs. This bypasses the Fake UUID (Email Enumeration Protection) issue of Supabase.
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      });

      if (signInData?.user) {
        userId = signInData.user.id;
        console.log("Recuperado usuario huérfano de intento previo, procediendo a unirse a la organización...");
      } else {
        // Standard user creation
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/email-confirmed`,
            data: {
              name: data.name,
              full_name: data.name,
              role: inviteDetails.role === 'owner' ? 'admin' : inviteDetails.role
            }
          }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('No se pudo crear el usuario.');

        userId = authData.user.id;

        // WORKAROUND: Asynchronous Race Condition.
        // Supabase's internal Trigger "on_auth_user_created" needs a fraction of a second
        // to copy a purely NEW user into public.profiles BEFORE we can link it to the Organization.
        // We pause the JS thread for 1.5s to let the DB finish its automatic insert.
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      let rpcSuccess = false;
      let rpcAttempts = 0;
      let lastErrorMessage = '';

      // Retry mechanism up to 3 times in case the DB is under heavy load
      while (!rpcSuccess && rpcAttempts < 3) {
        rpcAttempts++;
        const { error: rpcError } = await supabase.rpc('accept_invitation', {
          p_token: token,
          p_user_id: userId,
          p_full_name: data.name,
          p_phone: data.phone,
          p_referral_source: 'other',
          p_ong_name: null
        });

        if (rpcError) {
          lastErrorMessage = rpcError.message;
          console.warn(`Intento ${rpcAttempts} fallido de RPC accept_invitation:`, rpcError);
          // Retry only on synchronization/profile missing errors
          if (rpcError.message.includes('no ha sido sincronizado') || rpcError.message.includes('not found') || rpcError.message.includes('No se encontró')) {
            if (rpcAttempts < 3) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          } else {
            // Hard DB errors (like missing tables) shouldn't be retried
            break;
          }
        } else {
          rpcSuccess = true;
        }
      }

      if (!rpcSuccess) {
        if (lastErrorMessage.includes('no ha sido sincronizado')) {
          throw new Error("El correo ya está registrado con otra contraseña. Por favor, usa la clave que elegiste la primera vez o recupera tu cuenta desde el Login.");
        }
        throw new Error(lastErrorMessage || 'Ocurrió un error de sincronización de datos con el servidor.');
      }

      // Enforce the 10 second minimum display for "Configurando tu sistema"
      const elapsed = Date.now() - startTime;
      const remainingTime = 10000 - elapsed;
      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }

      setStep(10);

      // Sign out the automatically created session so the user has to login manually
      await supabase.auth.signOut();

      // Removed automatic redirect to implement manual validation UI
      // setTimeout(() => navigate('/login?registered=true', { replace: true }), 3000);

    } catch (err: any) {
      setStatus('invalid');
      setErrorMsg(err.message || 'Ocurrió un error inesperado al registrarte.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNext();
    }
  };

  // Variants for AnimatePresence
  const stepVariants: any = {
    initial: { opacity: 0, scale: 0.95, filter: 'blur(10px)' },
    animate: { opacity: 1, scale: 1, filter: 'blur(0px)', transition: { duration: 0.8, ease: 'easeOut' } },
    exit: { opacity: 0, scale: 1.05, filter: 'blur(10px)', transition: { duration: 0.8, ease: 'easeIn' } }
  };

  if (status === 'invalid') {
    return (
      <Container>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.6 }}>
            <Aurora colorStops={["#199301", "#7cff67", "#037233"]} amplitude={1} blend={1} />
          </div>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.6 }}>
            <Antigravity
              count={1000}
              magnetRadius={10}
              ringRadius={15}
              waveSpeed={0.5}
              waveAmplitude={2.6}
              particleSize={0.5}
              lerpSpeed={0.17}
              color="#00ff59"
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
        <ContentWrapper style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '3rem', borderRadius: '1.5rem', backdropFilter: 'blur(24px)' }}>
          <img src="/logotrazappfix.png" alt="Logo" style={{ width: '80px', margin: '0 0 2rem' }} />
          <div style={{ background: 'rgba(127, 29, 29, 0.4)', color: '#fca5a5', border: '1px solid #ef4444', padding: '1rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center' }}>
            <FaExclamationTriangle style={{ marginRight: '0.5rem' }} />
            {errorMsg}
          </div>
          <button onClick={() => navigate('/login')} style={{ marginTop: '2rem', padding: '1rem 3rem', background: '#16a34a', color: 'white', borderRadius: '3rem', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '1.1rem' }}>Volver al Login</button>
        </ContentWrapper>
      </Container>
    );
  }

  // The Main Cinematic Render
  return (
    <Container>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.6 }}>
          <Aurora colorStops={["#199301", "#7cff67", "#037233"]} amplitude={1} blend={1} />
        </div>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.6 }}>
          <Antigravity
            count={1000}
            magnetRadius={10}
            ringRadius={15}
            waveSpeed={0.5}
            waveAmplitude={2.6}
            particleSize={0.5}
            lerpSpeed={0.17}
            color="#00ff59"
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

      <ContentWrapper style={{ minHeight: '300px' }} spellCheck={false} translate="no" data-gramm="false" data-gramm_editor="false" data-enable-grammarly="false">
        <AnimatePresence mode="wait">

          {step === 0 && (
            <StepContainer key="step0" variants={stepVariants} initial="initial" animate="animate" exit="exit">
              <img src="/logotrazappfix.png" alt="Logo" style={{ width: '120px' }} />
              {/* <BlurText text="Validando invitación..." delay={50} direction="bottom" className="text-xl text-green-400" /> */}
            </StepContainer>
          )}

          {step === 1 && (
            <StepContainer key="step1" variants={stepVariants} initial="initial" animate="animate" exit="exit">
              <SplitText text="¡Hola!" delay={40} className="text-5xl font-bold" />
            </StepContainer>
          )}

          {step === 2 && (
            <StepContainer key="step2" variants={stepVariants} initial="initial" animate="animate" exit="exit">
              <SplitText text="¡Bienvenido a TrazAPP!" delay={40} className="text-5xl font-bold text-center" />
            </StepContainer>
          )}

          {step === 3 && (
            <StepContainer key="step3" variants={stepVariants} initial="initial" animate="animate" exit="exit">
              <SplitText text="¿Podrías indicarnos tu nombre por favor?" delay={30} className="text-3xl font-semibold mb-12 text-center" />
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5, duration: 0.8 }}
                style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
              >
                <InputCardWrapper>
                  <StarBorder as="div" color="#4ade80" speed="7s" thickness={2.5}>
                    <StyledInput
                      ref={inputRef}
                      type="text"
                      placeholder="Ingresa tu nombre..."
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                    />
                    <IconButton onClick={handleNext} disabled={!inputValue.trim()}>
                      <FaArrowRight />
                    </IconButton>
                  </StarBorder>
                </InputCardWrapper>
              </motion.div>
            </StepContainer>
          )}

          {step === 4 && (
            <StepContainer key="step4" variants={stepVariants} initial="initial" animate="animate" exit="exit">
              <SplitText text={`Perfecto ${data.name.split(' ')[0]}. ¿Podrías confirmar tu email de acceso?`} delay={30} className="text-3xl font-semibold mb-12 text-center" />
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.8, duration: 0.8 }}
                style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                  <InputCardWrapper>
                    <StarBorder as="div" color="#4ade80" speed="7s" thickness={2.5}>
                      <StyledInput
                        disabled
                        type="email"
                        value={inputValue}
                        style={{ textAlign: 'center' }}
                      />
                    </StarBorder>
                  </InputCardWrapper>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2.2, duration: 0.6 }}
                  >
                    <ValidationButton onClick={handleNext}>
                      Sí, este es mi email de acceso
                    </ValidationButton>
                  </motion.div>
                </div>
              </motion.div>
            </StepContainer>
          )}

          {step === 5 && (
            <StepContainer key="step5" variants={stepVariants} initial="initial" animate="animate" exit="exit">
              <SplitText text="Por último, ¿podrías brindarme un número de teléfono?" delay={30} className="text-3xl font-semibold mb-12 text-center" />
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5, duration: 0.8 }}
                style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
              >
                <InputCardWrapper>
                  <StarBorder as="div" color="#4ade80" speed="7s" thickness={2.5}>
                    <StyledInput
                      ref={inputRef}
                      type="tel"
                      placeholder="+54 9 11..."
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                    />
                    <IconButton onClick={handleNext} disabled={!inputValue.trim()}>
                      <FaArrowRight />
                    </IconButton>
                  </StarBorder>
                </InputCardWrapper>
              </motion.div>
            </StepContainer>
          )}

          {step === 6 && (
            <StepContainer key="step6" variants={stepVariants} initial="initial" animate="animate" exit="exit">
              <SplitText text="Para proteger tu cuenta, crea una contraseña segura." delay={30} className="text-3xl font-semibold mb-12 text-center" />
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5, duration: 0.8 }}
                style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
              >
                <InputCardWrapper>
                  <StarBorder as="div" color="#4ade80" speed="7s" thickness={2.5}>
                    <StyledInput
                      ref={inputRef}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Mínimo 6 caracteres..."
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                    />
                    <PasswordToggle onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </PasswordToggle>
                    <IconButton onClick={handleNext} disabled={inputValue.length < 6}>
                      <FaArrowRight />
                    </IconButton>
                  </StarBorder>
                </InputCardWrapper>
              </motion.div>
            </StepContainer>
          )}

          {step === 7 && (
            <StepContainer key="step7" variants={stepVariants} initial="initial" animate="animate" exit="exit">
              <SplitText text="Verifica que tu información sea correcta" delay={30} className="text-2xl md:text-3xl font-semibold mb-4 md:mb-8 text-center" />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1, duration: 0.8 }}
                style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              >
                <SummaryCard>
                  <SummaryRow>
                    <span className="label">Nombre Completo</span>
                    <span className="value">{data.name}</span>
                  </SummaryRow>
                  <SummaryRow>
                    <span className="label">Teléfono</span>
                    <span className="value">{data.phone}</span>
                  </SummaryRow>
                  <SummaryRow>
                    <span className="label">Email</span>
                    <span className="value">{data.email}</span>
                  </SummaryRow>
                  <SummaryRow>
                    <span className="label">Contraseña</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="value">
                        {showSummaryPassword ? data.password : '•'.repeat(Math.max(6, data.password.length))}
                      </span>
                      <PasswordToggle
                        style={{ padding: '0 0.2rem', color: '#64748b' }}
                        onClick={() => setShowSummaryPassword(!showSummaryPassword)}
                      >
                        {showSummaryPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                      </PasswordToggle>
                    </div>
                  </SummaryRow>
                  <SummaryRow>
                    <span className="label">Plan Asignado</span>
                    <span className="value highlight" style={{ textTransform: 'capitalize' }}>
                      {inviteDetails?.organization?.plan || 'Free'}
                    </span>
                  </SummaryRow>
                  {inviteDetails?.organization?.plan?.toLowerCase().includes('ong') && (
                    <SummaryRow>
                      <span className="label">Organización</span>
                      <span className="value highlight">{inviteDetails?.organization?.name}</span>
                    </SummaryRow>
                  )}
                  <SummaryRow>
                    <span className="label">Inicio de Abono</span>
                    <span className="value">{new Date().toLocaleDateString('es-ES')}</span>
                  </SummaryRow>

                  <ValidationButton style={{ marginTop: '1rem', width: '100%' }} onClick={() => setStep(8)}>
                    Confirmar Acceso
                  </ValidationButton>
                </SummaryCard>
              </motion.div>
            </StepContainer>
          )}

          {step === 8 && (
            <StepContainer key="step8" variants={stepVariants} initial="initial" animate="animate" exit="exit">
              <SplitText text={`¡Excelente ${data.name.split(' ')[0]}, tengo todo listo!`} delay={30} className="text-5xl text-green-400 font-bold text-center" />
            </StepContainer>
          )}

          {step === 9 && (
            <StepContainer key="step9" variants={stepVariants} initial="initial" animate="animate" exit="exit">
              <ShinyText text="Configurando tu sistema, dame un segundo" speed={3} className="text-3xl font-semibold text-center" />
            </StepContainer>
          )}

          {step === 10 && (
            <StepContainer key="step10" variants={stepVariants} initial="initial" animate="animate" exit="exit">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              >
                <SummaryCard style={{ textAlign: 'center', alignItems: 'center', maxWidth: '450px' }}>
                  <FaCheckCircle style={{ color: '#4ade80', fontSize: '3.5rem', marginBottom: '0.5rem' }} />
                  <h3 style={{ fontSize: '1.4rem', color: '#f8fafc', fontWeight: 600, margin: '0.5rem 0' }}>¡Sistema configurado!</h3>
                  <p style={{ color: '#cbd5e1', fontSize: '1.05rem', lineHeight: '1.5', margin: '0.5rem 0 1.5rem', fontWeight: 400 }}>
                    <strong style={{ color: '#f8fafc' }}>{data.name.split(' ')[0]}</strong>, hemos enviado un mail de confirmación de acceso al sistema a tu casilla de correo.<br /><br />
                    Por favor verifica el email enviado para ingresar a tu cuenta de manera segura.<br /><br />
                    <strong style={{ fontSize: '1rem', color: '#facc15' }}>Revisa correo no deseado/spam en caso que no lo veas en tu bandeja de entrada 😉</strong>
                  </p>

                  <ValidationButton
                    style={{ width: '100%', marginTop: '0.5rem' }}
                    onClick={() => navigate('/login?registered=true', { replace: true })}
                  >
                    Entendido, ir al Login
                  </ValidationButton>
                </SummaryCard>
              </motion.div>
            </StepContainer>
          )}

        </AnimatePresence>
      </ContentWrapper>
    </Container>
  );
};

export default Register;
