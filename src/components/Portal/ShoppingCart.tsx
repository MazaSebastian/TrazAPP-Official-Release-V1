import React, { useState } from 'react';
import styled from 'styled-components';
import { CartItem } from './DispensaryCatalog';
import { useOrganization } from '../../context/OrganizationContext';
import { orderService } from '../../services/orderService';
import { FaTrash, FaPlus, FaMinus } from 'react-icons/fa';

const CartContainer = styled.div`
  flex: 1;
  min-width: 300px;
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  padding: 1.5rem;
  position: sticky;
  top: 2rem;
  height: max-content;
  display: flex;
  flex-direction: column;
`;

const CartTitle = styled.h2`
  margin: 0 0 1.5rem 0;
  font-size: 1.25rem;
  color: var(--primary-color, #4ade80);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 1rem;
`;

const ItemList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 1.5rem;
`;

const ItemCard = styled.div`
  background: rgba(15, 23, 42, 0.6);
  padding: 1rem;
  border-radius: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  position: relative;
`;

const ItemName = styled.span`
  font-weight: 600;
  color: #f8fafc;
  padding-right: 2rem;
`;

const DeleteBtn = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  opacity: 0.7;
  &:hover { opacity: 1; }
`;

const ItemControls = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
`;

const SpinControls = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  button {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: white;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:hover { background: rgba(255, 255, 255, 0.2); }
  }
`;

const Summary = styled.div`
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 1.5rem;
  margin-top: auto;
`;

const TotalRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 1.25rem;
  font-weight: 700;
  color: #f8fafc;
  margin-bottom: 1.5rem;
`;

const CheckoutButton = styled.button`
  width: 100%;
  background: var(--primary-color, #4ade80);
  color: #020617;
  border: none;
  padding: 1rem;
  border-radius: 0.75rem;
  font-weight: 800;
  font-size: 1.1rem;
  cursor: pointer;
  transition: filter 0.2s;

  &:hover { filter: brightness(1.1); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

interface ShoppingCartProps {
    items: CartItem[];
    onUpdateQuantity: (batchId: string, delta: number) => void;
    onRemoveItem: (batchId: string) => void;
    onClear: () => void;
}

export const ShoppingCart: React.FC<ShoppingCartProps> = ({ items, onUpdateQuantity, onRemoveItem, onClear }) => {
    const [submitting, setSubmitting] = useState(false);
    const { currentOrganization } = useOrganization();

    const total = items.reduce((sum, item) => sum + ((item.batch.price_per_gram || 0) * item.quantity), 0);

    const handleCheckout = async () => {
        if (!currentOrganization) return;
        setSubmitting(true);
        try {
            const orderPayload = items.map(i => ({
                batchId: i.batch.id,
                quantity: i.quantity,
                pricePerUnit: i.batch.price_per_gram || 0
            }));

            const result = await orderService.createOrder(currentOrganization.id, orderPayload, 'Pedido web socio');
            if (result) {
                alert('Pedido reservado con éxito. Pasa a retirarlo por el club.');
                onClear();
            } else {
                alert('Ocurrió un error al procesar el pedido. Contáctate con administración.');
            }
        } catch (e) {
            console.error(e);
            alert('Error en el checkout.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <CartContainer>
            <CartTitle>Tu Resumen</CartTitle>

            <ItemList>
                {items.length === 0 && <p style={{ color: '#94a3b8', textAlign: 'center' }}>Tu carrito está vacío.</p>}

                {items.map(item => (
                    <ItemCard key={item.batch.id}>
                        <ItemName>{item.batch.strain_name}</ItemName>
                        <DeleteBtn onClick={() => onRemoveItem(item.batch.id)}><FaTrash size={14} /></DeleteBtn>

                        <ItemControls>
                            <SpinControls>
                                <button onClick={() => onUpdateQuantity(item.batch.id, -1)}><FaMinus size={10} /></button>
                                <span>{item.quantity}{item.batch.unit || 'g'}</span>
                                <button onClick={() => onUpdateQuantity(item.batch.id, 1)}><FaPlus size={10} /></button>
                            </SpinControls>
                            <span style={{ fontWeight: 'bold' }}>${(item.batch.price_per_gram || 0) * item.quantity}</span>
                        </ItemControls>
                    </ItemCard>
                ))}
            </ItemList>

            {items.length > 0 && (
                <Summary>
                    <TotalRow>
                        <span>Total:</span>
                        <span>${total}</span>
                    </TotalRow>
                    <CheckoutButton onClick={handleCheckout} disabled={submitting}>
                        {submitting ? 'Procesando...' : 'Confirmar Reserva'}
                    </CheckoutButton>
                </Summary>
            )}
        </CartContainer>
    );
};
