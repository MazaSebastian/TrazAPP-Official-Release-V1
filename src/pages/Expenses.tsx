import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { FaMoneyBillWave, FaTrash, FaExclamationCircle } from 'react-icons/fa';
import { expensesService, CashMovement } from '../services/expensesService';
import { format } from 'date-fns';
import { CustomSelect } from '../components/CustomSelect';

const fadeIn = keyframes`
  from { opacity: 0; transform: translate(-50%, 20px); }
  to { opacity: 1; transform: translate(-50%, 0); }
`;

const fadeOut = keyframes`
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
  animation: ${props => props.$isClosing ? fadeOut : fadeIn} 0.3s forwards;
`;

const Container = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  padding-top: 5rem; // Sidebar space
  min-height: 100vh;
  color: #f8fafc;
`;

const Header = styled.div`
  margin-bottom: 2rem;
  h1 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #f8fafc;
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

  h2 { font-size: 1rem; color: #94a3b8; margin: 0 0 0.5rem 0; }
  .balance { font-size: 3rem; font-weight: 800; margin: 0; color: #f8fafc; }
  .sub-balances { 
     display: flex; gap: 2rem; margin-top: 1rem; color: #cbd5e1; font-size: 0.9rem;
     strong { color: #f8fafc; }
  }
`;

const Form = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;

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

const Expenses: React.FC = () => {
    const [movements, setMovements] = useState<CashMovement[]>([]);
    const [loading, setLoading] = useState(true);

    // Toast State
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [isToastClosing, setIsToastClosing] = useState(false);

    // Form State
    const [type, setType] = useState<'INGRESO' | 'EGRESO'>('EGRESO');
    const [owner, setOwner] = useState('Sebastian');
    const [concept, setConcept] = useState('');
    const [amount, setAmount] = useState('');

    useEffect(() => {
        loadData();
    }, []);

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
        if (!concept || !amount) {
            showToast('Completa todos los campos');
            return;
        }

        const newVal = {
            type,
            owner,
            concept,
            amount: parseFloat(amount),
            date: new Date().toISOString().split('T')[0] // today YYYY-MM-DD
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

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Eliminar movimiento?')) return;
        await expensesService.deleteMovement(id);
        loadData();
    };

    // Calculations
    const calculateBalance = (user?: string) => {
        return movements.reduce((acc, curr) => {
            if (user && curr.owner !== user) return acc;
            return curr.type === 'INGRESO' ? acc + curr.amount : acc - curr.amount;
        }, 0);
    };

    const totalBalance = calculateBalance();
    const sebaBalance = calculateBalance('Sebastian');
    const santiBalance = calculateBalance('Santiago');

    const formatMoney = (val: number) => {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(val);
    };

    return (
        <Container>
            <Header>
                <h1><FaMoneyBillWave color="#38b2ac" /> Control de Gastos</h1>
            </Header>

            <Grid>
                <BalanceCard>
                    <h2>Saldo Total</h2>
                    <p className="balance" style={{ color: totalBalance >= 0 ? '#4ade80' : '#f87171' }}>
                        {formatMoney(totalBalance)}
                    </p>
                    <div className="sub-balances">
                        <span>Saldo Sebastian: <strong>{formatMoney(sebaBalance)}</strong></span>
                        <span>Saldo Santiago: <strong>{formatMoney(santiBalance)}</strong></span>
                    </div>
                </BalanceCard>

                {/* Input Form */}
                <Card>
                    <h3 style={{ marginTop: 0, color: '#f8fafc' }}>Nuevo Movimiento</h3>
                    <Form>
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
                                value={owner}
                                onChange={(val) => setOwner(val)}
                                options={[
                                    { value: 'Sebastian', label: 'Sebastian' },
                                    { value: 'Santiago', label: 'Santiago' }
                                ]}
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
                    <h3 style={{ paddingLeft: '1rem', marginTop: '1rem', color: '#f8fafc' }}>Movimientos Recientes</h3>
                    {loading ? <p style={{ padding: '1rem', color: '#94a3b8' }}>Cargando...</p> : (
                        <Table>
                            <thead>
                                <tr>
                                    <th>Tipo</th>
                                    <th>Fecha</th>
                                    <th>Concepto</th>
                                    <th>Responsable</th>
                                    <th>Monto</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {movements.map(m => (
                                    <tr key={m.id}>
                                        <td><span className={`type-badge ${m.type}`}>{m.type}</span></td>
                                        <td>{format(new Date(m.date), 'dd/MM/yyyy')}</td>
                                        <td>{m.concept}</td>
                                        <td>{m.owner}</td>
                                        <td style={{ fontWeight: 600, color: m.type === 'INGRESO' ? '#4ade80' : '#f87171' }}>
                                            {m.type === 'INGRESO' ? '+' : '-'}{formatMoney(m.amount)}
                                        </td>
                                        <td>
                                            <button onClick={() => m.id && handleDelete(m.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1rem' }}
                                                onMouseOver={(e) => e.currentTarget.style.color = '#f87171'}
                                                onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}
                                            >
                                                <FaTrash />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </TableContainer>
            </Grid>
            {toastMessage && (
                <ToastContainer $isClosing={isToastClosing}>
                    <FaExclamationCircle color="#c084fc" size={20} />
                    {toastMessage}
                </ToastContainer>
            )}
        </Container>
    );
};

export default Expenses;
