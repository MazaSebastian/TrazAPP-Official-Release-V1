import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { FaExclamationTriangle, FaCheckCircle, FaClock, FaWifi, FaLeaf, FaVolumeUp } from 'react-icons/fa';
import { supabase, getSelectedOrgId } from '../services/supabaseClient';
import { tasksService } from '../services/tasksService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const pulseGlow = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
  100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
`;

const WidgetContainer = styled.div`
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.8));
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 1.25rem;
  padding: 1.5rem;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const WidgetHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  padding-bottom: 1rem;

  .title-group {
    display: flex;
    align-items: center;
    gap: 0.75rem;

    h2 {
      margin: 0;
      font-size: 1.2rem;
      font-weight: 800;
      color: #f8fafc;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .live-badge {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #ef4444;
      padding: 0.2rem 0.6rem;
      border-radius: 20px;
      font-size: 0.72rem;
      font-weight: 800;
      animation: ${pulseGlow} 2s infinite;
    }
  }
`;

const FilterGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  background: rgba(0, 0, 0, 0.2);
  padding: 0.25rem;
  border-radius: 8px;
`;

const FilterTab = styled.button<{ $active: boolean }>`
  background: ${p => p.$active ? '#ef4444' : 'transparent'};
  color: ${p => p.$active ? '#ffffff' : '#94a3b8'};
  border: none;
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: #ffffff;
  }
`;

const IncidentList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  max-height: 380px;
  overflow-y: auto;
  padding-right: 0.25rem;
`;

const IncidentCard = styled.div<{ $status: string }>`
  background: ${p => p.$status === 'pending' ? 'rgba(239, 68, 68, 0.05)' : 'rgba(255, 255, 255, 0.02)'};
  border: 1px solid ${p => p.$status === 'pending' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.05)'};
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  transition: all 0.2s;

  &:hover {
    border-color: ${p => p.$status === 'pending' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 255, 255, 0.1)'};
    transform: translateY(-1px);
  }

  .card-top {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .title {
      font-size: 0.95rem;
      font-weight: 800;
      color: #f8fafc;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .time {
      font-size: 0.75rem;
      color: #64748b;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
  }

  .desc {
    font-size: 0.82rem;
    color: #cbd5e1;
    line-height: 1.4;
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 0.25rem;
    padding-top: 0.5rem;
    border-top: 1px dashed rgba(255, 255, 255, 0.05);

    .source-tag {
      font-size: 0.72rem;
      font-weight: 700;
      color: #10b981;
      display: flex;
      align-items: center;
      gap: 0.35rem;
      background: rgba(16, 185, 129, 0.1);
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
    }

    .action-btn {
      background: ${p => p.$status === 'pending' ? '#10b981' : '#334155'};
      color: white;
      border: none;
      padding: 0.35rem 0.75rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.35rem;

      &:hover {
        opacity: 0.9;
      }
    }
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2.5rem 1rem;
  color: #64748b;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;

  span {
    font-size: 0.88rem;
  }
`;

export const IncidentsMonitorWidget: React.FC = () => {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [filter, setFilter] = useState<'pending' | 'done' | 'all'>('pending');
  const [loading, setLoading] = useState(true);

  const fetchIncidents = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('chakra_tasks')
        .select('*')
        .eq('organization_id', getSelectedOrgId())
        .or('type.eq.incidencia,description.ilike.%[INCIDENCIA%')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIncidents(data || []);
    } catch (err) {
      console.error("Error fetching incidents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();

    // Subscribe to Supabase Realtime for instant IoT incident alerts
    if (supabase) {
      const channel = supabase
        .channel('chakra_tasks_incidents_realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'chakra_tasks' },
          () => {
            fetchIncidents();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  const handleResolve = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'pending' ? 'done' : 'pending';
    await tasksService.updateStatus(id, nextStatus as any);
    fetchIncidents();
  };

  const filteredIncidents = incidents.filter(item => {
    if (filter === 'pending') return item.status === 'pending';
    if (filter === 'done') return item.status === 'done';
    return true;
  });

  const pendingCount = incidents.filter(i => i.status === 'pending').length;

  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    const resolveAudioUrls = async () => {
      const urls: Record<string, string> = {};
      for (const item of incidents) {
        const text = (item.description || '') + ' ' + (item.audio_url || '');
        const match = text.match(/(ai_clinical_audio\/[^\s]+|\bhttps?:\/\/[^\s]+\.(?:wav|webm|mp3|ogg))/i);
        if (match) {
          const rawPath = match[0];
          if (rawPath.startsWith('http')) {
            urls[item.id] = rawPath;
          } else {
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
      setSignedUrls(urls);
    };

    if (incidents.length > 0) {
      resolveAudioUrls();
    }
  }, [incidents]);

  return (
    <WidgetContainer>
      <WidgetHeader>
        <div className="title-group">
          <h2><FaExclamationTriangle style={{ color: '#ef4444' }} /> Incidencias IoT & Cultivo</h2>
          {pendingCount > 0 && (
            <span className="live-badge">
              {pendingCount} PENDIENTE{pendingCount > 1 ? 'S' : ''}
            </span>
          )}
        </div>

        <FilterGroup>
          <FilterTab $active={filter === 'pending'} onClick={() => setFilter('pending')}>
            Pendientes
          </FilterTab>
          <FilterTab $active={filter === 'done'} onClick={() => setFilter('done')}>
            Resueltas
          </FilterTab>
          <FilterTab $active={filter === 'all'} onClick={() => setFilter('all')}>
            Todas ({incidents.length})
          </FilterTab>
        </FilterGroup>
      </WidgetHeader>

      <IncidentList>
        {loading ? (
          <EmptyState>
            <span>Cargando incidencias...</span>
          </EmptyState>
        ) : filteredIncidents.length === 0 ? (
          <EmptyState>
            <FaCheckCircle size={28} style={{ color: '#10b981' }} />
            <span>No hay incidencias {filter === 'pending' ? 'pendientes' : ''}. ¡Cultivo bajo control!</span>
          </EmptyState>
        ) : (
          filteredIncidents.map(item => {
            const audioUrl = signedUrls[item.id];
            return (
              <IncidentCard key={item.id} $status={item.status}>
                <div className="card-top">
                  <span className="title">
                    <FaWifi style={{ color: '#ef4444' }} /> {item.title}
                  </span>
                  <span className="time">
                    <FaClock /> {format(new Date(item.created_at), 'dd/MM HH:mm', { locale: es })}
                  </span>
                </div>

                <div className="desc">
                  {item.description || 'Reporte registrado desde dispositivo IoT.'}
                  {item.rooms?.name && (
                    <div style={{ marginTop: '0.25rem', color: '#10b981', fontWeight: 700 }}>
                      Sala: {item.rooms.name}
                    </div>
                  )}
                  {audioUrl && (
                    <div style={{ marginTop: '0.6rem' }}>
                      <audio controls src={audioUrl} style={{ width: '100%', height: '36px', borderRadius: '8px' }} />
                    </div>
                  )}
                </div>

                <div className="card-footer">
                  <span className="source-tag">
                    <FaWifi /> TrazApp IoT Hardware
                  </span>

                  <button
                    className="action-btn"
                    onClick={() => handleResolve(item.id, item.status)}
                  >
                    <FaCheckCircle /> {item.status === 'pending' ? 'Marcar Resuelta' : 'Reabrir'}
                  </button>
                </div>
              </IncidentCard>
            );
          })
        )}
      </IncidentList>
    </WidgetContainer>
  );
};
