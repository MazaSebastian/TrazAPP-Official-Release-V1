import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../services/supabaseClient';
import { FaLeaf, FaCalendarAlt, FaStar, FaTags, FaInfoCircle, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import { Batch } from '../types/rooms';

// --- Styled Components ---

const PublicContainer = styled.div`
  min-height: 100vh;
  background-color: #020617;
  color: #f8fafc;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1rem;
  font-family: 'Inter', sans-serif;
`;

const ContentWrapper = styled.div`
  width: 100%;
  max-width: 500px;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 1.5rem;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  animation: slideUp 0.5s ease-out;

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const HeaderImage = styled.div<{ $bgImage?: string | null }>`
  height: 250px;
  width: 100%;
  background-color: #1e293b;
  background-image: ${props => props.$bgImage ? `url(${props.$bgImage})` : 'none'};
  background-size: cover;
  background-position: center;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 50%;
    background: linear-gradient(to top, rgba(15, 23, 42, 1), transparent);
  }
`;

const FallbackIcon = styled(FaLeaf)`
  font-size: 5rem;
  color: rgba(255, 255, 255, 0.1);
`;

const LogoOverlay = styled.img`
  position: absolute;
  top: 1.5rem;
  left: 1.5rem;
  height: 30px;
  z-index: 10;
  opacity: 0.9;
`;

const StatusBadge = styled.div`
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
  border: 1px solid rgba(34, 197, 94, 0.5);
  padding: 0.4rem 1rem;
  border-radius: 2rem;
  font-size: 0.8rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  z-index: 10;
  backdrop-filter: blur(4px);
`;

const Body = styled.div`
  padding: 2rem;
  position: relative;
  z-index: 5;
  margin-top: -2rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 800;
  margin: 0;
  color: #fff;
  letter-spacing: -0.02em;
`;

const Subtitle = styled.div`
  font-size: 1rem;
  color: #94a3b8;
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: monospace;
`;

const Divider = styled.div`
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  margin: 1.5rem 0;
`;

const Section = styled.div`
  margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h3`
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const NoteBox = styled.div`
  background: rgba(0, 0, 0, 0.2);
  border-left: 3px solid #38bdf8;
  padding: 1rem;
  border-radius: 0 0.5rem 0.5rem 0;
  font-size: 0.95rem;
  color: #e2e8f0;
  line-height: 1.5;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
`;

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: 1rem;
  border-radius: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const StatLabel = styled.span`
  font-size: 0.75rem;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const StatValue = styled.span`
  font-size: 1.1rem;
  font-weight: 700;
  color: #f8fafc;
`;

const Footer = styled.div`
  margin-top: 2rem;
  text-align: center;
  color: #475569;
  font-size: 0.85rem;
`;

const CenteredLoading = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #020617;
  color: #38bdf8;
  gap: 1rem;
  
  svg {
    animation: spin 1s linear infinite;
    font-size: 2rem;
  }
  
  @keyframes spin {
    100% { transform: rotate(360deg); }
  }
`;

const ErrorCard = styled(ContentWrapper)`
  padding: 2rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  
  h2 { color: #f87171; margin: 0; }
  p { color: #94a3b8; margin: 0; }
`;

// --- Main Component ---

export const PublicTracking: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [batchData, setBatchData] = useState<any>(null);

    useEffect(() => {
        const fetchBatchData = async () => {
            try {
                if (!id) {
                    setError('ID de lote no proporcionado.');
                    return;
                }

                // We use the ID to query the batch.
                // We also need to join genetic data.
                // NOTE: Make sure Supabase policies allow SELECT on batches and genetics for anon users,
                // OR we might need to use a specific RPC function if the tables are locked down.
                // Since we want this public, we'll try a direct query first.

                // Wait! Security consideration: We only want to expose specific fields.
                const { data, error: fetchError } = await supabase
                    .from('batches')
                    .select(`
            id,
            tracking_code,
            name,
            start_date,
            genetic:genetics (
              name,
              description,
              photo_url,
              thc_percent,
              cbd_percent,
              flowering_weeks
            )
          `)
                    .eq('tracking_code', id) // Allow searching by tracking code
                    .single();

                if (fetchError && fetchError.code === 'PGRST116') {
                    // Fallback to searching by ID if it's not a tracking code
                    const { data: dataById, error: fetchByIdError } = await supabase
                        .from('batches')
                        .select(`
              id,
              tracking_code,
              name,
              start_date,
              genetic:genetics (
                name,
                description,
                photo_url,
                thc_percent,
                cbd_percent,
                flowering_weeks
              )
            `)
                        .eq('id', id)
                        .single();

                    if (fetchByIdError) throw fetchByIdError;
                    if (dataById) setBatchData(dataById);
                } else if (fetchError) {
                    throw fetchError;
                } else {
                    setBatchData(data);
                }

            } catch (err: any) {
                console.error('Error fetching public batch:', err);
                setError('No se pudo encontrar la información para este lote.');
            } finally {
                setLoading(false);
            }
        };

        fetchBatchData();
    }, [id]);

    if (loading) {
        return (
            <CenteredLoading>
                <FaSpinner />
                <span>Verificando origen del Lote...</span>
            </CenteredLoading>
        );
    }

    if (error || !batchData) {
        return (
            <PublicContainer>
                <ErrorCard>
                    <img src="/trazapphorizontal.png" alt="TrazApp" style={{ height: '30px', opacity: 0.5, marginBottom: '1rem' }} />
                    <h2>Lote No Encontrado</h2>
                    <p>{error || 'El código escaneado no existe o no está disponible públicamente.'}</p>
                    <Link to="/" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 'bold', marginTop: '1rem' }}>
                        Ir a la página principal
                    </Link>
                </ErrorCard>
            </PublicContainer>
        );
    }

    const genetic = batchData.genetic || {};
    const hasNotes = genetic.description && genetic.description.trim().length > 0;

    // Format Date safely
    let formattedDate = 'Fecha no disponible';
    if (batchData.start_date) {
        try {
            const dateObj = new Date(batchData.start_date);
            formattedDate = dateObj.toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' });
        } catch (e) { }
    }

    return (
        <PublicContainer>
            <ContentWrapper>
                <HeaderImage $bgImage={genetic.photo_url}>
                    <LogoOverlay src="/trazapphorizontal.png" alt="TrazApp" />
                    <StatusBadge>
                        <FaCheckCircle /> Verificado
                    </StatusBadge>
                    {!genetic.photo_url && <FallbackIcon />}
                </HeaderImage>

                <Body>
                    <Title>{genetic.name || batchData.name}</Title>
                    <Subtitle>
                        <FaTags /> Lote: {batchData.tracking_code || 'N/A'}
                    </Subtitle>

                    <Divider />

                    <Section>
                        <SectionTitle><FaInfoCircle /> Perfil de Genética</SectionTitle>
                        {hasNotes ? (
                            <NoteBox>{genetic.description}</NoteBox>
                        ) : (
                            <NoteBox style={{ color: '#64748b', fontStyle: 'italic', borderLeftColor: '#475569' }}>
                                No hay notas de cata o comerciales ingresadas para esta genética.
                            </NoteBox>
                        )}
                    </Section>

                    <Section>
                        <SectionTitle><FaStar /> Información Técnica</SectionTitle>
                        <StatsGrid>
                            <StatCard>
                                <StatLabel>THC Estimado</StatLabel>
                                <StatValue style={{ color: genetic.thc_percent ? '#a855f7' : '#64748b' }}>
                                    {genetic.thc_percent ? `${genetic.thc_percent}%` : '--'}
                                </StatValue>
                            </StatCard>
                            <StatCard>
                                <StatLabel>CBD Estimado</StatLabel>
                                <StatValue style={{ color: genetic.cbd_percent ? '#4ade80' : '#64748b' }}>
                                    {genetic.cbd_percent ? `${genetic.cbd_percent}%` : '--'}
                                </StatValue>
                            </StatCard>
                            <StatCard>
                                <StatLabel>Tiempo de Flora</StatLabel>
                                <StatValue>{genetic.flowering_weeks ? `${genetic.flowering_weeks} sem` : '--'}</StatValue>
                            </StatCard>
                            <StatCard>
                                <StatLabel>Fecha de Registro</StatLabel>
                                <StatValue style={{ fontSize: '0.9rem' }}>{formattedDate}</StatValue>
                            </StatCard>
                        </StatsGrid>
                    </Section>
                </Body>

            </ContentWrapper>

            <Footer>
                Operando de manera segura con trazabilidad de <strong style={{ color: '#fff' }}>TrazApp®</strong>.
            </Footer>
        </PublicContainer>
    );
};
