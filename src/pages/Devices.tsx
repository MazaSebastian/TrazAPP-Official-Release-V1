
import React from 'react';
import styled from 'styled-components';
import { TuyaManager } from '../components/TuyaManager';
import { FaPlug } from 'react-icons/fa';

const Container = styled.div`
  padding: 2rem;
  padding-top: 5rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;

  h1 {
    font-size: 2rem;
    font-weight: 800;
    color: #f8fafc;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
`;

const Devices: React.FC = () => {
  return (
    <Container>
      <Header>
        <h1><FaPlug /> Dispositivos IoT</h1>
      </Header>

      <div style={{
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        padding: '1.5rem',
        borderRadius: '1rem',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.2)'
      }}>
        <p style={{ marginBottom: '1.5rem', color: '#cbd5e1' }}>
          Gestión centralizada de dispositivos inteligentes Tuya. Controla luces, enchufes y monitorea sensores.
        </p>
        <TuyaManager mode="full" />
      </div>
    </Container>
  );
};

export default Devices;
