import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { KPICard } from '../components/charts/KPICard';
import { TrendChart } from '../components/charts/TrendChart';
import { metricsService, MonthlyMetric, GeneticPerformance, CostCategory } from '../services/metricsService';
import { FaChartLine, FaLeaf, FaDollarSign, FaBolt, FaTrashRestore } from 'react-icons/fa';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useOrganization } from '../context/OrganizationContext';
import toast from 'react-hot-toast';
import UpgradeOverlay from '../components/common/UpgradeOverlay';

const Container = styled.div`
  padding: 1rem;
  padding-top: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;
  color: #f8fafc;
  box-sizing: border-box;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  h1 { font-size: 2rem; color: #f8fafc; margin: 0; }
  p { color: #94a3b8; margin: 0.5rem 0 0 0; }

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
  }
`;

const ClearButton = styled.button`
  background: rgba(229, 62, 62, 0.1);
  color: #fc8181;
  border: 1px solid rgba(229, 62, 62, 0.3);
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;

  &:hover {
    background: rgba(229, 62, 62, 0.2);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
      grid-template-columns: 1fr;
      gap: 1.5rem;
  }
`;

const StatsCard = styled.div`
  background: rgba(30, 41, 59, 0.6);
  padding: 1.5rem;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2);
  backdrop-filter: blur(12px);

  @media (max-width: 768px) {
    padding: 1rem;
    border-radius: 0.75rem;
  }
`;

const Metrics: React.FC = () => {
    const { currentOrganization } = useOrganization();
    const plan = currentOrganization?.plan || 'individual';
    const planLevel = ['trazapp'].includes(plan) ? 4 :
        ['ong', 'enterprise'].includes(plan) ? 3 :
            ['equipo', 'pro'].includes(plan) ? 2 : 1;

    const [loading, setLoading] = useState(true);
    const [monthlyMetrics, setMonthlyMetrics] = useState<MonthlyMetric[]>([]);
    const [genetics, setGenetics] = useState<GeneticPerformance[]>([]);
    const [costs, setCosts] = useState<CostCategory[]>([]);
    const [mortality, setMortality] = useState<{ reason: string, count: number }[]>([]);
    const [survivalRates, setSurvivalRates] = useState<{ genetic_name: string, survival_rate: number, total: number, discarded: number }[]>([]);
    const [labYield, setLabYield] = useState<number>(0);
    const [labYieldByTechnique, setLabYieldByTechnique] = useState<{ technique: string, yield_percentage: number, total_input: number, total_output: number }[]>([]);
    const [year] = useState(new Date().getFullYear());

    const [isClearing, setIsClearing] = useState(false);

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [year]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [mMetrics, genPerf, costBreakdown, mort, surv, lYield, lYieldTech] = await Promise.all([
                metricsService.getMonthlyMetrics(year),
                metricsService.getGeneticPerformance(),
                metricsService.getCostBreakdown(`${year}-01-01`, `${year}-12-31`),
                metricsService.getMortalityStats(),
                metricsService.getGeneticSurvivalRate(),
                metricsService.getLabAverageYield(),
                metricsService.getLabYieldByTechnique()
            ]);

            setMonthlyMetrics(mMetrics);
            setGenetics(genPerf);
            setCosts(costBreakdown);
            setMortality(mort);
            setSurvivalRates(surv);
            setLabYield(lYield);
            setLabYieldByTechnique(lYieldTech);
        } catch (error) {
            console.error("Error loading metrics:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleClearData = async () => {
        if (!window.confirm("⚠️ ADVERTENCIA DE DESARROLLO ⚠️\n\nEstás a punto de borrar TODOS los lotes físicos, gastos, historial de bajas (mortalidad) y caché de métricas de esta organización para dejar las estadísticas en 0.\n\n¿Estás completamente seguro de continuar?")) {
            return;
        }

        setIsClearing(true);
        try {
            const success = await metricsService.clearTestData();
            if (success) {
                toast.success("Datos de prueba limpiados correctamente");
                await loadData(); // Reload empty metrics
            } else {
                toast.error("Error al limpiar los datos de prueba");
            }
        } catch (error) {
            console.error("Error clearing data:", error);
            toast.error("Ocurrió un error inesperado al limpiar");
        } finally {
            setIsClearing(false);
        }
    };

    if (loading) return <LoadingSpinner fullScreen />;

    // Aggregate Totals
    const totalYield = monthlyMetrics.reduce((acc, m) => acc + (Number(m.total_yield) || 0), 0);
    const totalRevenue = monthlyMetrics.reduce((acc, m) => acc + (Number(m.total_revenue) || 0), 0);
    const totalExpenses = monthlyMetrics.reduce((acc, m) => acc + (Number(m.total_expenses) || 0), 0);

    const totalStarted = survivalRates.reduce((acc, s) => acc + s.total, 0);
    const totalDiscarded = survivalRates.reduce((acc, s) => acc + s.discarded, 0);
    const globalEffectiveness = totalStarted > 0 ? ((totalStarted - totalDiscarded) / totalStarted * 100).toFixed(1) : '100.0';


    return (
        <Container style={{ position: 'relative', overflow: 'hidden' }}>
            {planLevel < 2 && <UpgradeOverlay requiredPlanName="Equipo o superior" />}

            <div style={{ filter: planLevel < 2 ? 'blur(4px)' : 'none', pointerEvents: planLevel < 2 ? 'none' : 'auto', userSelect: planLevel < 2 ? 'none' : 'auto', opacity: planLevel < 2 ? 0.5 : 1 }}>
                <Header>
                    <div>
                        <h1>Reportes y Métricas</h1>
                        <p>Análisis de rendimiento y financiero del año {year}</p>
                    </div>
                    <ClearButton onClick={handleClearData} disabled={isClearing}>
                        <FaTrashRestore />
                        {isClearing ? 'Limpiando Base de Datos...' : 'Limpiar Datos de Prueba'}
                    </ClearButton>
                </Header>

                {/* KPI Cards */}
                <Grid>
                    <KPICard
                        title="Cosecha Total"
                        value={`${(totalYield / 1000).toFixed(2)} kg`}
                        icon={<FaLeaf />}
                        color="#48bb78"
                    />
                    <KPICard
                        title="Ingresos Estimados"
                        value={`$${totalRevenue.toLocaleString()}`}
                        icon={<FaDollarSign />}
                        color="#3182ce"
                        trend={totalRevenue > 0 ? 10 : 0} // Mock trend for now
                        trendLabel="vs año anterior"
                    />
                    <KPICard
                        title="Gastos Operativos"
                        value={`$${totalExpenses.toLocaleString()}`}
                        icon={<FaBolt />}
                        color="#f56565"
                    />
                    <KPICard
                        title="Efectividad Global"
                        value={`${globalEffectiveness}%`}
                        icon={<FaChartLine />}
                        color={Number(globalEffectiveness) >= 80 ? "#48bb78" : "#ecc94b"}
                    />
                    <KPICard
                        title="Retorno Lab"
                        value={`${labYield.toFixed(1)}%`}
                        icon={<FaChartLine />}
                        color={labYield >= 10 ? "#48bb78" : "#ecc94b"}
                    />
                </Grid>

                {/* Main Charts */}
                <ChartsGrid>
                    {/* Financial Trend */}
                    <TrendChart
                        title="Flujo de Caja Mensual"
                        data={monthlyMetrics}
                        dataKey1="total_revenue" name1="Ingresos" color1="#3182ce" type1="bar"
                        dataKey2="total_expenses" name2="Gastos" color2="#f56565" type2="area"
                    />

                    {/* Yield Trend */}
                    <TrendChart
                        title="Producción Mensual (Gramos)"
                        data={monthlyMetrics}
                        dataKey1="total_yield" name1="Cosecha (g)" color1="#48bb78" type1="area"
                        unit=""
                    />
                </ChartsGrid>

                {/* Secondary Analysis */}
                <ChartsGrid>
                    {/* Top Genetics Table/List could go here */}
                    <StatsCard>
                        <h3 style={{ marginBottom: '1rem', color: '#f8fafc' }}>Rendimiento por Genética</h3>
                        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '400px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid rgba(255, 255, 255, 0.1)', textAlign: 'left' }}>
                                        <th style={{ padding: '0.5rem', color: '#94a3b8' }}>Genética</th>
                                        <th style={{ padding: '0.5rem', color: '#94a3b8' }}>Total (g)</th>
                                        <th style={{ padding: '0.5rem', color: '#94a3b8' }}>Cosechas</th>
                                        <th style={{ padding: '0.5rem', color: '#94a3b8' }}>Promedio (g)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {genetics.map((g, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                            <td style={{ padding: '0.75rem', fontWeight: 600 }}>{g.genetic_name || 'Desconocida'}</td>
                                            <td style={{ padding: '0.75rem' }}>{Number(g.total_yield_g).toLocaleString()}</td>
                                            <td style={{ padding: '0.75rem' }}>{g.harvest_count}</td>
                                            <td style={{ padding: '0.75rem', color: '#4ade80', fontWeight: 700 }}>{Number(g.avg_yield_per_harvest).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {genetics.length === 0 && (
                                        <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Sin datos de cosecha</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </StatsCard>

                    {/* Cost Breakdown */}
                    <StatsCard>
                        <h3 style={{ marginBottom: '1rem', color: '#f8fafc' }}>Desglose de Gastos</h3>
                        {costs.map((c, i) => (
                            <div key={i} style={{ marginBottom: '0.75rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                                    <span style={{ textTransform: 'capitalize', color: '#cbd5e1' }}>{c.category === 'electricity' ? 'Luz' : c.category === 'nutrients' ? 'Nutrientes' : c.category}</span>
                                    <span style={{ fontWeight: 600 }}>${Number(c.total_amount).toLocaleString()}</span>
                                </div>
                                <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ width: `${c.percentage}%`, background: '#c084fc', height: '100%' }}></div>
                                </div>
                            </div>
                        ))}
                        {costs.length === 0 && (
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No hay gastos registrados este año</div>
                        )}
                    </StatsCard>
                </ChartsGrid>

                {/* Eficiencia Biológica */}
                <ChartsGrid>
                    <StatsCard>
                        <h3 style={{ marginBottom: '1rem', color: '#f8fafc' }}>Efectividad / Enraizamiento</h3>
                        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '400px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid rgba(255, 255, 255, 0.1)', textAlign: 'left' }}>
                                        <th style={{ padding: '0.5rem', color: '#94a3b8' }}>Genética</th>
                                        <th style={{ padding: '0.5rem', color: '#94a3b8' }}>Iniciadas</th>
                                        <th style={{ padding: '0.5rem', color: '#94a3b8' }}>Bajas</th>
                                        <th style={{ padding: '0.5rem', color: '#94a3b8' }}>Efectividad</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {survivalRates.map((g, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                            <td style={{ padding: '0.75rem', fontWeight: 600 }}>{g.genetic_name || 'Desconocida'}</td>
                                            <td style={{ padding: '0.75rem' }}>{Number(g.total).toLocaleString()} u.</td>
                                            <td style={{ padding: '0.75rem', color: g.discarded > 0 ? '#f87171' : 'inherit' }}>{Number(g.discarded).toLocaleString()} u.</td>
                                            <td style={{ padding: '0.75rem', color: g.survival_rate >= 80 ? '#4ade80' : '#fbbf24', fontWeight: 700 }}>{g.survival_rate.toFixed(1)}%</td>
                                        </tr>
                                    ))}
                                    {survivalRates.length === 0 && (
                                        <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Sin datos registrados</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </StatsCard>

                    <StatsCard>
                        <h3 style={{ marginBottom: '1rem', color: '#f8fafc' }}>Causas de Mortalidad (Bajas)</h3>
                        {mortality.map((m, i) => {
                            const totalM = mortality.reduce((sum, item) => sum + item.count, 0);
                            const perc = totalM > 0 ? (m.count / totalM) * 100 : 0;
                            return (
                                <div key={i} style={{ marginBottom: '0.75rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                                        <span style={{ textTransform: 'capitalize', color: '#cbd5e1' }}>{m.reason}</span>
                                        <span style={{ fontWeight: 600 }}>{m.count} u. ({perc.toFixed(1)}%)</span>
                                    </div>
                                    <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{ width: `${perc}%`, background: '#f87171', height: '100%' }}></div>
                                    </div>
                                </div>
                            );
                        })}
                        {mortality.length === 0 && (
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No hay bajas registradas</div>
                        )}
                    </StatsCard>
                    <StatsCard>
                        <h3 style={{ marginBottom: '1rem', color: '#f8fafc' }}>Retorno por Técnica (Laboratorio)</h3>
                        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '300px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid rgba(255, 255, 255, 0.1)', textAlign: 'left' }}>
                                        <th style={{ padding: '0.5rem', color: '#94a3b8' }}>Técnica</th>
                                        <th style={{ padding: '0.5rem', color: '#94a3b8' }}>Materia (g)</th>
                                        <th style={{ padding: '0.5rem', color: '#94a3b8' }}>Extracto (g)</th>
                                        <th style={{ padding: '0.5rem', color: '#94a3b8' }}>Retorno</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {labYieldByTechnique.map((t, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                            <td style={{ padding: '0.75rem', fontWeight: 600 }}>{t.technique}</td>
                                            <td style={{ padding: '0.75rem' }}>{Number(t.total_input).toLocaleString()}</td>
                                            <td style={{ padding: '0.75rem' }}>{Number(t.total_output).toLocaleString()}</td>
                                            <td style={{ padding: '0.75rem', color: t.yield_percentage >= 10 ? '#4ade80' : '#fbbf24', fontWeight: 700 }}>{t.yield_percentage.toFixed(1)}%</td>
                                        </tr>
                                    ))}
                                    {labYieldByTechnique.length === 0 && (
                                        <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Sin datos de extracciones</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </StatsCard>
                </ChartsGrid>
            </div>
        </Container>
    );
};

export default Metrics;
