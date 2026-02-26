import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaBarcode, FaBox, FaCalendarAlt, FaCut, FaMapMarkerAlt, FaSeedling, FaTag, FaPrint } from 'react-icons/fa';
import { roomsService } from '../services/roomsService';
import { Batch } from '../types/rooms';
import { LoadingSpinner } from '../components/LoadingSpinner';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
    padding: 2rem;
    padding-top: 1.5rem;
    max-width: 1000px;
    margin: 0 auto;
    animation: ${fadeIn} 0.5s ease-in-out;
`;

const Header = styled.div`
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 2rem;
    
    h1 {
        font-size: 2rem;
        font-weight: 800;
        color: #f8fafc;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
`;

const BackButton = styled.button`
    background: rgba(15, 23, 42, 0.4);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #e2e8f0;
    width: 40px;
    height: 40px;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: rgba(255, 255, 255, 0.1);
        transform: translateY(-2px);
    }
`;

const ActionButton = styled.button`
    background: rgba(15, 23, 42, 0.4);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #e2e8f0;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
    font-weight: 600;

    &:hover {
        background: rgba(255, 255, 255, 0.1);
        transform: translateY(-2px);
    }
`;

const GlassCard = styled.div`
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 1.5rem;
    padding: 2rem;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    margin-bottom: 2rem;
`;

const MetaGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const MetaItem = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 1rem;

    .icon-wrapper {
        width: 40px;
        height: 40px;
        border-radius: 0.75rem;
        background: rgba(56, 189, 248, 0.1);
        color: #38bdf8;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.25rem;
    }

    .info {
        display: flex;
        flex-direction: column;

        span.label {
            font-size: 0.75rem;
            color: #94a3b8;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 0.25rem;
        }

        span.value {
            font-size: 1.1rem;
            color: #f8fafc;
            font-weight: 700;
        }
    }
`;

const UnitsSection = styled.div`
    margin-top: 3rem;

    h2 {
        font-size: 1.5rem;
        color: #f8fafc;
        margin-bottom: 1.5rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
`;

const UnitsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 1rem;
`;

const UnitCard = styled.div`
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 0.75rem;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s;

    &:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(56, 189, 248, 0.3);
        transform: translateY(-2px);
    }

    cursor: pointer;

    .identifier {
        font-family: 'Courier New', monospace;
        font-weight: 800;
        color: #e2e8f0;
        font-size: 1rem;
    }

    .icon {
        color: #64748b;
        font-size: 1.5rem;
    }
`;


export const BatchDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [batch, setBatch] = useState<Batch | null>(null);
    const [childBatches, setChildBatches] = useState<Batch[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchBatch = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const data = await roomsService.getBatchById(id);

                if (data) {
                    // Try fetching structural children first
                    let children = await roomsService.getChildBatches(id);

                    // If no structural children (i.e. this batch is an individual clone representing a visual group)
                    // Then fetch its "brother" smart group units!
                    if (children.length === 0 && (data.stage === 'seedling' || data.stage === 'clones')) {
                        children = await roomsService.getSmartGroupUnits(data);
                        // Filter itself out from the children list if it's considered the "root" representative
                        children = children.filter(c => c.id !== data.id);
                    }

                    setBatch(data);
                    setChildBatches(children);
                } else {
                    setError('Lote no encontrado.');
                }
            } catch (err: any) {
                console.error('Error loading batch:', err);
                setError('Error al cargar la información del lote.');
            } finally {
                setLoading(false);
            }
        };

        fetchBatch();
    }, [id]);

    if (loading) {
        return (
            <Container style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <LoadingSpinner />
            </Container>
        );
    }

    if (error || !batch) {
        return (
            <Container>
                <Header>
                    <BackButton onClick={() => navigate(-1)}><FaArrowLeft /></BackButton>
                    <h1>Error</h1>
                </Header>
                <GlassCard style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <p style={{ color: '#ef4444', fontSize: '1.25rem' }}>{error || 'Lote no encontrado.'}</p>
                    <button
                        onClick={() => navigate('/clones')}
                        style={{ marginTop: '1.5rem', padding: '0.75rem 1.5rem', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '0.5rem', color: 'white', cursor: 'pointer' }}
                    >
                        Volver a Clones
                    </button>
                </GlassCard>
            </Container>
        );
    }

    const formatBatchDate = (dateString: string) => {
        const d = new Date(dateString);
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear().toString().slice(-2);
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    };

    let displayName = batch.name || '';
    if (batch) {
        const nomenclature = batch.genetic?.nomenclatura || (batch.genetic?.name ? batch.genetic.name.substring(0, 3).toUpperCase() : 'UNK');
        const rootFormattedDate = formatBatchDate(batch.created_at);
        if (displayName.toLowerCase().includes('lote') && displayName.includes('-')) {
            const idPart = displayName.split('-')[0].trim();
            displayName = `${idPart} - ${nomenclature} - ${rootFormattedDate}`;
        } else if (displayName.toLowerCase().startsWith('lote')) {
            displayName = `${displayName} - ${nomenclature} - ${rootFormattedDate}`;
        } else {
            const shortId = batch.id ? batch.id.substring(0, 4).toUpperCase() : '0000';
            displayName = `Lote ${shortId} - ${nomenclature} - ${rootFormattedDate}`;
        }
    }

    const allUnits = [batch, ...childBatches];

    return (
        <Container>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '2rem', margin: '0', color: '#f8fafc', fontFamily: "'Courier New', monospace", letterSpacing: '1px' }}>
                        {displayName}
                    </h2>
                    <span style={{ background: 'rgba(74, 222, 128, 0.1)', color: '#4ade80', border: '1px solid rgba(74, 222, 128, 0.3)', padding: '0.2rem 0.75rem', borderRadius: '4px', fontSize: '1.1rem', fontWeight: 'bold' }}>
                        {allUnits.length}u
                    </span>
                    <span style={{ display: 'inline-block', padding: '0.25rem 0.75rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', borderRadius: '1rem', fontSize: '1rem', fontWeight: 600 }}>
                        {batch.genetic?.name || 'Genética Desconocida'}
                    </span>
                </div>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <ActionButton onClick={() => window.print()} title="Imprimir Ficha">
                        <FaPrint /> Imprimir
                    </ActionButton>
                    <ActionButton onClick={() => navigate(-1)} title="Volver al Listado">
                        <FaArrowLeft /> Volver
                    </ActionButton>
                </div>
            </div>

            <GlassCard>

                <MetaGrid>
                    <MetaItem>
                        <div className="icon-wrapper"><FaCalendarAlt /></div>
                        <div className="info">
                            <span className="label">Creación</span>
                            <span className="value">{new Date(batch.start_date || batch.created_at).toLocaleDateString()}</span>
                        </div>
                    </MetaItem>
                    <MetaItem>
                        <div className="icon-wrapper" style={{ background: 'rgba(74, 222, 128, 0.1)', color: '#4ade80' }}><FaTag /></div>
                        <div className="info">
                            <span className="label">Cantidad Total</span>
                            <span className="value">{allUnits.length} unidades</span>
                        </div>
                    </MetaItem>
                    <MetaItem>
                        <div className="icon-wrapper" style={{ background: 'rgba(192, 132, 252, 0.1)', color: '#c084fc' }}><FaMapMarkerAlt /></div>
                        <div className="info">
                            <span className="label">Sala / Destino</span>
                            <span className="value">{batch.room?.name || '---'} {batch.room?.type ? `(${batch.room.type})` : ''}</span>
                        </div>
                    </MetaItem>
                    <MetaItem>
                        <div className="icon-wrapper" style={{ background: 'rgba(250, 204, 21, 0.1)', color: '#facc15' }}><FaSeedling /></div>
                        <div className="info">
                            <span className="label">Estado Actual</span>
                            <span className="value" style={{ textTransform: 'capitalize' }}>
                                {batch.status === 'activo' ? 'En Crecimiento' : batch.status === 'madre' ? 'Madre' : batch.status}
                            </span>
                        </div>
                    </MetaItem>
                </MetaGrid>
            </GlassCard>

            <UnitsSection>
                <h2><FaCut style={{ color: '#94a3b8' }} /> Unidades del Lote ({allUnits.length})</h2>
                {allUnits.length > 0 ? (
                    <UnitsGrid>
                        {allUnits.map((unit) => (
                            <UnitCard key={unit.id} onClick={() => {
                                if (unit.genetic_id) {
                                    navigate(`/genetic/${unit.genetic_id}`);
                                } else {
                                    navigate('/clones'); // Fallback if no genetic ID
                                }
                            }}>
                                <FaBarcode className="icon" />
                                <span className="identifier">{unit.name}</span>
                            </UnitCard>
                        ))}
                    </UnitsGrid>
                ) : (
                    <div style={{ padding: '3rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '1rem', border: '1px dashed rgba(255,255,255,0.1)', color: '#94a3b8' }}>
                        No hay unidades individuales registradas para este lote padre.
                    </div>
                )}
            </UnitsSection>
        </Container>
    );
};
