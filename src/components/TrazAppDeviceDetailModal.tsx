// src/components/TrazAppDeviceDetailModal.tsx
import React, { useEffect, useState, useMemo } from 'react';
import styled, { keyframes } from 'styled-components';
import { 
  FaTimes, FaThermometerHalf, FaTint, FaLeaf, FaChartArea, FaCog, FaSave, 
  FaWifi, FaTimesCircle, FaPlus, FaTrash, FaPen, FaBell, FaExclamationTriangle, 
  FaDesktop, FaGlobe, FaMobileAlt 
} from 'react-icons/fa';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { deviceService, TrazAppDevice } from '../services/deviceService';
import { roomsService } from '../services/roomsService';
import { LoadingSpinner } from './LoadingSpinner';
import { ToastModal } from './ToastModal';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  padding: 1.5rem;
  animation: ${fadeIn} 0.25s ease-out;
`;

const ModalContent = styled.div`
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1.25rem;
  width: 100%;
  max-width: 850px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  animation: ${slideUp} 0.3s cubic-bezier(0.16, 1, 0.3, 1);
`;

const ModalHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(30, 41, 59, 0.4);
`;

const HeaderTitle = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  h2 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 800;
    color: #f8fafc;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  span {
    font-size: 0.78rem;
    color: #64748b;
    font-family: monospace;
    letter-spacing: 0.05em;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  font-size: 1.2rem;
  transition: color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 50%;
  &:hover {
    color: #ef4444;
    background: rgba(255, 255, 255, 0.05);
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const NavRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const TabGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.03);
  padding: 0.25rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const TabButton = styled.button<{ $active: boolean }>`
  padding: 0.5rem 1rem;
  border: none;
  background: ${p => p.$active ? 'rgba(16, 185, 129, 0.15)' : 'transparent'};
  color: ${p => p.$active ? '#10b981' : '#94a3b8'};
  border-radius: 6px;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  border: 1px solid ${p => p.$active ? 'rgba(16, 185, 129, 0.2)' : 'transparent'};

  &:hover {
    color: ${p => p.$active ? '#10b981' : '#f8fafc'};
    background: ${p => p.$active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)'};
  }
`;

const RangeGroup = styled.div`
  display: flex;
  gap: 0.35rem;
  background: rgba(255, 255, 255, 0.03);
  padding: 0.25rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const RangeButton = styled.button<{ $active: boolean }>`
  padding: 0.35rem 0.75rem;
  border: none;
  background: ${p => p.$active ? '#1e293b' : 'transparent'};
  color: ${p => p.$active ? '#f8fafc' : '#64748b'};
  border-radius: 6px;
  font-weight: 700;
  font-size: 0.78rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: #f8fafc;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1rem;
`;

const StatCard = styled.div<{ $color: string }>`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  .label {
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    color: #64748b;
    letter-spacing: 0.05em;
  }

  .value {
    font-size: 1.4rem;
    font-weight: 800;
    color: ${p => p.$color};
  }
`;

const MetricSelectorRow = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const MetricOptionCard = styled.button<{ $active: boolean; $color: string }>`
  flex: 1;
  min-width: 130px;
  background: ${p => p.$active ? `rgba(${p.$color === '#ef4444' ? '239,68,68' : p.$color === '#3b82f6' ? '59,130,246' : p.$color === '#14b8a6' ? '20,184,166' : '168,85,247'}, 0.08)` : 'rgba(255,255,255,0.02)'};
  border: 1px solid ${p => p.$active ? `${p.$color}4d` : 'rgba(255,255,255,0.04)'};
  border-radius: 12px;
  padding: 0.875rem;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: ${p => p.$active ? p.$color : '#64748b'};
    font-size: 0.85rem;
    font-weight: 700;
  }

  .value {
    font-size: 1.25rem;
    font-weight: 800;
    color: ${p => p.$active ? p.$color : '#94a3b8'};
  }

  &:hover {
    border-color: ${p => p.$color}66;
    background: rgba(255,255,255,0.04);
  }
`;

const ChartWrapper = styled.div`
  background: rgba(255, 255, 255, 0.01);
  border: 1px solid rgba(255, 255, 255, 0.03);
  border-radius: 16px;
  padding: 1.5rem;
  height: 330px;
`;

const ChartHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;

  h3 {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 800;
    color: #f8fafc;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`;

// ─── Config Panel Styles ─────────────────────────────────────────────────────
const ConfigForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 0.5rem 0;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  label {
    font-size: 0.8rem;
    font-weight: 700;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  input, select {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    padding: 0.75rem 1rem;
    color: #f8fafc;
    font-size: 0.95rem;
    outline: none;
    transition: all 0.2s;

    &:focus {
      border-color: #10b981;
      background: rgba(255, 255, 255, 0.06);
    }
  }

  select {
    cursor: pointer;
    option {
      background: #0f172a;
      color: #f8fafc;
    }
  }

  .hint {
    font-size: 0.75rem;
    color: #64748b;
    line-height: 1.4;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
`;

const SaveButton = styled.button`
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

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const AlertSectionCard = styled.div`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const AlertHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  .title-col {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    h4 {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 700;
      color: #f8fafc;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    p {
      margin: 0;
      font-size: 0.78rem;
      color: #94a3b8;
    }
  }
`;

const SwitchLabel = styled.label`
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;

  input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  span {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #334155;
    transition: .3s;
    border-radius: 24px;

    &:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: .3s;
      border-radius: 50%;
    }
  }

  input:checked + span {
    background-color: #10b981;
  }

  input:checked + span:before {
    transform: translateX(20px);
  }
`;

const ChannelsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
`;

const ChannelCheckbox = styled.label<{ $checked: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 0.85rem;
  background: ${props => props.$checked ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.03)'};
  border: 1px solid ${props => props.$checked ? '#10b981' : 'rgba(255, 255, 255, 0.08)'};
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 600;
  color: ${props => props.$checked ? '#34d399' : '#94a3b8'};
  transition: all 0.2s;

  input {
    display: none;
  }
`;

const ThresholdsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
`;

const ThresholdCard = styled.div<{ $color: string }>`
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-top: 3px solid ${props => props.$color};
  border-radius: 8px;
  padding: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;

  .metric-label {
    font-size: 0.78rem;
    font-weight: 700;
    color: #f8fafc;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .inputs-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;

    .input-box {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;

      span {
        font-size: 0.68rem;
        color: #64748b;
        font-weight: 600;
        text-transform: uppercase;
      }

      input {
        width: 100%;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 6px;
        padding: 0.4rem 0.5rem;
        color: #f8fafc;
        font-size: 0.88rem;
        font-weight: 600;
        text-align: center;
        outline: none;

        &:focus {
          border-color: ${props => props.$color};
        }
      }
    }
  }
`;

interface TrazAppDeviceDetailModalProps {
  device: TrazAppDevice;
  onClose: () => void;
  onUpdate: () => void;
}

type SelectedMetric = 'temp' | 'hum' | 'soil' | 'vpd';

export const TrazAppDeviceDetailModal: React.FC<TrazAppDeviceDetailModalProps> = ({ device, onClose, onUpdate }) => {
  const [view, setView] = useState<'history' | 'config'>('history');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [activeMetric, setActiveMetric] = useState<SelectedMetric>('temp');
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState<any[]>([]);

  // Config States
  const [alias, setAlias] = useState(device.alias || '');
  const [roomId, setRoomId] = useState(device.room_id || '');
  const [bunkerName, setBunkerName] = useState(device.bunker_name || '');
  const [deviceType, setDeviceType] = useState(device.device_type || 'sensor');
  const [saving, setSaving] = useState(false);

  // Alert Config States
  const alertSettings = device.alert_settings;
  const [alertsEnabled, setAlertsEnabled] = useState<boolean>(alertSettings?.alerts_enabled ?? true);
  const [tempMin, setTempMin] = useState<number>(alertSettings?.temp_min ?? 18);
  const [tempMax, setTempMax] = useState<number>(alertSettings?.temp_max ?? 28);
  const [humMin, setHumMin] = useState<number>(alertSettings?.hum_min ?? 50);
  const [humMax, setHumMax] = useState<number>(alertSettings?.hum_max ?? 75);
  const [soilMin, setSoilMin] = useState<number>(alertSettings?.soil_min ?? 40);
  const [soilMax, setSoilMax] = useState<number>(alertSettings?.soil_max ?? 80);
  const [vpdMin, setVpdMin] = useState<number>(alertSettings?.vpd_min ?? 0.8);
  const [vpdMax, setVpdMax] = useState<number>(alertSettings?.vpd_max ?? 1.4);
  const [notifyScreen, setNotifyScreen] = useState<boolean>(alertSettings?.notify_screen ?? true);
  const [notifyWeb, setNotifyWeb] = useState<boolean>(alertSettings?.notify_web ?? true);
  const [notifyPush, setNotifyPush] = useState<boolean>(alertSettings?.notify_push ?? true);

  // Toast State
  const [toast, setToast] = useState<{ open: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    type: 'info'
  });

  // Fetch Telemetry Logs
  useEffect(() => {
    if (view !== 'history') return;

    const fetchLogs = async () => {
      setLoading(true);
      try {
        let hours = 24;
        if (timeRange === '7d') hours = 168;
        if (timeRange === '30d') hours = 720;

        const data = await deviceService.getTelemetryHistory(device.device_id, hours);
        setLogs(data);
      } catch (err) {
        console.error("Error fetching telemetry logs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [device.device_id, timeRange, view]);

  // Fetch Rooms for Assignment
  useEffect(() => {
    if (view !== 'config') return;

    const fetchRooms = async () => {
      try {
        const data = await roomsService.getRooms();
        setRooms(data);
      } catch (err) {
        console.error("Error fetching rooms:", err);
      }
    };
    fetchRooms();
  }, [view]);

  // Process data for Recharts
  const chartData = useMemo(() => {
    return logs.map((log: any) => ({
      time: timeRange === '24h'
        ? new Date(log.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : new Date(log.recorded_at).toLocaleDateString([], { day: '2-digit', month: '2-digit' }) + (timeRange === '7d' ? ' ' + new Date(log.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''),
      fullDate: new Date(log.recorded_at),
      value: activeMetric === 'temp' ? log.temp_c
        : activeMetric === 'hum' ? log.hum_pct
        : activeMetric === 'soil' ? log.soil_pct
        : log.vpd_kpa
    })).filter(d => d.value !== null && d.value !== undefined);
  }, [logs, activeMetric, timeRange]);

  // Smooth data points to create natural curved lines without sharp discrete steps
  const smoothedData = useMemo(() => {
    if (chartData.length <= 2) return chartData;
    return chartData.map((d, i, arr) => {
      if (i === 0 || i === arr.length - 1) return { ...d, rawValue: d.value };
      const prev = Number(arr[i - 1].value);
      const curr = Number(d.value);
      const next = Number(arr[i + 1].value);
      const smoothed = (prev * 0.25) + (curr * 0.5) + (next * 0.25);
      return {
        ...d,
        value: Number(smoothed.toFixed(activeMetric === 'vpd' ? 3 : 2)),
        rawValue: curr
      };
    });
  }, [chartData, activeMetric]);

  // Calculate statistics for the active metric
  const stats = useMemo(() => {
    if (chartData.length === 0) return { current: null, min: null, max: null, avg: null };
    const values = chartData.map(d => Number(d.value));
    const current = values[values.length - 1];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    return { current, min, max, avg };
  }, [chartData]);

  // Dynamic Y-axis domain with natural padding to avoid strange decimal intervals
  const yDomain = useMemo(() => {
    if (stats.min === null || stats.max === null) return ['auto', 'auto'];
    if (activeMetric === 'temp') {
      const span = stats.max - stats.min;
      if (span < 4) {
        const center = (stats.min + stats.max) / 2;
        return [Math.floor(center - 2), Math.ceil(center + 2)];
      }
      return [Math.floor(stats.min - 1), Math.ceil(stats.max + 1)];
    }
    if (activeMetric === 'hum' || activeMetric === 'soil') {
      const span = stats.max - stats.min;
      if (span < 12) {
        const center = (stats.min + stats.max) / 2;
        return [Math.max(0, Math.floor(center - 8)), Math.min(100, Math.ceil(center + 8))];
      }
      return [Math.max(0, Math.floor(stats.min - 5)), Math.min(100, Math.ceil(stats.max + 5))];
    }
    if (activeMetric === 'vpd') {
      const maxVpd = Math.max(1.5, Number((Math.ceil((stats.max + 0.2) * 2) / 2).toFixed(1)));
      return [0, maxVpd];
    }
    return ['auto', 'auto'];
  }, [stats, activeMetric]);

  // Active Metric Config Helper
  const metricConfig = useMemo(() => {
    switch (activeMetric) {
      case 'temp':
        return { label: 'Temperatura', unit: '°C', color: '#ef4444', icon: <FaThermometerHalf /> };
      case 'hum':
        return { label: 'Humedad Ambiente', unit: '%', color: '#3b82f6', icon: <FaTint /> };
      case 'soil':
        return { label: 'Humedad del Suelo', unit: '%', color: '#14b8a6', icon: <FaLeaf /> };
      case 'vpd':
        return { label: 'Déficit de Presión de Vapor (VPD)', unit: ' kPa', color: '#a855f7', icon: <FaChartArea /> };
    }
  }, [activeMetric]);

  // Dynamic workbenches for the selected room (filters out plant tags like FCY-003)
  const availableWorkbenches = useMemo(() => {
    if (!roomId) return [];
    const selectedRoom = rooms.find(r => r.id === roomId);
    if (!selectedRoom) return [];
    const names = new Set<string>();
    const isPlantTag = (s: string) => /^[A-Z]{2,5}-\d{3,}$/i.test(s.trim());

    if (selectedRoom.clone_maps && Array.isArray(selectedRoom.clone_maps)) {
      selectedRoom.clone_maps.forEach((cm: any) => {
        if (cm.name && !isPlantTag(cm.name)) names.add(cm.name);
      });
    }
    if (selectedRoom.batches && Array.isArray(selectedRoom.batches)) {
      selectedRoom.batches.forEach((b: any) => {
        if (b.name && !isPlantTag(b.name)) names.add(b.name);
      });
    }
    return Array.from(names);
  }, [roomId, rooms]);

  // Save Settings
  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      if (notifyPush && 'Notification' in window && Notification.permission !== 'granted') {
        try {
          await Notification.requestPermission();
        } catch (permErr) {
          console.warn("Notification permission error:", permErr);
        }
      }

      const alertPayload = {
        alerts_enabled: alertsEnabled,
        temp_min: Number(tempMin),
        temp_max: Number(tempMax),
        hum_min: Number(humMin),
        hum_max: Number(humMax),
        soil_min: Number(soilMin),
        soil_max: Number(soilMax),
        vpd_min: Number(vpdMin),
        vpd_max: Number(vpdMax),
        notify_screen: notifyScreen,
        notify_web: notifyWeb,
        notify_push: notifyPush
      };

      await deviceService.updateDevice(device.device_id, {
        alias: alias.trim() || null,
        room_id: roomId || null,
        bunker_name: bunkerName.trim() || null,
        device_type: deviceType || 'sensor',
        alert_settings: alertPayload
      });
      setToast({
        open: true,
        message: 'Configuración y alertas guardadas correctamente.',
        type: 'success'
      });
      onUpdate();
      setTimeout(() => setView('history'), 1000);
    } catch (err) {
      console.error(err);
      setToast({
        open: true,
        message: 'Error al actualizar configuración.',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const hasSoilData = useMemo(() => {
    // Check if there is any soil_pct in recent logs or if the last_reading has it
    if (device.last_reading?.sensors?.soil_pct !== undefined && device.last_reading?.sensors?.soil_pct !== null) return true;
    return logs.some(l => l.soil_pct !== null && l.soil_pct !== undefined);
  }, [logs, device.last_reading]);

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <HeaderTitle>
            <h2><FaWifi style={{ color: '#10b981' }} /> {device.alias || device.device_id}</h2>
            <span>Dispositivo IoT TrazAPP • ID: {device.device_id}</span>
          </HeaderTitle>
          <CloseButton onClick={onClose} title="Cerrar"><FaTimes /></CloseButton>
        </ModalHeader>

        <ModalBody>
          <NavRow>
            <TabGroup>
              <TabButton $active={view === 'history'} onClick={() => setView('history')}>
                <FaChartArea /> Historial
              </TabButton>
              <TabButton $active={view === 'config'} onClick={() => setView('config')}>
                <FaCog /> Configuración
              </TabButton>
            </TabGroup>

            {view === 'history' && (
              <RangeGroup>
                <RangeButton $active={timeRange === '24h'} onClick={() => setTimeRange('24h')}>24 Horas</RangeButton>
                <RangeButton $active={timeRange === '7d'} onClick={() => setTimeRange('7d')}>7 Días</RangeButton>
                <RangeButton $active={timeRange === '30d'} onClick={() => setTimeRange('30d')}>30 Días</RangeButton>
              </RangeGroup>
            )}
          </NavRow>

          {view === 'config' ? (
            <ConfigForm>
              <FormGroup>
                <label>Nombre / Alias</label>
                <input
                  placeholder="Ej: Placa Sense Mesa Fancy"
                  value={alias}
                  onChange={e => setAlias(e.target.value)}
                />
                <span className="hint">Asignale un nombre descriptivo para identificarlo fácilmente.</span>
              </FormGroup>

              <FormGroup>
                <label>Tipo de Dispositivo</label>
                <select value={deviceType} onChange={e => setDeviceType(e.target.value)}>
                  <option value="sense_7in">🖥️ Monitor TrazApp 7.0" (Lotes, Mesas, Tareas, Incidencias)</option>
                  <option value="sensor">📟 Sensor TrazApp 3.5" (Sensado Ambiental de Mesa)</option>
                  <option value="camera">📷 Cámara / Visión por Computadora</option>
                </select>
                <span className="hint">Define el perfil y capacidades operativas del equipo.</span>
              </FormGroup>

              <FormGroup>
                <label>Asignar a Sala de Cultivo</label>
                <select value={roomId} onChange={e => setRoomId(e.target.value)}>
                  <option value="">-- Toda la Locación / Sin Sala específica --</option>
                  {rooms.map(room => (
                    <option key={room.id} value={room.id}>
                      {room.name} ({room.type === 'living_soil' ? 'Agro/Living Soil' : room.type === 'flowering' ? 'Floración' : room.type === 'vegetation' ? 'Vegetación' : room.type === 'drying' ? 'Secado' : room.type === 'curing' ? 'Curado' : room.type})
                    </option>
                  ))}
                </select>
                <span className="hint">Vincular a una sala agrupa las lecturas y calcula los promedios ambientales de la sala.</span>
              </FormGroup>

              <FormGroup>
                <label>Mesa de Trabajo / Bunker / Lote</label>
                {availableWorkbenches.length > 0 ? (
                  <select value={bunkerName} onChange={e => setBunkerName(e.target.value)}>
                    <option value="">-- Sin mesa específica (Toda la Sala) --</option>
                    {availableWorkbenches.map(wb => (
                      <option key={wb} value={wb}>{wb}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    placeholder="Ej: BUNKER 1, Fancy, Mesa 1, Esquejera A"
                    value={bunkerName}
                    onChange={e => setBunkerName(e.target.value)}
                  />
                )}
                <span className="hint">Asigna el monitoreo de plantas, lotes, tareas e incidencias de esta mesa específica a la pantalla o sensor.</span>
              </FormGroup>

              <AlertSectionCard>
                <AlertHeader>
                  <div className="title-col">
                    <h4><FaBell style={{ color: '#f59e0b' }} /> Umbrales y Alertas Ambientales</h4>
                    <p>Configura los límites para avisar inmediatamente si los parámetros se desvían de los rangos ideales.</p>
                  </div>
                  <SwitchLabel>
                    <input
                      type="checkbox"
                      checked={alertsEnabled}
                      onChange={e => setAlertsEnabled(e.target.checked)}
                    />
                    <span />
                  </SwitchLabel>
                </AlertHeader>

                {alertsEnabled && (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Canales de Aviso y Notificación
                      </span>
                      <ChannelsRow>
                        <ChannelCheckbox $checked={notifyScreen}>
                          <input
                            type="checkbox"
                            checked={notifyScreen}
                            onChange={e => setNotifyScreen(e.target.checked)}
                          />
                          <FaDesktop /> Pantalla Bunker (Hardware)
                        </ChannelCheckbox>
                        <ChannelCheckbox $checked={notifyWeb}>
                          <input
                            type="checkbox"
                            checked={notifyWeb}
                            onChange={e => setNotifyWeb(e.target.checked)}
                          />
                          <FaGlobe /> Dashboard Web
                        </ChannelCheckbox>
                        <ChannelCheckbox $checked={notifyPush}>
                          <input
                            type="checkbox"
                            checked={notifyPush}
                            onChange={async (e) => {
                              const checked = e.target.checked;
                              setNotifyPush(checked);
                              if (checked && 'Notification' in window && Notification.permission !== 'granted') {
                                await Notification.requestPermission();
                              }
                            }}
                          />
                          <FaMobileAlt /> Notificaciones Push
                        </ChannelCheckbox>
                      </ChannelsRow>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Rangos Aceptables (Mínimo / Máximo)
                      </span>
                      <ThresholdsGrid>
                        <ThresholdCard $color="#ef4444">
                          <div className="metric-label"><FaThermometerHalf style={{ color: '#ef4444' }} /> Temperatura (°C)</div>
                          <div className="inputs-row">
                            <div className="input-box">
                              <span>Mínimo</span>
                              <input
                                type="number"
                                step="0.5"
                                value={tempMin}
                                onChange={e => setTempMin(Number(e.target.value))}
                              />
                            </div>
                            <div className="input-box">
                              <span>Máximo</span>
                              <input
                                type="number"
                                step="0.5"
                                value={tempMax}
                                onChange={e => setTempMax(Number(e.target.value))}
                              />
                            </div>
                          </div>
                        </ThresholdCard>

                        <ThresholdCard $color="#3b82f6">
                          <div className="metric-label"><FaTint style={{ color: '#3b82f6' }} /> Humedad Aire (%)</div>
                          <div className="inputs-row">
                            <div className="input-box">
                              <span>Mínimo</span>
                              <input
                                type="number"
                                step="1"
                                value={humMin}
                                onChange={e => setHumMin(Number(e.target.value))}
                              />
                            </div>
                            <div className="input-box">
                              <span>Máximo</span>
                              <input
                                type="number"
                                step="1"
                                value={humMax}
                                onChange={e => setHumMax(Number(e.target.value))}
                              />
                            </div>
                          </div>
                        </ThresholdCard>

                        <ThresholdCard $color="#14b8a6">
                          <div className="metric-label"><FaLeaf style={{ color: '#14b8a6' }} /> Humedad Suelo (%)</div>
                          <div className="inputs-row">
                            <div className="input-box">
                              <span>Mínimo</span>
                              <input
                                type="number"
                                step="1"
                                value={soilMin}
                                onChange={e => setSoilMin(Number(e.target.value))}
                              />
                            </div>
                            <div className="input-box">
                              <span>Máximo</span>
                              <input
                                type="number"
                                step="1"
                                value={soilMax}
                                onChange={e => setSoilMax(Number(e.target.value))}
                              />
                            </div>
                          </div>
                        </ThresholdCard>

                        <ThresholdCard $color="#a855f7">
                          <div className="metric-label"><FaChartArea style={{ color: '#a855f7' }} /> VPD (kPa)</div>
                          <div className="inputs-row">
                            <div className="input-box">
                              <span>Mínimo</span>
                              <input
                                type="number"
                                step="0.05"
                                value={vpdMin}
                                onChange={e => setVpdMin(Number(e.target.value))}
                              />
                            </div>
                            <div className="input-box">
                              <span>Máximo</span>
                              <input
                                type="number"
                                step="0.05"
                                value={vpdMax}
                                onChange={e => setVpdMax(Number(e.target.value))}
                              />
                            </div>
                          </div>
                        </ThresholdCard>
                      </ThresholdsGrid>
                    </div>
                  </>
                )}
              </AlertSectionCard>

              <ButtonRow>
                <SaveButton onClick={handleSaveConfig} disabled={saving}>
                  <FaSave /> {saving ? 'Guardando...' : 'Guardar Configuración'}
                </SaveButton>
              </ButtonRow>
            </ConfigForm>
          ) : (
            <>
              <MetricSelectorRow>
                <MetricOptionCard
                  $active={activeMetric === 'temp'}
                  $color="#ef4444"
                  onClick={() => setActiveMetric('temp')}
                >
                  <div className="header">Temperatura <FaThermometerHalf /></div>
                  <div className="value">
                    {device.last_reading?.sensors?.temp_c !== undefined
                      ? `${device.last_reading.sensors.temp_c.toFixed(1)} °C`
                      : '—'
                    }
                  </div>
                </MetricOptionCard>

                <MetricOptionCard
                  $active={activeMetric === 'hum'}
                  $color="#3b82f6"
                  onClick={() => setActiveMetric('hum')}
                >
                  <div className="header">Humedad Amb. <FaTint /></div>
                  <div className="value">
                    {device.last_reading?.sensors?.hum_pct !== undefined
                      ? `${device.last_reading.sensors.hum_pct.toFixed(1)} %`
                      : '—'
                    }
                  </div>
                </MetricOptionCard>

                {hasSoilData && (
                  <MetricOptionCard
                    $active={activeMetric === 'soil'}
                    $color="#14b8a6"
                    onClick={() => setActiveMetric('soil')}
                  >
                    <div className="header">Humedad Suelo <FaLeaf /></div>
                    <div className="value">
                      {device.last_reading?.sensors?.soil_pct !== undefined
                        ? `${device.last_reading.sensors.soil_pct.toFixed(1)} %`
                        : '—'
                      }
                    </div>
                  </MetricOptionCard>
                )}

                <MetricOptionCard
                  $active={activeMetric === 'vpd'}
                  $color="#a855f7"
                  onClick={() => setActiveMetric('vpd')}
                >
                  <div className="header">VPD <FaChartArea /></div>
                  <div className="value">
                    {device.last_reading?.sensors?.vpd_kpa !== undefined
                      ? `${device.last_reading.sensors.vpd_kpa.toFixed(3)} kPa`
                      : '—'
                    }
                  </div>
                </MetricOptionCard>
              </MetricSelectorRow>

              {loading ? (
                <div style={{ height: 330, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <LoadingSpinner />
                </div>
              ) : chartData.length === 0 ? (
                <div style={{ height: 330, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#64748b', gap: '0.5rem', background: 'rgba(255,255,255,0.01)', borderRadius: 16 }}>
                  <FaChartArea size={32} />
                  <span>No hay lecturas históricas para este rango de tiempo.</span>
                </div>
              ) : (
                <>
                  <StatsGrid>
                    <StatCard $color={metricConfig.color}>
                      <span className="label">Actual</span>
                      <span className="value">
                        {stats.current !== null ? `${stats.current.toFixed(activeMetric === 'vpd' ? 3 : 1)}${metricConfig.unit}` : '—'}
                      </span>
                    </StatCard>
                    <StatCard $color={metricConfig.color}>
                      <span className="label">Máximo</span>
                      <span className="value">
                        {stats.max !== null ? `${stats.max.toFixed(activeMetric === 'vpd' ? 3 : 1)}${metricConfig.unit}` : '—'}
                      </span>
                    </StatCard>
                    <StatCard $color={metricConfig.color}>
                      <span className="label">Mínimo</span>
                      <span className="value">
                        {stats.min !== null ? `${stats.min.toFixed(activeMetric === 'vpd' ? 3 : 1)}${metricConfig.unit}` : '—'}
                      </span>
                    </StatCard>
                    <StatCard $color={metricConfig.color}>
                      <span className="label">Promedio</span>
                      <span className="value">
                        {stats.avg !== null ? `${stats.avg.toFixed(activeMetric === 'vpd' ? 3 : 1)}${metricConfig.unit}` : '—'}
                      </span>
                    </StatCard>
                  </StatsGrid>

                  <ChartWrapper>
                    <ChartHeader>
                      <h3>{metricConfig.icon} Historial de {metricConfig.label}</h3>
                    </ChartHeader>
                    <ResponsiveContainer width="100%" height={260}>
                      <AreaChart data={smoothedData} margin={{ top: 12, right: 15, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id={`grad-${activeMetric}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={metricConfig.color} stopOpacity={0.25} />
                            <stop offset="95%" stopColor={metricConfig.color} stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis 
                          dataKey="time" 
                          minTickGap={45} 
                          fontSize={10} 
                          stroke="#64748b" 
                          tickLine={false} 
                          axisLine={false} 
                        />
                        <YAxis 
                          domain={yDomain} 
                          fontSize={10} 
                          stroke="#64748b" 
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(val) => {
                            if (activeMetric === 'vpd') return `${Number(val).toFixed(2)}`;
                            return `${Math.round(val)}${metricConfig.unit.trim()}`;
                          }}
                        />
                        <Tooltip
                          contentStyle={{ 
                            background: '#0f172a', 
                            border: '1px solid rgba(255,255,255,0.1)', 
                            borderRadius: 10,
                            boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                          }}
                          labelStyle={{ color: '#94a3b8', fontSize: 11, fontWeight: 'bold' }}
                          itemStyle={{ color: metricConfig.color, fontSize: 12, fontWeight: 700 }}
                          formatter={(value: any, name: any, item: any) => [
                            `${Number(item.payload.rawValue ?? value).toFixed(activeMetric === 'vpd' ? 3 : 1)} ${metricConfig.unit.trim()}`,
                            metricConfig.label
                          ]}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke={metricConfig.color}
                          strokeWidth={2.5}
                          fill={`url(#grad-${activeMetric})`}
                          dot={false}
                          activeDot={{ r: 5, stroke: metricConfig.color, strokeWidth: 2, fill: '#0f172a' }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartWrapper>
                </>
              )}
            </>
          )}
        </ModalBody>
      </ModalContent>

      <ToastModal
        isOpen={toast.open}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(prev => ({ ...prev, open: false }))}
      />
    </ModalOverlay>
  );
};
