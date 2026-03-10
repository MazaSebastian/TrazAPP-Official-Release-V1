import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { supabase } from '../../services/supabaseClient';
import { SystemHealth } from '../../components/admin/SystemHealth';
import { FaHeartbeat, FaBullhorn, FaPlus, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';

const Container = styled.div`
  padding: 2rem;
  padding-top: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;
  color: #f8fafc;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  color: #f8fafc;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Button = styled.button<{ $variant?: 'primary' | 'danger' }>`
  background: ${props => props.$variant === 'danger' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(168, 85, 247, 0.2)'};
  color: ${props => props.$variant === 'danger' ? '#fca5a5' : '#d8b4fe'};
  border: 1px solid ${props => props.$variant === 'danger' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(168, 85, 247, 0.5)'};
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    background: ${props => props.$variant === 'danger' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(168, 85, 247, 0.4)'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const BroadcastForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
  background: rgba(15, 23, 42, 0.5);
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);

  input, select, textarea {
    padding: 0.75rem;
    border-radius: 8px;
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #f8fafc;
    font-family: inherit;
  }

  textarea {
    resize: vertical;
    min-height: 100px;
  }
`;

const AnnouncementCard = styled.div<{ $type: string, $active: boolean }>`
  padding: 1rem;
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.6);
  border-left: 4px solid ${props =>
    props.$type === 'danger' ? '#ef4444' :
      props.$type === 'warning' ? '#f59e0b' :
        props.$type === 'success' ? '#10b981' : '#3b82f6'};
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  opacity: ${props => props.$active ? 1 : 0.6};
`;

const SystemMonitoring: React.FC = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({ message: '', type: 'info' });

  const fetchAnnouncements = async () => {
    const { data } = await supabase
      .from('system_announcements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setAnnouncements(data);
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreate = async () => {
    if (!form.message.trim()) return alert("El mensaje no puede estar vacío");
    setIsLoading(true);
    try {
      // Deactivate all others first (optional, but good practice for global banner)
      await supabase.from('system_announcements').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000');

      const { error } = await supabase.from('system_announcements').insert([{
        message: form.message,
        type: form.type,
        is_active: true
      }]);
      if (error) throw error;
      setForm({ message: '', type: 'info' });
      fetchAnnouncements();
      alert("Anuncio publicado exitosamente. Todos los usuarios lo verán en tiempo real.");
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    if (!currentStatus) {
      // If activating, deactivate others
      await supabase.from('system_announcements').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000');
    }

    await supabase.from('system_announcements').update({ is_active: !currentStatus }).eq('id', id);
    fetchAnnouncements();
  };

  const deleteAnnouncement = async (id: string) => {
    if (window.confirm("¿Borrar definitivamente?")) {
      await supabase.from('system_announcements').delete().eq('id', id);
      fetchAnnouncements();
    }
  };

  return (
    <Container>
      <Header>
        <Title>
          <FaHeartbeat /> Monitoreo de Infraestructura
        </Title>
      </Header>

      <SystemHealth />

      <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

        <div style={{ padding: '1.5rem', background: 'rgba(30, 41, 59, 0.6)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <h3 style={{ color: '#f8fafc', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaBullhorn /> Redactar Anuncio Global
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Este aviso aparecerá flotando en la pantalla de TODAS las empresas en tiempo real. Soporta código HTML básico (ej. <code>&lt;b&gt;negrita&lt;/b&gt;</code>).</p>

          <BroadcastForm>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', color: '#cbd5e1' }}>Nivel de Alerta</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="info">INFO (Azul) - Novedades generales</option>
                <option value="success">SUCCESS (Verde) - Mejoras o buenas noticias</option>
                <option value="warning">WARNING (Amarillo) - Mantenimiento programado</option>
                <option value="danger">DANGER (Rojo) - Falla crítica o corte inminente</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', color: '#cbd5e1' }}>Mensaje</label>
              <textarea
                placeholder="Ej: Mantenimiento programado v1.5 para el viernes a las 03:00 AM AST..."
                value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
              />
            </div>

            <Button onClick={handleCreate} disabled={isLoading} style={{ alignSelf: 'flex-start' }}>
              <FaBullhorn /> {isLoading ? 'Publicando...' : 'Publicar Anuncio In-App'}
            </Button>
          </BroadcastForm>
        </div>

        <div style={{ padding: '1.5rem', background: 'rgba(30, 41, 59, 0.6)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <h3 style={{ color: '#f8fafc', margin: '0 0 1rem 0' }}>Historial de Anuncios</h3>

          {announcements.length === 0 ? (
            <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>No hay anuncios históricos cados.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {announcements.map(ann => (
                <AnnouncementCard key={ann.id} $type={ann.type} $active={ann.is_active}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                      {new Date(ann.created_at).toLocaleDateString()} - {ann.type.toUpperCase()}
                      {ann.is_active && <span style={{ color: '#4ade80', marginLeft: '0.5rem', fontWeight: 600 }}>[ACTIVO AHORA]</span>}
                    </div>
                    <div dangerouslySetInnerHTML={{ __html: ann.message }} style={{ fontSize: '0.9rem' }} />
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                    <button
                      onClick={() => toggleActive(ann.id, ann.is_active)}
                      title={ann.is_active ? "Apagar anuncio" : "Re-publicar anuncio"}
                      style={{ background: 'transparent', border: 'none', color: ann.is_active ? '#f59e0b' : '#3b82f6', cursor: 'pointer', fontSize: '1.2rem' }}
                    >
                      {ann.is_active ? <FaTimes /> : <FaCheck />}
                    </button>
                    <button
                      onClick={() => deleteAnnouncement(ann.id)}
                      title="Eliminar historial"
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.1rem' }}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </AnnouncementCard>
              ))}
            </div>
          )}
        </div>

      </div>
    </Container>
  );
};

export default SystemMonitoring;
