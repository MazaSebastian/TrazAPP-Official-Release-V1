import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FaCalendarCheck, FaClock, FaUsers, FaPrescriptionBottleAlt, FaVial, FaNotesMedical, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { patientsService } from '../services/patientsService';
import { dispensaryService } from '../services/dispensaryService';
import { LoadingSpinner } from './LoadingSpinner';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, getSelectedOrgId } from '../services/supabaseClient';

const Container = styled.div`
  padding: 1.5rem 2rem;
  max-width: 1400px;
  margin: 0 auto;
  color: #f8fafc;

  @media (max-width: 768px) {
    padding: 1.5rem 1rem;
  }
`;

const WelcomeHeader = styled.div`
  margin-bottom: 2.5rem;

  @media (max-width: 768px) {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  h1 {
    font-size: clamp(1.5rem, 5vw, 2.5rem);
    font-weight: 800;
    margin: 0 0 0.5rem 0;
    background: linear-gradient(135deg, #f8fafc 0%, #94a3b8 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    letter-spacing: -0.025em;
  }
`;

const DateDisplay = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1rem;
  color: #cbd5e1;
  font-size: clamp(1rem, 3vw, 1.25rem);
  font-weight: 500;
  letter-spacing: 0.025em;

  @media (max-width: 768px) {
    justify-content: center;
  }

  .separator {
    margin: 0 0.5rem;
    opacity: 0.5;

    @media (max-width: 768px) {
      display: none;
    }
  }
  
  svg { 
    color: #38bdf8;
    font-size: 1.35rem;
  }
`;

const KPISection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
`;

const KPICard = styled.div<{ alert?: boolean }>`
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(12px);
  border-radius: 1.25rem;
  padding: 1.75rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.15);
  border: 1px solid ${props => props.alert ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.05)'};
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
  overflow: hidden;

  cursor: pointer;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 15px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.2);
    border-color: ${props => props.alert ? 'rgba(239, 68, 68, 0.6)' : 'rgba(56, 189, 248, 0.5)'};
  }

  /* Decorative accent line */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 6px;
    height: 100%;
    background: ${props => props.alert ? '#ef4444' : '#38bdf8'};
  }

  .icon-wrapper {
    display: inline-flex;
    padding: 0.75rem;
    border-radius: 1rem;
    background: ${props => props.alert ? 'rgba(127, 29, 29, 0.3)' : 'rgba(14, 165, 233, 0.2)'};
    color: ${props => props.alert ? '#fca5a5' : '#38bdf8'};
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }

  .label {
    font-size: 0.875rem;
    color: #94a3b8;
    text-transform: uppercase;
    font-weight: 600;
    letter-spacing: 0.05em;
  }

  .value {
    font-size: 2rem;
    font-weight: 700;
    color: #f8fafc;
    margin: 0.25rem 0;
  }

  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    padding: 1rem 1.25rem;
    gap: 1rem;

    &::before {
      width: 4px;
    }

    .icon-wrapper {
      margin-bottom: 0;
      padding: 0.6rem;
      font-size: 1.25rem;
      border-radius: 0.75rem;
    }

    .label {
      flex: 1;
      font-size: 0.75rem;
      line-height: 1.2;
    }

    .value {
      font-size: 1.5rem;
      margin: 0;
    }
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: #0f172a;
  border-radius: 1.25rem;
  width: 100%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);

  .modal-header {
    padding: 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    justify-content: space-between;
    align-items: center;

    h3 {
      margin: 0;
      color: #f8fafc;
      font-size: 1.25rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      svg { color: #38bdf8; }
    }

    button {
      background: rgba(255,255,255,0.05);
      border: none;
      color: #94a3b8;
      width: 32px;
      height: 32px;
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      &:hover { background: rgba(255,255,255,0.1); color: #fff; }
    }
  }

  .modal-body {
    padding: 1.5rem;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
`;

const PatientListItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 0.75rem;
  transition: all 0.2s;
  cursor: pointer;

  &:hover {
    background: rgba(56, 189, 248, 0.1);
    border-color: rgba(56, 189, 248, 0.3);
  }

  .info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    .name {
      color: #f8fafc;
      font-weight: 600;
    }
    .meta {
      color: #94a3b8;
      font-size: 0.85rem;
    }
  }

  .action {
    color: #38bdf8;
    font-size: 0.9rem;
    font-weight: 500;
  }
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 1.25rem;
  padding: 1.5rem;
  backdrop-filter: blur(12px);
`;

const SectionTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: clamp(1.1rem, 3vw, 1.25rem);
  color: #f8fafc;
  margin: 0 0 1.5rem 0;
  
  @media (max-width: 768px) {
    justify-content: center;
    text-align: center;
  }

  svg {
    color: #38bdf8;
  }
`;

const ActionGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
`;

const ActionButton = styled(Link)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  color: #cbd5e1;
  text-decoration: none;
  transition: all 0.2s ease;

  svg {
    font-size: 2rem;
    color: #38bdf8;
    transition: transform 0.2s ease;
  }

  span {
    font-weight: 500;
    font-size: 1rem;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(56, 189, 248, 0.5);
    color: #fff;

    svg {
      transform: scale(1.1);
    }
  }

  @media (max-width: 768px) {
    flex-direction: row;
    justify-content: flex-start;
    padding: 1rem 1.25rem;
    gap: 1rem;

    svg {
      font-size: 1.25rem;
    }

    span {
      font-size: 0.875rem;
      text-align: left;
    }
  }
`;

const RecentList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const RecentItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  
  .details {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    
    .name {
      color: #f8fafc;
      font-weight: 500;
    }
    
    .date {
      color: #94a3b8;
      font-size: 0.875rem;
    }
  }
  
  .status {
    padding: 0.25rem 0.75rem;
    border-radius: 2rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    
    &.completed {
      background: rgba(74, 222, 128, 0.2);
      color: #4ade80;
    }
    
    &.pending {
      background: rgba(250, 204, 21, 0.2);
      color: #facc15;
    }
  }
`;

export const MedicoDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  const [metrics, setMetrics] = useState({
    activePatients: [] as any[],
    pendingAdmissions: [] as any[],
    pendingFollowUps: [] as any[],
  });
  const [activeModal, setActiveModal] = useState<'activePatients' | 'pendingAdmissions' | 'pendingFollowUps' | null>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Reloj
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Cargar datos reales
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [patients, admissionsRes, evolutionsRes] = await Promise.all([
          patientsService.getPatients(),
          supabase.from('clinical_admissions').select('patient_id, id').eq('organization_id', getSelectedOrgId()),
          supabase.from('clinical_evolutions').select('admission_id, date').eq('organization_id', getSelectedOrgId())
        ]);

        const admissions = admissionsRes.data || [];
        const evolutions = evolutionsRes.data || [];

        const activePatientsList = patients.filter((p: any) => p.reprocann_status === 'active');
        const activePatientsCount = activePatientsList.length > 0 ? activePatientsList.length : patients.length;

        let pendingAdmissionsList: any[] = [];
        let pendingFollowUpsList: any[] = [];

        const admissionPatientIds = new Set(admissions.map(a => a.patient_id));

        const patientsToCount = activePatientsList.length > 0 ? activePatientsList : patients;

        patientsToCount.forEach((p: any) => {
          if (!admissionPatientIds.has(p.id)) {
            pendingAdmissionsList.push(p);
          } else {
            // Pending Follow-up logic
            const patientAdmission = admissions.find(a => a.patient_id === p.id);
            if (patientAdmission) {
              const patientEvolutions = evolutions.filter(e => e.admission_id === patientAdmission.id);
              if (patientEvolutions.length === 0) {
                pendingFollowUpsList.push(p);
              } else {
                const latestEvo = patientEvolutions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                const _30daysAgo = new Date();
                _30daysAgo.setDate(_30daysAgo.getDate() - 30);
                if (new Date(latestEvo.date) < _30daysAgo) {
                  pendingFollowUpsList.push(p);
                }
              }
            }
          }
        });

        setMetrics({
          activePatients: activePatientsList,
          pendingAdmissions: pendingAdmissionsList,
          pendingFollowUps: pendingFollowUpsList
        });

        // 2. Fetch Recent Activity
        const [recentMovementsRes, recentEvolutionsRes] = await Promise.all([
          supabase
            .from('chakra_dispensary_movements')
            .select(`
              created_at,
              member_id,
              batch:batch_id!inner(organization_id)
            `)
            .eq('batch.organization_id', getSelectedOrgId())
            .eq('type', 'dispense')
            .order('created_at', { ascending: false })
            .limit(10),
          supabase
            .from('clinical_evolutions')
            .select(`
              created_at,
              admission_id
            `)
            .eq('organization_id', getSelectedOrgId())
            .order('created_at', { ascending: false })
            .limit(10)
        ]);

        const recentMovements = recentMovementsRes.data || [];
        const recentEvolutions = recentEvolutionsRes.data || [];

        const activities: any[] = [];

        // We need patient names for these. We already have the 'patients' array.
        // For movements, we have member_id -> map to patient.id
        recentMovements.forEach(m => {
          const patient = patients.find(p => p.id === m.member_id);
          if (patient) {
            activities.push({
              type: 'dispense',
              date: m.created_at,
              title: `Entrega a ${patient.profile?.full_name || 'Paciente'}`,
              status: 'COMPLETADO'
            });
          }
        });

        // For evolutions, we have admission_id -> map to patient.id
        recentEvolutions.forEach(e => {
          const admission = admissions.find(a => a.id === e.admission_id);
          if (admission) {
            const patient = patients.find(p => p.id === admission.patient_id);
            if (patient) {
              activities.push({
                type: 'evolution',
                date: e.created_at,
                title: `Ficha Clínica: ${patient.profile?.full_name || 'Paciente'}`,
                status: 'ACTUALIZADO'
              });
            }
          }
        });

        // Sort combined activities by date desc
        activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Keep top 5
        setRecentActivity(activities.slice(0, 5));

      } catch (err) {
        console.error("Error loading Medico Dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (isLoading) {
    return <LoadingSpinner fullScreen duration={2000} />;
  }

  return (
    <Container>
      <WelcomeHeader>
        <h1>Hola, Dr(a). {user?.name || 'Profesional'}, ¿qué vamos a hacer hoy?</h1>
        <DateDisplay>
          <FaCalendarCheck />
          {format(currentTime, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
          <span className="separator">|</span>
          <FaClock />
          {format(currentTime, "HH:mm")}
        </DateDisplay>
      </WelcomeHeader>

      <KPISection>
        <KPICard onClick={() => setActiveModal('activePatients')}>
          <div className="icon-wrapper"><FaUsers /></div>
          <div className="label">Socios / Pacientes Activos</div>
          <div className="value">{metrics.activePatients.length}</div>
        </KPICard>
        <KPICard alert={metrics.pendingAdmissions.length > 0} onClick={() => setActiveModal('pendingAdmissions')}>
          <div className="icon-wrapper"><FaNotesMedical /></div>
          <div className="label">Pacientes Pendientes de Admisión</div>
          <div className="value">{metrics.pendingAdmissions.length}</div>
        </KPICard>
        <KPICard alert={metrics.pendingFollowUps.length > 0} onClick={() => setActiveModal('pendingFollowUps')}>
          <div className="icon-wrapper">
            {metrics.pendingFollowUps.length > 0 ? <FaExclamationTriangle /> : <FaCheckCircle />}
          </div>
          <div className="label">Pacientes Pendientes de Seguimiento</div>
          <div className="value">{metrics.pendingFollowUps.length}</div>
        </KPICard>
      </KPISection>

      <ContentGrid>
        <Card>
          <SectionTitle><FaNotesMedical /> Accesos Rápidos</SectionTitle>
          <ActionGrid>
            <ActionButton to="/patients">
              <FaUsers />
              <span>Gestión de Socios</span>
            </ActionButton>
            <ActionButton to="/dispensary">
              <FaPrescriptionBottleAlt />
              <span>Entregar Medicamento</span>
            </ActionButton>
            <ActionButton to="/laboratory">
              <FaVial />
              <span>Resultados de Laboratorio</span>
            </ActionButton>
          </ActionGrid>
        </Card>

        {/* Real Recent Activity */}
        <Card>
          <SectionTitle><FaClock /> Actividad Reciente</SectionTitle>
          {recentActivity.length > 0 ? (
            <RecentList>
              {recentActivity.map((activity, index) => {
                const isToday = new Date(activity.date).toDateString() === new Date().toDateString();
                const isYesterday = new Date(activity.date).toDateString() === new Date(Date.now() - 86400000).toDateString();
                const displayDate = isToday
                  ? `Hoy, ${format(new Date(activity.date), 'HH:mm')}`
                  : isYesterday
                    ? `Ayer, ${format(new Date(activity.date), 'HH:mm')}`
                    : format(new Date(activity.date), "dd/MM, HH:mm");

                return (
                  <RecentItem key={index}>
                    <div className="details">
                      <span className="name">{activity.title}</span>
                      <span className="date">{displayDate}</span>
                    </div>
                    <span className={`status completed`}>{activity.status}</span>
                  </RecentItem>
                );
              })}
            </RecentList>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', background: 'rgba(255,255,255,0.02)', borderRadius: '0.75rem', border: '1px dashed rgba(255,255,255,0.1)' }}>
              No hay actividad reciente.
            </div>
          )}
        </Card>
      </ContentGrid>

      {/* Metric Detail Modal */}
      {activeModal && (
        <ModalOverlay onClick={() => setActiveModal(null)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {activeModal === 'activePatients' && <><FaUsers /> Socios Activos</>}
                {activeModal === 'pendingAdmissions' && <><FaNotesMedical color="#fca5a5" /> Pendientes de Admisión</>}
                {activeModal === 'pendingFollowUps' && <><FaExclamationTriangle color="#facc15" /> Pendientes de Seguimiento</>}
              </h3>
              <button title="Cerrar" onClick={() => setActiveModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              {metrics[activeModal].length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                  No hay pacientes en esta categoría.
                </div>
              ) : (
                metrics[activeModal].map((patient: any) => (
                  <PatientListItem key={patient.id} onClick={() => navigate(`/patients/${patient.id}`)}>
                    <div className="info">
                      <span className="name">{patient.profile?.full_name || 'Sin Nombre'}</span>
                      <span className="meta">{patient.document_type || 'DNI'}: {patient.document_number} {patient.phone ? `• Tel: ${patient.phone}` : ''}</span>
                    </div>
                    <div className="action">Ver Ficha →</div>
                  </PatientListItem>
                ))
              )}
            </div>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
};
