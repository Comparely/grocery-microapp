import React, { createContext, useContext, useState } from 'react';
import type { Product } from '@/types/Product';

type CartItem = {
    product: Product;
    quantity: number;
    platform: string;
};

type CartContextType = {
    cart: CartItem[];
    addToCart: (product: Product) => void;
    removeFromCart: (productId: string, platform: string) => void;
    clearCart: () => void;
    getTotalItems: () => number;
    addToCartV2: (product: Product, platform: string) => void;
    removeFromCartV2: (product: Product) => void;
    grouped: Record<string, CartItem[]>;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [cart, setCart] = useState<CartItem[]>([]);

    const getKey = (productId: string, platform: string) => `${productId}-${platform}`;

    const addToCart = (product: Product) => {
        setCart((prev) => {
            const newCart = [...prev];

            product.priceOptions.forEach(({ platform }) => {
                const key = getKey(product.id.toString(), platform);
                const existing = newCart.find(
                    (item) => getKey(item.product.id.toString(), item.platform) === key,
                );

                if (existing) {
                    existing.quantity += 1;
                } else {
                    newCart.push({ product, platform, quantity: 1 });
                }
            });

            return newCart;
        });
    };

    const addToCartV2 = (product: Product, platform: string) => {
        const key = getKey(product.id.toString(), platform);

        setCart((prev) => {
            const newCart = [...prev];
            const existing = newCart.find(
                (item) => getKey(item.product.id.toString(), item.platform) === key,
            );

            if (existing) {
                existing.quantity += 1;
            } else {
                newCart.push({ product, platform, quantity: 1 });
            }

            return newCart;
        });
    };

    const grouped = cart.reduce(
        (acc, item) => {
            acc[item.platform] = acc[item.platform] || [];
            acc[item.platform].push(item);
            return acc;
        },
        {} as Record<string, CartItem[]>,
    );

    const removeFromCart = (productId: string, platform: string) => {
        const key = getKey(productId, platform);
        setCart((prev) => {
            const updated = prev.map((item) =>
                getKey(item.product.id.toString(), item.platform) === key
                    ? { ...item, quantity: item.quantity - 1 }
                    : item,
            );
            return updated.filter((item) => item.quantity > 0);
        });
    };

    const removeFromCartV2 = (product: Product) => {
        setCart((prev) => {
            let updated = [...prev];

            product.priceOptions.forEach(({ platform }) => {
                const key = getKey(product.id.toString(), platform);

                updated = updated
                    .map((item) =>
                        getKey(item.product.id.toString(), item.platform) === key
                            ? { ...item, quantity: item.quantity - 1 }
                            : item,
                    )
                    .filter((item) => item.quantity > 0);
            });

            return updated;
        });
    };

    const clearCart = () => setCart([]);

    const getTotalItems = () => {
        const uniqueProductIds = new Set(cart.map((item) => item.product.id));
        return uniqueProductIds.size;
    };

    return (
        <CartContext.Provider
            value={{
                cart,
                addToCart,
                removeFromCart,
                grouped,
                clearCart,
                getTotalItems,
                addToCartV2,
                removeFromCartV2,
            }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error('useCart must be used within CartProvider');
    return ctx;
};
