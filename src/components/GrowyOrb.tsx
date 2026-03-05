import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { FaMicrophone, FaRobot, FaTimes, FaSeedling, FaMapMarkedAlt, FaTasks, FaStickyNote, FaTh, FaBox, FaMoneyBillWave } from 'react-icons/fa';
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

const OrbContainer = styled.div`
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
`;

const OrbButton = styled.button<{ $gState: GrowyState }>`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: none;
  background: var(--surface-color, #1e1e1e);
  color: white;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 24px;
  transition: all 0.3s ease;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
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
          background: rgba(255, 64, 129, 0.1);
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
          box-shadow: 0 0 20px rgba(0, 188, 212, 0.6);
        `;
            default:
                return '';
        }
    }}

  &:hover {
    transform: scale(1.1);
  }
`;

const CommandModal = styled.div<{ $visible: boolean }>`
  position: absolute;
  bottom: 80px;
  right: 0;
  width: 320px;
  max-height: 400px;
  background: var(--surface-color, #1e1e1e);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  border: 1px solid rgba(255,255,255,0.1);
  display: ${({ $visible }) => ($visible ? 'flex' : 'none')};
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transform: translateY(${({ $visible }) => ($visible ? '0' : '20px')});
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  padding-bottom: 8px;
  
  h3 {
    margin: 0;
    font-size: 16px;
    color: var(--text-color, #fff);
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  button {
    background: none;
    border: none;
    color: var(--text-color-secondary, #aaa);
    cursor: pointer;
    &:hover { color: #fff; }
  }
`;

const TranscriptArea = styled.div`
  font-size: 14px;
  color: var(--text-color, #fff);
  padding: 8px;
  background: rgba(0,0,0,0.2);
  border-radius: 8px;
  min-height: 50px;
  font-style: italic;
`;

const ResponseArea = styled.div`
  font-size: 14px;
  color: #00ff88;
  line-height: 1.4;
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

const TextInputForm = styled.form`
  display: flex;
  margin-top: 8px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 20px;
  padding: 4px 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  align-items: center;

  textarea {
    flex: 1;
    background: transparent;
    border: none;
    color: #fff;
    font-size: 14px;
    outline: none;
    padding: 8px 0;
    resize: none;
    font-family: inherit;
    line-height: 1.4;

    &::placeholder {
      color: rgba(255, 255, 255, 0.4);
    }
    
    &::-webkit-scrollbar {
        width: 4px;
    }
    &::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 4px;
    }
  }

  button {
    background: none;
    border: none;
    color: #00ff88;
    cursor: pointer;
    font-size: 16px;
    padding: 4px 8px;
    transition: transform 0.2s;

    &:hover:not(:disabled) {
      transform: scale(1.2);
    }

    &:disabled {
      color: rgba(255, 255, 255, 0.2);
      cursor: not-allowed;
    }
  }
`;

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

    const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);
    const deepgramRef = useRef<any>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

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

                const mediaRecorder = new MediaRecorder(stream);
                mediaRecorderRef.current = mediaRecorder;

                mediaRecorder.addEventListener('dataavailable', (event) => {
                    if (event.data.size > 0 && connection.getReadyState() === 1) {
                        connection.send(event.data);
                    }
                });

                mediaRecorder.start(250); // Enviar fragmentos de audio de 250ms
            });

            let fullTranscript = '';

            connection.on(LiveTranscriptionEvents.Transcript, (data) => {
                const sentence = data.channel.alternatives[0].transcript;

                // Si detectó un silencio largo interno de Deepgram y el audio es válido
                if (data.speech_final && growyState === 'listening') {
                    stopListening(fullTranscript.trim());
                    fullTranscript = ''; // Reset after submit
                    return;
                }

                // Ignorar empty returns
                if (!sentence || sentence.trim() === '') return;

                if (data.is_final) {
                    fullTranscript += sentence + ' ';
                    setTranscript(fullTranscript);
                } else {
                    setTranscript(fullTranscript + sentence);
                }

                // Reiniciar el contador de 3 segundos porque el usuario sigue hablando
                startSilenceTimer(fullTranscript);
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

        try {
            // La información ya no se extrae proactivamente desde el frontend.
            // Si la IA necesita contexto, lo solicitará en el backend a través del RAG.
            // Obligatorio aislar peticiones por tenant (Multi-tenancy)
            if (!currentOrganization?.id) {
                throw new Error("No hay una organización activa seleccionada.");
            }
            const reply = await growyService.sendMessage(text, null, currentOrganization.id, chatHistory);

            if (reply.type === 'actions' && reply.actionProposals) {
                setActionProposals(reply.actionProposals);
                setGrowyState('idle');
                speakResponse("Por favor, confirma si deseas que ejecute este lote de acciones.");
            } else {
                setResponse(reply.content || '');
                speakResponse(reply.content || '');

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
            setResponse(`¡Listo! El lote de ${processedActions.length} acciones se ejecutó exitosamente de forma segura. Refresca la página si es necesario.`);
            speakResponse(`Lote de ${processedActions.length} tareas completado exitosamente.`);

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
            // Ligera modificación de pitch y rate para sonar menos robótico
            utterance.rate = 1.05;
            utterance.pitch = 1.0;

            if (currentIndex === 0) setGrowyState('speaking');

            utterance.onend = () => {
                currentIndex++;
                // Pequeño timeout para dar un respiro natural (reducido al 50% según feedback)
                const isEndOfSentence = /[.?!]$/.test(chunkText);
                setTimeout(speakNextChunk, isEndOfSentence ? 200 : 75);
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

    const getIcon = () => {
        switch (growyState) {
            case 'idle': return <FaRobot />;
            case 'listening': return <FaMicrophone />;
            case 'processing': return <FaRobot style={{ visibility: 'hidden' }} />; // Hidden for spinner
            case 'speaking': return <FaRobot />;
            default: return <FaRobot />;
        }
    };

    return (
        <OrbContainer>
            <CommandModal $visible={isModalOpen}>
                <Header>
                    <h3><FaRobot color="#00ff88" /> Growy UI</h3>
                    <button onClick={() => setIsModalOpen(false)}><FaTimes /></button>
                </Header>
                <TranscriptArea>
                    {transcript || "Presiona el orbe y dime en qué te ayudo..."}
                </TranscriptArea>
                {response && (
                    <ResponseArea>{response}</ResponseArea>
                )}
                <TextInputForm onSubmit={(e) => {
                    e.preventDefault();
                    if (textInput.trim() && growyState !== 'processing') {
                        handleFinalTranscript(textInput);
                        setTextInput('');
                    }
                }}>
                    <button
                        type="button"
                        onClick={startListening}
                        disabled={growyState === 'listening' || growyState === 'processing'}
                        title="Hablar con Growy"
                        style={{ color: growyState === 'listening' ? '#ef4444' : '#00ff88' }}
                    >
                        {growyState === 'listening' ? '🔴' : '🎙️'}
                    </button>
                    <textarea
                        rows={1}
                        placeholder="O escribe tu comando aquí..."
                        value={textInput}
                        onChange={(e) => {
                            setTextInput(e.target.value);
                            // Auto-resize logic
                            e.target.style.height = 'auto';
                            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
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
                    <button type="submit" disabled={!textInput.trim() || growyState === 'processing' || growyState === 'listening'}>
                        ➤
                    </button>
                </TextInputForm>
            </CommandModal>

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
