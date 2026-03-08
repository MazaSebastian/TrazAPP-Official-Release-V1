import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { FaFileAlt, FaSearch, FaLeaf, FaTruck, FaTasks, FaMoneyBillWave, FaTrashAlt, FaPrint, FaPills, FaCalendarAlt } from 'react-icons/fa';
import { Batch } from '../types/rooms';
import { reportsService, BatchTraceabilityReport } from '../services/reportsService';
import { dispensaryService, DispensaryMovement } from '../services/dispensaryService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { CustomSelect } from '../components/CustomSelect';
import { CustomDatePicker } from '../components/CustomDatePicker';
import { useReactToPrint } from 'react-to-print';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const PageContainer = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 1rem;
`;

const Header = styled.div`
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  h1 {
    font-size: 2rem;
    font-weight: 700;
    color: #f8fafc;
    margin: 0 0 0.5rem 0;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  p {
    color: #94a3b8;
    margin: 0;
  }
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 1px;
  overflow-x: auto;
  
  ::-webkit-scrollbar {
    height: 4px;
  }
`;

const TabButton = styled.button<{ $isActive: boolean }>`
  background: none;
  border: none;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: ${props => props.$isActive ? '#3b82f6' : '#94a3b8'};
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;

  &:hover {
    color: ${props => props.$isActive ? '#3b82f6' : '#f8fafc'};
  }

  &::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 2px;
    background: ${props => props.$isActive ? '#3b82f6' : 'transparent'};
    transition: all 0.2s;
  }
`;

const SearchContainer = styled.div`
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 2rem;

  .search-wrapper {
    display: flex;
    gap: 1rem;
    align-items: center;

    @media (max-width: 768px) {
      flex-direction: column;
    }
  }

  select {
    flex: 1;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #f8fafc;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    font-size: 1rem;
    outline: none;
    transition: all 0.2s;

    &:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }
  }
`;

const ContentPanel = styled.div`
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 1.5rem;
  padding: 2rem;
  color: #f8fafc;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const TimelineContainer = styled.div`
  position: relative;
  margin-top: 2rem;
  padding-left: 2rem;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 9px;
    width: 2px;
    background: rgba(255, 255, 255, 0.1);
  }
`;

const TimelineEvent = styled.div<{ $color: string; $clickable?: boolean }>`
  position: relative;
  margin-bottom: 1rem;
  cursor: ${props => props.$clickable ? 'pointer' : 'default'};
  transition: transform 0.2s;
  
  &:last-child {
    margin-bottom: 0;
  }

  ${props => props.$clickable && `
    &:hover .event-content {
      border-color: ${props.$color};
      background: rgba(15, 23, 42, 0.6);
      transform: translateX(4px);
    }
  `}

  .event-icon-wrapper {
    position: absolute;
    left: -2rem;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: ${props => props.$color};
    border: 3px solid rgba(15, 23, 42, 1);
    display: flex;
    align-items: center;
    justify-content: center;
    transform: translateX(-50%);
    box-shadow: 0 0 8px ${props => props.$color}40;
    z-index: 10;
    
    svg {
      width: 8px;
      height: 8px;
    }
  }

  .event-content {
    background: rgba(15, 23, 42, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.05);
    padding: 0.75rem 1rem;
    border-radius: 0.75rem;
    transition: all 0.2s;

    &:hover {
      background: rgba(15, 23, 42, 0.6);
      border-color: rgba(255, 255, 255, 0.1);
      transform: translateX(4px);
    }
  }

  .event-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.25rem;

    @media (max-width: 600px) {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.25rem;
    }
  }

  .event-date {
    font-size: 0.75rem;
    color: #94a3b8;
    font-weight: 500;
  }

  .event-title {
    font-size: 0.95rem;
    font-weight: 600;
    color: ${props => props.$color};
    margin: 0;
  }

  .event-desc {
    font-size: 0.85rem;
    color: #cbd5e1;
    line-height: 1.4;
    margin: 0;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: #0f172a;
  border-radius: 1.25rem;
  width: 100%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);

  .modal-header {
    padding: 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    justify-content: space-between;
    align-items: center;

    h3 {
      margin: 0;
      color: #f8fafc;
      font-size: 1.25rem;
    }

    button {
      background: rgba(255,255,255,0.05);
      border: none;
      color: #94a3b8;
      width: 32px;
      height: 32px;
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      &:hover { background: rgba(255,255,255,0.1); color: #fff; }
    }
  }

  .modal-body {
    padding: 1.5rem;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
`;

const Badge = styled.span`
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
`;

const PrintButton = styled.button`
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #2563eb;
    transform: translateY(-2px);
  }
  
  &:disabled {
    background: #475569;
    cursor: not-allowed;
    transform: none;
  }
`;

const Informes = () => {
  const [activeTab, setActiveTab] = useState<'trazabilidad' | 'dispensario'>('trazabilidad');

  // Trazabilidad State
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [report, setReport] = useState<BatchTraceabilityReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [selectedEventUnits, setSelectedEventUnits] = useState<{ id: string, name: string, tracking_code?: string }[] | null>(null);

  // Dispensario State
  const [dispenseReports, setDispenseReports] = useState<DispensaryMovement[]>([]);
  const [filteredDispenseReports, setFilteredDispenseReports] = useState<DispensaryMovement[]>([]);
  const [dispensaryStartDate, setDispensaryStartDate] = useState<string>('');
  const [dispensaryEndDate, setDispensaryEndDate] = useState<string>('');
  const [dispensarySearchTerm, setDispensarySearchTerm] = useState<string>('');
  const [loadingDispensary, setLoadingDispensary] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);

  // Initial Fetch based on Tab
  useEffect(() => {
    if (activeTab === 'trazabilidad' && batches.length === 0) {
      const fetchSelectData = async () => {
        setLoading(true);
        const allBatches = await reportsService.getAllBatchesForReporting();
        setBatches(allBatches);
        setLoading(false);
      };
      fetchSelectData();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'dispensario') {
      const fetchDispensaryReports = async () => {
        setLoadingDispensary(true);
        let start: Date | undefined;
        if (dispensaryStartDate) {
          const d = new Date(`${dispensaryStartDate}T00:00:00`);
          if (!isNaN(d.getTime())) start = d;
        }

        let end: Date | undefined;
        if (dispensaryEndDate) {
          const d = new Date(`${dispensaryEndDate}T23:59:59`);
          if (!isNaN(d.getTime())) end = d;
        }

        const data = await dispensaryService.getMovements(500, start, end);
        // Filter to only dispenses
        const dispenses = data.filter(m => m.type === 'dispense');
        setDispenseReports(dispenses);
        setFilteredDispenseReports(dispenses);
        setLoadingDispensary(false);
      };
      fetchDispensaryReports();
    }
  }, [activeTab, dispensaryStartDate, dispensaryEndDate]);

  // Handle Dispensario Text Filtering
  useEffect(() => {
    if (activeTab === 'dispensario') {
      let filtered = dispenseReports;
      if (dispensarySearchTerm.trim()) {
        const lowerTerm = dispensarySearchTerm.toLowerCase();
        filtered = dispenseReports.filter(m => {
          const profileName = (m as any).profile?.full_name?.toLowerCase() || '';
          const strainName = m.batch?.strain_name?.toLowerCase() || '';
          const reason = m.reason?.toLowerCase() || '';
          return profileName.includes(lowerTerm) || strainName.includes(lowerTerm) || reason.includes(lowerTerm);
        });
      }
      setFilteredDispenseReports(filtered);
    }
  }, [dispensarySearchTerm, dispenseReports, activeTab]);

  useEffect(() => {
    if (!selectedBatchId) {
      setReport(null);
      return;
    }

    const fetchReport = async () => {
      setLoadingReport(true);
      const data = await reportsService.getBatchTraceability(selectedBatchId);
      setReport(data);
      setLoadingReport(false);
    };

    fetchReport();
  }, [selectedBatchId]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: activeTab === 'trazabilidad'
      ? (report ? `Trazabilidad_Lote_${report.batch.tracking_code || report.batch.name}` : 'Trazabilidad_Lote')
      : 'Informe_Salidas_Dispensario',
  });

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'creation': return <FaLeaf size={10} color="#0f172a" />;
      case 'movement': return <FaTruck size={10} color="#0f172a" />;
      case 'task': return <FaTasks size={10} color="#0f172a" />;
      case 'expense': return <FaMoneyBillWave size={10} color="#0f172a" />;
      case 'discard': return <FaTrashAlt size={10} color="#0f172a" />;
      default: return <FaLeaf size={10} color="#0f172a" />;
    }
  };

  return (
    <PageContainer>
      <Header>
        <div>
          <h1><FaFileAlt color="#3b82f6" /> Informes</h1>
          <p>Auditoría completa de cultivos y dispensario.</p>
        </div>
        <PrintButton onClick={handlePrint} disabled={activeTab === 'trazabilidad' ? !report : filteredDispenseReports.length === 0}>
          <FaPrint /> Imprimir PDF
        </PrintButton>
      </Header>

      <TabsContainer>
        <TabButton
          $isActive={activeTab === 'trazabilidad'}
          onClick={() => setActiveTab('trazabilidad')}
        >
          <FaLeaf /> Trazabilidad de Lotes
        </TabButton>
        <TabButton
          $isActive={activeTab === 'dispensario'}
          onClick={() => setActiveTab('dispensario')}
        >
          <FaPills /> Salidas de Dispensario
        </TabButton>
      </TabsContainer>

      {activeTab === 'trazabilidad' ? (
        <>
          <SearchContainer>
            <div className="search-wrapper">
              <FaSearch color="#64748b" size={20} />
              {loading ? (
                <span style={{ color: '#94a3b8' }}>Cargando lotes...</span>
              ) : (
                <div style={{ flex: 1 }}>
                  <CustomSelect
                    value={selectedBatchId}
                    onChange={setSelectedBatchId}
                    placeholder="Selecciona un Lote / Tracking Code..."
                    options={batches.map((b: any) => {
                      const isDistributed = b.quantity === 0 && b.discard_reason?.includes('Distribuido en Mapa');
                      let displayQty = b.quantity;
                      if (isDistributed && b.children && b.children.length > 0) {
                        if (b.children[0].count !== undefined) {
                          displayQty = b.children[0].count; // Fallback to raw count if format matches
                        } else {
                          // Filter surviving children for dynamic remaining sum
                          displayQty = b.children.filter((c: any) => !c.discarded_at).length;
                        }
                      }
                      const quantityLabel = isDistributed ? `${displayQty} un. (Distribuidas)` : `${displayQty} un.`;
                      return {
                        value: b.id,
                        label: `${b.tracking_code ? `[${b.tracking_code}] ` : ''}${b.name} - ${b.genetic?.name || 'Genética Desconocida'} (${quantityLabel})`
                      };
                    })}
                  />
                </div>
              )}
            </div>
          </SearchContainer>

          {loadingReport ? (
            <ContentPanel style={{ textAlign: 'center', padding: '4rem' }}>
              <LoadingSpinner />
              <p style={{ marginTop: '1rem', color: '#94a3b8' }}>Recopilando eventos históricos...</p>
            </ContentPanel>
          ) : report ? (
            <ContentPanel className="informes-print-area" ref={printRef}>
              {/* Re-styling slightly directly for the print ref or letting global css handle it */}
              {/* We wrap it here to ensure the printable area is strictly this div */}

              {/* Custom style block injected only for printing mode inside this ref can be tricky with styled-components, 
                        but usually handled by media query. For safety, ensuring a clean white bg if printed. */}
              <style>
                {`
                            @media print {
                                @page { margin: 15mm; }
                                body { background: white; color: black; }
                                .informes-print-area { background: white !important; color: black !important; box-shadow: none; border: none; }
                                .event-desc, .event-date { color: #475569 !important; }
                                .header-info { color: #000 !important; }
                                .event-content { background: #f8fafc !important; border: 1px solid #e2e8f0 !important; }
                                .event-icon-wrapper { border-color: white !important; }
                            }
                        `}
              </style>

              <div style={{ paddingBottom: '2rem', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h2 style={{ margin: 0 }}>Reporte de Trazabilidad: {report.batch.name}</h2>
                  {report.batch.tracking_code && <Badge>ID: {report.batch.tracking_code}</Badge>}
                </div>

                <div className="header-info" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem', padding: '1.5rem', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '1rem', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <div>
                    <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Genética</p>
                    <p style={{ fontWeight: '500' }}>{report.batch.genetic?.name || report.batch.strain || 'Desconocida'}</p>
                  </div>
                  <div>
                    <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Origen</p>
                    <p style={{ fontWeight: '500' }}>{format(new Date(report.batch.start_date || report.batch.created_at), 'dd/MM/yyyy')}</p>
                  </div>
                  <div>
                    <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Cantidad Original</p>
                    <p style={{ fontWeight: '500' }}>
                      {(() => {
                        const b: any = report.batch;
                        if (b.quantity === 0 && b.discard_reason?.includes('Distribuido en Mapa')) {
                          const childCount = (b.children && b.children.length > 0)
                            ? (b.children[0].count !== undefined ? b.children[0].count : b.children.length)
                            : 0;
                          return `${childCount} unidades (Distribuidas)`;
                        }
                        return `${b.quantity} unidades`;
                      })()}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Estado Actual</p>
                    <p style={{ fontWeight: '500' }}>
                      {(() => {
                        const b: any = report.batch;
                        if (b.quantity === 0 && b.discard_reason?.includes('Distribuido en Mapa') && b.children && b.children.length > 0 && b.children[0].count === undefined) {
                          const activeCount = b.children.filter((c: any) => !c.discarded_at).length;
                          return activeCount > 0 ? `Activo (${activeCount} un. restantes)` : 'Finalizado/Baja';
                        }
                        return !b.discarded_at ? 'Activo' : 'Finalizado/Baja';
                      })()}
                    </p>
                  </div>
                </div>
              </div>

              <TimelineContainer>
                {report.events.length === 0 ? (
                  <p style={{ color: '#94a3b8', fontStyle: 'italic', marginTop: '2rem' }}>No hay eventos registrados para este lote.</p>
                ) : (
                  report.events.map((evt, idx) => (
                    <TimelineEvent
                      key={evt.id + '-' + idx}
                      $color={evt.color || '#3b82f6'}
                      $clickable={!!evt.affected_units && evt.affected_units.length > 0}
                      onClick={() => {
                        if (evt.affected_units && evt.affected_units.length > 0) {
                          setSelectedEventUnits(evt.affected_units);
                        }
                      }}
                    >
                      <div className="event-icon-wrapper">
                        {getEventIcon(evt.type)}
                      </div>
                      <div className="event-content">
                        <div className="event-header">
                          <h3 className="event-title">{evt.title}</h3>
                          <span className="event-date">
                            {format(new Date(evt.date), "dd/MMM/yyyy HH:mm", { locale: es })}
                          </span>
                        </div>
                        <p className="event-desc">{evt.description}</p>
                      </div>
                    </TimelineEvent>
                  ))
                )}
              </TimelineContainer>

            </ContentPanel>
          ) : (
            <ContentPanel style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <FaFileAlt size={48} color="rgba(255, 255, 255, 0.1)" style={{ marginBottom: '1rem' }} />
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#94a3b8' }}>Ningún Lote Seleccionado</h3>
              <p style={{ margin: 0, color: '#64748b' }}>Utiliza el buscador de arriba para iniciar la auditoría de un lote.</p>
            </ContentPanel>
          )}

          {selectedEventUnits && (
            <ModalOverlay onClick={() => setSelectedEventUnits(null)}>
              <ModalContent onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Unidades Involucradas ({selectedEventUnits.length})</h3>
                  <button title="Cerrar" onClick={() => setSelectedEventUnits(null)}>✕</button>
                </div>
                <div className="modal-body">
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {selectedEventUnits.map(unit => (
                      <li key={unit.id} style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        padding: '1rem',
                        borderRadius: '0.75rem',
                        marginBottom: '0.75rem',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                      }}>
                        <FaLeaf color="#10b981" />
                        <span style={{ fontWeight: '600', color: '#f8fafc', minWidth: '80px' }}>
                          {unit.tracking_code ? `[${unit.tracking_code}] ` : ''}
                        </span>
                        <span style={{ color: '#cbd5e1' }}>{unit.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </ModalContent>
            </ModalOverlay>
          )}
        </>
      ) : (
        /* DISPENSARY TAB CONTENT */
        <>
          <SearchContainer>
            <div className="search-wrapper" style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) minmax(200px, 1fr) minmax(250px, 2fr)', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem', fontWeight: 600 }}>Caja Buscador</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }}>
                    <FaSearch />
                  </div>
                  <input
                    type="text"
                    placeholder="Socio, Genética o Motivo..."
                    value={dispensarySearchTerm}
                    onChange={(e) => setDispensarySearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#f8fafc',
                      padding: '0.75rem 1rem 0.75rem 2.5rem',
                      borderRadius: '0.5rem',
                      outline: 'none',
                      fontSize: '0.95rem'
                    }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem', fontWeight: 600 }}><FaCalendarAlt /> Desde</label>
                <input
                  type="date"
                  value={dispensaryStartDate}
                  onChange={(e) => setDispensaryStartDate(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#f8fafc',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.5rem',
                    outline: 'none',
                    fontSize: '0.95rem',
                    colorScheme: 'dark'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem', fontWeight: 600 }}><FaCalendarAlt /> Hasta</label>
                <input
                  type="date"
                  value={dispensaryEndDate}
                  onChange={(e) => setDispensaryEndDate(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#f8fafc',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.5rem',
                    outline: 'none',
                    fontSize: '0.95rem',
                    colorScheme: 'dark'
                  }}
                />
              </div>
            </div>
          </SearchContainer>

          <ContentPanel className="informes-print-area" ref={printRef}>
            <style>
              {`
                  @media print {
                      @page { margin: 15mm; size: landscape; }
                      body { background: white; color: black; }
                      .informes-print-area { background: white !important; color: black !important; box-shadow: none; border: none; }
                      table { width: 100%; border-collapse: collapse; }
                      th, td { border: 1px solid #cbd5e1 !important; padding: 12px; text-align: left; }
                      th { background: #f1f5f9 !important; -webkit-print-color-adjust: exact; font-weight: bold; color: #0f172a !important; }
                      td { color: #334155 !important; }
                      h2 { color: #0f172a !important; margin-bottom: 2rem !important; }
                  }
              `}
            </style>

            <h2 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FaPills color="#3b82f6" />
              Auditoría de Salidas de Stock
              {dispensaryStartDate && dispensaryEndDate && (() => {
                const s = new Date(`${dispensaryStartDate}T00:00:00`);
                const e = new Date(`${dispensaryEndDate}T23:59:59`);
                if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
                  return (
                    <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 'normal' }}>
                      ({format(s, 'dd/MM/yyyy')} - {format(e, 'dd/MM/yyyy')})
                    </span>
                  );
                }
                return null;
              })()}
            </h2>

            {loadingDispensary ? (
              <div style={{ textAlign: 'center', padding: '4rem' }}>
                <LoadingSpinner />
                <p style={{ marginTop: '1rem', color: '#94a3b8' }}>Obteniendo registros...</p>
              </div>
            ) : filteredDispenseReports.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <FaSearch size={48} color="rgba(255, 255, 255, 0.1)" style={{ marginBottom: '1rem' }} />
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#94a3b8' }}>Sin Resultados</h3>
                <p style={{ margin: 0, color: '#64748b' }}>No se encontraron salidas de stock para los filtros seleccionados.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', fontSize: '0.875rem' }}>
                      <th style={{ padding: '1rem 0.5rem', width: '150px' }}>Fecha</th>
                      <th style={{ padding: '1rem 0.5rem' }}>Socio / Receptor</th>
                      <th style={{ padding: '1rem 0.5rem' }}>Producto / Genética</th>
                      <th style={{ padding: '1rem 0.5rem', width: '120px' }}>Salida</th>
                      <th style={{ padding: '1rem 0.5rem' }}>Motivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDispenseReports.map((evt) => (
                      <tr key={evt.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', transition: 'background-color 0.2s', }}>
                        <td style={{ padding: '1rem 0.5rem', color: '#cbd5e1', fontSize: '0.9rem' }}>
                          {format(new Date(evt.created_at), 'dd/MM/yyyy HH:mm')}
                        </td>
                        <td style={{ padding: '1rem 0.5rem', fontWeight: '500' }}>
                          {(evt as any).profile?.full_name || 'Sin Asignar'}
                        </td>
                        <td style={{ padding: '1rem 0.5rem', color: '#38bdf8' }}>
                          <Badge>{evt.batch?.product_name || evt.batch?.strain_name || 'Desconocida'}</Badge>
                        </td>
                        <td style={{ padding: '1rem 0.5rem', fontWeight: '600', color: '#ef4444' }}>
                          <div>
                            {Math.abs(evt.amount)} {evt.batch?.unit === 'u' ? 'u' : evt.batch?.unit || 'g'}
                          </div>
                          {evt.batch?.unit === 'u' && evt.batch?.unit_volume && (
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem', fontWeight: 'normal' }}>
                              de {evt.batch.unit_volume}{evt.batch.unit_volume_type}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '1rem 0.5rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                          {(() => {
                            const reason = evt.reason || 'S/D';
                            if (reason.toLowerCase() === 'dispensing' || reason.toLowerCase().includes('entrega')) return 'Dispensa';
                            if (reason.toLowerCase() === 'quality_control') return 'Control de Calidad';
                            if (reason.toLowerCase() === 'disposal') return 'Baja/Descarte';
                            if (reason.toLowerCase() === 'restock') return 'Reposición/Transferencia';
                            if (reason.toLowerCase() === 'adjustment') return 'Ajuste de Stock';
                            return reason;
                          })()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </ContentPanel>
        </>
      )}

    </PageContainer>
  );
};

export default Informes;
