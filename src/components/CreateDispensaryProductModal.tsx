import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaTimes, FaSave } from 'react-icons/fa';
import { dispensaryService } from '../services/dispensaryService';
import { geneticsService } from '../services/geneticsService';
import { getSelectedOrgId } from '../services/supabaseClient';
import { CustomSelect } from './CustomSelect';

const ModalOverlay = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(8px);
  display: ${props => props.isOpen ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
  opacity: ${props => props.isOpen ? 1 : 0};
  transition: opacity 0.3s ease;
`;

const ModalContent = styled.div`
  background: rgba(30, 41, 59, 0.95);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  padding: 2.5rem;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  
  @media (max-width: 768px) {
    padding: 1.5rem;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;

  h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
    color: #f8fafc;
  }

  button {
    background: none;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    padding: 0.5rem;
    transition: color 0.2s;

    &:hover {
      color: #f8fafc;
    }
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  
  label {
    font-weight: 600;
    color: #cbd5e1;
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  input, select {
    padding: 0.875rem 1rem;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.75rem;
    color: #f8fafc;
    font-size: 1rem;
    transition: all 0.2s;
    
    &:focus {
      outline: none;
      border-color: #38bdf8;
      box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2);
    }
    
    &::placeholder {
      color: #64748b;
    }
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 1rem;
  background: rgba(74, 222, 128, 0.15);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(74, 222, 128, 0.3);
  color: #4ade80;
  border-radius: 0.75rem;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(74, 222, 128, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateDispensaryProductModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [productType, setProductType] = useState<'flower' | 'oil' | 'cream' | 'edible' | 'extract' | 'other'>('flower');
  const [productName, setProductName] = useState('');
  const [strainName, setStrainName] = useState('Genérico'); // Or empty
  const [unit, setUnit] = useState<'g' | 'ml' | 'u'>('g');
  const [initialAmount, setInitialAmount] = useState('');
  const [unitVolume, setUnitVolume] = useState('');
  const [unitVolumeType, setUnitVolumeType] = useState('ml');
  const [notes, setNotes] = useState('');

  const [genetics, setGenetics] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      geneticsService.getGenetics().then(setGenetics);
      // Reset form on open
      setProductType('flower');
      setProductName('');
      setStrainName('Genérico');
      setUnit('g');
      setInitialAmount('');
      setUnitVolume('');
      setUnitVolumeType('ml');
      setNotes('');
    }
  }, [isOpen]);

  // Sync default units when type changes
  const handleTypeChange = (val: string) => {
    setProductType(val as any);
    if (val === 'flower' || val === 'extract') {
      setUnit('g');
    } else {
      setUnit('u');
      if (val === 'cream' || val === 'edible') setUnitVolumeType('g');
      else setUnitVolumeType('ml');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initialAmount || isNaN(parseFloat(initialAmount)) || parseFloat(initialAmount) <= 0) {
      alert("Por favor ingresa una cantidad válida.");
      return;
    }

    setLoading(true);

    const generatedCode = `MAN-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const weight = parseFloat(initialAmount);

    const volume = unitVolume ? parseFloat(unitVolume) : null;

    const newBatch = {
      product_type: productType,
      product_name: productName || undefined,
      unit: unit,
      unit_volume: volume,
      unit_volume_type: unit === 'u' && volume ? unitVolumeType : null,
      strain_name: strainName,
      batch_code: generatedCode,
      initial_weight: weight,
      quality_grade: 'Standard' as const,
      status: 'available' as const,
      location: 'Dispensario Base',
      notes: notes || undefined,
      organization_id: getSelectedOrgId()
    };

    const result = await dispensaryService.createBatch(newBatch);
    setLoading(false);

    if (result) {
      onSuccess();
    } else {
      alert("Error al dar de alta el producto.");
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay isOpen={isOpen} onMouseDown={onClose}>
      <ModalContent onMouseDown={e => e.stopPropagation()}>
        <Header>
          <h2>📦 Nuevo Producto</h2>
          <button onClick={onClose}><FaTimes size={20} /></button>
        </Header>

        <form onSubmit={handleSubmit}>
          <FormGroup>
            <label>Tipo de Producto</label>
            <CustomSelect
              value={productType}
              onChange={handleTypeChange}
              options={[
                { value: 'flower', label: 'Flores' },
                { value: 'extract', label: 'Extracto / Resina' },
                { value: 'oil', label: 'Aceite Terápeutico' },
                { value: 'cream', label: 'Crema / Ungüento' },
                { value: 'edible', label: 'Comestible (Gomitas)' },
                { value: 'other', label: 'Otro' }
              ]}
            />
          </FormGroup>

          <FormGroup>
            <label>Nombre del Producto (Opcional)</label>
            <input
              type="text"
              placeholder="Ej. Aceite Choco OG 30%"
              value={productName}
              onChange={e => setProductName(e.target.value)}
            />
          </FormGroup>

          <FormGroup>
            <label>Genética Principal</label>
            <CustomSelect
              value={strainName}
              onChange={setStrainName}
              options={[
                { value: 'Genérico', label: 'Genérico / Sin Especificar' },
                ...genetics.map(g => ({ value: g.name, label: g.name }))
              ]}
            />
          </FormGroup>

          {unit === 'u' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem' }}>
              <FormGroup>
                <label>Unidades</label>
                <input
                  type="number"
                  step="1"
                  placeholder="Ej. 10"
                  value={initialAmount}
                  onChange={e => setInitialAmount(e.target.value)}
                  required
                />
              </FormGroup>

              {['oil', 'cream'].includes(productType) && (
                <FormGroup>
                  <label>Vol. x Envase</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ej. 30"
                    value={unitVolume}
                    onChange={e => setUnitVolume(e.target.value)}
                  />
                </FormGroup>
              )}

              {productType !== 'edible' && (
                <FormGroup>
                  <label>Medida</label>
                  <CustomSelect
                    value={unitVolumeType}
                    onChange={setUnitVolumeType}
                    options={[
                      { value: 'ml', label: 'Mililitros (ml)' },
                      { value: 'cc', label: 'Centímetros Cúb. (cc)' },
                      { value: 'g', label: 'Gramos (g)' },
                      { value: 'mg', label: 'Miligramos (mg)' },
                      { value: 'u', label: 'Unidad (u)' }
                    ]}
                  />
                </FormGroup>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
              <FormGroup>
                <label>Stock Inicial</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.0"
                  value={initialAmount}
                  onChange={e => setInitialAmount(e.target.value)}
                  required
                />
              </FormGroup>

              <FormGroup>
                <label>Unidad</label>
                <div style={{ padding: '0.875rem 1rem', background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '0.75rem', color: '#64748b' }}>
                  Gramos (g)
                </div>
              </FormGroup>
            </div>
          )}

          <FormGroup>
            <label>Descripción del producto</label>
            <textarea
              placeholder="Breve descripción del producto (máx. 150 caracteres)"
              maxLength={150}
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              style={{ padding: '0.875rem 1rem', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '0.75rem', color: '#f8fafc', fontSize: '1rem', resize: 'none' }}
            />
            <div style={{ textAlign: 'right', fontSize: '0.75rem', color: notes.length === 150 ? '#ef4444' : '#94a3b8', marginTop: '0.25rem' }}>
              {notes.length}/150
            </div>
          </FormGroup>

          <SubmitButton type="submit" disabled={loading}>
            <FaSave /> {loading ? 'Creando...' : 'Crear Producto'}
          </SubmitButton>
        </form>
      </ModalContent>
    </ModalOverlay>
  );
};
