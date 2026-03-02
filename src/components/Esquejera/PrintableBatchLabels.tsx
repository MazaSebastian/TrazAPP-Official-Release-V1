import React from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import QRCode from 'react-qr-code';
import { Batch } from '../../types/rooms';

interface PrintableBatchLabelsProps {
  batches: Batch[];
}

const GlobalPrintStyle = createGlobalStyle`
  @media print {
    @page {
      margin: 0 !important;
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
`;

const PrintContainer = styled.div`
  background: white !important;
  color: black !important;
  width: 100%;
  font-family: 'Inter', sans-serif;
  padding: 10px;
  margin: 0 !important;
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
  border: 1px dashed black !important; // Línea de corte punteada
  box-sizing: border-box;
  padding: 2mm;
  display: flex;
  align-items: center;
  justify-content: space-between;
  page-break-inside: avoid;
  overflow: hidden;
  border-radius: 4px;
`;

const Info = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
  padding-right: 2px;
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 2px;
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
    font-weight: 600;
    margin-top: 1mm;
`;

export const PrintableBatchLabels: React.FC<PrintableBatchLabelsProps> = ({ batches }) => {
  return (
    <PrintContainer className="printable-labels">
      <GlobalPrintStyle />
      <LabelGrid>
        {batches.map(batch => (
          <Label key={batch.id}>
            <Info>
              <HeaderRow>
                <img src="/trazapphorizontal.png" alt="TrazApp Logo" style={{ height: '8px', width: 'auto', marginRight: '4px' }} />
              </HeaderRow>
              <GeneticName>{batch.genetic?.name || batch.name}</GeneticName>
              <Code>{batch.tracking_code || '---'}</Code>
              <DateText>{new Date().toLocaleDateString()}</DateText>
            </Info>
            <div style={{ width: '22mm', height: '22mm', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white !important', padding: '1mm', borderLeft: '1px solid black' }}>
              <QRCode
                value={`${window.location.origin}/track/${batch.tracking_code || batch.id}`}
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
