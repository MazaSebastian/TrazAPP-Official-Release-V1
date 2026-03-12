import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { FaMoneyBillWave, FaTrash, FaExclamationCircle, FaFilter, FaTimes } from 'react-icons/fa';
import { expensesService, CashMovement, getAreaFromRole } from '../services/expensesService';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';
import { CustomSelect } from '../components/CustomSelect';
import { useOrganization } from '../context/OrganizationContext';
import { usersService, Profile } from '../services/usersService';
import { ConfirmationModal } from '../components/ConfirmationModal';
import UpgradeOverlay from '../components/common/UpgradeOverlay';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale);

const fadeIn = keyframes`
  from { opacity: 0; backdrop-filter: blur(0px); }
  to { opacity: 1; backdrop-filter: blur(8px); }
`;

const scaleUp = keyframes`
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
`;

const fadeOutToast = keyframes`
  from { opacity: 1; transform: translate(-50%, 0); }
  to { opacity: 0; transform: translate(-50%, 20px); }
`;


const ToastContainer = styled.div<{ $isClosing: boolean }>`
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(168, 85, 247, 0.5);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5), 0 0 15px rgba(168, 85, 247, 0.2);
  border-radius: 0.75rem;
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  z-index: 10000;
  color: #f8fafc;
  font-weight: 500;
  backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
  animation: ${props => props.$isClosing ? fadeOutToast : fadeIn} 0.3s forwards;
`;

const Container = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  padding-top: 1.5rem; // Sidebar space
  min-height: 100vh;
  color: #f8fafc;

  @media (max-width: 768px) {
    padding: 1rem;
    padding-top: 1.5rem;
  }
`;

const Header = styled.div`
  margin-bottom: 2rem;
  h1 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #f8fafc;

    @media (max-width: 768px) {
      justify-content: center;
      width: 100%;
    }
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;

  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const Card = styled.div`
  background: rgba(30, 41, 59, 0.6);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
`;

const BalanceCard = styled(Card)`
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  
  h2 { font-size: 1rem; color: #94a3b8; margin: 0 0 0.5rem 0; }
  .balance { font-size: 3rem; font-weight: 800; margin: 0; color: #f8fafc; }

  @media (max-width: 768px) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.5rem;
    
    h2 { font-size: 0.9rem; margin: 0; }
    .balance { font-size: 2rem; }
  }
`;

const Form = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;

  h3 {
    margin-top: 0;
    color: #f8fafc;
    @media (max-width: 768px) {
      text-align: center;
    }
  }

  input {
    padding: 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.5rem;
    width: 100%;
    font-size: 1rem;
    background: rgba(30, 41, 59, 0.5);
    color: #f8fafc;
    backdrop-filter: blur(8px);

    &:focus {
      outline: none;
      border-color: rgba(168, 85, 247, 0.5);
      box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1);
    }
    
    &::placeholder {
      color: #64748b;
    }
  }

  button {
    background: rgba(168, 85, 247, 0.2);
    color: #d8b4fe;
    border: 1px solid rgba(168, 85, 247, 0.5);
    padding: 0.75rem;
    border-radius: 0.5rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    backdrop-filter: blur(8px);

    &:hover { 
      background: rgba(168, 85, 247, 0.3); 
      box-shadow: 0 4px 6px rgba(0,0,0,0.2); 
    }
  }
`;

const DesktopView = styled.div`
  display: block;
  @media (max-width: 768px) {
    display: none;
  }
`;

const MobileView = styled.div`
  display: none;
  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem;
  }
`;

const MovementCard = styled.div`
  background: rgba(30, 41, 59, 0.4);
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: space-between;

  &:hover {
    background: rgba(30, 41, 59, 0.6);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .left-col {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .m-date {
    font-size: 0.8rem;
    color: #94a3b8;
  }
  
  .m-owner {
    font-size: 0.85rem;
    color: #f8fafc;
    font-weight: 500;
  }

  .m-amount {
    font-size: 1rem;
    font-weight: 700;
    text-align: right;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(8px);
  z-index: 5000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  animation: ${fadeIn} 0.2s ease-out;
`;

const ModalContentDetail = styled.div`
  background: rgba(30, 41, 59, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  border-radius: 1rem;
  width: 100%;
  max-width: 400px;
  padding: 1.5rem;
  animation: ${scaleUp} 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  
  h4 { margin: 0 0 1rem 0; color: #f8fafc; font-size: 1.25rem; font-weight: 600; padding-right: 2rem; }
  .detail-group { margin-bottom: 0.75rem; }
  .detail-label { font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; font-weight: 600; display: block; margin-bottom: 0.2rem; }
  .detail-value { font-size: 0.95rem; color: #f8fafc; }
`;

const TableContainer = styled(Card)`
  grid-column: 1 / -1;
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  th, td {
    text-align: left;
    padding: 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  th { color: #cbd5e1; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; background: rgba(15, 23, 42, 0.4); }
  td { color: #f8fafc; }

  .type-badge {
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    font-weight: 700;
    border: 1px solid transparent;
    &.INGRESO { 
      background: rgba(74, 222, 128, 0.2); 
      color: #4ade80; 
      border-color: rgba(74, 222, 128, 0.5);
    }
    &.EGRESO { 
      background: rgba(239, 68, 68, 0.1); 
      color: #f87171; 
      border-color: rgba(239, 68, 68, 0.2);
    }
  }
`;

const FilterContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 1rem;
  background: rgba(15, 23, 42, 0.4);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  align-items: flex-end;

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex: 1;
    min-width: 200px;
    position: relative;
    z-index: 1000;
  }

  label {
    font-size: 0.75rem;
    color: #94a3b8;
    text-transform: uppercase;
    font-weight: 600;
  }

  input[type="date"] {
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #f8fafc;
    padding: 0.5rem 0.75rem;
    border-radius: 0.5rem;
    font-size: 0.85rem;
    color-scheme: dark;
    height: 38px;
    &:focus { outline: none; border-color: rgba(168, 85, 247, 0.5); }
  }

  .date-mode-toggle {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    button {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      color: #94a3b8;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      cursor: pointer;
      &.active {
        background: rgba(168, 85, 247, 0.2);
        color: #d8b4fe;
        border-color: rgba(168, 85, 247, 0.5);
      }
    }
  }
`;

const Expenses: React.FC = () => {
    const { currentOrganization } = useOrganization();
    const plan = currentOrganization?.plan || 'individual';
    const planLevel = ['trazapp', 'demo'].includes(plan) ? 4 :
        ['ong', 'enterprise'].includes(plan) ? 3 :
            ['equipo', 'pro'].includes(plan) ? 2 : 1;

    const [movements, setMovements] = useState<CashMovement[]>([]);
    const [loading, setLoading] = useState(true);
    const [organizationUsers, setOrganizationUsers] = useState<Profile[]>([]);

    // Toast State
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [isToastClosing, setIsToastClosing] = useState(false);

    // Form State
    const [type, setType] = useState<'INGRESO' | 'EGRESO'>('EGRESO');
    const [owner] = useState('Staff / Operario');
    const [paymentMethod, setPaymentMethod] = useState('Efectivo');
    const [responsibleUserId, setResponsibleUserId] = useState('');
    const [concept, setConcept] = useState('');
    const [amount, setAmount] = useState('');

    // Filter State
    const [filterOwner, setFilterOwner] = useState('Todos');
    const [filterDateMode, setFilterDateMode] = useState<'exact' | 'period'>('exact');
    const [filterExactDate, setFilterExactDate] = useState('');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');

    // Modal Mobile State
    const [selectedMovement, setSelectedMovement] = useState<CashMovement | null>(null);

    // Delete Confirmation State
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    useEffect(() => {
        loadData();
        loadUsers();
    }, []);

    const loadUsers = async () => {
        const users = await usersService.getUsers();
        setOrganizationUsers(users);
        if (users.length > 0) {
            setResponsibleUserId(users[0].id);
        }
    };

    const loadData = async () => {
        const data = await expensesService.getMovements();
        setMovements(data);
        setLoading(false);
    };

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setIsToastClosing(false);
        setTimeout(() => {
            setIsToastClosing(true);
            setTimeout(() => setToastMessage(null), 300); // 300ms coincides with fadeOut
        }, 3000); // Display for 3 secs
    };

    const handleCreate = async () => {
        if (!concept || !amount || !paymentMethod || !responsibleUserId) {
            showToast('Completa todos los campos');
            return;
        }

        const responsibleUser = organizationUsers.find(u => u.id === responsibleUserId);

        const newVal: CashMovement = {
            type,
            owner: responsibleUser ? responsibleUser.full_name : owner, // Legacy field fallback
            concept,
            amount: parseFloat(amount),
            date: new Date().toISOString().split('T')[0], // today YYYY-MM-DD
            payment_method: paymentMethod,
            responsible_user_id: responsibleUserId
        };

        const result = await expensesService.createMovement(newVal);
        if (result.success) {
            setConcept('');
            setAmount('');
            loadData();
        } else {
            showToast('Error al crear: ' + result.error);
        }
    };

    const calculateBalance = (user?: string) => {
        return movements.reduce((acc, curr) => {
            if (user && curr.owner !== user) return acc;
            return curr.type === 'INGRESO' ? acc + curr.amount : acc - curr.amount;
        }, 0);
    };

    const handleDeleteClick = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setItemToDelete(id);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        await expensesService.deleteMovement(itemToDelete);
        if (selectedMovement?.id === itemToDelete) {
            setSelectedMovement(null);
        }
        setItemToDelete(null);
        loadData();
    };

    const filteredMovements = movements.filter(m => {
        // Owner Filter
        if (filterOwner !== 'Todos' && m.owner !== filterOwner && m.profiles?.full_name !== filterOwner) return false;

        // Date Filter
        if (filterDateMode === 'exact' && filterExactDate) {
            if (m.date.split('T')[0] !== filterExactDate) return false;
        } else if (filterDateMode === 'period') {
            const mDate = parseISO(m.date);
            if (filterStartDate && mDate < startOfDay(parseISO(filterStartDate))) return false;
            if (filterEndDate && mDate > endOfDay(parseISO(filterEndDate))) return false;
        }

        return true;
    });

    const calculateAreaMetrics = () => {
        // Only calculate expenses (EGRESO)
        const expenses = filteredMovements.filter(m => m.type === 'EGRESO');
        const areaTotals: Record<string, number> = {
            'Área de Cultivo': 0,
            'Área de Medicina': 0,
            'Área Administrativa': 0,
            'Otros': 0
        };

        expenses.forEach(m => {
            const area = getAreaFromRole(m.profiles?.role);
            if (areaTotals[area] !== undefined) {
                areaTotals[area] += m.amount;
            } else {
                areaTotals['Otros'] += m.amount;
            }
        });

        return areaTotals;
    };

    const totalBalance = calculateBalance();
    const areaMetrics = calculateAreaMetrics();
    const totalExpenses = Object.values(areaMetrics).reduce((a, b) => a + b, 0);

    const formatMoney = (val: number) => {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(val);
    };

    const chartData = {
        labels: Object.keys(areaMetrics),
        datasets: [
            {
                data: Object.values(areaMetrics),
                backgroundColor: [
                    'rgba(74, 222, 128, 0.8)', // Verde (Cultivo)
                    'rgba(56, 189, 248, 0.8)', // Azul (Medicina)
                    'rgba(168, 85, 247, 0.8)', // Morado (Administrativa)
                    'rgba(148, 163, 184, 0.8)', // Gris (Otros)
                ],
                borderColor: [
                    'rgba(74, 222, 128, 1)',
                    'rgba(56, 189, 248, 1)',
                    'rgba(168, 85, 247, 1)',
                    'rgba(148, 163, 184, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    const chartOptions = {
        plugins: {
            legend: {
                position: 'right' as const,
                labels: { color: '#f8fafc', font: { size: 12 } }
            },
            tooltip: {
                callbacks: {
                    label: function (context: any) {
                        let label = context.label || '';
                        if (label) label += ': ';
                        if (context.parsed !== null) {
                            label += formatMoney(context.parsed);
                        }
                        return label;
                    }
                }
            }
        },
        maintainAspectRatio: false,
    };

    return (
        <Container style={{ position: 'relative', overflow: 'hidden' }}>
            {planLevel < 2 && <UpgradeOverlay requiredPlanName="Equipo o superior" />}

            <div style={{ filter: planLevel < 2 ? 'blur(4px)' : 'none', pointerEvents: planLevel < 2 ? 'none' : 'auto', userSelect: planLevel < 2 ? 'none' : 'auto', opacity: planLevel < 2 ? 0.5 : 1 }}>
                <Header>
                    <h1><FaMoneyBillWave color="#38b2ac" /> Control de Gastos</h1>
                </Header>

                <Grid>
                    <BalanceCard style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2rem' }}>
                        <div>
                            <h2>Saldo Total</h2>
                            <p className="balance" style={{ color: totalBalance >= 0 ? '#4ade80' : '#f87171' }}>
                                {formatMoney(totalBalance)}
                            </p>

                            <h2 style={{ marginTop: '2rem' }}>Egresos Totales</h2>
                            <p className="balance" style={{ color: '#f87171', fontSize: '1.5rem' }}>
                                -{formatMoney(totalExpenses)}
                            </p>
                        </div>

                        {totalExpenses > 0 && (
                            <div style={{ height: '220px', width: '300px', flexShrink: 0 }}>
                                <Doughnut data={chartData} options={chartOptions as any} />
                            </div>
                        )}
                    </BalanceCard>

                    {/* Input Form */}
                    <Card>
                        <Form>
                            <h3>Nuevo Movimiento</h3>
                            <div style={{ position: 'relative', zIndex: 1002 }}>
                                <CustomSelect
                                    value={type}
                                    onChange={(val) => setType(val as any)}
                                    options={[
                                        { value: 'EGRESO', label: 'EGRESO (Gasto)' },
                                        { value: 'INGRESO', label: 'INGRESO (Aporte)' }
                                    ]}
                                />
                            </div>
                            <div style={{ position: 'relative', zIndex: 1001 }}>
                                <CustomSelect
                                    value={paymentMethod}
                                    onChange={(val) => setPaymentMethod(val)}
                                    options={[
                                        { value: 'Efectivo', label: 'Efectivo' },
                                        { value: 'Transferencia', label: 'Transferencia' },
                                        { value: 'Criptomonedas', label: 'Criptomonedas' }
                                    ]}
                                />
                            </div>
                            <div style={{ position: 'relative', zIndex: 1000 }}>
                                <CustomSelect
                                    value={responsibleUserId}
                                    onChange={(val) => setResponsibleUserId(val)}
                                    options={organizationUsers.map(u => ({
                                        value: u.id,
                                        label: u.full_name || 'Usuario'
                                    }))}
                                />
                            </div>
                            <input
                                placeholder="Concepto (ej: Fertilizante, Luz)"
                                value={concept}
                                onChange={e => setConcept(e.target.value)}
                            />
                            <input
                                type="number"
                                placeholder="Monto"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                            />
                            <button onClick={handleCreate}>Agregar Movimiento</button>
                        </Form>
                    </Card>

                    {/* List */}
                    <TableContainer>
                        <h3 style={{ paddingLeft: '1rem', marginTop: '1rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                            <FaFilter size={14} color="#94a3b8" /> Filtros y Movimientos
                        </h3>

                        <FilterContainer>
                            <div className="filter-group" style={{ zIndex: 100 }}>
                                <label>Responsable</label>
                                <CustomSelect
                                    value={filterOwner}
                                    onChange={(val) => setFilterOwner(val)}
                                    options={[
                                        { value: 'Todos', label: 'Todos' },
                                        ...organizationUsers.map(u => ({
                                            value: u.full_name || u.id,
                                            label: u.full_name || 'Usuario'
                                        }))
                                    ]}
                                />
                            </div>

                            <div className="filter-group">
                                <div className="date-mode-toggle">
                                    <button
                                        className={filterDateMode === 'exact' ? 'active' : ''}
                                        onClick={() => { setFilterDateMode('exact'); setFilterStartDate(''); setFilterEndDate(''); }}
                                    >
                                        Fecha Exacta
                                    </button>
                                    <button
                                        className={filterDateMode === 'period' ? 'active' : ''}
                                        onClick={() => { setFilterDateMode('period'); setFilterExactDate(''); }}
                                    >
                                        Período
                                    </button>
                                </div>

                                {filterDateMode === 'exact' ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <input
                                            type="date"
                                            value={filterExactDate}
                                            onChange={e => setFilterExactDate(e.target.value)}
                                            title="Fecha Exacta"
                                        />
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <input
                                            type="date"
                                            value={filterStartDate}
                                            onChange={e => setFilterStartDate(e.target.value)}
                                            title="Fecha Inicio"
                                            style={{ flex: 1 }}
                                        />
                                        <input
                                            type="date"
                                            value={filterEndDate}
                                            onChange={e => setFilterEndDate(e.target.value)}
                                            title="Fecha Fin"
                                            style={{ flex: 1 }}
                                        />
                                    </div>
                                )}
                            </div>
                        </FilterContainer>

                        {loading ? <p style={{ padding: '1rem', color: '#94a3b8' }}>Cargando...</p> : (
                            <>
                                <DesktopView>
                                    <Table>
                                        <thead>
                                            <tr>
                                                <th> Tipo</th>
                                                <th> Fecha</th>
                                                <th> Concepto</th>
                                                <th> Área</th>
                                                <th> Método de Pago</th>
                                                <th> Responsable</th>
                                                <th> Monto</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredMovements.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                                                        No se encontraron movimientos para estos filtros.
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredMovements.map(m => (
                                                    <tr key={m.id}>
                                                        <td><span className={`type-badge ${m.type}`}>{m.type}</span></td>
                                                        <td>{format(new Date(m.date), 'dd/MM/yyyy')}</td>
                                                        <td>{m.concept}</td>
                                                        <td>{getAreaFromRole(m.profiles?.role)}</td>
                                                        <td>{m.payment_method || 'N/A'}</td>
                                                        <td>{m.profiles?.full_name || m.owner}</td>
                                                        <td style={{ fontWeight: 600, color: m.type === 'INGRESO' ? '#4ade80' : '#f87171' }}>
                                                            {m.type === 'INGRESO' ? '+' : '-'}{formatMoney(m.amount)}
                                                        </td>
                                                        <td>
                                                            <button onClick={(e) => m.id && handleDeleteClick(m.id, e)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1rem' }}
                                                                onMouseOver={(e) => e.currentTarget.style.color = '#f87171'}
                                                                onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}
                                                            >
                                                                <FaTrash />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </Table>
                                </DesktopView>

                                <MobileView>
                                    {filteredMovements.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                                            No se encontraron movimientos.
                                        </div>
                                    ) : (
                                        filteredMovements.map(m => (
                                            <MovementCard key={m.id} onClick={() => setSelectedMovement(m)}>
                                                <div className="left-col">
                                                    <span className="m-date">{format(new Date(m.date), 'dd/MM/yyyy')}</span>
                                                    <span className="m-owner">{m.profiles?.full_name || m.owner} • {m.payment_method || 'N/A'}</span>
                                                    <span style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '0.2rem' }}>
                                                        {getAreaFromRole(m.profiles?.role)}
                                                    </span>
                                                </div>
                                                <div className="right-col">
                                                    <div className="m-amount" style={{ color: m.type === 'INGRESO' ? '#4ade80' : '#f87171' }}>
                                                        {m.type === 'INGRESO' ? '+' : '-'}{formatMoney(m.amount)}
                                                    </div>
                                                </div>
                                            </MovementCard>
                                        ))
                                    )}
                                </MobileView>
                            </>
                        )}
                    </TableContainer>
                </Grid>

                {/* Modal Móvil */}
                {selectedMovement && (
                    <ModalOverlay onClick={() => setSelectedMovement(null)}>
                        <ModalContentDetail onClick={e => e.stopPropagation()}>
                            <button
                                onClick={() => setSelectedMovement(null)}
                                style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                            >
                                <FaTimes size={20} />
                            </button>

                            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span style={{
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    background: selectedMovement.type === 'INGRESO' ? 'rgba(74, 222, 128, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                                    color: selectedMovement.type === 'INGRESO' ? '#4ade80' : '#f87171',
                                    border: `1px solid ${selectedMovement.type === 'INGRESO' ? 'rgba(74, 222, 128, 0.5)' : 'rgba(239, 68, 68, 0.2)'}`
                                }}>
                                    {selectedMovement.type}
                                </span>
                                <span style={{
                                    fontSize: '1.5rem',
                                    fontWeight: 700,
                                    color: selectedMovement.type === 'INGRESO' ? '#4ade80' : '#f87171'
                                }}>
                                    {selectedMovement.type === 'INGRESO' ? '+' : '-'}{formatMoney(selectedMovement.amount)}
                                </span>
                            </div>

                            <h4>{selectedMovement.concept}</h4>

                            <div className="detail-group">
                                <span className="detail-label">Fecha</span>
                                <span className="detail-value">{format(new Date(selectedMovement.date), 'dd/MM/yyyy')}</span>
                            </div>

                            <div className="detail-group">
                                <span className="detail-label">Método de Pago</span>
                                <span className="detail-value">{selectedMovement.payment_method || 'N/A'}</span>
                            </div>

                            <div className="detail-group">
                                <span className="detail-label">Área</span>
                                <span className="detail-value">{getAreaFromRole(selectedMovement.profiles?.role)}</span>
                            </div>

                            <div className="detail-group" style={{ marginBottom: '2rem' }}>
                                <span className="detail-label">Responsable</span>
                                <span className="detail-value">{selectedMovement.profiles?.full_name || selectedMovement.owner}</span>
                            </div>

                            <button
                                onClick={(e) => {
                                    if (selectedMovement.id) handleDeleteClick(selectedMovement.id, e);
                                }}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '0.5rem',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    color: '#ef4444',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                <FaTrash /> Eliminar Movimiento
                            </button>
                        </ModalContentDetail>
                    </ModalOverlay>
                )}
                {toastMessage && (
                    <ToastContainer $isClosing={isToastClosing}>
                        <FaExclamationCircle color="#c084fc" size={20} />
                        {toastMessage}
                    </ToastContainer>
                )}

                <ConfirmationModal
                    isOpen={!!itemToDelete}
                    title="Eliminar Movimiento"
                    message="¿Estás seguro de que deseas eliminar este registro? El saldo se recalculará. Esta acción no se puede deshacer."
                    onConfirm={confirmDelete}
                    onCancel={() => setItemToDelete(null)}
                    confirmText="Eliminar"
                    isDestructive
                />
            </div>
        </Container>
    );
};

export default Expenses;
