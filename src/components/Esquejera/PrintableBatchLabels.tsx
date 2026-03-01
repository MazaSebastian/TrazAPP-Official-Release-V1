import React from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import QRCode from 'react-qr-code';
import { Batch } from '../../types/rooms';

interface PrintableBatchLabelsProps {
  batches: Batch[];
}



const PrintContainer = styled.div`
  background: white;
  color: black;
  width: 100%;
  font-family: 'Inter', sans-serif;

  @media print {
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

// Label Size: Aprox 5cm x 2.5cm or similar standard small label
const LabelGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(45mm, 1fr));
  gap: 4mm; 
  padding: 5mm;
  width: 100%;
`;

const Label = styled.div`
  width: 100%;
  height: 25mm;
  border: 1px dashed #666; // Línea de corte punteada
  box-sizing: border-box;
  padding: 2mm;
  display: flex;
  align-items: center;
  justify-content: space-between;
  page-break-inside: avoid;
  overflow: hidden;
  border-radius: 4px;

  @media print {
    border: 1px dashed #000 !important;
  }
`;

const Info = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
  padding-right: 2px;
`;

const GeneticName = styled.div`
  font-size: 11px;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-transform: uppercase;
`;

const Code = styled.div`
  font-size: 9px;
  font-family: monospace;
  font-weight: bold;
  margin-top: 1mm;
`;

const DateText = styled.div`
    font-size: 8px;
    color: #444;
    margin-top: 1mm;
`;

export const PrintableBatchLabels: React.FC<PrintableBatchLabelsProps> = ({ batches }) => {
  return (
    <PrintContainer className="printable-labels">
      <LabelGrid>
        {batches.map(batch => (
          <Label key={batch.id}>
            <Info>
              <GeneticName>{batch.genetic?.name || batch.name}</GeneticName>
              <Code>{batch.tracking_code || '---'}</Code>
              <DateText>{new Date().toLocaleDateString()}</DateText>
            </Info>
            <div style={{ width: '22mm', height: '22mm', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', padding: '1mm' }}>
              <QRCode
                value={batch.tracking_code || batch.id}
                size={70} // approx 18.5mm
                level="M"
              />
            </div>
          </Label>
        ))}
      </LabelGrid>
    </PrintContainer>
  );
};
