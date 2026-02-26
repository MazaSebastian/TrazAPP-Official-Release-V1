import React, { useState, useEffect } from 'react';
import { extractionsService } from '../../services/extractionsService';
import { DispensaryBatch } from '../../services/dispensaryService';
import { Extraction, ExtractionTechnique } from '../../types/extractions';
import { TastingRating } from './TastingRating';
import { CustomDatePicker } from '../CustomDatePicker';
import { CustomSelect } from '../CustomSelect';
import { FaFlask, FaCalculator, FaSave, FaTimes } from 'react-icons/fa';
import styled, { keyframes } from 'styled-components';

const overlayFadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const overlayFadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

const modalSlideIn = keyframes`
  from { opacity: 0; transform: translateY(20px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

const modalSlideOut = keyframes`
  from { opacity: 1; transform: translateY(0) scale(1); }
  to { opacity: 0; transform: translateY(20px) scale(0.95); }
`;

const ModalOverlay = styled.div<{ $isClosing?: boolean }>`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.7); z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(4px);
  animation: ${props => props.$isClosing ? overlayFadeOut : overlayFadeIn} 0.3s ease-in-out forwards;
`;

const ModalContent = styled.div<{ $isClosing?: boolean }>`
  background: rgba(15, 23, 42, 0.95);
  width: 95%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  border-radius: 1rem;
  padding: 0;
  box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(16px);
  color: #f8fafc;
  animation: ${props => props.$isClosing ? modalSlideOut : modalSlideIn} 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
`;

interface ExtractionFormProps {
    onClose: () => void;
    onSuccess: () => void;
    initialData?: Extraction;
    preselectedBatch?: DispensaryBatch;
}

export const ExtractionForm: React.FC<ExtractionFormProps> = ({ onClose, onSuccess, initialData, preselectedBatch }) => {
    const [sources, setSources] = useState<DispensaryBatch[]>([]);
    const [isClosing, setIsClosing] = useState(false);
    // const [loading, setLoading] = useState(true);

    // Form State
    const [sourceId, setSourceId] = useState('');
    const [technique, setTechnique] = useState<ExtractionTechnique>('Rosin');
    const [inputWeight, setInputWeight] = useState<number>(0);
    const [outputWeight, setOutputWeight] = useState<number>(0);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');

    // Dynamic Parameters
    const [params, setParams] = useState<any>({});

    // Ratings
    const [ratings, setRatings] = useState({ aroma: 0, texture: 0, potency: 0, color: 0 });

    useEffect(() => {
        loadSources();
        if (initialData) {
            setSourceId(initialData.source_batch_id);
            setTechnique(initialData.technique);
            setInputWeight(initialData.input_weight);
            setOutputWeight(initialData.output_weight);
            setDate(initialData.date.split('T')[0]);
            setNotes(initialData.notes || '');
            setParams(initialData.parameters || {});
            setRatings({
                aroma: initialData.ratings?.aroma || 0,
                texture: initialData.ratings?.texture || 0,
                potency: initialData.ratings?.potency || 0,
                color: initialData.ratings?.color || 0
            });
        } else if (preselectedBatch) {
            setSourceId(preselectedBatch.id);
            // Default input weight to visible/available weight? Or 0?
            // Maybe convenient to set it to current weight, assuming full processing.
            setInputWeight(preselectedBatch.current_weight);
        }
    }, [initialData, preselectedBatch]);

    const loadSources = async () => {
        try {
            const batches = await extractionsService.getAvailableSourceBatches();
            setSources(batches);
        } catch (err) {
            console.error(err);
        } finally {
            // setLoading(false);
        }
    };

    const calculateYield = () => {
        if (inputWeight > 0 && outputWeight >= 0) {
            return ((outputWeight / inputWeight) * 100).toFixed(1);
        }
        return "0.0";
    };

    const handleSubmit = async () => {
        if (!sourceId || inputWeight <= 0) {
            alert("Por favor selecciona una materia prima e ingresa un peso de entrada válido.");
            return;
        }

        try {
            let result;
            const extractionData = {
                source_batch_id: sourceId,
                technique,
                date,
                input_weight: inputWeight,
                output_weight: outputWeight,
                parameters: params,
                ratings,
                notes
            };

            if (initialData) {
                result = await extractionsService.updateExtraction(initialData.id, extractionData);
            } else {
                result = await extractionsService.createExtraction(extractionData);
            }

            if (result) {
                handleSuccess();
            } else {
                alert("Error al guardar la extracción.");
            }
        } catch (error) {
            console.error(error);
            alert("Ocurrió un error inesperado.");
        }
    };

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    const handleSuccess = () => {
        setIsClosing(true);
        setTimeout(() => {
            onSuccess();
        }, 300);
    };

    // Render specific inputs based on technique
    const renderTechInputs = () => {
        switch (technique) {
            case 'Rosin':
                return (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '1rem', marginBottom: '1rem', alignItems: 'flex-end' }}>
                        <div>
                            <label style={labelStyle}>Temperatura (°C)</label>
                            <input type="number" style={inputStyle} placeholder="ej. 85"
                                value={params.temperature || ''} onChange={e => setParams({ ...params, temperature: Number(e.target.value) })} />
                        </div>
                        <div>
                            <label style={labelStyle}>Micras (µ)</label>
                            <input type="number" style={inputStyle} placeholder="ej. 73"
                                value={params.micron || ''} onChange={e => setParams({ ...params, micron: Number(e.target.value) })} />
                        </div>
                        <div>
                            <label style={labelStyle}>Tiempo (seg)</label>
                            <input type="number" style={inputStyle} placeholder="ej. 120"
                                value={params.timeSeconds || ''} onChange={e => setParams({ ...params, timeSeconds: Number(e.target.value) })} />
                        </div>
                    </div>
                );
            case 'Ice':
                return (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', marginBottom: '1rem', alignItems: 'flex-end' }}>
                        <div>
                            <label style={labelStyle}>Lavados (#)</label>
                            <input type="number" style={inputStyle} placeholder="ej. 3"
                                value={params.washes || ''} onChange={e => setParams({ ...params, washes: Number(e.target.value) })} />
                        </div>
                        <div>
                            <label style={labelStyle}>Hielo</label>
                            <CustomSelect
                                value={params.iceType || 'cubes'}
                                onChange={(value: string) => setParams({ ...params, iceType: value })}
                                options={[
                                    { value: 'cubes', label: 'Cubos' },
                                    { value: 'crushed', label: 'Picado' },
                                    { value: 'dry_ice', label: 'Hielo Seco' }
                                ]}
                            />
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const selectedSource = sources.find(s => s.id === sourceId);

    return (
        <ModalOverlay $isClosing={isClosing}>
            <ModalContent $isClosing={isClosing}>

                {/* Header */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.25rem' }}>
                        <FaFlask color="#4ade80" /> {initialData ? 'Editar Extracción' : 'Nueva Extracción'}
                    </h2>
                    <button onClick={handleClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.5rem', padding: '0.5rem' }}><FaTimes /></button>
                </div>

                <div style={{ padding: 'max(1rem, 5%)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>

                        {/* Left Column: Data */}
                        <div>
                            {/* Source Selection */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={labelStyle}>Materia Prima (Cosecha/Lote)</label>
                                <CustomSelect
                                    value={sourceId}
                                    onChange={(val: string) => setSourceId(val)}
                                    placeholder="-- Seleccionar --"
                                    options={sources.map(s => ({
                                        value: s.id,
                                        label: `${s.strain_name} | ${s.batch_code} (${s.current_weight}g disp.)`
                                    }))}
                                />
                                {selectedSource && (
                                    <small style={{ color: '#4FD1C5', display: 'block', marginTop: '0.25rem' }}>
                                        Disponible: {selectedSource.current_weight}g - Calidad: {selectedSource.quality_grade}
                                    </small>
                                )}
                            </div>

                            {/* Technique & Date */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem', alignItems: 'flex-end' }}>
                                <div>
                                    <label style={labelStyle}>Técnica</label>
                                    <CustomSelect
                                        value={technique}
                                        onChange={(val: string) => setTechnique(val as ExtractionTechnique)}
                                        options={[
                                            { value: 'Rosin', label: 'Rosin Tech' },
                                            { value: 'BHO', label: 'BHO' },
                                            { value: 'Ice', label: 'Ice / Water Hash' },
                                            { value: 'Dry Sift', label: 'Dry Sift' }
                                        ]}
                                    />
                                </div>
                                <div style={{ minWidth: '150px' }}>
                                    <label style={labelStyle}>Fecha</label>
                                    <CustomDatePicker
                                        selected={date ? new Date(date + 'T12:00:00') : null}
                                        onChange={(newDate: Date | null) => setDate(newDate ? newDate.toISOString().split('T')[0] : '')}
                                    />
                                </div>
                            </div>

                            {/* Technique Specifics */}
                            {renderTechInputs()}

                            {/* Weights & Yield */}
                            <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(8px)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', gap: '0.5rem', color: '#facc15' }}>
                                    <FaCalculator /> <span style={{ fontWeight: 'bold' }}>Cálculo de Rendimiento</span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
                                    <div>
                                        <label style={labelStyle}>Entrada (g)</label>
                                        <input type="number" style={{ ...inputStyle, borderColor: 'rgba(250, 204, 21, 0.5)' }}
                                            value={inputWeight || ''} onChange={e => setInputWeight(Number(e.target.value))} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Salida / Retorno (g)</label>
                                        <input type="number" style={{ ...inputStyle, borderColor: 'rgba(74, 222, 128, 0.5)' }}
                                            value={outputWeight || ''} onChange={e => setOutputWeight(Number(e.target.value))} />
                                    </div>
                                </div>
                                <div style={{ marginTop: '1rem', textAlign: 'center', background: 'rgba(15, 23, 42, 0.4)', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                    <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Rendimiento: </span>
                                    <strong style={{ color: '#4ade80', fontSize: '1.5rem' }}>{calculateYield()}%</strong>
                                </div>
                            </div>

                        </div>

                        {/* Right Column: Rating & Notes */}
                        <div>
                            <TastingRating ratings={ratings} onChange={setRatings} />

                            <div style={{ marginTop: '1.5rem' }}>
                                <label style={labelStyle}>Notas del Proceso</label>
                                <textarea
                                    rows={5}
                                    style={{ ...inputStyle, minHeight: '100px' }}
                                    placeholder="Detalles sobre el proceso, observaciones..."
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                />
                            </div>
                        </div>

                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        <button onClick={handleSubmit} style={{ ...primaryButtonStyle, width: '100%', justifyContent: 'center' }}>
                            <FaSave /> Guardar Extracción
                        </button>
                        <button onClick={handleClose} style={{ ...cancelButtonStyle, width: '100%' }}>Cancelar</button>
                    </div>
                </div>

            </ModalContent>
        </ModalOverlay>
    );
};

const labelStyle = { display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.5rem', fontWeight: 600 as any };
const inputStyle = { width: '100%', padding: '0.6rem 0.75rem', background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '0.5rem', color: '#f8fafc', fontSize: '1rem', lineHeight: '1.5', boxSizing: 'border-box' as any, backdropFilter: 'blur(8px)' };
const primaryButtonStyle = { background: 'rgba(168, 85, 247, 0.2)', color: '#d8b4fe', border: '1px solid rgba(168, 85, 247, 0.5)', padding: '0.75rem 2rem', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', backdropFilter: 'blur(8px)', transition: 'all 0.2s', boxShadow: '0 4px 6px rgba(0,0,0,0.2)' };
const cancelButtonStyle = { background: 'rgba(30, 41, 59, 0.6)', color: '#cbd5e1', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '0.75rem 2rem', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(8px)', transition: 'all 0.2s' };
