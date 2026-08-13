"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";

import type { ReactNode } from "react";

import { supabase } from "../../lib/supabase";


type CartItem = {
    id: number;
    title: string;
    price: string;
    image: string;
    quantity: number;
};


type CartContextType = {
    cart: CartItem[];

    addToCart: (
        item: Omit<CartItem, "quantity">
    ) => void;

    increaseQuantity: (
        id: number
    ) => void;

    decreaseQuantity: (
        id: number
    ) => void;

    removeFromCart: (
        id: number
    ) => void;

    clearCart: () => void;
};


const CartContext =
    createContext<CartContextType | undefined>(
        undefined
    );


export function CartProvider({
                                 children,
                             }: {
    children: ReactNode;
}) {

    const [cart, setCart] =
        useState<CartItem[]>([]);


    // =========================================================
    // LOAD CART FROM LOCAL STORAGE
    // =========================================================

    useEffect(() => {

        try {

            const savedCart =
                localStorage.getItem("cart");

            if (savedCart) {

                const parsedCart =
                    JSON.parse(savedCart);

                if (Array.isArray(parsedCart)) {

                    setCart(parsedCart);

                }

            }

        } catch (error) {

            console.error(
                "Cart loading error:",
                error
            );

            localStorage.removeItem("cart");

        }

    }, []);


    // =========================================================
    // SAVE CART TO LOCAL STORAGE
    // =========================================================

    useEffect(() => {

        localStorage.setItem(
            "cart",
            JSON.stringify(cart)
        );

    }, [cart]);


    // =========================================================
    // GET CURRENT PRODUCT STOCK
    // =========================================================

    const getProductStock = async (
        id: number
    ): Promise<number | null> => {

        try {

            const { data, error } =
                await supabase
                    .from("products")
                    .select("stock")
                    .eq("id", id)
                    .single();


            if (error) {

                console.error(
                    "Stock check error:",
                    error
                );

                return null;

            }


            if (
                data === null ||
                typeof data.stock !== "number"
            ) {

                return null;

            }


            return data.stock;

        } catch (error) {

            console.error(
                "Stock request failed:",
                error
            );

            return null;

        }

    };


    // =========================================================
    // ADD TO CART
    // =========================================================

    const addToCart = async (
        item: Omit<CartItem, "quantity">
    ) => {

        // -----------------------------------------------------
        // CHECK CURRENT DATABASE STOCK
        // -----------------------------------------------------

        const stock =
            await getProductStock(item.id);


        if (stock === null) {

            alert(
                "Unable to check product availability. Please try again."
            );

            return;

        }


        if (stock <= 0) {

            alert(
                "This product is currently out of stock."
            );

            return;

        }


        // -----------------------------------------------------
        // CHECK CURRENT CART QUANTITY
        // -----------------------------------------------------

        const existingItem =
            cart.find(
                (product) =>
                    product.id === item.id
            );


        const currentQuantity =
            existingItem?.quantity ?? 0;


        if (
            currentQuantity >= stock
        ) {

            alert(
                `Only ${stock} item(s) available.`
            );

            return;

        }


        // -----------------------------------------------------
        // ADD ITEM
        // -----------------------------------------------------

        setCart((prev) => {

            const existing =
                prev.find(
                    (product) =>
                        product.id === item.id
                );


            if (existing) {

                return prev.map(
                    (product) =>
                        product.id === item.id
                            ? {
                                ...product,
                                quantity:
                                    product.quantity +
                                    1,
                            }
                            : product
                );

            }


            return [
                ...prev,
                {
                    ...item,
                    quantity: 1,
                },
            ];

        });

    };


    // =========================================================
    // INCREASE QUANTITY
    // =========================================================

    const increaseQuantity = async (
        id: number
    ) => {

        // -----------------------------------------------------
        // GET CURRENT DATABASE STOCK
        // -----------------------------------------------------

        const stock =
            await getProductStock(id);


        if (stock === null) {

            alert(
                "Unable to check product availability. Please try again."
            );

            return;

        }


        if (stock <= 0) {

            alert(
                "This product is currently out of stock."
            );

            return;

        }


        // -----------------------------------------------------
        // GET CURRENT CART QUANTITY
        // -----------------------------------------------------

        const currentItem =
            cart.find(
                (item) =>
                    item.id === id
            );


        if (!currentItem) {
            return;
        }


        // -----------------------------------------------------
        // STOCK LIMIT
        // -----------------------------------------------------

        if (
            currentItem.quantity >= stock
        ) {

            alert(
                `Only ${stock} item(s) available.`
            );

            return;

        }


        // -----------------------------------------------------
        // INCREASE
        // -----------------------------------------------------

        setCart((prev) =>
            prev.map(
                (item) =>
                    item.id === id
                        ? {
                            ...item,
                            quantity:
                                item.quantity +
                                1,
                        }
                        : item
            )
        );

    };


    // =========================================================
    // DECREASE QUANTITY
    // =========================================================

    const decreaseQuantity = (
        id: number
    ) => {

        setCart((prev) =>
            prev
                .map(
                    (item) =>
                        item.id === id
                            ? {
                                ...item,
                                quantity:
                                    item.quantity -
                                    1,
                            }
                            : item
                )
                .filter(
                    (item) =>
                        item.quantity > 0
                )
        );

    };


    // =========================================================
    // REMOVE ITEM
    // =========================================================

    const removeFromCart = (
        id: number
    ) => {

        setCart((prev) =>
            prev.filter(
                (item) =>
                    item.id !== id
            )
        );

    };


    // =========================================================
    // CLEAR CART
    // =========================================================

    const clearCart = () => {

        setCart([]);

    };


    // =========================================================
    // PROVIDER
    // =========================================================

    return (
        <CartContext.Provider
            value={{
                cart,
                addToCart,
                increaseQuantity,
                decreaseQuantity,
                removeFromCart,
                clearCart,
            }}
        >
            {children}
        </CartContext.Provider>
    );

}


export function useCart() {

    const context =
        useContext(CartContext);


    if (!context) {

        throw new Error(
            "useCart must be used inside CartProvider"
        );

    }


    return context;

}