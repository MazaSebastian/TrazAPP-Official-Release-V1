import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Calendar,
  X,
  Check,
  CheckSquare,
  FileText,
  User,
  MapPin,
  Edit3,
  Camera
} from 'lucide-react';
import { Task } from '../types';
import { Room } from '../types/rooms';
import { ShadcnButton } from './ui/Button';
import { ShadcnBadge } from './ui/Badge';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

const scaleIn = keyframes`
  from {
    transform: scale(0.96) translateY(8px);
    opacity: 0;
  }
  to {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
`;

const scaleOut = keyframes`
  from {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
  to {
    transform: scale(0.96) translateY(8px);
    opacity: 0;
  }
`;

const ModalOverlay = styled.div<{ $isClosing: boolean }>`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.78);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  padding: 1rem;
  animation: ${p => p.$isClosing ? fadeOut : fadeIn} 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
`;

const ModalContent = styled.div<{ $isClosing: boolean }>`
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(28px);
  -webkit-backdrop-filter: blur(28px);
  padding: 2.25rem;
  border-radius: 1.25rem;
  width: 94%;
  max-width: 620px;
  max-height: 88vh;
  overflow-y: auto;
  box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  animation: ${p => p.$isClosing ? scaleOut : scaleIn} 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.25);
  }
`;

const AmbientGlow = styled.div`
  position: absolute;
  top: -60px;
  left: 50%;
  transform: translateX(-50%);
  width: 320px;
  height: 140px;
  background: radial-gradient(ellipse at center, rgba(56, 189, 248, 0.18) 0%, rgba(56, 189, 248, 0) 75%);
  pointer-events: none;
`;

const ModalHeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.75rem;

  .header-left {
    display: flex;
    align-items: center;
    gap: 0.85rem;

    .icon-badge {
      width: 44px;
      height: 44px;
      border-radius: 0.75rem;
      background: rgba(56, 189, 248, 0.12);
      border: 1px solid rgba(56, 189, 248, 0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 20px rgba(56, 189, 248, 0.15);
      flex-shrink: 0;
    }

    .title-texts {
      display: flex;
      flex-direction: column;

      h2 {
        margin: 0;
        color: #f8fafc;
        font-size: 1.35rem;
        font-weight: 700;
        letter-spacing: -0.02em;
        text-transform: capitalize;
      }

      p {
        margin: 0.25rem 0 0 0;
        font-size: 0.825rem;
        color: #94a3b8;
        line-height: 1.3;
      }
    }
  }
`;

const CloseButton = styled.button`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #94a3b8;
  cursor: pointer;
  width: 34px;
  height: 34px;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  flex-shrink: 0;

  &:hover {
    color: #f1f5f9;
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.2);
    transform: scale(1.04);
  }

  &:active {
    transform: scale(0.96);
  }
`;

const SectionContainer = styled.div`
  margin-bottom: 1.75rem;

  &:last-of-type {
    margin-bottom: 1rem;
  }
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;

  .section-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.95rem;
    font-weight: 700;
    color: #e2e8f0;
    letter-spacing: -0.01em;

    svg {
      color: #38bdf8;
    }
  }
`;

const TaskList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
`;

const TaskItem = styled.div<{ $isDone: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem 1rem;
  background: ${p => p.$isDone ? 'rgba(16, 185, 129, 0.06)' : 'rgba(30, 41, 59, 0.45)'};
  border: 1px solid ${p => p.$isDone ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.08)'};
  border-radius: 0.75rem;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${p => p.$isDone ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.16)'};
    background: ${p => p.$isDone ? 'rgba(16, 185, 129, 0.09)' : 'rgba(30, 41, 59, 0.65)'};
  }

  .task-main {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    min-width: 0;
    flex: 1;
  }

  .task-details {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    min-width: 0;

    .task-title {
      font-size: 0.92rem;
      font-weight: 600;
      color: ${p => p.$isDone ? '#94a3b8' : '#f8fafc'};
      text-decoration: ${p => p.$isDone ? 'line-through' : 'none'};
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .task-meta {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.45rem;
      font-size: 0.75rem;
      color: #94a3b8;

      .meta-tag {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 0.35rem;
        padding: 0.15rem 0.45rem;
        font-weight: 500;
      }
    }
  }

  .task-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
  }
`;

const CheckboxButton = styled.button<{ $isDone: boolean }>`
  width: 32px;
  height: 32px;
  border-radius: 0.5rem;
  background: ${p => p.$isDone ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.04)'};
  border: 1px solid ${p => p.$isDone ? 'rgba(16, 185, 129, 0.5)' : 'rgba(255, 255, 255, 0.15)'};
  color: ${p => p.$isDone ? '#34d399' : 'transparent'};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  flex-shrink: 0;

  &:hover {
    border-color: ${p => p.$isDone ? '#10b981' : 'rgba(16, 185, 129, 0.5)'};
    color: ${p => p.$isDone ? '#34d399' : '#10b981'};
    background: ${p => p.$isDone ? 'rgba(16, 185, 129, 0.28)' : 'rgba(16, 185, 129, 0.1)'};
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const EmptyStateCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.75rem 1rem;
  background: rgba(15, 23, 42, 0.4);
  border: 1px dashed rgba(255, 255, 255, 0.1);
  border-radius: 0.85rem;
  text-align: center;
  color: #94a3b8;

  .empty-icon {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 0.75rem;
    color: #64748b;
  }

  p {
    margin: 0;
    font-size: 0.875rem;
    color: #94a3b8;
  }

  span {
    font-size: 0.775rem;
    color: #64748b;
    margin-top: 0.25rem;
  }
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
`;

export interface DaySummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  tasks: Task[];
  onToggleTaskStatus: (task: Task) => void;
  onEditTask: (task: Task) => void;
  room?: Room | null;
  users?: { id: string; full_name?: string }[];
}

export const DaySummaryModal: React.FC<DaySummaryModalProps> = ({
  isOpen,
  onClose,
  date,
  tasks,
  onToggleTaskStatus,
  onEditTask,
  room,
  users = []
}) => {
  const [isVisible, setIsVisible] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsClosing(false);
    } else if (isVisible && !isClosing) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setIsClosing(false);
      }, 190);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isVisible, isClosing]);

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
      onClose();
    }, 190);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  if (!isOpen && !isVisible && !isClosing) return null;
  if (!date) return null;

  const formattedDateTitle = format(date, "d 'de' MMMM, yyyy", { locale: es });

  return (
    <ModalOverlay $isClosing={isClosing} onClick={handleClose} onKeyDown={handleKeyDown}>
      <ModalContent $isClosing={isClosing} onClick={(e) => e.stopPropagation()}>
        <AmbientGlow />

        <ModalHeaderRow>
          <div className="header-left">
            <div className="icon-badge">
              <Calendar size={22} color="#38bdf8" />
            </div>
            <div className="title-texts">
              <h2>Resumen del {formattedDateTitle}</h2>
              <p>Tareas asignadas y registros de bitácora del cultivo para esta fecha</p>
            </div>
          </div>
          <CloseButton onClick={handleClose} aria-label="Cerrar modal">
            <X size={18} />
          </CloseButton>
        </ModalHeaderRow>

        {/* SECTION 1: TAREAS ASIGNADAS */}
        <SectionContainer>
          <SectionHeader>
            <div className="section-title">
              <CheckSquare size={17} /> Tareas Asignadas
            </div>
            <ShadcnBadge variant={tasks.length > 0 ? "sky" : "secondary"}>
              {tasks.length} {tasks.length === 1 ? 'tarea' : 'tareas'}
            </ShadcnBadge>
          </SectionHeader>

          {tasks.length > 0 ? (
            <TaskList>
              {tasks.map((task) => {
                const isDone = task.status === 'done';
                const assignedUser = users.find(u => u.id === task.assigned_to)?.full_name || 'Sin asignar';
                const cropOrMapName = task.crop_id
                  ? (room?.clone_maps?.find(m => m.id === task.crop_id)?.name || room?.batches?.find(b => b.id === task.crop_id)?.name || null)
                  : null;

                return (
                  <TaskItem key={task.id.toString()} $isDone={isDone}>
                    <div className="task-main">
                      <CheckboxButton
                        $isDone={isDone}
                        title={isDone ? "Marcar como pendiente" : "Marcar como completada"}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleTaskStatus(task);
                        }}
                      >
                        <Check size={16} />
                      </CheckboxButton>

                      <div className="task-details">
                        <span className="task-title" title={task.title}>{task.title}</span>
                        <div className="task-meta">
                          {task.type && (
                            <ShadcnBadge variant="secondary" style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>
                              {task.type.replace(/_/g, ' ')}
                            </ShadcnBadge>
                          )}
                          {cropOrMapName && (
                            <span className="meta-tag">
                              <MapPin size={11} style={{ color: '#38bdf8' }} /> {cropOrMapName}
                            </span>
                          )}
                          <span className="meta-tag">
                            <User size={11} style={{ color: '#94a3b8' }} /> {assignedUser}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="task-actions">
                      <ShadcnButton
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          handleClose();
                          onEditTask(task);
                        }}
                      >
                        <Edit3 size={13} /> Ver / Editar
                      </ShadcnButton>
                    </div>
                  </TaskItem>
                );
              })}
            </TaskList>
          ) : (
            <EmptyStateCard>
              <div className="empty-icon">
                <CheckSquare size={20} />
              </div>
              <p>No hay tareas programadas para este día</p>
              <span>Puedes crear nuevas tareas desde la vista de calendario</span>
            </EmptyStateCard>
          )}
        </SectionContainer>

        {/* SECTION 2: REGISTRO DIARIO */}
        <SectionContainer>
          <SectionHeader>
            <div className="section-title">
              <FileText size={17} /> Registro Diario & Bitácora
            </div>
          </SectionHeader>

          <EmptyStateCard>
            <div className="empty-icon">
              <Camera size={20} />
            </div>
            <p>No se cargaron fotos ni reportes diarios</p>
            <span>Los reportes agregados a la bitácora aparecerán agrupados aquí</span>
          </EmptyStateCard>
        </SectionContainer>

        <ModalFooter>
          <ShadcnButton variant="secondary" onClick={handleClose}>
            Cerrar
          </ShadcnButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
};
