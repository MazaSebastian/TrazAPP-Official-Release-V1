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
  @media print {
    @page {
      size: A4 portrait;
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
  color: black !important;
`;

const DateText = styled.div`
  font-size: 14px;
  color: black !important;
  font-weight: bold;
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
  margin-bottom: 20px;
  border: 2px solid black;

  th, td {
    border: 1px solid black;
    padding: 8px 6px;
    text-align: left;
    vertical-align: top;
  }

  th {
    background-color: #f0f0f0 !important;
    font-weight: bold;
    text-transform: uppercase;
    font-size: 10px;
    border-bottom: 2px solid black;
  }
`;

const CheckboxSquare = styled.div`
  width: 14px;
  height: 14px;
  border: 2px solid black;
  margin: 0 auto;
  border-radius: 2px;
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
                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                    <img src="/trazapphorizontal.png" alt="TrazApp Logo" style={{ height: '35px', width: 'auto' }} />
                    <TitleBox>
                        <Title>Checklist de Operaciones</Title>
                        <Subtitle>Planilla de tareas diarias para sala</Subtitle>
                    </TitleBox>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <DateText style={{ textTransform: 'capitalize' }}>Fecha: {dateStr}</DateText>
                </div>
            </Header>

            <SectionTitle>Tareas Programadas ({tasks.length})</SectionTitle>

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
                                <td style={{ textAlign: 'center', verticalAlign: 'middle', borderRight: '1px solid black' }}>
                                    <CheckboxSquare />
                                </td>
                                <td style={{ textTransform: 'uppercase', fontWeight: 'bold', fontSize: '11px', color: 'black !important', borderRight: '1px solid black' }}>
                                    {task.type.replace(/_/g, ' ')}
                                </td>
                                <td style={{ borderRight: '1px solid black' }}>
                                    <strong style={{ display: 'block', fontSize: '14px', marginBottom: '4px', color: 'black !important' }}>{task.title}</strong>
                                    {task.description && <span style={{ fontSize: '12px', color: 'black !important' }}>{task.description}</span>}
                                </td>
                                <td style={{ fontSize: '12px', color: 'black !important', borderRight: '1px solid black' }}>
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
                <div style={{ padding: '20px', border: '1px dashed black', marginBottom: '20px', textAlign: 'center', color: 'black !important' }}>
                    No hay tareas formales programadas para este día.
                </div>
            )}

            {stickies.length > 0 && (
                <>
                    <SectionTitle style={{ marginTop: '20px' }}>Notas Rápidas / Sticky Notes ({stickies.length})</SectionTitle>
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
                                    <td style={{ textAlign: 'center', verticalAlign: 'middle', borderRight: '1px solid black' }}>
                                        <CheckboxSquare />
                                    </td>
                                    <td style={{ fontSize: '14px', fontStyle: 'italic', color: 'black !important' }}>
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
