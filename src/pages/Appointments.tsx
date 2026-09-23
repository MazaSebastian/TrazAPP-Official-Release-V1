import React, { useEffect, useState, useMemo } from 'react';
import styled, { keyframes } from 'styled-components';
import { useSearchParams } from 'react-router-dom';
import { supabase, getSelectedOrgId } from '../services/supabaseClient';
import { tasksService } from '../services/tasksService';
import { useData } from '../context/DataContext';
import { useOrganization } from '../context/OrganizationContext';
import { Task, CreateTaskInput } from '../types';
import {
  Calendar, Check, X, Clock, Loader2,
  Leaf, Stethoscope, ClipboardList, Filter, Ban,
  ChevronLeft, ChevronRight, CalendarCheck, Plus,
  MapPin, Sprout, User, AlertCircle, Trash2, Search,
  CheckCircle2, AlertTriangle, Sparkles, RefreshCw
} from 'lucide-react';
import { ShadcnButton } from '../components/ui/Button';

/* ============= STYLES ============= */
const fadeIn = keyframes`from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); }`;

const PageContainer = styled.div`
  animation: ${fadeIn} 0.35s ease-out;
  max-width: 1400px;
  margin: 0 auto;
  padding-bottom: 3rem;
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.75rem;
  flex-wrap: wrap;
  gap: 1rem;

  .header-titles {
    h1 {
      font-size: 2rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: #f8fafc;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      svg { color: #4ade80; }
    }

    p { color: #94a3b8; margin: 0.35rem 0 0; font-size: 0.95rem; }
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
`;

const TabsBar = styled.div`
  display: flex;
  gap: 0.5rem;
  padding: 0.35rem;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  margin-bottom: 2rem;
  width: fit-content;
  backdrop-filter: blur(12px);

  @media (max-width: 640px) {
    width: 100%;
  }
`;

const TabButton = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.65rem 1.25rem;
  border-radius: 10px;
  border: none;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  background: ${p => p.$active ? 'rgba(74, 222, 128, 0.15)' : 'transparent'};
  color: ${p => p.$active ? '#4ade80' : '#94a3b8'};
  box-shadow: ${p => p.$active ? '0 0 0 1px rgba(74, 222, 128, 0.3), 0 4px 12px rgba(74, 222, 128, 0.1)' : 'none'};

  &:hover {
    color: #f8fafc;
    background: ${p => p.$active ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255, 255, 255, 0.04)'};
  }

  .tab-badge {
    padding: 0.15rem 0.5rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 700;
    background: ${p => p.$active ? 'rgba(74, 222, 128, 0.25)' : 'rgba(255, 255, 255, 0.08)'};
    color: ${p => p.$active ? '#86efac' : '#cbd5e1'};
  }

  @media (max-width: 640px) {
    flex: 1;
    justify-content: center;
  }
`;

const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div<{ color: string }>`
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 14px;
  padding: 1.25rem;
  text-align: center;
  border-top: 3px solid ${p => p.color};
  backdrop-filter: blur(12px);

  .value { font-size: 2rem; font-weight: 800; color: #f8fafc; line-height: 1.1; }
  .label { font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 0.4rem; font-weight: 600; }
`;

const FilterBar = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;

  .filter-group {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    align-items: center;
  }
`;

const FilterChip = styled.button<{ active?: boolean }>`
  padding: 0.45rem 0.9rem;
  border-radius: 999px;
  border: 1px solid ${p => p.active ? '#4ade80' : 'rgba(255,255,255,0.1)'};
  background: ${p => p.active ? 'rgba(74, 222, 128, 0.12)' : 'rgba(0,0,0,0.25)'};
  color: ${p => p.active ? '#4ade80' : '#94a3b8'};
  font-weight: 600;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover { border-color: #4ade80; color: #f8fafc; }
`;

const DateNav = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;

  button {
    background: rgba(0,0,0,0.25);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    color: #94a3b8;
    padding: 0.5rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    &:hover { color: #f8fafc; border-color: rgba(255,255,255,0.2); }
  }

  span { color: #f8fafc; font-weight: 600; min-width: 170px; text-align: center; font-size: 0.9rem; }

  input[type="date"] {
    background: rgba(0,0,0,0.3);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    color: #f8fafc;
    padding: 0.45rem 0.6rem;
    cursor: pointer;
    font-size: 0.85rem;
    outline: none;

    &:focus {
      border-color: #4ade80;
    }
  }
`;

const CustomSelect = styled.select`
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  color: #f8fafc;
  padding: 0.45rem 0.75rem;
  cursor: pointer;
  font-size: 0.85rem;
  outline: none;

  option {
    background: #0f172a;
    color: #f8fafc;
  }

  &:focus {
    border-color: #4ade80;
  }
`;

/* ============= TASKS VIEW STYLES ============= */
const TasksGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
`;

const TaskCard = styled.div<{ $completed: boolean; $urgent?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: ${p => p.$completed ? 'rgba(15, 23, 42, 0.4)' : 'rgba(15, 23, 42, 0.7)'};
  border: 1px solid ${p => p.$urgent && !p.$completed ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.07)'};
  border-left: 4px solid ${p => p.$completed ? '#4ade80' : p.$urgent ? '#ef4444' : '#38bdf8'};
  border-radius: 12px;
  padding: 1rem 1.25rem;
  gap: 1rem;
  transition: all 0.2s ease;
  backdrop-filter: blur(12px);

  &:hover {
    border-color: ${p => p.$urgent && !p.$completed ? 'rgba(239, 68, 68, 0.5)' : 'rgba(255, 255, 255, 0.15)'};
    background: rgba(15, 23, 42, 0.85);
    transform: translateY(-1px);
  }

  .task-main {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    flex: 1;
  }

  .task-checkbox {
    width: 24px;
    height: 24px;
    border-radius: 7px;
    border: 2px solid ${p => p.$completed ? '#4ade80' : 'rgba(255, 255, 255, 0.25)'};
    background: ${p => p.$completed ? '#4ade80' : 'rgba(0, 0, 0, 0.2)'};
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    margin-top: 2px;
    flex-shrink: 0;
    transition: all 0.15s ease;

    &:hover {
      border-color: #4ade80;
      transform: scale(1.05);
    }

    svg {
      color: #0f172a;
      stroke-width: 3px;
    }
  }

  .task-details {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;

    .task-title {
      font-size: 1rem;
      font-weight: 700;
      color: ${p => p.$completed ? '#94a3b8' : '#f8fafc'};
      text-decoration: ${p => p.$completed ? 'line-through' : 'none'};
      display: flex;
      align-items: center;
      gap: 0.6rem;
      flex-wrap: wrap;
    }

    .task-desc {
      font-size: 0.85rem;
      color: #94a3b8;
      line-height: 1.4;
      white-space: pre-wrap;
    }

    .task-metadata {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
      margin-top: 0.2rem;
      font-size: 0.78rem;
      color: #64748b;

      .meta-item {
        display: flex;
        align-items: center;
        gap: 0.3rem;
      }
    }
  }

  .task-right {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;

    .task-right {
      justify-content: space-between;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      padding-top: 0.75rem;
    }
  }
`;

const TaskTypeBadge = styled.span<{ $type: string }>`
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.55rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;

  ${({ $type }) => {
    switch ($type?.toLowerCase()) {
      case 'riego':
      case 'irrigation':
        return 'background: rgba(56, 189, 248, 0.12); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.25);';
      case 'fertilizante':
      case 'fertilizacion':
      case 'fertilization':
        return 'background: rgba(74, 222, 128, 0.12); color: #4ade80; border: 1px solid rgba(74, 222, 128, 0.25);';
      case 'poda':
      case 'pruning':
        return 'background: rgba(245, 158, 11, 0.12); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.25);';
      case 'trasplante':
        return 'background: rgba(168, 85, 247, 0.12); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.25);';
      case 'cosecha':
      case 'harvest':
        return 'background: rgba(234, 179, 8, 0.15); color: #fde047; border: 1px solid rgba(234, 179, 8, 0.3);';
      case 'plagas':
      case 'pest_control':
        return 'background: rgba(239, 68, 68, 0.12); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.25);';
      default:
        return 'background: rgba(148, 163, 184, 0.12); color: #94a3b8; border: 1px solid rgba(148, 163, 184, 0.25);';
    }
  }}
`;

const DueDateBadge = styled.span<{ $urgency: 'overdue' | 'today' | 'upcoming' | 'none' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;

  ${({ $urgency }) => {
    switch ($urgency) {
      case 'overdue':
        return 'background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3);';
      case 'today':
        return 'background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3);';
      case 'upcoming':
        return 'background: rgba(59, 130, 246, 0.12); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.2);';
      default:
        return 'background: rgba(255, 255, 255, 0.05); color: #94a3b8;';
    }
  }}
`;

/* ============= TABLE STYLES (APPOINTMENTS) ============= */
const Table = styled.div`
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 16px;
  overflow: hidden;
  backdrop-filter: blur(12px);
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 2fr 1.5fr 1fr 1fr 1.5fr 120px;
  padding: 1rem 1.5rem;
  background: rgba(0,0,0,0.25);
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid rgba(255,255,255,0.05);

  @media (max-width: 900px) {
    display: none;
  }
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: 2fr 1.5fr 1fr 1fr 1.5fr 120px;
  padding: 1rem 1.5rem;
  align-items: center;
  border-bottom: 1px solid rgba(255,255,255,0.03);
  transition: background 0.2s;

  &:hover { background: rgba(255,255,255,0.02); }
  &:last-child { border-bottom: none; }

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: 0.5rem;
    padding: 1rem;
  }
`;

const PatientName = styled.div`
  font-weight: 600;
  color: #e2e8f0;
  .patient-email { font-size: 0.8rem; color: #64748b; font-weight: 400; }
`;

const TypeBadge = styled.span<{ type: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  ${({ type }) => {
    const map: Record<string, string> = {
      dispensa: 'background: rgba(74,222,128,0.12); color: #4ade80;',
      consulta_medica: 'background: rgba(96,165,250,0.12); color: #60a5fa;',
      tramite: 'background: rgba(251,191,36,0.12); color: #fbbf24;',
    };
    return map[type] || '';
  }}
`;

const StatusBadge = styled.span<{ status: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  ${({ status }) => {
    const map: Record<string, string> = {
      pending: 'background: rgba(245,158,11,0.15); color: #fbbf24;',
      confirmed: 'background: rgba(59,130,246,0.15); color: #60a5fa;',
      completed: 'background: rgba(34,197,94,0.15); color: #4ade80;',
      cancelled: 'background: rgba(239,68,68,0.15); color: #f87171;',
      no_show: 'background: rgba(148,163,184,0.15); color: #94a3b8;',
    };
    return map[status] || map.pending;
  }}
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.4rem;
`;

const ActionBtn = styled.button<{ variant: 'confirm' | 'complete' | 'cancel' }>`
  padding: 0.4rem 0.6rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: all 0.2s;
  font-weight: 600;

  ${({ variant }) => {
    if (variant === 'confirm') return 'background: rgba(59,130,246,0.15); color: #60a5fa; &:hover { background: rgba(59,130,246,0.3); }';
    if (variant === 'complete') return 'background: rgba(34,197,94,0.15); color: #4ade80; &:hover { background: rgba(34,197,94,0.3); }';
    return 'background: rgba(239,68,68,0.1); color: #f87171; &:hover { background: rgba(239,68,68,0.2); }';
  }}
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: #64748b;
  background: rgba(15, 23, 42, 0.4);
  border: 1px dashed rgba(255, 255, 255, 0.1);
  border-radius: 16px;

  svg { color: #334155; margin-bottom: 1rem; }
  h3 { color: #f1f5f9; font-size: 1.15rem; font-weight: 700; margin: 0 0 0.5rem; }
  p { margin: 0 0 1.25rem; font-size: 0.9rem; }
`;

const Loader = styled.div`
  display: flex; align-items: center; justify-content: center; padding: 4rem; color: #64748b;
  svg { animation: spin 1s linear infinite; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

/* ============= MODAL STYLES ============= */
const ModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
`;

const ModalContent = styled.div`
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 18px;
  width: 100%;
  max-width: 580px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8);
  overflow: hidden;
  animation: ${fadeIn} 0.25s ease-out;

  .modal-header {
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    align-items: center;
    justify-content: space-between;

    h3 {
      margin: 0;
      color: #f8fafc;
      font-size: 1.2rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      svg { color: #4ade80; }
    }

    button {
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      padding: 0.35rem;
      border-radius: 6px;
      &:hover { color: #f8fafc; background: rgba(255, 255, 255, 0.05); }
    }
  }

  .modal-body {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.15rem;

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;

      label {
        font-size: 0.82rem;
        font-weight: 600;
        color: #cbd5e1;
      }

      input, select, textarea {
        background: rgba(0, 0, 0, 0.35);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 8px;
        padding: 0.65rem 0.85rem;
        color: #f8fafc;
        font-size: 0.9rem;
        outline: none;
        transition: border-color 0.2s;

        &:focus {
          border-color: #4ade80;
        }

        option {
          background: #0f172a;
          color: #f8fafc;
        }
      }

      textarea {
        min-height: 80px;
        resize: vertical;
      }
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;

      @media (max-width: 500px) {
        grid-template-columns: 1fr;
      }
    }
  }

  .modal-footer {
    padding: 1.25rem 1.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
  }
`;

/* ============= CONSTANTS ============= */
const TYPE_LABELS: Record<string, { label: string; icon: any }> = {
  dispensa: { label: 'Dispensa', icon: Leaf },
  consulta_medica: { label: 'Consulta Médica', icon: Stethoscope },
  tramite: { label: 'Trámite', icon: ClipboardList },
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  completed: 'Completado',
  cancelled: 'Cancelado',
  no_show: 'No asistió',
};

const TASK_TYPES = [
  { value: 'riego', label: '💧 Riego' },
  { value: 'fertilizacion', label: '🧪 Fertilización / Nutrientes' },
  { value: 'poda', label: '✂️ Poda / Defoliación' },
  { value: 'trasplante', label: '🪴 Trasplante' },
  { value: 'plagas', label: '🛡️ Control de Plagas / Sanidad' },
  { value: 'cosecha', label: '🌾 Cosecha' },
  { value: 'mantenimiento', label: '🔧 Mantenimiento de Sala' },
  { value: 'general', label: '📋 Tarea General' }
];

/* ============= MAIN COMPONENT ============= */
const Appointments: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');
  
  // Tab State: default to 'tasks' if ?tab=tasks or role is grower/staff, otherwise 'appointments'
  const { currentRole } = useOrganization();
  const defaultTab = urlTab === 'appointments' ? 'appointments' : 'tasks';
  const [activeTab, setActiveTab] = useState<'tasks' | 'appointments'>(defaultTab);

  // Sync tab with URL
  useEffect(() => {
    if (urlTab === 'appointments' || urlTab === 'tasks') {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

  const handleTabChange = (tab: 'tasks' | 'appointments') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  /* ------------------- TASKS STATE ------------------- */
  const { rooms, crops, updateTasks } = useData();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [taskTimelineMode, setTaskTimelineMode] = useState<'today' | 'week' | 'month' | 'all' | 'date'>('all');
  const [taskStatusFilter, setTaskStatusFilter] = useState<'pending' | 'done' | 'all'>('pending');
  const [taskRoomFilter, setTaskRoomFilter] = useState<string>('all');
  const [taskCropFilter, setTaskCropFilter] = useState<string>('all');
  const [taskTypeFilter, setTaskTypeFilter] = useState<string>('all');
  const [taskSearchQuery, setTaskSearchQuery] = useState<string>('');
  const [taskSelectedDate, setTaskSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Create Task Modal State
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState<{
    title: string;
    description: string;
    type: string;
    due_date: string;
    room_id: string;
    crop_id: string;
    assigned_to: string;
    priority: 'normal' | 'urgent';
  }>({
    title: '',
    description: '',
    type: 'riego',
    due_date: new Date().toISOString().split('T')[0],
    room_id: '',
    crop_id: '',
    assigned_to: '',
    priority: 'normal'
  });
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  /* ------------------- APPOINTMENTS STATE ------------------- */
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [appointmentStatusFilter, setAppointmentStatusFilter] = useState<string>('all');
  const [appointmentSelectedDate, setAppointmentSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  /* ------------------- DATA FETCHING ------------------- */
  const fetchTasksData = async () => {
    setTasksLoading(true);
    try {
      const data = await tasksService.getAllTasks();
      setTasks(data);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setTasksLoading(false);
    }
  };

  const fetchAppointmentsData = async () => {
    setAppointmentsLoading(true);
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, patient:aurora_patients(id, profile:profiles(full_name, email))')
        .eq('organization_id', getSelectedOrgId())
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (err) {
      console.error('Error fetching appointments:', err);
    } finally {
      setAppointmentsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksData();
    fetchAppointmentsData();
  }, []);

  /* ------------------- TASK ACTIONS ------------------- */
  const handleToggleTaskStatus = async (task: Task) => {
    const nextStatus = task.status === 'done' ? 'pending' : 'done';
    
    // Optimistic local update
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: nextStatus } : t));

    const success = await tasksService.updateStatus(task.id, nextStatus);
    if (!success) {
      // Revert if failed
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: task.status } : t));
    } else {
      updateTasks();
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('¿Seguro que deseas descartar/eliminar esta tarea?')) return;
    
    setTasks(prev => prev.filter(t => t.id !== taskId));
    const success = await tasksService.deleteTask(taskId);
    if (success) {
      updateTasks();
    } else {
      fetchTasksData();
    }
  };

  const handleCreateNewTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskForm.title.trim()) return;

    setIsSubmittingTask(true);
    try {
      const payload: CreateTaskInput = {
        title: newTaskForm.title.trim(),
        description: newTaskForm.description.trim() || undefined,
        type: newTaskForm.type,
        due_date: newTaskForm.due_date ? `${newTaskForm.due_date}T12:00:00.000Z` : undefined,
        room_id: newTaskForm.room_id || undefined,
        crop_id: newTaskForm.crop_id || undefined,
        assigned_to: newTaskForm.assigned_to.trim() || undefined
      };

      const created = await tasksService.createTask(payload);
      if (created) {
        setIsNewTaskModalOpen(false);
        setNewTaskForm({
          title: '',
          description: '',
          type: 'riego',
          due_date: new Date().toISOString().split('T')[0],
          room_id: '',
          crop_id: '',
          assigned_to: '',
          priority: 'normal'
        });
        await fetchTasksData();
        updateTasks();
      }
    } catch (err) {
      console.error('Error creating task:', err);
      alert('Hubo un error al crear la tarea.');
    } finally {
      setIsSubmittingTask(false);
    }
  };

  /* ------------------- APPOINTMENT ACTIONS ------------------- */
  const updateAppointmentStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', id);
      if (error) throw error;
      await fetchAppointmentsData();
    } catch (err) {
      console.error('Error updating appointment:', err);
      alert('Error al actualizar el turno.');
    }
  };

  /* ------------------- FILTERED TASKS ------------------- */
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Status filter
      if (taskStatusFilter !== 'all' && task.status !== taskStatusFilter) {
        return false;
      }

      // Room filter
      if (taskRoomFilter !== 'all' && task.room_id !== taskRoomFilter) {
        return false;
      }

      // Crop filter
      if (taskCropFilter !== 'all' && task.crop_id !== taskCropFilter) {
        return false;
      }

      // Type filter
      if (taskTypeFilter !== 'all' && task.type !== taskTypeFilter) {
        return false;
      }

      // Search filter
      if (taskSearchQuery.trim()) {
        const query = taskSearchQuery.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(query);
        const matchDesc = task.description?.toLowerCase().includes(query);
        const matchAssigned = task.assigned_to?.toLowerCase().includes(query);
        if (!matchTitle && !matchDesc && !matchAssigned) return false;
      }

      // Timeline mode filter
      if (!task.due_date) {
        // Tasks without due_date appear in 'all' mode
        return taskTimelineMode === 'all';
      }

      const taskDate = task.due_date.split('T')[0];

      if (taskTimelineMode === 'today') {
        // Today or overdue pending
        return taskDate === todayStr || (task.status === 'pending' && taskDate < todayStr);
      }

      if (taskTimelineMode === 'week') {
        const d = new Date(todayStr);
        const in7Days = new Date(d);
        in7Days.setDate(in7Days.getDate() + 7);
        const in7DaysStr = in7Days.toISOString().split('T')[0];
        return (taskDate >= todayStr && taskDate <= in7DaysStr) || (task.status === 'pending' && taskDate < todayStr);
      }

      if (taskTimelineMode === 'month') {
        const d = new Date(todayStr);
        const in30Days = new Date(d);
        in30Days.setDate(in30Days.getDate() + 30);
        const in30DaysStr = in30Days.toISOString().split('T')[0];
        return (taskDate >= todayStr && taskDate <= in30DaysStr) || (task.status === 'pending' && taskDate < todayStr);
      }

      if (taskTimelineMode === 'date') {
        return taskDate === taskSelectedDate;
      }

      return true; // 'all'
    });
  }, [tasks, taskStatusFilter, taskRoomFilter, taskCropFilter, taskTypeFilter, taskSearchQuery, taskTimelineMode, taskSelectedDate, todayStr]);

  // Tasks Stats
  const taskStats = useMemo(() => {
    const pending = tasks.filter(t => t.status === 'pending');
    const done = tasks.filter(t => t.status === 'done');
    const urgent = pending.filter(t => (t as any).priority === 'urgent' || (t.due_date && t.due_date.split('T')[0] <= todayStr));

    return {
      total: tasks.length,
      pending: pending.length,
      urgent: urgent.length,
      done: done.length
    };
  }, [tasks, todayStr]);

  /* ------------------- FILTERED APPOINTMENTS ------------------- */
  const filteredAppointments = useMemo(() => {
    let result = appointments;
    result = result.filter(a => a.scheduled_date === appointmentSelectedDate);

    if (appointmentStatusFilter !== 'all') {
      result = result.filter(a => a.status === appointmentStatusFilter);
    }
    return result;
  }, [appointments, appointmentStatusFilter, appointmentSelectedDate]);

  const appointmentStats = useMemo(() => {
    const dayApts = appointments.filter(a => a.scheduled_date === appointmentSelectedDate);
    return {
      total: dayApts.length,
      pending: dayApts.filter(a => a.status === 'pending').length,
      confirmed: dayApts.filter(a => a.status === 'confirmed').length,
      completed: dayApts.filter(a => a.status === 'completed').length,
    };
  }, [appointments, appointmentSelectedDate]);

  /* ------------------- HELPERS ------------------- */
  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const getTaskUrgency = (task: Task): 'overdue' | 'today' | 'upcoming' | 'none' => {
    if (!task.due_date) return 'none';
    const taskDate = task.due_date.split('T')[0];
    if (task.status === 'done') return 'none';
    if (taskDate < todayStr) return 'overdue';
    if (taskDate === todayStr) return 'today';
    return 'upcoming';
  };

  const navigateTaskDate = (delta: number) => {
    const d = new Date(taskSelectedDate + 'T12:00:00');
    d.setDate(d.getDate() + delta);
    setTaskSelectedDate(d.toISOString().split('T')[0]);
  };

  const navigateAppointmentDate = (delta: number) => {
    const d = new Date(appointmentSelectedDate + 'T12:00:00');
    d.setDate(d.getDate() + delta);
    setAppointmentSelectedDate(d.toISOString().split('T')[0]);
  };

  return (
    <PageContainer>
      {/* Page Header */}
      <PageHeader>
        <div className="header-titles">
          <h1>
            <CalendarCheck size={32} />
            Agenda & Cronograma
          </h1>
          <p>
            {activeTab === 'tasks'
              ? 'Planificación, cronograma de operaciones y seguimiento de tareas agronómicas del club.'
              : 'Gestión de turnos de pacientes, consultas médicas y dispensas programadas.'}
          </p>
        </div>

        <div className="header-actions">
          {activeTab === 'tasks' && (
            <ShadcnButton
              onClick={() => setIsNewTaskModalOpen(true)}
              style={{ background: '#22c55e', color: '#0f172a', fontWeight: 700 }}
            >
              <Plus size={16} style={{ strokeWidth: 3 }} /> Nueva Tarea
            </ShadcnButton>
          )}
          <ShadcnButton
            variant="outline"
            size="sm"
            onClick={() => {
              if (activeTab === 'tasks') fetchTasksData();
              else fetchAppointmentsData();
            }}
            title="Refrescar datos"
          >
            <RefreshCw size={14} />
          </ShadcnButton>
        </div>
      </PageHeader>

      {/* Tabs Navigation */}
      <TabsBar>
        <TabButton
          $active={activeTab === 'tasks'}
          onClick={() => handleTabChange('tasks')}
        >
          <CalendarCheck size={18} />
          <span>Tareas Operativas</span>
          <span className="tab-badge">{taskStats.pending}</span>
        </TabButton>

        {['admin', 'medico', 'owner'].includes(currentRole || '') && (
          <TabButton
            $active={activeTab === 'appointments'}
            onClick={() => handleTabChange('appointments')}
          >
            <Stethoscope size={18} />
            <span>Turnos Médicos & Pacientes</span>
            <span className="tab-badge">{appointments.filter(a => a.status === 'pending').length}</span>
          </TabButton>
        )}
      </TabsBar>

      {/* ========================================================= */}
      {/* TAB 1: TAREAS OPERATIVAS & CRONOGRAMA                     */}
      {/* ========================================================= */}
      {activeTab === 'tasks' && (
        <>
          {/* KPI Ribbon */}
          <StatsRow>
            <StatCard color="#38bdf8">
              <div className="value">{taskStats.total}</div>
              <div className="label">Total Tareas</div>
            </StatCard>
            <StatCard color="#fbbf24">
              <div className="value">{taskStats.pending}</div>
              <div className="label">Pendientes</div>
            </StatCard>
            <StatCard color="#f43f5e">
              <div className="value">{taskStats.urgent}</div>
              <div className="label">Urgentes / Hoy</div>
            </StatCard>
            <StatCard color="#4ade80">
              <div className="value">{taskStats.done}</div>
              <div className="label">Completadas</div>
            </StatCard>
          </StatsRow>

          {/* Timeline & View Modes */}
          <FilterBar>
            <div className="filter-group">
              <FilterChip active={taskTimelineMode === 'all'} onClick={() => setTaskTimelineMode('all')}>
                Todo el Cronograma
              </FilterChip>
              <FilterChip active={taskTimelineMode === 'today'} onClick={() => setTaskTimelineMode('today')}>
                Hoy & Vencidas
              </FilterChip>
              <FilterChip active={taskTimelineMode === 'week'} onClick={() => setTaskTimelineMode('week')}>
                Próximos 7 días
              </FilterChip>
              <FilterChip active={taskTimelineMode === 'month'} onClick={() => setTaskTimelineMode('month')}>
                Próximo mes
              </FilterChip>
              <FilterChip active={taskTimelineMode === 'date'} onClick={() => setTaskTimelineMode('date')}>
                Día específico
              </FilterChip>
            </div>

            {taskTimelineMode === 'date' && (
              <DateNav>
                <button onClick={() => navigateTaskDate(-1)}><ChevronLeft size={16} /></button>
                <span>{formatDateLabel(taskSelectedDate)}</span>
                <button onClick={() => navigateTaskDate(1)}><ChevronRight size={16} /></button>
                <input
                  type="date"
                  value={taskSelectedDate}
                  onChange={e => setTaskSelectedDate(e.target.value)}
                />
              </DateNav>
            )}
          </FilterBar>

          {/* Secondary Filters: Status, Room, Crop, Search */}
          <FilterBar style={{ marginBottom: '1.25rem' }}>
            <div className="filter-group">
              <Filter size={15} style={{ color: '#64748b' }} />
              {(['pending', 'done', 'all'] as const).map(s => (
                <FilterChip
                  key={s}
                  active={taskStatusFilter === s}
                  onClick={() => setTaskStatusFilter(s)}
                >
                  {s === 'pending' ? 'Pendientes' : s === 'done' ? 'Completadas' : 'Todos los Estados'}
                </FilterChip>
              ))}

              <CustomSelect
                value={taskTypeFilter}
                onChange={e => setTaskTypeFilter(e.target.value)}
              >
                <option value="all">Todos los Tipos</option>
                {TASK_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </CustomSelect>

              {rooms.length > 0 && (
                <CustomSelect
                  value={taskRoomFilter}
                  onChange={e => setTaskRoomFilter(e.target.value)}
                >
                  <option value="all">Todas las Salas</option>
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </CustomSelect>
              )}

              {crops.length > 0 && (
                <CustomSelect
                  value={taskCropFilter}
                  onChange={e => setTaskCropFilter(e.target.value)}
                >
                  <option value="all">Todos los Cultivos</option>
                  {crops.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </CustomSelect>
              )}
            </div>

            <div style={{ position: 'relative', minWidth: '220px' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="text"
                placeholder="Buscar tarea..."
                value={taskSearchQuery}
                onChange={e => setTaskSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  padding: '0.45rem 0.75rem 0.45rem 2rem',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
            </div>
          </FilterBar>

          {/* Tasks List */}
          {tasksLoading ? (
            <Loader><Loader2 className="animate-spin" size={28} /></Loader>
          ) : filteredTasks.length === 0 ? (
            <EmptyState>
              <CalendarCheck size={48} />
              <h3>¡No hay tareas para este filtro o período!</h3>
              <p>El cronograma está despejado. Puedes crear una nueva tarea programada para tus salas o lotes.</p>
              <ShadcnButton
                onClick={() => setIsNewTaskModalOpen(true)}
                style={{ background: '#22c55e', color: '#0f172a', fontWeight: 700 }}
              >
                <Plus size={16} /> Crear Tarea
              </ShadcnButton>
            </EmptyState>
          ) : (
            <TasksGrid>
              {filteredTasks.map(task => {
                const room = rooms.find(r => r.id === task.room_id);
                const crop = crops.find(c => c.id === task.crop_id);
                const urgency = getTaskUrgency(task);
                const isCompleted = task.status === 'done';

                return (
                  <TaskCard
                    key={task.id}
                    $completed={isCompleted}
                    $urgent={urgency === 'overdue' || urgency === 'today'}
                  >
                    <div className="task-main">
                      <div
                        className="task-checkbox"
                        onClick={() => handleToggleTaskStatus(task)}
                        title={isCompleted ? 'Marcar como pendiente' : 'Completar tarea'}
                      >
                        {isCompleted && <Check size={16} />}
                      </div>

                      <div className="task-details">
                        <div className="task-title">
                          <span>{task.title}</span>
                          <TaskTypeBadge $type={task.type}>
                            {task.type}
                          </TaskTypeBadge>

                          {task.due_date && (
                            <DueDateBadge $urgency={urgency}>
                              <Clock size={12} />
                              {urgency === 'overdue' && '⚠️ Vencida: '}
                              {urgency === 'today' && '⚡ Hoy: '}
                              {formatDateLabel(task.due_date.split('T')[0])}
                            </DueDateBadge>
                          )}
                        </div>

                        {task.description && (
                          <div className="task-desc">{task.description}</div>
                        )}

                        <div className="task-metadata">
                          {room && (
                            <span className="meta-item">
                              <MapPin size={12} style={{ color: '#38bdf8' }} />
                              {room.name}
                            </span>
                          )}
                          {crop && (
                            <span className="meta-item">
                              <Sprout size={12} style={{ color: '#4ade80' }} />
                              {crop.name}
                            </span>
                          )}
                          {task.assigned_to && (
                            <span className="meta-item">
                              <User size={12} style={{ color: '#fbbf24' }} />
                              {task.assigned_to}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="task-right">
                      <ShadcnButton
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTask(task.id)}
                        style={{ color: '#94a3b8' }}
                        title="Eliminar tarea"
                      >
                        <Trash2 size={15} />
                      </ShadcnButton>
                    </div>
                  </TaskCard>
                );
              })}
            </TasksGrid>
          )}
        </>
      )}

      {/* ========================================================= */}
      {/* TAB 2: TURNOS MÉDICOS & PACIENTES                         */}
      {/* ========================================================= */}
      {activeTab === 'appointments' && (
        <>
          {/* Date Navigation */}
          <DateNav style={{ marginBottom: '1.5rem' }}>
            <button onClick={() => navigateAppointmentDate(-1)}><ChevronLeft size={16} /></button>
            <span>{formatDateLabel(appointmentSelectedDate)}</span>
            <button onClick={() => navigateAppointmentDate(1)}><ChevronRight size={16} /></button>
            <input
              type="date"
              value={appointmentSelectedDate}
              onChange={e => setAppointmentSelectedDate(e.target.value)}
            />
          </DateNav>

          {/* Stats */}
          <StatsRow>
            <StatCard color="#60a5fa">
              <div className="value">{appointmentStats.total}</div>
              <div className="label">Total del Día</div>
            </StatCard>
            <StatCard color="#fbbf24">
              <div className="value">{appointmentStats.pending}</div>
              <div className="label">Pendientes</div>
            </StatCard>
            <StatCard color="#3b82f6">
              <div className="value">{appointmentStats.confirmed}</div>
              <div className="label">Confirmados</div>
            </StatCard>
            <StatCard color="#4ade80">
              <div className="value">{appointmentStats.completed}</div>
              <div className="label">Completados</div>
            </StatCard>
          </StatsRow>

          {/* Filters */}
          <FilterBar>
            <div className="filter-group">
              <Filter size={16} style={{ color: '#64748b' }} />
              {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(s => (
                <FilterChip
                  key={s}
                  active={appointmentStatusFilter === s}
                  onClick={() => setAppointmentStatusFilter(s)}
                >
                  {s === 'all' ? 'Todos' : STATUS_LABELS[s]}
                </FilterChip>
              ))}
            </div>
          </FilterBar>

          {/* Table */}
          {appointmentsLoading ? (
            <Loader><Loader2 className="animate-spin" size={28} /></Loader>
          ) : (
            <Table>
              <TableHeader>
                <div>Paciente</div>
                <div>Tipo</div>
                <div>Hora</div>
                <div>Estado</div>
                <div>Notas</div>
                <div>Acciones</div>
              </TableHeader>

              {filteredAppointments.length === 0 ? (
                <EmptyState>
                  <Calendar size={48} />
                  <h3>Sin turnos para esta fecha</h3>
                  <p>No hay turnos {appointmentStatusFilter !== 'all' ? `con estado "${STATUS_LABELS[appointmentStatusFilter]}"` : ''} para el {formatDateLabel(appointmentSelectedDate)}.</p>
                </EmptyState>
              ) : (
                filteredAppointments.map(apt => {
                  const typeInfo = TYPE_LABELS[apt.appointment_type] || TYPE_LABELS.dispensa;
                  const patientName = apt.patient?.profile?.full_name || 'Paciente';
                  const patientEmail = apt.patient?.profile?.email || '';

                  return (
                    <TableRow key={apt.id}>
                      <PatientName>
                        {patientName}
                        {patientEmail && <div className="patient-email">{patientEmail}</div>}
                      </PatientName>
                      <div>
                        <TypeBadge type={apt.appointment_type}>
                          {typeInfo.label}
                        </TypeBadge>
                      </div>
                      <div style={{ color: '#e2e8f0', fontWeight: 600 }}>
                        {apt.scheduled_time?.slice(0, 5)}
                      </div>
                      <div>
                        <StatusBadge status={apt.status}>{STATUS_LABELS[apt.status]}</StatusBadge>
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                        {apt.notes || '—'}
                      </div>
                      <ActionButtons>
                        {apt.status === 'pending' && (
                          <>
                            <ActionBtn variant="confirm" onClick={() => updateAppointmentStatus(apt.id, 'confirmed')} title="Confirmar">
                              <Check size={14} />
                            </ActionBtn>
                            <ActionBtn variant="cancel" onClick={() => updateAppointmentStatus(apt.id, 'cancelled')} title="Cancelar">
                              <X size={14} />
                            </ActionBtn>
                          </>
                        )}
                        {apt.status === 'confirmed' && (
                          <>
                            <ActionBtn variant="complete" onClick={() => updateAppointmentStatus(apt.id, 'completed')} title="Completar">
                              <Check size={14} /> Hecho
                            </ActionBtn>
                            <ActionBtn variant="cancel" onClick={() => updateAppointmentStatus(apt.id, 'no_show')} title="No asistió">
                              <Ban size={14} />
                            </ActionBtn>
                          </>
                        )}
                        {['completed', 'cancelled', 'no_show'].includes(apt.status) && (
                          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>—</span>
                        )}
                      </ActionButtons>
                    </TableRow>
                  );
                })
              )}
            </Table>
          )}
        </>
      )}

      {/* ========================================================= */}
      {/* MODAL: CREAR NUEVA TAREA OPERATIVA                       */}
      {/* ========================================================= */}
      {isNewTaskModalOpen && (
        <ModalBackdrop onClick={() => setIsNewTaskModalOpen(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <Sparkles size={18} />
                Nueva Tarea Programada
              </h3>
              <button onClick={() => setIsNewTaskModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateNewTask}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Título de la Tarea *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Riego con solución A+B, Poda de bajos, etc."
                    value={newTaskForm.title}
                    onChange={e => setNewTaskForm(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Tipo de Tarea</label>
                    <select
                      value={newTaskForm.type}
                      onChange={e => setNewTaskForm(prev => ({ ...prev, type: e.target.value }))}
                    >
                      {TASK_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Fecha Límite / Programada *</label>
                    <input
                      type="date"
                      required
                      value={newTaskForm.due_date}
                      onChange={e => setNewTaskForm(prev => ({ ...prev, due_date: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Sala Asignada</label>
                    <select
                      value={newTaskForm.room_id}
                      onChange={e => setNewTaskForm(prev => ({ ...prev, room_id: e.target.value }))}
                    >
                      <option value="">(Opcional) General / Sin sala</option>
                      {rooms.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Cultivo Asignado</label>
                    <select
                      value={newTaskForm.crop_id}
                      onChange={e => setNewTaskForm(prev => ({ ...prev, crop_id: e.target.value }))}
                    >
                      <option value="">(Opcional) Ninguno</option>
                      {crops.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Responsable / Técnico Asignado</label>
                  <input
                    type="text"
                    placeholder="Nombre del operario o técnico"
                    value={newTaskForm.assigned_to}
                    onChange={e => setNewTaskForm(prev => ({ ...prev, assigned_to: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label>Instrucciones / Observaciones</label>
                  <textarea
                    placeholder="Detalles agronómicos, dosis, pH, EC o especificaciones..."
                    value={newTaskForm.description}
                    onChange={e => setNewTaskForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <ShadcnButton
                  type="button"
                  variant="outline"
                  onClick={() => setIsNewTaskModalOpen(false)}
                >
                  Cancelar
                </ShadcnButton>
                <ShadcnButton
                  type="submit"
                  disabled={isSubmittingTask}
                  style={{ background: '#22c55e', color: '#0f172a', fontWeight: 700 }}
                >
                  {isSubmittingTask ? (
                    <>
                      <Loader2 className="animate-spin" size={14} /> Guardando...
                    </>
                  ) : (
                    'Guardar Tarea'
                  )}
                </ShadcnButton>
              </div>
            </form>
          </ModalContent>
        </ModalBackdrop>
      )}
    </PageContainer>
  );
};

export default Appointments;
