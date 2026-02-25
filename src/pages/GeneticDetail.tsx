import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaDna, FaLeaf, FaClock, FaPercent, FaTint, FaInfoCircle } from 'react-icons/fa';
import { geneticsService } from '../services/geneticsService';
import { Genetic } from '../types/genetics';
import { LoadingSpinner } from '../components/LoadingSpinner';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
    padding: 2rem;
    padding-top: 5rem;
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
            text-transform: capitalize;
        }
    }
`;

export const GeneticDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [genetic, setGenetic] = useState<Genetic | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchGenetic = async () => {
            if (!id) return;
            try {
                setLoading(true);
                // Utilizando getGenetics ya que necesitamos extraer la individual
                const data = await geneticsService.getGenetics();
                const found = data.find(g => g.id === id || g.nomenclatura === id);

                if (found) {
                    setGenetic(found);
                } else {
                    setError('Ficha de genética no encontrada.');
                }
            } catch (err: any) {
                console.error('Error loading genetic:', err);
                setError('Error al cargar la información de la genética.');
            } finally {
                setLoading(false);
            }
        };

        fetchGenetic();
    }, [id]);

    if (loading) {
        return (
            <Container style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <LoadingSpinner />
            </Container>
        );
    }

    if (error || !genetic) {
        return (
            <Container>
                <Header>
                    <BackButton onClick={() => navigate(-1)}><FaArrowLeft /></BackButton>
                    <h1>Error</h1>
                </Header>
                <GlassCard style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <p style={{ color: '#ef4444', fontSize: '1.25rem' }}>{error || 'Ficha de genética no encontrada.'}</p>
                    <button
                        onClick={() => navigate('/genetics')}
                        style={{ marginTop: '1.5rem', padding: '0.75rem 1.5rem', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '0.5rem', color: 'white', cursor: 'pointer' }}
                    >
                        Volver a Genéticas
                    </button>
                </GlassCard>
            </Container>
        );
    }

    return (
        <Container>
            <Header>
                <BackButton onClick={() => navigate(-1)} title="Volver"><FaArrowLeft /></BackButton>
                <h1><FaDna style={{ color: '#4ade80' }} /> Ficha de Genética</h1>
            </Header>

            <GlassCard>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1rem' }}>
                    <div style={{ background: 'rgba(74, 222, 128, 0.1)', padding: '1.5rem', borderRadius: '1rem', border: '1px dashed rgba(74, 222, 128, 0.3)' }}>
                        <FaLeaf size={50} style={{ color: '#4ade80' }} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '2.5rem', margin: '0 0 0.5rem 0', color: '#f8fafc', letterSpacing: '1px' }}>
                            {genetic.name}
                        </h2>
                        <span style={{ display: 'inline-block', padding: '0.25rem 0.75rem', background: 'rgba(255, 255, 255, 0.1)', color: '#e2e8f0', borderRadius: '1rem', fontSize: '0.85rem', fontWeight: 600, marginRight: '0.5rem' }}>
                            {genetic.nomenclatura || 'N/A'}
                        </span>
                        <span style={{ display: 'inline-block', padding: '0.25rem 0.75rem', background: 'rgba(192, 132, 252, 0.15)', color: '#c084fc', borderRadius: '1rem', fontSize: '0.85rem', fontWeight: 600 }}>
                            {genetic.type || 'Híbrida'}
                        </span>
                    </div>
                </div>

                <MetaGrid>
                    <MetaItem>
                        <div className="icon-wrapper" style={{ background: 'rgba(250, 204, 21, 0.1)', color: '#facc15' }}><FaPercent /></div>
                        <div className="info">
                            <span className="label">THC / CBD %</span>
                            <span className="value">-- / --</span>
                        </div>
                    </MetaItem>
                    <MetaItem>
                        <div className="icon-wrapper" style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e' }}><FaClock /></div>
                        <div className="info">
                            <span className="label">Floración Estimada</span>
                            <span className="value">-- Semanas</span>
                        </div>
                    </MetaItem>
                    <MetaItem>
                        <div className="icon-wrapper"><FaTint /></div>
                        <div className="info">
                            <span className="label">Perfil de Terpenos</span>
                            <span className="value">No asignado</span>
                        </div>
                    </MetaItem>
                </MetaGrid>

                <div style={{ marginTop: '2.5rem', paddingTop: '2.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f8fafc', fontSize: '1.25rem', marginBottom: '1rem' }}>
                        <FaInfoCircle style={{ color: '#94a3b8' }} /> Información Detallada
                    </h3>
                    <p style={{ color: '#94a3b8', lineHeight: '1.6', fontSize: '0.95rem' }}>
                        {genetic.description || 'No hay descripción detallada para esta genética en la base de datos central.'}
                    </p>
                </div>
            </GlassCard>
        </Container>
    );
};
