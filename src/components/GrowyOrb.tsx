import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { FaMicrophone, FaRobot, FaTimes, FaSeedling, FaMapMarkedAlt, FaTasks, FaStickyNote, FaTh, FaBox, FaMoneyBillWave, FaStethoscope, FaPrescriptionBottleAlt } from 'react-icons/fa';
import { growyService } from '../services/growyService';
import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';
import { supabase } from '../services/supabaseClient';
import { useOrganization } from '../context/OrganizationContext';

type GrowyState = 'idle' | 'listening' | 'processing' | 'speaking';

const pulseIdle = keyframes`
  0% { transform: scale(1); box-shadow: 0 0 8px rgba(0, 255, 136, 0.3); }
  50% { transform: scale(1.03); box-shadow: 0 0 16px rgba(0, 255, 136, 0.5); }
  100% { transform: scale(1); box-shadow: 0 0 8px rgba(0, 255, 136, 0.3); }
`;

const pulseListening = keyframes`
  0% { transform: scale(1); box-shadow: 0 0 10px rgba(255, 64, 129, 0.5); }
  50% { transform: scale(1.08); box-shadow: 0 0 20px rgba(255, 64, 129, 0.8); }
  100% { transform: scale(1); box-shadow: 0 0 10px rgba(255, 64, 129, 0.5); }
`;

const pulseProcessing = keyframes`
  0% { transform: rotate(0deg); border-top-color: #00ff88; }
  100% { transform: rotate(360deg); border-top-color: #ff4081; }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
`;

const typingPulse = keyframes`
  0%, 80%, 100% { transform: scale(0.4); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
`;

const OrbContainer = styled.div`
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
`;

const OrbButton = styled.button<{ $gState: GrowyState }>`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 2px solid rgba(0, 255, 136, 0.3);
  background: rgba(15, 23, 30, 0.9);
  color: white;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 22px;
  transition: all 0.3s ease;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  outline: none;
  will-change: transform, box-shadow;
  
  ${({ $gState }) => {
        switch ($gState) {
            case 'idle':
                return css`
          animation: ${pulseIdle} 3s infinite ease-in-out;
          color: #00ff88;
        `;
            case 'listening':
                return css`
          animation: ${pulseListening} 1.5s infinite ease-in-out;
          color: #ff4081;
          border-color: rgba(255, 64, 129, 0.5);
          background: rgba(255, 64, 129, 0.08);
        `;
            case 'processing':
                return css`
          border: 3px solid rgba(0, 255, 136, 0.2);
          border-top: 3px solid #00ff88;
          animation: ${pulseProcessing} 1s infinite linear;
          color: #fff;
        `;
            case 'speaking':
                return css`
          animation: ${pulseIdle} 1s infinite ease-in-out;
          color: #00bcd4;
          border-color: rgba(0, 188, 212, 0.5);
          box-shadow: 0 0 20px rgba(0, 188, 212, 0.4);
        `;
            default:
                return '';
        }
    }}

  &:hover {
    transform: scale(1.08);
    border-color: rgba(0, 255, 136, 0.6);
  }
`;

const ChatPanel = styled.div<{ $visible: boolean }>`
  position: absolute;
  bottom: 72px;
  right: 0;
  width: 400px;
  height: 540px;
  background: rgba(12, 17, 23, 0.92);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-radius: 20px;
  border: 1px solid rgba(0, 255, 136, 0.12);
  box-shadow:
    0 24px 80px rgba(0, 0, 0, 0.6),
    0 0 1px rgba(0, 255, 136, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
  display: ${({ $visible }) => ($visible ? 'flex' : 'none')};
  flex-direction: column;
  overflow: hidden;
  animation: ${slideUp} 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);

  @media (max-width: 480px) {
    width: calc(100vw - 24px);
    height: 70vh;
    right: -12px;
  }
`;

const ChatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(0, 255, 136, 0.03);
  flex-shrink: 0;

  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;

    .avatar {
      width: 36px;
      height: 36px;
      border-radius: 12px;
      background: linear-gradient(135deg, rgba(0, 255, 136, 0.15), rgba(0, 255, 136, 0.05));
      border: 1px solid rgba(0, 255, 136, 0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      color: #00ff88;
    }

    .info {
      .name {
        font-size: 15px;
        font-weight: 600;
        color: #fff;
        letter-spacing: 0.3px;
      }
      .status {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.4);
        display: flex;
        align-items: center;
        gap: 4px;
        .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #00ff88;
          box-shadow: 0 0 6px rgba(0, 255, 136, 0.6);
        }
      }
    }
  }

  .close-btn {
    width: 32px;
    height: 32px;
    border-radius: 10px;
    border: none;
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.4);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    &:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
    }
  }
`;

const MessageThread = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px 16px 8px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }
`;

const MessageBubble = styled.div<{ $isUser: boolean }>`
  display: flex;
  gap: 8px;
  flex-direction: ${({ $isUser }) => ($isUser ? 'row-reverse' : 'row')};
  align-items: flex-start;
  animation: ${slideUp} 0.3s ease;

  .bubble-avatar {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    margin-top: 2px;
    background: ${({ $isUser }) =>
        $isUser
            ? 'rgba(255, 255, 255, 0.08)'
            : 'linear-gradient(135deg, rgba(0, 255, 136, 0.12), rgba(0, 255, 136, 0.04))'
    };
    border: 1px solid ${({ $isUser }) =>
        $isUser ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 255, 136, 0.2)'
    };
    color: ${({ $isUser }) => ($isUser ? 'rgba(255,255,255,0.6)' : '#00ff88')};
  }

  .bubble-content {
    max-width: 75%;
    padding: 10px 14px;
    border-radius: ${({ $isUser }) =>
        $isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px'
    };
    font-size: 13.5px;
    line-height: 1.5;
    background: ${({ $isUser }) =>
        $isUser
            ? 'rgba(255, 255, 255, 0.07)'
            : 'rgba(0, 255, 136, 0.06)'
    };
    border: 1px solid ${({ $isUser }) =>
        $isUser ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 255, 136, 0.08)'
    };
    color: ${({ $isUser }) => ($isUser ? 'rgba(255,255,255,0.85)' : '#c8ffe0')};
    word-break: break-word;
    white-space: pre-wrap;
  }
`;

const TypingIndicator = styled.div`
  display: flex;
  gap: 4px;
  padding: 10px 14px;
  background: rgba(0, 255, 136, 0.06);
  border: 1px solid rgba(0, 255, 136, 0.08);
  border-radius: 16px 16px 16px 4px;
  width: fit-content;
  margin-left: 36px;

  span {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #00ff88;
    animation: ${typingPulse} 1.4s infinite ease-in-out;
    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }
`;



const ToastOverlay = styled.div<{ $visible: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: ${({ $visible }) => ($visible ? 'flex' : 'none')};
  justify-content: center;
  align-items: center;
  z-index: 10000;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: opacity 0.3s ease;
`;

const ToastModal = styled.div`
  background: var(--surface-color, #1e1e1e);
  border: 1px solid #00ff88;
  border-radius: 16px;
  padding: 24px;
  width: 90%;
  max-width: 450px;
  box-shadow: 0 20px 50px rgba(0, 255, 136, 0.2);
  display: flex;
  flex-direction: column;
  gap: 16px;
  transform: translateY(0);
  animation: slideUpToast 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);

  @keyframes slideUpToast {
    from { transform: translateY(50px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  .toast-header {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 20px;
    font-weight: bold;
    color: #fff;
    border-bottom: 1px solid rgba(255,255,255,0.1);
    padding-bottom: 12px;

    .icon-warn { color: #fbbf24; }
  }

  .toast-body {
    background: rgba(0,0,0,0.3);
    padding: 16px;
    border-radius: 8px;
    color: #cbd5e1;
    font-family: 'Fira Code', monospace;
    font-size: 14px;
    white-space: pre-wrap;
    max-height: 300px;
    overflow-y: auto;
  }

  .toast-footer {
    display: flex;
    gap: 12px;
    margin-top: 8px;

    button {
      flex: 1;
      padding: 12px;
      border-radius: 8px;
      font-weight: bold;
      font-size: 16px;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }

    .btn-cancel {
      background: rgba(2ef, 68, 68, 0.1);
      color: #ef4444;
      border: 1px solid rgba(239, 68, 68, 0.3);
      &:hover:not(:disabled) { background: #ef4444; color: white; }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }

    .btn-confirm {
      background: #00ff88;
      color: #000;
      &:hover:not(:disabled) { background: #00e67a; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,255,136,0.3); }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }
  }
`;

const InputBar = styled.form`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  gap: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(0, 0, 0, 0.15);
  flex-shrink: 0;

  .input-actions {
    display: flex;
    gap: 4px;

    button {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      border: none;
      background: rgba(255, 255, 255, 0.05);
      color: rgba(255, 255, 255, 0.4);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      transition: all 0.2s;
      &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.1);
        color: #00ff88;
      }
      &:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }
    }
  }

  textarea {
    flex: 1;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    color: #fff;
    font-size: 13.5px;
    outline: none;
    padding: 10px 14px;
    resize: none;
    font-family: inherit;
    line-height: 1.4;
    transition: border-color 0.2s;
    max-height: 100px;

    &:focus {
      border-color: rgba(0, 255, 136, 0.3);
    }
    &::placeholder {
      color: rgba(255, 255, 255, 0.25);
    }
    &::-webkit-scrollbar { width: 3px; }
    &::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.15);
      border-radius: 3px;
    }
  }

  .send-btn {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    border: none;
    background: #00ff88;
    color: #0a0f14;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: bold;
    transition: all 0.2s;
    flex-shrink: 0;
    &:hover:not(:disabled) {
      background: #00e67a;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 255, 136, 0.3);
    }
    &:disabled {
      background: rgba(255, 255, 255, 0.06);
      color: rgba(255, 255, 255, 0.15);
      cursor: not-allowed;
    }
  }
`;

// Acciones de bajo riesgo que se auto-ejecutan sin confirmación (Tier 3: #13)
const LOW_RISK_ACTIONS = ['create_task', 'create_sticky', 'create_room_sticky', 'toggle_task_completion'];

// Lightweight Markdown → HTML for chat bubbles
const renderMarkdown = (text: string): string => {
    return text
        // Bold: **text** → <strong>
        .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#00ff88;font-weight:600">$1</strong>')
        // Bullet lists: lines starting with * or -
        .replace(/^[\*\-]\s+(.+)$/gm, '<div style="display:flex;gap:6px;margin:3px 0"><span style="color:#00ff88;flex-shrink:0">•</span><span>$1</span></div>')
        // Line breaks
        .replace(/\n/g, '<br/>');
};

export const GrowyOrb: React.FC = () => {
    const { currentOrganization } = useOrganization();

    const [growyState, setGrowyState] = useState<GrowyState>('idle');
    const [transcript, setTranscript] = useState('');
    const [textInput, setTextInput] = useState('');
    const [response, setResponse] = useState('');
    const [actionProposals, setActionProposals] = useState<any[]>([]);
    const [isExecutingAction, setIsExecutingAction] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [errorToast, setErrorToast] = useState<string | null>(null);
    const [chatHistory, setChatHistory] = useState<{ role: string, content: string }[]>([]);
    const [visibleMessages, setVisibleMessages] = useState<{ role: 'user' | 'growy', content: string }[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // Tier 3 #14: Exponer trigger global para @Growy en stickies
    useEffect(() => {
        (window as any).__growyTrigger = (prompt: string) => {
            setIsModalOpen(true);
            setTextInput(prompt);
            // Small delay to allow modal to open before processing
            setTimeout(() => {
                handleFinalTranscript(prompt);
            }, 300);
        };
        return () => { delete (window as any).__growyTrigger; };
    }, [currentOrganization]);

    const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);
    const deepgramRef = useRef<any>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Audio Visualizer refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animFrameRef = useRef<number>(0);

    const clearSilenceTimer = () => {
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
        }
    };

    const startSilenceTimer = (currentTranscript: string) => {
        clearSilenceTimer();
        silenceTimerRef.current = setTimeout(() => {
            console.log("Silencio prolongado detectado (3s). Cerrando micrófono de forma segura.");
            // Si hay texto acumulado, lo enviamos. Si no, simplemente se apaga.
            stopListening(currentTranscript.trim());
        }, 3000);
    };

    const stopListening = (finalText?: string) => {
        const textToProcess = finalText || transcript;
        console.log("Deteniendo escucha. Texto a procesar:", textToProcess);

        // Limpiar Timer
        clearSilenceTimer();

        // Limpiar MediaRecorder
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }

        // APAGAR STREAM FÍSICO SIEMPRE
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        // Cleanup audio visualizer
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(() => { });
        }
        audioContextRef.current = null;
        analyserRef.current = null;

        // Limpiar WebSockets Deepgram
        if (deepgramRef.current) {
            deepgramRef.current.finish();
            deepgramRef.current = null;
        }

        // Procesar si hay texto válido genuino
        if (textToProcess && textToProcess.trim() !== '' && textToProcess !== 'Escuchando...') {
            console.log("Enviando a Gemini:", textToProcess);
            handleFinalTranscript(textToProcess);
        } else {
            console.log("Texto vacío o inválido. Cancelando.");
            setGrowyState('idle');
            setTranscript('');
        }
    };

    const [deepgramToken, setDeepgramToken] = useState<string | null>(null);

    // Pre-obtener el token de Deepgram en cuanto se abre el modal para reducir la latencia al hablar
    useEffect(() => {
        if (isModalOpen && !deepgramToken) {
            supabase.functions.invoke('deepgram-token').then(({ data, error }) => {
                if (!error && data?.key) {
                    setDeepgramToken(data.key);
                }
            }).catch(console.error);
        }
    }, [isModalOpen, deepgramToken]);

    const startListening = async () => {
        try {
            setGrowyState('listening');
            setIsModalOpen(true);
            setResponse('');
            setActionProposals([]);

            // 1. Pedir permisos de micrófono INMEDIATAMENTE tras el click (Requerido por Safari/iOS)
            let stream: MediaStream;
            try {
                stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                streamRef.current = stream; // Guardar referencia para forzar apagado
            } catch (micError: any) {
                console.error("Mic Error:", micError);
                throw new Error("Permiso de micrófono denegado. Por favor, habilítalo en la configuración de tu navegador.");
            }

            // 2. Obtener Token Temporal (pre-fetched o fallback)
            let tokenToUse = deepgramToken;
            if (!tokenToUse) {
                const { data: tokenData, error } = await supabase.functions.invoke('deepgram-token');
                if (error || !tokenData?.key) {
                    throw new Error("No se pudo obtener el token de voz seguro");
                }
                tokenToUse = tokenData.key;
                setDeepgramToken(tokenToUse);
            }

            // 3. Conectar a Deepgram WebSocket
            const deepgram = createClient(tokenToUse as string);
            const connection = deepgram.listen.live({
                model: 'nova-3',
                language: 'es', // Latino / Español
                smart_format: true,
                endpointing: 2500, // 2.5s de silencio significa final de oración
                interim_results: true,
            });

            deepgramRef.current = connection;

            connection.on(LiveTranscriptionEvents.Open, () => {
                setTranscript('Escuchando...');

                // Iniciar contador de silencio apenas abre
                startSilenceTimer('');

                // Setup Web Audio API visualizer
                try {
                    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                    const analyser = audioCtx.createAnalyser();
                    analyser.fftSize = 128;
                    analyser.smoothingTimeConstant = 0.8;
                    const source = audioCtx.createMediaStreamSource(stream);
                    source.connect(analyser);
                    audioContextRef.current = audioCtx;
                    analyserRef.current = analyser;

                    // Start canvas animation
                    const drawSpectrum = () => {
                        if (!analyserRef.current || !canvasRef.current) return;
                        const canvas = canvasRef.current;
                        const ctx = canvas.getContext('2d');
                        if (!ctx) return;

                        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
                        analyserRef.current.getByteFrequencyData(data);

                        const w = canvas.width;
                        const h = canvas.height;
                        ctx.clearRect(0, 0, w, h);

                        const barCount = data.length;
                        const barWidth = w / barCount;
                        const centerY = h / 2;

                        for (let i = 0; i < barCount; i++) {
                            const value = data[i] / 255;
                            const barH = value * centerY * 0.9;

                            // Gradient from green to cyan based on frequency
                            const hue = 140 + (i / barCount) * 40;
                            const alpha = 0.4 + value * 0.6;
                            ctx.fillStyle = `hsla(${hue}, 100%, 60%, ${alpha})`;

                            // Mirror bars (top and bottom from center)
                            const x = i * barWidth;
                            ctx.fillRect(x, centerY - barH, barWidth - 1, barH);
                            ctx.fillRect(x, centerY, barWidth - 1, barH);

                            // Glow effect on peaks
                            if (value > 0.5) {
                                ctx.shadowColor = `hsla(${hue}, 100%, 60%, 0.5)`;
                                ctx.shadowBlur = 8;
                                ctx.fillRect(x, centerY - barH, barWidth - 1, 2);
                                ctx.fillRect(x, centerY + barH - 2, barWidth - 1, 2);
                                ctx.shadowBlur = 0;
                            }
                        }

                        // Center line glow
                        ctx.strokeStyle = 'rgba(0, 255, 136, 0.15)';
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(0, centerY);
                        ctx.lineTo(w, centerY);
                        ctx.stroke();

                        animFrameRef.current = requestAnimationFrame(drawSpectrum);
                    };
                    drawSpectrum();
                } catch (vizErr) {
                    console.warn('Audio visualizer init failed:', vizErr);
                }

                const mediaRecorder = new MediaRecorder(stream);
                mediaRecorderRef.current = mediaRecorder;

                mediaRecorder.addEventListener('dataavailable', (event) => {
                    if (event.data.size > 0 && connection.getReadyState() === 1) {
                        connection.send(event.data);
                    }
                });

                mediaRecorder.start(100); // Enviar fragmentos de audio cada 100ms para capturar inicio rápido
            });

            let fullTranscript = '';

            connection.on(LiveTranscriptionEvents.Transcript, (data) => {
                const sentence = data.channel.alternatives[0].transcript;

                // Ignorar empty returns primero
                if (sentence && sentence.trim() !== '') {
                    if (data.is_final) {
                        fullTranscript += sentence + ' ';
                        setTranscript(fullTranscript);
                    } else {
                        setTranscript(fullTranscript + sentence);
                    }
                    // Reiniciar el contador de silencio porque el usuario sigue hablando
                    startSilenceTimer(fullTranscript);
                }

                // Enviar transcripción completa cuando Deepgram detecta fin de habla
                if (data.speech_final && growyState === 'listening') {
                    // Incluir la frase actual antes de enviar
                    if (sentence && sentence.trim() !== '' && data.is_final) {
                        // Ya se agregó arriba
                    } else if (sentence && sentence.trim() !== '') {
                        fullTranscript += sentence + ' ';
                    }
                    stopListening(fullTranscript.trim());
                    fullTranscript = '';
                    return;
                }
            });

            connection.on(LiveTranscriptionEvents.Error, (err) => {
                console.error("Deepgram Error:", err);
                stopListening();
                setTranscript("Error en reconocimiento de voz.");
            });

            connection.on(LiveTranscriptionEvents.Close, () => {
                console.log("Conexión STT cerrada");
            });

        } catch (e: any) {
            console.error(e);
            stopListening();
            setTranscript("Error: " + e.message);
        }
    };

    // Al desmontar, asegurar que cerramos conexiones
    useEffect(() => {
        return () => {
            clearSilenceTimer();
            if (deepgramRef.current) deepgramRef.current.finish();
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // Función para normalizar variaciones fonéticas comunes
    const normalizeTranscript = (text: string): string => {
        let normalized = text;
        // Regex para "Growy"
        const growyRegex = /\b(growee|growie|growi|grow y|gro y|groui|grou y|grogui|groy|grauy|cloe|broui|braui|growing|rob y|grob y)\b/gi;
        normalized = normalized.replace(growyRegex, 'Growy');

        // Regex para "Beccar"
        const beccarRegex = /\b(b card|v card|bekar|veccar|be card|becar)\b/gi;
        normalized = normalized.replace(beccarRegex, 'Beccar');

        // Normalización Agronómica / Canábica
        normalized = normalized.replace(/\b(es que g|esque je|ezqueje|es queue|esquejes)\b/gi, 'esquejes');
        normalized = normalized.replace(/\b(flora ci[oó]n|flora sion|floreci[óo]n)\b/gi, 'floración');
        normalized = normalized.replace(/\b(vege taci[óo]n|vejetacion|bejetacion)\b/gi, 'vegetación');
        normalized = normalized.replace(/\b(in door|indor|inn dor)\b/gi, 'indoor');
        normalized = normalized.replace(/\b(re pro can|rep ro can|re procan|reprocam|reprocan)\b/gi, 'Reprocann');

        return normalized;
    };

    const handleFinalTranscript = async (rawText: string) => {
        const text = normalizeTranscript(rawText);

        setGrowyState('processing');
        setTranscript(text);
        // Add user message to visible thread
        setVisibleMessages(prev => [...prev, { role: 'user', content: text }]);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

        const currentImage = selectedImage;
        setSelectedImage(null); // Limpiar preview mientras procesa

        if (fileInputRef.current) fileInputRef.current.value = '';

        try {
            // La información ya no se extrae proactivamente desde el frontend.
            // Si la IA necesita contexto, lo solicitará en el backend a través del RAG.
            // Obligatorio aislar peticiones por tenant (Multi-tenancy)
            if (!currentOrganization?.id) {
                throw new Error("No hay una organización activa seleccionada.");
            }
            const reply = await growyService.sendMessage(text, null, currentOrganization.id, chatHistory, currentImage || undefined);

            if (reply.type === 'actions' && reply.actionProposals) {
                // Tier 3 #13: Si TODAS las acciones son de bajo riesgo, ejecutar directamente
                const allLowRisk = reply.actionProposals.every((p: any) => LOW_RISK_ACTIONS.includes(p.name));
                if (allLowRisk) {
                    setActionProposals(reply.actionProposals);
                    setGrowyState('idle');
                    speakResponse(`Ejecutando ${reply.actionProposals.length} acciones automáticamente...`);
                    // Auto-execute without confirmation
                    setTimeout(() => handleConfirmAction(), 100);
                } else {
                    setActionProposals(reply.actionProposals);
                    setGrowyState('idle');
                    speakResponse("Por favor, confirma si deseas que ejecute este lote de acciones.");
                }
            } else {
                setResponse(reply.content || '');
                speakResponse(reply.content || '');
                // Add Growy response to visible thread
                if (reply.content) {
                    setVisibleMessages(prev => [...prev, { role: 'growy' as const, content: reply.content! }]);
                    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
                }

                // Guardar memoria conversacional corta (3 interacciones máx para no desbordar tokens)
                setChatHistory(prev => {
                    const newHistory = [...prev, { role: 'user', content: text }];
                    if (reply.content) {
                        newHistory.push({ role: 'model', content: reply.content });
                    }
                    return newHistory.slice(-6);
                });
            }

        } catch (error: any) {
            console.error("Error from Edge Function:", error);
            setResponse(error.message || "Hubo un error al procesar tu solicitud.");
            setErrorToast(`Growy falló: ${error.message || "Error desconocido"}`);
            setGrowyState('idle');
        }
    };

    const handleConfirmAction = async () => {
        if (!actionProposals || actionProposals.length === 0) return;
        setIsExecutingAction(true);
        setErrorToast(null);

        try {
            // 1. Preprocesar las intenciones (Aplicar mappers locales antes de enviar al RPC)
            const processedActions = actionProposals.map(proposal => {
                let processedArgs = { ...proposal.args };

                // Mapear tipos de sala
                if (proposal.name === 'create_room') {
                    let rawType = processedArgs.type?.toLowerCase() || 'general';
                    let safeType = 'general';
                    if (['vegetation', 'vegetacion', 'veg'].includes(rawType)) safeType = 'vegetation';
                    else if (['flowering', 'flora', 'floracion'].includes(rawType)) safeType = 'flowering';
                    else if (['drying', 'secado'].includes(rawType)) safeType = 'drying';
                    else if (['curing', 'curado'].includes(rawType)) safeType = 'curing';
                    else if (['mother', 'madre', 'madres'].includes(rawType)) safeType = 'mother';
                    else if (['clones', 'esquejes', 'esquejera'].includes(rawType)) safeType = 'clones';
                    else if (['germination', 'germinacion', 'semillero'].includes(rawType)) safeType = 'germination';
                    else if (['living_soil'].includes(rawType)) safeType = 'living_soil';

                    processedArgs.type = safeType;
                }

                // Parsear recurrencias de Tareas
                if (proposal.name === 'create_task') {
                    if (processedArgs.recurrence) {
                        const recStr = processedArgs.recurrence.toLowerCase();
                        const matchDays = recStr.match(/(\d+)\s+(d[íi]as?|days?)/);
                        const matchWeeks = recStr.match(/(\d+)\s+(semanas?|weeks?)/);

                        if (matchDays) {
                            processedArgs.recurrence = { type: 'custom', interval: parseInt(matchDays[1]), unit: 'day' };
                        } else if (matchWeeks) {
                            processedArgs.recurrence = { type: 'custom', interval: parseInt(matchWeeks[1]), unit: 'week' };
                        } else if (recStr.includes('semana') || recStr.includes('week')) {
                            processedArgs.recurrence = { type: 'weekly', interval: 1, unit: 'week' };
                        } else {
                            processedArgs.recurrence = { type: 'daily', interval: 1, unit: 'day' };
                        }
                    } else {
                        processedArgs.recurrence = null;
                    }
                }

                return {
                    name: proposal.name,
                    args: processedArgs
                };
            });

            // 2. Ejecutar Lote Atómico vía RPC
            const { data: { session } } = await supabase.auth.getSession();
            const profileId = session?.user?.id;

            if (!profileId) throw new Error("No authentitcated user");

            const { data, error } = await supabase.rpc('execute_growy_batch', {
                p_org_id: currentOrganization?.id,
                p_profile_id: profileId,
                p_actions: processedActions
            });

            if (error) {
                console.error("RPC Error Completo:", JSON.stringify(error, null, 2));
                console.error("RPC Error Original:", error);
                throw new Error(`La ejecución atómica falló en el servidor: ${error.message} - ${error.details || 'Sin detalles'}`);
            }

            // Éxito Total
            console.log("Growy Batch Success:", data);
            setResponse(`¡Listo! El lote de ${processedActions.length} acciones se ejecutó exitosamente.`);
            speakResponse(`Lote de ${processedActions.length} tareas completado exitosamente.`);

            // Auto-refresh: dispatch event para que los componentes escuchando refresquen sus datos
            window.dispatchEvent(new CustomEvent('growy-batch-success', {
                detail: { actions: processedActions.map(a => a.name), count: processedActions.length }
            }));

        } catch (error: any) {
            console.error('Error executing batch action:', error);
            const msg = error.message || 'Error desconocido';
            setErrorToast(`Growy tuvo un problema ejecutando las acciones: ${msg}`);
            speakResponse("Hubo un problema procesando las tareas. Verifica tu conexión de red.");
        } finally {
            setIsExecutingAction(false);
            setActionProposals([]);
        }
    };

    const handleCancelAction = () => {
        setActionProposals([]);
        setResponse("Acciones canceladas. ¿En qué más puedo ayudar?");
    };

    const speakResponse = (text: string, onAudioEnd?: () => void) => {
        if (!synthRef.current) return;

        // 1. Limpiar Markdown y símbolos basura para el motor TTS
        const cleanText = text
            // Elimina asteriscos dobles y simples (negritas/cursivas) sin dejar rastros
            .replace(/\*\*/g, '')
            .replace(/\*/g, '')
            // Elimina hashes (Títulos)
            .replace(/#/g, '')
            // Elimina underscores y backticks (Markdown Code/Italics alternativos)
            .replace(/_/g, '')
            .replace(/`/g, '')
            // Convierte saltos de linea dobles o viñetas Markdown a puntos para forzar pausas del TTS
            .replace(/\n\s*\n/g, '. ')
            .replace(/\n-\s/g, '. ') // Listas con guión
            .replace(/\n\*\s/g, '. ') // Listas con asterisco
            .replace(/\n/g, ' ') // Quita saltos sueltos restantes
            .replace(/\.\./g, '.') // Limpia puntos dobles accidentales
            .trim();

        if (!cleanText) return;

        synthRef.current.cancel(); // Frenamos audios pendientes

        // 2. Fragmentación Inteligente por puntuación y comas
        // Esto fuerza al navegador a hacer pausas naturales entre oraciones.
        const chunks = cleanText.match(/[^.?!,:]+[.?!,:]+/g) || [cleanText];

        let currentIndex = 0;

        const speakNextChunk = () => {
            if (currentIndex >= chunks.length) {
                if (onAudioEnd) {
                    onAudioEnd();
                } else {
                    setGrowyState('idle'); // Terminó toda la locución
                }
                return;
            }

            const chunkText = chunks[currentIndex].trim();
            if (!chunkText) {
                currentIndex++;
                speakNextChunk();
                return;
            }

            const utterance = new SpeechSynthesisUtterance(chunkText);

            // 3. Selección de Voz (Prioridad: Argentina -> Latino -> España)
            const voices = synthRef.current.getVoices();

            // Filtros de acentos
            const argentineVoices = voices.filter(v => v.lang === 'es-AR' || v.lang === 'es_AR');
            const latamVoices = voices.filter(v => v.lang === 'es-US' || v.lang === 'es-419' || v.lang === 'es-MX');
            const allSpanishVoices = voices.filter(v => v.lang.startsWith('es'));

            // Helper para encontrar voz "Premium" o "Natural" dentro de un array
            const findBestIn = (voiceList: SpeechSynthesisVoice[]) => {
                return voiceList.find(v => v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Premium') || v.name.includes('Neural')) || voiceList[0];
            };

            // Intentamos en orden de preferencia de acento
            let selectedVoice = findBestIn(argentineVoices) || findBestIn(latamVoices) || findBestIn(allSpanishVoices);

            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }

            utterance.lang = selectedVoice ? selectedVoice.lang : 'es-AR';
            // Rate elevado para fluidez rápida
            utterance.rate = 1.15;
            utterance.pitch = 1.0;

            if (currentIndex === 0) setGrowyState('speaking');

            utterance.onend = () => {
                currentIndex++;
                // Pausas reducidas para mayor velocidad
                const isEndOfSentence = /[.?!]$/.test(chunkText);
                setTimeout(speakNextChunk, isEndOfSentence ? 80 : 30);
            };

            utterance.onerror = (e) => {
                console.warn("Speech Synthesis Error en fragmento:", e);
                setGrowyState('idle');
            };

            synthRef.current.speak(utterance);
        };

        // Forzar carga de voces web si aún no están listas (Bug común de Chrome)
        if (synthRef.current.getVoices().length === 0) {
            synthRef.current.onvoiceschanged = speakNextChunk;
        } else {
            speakNextChunk();
        }
    };

    const toggleListen = () => {
        if (isModalOpen) {
            setIsModalOpen(false);
            if (growyState === 'listening') {
                stopListening(transcript);
            }
        } else {
            // Solo abrimos el modal, no encendemos el mic automáticamente
            setIsModalOpen(true);
            if (synthRef.current.speaking) synthRef.current.cancel();
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const getIcon = () => {
        switch (growyState) {
            case 'idle': return <FaRobot />;
            case 'listening': return <FaMicrophone />;
            case 'processing': return <FaRobot style={{ visibility: 'hidden' }} />; // Hidden for spinner
            case 'speaking': return <FaRobot />;
            default: return <FaRobot />;
        }
    };

    if (!['trazapp', 'demo'].includes(currentOrganization?.plan || '')) {
        return null; // Growy is exclusive to Plan TrazAPP
    }

    return (
        <OrbContainer>
            {/* FULLSCREEN AUDIO VISUALIZER OVERLAY */}
            {growyState === 'listening' && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    zIndex: 10001,
                    background: 'rgba(0, 0, 0, 0.75)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '24px',
                    animation: 'fadeIn 0.3s ease',
                }}>
                    {/* Pulsing mic icon */}
                    <div style={{
                        width: 72, height: 72,
                        borderRadius: '50%',
                        background: 'rgba(0, 255, 136, 0.1)',
                        border: '2px solid rgba(0, 255, 136, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 28,
                        color: '#00ff88',
                        animation: 'pulseViz 2s infinite ease-in-out',
                        boxShadow: '0 0 30px rgba(0, 255, 136, 0.2)',
                    }}>
                        <FaMicrophone />
                    </div>

                    {/* Audio Spectrum Canvas */}
                    <canvas
                        ref={canvasRef}
                        width={360}
                        height={120}
                        style={{
                            borderRadius: 12,
                            background: 'rgba(0, 0, 0, 0.3)',
                            border: '1px solid rgba(0, 255, 136, 0.1)',
                        }}
                    />

                    {/* Live transcript */}
                    <div style={{
                        color: 'rgba(255,255,255,0.7)',
                        fontSize: 15,
                        maxWidth: 340,
                        textAlign: 'center',
                        lineHeight: 1.5,
                        minHeight: 24,
                    }}>
                        {transcript || 'Escuchando...'}
                    </div>

                    {/* Cancel button */}
                    <button
                        onClick={() => stopListening()}
                        style={{
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: 12,
                            color: 'rgba(255,255,255,0.5)',
                            padding: '10px 24px',
                            cursor: 'pointer',
                            fontSize: 13,
                            transition: 'all 0.2s',
                        }}
                    >
                        Cancelar
                    </button>

                    <style>{`
                        @keyframes fadeIn {
                            from { opacity: 0; }
                            to { opacity: 1; }
                        }
                        @keyframes pulseViz {
                            0%, 100% { transform: scale(1); box-shadow: 0 0 30px rgba(0, 255, 136, 0.2); }
                            50% { transform: scale(1.08); box-shadow: 0 0 50px rgba(0, 255, 136, 0.4); }
                        }
                    `}</style>
                </div>
            )}

            <ChatPanel $visible={isModalOpen}>
                <ChatHeader>
                    <div className="header-left">
                        <div className="avatar"><FaRobot /></div>
                        <div className="info">
                            <div className="name">Growy</div>
                            <div className="status"><span className="dot" /> Asistente de Cultivo</div>
                        </div>
                    </div>
                    <button className="close-btn" onClick={() => setIsModalOpen(false)}><FaTimes size={14} /></button>
                </ChatHeader>

                <MessageThread>
                    {visibleMessages.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.25)' }}>
                            <FaRobot size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
                            <div style={{ fontSize: 13 }}>Preguntame sobre tus cultivos, tareas o finanzas</div>
                        </div>
                    )}
                    {visibleMessages.map((msg, i) => (
                        <MessageBubble key={i} $isUser={msg.role === 'user'}>
                            <div className="bubble-avatar">
                                {msg.role === 'user' ? '👤' : <FaRobot size={12} />}
                            </div>
                            <div
                                className="bubble-content"
                                dangerouslySetInnerHTML={{
                                    __html: msg.role === 'user' ? msg.content : renderMarkdown(msg.content)
                                }}
                            />
                        </MessageBubble>
                    ))}
                    {growyState === 'processing' && (
                        <TypingIndicator>
                            <span /><span /><span />
                        </TypingIndicator>
                    )}
                    <div ref={messagesEndRef} />
                </MessageThread>

                {selectedImage && (
                    <div style={{ padding: '0 16px 8px', position: 'relative', display: 'inline-block' }}>
                        <img src={selectedImage} alt="Preview" style={{ maxHeight: 80, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }} />
                        <button
                            onClick={() => setSelectedImage(null)}
                            style={{ position: 'absolute', top: -6, right: 10, background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: 18, height: 18, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: 10 }}
                        >✕</button>
                    </div>
                )}

                <InputBar onSubmit={(e) => {
                    e.preventDefault();
                    if ((textInput.trim() || selectedImage) && growyState !== 'processing') {
                        handleFinalTranscript(textInput || "Analiza esta imagen.");
                        setTextInput('');
                    }
                }}>
                    <div className="input-actions">
                        <input type="file" accept="image/*" hidden ref={fileInputRef} onChange={handleFileSelect} />
                        <button type="button" onClick={() => fileInputRef.current?.click()} title="Adjuntar imagen">
                            📎
                        </button>
                        <button
                            type="button"
                            onClick={startListening}
                            disabled={growyState === 'listening' || growyState === 'processing'}
                            title="Hablar con Growy"
                            style={{ color: growyState === 'listening' ? '#ef4444' : undefined }}
                        >
                            {growyState === 'listening' ? '🔴' : '🎙️'}
                        </button>
                    </div>
                    <textarea
                        rows={1}
                        placeholder="Preguntale algo a Growy..."
                        value={textInput}
                        onChange={(e) => {
                            setTextInput(e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                if (textInput.trim() && growyState !== 'processing') {
                                    handleFinalTranscript(textInput);
                                    setTextInput('');
                                    e.currentTarget.style.height = 'auto';
                                }
                            }
                        }}
                        disabled={growyState === 'processing' || growyState === 'listening'}
                    />
                    <button className="send-btn" type="submit" disabled={!textInput.trim() || growyState === 'processing' || growyState === 'listening'}>
                        ➤
                    </button>
                </InputBar>
            </ChatPanel>

            <OrbButton
                $gState={growyState}
                onClick={toggleListen}
                title="Talk to Growy"
            >
                {getIcon()}
            </OrbButton>

            {/* Central Toast Overlay for Action Confirmation & Errors */}
            {/* Lote Actions Overlay Modal */}
            <ToastOverlay $visible={actionProposals.length > 0 || !!errorToast}>
                {actionProposals.length > 0 && (
                    <ToastModal>
                        <div className="toast-header">
                            <FaRobot className="icon-warn" />
                            Confirma este lote de {actionProposals.length} acciones
                        </div>
                        <div className="toast-body">
                            Growy propone ejecutar atómicamente el siguiente bloque:
                            <br /><br />
                            {actionProposals.map((proposal, i) => {
                                let icon = <FaRobot style={{ marginRight: '8px' }} />;
                                let titleStr = proposal.name;
                                let descStr = JSON.stringify(proposal.args, null, 2);

                                if (proposal.name === 'create_crop') {
                                    icon = <FaSeedling style={{ marginRight: '8px', color: '#4ade80' }} />;
                                    titleStr = 'Crear Cultivo';
                                    descStr = `Nombre: ${proposal.args.name} | Ubicación: ${proposal.args.location}`;
                                } else if (proposal.name === 'create_room') {
                                    icon = <FaMapMarkedAlt style={{ marginRight: '8px', color: '#60a5fa' }} />;
                                    titleStr = 'Crear Sala';
                                    descStr = `Nombre: ${proposal.args.name} | Tipo: ${proposal.args.type}`;
                                } else if (proposal.name === 'create_task') {
                                    icon = <FaTasks style={{ marginRight: '8px', color: '#f472b6' }} />;
                                    titleStr = 'Crear Tarea';
                                    descStr = `Título: ${proposal.args.title} | Vence: ${proposal.args.dueDate || proposal.args.dueDate}`;
                                } else if (proposal.name === 'create_room_sticky') {
                                    icon = <FaStickyNote style={{ marginRight: '8px', color: '#fcd34d' }} />;
                                    titleStr = 'Crear Nota de Pizarra';
                                    descStr = `Mensaje: "${proposal.args.content}" | Color: ${proposal.args.color || 'yellow'}`;
                                } else if (proposal.name === 'create_map') {
                                    icon = <FaTh style={{ marginRight: '8px', color: '#818cf8' }} />;
                                    titleStr = 'Crear Mesa de Trabajo / Cuadrícula';
                                    descStr = `Nombre: "${proposal.args.name}" | Dimensiones: ${proposal.args.grid_rows}x${proposal.args.grid_columns}`;
                                } else if (proposal.name === 'create_expense') {
                                    icon = <FaMoneyBillWave style={{ marginRight: '8px', color: '#4ade80' }} />;
                                    titleStr = proposal.args.type === 'INGRESO' ? 'Registrar Ingreso (Aporte)' : 'Registrar Gasto';
                                    descStr = `Monto: $${proposal.args.amount} | Concepto: "${proposal.args.title}" | Medio: ${proposal.args.payment_method}`;
                                } else if (proposal.name === 'create_insumo') {
                                    icon = <FaBox style={{ marginRight: '8px', color: '#f472b6' }} />;
                                    titleStr = 'Añadir Insumo al Inventario';
                                    descStr = `Producto: "${proposal.args.nombre}" (${proposal.args.categoria}) | Stock Inicial: ${proposal.args.stock_actual} ${proposal.args.unidad_medida} | Precio unitario: $${proposal.args.precio_actual}`;
                                } else if (proposal.name === 'create_medical_evolution') {
                                    icon = <FaStethoscope style={{ marginRight: '8px', color: '#60a5fa' }} />;
                                    titleStr = 'Evolución Clínica';
                                    descStr = `Título: "${proposal.args.title}" | EVA: ${proposal.args.eva_score}/10 | Notas: "${proposal.args.notes}"`;
                                } else if (proposal.name === 'dispense_stock') {
                                    icon = <FaPrescriptionBottleAlt style={{ marginRight: '8px', color: '#fcd34d' }} />;
                                    titleStr = 'Dispensar Producto';
                                    descStr = `Cantidad: ${proposal.args.amount} | Motivo: "${proposal.args.reason}" | Aporte: $${proposal.args.transaction_value || 0}`;
                                }

                                return (
                                    <div key={i} style={{ marginBottom: '12px', borderLeft: '3px solid #00ff88', paddingLeft: '12px', backgroundColor: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '4px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', fontWeight: 'bold' }}>
                                            {icon}
                                            <span>#{i + 1} {titleStr}</span>
                                        </div>
                                        <div style={{ opacity: 0.8, fontSize: '13px', marginLeft: '24px' }}>{descStr}</div>
                                    </div>
                                );
                            })}
                        </div>
                        {errorToast && <div style={{ color: '#ef4444', fontSize: '14px', marginTop: '8px' }}>{errorToast}</div>}
                        <div className="toast-footer">
                            <button className="btn-cancel" onClick={handleCancelAction} disabled={isExecutingAction}>
                                Cancelar Bloque
                            </button>
                            <button className="btn-confirm" onClick={handleConfirmAction} disabled={isExecutingAction}>
                                {isExecutingAction ? 'Ejecutando lote...' : 'Ejecutar Lote'}
                            </button>
                        </div>
                    </ToastModal>
                )}
                {errorToast && (
                    <ToastModal style={{ borderTop: '4px solid #ff4444' }}>
                        <div className="toast-header" style={{ color: '#ff4444' }}>
                            <span className="icon-warn">❌</span>
                            Error de IA
                        </div>
                        <div className="toast-body">
                            {errorToast}
                        </div>
                        <div className="toast-footer" style={{ justifyContent: 'center' }}>
                            <button
                                className="btn-cancel"
                                onClick={() => setErrorToast(null)}
                            >
                                Entendido
                            </button>
                        </div>
                    </ToastModal>
                )}
            </ToastOverlay>
        </OrbContainer>
    );
};
