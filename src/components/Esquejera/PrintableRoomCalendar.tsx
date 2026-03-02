import React from 'react';
import styled from 'styled-components';
import { Room } from '../../types/rooms';
import { Task } from '../../types';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, addDays, addWeeks, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { createGlobalStyle } from 'styled-components';

const GlobalPrintStyle = createGlobalStyle`
  @media print {
    @page {
       margin: 0 !important; /* This hides the browser's default header/footer URL and Date */
    }

    html, body, #root, [class*="layout"], [class*="container"], main, section, div[class*="RoomDetail"] {
      background-color: white !important;
      background-image: none !important;
      color: black !important;
      height: auto !important;
      min-height: auto !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    
    body {
       -webkit-print-color-adjust: exact !important;
       print-color-adjust: exact !important;
    }
  }
`;

interface PrintableRoomCalendarProps {
    room: Room | null;
    tasks: Task[];
    currentDate: Date; // The month being viewed
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

    /* PrintContainer base properties */
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

    h1 {
        margin: 0;
        font-size: 24px;
        font-weight: 800;
        text-transform: uppercase;
    }

    h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        text-transform: capitalize;
    }
`;

const CalendarGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    width: 100%;
    border-top: 2px solid black;
    border-left: 2px solid black;
`;

const DayHeaderCell = styled.div`
    border-right: 2px solid black;
    border-bottom: 2px solid black;
    padding: 8px;
    text-align: center;
    font-weight: bold;
    font-size: 14px;
    background-color: #f0f0f0 !important;
`;

const DayCell = styled.div<{ $isCurrentMonth: boolean }>`
    border-right: 2px solid black;
    border-bottom: 2px solid black;
    min-height: 80px;
    padding: 4px;
    position: relative;
    opacity: ${props => props.$isCurrentMonth ? 1 : 0.4};
    display: flex;
    flex-direction: column;
    page-break-inside: avoid;
    break-inside: avoid;
`;

const DayNumber = styled.div`
    font-weight: bold;
    font-size: 14px;
    margin-bottom: 4px;
    text-align: right;
`;

const TaskItem = styled.div<{ $isVirtual: boolean; $isDone: boolean }>`
    font-size: 10px;
    padding: 2px;
    margin-bottom: 2px;
    border-bottom: 1px dotted #ccc;
    font-style: ${props => props.$isVirtual ? 'italic' : 'normal'};
    text-decoration: ${props => props.$isDone ? 'line-through' : 'none'};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    &:before {
        content: '${props => props.$isDone ? "☑" : "☐"}';
        margin-right: 4px;
        font-family: monospace;
    }
`;

const PhaseIndicator = styled.div<{ $isFlowering: boolean }>`
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 4px;
    background-color: ${props => props.$isFlowering ? '#666 !important' : '#ccc !important'}; /* Grayscale representation */
`;

const PhaseLabel = styled.div`
    position: absolute;
    bottom: 6px;
    right: 2px;
    font-size: 9px;
    font-weight: bold;
    background: white !important;
    padding: 0 4px;
    border: 1px solid black;
    border-radius: 2px;
`;

const NotesSection = styled.div`
    margin-top: 15px;
    padding: 10px 0;
    min-height: 120px;
    display: flex;
    flex-direction: column;
`;

const NotesTitle = styled.div`
    font-weight: bold;
    font-size: 14px;
    margin-bottom: 5px;
    text-transform: uppercase;
`;

export const PrintableRoomCalendar = React.forwardRef<HTMLDivElement, PrintableRoomCalendarProps>(({
    room,
    tasks,
    currentDate
}, ref) => {

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    // Helper to generate virtual tasks (Reused from RoomDetail logic)
    const generateVirtualTasks = (currentTasks: Task[], viewingDate: Date): Task[] => {
        const virtualTasks: Task[] = [];
        const monthE = endOfMonth(viewingDate);

        currentTasks.forEach(task => {
            if (!task.recurrence || !task.due_date) return;
            const rec = task.recurrence;
            let lastDate = new Date(task.due_date);
            if (isNaN(lastDate.getTime())) return;

            let safetyCounter = 0;
            while (lastDate < monthE && safetyCounter < 50) {
                let nextDate: Date | null = null;
                const interval = typeof rec.interval === 'string' ? parseInt(rec.interval) || 1 : rec.interval || 1;

                if (rec.type === 'custom' || rec.type === 'daily' || rec.type === 'weekly') {
                    if (rec.unit === 'day' || rec.type === 'daily') {
                        nextDate = addDays(lastDate, interval);
                    } else if (rec.unit === 'week' || rec.type === 'weekly') {
                        nextDate = addWeeks(lastDate, interval);
                    } else if (rec.unit === 'month') {
                        nextDate = addMonths(lastDate, interval);
                    }
                }

                if (nextDate && nextDate <= monthE) {
                    virtualTasks.push({
                        ...task,
                        id: `virtual-${task.id}-${nextDate.getTime()}`,
                        due_date: format(nextDate, 'yyyy-MM-dd'),
                        status: 'pending',
                        title: `${task.title} (Proy.)`, // Shortened for print
                        type: task.type
                    });
                    lastDate = nextDate;
                } else {
                    break;
                }
                safetyCounter++;
            }
        });
        return virtualTasks;
    };

    const allVirtualTasks = generateVirtualTasks(tasks, currentDate);
    const allTasksForView = [...tasks, ...allVirtualTasks];

    // Room start logic
    let roomStartObj: Date | null = null;
    let roomStartTime = 0;
    if (room?.start_date) {
        const [y, m, d] = room.start_date.split('T')[0].split('-').map(Number);
        roomStartObj = new Date(y, m - 1, d);
        roomStartTime = roomStartObj.setHours(0, 0, 0, 0);
    }

    return (
        <PrintContainer ref={ref}>
            <GlobalPrintStyle />
            <Header>
                <div>
                    <img src="/trazapphorizontal.png" alt="TrazApp Logo" style={{ height: '35px', width: 'auto' }} />
                </div>
                <h2>Planificación Sala {room?.name || ''} - {format(currentDate, 'MMMM yyyy', { locale: es })}</h2>
            </Header>

            <CalendarGrid>
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
                    <DayHeaderCell key={d}>{d}</DayHeaderCell>
                ))}

                {calendarDays.map((dayItem) => {
                    const isCurrentMonth = isSameMonth(dayItem, monthStart);
                    const dateStr = format(dayItem, 'yyyy-MM-dd');
                    const dayTasks = allTasksForView.filter(t => t.due_date && t.due_date.split('T')[0] === dateStr);

                    // Phase calculation
                    let weekNumStr = "";
                    let isFloweringPhase = false;
                    const dayTime = new Date(dayItem).setHours(0, 0, 0, 0);

                    if (roomStartObj && dayTime >= roomStartTime) {
                        const weekNum = Math.floor((dayTime - roomStartTime) / (7 * 24 * 60 * 60 * 1000)) + 1;

                        const activeBatch = room?.batches?.find((b: any) => b.genetic);
                        const geneticVegWeeks = activeBatch?.genetic?.vegetative_weeks;

                        if (geneticVegWeeks !== undefined && weekNum > geneticVegWeeks) {
                            isFloweringPhase = true;
                        } else if (room?.type === 'flowering') {
                            isFloweringPhase = true;
                        }

                        // Determine if we should show the "Sem X" label
                        const showLabel = dayItem.getDay() === roomStartObj.getDay() || dayTime === roomStartTime;
                        if (showLabel) {
                            weekNumStr = `Sem ${weekNum}`;
                        }
                    }

                    return (
                        <DayCell key={dayItem.toString()} $isCurrentMonth={isCurrentMonth}>
                            <DayNumber>{format(dayItem, 'd')}</DayNumber>

                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                {dayTasks.map((t: Task) => {
                                    const isVirtual = t.id.startsWith('virtual-');
                                    const cropName = t.crop_id ? `[${room?.clone_maps?.find((m: any) => m.id === t.crop_id)?.name || room?.batches?.find((b: any) => b.id === t.crop_id)?.name || '?'}] ` : '';
                                    return (
                                        <TaskItem key={t.id} $isVirtual={isVirtual} $isDone={t.status === 'done'}>
                                            {cropName}{t.title}
                                        </TaskItem>
                                    );
                                })}
                            </div>

                            {roomStartObj && dayTime >= roomStartTime && (
                                <>
                                    {weekNumStr && <PhaseLabel>{weekNumStr}</PhaseLabel>}
                                    <PhaseIndicator $isFlowering={isFloweringPhase} />
                                </>
                            )}
                        </DayCell>
                    );
                })}
            </CalendarGrid>

            <NotesSection>
                <NotesTitle>NOTAS / OBSERVACIONES</NotesTitle>
            </NotesSection>
        </PrintContainer>
    );
});

PrintableRoomCalendar.displayName = 'PrintableRoomCalendar';
