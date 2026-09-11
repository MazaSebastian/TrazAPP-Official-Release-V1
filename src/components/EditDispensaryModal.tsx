import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { DispensaryBatch, dispensaryService } from '../services/dispensaryService';
import { X as LucideX, Save, Edit3 } from 'lucide-react';
import { CustomSelect } from './CustomSelect';
import { Button as ShadcnButton } from './ui/Button';
import { Badge as ShadcnBadge } from './ui/Badge';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(12px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(3, 7, 18, 0.82);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2100;
  padding: 1rem;
  animation: ${fadeIn} 0.2s ease-out;
`;

const ModalContent = styled.div`
  background: rgba(15, 23, 42, 0.96);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 1.75rem;
  border-radius: 1.25rem;
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 60px -12px rgba(0, 0, 0, 0.75);
  color: #f8fafc;
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
        font-size: 1.2rem;
        font-weight: 700;
        color: #f8fafc;
        margin: 0;
        letter-spacing: -0.01em;
      }

      .meta-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-top: 2px;
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
  }

  .hint {
    font-size: 0.75rem;
    color: #94a3b8;
    margin-top: 0.2rem;
    font-family: monospace;
  }
`;

const Actions = styled.div`
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

interface EditDispensaryModalProps {
  isOpen: boolean;
  batch: DispensaryBatch | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditDispensaryModal: React.FC<EditDispensaryModalProps> = ({
  isOpen,
  batch,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    strain_name: '',
    initial_weight: '',
    current_weight: '',
    status: 'curing',
    quality_grade: 'Standard',
    price_per_gram: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (batch) {
      setFormData({
        strain_name: batch.strain_name,
        initial_weight: batch.initial_weight.toString(),
        current_weight: batch.current_weight.toString(),
        status: batch.status,
        quality_grade: batch.quality_grade,
        price_per_gram: batch.price_per_gram ? batch.price_per_gram.toString() : '',
        notes: batch.notes || ''
      });
    }
  }, [batch]);

  if (!isOpen || !batch) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const updates: Partial<DispensaryBatch> = {
      strain_name: formData.strain_name,
      initial_weight: parseFloat(formData.initial_weight),
      current_weight: parseFloat(formData.current_weight),
      status: formData.status as any,
      quality_grade: formData.quality_grade as any,
      price_per_gram: formData.price_per_gram ? parseFloat(formData.price_per_gram) : 0,
      notes: formData.notes
    };

    const success = await dispensaryService.updateBatch(batch.id, updates);
    setLoading(false);

    if (success) {
      onSuccess();
    } else {
      alert('Error al actualizar el lote');
    }
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <Header>
          <div className="header-left">
            <div className="icon-badge">
              <Edit3 size={20} />
            </div>
            <div className="title-col">
              <h2>Editar Lote de Dispensario</h2>
              <div className="meta-row">
                <ShadcnBadge variant="outline">
                  {batch.batch_code}
                </ShadcnBadge>
              </div>
            </div>
          </div>
          <CloseButton onClick={onClose} title="Cerrar">
            <LucideX size={18} />
          </CloseButton>
        </Header>

        <form onSubmit={handleSubmit}>
          <FormGroup>
            <label>Variedad (Strain)</label>
            <input
              type="text"
              value={formData.strain_name}
              onChange={e => setFormData({ ...formData, strain_name: e.target.value })}
              required
            />
          </FormGroup>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormGroup>
              <label>Peso Inicial (g)</label>
              <input
                type="number"
                step="0.01"
                value={formData.initial_weight}
                onChange={e => setFormData({ ...formData, initial_weight: e.target.value })}
                required
              />
              <div className="hint">Original: {batch.initial_weight}g</div>
            </FormGroup>

            <FormGroup>
              <label>Peso Actual (g)</label>
              <input
                type="number"
                step="0.01"
                value={formData.current_weight}
                onChange={e => setFormData({ ...formData, current_weight: e.target.value })}
                required
              />
              <div className="hint">Original: {batch.current_weight}g</div>
            </FormGroup>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormGroup>
              <label>Estado</label>
              <CustomSelect
                value={formData.status}
                onChange={val => setFormData({ ...formData, status: val })}
                options={[
                  { value: 'curing', label: 'Curándose (Curing)' },
                  { value: 'available', label: 'Disponible' },
                  { value: 'quarantine', label: 'Cuarentena' },
                  { value: 'depleted', label: 'Agotado' }
                ]}
              />
            </FormGroup>

            <FormGroup>
              <label>Calidad</label>
              <CustomSelect
                value={formData.quality_grade}
                onChange={val => setFormData({ ...formData, quality_grade: val })}
                options={[
                  { value: 'Premium', label: 'Premium' },
                  { value: 'Standard', label: 'Standard' },
                  { value: 'Extracts', label: 'Extracts' },
                  { value: 'Trim', label: 'Trim' }
                ]}
              />
            </FormGroup>
          </div>

          <FormGroup>
            <label>Notas</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notas opcionales..."
              style={{ resize: 'none' }}
            />
          </FormGroup>

          <Actions>
            <ShadcnButton type="button" variant="secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </ShadcnButton>
            <ShadcnButton type="submit" variant="default" isLoading={loading}>
              <Save size={16} style={{ marginRight: 6 }} /> Guardar Cambios
            </ShadcnButton>
          </Actions>
        </form>
      </ModalContent>
    </ModalOverlay>
  );
};
