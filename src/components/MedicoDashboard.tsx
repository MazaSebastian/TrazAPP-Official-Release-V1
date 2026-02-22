import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FaCalendarCheck, FaClock, FaUsers, FaPrescriptionBottleAlt, FaVial, FaNotesMedical, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { patientsService } from '../services/patientsService';
import { dispensaryService } from '../services/dispensaryService';
import { LoadingSpinner } from './LoadingSpinner';
import { Link } from 'react-router-dom';
import { supabase, getSelectedOrgId } from '../services/supabaseClient';

const Container = styled.div`
  padding: 2rem 3rem;
  max-width: 1400px;
  margin: 0 auto;
  color: #f8fafc;
`;

const WelcomeHeader = styled.div`
  margin-bottom: 2.5rem;
  
  h1 {
    font-size: 2.5rem;
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
  gap: 0.75rem;
  margin-top: 1rem;
  color: #cbd5e1;
  font-size: 1.25rem;
  font-weight: 500;
  letter-spacing: 0.025em;
  
  svg { 
    color: #38bdf8;
    font-size: 1.35rem;
  }
`;

const KPISection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
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
  font-size: 1.25rem;
  color: #f8fafc;
  margin: 0 0 1.5rem 0;
  
  svg {
    color: #38bdf8;
  }
`;

const ActionGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
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
  const [currentTime, setCurrentTime] = useState(new Date());

  const [metrics, setMetrics] = useState({
    activePatients: 0,
    pendingAdmissions: 0,
    pendingFollowUps: 0,
  });
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

        const activePatientsList = patients.filter((p: any) => p.status === 'Activo');
        const activePatientsCount = activePatientsList.length > 0 ? activePatientsList.length : patients.length;

        let pendingAdmissions = 0;
        let pendingFollowUps = 0;

        const admissionPatientIds = new Set(admissions.map(a => a.patient_id));

        const patientsToCount = activePatientsList.length > 0 ? activePatientsList : patients;

        patientsToCount.forEach((p: any) => {
          if (!admissionPatientIds.has(p.id)) {
            pendingAdmissions++;
          } else {
            // Pending Follow-up logic
            const patientAdmission = admissions.find(a => a.patient_id === p.id);
            if (patientAdmission) {
              const patientEvolutions = evolutions.filter(e => e.admission_id === patientAdmission.id);
              if (patientEvolutions.length === 0) {
                pendingFollowUps++;
              } else {
                const latestEvo = patientEvolutions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                const _30daysAgo = new Date();
                _30daysAgo.setDate(_30daysAgo.getDate() - 30);
                if (new Date(latestEvo.date) < _30daysAgo) {
                  pendingFollowUps++;
                }
              }
            }
          }
        });

        setMetrics({
          activePatients: activePatientsCount,
          pendingAdmissions,
          pendingFollowUps
        });
      } catch (err) {
        console.error("Error loading Medico Dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (isLoading) {
    return <LoadingSpinner text="Cargando panel médico..." fullScreen duration={2000} />;
  }

  return (
    <Container>
      <WelcomeHeader>
        <h1>Hola, Dr(a). {user?.name || 'Profesional'}, ¿qué vamos a hacer hoy?</h1>
        <DateDisplay>
          <FaCalendarCheck />
          {format(currentTime, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
          <span style={{ margin: '0 0.5rem', opacity: 0.5 }}>|</span>
          <FaClock />
          {format(currentTime, "HH:mm")}
        </DateDisplay>
      </WelcomeHeader>

      <KPISection>
        <KPICard>
          <div className="icon-wrapper"><FaUsers /></div>
          <div className="label">Socios / Pacientes Activos</div>
          <div className="value">{metrics.activePatients}</div>
        </KPICard>
        <KPICard alert={metrics.pendingAdmissions > 0}>
          <div className="icon-wrapper"><FaNotesMedical /></div>
          <div className="label">Pacientes Pendientes de Admisión</div>
          <div className="value">{metrics.pendingAdmissions}</div>
        </KPICard>
        <KPICard alert={metrics.pendingFollowUps > 0}>
          <div className="icon-wrapper">
            {metrics.pendingFollowUps > 0 ? <FaExclamationTriangle /> : <FaCheckCircle />}
          </div>
          <div className="label">Pacientes Pendientes de Seguimiento</div>
          <div className="value">{metrics.pendingFollowUps}</div>
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

        {/* This could load real recent deliveries later, static design for now */}
        <Card>
          <SectionTitle><FaClock /> Actividad Reciente</SectionTitle>
          <RecentList>
            <RecentItem>
              <div className="details">
                <span className="name">Entrega a Juan Pérez</span>
                <span className="date">Hoy, 14:30</span>
              </div>
              <span className="status completed">COMPLETADO</span>
            </RecentItem>
            <RecentItem>
              <div className="details">
                <span className="name">Actualización Ficha Clínica</span>
                <span className="date">Ayer, 09:15</span>
              </div>
              <span className="status completed">COMPLETADO</span>
            </RecentItem>
            <RecentItem>
              <div className="details">
                <span className="name">Entrega Pendiente (María)</span>
                <span className="date">Hoy, 16:00</span>
              </div>
              <span className="status pending">PENDIENTE</span>
            </RecentItem>
          </RecentList>
        </Card>
      </ContentGrid>
    </Container>
  );
};
