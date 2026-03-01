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
  font-family: 'Inter', sans-serif;
  color: black;
  background: white;
  width: 100%;

  @media print {
    /* 
      ========================================================================
      ⚠️ ¡CRÍTICO! NO MODIFICAR NI ELIMINAR ESTAS REGLAS DE IMPRESIÓN ⚠️
      Estas reglas fuerzan el fondo blanco y texto negro en el reporte.
      Si se eliminan, componentes oscuros de la UI (ej. sidebar, fondos) 
      van a filtrarse en la vista de impresión, gastando tóner masivamente.
      El hook 'react-to-print' depende de esto para resetear el iframe.
      ========================================================================
    */
    html, body, #root {
      background-color: white !important;
      color: black !important;
    }
    
    * {
      color: black !important; /* Forza todo el texto a negro por defecto */
    }
  }
`;

// Page 1: Map (Forces new page after)
const PageOne = styled.div`
  width: 100%;
  height: 100vh; /* Explicit height for page 1 */
  display: flex;
  flex-direction: column;
  padding: 2rem;
  box-sizing: border-box;
  
  @media print {
    display: block; /* Use block for print to adhere to break rules strictly */
    display: block; /* Use block for print to adhere to break rules strictly */
    page-break-after: always;
    padding: 0; /* Let print margins handle it or explicit padding */
  }
`;

// Page 2: Table (Forces new page before)
const PageTwo = styled.div`
  width: 100%;
  padding: 2rem;
  box-sizing: border-box;
  
  @media print {
    display: block;
    page-break-before: always;
    padding: 2rem 0;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  border-bottom: 2px solid #000;
  padding-bottom: 1rem;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 24px;
  margin: 0;
  font-weight: bold;
`;

const Subtitle = styled.h2`
  font-size: 18px;
  margin: 0.5rem 0 0 0;
  font-weight: normal;
  color: #444;
`;

const DateText = styled.div`
  font-size: 14px;
  color: #666;
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  margin: 0 0 1rem 0;
  border-bottom: 1px solid #ccc;
  padding-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  margin-top: 1rem;

  th, td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
  }

  th {
    background-color: #f2f2f2;
    font-weight: bold;
    text-transform: uppercase;
    font-size: 10px;
  }

  tr:nth-child(even) {
    background-color: #f9f9f9;
  }
`;

export const PrintableMapReport: React.FC<PrintableMapReportProps> = ({ roomName, mapName, rows, cols, batches }) => {
  // Sort batches by position (A1, A2, B1...)

  const sortedBatches = [...batches].sort((a, b) => {
    if (!a.grid_position || !b.grid_position) return 0;
    return a.grid_position.localeCompare(b.grid_position);
  });

  function getRowLabel(index: number) {
    return String.fromCharCode(65 + index);
  } // 0 -> A
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
      <PageOne style={{ display: 'block', pageBreakAfter: 'always' }}>
        <Header>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Title>Reporte: {roomName}</Title>
            <Subtitle>Mapa: {mapName}</Subtitle>
            <DateText>{currentDate}</DateText>
            <DateText style={{ marginTop: '0.25rem' }}><strong>Total Plantas:</strong> {totalPlants} | <strong>Lotes:</strong> {batches.length}</DateText>
          </div>
        </Header>
        <SectionTitle style={{ textAlign: 'center', marginBottom: '1rem', borderBottom: 'none' }}>
          Mapa de Distribución ({rows}x{cols})
        </SectionTitle>

        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '1rem 0' }}>
          <table className="print-table" style={{ borderCollapse: 'collapse', width: isZoomedOut ? 'auto' : '100%', maxWidth: '900px', margin: '0 auto', fontSize: '10px' }}>
            <thead>
              <tr>
                <th style={{ width: '30px', border: '1px solid #000', padding: mapStyles.padding, background: '#e2e8f0' }}></th>
                {Array.from({ length: cols }).map((_, cIndex) => (
                  <th key={`col-${cIndex}`} style={{ width: mapStyles.cellWidth, border: '1px solid #000', padding: mapStyles.padding, background: '#e2e8f0', textAlign: 'center', color: '#000', fontSize: mapStyles.headerSize }}>
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
                    <td style={{ border: '1px solid #000', padding: mapStyles.padding, background: '#e2e8f0', textAlign: 'center', fontWeight: 'bold', color: '#000', fontSize: mapStyles.headerSize }}>
                      {rLabel}
                    </td>
                    {Array.from({ length: cols }).map((_, cIndex) => {
                      const pos = `${rLabel}${cIndex + 1}`;
                      const batch = batchMap[pos];

                      // Background logic (Black and White Focus)
                      const cellBgColor = batch
                        ? '#ffffff' // Ocupado: Fondo blanco para ahorrar tinta
                        : '#f0f0f0'; // Vacío: Gris muy clarito para distinguir la grilla

                      return (
                        <td key={pos} style={{
                          border: '1px solid #000',
                          padding: mapStyles.padding,
                          textAlign: 'center',
                          height: mapStyles.cellHeight,
                          width: mapStyles.cellWidth,
                          verticalAlign: 'middle',
                          backgroundColor: cellBgColor,
                          color: '#000',
                          position: 'relative'
                        }}>
                          {isZoomedOut ? (
                            // --- VISTA COMPACTA ---
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{
                                fontWeight: batch ? 'bold' : 'normal',
                                fontSize: '11px',
                                color: batch ? '#000' : '#888',
                              }}>
                                {pos}
                              </span>
                            </div>
                          ) : (
                            // --- VISTA DETALLADA ---
                            batch ? (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: mapStyles.gapSize }}>
                                <span style={{ fontWeight: 'bold', fontSize: mapStyles.mainTextSize, lineHeight: 1.1 }}>{batch.tracking_code || batch.name}</span>
                                <span style={{ fontSize: mapStyles.subTextSize, color: '#444', lineHeight: 1.1, marginTop: mapStyles.gapSize }}>{batch.genetic?.name?.substring(0, 15) || 'S/G'}</span>
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

        <div style={{ marginTop: '2rem', display: 'flex', gap: '2rem', justifyContent: 'center', fontSize: '12px', color: '#666' }}>
          <div><strong>Total Plantas:</strong> {totalPlants}</div>
          <div><strong>Lotes Activos:</strong> {batches.length}</div>
        </div>
      </PageOne>

      {/* --- PAGE 2: TABLE --- */}
      <PageTwo style={{ display: 'block', pageBreakBefore: 'always' }}>

        {/* --- PAGE 2: DETAILS --- */}
        <Header>
          <div>
            <Title>{roomName}</Title>
            <Subtitle>Detalle de Lotes - Continuación</Subtitle>
          </div>
          <div style={{ textAlign: 'right' }}>
            <DateText>Página 2</DateText>
          </div>
        </Header>

        <SectionTitle>Listado de Lotes</SectionTitle>
        <Table>
          <thead>
            <tr>
              <th style={{ width: '60px', textAlign: 'center' }}>Pos</th>
              <th style={{ width: '120px' }}>Código</th>
              <th>Genética / Nombre</th>
              <th style={{ width: '60px', textAlign: 'center' }}>Cant.</th>
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
                <td colSpan={6} style={{ textAlign: 'center', padding: '1rem', color: '#999' }}>
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
