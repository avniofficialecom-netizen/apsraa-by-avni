"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "./context/CartContext";

type ProductCardProps = {
    id: number;
    image: string;
    title: string;
    subtitle: string;
    stock: number;
    hasVariants?: boolean;
    bestseller?: boolean;
};

export default function ProductCard({
                                        id,
                                        image,
                                        title,
                                        subtitle,
                                        stock,
                                        hasVariants = false,
                                        bestseller = false,
                                    }: ProductCardProps) {
    const router = useRouter();
    const { addToCart } = useCart();

    const [showAddedMessage, setShowAddedMessage] =
        useState(false);

    // ==========================================
    // GO TO PRODUCT / VARIANT SELECTION
    // ==========================================

    const goToProduct = () => {
        router.push(`/product/${id}`);
    };

    // ==========================================
    // ADD TO CART
    // ==========================================

    const handleAddToCart = async () => {
        if (stock <= 0) {
            return;
        }

        // --------------------------------------
        // PRODUCTS WITH VARIANTS
        // Customer must select variant first.
        // --------------------------------------

        if (hasVariants) {
            router.push(`/product/${id}`);
            return;
        }

        // --------------------------------------
        // NORMAL PRODUCT
        // Add directly.
        // --------------------------------------

        const success = await addToCart({
            id,
            title,
            price: subtitle,
            image,
        });

        if (success === false) {
            return;
        }

        setShowAddedMessage(true);

        setTimeout(() => {
            setShowAddedMessage(false);
        }, 3000);
    };

    // ==========================================
    // BUY NOW
    // ==========================================

    const handleBuyNow = async () => {
        if (stock <= 0) {
            return;
        }

        // --------------------------------------
        // PRODUCTS WITH VARIANTS
        // Customer must select variant first.
        // --------------------------------------

        if (hasVariants) {
            router.push(`/product/${id}`);
            return;
        }

        // --------------------------------------
        // NORMAL PRODUCT
        // Add and go directly to checkout.
        // --------------------------------------

        const success = await addToCart({
            id,
            title,
            price: subtitle,
            image,
        });

        if (success === false) {
            return;
        }

        router.push("/checkout");
    };

    return (
        <div className="relative">

            {/* ==========================================
                PRODUCT CARD
            ========================================== */}

            <div className="group bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">

                {/* ==========================================
                    PRODUCT IMAGE
                ========================================== */}

                <button
                    type="button"
                    onClick={goToProduct}
                    className="block w-full text-left"
                >
                    <div className="relative overflow-hidden">

                        <img
                            src={image}
                            alt={title}
                            className="w-full h-80 object-cover group-hover:scale-110 transition duration-500"
                        />

                        {/* BADGE */}

                        {stock > 0 ? (
                            bestseller ? (
                                <span className="absolute top-4 left-4 bg-pink-600 text-white text-xs font-semibold px-4 py-2 rounded-full">
                                    Bestseller
                                </span>
                            ) : (
                                <span className="absolute top-4 left-4 bg-green-600 text-white text-xs font-semibold px-4 py-2 rounded-full">
                                    In Stock
                                </span>
                            )
                        ) : (
                            <span className="absolute top-4 left-4 bg-red-600 text-white text-xs font-semibold px-4 py-2 rounded-full">
                                Out of Stock
                            </span>
                        )}

                        {/* WISHLIST */}

                        <span
                            className="absolute top-4 right-4 bg-white w-10 h-10 rounded-full shadow flex items-center justify-center"
                            aria-hidden="true"
                        >
                            🤍
                        </span>

                    </div>
                </button>

                {/* ==========================================
                    PRODUCT DETAILS
                ========================================== */}

                <div className="p-6">

                    {/* TITLE */}

                    <button
                        type="button"
                        onClick={goToProduct}
                        className="text-left"
                    >
                        <h3 className="text-xl font-bold text-gray-800 hover:text-pink-700 transition">
                            {title}
                        </h3>
                    </button>

                    {/* PRICE */}

                    <div className="mt-4">

                        <span className="text-2xl font-bold text-pink-700">
                            {subtitle}
                        </span>

                    </div>

                    {/* VARIANT HINT */}

                    {hasVariants && (
                        <p className="mt-3 text-sm text-gray-500">
                            Select size & color on product page
                        </p>
                    )}

                    {/* STOCK */}

                    <p className="mt-3 text-sm">

                        Stock:

                        <span
                            className={`ml-2 font-bold ${
                                stock > 0
                                    ? "text-green-600"
                                    : "text-red-600"
                            }`}
                        >
                            {stock}
                        </span>

                    </p>

                    {/* ==========================================
                        ACTION BUTTONS
                    ========================================== */}

                    {stock > 0 ? (

                        <div className="mt-6 flex gap-3">

                            {/* ADD TO CART */}

                            <button
                                type="button"
                                onClick={handleAddToCart}
                                className="flex-1 bg-white border-2 border-pink-600 text-pink-600 py-3 rounded-full font-semibold hover:bg-pink-600 hover:text-white active:scale-[0.98] transition"
                            >
                                🛒 Add to Cart
                            </button>

                            {/* BUY NOW */}

                            <button
                                type="button"
                                onClick={handleBuyNow}
                                className="flex-1 bg-pink-600 text-white py-3 rounded-full font-semibold hover:bg-pink-700 active:scale-[0.98] transition"
                            >
                                ⚡ Buy Now
                            </button>

                        </div>

                    ) : (

                        <button
                            type="button"
                            disabled
                            className="mt-6 w-full bg-gray-400 text-white py-3 rounded-full font-semibold cursor-not-allowed"
                        >
                            ❌ Out of Stock
                        </button>

                    )}

                </div>

            </div>

            {/* ==========================================
                ADDED TO CART MESSAGE
            ========================================== */}

            {showAddedMessage && (

                <div className="fixed bottom-5 right-5 z-[9999] w-[calc(100vw-32px)] max-w-sm">

                    <div className="bg-white border border-pink-100 rounded-2xl shadow-2xl p-4">

                        <div className="flex items-center gap-3">

                            <div className="w-11 h-11 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-xl">
                                ✓
                            </div>

                            <div className="flex-1">

                                <p className="font-bold text-gray-800">
                                    Added to Cart!
                                </p>

                                <p className="text-gray-500 text-sm mt-1 truncate">
                                    {title}
                                </p>

                                <button
                                    type="button"
                                    onClick={() =>
                                        router.push(
                                            "/cart"
                                        )
                                    }
                                    className="text-pink-600 text-sm font-semibold mt-1"
                                >
                                    View Cart →
                                </button>

                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setShowAddedMessage(false)
                                }
                                className="text-gray-400 text-xl"
                                aria-label="Close"
                            >
                                ×
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}