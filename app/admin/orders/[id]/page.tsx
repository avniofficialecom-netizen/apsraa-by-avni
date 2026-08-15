"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AdminNavbar from "../../../../components/AdminNavbar";
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
    archived?: boolean;
    delivered_at?: string | null;
};

type OrderItem = {
    id: number;
    order_id: number;
    product_id?: number;
    title: string;
    quantity: number;
    price: string;
};

type StatusHistory = {
    id: number;
    order_id: number;
    status: string;
    changed_at: string;
};

const allowedStatuses = [
    "Pending",
    "Confirmed",
    "Packed",
    "Shipped",
    "Delivered",
    "Cancelled",
];

function formatIndiaDate(date?: string | null) {
    if (!date) {
        return "Date unavailable";
    }

    try {
        return new Intl.DateTimeFormat("en-IN", {
            timeZone: "Asia/Kolkata",
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        }).format(new Date(date));
    } catch {
        return "Date unavailable";
    }
}

function getStatusStyle(status: string) {
    switch (status) {
        case "Delivered":
            return "bg-green-100 text-green-700";

        case "Cancelled":
            return "bg-red-100 text-red-700";

        case "Shipped":
            return "bg-blue-100 text-blue-700";

        case "Packed":
            return "bg-purple-100 text-purple-700";

        case "Confirmed":
            return "bg-yellow-100 text-yellow-700";

        default:
            return "bg-pink-100 text-pink-700";
    }
}

function getStatusIcon(status: string) {
    switch (status) {
        case "Pending":
            return "🕐";

        case "Confirmed":
            return "✅";

        case "Packed":
            return "📦";

        case "Shipped":
            return "🚚";

        case "Delivered":
            return "🎉";

        case "Cancelled":
            return "❌";

        default:
            return "🔵";
    }
}

export default function AdminOrderDetails() {
    const params = useParams();
    const router = useRouter();

    const id = Array.isArray(params?.id)
        ? params.id[0]
        : params?.id;

    const [order, setOrder] =
        useState<Order | null>(null);

    const [items, setItems] =
        useState<OrderItem[]>([]);

    const [history, setHistory] =
        useState<StatusHistory[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [historyLoading, setHistoryLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [status, setStatus] =
        useState("");

    const [updatingStatus, setUpdatingStatus] =
        useState(false);

    const [archiving, setArchiving] =
        useState(false);

    // ==========================================
    // LOAD ORDER
    // ==========================================

    async function loadOrder() {
        if (!id) {
            setError("Invalid Order ID.");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError("");

            const response = await fetch(
                `/api/admin/orders/${id}`,
                {
                    cache: "no-store",
                }
            );

            const result = await response.json();

            if (
                !response.ok ||
                !result.success
            ) {
                setError(
                    result.message ||
                    "Unable to load order."
                );

                return;
            }

            setOrder(result.order);
            setItems(result.items || []);
            setStatus(result.order.status || "Pending");
        } catch (error) {
            console.error(
                "Admin Order Load Error:",
                error
            );

            setError(
                "Unable to load order."
            );
        } finally {
            setLoading(false);
        }
    }

    // ==========================================
    // LOAD STATUS HISTORY
    // ==========================================

    async function loadHistory() {
        if (!id) {
            return;
        }

        try {
            setHistoryLoading(true);

            const response = await fetch(
                `/api/admin/orders/${id}/history`,
                {
                    cache: "no-store",
                }
            );

            const result = await response.json();

            if (
                !response.ok ||
                !result.success
            ) {
                console.error(
                    "History Load Error:",
                    result.message
                );

                setHistory([]);
                return;
            }

            // API returns oldest first.
            // We display newest first.
            const newestFirst = [
                ...(result.history || []),
            ].reverse();

            setHistory(newestFirst);
        } catch (error) {
            console.error(
                "Status History Load Error:",
                error
            );

            setHistory([]);
        } finally {
            setHistoryLoading(false);
        }
    }

    // ==========================================
    // INITIAL LOAD
    // ==========================================

    useEffect(() => {
        loadOrder();
        loadHistory();
    }, [id]);

    // ==========================================
    // UPDATE STATUS
    // ==========================================

    async function updateStatus(
        newStatus: string
    ) {
        if (!order) {
            return;
        }

        if (newStatus === order.status) {
            return;
        }

        const confirmed = window.confirm(
            `Change Order #${order.id} status from "${order.status}" to "${newStatus}"?`
        );

        if (!confirmed) {
            setStatus(order.status);
            return;
        }

        try {
            setUpdatingStatus(true);

            const response = await fetch(
                "/api/update-order-status",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        id: order.id,
                        status: newStatus,
                    }),
                }
            );

            const result = await response.json();

            if (
                !response.ok ||
                !result.success
            ) {
                alert(
                    result.message ||
                    "Unable to update order status."
                );

                setStatus(order.status);
                return;
            }

            setOrder(result.order);
            setStatus(result.order.status);

            // Reload history so the new status
            // immediately appears.
            await loadHistory();
        } catch (error) {
            console.error(
                "Status Update Error:",
                error
            );

            alert(
                "Unable to update order status."
            );

            setStatus(order.status);
        } finally {
            setUpdatingStatus(false);
        }
    }

    // ==========================================
    // ARCHIVE / RESTORE
    // ==========================================

    async function toggleArchive() {
        if (!order) {
            return;
        }

        const nextArchived =
            !order.archived;

        const action =
            nextArchived
                ? "archive"
                : "restore";

        const confirmed =
            window.confirm(
                nextArchived
                    ? `Archive Order #${order.id}? You can restore it later from Archived Orders.`
                    : `Restore Order #${order.id}?`
            );

        if (!confirmed) {
            return;
        }

        try {
            setArchiving(true);

            const response = await fetch(
                "/api/admin/orders/archive",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        id: order.id,
                        archived:
                        nextArchived,
                    }),
                }
            );

            const result =
                await response.json();

            if (
                !response.ok ||
                !result.success
            ) {
                alert(
                    result.message ||
                    `Unable to ${action} order.`
                );

                return;
            }

            setOrder((current) =>
                current
                    ? {
                        ...current,
                        archived:
                        nextArchived,
                    }
                    : current
            );

            alert(
                nextArchived
                    ? "Order archived successfully."
                    : "Order restored successfully."
            );
        } catch (error) {
            console.error(
                "Archive/Restore Error:",
                error
            );

            alert(
                `Unable to ${action} order.`
            );
        } finally {
            setArchiving(false);
        }
    }

    // ==========================================
    // LOADING
    // ==========================================

    if (loading) {
        return (
            <>
                <AdminNavbar />

                <main className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center px-6">
                    <div className="text-center">
                        <div className="text-5xl mb-4">
                            📦
                        </div>

                        <p className="text-xl font-semibold text-gray-700">
                            Loading order...
                        </p>
                    </div>
                </main>

                <Footer />
            </>
        );
    }

    // ==========================================
    // ERROR
    // ==========================================

    if (error || !order) {
        return (
            <>
                <AdminNavbar />

                <main className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center px-6">
                    <div className="bg-white rounded-3xl shadow-xl p-8 text-center max-w-xl w-full">
                        <div className="text-5xl mb-4">
                            ⚠️
                        </div>

                        <h1 className="text-2xl font-bold text-red-600">
                            Unable to Load Order
                        </h1>

                        <p className="text-gray-600 mt-3">
                            {error ||
                                "Order not found."}
                        </p>

                        <Link
                            href="/admin/orders"
                            className="inline-block mt-6 bg-pink-600 text-white px-6 py-3 rounded-full font-semibold"
                        >
                            ← Back to Orders
                        </Link>
                    </div>
                </main>

                <Footer />
            </>
        );
    }

    return (
        <>
            <AdminNavbar />

            <main className="min-h-screen bg-gradient-to-b from-pink-50 to-white py-10 px-4 md:px-8">
                <div className="max-w-6xl mx-auto">

                    {/* ==========================================
                        TOP NAVIGATION
                    ========================================== */}

                    <div className="mb-6">
                        <Link
                            href="/admin/orders"
                            className="text-pink-600 font-semibold hover:underline"
                        >
                            ← Back to Orders
                        </Link>
                    </div>

                    {/* ==========================================
                        HEADER
                    ========================================== */}

                    <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8">

                        <div className="bg-pink-600 text-white p-6 md:p-8">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

                                <div>
                                    <p className="text-pink-100 text-sm uppercase tracking-wider">
                                        Admin Order
                                    </p>

                                    <h1 className="text-4xl font-bold mt-1">
                                        #{order.id}
                                    </h1>

                                    <p className="text-pink-100 mt-2">
                                        Created:{" "}
                                        {formatIndiaDate(
                                            order.created_at
                                        )}
                                    </p>
                                </div>

                                <span
                                    className={`inline-flex items-center justify-center px-5 py-3 rounded-full font-bold ${getStatusStyle(
                                        order.status
                                    )}`}
                                >
                                    {getStatusIcon(
                                        order.status
                                    )}{" "}
                                    <span className="ml-2">
                                        {order.status}
                                    </span>
                                </span>

                            </div>
                        </div>

                        {/* ==========================================
                            QUICK ACTIONS
                        ========================================== */}

                        <div className="p-6 flex flex-col md:flex-row gap-4">

                            <Link
                                href={`/admin/orders/${order.id}/invoice`}
                                className="flex-1 text-center bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition"
                            >
                                🧾 Invoice
                            </Link>

                            <Link
                                href={`/admin/orders/${order.id}/label`}
                                className="flex-1 text-center bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition"
                            >
                                🏷️ Shipping Label
                            </Link>

                            <button
                                type="button"
                                onClick={
                                    toggleArchive
                                }
                                disabled={
                                    archiving
                                }
                                className={`flex-1 py-3 rounded-xl font-bold text-white transition disabled:opacity-50 ${
                                    order.archived
                                        ? "bg-purple-600 hover:bg-purple-700"
                                        : "bg-gray-800 hover:bg-gray-900"
                                }`}
                            >
                                {archiving
                                    ? "Please wait..."
                                    : order.archived
                                        ? "♻️ Restore Order"
                                        : "📁 Archive Order"}
                            </button>

                        </div>
                    </div>

                    {/* ==========================================
                        CUSTOMER + PAYMENT
                    ========================================== */}

                    <div className="grid lg:grid-cols-2 gap-8 mb-8">

                        {/* CUSTOMER */}

                        <div className="bg-white rounded-3xl shadow-lg p-6">
                            <h2 className="text-2xl font-bold text-pink-700 mb-6">
                                👤 Customer Details
                            </h2>

                            <div className="space-y-4">

                                <div>
                                    <p className="text-sm text-gray-500">
                                        Name
                                    </p>

                                    <p className="font-semibold text-gray-900">
                                        {order.customer_name}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500">
                                        Phone
                                    </p>

                                    <p className="font-semibold text-gray-900">
                                        {order.phone}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500">
                                        Email
                                    </p>

                                    <p className="font-semibold text-gray-900 break-all">
                                        {order.email ||
                                            "-"}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500">
                                        Delivery Address
                                    </p>

                                    <p className="font-semibold text-gray-900">
                                        {order.address}
                                    </p>
                                </div>

                            </div>
                        </div>

                        {/* PAYMENT */}

                        <div className="bg-white rounded-3xl shadow-lg p-6">
                            <h2 className="text-2xl font-bold text-green-700 mb-6">
                                💳 Payment Details
                            </h2>

                            <div className="space-y-5">

                                <div className="flex justify-between items-center gap-4">
                                    <span className="text-gray-500">
                                        Amount
                                    </span>

                                    <span className="text-2xl font-bold text-green-600">
                                        ₹{order.total}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center gap-4">
                                    <span className="text-gray-500">
                                        Payment
                                    </span>

                                    <span
                                        className={`px-4 py-2 rounded-full font-bold ${
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

                                {order.delivered_at && (
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Delivered At
                                        </p>

                                        <p className="font-semibold text-gray-900">
                                            {formatIndiaDate(
                                                order.delivered_at
                                            )}
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <p className="text-sm text-gray-500">
                                        Archive Status
                                    </p>

                                    <p className="font-semibold">
                                        {order.archived
                                            ? "📁 Archived"
                                            : "🟢 Active"}
                                    </p>
                                </div>

                            </div>
                        </div>

                    </div>

                    {/* ==========================================
                        UPDATE STATUS
                    ========================================== */}

                    <div className="bg-white rounded-3xl shadow-lg p-6 mb-8">

                        <h2 className="text-2xl font-bold text-pink-700 mb-5">
                            🔄 Update Order Status
                        </h2>

                        <select
                            value={status}
                            onChange={(e) =>
                                updateStatus(
                                    e.target.value
                                )
                            }
                            disabled={
                                updatingStatus
                            }
                            className="w-full border-2 border-gray-200 rounded-xl p-4 text-lg font-semibold outline-none focus:border-pink-500 disabled:opacity-50"
                        >
                            {allowedStatuses.map(
                                (item) => (
                                    <option
                                        key={item}
                                        value={item}
                                    >
                                        {getStatusIcon(
                                            item
                                        )}{" "}
                                        {item}
                                    </option>
                                )
                            )}
                        </select>

                        {updatingStatus && (
                            <p className="text-gray-500 mt-3">
                                Updating status...
                            </p>
                        )}

                    </div>

                    {/* ==========================================
                        STATUS HISTORY
                    ========================================== */}

                    <div className="bg-white rounded-3xl shadow-lg p-6 mb-8">

                        <div className="flex items-center justify-between gap-4 mb-6">

                            <div>
                                <h2 className="text-2xl font-bold text-pink-700">
                                    📋 Status History
                                </h2>

                                <p className="text-gray-500 mt-1">
                                    Latest status changes first
                                </p>
                            </div>

                            <span className="bg-pink-100 text-pink-700 px-4 py-2 rounded-full font-bold">
                                {history.length}
                            </span>

                        </div>

                        {historyLoading ? (
                            <div className="text-center py-8 text-gray-500">
                                Loading history...
                            </div>
                        ) : history.length === 0 ? (
                            <div className="bg-gray-50 rounded-2xl p-6 text-center text-gray-500">
                                No status history recorded yet.
                            </div>
                        ) : (
                            <div className="relative">

                                <div className="absolute left-5 top-4 bottom-4 w-0.5 bg-pink-100" />

                                <div className="space-y-6">

                                    {history.map(
                                        (
                                            entry,
                                            index
                                        ) => (
                                            <div
                                                key={
                                                    entry.id
                                                }
                                                className="relative flex gap-4"
                                            >

                                                <div className="relative z-10 w-10 h-10 flex-shrink-0 rounded-full bg-pink-100 flex items-center justify-center text-lg">
                                                    {getStatusIcon(
                                                        entry.status
                                                    )}
                                                </div>

                                                <div className="flex-1 bg-gray-50 rounded-2xl p-4">

                                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">

                                                        <div>
                                                            <span
                                                                className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${getStatusStyle(
                                                                    entry.status
                                                                )}`}
                                                            >
                                                                {
                                                                    entry.status
                                                                }
                                                            </span>

                                                            {index ===
                                                                0 && (
                                                                    <span className="ml-2 text-xs font-semibold text-pink-600">
                                                                    CURRENT
                                                                </span>
                                                                )}
                                                        </div>

                                                        <p className="text-sm text-gray-500">
                                                            {formatIndiaDate(
                                                                entry.changed_at
                                                            )}
                                                        </p>

                                                    </div>

                                                </div>

                                            </div>
                                        )
                                    )}

                                </div>

                            </div>
                        )}

                    </div>

                    {/* ==========================================
                        PRODUCTS
                    ========================================== */}

                    <div className="bg-white rounded-3xl shadow-lg p-6 mb-8">

                        <h2 className="text-2xl font-bold text-pink-700 mb-6">
                            🛍️ Products Ordered
                        </h2>

                        {items.length === 0 ? (
                            <div className="bg-gray-50 rounded-2xl p-6 text-gray-500">
                                No products found for this order.
                            </div>
                        ) : (
                            <div className="space-y-4">

                                {items.map(
                                    (item) => (
                                        <div
                                            key={
                                                item.id
                                            }
                                            className="border rounded-2xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                                        >

                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900">
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

                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-pink-700">
                                                    ₹
                                                    {
                                                        item.price
                                                    }
                                                </p>
                                            </div>

                                        </div>
                                    )
                                )}

                            </div>
                        )}

                        <div className="border-t mt-6 pt-6 flex justify-between items-center">

                            <span className="text-xl font-bold">
                                Total
                            </span>

                            <span className="text-3xl font-bold text-pink-700">
                                ₹{order.total}
                            </span>

                        </div>

                    </div>

                </div>
            </main>

            <Footer />
        </>
    );
}