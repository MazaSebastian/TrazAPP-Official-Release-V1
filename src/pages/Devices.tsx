import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { FaMicrochip, FaPlus, FaTimes, FaWifi, FaTimesCircle, FaThermometerHalf, FaTint, FaLeaf, FaEdit, FaTrash, FaInfoCircle, FaSync } from 'react-icons/fa';
import { deviceService, TrazAppDevice, LinkDevicePayload } from '../services/deviceService';
import { supabase, getSelectedOrgId } from '../services/supabaseClient';
import { TrazAppDeviceDetailModal } from '../components/TrazAppDeviceDetailModal';

// ─── Animations ──────────────────────────────────────────────────────────────
const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

// ─── Styled Components ───────────────────────────────────────────────────────
const Container = styled.div`
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  @media (max-width: 768px) { padding: 1rem; }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;

  h1 {
    font-size: 1.8rem;
    font-weight: 800;
    color: #f8fafc;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    svg { color: #10b981; }
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
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
  }
  &:active { transform: translateY(0); }
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const RefreshButton = styled.button<{ $spinning: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #94a3b8;
  padding: 0.75rem;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  height: 42px;
  width: 42px;

  svg {
    font-size: 0.95rem;
    animation: ${p => p.$spinning ? spin : 'none'} 1s linear infinite;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #10b981;
    border-color: rgba(16, 185, 129, 0.3);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1);
  }
  &:active { transform: translateY(0); }
  &:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
`;

const DeviceCard = styled.div<{ $online: boolean }>`
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(12px);
  border: 1px solid ${p => p.$online ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.06)'};
  border-radius: 1.25rem;
  padding: 1.5rem;
  animation: ${slideUp} 0.4s ease;
  transition: border-color 0.3s, box-shadow 0.3s, transform 0.2s;
  box-shadow: ${p => p.$online ? '0 0 0 1px rgba(16,185,129,0.1), 0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(0,0,0,0.3)'};
  cursor: pointer;

  &:hover {
    border-color: ${p => p.$online ? 'rgba(16, 185, 129, 0.5)' : 'rgba(255,255,255,0.12)'};
    transform: translateY(-2px);
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.25rem;
`;

const DeviceTitle = styled.div`
  h3 {
    margin: 0 0 0.2rem;
    font-size: 1.05rem;
    font-weight: 700;
    color: #f1f5f9;
  }
  span {
    font-size: 0.78rem;
    color: #64748b;
    font-family: monospace;
    letter-spacing: 0.05em;
  }
`;

const StatusBadge = styled.div<{ $online: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  background: ${p => p.$online ? 'rgba(16,185,129,0.15)' : 'rgba(100,116,139,0.15)'};
  color: ${p => p.$online ? '#10b981' : '#64748b'};
  border: 1px solid ${p => p.$online ? 'rgba(16,185,129,0.3)' : 'rgba(100,116,139,0.2)'};

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
    animation: ${p => p.$online ? pulse : 'none'} 2s infinite;
  }
`;

const MetricsGrid = styled.div<{ $cols?: number }>`
  display: grid;
  grid-template-columns: repeat(${p => p.$cols || 2}, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const MetricCard = styled.div<{ $color: string }>`
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 0.875rem;
  padding: 0.875rem;
  text-align: center;

  .icon {
    font-size: 1rem;
    color: ${p => p.$color};
    margin-bottom: 0.3rem;
  }

  .value {
    font-size: 1.6rem;
    font-weight: 800;
    color: ${p => p.$color};
    line-height: 1;
    margin-bottom: 0.2rem;
  }

  .label {
    font-size: 0.7rem;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
`;

const VpdBadge = styled.div<{ $color: string }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255,255,255,0.04);
  border: 1px solid ${p => p.$color}33;
  border-radius: 0.875rem;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;

  .left {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    .label { font-size: 0.7rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; }
    .value { font-size: 1.1rem; font-weight: 800; color: ${p => p.$color}; }
  }

  .right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.15rem;
    .stage { font-size: 0.85rem; font-weight: 700; color: #94a3b8; }
    .status {
      font-size: 0.72rem;
      font-weight: 700;
      color: ${p => p.$color};
      background: ${p => p.$color}1a;
      padding: 0.2rem 0.5rem;
      border-radius: 20px;
    }
  }
`;

const CardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.875rem;
  border-top: 1px solid rgba(255,255,255,0.06);

  .last-seen {
    font-size: 0.73rem;
    color: #475569;
  }

  .actions {
    display: flex;
    gap: 0.4rem;
  }
`;

const IconBtn = styled.button<{ $danger?: boolean }>`
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  color: ${p => p.$danger ? '#ef4444' : '#94a3b8'};
  padding: 0.4rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  font-size: 0.8rem;

  &:hover {
    background: ${p => p.$danger ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.1)'};
    color: ${p => p.$danger ? '#ef4444' : '#f1f5f9'};
    border-color: ${p => p.$danger ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.15)'};
  }
`;

const EmptyState = styled.div`
  grid-column: 1 / -1;
  text-align: center;
  padding: 4rem 2rem;
  background: rgba(15,23,42,0.6);
  border: 2px dashed rgba(255,255,255,0.08);
  border-radius: 1.25rem;

  .icon { font-size: 3rem; color: #334155; margin-bottom: 1rem; }
  h3 { color: #94a3b8; margin: 0 0 0.5rem; font-size: 1.1rem; }
  p { color: #475569; font-size: 0.9rem; margin: 0; }
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
  max-width: 440px;
  box-shadow: 0 25px 50px rgba(0,0,0,0.5);
  animation: ${slideUp} 0.3s ease;

  h2 {
    margin: 0 0 0.5rem;
    color: #f1f5f9;
    font-size: 1.3rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    svg { color: #10b981; }
  }

  .subtitle {
    color: #64748b;
    font-size: 0.875rem;
    margin: 0 0 1.75rem;
    line-height: 1.5;
  }
`;

const HintBox = styled.div`
  background: rgba(16,185,129,0.08);
  border: 1px solid rgba(16,185,129,0.2);
  border-radius: 0.75rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;

  svg { color: #10b981; font-size: 1rem; flex-shrink: 0; margin-top: 0.15rem; }

  .text {
    font-size: 0.82rem;
    color: #94a3b8;
    line-height: 1.5;

    strong { color: #10b981; display: block; margin-bottom: 0.25rem; }
    code {
      background: rgba(0,0,0,0.3);
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
      font-family: monospace;
      color: #f1f5f9;
      font-size: 0.95em;
    }
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.25rem;

  label {
    display: block;
    font-size: 0.8rem;
    font-weight: 600;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 0.5rem;
  }

  input {
    width: 100%;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    padding: 0.75rem 1rem;
    color: #f1f5f9;
    font-size: 1rem;
    font-family: monospace;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.2s;

    &::placeholder { color: #475569; }
    &:focus { border-color: #10b981; }
  }
`;

const ModalActions = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;

  button {
    flex: 1;
    padding: 0.875rem;
    border-radius: 10px;
    font-weight: 700;
    font-size: 0.95rem;
    cursor: pointer;
    border: none;
    transition: all 0.2s;

    &.primary {
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      box-shadow: 0 4px 15px rgba(16,185,129,0.3);
      &:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(16,185,129,0.4); }
      &:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    }

    &.secondary {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      color: #94a3b8;
      &:hover { background: rgba(255,255,255,0.1); color: #f1f5f9; }
    }
  }
`;

const ErrorMsg = styled.div`
  background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.3);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  color: #fca5a5;
  font-size: 0.875rem;
  margin-top: 0.75rem;
`;

const Spinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
  display: inline-block;
  margin-right: 0.5rem;
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatLastSeen(dateStr: string | null): string {
  if (!dateStr) return 'Nunca conectado';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `hace ${diff}s`;
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
  return `hace ${Math.floor(diff / 86400)}d`;
}

function MetricValue({ value, unit, label, icon, color }: { value: number | null | undefined; unit: string; label: string; icon: React.ReactNode; color: string }) {
  return (
    <MetricCard $color={color}>
      <div className="icon">{icon}</div>
      <div className="value">{value !== null && value !== undefined ? value.toFixed(1) : '—'}<span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{unit}</span></div>
      <div className="label">{label}</div>
    </MetricCard>
  );
}

const CountdownText = styled.span`
  margin-left: 6px;
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  
  strong {
    color: #10b981;
    font-variant-numeric: tabular-nums;
  }
`;

interface DeviceCountdownProps {
  lastSeenAt: string | null;
  online: boolean;
}

const DeviceCountdown: React.FC<DeviceCountdownProps> = ({ lastSeenAt, online }) => {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!online || !lastSeenAt) {
      setSecondsLeft(null);
      return;
    }

    const intervalVal = 10; // Telemetry reports every 10 seconds

    const updateCountdown = () => {
      const lastSeen = new Date(lastSeenAt).getTime();
      const now = Date.now();
      const elapsedMs = now - lastSeen;
      const elapsedS = Math.floor(elapsedMs / 1000);
      
      const remaining = intervalVal - (elapsedS % intervalVal);
      setSecondsLeft(remaining > 0 ? remaining : 10);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [lastSeenAt, online]);

  if (!online || secondsLeft === null) return null;

  return (
    <CountdownText>
      • Próx. lectura en: <strong>{secondsLeft}s</strong>
    </CountdownText>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const Devices: React.FC = () => {
  const [devices, setDevices] = useState<TrazAppDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<TrazAppDevice | null>(null);
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [form, setForm] = useState<LinkDevicePayload>({ device_id: '', pin: '', alias: '' });

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    const data = await deviceService.getMyDevices();
    setDevices(data);
    setLoading(false);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    const data = await deviceService.getMyDevices();
    setDevices(data);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  // Supabase Realtime — live updates when ESP32 posts telemetry
  useEffect(() => {
    const orgId = getSelectedOrgId();
    if (!orgId || !supabase) return;

    const channel = supabase
      .channel('trazapp-devices-live')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'trazapp_devices',
        filter: `organization_id=eq.${orgId}`,
      }, (payload) => {
        setDevices(prev =>
          prev.map(d => d.device_id === (payload.new as TrazAppDevice).device_id
            ? { ...d, ...payload.new as TrazAppDevice }
            : d
          )
        );
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleLink = async () => {
    if (!form.device_id || !form.pin) return;
    setLinking(true);
    setLinkError(null);

    const result = await deviceService.linkDevice(form);

    if (result.success) {
      setShowModal(false);
      setForm({ device_id: '', pin: '', alias: '' });
      await fetchDevices();
    } else {
      setLinkError(result.error || 'Error desconocido.');
    }
    setLinking(false);
  };

  const handleUnlink = async (deviceId: string) => {
    if (!window.confirm('¿Desvincular este dispositivo de tu organización?')) return;
    await deviceService.unlinkDevice(deviceId);
    setDevices(prev => prev.filter(d => d.device_id !== deviceId));
  };

  return (
    <Container>
      <Header>
        <h1><FaMicrochip /> Dispositivos TrazAPP</h1>
        <HeaderActions>
          <RefreshButton 
            onClick={handleRefresh} 
            $spinning={refreshing} 
            title="Actualizar lecturas"
            disabled={refreshing || loading}
          >
            <FaSync />
          </RefreshButton>
          <AddButton onClick={() => setShowModal(true)}>
            <FaPlus /> Vincular Dispositivo
          </AddButton>
        </HeaderActions>
      </Header>

      <Grid>
        {loading ? (
          <EmptyState>
            <div className="icon"><FaMicrochip /></div>
            <h3>Cargando dispositivos...</h3>
          </EmptyState>
        ) : devices.length === 0 ? (
          <EmptyState>
            <div className="icon"><FaMicrochip /></div>
            <h3>Sin dispositivos vinculados</h3>
            <p>Presioná "Vincular Dispositivo" e ingresá el ID y PIN que aparecen en la pantalla del equipo.</p>
          </EmptyState>
        ) : devices.map(device => {
          const online = deviceService.isOnline(device);
          const s = device.last_reading?.sensors;
          const v = device.last_reading?.vpd;
          const vpdColor = deviceService.getVpdColor(v?.in_range, s?.vpd_kpa);
          const tempColor = deviceService.getTempColor(s?.temp_c);

          return (
            <DeviceCard key={device.device_id} $online={online} onClick={() => setSelectedDevice(device)}>
              <CardHeader>
                <DeviceTitle>
                  <h3>{device.alias || device.device_id}</h3>
                  <span>{device.device_id}</span>
                </DeviceTitle>
                <StatusBadge $online={online}>
                  <div className="dot" />
                  {online ? 'En línea' : 'Sin señal'}
                </StatusBadge>
              </CardHeader>

              <MetricsGrid $cols={s?.soil_pct !== undefined && s?.soil_pct !== null ? 3 : 2}>
                <MetricValue value={s?.temp_c} unit="°C" label="Temperatura" icon={<FaThermometerHalf />} color={tempColor} />
                <MetricValue value={s?.hum_pct} unit="%" label="Ambiente" icon={<FaTint />} color="#3b82f6" />
                {s?.soil_pct !== undefined && s?.soil_pct !== null && (
                  <MetricValue value={s?.soil_pct} unit="%" label="Suelo" icon={<FaLeaf />} color="#14b8a6" />
                )}
              </MetricsGrid>

              <VpdBadge $color={vpdColor}>
                <div className="left">
                  <span className="label">VPD</span>
                  <span className="value">{s?.vpd_kpa !== undefined ? `${s.vpd_kpa.toFixed(3)} kPa` : '—'}</span>
                </div>
                <div className="right">
                  <span className="stage">{v?.stage_name || '—'}</span>
                  <span className="status">{v?.in_range ? '✓ En rango' : v?.vpd_low ? '↓ Bajo' : '↑ Alto'}</span>
                </div>
              </VpdBadge>

              <CardFooter>
                <span className="last-seen">
                  {online ? (
                    <>
                      <FaWifi style={{ color: '#10b981', marginRight: 4 }} />
                      Activo
                      <DeviceCountdown lastSeenAt={device.last_seen_at} online={online} />
                    </>
                  ) : (
                    <>
                      <FaTimesCircle style={{ marginRight: 4 }} />
                      {formatLastSeen(device.last_seen_at)}
                    </>
                  )}
                  {device.firmware && <span style={{ marginLeft: 8, color: '#334155' }}>{device.firmware}</span>}
                </span>
                <div className="actions">
                  <IconBtn title="Desvincular" $danger onClick={(e) => { e.stopPropagation(); handleUnlink(device.device_id); }}>
                    <FaTrash />
                  </IconBtn>
                </div>
              </CardFooter>
            </DeviceCard>
          );
        })}
      </Grid>

      {showModal && (
        <Overlay onClick={() => setShowModal(false)}>
          <Modal onClick={e => e.stopPropagation()}>
            <h2><FaMicrochip /> Vincular Dispositivo</h2>
            <p className="subtitle">Ingresá los datos que aparecen en la pantalla del equipo físico.</p>

            <HintBox>
              <FaInfoCircle />
              <div className="text">
                <strong>¿Dónde encuentro estos datos?</strong>
                En la pantalla del equipo, accedé a <strong>Configuración</strong>. Vas a ver:<br />
                • <strong>ID de Red:</strong> <code>TrazApp_XXXX</code><br />
                • <strong>PIN:</strong> número de 6 dígitos
              </div>
            </HintBox>

            <FormGroup>
              <label>Device ID</label>
              <input
                placeholder="Ej: TrazApp_A5F4"
                value={form.device_id}
                onChange={e => setForm(p => ({ ...p, device_id: e.target.value }))}
              />
            </FormGroup>
            <FormGroup>
              <label>PIN de Emparejamiento</label>
              <input
                placeholder="Ej: 123456"
                value={form.pin}
                maxLength={6}
                onChange={e => setForm(p => ({ ...p, pin: e.target.value.replace(/\D/g, '') }))}
              />
            </FormGroup>
            <FormGroup>
              <label>Nombre del Dispositivo (opcional)</label>
              <input
                placeholder="Ej: Sensor Sala Flor 1"
                style={{ fontFamily: 'inherit' }}
                value={form.alias}
                onChange={e => setForm(p => ({ ...p, alias: e.target.value }))}
              />
            </FormGroup>

            {linkError && <ErrorMsg>{linkError}</ErrorMsg>}

            <ModalActions>
              <button className="secondary" onClick={() => { setShowModal(false); setLinkError(null); }}>
                <FaTimes style={{ marginRight: 6 }} /> Cancelar
              </button>
              <button
                className="primary"
                onClick={handleLink}
                disabled={linking || !form.device_id || !form.pin}
              >
                {linking ? <><Spinner />Vinculando...</> : 'Vincular'}
              </button>
            </ModalActions>
          </Modal>
        </Overlay>
      )}

      {selectedDevice && (
        <TrazAppDeviceDetailModal
          device={selectedDevice}
          onClose={() => setSelectedDevice(null)}
          onUpdate={fetchDevices}
        />
      )}
    </Container>
  );
};

export default Devices;
