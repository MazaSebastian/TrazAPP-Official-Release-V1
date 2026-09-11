import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import {
  X as LucideX,
  LayoutGrid,
  History,
  Zap,
  Sprout,
  Dna,
  ClipboardList,
  Plus,
  AlertTriangle,
  Volume2,
  RefreshCw,
  Thermometer,
  Droplets,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { TrazAppDevice } from '../services/deviceService';
import { Batch } from '../types/rooms';
import toast from 'react-hot-toast';
import { Button as ShadcnButton } from './ui/Button';
import { Badge as ShadcnBadge } from './ui/Badge';

// ─── Animations ──────────────────────────────────────────────────────────────
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(14px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

// ─── Styled Components ───────────────────────────────────────────────────────
const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(3, 7, 18, 0.84);
  backdrop-filter: blur(14px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  padding: 1rem;
  animation: ${fadeIn} 0.2s ease-out;
`;

const ModalCard = styled.div`
  background: rgba(15, 23, 42, 0.96);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 1.25rem;
  width: 100%;
  max-width: 1100px;
  height: 88vh;
  max-height: 820px;
  overflow: hidden;
  box-shadow: 0 35px 70px rgba(0, 0, 0, 0.75);
  display: flex;
  flex-direction: column;
  animation: ${slideUp} 0.25s cubic-bezier(0.16, 1, 0.3, 1);

  @media (max-width: 768px) {
    height: 96vh;
    max-height: 96vh;
    border-radius: 1rem;
  }
`;

const Header = styled.div`
  padding: 1.25rem 1.5rem;
  background: rgba(30, 41, 59, 0.4);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;

  .left {
    display: flex;
    align-items: center;
    gap: 0.85rem;

    .icon-badge {
      width: 42px;
      height: 42px;
      border-radius: 10px;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.25);
      color: #34d399;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    h2 {
      font-size: 1.2rem;
      font-weight: 700;
      color: #f8fafc;
      margin: 0;
      letter-spacing: -0.01em;
    }

    .subtitle {
      font-size: 0.8rem;
      color: #94a3b8;
      margin-top: 2px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const CloseBtn = styled.button`
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #94a3b8;
  width: 34px;
  height: 34px;
  border-radius: 8px;
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

const NavTabs = styled.div`
  display: flex;
  background: rgba(15, 23, 42, 0.85);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding: 0.5rem 1.5rem;
  gap: 0.4rem;
`;

const TabButton = styled.button<{ $active: boolean }>`
  background: ${props => (props.$active ? 'rgba(16, 185, 129, 0.12)' : 'transparent')};
  border: 1px solid ${props => (props.$active ? 'rgba(16, 185, 129, 0.3)' : 'transparent')};
  border-radius: 8px;
  color: ${props => (props.$active ? '#34d399' : '#94a3b8')};
  padding: 0.55rem 0.95rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.15s ease;

  &:hover {
    color: #f8fafc;
    background: ${props => (props.$active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.04)')};
  }
`;

const ModalBody = styled.div`
  flex: 1;
  padding: 1.25rem 1.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

// ─── Plant Matrix Styles ─────────────────────────────────────────────────────
const GridControls = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;

  .info {
    font-size: 0.85rem;
    color: #94a3b8;
    strong { color: #f8fafc; }
  }
`;

const PlantGrid = styled.div<{ $rows: number; $cols: number }>`
  display: grid;
  grid-template-columns: repeat(${props => props.$cols}, 1fr);
  gap: 0.65rem;
  background: rgba(10, 15, 26, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 1rem;
  margin-bottom: 0.5rem;

  @media (max-width: 640px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const PlantCell = styled.button<{ $occupied: boolean; $selected?: boolean }>`
  background: ${props => props.$selected ? 'rgba(16, 185, 129, 0.25)' : (props.$occupied ? 'rgba(30, 41, 59, 0.85)' : 'rgba(15, 23, 42, 0.4)')};
  border: 1.5px solid ${props => props.$selected ? '#10b981' : (props.$occupied ? 'rgba(16, 185, 129, 0.45)' : 'rgba(255, 255, 255, 0.08)')};
  border-radius: 12px;
  padding: 0.65rem 0.4rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  min-height: 85px;

  &:hover {
    transform: translateY(-2px);
    border-color: #10b981;
    box-shadow: 0 6px 16px rgba(16, 185, 129, 0.25);
  }

  .pos-tag {
    position: absolute;
    top: 4px;
    left: 6px;
    font-size: 0.62rem;
    font-weight: 800;
    color: #64748b;
    font-family: monospace;
  }

  .icon {
    font-size: 1.3rem;
    color: ${props => props.$occupied ? '#10b981' : '#334155'};
  }

  .plant-name {
    font-size: 0.72rem;
    font-weight: 800;
    color: ${props => props.$occupied ? '#f8fafc' : '#64748b'};
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 95%;
  }

  .code {
    font-size: 0.6rem;
    color: #38bdf8;
    font-family: monospace;
    font-weight: 700;
  }
`;

const PlantInspector = styled.div`
  background: rgba(30, 41, 59, 0.75);
  border: 1px solid rgba(16, 185, 129, 0.35);
  border-radius: 14px;
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  animation: ${fadeIn} 0.2s ease-out;

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    h4 { font-size: 1rem; margin: 0; color: #f8fafc; font-weight: 800; display: flex; align-items: center; gap: 0.5rem; }
    .badge { background: rgba(16, 185, 129, 0.2); color: #34d399; font-size: 0.75rem; font-weight: 800; padding: 0.2rem 0.6rem; border-radius: 12px; }
  }

  .details-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 0.75rem;
  }

  .detail-card {
    background: rgba(15, 23, 42, 0.7);
    padding: 0.6rem 0.85rem;
    border-radius: 8px;
    .lbl { font-size: 0.65rem; color: #64748b; font-weight: 700; text-transform: uppercase; }
    .val { font-size: 0.9rem; font-weight: 800; color: #f8fafc; margin-top: 2px; }
  }
`;

// ─── Timeline / Audio Incident Styles ────────────────────────────────────────
const TimelineList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
`;

const TimelineItem = styled.div<{ $isIncident?: boolean }>`
  background: ${props => props.$isIncident ? 'rgba(239, 68, 68, 0.08)' : 'rgba(30, 41, 59, 0.5)'};
  border-left: 4px solid ${props => props.$isIncident ? '#ef4444' : '#10b981'};
  border-radius: 12px;
  padding: 1rem 1.15rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$isIncident ? 'rgba(239, 68, 68, 0.12)' : 'rgba(30, 41, 59, 0.75)'};
  }

  .title { 
    font-size: 0.95rem; 
    font-weight: 800; 
    color: ${props => props.$isIncident ? '#f87171' : '#f8fafc'};
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .desc { 
    font-size: 0.82rem; 
    color: #94a3b8; 
    margin-top: 4px; 
    line-height: 1.4;
    word-break: break-word;
  }

  .time { 
    font-size: 0.75rem; 
    color: #64748b; 
    font-weight: 700; 
    white-space: nowrap;
  }
`;

const AudioPlayerBox = styled.div`
  margin-top: 0.75rem;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(56, 189, 248, 0.3);
  border-radius: 10px;
  padding: 0.6rem 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.85rem;
  flex-wrap: wrap;

  .audio-label {
    font-size: 0.75rem;
    font-weight: 800;
    color: #38bdf8;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  audio {
    height: 34px;
    outline: none;
    border-radius: 8px;
    flex: 1;
    min-width: 240px;
  }
`;

interface WorkbenchDetailModalProps {
  device: TrazAppDevice | null;
  bunkerName: string;
  roomId: string;
  onClose: () => void;
}

export const WorkbenchDetailModal: React.FC<WorkbenchDetailModalProps> = ({
  device,
  bunkerName,
  roomId,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'grid' | 'batch' | 'sensors'>('grid');
  const [selectedPos, setSelectedPos] = useState<string | null>('A1');
  const [batches, setBatches] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [newLogText, setNewLogText] = useState<string>('');

  // Fetch REAL batches & tasks from Supabase
  const fetchRealData = async () => {
    setLoading(true);
    try {
      let query = supabase.from('batches').select('*, genetic:genetics(*)');
      if (roomId && roomId !== 'default-room') {
        query = query.eq('current_room_id', roomId);
      }
      const { data: bData, error: bErr } = await query;
      if (bErr) console.error('Error fetching real batches:', bErr);
      setBatches(bData || []);

      let taskQuery = supabase.from('chakra_tasks').select('*');
      if (roomId && roomId !== 'default-room') {
        taskQuery = taskQuery.eq('room_id', roomId);
      }
      const { data: tData } = await taskQuery.order('created_at', { ascending: false });
      setTasks(tData || []);

      if (bData && bData.length > 0) {
        const firstPos = bData.find(b => b.grid_position)?.grid_position || 'A1';
        setSelectedPos(firstPos);
      }
    } catch (err) {
      console.error('Error loading DB batches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealData();
  }, [roomId]);

  // Resolve Audio URLs for Tasks/Incidents containing audio paths
  useEffect(() => {
    const resolveAudioUrls = async () => {
      const urls: Record<string, string> = {};
      for (const item of tasks) {
        const text = `${item.title || ''} ${item.description || ''} ${item.audio_url || ''}`;
        const match = text.match(/(ai_clinical_audio\/[^\s]+|\bhttps?:\/\/[^\s]+\.(?:wav|webm|mp3|ogg))/i);
        if (match) {
          const rawPath = match[0].trim();
          if (rawPath.startsWith('http')) {
            urls[item.id] = rawPath;
          } else if (supabase) {
            const cleanPath = rawPath.replace(/^ai_clinical_audio\//, '');
            const { data } = await supabase.storage.from('ai_clinical_audio').createSignedUrl(cleanPath, 86400);
            if (data?.signedUrl) {
              urls[item.id] = data.signedUrl;
            } else {
              urls[item.id] = supabase.storage.from('ai_clinical_audio').getPublicUrl(cleanPath).data.publicUrl;
            }
          }
        }
      }
      setAudioUrls(urls);
    };

    if (tasks.length > 0) {
      resolveAudioUrls();
    }
  }, [tasks]);

  // Standard 4x4 Grid layout (A1-D4)
  const rows = ['A', 'B', 'C', 'D'];
  const cols = [1, 2, 3, 4];

  // Map real database batches to grid position keys (e.g. "A1", "A2", "B1")
  const plantMap: { [pos: string]: any } = {};
  batches.forEach(b => {
    if (b.grid_position) {
      plantMap[b.grid_position.toUpperCase()] = b;
    }
  });

  const selectedBatch = selectedPos ? plantMap[selectedPos] : null;

  // Calculate days elapsed from start_date
  const getDaysElapsed = (startDateStr?: string) => {
    if (!startDateStr) return '--';
    const start = new Date(startDateStr).getTime();
    const now = Date.now();
    const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  };

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogText) return;
    try {
      const { error } = await supabase.from('chakra_tasks').insert([{
        title: 'Nota de Cultivo',
        description: `${bunkerName}: ${newLogText}`,
        room_id: roomId,
        type: 'REGULAR',
        status: 'completed'
      }]);
      if (error) throw error;

      toast.success('Nota guardada en la base de datos');
      setNewLogText('');
      fetchRealData();
    } catch (err: any) {
      toast.error('Error al guardar nota: ' + err.message);
    }
  };

  const reading = device?.last_reading?.sensors;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalCard onClick={e => e.stopPropagation()}>
        {/* Header */}
        <Header>
          <div className="left">
            <div className="icon-badge">
              <Sprout size={22} />
            </div>
            <div>
              <h2>Mesa de Trabajo — {bunkerName || 'Mesa Principal'}</h2>
              <div className="subtitle">
                <span>Dispositivo: <code>{device?.device_id || 'TrazApp_A3F2'}</code></span>
                <span>•</span>
                <span>Conexión en vivo con Base de Datos</span>
              </div>
            </div>
          </div>
          <HeaderActions>
            <CloseBtn onClick={fetchRealData} title="Refrescar datos">
              <RefreshCw size={16} />
            </CloseBtn>
            <CloseBtn onClick={onClose} title="Cerrar">
              <LucideX size={18} />
            </CloseBtn>
          </HeaderActions>
        </Header>

        {/* Navigation Tabs */}
        <NavTabs>
          <TabButton $active={activeTab === 'grid'} onClick={() => setActiveTab('grid')}>
            <LayoutGrid size={16} /> Matriz 2D ({batches.length} lotes)
          </TabButton>
          <TabButton $active={activeTab === 'batch'} onClick={() => setActiveTab('batch')}>
            <History size={16} /> Historial e Incidencias ({tasks.length})
          </TabButton>
          <TabButton $active={activeTab === 'sensors'} onClick={() => setActiveTab('sensors')}>
            <Zap size={16} /> Telemetría & Sensores
          </TabButton>
        </NavTabs>

        {/* Modal Content Body */}
        <ModalBody>
          {/* TAB 1: PLANT MATRIX GRID */}
          {activeTab === 'grid' && (
            <>
              <GridControls>
                <div className="info">
                  📐 Dimensiones: <strong>4 x 4 (16 posiciones)</strong> | Plantas en DB:{' '}
                  <strong>{batches.length} Lotes Activos</strong>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 size={14} /> Selecciona una posición para inspeccionar
                </div>
              </GridControls>

              <PlantGrid $rows={4} $cols={4}>
                {rows.map(r =>
                  cols.map(c => {
                    const posKey = `${r}${c}`;
                    const b = plantMap[posKey];
                    const isOccupied = !!b;
                    const isSelected = selectedPos === posKey;

                    return (
                      <PlantCell
                        key={posKey}
                        $occupied={isOccupied}
                        $selected={isSelected}
                        onClick={() => setSelectedPos(posKey)}
                      >
                        <span className="pos-tag">{posKey}</span>
                        <div className="icon">
                          <Sprout size={20} color={isOccupied ? '#34d399' : '#475569'} />
                        </div>
                        <div className="plant-name">
                          {isOccupied ? (b.genetic?.name || b.name || 'Planta') : 'Vacío'}
                        </div>
                        {isOccupied && <div className="code">{b.tracking_code || b.name}</div>}
                      </PlantCell>
                    );
                  })
                )}
              </PlantGrid>

              {/* Plant Inspector */}
              {selectedPos && (
                <PlantInspector>
                  <div className="header">
                    <h4>
                      <Dna size={18} color="#38bdf8" /> Planta en Posición {selectedPos}
                      {selectedBatch
                        ? ` — ${selectedBatch.genetic?.name || selectedBatch.name}`
                        : ' (Espacio Disponible)'}
                    </h4>
                    {selectedBatch && (
                      <ShadcnBadge
                        variant={selectedBatch.stage === 'flowering' ? 'amber' : 'emerald'}
                        dot
                      >
                        {selectedBatch.stage ? selectedBatch.stage.toUpperCase() : 'FLORACIÓN'}
                      </ShadcnBadge>
                    )}
                  </div>

                  {selectedBatch ? (
                    <div className="details-grid">
                      <div className="detail-card">
                        <div className="lbl">Código Trazabilidad</div>
                        <div className="val" style={{ color: '#38bdf8', fontFamily: 'monospace' }}>
                          {selectedBatch.tracking_code || selectedBatch.name}
                        </div>
                      </div>
                      <div className="detail-card">
                        <div className="lbl">Días de Ciclo</div>
                        <div className="val">{getDaysElapsed(selectedBatch.start_date)} Días</div>
                      </div>
                      <div className="detail-card">
                        <div className="lbl">Genética</div>
                        <div className="val">{selectedBatch.genetic?.name || 'Genética'}</div>
                      </div>
                      <div className="detail-card">
                        <div className="lbl">Fecha de Inicio</div>
                        <div className="val">{selectedBatch.start_date || 'En curso'}</div>
                      </div>
                    </div>
                  ) : (
                    <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
                      Posición {selectedPos} sin lote asignado en la Base de Datos. Puedes asignar un nuevo esqueje o lote desde el módulo de Cultivos.
                    </p>
                  )}
                </PlantInspector>
              )}
            </>
          )}

          {/* TAB 2: BATCH REPORT & TIMELINE INCIDENTS WITH AUDIO PLAYER */}
          {activeTab === 'batch' && (
            <>
              {/* Batch Summary */}
              <div
                style={{
                  background: 'rgba(30, 41, 59, 0.45)',
                  borderRadius: '14px',
                  padding: '1.25rem',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                <h3
                  style={{
                    margin: '0 0 1rem 0',
                    fontSize: '1.05rem',
                    color: '#f8fafc',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontWeight: 700
                  }}
                >
                  <ClipboardList size={20} color="#34d399" /> Informe de Lote e Incidencias — Mesa {bunkerName}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                      Plantas Totales
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#34d399', fontFamily: 'monospace', marginTop: 3 }}>
                      {batches.length} Unidades
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                      Genética Principal
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#38bdf8', marginTop: 3 }}>
                      {batches[0]?.genetic?.name || 'Variedad de Sala'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                      Etapa en DB
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#facc15', marginTop: 3 }}>
                      {batches[0]?.stage || 'Floración'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Add Log Entry */}
              <form onSubmit={handleAddLog} style={{ display: 'flex', gap: '0.65rem' }}>
                <input
                  type="text"
                  value={newLogText}
                  onChange={e => setNewLogText(e.target.value)}
                  placeholder="Escribir una nota de riego, mediciones pH/EC o evento del lote..."
                  style={{
                    flex: 1,
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#f8fafc',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                />
                <ShadcnButton type="submit" variant="default" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Plus size={16} /> Guardar Nota
                </ShadcnButton>
              </form>

              {/* Log Timeline with Audio Note Player */}
              <TimelineList>
                {tasks.map((task, idx) => {
                  const isIncident =
                    task.title?.includes('INCIDENCIA') || task.description?.includes('INCIDENCIA');
                  const audioUrl = audioUrls[task.id];

                  return (
                    <TimelineItem key={task.id || idx} $isIncident={isIncident}>
                      <div style={{ flex: 1 }}>
                        <div className="title">
                          {isIncident && <AlertTriangle size={18} color="#ef4444" />}
                          {task.title}
                        </div>
                        <div className="desc">{task.description}</div>

                        {/* Interactive Audio Voice Player */}
                        {audioUrl && (
                          <AudioPlayerBox>
                            <div className="audio-label">
                              <Volume2 size={16} /> <span>Nota de Voz de Incidencia</span>
                            </div>
                            <audio controls src={audioUrl} preload="metadata" />
                          </AudioPlayerBox>
                        )}
                      </div>

                      <div className="time">
                        {task.created_at
                          ? new Date(task.created_at).toLocaleDateString('es-AR')
                          : 'Reciente'}
                      </div>
                    </TimelineItem>
                  );
                })}

                {tasks.length === 0 && (
                  <p style={{ color: '#64748b', fontSize: '0.85rem', textAlign: 'center', margin: '1.5rem 0' }}>
                    No hay tareas registradas para esta sala en la Base de Datos.
                  </p>
                )}
              </TimelineList>
            </>
          )}

          {/* TAB 3: SENSORS & RELAYS */}
          {activeTab === 'sensors' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div
                  style={{
                    background: 'rgba(30, 41, 59, 0.5)',
                    padding: '1.25rem',
                    borderRadius: '14px',
                    borderLeft: '4px solid #ef4444',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Thermometer size={16} color="#ef4444" /> TEMPERATURA EN VIVO
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.35rem' }}>
                    {reading ? `${reading.temp_c}°C` : '24.6°C'}
                  </div>
                </div>

                <div
                  style={{
                    background: 'rgba(30, 41, 59, 0.5)',
                    padding: '1.25rem',
                    borderRadius: '14px',
                    borderLeft: '4px solid #38bdf8',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Droplets size={16} color="#38bdf8" /> HUMEDAD EN VIVO
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.35rem' }}>
                    {reading ? `${reading.hum_pct}%` : '56.7%'}
                  </div>
                </div>

                <div
                  style={{
                    background: 'rgba(30, 41, 59, 0.5)',
                    padding: '1.25rem',
                    borderRadius: '14px',
                    borderLeft: '4px solid #10b981',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Activity size={16} color="#10b981" /> VPD CALCULADO
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.35rem' }}>
                    {reading ? `${reading.vpd_kpa} kPa` : '0.98 kPa'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </ModalBody>
      </ModalCard>
    </ModalOverlay>
  );
};

export default WorkbenchDetailModal;
