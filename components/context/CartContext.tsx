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

    // Variant information
    variantId?: number;
    sku?: string;
    size?: string;
    color?: string;
};

type AddToCartItem = Omit<
    CartItem,
    "quantity"
>;

type CartContextType = {
    cart: CartItem[];

    addToCart: (
        item: AddToCartItem
    ) => Promise<void>;

    increaseQuantity: (
        id: number,
        variantId?: number
    ) => Promise<void>;

    decreaseQuantity: (
        id: number,
        variantId?: number
    ) => void;

    removeFromCart: (
        id: number,
        variantId?: number
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

    // ==========================================
    // LOAD CART
    // ==========================================

    useEffect(() => {
        try {
            const savedCart =
                localStorage.getItem("cart");

            if (!savedCart) {
                return;
            }

            const parsedCart =
                JSON.parse(savedCart);

            if (Array.isArray(parsedCart)) {
                setCart(parsedCart);
            }
        } catch (error) {
            console.error(
                "Cart loading error:",
                error
            );

            localStorage.removeItem("cart");
        }
    }, []);

    // ==========================================
    // SAVE CART
    // ==========================================

    useEffect(() => {
        localStorage.setItem(
            "cart",
            JSON.stringify(cart)
        );
    }, [cart]);

    // ==========================================
    // GET STOCK
    // ==========================================

    const getStock = async (
        productId: number,
        variantId?: number
    ): Promise<number | null> => {
        try {
            // --------------------------------------
            // VARIANT STOCK
            // --------------------------------------

            if (
                variantId !== undefined
            ) {
                const {
                    data,
                    error,
                } = await supabase
                    .from("product_variants")
                    .select("stock")
                    .eq(
                        "id",
                        variantId
                    )
                    .eq(
                        "product_id",
                        productId
                    )
                    .single();

                if (error) {
                    console.error(
                        "Variant stock error:",
                        error
                    );

                    return null;
                }

                if (
                    !data ||
                    typeof data.stock !==
                    "number"
                ) {
                    return null;
                }

                return data.stock;
            }

            // --------------------------------------
            // NORMAL PRODUCT STOCK
            // --------------------------------------

            const {
                data,
                error,
            } = await supabase
                .from("products")
                .select("stock")
                .eq(
                    "id",
                    productId
                )
                .single();

            if (error) {
                console.error(
                    "Product stock error:",
                    error
                );

                return null;
            }

            if (
                !data ||
                typeof data.stock !==
                "number"
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

    // ==========================================
    // SAME CART ITEM?
    // ==========================================

    const isSameCartItem = (
        item: CartItem,
        id: number,
        variantId?: number
    ) => {
        return (
            item.id === id &&
            (
                item.variantId ??
                null
            ) ===
            (
                variantId ??
                null
            )
        );
    };

    // ==========================================
    // ADD TO CART
    // ==========================================

    const addToCart = async (
        item: AddToCartItem
    ) => {
        const stock =
            await getStock(
                item.id,
                item.variantId
            );

        if (stock === null) {
            alert(
                "Unable to check product availability. Please try again."
            );

            return;
        }

        if (stock <= 0) {
            alert(
                "This product variant is currently out of stock."
            );

            return;
        }

        const existingItem =
            cart.find((cartItem) =>
                isSameCartItem(
                    cartItem,
                    item.id,
                    item.variantId
                )
            );

        const currentQuantity =
            existingItem?.quantity ??
            0;

        if (
            currentQuantity >=
            stock
        ) {
            alert(
                `Only ${stock} item(s) available.`
            );

            return;
        }

        setCart((previousCart) => {
            const existing =
                previousCart.find(
                    (cartItem) =>
                        isSameCartItem(
                            cartItem,
                            item.id,
                            item.variantId
                        )
                );

            if (existing) {
                return previousCart.map(
                    (cartItem) =>
                        isSameCartItem(
                            cartItem,
                            item.id,
                            item.variantId
                        )
                            ? {
                                ...cartItem,
                                quantity:
                                    cartItem.quantity +
                                    1,
                            }
                            : cartItem
                );
            }

            return [
                ...previousCart,
                {
                    ...item,
                    quantity: 1,
                },
            ];
        });
    };

    // ==========================================
    // INCREASE
    // ==========================================

    const increaseQuantity = async (
        id: number,
        variantId?: number
    ) => {
        const stock =
            await getStock(
                id,
                variantId
            );

        if (stock === null) {
            alert(
                "Unable to check product availability. Please try again."
            );

            return;
        }

        const currentItem =
            cart.find((item) =>
                isSameCartItem(
                    item,
                    id,
                    variantId
                )
            );

        if (!currentItem) {
            return;
        }

        if (
            currentItem.quantity >=
            stock
        ) {
            alert(
                `Only ${stock} item(s) available.`
            );

            return;
        }

        setCart((previousCart) =>
            previousCart.map(
                (item) =>
                    isSameCartItem(
                        item,
                        id,
                        variantId
                    )
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

    // ==========================================
    // DECREASE
    // ==========================================

    const decreaseQuantity = (
        id: number,
        variantId?: number
    ) => {
        setCart((previousCart) =>
            previousCart
                .map((item) =>
                    isSameCartItem(
                        item,
                        id,
                        variantId
                    )
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

    // ==========================================
    // REMOVE
    // ==========================================

    const removeFromCart = (
        id: number,
        variantId?: number
    ) => {
        setCart((previousCart) =>
            previousCart.filter(
                (item) =>
                    !isSameCartItem(
                        item,
                        id,
                        variantId
                    )
            )
        );
    };

    // ==========================================
    // CLEAR
    // ==========================================

    const clearCart = () => {
        setCart([]);
        localStorage.removeItem("cart");
    };

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