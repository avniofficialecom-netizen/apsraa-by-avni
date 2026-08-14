"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
    payment_status?: string | null;
    created_at: string;
    archived?: boolean;
};

const PAGE_SIZE = 50;

export default function ArchivedOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [paymentFilter, setPaymentFilter] = useState("All");
    const [sortOrder, setSortOrder] = useState("newest");

    const [page, setPage] = useState(1);
    const [totalOrders, setTotalOrders] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    const [restoringId, setRestoringId] =
        useState<number | null>(null);

    // ==========================================
    // LOAD ARCHIVED ORDERS
    // ==========================================

    useEffect(() => {
        loadOrders();
    }, [
        page,
        search,
        statusFilter,
        paymentFilter,
        sortOrder,
    ]);

    async function loadOrders() {
        try {
            setLoading(true);

            const params = new URLSearchParams();

            params.set(
                "page",
                String(page)
            );

            params.set(
                "archived",
                "true"
            );

            if (search.trim()) {
                params.set(
                    "search",
                    search.trim()
                );
            }

            if (statusFilter !== "All") {
                params.set(
                    "status",
                    statusFilter
                );
            }

            if (paymentFilter !== "All") {
                params.set(
                    "payment",
                    paymentFilter
                );
            }

            params.set(
                "sort",
                sortOrder
            );

            const response = await fetch(
                `/api/admin/orders?${params.toString()}`,
                {
                    method: "GET",
                    credentials: "include",
                    cache: "no-store",
                }
            );

            const result =
                await response.json();

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
                    "Unable to load archived orders."
                );
                return;
            }

            setOrders(
                Array.isArray(result.orders)
                    ? result.orders
                    : []
            );

            setTotalOrders(
                Number(
                    result.totalOrders || 0
                )
            );

            setTotalPages(
                Math.max(
                    1,
                    Number(
                        result.totalPages || 1
                    )
                )
            );
        } catch (error) {
            console.error(
                "Archived Orders Error:",
                error
            );

            alert(
                "Unable to load archived orders."
            );
        } finally {
            setLoading(false);
        }
    }

    // ==========================================
    // RESTORE ORDER
    // ==========================================

    async function restoreOrder(
        id: number
    ) {
        const confirmed =
            window.confirm(
                `Restore Order #${id} to Active Orders?`
            );

        if (!confirmed) {
            return;
        }

        try {
            setRestoringId(id);

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
                        archived: false,
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
                    "Unable to restore order."
                );
                return;
            }

            alert(
                `✅ Order #${id} restored to Active Orders.`
            );

            await loadOrders();
        } catch (error) {
            console.error(
                "Restore Order Error:",
                error
            );

            alert(
                "Unable to restore order."
            );
        } finally {
            setRestoringId(null);
        }
    }

    // ==========================================
    // FORMAT DATE
    // ==========================================

    function formatDate(
        date: string
    ) {
        if (!date) return "-";

        return new Date(
            date
        ).toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );
    }

    // ==========================================
    // STATUS STYLE
    // ==========================================

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

    // ==========================================
    // CLEAR FILTERS
    // ==========================================

    function clearFilters() {
        setSearch("");
        setStatusFilter("All");
        setPaymentFilter("All");
        setSortOrder("newest");
        setPage(1);
    }

    const filtersActive =
        search.trim() !== "" ||
        statusFilter !== "All" ||
        paymentFilter !== "All" ||
        sortOrder !== "newest";

    // ==========================================
    // CURRENT RANGE
    // ==========================================

    const firstOrder =
        totalOrders === 0
            ? 0
            : (page - 1) *
            PAGE_SIZE +
            1;

    const lastOrder =
        Math.min(
            page * PAGE_SIZE,
            totalOrders
        );

    // ==========================================
    // PAGE NUMBERS
    // ==========================================

    const pageNumbers = useMemo(() => {
        const pages: number[] = [];

        const start = Math.max(
            1,
            page - 2
        );

        const end = Math.min(
            totalPages,
            page + 2
        );

        for (
            let i = start;
            i <= end;
            i++
        ) {
            pages.push(i);
        }

        return pages;
    }, [page, totalPages]);

    // ==========================================
    // PAGE
    // ==========================================

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50 overflow-x-hidden">

            <AdminNavbar />

            <main>

                {/* ==================================
                    HEADER
                ================================== */}

                <section className="px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-6">

                    <div className="max-w-7xl mx-auto">

                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                            <div>

                                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                                    APSRAA ADMIN
                                </p>

                                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 mt-1">
                                    Archived Orders
                                </h1>

                                <p className="text-sm sm:text-base text-gray-500 mt-2">
                                    Old orders are safely stored here.
                                    Nothing is deleted.
                                </p>

                            </div>

                            <div className="bg-gray-800 text-white px-5 py-3 rounded-xl sm:rounded-2xl shadow-md">

    <span className="font-semibold">
        Archived
        </span>

                                <span className="ml-2 font-bold">
        {totalOrders}
        </span>

                            </div>

                        </div>

                    </div>

                </section>

                {/* ==================================
                    NAVIGATION
                ================================== */}

                <section className="px-4 sm:px-6 lg:px-8 pb-5">

                    <div className="max-w-7xl mx-auto">

                        <div className="grid grid-cols-2 gap-3">

                            <Link
                                href="/admin/orders"
                                className="bg-pink-100 text-pink-700 hover:bg-pink-200 rounded-xl px-4 py-3 text-center font-bold transition"
                            >
                                🟢 Active Orders
                            </Link>

                            <div className="bg-gray-800 text-white rounded-xl px-4 py-3 text-center font-bold">
                                📁 Archived Orders
                            </div>

                        </div>

                    </div>

                </section>

                {/* ==================================
                    SEARCH + FILTERS
                ================================== */}

                <section className="px-4 sm:px-6 lg:px-8 pb-5">

                    <div className="max-w-7xl mx-auto">

                        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-md border border-gray-200 p-4 sm:p-5">

                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                                Search Archived Orders
                            </label>

                            <div className="relative">

    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">
                                    🔎
                                </span>

                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(
                                            e.target.value
                                        );
                                        setPage(1);
                                    }}
                                    placeholder="Search by order ID, name, phone or email..."
                                    className="w-full border-2 border-gray-200 rounded-xl pl-11 pr-4 py-3.5 text-sm sm:text-base focus:outline-none focus:border-gray-500 transition"
                                />

                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">

                                <div>

                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                                        Status
                                    </label>

                                    <select
                                        value={
                                            statusFilter
                                        }
                                        onChange={(e) => {
                                            setStatusFilter(
                                                e.target
                                                    .value
                                            );
                                            setPage(1);
                                        }}
                                        className="w-full border-2 border-gray-200 rounded-xl px-3 py-3 bg-white font-semibold text-sm focus:outline-none focus:border-gray-500"
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
                                        value={
                                            paymentFilter
                                        }
                                        onChange={(e) => {
                                            setPaymentFilter(
                                                e.target
                                                    .value
                                            );
                                            setPage(1);
                                        }}
                                        className="w-full border-2 border-gray-200 rounded-xl px-3 py-3 bg-white font-semibold text-sm focus:outline-none focus:border-gray-500"
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
                                        Sort
                                    </label>

                                    <select
                                        value={
                                            sortOrder
                                        }
                                        onChange={(e) => {
                                            setSortOrder(
                                                e.target
                                                    .value
                                            );
                                            setPage(1);
                                        }}
                                        className="w-full border-2 border-gray-200 rounded-xl px-3 py-3 bg-white font-semibold text-sm focus:outline-none focus:border-gray-500"
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

                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 pt-4 border-t">

                                <p className="text-sm text-gray-600">

                                    Showing{" "}

                                    <span className="font-bold text-gray-900">
        {firstOrder}
        </span>

                                    {"–"}

                                    <span className="font-bold text-gray-900">
        {lastOrder}
        </span>

                                    {" "}of{" "}

                                    <span className="font-bold text-gray-900">
        {totalOrders}
        </span>

                                    {" "}archived orders

                                </p>

                                {filtersActive && (
                                    <button
                                        type="button"
                                        onClick={
                                            clearFilters
                                        }
                                        className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-xl font-semibold text-sm"
                                    >
                                        ✕ Clear Filters
                                    </button>
                                )}

                            </div>

                        </div>

                    </div>

                </section>

                {/* ==================================
                    ORDERS
                ================================== */}

                <section className="px-4 sm:px-6 lg:px-8 pb-12">

                    <div className="max-w-7xl mx-auto">

                        {loading ? (

                            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-md p-12 text-center">

                                <div className="text-5xl mb-4">
                                    📁
                                </div>

                                <h2 className="text-xl font-bold text-gray-800">
                                    Loading Archived Orders...
                                </h2>

                            </div>

                        ) : orders.length === 0 ? (

                            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-md p-12 sm:p-16 text-center">

                                <div className="text-6xl mb-5">
                                    📭
                                </div>

                                <h2 className="text-2xl sm:text-3xl font-bold text-gray-700">
                                    No Archived Orders
                                </h2>

                                <p className="text-gray-500 mt-3">
                                    There are no orders matching your search or filters.
                                </p>

                                {filtersActive && (
                                    <button
                                        onClick={
                                            clearFilters
                                        }
                                        className="mt-5 bg-gray-800 hover:bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold"
                                    >
                                        Clear Filters
                                    </button>
                                )}

                            </div>

                        ) : (

                            <>

                                {/* ==================================
                                    MOBILE
                                ================================== */}

                                <div className="block lg:hidden space-y-4">

                                    {orders.map(
                                        (order) => (

                                            <article
                                                key={
                                                    order.id
                                                }
                                                className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden"
                                            >

                                                <div className="bg-gray-800 text-white px-4 py-4">

                                                    <div className="flex items-center justify-between gap-3">

                                                        <div>

                                                            <p className="text-xs uppercase tracking-wide opacity-70">
                                                                Archived Order
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

                                                    <div className="grid grid-cols-2 gap-4">

                                                        <div>

                                                            <p className="text-xs text-gray-400 uppercase tracking-wide">
                                                                Phone
                                                            </p>

                                                            <a
                                                                href={`tel:${order.phone}`}
                                                                className="text-sm font-semibold text-gray-700 mt-1 block break-all"
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

                                                    <div>

                                                        <p className="text-xs text-gray-400 uppercase tracking-wide">
                                                            Email
                                                        </p>

                                                        <p className="text-sm text-gray-700 mt-1 break-all">
                                                            {
                                                                order.email
                                                            }
                                                        </p>

                                                    </div>

                                                    <div>

                                                        <p className="text-xs text-gray-400 uppercase tracking-wide">
                                                            Amount
                                                        </p>

                                                        <p className="text-xl font-bold text-green-600 mt-1">
                                                            ₹
                                                            {
                                                                order.total
                                                            }
                                                        </p>

                                                    </div>

                                                    <div>

                                                        <p className="text-xs text-gray-400 uppercase tracking-wide">
                                                            Payment
                                                        </p>

                                                        <p className="text-sm font-bold mt-1">
                                                            {
                                                                order.payment_status ||
                                                                "Pending"
                                                            }
                                                        </p>

                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3">

                                                        <Link
                                                            href={`/admin/orders/${order.id}`}
                                                            className="bg-gray-800 text-white text-center px-3 py-3 rounded-xl font-semibold hover:bg-gray-900 transition"
                                                        >
                                                            👁 View
                                                        </Link>

                                                        <Link
                                                            href={`/admin/orders/${order.id}/invoice`}
                                                            target="_blank"
                                                            className="bg-green-600 text-white text-center px-3 py-3 rounded-xl font-semibold hover:bg-green-700 transition"
                                                        >
                                                            🖨 Invoice
                                                        </Link>

                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3">

                                                        <Link
                                                            href={`/admin/orders/${order.id}/label`}
                                                            target="_blank"
                                                            className="bg-blue-600 text-white text-center px-3 py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
                                                        >
                                                            📦 Label
                                                        </Link>

                                                        <button
                                                            type="button"
                                                            disabled={
                                                                restoringId ===
                                                                order.id
                                                            }
                                                            onClick={() =>
                                                                restoreOrder(
                                                                    order.id
                                                                )
                                                            }
                                                            className="bg-pink-600 disabled:opacity-50 text-white px-3 py-3 rounded-xl font-semibold hover:bg-pink-700 transition"
                                                        >
                                                            {restoringId ===
                                                            order.id
                                                                ? "Restoring..."
                                                                : "♻️ Restore"}
                                                        </button>

                                                    </div>

                                                </div>

                                            </article>

                                        )
                                    )}

                                </div>

                                {/* ==================================
                                    DESKTOP
                                ================================== */}

                                <div className="hidden lg:block overflow-x-auto bg-white rounded-3xl shadow-xl">

                                    <table className="min-w-full">

                                        <thead className="bg-gray-800 text-white">

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
                                                Amount
                                            </th>

                                            <th className="p-5 text-left">
                                                Status
                                            </th>

                                            <th className="p-5 text-left">
                                                Date
                                            </th>

                                            <th className="p-5 text-center">
                                                Actions
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
                                                    className="border-b hover:bg-gray-50"
                                                >

                                                    <td className="p-5 font-bold text-gray-800">
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

                                                    <td className="p-5 font-bold text-green-600">
                                                        ₹
                                                        {
                                                            order.total
                                                        }
                                                    </td>

                                                    <td className="p-5">

    <span
        className={`inline-block px-4 py-2 rounded-full font-bold text-sm ${getStatusStyle(
            order.status
        )}`}
    >
    {
        order.status
    }
    </span>

                                                    </td>

                                                    <td className="p-5 text-gray-500">
                                                        {formatDate(
                                                            order.created_at
                                                        )}
                                                    </td>

                                                    <td className="p-5">

                                                        <div className="flex gap-2 justify-center flex-wrap">

                                                            <Link
                                                                href={`/admin/orders/${order.id}`}
                                                                className="bg-gray-800 text-white px-4 py-2 rounded-xl hover:bg-gray-900 transition"
                                                            >
                                                                👁 View
                                                            </Link>

                                                            <Link
                                                                href={`/admin/orders/${order.id}/invoice`}
                                                                target="_blank"
                                                                className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition"
                                                            >
                                                                🖨 Invoice
                                                            </Link>

                                                            <Link
                                                                href={`/admin/orders/${order.id}/label`}
                                                                target="_blank"
                                                                className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition"
                                                            >
                                                                📦 Label
                                                            </Link>

                                                            <button
                                                                type="button"
                                                                disabled={
                                                                    restoringId ===
                                                                    order.id
                                                                }
                                                                onClick={() =>
                                                                    restoreOrder(
                                                                        order.id
                                                                    )
                                                                }
                                                                className="bg-pink-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl hover:bg-pink-700 transition"
                                                            >
                                                                {restoringId ===
                                                                order.id
                                                                    ? "Restoring..."
                                                                    : "♻️ Restore"}
                                                            </button>

                                                        </div>

                                                    </td>

                                                </tr>

                                            )
                                        )}

                                        </tbody>

                                    </table>

                                </div>

                                {/* ==================================
                                    PAGINATION
                                ================================== */}

                                {totalPages > 1 && (

                                    <div className="mt-6 bg-white rounded-2xl shadow-md p-4">

                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

                                            <button
                                                type="button"
                                                disabled={
                                                    page <=
                                                    1
                                                }
                                                onClick={() =>
                                                    setPage(
                                                        (current) =>
                                                            Math.max(
                                                                1,
                                                                current -
                                                                1
                                                            )
                                                    )
                                                }
                                                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed font-semibold"
                                            >
                                                ← Previous
                                            </button>

                                            <div className="flex items-center gap-2">

                                                {pageNumbers.map(
                                                    (
                                                        pageNumber
                                                    ) => (

                                                        <button
                                                            key={
                                                                pageNumber
                                                            }
                                                            type="button"
                                                            onClick={() =>
                                                                setPage(
                                                                    pageNumber
                                                                )
                                                            }
                                                            className={`w-10 h-10 rounded-xl font-bold ${
                                                                pageNumber ===
                                                                page
                                                                    ? "bg-gray-800 text-white"
                                                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                            }`}
                                                        >
                                                            {
                                                                pageNumber
                                                            }
                                                        </button>

                                                    )
                                                )}

                                            </div>

                                            <button
                                                type="button"
                                                disabled={
                                                    page >=
                                                    totalPages
                                                }
                                                onClick={() =>
                                                    setPage(
                                                        (current) =>
                                                            Math.min(
                                                                totalPages,
                                                                current +
                                                                1
                                                            )
                                                    )
                                                }
                                                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gray-800 text-white hover:bg-gray-900 disabled:opacity-40 disabled:cursor-not-allowed font-semibold"
                                            >
                                                Next →
                                            </button>

                                        </div>

                                        <p className="text-center text-xs text-gray-500 mt-3">
                                            Page{" "}
                                            <span className="font-bold">
            {page}
            </span>{" "}
                                            of{" "}
                                            <span className="font-bold">
            {totalPages}
            </span>
                                        </p>

                                    </div>

                                )}

                            </>
                        )}

                    </div>

                </section>

            </main>

            <Footer />

        </div>
    );
}
