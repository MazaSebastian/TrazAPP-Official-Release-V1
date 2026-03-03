import React, { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { useLocation } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseClient';
import { FaPlay, FaCompass } from 'react-icons/fa';

const fadeIn = keyframes`
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(8px);
  z-index: 10000;
  display: flex;
  justify-content: center;
  align-items: center;
  animation: ${fadeIn} 0.3s ease-out;
`;

const WelcomeModal = styled.div`
  background: rgba(30, 41, 59, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1.5rem;
  padding: 3rem 2.5rem;
  max-width: 500px;
  width: 90%;
  text-align: center;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);

  h2 {
    color: #e2e8f0;
    font-size: 1.75rem;
    font-weight: 700;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
  }

  p {
    color: #94a3b8;
    line-height: 1.6;
    margin-bottom: 2.5rem;
    font-size: 1.05rem;
  }

  .button-group {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
`;

const PrimaryButton = styled.button`
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 0.75rem;
  padding: 1rem 1.5rem;
  font-weight: 600;
  font-size: 1.05rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s;
  box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.3);
  }
`;

const SecondaryButton = styled.button`
  background: rgba(255, 255, 255, 0.05);
  color: #94a3b8;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  padding: 1rem 1.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #e2e8f0;
  }
`;

export const GuidedTour: React.FC = () => {
    const { user, tourStepIndex, setTourStepIndex } = useAuth();
    const location = useLocation();
    const [run, setRun] = useState(false);
    const [showWelcomeModal, setShowWelcomeModal] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        console.log("GuidedTour check:", {
            has_completed_tour: user?.has_completed_tour,
            isDismissed,
            showWelcomeModal,
            run
        });

        // Only trigger when we explicitly know they haven't completed it
        if (user && user.has_completed_tour === false && !isDismissed && !showWelcomeModal && !run) {
            // Delay the modal slightly for smooth UX
            const timer = setTimeout(() => setShowWelcomeModal(true), 1500);
            return () => clearTimeout(timer);
        }
    }, [user, isDismissed, showWelcomeModal, run]);

    // Handle auto-advancing step 4 -> 5 when navigating to /crops
    useEffect(() => {
        if (location.pathname === '/crops' && tourStepIndex === 4) {
            setTourStepIndex(5);
        }
    }, [location.pathname, tourStepIndex, setTourStepIndex]);

    // Complete tour when user enters a crop details page (index 6 active)
    useEffect(() => {
        if (location.pathname.startsWith('/crops/') && location.pathname !== '/crops' && tourStepIndex === 6) {
            setRun(false);
            setTourStepIndex(0);
            markTourCompleted();
        }
    }, [location.pathname, tourStepIndex, setTourStepIndex]);

    const markTourCompleted = async () => {
        try {
            setIsDismissed(true);
            setShowWelcomeModal(false);
            setRun(false);

            if (user?.id) {
                await supabase
                    .from('profiles')
                    .update({ has_completed_tour: true })
                    .eq('id', user.id);
            }
        } catch (err) {
            console.error('Error marking tour completed:', err);
        }
    };

    const handleStartTour = () => {
        setShowWelcomeModal(false);
        setRun(true);
    };

    const handleSkipTour = () => {
        markTourCompleted();
    };

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { status, action, index, type } = data;
        const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

        if (type === 'step:after' || type === 'error:target_not_found') {
            // Normal progression unless we're on step 4 waiting for manual click
            if (index !== 4) {
                setTourStepIndex(index + (action === 'prev' ? -1 : 1));
            }
        }

        if (finishedStatuses.includes(status)) {
            setRun(false);
            setTourStepIndex(0);
            markTourCompleted();
        }
    };

    const steps: Step[] = [
        {
            target: '.tour-welcome',
            content: '¡Aquí comienza tu viaje! En el Dashboard inicial tendrás la visión global y en tiempo real de todos tus cultivos.',
            placement: 'bottom',
            disableBeacon: true,
        },
        {
            target: '.tour-stickies',
            content: 'Tablero de Notas (Stick-it). Utiliza este espacio para pegar recordatorios rápidos para ti o para tu equipo.',
            placement: 'bottom',
        },
        {
            target: '.tour-weather',
            content: 'Pronóstico del Clima. Desde Ajustes (Configuración) puedes cambiar tu ubicación exacta para obtener datos más precisos de tu área productiva.',
            placement: 'bottom',
        },
        {
            target: '.tour-countdowns',
            content: 'Próximos Cambios de Etapa. Aquí visualizarás el progreso diario de tus salas activas y sabrás exactamente cuándo pasar a floración o cosechar.',
            placement: 'top',
        },
        {
            target: '.tour-crops-link',
            content: 'Ahora simularemos una vuelta completa en nuestro sistema de cultivo. ¡Dale! Ve a la sección Cultivos y crea tu primer ciclo.',
            placement: 'right',
            spotlightClicks: true,
            styles: {
                buttonNext: {
                    display: 'none'
                }
            }
        },
        {
            target: '.tour-new-crop',
            content: '¡Estos son tus cultivos! Podés hacer de cuenta que son tus locaciones o lugares físicos (ej: Casa, Depósito).',
            placement: 'bottom',
        },
        {
            target: '.tour-first-crop-card',
            content: '¡Este es tu nuevo cultivo! Ingresa en él!',
            placement: 'bottom',
            spotlightClicks: true,
            styles: {
                buttonNext: {
                    display: 'none'
                }
            }
        }
    ];

    if (isDismissed || user?.has_completed_tour === true) {
        return null;
    }

    return (
        <>
            {showWelcomeModal && (
                <ModalOverlay>
                    <WelcomeModal>
                        <h2><FaCompass style={{ color: '#10b981' }} /> ¡Bienvenido a TrazAPP!</h2>
                        <p>
                            Estamos listos para gestionar tu primer ciclo productivo. ¿Te gustaría realizar un rápido tour de reconocimiento de 1 minuto, o prefieres comenzar a plantar por tu cuenta?
                        </p>
                        <div className="button-group">
                            <PrimaryButton onClick={handleStartTour}>
                                <FaPlay size={12} /> Iniciar Recorrido
                            </PrimaryButton>
                            <SecondaryButton onClick={handleSkipTour}>
                                Explorar por mi cuenta
                            </SecondaryButton>
                        </div>
                    </WelcomeModal>
                </ModalOverlay>
            )}

            <Joyride
                steps={steps}
                run={run}
                stepIndex={tourStepIndex}
                continuous
                showProgress
                showSkipButton
                callback={handleJoyrideCallback}
                styles={{
                    options: {
                        arrowColor: '#1e293b',
                        backgroundColor: '#1e293b',
                        overlayColor: 'rgba(15, 23, 42, 0.85)',
                        primaryColor: '#10b981',
                        textColor: '#e2e8f0',
                        zIndex: 10000,
                    },
                    tooltipContainer: {
                        textAlign: 'left'
                    },
                    buttonNext: {
                        backgroundColor: '#10b981',
                        borderRadius: '0.5rem',
                        padding: '0.5rem 1rem',
                        fontWeight: 600,
                    },
                    buttonBack: {
                        color: '#94a3b8',
                        marginRight: '0.5rem',
                    },
                    buttonSkip: {
                        color: '#94a3b8',
                        fontSize: '0.9rem',
                    }
                }}
                locale={{
                    back: 'Atrás',
                    close: 'Cerrar',
                    last: '¡Listo!',
                    next: 'Siguiente',
                    skip: 'Omitir'
                }}
            />
        </>
    );
};
