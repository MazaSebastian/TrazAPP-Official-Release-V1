import React from 'react';
import styled from 'styled-components';
import QRCode from 'react-qr-code';
import { Batch } from '../../types/rooms';

interface PrintableBatchPassportProps {
  batch: Batch;
  childBatches: Batch[];
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
  font-size: 32px;
  margin: 0;
  font-weight: 900;
  text-transform: uppercase;
  font-family: 'Courier New', monospace;
  letter-spacing: 1px;
`;

const Subtitle = styled.h2`
  font-size: 14px;
  margin: 0;
  font-weight: bold;
  color: black !important;
  text-transform: uppercase;
  letter-spacing: 2px;
`;

const QRCodeContainer = styled.div`
  margin-left: 20px;
  padding: 5px;
  background: white !important;
  border: 2px solid black;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
`;

const DataBlock = styled.div`
  border: 2px solid black;
  padding: 15px;
  min-height: 120px;
  box-sizing: border-box;
`;

const BlockTitle = styled.h3`
  font-size: 14px;
  text-transform: uppercase;
  margin-top: 0;
  margin-bottom: 10px;
  border-bottom: 2px solid black;
  padding-bottom: 5px;
  color: black !important;
  font-weight: 800;
`;

const DataRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
`;

const Label = styled.span`
  font-weight: bold;
`;

const Value = styled.span`
  font-family: monospace;
  font-size: 15px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  margin-bottom: 20px;
  border: 2px solid black;

  th, td {
    border: 1px solid black;
    padding: 8px;
    text-align: left;
  }

  th {
    background-color: #f0f0f0 !important;
    font-weight: bold;
    text-transform: uppercase;
    border-bottom: 2px solid black;
  }
`;

export const PrintableBatchPassport: React.FC<PrintableBatchPassportProps> = ({ batch, childBatches }) => {
  const allUnits = [batch, ...childBatches];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const code = batch.tracking_code || batch.id.substring(0, 8).toUpperCase();
  const geneticName = batch.genetic?.name || 'Genética Desconocida';
  const nomenclature = batch.genetic?.nomenclatura || '--';

  return (
    <PrintContainer className="printable-report">
      <Header>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flex: 1 }}>
          <img src="/trazapphorizontal.png" alt="TrazApp Logo" style={{ height: '35px', width: 'auto' }} />
          <TitleArea>
            <Subtitle>Ficha Técnica de Trazabilidad</Subtitle>
            <Title>LOTE-{code}</Title>
            <div style={{ marginTop: '5px', fontSize: '16px', fontWeight: 'bold' }}>
              GENÉTICA: {geneticName} ({nomenclature})
            </div>
          </TitleArea>
        </div>
        <QRCodeContainer>
          <QRCode
            value={`${window.location.origin}/track/${batch.tracking_code || batch.id}`}
            size={80}
            level="M"
          />
        </QRCodeContainer>
      </Header>

      <Grid>
        <DataBlock>
          <BlockTitle>Información del Lote</BlockTitle>
          <DataRow>
            <Label>ID Interno:</Label>
            <Value>{batch.id.substring(0, 8)}</Value>
          </DataRow>
          <DataRow>
            <Label>Fecha de Creación:</Label>
            <Value>{formatDate(batch.start_date || batch.created_at)}</Value>
          </DataRow>
          <DataRow>
            <Label>Estado Actual:</Label>
            <Value style={{ textTransform: 'uppercase' }}>{batch.status || 'Activo'}</Value>
          </DataRow>
          <DataRow>
            <Label>Cantidad Inicial:</Label>
            <Value>{batch.quantity || 1} uds</Value>
          </DataRow>
        </DataBlock>

        <DataBlock>
          <BlockTitle>Ubicación Actual</BlockTitle>
          <DataRow>
            <Label>Sala:</Label>
            <Value>{batch.room?.name || 'Sin Asignar'}</Value>
          </DataRow>
          <DataRow>
            <Label>Tipo de Sala:</Label>
            <Value style={{ textTransform: 'capitalize' }}>{batch.room?.type || '-'}</Value>
          </DataRow>
          <DataRow>
            <Label>Total Unidades (Físico):</Label>
            <Value>{allUnits.length}</Value>
          </DataRow>
        </DataBlock>
      </Grid>

      <BlockTitle>Listado Físico de Individuos ({allUnits.length})</BlockTitle>
      <Table>
        <thead>
          <tr>
            <th style={{ width: '50px' }}>Nº</th>
            <th style={{ width: '150px' }}>ID Unidad (Hash)</th>
            <th>Nombre Visible</th>
            <th>Fase Actual</th>
            <th>Cosechable</th>
          </tr>
        </thead>
        <tbody>
          {allUnits.map((unit, index) => (
            <tr key={unit.id}>
              <td>{index + 1}</td>
              <td style={{ fontFamily: 'monospace', fontSize: '11px' }}>{unit.id.substring(0, 12)}...</td>
              <td>{unit.name || `Unidad ${index + 1}`}</td>
              <td style={{ textTransform: 'capitalize' }}>{unit.stage || '-'}</td>
              <td>{unit.stage === 'flowering' ? 'Sí' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </Table>

      <div style={{ marginTop: '20px', padding: '15px', border: '2px solid black', fontSize: '12px', minHeight: '120px' }}>
        <BlockTitle>Historial y Observaciones</BlockTitle>
        <p style={{ color: 'black !important', fontStyle: 'italic', marginTop: '10px' }}>
          -- Documento impreso en {new Date().toLocaleDateString('es-AR')} --
        </p>
        {/* Espacio reservado para completado manual o un feed de tareas impreso en el futuro */}
      </div>

    </PrintContainer>
  );
};
