import React, { useState } from 'react';
import styled from 'styled-components';
import { FaTimes, FaLink, FaEnvelope, FaCopy, FaCheck, FaSpider, FaSpinner } from 'react-icons/fa';
import { supabase } from '../../services/supabaseClient';
import { useOrganization } from '../../context/OrganizationContext';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
  padding: 1rem;
`;

const ModalContainer = styled.div`
  background: #1e293b;
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.1);
  animation: fadeIn 0.3s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  background: rgba(15, 23, 42, 0.5);

  h2 {
    margin: 0;
    font-size: 1.25rem;
    color: #f8fafc;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  button {
    background: none;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    font-size: 1.25rem;
    padding: 0.5rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;

    &:hover {
      background: rgba(255,255,255,0.1);
      color: #f8fafc;
    }
  }
`;

const Content = styled.div`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #cbd5e1;
  }
`;

const InputGroup = styled.div`
  position: relative;
  display: flex;
  align-items: center;

  svg {
    position: absolute;
    left: 1rem;
    color: #64748b;
  }

  input {
    width: 100%;
    padding: 0.75rem 1rem 0.75rem 2.5rem;
    background: #0f172a;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    color: #f8fafc;
    font-size: 1rem;
    transition: all 0.2s;

    &:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }
  }
`;

const Button = styled.button<{ $primary?: boolean, $loading?: boolean }>`
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: none;
  font-size: 1rem;
  opacity: ${props => props.$loading ? 0.7 : 1};
  pointer-events: ${props => props.$loading ? 'none' : 'auto'};

  background: ${props => props.$primary ? 'linear-gradient(to right, #3b82f6, #2563eb)' : 'rgba(255,255,255,0.1)'};
  color: ${props => props.$primary ? 'white' : '#f8fafc'};

  &:hover {
    transform: translateY(-1px);
    box-shadow: ${props => props.$primary ? '0 4px 6px -1px rgba(59, 130, 246, 0.5)' : 'none'};
    background: ${props => props.$primary ? '' : 'rgba(255,255,255,0.15)'};
  }
`;

const GeneratedLinkBox = styled.div`
  background: #0f172a;
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;

  .link-text {
    color: #60a5fa;
    font-family: monospace;
    font-size: 0.875rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  button {
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 0.5rem 1rem;
    cursor: pointer;
    font-weight: bold;
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;

    &:hover { background: #2563eb; }
  }
`;

interface InvitePatientModalProps {
    onClose: () => void;
    onSuccess?: () => void;
}

export const InvitePatientModal: React.FC<InvitePatientModalProps> = ({ onClose, onSuccess }) => {
    const { currentOrganization } = useOrganization();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [generatedLink, setGeneratedLink] = useState('');
    const [copied, setCopied] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !currentOrganization) return;

        setLoading(true);
        setErrorMsg('');

        try {
            const { data, error } = await supabase.functions.invoke('generate-invite-link', {
                body: { email, organization_id: currentOrganization.id }
            });

            if (error || !data?.success) {
                throw new Error(data?.error || error?.message || 'Error desconocido al generar la invitación');
            }

            setGeneratedLink(data.link);
            if (onSuccess) onSuccess();

        } catch (err: any) {
            console.error(err);
            setErrorMsg(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
    };

    return (
        <Overlay onClick={onClose}>
            <ModalContainer onClick={e => e.stopPropagation()}>
                <Header>
                    <h2><FaLink /> Generar Enlace de Invitación</h2>
                    <button onClick={onClose}><FaTimes /></button>
                </Header>

                <Content>
                    {!generatedLink ? (
                        <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <p style={{ color: '#cbd5e1', fontSize: '0.875rem', margin: 0, lineHeight: 1.5 }}>
                                Ingresa el correo electrónico del futuro socio. Generaremos un enlace único de <strong>Auto-Alta</strong> cifrado y vinculado a esta organización (expira en 48hs).
                            </p>
                            <FormGroup>
                                <label>Correo del paciente</label>
                                <InputGroup>
                                    <FaEnvelope />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="paciente@ejemplo.com"
                                        required
                                    />
                                </InputGroup>
                            </FormGroup>

                            {errorMsg && (
                                <div style={{ color: '#ef4444', fontSize: '0.875rem', background: 'rgba(239,68,68,0.1)', padding: '0.75rem', borderRadius: '8px' }}>
                                    {errorMsg}
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
                                <Button type="button" onClick={onClose}>Cancelar</Button>
                                <Button $primary type="submit" $loading={loading}>
                                    {loading ? <FaSpinner className="fa-spin" /> : 'Generar Link'}
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ textAlign: 'center', color: '#4ade80' }}>
                                <FaCheck size={48} style={{ marginBottom: '1rem' }} />
                                <h3 style={{ margin: 0, color: '#f8fafc' }}>¡Enlace Generado!</h3>
                                <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.5rem' }}>El paciente <b>{email}</b> ya está autorizado para ingresar.</p>
                            </div>

                            <GeneratedLinkBox>
                                <div className="link-text">{generatedLink}</div>
                                <button onClick={handleCopy}>
                                    {copied ? <><FaCheck /> ¡Copiado!</> : <><FaCopy /> Copiar</>}
                                </button>
                            </GeneratedLinkBox>

                            <p style={{ fontSize: '0.875rem', color: '#cbd5e1', textAlign: 'center', margin: 0 }}>
                                Copia este enlace y envíaselo por WhatsApp o correo. Una vez que complete sus datos, aparecerá en tu <b>Sala de Espera</b>.
                            </p>

                            <Button $primary onClick={onClose} style={{ marginTop: '1rem' }}>Entendido</Button>
                        </div>
                    )}
                </Content>
            </ModalContainer>
        </Overlay>
    );
};
