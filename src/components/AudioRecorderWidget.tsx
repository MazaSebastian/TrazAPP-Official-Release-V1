import React, { useState, useRef, useEffect } from "react";
import { 
  Mic, 
  Square, 
  Trash2, 
  Check, 
  CheckCircle2, 
  Radio 
} from "lucide-react";
import { supabase } from "../services/supabaseClient";
import { convertBlobTo16kHzWav } from "../utils/audioConverter";

interface AudioRecorderWidgetProps {
    onAudioRecorded: (url: string | null) => void;
    orgId?: string;
    patientId?: string;
    title?: string;
    description?: string;
}

const AudioRecorderWidget: React.FC<AudioRecorderWidgetProps> = ({
    onAudioRecorded,
    orgId = "default",
    patientId = "task",
    title = "Nota de Audio",
    description = "Graba una nota de voz para adjuntar a este registro."
}) => {
    const [isRecording, setIsRecording] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [isConfirmed, setIsConfirmed] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (
                mediaRecorderRef.current &&
                mediaRecorderRef.current.state === "recording"
            ) {
                mediaRecorderRef.current.stop();
            }
        };
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: "audio/webm",
            });
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, {
                    type: "audio/webm",
                });
                const url = URL.createObjectURL(audioBlob);
                setAudioUrl(url);
                setAudioBlob(audioBlob);
                stream.getTracks().forEach((track) => track.stop()); // Release mic
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            setIsConfirmed(false);

            timerRef.current = setInterval(() => {
                setRecordingTime((prev) => prev + 1);
            }, 1000);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            // Fallback alert for microphone permissions
            alert(
                "No se pudo acceder al micrófono. Por favor, verifica los permisos del navegador."
            );
        }
    };

    const stopRecording = () => {
        if (
            mediaRecorderRef.current &&
            mediaRecorderRef.current.state === "recording"
        ) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const deleteRecording = () => {
        setAudioUrl(null);
        setAudioBlob(null);
        setRecordingTime(0);
        setIsConfirmed(false);
        onAudioRecorded(null);
    };

    const confirmAndUpload = async () => {
        if (!audioBlob) return;
        setIsUploading(true);

        try {
            // Convert WebM/MP4 recorded blob to 16kHz 16-bit Mono WAV for ESP32 hardware compatibility
            let uploadBlob: Blob = audioBlob;
            let fileExt = "webm";
            let contentType = "audio/webm";

            try {
                const wavBlob = await convertBlobTo16kHzWav(audioBlob);
                if (wavBlob && wavBlob.size > 0) {
                    uploadBlob = wavBlob;
                    fileExt = "wav";
                    contentType = "audio/wav";
                }
            } catch (convErr) {
                console.warn("WAV conversion fallback to webm:", convErr);
            }

            const fileName = orgId
                ? `${orgId}/${patientId}_${Date.now()}.${fileExt}`
                : `${patientId}_${Date.now()}.${fileExt}`;

            const { data, error } = await supabase.storage
                .from("ai_clinical_audio")
                .upload(fileName, uploadBlob, {
                    cacheControl: "3600",
                    upsert: false,
                    contentType: contentType,
                });

            if (error) {
                throw error;
            }

            // Get public URL or signed URL based on bucket configuration
            // Assuming a private bucket, the Edge Function will need the path or a signed URL to read it
            // Let's store the full path to allow the Edge Function to download it securely
            onAudioRecorded(`ai_clinical_audio/${data.path}`);
            setIsConfirmed(true);

            // Optional UI success state
            // setAudioUrl(null); 
        } catch (err) {
            console.error("Error uploading audio:", err);
            alert("Hubo un error subiendo el audio clínico.");
        } finally {
            setIsUploading(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs
            .toString()
            .padStart(2, "0")}`;
    };

    return (
        <div
            style={{
                background: "rgba(15, 23, 42, 0.4)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "0.75rem",
                padding: "1rem",
                marginTop: "1rem",
                marginBottom: "1rem"
            }}
        >
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.5rem",
                }}
            >
                <h4
                    style={{
                        color: "#f8fafc",
                        margin: 0,
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        fontSize: "0.95rem",
                        fontWeight: 600
                    }}
                >
                    <Mic size={16} color={isRecording ? "#ef4444" : "#38bdf8"} />
                    {title}
                </h4>
                <span
                    style={{
                        color: isRecording ? "#ef4444" : "#94a3b8",
                        fontWeight: "700",
                        fontFamily: "monospace",
                        fontSize: "1rem",
                        background: "rgba(0,0,0,0.25)",
                        padding: "0.15rem 0.5rem",
                        borderRadius: "0.375rem"
                    }}
                >
                    {formatTime(recordingTime)}
                </span>
            </div>

            <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginBottom: "1rem", lineHeight: "1.4" }}>
                {description}
            </p>

            {!audioUrl && !isRecording && (
                <button
                    type="button"
                    onClick={startRecording}
                    style={{
                        width: "100%",
                        background: "rgba(56, 189, 248, 0.1)",
                        border: "1px solid rgba(56, 189, 248, 0.3)",
                        color: "#38bdf8",
                        padding: "0.75rem",
                        borderRadius: "0.5rem",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.5rem",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.background = "rgba(56, 189, 248, 0.2)")}
                    onMouseOut={(e) => (e.currentTarget.style.background = "rgba(56, 189, 248, 0.1)")}
                >
                    <Mic size={15} /> Iniciar Grabación
                </button>
            )}

            {isRecording && (
                <div style={{ display: "flex", gap: "0.5rem" }}>
                    {/* Recording indicator */}
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '0.5rem' }}>
                        <span style={{ color: '#ef4444', animation: 'pulse 1.5s infinite', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Radio size={14} /> Grabando...
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={stopRecording}
                        style={{
                            background: "rgba(239, 68, 68, 0.9)",
                            border: "1px solid #ef4444",
                            color: "white",
                            padding: "0.75rem 1.5rem",
                            borderRadius: "0.5rem",
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "0.5rem",
                            cursor: "pointer",
                            boxShadow: "0 0 15px rgba(239, 68, 68, 0.4)",
                        }}
                    >
                        <Square size={14} /> Detener
                    </button>
                </div>
            )}

            {audioUrl && !isRecording && (
                <div>
                    <audio
                        src={audioUrl}
                        controls
                        style={{ width: "100%", marginBottom: "1rem", height: "40px" }}
                    />

                    {!isConfirmed ? (
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button
                                type="button"
                                onClick={deleteRecording}
                                style={{
                                    flex: 1,
                                    background: "rgba(148, 163, 184, 0.1)",
                                    border: "1px solid rgba(148, 163, 184, 0.2)",
                                    color: "#cbd5e1",
                                    padding: "0.65rem",
                                    borderRadius: "0.5rem",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "0.5rem",
                                    fontWeight: 500,
                                    cursor: "pointer",
                                }}
                            >
                                <Trash2 size={14} /> Descartar
                            </button>

                            <button
                                type="button"
                                onClick={confirmAndUpload}
                                disabled={isUploading}
                                style={{
                                    flex: 2,
                                    background: isUploading ? "#475569" : "#10b981",
                                    border: "none",
                                    color: "white",
                                    padding: "0.65rem",
                                    borderRadius: "0.5rem",
                                    fontWeight: 600,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "0.5rem",
                                    cursor: isUploading ? "not-allowed" : "pointer",
                                    boxShadow: isUploading ? "none" : "0 0 15px rgba(16, 185, 129, 0.3)",
                                }}
                            >
                                {isUploading ? (
                                    "Subiendo Audio..."
                                ) : (
                                    <>
                                        <CheckCircle2 size={15} /> Confirmar Audio
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        <div style={{
                            background: "rgba(16, 185, 129, 0.12)",
                            border: "1px solid rgba(16, 185, 129, 0.3)",
                            color: "#34d399",
                            padding: "0.65rem",
                            borderRadius: "0.5rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "0.5rem",
                            fontWeight: 600,
                            fontSize: "0.9rem"
                        }}>
                            <CheckCircle2 size={15} /> Audio Confirmado y Adjunto
                        </div>
                    )}
                </div>
            )}

            <style>
                {`
            @keyframes pulse {
                0% { opacity: 0.5; }
                50% { opacity: 1; }
                100% { opacity: 0.5; }
            }
            audio::-webkit-media-controls-panel {
                background-color: rgba(30, 41, 59, 0.8);
            }
            audio::-webkit-media-controls-current-time-display,
            audio::-webkit-media-controls-time-remaining-display {
                color: white;
            }
            audio::-webkit-media-controls-play-button,
            audio::-webkit-media-controls-mute-button {
                filter: invert(1);
            }
            `}
            </style>
        </div>
    );
};

export default AudioRecorderWidget;
