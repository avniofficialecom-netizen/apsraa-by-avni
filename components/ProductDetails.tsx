"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "./context/CartContext";

type Product = {
    id: number;
    title: string;
    price: string;
    old_price: string;
    image: string;
    category: string;
    rating: number;
    reviews: number;
    description: string;
    stock: number;
    featured: boolean;
    bestseller: boolean;
};

export default function ProductDetails({
                                           product,
                                       }: {
    product: Product;
}) {
    const router = useRouter();

    const { cart, addToCart } = useCart();

    const [showAddedMessage, setShowAddedMessage] =
        useState(false);

    const cartItem = cart.find(
        (item) => item.id === product.id
    );

    const cartQuantity =
        cartItem?.quantity ?? 0;

    // ==========================================
    // ADD TO CART
    // ==========================================

    const handleAddToCart = () => {
        if (product.stock <= 0) {
            setShowAddedMessage(false);

            alert(
                "This product is currently out of stock."
            );

            return;
        }

        if (cartQuantity >= product.stock) {
            setShowAddedMessage(false);

            alert(
                `Only ${product.stock} item(s) available.`
            );

            return;
        }

        addToCart({
            id: product.id,
            title: product.title,
            price: product.price,
            image: product.image,
        });

        // Show confirmation popup
        setShowAddedMessage(true);

        // Automatically hide after 3.5 seconds
        setTimeout(() => {
            setShowAddedMessage(false);
        }, 3500);
    };

    // ==========================================
    // BUY NOW
    // ==========================================

    const handleBuyNow = () => {
        if (product.stock <= 0) {
            alert(
                "This product is currently out of stock."
            );

            return;
        }

        if (cartQuantity >= product.stock) {
            alert(
                `Only ${product.stock} item(s) available.`
            );

            return;
        }

        addToCart({
            id: product.id,
            title: product.title,
            price: product.price,
            image: product.image,
        });

        // Go directly to checkout
        router.push("/checkout");
    };

    // ==========================================
    // PAGE
    // ==========================================

    return (
        <div className="relative">

            {/* ==========================================
                ADDED TO CART POPUP
            ========================================== */}

            {showAddedMessage && (
                <div className="fixed top-6 right-6 z-[9999] w-[min(92vw,390px)]">

                    <div className="bg-white rounded-2xl shadow-2xl border border-pink-100 p-5">

                        <div className="flex items-start gap-4">

                            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-2xl flex-shrink-0">
                                ✓
                            </div>

                            <div className="flex-1">

                                <h3 className="font-bold text-gray-800 text-lg">
                                    Added to Cart!
                                </h3>

                                <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                                    {product.title}
                                </p>

                                <button
                                    type="button"
                                    onClick={() =>
                                        router.push("/cart")
                                    }
                                    className="mt-3 text-pink-600 font-semibold text-sm hover:text-pink-800 transition"
                                >
                                    View Cart →
                                </button>

                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setShowAddedMessage(false)
                                }
                                className="text-gray-400 hover:text-gray-700 text-xl"
                                aria-label="Close"
                            >
                                ×
                            </button>

                        </div>

                    </div>

                </div>
            )}

            {/* ==========================================
                CATEGORY
            ========================================== */}

            <span className="bg-pink-100 text-pink-700 px-4 py-2 rounded-full">
                {product.category}
            </span>

            {/* ==========================================
                TITLE
            ========================================== */}

            <h1 className="text-5xl font-bold text-pink-700 mt-6">
                {product.title}
            </h1>

            {/* ==========================================
                RATING
            ========================================== */}

            <div className="mt-4 text-lg">
                ⭐ {product.rating} ({product.reviews} Reviews)
            </div>

            {/* ==========================================
                PRICE
            ========================================== */}

            <div className="flex items-center gap-4 mt-8">

                <span className="text-4xl font-bold text-pink-700">
                    ₹{product.price}
                </span>

                {product.old_price && (
                    <span className="text-2xl text-gray-400 line-through">
                        ₹{product.old_price}
                    </span>
                )}

            </div>

            {/* ==========================================
                DESCRIPTION
            ========================================== */}

            <p className="mt-8 text-gray-600 leading-8">
                {product.description}
            </p>

            {/* ==========================================
                STOCK
            ========================================== */}

            <div className="mt-6">

                <span className="font-semibold">
                    Stock:
                </span>{" "}

                {product.stock > 0 ? (
                    <span className="text-green-600 font-bold">
                        {product.stock} Available
                    </span>
                ) : (
                    <span className="text-red-600 font-bold">
                        ❌ Out of Stock
                    </span>
                )}

            </div>

            {/* ==========================================
                ALREADY IN CART
            ========================================== */}

            {cartQuantity > 0 && (
                <div className="mt-4 text-pink-700 font-medium">
                    🛒 {cartQuantity} item
                    {cartQuantity > 1 ? "s" : ""} already in your cart
                </div>
            )}

            {/* ==========================================
                BADGES
            ========================================== */}

            <div className="flex gap-3 mt-6 flex-wrap">

                {product.featured && (
                    <span className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full">
                        ⭐ Featured
                    </span>
                )}

                {product.bestseller && (
                    <span className="bg-pink-100 text-pink-700 px-4 py-2 rounded-full">
                        🔥 Bestseller
                    </span>
                )}

            </div>

            {/* ==========================================
                ACTION BUTTONS
            ========================================== */}

            <div className="flex gap-4 mt-10 flex-wrap">

                {product.stock > 0 ? (
                    <>
                        {/* ADD TO CART */}

                        <button
                            type="button"
                            onClick={handleAddToCart}
                            disabled={
                                cartQuantity >=
                                product.stock
                            }
                            className={`flex-1 min-w-[220px] px-8 py-4 rounded-xl font-semibold text-lg transition ${
                                cartQuantity >=
                                product.stock
                                    ? "bg-gray-400 text-white cursor-not-allowed"
                                    : "border-2 border-pink-600 text-pink-600 hover:bg-pink-600 hover:text-white"
                            }`}
                        >
                            {cartQuantity >=
                            product.stock
                                ? "❌ Maximum Stock Added"
                                : "🛒 Add to Cart"}
                        </button>

                        {/* BUY NOW */}

                        <button
                            type="button"
                            onClick={handleBuyNow}
                            disabled={
                                cartQuantity >=
                                product.stock
                            }
                            className={`flex-1 min-w-[220px] px-8 py-4 rounded-xl font-semibold text-lg transition ${
                                cartQuantity >=
                                product.stock
                                    ? "bg-gray-400 text-white cursor-not-allowed"
                                    : "bg-pink-600 text-white hover:bg-pink-700 shadow-md hover:shadow-lg"
                            }`}
                        >
                            ⚡ Buy Now
                        </button>
                    </>
                ) : (
                    <button
                        type="button"
                        disabled
                        className="w-full bg-gray-400 text-white px-8 py-4 rounded-xl font-semibold text-lg cursor-not-allowed"
                    >
                        ❌ Out of Stock
                    </button>
                )}

                {/* WISHLIST */}

                <button
                    type="button"
                    className="w-full border-2 border-pink-200 text-pink-600 px-8 py-4 rounded-xl font-semibold hover:bg-pink-50 transition"
                >
                    ❤️ Wishlist
                </button>

            </div>

        </div>
    );
}