"use client";

import { createContext } from "react";
import { CartItem } from "./types";

interface CartContextType {
    cart: CartItem[];

    addToCart: (item: CartItem) => void;
    removeFromCart: (id: number) => void;
    increaseQty: (id: number) => void;
    decreaseQty: (id: number) => void;
    clearCart: () => void;
}

export const CartContext = createContext<CartContextType>({
    cart: [],
    addToCart: () => {},
    removeFromCart: () => {},
    increaseQty: () => {},
    decreaseQty: () => {},
    clearCart: () => {},
});