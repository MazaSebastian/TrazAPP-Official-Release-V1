import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaCog, FaSave, FaDna } from 'react-icons/fa';
import { geneticsService } from '../services/geneticsService';
import { ToastModal } from '../components/ToastModal';
import { Genetic } from '../types/genetics';

const PageContainer = styled.div`
  padding: 1rem;
  padding-top: 5rem;
  max-width: 800px;
  margin: 0 auto;
  min-height: 100vh;
  color: #f8fafc;
  
  @media (max-width: 768px) {
    padding: 0.5rem;
    padding-top: 4rem;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 2rem;
  
  h1 {
    font-size: 1.875rem;
    font-weight: 700;
    color: #f8fafc;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
`;

const Section = styled.div`
  background: rgba(30, 41, 59, 0.6);
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
  margin-bottom: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
`;

const SectionHeader = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #f8fafc;
  margin: 0 0 1.5rem 0;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SaveButton = styled.button`
  background: rgba(168, 85, 247, 0.2);
  color: #d8b4fe;
  border: 1px solid rgba(168, 85, 247, 0.5);
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  backdrop-filter: blur(8px);
  
  &:hover:not(:disabled) {
    background: rgba(168, 85, 247, 0.3);
    transform: translateY(-1px);
    box-shadow: 0 4px 6px rgba(0,0,0,0.2);
  }
  
  &:disabled {
    background: rgba(100, 116, 139, 0.2);
    color: #94a3b8;
    border-color: rgba(100, 116, 139, 0.5);
    cursor: not-allowed;
    box-shadow: none;
  }
`;

const Settings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [genetics, setGenetics] = useState<Genetic[]>([]);
  const [toast, setToast] = useState<{ isOpen: boolean, message: string, type: 'success' | 'error' }>({
    isOpen: false,
    message: '',
    type: 'success'
  });

  useEffect(() => {
    loadGenetics();
  }, []);

  const loadGenetics = async () => {
    setLoading(true); // Loading starts here
    const data = await geneticsService.getGenetics();
    setGenetics(data);
    setLoading(false); // Loading ends here
  };

  const handleSaveGenetics = async () => {
    setSaving(true);
    let successCount = 0;
    let errorCount = 0;

    for (const gen of genetics) {
      const success = await geneticsService.updateGenetic(gen.id, { default_price_per_gram: gen.default_price_per_gram });
      if (success) successCount++;
      else errorCount++;
    }

    if (errorCount === 0) {
      setToast({ isOpen: true, message: 'Precios de genéticas actualizados', type: 'success' });
    } else {
      setToast({ isOpen: true, message: `Actualizados: ${successCount}.Errores: ${errorCount} `, type: 'error' });
    }
    setSaving(false);
  };

  const updateGeneticPrice = (id: string, price: string) => {
    setGenetics(genetics.map(g =>
      g.id === id ? { ...g, default_price_per_gram: parseFloat(price) || 0 } : g
    ));
  };

  const closeToast = () => setToast({ ...toast, isOpen: false });

  if (loading) return <PageContainer>Cargando configuración...</PageContainer>;

  return (
    <PageContainer>
      <Header>
        <h1><FaCog /> Configuración</h1>
      </Header>



      <Section>
        <SectionHeader>
          <FaDna /> Precios por Genética
        </SectionHeader>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {genetics.map(gen => (
            <div key={gen.id} style={{ border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '0.5rem', padding: '1rem', background: 'rgba(30, 41, 59, 0.5)' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#f8fafc' }}>{gen.name}</div>
              <input
                type="number"
                placeholder="Precio ($)"
                value={gen.default_price_per_gram || ''}
                onChange={e => updateGeneticPrice(gen.id, e.target.value)}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '0.25rem', background: 'rgba(15, 23, 42, 0.5)', color: '#f8fafc', outline: 'none' }}
              />
            </div>
          ))}
        </div>

        <SaveButton onClick={handleSaveGenetics} disabled={saving}>
          <FaSave /> {saving ? 'Guardando...' : 'Guardar Precios Genéticas'}
        </SaveButton>
      </Section>

      <ToastModal
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={closeToast}
      />
    </PageContainer>
  );
};

export default Settings;
