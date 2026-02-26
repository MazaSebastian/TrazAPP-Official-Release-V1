import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Plan } from '../../types';
import { planService } from '../../services/planService';
import { FaEdit, FaPlus, FaCheck } from 'react-icons/fa';

const Container = styled.div`
  padding: 2rem;
  padding-top: 1.5rem;
  max-width: 1200px;
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
`;

const Button = styled.button`
  background: rgba(168, 85, 247, 0.2);
  color: #d8b4fe;
  border: 1px solid rgba(168, 85, 247, 0.5);
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  backdrop-filter: blur(8px);
  transition: all 0.2s;

  &:hover { 
      background: rgba(168, 85, 247, 0.3);
      box-shadow: 0 4px 6px rgba(0,0,0,0.2); 
  }
`;

const PlansGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
`;

const PlanCard = styled.div`
  background: rgba(30, 41, 59, 0.6);
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2);
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(12px);
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3);
  }
`;

const PlanHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const PlanName = styled.h2`
  font-size: 1.5rem;
  color: #f8fafc;
  margin: 0;
`;

const PlanPrice = styled.div`
  font-size: 2rem;
  font-weight: 800;
  color: #c084fc;
  margin-bottom: 1.5rem;
  
  span {
    font-size: 1rem;
    color: #94a3b8;
    font-weight: 500;
  }
`;

const FeaturesList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 2rem 0;
  flex: 1;
`;

const FeatureItem = styled.li`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  color: #cbd5e1;
  
  svg { color: #4ade80; }
`;

const LimitsBox = styled.div`
  background: rgba(15, 23, 42, 0.5);
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  
  h4 {
    margin: 0 0 0.5rem 0;
    font-size: 0.875rem;
    color: #94a3b8;
    text-transform: uppercase;
  }
  
  div {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.25rem;
    font-size: 0.9rem;
    color: #f8fafc;
  }
`;

const PlansManagement: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    setIsLoading(true);
    try {
      const data = await planService.getPlans();
      setPlans(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <Container>Loading plans...</Container>;

  return (
    <Container>
      <Header>
        <Title>Planes y Suscripciones</Title>
        <Button><FaPlus /> Nuevo Plan</Button>
      </Header>

      <PlansGrid>
        {plans.map(plan => (
          <PlanCard key={plan.id}>
            <PlanHeader>
              <PlanName>{plan.name}</PlanName>
              {plan.active ? <span style={{ color: '#4ade80', fontWeight: 'bold', fontSize: '0.8rem', background: 'rgba(74, 222, 128, 0.2)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(74, 222, 128, 0.5)' }}>ACTIVO</span> : <span style={{ color: '#f87171', fontWeight: 'bold', fontSize: '0.8rem', background: 'rgba(239, 68, 68, 0.2)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.5)' }}>INACTIVO</span>}
            </PlanHeader>

            <PlanPrice>${plan.price}<span>/mes</span></PlanPrice>

            <LimitsBox>
              <h4>Límites</h4>
              <div>
                <span>Usuarios:</span>
                <strong>{plan.limits.max_users === 999 ? 'Ilimitado' : plan.limits.max_users}</strong>
              </div>
              <div>
                <span>Almacenamiento:</span>
                <strong>{plan.limits.max_storage_gb} GB</strong>
              </div>
            </LimitsBox>

            <FeaturesList>
              {plan.features.map((feature, idx) => (
                <FeatureItem key={idx}>
                  <FaCheck /> {formatFeatureName(feature)}
                </FeatureItem>
              ))}
            </FeaturesList>

            <Button style={{ width: '100%', justifyContent: 'center', background: 'transparent', color: '#cbd5e1', border: '1px solid rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(8px)' }}>
              <FaEdit /> Editar Plan
            </Button>
          </PlanCard>
        ))}
      </PlansGrid>
    </Container>
  );
};

const formatFeatureName = (feature: string) => {
  return feature
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default PlansManagement;
