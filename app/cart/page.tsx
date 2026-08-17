"use client";

import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { useCart } from "../../components/context/CartContext";

export default function Cart() {
    const {
        cart,
        increaseQuantity,
        decreaseQuantity,
        removeFromCart,
        clearCart,
    } = useCart();

    // ==========================================
    // PRICE HELPER
    // ==========================================

    const getNumericPrice = (price: string) => {
        const numericPrice = Number(
            String(price).replace(/[₹,]/g, "")
        );

        return Number.isFinite(numericPrice)
            ? numericPrice
            : 0;
    };

    // ==========================================
    // TOTAL
    // ==========================================

    const total = cart.reduce(
        (sum, item) =>
            sum +
            getNumericPrice(item.price) *
            item.quantity,
        0
    );

    // ==========================================
    // TOTAL ITEMS
    // ==========================================

    const totalItems = cart.reduce(
        (sum, item) =>
            sum + item.quantity,
        0
    );

    return (
        <>
            <Navbar />

            <section className="min-h-screen bg-gradient-to-b from-pink-50 to-white py-16">
                <div className="max-w-7xl mx-auto px-6">

                    {/* ==========================================
                        TITLE
                    ========================================== */}

                    <h1 className="text-5xl font-bold text-pink-700 mb-12">
                        🛒 Shopping Cart
                    </h1>

                    {/* ==========================================
                        EMPTY CART
                    ========================================== */}

                    {cart.length === 0 ? (
                        <div className="bg-white rounded-3xl shadow-lg p-12 text-center">

                            <div className="text-7xl mb-6">
                                🛍️
                            </div>

                            <h2 className="text-3xl font-bold text-gray-800">
                                Your cart is empty
                            </h2>

                            <p className="text-gray-500 mt-3">
                                Looks like you haven't added
                                anything yet.
                            </p>

                            <Link
                                href="/shop"
                                className="inline-block mt-8 bg-pink-600 text-white px-8 py-4 rounded-full hover:bg-pink-700 transition"
                            >
                                Continue Shopping
                            </Link>

                        </div>
                    ) : (

                        /* ==========================================
                           CART CONTENT
                        ========================================== */

                        <div className="grid lg:grid-cols-3 gap-10">

                            {/* ======================================
                                CART ITEMS
                            ====================================== */}

                            <div className="lg:col-span-2 space-y-6">

                                {cart.map((item) => (

                                    <div
                                        key={`${item.id}-${item.variantId ?? "base"}`}
                                        className="bg-white rounded-3xl shadow-lg p-6 flex flex-col md:flex-row items-center gap-6 hover:shadow-xl transition"
                                    >

                                        {/* PRODUCT IMAGE */}

                                        <img
                                            src={item.image}
                                            alt={item.title}
                                            className="w-32 h-32 object-cover rounded-2xl border"
                                        />

                                        {/* PRODUCT INFORMATION */}

                                        <div className="flex-1 w-full">

                                            <h2 className="text-2xl font-bold text-gray-800">
                                                {item.title}
                                            </h2>

                                            {/* PRICE */}

                                            <p className="text-pink-700 text-xl font-semibold mt-2">
                                                {item.price}
                                            </p>

                                            {/* ==================================
                                                VARIANT INFORMATION
                                            ================================== */}

                                            {(item.size ||
                                                item.color ||
                                                item.sku ||
                                                item.variantId) && (

                                                <div className="mt-4 space-y-1 text-sm text-gray-600">

                                                    {item.size && (
                                                        <p>
                                                            <span className="font-semibold text-gray-800">
                                                                Size:
                                                            </span>{" "}
                                                            {item.size}
                                                        </p>
                                                    )}

                                                    {item.color && (
                                                        <p>
                                                            <span className="font-semibold text-gray-800">
                                                                Color:
                                                            </span>{" "}
                                                            {item.color}
                                                        </p>
                                                    )}

                                                    {item.sku && (
                                                        <p>
                                                            <span className="font-semibold text-gray-800">
                                                                SKU:
                                                            </span>{" "}
                                                            {item.sku}
                                                        </p>
                                                    )}

                                                </div>
                                            )}

                                            {/* ==================================
                                                QUANTITY
                                            ================================== */}

                                            <div className="flex items-center gap-3 mt-6">

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        decreaseQuantity(
                                                            item.id,
                                                            item.variantId
                                                        )
                                                    }
                                                    className="w-10 h-10 rounded-full bg-gray-200 hover:bg-pink-100 text-xl transition"
                                                >
                                                    −
                                                </button>

                                                <span className="text-xl font-bold w-8 text-center">
                                                    {item.quantity}
                                                </span>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        increaseQuantity(
                                                            item.id,
                                                            item.variantId
                                                        )
                                                    }
                                                    className="w-10 h-10 rounded-full bg-gray-200 hover:bg-pink-100 text-xl transition"
                                                >
                                                    +
                                                </button>

                                            </div>

                                        </div>

                                        {/* ==================================
                                            REMOVE
                                        ================================== */}

                                        <button
                                            type="button"
                                            onClick={() =>
                                                removeFromCart(
                                                    item.id,
                                                    item.variantId
                                                )
                                            }
                                            className="text-red-500 hover:text-red-700 font-semibold whitespace-nowrap"
                                        >
                                            🗑 Remove
                                        </button>

                                    </div>

                                ))}

                            </div>

                            {/* ==========================================
                                ORDER SUMMARY
                            ========================================== */}

                            <div>

                                <div className="bg-white rounded-3xl shadow-xl p-8 sticky top-28">

                                    <h2 className="text-3xl font-bold text-pink-700 mb-8">
                                        Order Summary
                                    </h2>

                                    <div className="space-y-5">

                                        {/* ITEMS */}

                                        <div className="flex justify-between text-lg">
                                            <span>
                                                Items
                                            </span>

                                            <span>
                                                {totalItems}
                                            </span>
                                        </div>

                                        {/* SUBTOTAL */}

                                        <div className="flex justify-between text-lg">
                                            <span>
                                                Subtotal
                                            </span>

                                            <span>
                                                ₹
                                                {total.toLocaleString(
                                                    "en-IN"
                                                )}
                                            </span>
                                        </div>

                                        {/* SHIPPING */}

                                        <div className="flex justify-between text-lg">
                                            <span>
                                                Shipping
                                            </span>

                                            <span className="text-green-600 font-semibold">
                                                FREE
                                            </span>
                                        </div>

                                        {/* TAXES */}

                                        <div className="flex justify-between text-lg">
                                            <span>
                                                Taxes
                                            </span>

                                            <span>
                                                Included
                                            </span>
                                        </div>

                                        <hr />

                                        {/* TOTAL */}

                                        <div className="flex justify-between text-3xl font-bold text-pink-700">
                                            <span>
                                                Total
                                            </span>

                                            <span>
                                                ₹
                                                {total.toLocaleString(
                                                    "en-IN"
                                                )}
                                            </span>
                                        </div>

                                    </div>

                                    {/* ==================================
                                        CHECKOUT
                                    ================================== */}

                                    <Link
                                        href="/checkout"
                                        className="block mt-8 text-center bg-pink-600 text-white py-4 rounded-full font-semibold hover:bg-pink-700 transition"
                                    >
                                        Proceed to Checkout →
                                    </Link>

                                    {/* ==================================
                                        CLEAR CART
                                    ================================== */}

                                    <button
                                        type="button"
                                        onClick={clearCart}
                                        className="w-full mt-4 border-2 border-red-500 text-red-500 py-3 rounded-full hover:bg-red-50 transition"
                                    >
                                        Clear Cart
                                    </button>

                                </div>

                            </div>

                        </div>
                    )}

                </div>
            </section>

            <Footer />
        </>
    );
}