import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { supabase } from '../../services/supabaseClient';
import { Organization } from '../../types';
import { FaChartLine, FaExclamationTriangle, FaClock, FaMoneyBillWave, FaUsers, FaArrowRight } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const Container = styled.div`
  padding: 2rem;
  padding-top: 5rem;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;
  color: #f8fafc;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  color: #f8fafc;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
`;

const StatCard = styled.div<{ color?: string }>`
  background: rgba(30, 41, 59, 0.6);
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-left: 6px solid ${props => props.color || '#3182ce'};
  backdrop-filter: blur(12px);
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3);
  }
  
  h3 { margin: 0; font-size: 0.875rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem; }
  .value { font-size: 2.25rem; font-weight: 800; color: #f8fafc; display: flex; alignItems: center; gap: 0.5rem; }
  .icon { position: absolute; right: 1rem; top: 1rem; font-size: 2.5rem; opacity: 0.1; color: ${props => props.color || '#3182ce'}; }
  .sub { font-size: 0.85rem; color: ${props => props.color || '#94a3b8'}; margin-top: 0.5rem; font-weight: 500; }
`;


const SectionTitle = styled.h2`
  font-size: 1.25rem;
  color: #f8fafc;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 2rem;
`;

const Widget = styled.div`
  background: rgba(30, 41, 59, 0.6);
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const ListItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  transition: transform 0.2s, background 0.2s;

  &:hover {
    transform: translateX(4px);
    background: rgba(30, 41, 59, 0.8);
  }
`;

const OrgInfo = styled.div`
  display: flex;
  flex-direction: column;
  strong { color: #f8fafc; }
  span { font-size: 0.85rem; color: #94a3b8; }
`;

const Badge = styled.span<{ type: 'danger' | 'warning' | 'success' }>`
  background: ${props => props.type === 'danger' ? 'rgba(239, 68, 68, 0.2)' : props.type === 'warning' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(74, 222, 128, 0.2)'};
  color: ${props => props.type === 'danger' ? '#f87171' : props.type === 'warning' ? '#facc15' : '#4ade80'};
  border: 1px solid ${props => props.type === 'danger' ? 'rgba(239, 68, 68, 0.5)' : props.type === 'warning' ? 'rgba(234, 179, 8, 0.5)' : 'rgba(74, 222, 128, 0.5)'};
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
`;

const ActionLink = styled(Link)`
  color: #c084fc;
  font-weight: 600;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  align-self: flex-end;
  
  &:hover { 
      text-decoration: underline; 
      color: #d8b4fe;
  }
`;

const AdminDashboard: React.FC = () => {
  const [activeOrgs, setActiveOrgs] = useState<Organization[]>([]);
  const [expiringOrgs, setExpiringOrgs] = useState<Organization[]>([]);
  const [debtorOrgs, setDebtorOrgs] = useState<Organization[]>([]);
  const [recentOrgs, setRecentOrgs] = useState<Organization[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {

    // 1. Fetch All Orgs
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false }); // Get newest first

    if (!error && data) {
      const allOrgs = data as Organization[];

      // Active Orgs
      setActiveOrgs(allOrgs.filter(o => o.status === 'active'));

      // Recent Orgs (Top 5)
      setRecentOrgs(allOrgs.slice(0, 5));

      // Expiring Orgs
      // In a real scenario, check o.valid_until < next 30 days
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const expiring = allOrgs.filter(o => {
        if (!o.valid_until) return false;
        const validDate = new Date(o.valid_until);
        return validDate > new Date() && validDate < thirtyDaysFromNow;
      });
      setExpiringOrgs(expiring);

      // Debtors
      const debtors = allOrgs.filter(o => {
        return o.subscription_status === 'past_due' || (o.status === 'suspended' && o.plan !== 'free');
      });
      setDebtorOrgs(debtors);
    }
  };

  const revenue = activeOrgs.length * 25000; // Mock ARPU $25,000

  return (
    <Container>
      <Header>
        <Title>
          <FaChartLine /> Dashboard General
        </Title>
      </Header>

      <StatsGrid>
        <StatCard color="#48bb78">
          <FaMoneyBillWave className="icon" />
          <h3>Ingresos Mensuales Est.</h3>
          <div className="value">${revenue.toLocaleString()}</div>
          <div className="sub">Base: {activeOrgs.length} clientes activos</div>
        </StatCard>

        <StatCard color="#3182ce">
          <FaUsers className="icon" />
          <h3>Clientes Totales</h3>
          <div className="value">{activeOrgs.length + recentOrgs.length}</div>
          <div className="sub">+ {recentOrgs.filter(o => o.status === 'pending').length} pendientes validación</div>
        </StatCard>

        <StatCard color="#f56565">
          <FaExclamationTriangle className="icon" />
          <h3>Cartera en Riesgo</h3>
          <div className="value">{debtorOrgs.length}</div>
          <div className="sub">Clientes con deuda o impagos</div>
        </StatCard>
      </StatsGrid>

      <Grid>
        {/* WIDGET: PRÓXIMOS A VENCER */}
        <Widget>
          <SectionTitle>
            <FaClock style={{ color: '#ed8936' }} /> Próximos Vencimientos
          </SectionTitle>
          <List>
            {expiringOrgs.length === 0 ? (
              <div style={{ color: '#a0aec0', fontStyle: 'italic', padding: '1rem' }}>No hay vencimientos próximos.</div>
            ) : expiringOrgs.slice(0, 5).map(org => (
              <ListItem key={org.id}>
                <OrgInfo>
                  <strong>{org.name}</strong>
                  <span>{org.plan?.toUpperCase() || 'FREE'} • Vence: {org.valid_until ? new Date(org.valid_until).toLocaleDateString() : '30-10-2026'}</span>
                </OrgInfo>
                <Badge type="warning">30 Días</Badge>
              </ListItem>
            ))}
          </List>
          <ActionLink to="/admin/clients">Ver todos <FaArrowRight /></ActionLink>
        </Widget>

        {/* WIDGET: CLIENTES CON DEUDA */}
        <Widget>
          <SectionTitle>
            <FaMoneyBillWave style={{ color: '#f56565' }} /> Gestión de Cobranzas
          </SectionTitle>
          <List>
            {debtorOrgs.length === 0 ? (
              <div style={{ color: '#94a3b8', fontStyle: 'italic', padding: '1rem' }}>¡Excelente! No hay clientes con deuda.</div>
            ) : debtorOrgs.slice(0, 5).map(org => (
              <ListItem key={org.id} style={{ borderLeft: '4px solid #f87171' }}>
                <OrgInfo>
                  <strong>{org.name}</strong>
                  <span>{org.owner_email}</span>
                </OrgInfo>
                <Badge type="danger">IMPAGO</Badge>
              </ListItem>
            ))}
          </List>
          <ActionLink to="/admin/clients">Gestionar Deudas <FaArrowRight /></ActionLink>
        </Widget>

        {/* WIDGET: ACTIVIDAD RECIENTE */}
        <Widget>
          <SectionTitle>
            <FaUsers style={{ color: '#4299e1' }} /> Nuevos Clientes
          </SectionTitle>
          <List>
            {recentOrgs.map(org => (
              <ListItem key={org.id}>
                <OrgInfo>
                  <strong>{org.name}</strong>
                  <span>Registrado: {new Date(org.created_at).toLocaleDateString()}</span>
                </OrgInfo>
                <Badge type={org.status === 'active' ? 'success' : 'warning'}>{org.status || 'PENDIENTE'}</Badge>
              </ListItem>
            ))}
          </List>
          <ActionLink to="/admin/clients">Ver lista completa <FaArrowRight /></ActionLink>
        </Widget>
      </Grid>
    </Container>
  );
};

export default AdminDashboard;
