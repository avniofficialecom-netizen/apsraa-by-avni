"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";

type TrackingEvent = {
    id: number;
    awb_number: string | null;
    courier_name: string | null;
    current_status: string | null;
    shipment_status: string | null;
    activity: string | null;
    location: string | null;
    event_timestamp: string | null;
    etd: string | null;
};

type Order = {
    id: number;
    customer_name: string;
    email: string;
    phone: string;
    address: string;
    total: string;
    status: string;
    payment_status: string;
    payment_method: string | null;
    shipping_status: string | null;
    shipment_id: number | null;
    awb_number: string | null;
    courier_name: string | null;
    tracking_url: string | null;
    delivered_at: string | null;
    created_at: string;
};

type OrderItem = {
    id: number;
    title: string;
    price: string;
    quantity: number;
};

const trackingSteps = [
    {
        key: "confirmed",
        label: "Order Confirmed",
    },
    {
        key: "awb_assigned",
        label: "AWB Assigned",
    },
    {
        key: "picked_up",
        label: "Picked Up",
    },
    {
        key: "in_transit",
        label: "In Transit",
    },
    {
        key: "out_for_delivery",
        label: "Out for Delivery",
    },
    {
        key: "delivered",
        label: "Delivered",
    },
];

function normalizeStatus(
    status: string | null | undefined
) {
    return String(status || "")
        .toLowerCase()
        .replace(/[\s-]+/g, "_")
        .trim();
}

function getTrackingStep(
    status: string | null | undefined
) {
    const value =
        normalizeStatus(status);

    if (
        value === "delivered" ||
        value === "delivery_completed"
    ) {
        return 5;
    }

    if (
        value === "out_for_delivery" ||
        value === "outfordelivery"
    ) {
        return 4;
    }

    if (
        value === "in_transit" ||
        value === "intransit"
    ) {
        return 3;
    }

    if (
        value === "picked_up" ||
        value === "pickedup" ||
        value === "pickup"
    ) {
        return 2;
    }

    if (
        value === "awb_assigned" ||
        value === "awb_generated" ||
        value === "shipped"
    ) {
        return 1;
    }

    return 0;
}

function formatStatus(
    status: string | null | undefined
) {
    if (!status) {
        return "Order Confirmed";
    }

    return String(status)
        .replace(/_/g, " ")
        .replace(
            /\b\w/g,
            (letter) =>
                letter.toUpperCase()
        );
}

function formatDate(
    value: string | null | undefined
) {
    if (!value) {
        return "-";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return value;
    }

    return date.toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }
    );
}

export default function CustomerOrderPage() {
    const { id } = useParams();

    const [contact, setContact] =
        useState("");

    const [order, setOrder] =
        useState<Order | null>(null);

    const [items, setItems] =
        useState<OrderItem[]>([]);

    const [trackingEvents, setTrackingEvents] =
        useState<TrackingEvent[]>([]);

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

        const orderId =
            Number(id);

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
                setTrackingEvents([]);

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

            setTrackingEvents(
                result.events || []
            );

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
            setTrackingEvents([]);

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
    // TRACKING STATUS
    // ==========================================

    const latestEvent =
        trackingEvents.length > 0
            ? trackingEvents[0]
            : null;

    const currentShippingStatus =
        order.shipping_status ||
        latestEvent?.current_status ||
        "NEW";

    const trackingStep =
        getTrackingStep(
            currentShippingStatus
        );

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

                        {/* ==========================================
                            SHIPROCKET TRACKING
                        ========================================== */}

                        <div className="bg-white border border-pink-100 rounded-3xl p-6 md:p-8 mb-8 shadow-sm">

                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                                <div>

                                    <p className="text-sm text-gray-500 uppercase tracking-wide">
                                        Shipment Tracking
                                    </p>

                                    <h2 className="text-2xl font-bold text-pink-700 mt-1">
                                        {formatStatus(
                                            currentShippingStatus
                                        )}
                                    </h2>

                                    {latestEvent?.location && (
                                        <p className="text-sm text-gray-500 mt-1">
                                            Latest location:{" "}
                                            {
                                                latestEvent.location
                                            }
                                        </p>
                                    )}

                                </div>

                                {order.tracking_url && (
                                    <a
                                        href={
                                            order.tracking_url
                                        }
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center justify-center bg-pink-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-pink-700 transition"
                                    >
                                        Track Shipment
                                    </a>
                                )}

                            </div>

                            {/* Progress */}

                            <div className="mt-8 hidden md:flex items-start">

                                {trackingSteps.map(
                                    (
                                        step,
                                        index
                                    ) => {

                                        const completed =
                                            trackingStep >=
                                            index;

                                        const active =
                                            trackingStep ===
                                            index;

                                        return (
                                            <div
                                                key={
                                                    step.key
                                                }
                                                className="flex flex-1 items-start"
                                            >

                                                <div className="flex flex-col items-center min-w-0">

                                                    <div
                                                        className={`h-10 w-10 rounded-full flex items-center justify-center border-2 font-bold ${
                                                            completed
                                                                ? "bg-pink-600 border-pink-600 text-white"
                                                                : "bg-white border-gray-300 text-gray-400"
                                                        }`}
                                                    >
                                                        {completed
                                                            ? "✓"
                                                            : index +
                                                            1}
                                                    </div>

                                                    <p
                                                        className={`mt-2 text-xs text-center ${
                                                            active
                                                                ? "font-bold text-pink-700"
                                                                : completed
                                                                    ? "font-semibold text-gray-700"
                                                                    : "text-gray-400"
                                                        }`}
                                                    >
                                                        {
                                                            step.label
                                                        }
                                                    </p>

                                                </div>

                                                {index <
                                                    trackingSteps.length -
                                                    1 && (
                                                        <div
                                                            className={`h-1 flex-1 mt-5 mx-2 rounded ${
                                                                trackingStep >
                                                                index
                                                                    ? "bg-pink-600"
                                                                    : "bg-gray-200"
                                                            }`}
                                                        />
                                                    )}

                                            </div>
                                        );
                                    }
                                )}

                            </div>

                            {/* Mobile progress */}

                            <div className="mt-8 md:hidden space-y-3">

                                {trackingSteps.map(
                                    (
                                        step,
                                        index
                                    ) => {

                                        const completed =
                                            trackingStep >=
                                            index;

                                        return (
                                            <div
                                                key={
                                                    step.key
                                                }
                                                className="flex items-center gap-3"
                                            >

                                                <div
                                                    className={`h-8 w-8 rounded-full flex items-center justify-center border-2 text-xs font-bold ${
                                                        completed
                                                            ? "bg-pink-600 border-pink-600 text-white"
                                                            : "bg-white border-gray-300 text-gray-400"
                                                    }`}
                                                >
                                                    {completed
                                                        ? "✓"
                                                        : index +
                                                        1}
                                                </div>

                                                <span
                                                    className={
                                                        completed
                                                            ? "font-semibold text-gray-700"
                                                            : "text-gray-400"
                                                    }
                                                >
                                                    {
                                                        step.label
                                                    }
                                                </span>

                                            </div>
                                        );
                                    }
                                )}

                            </div>

                            {/* Shipment details */}

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">

                                <div className="bg-pink-50 rounded-2xl p-4">

                                    <p className="text-xs text-gray-500">
                                        Courier
                                    </p>

                                    <p className="font-semibold mt-1">
                                        {order.courier_name ||
                                            "Not assigned yet"}
                                    </p>

                                </div>

                                <div className="bg-pink-50 rounded-2xl p-4">

                                    <p className="text-xs text-gray-500">
                                        AWB Number
                                    </p>

                                    <p className="font-semibold mt-1 break-all">
                                        {order.awb_number ||
                                            "Not assigned yet"}
                                    </p>

                                </div>

                                <div className="bg-pink-50 rounded-2xl p-4">

                                    <p className="text-xs text-gray-500">
                                        Shipment ID
                                    </p>

                                    <p className="font-semibold mt-1">
                                        {order.shipment_id ||
                                            "Not available"}
                                    </p>

                                </div>

                            </div>

                            {/* Tracking history */}

                            <div className="mt-8">

                                <h3 className="text-xl font-bold text-pink-700 mb-4">
                                    Tracking History
                                </h3>

                                {trackingEvents.length ===
                                0 ? (
                                    <div className="bg-gray-50 rounded-2xl p-5 text-sm text-gray-500">
                                        Tracking updates will
                                        appear here once your
                                        shipment starts moving.
                                    </div>
                                ) : (
                                    <div className="space-y-4">

                                        {trackingEvents.map(
                                            (
                                                event
                                            ) => (
                                                <div
                                                    key={
                                                        event.id
                                                    }
                                                    className="border border-gray-100 rounded-2xl p-4"
                                                >

                                                    <div className="flex flex-col md:flex-row md:justify-between gap-2">

                                                        <div>

                                                            <p className="font-bold text-gray-800">
                                                                {event.activity ||
                                                                    event.current_status ||
                                                                    event.shipment_status ||
                                                                    "Shipment Update"}
                                                            </p>

                                                            {event.location && (
                                                                <p className="text-sm text-gray-500 mt-1">
                                                                    📍{" "}
                                                                    {
                                                                        event.location
                                                                    }
                                                                </p>
                                                            )}

                                                        </div>

                                                        <p className="text-xs text-gray-400">
                                                            {formatDate(
                                                                event.event_timestamp
                                                            )}
                                                        </p>

                                                    </div>

                                                </div>
                                            )
                                        )}

                                    </div>
                                )}

                            </div>

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