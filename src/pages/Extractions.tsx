import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { extractionsService } from '../services/extractionsService';
import { Extraction } from '../types/extractions';
import { ExtractionForm } from '../components/Extractions/ExtractionForm';
import { ExtractionDetails } from '../components/Extractions/ExtractionDetails';
import { ConfirmationModal } from '../components/ConfirmationModal';

import { FlaskConical, Plus, Calendar, Scale, Trash2, Eye, Edit3 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Button } from '../components/ui';

export const ExtractionsPage: React.FC = () => {
    const [extractions, setExtractions] = useState<Extraction[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedExtraction, setSelectedExtraction] = useState<Extraction | null>(null);
    const [editingExtraction, setEditingExtraction] = useState<Extraction | null>(null);
    const [extractionToDelete, setExtractionToDelete] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadExtractions();
    }, []);

    const loadExtractions = async () => {
        setLoading(true);
        const data = await extractionsService.getExtractions();
        setExtractions(data);
        setLoading(false);
    };

    const handleDeleteClick = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExtractionToDelete(id);
    };

    const confirmDelete = async () => {
        if (extractionToDelete) {
            await extractionsService.deleteExtraction(extractionToDelete);
            setExtractionToDelete(null);
            loadExtractions();
        }
    };

    const handleEdit = (ext: Extraction, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingExtraction(ext);
        setIsFormOpen(true);
    };

    const handleCreate = () => {
        setEditingExtraction(null);
        setIsFormOpen(true);
    };

    return (
        <Container>
            <Header>
                <Title>
                    <FlaskConical size={28} className="text-emerald-400" />
                    Laboratorio de Extracciones
                </Title>
                <Button onClick={handleCreate} className="flex items-center gap-2">
                    <Plus size={16} /> Nueva Extracción
                </Button>
            </Header>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
                    <LoadingSpinner />
                </div>
            ) : extractions.length === 0 ? (
                <EmptyState>
                    <FlaskConical size={48} className="text-slate-500" strokeWidth={1.5} />
                    <p>No hay extracciones registradas aún.</p>
                    <Button onClick={handleCreate} className="flex items-center gap-2">
                        <Plus size={16} /> Comenzar Primera Extracción
                    </Button>
                </EmptyState>
            ) : (
                <Grid>
                    {extractions.map(ext => (
                        <Card key={ext.id} onClick={() => setSelectedExtraction(ext)}>
                            <CardContent>
                                <CardHeader>
                                    <TechniqueBadge $technique={ext.technique}>{ext.technique}</TechniqueBadge>
                                    <DateText><Calendar size={13} /> {format(new Date(ext.date), 'dd MMM', { locale: es })}</DateText>
                                </CardHeader>

                                <MainInfo>
                                    <div className="source">
                                        <small>Materia Prima</small>
                                        <strong>{ext.source_batch?.strain_name || 'Desconocido'}</strong>
                                        <span>{ext.source_batch?.batch_code}</span>
                                    </div>
                                    <div className="yield">
                                        <small>Retorno</small>
                                        <YieldValue>{ext.yield_percentage ? ext.yield_percentage.toFixed(1) : ((ext.output_weight / ext.input_weight) * 100).toFixed(1)}%</YieldValue>
                                    </div>
                                </MainInfo>

                                <StatsGrid>
                                    <div><Scale size={13} className="text-sky-400" /> IN: {ext.input_weight}g</div>
                                    <div><FlaskConical size={13} className="text-emerald-400" /> OUT: {ext.output_weight}g</div>
                                </StatsGrid>

                                {ext.ratings && (
                                    <RatingMini>
                                        <div className="r-item">⭐ {ext.ratings.overall || ((ext.ratings.aroma + ext.ratings.texture + ext.ratings.potency) / 3).toFixed(1)}</div>
                                        <small>Calidad Global</small>
                                    </RatingMini>
                                )}
                            </CardContent>

                            <CardFooter>
                                <ActionButton onClick={(e) => { e.stopPropagation(); setSelectedExtraction(ext); }} className="view">
                                    <Eye size={13} /> Ver
                                </ActionButton>
                                <ActionButton onClick={(e) => handleEdit(ext, e)} className="edit">
                                    <Edit3 size={13} /> Editar
                                </ActionButton>
                                <ActionButton onClick={(e) => handleDeleteClick(ext.id, e)} className="delete" title="Eliminar extracción">
                                    <Trash2 size={13} />
                                </ActionButton>
                            </CardFooter>

                        </Card>
                    ))}
                </Grid>
            )}

            {isFormOpen && (
                <ExtractionForm
                    onClose={() => setIsFormOpen(false)}
                    onSuccess={() => { setIsFormOpen(false); loadExtractions(); }}
                    initialData={editingExtraction || undefined}
                />
            )}

            {selectedExtraction && (
                <ExtractionDetails
                    extraction={selectedExtraction}
                    onClose={() => setSelectedExtraction(null)}
                />
            )}

            <ConfirmationModal
                isOpen={!!extractionToDelete}
                title="Eliminar Extracción"
                message="¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer."
                onConfirm={confirmDelete}
                onCancel={() => setExtractionToDelete(null)}
                confirmText="Eliminar"
                isDestructive
            />
        </Container>
    );
};

// Styles
const Container = styled.div`
    padding: 2rem 2.5rem;
    max-width: 1560px;
    margin: 0 auto;
    min-height: 100vh;
    color: #f8fafc;
`;

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    flex-wrap: wrap;
    gap: 1rem;
`;

const Title = styled.h1`
    display: flex;
    align-items: center;
    gap: 0.85rem;
    font-size: clamp(1.5rem, 3vw, 2.25rem);
    font-weight: 800;
    background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0;
`;

const EmptyState = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    background: rgba(15, 23, 42, 0.6);
    border-radius: 1.25rem;
    border: 1px dashed rgba(255, 255, 255, 0.15);
    color: #94a3b8;
    gap: 1.25rem;
    backdrop-filter: blur(12px);
    text-align: center;
`;

const Grid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.5rem;
`;

const Card = styled.div`
    background: rgba(15, 23, 42, 0.75);
    backdrop-filter: blur(16px);
    border-radius: 1.25rem;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-top: 1px solid rgba(255, 255, 255, 0.15);
    transition: all 0.2s ease;
    overflow: hidden;
    cursor: pointer;
    display: flex;
    flex-direction: column;

    &:hover {
        transform: translateY(-4px);
        border-color: rgba(16, 185, 129, 0.35);
        box-shadow: 0 14px 30px -4px rgba(16, 185, 129, 0.15);
    }
`;

const CardContent = styled.div`
    padding: 1.5rem;
    flex: 1;
`;

const CardHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.25rem;
`;

const TechniqueBadge = styled.span<{ $technique: string }>`
    padding: 0.3rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    background: ${props =>
        props.$technique === 'Rosin' ? 'rgba(234, 179, 8, 0.15)' :
        props.$technique === 'Ice' ? 'rgba(56, 189, 248, 0.15)' :
        props.$technique === 'BHO' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(148, 163, 184, 0.15)'};
    color: ${props =>
        props.$technique === 'Rosin' ? '#fbbf24' :
        props.$technique === 'Ice' ? '#38bdf8' :
        props.$technique === 'BHO' ? '#f87171' : '#cbd5e1'};
    border: 1px solid ${props =>
        props.$technique === 'Rosin' ? 'rgba(234, 179, 8, 0.3)' :
        props.$technique === 'Ice' ? 'rgba(56, 189, 248, 0.3)' :
        props.$technique === 'BHO' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(148, 163, 184, 0.3)'};
`;

const DateText = styled.span`
    color: #94a3b8;
    font-size: 0.8rem;
    display: flex;
    align-items: center;
    gap: 0.35rem;
`;

const MainInfo = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.25rem;
    
    .source {
        display: flex;
        flex-direction: column;
        strong { color: #f8fafc; font-size: 1.15rem; font-weight: 700; }
        small { color: #94a3b8; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }
        span { color: #64748b; font-size: 0.85rem; font-family: monospace; }
    }

    .yield {
        text-align: right;
        small { display: block; color: #94a3b8; font-size: 0.75rem; text-transform: uppercase; }
    }
`;

const YieldValue = styled.div`
    font-size: 1.5rem;
    font-weight: 800;
    color: #34d399;
    text-shadow: 0 0 12px rgba(16, 185, 129, 0.3);
`;

const StatsGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    background: rgba(15, 23, 42, 0.5);
    padding: 0.75rem 1rem;
    border-radius: 0.75rem;
    font-size: 0.85rem;
    color: #cbd5e1;
    margin-bottom: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.05);
    div { display: flex; align-items: center; gap: 0.5rem; }
`;

const RatingMini = styled.div`
    background: rgba(234, 179, 8, 0.08);
    padding: 0.5rem;
    border-radius: 0.75rem;
    text-align: center;
    border: 1px solid rgba(234, 179, 8, 0.2);
    .r-item { color: #fbbf24; font-weight: 700; font-size: 0.95rem; }
    small { color: #94a3b8; font-size: 0.75rem; }
`;

const CardFooter = styled.div`
    padding: 0.85rem 1.25rem;
    background: rgba(15, 23, 42, 0.85);
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
`;

const ActionButton = styled.button`
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 0.4rem 0.75rem;
    border-radius: 0.5rem;
    font-size: 0.8rem;
    font-weight: 600;
    color: #cbd5e1;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.35rem;
    transition: all 0.2s ease;

    &:hover { background: rgba(255, 255, 255, 0.1); color: #f8fafc; }

    &.delete {
        color: #f87171;
        border-color: rgba(239, 68, 68, 0.3);
        &:hover { background: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.5); }
    }

    &.view {
        color: #38bdf8;
        border-color: rgba(56, 189, 248, 0.3);
        &:hover { background: rgba(56, 189, 248, 0.15); border-color: rgba(56, 189, 248, 0.5); }
    }
    
    &.edit {
        color: #fbbf24;
        border-color: rgba(234, 179, 8, 0.3);
        &:hover { background: rgba(234, 179, 8, 0.15); border-color: rgba(234, 179, 8, 0.5); }
    }
`;
