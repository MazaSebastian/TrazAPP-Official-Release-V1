import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useOrganization } from '../../context/OrganizationContext';
import { FaUser, FaIdCard, FaPhone, FaEnvelope, FaCalendarAlt, FaCheckCircle, FaClock, FaTimesCircle, FaFileImage, FaSpinner, FaUpload } from 'react-icons/fa';

/* ============= STYLES ============= */
const Container = styled.div`
  max-width: 900px;
  width: 100%;
`;

const Header = styled.div`
  margin-bottom: 2rem;
  h2 {
    font-size: 2rem;
    color: var(--primary-color, #4ade80);
    margin: 0 0 0.5rem 0;
  }
  p { color: #94a3b8; font-size: 1.1rem; margin: 0; }
`;

const Card = styled.div`
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 1.5rem;
  backdrop-filter: blur(8px);

  @media (max-width: 640px) {
    padding: 1.25rem;
  }
`;

const CardTitle = styled.h3`
  color: #f8fafc;
  font-size: 1.15rem;
  margin: 0 0 1.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  svg { color: var(--primary-color, #4ade80); }
`;

const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.25rem;
`;

const FieldItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const FieldLabel = styled.span`
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  font-weight: 600;
`;

const FieldValue = styled.span`
  color: #e2e8f0;
  font-size: 1rem;
`;

const Badge = styled.span<{ variant: 'success' | 'warning' | 'danger' | 'neutral' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.75rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  width: fit-content;
  ${({ variant }) => {
    const map = {
      success: 'background: rgba(34,197,94,0.15); color: #4ade80;',
      warning: 'background: rgba(245,158,11,0.15); color: #fbbf24;',
      danger: 'background: rgba(239,68,68,0.15); color: #f87171;',
      neutral: 'background: rgba(148,163,184,0.15); color: #94a3b8;'
    };
    return map[variant];
  }}
`;

const DocGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.25rem;
`;

const DocCard = styled.div`
  background: rgba(0,0,0,0.2);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  padding: 1rem;
  text-align: center;
  position: relative;
  overflow: hidden;

  img {
    width: 100%;
    height: 140px;
    object-fit: cover;
    border-radius: 8px;
    margin-bottom: 0.75rem;
    cursor: pointer;
    transition: transform 0.2s;
    &:hover { transform: scale(1.03); }
  }

  .doc-label {
    font-weight: 600;
    color: #cbd5e1;
    font-size: 0.85rem;
  }
`;

const EmptyDocSlot = styled.label`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 2rem 1rem;
  border: 2px dashed rgba(255,255,255,0.12);
  border-radius: 12px;
  cursor: pointer;
  color: #64748b;
  transition: all 0.2s;

  &:hover {
    border-color: var(--primary-color, #4ade80);
    background: rgba(74, 222, 128, 0.03);
    color: #94a3b8;
  }

  svg { font-size: 1.5rem; }

  input { display: none; }
`;

const Loader = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  color: #64748b;
  svg { animation: spin 1s linear infinite; font-size: 2rem; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

/* ============= COMPONENT ============= */
export const MyDataSection: React.FC = () => {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();

  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [user, currentOrganization]);

  const fetchData = async () => {
    if (!user || !currentOrganization) return;
    setLoading(true);
    try {
      const { data: patientData } = await supabase
        .from('aurora_patients')
        .select('*, profile:profiles(*)')
        .eq('profile_id', user.id)
        .eq('organization_id', currentOrganization.id)
        .single();

      if (patientData) {
        setPatient(patientData);
        setProfile(patientData.profile);
      }
    } catch (err) {
      console.error('Error fetching patient data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    if (!e.target.files?.length || !patient || !currentOrganization) return;
    setUploading(field);
    try {
      const file = e.target.files[0];
      const ext = file.name.split('.').pop();
      const path = `${currentOrganization.id}/${patient.id}_${field}_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('kyc_documents')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('kyc_documents')
        .getPublicUrl(path);

      await supabase
        .from('aurora_patients')
        .update({ [field]: publicUrl })
        .eq('id', patient.id);

      setPatient((prev: any) => ({ ...prev, [field]: publicUrl }));
    } catch (err) {
      console.error('Upload error:', err);
      alert('Error al subir el archivo.');
    } finally {
      setUploading(null);
    }
  };

  const reprocannStatusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' }> = {
    active: { label: 'Vigente', variant: 'success' },
    pending: { label: 'Pendiente', variant: 'warning' },
    expired: { label: 'Vencido', variant: 'danger' },
    none: { label: 'Sin REPROCANN', variant: 'neutral' }
  };

  if (loading) {
    return <Loader><FaSpinner /></Loader>;
  }

  if (!patient) {
    return (
      <Container>
        <Header>
          <h2>Mis Datos</h2>
          <p>No se encontraron datos del paciente.</p>
        </Header>
      </Container>
    );
  }

  const reprocann = reprocannStatusMap[patient.reprocann_status] || reprocannStatusMap.none;

  return (
    <Container>
      <Header>
        <h2>Mis Datos</h2>
        <p>Información personal y documentación asociada a tu membresía.</p>
      </Header>

      {/* Personal Data */}
      <Card>
        <CardTitle><FaUser /> Datos Personales</CardTitle>
        <FieldGrid>
          <FieldItem>
            <FieldLabel>Nombre Completo</FieldLabel>
            <FieldValue>{profile?.full_name || patient.profile?.full_name || '—'}</FieldValue>
          </FieldItem>
          <FieldItem>
            <FieldLabel>DNI / Documento</FieldLabel>
            <FieldValue>{patient.document_number || '—'}</FieldValue>
          </FieldItem>
          <FieldItem>
            <FieldLabel><FaEnvelope style={{ marginRight: 4 }} /> Email</FieldLabel>
            <FieldValue>{profile?.email || user?.email || '—'}</FieldValue>
          </FieldItem>
          <FieldItem>
            <FieldLabel><FaPhone style={{ marginRight: 4 }} /> Teléfono</FieldLabel>
            <FieldValue>{profile?.phone_mobile || patient.phone || '—'}</FieldValue>
          </FieldItem>
          <FieldItem>
            <FieldLabel><FaCalendarAlt style={{ marginRight: 4 }} /> Fecha de Nacimiento</FieldLabel>
            <FieldValue>{patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString('es-AR') : '—'}</FieldValue>
          </FieldItem>
          <FieldItem>
            <FieldLabel>Patología</FieldLabel>
            <FieldValue>{patient.pathology || '—'}</FieldValue>
          </FieldItem>
        </FieldGrid>
      </Card>

      {/* REPROCANN */}
      <Card>
        <CardTitle><FaIdCard /> Estado REPROCANN</CardTitle>
        <FieldGrid>
          <FieldItem>
            <FieldLabel>Estado</FieldLabel>
            <Badge variant={reprocann.variant}>
              {reprocann.variant === 'success' ? <FaCheckCircle /> : reprocann.variant === 'warning' ? <FaClock /> : reprocann.variant === 'danger' ? <FaTimesCircle /> : null}
              {reprocann.label}
            </Badge>
          </FieldItem>
          <FieldItem>
            <FieldLabel>Número REPROCANN</FieldLabel>
            <FieldValue>{patient.reprocann_number || '—'}</FieldValue>
          </FieldItem>
          <FieldItem>
            <FieldLabel>Fecha de Emisión</FieldLabel>
            <FieldValue>{patient.reprocann_issue_date ? new Date(patient.reprocann_issue_date).toLocaleDateString('es-AR') : '—'}</FieldValue>
          </FieldItem>
          <FieldItem>
            <FieldLabel>Fecha de Vencimiento</FieldLabel>
            <FieldValue>{patient.expiration_date ? new Date(patient.expiration_date).toLocaleDateString('es-AR') : '—'}</FieldValue>
          </FieldItem>
        </FieldGrid>
      </Card>

      {/* Membership status */}
      <Card>
        <CardTitle><FaCheckCircle /> Estado de Membresía</CardTitle>
        <FieldGrid>
          <FieldItem>
            <FieldLabel>Aprobación</FieldLabel>
            <Badge variant={patient.is_approved_by_org ? 'success' : 'warning'}>
              {patient.is_approved_by_org ? <><FaCheckCircle /> Aprobado</> : <><FaClock /> Pendiente de Aprobación</>}
            </Badge>
          </FieldItem>
          <FieldItem>
            <FieldLabel>Límite Mensual</FieldLabel>
            <FieldValue>{patient.monthly_limit || 40}g</FieldValue>
          </FieldItem>
          <FieldItem>
            <FieldLabel>Miembro desde</FieldLabel>
            <FieldValue>{patient.created_at ? new Date(patient.created_at).toLocaleDateString('es-AR') : '—'}</FieldValue>
          </FieldItem>
        </FieldGrid>
      </Card>

      {/* Documents */}
      <Card>
        <CardTitle><FaFileImage /> Documentación</CardTitle>
        <DocGrid>
          {renderDocSlot('DNI (Frente)', patient.file_dni_front_url, 'file_dni_front_url')}
          {renderDocSlot('DNI (Dorso)', patient.file_dni_back_url, 'file_dni_back_url')}
          {renderDocSlot('REPROCANN (Frente)', patient.file_reprocann_url, 'file_reprocann_url')}
          {renderDocSlot('REPROCANN (Dorso)', patient.file_reprocann_back_url, 'file_reprocann_back_url')}
        </DocGrid>
      </Card>
    </Container>
  );

  function renderDocSlot(label: string, url: string | null, field: string) {
    if (url) {
      return (
        <DocCard key={field}>
          <img src={url} alt={label} onClick={() => window.open(url, '_blank')} />
          <div className="doc-label">{label}</div>
        </DocCard>
      );
    }
    return (
      <EmptyDocSlot key={field}>
        {uploading === field ? <FaSpinner className="fa-spin" /> : <FaUpload />}
        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{label}</span>
        <span style={{ fontSize: '0.75rem' }}>Haz clic para subir</span>
        <input type="file" accept="image/*" onChange={(e) => handleDocUpload(e, field)} disabled={uploading !== null} />
      </EmptyDocSlot>
    );
  }
};
