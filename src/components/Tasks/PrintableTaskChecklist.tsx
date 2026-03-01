import React from 'react';
import styled from 'styled-components';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Task, StickyNote } from '../../types';

interface PrintableTaskChecklistProps {
    date: Date;
    tasks: Task[];
    stickies?: StickyNote[];
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
  align-items: flex-end;
  border-bottom: 2px solid #000;
  padding-bottom: 1rem;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 24px;
  margin: 0;
  font-weight: 800;
  text-transform: uppercase;
`;

const Subtitle = styled.h2`
  font-size: 16px;
  margin: 0.5rem 0 0 0;
  font-weight: normal;
  color: #444;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  margin-bottom: 2rem;

  th, td {
    border: 1px solid #000;
    padding: 12px 8px;
    text-align: left;
    vertical-align: top;
  }

  th {
    background-color: #f0f0f0 !important;
    font-weight: bold;
    text-transform: uppercase;
    font-size: 12px;
  }
`;

const CheckboxSquare = styled.div`
  width: 18px;
  height: 18px;
  border: 2px solid #000;
  margin: 0 auto;
  border-radius: 3px;
`;

export const PrintableTaskChecklist: React.FC<PrintableTaskChecklistProps> = ({ date, tasks, stickies = [] }) => {
    const dateStr = format(date, "EEEE, d 'de' MMMM yyyy", { locale: es });

    // Sort tasks by status (pending first) then type
    const sortedTasks = [...tasks].sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return a.type.localeCompare(b.type);
    });

    return (
        <PrintContainer className="printable-report">
            <Header>
                <div>
                    <Title>Checklist de Operaciones</Title>
                    <Subtitle>Planilla de tareas diarias para completar en sala</Subtitle>
                </div>
                <div style={{ textAlign: 'right', fontWeight: 'bold' }}>
                    Fecha: <span style={{ textTransform: 'capitalize' }}>{dateStr}</span>
                </div>
            </Header>

            <h3 style={{ fontSize: '16px', marginBottom: '10px', textTransform: 'uppercase' }}>Tareas Programadas ({tasks.length})</h3>

            {tasks.length > 0 ? (
                <Table>
                    <thead>
                        <tr>
                            <th style={{ width: '40px', textAlign: 'center' }}>Hecho</th>
                            <th style={{ width: '120px' }}>Tipo</th>
                            <th>Descripción de Tarea</th>
                            <th style={{ width: '200px' }}>Observaciones / ID Lote</th>
                            <th style={{ width: '150px' }}>Firma / Notas extra</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedTasks.map(task => (
                            <tr key={task.id}>
                                <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                    <CheckboxSquare />
                                </td>
                                <td style={{ textTransform: 'uppercase', fontWeight: 'bold', fontSize: '11px' }}>
                                    {task.type.replace(/_/g, ' ')}
                                </td>
                                <td>
                                    <strong style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>{task.title}</strong>
                                    {task.description && <span style={{ fontSize: '12px', color: '#333' }}>{task.description}</span>}
                                </td>
                                <td style={{ fontSize: '12px', color: '#444' }}>
                                    {task.observations || '-'}
                                </td>
                                <td>
                                    {/* Espacio para nota manual */}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            ) : (
                <div style={{ padding: '20px', border: '1px dashed #000', marginBottom: '20px', textAlign: 'center' }}>
                    No hay tareas formales programadas para este día.
                </div>
            )}

            {stickies.length > 0 && (
                <>
                    <h3 style={{ fontSize: '16px', marginBottom: '10px', marginTop: '20px', textTransform: 'uppercase' }}>Notas Rapidas / Sticky Notes ({stickies.length})</h3>
                    <Table>
                        <thead>
                            <tr>
                                <th style={{ width: '40px', textAlign: 'center' }}>Hecho</th>
                                <th>Nota / Recordatorio</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stickies.map(sticky => (
                                <tr key={sticky.id}>
                                    <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                        <CheckboxSquare />
                                    </td>
                                    <td style={{ fontSize: '14px', fontStyle: 'italic' }}>
                                        "{sticky.content}"
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </>
            )}

            <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #ccc', fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                    <strong>Firma Responsable:</strong> ___________________________
                </div>
                <div>
                    <strong>Fecha Realización:</strong> ___/___/202___
                </div>
            </div>

        </PrintContainer>
    );
};
