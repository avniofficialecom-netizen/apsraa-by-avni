"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
    archived?: boolean;
};

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [paymentFilter, setPaymentFilter] = useState("All");
    const [sortOrder, setSortOrder] = useState("newest");

    const [archivingId, setArchivingId] =
        useState<number | null>(null);

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
                window.location.href = "/admin/login";
                return;
            }

            if (!response.ok || !result.success) {
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

            if (
                !response.ok ||
                !result.success
            ) {
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
    // ARCHIVE ORDER
    // ==================================================

    async function archiveOrder(id: number) {
        const confirmed =
            window.confirm(
                `Archive Order #${id}? You can restore it later from Archived Orders.`
            );

        if (!confirmed) {
            return;
        }

        try {
            setArchivingId(id);

            const response = await fetch(
                "/api/admin/orders/archive",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        id,
                        archived: true,
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
                    "Unable to archive order."
                );
                return;
            }

            alert(
                `📁 Order #${id} archived successfully.`
            );

            await loadOrders();
        } catch (error) {
            console.error(
                "Archive Order Error:",
                error
            );

            alert(
                "Unable to archive order."
            );
        } finally {
            setArchivingId(null);
        }
    }

    // ==================================================
    // DATE
    // ==================================================

    function formatDate(date: string) {
        if (!date) return "-";

        return new Date(date).toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );
    }

    // ==================================================
    // STATUS COLOR
    // ==================================================

    function getStatusStyle(status: string) {
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
    // FILTER + SEARCH + SORT
    // ==================================================

    const filteredOrders = useMemo(() => {
        const searchText =
            search.trim().toLowerCase();

        const result = orders.filter(
            (order) => {
                const matchesSearch =
                    !searchText ||
                    String(order.id)
                        .toLowerCase()
                        .includes(searchText) ||
                    String(
                        order.customer_name || ""
                    )
                        .toLowerCase()
                        .includes(searchText) ||
                    String(order.phone || "")
                        .toLowerCase()
                        .includes(searchText) ||
                    String(order.email || "")
                        .toLowerCase()
                        .includes(searchText);

                const matchesStatus =
                    statusFilter === "All" ||
                    (order.status ||
                        "Pending") ===
                    statusFilter;

                const currentPayment =
                    order.payment_status ||
                    "Pending";

                const matchesPayment =
                    paymentFilter === "All" ||
                    currentPayment ===
                    paymentFilter;

                return (
                    matchesSearch &&
                    matchesStatus &&
                    matchesPayment
                );
            }
        );

        return [...result].sort(
            (a, b) => {
                const dateA =
                    new Date(
                        a.created_at
                    ).getTime();

                const dateB =
                    new Date(
                        b.created_at
                    ).getTime();

                return sortOrder === "newest"
                    ? dateB - dateA
                    : dateA - dateB;
            }
        );
    }, [
        orders,
        search,
        statusFilter,
        paymentFilter,
        sortOrder,
    ]);

    // ==================================================
    // CLEAR FILTERS
    // ==================================================

    function clearFilters() {
        setSearch("");
        setStatusFilter("All");
        setPaymentFilter("All");
        setSortOrder("newest");
    }

    const filtersActive =
        search.trim() !== "" ||
        statusFilter !== "All" ||
        paymentFilter !== "All" ||
        sortOrder !== "newest";

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

                        {/* ARCHIVED ORDERS LINK */}

                        <div className="mt-5 flex justify-start sm:justify-end">

                            <Link
                                href="/admin/orders/archived"
                                className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white px-5 py-3 rounded-xl font-bold shadow-md transition active:scale-[0.98]"
                            >
                                📁 Archived Orders
                            </Link>

                        </div>

                    </div>

                </section>

                {/* ======================================
                    SEARCH + FILTERS
                ====================================== */}

                {!loading && orders.length > 0 && (
                    <section className="px-4 sm:px-6 lg:px-8 pb-5">

                        <div className="max-w-7xl mx-auto">

                            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-md border border-pink-100 p-4 sm:p-5">

                                {/* SEARCH */}

                                <div>

                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                                        Search Orders
                                    </label>

                                    <div className="relative">

                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">
                                            🔎
                                        </span>

                                        <input
                                            type="text"
                                            value={search}
                                            onChange={(e) =>
                                                setSearch(
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Search by order ID, name, phone or email..."
                                            className="w-full border-2 border-gray-200 rounded-xl pl-11 pr-4 py-3.5 text-sm sm:text-base focus:outline-none focus:border-pink-500 transition"
                                        />

                                    </div>

                                </div>

                                {/* FILTERS */}

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">

                                    <div>

                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                                            Status
                                        </label>

                                        <select
                                            value={statusFilter}
                                            onChange={(e) =>
                                                setStatusFilter(
                                                    e.target.value
                                                )
                                            }
                                            className="w-full border-2 border-gray-200 rounded-xl px-3 py-3 bg-white text-gray-800 font-semibold text-sm focus:outline-none focus:border-pink-500"
                                        >

                                            <option value="All">
                                                All Statuses
                                            </option>

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

                                    <div>

                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                                            Payment
                                        </label>

                                        <select
                                            value={paymentFilter}
                                            onChange={(e) =>
                                                setPaymentFilter(
                                                    e.target.value
                                                )
                                            }
                                            className="w-full border-2 border-gray-200 rounded-xl px-3 py-3 bg-white text-gray-800 font-semibold text-sm focus:outline-none focus:border-pink-500"
                                        >

                                            <option value="All">
                                                All Payments
                                            </option>

                                            <option value="Paid">
                                                ✅ Paid
                                            </option>

                                            <option value="Pending">
                                                🟡 Pending
                                            </option>

                                        </select>

                                    </div>

                                    <div>

                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                                            Sort Orders
                                        </label>

                                        <select
                                            value={sortOrder}
                                            onChange={(e) =>
                                                setSortOrder(
                                                    e.target.value
                                                )
                                            }
                                            className="w-full border-2 border-gray-200 rounded-xl px-3 py-3 bg-white text-gray-800 font-semibold text-sm focus:outline-none focus:border-pink-500"
                                        >

                                            <option value="newest">
                                                Newest First
                                            </option>

                                            <option value="oldest">
                                                Oldest First
                                            </option>

                                        </select>

                                    </div>

                                </div>

                                {/* RESULT COUNT + CLEAR */}

                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 pt-4 border-t">

                                    <p className="text-sm text-gray-600">

                                        Showing{" "}

                                        <span className="font-bold text-gray-900">
                                            {filteredOrders.length}
                                        </span>

                                        {" "}of{" "}

                                        <span className="font-bold text-gray-900">
                                            {orders.length}
                                        </span>

                                        {" "}orders

                                    </p>

                                    {filtersActive && (
                                        <button
                                            type="button"
                                            onClick={clearFilters}
                                            className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-xl font-semibold text-sm transition"
                                        >
                                            ✕ Clear Filters
                                        </button>
                                    )}

                                </div>

                            </div>

                        </div>

                    </section>
                )}

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

                        ) : filteredOrders.length === 0 ? (

                            /* NO RESULTS */

                            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-md p-10 sm:p-16 text-center">

                                <div className="text-6xl mb-5">
                                    🔎
                                </div>

                                <h2 className="text-2xl sm:text-3xl font-bold text-gray-700">
                                    No Orders Found
                                </h2>

                                <p className="text-gray-500 mt-3">
                                    No orders match your current search or filters.
                                </p>

                                {filtersActive && (
                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        className="mt-5 bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-xl font-semibold"
                                    >
                                        Clear Filters
                                    </button>
                                )}

                            </div>

                        ) : (

                            <>

                                {/* ==================================
                                    MOBILE ORDER CARDS
                                ================================== */}

                                <div className="block lg:hidden space-y-4">

                                    {filteredOrders.map(
                                        (order) => (

                                            <article
                                                key={order.id}
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
                                                                #{order.id}
                                                            </p>

                                                        </div>

                                                        <span
                                                            className={`px-3 py-1.5 rounded-full text-xs font-bold ${getStatusStyle(
                                                                order.status
                                                            )}`}
                                                        >
                                                            {order.status ||
                                                                "Pending"}
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
                                                            {order.customer_name}
                                                        </p>

                                                    </div>

                                                    {/* Phone + Date */}

                                                    <div className="grid grid-cols-2 gap-4">

                                                        <div>

                                                            <p className="text-xs text-gray-400 uppercase tracking-wide">
                                                                Phone
                                                            </p>

                                                            <a
                                                                href={`tel:${order.phone}`}
                                                                className="text-sm font-semibold text-pink-600 mt-1 block break-all"
                                                            >
                                                                📞 {order.phone}
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
                                                            {order.email ||
                                                                "-"}
                                                        </p>

                                                    </div>

                                                    {/* Address */}

                                                    <div>

                                                        <p className="text-xs text-gray-400 uppercase tracking-wide">
                                                            Delivery Address
                                                        </p>

                                                        <p className="text-sm text-gray-700 mt-1 leading-relaxed">
                                                            {order.address}
                                                        </p>

                                                    </div>

                                                    {/* Amount + Payment */}

                                                    <div className="grid grid-cols-2 gap-3">

                                                        <div className="bg-green-50 rounded-xl p-3">

                                                            <p className="text-xs text-gray-500">
                                                                Amount
                                                            </p>

                                                            <p className="text-xl font-bold text-green-600 mt-1">
                                                                ₹{order.total}
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
                                                                    e.target
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

                                                    {/* ARCHIVE */}

                                                    <button
                                                        type="button"
                                                        disabled={archivingId === order.id}
                                                        onClick={() => archiveOrder(order.id)}
                                                        className="w-full bg-gray-800 hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-3 rounded-xl font-bold transition border-2 border-gray-800"
                                                    >
                                                        {archivingId === order.id
                                                            ? "⏳ Archiving..."
                                                            : "📁 Archive Order"}
                                                    </button>

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

                                        {filteredOrders.map(
                                            (order) => (

                                                <tr
                                                    key={order.id}
                                                    className="border-b hover:bg-pink-50 transition"
                                                >

                                                    <td className="p-5 font-bold text-pink-700">
                                                        #{order.id}
                                                    </td>

                                                    <td className="p-5 font-semibold">
                                                        {order.customer_name}
                                                    </td>

                                                    <td className="p-5">
                                                        {order.phone}
                                                    </td>

                                                    <td className="p-5">
                                                        {order.email ||
                                                            "-"}
                                                    </td>

                                                    <td className="p-5 max-w-xs">
                                                        <div className="truncate">
                                                            {order.address}
                                                        </div>
                                                    </td>

                                                    <td className="p-5 font-bold text-green-600">
                                                        ₹{order.total}
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
                                                                {order.payment_status ||
                                                                    "Pending"}
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
                                                                    e.target
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

                                                            <button
                                                                type="button"
                                                                disabled={
                                                                    archivingId ===
                                                                    order.id
                                                                }
                                                                onClick={() =>
                                                                    archiveOrder(
                                                                        order.id
                                                                    )
                                                                }
                                                                className="bg-gray-800 hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl transition"
                                                            >
                                                                {archivingId ===
                                                                order.id
                                                                    ? "Archiving..."
                                                                    : "📁 Archive"}
                                                            </button>

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
