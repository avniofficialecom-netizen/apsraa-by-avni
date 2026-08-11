"use client";

import { useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

type Order = {
    id: number;
    customer_name: string;
    email: string;
    phone: string;
    address: string;
    total: string;
    status: string;
    payment_status?: string | null;
    created_at: string;
};

type OrderItem = {
    id: number;
    title: string;
    quantity: number;
    price: string;
};

const statuses = [
    "Pending",
    "Confirmed",
    "Packed",
    "Shipped",
    "Delivered",
];

const statusIcons: Record<string, string> = {
    Pending: "🕐",
    Confirmed: "✅",
    Packed: "📦",
    Shipped: "🚚",
    Delivered: "🏠",
};

export default function TrackOrderPage() {
    const [orderId, setOrderId] = useState("");
    const [contact, setContact] = useState("");

    const [order, setOrder] = useState<Order | null>(null);
    const [items, setItems] = useState<OrderItem[]>([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function trackOrder() {
        setError("");
        setOrder(null);
        setItems([]);

        if (!orderId.trim() || !contact.trim()) {
            setError(
                "Please enter your Order Number and Phone or Email."
            );
            return;
        }

        const numericOrderId = Number(
            orderId.replace("#", "").trim()
        );

        if (!numericOrderId || isNaN(numericOrderId)) {
            setError("Please enter a valid Order Number.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                "/api/track-order",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        orderId: numericOrderId,
                        contact: contact.trim(),
                    }),
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                setError(
                    result.message ||
                    "Order could not be found."
                );
                return;
            }

            setOrder(result.order);
            setItems(result.items || []);
        } catch (error) {
            console.error(
                "Track order error:",
                error
            );

            setError(
                "Something went wrong. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }

    function handleKeyDown(
        e: React.KeyboardEvent<HTMLInputElement>
    ) {
        if (e.key === "Enter") {
            trackOrder();
        }
    }

    const currentStatus =
        order?.status || "Pending";

    const currentIndex = statuses.includes(
        currentStatus
    )
        ? statuses.indexOf(currentStatus)
        : 0;

    return (
        <>
            <Navbar />

            <section className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-white py-16 px-5">
                <div className="max-w-5xl mx-auto">

                    {/* =========================
                        HEADER
                    ========================= */}

                    <div className="text-center mb-10">

                        <div className="text-6xl mb-4">
                            📦
                        </div>

                        <h1 className="text-4xl md:text-5xl font-bold text-pink-700">
                            Track Your Order
                        </h1>

                        <p className="text-gray-500 text-base md:text-lg mt-3">
                            Enter your order number and the
                            phone number or email used during
                            checkout.
                        </p>

                    </div>

                    {/* =========================
                        SEARCH BOX
                    ========================= */}

                    <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 max-w-2xl mx-auto mb-12">

                        <div className="mb-5">

                            <label className="block font-semibold text-gray-700 mb-2">
                                Order Number
                            </label>

                            <input
                                type="text"
                                value={orderId}
                                onChange={(e) =>
                                    setOrderId(
                                        e.target.value
                                    )
                                }
                                onKeyDown={handleKeyDown}
                                placeholder="Example: 48 or #48"
                                className="w-full border-2 border-gray-200 rounded-xl p-4 focus:border-pink-500 focus:outline-none transition"
                            />

                        </div>

                        <div className="mb-5">

                            <label className="block font-semibold text-gray-700 mb-2">
                                Phone Number or Email
                            </label>

                            <input
                                type="text"
                                value={contact}
                                onChange={(e) =>
                                    setContact(
                                        e.target.value
                                    )
                                }
                                onKeyDown={handleKeyDown}
                                placeholder="Enter phone or email"
                                className="w-full border-2 border-gray-200 rounded-xl p-4 focus:border-pink-500 focus:outline-none transition"
                            />

                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 mb-5">
                                {error}
                            </div>
                        )}

                        <button
                            onClick={trackOrder}
                            disabled={loading}
                            className="w-full bg-pink-600 hover:bg-pink-700 text-white py-4 rounded-full font-bold text-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading
                                ? "Finding Order..."
                                : "Track Order"}
                        </button>

                    </div>

                    {/* =========================
                        ORDER DETAILS
                    ========================= */}

                    {order && (
                        <div className="space-y-8">

                            {/* =========================
                                ORDER HEADER
                            ========================= */}

                            <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8">

                                <div className="flex flex-col md:flex-row justify-between gap-6">

                                    <div>

                                        <p className="text-gray-500">
                                            Order Number
                                        </p>

                                        <h2 className="text-4xl font-bold text-pink-700">
                                            #{order.id}
                                        </h2>

                                        <p className="text-gray-500 mt-2">
                                            {new Date(
                                                order.created_at
                                            ).toLocaleString(
                                                "en-IN",
                                                {
                                                    dateStyle:
                                                        "medium",
                                                    timeStyle:
                                                        "short",
                                                }
                                            )}
                                        </p>

                                    </div>

                                    <div className="text-left md:text-right">

                                        <p className="text-gray-500">
                                            Order Total
                                        </p>

                                        <h2 className="text-4xl font-bold text-green-600">
                                            ₹{order.total}
                                        </h2>

                                        <div className="mt-3">

                                            <span
                                                className={`inline-block px-5 py-2 rounded-full font-bold ${
                                                    order.payment_status ===
                                                    "Paid"
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-yellow-100 text-yellow-700"
                                                }`}
                                            >
                                                {order.payment_status ===
                                                "Paid"
                                                    ? "💳 Paid"
                                                    : "🕐 Payment Pending"}
                                            </span>

                                        </div>

                                    </div>

                                </div>

                            </div>

                            {/* =========================
                                ORDER TRACKING
                            ========================= */}

                            {currentStatus ===
                            "Cancelled" ? (

                                <div className="bg-red-50 border border-red-200 rounded-3xl p-10 text-center">

                                    <div className="text-6xl">
                                        ❌
                                    </div>

                                    <h2 className="text-3xl font-bold text-red-600 mt-4">
                                        Order Cancelled
                                    </h2>

                                    <p className="text-gray-600 mt-3">
                                        This order has been
                                        cancelled.
                                    </p>

                                </div>

                            ) : (

                                <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8">

                                    <h2 className="text-3xl font-bold text-pink-700 mb-10">
                                        Order Tracking
                                    </h2>

                                    {/* Desktop Timeline */}

                                    <div className="hidden md:block relative">

                                        <div className="absolute top-8 left-[10%] right-[10%] h-1 bg-gray-200" />

                                        <div
                                            className="absolute top-8 left-[10%] h-1 bg-pink-600 transition-all duration-500"
                                            style={{
                                                width:
                                                    currentIndex ===
                                                    0
                                                        ? "0%"
                                                        : `${(currentIndex /
                                                            (statuses.length -
                                                                1)) *
                                                        80}%`,
                                            }}
                                        />

                                        <div className="grid grid-cols-5 gap-4 relative">

                                            {statuses.map(
                                                (
                                                    status,
                                                    index
                                                ) => {

                                                    const completed =
                                                        index <=
                                                        currentIndex;

                                                    const isCurrent =
                                                        status ===
                                                        currentStatus;

                                                    return (
                                                        <div
                                                            key={
                                                                status
                                                            }
                                                            className="text-center"
                                                        >

                                                            <div
                                                                className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center text-3xl relative z-10 ${
                                                                    completed
                                                                        ? "bg-pink-600 text-white"
                                                                        : "bg-gray-200 text-gray-500"
                                                                }`}
                                                            >
                                                                {
                                                                    statusIcons[
                                                                        status
                                                                        ]
                                                                }
                                                            </div>

                                                            <h3
                                                                className={`font-bold mt-4 ${
                                                                    completed
                                                                        ? "text-pink-700"
                                                                        : "text-gray-400"
                                                                }`}
                                                            >
                                                                {
                                                                    status
                                                                }
                                                            </h3>

                                                            {isCurrent && (
                                                                <p className="text-sm text-pink-600 font-semibold mt-2">
                                                                    Current
                                                                    Status
                                                                </p>
                                                            )}

                                                        </div>
                                                    );
                                                }
                                            )}

                                        </div>

                                    </div>

                                    {/* Mobile Timeline */}

                                    <div className="md:hidden space-y-5">

                                        {statuses.map(
                                            (
                                                status,
                                                index
                                            ) => {

                                                const completed =
                                                    index <=
                                                    currentIndex;

                                                const isCurrent =
                                                    status ===
                                                    currentStatus;

                                                return (
                                                    <div
                                                        key={
                                                            status
                                                        }
                                                        className="flex items-center gap-4"
                                                    >

                                                        <div
                                                            className={`w-14 h-14 shrink-0 rounded-full flex items-center justify-center text-2xl ${
                                                                completed
                                                                    ? "bg-pink-600 text-white"
                                                                    : "bg-gray-200 text-gray-500"
                                                            }`}
                                                        >
                                                            {
                                                                statusIcons[
                                                                    status
                                                                    ]
                                                            }
                                                        </div>

                                                        <div>

                                                            <h3
                                                                className={`font-bold ${
                                                                    completed
                                                                        ? "text-pink-700"
                                                                        : "text-gray-400"
                                                                }`}
                                                            >
                                                                {
                                                                    status
                                                                }
                                                            </h3>

                                                            {isCurrent && (
                                                                <p className="text-sm text-pink-600 font-semibold">
                                                                    Current
                                                                    Status
                                                                </p>
                                                            )}

                                                        </div>

                                                    </div>
                                                );
                                            }
                                        )}

                                    </div>

                                </div>
                            )}

                            {/* =========================
                                DELIVERY + PRODUCTS
                            ========================= */}

                            <div className="grid md:grid-cols-2 gap-8">

                                {/* Delivery Details */}

                                <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8">

                                    <h2 className="text-2xl font-bold text-pink-700 mb-5">
                                        Delivery Details
                                    </h2>

                                    <p>
                                        <strong>
                                            Name:
                                        </strong>{" "}
                                        {order.customer_name}
                                    </p>

                                    <p className="mt-3">
                                        <strong>
                                            Phone:
                                        </strong>{" "}
                                        {order.phone}
                                    </p>

                                    <p className="mt-3">
                                        <strong>
                                            Email:
                                        </strong>{" "}
                                        {order.email || "-"}
                                    </p>

                                    <p className="mt-3">
                                        <strong>
                                            Address:
                                        </strong>
                                    </p>

                                    <p className="text-gray-600 mt-1 leading-relaxed">
                                        {order.address}
                                    </p>

                                </div>

                                {/* Products */}

                                <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8">

                                    <h2 className="text-2xl font-bold text-pink-700 mb-5">
                                        Products
                                    </h2>

                                    {items.length === 0 ? (

                                        <p className="text-gray-500">
                                            No product details
                                            available.
                                        </p>

                                    ) : (

                                        <div className="space-y-4">

                                            {items.map(
                                                (item) => (
                                                    <div
                                                        key={
                                                            item.id
                                                        }
                                                        className="flex justify-between gap-4 border-b pb-4 last:border-b-0"
                                                    >

                                                        <div>

                                                            <p className="font-semibold text-gray-800">
                                                                {
                                                                    item.title
                                                                }
                                                            </p>

                                                            <p className="text-gray-500 text-sm mt-1">
                                                                Qty:{" "}
                                                                {
                                                                    item.quantity
                                                                }
                                                            </p>

                                                        </div>

                                                        <p className="font-bold text-pink-700 whitespace-nowrap">
                                                            ₹
                                                            {
                                                                item.price
                                                            }
                                                        </p>

                                                    </div>
                                                )
                                            )}

                                        </div>

                                    )}

                                </div>

                            </div>

                            {/* =========================
                                STATUS MESSAGE
                            ========================= */}

                            <div className="bg-pink-50 border border-pink-100 rounded-3xl p-6 text-center">

                                <p className="text-gray-600">
                                    Need help with your order?
                                </p>

                                <p className="font-semibold text-pink-700 mt-1">
                                    Please contact APSRAA BY AVNI
                                    with your Order #{order.id}.
                                </p>

                            </div>

                        </div>
                    )}

                </div>
            </section>

            <Footer />
        </>
    );
}