
import React from 'react';
import styled, { keyframes } from 'styled-components';
import { X as LucideX, Trash2, AlertTriangle, Layers, Sprout } from 'lucide-react';
import { Batch } from '../types/rooms';
import { Button as ShadcnButton } from './ui/Button';
import { Badge as ShadcnBadge } from './ui/Badge';

interface GroupDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupName: string;
  batches: Batch[];
  onDeleteBatch: (batch: Batch, quantityToDiscard: number) => void;
}

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(12px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(3, 7, 18, 0.82);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(12px);
  padding: 1rem;
  animation: ${fadeIn} 0.2s ease-out;
`;

const Content = styled.div`
  background: rgba(15, 23, 42, 0.96);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 1.25rem;
  padding: 1.5rem;
  width: 100%;
  max-width: 580px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 60px -12px rgba(0, 0, 0, 0.7);
  position: relative;
  animation: ${slideUp} 0.25s cubic-bezier(0.16, 1, 0.3, 1);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);

  .header-left {
    display: flex;
    align-items: center;
    gap: 0.85rem;

    .icon-badge {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.25);
      color: #34d399;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .title-col {
      display: flex;
      flex-direction: column;

      h2 {
        font-size: 1.15rem;
        font-weight: 700;
        color: #f8fafc;
        margin: 0;
        letter-spacing: -0.01em;
      }

      span {
        font-size: 0.8rem;
        color: #94a3b8;
      }
    }
  }
`;

const CloseButton = styled.button`
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  width: 32px;
  height: 32px;
  border-radius: 8px;
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #f8fafc;
    border-color: rgba(255, 255, 255, 0.2);
  }
`;

const SummaryBar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: rgba(30, 41, 59, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 0.75rem;
  margin-bottom: 1.25rem;
`;

const List = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  padding-right: 0.25rem;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
`;

const BatchItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.85rem 1rem;
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.75rem;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(30, 41, 59, 0.8);
    border-color: rgba(74, 222, 128, 0.25);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
`;

const BatchInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
`;

const BatchName = styled.span`
  font-weight: 600;
  color: #f1f5f9;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
`;

const BatchMeta = styled.span`
  color: #94a3b8;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  code {
    background: rgba(255, 255, 255, 0.06);
    padding: 0.1rem 0.35rem;
    border-radius: 4px;
    font-family: ui-monospace, monospace;
    color: #cbd5e1;
    font-size: 0.75rem;
  }
`;

export const GroupDetailModal: React.FC<GroupDetailModalProps> = ({
  isOpen,
  onClose,
  groupName,
  batches,
  onDeleteBatch
}) => {
  if (!isOpen) return null;

  const totalPlants = batches.reduce((sum, b) => sum + b.quantity, 0);

  return (
    <Overlay onClick={onClose}>
      <Content onClick={e => e.stopPropagation()}>
        <Header>
          <div className="header-left">
            <div className="icon-badge">
              <Layers size={20} />
            </div>
            <div className="title-col">
              <h2>Detalle del Grupo: {groupName}</h2>
              <span>Información de los lotes agrupados en la mesa</span>
            </div>
          </div>
          <CloseButton onClick={onClose} title="Cerrar">
            <LucideX size={18} />
          </CloseButton>
        </Header>

        <SummaryBar>
          <ShadcnBadge variant="emerald" dot>
            {totalPlants} {totalPlants === 1 ? 'planta' : 'plantas'}
          </ShadcnBadge>
          <ShadcnBadge variant="outline">
            {batches.length} {batches.length === 1 ? 'lote' : 'lotes'}
          </ShadcnBadge>
        </SummaryBar>

        <List>
          {batches.map(batch => (
            <BatchItem key={batch.id}>
              <BatchInfo>
                <BatchName>
                  <Sprout size={15} color="#4ade80" />
                  {batch.quantity}x {batch.genetic?.name || 'Desconocida'}
                </BatchName>
                <BatchMeta>
                  <span>Código: <code>{batch.tracking_code || 'S/C'}</code></span>
                  <span>•</span>
                  <span>{batch.current_room_id ? 'En sala' : 'Sin sala'}</span>
                </BatchMeta>
              </BatchInfo>
              <ShadcnButton
                variant="destructive"
                size="icon"
                onClick={() => {
                  if (batch.quantity > 1) {
                    const qtyStr = window.prompt(
                      `¿Cuántas unidades deseas descartar de ${batch.genetic?.name || 'este lote'}? (Máx: ${batch.quantity})`,
                      String(batch.quantity)
                    );
                    if (qtyStr === null) return;
                    const qty = parseInt(qtyStr, 10);
                    if (isNaN(qty) || qty <= 0 || qty > batch.quantity) {
                      alert('Cantidad inválida');
                      return;
                    }
                    onDeleteBatch(batch, qty);
                  } else {
                    onDeleteBatch(batch, 1);
                  }
                }}
                title="Descartar Lote"
                style={{ height: '34px', width: '34px' }}
              >
                <Trash2 size={16} />
              </ShadcnButton>
            </BatchItem>
          ))}
          {batches.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#64748b' }}>
              <AlertTriangle size={32} style={{ margin: '0 auto 0.75rem', color: '#eab308' }} />
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8' }}>No hay lotes en este grupo.</p>
            </div>
          )}
        </List>
      </Content>
    </Overlay>
  );
};
