import React from 'react';
import styled from 'styled-components';
import { Genetic } from '../../types/genetics';

interface PrintableGeneticsCatalogProps {
  genetics: Genetic[];
}

const PrintContainer = styled.div`
  @media print {
    @page {
      size: A4 portrait;
      margin: 10mm;
    }

    html, body {
      background-color: white !important;
      color: black !important;
      min-height: auto !important;
      height: auto !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    body {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  }

  padding: 10px;
  margin: 0 !important;
  font-family: 'Inter', sans-serif;
  color: black !important;
  background: white !important;
  width: 100%; 
  height: auto !important;
  min-height: auto !important;
  box-sizing: border-box;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 99999;

  * {
    color: black !important;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 2px solid black;
  padding-bottom: 10px;
  margin-bottom: 20px;
`;

const TitleArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
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
  margin: 0;
  font-weight: bold;
  color: black !important;
  text-transform: uppercase;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
`;

const GeneticCard = styled.div`
  border: 2px solid black;
  border-radius: 4px;
  padding: 15px;
  page-break-inside: avoid;
  break-inside: avoid;
  background: white !important;
`;

const CardHeader = styled.div`
  border-bottom: 2px solid black;
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
  color: black !important;
  font-style: italic;
  display: block;
`;

const NomenclaturaBadge = styled.span`
  font-family: monospace;
  font-size: 12px;
  font-weight: bold;
  border: 2px solid black;
  padding: 2px 6px;
  border-radius: 2px;
`;

const MetricsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  font-size: 11px;
  border-bottom: 1px solid black;
  padding-bottom: 8px;
`;

const MetricBox = styled.div`
  text-align: center;
  flex: 1;
  border-right: 1px solid black;
  
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
  color: black !important;
  font-style: italic;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  margin-bottom: 4px;
  padding-bottom: 2px;
`;

export const PrintableGeneticsCatalog: React.FC<PrintableGeneticsCatalogProps> = ({ genetics }) => {
  // Sort alphabetically by name
  const sortedGenetics = [...genetics].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <PrintContainer className="printable-report">
      <Header>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flex: 1 }}>
          <img src="/trazapphorizontal.png" alt="TrazApp Logo" style={{ height: '35px', width: 'auto' }} />
          <TitleArea>
            <Subtitle>Inventario de Cepas</Subtitle>
            <Title>Catálogo Genéticas</Title>
          </TitleArea>
        </div>
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

      <div style={{ marginTop: '30px', textAlign: 'center', fontSize: '10px', color: 'black !important', borderTop: '2px solid black', paddingTop: '10px' }}>
        -- Uso Interno Exclusivo --
      </div>
    </PrintContainer>
  );
};
