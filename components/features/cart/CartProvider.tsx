"use client";

import { ReactNode, useEffect, useState } from "react";
import { CartContext } from "./CartContext";
import { CartItem } from "./types";

interface CartProviderProps {
    children: ReactNode;
}

export default function CartProvider({
                                         children,
                                     }: CartProviderProps) {
    const [cart, setCart] = useState<CartItem[]>([]);

    // Load cart from localStorage
    useEffect(() => {
        const storedCart = localStorage.getItem("cart");

        if (storedCart) {
            setCart(JSON.parse(storedCart));
        }
    }, []);

    // Save cart whenever it changes
    useEffect(() => {
        localStorage.setItem("cart", JSON.stringify(cart));
    }, [cart]);

    const addToCart = (item: CartItem) => {
        setCart((prevCart) => {
            const existingItem = prevCart.find((p) => p.id === item.id);

            if (existingItem) {
                return prevCart.map((p) =>
                    p.id === item.id
                        ? { ...p, quantity: p.quantity + 1 }
                        : p
                );
            }

            return [...prevCart, { ...item, quantity: 1 }];
        });
    };

    const removeFromCart = (id: number) => {
        setCart((prevCart) => prevCart.filter((item) => item.id !== id));
    };

    const increaseQty = (id: number) => {
        setCart((prevCart) =>
            prevCart.map((item) =>
                item.id === id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            )
        );
    };

    const decreaseQty = (id: number) => {
        setCart((prevCart) =>
            prevCart
                .map((item) =>
                    item.id === id
                        ? { ...item, quantity: item.quantity - 1 }
                        : item
                )
                .filter((item) => item.quantity > 0)
        );
    };

    const clearCart = () => {
        setCart([]);
    };

    return (
        <CartContext.Provider
            value={{
                cart,
                addToCart,
                removeFromCart,
                increaseQty,
                decreaseQty,
                clearCart,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}