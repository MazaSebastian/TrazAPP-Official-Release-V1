import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { X as LucideX, Link2, Mail, Copy, Check, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { useOrganization } from '../../context/OrganizationContext';
import { Button as ShadcnButton } from '../ui/Button';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(12px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background-color: rgba(3, 7, 18, 0.82);
  backdrop-filter: blur(12px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1rem;
  animation: ${fadeIn} 0.2s ease-out;
`;

const ModalContainer = styled.div`
  background: rgba(15, 23, 42, 0.96);
  backdrop-filter: blur(24px);
  border-radius: 1.25rem;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 25px 60px -12px rgba(0, 0, 0, 0.75);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
  animation: ${slideUp} 0.25s cubic-bezier(0.16, 1, 0.3, 1);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);

  .header-left {
    display: flex;
    align-items: center;
    gap: 0.85rem;

    .icon-badge {
      width: 40px;
      height: 40px;
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
        font-size: 1.15rem;
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

const Content = styled.div`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  label {
    font-size: 0.8rem;
    font-weight: 600;
    color: #cbd5e1;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
`;

const InputGroup = styled.div`
  position: relative;
  display: flex;
  align-items: center;

  .input-icon {
    position: absolute;
    left: 1rem;
    color: #64748b;
  }

  input {
    width: 100%;
    padding: 0.75rem 1rem 0.75rem 2.6rem;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 0.75rem;
    color: #f8fafc;
    font-size: 0.95rem;
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

const GeneratedLinkBox = styled.div`
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(52, 211, 153, 0.3);
  border-radius: 0.75rem;
  padding: 0.85rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.85rem;

  .link-text {
    color: #34d399;
    font-family: monospace;
    font-size: 0.85rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
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
          <div className="header-left">
            <div className="icon-badge">
              <Link2 size={20} />
            </div>
            <div className="title-col">
              <h2>Generar Enlace de Invitación</h2>
              <span>Acceso de auto-alta para pacientes y socios</span>
            </div>
          </div>
          <CloseButton onClick={onClose} title="Cerrar">
            <LucideX size={18} />
          </CloseButton>
        </Header>

        <Content>
          {!generatedLink ? (
            <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0, lineHeight: 1.55 }}>
                Ingresa el correo electrónico del futuro socio. Generaremos un enlace único de{' '}
                <strong style={{ color: '#f8fafc' }}>Auto-Alta</strong> cifrado y vinculado a esta organización (expira en 48hs).
              </p>
              <FormGroup>
                <label>Correo del paciente</label>
                <InputGroup>
                  <Mail size={18} className="input-icon" />
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
                <div
                  style={{
                    color: '#f87171',
                    fontSize: '0.85rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <ModalActions>
                <ShadcnButton type="button" variant="secondary" onClick={onClose} disabled={loading}>
                  Cancelar
                </ShadcnButton>
                <ShadcnButton type="submit" variant="default" isLoading={loading}>
                  <Link2 size={16} style={{ marginRight: 6 }} /> Generar Link
                </ShadcnButton>
              </ModalActions>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
                <CheckCircle2 size={44} color="#34d399" style={{ margin: '0 auto 0.75rem' }} />
                <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.15rem' }}>¡Enlace Generado!</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.35rem' }}>
                  El paciente <b style={{ color: '#f8fafc' }}>{email}</b> ya está autorizado para ingresar.
                </p>
              </div>

              <GeneratedLinkBox>
                <div className="link-text">{generatedLink}</div>
                <ShadcnButton
                  type="button"
                  variant={copied ? 'secondary' : 'default'}
                  size="sm"
                  onClick={handleCopy}
                  style={{ flexShrink: 0 }}
                >
                  {copied ? (
                    <>
                      <Check size={14} style={{ marginRight: 4 }} /> Copiado
                    </>
                  ) : (
                    <>
                      <Copy size={14} style={{ marginRight: 4 }} /> Copiar
                    </>
                  )}
                </ShadcnButton>
              </GeneratedLinkBox>

              <p style={{ fontSize: '0.825rem', color: '#94a3b8', textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
                Copia este enlace y envíaselo por WhatsApp o correo. Una vez que complete sus datos, aparecerá en tu{' '}
                <b style={{ color: '#f8fafc' }}>Sala de Espera</b>.
              </p>

              <ShadcnButton variant="default" onClick={onClose} style={{ marginTop: '0.5rem', width: '100%' }}>
                Entendido
              </ShadcnButton>
            </div>
          )}
        </Content>
      </ModalContainer>
    </Overlay>
  );
};
