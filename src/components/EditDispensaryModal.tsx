import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { DispensaryBatch, dispensaryService } from '../services/dispensaryService';
import { FaSave, FaTimes } from 'react-icons/fa';
import { CustomSelect } from './CustomSelect';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2100;
`;

const ModalContent = styled.div`
  background: rgba(30, 41, 59, 0.95);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 2.5rem;
  border-radius: 1rem;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  color: #f8fafc;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  
  h2 {
    font-size: 1.5rem;
    color: #f8fafc;
    margin: 0;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.5rem;
  transition: color 0.2s;
  
  &:hover {
    color: #f8fafc;
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

  input, select, textarea {
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

    option {
      background: #1e293b;
      color: #f8fafc;
    }
  }
  
  .hint {
    font-size: 0.8rem;
    color: #94a3b8;
    margin-top: 0.25rem;
  }
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  background: ${props => {
        switch (props.variant) {
            case 'primary': return 'linear-gradient(135deg, rgba(74, 222, 128, 0.2) 0%, rgba(56, 189, 248, 0.2) 100%)';
            case 'danger': return 'rgba(239, 68, 68, 0.1)';
            case 'secondary': return 'rgba(148, 163, 184, 0.1)';
            default: return 'rgba(255, 255, 255, 0.05)';
        }
    }};

  border: 1px solid ${props => {
        switch (props.variant) {
            case 'primary': return 'rgba(74, 222, 128, 0.3)';
            case 'danger': return 'rgba(239, 68, 68, 0.3)';
            case 'secondary': return 'rgba(148, 163, 184, 0.2)';
            default: return 'rgba(255, 255, 255, 0.1)';
        }
    }};

  color: ${props => {
        switch (props.variant) {
            case 'primary': return '#f8fafc';
            case 'danger': return '#fca5a5';
            case 'secondary': return '#e2e8f0';
            default: return '#f8fafc';
        }
    }};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px ${props => {
        switch (props.variant) {
            case 'primary': return 'rgba(74, 222, 128, 0.2)';
            case 'danger': return 'rgba(239, 68, 68, 0.2)';
            default: return 'rgba(0, 0, 0, 0.2)';
        }
    }};
  }
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
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
                    <div>
                        <h2>Editar Lote</h2>
                        <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                            {batch.batch_code}
                        </span>
                    </div>
                    <CloseButton onClick={onClose}><FaTimes /></CloseButton>
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
                        />
                    </FormGroup>

                    <Actions>
                        <Button type="button" variant="secondary" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" variant="primary">
                            <FaSave /> Guardar Cambios
                        </Button>
                    </Actions>
                </form>
            </ModalContent>
        </ModalOverlay>
    );
};
