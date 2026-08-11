"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "../../../../components/Navbar";
import Footer from "../../../../components/Footer";
type Order = {
    id: number;
    customer_name: string;
    email: string;
    phone: string;
    address: string;
    total: string;
    status: string;
    created_at?: string;
    payment_status?: string | null;
};

type OrderItem = {
    id: number;
    title: string;
    quantity: number;
    price: string;
};

export default function OrderDetails() {
    const params = useParams();

    const id = Array.isArray(params?.id)
        ? params.id[0]
        : params?.id;

    const [contact, setContact] =
        useState("");

    const [order, setOrder] =
        useState<Order | null>(null);

    const [items, setItems] =
        useState<OrderItem[]>([]);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [verified, setVerified] =
        useState(false);

    // ==========================================
    // VERIFY ORDER
    // ==========================================

    async function verifyOrder() {
        if (!id) {
            setError(
                "Invalid Order Number."
            );
            return;
        }

        const trimmedContact =
            contact.trim();

        if (!trimmedContact) {
            setError(
                "Please enter your email or phone number."
            );
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response =
                await fetch(
                    "/api/invoice",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body:
                            JSON.stringify({
                                orderId:
                                    Number(id),

                                contact:
                                trimmedContact,
                            }),
                    }
                );

            const result =
                await response.json();

            console.log(
                "ORDER VERIFICATION:",
                result
            );

            if (
                !response.ok ||
                !result.success
            ) {
                setOrder(null);
                setItems([]);
                setVerified(false);

                setError(
                    result.message ||
                    "Unable to verify this order."
                );

                return;
            }

            setOrder(
                result.order
            );

            setItems(
                result.items || []
            );

            setVerified(true);

        } catch (error) {
            console.error(
                "Order verification error:",
                error
            );

            setError(
                "Something went wrong while loading your order."
            );

        } finally {
            setLoading(false);
        }
    }

    // ==========================================
    // PAGE
    // ==========================================

    return (
        <>
            <Navbar />

            <section className="min-h-screen bg-gradient-to-b from-pink-50 to-white py-16 px-6">

                <div className="max-w-6xl mx-auto">

                    {/* ==========================================
                        VERIFICATION
                    ========================================== */}

                    {!verified && (
                        <div className="max-w-xl mx-auto">

                            <div className="bg-white rounded-3xl shadow-xl p-8 md:p-10">

                                <div className="text-center mb-8">

                                    <div className="text-6xl mb-5">
                                        📦
                                    </div>

                                    <h1 className="text-4xl font-bold text-pink-700">
                                        View Your Order
                                    </h1>

                                    <p className="text-gray-500 mt-4 leading-relaxed">
                                        For your security,
                                        please verify your
                                        order using the email
                                        or phone number used
                                        during checkout.
                                    </p>

                                </div>

                                {/* Order Number */}

                                <label className="block text-lg font-semibold text-gray-700 mb-2">
                                    Order Number
                                </label>

                                <div className="w-full bg-gray-100 border rounded-xl p-4 mb-6 text-gray-700 font-semibold">
                                    #{id}
                                </div>

                                {/* Contact */}

                                <label className="block text-lg font-semibold text-gray-700 mb-2">
                                    Email or Phone Number
                                </label>

                                <input
                                    type="text"
                                    value={contact}
                                    onChange={(e) =>
                                        setContact(
                                            e.target.value
                                        )
                                    }
                                    onKeyDown={(e) => {
                                        if (
                                            e.key ===
                                            "Enter"
                                        ) {
                                            verifyOrder();
                                        }
                                    }}
                                    placeholder="Enter email or phone"
                                    className="w-full border border-gray-300 rounded-xl p-4 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                                />

                                {/* Error */}

                                {error && (
                                    <div className="mt-4 bg-red-50 border border-red-200 text-red-600 rounded-xl p-4">
                                        {error}
                                    </div>
                                )}

                                {/* Button */}

                                <button
                                    type="button"
                                    onClick={
                                        verifyOrder
                                    }
                                    disabled={
                                        loading
                                    }
                                    className="w-full mt-6 bg-pink-600 text-white py-4 rounded-full font-semibold hover:bg-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading
                                        ? "Verifying..."
                                        : "View My Order"}
                                </button>

                                <Link
                                    href="/shop"
                                    className="block text-center text-pink-600 font-semibold mt-6 hover:underline"
                                >
                                    Continue Shopping
                                </Link>

                            </div>

                        </div>
                    )}

                    {/* ==========================================
                        ORDER DETAILS
                    ========================================== */}

                    {verified && order && (
                        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-10">

                            {/* Header */}

                            <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 mb-10">

                                <div>

                                    <p className="text-gray-500">
                                        Order Number
                                    </p>

                                    <h1 className="text-4xl md:text-5xl font-bold text-pink-700">
                                        #{order.id}
                                    </h1>

                                    <p className="text-gray-500 mt-2">
                                        {order.created_at
                                            ? new Date(
                                                order.created_at
                                            ).toLocaleString()
                                            : "Date unavailable"}
                                    </p>

                                </div>

                                <div className="text-left md:text-right">

                                    <p className="text-gray-500">
                                        Order Total
                                    </p>

                                    <h2 className="text-3xl md:text-4xl font-bold text-green-600">
                                        ₹{order.total}
                                    </h2>

                                </div>

                            </div>

                            {/* Customer + Status */}

                            <div className="grid lg:grid-cols-2 gap-8 mb-10">

                                {/* Customer Details */}

                                <div className="bg-pink-50 rounded-2xl p-6">

                                    <h2 className="text-2xl font-bold text-pink-700 mb-5">
                                        Delivery Details
                                    </h2>

                                    <div className="space-y-3 text-gray-700">

                                        <p>
                                            <strong>
                                                Name:
                                            </strong>{" "}
                                            {order.customer_name}
                                        </p>

                                        <p>
                                            <strong>
                                                Phone:
                                            </strong>{" "}
                                            {order.phone}
                                        </p>

                                        <p>
                                            <strong>
                                                Email:
                                            </strong>{" "}
                                            {order.email ||
                                                "-"}
                                        </p>

                                        <p>
                                            <strong>
                                                Address:
                                            </strong>{" "}
                                            {order.address}
                                        </p>

                                    </div>

                                </div>

                                {/* Order Status */}

                                <div className="bg-pink-50 rounded-2xl p-6">

                                    <h2 className="text-2xl font-bold text-pink-700 mb-5">
                                        Order Status
                                    </h2>

                                    <span
                                        className={`inline-block px-5 py-3 rounded-full font-bold ${
                                            order.status ===
                                            "Delivered"
                                                ? "bg-green-100 text-green-700"
                                                : order.status ===
                                                "Cancelled"
                                                    ? "bg-red-100 text-red-700"
                                                    : "bg-pink-100 text-pink-700"
                                        }`}
                                    >
                                        {order.status ||
                                            "Pending"}
                                    </span>

                                    <p className="text-gray-500 mt-4">
                                        Our team will
                                        update your order
                                        status as it moves
                                        through processing.
                                    </p>

                                </div>

                            </div>

                            {/* Payment */}

                            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-10">

                                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">

                                    <h2 className="text-2xl font-bold text-green-700">
                                        💳 Payment Details
                                    </h2>

                                    <span
                                        className={`px-5 py-2 rounded-full font-bold ${
                                            order.payment_status ===
                                            "Paid"
                                                ? "bg-green-100 text-green-700"
                                                : "bg-yellow-100 text-yellow-700"
                                        }`}
                                    >
                                        {order.payment_status ||
                                            "Not Available"}
                                    </span>

                                </div>

                            </div>

                            {/* Products */}

                            <h2 className="text-3xl font-bold text-pink-700 mb-6">
                                Products Ordered
                            </h2>

                            <div className="space-y-5">

                                {items.length === 0 ? (
                                    <div className="border rounded-2xl p-6 text-gray-500">
                                        No products found
                                        for this order.
                                    </div>
                                ) : (
                                    items.map(
                                        (item) => (
                                            <div
                                                key={
                                                    item.id
                                                }
                                                className="bg-white border rounded-2xl p-6 flex flex-col md:flex-row justify-between md:items-center gap-4"
                                            >

                                                <div>

                                                    <h3 className="text-xl font-bold">
                                                        {
                                                            item.title
                                                        }
                                                    </h3>

                                                    <p className="text-gray-500 mt-2">
                                                        Quantity:{" "}
                                                        {
                                                            item.quantity
                                                        }
                                                    </p>

                                                </div>

                                                <div className="text-2xl font-bold text-pink-700">
                                                    ₹
                                                    {
                                                        item.price
                                                    }
                                                </div>

                                            </div>
                                        )
                                    )
                                )}

                            </div>

                            {/* Total */}

                            <div className="border-t mt-8 pt-6 flex justify-between items-center">

                                <span className="text-2xl font-bold">
                                    Total
                                </span>

                                <span className="text-3xl font-bold text-pink-700">
                                    ₹{order.total}
                                </span>

                            </div>

                            {/* Buttons */}

                            <div className="flex flex-col md:flex-row gap-4 mt-8">

                                <Link
                                    href="/shop"
                                    className="flex-1 text-center bg-pink-600 text-white py-4 rounded-full font-semibold hover:bg-pink-700 transition"
                                >
                                    Continue Shopping
                                </Link>

                                <Link
                                    href="/"
                                    className="flex-1 text-center border-2 border-pink-600 text-pink-600 py-4 rounded-full font-semibold hover:bg-pink-50 transition"
                                >
                                    Back to Home
                                </Link>

                            </div>

                        </div>
                    )}

                </div>

            </section>

            <Footer />
        </>
    );
}