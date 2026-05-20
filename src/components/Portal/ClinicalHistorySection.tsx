import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { supabase, getSelectedOrgId } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useOrganization } from '../../context/OrganizationContext';
import { FaStethoscope, FaChartLine, FaCalendarCheck, FaNotesMedical, FaSpinner, FaArrowUp, FaArrowDown, FaMinus, FaClock } from 'react-icons/fa';

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

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: rgba(0,0,0,0.25);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px;
  padding: 1.25rem;
  text-align: center;

  .stat-value {
    font-size: 2rem;
    font-weight: 800;
    color: #f8fafc;
    margin-bottom: 0.25rem;
  }
  .stat-label {
    font-size: 0.8rem;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
`;

const Timeline = styled.div`
  position: relative;
  padding-left: 2rem;

  &::before {
    content: '';
    position: absolute;
    left: 7px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: rgba(255,255,255,0.08);
  }
`;

const TimelineItem = styled.div<{ isLatest?: boolean }>`
  position: relative;
  padding-bottom: 2rem;

  &::before {
    content: '';
    position: absolute;
    left: -2rem;
    top: 4px;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: ${props => props.isLatest ? 'var(--primary-color, #4ade80)' : 'rgba(100, 116, 139, 0.5)'};
    border: 2px solid ${props => props.isLatest ? 'rgba(74, 222, 128, 0.3)' : 'rgba(255,255,255,0.1)'};
    box-shadow: ${props => props.isLatest ? '0 0 12px rgba(74, 222, 128, 0.3)' : 'none'};
  }

  &:last-child { padding-bottom: 0; }
`;

const TimelineDate = styled.div`
  font-size: 0.8rem;
  color: #64748b;
  margin-bottom: 0.4rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
`;

const TimelineCard = styled.div`
  background: rgba(0,0,0,0.2);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 10px;
  padding: 1.25rem;
`;

const TimelineTitle = styled.div`
  font-weight: 700;
  color: #e2e8f0;
  margin-bottom: 0.5rem;
`;

const TimelineNotes = styled.p`
  color: #94a3b8;
  font-size: 0.9rem;
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
`;

const EvaScore = styled.div<{ score: number }>`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.85rem;
  ${({ score }) => {
    if (score <= 3) return 'background: rgba(34,197,94,0.15); color: #4ade80;';
    if (score <= 6) return 'background: rgba(245,158,11,0.15); color: #fbbf24;';
    return 'background: rgba(239,68,68,0.15); color: #f87171;';
  }}
`;

const TrendIndicator = styled.span<{ trend: 'up' | 'down' | 'same' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: ${({ trend }) => trend === 'down' ? '#4ade80' : trend === 'up' ? '#f87171' : '#94a3b8'};
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

const NextFollowUp = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 12px;
  color: #93c5fd;
  font-weight: 600;
  margin-bottom: 1.5rem;

  svg { color: #3b82f6; }
  span { color: #cbd5e1; font-weight: 400; }
`;

/* ============= COMPONENT ============= */
export const ClinicalHistorySection: React.FC = () => {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();

  const [loading, setLoading] = useState(true);
  const [admission, setAdmission] = useState<any>(null);
  const [evolutions, setEvolutions] = useState<any[]>([]);

  useEffect(() => {
    fetchClinicalData();
  }, [user, currentOrganization]);

  const fetchClinicalData = async () => {
    if (!user || !currentOrganization) return;
    setLoading(true);
    try {
      // 1. Get patient record
      const { data: patient } = await supabase
        .from('aurora_patients')
        .select('id')
        .eq('profile_id', user.id)
        .eq('organization_id', currentOrganization.id)
        .single();

      if (!patient) { setLoading(false); return; }

      // 2. Get clinical admission
      const { data: adm } = await supabase
        .from('clinical_admissions')
        .select('*')
        .eq('patient_id', patient.id)
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (adm) {
        setAdmission(adm);

        // 3. Get evolutions
        const { data: evos } = await supabase
          .from('clinical_evolutions')
          .select('*')
          .eq('admission_id', adm.id)
          .eq('organization_id', currentOrganization.id)
          .order('created_at', { ascending: false });

        setEvolutions(evos || []);
      }
    } catch (err) {
      console.error('Error fetching clinical data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader><FaSpinner /></Loader>;
  }

  if (!admission) {
    return (
      <Container>
        <Header>
          <h2>Historia Clínica</h2>
          <p>Tu evolución de tratamiento y controles médicos.</p>
        </Header>
        <EmptyState>
          <FaStethoscope />
          <h3>Sin historia clínica registrada</h3>
          <p>Aún no se ha creado una admisión clínica para tu tratamiento. Tu profesional de salud la iniciará en tu primera consulta.</p>
        </EmptyState>
      </Container>
    );
  }

  const latestEvo = evolutions[0] || null;
  const previousEvo = evolutions.length > 1 ? evolutions[1] : null;
  const evaTrend = latestEvo && previousEvo
    ? (latestEvo.eva_score < previousEvo.eva_score ? 'down' : latestEvo.eva_score > previousEvo.eva_score ? 'up' : 'same')
    : 'same';

  // Calculate next follow-up
  let nextFollowUp: string | null = null;
  if (latestEvo?.next_follow_up_months && latestEvo.date) {
    const d = new Date(latestEvo.date);
    d.setMonth(d.getMonth() + latestEvo.next_follow_up_months);
    nextFollowUp = d.toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  return (
    <Container>
      <Header>
        <h2>Historia Clínica</h2>
        <p>Tu evolución de tratamiento y controles médicos.</p>
      </Header>

      {/* Stats */}
      <StatsGrid>
        <StatCard>
          <div className="stat-value">{evolutions.length}</div>
          <div className="stat-label">Controles realizados</div>
        </StatCard>
        <StatCard>
          <div className="stat-value" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            {latestEvo ? latestEvo.eva_score : '—'}
            {latestEvo && (
              <TrendIndicator trend={evaTrend}>
                {evaTrend === 'down' ? <FaArrowDown /> : evaTrend === 'up' ? <FaArrowUp /> : <FaMinus />}
              </TrendIndicator>
            )}
          </div>
          <div className="stat-label">Último EVA Score</div>
        </StatCard>
        <StatCard>
          <div className="stat-value">{admission.created_at ? new Date(admission.created_at).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' }) : '—'}</div>
          <div className="stat-label">Inicio Tratamiento</div>
        </StatCard>
      </StatsGrid>

      {/* Next Follow Up */}
      {nextFollowUp && (
        <NextFollowUp>
          <FaCalendarCheck />
          Próximo control sugerido: <span>{nextFollowUp}</span>
        </NextFollowUp>
      )}

      {/* Admission Info */}
      <Card>
        <CardTitle><FaNotesMedical /> Datos de Admisión</CardTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Patología</div>
            <div style={{ color: '#e2e8f0' }}>{admission.pathology || '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Fecha de Admisión</div>
            <div style={{ color: '#e2e8f0' }}>{admission.created_at ? new Date(admission.created_at).toLocaleDateString('es-AR') : '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>EVA Basal</div>
            <div style={{ color: '#e2e8f0' }}>{admission.baseline_eva ?? '—'}</div>
          </div>
        </div>
      </Card>

      {/* Evolution Timeline */}
      <Card>
        <CardTitle><FaChartLine /> Evolución del Tratamiento</CardTitle>
        {evolutions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
            No hay evoluciones registradas aún.
          </div>
        ) : (
          <Timeline>
            {evolutions.map((evo, index) => (
              <TimelineItem key={evo.id} isLatest={index === 0}>
                <TimelineDate>
                  <FaClock />
                  {evo.date ? new Date(evo.date).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Sin fecha'}
                </TimelineDate>
                <TimelineCard>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <TimelineTitle>{evo.title || `Control #${evolutions.length - index}`}</TimelineTitle>
                    <EvaScore score={evo.eva_score}>EVA: {evo.eva_score}/10</EvaScore>
                  </div>
                  {evo.notes && <TimelineNotes>{evo.notes}</TimelineNotes>}
                  {evo.sparing_effect && (
                    <div style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}>
                      <span style={{ color: '#64748b' }}>Efecto ahorrador: </span>
                      <span style={{ color: '#93c5fd' }}>{evo.sparing_effect}</span>
                    </div>
                  )}
                  {evo.adverse_effects && (
                    <div style={{ marginTop: '0.25rem', fontSize: '0.85rem' }}>
                      <span style={{ color: '#64748b' }}>Efectos adversos: </span>
                      <span style={{ color: '#fca5a5' }}>{evo.adverse_effects}</span>
                    </div>
                  )}
                </TimelineCard>
              </TimelineItem>
            ))}
          </Timeline>
        )}
      </Card>
    </Container>
  );
};
