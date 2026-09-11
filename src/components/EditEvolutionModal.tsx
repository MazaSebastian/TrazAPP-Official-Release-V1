import React, { useState, useEffect } from "react";
import styled from "styled-components";
import {
  X,
  TrendingUp,
  Clock,
  ClipboardList,
  Paperclip,
  Upload,
  Trash2,
  AlertTriangle,
  FileText,
  Save,
} from "lucide-react";
import { Button } from "./ui";
import { CustomSelect } from "./CustomSelect";
import { ClinicalTemplate } from "../services/templatesService";

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  animation: fadeIn 0.2s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ModalContent = styled.div`
  width: 100%;
  max-width: 680px;
  max-height: 90vh;
  overflow-y: auto;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 1rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
  padding: 1.75rem;
  color: #f8fafc;
  position: relative;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }
`;

const ChromaticSlider = styled.input`
  width: 100%;
  -webkit-appearance: none;
  height: 8px;
  border-radius: 4px;
  background: linear-gradient(to right, #48bb78, #ecc94b, #f56565);
  outline: none;
  margin: 1rem 0;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: white;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    cursor: pointer;
    border: 2px solid #2d3748;
    transition: transform 0.15s ease;
    &:hover {
      transform: scale(1.15);
    }
  }
`;

interface EditEvolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  evolution: any;
  templates: ClinicalTemplate[];
  onSave: (
    updatedPayload: any,
    newFiles: File[],
    retainedAttachments: string[]
  ) => Promise<void>;
  isSaving: boolean;
}

export const EditEvolutionModal: React.FC<EditEvolutionModalProps> = ({
  isOpen,
  onClose,
  evolution,
  templates,
  onSave,
  isSaving,
}) => {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [evaScore, setEvaScore] = useState(0);
  const [nextFollowUpMonths, setNextFollowUpMonths] = useState(6);
  const [notes, setNotes] = useState("");
  const [editReason, setEditReason] = useState("");
  const [templateData, setTemplateData] = useState<Record<string, any>>({});
  const [existingAttachments, setExistingAttachments] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);

  useEffect(() => {
    if (evolution && isOpen) {
      setTitle(evolution.title || "");
      setDate(evolution.date || new Date().toISOString().split("T")[0]);
      setEvaScore(evolution.eva_score || 0);
      setNextFollowUpMonths(evolution.next_follow_up_months || 6);
      setNotes(evolution.notes || "");
      setEditReason("");
      setTemplateData(evolution.template_data || {});
      setExistingAttachments(evolution.attachments || []);
      setNewFiles([]);
    }
  }, [evolution, isOpen]);

  if (!isOpen || !evolution) return null;

  const currentTemplate = templates.find((t) => t.id === evolution.template_id);
  const hasEvaInTemplate = currentTemplate?.fields?.some((f: any) => f.type === "eva");

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setNewFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const handleRemoveExistingAttachment = (urlToRemove: string) => {
    setExistingAttachments((prev) => prev.filter((url) => url !== urlToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Determine final EVA score: if template has an EVA field, use that value
    let finalEva = evaScore;
    if (currentTemplate && hasEvaInTemplate) {
      const evaField = currentTemplate.fields.find((f: any) => f.type === "eva");
      if (evaField && templateData[evaField.id] !== undefined) {
        finalEva = Number(templateData[evaField.id]);
      }
    }

    const payload = {
      title,
      date,
      eva_score: finalEva,
      next_follow_up_months: nextFollowUpMonths,
      notes,
      template_id: evolution.template_id || null,
      template_data: templateData,
      edit_reason: editReason.trim() || undefined,
    };

    onSave(payload, newFiles, existingAttachments);
  };

  return (
    <Overlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isSaving}
          style={{
            position: "absolute",
            top: "1.25rem",
            right: "1.25rem",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "0.5rem",
            color: "#94a3b8",
            cursor: "pointer",
            padding: "0.4rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#f8fafc")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div
              style={{
                background: "rgba(14, 165, 233, 0.15)",
                border: "1px solid rgba(14, 165, 233, 0.3)",
                borderRadius: "0.5rem",
                padding: "0.45rem",
                color: "#38bdf8",
              }}
            >
              <FileText size={20} />
            </div>
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: "#f8fafc",
                }}
              >
                Editar Evolución Médica
              </h2>
              <p
                style={{
                  margin: "0.2rem 0 0 0",
                  fontSize: "0.82rem",
                  color: "#94a3b8",
                }}
              >
                Control del{" "}
                <strong style={{ color: "#e2e8f0" }}>{evolution.date}</strong>
                {evolution.title ? ` • ${evolution.title}` : ""}
              </p>
            </div>
          </div>

          {/* Legal / Audit Notice Banner */}
          <div
            style={{
              marginTop: "1rem",
              background: "rgba(245, 158, 11, 0.08)",
              border: "1px solid rgba(245, 158, 11, 0.25)",
              borderRadius: "0.5rem",
              padding: "0.75rem 1rem",
              display: "flex",
              alignItems: "flex-start",
              gap: "0.65rem",
            }}
          >
            <AlertTriangle
              size={17}
              className="text-amber-400"
              style={{ flexShrink: 0, marginTop: "2px" }}
            />
            <div style={{ fontSize: "0.8rem", color: "#fef3c7", lineHeight: 1.4 }}>
              <strong>Trazabilidad y Auditoría Médica:</strong> Al guardar los cambios, quedará asentado un sello visible e inalterable con la <b>fecha, hora y nombre del profesional actuante</b> en el legajo clínico del paciente.
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Title Field */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "0.4rem",
                fontWeight: 600,
                fontSize: "0.9rem",
                color: "#e2e8f0",
              }}
            >
              <TrendingUp size={15} className="text-emerald-400" /> Título / Motivo Resumido
            </label>
            <input
              type="text"
              placeholder="Ej: Seguimiento mensual, Ajuste posológico..."
              style={{
                width: "100%",
                padding: "0.65rem 0.85rem",
                borderRadius: "0.5rem",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                background: "rgba(15, 23, 42, 0.6)",
                color: "#f8fafc",
                fontSize: "0.92rem",
                outline: "none",
              }}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Date and Follow-up Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
              marginBottom: "1.25rem",
            }}
          >
            {/* Date */}
            <div>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "0.4rem",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  color: "#e2e8f0",
                }}
              >
                <Clock size={15} className="text-sky-400" /> Fecha del Registro
              </label>
              <input
                type="date"
                max={new Date().toISOString().split("T")[0]}
                style={{
                  width: "100%",
                  padding: "0.65rem 0.85rem",
                  borderRadius: "0.5rem",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  background: "rgba(15, 23, 42, 0.6)",
                  color: "#f8fafc",
                  colorScheme: "dark",
                  fontSize: "0.92rem",
                  outline: "none",
                }}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            {/* Next Follow-up */}
            <div>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "0.4rem",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  color: "#e2e8f0",
                }}
              >
                <Clock size={15} className="text-amber-400" /> Próximo Seguimiento
              </label>
              <CustomSelect
                options={[
                  { value: "1", label: "1 Mes" },
                  { value: "3", label: "3 Meses" },
                  { value: "6", label: "6 Meses" },
                  { value: "12", label: "12 Meses" },
                ]}
                value={String(nextFollowUpMonths)}
                onChange={(value) => setNextFollowUpMonths(Number(value))}
                placeholder="Seleccionar plazo..."
              />
            </div>
          </div>

          {/* Dynamic Template Fields if applicable */}
          {currentTemplate && (
            <div
              style={{
                background: "rgba(30, 41, 59, 0.4)",
                padding: "1rem",
                borderRadius: "0.5rem",
                marginBottom: "1.25rem",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "0.85rem",
                  color: "#a78bfa",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                }}
              >
                <ClipboardList size={16} /> Plantilla Aplicada: {currentTemplate.name}
              </div>

              {currentTemplate.fields.map((field: any) => (
                <div key={field.id} style={{ marginBottom: "0.9rem" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.35rem",
                      fontWeight: 600,
                      color: "#cbd5e1",
                      fontSize: "0.85rem",
                    }}
                  >
                    {field.label}{" "}
                    {field.required && <span style={{ color: "#ef4444" }}>*</span>}
                  </label>

                  {field.type === "text" && (
                    <input
                      type="text"
                      style={{
                        width: "100%",
                        padding: "0.6rem",
                        borderRadius: "0.375rem",
                        border: "1px solid rgba(255,255,255,0.15)",
                        background: "rgba(15, 23, 42, 0.6)",
                        color: "white",
                        fontSize: "0.9rem",
                      }}
                      value={templateData[field.id] || ""}
                      onChange={(e) =>
                        setTemplateData({
                          ...templateData,
                          [field.id]: e.target.value,
                        })
                      }
                      required={field.required}
                    />
                  )}

                  {field.type === "textarea" && (
                    <textarea
                      style={{
                        width: "100%",
                        padding: "0.6rem",
                        borderRadius: "0.375rem",
                        border: "1px solid rgba(255,255,255,0.15)",
                        background: "rgba(15, 23, 42, 0.6)",
                        color: "white",
                        minHeight: "75px",
                        fontSize: "0.9rem",
                      }}
                      value={templateData[field.id] || ""}
                      onChange={(e) =>
                        setTemplateData({
                          ...templateData,
                          [field.id]: e.target.value,
                        })
                      }
                      required={field.required}
                    />
                  )}

                  {field.type === "date" && (
                    <input
                      type="date"
                      style={{
                        width: "100%",
                        padding: "0.6rem",
                        borderRadius: "0.375rem",
                        border: "1px solid rgba(255,255,255,0.15)",
                        background: "rgba(15, 23, 42, 0.6)",
                        color: "white",
                        colorScheme: "dark",
                        fontSize: "0.9rem",
                      }}
                      value={templateData[field.id] || ""}
                      onChange={(e) =>
                        setTemplateData({
                          ...templateData,
                          [field.id]: e.target.value,
                        })
                      }
                      required={field.required}
                    />
                  )}

                  {field.type === "select" && (
                    <select
                      style={{
                        width: "100%",
                        padding: "0.6rem",
                        borderRadius: "0.375rem",
                        border: "1px solid rgba(255,255,255,0.15)",
                        background: "rgba(15, 23, 42, 0.9)",
                        color: "white",
                        fontSize: "0.9rem",
                      }}
                      value={templateData[field.id] || ""}
                      onChange={(e) =>
                        setTemplateData({
                          ...templateData,
                          [field.id]: e.target.value,
                        })
                      }
                      required={field.required}
                    >
                      <option value="">Seleccione...</option>
                      {field.options?.map((opt: string) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  )}

                  {field.type === "checkbox" && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.4rem",
                        background: "rgba(15, 23, 42, 0.5)",
                        padding: "0.5rem",
                        borderRadius: "0.375rem",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      {field.options?.map((opt: string) => {
                        const isChecked = (templateData[field.id] || []).includes(opt);
                        return (
                          <label
                            key={opt}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              fontSize: "0.85rem",
                              cursor: "pointer",
                              color: "#cbd5e1",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                const current = [...(templateData[field.id] || [])];
                                if (e.target.checked) current.push(opt);
                                else {
                                  const idx = current.indexOf(opt);
                                  if (idx > -1) current.splice(idx, 1);
                                }
                                setTemplateData({
                                  ...templateData,
                                  [field.id]: current,
                                });
                              }}
                            />
                            {opt}
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {field.type === "eva" && (
                    <div
                      style={{
                        background: "rgba(15, 23, 42, 0.5)",
                        padding: "0.85rem",
                        borderRadius: "0.5rem",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "0.35rem",
                          alignItems: "center",
                        }}
                      >
                        <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                          0 (Sin Dolor)
                        </span>
                        <span
                          style={{
                            fontWeight: "bold",
                            color: "#f8fafc",
                            fontSize: "1.1rem",
                            background: "rgba(255,255,255,0.1)",
                            padding: "0.15rem 0.65rem",
                            borderRadius: "0.25rem",
                          }}
                        >
                          {templateData[field.id] || 0}
                        </span>
                        <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                          10 (Máximo Dolor)
                        </span>
                      </div>
                      <ChromaticSlider
                        type="range"
                        min="0"
                        max="10"
                        value={templateData[field.id] || 0}
                        onChange={(e) =>
                          setTemplateData({
                            ...templateData,
                            [field.id]: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Standalone EVA Score if template doesn't include one */}
          {(!currentTemplate || !hasEvaInTemplate) && (
            <div
              style={{
                background: "rgba(30, 41, 59, 0.4)",
                padding: "1rem",
                borderRadius: "0.5rem",
                marginBottom: "1.25rem",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.4rem",
                }}
              >
                <label
                  style={{
                    fontWeight: 600,
                    color: "#f8fafc",
                    fontSize: "0.9rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <TrendingUp size={15} className="text-emerald-400" /> Nivel de Dolor Actual (EVA)
                </label>
                <span
                  style={{
                    fontWeight: "bold",
                    color: "#f8fafc",
                    fontSize: "1.1rem",
                    background: "rgba(255,255,255,0.1)",
                    padding: "0.15rem 0.65rem",
                    borderRadius: "0.25rem",
                  }}
                >
                  {evaScore} / 10
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.78rem",
                  color: "#94a3b8",
                  marginTop: "0.25rem",
                }}
              >
                <span>0 (Sin dolor)</span>
                <span>5 (Moderado)</span>
                <span>10 (Severo)</span>
              </div>
              <ChromaticSlider
                type="range"
                min="0"
                max="10"
                value={evaScore}
                onChange={(e) => setEvaScore(Number(e.target.value))}
              />
            </div>
          )}

          {/* Freeform Notes */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.4rem",
                fontWeight: 600,
                fontSize: "0.9rem",
                color: "#e2e8f0",
              }}
            >
              Notas de Evolución Clínica
            </label>
            <textarea
              style={{
                width: "100%",
                minHeight: "100px",
                padding: "0.75rem",
                borderRadius: "0.5rem",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                background: "rgba(15, 23, 42, 0.6)",
                color: "white",
                fontSize: "0.92rem",
                lineHeight: 1.5,
              }}
              placeholder="Detalles clínicos, cambios en sintomatología, posología o evolución..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Optional Reason for Edit */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.4rem",
                fontWeight: 600,
                fontSize: "0.85rem",
                color: "#cbd5e1",
              }}
            >
              Motivo de la Modificación <span style={{ color: "#94a3b8", fontWeight: 400 }}>(Opcional, para legajo de auditoría)</span>
            </label>
            <input
              type="text"
              placeholder="Ej: Aclaración de dosis, adjunto de estudio complementario..."
              style={{
                width: "100%",
                padding: "0.6rem 0.85rem",
                borderRadius: "0.5rem",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                background: "rgba(15, 23, 42, 0.4)",
                color: "#f8fafc",
                fontSize: "0.85rem",
              }}
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
            />
          </div>

          {/* Attachments Management */}
          <div
            style={{
              background: "rgba(30, 41, 59, 0.4)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              padding: "1rem",
              borderRadius: "0.5rem",
              marginBottom: "1.5rem",
            }}
          >
            <label
              style={{
                marginBottom: "0.75rem",
                fontWeight: 600,
                fontSize: "0.9rem",
                color: "#f8fafc",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <Paperclip size={15} className="text-sky-400" /> Archivos y Estudios Adjuntos
            </label>

            {/* Existing Attachments list */}
            {existingAttachments.length > 0 && (
              <div style={{ marginBottom: "1rem" }}>
                <span
                  style={{
                    fontSize: "0.8rem",
                    color: "#94a3b8",
                    display: "block",
                    marginBottom: "0.4rem",
                  }}
                >
                  Archivos actuales guardados:
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  {existingAttachments.map((url, i) => {
                    const fileName =
                      url.split("/").pop()?.split("_").slice(1).join("_") ||
                      `Documento adjunto ${i + 1}`;
                    return (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          background: "rgba(15, 23, 42, 0.7)",
                          padding: "0.45rem 0.75rem",
                          borderRadius: "0.375rem",
                          border: "1px solid rgba(255, 255, 255, 0.08)",
                        }}
                      >
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: "#38bdf8",
                            fontSize: "0.82rem",
                            textDecoration: "none",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: "85%",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.4rem",
                          }}
                        >
                          <Paperclip size={13} /> {fileName}
                        </a>
                        <button
                          type="button"
                          onClick={() => handleRemoveExistingAttachment(url)}
                          title="Eliminar archivo"
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#ef4444",
                            cursor: "pointer",
                            padding: "0.2rem",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Upload Zone for New Files */}
            <label
              htmlFor="edit-evolution-file-input"
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "1.2rem",
                border: `2px dashed ${
                  isDragActive ? "#38bdf8" : "rgba(255, 255, 255, 0.15)"
                }`,
                borderRadius: "0.5rem",
                background: isDragActive
                  ? "rgba(56, 189, 248, 0.1)"
                  : "rgba(15, 23, 42, 0.3)",
                cursor: "pointer",
                transition: "all 0.15s ease",
                color: isDragActive ? "#38bdf8" : "#94a3b8",
                fontSize: "0.85rem",
              }}
            >
              <Upload size={20} style={{ marginBottom: "0.35rem" }} />
              <span>Click para agregar más archivos o arrastra aquí</span>
            </label>
            <input
              id="edit-evolution-file-input"
              type="file"
              multiple
              onChange={(e) => {
                if (e.target.files) {
                  setNewFiles((prev) => [
                    ...prev,
                    ...Array.from(e.target.files!),
                  ]);
                  e.target.value = "";
                }
              }}
              style={{ display: "none" }}
            />

            {/* Staged New Files List */}
            {newFiles.length > 0 && (
              <div style={{ marginTop: "0.75rem" }}>
                <span
                  style={{
                    fontSize: "0.8rem",
                    color: "#38bdf8",
                    fontWeight: 600,
                    display: "block",
                    marginBottom: "0.3rem",
                  }}
                >
                  Nuevos archivos por subir:
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  {newFiles.map((file, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        background: "rgba(56, 189, 248, 0.08)",
                        padding: "0.4rem 0.65rem",
                        borderRadius: "0.25rem",
                        border: "1px solid rgba(56, 189, 248, 0.2)",
                        fontSize: "0.82rem",
                        color: "#e2e8f0",
                      }}
                    >
                      <span
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: "85%",
                        }}
                      >
                        {file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setNewFiles((prev) => prev.filter((_, i) => i !== idx))
                        }
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#ef4444",
                          cursor: "pointer",
                          padding: "0.2rem",
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.85rem",
              paddingTop: "0.75rem",
              borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="default"
              isLoading={isSaving}
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-500 border-emerald-500"
            >
              <Save size={15} className="mr-1.5" />
              {isSaving ? "Guardando cambios..." : "Guardar Modificaciones"}
            </Button>
          </div>
        </form>
      </ModalContent>
    </Overlay>
  );
};
