import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useParams, useLocation } from 'react-router-dom';
import { patientsService } from '../services/patientsService';
import { templatesService, ClinicalTemplate } from '../services/templatesService';
import { FaHeartbeat, FaPills, FaChartLine, FaUserSecret, FaPlus, FaClipboardList, FaHistory, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { LoadingSpinner } from '../components/LoadingSpinner';

// --- Styled Components (Dashboard First) ---

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem;
  color: #f8fafc;
  min-height: 100vh;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  
  h1 {
    font-size: 1.5rem;
    color: #f8fafc;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
`;

const HashBadge = styled.span`
  background: rgba(15, 23, 42, 0.6);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.3);
  font-family: monospace;
  padding: 0.25rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  letter-spacing: 0.05em;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
`;

const Card = styled.div<{ color?: string }>`
  background: rgba(30, 41, 59, 0.6);
  backdrop-filter: blur(12px);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-top: 4px solid ${props => props.color || 'rgba(255, 255, 255, 0.1)'};
  position: relative;
  overflow: hidden;
  color: #f8fafc;
`;

const CardTitle = styled.h3`
  font-size: 1.1rem;
  color: #f8fafc;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

// --- Custom Components ---

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
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: white;
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    cursor: pointer;
    border: 2px solid #2d3748;
  }
`;

const MetricBox = styled.div`
  margin-bottom: 1.5rem;
  p { margin: 0; font-size: 0.9rem; color: #94a3b8; }
  .value { font-size: 1.5rem; font-weight: bold; color: #f8fafc; }
`;

const calculateAge = (dob: string | undefined) => {
    if (!dob) return '-';
    const diff = Date.now() - new Date(dob).getTime();
    if (isNaN(diff)) return '-';
    const age = new Date(diff);
    return Math.abs(age.getUTCFullYear() - 1970);
};

const PatientDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();

    const [loading, setLoading] = useState(true);
    const [patient, setPatient] = useState<any | null>(null);
    const [admission, setAdmission] = useState<any | null>(null);
    const [evolutions, setEvolutions] = useState<any[]>([]);
    const [templates, setTemplates] = useState<ClinicalTemplate[]>([]);

    // UI State for Accordion
    const [expandedEvos, setExpandedEvos] = useState<number[]>([]);

    // Evolution Form State
    const [isEvolutionModalOpen, setIsEvolutionModalOpen] = useState(false);
    const [newEvolution, setNewEvolution] = useState({
        eva_score: 0,
        notes: '',
        sparing_effect: [] as any[],
        adverse_effects: [] as any[],
        template_id: null as string | null,
        template_data: {} as Record<string, any>
    });

    // Admission Form State
    const [isAdmitting, setIsAdmitting] = useState(false);
    const [newAdmission, setNewAdmission] = useState({
        baseline_qol: 50,
        baseline_pain_avg: 5,
        baseline_pain_worst: 8,
        diagnosis_cie11: [] as string[],
        template_id: null as string | null,
        template_data: {} as Record<string, any>
    });

    useEffect(() => {
        if (id) loadData(id);

        async function fetchTemplates() {
            const data = await templatesService.getTemplates();
            setTemplates(data);
        }
        fetchTemplates();
    }, [id]);

    const loadData = async (patientId: string) => {
        setLoading(true);
        try {
            const pat = await patientsService.getPatientById(patientId);
            setPatient(pat);

            const adm = await patientsService.getClinicalAdmission(patientId);
            setAdmission(adm);

            if (adm) {
                const evos = await patientsService.getEvolutions(adm.id);
                setEvolutions(evos);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);

            // Handle automatic opening from the "Seguimiento" button
            const params = new URLSearchParams(window.location.search);
            if (params.get('action') === 'new_followup') {
                setTimeout(() => setIsEvolutionModalOpen(true), 100);
            }
        }
    };

    const handleCreateAdmission = async () => {
        if (!id) return;
        try {
            // Generate hash manually for display
            const cleanId = id.replace(/-/g, '').substring(0, 8).toUpperCase();
            const hash = `ANON-${cleanId}`;

            const createdAdmission = await patientsService.createClinicalAdmission({
                patient_id: id,
                baseline_qol: 0,
                baseline_pain_avg: 0,
                baseline_pain_worst: 0,
                diagnosis_cie11: [],
                patient_hash: hash // Override with generated hash
            });

            // Automatically create the baseline evolution if a template was selected
            if (createdAdmission && newAdmission.template_id) {
                await patientsService.addEvolution({
                    admission_id: createdAdmission.id,
                    date: new Date().toISOString().split('T')[0],
                    eva_score: 0,
                    improvement_percent: 0,
                    notes: 'Línea base (Admisión Clínica)',
                    sparing_effect: [],
                    adverse_effects: [],
                    template_id: newAdmission.template_id,
                    template_data: newAdmission.template_data
                });
            }

            loadData(id);
            setIsAdmitting(false);
        } catch (e) {
            alert("Error creating admission");
        }
    };

    const handleAddEvolution = async () => {
        if (!admission) return;
        try {
            let actualEvaScore = newEvolution.eva_score;

            // Si el EVA fue cargado a través de una Plantilla Dinámica, sobreescribir el score nativo.
            if (newEvolution.template_id) {
                const template = templates.find((t: any) => t.id === newEvolution.template_id);
                const evaField = template?.fields?.find((f: any) => f.type === 'eva');
                if (evaField && newEvolution.template_data[evaField.id] !== undefined) {
                    actualEvaScore = Number(newEvolution.template_data[evaField.id]);
                }
            }

            let improvement = 0;
            if (admission.baseline_pain_avg > 0) {
                improvement = ((admission.baseline_pain_avg - actualEvaScore) / admission.baseline_pain_avg) * 100;
            }

            await patientsService.addEvolution({
                admission_id: admission.id,
                date: new Date().toISOString().split('T')[0], // Today
                eva_score: actualEvaScore,
                improvement_percent: parseFloat(improvement.toFixed(2)),
                notes: newEvolution.notes,
                sparing_effect: newEvolution.sparing_effect,
                adverse_effects: newEvolution.adverse_effects,
                template_id: newEvolution.template_id,
                template_data: newEvolution.template_data
            });

            loadData(id || '');
            setIsEvolutionModalOpen(false);
            setNewEvolution({ eva_score: 0, notes: '', sparing_effect: [], adverse_effects: [], template_id: null, template_data: {} }); // Reset
        } catch (e) {
            console.error(e);
            alert("Error adding evolution");
        }
    };

    if (loading) return <LoadingSpinner />;

    const lastVisitDate = evolutions.length > 0 ? evolutions[0].date : (admission ? new Date(admission.created_at).toLocaleDateString() : '-');
    const pathologyText = patient?.pathology || (admission?.diagnosis_cie11?.length ? admission.diagnosis_cie11.join(', ') : '-');

    const ProfileHeaderContent = (
        <Header>
            <div>
                <h1>{patient?.name || 'Perfil del Paciente'}</h1>
                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', color: '#94a3b8', fontSize: '0.95rem', flexWrap: 'wrap' }}>
                    <span><strong>DNI:</strong> {patient?.document_number || '-'}</span>
                    <span><strong>Edad:</strong> {calculateAge(patient?.date_of_birth)}</span>
                    <span><strong>Patología:</strong> {pathologyText}</span>
                    <span><strong>Últ. Consulta:</strong> {lastVisitDate}</span>
                    <span>
                        <strong>REPROCANN: </strong>
                        <span style={{
                            background: patient?.reprocann_number ? 'rgba(74, 222, 128, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                            color: patient?.reprocann_number ? '#4ade80' : '#f87171',
                            border: `1px solid ${patient?.reprocann_number ? 'rgba(74, 222, 128, 0.5)' : 'rgba(239, 68, 68, 0.5)'}`,
                            padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontWeight: 'bold', fontSize: '0.85rem'
                        }}>
                            {patient?.reprocann_number || 'Sin Vincular'}
                        </span>
                    </span>
                </div>
            </div>
            {admission && <HashBadge><FaUserSecret /> {admission.patient_hash}</HashBadge>}
        </Header>
    );

    if (!admission && !isAdmitting) {
        return (
            <Container>
                {ProfileHeaderContent}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', background: 'rgba(30, 41, 59, 0.6)', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)', border: '1px solid rgba(255, 255, 255, 0.05)', borderTop: '4px solid rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(12px)' }}>
                    <FaUserSecret size={64} color="#64748b" />
                    <h2 style={{ color: '#f8fafc', marginTop: '1.5rem' }}>Sin Datos Clínicos</h2>
                    <p style={{ color: '#718096', maxWidth: '400px', textAlign: 'center', marginBottom: '2rem' }}>
                        Este paciente aún no tiene una Admisión Clínica registrada (Baseline).
                    </p>
                    <button
                        style={{ padding: '1rem 2rem', background: '#319795', color: 'white', borderRadius: '0.5rem', border: 'none', fontSize: '1.1rem', cursor: 'pointer', fontWeight: 'bold' }}
                        onClick={() => setIsAdmitting(true)}
                    >
                        Iniciar Admisión Clínica
                    </button>
                </div>
            </Container>
        );
    }

    // --- ADMISSION FORM VIEW ---
    if (isAdmitting) {
        return (
            <Container>
                {ProfileHeaderContent}
                <Card color="#319795" style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <CardTitle>Línea Base (Baseline Metrics)</CardTitle>

                    {/* Template Selector Section */}
                    <div style={{ background: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
                        <label style={{ marginBottom: '0.5rem', fontWeight: 'bold', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FaClipboardList /> Seleccionar Plantilla Clínica (Obligatorio)
                        </label>
                        <select
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.2)', fontFamily: 'inherit', background: 'rgba(15, 23, 42, 0.8)', color: 'white' }}
                            value={newAdmission.template_id || ''}
                            onChange={e => {
                                const tId = e.target.value;
                                if (!tId) {
                                    setNewAdmission({ ...newAdmission, template_id: null, template_data: {} });
                                    return;
                                }
                                const selected = templates.find((t: any) => t.id === tId);
                                const defaultData: Record<string, any> = {};
                                selected?.fields.forEach((f: any) => {
                                    if (f.type === 'checkbox') defaultData[f.id] = [];
                                    else defaultData[f.id] = '';
                                });
                                setNewAdmission({ ...newAdmission, template_id: tId, template_data: defaultData });
                            }}
                        >
                            <option value="">Seleccione una plantilla...</option>
                            {templates.map((t: any) => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Dynamics fields block */}
                    {newAdmission.template_id && (
                        <div style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            <h4 style={{ margin: '0 0 1rem 0', color: '#f8fafc' }}>Completar Datos de la Plantilla</h4>
                            {templates.find((t: any) => t.id === newAdmission.template_id)?.fields.map((field: any) => (
                                <div key={field.id} style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#cbd5e1', fontSize: '0.9rem' }}>
                                        {field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
                                    </label>

                                    {field.type === 'text' && (
                                        <input
                                            type="text"
                                            style={{ width: '100%', padding: '0.6rem', borderRadius: '0.375rem', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(15, 23, 42, 0.5)', color: 'white' }}
                                            value={newAdmission.template_data[field.id] || ''}
                                            onChange={e => setNewAdmission({ ...newAdmission, template_data: { ...newAdmission.template_data, [field.id]: e.target.value } })}
                                            required={field.required}
                                        />
                                    )}
                                    {field.type === 'textarea' && (
                                        <textarea
                                            style={{ width: '100%', padding: '0.6rem', borderRadius: '0.375rem', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(15, 23, 42, 0.5)', color: 'white', minHeight: '80px' }}
                                            value={newAdmission.template_data[field.id] || ''}
                                            onChange={e => setNewAdmission({ ...newAdmission, template_data: { ...newAdmission.template_data, [field.id]: e.target.value } })}
                                            required={field.required}
                                        />
                                    )}
                                    {field.type === 'date' && (
                                        <input
                                            type="date"
                                            style={{ width: '100%', padding: '0.6rem', borderRadius: '0.375rem', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(15, 23, 42, 0.5)', color: 'white' }}
                                            value={newAdmission.template_data[field.id] || ''}
                                            onChange={e => setNewAdmission({ ...newAdmission, template_data: { ...newAdmission.template_data, [field.id]: e.target.value } })}
                                            required={field.required}
                                        />
                                    )}
                                    {field.type === 'select' && (
                                        <select
                                            style={{ width: '100%', padding: '0.6rem', borderRadius: '0.375rem', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(15, 23, 42, 0.9)', color: 'white' }}
                                            value={newAdmission.template_data[field.id] || ''}
                                            onChange={e => setNewAdmission({ ...newAdmission, template_data: { ...newAdmission.template_data, [field.id]: e.target.value } })}
                                            required={field.required}
                                        >
                                            <option value="">Seleccione...</option>
                                            {field.options?.map((opt: string) => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    )}
                                    {field.type === 'checkbox' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(15, 23, 42, 0.5)', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid rgba(255,255,255,0.2)', color: 'lightgray' }}>
                                            {field.options?.map((opt: string) => {
                                                const isChecked = (newAdmission.template_data[field.id] || []).includes(opt);
                                                return (
                                                    <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer', margin: 0 }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            onChange={e => {
                                                                const current = [...(newAdmission.template_data[field.id] || [])];
                                                                if (e.target.checked) current.push(opt);
                                                                else {
                                                                    const idx = current.indexOf(opt);
                                                                    if (idx > -1) current.splice(idx, 1);
                                                                }
                                                                setNewAdmission({ ...newAdmission, template_data: { ...newAdmission.template_data, [field.id]: current } });
                                                            }}
                                                        />
                                                        {opt}
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    )}
                                    {field.type === 'eva' && (
                                        <div style={{ marginTop: '0.5rem', marginBottom: '1rem', background: 'rgba(15, 23, 42, 0.4)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>0 (Sin Dolor)</span>
                                                <span style={{ fontWeight: 'bold', color: '#f8fafc', fontSize: '1.2rem', background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.8rem', borderRadius: '0.25rem' }}>{newAdmission.template_data[field.id] || 0}</span>
                                                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>10 (Máximo Dolor)</span>
                                            </div>
                                            <ChromaticSlider
                                                type="range" min="0" max="10"
                                                value={newAdmission.template_data[field.id] || 0}
                                                onChange={e => setNewAdmission({ ...newAdmission, template_data: { ...newAdmission.template_data, [field.id]: Number(e.target.value) } })}
                                                style={{ margin: 0 }}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button onClick={() => setIsAdmitting(false)} style={{ padding: '0.75rem 1.5rem', background: '#CBD5E0', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>Cancelar</button>
                        <button onClick={handleCreateAdmission} disabled={!newAdmission.template_id} style={{ padding: '0.75rem 1.5rem', background: newAdmission.template_id ? '#319795' : '#4a5568', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: newAdmission.template_id ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}>Guardar Admisión</button>
                    </div>
                </Card>
            </Container>
        )
    }

    // --- DASHBOARD VIEW ---
    return (
        <Container>
            {ProfileHeaderContent}

            <Grid>

                {/* 2. Pharmacology Card */}
                <Card color="#805AD5">
                    <CardTitle><FaPills /> Farmacología Actual</CardTitle>
                    {admission.medications && admission.medications.length > 0 ? (
                        <ul>
                            {admission.medications.map((med: any, i: number) => (
                                <li key={i}>{med.name} - {med.dose}</li>
                            ))}
                        </ul>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '1rem', color: '#A0AEC0', border: '1px dashed #CBD5E0', borderRadius: '0.5rem' }}>
                            Sin medicación registrada
                            <br /><small>No hay interacciones detectadas</small>
                        </div>
                    )}
                </Card>

                {/* 3. Evolution / Progress Highlight */}
                <Card color="#48BB78">
                    <CardTitle><FaChartLine /> Última Evolución</CardTitle>

                    {evolutions.length === 0 ? (
                        <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>No hay evoluciones registradas.</p>
                    ) : (
                        <div>
                            {/* Latest Evolution Highlight */}
                            <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '1rem' }}>Última visita: {evolutions[0].date}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ flex: 1, padding: '1rem', background: 'rgba(74, 222, 128, 0.1)', borderRadius: '0.5rem', border: '1px solid rgba(74, 222, 128, 0.2)' }}>
                                    <small style={{ color: '#4ade80', fontWeight: 'bold' }}>MEJORÍA GLOBAL</small>
                                    <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#f8fafc' }}>
                                        {evolutions[0].improvement_percent > 0 ? '+' : ''}{evolutions[0].improvement_percent || 0}%
                                    </div>
                                </div>
                                <div style={{ flex: 1, padding: '1rem', background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem' }}>
                                    <small style={{ color: '#94a3b8', fontWeight: 'bold' }}>DOLOR ACTUAL (EVA)</small>
                                    <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#f8fafc' }}>
                                        {evolutions[0].eva_score} <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: '#64748b' }}>/ 10</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </Card>
            </Grid>

            {/* 4. Full Clinical History Container */}
            <Card color="#3182ce" style={{ marginTop: '1.5rem', width: '100%', maxWidth: 'none' }}>
                <CardTitle style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <span><FaHistory /> Historial Clínico</span>
                    <button
                        onClick={() => setIsEvolutionModalOpen(true)}
                        style={{ background: 'rgba(49, 130, 206, 0.2)', color: '#63b3ed', border: '1px solid rgba(49, 130, 206, 0.4)', padding: '0.4rem 0.8rem', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 'bold' }}>
                        <FaPlus /> Nueva Evolución / Acción
                    </button>
                </CardTitle>

                {evolutions.length === 0 ? (
                    <p style={{ color: '#94a3b8', fontStyle: 'italic', padding: '1rem' }}>No hay acciones ni evoluciones en el historial.</p>
                ) : (
                    <div style={{ maxHeight: '600px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                        {evolutions.map((evo, idx) => {
                            const isExpanded = expandedEvos.includes(idx);
                            // Format HH:mm from created_at if available
                            const timeString = evo.created_at ? new Date(evo.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

                            return (
                                <div key={idx} style={{ padding: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', background: idx % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'transparent', transition: 'all 0.2s ease' }}>

                                    {/* Compact Row Header (Clickable) */}
                                    <div
                                        onClick={() => setExpandedEvos(prev => isExpanded ? prev.filter(i => i !== idx) : [...prev, idx])}
                                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', paddingBottom: isExpanded ? '0.75rem' : '0' }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ fontWeight: 'bold', color: '#e2e8f0', fontSize: '1.1rem' }}>
                                                {evo.date} {timeString && <span style={{ fontSize: '0.85rem', color: '#94a3b8', marginLeft: '0.25rem', fontWeight: 'normal' }}>{timeString}</span>}
                                            </div>
                                            <div style={{ color: evo.improvement_percent >= 0 ? '#4ade80' : '#f87171', fontWeight: 'bold', fontSize: '0.85rem', background: evo.improvement_percent >= 0 ? 'rgba(74, 222, 128, 0.1)' : 'rgba(248, 113, 113, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '0.25rem' }}>
                                                {evo.improvement_percent > 0 ? '+' : ''}{evo.improvement_percent}%
                                            </div>
                                        </div>
                                        <div style={{ color: '#64748b', transition: 'transform 0.2s ease', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                                            <FaChevronDown />
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    {isExpanded && (
                                        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1rem', marginTop: '0.25rem', animation: 'fadeIn 0.3s ease' }}>
                                            <div style={{ fontSize: '0.95rem', color: '#cbd5e1', marginBottom: '1rem' }}>
                                                <strong style={{ color: '#e2e8f0' }}>EVA:</strong> {evo.eva_score} {evo.notes && <span style={{ marginLeft: '0.5rem', color: '#94a3b8' }}>- {evo.notes}</span>}
                                            </div>

                                            {evo.template_data && Object.keys(evo.template_data).length > 0 && (
                                                <div style={{ fontSize: '0.9rem', background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: '0.5rem', color: '#e2e8f0', border: '1px solid rgba(255, 255, 255, 0.05)', boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.1)' }}>
                                                    {Object.entries(evo.template_data).map(([key, val]) => {
                                                        const template = templates.find((t: any) => t.id === evo.template_id);
                                                        const field = template?.fields?.find((f: any) => f.id === key);
                                                        const label = field ? field.label : key;
                                                        const displayVal = Array.isArray(val) ? val.join(', ') : val;
                                                        if (!displayVal) return null;
                                                        return (
                                                            <div key={key} style={{ marginBottom: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                                                <strong style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</strong>
                                                                <span style={{ color: '#f8fafc', fontSize: '1rem' }}>{String(displayVal)}</span>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>

            {/* EVOLUTION MODAL */}
            {isEvolutionModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <Card style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <CardTitle>Registrar Evolución</CardTitle>



                        {/* Template Selector Section */}
                        <div style={{ background: '#F0FFF4', border: '1px solid #C6F6D5', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
                            <label style={{ marginBottom: '0.5rem', fontWeight: 'bold', color: '#276749', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FaClipboardList /> Utilizar Plantilla Clínica
                            </label>
                            <select
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #9AE6B4', fontFamily: 'inherit', background: 'white' }}
                                value={newEvolution.template_id || ''}
                                onChange={e => {
                                    const tId = e.target.value;
                                    if (!tId) {
                                        setNewEvolution({ ...newEvolution, template_id: null, template_data: {} });
                                        return;
                                    }
                                    const selected = templates.find(t => t.id === tId);
                                    const defaultData: Record<string, any> = {};
                                    selected?.fields.forEach((f: any) => {
                                        if (f.type === 'checkbox') defaultData[f.id] = [];
                                        else defaultData[f.id] = '';
                                    });
                                    setNewEvolution({ ...newEvolution, template_id: tId, template_data: defaultData });
                                }}
                            >
                                <option value="">No usar plantilla (Evolución Libre)</option>
                                {templates.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Dynamics fields block */}
                        {newEvolution.template_id && (
                            <div style={{ background: '#f7fafc', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
                                <h4 style={{ margin: '0 0 1rem 0', color: '#4A5568' }}>Datos de la Plantilla</h4>
                                {templates.find(t => t.id === newEvolution.template_id)?.fields.map((field: any) => (
                                    <div key={field.id} style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#4A5568', fontSize: '0.9rem' }}>
                                            {field.label} {field.required && <span style={{ color: '#e53e3e' }}>*</span>}
                                        </label>

                                        {field.type === 'text' && (
                                            <input
                                                type="text"
                                                style={{ width: '100%', padding: '0.6rem', borderRadius: '0.375rem', border: '1px solid #CBD5E0' }}
                                                value={newEvolution.template_data[field.id] || ''}
                                                onChange={e => setNewEvolution({ ...newEvolution, template_data: { ...newEvolution.template_data, [field.id]: e.target.value } })}
                                                required={field.required}
                                            />
                                        )}
                                        {field.type === 'textarea' && (
                                            <textarea
                                                style={{ width: '100%', padding: '0.6rem', borderRadius: '0.375rem', border: '1px solid #CBD5E0', minHeight: '80px' }}
                                                value={newEvolution.template_data[field.id] || ''}
                                                onChange={e => setNewEvolution({ ...newEvolution, template_data: { ...newEvolution.template_data, [field.id]: e.target.value } })}
                                                required={field.required}
                                            />
                                        )}
                                        {field.type === 'date' && (
                                            <input
                                                type="date"
                                                style={{ width: '100%', padding: '0.6rem', borderRadius: '0.375rem', border: '1px solid #CBD5E0' }}
                                                value={newEvolution.template_data[field.id] || ''}
                                                onChange={e => setNewEvolution({ ...newEvolution, template_data: { ...newEvolution.template_data, [field.id]: e.target.value } })}
                                                required={field.required}
                                            />
                                        )}
                                        {field.type === 'select' && (
                                            <select
                                                style={{ width: '100%', padding: '0.6rem', borderRadius: '0.375rem', border: '1px solid #CBD5E0', background: 'white' }}
                                                value={newEvolution.template_data[field.id] || ''}
                                                onChange={e => setNewEvolution({ ...newEvolution, template_data: { ...newEvolution.template_data, [field.id]: e.target.value } })}
                                                required={field.required}
                                            >
                                                <option value="">Seleccione...</option>
                                                {field.options?.map((opt: string) => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        )}
                                        {field.type === 'checkbox' && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'white', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #CBD5E0' }}>
                                                {field.options?.map((opt: string) => {
                                                    const isChecked = (newEvolution.template_data[field.id] || []).includes(opt);
                                                    return (
                                                        <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer', margin: 0 }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={e => {
                                                                    const current = [...(newEvolution.template_data[field.id] || [])];
                                                                    if (e.target.checked) current.push(opt);
                                                                    else {
                                                                        const idx = current.indexOf(opt);
                                                                        if (idx > -1) current.splice(idx, 1);
                                                                    }
                                                                    setNewEvolution({ ...newEvolution, template_data: { ...newEvolution.template_data, [field.id]: current } });
                                                                }}
                                                            />
                                                            {opt}
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        {field.type === 'eva' && (
                                            <div style={{ marginTop: '0.5rem', marginBottom: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #CBD5E0' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>0 (Sin Dolor)</span>
                                                    <span style={{ fontWeight: 'bold', color: '#334155', fontSize: '1.2rem', background: '#e2e8f0', padding: '0.2rem 0.8rem', borderRadius: '0.25rem' }}>{newEvolution.template_data[field.id] || 0}</span>
                                                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>10 (Máximo Dolor)</span>
                                                </div>
                                                <ChromaticSlider
                                                    type="range" min="0" max="10"
                                                    value={newEvolution.template_data[field.id] || 0}
                                                    onChange={e => setNewEvolution({ ...newEvolution, template_data: { ...newEvolution.template_data, [field.id]: Number(e.target.value) } })}
                                                    style={{ margin: 0 }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#4A5568', marginTop: '1.5rem' }}>Notas de Evolución (Adicional)</label>
                        <textarea
                            style={{ width: '100%', height: '100px', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #CBD5E0', fontFamily: 'inherit' }}
                            placeholder="Notas libres de evolución del paciente..."
                            value={newEvolution.notes}
                            onChange={e => setNewEvolution({ ...newEvolution, notes: e.target.value })}
                        />

                        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button onClick={() => setIsEvolutionModalOpen(false)} style={{ padding: '0.75rem 1.5rem', background: '#CBD5E0', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>Cancelar</button>
                            <button onClick={handleAddEvolution} style={{ padding: '0.75rem 1.5rem', background: '#319795', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>Guardar</button>
                        </div>
                    </Card>
                </div>
            )}
        </Container>
    );
};

export default PatientDetail;
