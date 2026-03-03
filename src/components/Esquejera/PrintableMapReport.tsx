import React from 'react';
import styled from 'styled-components';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Batch } from '../../types/rooms';
import { getGeneticColor } from '../../utils/geneticColors';

import { createGlobalStyle } from 'styled-components';

// Esta es la "bala de plata" que forzará el blanco sin importar el CSS global
const GlobalPrintForce = createGlobalStyle`
  @media print {
    /* Atacamos a TODOS los posibles culpables al mismo tiempo */
    html, body, #root, [class*="layout"], [class*="container"], main, section {
      background-color: white !important;
      background-image: none !important;
      color: black !important;
    }
    
    /* Si el fondo azul viene de un div de fondo de la app */
    div {
      background-color: transparent !important;
    }
    
    /* Excepto tu reporte, que debe ser blanco sólido */
    .printable-report, .printable-report * {
      background-color: white !important;
      color: black !important;
    }
  }
`;

interface PrintableMapReportProps {
  roomName: string;
  mapName: string;
  rows: number;
  cols: number;
  batches: Batch[];
}

const PrintContainer = styled.div`
  @media print {
    @page {
      size: A4 landscape;
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

// Page 1: Map (Forces new page after)
const PageOne = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  
  @media print {
    display: block;
    page-break-after: always;
  }
`;

// Page 2: Table (Forces new page before)
const PageTwo = styled.div`
  width: 100%;
  box-sizing: border-box;
  
  @media print {
    display: block;
    page-break-before: always;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 20px;
  border-bottom: 2px solid black;
  padding-bottom: 10px;
`;

const TitleBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 24px;
  font-weight: 800;
  text-transform: uppercase;
`;

const Subtitle = styled.h2`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  text-transform: capitalize;
  color: black !important;
`;

const DateText = styled.div`
  font-size: 14px;
  color: black !important;
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  margin: 0 0 10px 0;
  font-weight: 700;
  text-transform: uppercase;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  margin-top: 10px;
  border: 2px solid black;

  th, td {
    border: 1px solid black;
    padding: 6px;
    text-align: left;
  }

  th {
    background-color: #f0f0f0 !important;
    font-weight: bold;
    text-transform: uppercase;
    font-size: 10px;
    border-bottom: 2px solid black;
  }

  tr:nth-child(even) {
    background-color: #f9f9f9 !important;
  }
`;

export const PrintableMapReport: React.FC<PrintableMapReportProps> = ({ roomName, mapName, rows, cols, batches }) => {
  // Sort batches by position (A1, A2, B1...)

  const sortedBatches = [...batches].sort((a, b) => {
    if (!a.grid_position || !b.grid_position) return 0;
    return a.grid_position.localeCompare(b.grid_position);
  });

  function getRowLabel(index: number) {
    let label = "";
    let i = index;
    do {
      label = String.fromCharCode(65 + (i % 26)) + label;
      i = Math.floor(i / 26) - 1;
    } while (i >= 0);
    return label;
  }
  const batchMap = React.useMemo(() => {
    const map: Record<string, Batch> = {};
    batches.forEach(b => {
      if (b.grid_position) {
        map[b.grid_position.trim().toUpperCase()] = b;
      }
    });
    return map;
  }, [batches]);



  const totalPlants = batches.reduce((acc, b) => acc + b.quantity, 0);
  const currentDate = format(new Date(), "d 'de' MMMM, yyyy - HH:mm", { locale: es });

  // --- LÓGICA DE VISTA COMPACTA (ZOOM OUT) ---
  const maxDim = Math.max(rows, cols);
  const isZoomedOut = maxDim > 5;

  // Si es menor a 5x5 usamos el escalado que implementamos previamente.
  // Si es mayor a 5x5 usamos medidas fijas pequeñas para la vista compacta.
  const scaleRatio = !isZoomedOut && maxDim > 0 ? Math.max(5 / maxDim, 0.35) : 1;

  const mapStyles = {
    cellHeight: isZoomedOut ? '40px' : `${Math.floor(50 * scaleRatio)}px`,
    cellWidth: isZoomedOut ? '40px' : 'auto',
    padding: isZoomedOut ? '2px' : `${Math.floor(4 * scaleRatio)}px`,
    mainTextSize: `${Math.floor(11 * scaleRatio)}px`,
    subTextSize: `${Math.floor(9 * scaleRatio)}px`,
    headerSize: isZoomedOut ? '11px' : `${Math.floor(10 * scaleRatio)}px`,
    gapSize: `${Math.max(1, Math.floor(2 * scaleRatio))}px`
  };

  return (
    <PrintContainer className="printable-report">

      {/* --- PAGE 1: MAP --- */}
      <PageOne>
        <Header>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            <img src="/trazapphorizontal.png" alt="TrazApp Logo" style={{ height: '35px', width: 'auto' }} />
            <TitleBox>
              <Title>Reporte: {roomName}</Title>
              <Subtitle>Mapa: {mapName}</Subtitle>
              <DateText>{currentDate}</DateText>
            </TitleBox>
          </div>
          <div style={{ textAlign: 'right' }}>
            <SectionTitle>Mapa de Distribución ({rows}x{cols})</SectionTitle>
            <DateText><strong>Total:</strong> {totalPlants} ptas | <strong>Lotes:</strong> {batches.length}</DateText>
          </div>
        </Header>


        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
          <table className="print-table" style={{ borderCollapse: 'collapse', width: '100%', margin: '0 auto', fontSize: '10px', border: '2px solid black' }}>
            <thead>
              <tr>
                <th style={{ width: '30px', border: '1px solid black', borderBottom: '2px solid black', padding: mapStyles.padding, background: '#f0f0f0 !important' }}></th>
                {Array.from({ length: cols }).map((_, cIndex) => (
                  <th key={`col-${cIndex}`} style={{ width: mapStyles.cellWidth, border: '1px solid black', borderBottom: '2px solid black', padding: mapStyles.padding, background: '#f0f0f0 !important', textAlign: 'center', color: 'black !important', fontSize: mapStyles.headerSize }}>
                    {cIndex + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rows }).map((_, rIndex) => {
                const rLabel = getRowLabel(rIndex);
                return (
                  <tr key={`row-${rIndex}`}>
                    <td style={{ border: '1px solid black', padding: mapStyles.padding, background: '#f0f0f0 !important', textAlign: 'center', fontWeight: 'bold', color: 'black !important', fontSize: mapStyles.headerSize }}>
                      {rLabel}
                    </td>
                    {Array.from({ length: cols }).map((_, cIndex) => {
                      const pos = `${rLabel}${cIndex + 1}`;
                      const batch = batchMap[pos];

                      // Background logic (Black and White Focus)
                      const cellBgColor = batch
                        ? '#ffffff !important' // Ocupado: Fondo blanco para ahorrar tinta
                        : '#f9f9f9 !important'; // Vacío: Gris muy clarito para distinguir la grilla

                      return (
                        <td key={pos} style={{
                          border: '1px solid black',
                          padding: mapStyles.padding,
                          textAlign: 'center',
                          height: mapStyles.cellHeight,
                          width: mapStyles.cellWidth,
                          verticalAlign: 'middle',
                          backgroundColor: cellBgColor,
                          color: 'black !important',
                          position: 'relative'
                        }}>
                          {isZoomedOut ? (
                            // --- VISTA COMPACTA ---
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{
                                fontWeight: batch ? 'bold' : 'normal',
                                fontSize: '11px',
                                color: batch ? 'black !important' : '#888 !important',
                              }}>
                                {pos}
                              </span>
                            </div>
                          ) : (
                            // --- VISTA DETALLADA ---
                            batch ? (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: mapStyles.gapSize }}>
                                <span style={{ fontWeight: '800', fontSize: mapStyles.mainTextSize, lineHeight: 1.1 }}>{batch.tracking_code || batch.name}</span>
                                <span style={{ fontSize: mapStyles.subTextSize, color: 'black !important', lineHeight: 1.1, marginTop: mapStyles.gapSize }}>{batch.genetic?.name?.substring(0, 15) || 'S/G'}</span>
                              </div>
                            ) : ''
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </PageOne>

      {/* --- PAGE 2: TABLE --- */}
      <PageTwo>

        {/* --- PAGE 2: DETAILS --- */}
        <Header>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            <img src="/trazapphorizontal.png" alt="TrazApp Logo" style={{ height: '35px', width: 'auto' }} />
            <TitleBox>
              <Title>{roomName}</Title>
              <Subtitle>Detalle de Lotes - Continuación</Subtitle>
              <DateText>Página 2</DateText>
            </TitleBox>
          </div>
        </Header>

        <SectionTitle>Listado de Lotes</SectionTitle>
        <Table>
          <thead>
            <tr>
              <th style={{ width: '40px', textAlign: 'center' }}>Pos</th>
              <th style={{ width: '100px' }}>Código</th>
              <th style={{ width: '180px' }}>Genética / Nombre</th>
              <th style={{ width: '50px', textAlign: 'center' }}>Cant.</th>
              <th>Notas</th>
              <th style={{ width: '80px' }}>Fecha Inicio</th>
            </tr>
          </thead>
          <tbody>
            {sortedBatches.map(batch => (
              <tr key={batch.id}>
                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{batch.grid_position}</td>
                <td style={{ fontFamily: 'monospace' }}>{batch.tracking_code || '-'}</td>
                <td>{batch.genetic?.name || batch.name}</td>
                <td style={{ textAlign: 'center' }}>{batch.quantity}</td>
                <td>{batch.notes || '-'}</td>
                <td>{format(new Date(batch.start_date), 'dd/MM/yy')}</td>
              </tr>
            ))}
            {sortedBatches.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '1rem', color: '#999 !important' }}>
                  El mapa está vacío.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </PageTwo>
    </PrintContainer>
  );
};
