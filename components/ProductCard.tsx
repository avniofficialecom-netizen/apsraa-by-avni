"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "./context/CartContext";

type ProductCardProps = {
    id: number;
    image: string;
    title: string;
    subtitle: string;
    stock: number;
};

export default function ProductCard({
                                        id,
                                        image,
                                        title,
                                        subtitle,
                                        stock,
                                    }: ProductCardProps) {
    const router = useRouter();
    const { addToCart } = useCart();

    const [showAddedMessage, setShowAddedMessage] =
        useState(false);

    const handleAddToCart = (
        e: React.MouseEvent<HTMLButtonElement>
    ) => {
        e.preventDefault();
        e.stopPropagation();

        if (stock <= 0) {
            return;
        }

        addToCart({
            id,
            title,
            price: subtitle,
            image,
        });

        setShowAddedMessage(true);

        setTimeout(() => {
            setShowAddedMessage(false);
        }, 3000);
    };

    const handleBuyNow = (
        e: React.MouseEvent<HTMLButtonElement>
    ) => {
        e.preventDefault();
        e.stopPropagation();

        if (stock <= 0) {
            return;
        }

        addToCart({
            id,
            title,
            price: subtitle,
            image,
        });

        router.push("/checkout");
    };

    return (
        <div className="relative">

            {/* =====================================================
                PRODUCT CARD
            ===================================================== */}

            <Link href={`/product/${id}`}>

                <div className="group cursor-pointer bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">

                    {/* =================================================
                        PRODUCT IMAGE
                    ================================================= */}

                    <div className="relative overflow-hidden">

                        <img
                            src={image}
                            alt={title}
                            className="w-full h-80 object-cover group-hover:scale-110 transition duration-500"
                        />

                        {/* STOCK / BESTSELLER */}

                        {stock > 0 ? (
                            <span className="absolute top-4 left-4 bg-pink-600 text-white text-xs font-semibold px-4 py-2 rounded-full">
                                Bestseller
                            </span>
                        ) : (
                            <span className="absolute top-4 left-4 bg-red-600 text-white text-xs font-semibold px-4 py-2 rounded-full">
                                Out of Stock
                            </span>
                        )}

                        {/* WISHLIST */}

                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                            }}
                            className="absolute top-4 right-4 bg-white w-10 h-10 rounded-full shadow flex items-center justify-center hover:bg-pink-100 transition"
                            aria-label="Add to wishlist"
                        >
                            🤍
                        </button>

                    </div>


                    {/* =================================================
                        PRODUCT DETAILS
                    ================================================= */}

                    <div className="p-6">

                        <h3 className="text-xl font-bold text-gray-800">
                            {title}
                        </h3>


                        {/* RATING */}

                        <div className="flex items-center mt-2">

                            <span className="text-yellow-500">
                                ★★★★★
                            </span>

                            <span className="ml-2 text-sm text-gray-500">
                                (124)
                            </span>

                        </div>


                        {/* PRICE */}

                        <div className="mt-4 flex items-center gap-3">

                            <span className="text-2xl font-bold text-pink-700">
                                {subtitle}
                            </span>

                            <span className="text-gray-400 line-through">
                                ₹899
                            </span>

                        </div>


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


                        {/* =================================================
                            ACTION BUTTONS
                        ================================================= */}

                        {stock > 0 ? (

                            <div className="mt-6">

                                <div className="flex gap-3">

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

            </Link>


            {/* =========================================================
                ADDED TO CART POPUP
                IMPORTANT:
                This is OUTSIDE the overflow-hidden product card.
                Therefore it will work properly on mobile.
            ========================================================= */}

            {showAddedMessage && (

                <div
                    className="
                        fixed
                        bottom-5
                        left-1/2
                        -translate-x-1/2
                        sm:left-auto
                        sm:right-5
                        sm:translate-x-0
                        z-[9999]
                        w-[calc(100vw-32px)]
                        max-w-sm
                    "
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                >

                    <div className="bg-white border border-pink-100 rounded-2xl shadow-2xl px-4 py-4">

                        <div className="flex items-center gap-3">

                            {/* SUCCESS ICON */}

                            <div className="w-11 h-11 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-xl flex-shrink-0">
                                ✓
                            </div>


                            {/* MESSAGE */}

                            <div className="flex-1 min-w-0">

                                <p className="font-bold text-gray-800 text-sm">
                                    Added to Cart!
                                </p>

                                <p className="text-gray-500 text-xs mt-1 truncate">
                                    {title}
                                </p>

                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();

                                        router.push("/cart");
                                    }}
                                    className="text-pink-600 text-xs font-semibold hover:text-pink-800 transition mt-1"
                                >
                                    View Cart →
                                </button>

                            </div>


                            {/* CLOSE */}

                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();

                                    setShowAddedMessage(false);
                                }}
                                className="text-gray-400 hover:text-gray-700 text-xl leading-none flex-shrink-0 p-1"
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