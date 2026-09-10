import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import {
  FaMicrochip, FaPlus, FaTimes, FaWifi, FaSync, FaExclamationTriangle,
  FaCheckCircle, FaTimesCircle, FaThermometerHalf, FaTint, FaLeaf,
  FaTrash, FaInfoCircle
} from 'react-icons/fa';
import { deviceService, TrazAppDevice, LinkDevicePayload } from '../services/deviceService';
import { TrazAppDeviceDetailModal } from '../components/TrazAppDeviceDetailModal';
import { supabase, getSelectedOrgId } from '../services/supabaseClient';
import toast from 'react-hot-toast';

// ─── Animations ──────────────────────────────────────────────────────────────
const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
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
  color: #f8fafc;
  animation: ${fadeIn} 0.3s ease-out;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;

  h1 {
    font-size: 1.8rem;
    font-weight: 800;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: #f8fafc;

    svg {
      color: #10b981;
    }
  }
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const AddButton = styled.button`
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  padding: 0.7rem 1.3rem;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
  }
`;

const RefreshButton = styled.button<{ $spinning?: boolean }>`
  background: rgba(30, 41, 59, 0.8);
  color: #94a3b8;
  border: 1px solid rgba(255, 255, 255, 0.1);
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;

  svg {
    animation: ${props => props.$spinning ? spin : 'none'} 1s linear infinite;
  }

  &:hover {
    background: rgba(51, 65, 85, 0.8);
    color: #f8fafc;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.25rem;
`;

const DeviceCard = styled.div<{ $online: boolean }>`
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(12px);
  border: 1px solid ${props => props.$online ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.08)'};
  border-radius: 16px;
  padding: 1.25rem;
  transition: all 0.25s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-4px);
    border-color: #10b981;
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const DeviceTitle = styled.div`
  h3 {
    font-size: 1.1rem;
    font-weight: 800;
    margin: 0 0 0.2rem 0;
    color: #f8fafc;
  }
  span {
    font-size: 0.75rem;
    color: #64748b;
    font-family: monospace;
  }
`;

const StatusBadge = styled.div<{ $online: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: ${props => props.$online ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100, 116, 139, 0.15)'};
  border: 1px solid ${props => props.$online ? 'rgba(16, 185, 129, 0.3)' : 'rgba(100, 116, 139, 0.3)'};
  color: ${props => props.$online ? '#34d399' : '#94a3b8'};
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.2rem 0.55rem;
  border-radius: 20px;

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${props => props.$online ? '#10b981' : '#64748b'};
    animation: ${props => props.$online ? pulse : 'none'} 2s infinite;
  }
`;

const MetricsGrid = styled.div<{ $cols?: number }>`
  display: grid;
  grid-template-columns: repeat(${props => props.$cols || 2}, 1fr);
  gap: 0.6rem;
  margin-bottom: 1rem;
`;

const MetricCard = styled.div<{ $color?: string }>`
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 0.6rem 0.75rem;

  .icon {
    font-size: 0.8rem;
    color: ${props => props.$color || '#94a3b8'};
    margin-bottom: 0.2rem;
  }
  .value {
    font-size: 1.15rem;
    font-weight: 800;
    color: #f8fafc;
  }
  .label {
    font-size: 0.65rem;
    color: #64748b;
    font-weight: 600;
    text-transform: uppercase;
  }
`;

const VpdBadge = styled.div<{ $color: string }>`
  background: rgba(15, 23, 42, 0.9);
  border-left: 3px solid ${props => props.$color};
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.85rem;

  .left {
    .label { font-size: 0.6rem; color: #64748b; font-weight: 700; }
    .value { font-size: 0.95rem; font-weight: 800; color: #f8fafc; }
  }
  .right {
    text-align: right;
    .stage { font-size: 0.7rem; color: #94a3b8; font-weight: 600; display: block; }
    .status { font-size: 0.65rem; color: ${props => props.$color}; font-weight: 700; }
  }
`;

const CardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding-top: 0.75rem;
  font-size: 0.75rem;
  color: #64748b;

  .actions {
    display: flex;
    gap: 0.35rem;
  }
`;

const IconBtn = styled.button<{ $danger?: boolean }>`
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: ${props => props.$danger ? '#ef4444' : '#94a3b8'};
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$danger ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.15)'};
    color: ${props => props.$danger ? '#f87171' : '#f8fafc'};
  }
`;

const EmptyState = styled.div`
  grid-column: 1 / -1;
  background: rgba(15, 23, 42, 0.6);
  border: 2px dashed rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 3.5rem 2rem;
  text-align: center;
  color: #64748b;

  .icon {
    font-size: 3rem;
    color: #334155;
    margin-bottom: 1rem;
  }
  h3 {
    color: #f8fafc;
    margin: 0 0 0.5rem 0;
  }
  p {
    max-width: 450px;
    margin: 0 auto;
    font-size: 0.9rem;
  }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const Modal = styled.div`
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  width: 100%;
  max-width: 450px;
  padding: 1.75rem;
  color: #f8fafc;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.7);

  h2 {
    font-size: 1.3rem;
    margin: 0 0 0.5rem 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #f8fafc;
    svg { color: #10b981; }
  }
  p.subtitle {
    color: #64748b;
    font-size: 0.85rem;
    margin: 0 0 1.25rem 0;
  }
`;

const HintBox = styled.div`
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 10px;
  padding: 0.75rem 1rem;
  margin-bottom: 1.25rem;
  display: flex;
  gap: 0.75rem;
  color: #34d399;
  font-size: 0.8rem;

  svg { font-size: 1.2rem; flex-shrink: 0; margin-top: 2px; }
  .text { strong { color: #f8fafc; } }
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
  label {
    display: block;
    font-size: 0.8rem;
    font-weight: 700;
    color: #94a3b8;
    margin-bottom: 0.35rem;
  }
  input {
    width: 100%;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 0.65rem 0.85rem;
    color: #f8fafc;
    font-size: 0.95rem;
    box-sizing: border-box;

    &:focus {
      outline: none;
      border-color: #10b981;
      background: rgba(255, 255, 255, 0.08);
    }
  }
`;

const ErrorMsg = styled.div`
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #f87171;
  padding: 0.6rem 0.85rem;
  border-radius: 8px;
  font-size: 0.8rem;
  margin-bottom: 1rem;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1.5rem;

  button {
    padding: 0.65rem 1.2rem;
    border-radius: 8px;
    font-weight: 700;
    font-size: 0.85rem;
    cursor: pointer;
    border: none;
    transition: all 0.2s ease;

    &.primary {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      &:hover { opacity: 0.9; }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }
    &.secondary {
      background: rgba(255, 255, 255, 0.08);
      color: #94a3b8;
      &:hover { background: rgba(255, 255, 255, 0.15); color: #f8fafc; }
    }
  }
`;

const Spinner = styled.div`
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
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
    try {
      await deviceService.unlinkDevice(deviceId);
      setDevices(prev => prev.filter(d => d.device_id !== deviceId));
      toast.success('Dispositivo desvinculado con éxito');
    } catch (err: any) {
      console.error('[Devices] handleUnlink error:', err);
      toast.error('Error al desvincular el dispositivo: ' + (err.message || 'Error de base de datos'));
    }
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

      {/* Clean Room Environmental Summary Bar */}
      {devices.length > 0 && (
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '1rem 1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Temp Promedio</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ef4444' }}>
              {(devices.filter(d => d.last_reading?.sensors).reduce((acc, d) => acc + (d.last_reading?.sensors.temp_c || 0), 0) / (devices.filter(d => d.last_reading?.sensors).length || 1)).toFixed(1)} <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>°C</span>
            </div>
          </div>
          <div style={{ height: '30px', width: '1px', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Humedad Promedio</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8' }}>
              {(devices.filter(d => d.last_reading?.sensors).reduce((acc, d) => acc + (d.last_reading?.sensors.hum_pct || 0), 0) / (devices.filter(d => d.last_reading?.sensors).length || 1)).toFixed(1)} <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>%</span>
            </div>
          </div>
          <div style={{ height: '30px', width: '1px', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>VPD Promedio</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>
              {(devices.filter(d => d.last_reading?.sensors).reduce((acc, d) => acc + (d.last_reading?.sensors.vpd_kpa || 0), 0) / (devices.filter(d => d.last_reading?.sensors).length || 1)).toFixed(2)} <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>kPa</span>
            </div>
          </div>
        </div>
      )}

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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0 }}>{device.alias || device.device_id}</h3>
                    <span style={{
                      fontSize: '0.7rem',
                      background: (device.device_type === 'sense_7in' || device.device_id.toLowerCase().includes('7in')) ? 'rgba(14, 165, 233, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      color: (device.device_type === 'sense_7in' || device.device_id.toLowerCase().includes('7in')) ? '#38bdf8' : '#34d399',
                      border: `1px solid ${(device.device_type === 'sense_7in' || device.device_id.toLowerCase().includes('7in')) ? 'rgba(14, 165, 233, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                      padding: '0.15rem 0.45rem',
                      borderRadius: '4px',
                      fontWeight: 700
                    }}>
                      {(device.device_type === 'sense_7in' || device.device_id.toLowerCase().includes('7in')) ? '🖥️ Monitor 7.0"' : '📟 Sensor 3.5"'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#64748b' }}>{device.device_id}</span>
                    {(device.room_name || device.bunker_name) && (
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        📍 {device.room_name ? device.room_name : 'Sala'} {device.bunker_name ? `• ${device.bunker_name}` : ''}
                      </span>
                    )}
                  </div>
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
          onUpdate={handleRefresh}
        />
      )}
    </Container>
  );
};

export default Devices;
