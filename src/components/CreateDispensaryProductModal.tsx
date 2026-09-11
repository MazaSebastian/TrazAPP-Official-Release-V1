import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { X as LucideX, PackagePlus, Save, Package } from 'lucide-react';
import { dispensaryService } from '../services/dispensaryService';
import { geneticsService } from '../services/geneticsService';
import { getSelectedOrgId } from '../services/supabaseClient';
import { CustomSelect } from './CustomSelect';
import { Button as ShadcnButton } from './ui/Button';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(12px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

const ModalOverlay = styled.div<{ isOpen: boolean }>`
  position: fixed;
  inset: 0;
  background: rgba(3, 7, 18, 0.82);
  backdrop-filter: blur(12px);
  display: ${props => (props.isOpen ? 'flex' : 'none')};
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
  animation: ${fadeIn} 0.2s ease-out;
`;

const ModalContent = styled.div`
  background: rgba(15, 23, 42, 0.96);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 1.25rem;
  padding: 1.75rem;
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 60px -12px rgba(0, 0, 0, 0.75);
  animation: ${slideUp} 0.25s cubic-bezier(0.16, 1, 0.3, 1);

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }

  @media (max-width: 768px) {
    padding: 1.25rem;
    max-height: 94vh;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);

  .header-left {
    display: flex;
    align-items: center;
    gap: 0.85rem;

    .icon-badge {
      width: 42px;
      height: 42px;
      border-radius: 10px;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.25);
      color: #34d399;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .title-col {
      display: flex;
      flex-direction: column;

      h2 {
        margin: 0;
        font-size: 1.2rem;
        font-weight: 700;
        color: #f8fafc;
        letter-spacing: -0.01em;
      }

      span {
        font-size: 0.8rem;
        color: #94a3b8;
      }
    }
  }
`;

const CloseButton = styled.button`
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  width: 32px;
  height: 32px;
  border-radius: 8px;
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #f8fafc;
    border-color: rgba(255, 255, 255, 0.2);
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-bottom: 1.25rem;

  label {
    font-weight: 600;
    color: #cbd5e1;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  input,
  textarea {
    padding: 0.75rem 0.95rem;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 0.75rem;
    color: #f8fafc;
    font-size: 0.9rem;
    transition: all 0.2s;

    &:focus {
      outline: none;
      border-color: #34d399;
      box-shadow: 0 0 0 2px rgba(52, 211, 153, 0.2);
    }

    &::placeholder {
      color: #64748b;
    }
  }
`;

const FooterButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);

  @media (max-width: 640px) {
    flex-direction: column-reverse;
    button {
      width: 100%;
    }
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
  const [strainName, setStrainName] = useState('Genérico');
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
      alert('Por favor ingresa una cantidad válida.');
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
      alert('Error al dar de alta el producto.');
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay isOpen={isOpen} onMouseDown={onClose}>
      <ModalContent onMouseDown={e => e.stopPropagation()}>
        <Header>
          <div className="header-left">
            <div className="icon-badge">
              <PackagePlus size={20} />
            </div>
            <div className="title-col">
              <h2>Nuevo Producto de Dispensario</h2>
              <span>Alta de flores, extractos o elaboraciones terapéuticas</span>
            </div>
          </div>
          <CloseButton onClick={onClose} title="Cerrar">
            <LucideX size={18} />
          </CloseButton>
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
                { value: 'oil', label: 'Aceite Terapéutico' },
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
                <div
                  style={{
                    padding: '0.75rem 0.95rem',
                    background: 'rgba(15, 23, 42, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '0.75rem',
                    color: '#94a3b8',
                    fontSize: '0.9rem'
                  }}
                >
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
              style={{ resize: 'none' }}
            />
            <div
              style={{
                textAlign: 'right',
                fontSize: '0.75rem',
                color: notes.length === 150 ? '#ef4444' : '#94a3b8',
                marginTop: '0.25rem'
              }}
            >
              {notes.length}/150
            </div>
          </FormGroup>

          <FooterButtons>
            <ShadcnButton type="button" variant="secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </ShadcnButton>
            <ShadcnButton type="submit" variant="default" isLoading={loading}>
              <Save size={16} style={{ marginRight: 6 }} /> Guardar Producto
            </ShadcnButton>
          </FooterButtons>
        </form>
      </ModalContent>
    </ModalOverlay>
  );
};
