import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import {
  FaMicrochip, FaPlus, FaTimes, FaEdit, FaToggleOn, FaToggleOff,
  FaSearch, FaCheckCircle, FaTimesCircle, FaWifi,
  FaSave, FaExclamationTriangle, FaInfoCircle
} from 'react-icons/fa';
import { supabase } from '../../services/supabaseClient';

// ─── Types ───────────────────────────────────────────────────────────────────
interface AdminDevice {
  id: string;
  device_id: string;
  device_token: string;
  pin: string;
  alias: string | null;
  firmware: string | null;
  organization_id: string | null;
  user_id: string | null;
  room_id: string | null;
  last_seen_at: string | null;
  is_active: boolean;
  is_provisioned: boolean;
  notes: string | null;
  created_at: string;
  // joined
  organizations?: { name: string } | null;
}

interface DeviceFormData {
  device_id: string;
  device_token: string;
  pin: string;
  alias: string;
  notes: string;
  organization_id: string;
  device_type: string;
}

const EMPTY_FORM: DeviceFormData = {
  device_id: '', device_token: '', pin: '', alias: '', notes: '', organization_id: '', device_type: 'sensor',
};

// ─── Animations ──────────────────────────────────────────────────────────────
const slideUp = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
`;
const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

// ─── Styled Components ───────────────────────────────────────────────────────
const Page = styled.div`
  padding: 2rem;
  max-width: 1300px;
  margin: 0 auto;
  @media (max-width: 768px) { padding: 1rem; }
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;

  h1 {
    font-size: 1.7rem;
    font-weight: 800;
    color: #f8fafc;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    svg { color: #10b981; }
  }

  .subtitle {
    color: #64748b;
    font-size: 0.85rem;
    margin: 0.25rem 0 0;
  }
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 15px rgba(16,185,129,0.3);
  white-space: nowrap;

  &:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(16,185,129,0.4); }
`;

const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const StatCard = styled.div<{ $color?: string }>`
  background: rgba(15,23,42,0.8);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 1rem;
  padding: 1.25rem;
  text-align: center;

  .value { font-size: 2rem; font-weight: 800; color: ${p => p.$color || '#f1f5f9'}; }
  .label { font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 0.2rem; }
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: rgba(15,23,42,0.8);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  padding: 0.65rem 1rem;
  margin-bottom: 1.25rem;

  svg { color: #475569; flex-shrink: 0; }

  input {
    background: none;
    border: none;
    outline: none;
    color: #f1f5f9;
    font-size: 0.9rem;
    width: 100%;
    &::placeholder { color: #475569; }
  }
`;

const Table = styled.div`
  background: rgba(15,23,42,0.8);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 1rem;
  overflow: hidden;
`;

const TableHead = styled.div`
  display: grid;
  grid-template-columns: 160px 120px 130px 1fr 120px 90px 80px;
  background: rgba(255,255,255,0.04);
  border-bottom: 1px solid rgba(255,255,255,0.06);
  padding: 0.75rem 1rem;

  span {
    font-size: 0.72rem;
    font-weight: 700;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  @media (max-width: 1024px) { display: none; }
`;

const TableRow = styled.div<{ $even: boolean }>`
  display: grid;
  grid-template-columns: 160px 120px 130px 1fr 120px 90px 80px;
  padding: 0.875rem 1rem;
  background: ${p => p.$even ? 'rgba(255,255,255,0.01)' : 'transparent'};
  border-bottom: 1px solid rgba(255,255,255,0.04);
  align-items: center;
  animation: ${slideUp} 0.3s ease;
  transition: background 0.15s;

  &:hover { background: rgba(255,255,255,0.04); }
  &:last-child { border-bottom: none; }

  @media (max-width: 1024px) {
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }
`;

const DeviceIdCell = styled.div`
  font-family: monospace;
  font-size: 0.85rem;
  font-weight: 700;
  color: #10b981;
  letter-spacing: 0.03em;
`;

const PinCell = styled.div`
  font-family: monospace;
  font-size: 0.9rem;
  color: #f59e0b;
  font-weight: 700;
`;

const TokenCell = styled.div`
  font-family: monospace;
  font-size: 0.72rem;
  color: #475569;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StatusPill = styled.span<{ $color: string }>`
  background: ${p => p.$color}1a;
  color: ${p => p.$color};
  border: 1px solid ${p => p.$color}33;
  border-radius: 20px;
  padding: 0.2rem 0.65rem;
  font-size: 0.72rem;
  font-weight: 700;
  white-space: nowrap;
`;

const Actions = styled.div`
  display: flex;
  gap: 0.4rem;
  justify-content: flex-end;
`;

const ActionBtn = styled.button<{ $color?: string; $danger?: boolean }>`
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  color: ${p => p.$danger ? '#ef4444' : p.$color || '#94a3b8'};
  padding: 0.35rem 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  font-size: 0.8rem;

  &:hover {
    background: ${p => p.$danger ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.1)'};
    border-color: ${p => p.$danger ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.15)'};
  }
`;

// ─── Modal ───────────────────────────────────────────────────────────────────
const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(8px);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
`;

const Modal = styled.div`
  background: rgba(15,23,42,0.97);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 1.25rem;
  padding: 2rem;
  width: 100%;
  max-width: 520px;
  box-shadow: 0 25px 50px rgba(0,0,0,0.5);
  animation: ${slideUp} 0.3s ease;

  h2 {
    margin: 0 0 1.5rem;
    color: #f1f5f9;
    font-size: 1.2rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    svg { color: #10b981; }
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  @media (max-width: 480px) { grid-template-columns: 1fr; }
`;

const FormGroup = styled.div<{ $full?: boolean }>`
  grid-column: ${p => p.$full ? '1 / -1' : 'auto'};

  label {
    display: block;
    font-size: 0.75rem;
    font-weight: 700;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 0.4rem;
  }

  input, textarea {
    width: 100%;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    padding: 0.7rem 0.875rem;
    color: #f1f5f9;
    font-size: 0.9rem;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.2s;
    font-family: inherit;

    &::placeholder { color: #475569; }
    &:focus { border-color: #10b981; }
  }

  textarea { resize: vertical; min-height: 70px; }

  .hint { font-size: 0.72rem; color: #475569; margin-top: 0.3rem; }
`;

const WarnBox = styled.div`
  background: rgba(245,158,11,0.08);
  border: 1px solid rgba(245,158,11,0.2);
  border-radius: 0.75rem;
  padding: 0.875rem;
  margin-top: 1rem;
  display: flex;
  gap: 0.6rem;
  align-items: flex-start;
  font-size: 0.8rem;
  color: #fbbf24;
  line-height: 1.4;
  svg { flex-shrink: 0; margin-top: 0.1rem; }
`;

const ModalActions = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;

  button {
    flex: 1;
    padding: 0.8rem;
    border-radius: 10px;
    font-weight: 700;
    font-size: 0.9rem;
    cursor: pointer;
    border: none;
    transition: all 0.2s;

    &.primary {
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      &:hover:not(:disabled) { transform: translateY(-1px); }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }
    &.secondary {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      color: #94a3b8;
      &:hover { background: rgba(255,255,255,0.1); }
    }
  }
`;

const ErrorMsg = styled.div`
  background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.3);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  color: #fca5a5;
  font-size: 0.85rem;
  margin-top: 0.75rem;
`;

const SuccessMsg = styled.div`
  background: rgba(16,185,129,0.1);
  border: 1px solid rgba(16,185,129,0.3);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  color: #6ee7b7;
  font-size: 0.85rem;
  margin-top: 0.75rem;
`;

const Spinner = styled.div`
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
  display: inline-block;
  margin-right: 0.5rem;
`;

const EmptyState = styled.div`
  padding: 3rem;
  text-align: center;
  color: #475569;
  h3 { color: #64748b; margin: 0.5rem 0 0.25rem; }
  p { margin: 0; font-size: 0.875rem; }
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function isOnline(lastSeen: string | null): boolean {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < 3 * 60 * 1000;
}

// ─── Main Component ───────────────────────────────────────────────────────────
const DeviceInventory: React.FC = () => {
  const [devices, setDevices] = useState<AdminDevice[]>([]);
  const [organizationsList, setOrganizationsList] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editDevice, setEditDevice] = useState<AdminDevice | null>(null);
  const [form, setForm] = useState<DeviceFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchDevices = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('trazapp_devices')
      .select(`
        *,
        organizations:organizations!organization_id(name)
      `)
      .order('created_at', { ascending: false });

    if (!error) setDevices(data || []);

    const { data: orgsData } = await supabase
      .from('organizations')
      .select('id, name')
      .order('name');
    if (orgsData) setOrganizationsList(orgsData);

    setLoading(false);
  }, []);

  useEffect(() => { fetchDevices(); }, [fetchDevices]);

  const openCreate = () => {
    setEditDevice(null);
    setForm(EMPTY_FORM);
    setError(null);
    setSuccess(null);
    setShowModal(true);
  };

  const openEdit = (device: AdminDevice) => {
    setEditDevice(device);
    setForm({
      device_id:       device.device_id,
      device_token:    device.device_token,
      pin:             device.pin,
      alias:           device.alias || '',
      notes:           device.notes || '',
      organization_id: device.organization_id || '',
      device_type:     (device as any).device_type || 'sensor',
    });
    setError(null);
    setSuccess(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!supabase) return;
    if (!form.device_id || !form.device_token || !form.pin) {
      setError('Device ID, Token y PIN son obligatorios.');
      return;
    }
    if (form.pin.length !== 6 || !/^\d+$/.test(form.pin)) {
      setError('El PIN debe ser exactamente 6 dígitos numéricos.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    const targetOrgId = form.organization_id ? form.organization_id : null;
    const isProv = !!targetOrgId;

    if (editDevice) {
      // Update
      const { error: updError } = await supabase
        .from('trazapp_devices')
        .update({
          device_token:    form.device_token,
          pin:             form.pin,
          alias:           form.alias || null,
          notes:           form.notes || null,
          organization_id: targetOrgId,
          is_provisioned:  isProv,
        })
        .eq('id', editDevice.id);

      if (updError) {
        setError(updError.message);
      } else {
        setSuccess('Dispositivo actualizado correctamente.');
        await fetchDevices();
      }
    } else {
      // Insert
      const { error: insError } = await supabase
        .from('trazapp_devices')
        .insert({
          device_id:       form.device_id.trim(),
          device_token:    form.device_token.trim(),
          pin:             form.pin.trim(),
          alias:           form.alias || null,
          notes:           form.notes || null,
          organization_id: targetOrgId,
          is_active:       true,
          is_provisioned:  isProv,
        });

      if (insError) {
        setError(insError.code === '23505'
          ? `Ya existe un dispositivo con el ID "${form.device_id}".`
          : insError.message);
      } else {
        setSuccess('Dispositivo registrado correctamente.');
        setTimeout(() => { setShowModal(false); fetchDevices(); }, 1200);
      }
    }
    setSaving(false);
  };

  const toggleActive = async (device: AdminDevice) => {
    if (!supabase) return;
    await supabase
      .from('trazapp_devices')
      .update({ is_active: !device.is_active })
      .eq('id', device.id);
    setDevices(prev => prev.map(d => d.id === device.id ? { ...d, is_active: !d.is_active } : d));
  };

  const filtered = devices.filter(d =>
    d.device_id.toLowerCase().includes(search.toLowerCase()) ||
    (d.alias || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.notes || '').toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: devices.length,
    active: devices.filter(d => d.is_active).length,
    provisioned: devices.filter(d => d.is_provisioned).length,
    online: devices.filter(d => isOnline(d.last_seen_at)).length,
  };

  return (
    <Page>
      <PageHeader>
        <div>
          <h1><FaMicrochip /> Inventario de Dispositivos</h1>
          <p className="subtitle">Panel interno — Registro de hardware TrazAPP antes de entrega al cliente</p>
        </div>
        <AddButton onClick={openCreate}>
          <FaPlus /> Registrar Dispositivo
        </AddButton>
      </PageHeader>

      <StatsRow>
        <StatCard><div className="value">{stats.total}</div><div className="label">Total</div></StatCard>
        <StatCard $color="#10b981"><div className="value">{stats.active}</div><div className="label">Activos</div></StatCard>
        <StatCard $color="#3b82f6"><div className="value">{stats.provisioned}</div><div className="label">Vinculados</div></StatCard>
        <StatCard $color="#f59e0b"><div className="value">{stats.online}</div><div className="label">En línea ahora</div></StatCard>
      </StatsRow>

      <SearchBar>
        <FaSearch />
        <input
          placeholder="Buscar por Device ID, alias o notas..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <ActionBtn onClick={() => setSearch('')} style={{ padding: '0.25rem' }}>
            <FaTimes />
          </ActionBtn>
        )}
      </SearchBar>

      <Table>
        <TableHead>
          <span>Device ID</span>
          <span>PIN</span>
          <span>Token</span>
          <span>Org Asignada / Alias</span>
          <span>Último Contacto</span>
          <span>Estado</span>
          <span style={{ textAlign: 'right' }}>Acciones</span>
        </TableHead>

        {loading ? (
          <EmptyState><FaMicrochip style={{ fontSize: '2rem', color: '#334155' }} /><h3>Cargando...</h3></EmptyState>
        ) : filtered.length === 0 ? (
          <EmptyState>
            <FaMicrochip style={{ fontSize: '2rem', color: '#334155' }} />
            <h3>Sin resultados</h3>
            <p>{search ? 'Ningún dispositivo coincide con la búsqueda.' : 'Registrá el primer dispositivo con el botón de arriba.'}</p>
          </EmptyState>
        ) : filtered.map((device, i) => {
          const online = isOnline(device.last_seen_at);
          const orgName = (device.organizations as any)?.name;

          return (
            <TableRow key={device.id} $even={i % 2 === 0}>
              <DeviceIdCell>{device.device_id}</DeviceIdCell>
              <PinCell>{device.pin}</PinCell>
              <TokenCell title={device.device_token}>{device.device_token.substring(0, 14)}…</TokenCell>
              <div>
                <div style={{ color: '#f1f5f9', fontSize: '0.85rem', fontWeight: 600 }}>
                  {orgName || <span style={{ color: '#475569' }}>Sin vincular</span>}
                </div>
                {device.alias && <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{device.alias}</div>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {online
                  ? <FaWifi style={{ color: '#10b981', fontSize: '0.75rem' }} />
                  : <FaTimesCircle style={{ color: '#475569', fontSize: '0.75rem' }} />}
                <span style={{ color: online ? '#10b981' : '#475569', fontSize: '0.78rem' }}>
                  {online ? 'Online' : (device.last_seen_at ? formatDate(device.last_seen_at) : 'Nunca')}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <StatusPill $color={device.is_active ? '#10b981' : '#ef4444'}>
                  {device.is_active ? 'Activo' : 'Inactivo'}
                </StatusPill>
                {device.is_provisioned && (
                  <StatusPill $color="#3b82f6">Vinculado</StatusPill>
                )}
              </div>
              <Actions>
                <ActionBtn title="Editar" onClick={() => openEdit(device)}>
                  <FaEdit />
                </ActionBtn>
                <ActionBtn
                  title={device.is_active ? 'Desactivar' : 'Activar'}
                  $color={device.is_active ? '#f59e0b' : '#10b981'}
                  onClick={() => toggleActive(device)}
                >
                  {device.is_active ? <FaToggleOn /> : <FaToggleOff />}
                </ActionBtn>
              </Actions>
            </TableRow>
          );
        })}
      </Table>

      {showModal && (
        <Overlay onClick={() => setShowModal(false)}>
          <Modal onClick={e => e.stopPropagation()}>
            <h2>
              <FaMicrochip />
              {editDevice ? `Editar — ${editDevice.device_id}` : 'Registrar Nuevo Dispositivo'}
            </h2>

            <FormGrid>
              <FormGroup>
                <label>Device ID *</label>
                <input
                  placeholder="TrazApp_A5F4"
                  value={form.device_id}
                  disabled={!!editDevice}
                  style={{ fontFamily: 'monospace', opacity: editDevice ? 0.5 : 1 }}
                  onChange={e => setForm(p => ({ ...p, device_id: e.target.value }))}
                />
                <div className="hint">ID único impreso en el dispositivo.</div>
              </FormGroup>

              <FormGroup>
                <label>PIN (6 dígitos) *</label>
                <input
                  placeholder="123456"
                  maxLength={6}
                  value={form.pin}
                  style={{ fontFamily: 'monospace' }}
                  onChange={e => setForm(p => ({ ...p, pin: e.target.value.replace(/\D/g, '') }))}
                />
                <div className="hint">PIN que se muestra en la pantalla del equipo.</div>
              </FormGroup>

              <FormGroup $full>
                <label>Token de Autenticación (device_token) *</label>
                <input
                  placeholder="12af2fe6968294a659134f795f9d3ee8"
                  value={form.device_token}
                  style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}
                  onChange={e => setForm(p => ({ ...p, device_token: e.target.value }))}
                />
                <div className="hint">Hash único generado por el firmware del ESP32 (X-Device-Secret).</div>
              </FormGroup>

              <FormGroup $full>
                <label>Organización / Cliente Asignado (opcional)</label>
                <select
                  value={form.organization_id}
                  onChange={e => setForm(p => ({ ...p, organization_id: e.target.value }))}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                    color: '#f1f5f9',
                    fontSize: '0.95rem'
                  }}
                >
                  <option value="" style={{ background: '#0f172a' }}>-- Libre (Sin asignar a cliente) --</option>
                  {organizationsList.map(org => (
                    <option key={org.id} value={org.id} style={{ background: '#0f172a' }}>
                      🏢 {org.name}
                    </option>
                  ))}
                </select>
                <div className="hint">Asignar directamente a una empresa / cultivo cliente.</div>
              </FormGroup>

              <FormGroup $full>
                <label>Tipo de Dispositivo</label>
                <select
                  value={form.device_type}
                  onChange={e => setForm(p => ({ ...p, device_type: e.target.value }))}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                    color: '#f1f5f9',
                    fontSize: '0.95rem'
                  }}
                >
                  <option value="sense_7in" style={{ background: '#0f172a' }}>🖥️ Monitor TrazApp 7.0" (Lotes, Mesas, Tareas, Incidencias)</option>
                  <option value="sensor" style={{ background: '#0f172a' }}>📟 Sensor TrazApp 3.5" (Sensado Ambiental de Mesa)</option>
                  <option value="camera" style={{ background: '#0f172a' }}>📷 Cámara / Visión por Computadora</option>
                  <option value="actuator" style={{ background: '#0f172a' }}>⚡ Actuador / Rele Control</option>
                </select>
              </FormGroup>

              <FormGroup $full>
                <label>Alias / Nombre (opcional)</label>
                <input
                  placeholder="Ej: Sensor Sala Flor Lote 3"
                  value={form.alias}
                  onChange={e => setForm(p => ({ ...p, alias: e.target.value }))}
                />
              </FormGroup>

              <FormGroup $full>
                <label>Notas internas (opcional)</label>
                <textarea
                  placeholder="Ej: Entregado el 20/05/2026 a cliente X. Firmware v3.34."
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                />
              </FormGroup>
            </FormGrid>

            {!editDevice && (
              <WarnBox>
                <FaExclamationTriangle />
                <span>El dispositivo se registra como <strong>inactivo y sin vincular</strong>. El cliente podrá vincularlo desde su cuenta ingresando el Device ID y el PIN.</span>
              </WarnBox>
            )}

            {error && <ErrorMsg>{error}</ErrorMsg>}
            {success && <SuccessMsg><FaCheckCircle style={{ marginRight: 6 }} />{success}</SuccessMsg>}

            <ModalActions>
              <button className="secondary" onClick={() => setShowModal(false)}>
                <FaTimes style={{ marginRight: 6 }} /> Cancelar
              </button>
              <button
                className="primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? <><Spinner />{editDevice ? 'Guardando...' : 'Registrando...'}</> : <><FaSave style={{ marginRight: 6 }} />{editDevice ? 'Guardar cambios' : 'Registrar'}</>}
              </button>
            </ModalActions>
          </Modal>
        </Overlay>
      )}
    </Page>
  );
};

export default DeviceInventory;
