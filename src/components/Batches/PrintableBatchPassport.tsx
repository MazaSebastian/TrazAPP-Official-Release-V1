import React from 'react';
import styled from 'styled-components';
import QRCode from 'react-qr-code';
import { Batch } from '../../types/rooms';

interface PrintableBatchPassportProps {
    batch: Batch;
    childBatches: Batch[];
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
  align-items: flex-start;
  border-bottom: 3px solid #000;
  padding-bottom: 1rem;
  margin-bottom: 2rem;
`;

const TitleArea = styled.div`
  flex: 1;
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
  margin: 0.5rem 0 0 0;
  font-weight: bold;
  color: #333;
  text-transform: uppercase;
  letter-spacing: 2px;
`;

const QRCodeContainer = styled.div`
  margin-left: 20px;
  padding: 5px;
  background: white;
  border: 1px solid #ccc;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
`;

const DataBlock = styled.div`
  border: 1px solid #000;
  padding: 1rem;
  min-height: 120px;
`;

const BlockTitle = styled.h3`
  font-size: 12px;
  text-transform: uppercase;
  margin-top: 0;
  margin-bottom: 10px;
  border-bottom: 1px solid #ccc;
  padding-bottom: 5px;
  color: #444;
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
  margin-bottom: 2rem;

  th, td {
    border: 1px solid #000;
    padding: 8px;
    text-align: left;
  }

  th {
    background-color: #f0f0f0 !important;
    font-weight: bold;
    text-transform: uppercase;
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
                <TitleArea>
                    <Subtitle>Ficha Técnica de Trazabilidad</Subtitle>
                    <Title>LOTE-{code}</Title>
                    <div style={{ marginTop: '10px', fontSize: '18px', fontWeight: 'bold' }}>
                        GENÉTICA: {geneticName} ({nomenclature})
                    </div>
                </TitleArea>
                <QRCodeContainer>
                    <QRCode
                        value={batch.tracking_code || batch.id}
                        size={100}
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

            <div style={{ marginTop: '40px', padding: '20px', border: '1px solid #000', fontSize: '12px', minHeight: '150px' }}>
                <BlockTitle>Historial y Observaciones</BlockTitle>
                <p style={{ color: '#666', fontStyle: 'italic', marginTop: '10px' }}>
                    -- Documento impreso en {new Date().toLocaleDateString('es-AR')} --
                </p>
                {/* Espacio reservado para completado manual o un feed de tareas impreso en el futuro */}
            </div>

        </PrintContainer>
    );
};
