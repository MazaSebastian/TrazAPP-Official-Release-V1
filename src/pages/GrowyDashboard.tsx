import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { supabase } from '../services/supabaseClient';
import { useOrganization } from '../context/OrganizationContext';

const PageContainer = styled.div`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 32px;
  h1 {
    font-size: 28px;
    font-weight: 700;
    color: #fff;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  p { color: rgba(255,255,255,0.5); margin-top: 4px; }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
`;

const StatCard = styled.div`
  background: rgba(255,255,255,0.05);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  padding: 20px;
  .label { color: rgba(255,255,255,0.5); font-size: 13px; margin-bottom: 8px; }
  .value { font-size: 32px; font-weight: 700; color: #00ff88; }
  .sub { font-size: 12px; color: rgba(255,255,255,0.4); margin-top: 4px; }
`;

const TableContainer = styled.div`
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 24px;
  h3 {
    padding: 16px 20px;
    margin: 0;
    color: #fff;
    font-size: 16px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  th, td {
    padding: 12px 20px;
    text-align: left;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    color: rgba(255,255,255,0.7);
    font-size: 13px;
  }
  th { color: rgba(255,255,255,0.4); font-weight: 500; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
  tr:last-child td { border-bottom: none; }
  .success { color: #00ff88; }
  .error { color: #ef4444; }
`;

const COST_PER_REQUEST = 0.02; // Estimated cost per Growy request in USD

const GrowyDashboard: React.FC = () => {
    const { currentOrganization } = useOrganization();
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentOrganization?.id) return;
        const fetchLogs = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('growy_audit_log')
                .select('*')
                .eq('organization_id', currentOrganization.id)
                .order('created_at', { ascending: false })
                .limit(200);
            if (!error && data) setLogs(data);
            setLoading(false);
        };
        fetchLogs();
    }, [currentOrganization?.id]);

    const totalRequests = logs.length;
    const successCount = logs.filter(l => l.result === 'success').length;
    const errorCount = logs.filter(l => l.result === 'error').length;
    const totalActions = logs.reduce((sum, l) => sum + (l.action_count || 0), 0);
    const estimatedCost = (totalRequests * COST_PER_REQUEST).toFixed(2);

    // Top actions
    const actionFrequency: Record<string, number> = {};
    logs.forEach(log => {
        if (log.actions && Array.isArray(log.actions)) {
            log.actions.forEach((a: any) => {
                const name = a.name || 'unknown';
                actionFrequency[name] = (actionFrequency[name] || 0) + 1;
            });
        }
    });
    const topActions = Object.entries(actionFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);

    // Usage by day (last 30 days)
    const last30 = logs.filter(l => {
        const d = new Date(l.created_at);
        return d > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    });

    return (
        <PageContainer>
            <Header>
                <h1>🤖 Growy AI Dashboard</h1>
                <p>Métricas de uso del asistente de inteligencia artificial</p>
            </Header>

            <Grid>
                <StatCard>
                    <div className="label">Total Consultas</div>
                    <div className="value">{totalRequests}</div>
                    <div className="sub">{last30.length} últimos 30 días</div>
                </StatCard>
                <StatCard>
                    <div className="label">Acciones Ejecutadas</div>
                    <div className="value">{totalActions}</div>
                    <div className="sub">{successCount} exitosas, {errorCount} con error</div>
                </StatCard>
                <StatCard>
                    <div className="label">Tasa de Éxito</div>
                    <div className="value">{totalRequests > 0 ? ((successCount / totalRequests) * 100).toFixed(0) : 0}%</div>
                </StatCard>
                <StatCard>
                    <div className="label">Costo Estimado</div>
                    <div className="value">${estimatedCost}</div>
                    <div className="sub">USD (~$0.02/request)</div>
                </StatCard>
            </Grid>

            {topActions.length > 0 && (
                <TableContainer>
                    <h3>🏆 Acciones Más Utilizadas</h3>
                    <Table>
                        <thead>
                            <tr><th>Acción</th><th>Frecuencia</th></tr>
                        </thead>
                        <tbody>
                            {topActions.map(([name, count]) => (
                                <tr key={name}><td>{name}</td><td>{count}</td></tr>
                            ))}
                        </tbody>
                    </Table>
                </TableContainer>
            )}

            <TableContainer>
                <h3>📋 Historial Reciente</h3>
                <Table>
                    <thead>
                        <tr><th>Fecha</th><th>Prompt</th><th>Acciones</th><th>Resultado</th></tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={4} style={{ textAlign: 'center', padding: '24px' }}>Cargando...</td></tr>
                        ) : logs.slice(0, 20).map(log => (
                            <tr key={log.id}>
                                <td>{new Date(log.created_at).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                                <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.prompt || '-'}</td>
                                <td>{log.action_count || 0}</td>
                                <td className={log.result === 'success' ? 'success' : 'error'}>{log.result}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </TableContainer>
        </PageContainer>
    );
};

export default GrowyDashboard;
