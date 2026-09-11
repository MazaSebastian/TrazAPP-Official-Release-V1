import React, { useEffect, useState, useMemo } from 'react';
import styled from 'styled-components';
import { TuyaDevice, tuyaService, DeviceSettings } from '../services/tuyaService';
import { roomsService } from '../services/roomsService';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { 
    X as LucideX, 
    Thermometer, 
    Droplets, 
    History, 
    ArrowUp, 
    ArrowDown, 
    Minus, 
    Settings, 
    Save, 
    MapPin, 
    Sliders,
    Cpu
} from 'lucide-react';
import { ShadcnButton } from './ui/Button';
import { ShadcnBadge } from './ui/Badge';
import { LoadingSpinner } from './LoadingSpinner';
import { ToastModal } from './ToastModal';

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.75);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(12px);
  padding: 1rem;
  animation: fadeIn 0.2s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ModalContent = styled.div`
  background: rgba(15, 23, 42, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1.25rem;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);

  @keyframes slideUp {
    from { transform: translateY(16px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 3px;
  }
`;

const ModalHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(30, 41, 59, 0.4);
  position: sticky;
  top: 0;
  z-index: 10;
  backdrop-filter: blur(8px);
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #f8fafc;
  display: flex;
  align-items: center;
  gap: 0.65rem;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  &:hover { 
    color: #f1f5f9; 
    background: rgba(255, 255, 255, 0.08);
  }
`;

const ModalBody = styled.div`
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
`;

const StatCard = styled.div`
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.85rem;
  padding: 1.15rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  transition: border-color 0.2s, background 0.2s;
  &:hover {
    border-color: rgba(255, 255, 255, 0.15);
    background: rgba(30, 41, 59, 0.7);
  }
`;

const StatLabel = styled.div`
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #94a3b8;
  font-weight: 600;
`;

const StatValue = styled.div<{ color?: string }>`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${p => p.color || '#f8fafc'};
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ChartContainer = styled.div`
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1rem;
  padding: 1.5rem 1rem 1rem 0;
  height: 350px;
  position: relative;
`;

const ChartTitle = styled.h4`
  margin: 0 0 1rem 1.5rem;
  color: #f1f5f9;
  font-size: 0.95rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const TabSwitcher = styled.div`
  display: flex;
  background: rgba(15, 23, 42, 0.6);
  padding: 0.25rem;
  border-radius: 0.65rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  gap: 0.25rem;
`;

const TabButton = styled.button<{ $active: boolean }>`
  padding: 0.4rem 0.85rem;
  border: none;
  background: ${p => p.$active ? 'rgba(59, 130, 246, 0.2)' : 'transparent'};
  color: ${p => p.$active ? '#60a5fa' : '#94a3b8'};
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  transition: all 0.2s;
  ${p => p.$active && 'border: 1px solid rgba(59, 130, 246, 0.3);'}
  &:hover {
    color: #f1f5f9;
    background: ${p => p.$active ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.04)'};
  }
`;

const TimeRangeSelector = styled.div`
  display: flex;
  background: rgba(15, 23, 42, 0.6);
  padding: 0.25rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  gap: 0.25rem;
`;

const TimeButton = styled.button<{ $active: boolean }>`
  padding: 0.35rem 0.65rem;
  border-radius: 0.35rem;
  border: none;
  background: ${p => p.$active ? '#3b82f6' : 'transparent'};
  color: ${p => p.$active ? '#ffffff' : '#94a3b8'};
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 600;
  transition: all 0.2s;
  &:hover {
    color: #ffffff;
  }
`;

const StyledInput = styled.input`
  width: 100%;
  padding: 0.65rem 0.85rem;
  border-radius: 0.65rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(15, 23, 42, 0.6);
  color: #f8fafc;
  font-size: 0.95rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  &:focus {
    outline: none;
    border-color: rgba(59, 130, 246, 0.5);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }
`;

const StyledSelect = styled.select`
  width: 100%;
  padding: 0.65rem 0.85rem;
  border-radius: 0.65rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(15, 23, 42, 0.6);
  color: #f8fafc;
  font-size: 0.95rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  &:focus {
    outline: none;
    border-color: rgba(59, 130, 246, 0.5);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }
  option {
    background: #0f172a;
    color: #f8fafc;
  }
`;

interface DeviceDetailModalProps {
    device: TuyaDevice;
    onClose: () => void;
}

export const DeviceDetailModal: React.FC<DeviceDetailModalProps> = ({ device, onClose }) => {
    const [view, setView] = useState<'history' | 'config'>('history');
    const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Config State
    const [settings, setSettings] = useState<DeviceSettings>({ device_id: device.id });
    const [rooms, setRooms] = useState<any[]>([]);
    const [saving, setSaving] = useState(false);

    // Toast State
    const [toast, setToast] = useState<{ open: boolean; message: string; type: 'success' | 'error' | 'info' }>({
        open: false,
        message: '',
        type: 'info'
    });

    useEffect(() => {
        if (view === 'history') {
            const fetchLogs = async () => {
                setLoading(true);
                try {
                    let startTime;
                    const now = new Date().getTime();
                    switch (timeRange) {
                        case '24h': startTime = now - 24 * 60 * 60 * 1000; break;
                        case '7d': startTime = now - 7 * 24 * 60 * 60 * 1000; break;
                        case '30d': startTime = now - 30 * 24 * 60 * 60 * 1000; break;
                        default: startTime = now - 7 * 24 * 60 * 60 * 1000;
                    }

                    const data = await tuyaService.getDeviceLogs(device.id, startTime);

                    if (data) {
                        let logsArray = [];
                        if (Array.isArray(data)) {
                            logsArray = data;
                        } else if (data.logs && Array.isArray(data.logs)) {
                            logsArray = data.logs;
                        } else if (data.result && Array.isArray(data.result)) {
                            logsArray = data.result;
                        }

                        setLogs(logsArray.sort((a: any, b: any) => b.event_time - a.event_time));
                    }
                } catch (error) {
                    console.error("Failed to fetch logs", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchLogs();
        } else {
            const loadSettings = async () => {
                setLoading(true);
                try {
                    const [settingsData, roomsData] = await Promise.all([
                        tuyaService.getDeviceSettings(device.id),
                        roomsService.getRooms()
                    ]);

                    if (settingsData) setSettings(settingsData);
                    if (roomsData) setRooms(roomsData);
                } catch (err) {
                    console.error(err);
                } finally {
                    setLoading(false);
                }
            };
            loadSettings();
        }
    }, [device.id, timeRange, view]);

    // Process data for charts
    const chartData = useMemo(() => {
        const chronologicalLogs = [...logs].reverse();

        return chronologicalLogs
            .filter((log: any) => log.code === 'va_temperature' || log.code === 'va_humidity' || log.code === 'temp_current' || log.code === 'humidity_value')
            .map((log: any) => ({
                time: timeRange === '24h'
                    ? new Date(log.event_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : new Date(log.event_time).toLocaleDateString([], { day: '2-digit', month: '2-digit' }) + (timeRange === '7d' ? ' ' + new Date(log.event_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '')
                ,
                fullDate: new Date(log.event_time),
                value: log.code.includes('temp') ? Number(log.value) / 10 : Number(log.value),
                type: log.code.includes('temp') ? 'temp' : 'hum',
            }));
    }, [logs, timeRange]);

    const tempData = chartData.filter(d => d.type === 'temp');
    const humData = chartData.filter(d => d.type === 'hum');

    const calculateStats = (data: any[]) => {
        if (data.length === 0) return { min: 0, max: 0, avg: 0, current: 0 };
        const values = data.map(d => d.value);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const current = values[values.length - 1];
        return { min, max, avg, current };
    };

    const tempStats = calculateStats(tempData);
    const humStats = calculateStats(humData);
    const hasData = logs.length > 0;

    const handleSaveSettings = async () => {
        setSaving(true);
        try {
            await tuyaService.saveDeviceSettings({ ...settings, device_id: device.id });
            setToast({ open: true, message: 'Configuración guardada correctamente', type: 'success' });
            setTimeout(() => setView('history'), 1500);
        } catch (e) {
            setToast({ open: true, message: 'Error al guardar configuración.', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <React.Fragment>
            <ModalOverlay onClick={onClose}>
                <ModalContent onClick={e => e.stopPropagation()}>
                    <ModalHeader>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                            <Title>
                                <div style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '0.5rem',
                                    background: 'rgba(59, 130, 246, 0.15)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '1px solid rgba(59, 130, 246, 0.3)'
                                }}>
                                    <Cpu size={20} color="#60a5fa" />
                                </div>
                                {device.name}
                            </Title>
                            <TabSwitcher>
                                <TabButton
                                    $active={view === 'history'}
                                    onClick={() => setView('history')}
                                    title="Ver Historial"
                                >
                                    <History size={16} /> Historial
                                </TabButton>
                                <TabButton
                                    $active={view === 'config'}
                                    onClick={() => setView('config')}
                                    title="Configuración de Alertas"
                                >
                                    <Settings size={16} /> Configuración
                                </TabButton>
                            </TabSwitcher>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            {view === 'history' && (
                                <TimeRangeSelector>
                                    {(['24h', '7d', '30d'] as const).map(range => (
                                        <TimeButton
                                            key={range}
                                            $active={timeRange === range}
                                            onClick={() => setTimeRange(range)}
                                        >
                                            {range === '24h' ? '24hs' : range === '7d' ? '7 Días' : '30 Días'}
                                        </TimeButton>
                                    ))}
                                </TimeRangeSelector>
                            )}
                            <CloseButton onClick={onClose} aria-label="Cerrar">
                                <LucideX size={20} />
                            </CloseButton>
                        </div>
                    </ModalHeader>

                    <ModalBody>
                        {view === 'config' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div>
                                    <h4 style={{ color: '#f8fafc', fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <MapPin size={18} color="#38bdf8" /> Ubicación y Asignación
                                    </h4>
                                    <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0, marginBottom: '1rem' }}>
                                        Asigna este sensor a una sala para vincular automáticamente su telemetría a ese cultivo.
                                    </p>

                                    <div style={{
                                        background: 'rgba(30, 41, 59, 0.4)',
                                        padding: '1.25rem',
                                        borderRadius: '0.85rem',
                                        border: '1px solid rgba(255, 255, 255, 0.08)'
                                    }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.5rem', fontWeight: 600 }}>
                                            Sala / Cultivo Asignado
                                        </label>
                                        <StyledSelect
                                            value={settings.room_id || ''}
                                            onChange={(e) => setSettings({ ...settings, room_id: e.target.value || undefined })}
                                        >
                                            <option value="">-- Sin asignar --</option>
                                            {rooms.map((room: any) => (
                                                <option key={room.id} value={room.id}>
                                                    {room.name} ({room.type === 'vegetation' ? 'Vegetación' : room.type === 'flowering' ? 'Floración' : room.type === 'drying' ? 'Secado' : room.type === 'clones' ? 'Esquejes' : 'Otro'})
                                                </option>
                                            ))}
                                        </StyledSelect>
                                    </div>
                                </div>

                                <div>
                                    <h4 style={{ color: '#f8fafc', fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Sliders size={18} color="#a855f7" /> Umbrales y Alertas
                                    </h4>
                                    <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0, marginBottom: '1rem' }}>
                                        Define los límites operativos óptimos para disparar alertas preventivas.
                                    </p>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                                        {/* Temperature Settings */}
                                        <div style={{
                                            background: 'rgba(239, 68, 68, 0.06)',
                                            padding: '1.25rem',
                                            borderRadius: '0.85rem',
                                            border: '1px solid rgba(239, 68, 68, 0.2)'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171', fontWeight: 600, marginBottom: '1rem' }}>
                                                <Thermometer size={18} /> Alertas de Temperatura
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>Mínima (°C)</label>
                                                    <StyledInput
                                                        type="number"
                                                        value={settings.min_temp ?? ''}
                                                        onChange={e => setSettings({ ...settings, min_temp: Number(e.target.value) })}
                                                        placeholder="Ej: 18"
                                                    />
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>Máxima (°C)</label>
                                                    <StyledInput
                                                        type="number"
                                                        value={settings.max_temp ?? ''}
                                                        onChange={e => setSettings({ ...settings, max_temp: Number(e.target.value) })}
                                                        placeholder="Ej: 28"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Humidity Settings */}
                                        <div style={{
                                            background: 'rgba(59, 130, 246, 0.06)',
                                            padding: '1.25rem',
                                            borderRadius: '0.85rem',
                                            border: '1px solid rgba(59, 130, 246, 0.2)'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#60a5fa', fontWeight: 600, marginBottom: '1rem' }}>
                                                <Droplets size={18} /> Alertas de Humedad
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>Mínima (%)</label>
                                                    <StyledInput
                                                        type="number"
                                                        value={settings.min_hum ?? ''}
                                                        onChange={e => setSettings({ ...settings, min_hum: Number(e.target.value) })}
                                                        placeholder="Ej: 40"
                                                    />
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>Máxima (%)</label>
                                                    <StyledInput
                                                        type="number"
                                                        value={settings.max_hum ?? ''}
                                                        onChange={e => setSettings({ ...settings, max_hum: Number(e.target.value) })}
                                                        placeholder="Ej: 65"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                                    <ShadcnButton
                                        variant="secondary"
                                        onClick={() => setView('history')}
                                    >
                                        Cancelar
                                    </ShadcnButton>
                                    <ShadcnButton
                                        variant="default"
                                        onClick={handleSaveSettings}
                                        isLoading={saving}
                                    >
                                        <Save size={16} /> Guardar Configuración
                                    </ShadcnButton>
                                </div>
                            </div>
                        ) : (
                            loading ? <LoadingSpinner /> : !hasData ? (
                                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3.5rem 1rem' }}>
                                    <History size={48} style={{ opacity: 0.35, marginBottom: '1rem', display: 'block', margin: '0 auto 1rem' }} />
                                    <p style={{ margin: 0, fontSize: '1rem', fontWeight: 500 }}>No hay datos históricos disponibles para este periodo.</p>
                                </div>
                            ) : (
                                <>
                                    {/* Temperature Section */}
                                    {tempData.length > 0 && (
                                        <div>
                                            <StatsGrid style={{ marginBottom: '1.25rem' }}>
                                                <StatCard>
                                                    <StatLabel>Temperatura Actual</StatLabel>
                                                    <StatValue color="#f87171">
                                                        <Thermometer size={22} /> {tempStats.current.toFixed(1)}°C
                                                    </StatValue>
                                                </StatCard>
                                                <StatCard>
                                                    <StatLabel>Máxima ({timeRange})</StatLabel>
                                                    <StatValue color="#f472b6">
                                                        <ArrowUp size={20} /> {tempStats.max.toFixed(1)}°C
                                                    </StatValue>
                                                </StatCard>
                                                <StatCard>
                                                    <StatLabel>Mínima ({timeRange})</StatLabel>
                                                    <StatValue color="#60a5fa">
                                                        <ArrowDown size={20} /> {tempStats.min.toFixed(1)}°C
                                                    </StatValue>
                                                </StatCard>
                                                <StatCard>
                                                    <StatLabel>Promedio</StatLabel>
                                                    <StatValue color="#c084fc">
                                                        <Minus size={20} /> {tempStats.avg.toFixed(1)}°C
                                                    </StatValue>
                                                </StatCard>
                                            </StatsGrid>

                                            <ChartContainer>
                                                <ChartTitle>
                                                    <Thermometer size={18} color="#f87171" /> Historial de Temperatura
                                                </ChartTitle>
                                                <ResponsiveContainer width="100%" height={280}>
                                                    <LineChart data={tempData}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.07)" />
                                                        <XAxis dataKey="time" minTickGap={30} fontSize={11} stroke="#64748b" tick={{ fill: '#94a3b8' }} />
                                                        <YAxis domain={['auto', 'auto']} fontSize={11} stroke="#64748b" tick={{ fill: '#94a3b8' }} unit="°C" />
                                                        <Tooltip
                                                            contentStyle={{ 
                                                                background: 'rgba(15, 23, 42, 0.95)', 
                                                                borderRadius: '0.65rem', 
                                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                                                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                                                                color: '#f8fafc'
                                                            }}
                                                            formatter={(value: any) => [`${Number(value).toFixed(1)} °C`, 'Temperatura']}
                                                            labelStyle={{ color: '#94a3b8' }}
                                                        />
                                                        <Line type="monotone" dataKey="value" stroke="#f87171" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#f87171' }} />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </ChartContainer>
                                        </div>
                                    )}

                                    {/* Humidity Section */}
                                    {humData.length > 0 && (
                                        <div>
                                            <StatsGrid style={{ marginBottom: '1.25rem' }}>
                                                <StatCard>
                                                    <StatLabel>Humedad Actual</StatLabel>
                                                    <StatValue color="#60a5fa">
                                                        <Droplets size={22} /> {humStats.current.toFixed(0)}%
                                                    </StatValue>
                                                </StatCard>
                                                <StatCard>
                                                    <StatLabel>Máxima ({timeRange})</StatLabel>
                                                    <StatValue color="#f472b6">
                                                        <ArrowUp size={20} /> {humStats.max.toFixed(0)}%
                                                    </StatValue>
                                                </StatCard>
                                                <StatCard>
                                                    <StatLabel>Mínima ({timeRange})</StatLabel>
                                                    <StatValue color="#60a5fa">
                                                        <ArrowDown size={20} /> {humStats.min.toFixed(0)}%
                                                    </StatValue>
                                                </StatCard>
                                                <StatCard>
                                                    <StatLabel>Promedio</StatLabel>
                                                    <StatValue color="#c084fc">
                                                        <Minus size={20} /> {humStats.avg.toFixed(0)}%
                                                    </StatValue>
                                                </StatCard>
                                            </StatsGrid>

                                            <ChartContainer>
                                                <ChartTitle>
                                                    <Droplets size={18} color="#60a5fa" /> Historial de Humedad
                                                </ChartTitle>
                                                <ResponsiveContainer width="100%" height={280}>
                                                    <LineChart data={humData}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.07)" />
                                                        <XAxis dataKey="time" minTickGap={30} fontSize={11} stroke="#64748b" tick={{ fill: '#94a3b8' }} />
                                                        <YAxis domain={[0, 100]} fontSize={11} stroke="#64748b" tick={{ fill: '#94a3b8' }} unit="%" />
                                                        <Tooltip
                                                            contentStyle={{ 
                                                                background: 'rgba(15, 23, 42, 0.95)', 
                                                                borderRadius: '0.65rem', 
                                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                                                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                                                                color: '#f8fafc'
                                                            }}
                                                            formatter={(value: any) => [`${Number(value).toFixed(0)} %`, 'Humedad']}
                                                            labelStyle={{ color: '#94a3b8' }}
                                                        />
                                                        <Line type="monotone" dataKey="value" stroke="#38bdf8" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#38bdf8' }} />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </ChartContainer>
                                        </div>
                                    )}
                                </>
                            )
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
        </React.Fragment>
    );
};
