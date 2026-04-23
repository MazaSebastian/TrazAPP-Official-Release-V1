import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { DispensaryBatch, dispensaryService } from '../../services/dispensaryService';
import { useOrganization } from '../../context/OrganizationContext';
import { ShoppingCart } from './ShoppingCart';

const CatalogContainer = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  gap: 2rem;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const ProductsGrid = styled.div`
  flex: 3;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
`;

const Card = styled.div`
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  overflow: hidden;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;

  &:hover {
    border-color: var(--primary-color, #4ade80);
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0,0,0, 0.5);
  }
`;

const ProductImage = styled.div<{ bgImage?: string }>`
  height: 180px;
  background-color: rgba(15, 23, 42, 0.8);
  background-image: url(${props => props.bgImage || ''});
  background-size: cover;
  background-position: center;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;

  ${props => !props.bgImage && `
    &::after {
      content: '🌱';
      font-size: 4rem;
      opacity: 0.2;
    }
  `}
`;

const ProductInfo = styled.div`
  padding: 1.25rem;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const CategoryBadge = styled.span`
  background: var(--primary-color, #4ade80);
  color: #020617;
  font-size: 0.7rem;
  font-weight: bold;
  padding: 0.25rem 0.6rem;
  border-radius: 1rem;
  align-self: flex-start;
  margin-bottom: 0.75rem;
  text-transform: uppercase;
`;

const ProductName = styled.h3`
  margin: 0 0 0.5rem 0;
  font-size: 1.15rem;
  color: #f8fafc;
`;

const ProductStock = styled.p`
  color: #94a3b8;
  font-size: 0.85rem;
  margin: 0 0 1rem 0;
`;

const PriceTag = styled.div`
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--primary-color, #4ade80);
  margin-bottom: 1rem;
  margin-top: auto;
`;

const AddToCartWrapper = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const QuantityInput = styled.input`
  width: 60px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 0.5rem;
  text-align: center;
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: var(--primary-color, #4ade80);
  }
`;

const AddButton = styled.button`
  flex: 1;
  background: var(--primary-color, #4ade80);
  color: white;
  border: none;
  padding: 0.5rem;
  border-radius: 0.5rem;
  font-weight: bold;
  cursor: pointer;
  transition: filter 0.2s;

  &:hover {
    filter: brightness(1.1);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export interface CartItem {
    batch: DispensaryBatch;
    quantity: number;
}

export const DispensaryCatalog: React.FC = () => {
    const [batches, setBatches] = useState<DispensaryBatch[]>([]);
    const [loading, setLoading] = useState(true);
    const { currentOrganization } = useOrganization();
    const [cart, setCart] = useState<CartItem[]>([]);
    const [quantities, setQuantities] = useState<Record<string, number>>({});

    useEffect(() => {
        const fetchStock = async () => {
            if (currentOrganization) {
                const shopBatches = await dispensaryService.getShopBatches();
                setBatches(shopBatches);
                setLoading(false);
            }
        };
        fetchStock();
    }, [currentOrganization]);

    const handleAddToCart = (batch: DispensaryBatch) => {
        const qty = quantities[batch.id] || 1;
        if (qty > batch.current_weight) {
            alert(`No hay stock suficiente. Máximo disponible: ${batch.current_weight}${batch.unit || 'g'}`);
            return;
        }

        setCart(prev => {
            const existing = prev.find(item => item.batch.id === batch.id);
            if (existing) {
                // Determine total requested qty
                const totalReq = existing.quantity + qty;
                if (totalReq > batch.current_weight) {
                    alert(`Ya tienes ${existing.quantity} en el carrito. Stock insuficiente para agregar ${qty} más.`);
                    return prev;
                }
                return prev.map(item => item.batch.id === batch.id ? { ...item, quantity: item.quantity + qty } : item);
            }
            return [...prev, { batch, quantity: qty }];
        });

        // Reset local qty
        setQuantities(prev => ({ ...prev, [batch.id]: 1 }));
    };

    const handleUpdateQuantity = (batchId: string, delta: number) => {
        setCart(prev => {
            const newCart = prev.map(item => {
                if (item.batch.id === batchId) {
                    const newQty = Math.max(1, item.quantity + delta);
                    if (newQty > item.batch.current_weight) return item; // limit to max
                    return { ...item, quantity: newQty };
                }
                return item;
            });
            return newCart;
        });
    };

    const handleRemoveItem = (batchId: string) => {
        setCart(prev => prev.filter(item => item.batch.id !== batchId));
    };

    const clearCart = () => setCart([]);

    if (loading) return <div style={{ color: 'white', textAlign: 'center', padding: '3rem' }}>Cargando catálogo...</div>;

    const translateProductType = (t: string | undefined) => {
        if (t === 'flower') return 'Flores';
        if (t === 'oil') return 'Aceite';
        if (t === 'cream') return 'Crema';
        if (t === 'edible') return 'Comestible';
        if (t === 'extract') return 'Extracto';
        return 'Producto';
    };

    return (
        <CatalogContainer>
            <ProductsGrid>
                {batches.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', color: '#94a3b8', textAlign: 'center', padding: '3rem' }}>
                        No hay productos disponibles actualmente en el dispensario.
                    </div>
                )}
                {batches.map(batch => (
                    <Card key={batch.id}>
                        <ProductImage bgImage={batch.photo_url} />
                        <ProductInfo>
                            <CategoryBadge>{translateProductType(batch.product_type)}</CategoryBadge>
                            <ProductName>{batch.strain_name}</ProductName>
                            <ProductStock>
                                Stock disponible: {batch.current_weight} {batch.unit || 'g'}
                            </ProductStock>

                            <PriceTag>
                                {batch.price_per_gram ? `$${batch.price_per_gram * (quantities[batch.id] || 1)}` : 'Sin precio listado'}
                            </PriceTag>

                            <AddToCartWrapper>
                                <QuantityInput
                                    type="number"
                                    min="1"
                                    max={batch.current_weight}
                                    value={quantities[batch.id] || 1}
                                    onChange={(e) => setQuantities(prev => ({ ...prev, [batch.id]: Number(e.target.value) }))}
                                />
                                <AddButton onClick={() => handleAddToCart(batch)}>
                                    Agregar
                                </AddButton>
                            </AddToCartWrapper>
                        </ProductInfo>
                    </Card>
                ))}
            </ProductsGrid>
            <ShoppingCart
                items={cart}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onClear={clearCart}
            />
        </CatalogContainer>
    );
};
