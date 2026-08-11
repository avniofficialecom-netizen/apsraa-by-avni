"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";

type Order = {
    id: number;
    customer_name: string;
    email: string;
    phone: string;
    address: string;
    total: string;
    status: string;
    payment_status: string;
    created_at: string;
};

type OrderItem = {
    id: number;
    title: string;
    price: string;
    quantity: number;
};

export default function CustomerOrderPage() {
    const { id } = useParams();

    const [contact, setContact] =
        useState("");

    const [order, setOrder] =
        useState<Order | null>(null);

    const [items, setItems] =
        useState<OrderItem[]>([]);

    const [loading, setLoading] =
        useState(false);

    const [searched, setSearched] =
        useState(false);

    const [error, setError] =
        useState("");

    // ==========================================
    // AUTO-LOAD SAVED CONTACT AFTER SUCCESS
    // ==========================================

    useEffect(() => {
        if (!id) return;

        const savedContact =
            sessionStorage.getItem(
                `order-contact-${id}`
            );

        if (savedContact) {
            setContact(savedContact);

            loadOrder(savedContact);
        }
    }, [id]);

    // ==========================================
    // LOAD ORDER
    // ==========================================

    async function loadOrder(
        contactValue = contact
    ) {
        if (!id) return;

        const orderId = Number(id);

        if (
            !orderId ||
            isNaN(orderId)
        ) {
            setError(
                "Invalid order number."
            );
            setSearched(true);
            return;
        }

        if (!contactValue.trim()) {
            setError(
                "Please enter your phone number or email."
            );
            setSearched(true);
            return;
        }

        setLoading(true);
        setError("");
        setSearched(true);

        try {
            const response =
                await fetch(
                    "/api/track-order",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body:
                            JSON.stringify({
                                orderId,
                                contact:
                                    contactValue.trim(),
                            }),
                    }
                );

            const result =
                await response.json();

            if (
                !response.ok ||
                !result.success
            ) {
                setOrder(null);
                setItems([]);

                setError(
                    result.message ||
                    "Unable to find this order."
                );

                return;
            }

            setOrder(result.order);
            setItems(
                result.items || []
            );

            // Save only for this browser session
            sessionStorage.setItem(
                `order-contact-${orderId}`,
                contactValue.trim()
            );
        } catch (err) {
            console.error(
                "Order loading error:",
                err
            );

            setOrder(null);
            setItems([]);

            setError(
                "Unable to load your order. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }

    // ==========================================
    // LOADING
    // ==========================================

    if (
        loading &&
        !order
    ) {
        return (
            <>
                <Navbar />

                <section className="min-h-screen bg-pink-50 flex items-center justify-center">

                    <p className="text-xl text-gray-600">
                        Verifying your order...
                    </p>

                </section>

                <Footer />
            </>
        );
    }

    // ==========================================
    // ORDER NOT YET VERIFIED
    // ==========================================

    if (!order) {
        return (
            <>
                <Navbar />

                <section className="min-h-screen bg-pink-50 flex items-center justify-center px-6 py-20">

                    <div className="bg-white rounded-3xl shadow-xl p-10 text-center w-full max-w-md">

                        <div className="text-6xl mb-5">
                            📦
                        </div>

                        <h1 className="text-3xl font-bold text-pink-700">
                            View Your Order
                        </h1>

                        <p className="text-gray-500 mt-3 mb-8">
                            For your security, please
                            verify your order with the
                            phone number or email used
                            during checkout.
                        </p>

                        <div className="text-left">

                            <label className="block font-semibold text-gray-700 mb-2">
                                Order Number
                            </label>

                            <input
                                type="text"
                                value={
                                    id
                                        ? `#${id}`
                                        : ""
                                }
                                disabled
                                className="w-full border rounded-xl p-3 mb-5 bg-gray-100 text-gray-600"
                            />

                            <label className="block font-semibold text-gray-700 mb-2">
                                Email or Phone Number
                            </label>

                            <input
                                type="text"
                                placeholder="Enter email or phone"
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
                                        loadOrder();
                                    }
                                }}
                                className="w-full border rounded-xl p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-pink-400"
                            />

                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 rounded-xl p-4 mb-5 text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={() =>
                                loadOrder()
                            }
                            disabled={
                                loading
                            }
                            className="w-full bg-pink-600 text-white py-4 rounded-full font-semibold hover:bg-pink-700 transition disabled:opacity-50"
                        >
                            {loading
                                ? "Verifying..."
                                : "View My Order"}
                        </button>

                        <Link
                            href="/shop"
                            className="inline-block mt-5 text-pink-600 font-semibold hover:underline"
                        >
                            Continue Shopping
                        </Link>

                    </div>

                </section>

                <Footer />
            </>
        );
    }

    // ==========================================
    // VERIFIED ORDER
    // ==========================================

    return (
        <>
            <Navbar />

            <section className="min-h-screen bg-pink-50 py-16 px-6">

                <div className="max-w-5xl mx-auto">

                    <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12">

                        {/* Header */}

                        <div className="flex flex-col md:flex-row justify-between gap-6 mb-10">

                            <div>

                                <p className="text-gray-500">
                                    Order Number
                                </p>

                                <h1 className="text-4xl font-bold text-pink-700">
                                    #{order.id}
                                </h1>

                                <p className="text-gray-500 mt-2">
                                    {order.created_at
                                        ? new Date(
                                            order.created_at
                                        ).toLocaleString()
                                        : "-"}
                                </p>

                            </div>

                            <div className="text-left md:text-right">

                                <p className="text-gray-500">
                                    Order Status
                                </p>

                                <span
                                    className={`inline-block mt-2 px-5 py-2 rounded-full font-bold ${
                                        order.status ===
                                        "Delivered"
                                            ? "bg-green-100 text-green-700"
                                            : order.status ===
                                            "Cancelled"
                                                ? "bg-red-100 text-red-700"
                                                : "bg-pink-100 text-pink-700"
                                    }`}
                                >
                                    {
                                        order.status
                                    }
                                </span>

                            </div>

                        </div>

                        {/* Payment Status */}

                        <div className="bg-green-50 border border-green-100 rounded-2xl p-5 mb-8">

                            <p className="text-gray-600">
                                Payment Status
                            </p>

                            <p className="font-bold text-green-700 mt-1">
                                {order.payment_status ||
                                    "Paid"}
                            </p>

                        </div>

                        {/* Customer Details */}

                        <div className="bg-pink-50 rounded-2xl p-6 mb-8">

                            <h2 className="text-2xl font-bold text-pink-700 mb-5">
                                Delivery Details
                            </h2>

                            <div className="grid md:grid-cols-2 gap-4 text-gray-700">

                                <p>
                                    <strong>
                                        Name:
                                    </strong>{" "}
                                    {
                                        order.customer_name
                                    }
                                </p>

                                <p>
                                    <strong>
                                        Email:
                                    </strong>{" "}
                                    {
                                        order.email ||
                                        "-"
                                    }
                                </p>

                                <p>
                                    <strong>
                                        Phone:
                                    </strong>{" "}
                                    {
                                        order.phone
                                    }
                                </p>

                                <p className="md:col-span-2">
                                    <strong>
                                        Address:
                                    </strong>{" "}
                                    {
                                        order.address
                                    }
                                </p>

                            </div>

                        </div>

                        {/* Products */}

                        <h2 className="text-2xl font-bold text-pink-700 mb-5">
                            Your Products
                        </h2>

                        <div className="space-y-4">

                            {items.length ===
                            0 ? (
                                <div className="border rounded-2xl p-5 text-gray-500">
                                    No order items found.
                                </div>
                            ) : (
                                items.map(
                                    (
                                        item
                                    ) => (

                                        <div
                                            key={
                                                item.id
                                            }
                                            className="border rounded-2xl p-5 flex justify-between items-center gap-5"
                                        >

                                            <div>

                                                <h3 className="font-bold text-lg">
                                                    {
                                                        item.title
                                                    }
                                                </h3>

                                                <p className="text-gray-500 mt-1">
                                                    Quantity:{" "}
                                                    {
                                                        item.quantity
                                                    }
                                                </p>

                                            </div>

                                            <div className="font-bold text-pink-700 whitespace-nowrap">
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
                                ₹
                                {
                                    order.total
                                }
                            </span>

                        </div>

                        {/* Buttons */}

                        <div className="flex flex-col md:flex-row gap-4 mt-8">

                            <Link
                                href="/track-order"
                                className="flex-1 text-center bg-pink-600 text-white py-4 rounded-full font-semibold hover:bg-pink-700 transition"
                            >
                                Track Order
                            </Link>

                            <Link
                                href="/shop"
                                className="flex-1 text-center border-2 border-pink-600 text-pink-600 py-4 rounded-full font-semibold hover:bg-pink-50 transition"
                            >
                                Continue Shopping
                            </Link>

                            <Link
                                href="/"
                                className="flex-1 text-center border-2 border-gray-300 text-gray-600 py-4 rounded-full font-semibold hover:bg-gray-50 transition"
                            >
                                Back to Home
                            </Link>

                        </div>

                    </div>

                </div>

            </section>

            <Footer />
        </>
    );
}