"use client";

import { useEffect, useState } from "react";
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

    const [quantity, setQuantity] = useState(1);

    const cartItem = cart.find(
        (item) => item.id === product.id
    );

    const cartQuantity =
        cartItem?.quantity ?? 0;

    // ==========================================
    // AVAILABLE STOCK
    // ==========================================

    const availableStock = Math.max(
        0,
        product.stock - cartQuantity
    );

    // Keep selected quantity inside available stock
    useEffect(() => {
        if (availableStock <= 0) {
            setQuantity(1);
            return;
        }

        setQuantity((current) =>
            Math.min(
                Math.max(current, 1),
                availableStock
            )
        );
    }, [availableStock]);

    // ==========================================
    // QUANTITY
    // ==========================================

    const decreaseQuantity = () => {
        setQuantity((current) =>
            Math.max(1, current - 1)
        );
    };

    const increaseQuantity = () => {
        if (quantity >= availableStock) {
            return;
        }

        setQuantity((current) =>
            Math.min(
                current + 1,
                availableStock
            )
        );
    };

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

        if (availableStock <= 0) {
            setShowAddedMessage(false);

            alert(
                "You already have the maximum available quantity of this product in your cart."
            );

            return;
        }

        if (quantity > availableStock) {
            alert(
                `Only ${availableStock} item(s) can be added.`
            );

            return;
        }

        // Add selected quantity
        for (let i = 0; i < quantity; i++) {
            addToCart({
                id: product.id,
                title: product.title,
                price: product.price,
                image: product.image,
            });
        }

        setShowAddedMessage(true);

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

        if (availableStock <= 0) {
            alert(
                "This product has reached the maximum available quantity in your cart."
            );

            return;
        }

        if (quantity > availableStock) {
            alert(
                `Only ${availableStock} item(s) are available.`
            );

            return;
        }

        // Add selected quantity
        for (let i = 0; i < quantity; i++) {
            addToCart({
                id: product.id,
                title: product.title,
                price: product.price,
                image: product.image,
            });
        }

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
                                    {quantity} × {product.title}
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
                QUANTITY SELECTOR
            ========================================== */}

            {product.stock > 0 && availableStock > 0 && (
                <div className="mt-8">

                    <div className="font-semibold text-gray-800 mb-3">
                        Quantity
                    </div>

                    <div className="inline-flex items-center border-2 border-pink-200 rounded-xl overflow-hidden bg-white">

                        <button
                            type="button"
                            onClick={decreaseQuantity}
                            disabled={quantity <= 1}
                            className="w-14 h-12 text-2xl font-semibold text-pink-600 hover:bg-pink-50 disabled:text-gray-300 disabled:cursor-not-allowed transition"
                            aria-label="Decrease quantity"
                        >
                            −
                        </button>

                        <div className="w-16 h-12 flex items-center justify-center border-x-2 border-pink-200 text-lg font-bold text-gray-800">
                            {quantity}
                        </div>

                        <button
                            type="button"
                            onClick={increaseQuantity}
                            disabled={
                                quantity >= availableStock
                            }
                            className="w-14 h-12 text-2xl font-semibold text-pink-600 hover:bg-pink-50 disabled:text-gray-300 disabled:cursor-not-allowed transition"
                            aria-label="Increase quantity"
                        >
                            +
                        </button>

                    </div>

                    <p className="text-sm text-gray-500 mt-2">
                        {availableStock} item
                        {availableStock !== 1 ? "s" : ""} available to add
                    </p>

                </div>
            )}

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
                                availableStock <= 0
                            }
                            className={`flex-1 min-w-[220px] px-8 py-4 rounded-xl font-semibold text-lg transition ${
                                availableStock <= 0
                                    ? "bg-gray-400 text-white cursor-not-allowed"
                                    : "border-2 border-pink-600 text-pink-600 hover:bg-pink-600 hover:text-white"
                            }`}
                        >
                            {availableStock <= 0
                                ? "❌ Maximum Stock Added"
                                : "🛒 Add to Cart"}
                        </button>

                        {/* BUY NOW */}

                        <button
                            type="button"
                            onClick={handleBuyNow}
                            disabled={
                                availableStock <= 0
                            }
                            className={`flex-1 min-w-[220px] px-8 py-4 rounded-xl font-semibold text-lg transition ${
                                availableStock <= 0
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

            {/* ==========================================
                DELIVERY & TRUST
            ========================================== */}

            <div className="mt-10 border-t border-pink-100 pt-8">

                <h2 className="text-xl font-bold text-pink-700 mb-5">
                    Why Shop With Us?
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    {/* DELIVERY */}

                    <div className="flex items-start gap-4 bg-white border border-pink-100 rounded-2xl p-4">

                        <div className="text-2xl">
                            🚚
                        </div>

                        <div>
                            <h3 className="font-bold text-gray-800">
                                Delivery Available
                            </h3>

                            <p className="text-sm text-gray-500 mt-1">
                                We deliver across India.
                            </p>
                        </div>

                    </div>

                    {/* PACKING */}

                    <div className="flex items-start gap-4 bg-white border border-pink-100 rounded-2xl p-4">

                        <div className="text-2xl">
                            📦
                        </div>

                        <div>
                            <h3 className="font-bold text-gray-800">
                                Carefully Packed
                            </h3>

                            <p className="text-sm text-gray-500 mt-1">
                                Your jewellery is packed carefully before dispatch.
                            </p>
                        </div>

                    </div>

                    {/* SECURE PAYMENT */}

                    <div className="flex items-start gap-4 bg-white border border-pink-100 rounded-2xl p-4">

                        <div className="text-2xl">
                            🔒
                        </div>

                        <div>
                            <h3 className="font-bold text-gray-800">
                                Secure Checkout
                            </h3>

                            <p className="text-sm text-gray-500 mt-1">
                                Payments are processed through our secure checkout.
                            </p>
                        </div>

                    </div>

                    {/* QUALITY */}

                    <div className="flex items-start gap-4 bg-white border border-pink-100 rounded-2xl p-4">

                        <div className="text-2xl">
                            💎
                        </div>

                        <div>
                            <h3 className="font-bold text-gray-800">
                                Jewellery Care
                            </h3>

                            <p className="text-sm text-gray-500 mt-1">
                                Handle and store your jewellery carefully to maintain its finish.
                            </p>
                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
}