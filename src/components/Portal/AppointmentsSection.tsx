import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useOrganization } from '../../context/OrganizationContext';
import { FaCalendarPlus, FaCalendarAlt, FaSpinner, FaClock, FaCheckCircle, FaTimesCircle, FaBan, FaLeaf, FaStethoscope, FaClipboardList, FaChevronRight } from 'react-icons/fa';

/* ============= STYLES ============= */
const fadeIn = keyframes`from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); }`;

const Container = styled.div`
  max-width: 900px;
  width: 100%;
  animation: ${fadeIn} 0.4s ease-out;
`;

const Header = styled.div`
  margin-bottom: 2rem;
  h2 { font-size: 2rem; color: var(--primary-color, #4ade80); margin: 0 0 0.5rem 0; }
  p { color: #94a3b8; font-size: 1.1rem; margin: 0; }
`;

const Card = styled.div`
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 1.5rem;
  backdrop-filter: blur(8px);
  @media (max-width: 640px) { padding: 1.25rem; }
`;

const CardTitle = styled.h3`
  color: #f8fafc;
  font-size: 1.15rem;
  margin: 0 0 1.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  svg { color: var(--primary-color, #4ade80); }
`;

const TypeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const TypeCard = styled.button<{ active?: boolean }>`
  background: ${p => p.active ? 'rgba(74, 222, 128, 0.1)' : 'rgba(0,0,0,0.2)'};
  border: 2px solid ${p => p.active ? 'var(--primary-color, #4ade80)' : 'rgba(255,255,255,0.08)'};
  border-radius: 14px;
  padding: 1.5rem;
  cursor: pointer;
  text-align: center;
  transition: all 0.25s;
  color: ${p => p.active ? '#f8fafc' : '#94a3b8'};

  &:hover {
    border-color: rgba(74, 222, 128, 0.5);
    background: rgba(74, 222, 128, 0.05);
    transform: translateY(-2px);
  }

  svg { font-size: 2rem; margin-bottom: 0.75rem; display: block; margin: 0 auto 0.75rem; color: ${p => p.active ? 'var(--primary-color, #4ade80)' : '#64748b'}; }
  .type-name { font-weight: 700; font-size: 1rem; margin-bottom: 0.25rem; }
  .type-desc { font-size: 0.8rem; color: #64748b; }
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
  @media (max-width: 640px) { grid-template-columns: 1fr; }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  label {
    font-size: 0.8rem;
    color: #94a3b8;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  input, select, textarea {
    padding: 0.75rem 1rem;
    background: rgba(0,0,0,0.3);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    color: #f8fafc;
    font-size: 0.95rem;
    transition: border-color 0.2s;

    &:focus {
      outline: none;
      border-color: var(--primary-color, #4ade80);
    }
  }

  textarea { resize: vertical; min-height: 80px; }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 0.875rem;
  background: var(--primary-color, #4ade80);
  color: #020617;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover { filter: brightness(1.1); transform: translateY(-1px); }
  &:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
`;

const AppointmentsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const AppointmentItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: rgba(0,0,0,0.2);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px;
  transition: background 0.2s;

  &:hover { background: rgba(0,0,0,0.3); }

  .apt-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    flex-shrink: 0;
  }

  .apt-info {
    flex: 1;
    min-width: 0;
    .apt-type { font-weight: 700; color: #e2e8f0; margin-bottom: 0.2rem; }
    .apt-datetime { font-size: 0.85rem; color: #64748b; display: flex; align-items: center; gap: 0.4rem; }
  }
`;

const StatusBadge = styled.span<{ status: string }>`
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
  ${({ status }) => {
    const map: Record<string, string> = {
      pending: 'background: rgba(245,158,11,0.15); color: #fbbf24;',
      confirmed: 'background: rgba(59,130,246,0.15); color: #60a5fa;',
      completed: 'background: rgba(34,197,94,0.15); color: #4ade80;',
      cancelled: 'background: rgba(239,68,68,0.15); color: #f87171;',
      no_show: 'background: rgba(148,163,184,0.15); color: #94a3b8;',
    };
    return map[status] || map.pending;
  }}
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  background: rgba(30, 41, 59, 0.3);
  border-radius: 16px;
  border: 1px dashed rgba(255,255,255,0.08);
  svg { font-size: 3rem; color: #334155; margin-bottom: 1rem; }
  h3 { color: #94a3b8; margin: 0 0 0.5rem; }
  p { color: #64748b; font-size: 0.9rem; margin: 0; }
`;

const Loader = styled.div`
  display: flex; align-items: center; justify-content: center; padding: 4rem; color: #64748b;
  svg { animation: spin 1s linear infinite; font-size: 2rem; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

const TabBar = styled.div`
  display: flex;
  gap: 0;
  margin-bottom: 2rem;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.08);
`;

const Tab = styled.button<{ active?: boolean }>`
  flex: 1;
  padding: 0.85rem 1rem;
  background: ${p => p.active ? 'rgba(74, 222, 128, 0.1)' : 'rgba(0,0,0,0.2)'};
  color: ${p => p.active ? 'var(--primary-color, #4ade80)' : '#94a3b8'};
  border: none;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 2px solid ${p => p.active ? 'var(--primary-color, #4ade80)' : 'transparent'};

  &:hover { color: #f8fafc; background: rgba(255,255,255,0.03); }
`;

/* ============= COMPONENT ============= */
const APPOINTMENT_TYPES = [
  { id: 'dispensa', label: 'Dispensa', desc: 'Retiro de insumos', icon: FaLeaf, color: '#4ade80' },
  { id: 'consulta_medica', label: 'Consulta Médica', desc: 'Con profesional de salud', icon: FaStethoscope, color: '#60a5fa' },
  { id: 'tramite', label: 'Trámite', desc: 'Gestión administrativa', icon: FaClipboardList, color: '#fbbf24' },
];

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  completed: 'Completado',
  cancelled: 'Cancelado',
  no_show: 'No asistió',
};

export const AppointmentsSection: React.FC = () => {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();

  const [view, setView] = useState<'list' | 'new'>('list');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [patientId, setPatientId] = useState<string | null>(null);

  // Form state
  const [selectedType, setSelectedType] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchAppointments();
  }, [user, currentOrganization]);

  const fetchAppointments = async () => {
    if (!user || !currentOrganization) return;
    setLoading(true);
    try {
      // Get patient ID
      const { data: patient } = await supabase
        .from('aurora_patients')
        .select('id')
        .eq('profile_id', user.id)
        .eq('organization_id', currentOrganization.id)
        .single();

      if (patient) {
        setPatientId(patient.id);

        const { data: apts } = await supabase
          .from('appointments')
          .select('*')
          .eq('patient_id', patient.id)
          .eq('organization_id', currentOrganization.id)
          .order('scheduled_date', { ascending: false });

        setAppointments(apts || []);
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedType || !selectedDate || !selectedTime || !patientId || !currentOrganization) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('appointments').insert({
        organization_id: currentOrganization.id,
        patient_id: patientId,
        appointment_type: selectedType,
        scheduled_date: selectedDate,
        scheduled_time: selectedTime,
        notes: notes || null,
        status: 'pending',
      });

      if (error) throw error;

      // Reset form
      setSelectedType('');
      setSelectedDate('');
      setSelectedTime('');
      setNotes('');
      setView('list');
      await fetchAppointments();
    } catch (err) {
      console.error('Error creating appointment:', err);
      alert('Error al solicitar el turno. Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const getTypeInfo = (type: string) => APPOINTMENT_TYPES.find(t => t.id === type) || APPOINTMENT_TYPES[0];

  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];

  if (loading) return <Loader><FaSpinner /></Loader>;

  return (
    <Container>
      <Header>
        <h2>Turnos</h2>
        <p>Solicitá y gestioná tus turnos con el club.</p>
      </Header>

      <TabBar>
        <Tab active={view === 'list'} onClick={() => setView('list')}>
          <FaCalendarAlt style={{ marginRight: 6 }} /> Mis Turnos
        </Tab>
        <Tab active={view === 'new'} onClick={() => setView('new')}>
          <FaCalendarPlus style={{ marginRight: 6 }} /> Solicitar Turno
        </Tab>
      </TabBar>

      {view === 'new' ? (
        <Card>
          <CardTitle><FaCalendarPlus /> Nuevo Turno</CardTitle>

          {/* Type Selection */}
          <div style={{ marginBottom: '0.5rem', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Tipo de Turno
          </div>
          <TypeGrid>
            {APPOINTMENT_TYPES.map(type => (
              <TypeCard key={type.id} active={selectedType === type.id} onClick={() => setSelectedType(type.id)}>
                <type.icon />
                <div className="type-name">{type.label}</div>
                <div className="type-desc">{type.desc}</div>
              </TypeCard>
            ))}
          </TypeGrid>

          {/* Date & Time */}
          <FormRow>
            <FormGroup>
              <label>Fecha</label>
              <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} min={today} />
            </FormGroup>
            <FormGroup>
              <label>Hora</label>
              <input type="time" value={selectedTime} onChange={e => setSelectedTime(e.target.value)} />
            </FormGroup>
          </FormRow>

          {/* Notes */}
          <FormGroup>
            <label>Notas (Opcional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ej: Necesito retirar aceite de CBD..." />
          </FormGroup>

          <SubmitButton onClick={handleSubmit} disabled={!selectedType || !selectedDate || !selectedTime || submitting}>
            {submitting ? <><FaSpinner className="fa-spin" /> Solicitando...</> : <><FaCalendarPlus /> Solicitar Turno</>}
          </SubmitButton>
        </Card>
      ) : (
        <>
          {appointments.length === 0 ? (
            <EmptyState>
              <FaCalendarAlt />
              <h3>No tenés turnos</h3>
              <p>Solicitá tu primer turno haciendo clic en "Solicitar Turno".</p>
            </EmptyState>
          ) : (
            <AppointmentsList>
              {appointments.map(apt => {
                const typeInfo = getTypeInfo(apt.appointment_type);
                const Icon = typeInfo.icon;
                return (
                  <AppointmentItem key={apt.id}>
                    <div className="apt-icon" style={{ background: `${typeInfo.color}15`, color: typeInfo.color }}>
                      <Icon />
                    </div>
                    <div className="apt-info">
                      <div className="apt-type">{typeInfo.label}</div>
                      <div className="apt-datetime">
                        <FaClock />
                        {new Date(apt.scheduled_date + 'T00:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        {' · '}
                        {apt.scheduled_time?.slice(0, 5)}
                      </div>
                      {apt.notes && <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>{apt.notes}</div>}
                    </div>
                    <StatusBadge status={apt.status}>{STATUS_LABELS[apt.status] || apt.status}</StatusBadge>
                  </AppointmentItem>
                );
              })}
            </AppointmentsList>
          )}
        </>
      )}
    </Container>
  );
};
