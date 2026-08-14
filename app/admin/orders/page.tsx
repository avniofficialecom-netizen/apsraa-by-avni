"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AdminNavbar from "../../../components/AdminNavbar";
import Footer from "../../../components/Footer";

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

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadOrders();
    }, []);

    // ==================================================
    // LOAD ORDERS
    // ==================================================

    async function loadOrders() {
        try {
            setLoading(true);

            const response = await fetch(
                "/api/admin/orders",
                {
                    method: "GET",
                    credentials: "include",
                    cache: "no-store",
                }
            );

            const result = await response.json();

            if (
                response.status === 401 ||
                response.status === 403
            ) {
                window.location.href =
                    "/admin/login";
                return;
            }

            if (
                !response.ok ||
                !result.success
            ) {
                alert(
                    result.message ||
                    "Unable to load orders."
                );
                return;
            }

            setOrders(
                Array.isArray(result.orders)
                    ? result.orders
                    : []
            );
        } catch (error) {
            console.error(
                "Load Orders Error:",
                error
            );

            alert(
                "Something went wrong while loading orders."
            );
        } finally {
            setLoading(false);
        }
    }

    // ==================================================
    // UPDATE ORDER STATUS
    // ==================================================

    async function updateStatus(
        id: number,
        status: string
    ) {
        try {
            const response = await fetch(
                "/api/update-order-status",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        id,
                        status,
                    }),
                }
            );

            const result =
                await response.json();

            if (!response.ok || !result.success) {
                alert(
                    result.message ||
                    "Unable to update order status."
                );
                return;
            }

            alert(
                "✅ Order Status Updated Successfully"
            );

            await loadOrders();
        } catch (error) {
            console.error(
                "Update Status Error:",
                error
            );

            alert(
                "Something went wrong while updating the order."
            );
        }
    }

    // ==================================================
    // DATE
    // ==================================================

    function formatDate(
        date: string
    ) {
        if (!date) return "-";

        return new Date(
            date
        ).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    }

    // ==================================================
    // STATUS COLOR
    // ==================================================

    function getStatusStyle(
        status: string
    ) {
        switch (
            status?.toLowerCase()
            ) {
            case "confirmed":
                return "bg-blue-100 text-blue-700";

            case "packed":
                return "bg-purple-100 text-purple-700";

            case "shipped":
                return "bg-indigo-100 text-indigo-700";

            case "delivered":
                return "bg-green-100 text-green-700";

            case "cancelled":
                return "bg-red-100 text-red-700";

            default:
                return "bg-yellow-100 text-yellow-700";
        }
    }

    // ==================================================
    // PAGE
    // ==================================================

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-50 overflow-x-hidden">

            <AdminNavbar />

            <main>

                {/* ======================================
                    HEADER
                ====================================== */}

                <section className="px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-6">

                    <div className="max-w-7xl mx-auto">

                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                            <div>

                                <p className="text-sm font-semibold text-pink-600 uppercase tracking-wide">
                                    APSRAA ADMIN
                                </p>

                                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-pink-700 mt-1">
                                    Customer Orders
                                </h1>

                                <p className="text-sm sm:text-base text-gray-500 mt-2">
                                    Manage all customer orders from one place.
                                </p>

                            </div>

                            <div className="flex items-center justify-between sm:block bg-pink-600 text-white px-5 py-3 rounded-xl sm:rounded-2xl shadow-md">

                                <span className="font-semibold">
                                    Total Orders
                                </span>

                                <span className="ml-2 font-bold">
                                    {orders.length}
                                </span>

                            </div>

                        </div>

                    </div>

                </section>

                {/* ======================================
                    CONTENT
                ====================================== */}

                <section className="px-4 sm:px-6 lg:px-8 pb-12">

                    <div className="max-w-7xl mx-auto">

                        {/* LOADING */}

                        {loading ? (

                            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-md p-12 sm:p-16 text-center">

                                <div className="text-5xl mb-4">
                                    📦
                                </div>

                                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                                    Loading Orders...
                                </h2>

                                <p className="text-gray-500 mt-2">
                                    Please wait.
                                </p>

                            </div>

                        ) : orders.length ===
                        0 ? (

                            /* NO ORDERS */

                            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-md p-10 sm:p-16 text-center">

                                <div className="text-6xl mb-5">
                                    📦
                                </div>

                                <h2 className="text-2xl sm:text-3xl font-bold text-gray-700">
                                    No Orders Found
                                </h2>

                                <p className="text-gray-500 mt-3">
                                    Customer orders will appear here.
                                </p>

                            </div>

                        ) : (

                            <>
                                {/* ==================================
                                    MOBILE ORDER CARDS
                                ================================== */}

                                <div className="block lg:hidden space-y-4">

                                    {orders.map(
                                        (order) => (

                                            <article
                                                key={
                                                    order.id
                                                }
                                                className="bg-white rounded-2xl shadow-md overflow-hidden border border-pink-100"
                                            >

                                                {/* Card Header */}

                                                <div className="bg-gradient-to-r from-pink-600 to-pink-700 text-white px-4 py-4">

                                                    <div className="flex items-center justify-between gap-3">

                                                        <div>

                                                            <p className="text-xs uppercase tracking-wide opacity-80">
                                                                Order
                                                            </p>

                                                            <p className="text-xl font-bold">
                                                                #
                                                                {
                                                                    order.id
                                                                }
                                                            </p>

                                                        </div>

                                                        <span
                                                            className={`px-3 py-1.5 rounded-full text-xs font-bold ${getStatusStyle(
                                                                order.status
                                                            )}`}
                                                        >
                                                            {
                                                                order.status ||
                                                                "Pending"
                                                            }
                                                        </span>

                                                    </div>

                                                </div>

                                                {/* Customer */}

                                                <div className="p-4 space-y-4">

                                                    <div>

                                                        <p className="text-xs text-gray-400 uppercase tracking-wide">
                                                            Customer
                                                        </p>

                                                        <p className="text-lg font-bold text-gray-900 mt-1">
                                                            {
                                                                order.customer_name
                                                            }
                                                        </p>

                                                    </div>

                                                    {/* Phone */}

                                                    <div className="grid grid-cols-2 gap-4">

                                                        <div>

                                                            <p className="text-xs text-gray-400 uppercase tracking-wide">
                                                                Phone
                                                            </p>

                                                            <a
                                                                href={`tel:${order.phone}`}
                                                                className="text-sm font-semibold text-pink-600 mt-1 block"
                                                            >
                                                                📞{" "}
                                                                {
                                                                    order.phone
                                                                }
                                                            </a>

                                                        </div>

                                                        <div>

                                                            <p className="text-xs text-gray-400 uppercase tracking-wide">
                                                                Date
                                                            </p>

                                                            <p className="text-sm font-semibold text-gray-700 mt-1">
                                                                {formatDate(
                                                                    order.created_at
                                                                )}
                                                            </p>

                                                        </div>

                                                    </div>

                                                    {/* Email */}

                                                    <div>

                                                        <p className="text-xs text-gray-400 uppercase tracking-wide">
                                                            Email
                                                        </p>

                                                        <p className="text-sm text-gray-700 mt-1 break-all">
                                                            {
                                                                order.email ||
                                                                "-"
                                                            }
                                                        </p>

                                                    </div>

                                                    {/* Address */}

                                                    <div>

                                                        <p className="text-xs text-gray-400 uppercase tracking-wide">
                                                            Delivery Address
                                                        </p>

                                                        <p className="text-sm text-gray-700 mt-1 leading-relaxed">
                                                            {
                                                                order.address
                                                            }
                                                        </p>

                                                    </div>

                                                    {/* Amount + Payment */}

                                                    <div className="grid grid-cols-2 gap-3">

                                                        <div className="bg-green-50 rounded-xl p-3">

                                                            <p className="text-xs text-gray-500">
                                                                Amount
                                                            </p>

                                                            <p className="text-xl font-bold text-green-600 mt-1">
                                                                ₹
                                                                {
                                                                    order.total
                                                                }
                                                            </p>

                                                        </div>

                                                        <div className="bg-gray-50 rounded-xl p-3">

                                                            <p className="text-xs text-gray-500">
                                                                Payment
                                                            </p>

                                                            <p
                                                                className={`text-sm font-bold mt-2 ${
                                                                    order.payment_status ===
                                                                    "Paid"
                                                                        ? "text-green-600"
                                                                        : "text-yellow-600"
                                                                }`}
                                                            >
                                                                {order.payment_status ===
                                                                "Paid"
                                                                    ? "✅ Paid"
                                                                    : `🟡 ${
                                                                        order.payment_status ||
                                                                        "Pending"
                                                                    }`}
                                                            </p>

                                                        </div>

                                                    </div>

                                                    {/* Status */}

                                                    <div>

                                                        <label className="text-xs text-gray-400 uppercase tracking-wide">
                                                            Update Status
                                                        </label>

                                                        <select
                                                            value={
                                                                order.status ||
                                                                "Pending"
                                                            }
                                                            onChange={(
                                                                e
                                                            ) =>
                                                                updateStatus(
                                                                    order.id,
                                                                    e
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                            className="mt-2 w-full border-2 border-gray-200 rounded-xl px-3 py-3 bg-white text-gray-800 font-semibold focus:border-pink-500 focus:outline-none"
                                                        >

                                                            <option value="Pending">
                                                                🟡 Pending
                                                            </option>

                                                            <option value="Confirmed">
                                                                🔵 Confirmed
                                                            </option>

                                                            <option value="Packed">
                                                                📦 Packed
                                                            </option>

                                                            <option value="Shipped">
                                                                🚚 Shipped
                                                            </option>

                                                            <option value="Delivered">
                                                                ✅ Delivered
                                                            </option>

                                                            <option value="Cancelled">
                                                                ❌ Cancelled
                                                            </option>

                                                        </select>

                                                    </div>

                                                    {/* Actions */}

                                                    <div className="grid grid-cols-2 gap-3 pt-1">

                                                        <Link
                                                            href={`/admin/orders/${order.id}`}
                                                            className="bg-pink-600 text-white text-center px-3 py-3 rounded-xl font-semibold hover:bg-pink-700 active:scale-[0.98] transition"
                                                        >
                                                            👁 View
                                                        </Link>

                                                        <Link
                                                            href={`/admin/orders/${order.id}/invoice`}
                                                            target="_blank"
                                                            className="bg-green-600 text-white text-center px-3 py-3 rounded-xl font-semibold hover:bg-green-700 active:scale-[0.98] transition"
                                                        >
                                                            🖨 Invoice
                                                        </Link>

                                                    </div>

                                                </div>

                                            </article>

                                        )
                                    )}

                                </div>

                                {/* ==================================
                                    DESKTOP TABLE
                                ================================== */}

                                <div className="hidden lg:block overflow-x-auto bg-white rounded-3xl shadow-xl">

                                    <table className="min-w-full">

                                        <thead className="bg-gradient-to-r from-pink-600 to-pink-700 text-white">

                                        <tr>

                                            <th className="p-5 text-left">
                                                Order
                                            </th>

                                            <th className="p-5 text-left">
                                                Customer
                                            </th>

                                            <th className="p-5 text-left">
                                                Phone
                                            </th>

                                            <th className="p-5 text-left">
                                                Email
                                            </th>

                                            <th className="p-5 text-left">
                                                Address
                                            </th>

                                            <th className="p-5 text-left">
                                                Amount
                                            </th>

                                            <th className="p-5 text-left">
                                                Payment
                                            </th>

                                            <th className="p-5 text-left">
                                                Status
                                            </th>

                                            <th className="p-5 text-left">
                                                Date
                                            </th>

                                            <th className="p-5 text-center">
                                                Action
                                            </th>

                                        </tr>

                                        </thead>

                                        <tbody>

                                        {orders.map(
                                            (order) => (

                                                <tr
                                                    key={
                                                        order.id
                                                    }
                                                    className="border-b hover:bg-pink-50 transition"
                                                >

                                                    <td className="p-5 font-bold text-pink-700">
                                                        #
                                                        {
                                                            order.id
                                                        }
                                                    </td>

                                                    <td className="p-5 font-semibold">
                                                        {
                                                            order.customer_name
                                                        }
                                                    </td>

                                                    <td className="p-5">
                                                        {
                                                            order.phone
                                                        }
                                                    </td>

                                                    <td className="p-5">
                                                        {
                                                            order.email ||
                                                            "-"
                                                        }
                                                    </td>

                                                    <td className="p-5 max-w-xs">
                                                        <div className="truncate">
                                                            {
                                                                order.address
                                                            }
                                                        </div>
                                                    </td>

                                                    <td className="p-5 font-bold text-green-600">
                                                        ₹
                                                        {
                                                            order.total
                                                        }
                                                    </td>

                                                    <td className="p-5">

                                                        {order.payment_status ===
                                                        "Paid" ? (

                                                            <span className="inline-block bg-green-100 text-green-700 px-4 py-2 rounded-full font-bold">
                                                                    ✅ Paid
                                                                </span>

                                                        ) : (

                                                            <span className="inline-block bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full font-bold">
                                                                    🟡{" "}
                                                                {
                                                                    order.payment_status ||
                                                                    "Pending"
                                                                }
                                                                </span>

                                                        )}

                                                    </td>

                                                    <td className="p-5">

                                                        <select
                                                            value={
                                                                order.status ||
                                                                "Pending"
                                                            }
                                                            onChange={(
                                                                e
                                                            ) =>
                                                                updateStatus(
                                                                    order.id,
                                                                    e
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                            className="border rounded-lg px-3 py-2"
                                                        >

                                                            <option value="Pending">
                                                                🟡 Pending
                                                            </option>

                                                            <option value="Confirmed">
                                                                🔵 Confirmed
                                                            </option>

                                                            <option value="Packed">
                                                                📦 Packed
                                                            </option>

                                                            <option value="Shipped">
                                                                🚚 Shipped
                                                            </option>

                                                            <option value="Delivered">
                                                                ✅ Delivered
                                                            </option>

                                                            <option value="Cancelled">
                                                                ❌ Cancelled
                                                            </option>

                                                        </select>

                                                    </td>

                                                    <td className="p-5 text-gray-500">
                                                        {formatDate(
                                                            order.created_at
                                                        )}
                                                    </td>

                                                    <td className="p-5">

                                                        <div className="flex flex-col gap-2">

                                                            <Link
                                                                href={`/admin/orders/${order.id}`}
                                                                className="bg-pink-600 text-white text-center px-4 py-2 rounded-xl hover:bg-pink-700 transition"
                                                            >
                                                                👁 View
                                                            </Link>

                                                            <Link
                                                                href={`/admin/orders/${order.id}/invoice`}
                                                                target="_blank"
                                                                className="bg-green-600 text-white text-center px-4 py-2 rounded-xl hover:bg-green-700 transition"
                                                            >
                                                                🖨 Invoice
                                                            </Link>

                                                        </div>

                                                    </td>

                                                </tr>

                                            )
                                        )}

                                        </tbody>

                                    </table>

                                </div>
                            </>
                        )}

                    </div>

                </section>

            </main>

            <Footer />

        </div>
    );
}