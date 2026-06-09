import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useOrganization } from '../context/OrganizationContext';
import { 
  FaArrowLeft, 
  FaRocket, 
  FaCheckCircle, 
  FaSpinner, 
  FaDesktop, 
  FaDatabase, 
  FaShieldAlt, 
  FaCogs, 
  FaChartLine 
} from 'react-icons/fa';

// Keyframes for cinematic visual effects
const pulse = keyframes`
  0% { transform: scale(1); box-shadow: 0 0 20px rgba(74, 222, 128, 0.4), inset 0 0 15px rgba(74, 222, 128, 0.2); }
  50% { transform: scale(1.1); box-shadow: 0 0 40px rgba(74, 222, 128, 0.7), inset 0 0 25px rgba(74, 222, 128, 0.4); }
  100% { transform: scale(1); box-shadow: 0 0 20px rgba(74, 222, 128, 0.4), inset 0 0 15px rgba(74, 222, 128, 0.2); }
`;

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const bgAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

// Styled Components
const OnboardingContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  background: linear-gradient(-45deg, #020617, #0f172a, #064e3b, #022c22);
  background-size: 400% 400%;
  animation: ${bgAnimation} 15s ease infinite;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #f8fafc;
  font-family: 'Inter', -apple-system, sans-serif;
  overflow: hidden;
  padding: 20px;
`;

const ParticleContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  background-image: radial-gradient(rgba(74, 222, 128, 0.15) 1px, transparent 0);
  background-size: 40px 40px;
  opacity: 0.5;
`;

const WizardWrapper = styled(motion.div)`
  width: 100%;
  max-width: 650px;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 10;
`;

const GrowyOrbWrapper = styled.div`
  margin-bottom: 24px;
  animation: ${float} 6s ease-in-out infinite;
`;

const GrowyOrb = styled.div`
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: radial-gradient(circle, #86efac 0%, #22c55e 100%);
  border: 2px solid #4ade80;
  animation: ${pulse} 3s ease-in-out infinite;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 24px;
  font-weight: bold;
  color: #022c22;
  text-shadow: 0 0 10px rgba(74, 222, 128, 0.5);
`;

const GrowySpeech = styled.div`
  font-size: 20px;
  font-weight: 500;
  text-align: center;
  margin-bottom: 30px;
  min-height: 60px;
  line-height: 1.5;
  color: #f1f5f9;
  max-width: 550px;
`;

const OptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 12px;
  margin-bottom: 20px;
`;

const OptionCard = styled(motion.button)`
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  padding: 16px 24px;
  color: #e2e8f0;
  font-size: 15px;
  text-align: left;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  justify-content: space-between;
  align-items: center;

  &:hover {
    background: rgba(74, 222, 128, 0.08);
    border-color: rgba(74, 222, 128, 0.4);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(74, 222, 128, 0.1);
    color: #4ade80;
  }

  &:active {
    transform: translateY(0);
  }
`;

const FooterContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding-top: 20px;
`;

const BackButton = styled.button`
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: color 0.2s;

  &:hover {
    color: #e2e8f0;
  }
`;

const StepIndicator = styled.div`
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
`;

const ProgressBarContainer = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.05);
`;

const ProgressBar = styled(motion.div)`
  height: 100%;
  background: linear-gradient(90deg, #4ade80, #10b981);
  box-shadow: 0 0 10px rgba(74, 222, 128, 0.5);
`;

// Loader Screen Styled Components
const LoaderWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 500px;
`;

const LoaderHeader = styled.h2`
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 24px;
  color: #f1f5f9;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const TerminalBox = styled.div`
  width: 100%;
  background: #020617;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 24px;
  font-family: 'Fira Code', 'Courier New', monospace;
  font-size: 13px;
  color: #10b981;
  box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.8);
  margin-bottom: 30px;
  height: 220px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const LogLine = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const WaveOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 10000;
  background: radial-gradient(circle, rgba(74, 222, 128, 0.3) 0%, rgba(2, 6, 23, 0.95) 70%);
  pointer-events: none;
`;

// Types and Options definitions
interface OnboardingOption {
  text: string;
  value: string;
  next: string;
  action?: (modules: Record<string, boolean>) => Record<string, boolean>;
}

interface OnboardingQuestion {
  id: string;
  text: string;
  options: OnboardingOption[];
}

const QUESTIONS: Record<string, OnboardingQuestion> = {
  Q1: {
    id: 'Q1',
    text: 'Hola, soy Growy, tu asistente inteligente. Para personalizar tu espacio de trabajo y evitar cargarte de funciones innecesarias, cuéntame: ¿Cuál es la actividad principal de tu organización?',
    options: [
      { 
        text: 'Cultivo personal o autocultivo', 
        value: 'personal', 
        next: 'Q2',
        action: (mods) => ({
          ...mods,
          dispensary: false,
          patients: false,
          templates: false,
          appointments: false
        })
      },
      { 
        text: 'Club de cultivo / Asociación / Cooperativa', 
        value: 'club', 
        next: 'Q3',
        action: (mods) => mods
      },
      { 
        text: 'Clínica médica / Consultorio profesional', 
        value: 'clinica', 
        next: 'Q6',
        action: (mods) => ({
          ...mods,
          crops: false,
          esquejes: false,
          devices: false,
          madres: false,
          cruces_rd: false,
          laboratorio: false,
          dispensary: false,
          stock: false,
          insumos: false
        })
      },
      { 
        text: 'Dispensario puro / Comercio social (compra/venta)', 
        value: 'dispensario', 
        next: 'Q8',
        action: (mods) => ({
          ...mods,
          crops: false,
          esquejes: false,
          devices: false,
          madres: false,
          cruces_rd: false,
          laboratorio: false
        })
      }
    ]
  },
  Q2: {
    id: 'Q2',
    text: 'Entendido. ¿Cómo es tu espacio de cultivo actualmente?',
    options: [
      { text: 'Interior (Indoor) / Armario', value: 'indoor', next: 'Q4', action: (mods) => ({ ...mods, crops: true }) },
      { text: 'Exterior (Outdoor) / Invernadero', value: 'outdoor', next: 'Q4', action: (mods) => ({ ...mods, crops: true }) },
      { 
        text: 'No realizo cultivo (solo consumo / adquisición)', 
        value: 'no_cultivo', 
        next: 'Q8',
        action: (mods) => ({
          ...mods,
          crops: false,
          esquejes: false,
          devices: false,
          madres: false,
          cruces_rd: false,
          laboratorio: false
        })
      }
    ]
  },
  Q3: {
    id: 'Q3',
    text: 'Perfecto. ¿Qué técnica de cultivo principal implementan en la organización?',
    options: [
      { text: 'Sustrato / Suelo orgánico', value: 'sustrato', next: 'Q4', action: (mods) => ({ ...mods, crops: true }) },
      { text: 'Hidroponía / Aeroponía', value: 'hidro', next: 'Q4', action: (mods) => ({ ...mods, crops: true }) },
      { text: 'Mixto (Ambas técnicas)', value: 'mixto', next: 'Q4', action: (mods) => ({ ...mods, crops: true }) }
    ]
  },
  Q4: {
    id: 'Q4',
    text: '¡Interesante! ¿Utilizan sensores automáticos o medidores de clima inteligentes?',
    options: [
      { text: 'Sí, nos interesa conectar dispositivos inteligentes', value: 'yes', next: 'Q5', action: (mods) => ({ ...mods, devices: true }) },
      { text: 'No, registramos todo manualmente', value: 'no', next: 'Q5', action: (mods) => ({ ...mods, devices: false }) }
    ]
  },
  Q5: {
    id: 'Q5',
    text: '¿Elaboran extracciones o derivados propios (aceites, resinas, cremas) en un laboratorio?',
    options: [
      { text: 'Sí, producimos aceites y derivados en laboratorio', value: 'yes', next: 'Q8', action: (mods) => ({ ...mods, laboratorio: true }) },
      { text: 'No, cosechamos solo materia prima/flores', value: 'no', next: 'Q8', action: (mods) => ({ ...mods, laboratorio: false }) }
    ]
  },
  Q6: {
    id: 'Q6',
    text: 'Comprendido. ¿Atienden a los pacientes de forma particular o mediante convenios?',
    options: [
      { text: 'Pacientes particulares', value: 'particular', next: 'Q7' },
      { text: 'Con convenios / Obras sociales', value: 'convenio', next: 'Q7' }
    ]
  },
  Q7: {
    id: 'Q7',
    text: '¿El equipo médico necesita registrar historias clínicas detalladas y recetas especializadas?',
    options: [
      { text: 'Sí, requerimos fichas clínicas y plantillas de evolución', value: 'yes', next: 'Q9', action: (mods) => ({ ...mods, templates: true }) },
      { text: 'No, solo guardamos datos básicos y REPROCANN', value: 'no', next: 'Q9', action: (mods) => ({ ...mods, templates: false }) }
    ]
  },
  Q8: {
    id: 'Q8',
    text: '¿Se dispensan productos a los socios de la organización con límites mensuales de retiro?',
    options: [
      { text: 'Sí, dispensamos y controlamos límites de retiro', value: 'yes', next: 'Q7', action: (mods) => ({ ...mods, dispensary: true, patients: true, stock: true }) },
      { text: 'No, el retiro es libre o para consumo interno cerrado', value: 'no', next: 'Q9', action: (mods) => ({ ...mods, dispensary: false, patients: false, stock: false }) }
    ]
  },
  Q9: {
    id: 'Q9',
    text: '¿Desean llevar el control de los gastos de insumos y costos operativos de la organización?',
    options: [
      { text: 'Sí, queremos controlar gastos, compras e insumos', value: 'yes', next: 'Q10', action: (mods) => ({ ...mods, expenses: true, insumos: true }) },
      { text: 'No, solo nos interesa la trazabilidad operativa técnica', value: 'no', next: 'Q10', action: (mods) => ({ ...mods, expenses: false }) }
    ]
  },
  Q10: {
    id: 'Q10',
    text: 'Por último, ¿Cuántas personas van a gestionar la aplicación?',
    options: [
      { text: 'Trabajo solo', value: 'solo', next: 'END', action: (mods) => ({ ...mods, members: false }) },
      { text: 'Somos un equipo (diferentes roles y permisos)', value: 'equipo', next: 'END', action: (mods) => ({ ...mods, members: true }) }
    ]
  }
};

const DEFAULT_MODULES: Record<string, boolean> = {
  crops: true,
  esquejes: true,
  devices: true,
  madres: true,
  cruces_rd: true,
  laboratorio: true,
  dispensary: true,
  patients: true,
  templates: true,
  appointments: true,
  insumos: true,
  informes: true,
  stock: true,
  expenses: true,
  metrics: true,
  members: true
};

export const OnboardingWizard: React.FC = () => {
  const { currentOrganization, updateOnboardingState } = useOrganization();
  const [currentQuestionId, setCurrentQuestionId] = useState<string>('Q1');
  const [history, setHistory] = useState<string[]>([]);
  const [modules, setModules] = useState<Record<string, boolean>>(DEFAULT_MODULES);
  
  // Typewriter effect state
  const [displayedText, setDisplayedText] = useState<string>('');
  const [isTypewritingDone, setIsTypewritingDone] = useState<boolean>(false);
  
  // Onboarding phase state
  const [status, setStatus] = useState<'wizard' | 'processing' | 'finishing'>('wizard');
  const [logs, setLogs] = useState<Array<{ text: string; icon: React.ReactNode }>>([]);
  const [progressVal, setProgressVal] = useState<number>(10);

  const currentQuestion = QUESTIONS[currentQuestionId];

  // Typewriter effect triggered on question change
  useEffect(() => {
    if (!currentQuestion) return;
    setIsTypewritingDone(false);
    setDisplayedText('');
    
    let currentLength = 0;
    const fullText = currentQuestion.text;
    
    // Quick typing speed: 10ms per char
    const interval = setInterval(() => {
      currentLength++;
      setDisplayedText(fullText.slice(0, currentLength));
      if (currentLength >= fullText.length) {
        clearInterval(interval);
        setIsTypewritingDone(true);
      }
    }, 10);

    return () => clearInterval(interval);
  }, [currentQuestionId]);

  // Update progress bar
  useEffect(() => {
    // Estimate step progress based on history size
    const stepCount = history.length + 1;
    const estimatedProgress = Math.min((stepCount / 10) * 100, 100);
    setProgressVal(estimatedProgress);
  }, [history, currentQuestionId]);

  const handleOptionSelect = (option: OnboardingOption) => {
    // Process module mutation if present
    let nextModules = { ...modules };
    if (option.action) {
      nextModules = option.action(nextModules);
      setModules(nextModules);
    }

    if (option.next === 'END') {
      triggerProcessing(nextModules);
    } else {
      setHistory((prev) => [...prev, currentQuestionId]);
      setCurrentQuestionId(option.next);
    }
  };

  const handleBack = () => {
    if (history.length === 0) return;
    const prevHistory = [...history];
    const prevId = prevHistory.pop()!;
    setHistory(prevHistory);
    setCurrentQuestionId(prevId);
  };

  const triggerProcessing = (finalModules: Record<string, boolean>) => {
    setStatus('processing');
    
    const logsSequence = [
      { text: 'Analizando respuestas del diagnóstico...', icon: <FaChartLine /> },
      { text: 'Aislando base de datos con multi-inquilino RLS...', icon: <FaShieldAlt /> },
      { text: 'Modulando menú de navegación lateral...', icon: <FaDesktop /> },
      { text: 'Configurando límites operativos y licencias...', icon: <FaCogs /> },
      { text: 'Guardando configuración en la nube de Supabase...', icon: <FaDatabase /> },
      { text: '¡Espacio personalizado creado con éxito!', icon: <FaCheckCircle /> }
    ];

    let currentLogIndex = 0;
    
    const addLogInterval = setInterval(() => {
      if (currentLogIndex < logsSequence.length) {
        const nextLog = logsSequence[currentLogIndex];
        setLogs((prev) => [...prev, nextLog]);
        currentLogIndex++;
      } else {
        clearInterval(addLogInterval);
        
        // Final transition effect
        setTimeout(async () => {
          setStatus('finishing');
          
          // Persist settings in database via organization context
          try {
            await updateOnboardingState(true, finalModules);
          } catch (err) {
            console.error('Error saving onboarding state:', err);
          }
        }, 1500);
      }
    }, 800);
  };

  if (status === 'finishing') {
    return (
      <AnimatePresence>
        <WaveOverlay
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 3, opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </AnimatePresence>
    );
  }

  return (
    <OnboardingContainer>
      <ParticleContainer />
      
      <AnimatePresence mode="wait">
        {status === 'wizard' ? (
          <WizardWrapper
            key="wizard"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <GrowyOrbWrapper>
              <GrowyOrb>G</GrowyOrb>
            </GrowyOrbWrapper>

            <GrowySpeech>
              {displayedText}
            </GrowySpeech>

            <OptionsContainer>
              {currentQuestion?.options.map((opt, i) => (
                <OptionCard
                  key={opt.value}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 + 0.1 }}
                  onClick={() => isTypewritingDone && handleOptionSelect(opt)}
                  disabled={!isTypewritingDone}
                  style={{ cursor: isTypewritingDone ? 'pointer' : 'default', opacity: isTypewritingDone ? 1 : 0.7 }}
                >
                  <span>{opt.text}</span>
                  <FaRocket style={{ opacity: 0.3 }} />
                </OptionCard>
              ))}
            </OptionsContainer>

            <FooterContainer>
              <BackButton onClick={handleBack} disabled={history.length === 0} style={{ opacity: history.length === 0 ? 0.3 : 1 }}>
                <FaArrowLeft /> Volver
              </BackButton>
              <StepIndicator>
                Progreso de diagnóstico: {Math.round(progressVal)}%
              </StepIndicator>
            </FooterContainer>

            <ProgressBarContainer>
              <ProgressBar
                initial={{ width: 0 }}
                animate={{ width: `${progressVal}%` }}
                transition={{ duration: 0.3 }}
              />
            </ProgressBarContainer>
          </WizardWrapper>
        ) : (
          <WizardWrapper
            key="loader"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <LoaderWrapper>
              <LoaderHeader>
                <FaSpinner className="fa-spin" style={{ color: '#4ade80' }} />
                Configurando tu espacio
              </LoaderHeader>
              
              <TerminalBox>
                {logs.map((log, index) => log && (
                  <LogLine
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <span style={{ color: '#64748b' }}>[{new Date().toLocaleTimeString()}]</span>
                    <span style={{ color: '#4ade80', display: 'flex', alignItems: 'center' }}>
                      {log.icon}
                    </span>
                    <span>{log.text}</span>
                  </LogLine>
                ))}
              </TerminalBox>
            </LoaderWrapper>
          </WizardWrapper>
        )}
      </AnimatePresence>
    </OnboardingContainer>
  );
};
