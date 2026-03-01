import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { FaFileMedical, FaPlus, FaPen, FaTrash, FaSave, FaTimes } from 'react-icons/fa';
import { templatesService, ClinicalTemplate, FormField, FieldType } from '../services/templatesService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ToastModal } from '../components/ToastModal';
import { CustomSelect } from '../components/CustomSelect';
import { PrintableTemplate } from '../components/Templates/PrintableTemplate';
import { useReactToPrint } from 'react-to-print';
import { useRef } from 'react';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(20px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

const slideDown = keyframes`
  from { opacity: 1; transform: translateY(0) scale(1); }
  to { opacity: 0; transform: translateY(20px) scale(0.95); }
`;

const PageContainer = styled.div`
  padding: 1rem;
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
  font-size: 1.8rem;
  color: #f8fafc;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  background: rgba(168, 85, 247, 0.2);
  color: #d8b4fe;
  border: 1px solid rgba(168, 85, 247, 0.5);
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  backdrop-filter: blur(8px);

  &:hover {
    background: rgba(168, 85, 247, 0.3);
    transform: translateY(-1px);
    box-shadow: 0 4px 6px rgba(0,0,0,0.2);
  }

  &:disabled {
      background: rgba(100, 116, 139, 0.2);
      color: #94a3b8;
      border-color: rgba(100, 116, 139, 0.5);
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
  }
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
`;

const TemplateCard = styled.div<{ $isNew?: boolean }>`
  background: ${props => props.$isNew ? 'rgba(56, 189, 248, 0.1)' : 'rgba(30, 41, 59, 0.6)'};
  border-radius: 12px;
  border: 1px solid ${props => props.$isNew ? 'rgba(56, 189, 248, 0.5)' : 'rgba(255, 255, 255, 0.05)'};
  ${props => props.$isNew && 'border-style: dashed;'}
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
  transition: all 0.3s;
  cursor: pointer;
  backdrop-filter: blur(12px);
  display: flex;
  flex-direction: column;
  justify-content: ${props => props.$isNew ? 'center' : 'flex-start'};
  align-items: ${props => props.$isNew ? 'center' : 'stretch'};
  min-height: 180px;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
    border-color: ${props => props.$isNew ? 'rgba(56, 189, 248, 0.8)' : 'rgba(168, 85, 247, 0.3)'};
  }

  h3 {
    margin: 0 0 0.5rem 0;
    color: ${props => props.$isNew ? '#38bdf8' : '#f8fafc'};
    font-size: 1.25rem;
  }

  p {
    color: #94a3b8;
    font-size: 0.9rem;
    margin: 0;
    flex-grow: 1;
  }

  .desktop-content {
    display: flex;
    flex-direction: column;
    height: 100%;
    
    @media (max-width: 768px) {
      display: none;
    }
  }

  .mobile-content {
    display: none;
    @media (max-width: 768px) {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }

    .m-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
      font-size: 0.9rem;
    }

    .m-name {
      font-weight: 700;
      color: #f8fafc;
      text-transform: capitalize;
    }

    .m-badge {
      background: rgba(255,255,255,0.1);
      padding: 0.2rem 0.5rem;
      border-radius: 1rem;
      font-size: 0.75rem;
      color: #94a3b8;
      white-space: nowrap;
    }
  }

  @media (max-width: 768px) {
    min-height: auto;
    padding: 1rem;
    
    /* Small exception for the "New Template" card on mobile to look like a slim button */
    ${props => props.$isNew && `
      flex-direction: row;
      justify-content: center;
      gap: 0.5rem;
      padding: 1rem;
      h3 { margin: 0; font-size: 1rem; }
      p { display: none; }
      svg { margin-bottom: 0 !important; font-size: 1.2rem !important; }
    `}
  }
`;

const Modal = styled.div<{ isOpen: boolean; $isClosing?: boolean }>`
  display: ${props => props.isOpen ? 'flex' : 'none'};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1rem;
  backdrop-filter: blur(4px);
  animation: ${props => props.$isClosing ? fadeOut : fadeIn} 0.3s ease-out forwards;
`;

const ModalContent = styled.div<{ $isClosing?: boolean }>`
  background: rgba(15, 23, 42, 0.95);
  padding: 2rem;
  border-radius: 1rem;
  width: 100%;
  max-width: 800px; 
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);
  backdrop-filter: blur(16px);
  color: #f8fafc;
  animation: ${props => props.$isClosing ? slideDown : slideUp} 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;

  @media (max-width: 768px) {
    padding: 1.5rem 1rem;
    border-radius: 0.75rem;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #94a3b8;
    font-size: 0.9rem;
  }
  
  input, select, textarea {
    width: 100%;
    padding: 0.6rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.375rem;
    font-size: 0.95rem;
    background: rgba(30, 41, 59, 0.5);
    color: #f8fafc;

    &:focus {
      outline: none;
      border-color: rgba(168, 85, 247, 0.5);
      box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1);
    }
  }
`;

const FieldBuilderRow = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr auto;
  gap: 1rem;
  align-items: center;
  background: rgba(255,255,255,0.02);
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(255,255,255,0.05);
  margin-bottom: 1rem;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    gap: 0.75rem;
    align-items: stretch;
  }

  input:not([type="checkbox"]), select {
    width: 100%;
    padding: 0.6rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.375rem;
    font-size: 0.95rem;
    background: rgba(30, 41, 59, 0.5);
    color: #f8fafc;
    box-sizing: border-box;

    &:focus {
      outline: none;
      border-color: rgba(168, 85, 247, 0.5);
      box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1);
    }
    
    option {
      background: #0f172a;
      color: #f8fafc;
    }
  }

  input[type="checkbox"] {
    appearance: none;
    background-color: rgba(30, 41, 59, 0.5);
    margin: 0;
    font: inherit;
    color: currentColor;
    width: 1.15em;
    height: 1.15em;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 0.25em;
    display: grid;
    place-content: center;
    cursor: pointer;

    &::before {
      content: "";
      width: 0.65em;
      height: 0.65em;
      transform: scale(0);
      transition: 120ms transform ease-in-out;
      box-shadow: inset 1em 1em #38bdf8;
      background-color: #38bdf8;
      transform-origin: center;
      clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);
    }

    &:checked::before {
      transform: scale(1);
    }

    &:focus {
      outline: max(2px, 0.15em) solid rgba(168, 85, 247, 0.5);
      outline-offset: max(2px, 0.15em);
    }
  }
`;

const Templates: React.FC = () => {
  const [templates, setTemplates] = useState<ClinicalTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form builder state
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [fields, setFields] = useState<FormField[]>([]);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

  // Toast State
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastOpen(true);
  };

  // Printing logic
  const printRef = useRef<HTMLDivElement>(null);
  const [templateToPrint, setTemplateToPrint] = useState<ClinicalTemplate | null>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: templateToPrint ? `Plantilla-${templateToPrint.name}` : 'Plantilla',
    onAfterPrint: () => setTemplateToPrint(null),
    onPrintError: (err) => console.log('Print error:', err),
  });

  // Effect to trigger print after state updates templateToPrint, need a small timeout to let React mount the printable component
  useEffect(() => {
    if (templateToPrint) {
      setTimeout(() => {
        if (printRef.current) {
          handlePrint();
        }
      }, 100);
    }
  }, [templateToPrint, handlePrint]);

  const loadData = async () => {
    setIsLoading(true);
    const data = await templatesService.getTemplates();
    setTemplates(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openModal = (template?: ClinicalTemplate) => {
    if (template) {
      setEditingTemplateId(template.id);
      setFormName(template.name);
      setFormDesc(template.description || '');
      setFields(template.fields || []);
    } else {
      setEditingTemplateId(null);
      setFormName('');
      setFormDesc('');
      setFields([]);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setIsClosing(false);
    }, 300);
  };

  const handleAddField = () => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type: 'text',
      label: '',
      required: false,
      options: []
    };
    setFields([...fields, newField]);
  };

  const handleUpdateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const handleRemoveField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('El nombre de la plantilla es obligatorio', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: formName,
        description: formDesc,
        is_active: true,
        fields: fields
      };

      if (editingTemplateId) {
        await templatesService.updateTemplate(editingTemplateId, payload);
        showToast('Plantilla actualizada', 'success');
      } else {
        await templatesService.createTemplate(payload);
        showToast('Plantilla guardada', 'success');
      }

      closeModal();
      loadData();
    } catch (error) {
      console.error('Error:', error);
      showToast('Hubo un error al guardar', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('¿Seguro que quieres eliminar esta plantilla?')) {
      await templatesService.deleteTemplate(id);
      showToast('Plantilla eliminada', 'success');
      loadData();
    }
  };

  return (
    <PageContainer>
      <Header>
        <Title><FaFileMedical /> Mis Plantillas Médicas</Title>
      </Header>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <CardGrid>
          <TemplateCard $isNew onClick={() => openModal()}>
            <FaPlus size={32} style={{ marginBottom: '1rem', color: '#38bdf8' }} />
            <h3>Crear Nueva Plantilla</h3>
            <p style={{ textAlign: 'center' }}>Diseña un nuevo formulario a la medida</p>
          </TemplateCard>

          {templates.map(template => (
            <TemplateCard key={template.id} onClick={() => openModal(template)}>
              {/* Desktop View */}
              <div className="desktop-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ textTransform: 'capitalize' }}>{template.name}</h3>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <ActionButton
                      style={{ background: 'transparent', border: 'none', padding: '0.2rem', color: '#38bdf8' }}
                      onClick={(e) => { e.stopPropagation(); setTemplateToPrint(template); }}
                      title="Imprimir plantilla en blanco"
                    >
                      <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="14" width="14" xmlns="http://www.w3.org/2000/svg"><path d="M400 32H112C85.5 32 64 53.5 64 80v352c0 26.5 21.5 48 48 48h288c26.5 0 48-21.5 48-48V80c0-26.5-21.5-48-48-48zm-16 398c0 3.3-2.7 6-6 6H134c-3.3 0-6-2.7-6-6V86c0-3.3 2.7-6 6-6h244c3.3 0 6 2.7 6 6v344zM160 160h192v32H160zm0 80h192v32H160zm0 80h192v32H160z"></path></svg>
                    </ActionButton>
                    <ActionButton
                      style={{ background: 'transparent', border: 'none', padding: '0.2rem', color: '#f87171' }}
                      onClick={(e) => handleDelete(template.id, e)}
                      title="Eliminar plantilla"
                    >
                      <FaTrash size={14} />
                    </ActionButton>
                  </div>
                </div>
                <p>{template.description || 'Sin descripción'}</p>
                <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#64748b', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.5rem', borderRadius: '1rem' }}>
                    {template.fields.length} campos
                  </span>
                </div>
              </div>

              {/* Mobile View */}
              < div className="mobile-content" >
                <div className="m-info">
                  <span className="m-name">{template.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="m-badge">{template.fields.length} campos</span>
                  <ActionButton
                    style={{ background: 'transparent', border: 'none', padding: '0.2rem', color: '#38bdf8' }}
                    onClick={(e) => { e.stopPropagation(); setTemplateToPrint(template); }}
                    title="Imprimir"
                  >
                    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="14" width="14" xmlns="http://www.w3.org/2000/svg"><path d="M400 32H112C85.5 32 64 53.5 64 80v352c0 26.5 21.5 48 48 48h288c26.5 0 48-21.5 48-48V80c0-26.5-21.5-48-48-48zm-16 398c0 3.3-2.7 6-6 6H134c-3.3 0-6-2.7-6-6V86c0-3.3 2.7-6 6-6h244c3.3 0 6 2.7 6 6v344zM160 160h192v32H160zm0 80h192v32H160zm0 80h192v32H160z"></path></svg>
                  </ActionButton>
                  <ActionButton
                    style={{ background: 'transparent', border: 'none', padding: '0.2rem', color: '#f87171' }}
                    onClick={(e) => handleDelete(template.id, e)}
                    title="Eliminar plantilla"
                  >
                    <FaTrash size={14} />
                  </ActionButton>
                </div>
              </div>
            </TemplateCard>
          ))
          }
        </CardGrid >
      )}

      <Modal isOpen={isModalOpen || isClosing} $isClosing={isClosing} onMouseDown={closeModal}>
        <ModalContent $isClosing={isClosing} onMouseDown={(e) => e.stopPropagation()}>
          <h2 style={{ marginBottom: '1.5rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaPen size={20} /> {editingTemplateId ? 'Editar Plantilla' : 'Nueva Plantilla Clínica'}
          </h2>

          <form onSubmit={handleSaveTemplate}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <FormGroup style={{ flex: '1 1 300px' }}>
                <label>Nombre de la Plantilla</label>
                <input
                  autoFocus
                  placeholder="Ej: Evolución Semanal"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  required
                />
              </FormGroup>
              <FormGroup style={{ flex: '2 1 400px' }}>
                <label>Descripción (Opcional)</label>
                <input
                  placeholder="Breve descripción de su propósito..."
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                />
              </FormGroup>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '1.5rem 0', paddingTop: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Constructor de Campos</h3>
                <ActionButton type="button" onClick={handleAddField} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', width: '100%', justifyContent: 'center', '@media (minWidth: 600px)': { width: 'auto' } } as any}>
                  <FaPlus /> Agregar Variante
                </ActionButton>
              </div>

              {fields.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '0.5rem', color: '#94a3b8' }}>
                  No hay campos agregados aún. Agrega el primer input.
                </div>
              ) : (
                fields.map((field, index) => (
                  <FieldBuilderRow key={field.id}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <input
                        placeholder="Pregunta / Etiqueta del campo..."
                        value={field.label}
                        onChange={e => handleUpdateField(field.id, { label: e.target.value })}
                        required
                      />
                      {(field.type === 'select' || field.type === 'checkbox') && (
                        <input
                          style={{ fontSize: '0.85rem' }}
                          placeholder="Opciones separadas por comas (Ej: Diario, Semanal, Mensual)"
                          value={field.options?.join(', ')}
                          onChange={e => handleUpdateField(field.id, { options: e.target.value.split(',').map(s => s.trim()) })}
                        />
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative', zIndex: 10 + fields.length - index }}>
                      <CustomSelect
                        value={field.type}
                        onChange={val => handleUpdateField(field.id, { type: val as FieldType })}
                        options={[
                          { value: 'text', label: 'Texto Corto (Input)' },
                          { value: 'textarea', label: 'Texto Largo (Área)' },
                          { value: 'select', label: 'Lista Desplegable (Select)' },
                          { value: 'checkbox', label: 'Opciones Múltiples (Checkboxes)' },
                          { value: 'date', label: 'Selector de Fecha' },
                          { value: 'eva', label: 'Escala EVA (Dolor Basal)' }
                        ]}
                        triggerStyle={{ padding: '0.6rem', paddingRight: '2.5rem' }}
                      />
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer', margin: 0 }}>
                        <input
                          type="checkbox"
                          style={{ width: 'auto' }}
                          checked={field.required}
                          onChange={e => handleUpdateField(field.id, { required: e.target.checked })}
                        />
                        Campo Requerido
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveField(field.id)}
                      style={{ background: 'transparent', border: 'none', color: '#f87171', padding: '0.5rem', cursor: 'pointer', display: 'flex' }}
                      title="Eliminar campo"
                    >
                      <FaTimes size={20} />
                    </button>
                  </FieldBuilderRow>
                ))
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
              <ActionButton type="button" style={{ background: 'transparent', border: 'none', color: '#94a3b8' }} onClick={closeModal}>
                Cancelar
              </ActionButton>
              <ActionButton type="submit" disabled={isSubmitting} style={{ background: '#38bdf8', color: '#0f172a', borderColor: '#38bdf8' }}>
                <FaSave /> {isSubmitting ? 'Guardando...' : 'Guardar Plantilla'}
              </ActionButton>
            </div>
          </form>
        </ModalContent>
      </Modal>

      {/* Hidden Print Container */}
      <div style={{ display: 'none' }}>
        <PrintableTemplate
          ref={printRef}
          template={templateToPrint || ({ id: 'dummy', name: '', is_active: false, fields: [] } as unknown as ClinicalTemplate)}
        />
      </div>

      {toastOpen && <ToastModal isOpen={toastOpen} message={toastMessage} type={toastType} onClose={() => setToastOpen(false)} />}
    </PageContainer >
  );
};

export default Templates;
