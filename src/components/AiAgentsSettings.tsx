import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  FaRobot,
  FaKey,
  FaPlus,
  FaCopy,
  FaTrash,
  FaCheck,
  FaShieldAlt,
  FaTerminal,
  FaInfoCircle,
  FaTimes,
} from 'react-icons/fa';
import { apiKeyService, TrazAppApiKey } from '../services/apiKeyService';
import { LoadingSpinner } from './LoadingSpinner';
import Swal from 'sweetalert2';

// ─── Styled Components ────────────────────────────────────────────────────────

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
`;

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
`;

const TitleGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  h3 {
    margin: 0;
    font-size: 1.35rem;
    font-weight: 700;
    color: #f8fafc;
    display: flex;
    align-items: center;
    gap: 0.65rem;
  }

  p {
    margin: 0;
    font-size: 0.88rem;
    color: #94a3b8;
  }
`;

const PrimaryButton = styled.button`
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.25rem;
  border-radius: 0.75rem;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(16, 185, 129, 0.35);
  }
`;

const Banner = styled.div`
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 1rem;
  padding: 1.25rem 1.5rem;
  display: flex;
  gap: 1rem;
  align-items: flex-start;

  .icon {
    font-size: 1.5rem;
    color: #10b981;
    flex-shrink: 0;
    margin-top: 0.2rem;
  }

  .text {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;

    strong {
      color: #34d399;
      font-size: 0.95rem;
    }

    span {
      color: #cbd5e1;
      font-size: 0.85rem;
      line-height: 1.45;
    }
  }
`;

const KeysTable = styled.div`
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1rem;
  overflow: hidden;
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 2fr 2fr 1.5fr 1fr 1fr;
  padding: 1rem 1.25rem;
  background: rgba(30, 41, 59, 0.5);
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94a3b8;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);

  @media (max-width: 768px) {
    display: none;
  }
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: 2fr 2fr 1.5fr 1fr 1fr;
  padding: 1.15rem 1.25rem;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  font-size: 0.88rem;
  transition: background 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.02);
  }

  &:last-child {
    border-bottom: none;
  }

  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.65rem;
    padding: 1rem;
  }
`;

const KeyBadge = styled.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
  background: rgba(255, 255, 255, 0.06);
  padding: 0.25rem 0.65rem;
  border-radius: 0.35rem;
  color: #cbd5e1;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const StatusPill = styled.span<{ $active: boolean }>`
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  background: ${(props) =>
    props.$active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'};
  color: ${(props) => (props.$active ? '#34d399' : '#f87171')};
  border: 1px solid
    ${(props) =>
      props.$active ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'};
`;

const ActionButton = styled.button`
  background: rgba(239, 68, 68, 0.1);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.2);
  padding: 0.45rem 0.85rem;
  border-radius: 0.5rem;
  font-size: 0.8rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(239, 68, 68, 0.2);
  }
`;

const EmptyState = styled.div`
  padding: 3rem 1.5rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.85rem;
  color: #94a3b8;

  .icon {
    font-size: 2.5rem;
    color: #475569;
  }
`;

// ─── Modal Components ─────────────────────────────────────────────────────────

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1.25rem;
  max-width: 580px;
  width: 100%;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 700;
    color: #f8fafc;
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  button {
    background: none;
    border: none;
    color: #94a3b8;
    font-size: 1.2rem;
    cursor: pointer;
    &:hover {
      color: #fff;
    }
  }
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  label {
    font-size: 0.85rem;
    font-weight: 600;
    color: #cbd5e1;
  }

  input {
    background: rgba(30, 41, 59, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #f8fafc;
    padding: 0.75rem 1rem;
    border-radius: 0.65rem;
    font-size: 0.9rem;

    &:focus {
      outline: none;
      border-color: #10b981;
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
    }
  }
`;

const CodeBox = styled.div`
  background: #020617;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.75rem;
  padding: 1rem;
  position: relative;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
  color: #34d399;
  word-break: break-all;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
`;

const CopyButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #f8fafc;
  padding: 0.5rem 0.85rem;
  border-radius: 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  font-weight: 600;
  flex-shrink: 0;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

export const AiAgentsSettings: React.FC = () => {
  const [keys, setKeys] = useState<TrazAppApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isKeyResultModalOpen, setIsKeyResultModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchKeys = async () => {
    setLoading(true);
    const data = await apiKeyService.getApiKeys();
    setKeys(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    setCreating(true);
    const res = await apiKeyService.createApiKey(newKeyName.trim());
    setCreating(false);

    if (res.success && res.key) {
      setGeneratedKey(res.key);
      setIsCreateModalOpen(false);
      setIsKeyResultModalOpen(true);
      setNewKeyName('');
      fetchKeys();
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error al generar API Key',
        text: res.error || 'No se pudo crear la clave',
        background: '#0f172a',
        color: '#fff',
      });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: `¿Eliminar clave "${name}"?`,
      text: 'Los agentes que usen esta clave perderán acceso de inmediato al club.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#334155',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: '#0f172a',
      color: '#fff',
    });

    if (result.isConfirmed) {
      const ok = await apiKeyService.deleteApiKey(id);
      if (ok) {
        setKeys((prev) => prev.filter((k) => k.id !== id));
        Swal.fire({
          icon: 'success',
          title: 'Clave eliminada',
          timer: 1500,
          showConfirmButton: false,
          background: '#0f172a',
          color: '#fff',
        });
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Container>
      <HeaderRow>
        <TitleGroup>
          <h3>
            <FaRobot style={{ color: '#10b981' }} /> Agentes de Inteligencia Artificial (MCP)
          </h3>
          <p>
            Genera claves de acceso seguro para vincular agentes autónomos (Claude Code, Antigravity, Cursor) al club.
          </p>
        </TitleGroup>
        <PrimaryButton onClick={() => setIsCreateModalOpen(true)}>
          <FaPlus /> Generar API Key
        </PrimaryButton>
      </HeaderRow>

      <Banner>
        <FaShieldAlt className="icon" />
        <div className="text">
          <strong>Aislamiento Multi-Tenant Garantizado</strong>
          <span>
            Cada API Key está vinculada estrictamente al ID de tu club. Los agentes que conectes con tu clave solo podrán consultar y registrar datos de tus salas, lotes y pacientes, sin acceso a otras organizaciones.
          </span>
        </div>
      </Banner>

      {loading ? (
        <LoadingSpinner />
      ) : keys.length === 0 ? (
        <KeysTable>
          <EmptyState>
            <FaKey className="icon" />
            <strong>No hay API Keys generadas para este club</strong>
            <span>Crea una clave para conectar a tu agente agrónomo de IA en Claude Code o Antigravity.</span>
          </EmptyState>
        </KeysTable>
      ) : (
        <KeysTable>
          <TableHeader>
            <div>Nombre / Agente</div>
            <div>Clave (Prefijo)</div>
            <div>Fecha Creación</div>
            <div>Estado</div>
            <div>Acciones</div>
          </TableHeader>
          {keys.map((k) => (
            <TableRow key={k.id}>
              <div>
                <strong style={{ color: '#f8fafc' }}>{k.name}</strong>
              </div>
              <div>
                <KeyBadge>{k.key_prefix}</KeyBadge>
              </div>
              <div style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
                {new Date(k.created_at).toLocaleDateString()}
              </div>
              <div>
                <StatusPill $active={k.is_active}>
                  {k.is_active ? 'Activa' : 'Inactiva'}
                </StatusPill>
              </div>
              <div>
                <ActionButton onClick={() => handleDelete(k.id, k.name)}>
                  <FaTrash /> Eliminar
                </ActionButton>
              </div>
            </TableRow>
          ))}
        </KeysTable>
      )}

      {/* Modal: Crear Clave */}
      {isCreateModalOpen && (
        <ModalOverlay onClick={() => setIsCreateModalOpen(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h3>
                <FaKey style={{ color: '#10b981' }} /> Nueva Clave de Agente IA
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)}>
                <FaTimes />
              </button>
            </ModalHeader>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <InputGroup>
                <label>Nombre identificatorio del Agente</label>
                <input
                  type="text"
                  placeholder="ej. Claude Cultivo Floración, Antigravity CLI"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  autoFocus
                  required
                />
              </InputGroup>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#cbd5e1',
                    padding: '0.75rem 1.25rem',
                    borderRadius: '0.65rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <PrimaryButton type="submit" disabled={creating}>
                  {creating ? 'Generando...' : 'Generar Clave'}
                </PrimaryButton>
              </div>
            </form>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Modal: Clave Generada con Éxito */}
      {isKeyResultModalOpen && generatedKey && (
        <ModalOverlay onClick={() => setIsKeyResultModalOpen(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h3>
                <FaCheck style={{ color: '#10b981' }} /> ¡API Key Generada con Éxito!
              </h3>
              <button onClick={() => setIsKeyResultModalOpen(false)}>
                <FaTimes />
              </button>
            </ModalHeader>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: '1.45' }}>
                ¡Excelente! Tu agente ya tiene credenciales para operar exclusivamente en tu club.
              </div>

              {/* Bloque Didáctico Principal: Copiar Prompt */}
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.06)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: '0.85rem',
                  padding: '1.15rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399', fontWeight: 600, fontSize: '0.88rem' }}>
                  <FaRobot /> Copia este mensaje y pégalo directamente en tu agente:
                </div>

                <div
                  style={{
                    background: '#020617',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '0.65rem',
                    padding: '0.85rem 1rem',
                    color: '#e2e8f0',
                    fontSize: '0.84rem',
                    lineHeight: '1.5',
                    fontFamily: 'Inter, system-ui, sans-serif',
                  }}
                >
                  {`Hola! Conéctate a TrazAPP usando mi clave: ${generatedKey}\nPor favor hazme un resumen del balance de nuestro club, salas activas y tareas pendientes.`}
                </div>

                <PrimaryButton
                  type="button"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() =>
                    copyToClipboard(
                      `Hola! Conéctate a TrazAPP usando mi clave: ${generatedKey}\nPor favor hazme un resumen del balance de nuestro club, salas activas y tareas pendientes.`
                    )
                  }
                >
                  {copied ? <FaCheck /> : <FaCopy />} {copied ? '¡Prompt Copiado!' : 'Copiar Prompt para el Agente'}
                </PrimaryButton>
              </div>

              {/* Clave individual en caso de requerirse */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>Tu Clave Privada (API Key):</span>
                <CodeBox style={{ padding: '0.65rem 0.85rem' }}>
                  <span style={{ fontSize: '0.8rem' }}>{generatedKey}</span>
                  <CopyButton
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                    onClick={() => copyToClipboard(generatedKey)}
                  >
                    {copied ? <FaCheck /> : <FaCopy />} Copiar
                  </CopyButton>
                </CodeBox>
              </div>

              <PrimaryButton
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  marginTop: '0.5rem',
                  background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
                }}
                onClick={() => setIsKeyResultModalOpen(false)}
              >
                Listo, ya guardé mi clave
              </PrimaryButton>
            </div>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
};
