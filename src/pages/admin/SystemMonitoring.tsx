import React from 'react';
import styled from 'styled-components';
import { SystemHealth } from '../../components/admin/SystemHealth';
import { FaHeartbeat } from 'react-icons/fa';

const Container = styled.div`
  padding: 2rem;
  padding-top: 1.5rem;
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

const SystemMonitoring: React.FC = () => {
  return (
    <Container>
      <Header>
        <Title>
          <FaHeartbeat /> Monitoreo de Infraestructura
        </Title>
      </Header>

      <SystemHealth />

      <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(30, 41, 59, 0.6)', borderRadius: '12px', border: '1px dashed rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(12px)' }}>
        <h3 style={{ color: '#94a3b8', margin: '0 0 1rem 0' }}>Logs de Sistema (Próximamente)</h3>
        <p style={{ color: '#cbd5e1' }}>Aquí se mostrarán los logs de errores y alertas automáticas del sistema.</p>
      </div>
    </Container>
  );
};

export default SystemMonitoring;
