import React, { useEffect, useState, useMemo } from 'react';
import styled, { keyframes } from 'styled-components';
import { supabase, getSelectedOrgId } from '../services/supabaseClient';
import {
  FaCalendarAlt, FaCalendarPlus, FaCheck, FaTimes, FaClock, FaSpinner,
  FaLeaf, FaStethoscope, FaClipboardList, FaFilter, FaUserMd, FaBan,
  FaChevronLeft, FaChevronRight, FaList, FaThLarge
} from 'react-icons/fa';

/* ============= STYLES ============= */
const fadeIn = keyframes`from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); }`;

const PageContainer = styled.div`
  animation: ${fadeIn} 0.4s ease-out;
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;

  h1 {
    font-size: 2rem;
    color: #f8fafc;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    svg { color: #4ade80; }
  }

  p { color: #94a3b8; margin: 0.25rem 0 0; }
`;

const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div<{ color: string }>`
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 14px;
  padding: 1.25rem;
  text-align: center;
  border-top: 3px solid ${p => p.color};

  .value { font-size: 2rem; font-weight: 800; color: #f8fafc; }
  .label { font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 0.25rem; }
`;

const FilterBar = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  align-items: center;
`;

const FilterChip = styled.button<{ active?: boolean }>`
  padding: 0.5rem 1rem;
  border-radius: 999px;
  border: 1px solid ${p => p.active ? 'var(--primary-color, #4ade80)' : 'rgba(255,255,255,0.1)'};
  background: ${p => p.active ? 'rgba(74, 222, 128, 0.1)' : 'rgba(0,0,0,0.2)'};
  color: ${p => p.active ? 'var(--primary-color, #4ade80)' : '#94a3b8'};
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover { border-color: var(--primary-color, #4ade80); color: #f8fafc; }
`;

const DateNav = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-left: auto;

  button {
    background: rgba(0,0,0,0.2);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    color: #94a3b8;
    padding: 0.5rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    &:hover { color: #f8fafc; border-color: rgba(255,255,255,0.2); }
  }

  span { color: #f8fafc; font-weight: 600; min-width: 180px; text-align: center; }

  input[type="date"] {
    background: rgba(0,0,0,0.3);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    color: #f8fafc;
    padding: 0.5rem;
    cursor: pointer;
  }
`;

const Table = styled.div`
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 16px;
  overflow: hidden;
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 2fr 1.5fr 1fr 1fr 1.5fr 120px;
  padding: 1rem 1.5rem;
  background: rgba(0,0,0,0.2);
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid rgba(255,255,255,0.05);

  @media (max-width: 900px) {
    display: none;
  }
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: 2fr 1.5fr 1fr 1fr 1.5fr 120px;
  padding: 1rem 1.5rem;
  align-items: center;
  border-bottom: 1px solid rgba(255,255,255,0.03);
  transition: background 0.2s;

  &:hover { background: rgba(255,255,255,0.02); }
  &:last-child { border-bottom: none; }

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: 0.5rem;
    padding: 1rem;
  }
`;

const PatientName = styled.div`
  font-weight: 600;
  color: #e2e8f0;
  .patient-email { font-size: 0.8rem; color: #64748b; font-weight: 400; }
`;

const TypeBadge = styled.span<{ type: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  ${({ type }) => {
    const map: Record<string, string> = {
      dispensa: 'background: rgba(74,222,128,0.12); color: #4ade80;',
      consulta_medica: 'background: rgba(96,165,250,0.12); color: #60a5fa;',
      tramite: 'background: rgba(251,191,36,0.12); color: #fbbf24;',
    };
    return map[type] || '';
  }}
`;

const StatusBadge = styled.span<{ status: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
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

const ActionButtons = styled.div`
  display: flex;
  gap: 0.4rem;
`;

const ActionBtn = styled.button<{ variant: 'confirm' | 'complete' | 'cancel' }>`
  padding: 0.4rem 0.6rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: all 0.2s;
  font-weight: 600;

  ${({ variant }) => {
    if (variant === 'confirm') return 'background: rgba(59,130,246,0.15); color: #60a5fa; &:hover { background: rgba(59,130,246,0.3); }';
    if (variant === 'complete') return 'background: rgba(34,197,94,0.15); color: #4ade80; &:hover { background: rgba(34,197,94,0.3); }';
    return 'background: rgba(239,68,68,0.1); color: #f87171; &:hover { background: rgba(239,68,68,0.2); }';
  }}
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: #64748b;
  svg { font-size: 3rem; color: #334155; margin-bottom: 1rem; }
  h3 { color: #94a3b8; margin: 0 0 0.5rem; }
  p { margin: 0; }
`;

const Loader = styled.div`
  display: flex; align-items: center; justify-content: center; padding: 4rem; color: #64748b;
  svg { animation: spin 1s linear infinite; font-size: 2rem; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

/* ============= CONSTANTS ============= */
const TYPE_LABELS: Record<string, { label: string; icon: React.ComponentType }> = {
  dispensa: { label: 'Dispensa', icon: FaLeaf },
  consulta_medica: { label: 'Consulta Médica', icon: FaStethoscope },
  tramite: { label: 'Trámite', icon: FaClipboardList },
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  completed: 'Completado',
  cancelled: 'Cancelado',
  no_show: 'No asistió',
};

/* ============= COMPONENT ============= */
const Appointments: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('appointments')
        .select('*, patient:aurora_patients(id, profile:profiles(full_name, email))')
        .eq('organization_id', getSelectedOrgId())
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true });

      const { data, error } = await query;
      if (error) throw error;
      setAppointments(data || []);
    } catch (err) {
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', id);
      if (error) throw error;
      await fetchAppointments();
    } catch (err) {
      console.error('Error updating appointment:', err);
      alert('Error al actualizar el turno.');
    }
  };

  // Filter logic
  const filteredAppointments = useMemo(() => {
    let result = appointments;

    // Filter by date
    result = result.filter(a => a.scheduled_date === selectedDate);

    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter(a => a.status === statusFilter);
    }

    return result;
  }, [appointments, statusFilter, selectedDate]);

  // Stats for selected date
  const stats = useMemo(() => {
    const dayApts = appointments.filter(a => a.scheduled_date === selectedDate);
    return {
      total: dayApts.length,
      pending: dayApts.filter(a => a.status === 'pending').length,
      confirmed: dayApts.filter(a => a.status === 'confirmed').length,
      completed: dayApts.filter(a => a.status === 'completed').length,
    };
  }, [appointments, selectedDate]);

  const navigateDate = (delta: number) => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  if (loading) return <Loader><FaSpinner /></Loader>;

  return (
    <PageContainer>
      <PageHeader>
        <div>
          <h1><FaCalendarAlt /> Gestión de Turnos</h1>
          <p>Administrá los turnos de socios del club.</p>
        </div>
      </PageHeader>

      {/* Date Navigation */}
      <DateNav style={{ marginBottom: '1.5rem' }}>
        <button onClick={() => navigateDate(-1)}><FaChevronLeft /></button>
        <span>{formatDate(selectedDate)}</span>
        <button onClick={() => navigateDate(1)}><FaChevronRight /></button>
        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
      </DateNav>

      {/* Stats */}
      <StatsRow>
        <StatCard color="#60a5fa">
          <div className="value">{stats.total}</div>
          <div className="label">Total del Día</div>
        </StatCard>
        <StatCard color="#fbbf24">
          <div className="value">{stats.pending}</div>
          <div className="label">Pendientes</div>
        </StatCard>
        <StatCard color="#3b82f6">
          <div className="value">{stats.confirmed}</div>
          <div className="label">Confirmados</div>
        </StatCard>
        <StatCard color="#4ade80">
          <div className="value">{stats.completed}</div>
          <div className="label">Completados</div>
        </StatCard>
      </StatsRow>

      {/* Filters */}
      <FilterBar>
        <FaFilter style={{ color: '#64748b' }} />
        {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(s => (
          <FilterChip key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)}>
            {s === 'all' ? 'Todos' : STATUS_LABELS[s]}
          </FilterChip>
        ))}
      </FilterBar>

      {/* Table */}
      <Table>
        <TableHeader>
          <div>Paciente</div>
          <div>Tipo</div>
          <div>Hora</div>
          <div>Estado</div>
          <div>Notas</div>
          <div>Acciones</div>
        </TableHeader>

        {filteredAppointments.length === 0 ? (
          <EmptyState>
            <FaCalendarAlt />
            <h3>Sin turnos para esta fecha</h3>
            <p>No hay turnos {statusFilter !== 'all' ? `con estado "${STATUS_LABELS[statusFilter]}"` : ''} para el {formatDate(selectedDate)}.</p>
          </EmptyState>
        ) : (
          filteredAppointments.map(apt => {
            const typeInfo = TYPE_LABELS[apt.appointment_type] || TYPE_LABELS.dispensa;
            const patientName = apt.patient?.profile?.full_name || 'Paciente';
            const patientEmail = apt.patient?.profile?.email || '';

            return (
              <TableRow key={apt.id}>
                <PatientName>
                  {patientName}
                  {patientEmail && <div className="patient-email">{patientEmail}</div>}
                </PatientName>
                <div>
                  <TypeBadge type={apt.appointment_type}>
                    {typeInfo.label}
                  </TypeBadge>
                </div>
                <div style={{ color: '#e2e8f0', fontWeight: 600 }}>
                  {apt.scheduled_time?.slice(0, 5)}
                </div>
                <div>
                  <StatusBadge status={apt.status}>{STATUS_LABELS[apt.status]}</StatusBadge>
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                  {apt.notes || '—'}
                </div>
                <ActionButtons>
                  {apt.status === 'pending' && (
                    <>
                      <ActionBtn variant="confirm" onClick={() => updateStatus(apt.id, 'confirmed')} title="Confirmar">
                        <FaCheck />
                      </ActionBtn>
                      <ActionBtn variant="cancel" onClick={() => updateStatus(apt.id, 'cancelled')} title="Cancelar">
                        <FaTimes />
                      </ActionBtn>
                    </>
                  )}
                  {apt.status === 'confirmed' && (
                    <>
                      <ActionBtn variant="complete" onClick={() => updateStatus(apt.id, 'completed')} title="Completar">
                        <FaCheck /> Hecho
                      </ActionBtn>
                      <ActionBtn variant="cancel" onClick={() => updateStatus(apt.id, 'no_show')} title="No asistió">
                        <FaBan />
                      </ActionBtn>
                    </>
                  )}
                  {['completed', 'cancelled', 'no_show'].includes(apt.status) && (
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>—</span>
                  )}
                </ActionButtons>
              </TableRow>
            );
          })
        )}
      </Table>
    </PageContainer>
  );
};

export default Appointments;
