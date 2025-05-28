import React, { createContext, useContext, useState } from 'react';
import type { Product } from '@/types/Product';

type CartItem = {
    product: Product;
    quantity: number;
    platform: string;
};

type CartContextType = {
    cart: CartItem[];
    addToCart: (product: Product, platform: string) => void;
    removeFromCart: (productId: string, platform: string) => void;
    clearCart: () => void;
    getTotalItems: () => number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [cart, setCart] = useState<CartItem[]>([]);

    const getKey = (productId: string, platform: string) => `${productId}-${platform}`;

    const addToCart = (product: Product, platform: string) => {
        setCart((prev) => {
            const key = getKey(product.id.toString(), platform);
            const existing = prev.find(
                (item) => getKey(item.product.id.toString(), item.platform) === key,
            );

            if (existing) {
                return prev.map((item) =>
                    getKey(item.product.id.toString(), item.platform) === key
                        ? { ...item, quantity: item.quantity + 1 }
                        : item,
                );
            } else {
                return [...prev, { product, platform, quantity: 1 }];
            }
        });
    };

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

    const clearCart = () => setCart([]);

    const getTotalItems = () => cart.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, getTotalItems }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error('useCart must be used within CartProvider');
    return ctx;
};
