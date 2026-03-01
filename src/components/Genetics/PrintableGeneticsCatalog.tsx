import React from 'react';
import styled from 'styled-components';
import { Genetic } from '../../types/genetics';

interface PrintableGeneticsCatalogProps {
    genetics: Genetic[];
}

const PrintContainer = styled.div`
  font-family: 'Inter', sans-serif;
  color: black;
  background: white;
  width: 100%;
  padding: 10mm;
  box-sizing: border-box;

  @media print {
    padding: 0;
    /* 
      ========================================================================
      ⚠️ ¡CRÍTICO! NO MODIFICAR NI ELIMINAR ESTAS REGLAS DE IMPRESIÓN ⚠️
      Fuerza fondo blanco y texto negro para evitar gastar tóner.
      ========================================================================
    */
    html, body, #root {
      background-color: white !important;
      color: black !important;
    }
    * {
      color: black !important;
    }
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  border-bottom: 3px solid #000;
  padding-bottom: 1rem;
  margin-bottom: 2rem;
`;

const TitleArea = styled.div`
  flex: 1;
`;

const Title = styled.h1`
  font-size: 28px;
  margin: 0;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const Subtitle = styled.h2`
  font-size: 14px;
  margin: 0.5rem 0 0 0;
  font-weight: normal;
  color: #444;
  text-transform: uppercase;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15mm;
`;

const GeneticCard = styled.div`
  border: 1px solid #000;
  border-radius: 8px;
  padding: 15px;
  page-break-inside: avoid;
  break-inside: avoid;
  box-shadow: 2px 2px 0px #000; /* Estilo retro/limpio para impresión monochrome */
`;

const CardHeader = styled.div`
  border-bottom: 2px solid #000;
  padding-bottom: 8px;
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

const GeneticName = styled.h3`
  font-size: 18px;
  font-weight: 800;
  margin: 0;
  text-transform: uppercase;
`;

const BreederName = styled.span`
  font-size: 11px;
  color: #666;
  font-style: italic;
  display: block;
`;

const NomenclaturaBadge = styled.span`
  font-family: monospace;
  font-size: 12px;
  font-weight: bold;
  border: 1px solid #000;
  padding: 2px 6px;
  border-radius: 4px;
`;

const MetricsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  font-size: 11px;
`;

const MetricBox = styled.div`
  text-align: center;
  flex: 1;
  border-right: 1px solid #ccc;
  
  &:last-child {
    border-right: none;
  }
`;

const MetricLabel = styled.div`
  font-weight: bold;
  text-transform: uppercase;
  margin-bottom: 2px;
`;

const MetricValue = styled.div`
  font-size: 13px;
  font-family: monospace;
`;

const Description = styled.p`
  font-size: 11px;
  line-height: 1.4;
  margin: 0 0 10px 0;
  color: #333;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  margin-bottom: 4px;
  border-bottom: 1px dashed #eee;
  padding-bottom: 2px;
`;

export const PrintableGeneticsCatalog: React.FC<PrintableGeneticsCatalogProps> = ({ genetics }) => {
    // Sort alphabetically by name
    const sortedGenetics = [...genetics].sort((a, b) => a.name.localeCompare(b.name));

    return (
        <PrintContainer className="printable-report">
            <Header>
                <TitleArea>
                    <Title>Catálogo de Genéticas</Title>
                    <Subtitle>Inventario de cepas activas y métricas</Subtitle>
                </TitleArea>
                <div style={{ textAlign: 'right', fontSize: '12px' }}>
                    <strong>Total Cepas:</strong> {genetics.length}<br />
                    <strong>Fecha:</strong> {new Date().toLocaleDateString('es-AR')}
                </div>
            </Header>

            <Grid>
                {sortedGenetics.map(genetic => (
                    <GeneticCard key={genetic.id}>
                        <CardHeader>
                            <div>
                                <GeneticName>{genetic.name}</GeneticName>
                                <BreederName>{genetic.breeder || 'Breeder desconocido'}</BreederName>
                            </div>
                            <NomenclaturaBadge>{genetic.nomenclatura || '--'}</NomenclaturaBadge>
                        </CardHeader>

                        <MetricsContainer>
                            <MetricBox>
                                <MetricLabel>THC</MetricLabel>
                                <MetricValue>{genetic.thc_percent ? `${genetic.thc_percent}%` : 'N/A'}</MetricValue>
                            </MetricBox>
                            <MetricBox>
                                <MetricLabel>CBD</MetricLabel>
                                <MetricValue>{genetic.cbd_percent ? `${genetic.cbd_percent}%` : 'N/A'}</MetricValue>
                            </MetricBox>
                            <MetricBox>
                                <MetricLabel>Tipo</MetricLabel>
                                <MetricValue style={{ textTransform: 'capitalize' }}>
                                    {genetic.type === 'photoperiodic' ? 'Foto.' : 'Auto.'}
                                </MetricValue>
                            </MetricBox>
                        </MetricsContainer>

                        {genetic.description && (
                            <Description>
                                <strong>Nota:</strong> {genetic.description}
                            </Description>
                        )}

                        <div style={{ marginTop: '10px' }}>
                            <InfoRow>
                                <strong>Tiempo Vegetativo:</strong>
                                <span>{genetic.vegetative_weeks} semanas</span>
                            </InfoRow>
                            <InfoRow>
                                <strong>Fase Floración:</strong>
                                <span>{genetic.flowering_weeks} semanas</span>
                            </InfoRow>
                            <InfoRow>
                                <strong>Rendimiento (Est.):</strong>
                                <span>{genetic.estimated_yield_g ? `${genetic.estimated_yield_g} g/planta` : 'N/A'}</span>
                            </InfoRow>
                        </div>
                    </GeneticCard>
                ))}
            </Grid>

            <div style={{ marginTop: '30px', textAlign: 'center', fontSize: '10px', color: '#666' }}>
                -- Uso Interno Exclusivo --
            </div>
        </PrintContainer>
    );
};
