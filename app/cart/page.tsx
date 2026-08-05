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

    const total = cart.reduce(
        (sum, item) =>
            sum + Number(item.price.replace("₹", "")) * item.quantity,
        0
    );

    return (
        <>
            <Navbar />

            <section className="min-h-screen bg-gradient-to-b from-pink-50 to-white py-16">
                <div className="max-w-7xl mx-auto px-6">

                    <h1 className="text-5xl font-bold text-pink-700 mb-12">
                        🛒 Shopping Cart
                    </h1>

                    {cart.length === 0 ? (
                        <div className="bg-white rounded-3xl shadow-lg p-12 text-center">

                            <div className="text-7xl mb-6">🛍️</div>

                            <h2 className="text-3xl font-bold text-gray-800">
                                Your cart is empty
                            </h2>

                            <p className="text-gray-500 mt-3">
                                Looks like you haven't added any jewellery yet.
                            </p>

                            <Link
                                href="/shop"
                                className="inline-block mt-8 bg-pink-600 text-white px-8 py-4 rounded-full hover:bg-pink-700 transition"
                            >
                                Continue Shopping
                            </Link>

                        </div>
                    ) : (
                        <div className="grid lg:grid-cols-3 gap-10">

                            {/* Cart Items */}
                            <div className="lg:col-span-2 space-y-6">

                                {cart.map((item) => (
                                    <div
                                        key={item.id}
                                        className="bg-white rounded-3xl shadow-lg p-6 flex flex-col md:flex-row items-center gap-6 hover:shadow-xl transition"
                                    >

                                        <img
                                            src={item.image}
                                            alt={item.title}
                                            className="w-32 h-32 object-cover rounded-2xl border"
                                        />

                                        <div className="flex-1">

                                            <h2 className="text-2xl font-bold text-gray-800">
                                                {item.title}
                                            </h2>

                                            <p className="text-pink-700 text-xl font-semibold mt-2">
                                                {item.price}
                                            </p>

                                            <div className="flex items-center gap-3 mt-6">

                                                <button
                                                    onClick={() => decreaseQuantity(item.id)}
                                                    className="w-10 h-10 rounded-full bg-gray-200 hover:bg-pink-100 text-xl"
                                                >
                                                    −
                                                </button>

                                                <span className="text-xl font-bold w-8 text-center">
                                                    {item.quantity}
                                                </span>

                                                <button
                                                    onClick={() => increaseQuantity(item.id)}
                                                    className="w-10 h-10 rounded-full bg-gray-200 hover:bg-pink-100 text-xl"
                                                >
                                                    +
                                                </button>

                                            </div>

                                        </div>

                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            className="text-red-500 hover:text-red-700 font-semibold"
                                        >
                                            🗑 Remove
                                        </button>

                                    </div>
                                ))}

                            </div>

                            {/* Order Summary */}
                            <div>

                                <div className="bg-white rounded-3xl shadow-xl p-8 sticky top-28">

                                    <h2 className="text-3xl font-bold text-pink-700 mb-8">
                                        Order Summary
                                    </h2>

                                    <div className="space-y-5">

                                        <div className="flex justify-between text-lg">
                                            <span>Items</span>
                                            <span>{cart.length}</span>
                                        </div>

                                        <div className="flex justify-between text-lg">
                                            <span>Subtotal</span>
                                            <span>₹{total}</span>
                                        </div>

                                        <div className="flex justify-between text-lg">
                                            <span>Shipping</span>
                                            <span className="text-green-600 font-semibold">
                                                FREE
                                            </span>
                                        </div>

                                        <div className="flex justify-between text-lg">
                                            <span>Taxes</span>
                                            <span>Included</span>
                                        </div>

                                        <hr />

                                        <div className="flex justify-between text-3xl font-bold text-pink-700">
                                            <span>Total</span>
                                            <span>₹{total}</span>
                                        </div>

                                    </div>

                                    <Link
                                        href="/checkout"
                                        className="block mt-8 text-center bg-pink-600 text-white py-4 rounded-full font-semibold hover:bg-pink-700 transition"
                                    >
                                        Proceed to Checkout →
                                    </Link>

                                    <button
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