"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AdminNavbar from "../../../components/AdminNavbar";
import Footer from "../../../components/Footer";

type Order = {
    id: number;
    customer_name: string;
    email?: string | null;
    phone: string;
    address: string;
    total: string;
    status: string;
    payment_status?: string | null;
    created_at: string;
    archived?: boolean;
};

const STATUS_FLOW = [
    "Pending",
    "Confirmed",
    "Packed",
    "Shipped",
    "Delivered",
];

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    const [updatingId, setUpdatingId] =
        useState<number | null>(null);

    const [bulkUpdating, setBulkUpdating] =
        useState(false);

    const [selectedIds, setSelectedIds] =
        useState<number[]>([]);

    const [search, setSearch] = useState("");
    const [productSearch, setProductSearch] =
        useState("");

    const [statusFilter, setStatusFilter] =
        useState("All");

    const [paymentFilter, setPaymentFilter] =
        useState("All");

    const [sortOrder, setSortOrder] =
        useState("newest");

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalOrders, setTotalOrders] = useState(0);

    // ==========================================
    // LOAD ORDERS
    // ==========================================

    useEffect(() => {
        loadOrders();
    }, [
        page,
        search,
        productSearch,
        statusFilter,
        paymentFilter,
        sortOrder,
    ]);

    async function loadOrders() {
        try {
            setLoading(true);

            const params = new URLSearchParams();

            params.set("page", String(page));
            params.set("sort", sortOrder);
            params.set("status", statusFilter);
            params.set("payment", paymentFilter);

            if (search.trim()) {
                params.set(
                    "search",
                    search.trim()
                );
            }

            if (productSearch.trim()) {
                params.set(
                    "product",
                    productSearch.trim()
                );
            }

            const response = await fetch(
                `/api/admin/orders?${params.toString()}`,
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

            setTotalOrders(
                Number(result.totalOrders || 0)
            );

            setTotalPages(
                Math.max(
                    1,
                    Number(result.totalPages || 1)
                )
            );

            setSelectedIds([]);
        } catch (error) {
            console.error(
                "Load Orders Error:",
                error
            );

            alert("Unable to load orders.");
        } finally {
            setLoading(false);
        }
    }

    // ==========================================
    // DISPLAY STATUS
    // ==========================================

    function displayStatus(status: string) {
        if (status === "Confirmed") {
            return "Ready to Dispatch";
        }

        return status;
    }

    // ==========================================
    // STATUS CLASS
    // ==========================================

    function statusClass(status: string) {
        switch (status) {
            case "Pending":
                return "bg-yellow-100 text-yellow-700";

            case "Confirmed":
                return "bg-blue-100 text-blue-700";

            case "Packed":
                return "bg-purple-100 text-purple-700";

            case "Shipped":
                return "bg-indigo-100 text-indigo-700";

            case "Delivered":
                return "bg-green-100 text-green-700";

            case "Cancelled":
                return "bg-red-100 text-red-700";

            default:
                return "bg-gray-100 text-gray-700";
        }
    }

    // ==========================================
    // NEXT STATUS
    // ==========================================

    function nextStatus(status: string) {
        switch (status) {
            case "Pending":
                return "Confirmed";

            case "Confirmed":
                return "Packed";

            case "Packed":
                return "Shipped";

            case "Shipped":
                return "Delivered";

            default:
                return null;
        }
    }

    // ==========================================
    // NEXT BUTTON
    // ==========================================

    function nextButton(status: string) {
        switch (status) {
            case "Pending":
                return "✅ Accept Order";

            case "Confirmed":
                return "📦 Mark Packed";

            case "Packed":
                return "🚚 Mark Shipped";

            case "Shipped":
                return "🎉 Mark Delivered";

            default:
                return null;
        }
    }

    // ==========================================
    // UPDATE ONE ORDER
    // ==========================================

    async function updateOrderStatus(
        order: Order,
        newStatus: string
    ) {
        const expected = nextStatus(order.status);

        if (
            newStatus !== "Cancelled" &&
            expected !== newStatus
        ) {
            alert(
                `Order #${order.id} must move to "${displayStatus(
                    expected || order.status
                )}" next.`
            );

            return;
        }

        let message =
            `Update Order #${order.id} to "${displayStatus(
                newStatus
            )}"?`;

        if (newStatus === "Confirmed") {
            message = `Accept Order #${order.id}?`;
        }

        if (newStatus === "Cancelled") {
            message = `Cancel Order #${order.id}?`;
        }

        if (!window.confirm(message)) {
            return;
        }

        try {
            setUpdatingId(order.id);

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
                    "Unable to update order."
                );

                return;
            }

            await loadOrders();
        } catch (error) {
            console.error(
                "Update Order Error:",
                error
            );

            alert(
                "Unable to update order."
            );
        } finally {
            setUpdatingId(null);
        }
    }

    // ==========================================
    // SELECTION
    // ==========================================

    function toggleOrder(id: number) {
        setSelectedIds((current) => {
            if (current.includes(id)) {
                return current.filter(
                    (selectedId) =>
                        selectedId !== id
                );
            }

            return [...current, id];
        });
    }

    function selectAllVisible() {
        if (
            orders.length > 0 &&
            selectedIds.length === orders.length
        ) {
            setSelectedIds([]);
            return;
        }

        setSelectedIds(
            orders.map((order) => order.id)
        );
    }

    const selectedOrders = useMemo(() => {
        return orders.filter((order) =>
            selectedIds.includes(order.id)
        );
    }, [orders, selectedIds]);

    const selectedStatus =
        selectedOrders.length > 0
            ? selectedOrders[0].status
            : null;

    const sameStatus =
        selectedOrders.length > 0 &&
        selectedOrders.every(
            (order) =>
                order.status === selectedStatus
        );

    const bulkNextStatus =
        sameStatus && selectedStatus
            ? nextStatus(selectedStatus)
            : null;

    // ==========================================
    // BULK UPDATE
    // ==========================================

    async function bulkUpdate() {
        if (selectedOrders.length === 0) {
            alert(
                "Please select at least one order."
            );
            return;
        }

        if (!sameStatus) {
            alert(
                "Please select orders with the same status."
            );
            return;
        }

        if (!bulkNextStatus) {
            alert(
                "The selected orders cannot move forward."
            );
            return;
        }

        let actionText = "Update";

        if (bulkNextStatus === "Confirmed") {
            actionText = "Accept";
        }

        if (bulkNextStatus === "Packed") {
            actionText = "mark as Packed";
        }

        if (bulkNextStatus === "Shipped") {
            actionText = "mark as Shipped";
        }

        if (bulkNextStatus === "Delivered") {
            actionText = "mark as Delivered";
        }

        const confirmed = window.confirm(
            `${actionText} ${
                selectedOrders.length
            } selected order${
                selectedOrders.length > 1
                    ? "s"
                    : ""
            }?`
        );

        if (!confirmed) {
            return;
        }

        try {
            setBulkUpdating(true);

            let successCount = 0;
            let failedCount = 0;

            for (const order of selectedOrders) {
                try {
                    const response =
                        await fetch(
                            "/api/update-order-status",
                            {
                                method: "POST",
                                headers: {
                                    "Content-Type":
                                        "application/json",
                                },
                                credentials:
                                    "include",
                                body: JSON.stringify({
                                    id: order.id,
                                    status:
                                    bulkNextStatus,
                                }),
                            }
                        );

                    const result =
                        await response.json();

                    if (
                        response.ok &&
                        result.success
                    ) {
                        successCount++;
                    } else {
                        failedCount++;
                    }
                } catch {
                    failedCount++;
                }
            }

            setSelectedIds([]);

            await loadOrders();

            if (failedCount === 0) {
                alert(
                    `Successfully updated ${successCount} order${
                        successCount > 1
                            ? "s"
                            : ""
                    }.`
                );
            } else {
                alert(
                    `${successCount} orders updated successfully. ${failedCount} failed.`
                );
            }
        } finally {
            setBulkUpdating(false);
        }
    }

    // ==========================================
    // CANCEL SELECTED
    // ==========================================

    async function cancelSelected() {
        if (selectedOrders.length === 0) {
            return;
        }

        const confirmed = window.confirm(
            `Cancel ${
                selectedOrders.length
            } selected order${
                selectedOrders.length > 1
                    ? "s"
                    : ""
            }?`
        );

        if (!confirmed) {
            return;
        }

        try {
            setBulkUpdating(true);

            let successCount = 0;
            let failedCount = 0;

            for (const order of selectedOrders) {
                if (
                    order.status ===
                    "Delivered" ||
                    order.status ===
                    "Cancelled"
                ) {
                    failedCount++;
                    continue;
                }

                try {
                    const response =
                        await fetch(
                            "/api/update-order-status",
                            {
                                method: "POST",
                                headers: {
                                    "Content-Type":
                                        "application/json",
                                },
                                credentials:
                                    "include",
                                body: JSON.stringify({
                                    id: order.id,
                                    status:
                                        "Cancelled",
                                }),
                            }
                        );

                    const result =
                        await response.json();

                    if (
                        response.ok &&
                        result.success
                    ) {
                        successCount++;
                    } else {
                        failedCount++;
                    }
                } catch {
                    failedCount++;
                }
            }

            setSelectedIds([]);

            await loadOrders();

            alert(
                `${successCount} cancelled successfully${
                    failedCount
                        ? `, ${failedCount} failed`
                        : ""
                }.`
            );
        } finally {
            setBulkUpdating(false);
        }
    }

    // ==========================================
    // CLEAR FILTERS
    // ==========================================

    function clearFilters() {
        setSearch("");
        setProductSearch("");
        setStatusFilter("All");
        setPaymentFilter("All");
        setSortOrder("newest");
        setPage(1);
    }

    // ==========================================
    // DATE
    // ==========================================

    function formatDate(value: string) {
        if (!value) {
            return "-";
        }

        return new Date(value).toLocaleString(
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

    // ==========================================
    // PAGE
    // ==========================================

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-50">

            <AdminNavbar />

            <main className="px-4 sm:px-6 lg:px-8 py-8">

                <div className="max-w-7xl mx-auto">

                    {/* HEADER */}

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">

                        <div>
                            <p className="text-sm font-bold text-pink-600 uppercase tracking-wide">
                                APSRAA ADMIN
                            </p>

                            <h1 className="text-3xl sm:text-4xl font-bold text-pink-700">
                                Customer Orders
                            </h1>

                            <p className="text-gray-500 mt-1">
                                Accept and process orders in batches.
                            </p>
                        </div>

                        <Link
                            href="/admin/orders/archived"
                            className="bg-gray-800 hover:bg-gray-900 text-white px-5 py-3 rounded-xl font-bold text-center"
                        >
                            📁 Archived Orders
                        </Link>

                    </div>

                    {/* SEARCH */}

                    <section className="bg-white rounded-2xl shadow-md border border-pink-100 p-4 mb-5">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                            <input
                                value={search}
                                onChange={(event) => {
                                    setSearch(
                                        event.target.value
                                    );
                                    setPage(1);
                                }}
                                placeholder="🔎 Search order ID, customer, phone or email"
                                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-pink-500"
                            />

                            <input
                                value={productSearch}
                                onChange={(event) => {
                                    setProductSearch(
                                        event.target.value
                                    );
                                    setPage(1);
                                }}
                                placeholder="💎 Search product name, e.g. CHOKER SET"
                                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-pink-500"
                            />

                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">

                            <select
                                value={statusFilter}
                                onChange={(event) => {
                                    setStatusFilter(
                                        event.target.value
                                    );
                                    setPage(1);
                                }}
                                className="border-2 border-gray-200 rounded-xl px-4 py-3 bg-white font-semibold"
                            >
                                <option value="All">
                                    All Statuses
                                </option>

                                <option value="Pending">
                                    🟡 Pending
                                </option>

                                <option value="Confirmed">
                                    🔵 Ready to Dispatch
                                </option>

                                <option value="Packed">
                                    📦 Packed
                                </option>

                                <option value="Shipped">
                                    🚚 Shipped
                                </option>

                                <option value="Delivered">
                                    🎉 Delivered
                                </option>

                                <option value="Cancelled">
                                    ❌ Cancelled
                                </option>
                            </select>

                            <select
                                value={paymentFilter}
                                onChange={(event) => {
                                    setPaymentFilter(
                                        event.target.value
                                    );
                                    setPage(1);
                                }}
                                className="border-2 border-gray-200 rounded-xl px-4 py-3 bg-white font-semibold"
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

                            <select
                                value={sortOrder}
                                onChange={(event) => {
                                    setSortOrder(
                                        event.target.value
                                    );
                                    setPage(1);
                                }}
                                className="border-2 border-gray-200 rounded-xl px-4 py-3 bg-white font-semibold"
                            >
                                <option value="newest">
                                    Newest First
                                </option>

                                <option value="oldest">
                                    Oldest First
                                </option>
                            </select>

                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 pt-4 border-t">

                            <p className="text-sm text-gray-600">
                                Showing{" "}
                                <strong>
                                    {orders.length}
                                </strong>{" "}
                                of{" "}
                                <strong>
                                    {totalOrders}
                                </strong>{" "}
                                orders
                            </p>

                            <button
                                type="button"
                                onClick={
                                    clearFilters
                                }
                                className="text-sm bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-xl font-semibold"
                            >
                                ✕ Clear Filters
                            </button>

                        </div>

                    </section>

                    {/* BULK ACTION BAR */}

                    <section className="bg-white rounded-2xl shadow-md border-2 border-pink-200 p-4 mb-5">

                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                            <div className="flex items-center gap-3">

                                <input
                                    type="checkbox"
                                    checked={
                                        orders.length > 0 &&
                                        selectedIds.length ===
                                        orders.length
                                    }
                                    onChange={
                                        selectAllVisible
                                    }
                                    className="w-5 h-5 accent-pink-600"
                                />

                                <div>
                                    <p className="font-bold text-gray-900">
                                        Select All
                                    </p>

                                    <p className="text-sm text-gray-500">
                                        {selectedIds.length}{" "}
                                        selected
                                    </p>
                                </div>

                            </div>

                            {selectedIds.length > 0 && (
                                <div className="flex flex-wrap gap-2">

                                    {sameStatus &&
                                        bulkNextStatus && (
                                            <button
                                                type="button"
                                                disabled={
                                                    bulkUpdating
                                                }
                                                onClick={
                                                    bulkUpdate
                                                }
                                                className="bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white px-5 py-3 rounded-xl font-bold"
                                            >
                                                {bulkUpdating
                                                    ? "⏳ Updating..."
                                                    : `${nextButton(
                                                        selectedStatus ||
                                                        ""
                                                    )} (${selectedIds.length})`}
                                            </button>
                                        )}

                                    <button
                                        type="button"
                                        disabled={
                                            bulkUpdating
                                        }
                                        onClick={
                                            cancelSelected
                                        }
                                        className="bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-600 border border-red-200 px-5 py-3 rounded-xl font-bold"
                                    >
                                        ❌ Cancel Selected
                                    </button>

                                    <button
                                        type="button"
                                        disabled={
                                            bulkUpdating
                                        }
                                        onClick={() =>
                                            setSelectedIds(
                                                []
                                            )
                                        }
                                        className="bg-gray-100 hover:bg-gray-200 px-5 py-3 rounded-xl font-bold"
                                    >
                                        Clear Selection
                                    </button>

                                </div>
                            )}

                        </div>

                        {selectedIds.length > 0 &&
                            !sameStatus && (
                                <div className="mt-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl p-3 text-sm font-semibold">
                                    ⚠️ Select orders from the same status before using a bulk workflow action.
                                </div>
                            )}

                    </section>

                    {/* ORDERS */}

                    {loading ? (
                        <div className="bg-white rounded-3xl shadow-md p-16 text-center">

                            <div className="text-5xl mb-4">
                                📦
                            </div>

                            <p className="text-xl font-bold text-gray-700">
                                Loading Orders...
                            </p>

                        </div>
                    ) : orders.length === 0 ? (
                        <div className="bg-white rounded-3xl shadow-md p-16 text-center">

                            <div className="text-6xl mb-4">
                                🔎
                            </div>

                            <h2 className="text-2xl font-bold text-gray-700">
                                No Orders Found
                            </h2>

                            <p className="text-gray-500 mt-2">
                                Try changing your search or filters.
                            </p>

                        </div>
                    ) : (
                        <div className="space-y-4">

                            {orders.map((order) => {
                                const selected =
                                    selectedIds.includes(
                                        order.id
                                    );

                                const next =
                                    nextStatus(
                                        order.status
                                    );

                                return (
                                    <article
                                        key={order.id}
                                        className={`bg-white rounded-2xl shadow-md overflow-hidden border-2 ${
                                            selected
                                                ? "border-pink-500"
                                                : "border-pink-100"
                                        }`}
                                    >

                                        {/* ORDER HEADER */}

                                        <div className="bg-gradient-to-r from-pink-600 to-pink-700 text-white px-5 py-4">

                                            <div className="flex items-center justify-between gap-4">

                                                <div className="flex items-center gap-4">

                                                    <input
                                                        type="checkbox"
                                                        checked={
                                                            selected
                                                        }
                                                        onChange={() =>
                                                            toggleOrder(
                                                                order.id
                                                            )
                                                        }
                                                        className="w-5 h-5"
                                                    />

                                                    <div>
                                                        <p className="text-xs uppercase opacity-80">
                                                            Order
                                                        </p>

                                                        <p className="text-2xl font-bold">
                                                            #
                                                            {
                                                                order.id
                                                            }
                                                        </p>
                                                    </div>

                                                </div>

                                                <span
                                                    className={`px-4 py-2 rounded-full text-sm font-bold ${statusClass(
                                                        order.status
                                                    )}`}
                                                >
                                                    {displayStatus(
                                                        order.status
                                                    )}
                                                </span>

                                            </div>

                                        </div>

                                        <div className="p-5">

                                            {/* DETAILS */}

                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                                                <div>
                                                    <p className="text-xs uppercase text-gray-400">
                                                        Customer
                                                    </p>

                                                    <p className="font-bold text-gray-900 mt-1">
                                                        {
                                                            order.customer_name
                                                        }
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-xs uppercase text-gray-400">
                                                        Phone
                                                    </p>

                                                    <a
                                                        href={`tel:${order.phone}`}
                                                        className="font-semibold text-pink-600 mt-1 block"
                                                    >
                                                        📞{" "}
                                                        {
                                                            order.phone
                                                        }
                                                    </a>
                                                </div>

                                                <div>
                                                    <p className="text-xs uppercase text-gray-400">
                                                        Payment
                                                    </p>

                                                    <p
                                                        className={`font-bold mt-1 ${
                                                            order.payment_status ===
                                                            "Paid"
                                                                ? "text-green-600"
                                                                : "text-yellow-600"
                                                        }`}
                                                    >
                                                        {order.payment_status ===
                                                        "Paid"
                                                            ? "✅ Paid"
                                                            : "🟡 " +
                                                            (order.payment_status ||
                                                                "Pending")}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-xs uppercase text-gray-400">
                                                        Amount
                                                    </p>

                                                    <p className="font-bold text-green-600 text-xl mt-1">
                                                        ₹
                                                        {
                                                            order.total
                                                        }
                                                    </p>
                                                </div>

                                            </div>

                                            {/* ADDRESS */}

                                            <div className="mt-4">
                                                <p className="text-xs uppercase text-gray-400">
                                                    Delivery Address
                                                </p>

                                                <p className="text-sm text-gray-700 mt-1">
                                                    {
                                                        order.address
                                                    }
                                                </p>
                                            </div>

                                            {/* PROGRESS */}

                                            <div className="mt-5 bg-slate-50 border border-slate-200 rounded-xl p-4">

                                                <p className="text-xs font-bold uppercase text-gray-400 mb-3">
                                                    Order Progress
                                                </p>

                                                <div className="flex items-center">

                                                    {STATUS_FLOW.map(
                                                        (
                                                            stage,
                                                            index
                                                        ) => {
                                                            const currentIndex =
                                                                STATUS_FLOW.indexOf(
                                                                    order.status
                                                                );

                                                            const complete =
                                                                currentIndex >=
                                                                index;

                                                            return (
                                                                <div
                                                                    key={
                                                                        stage
                                                                    }
                                                                    className="flex items-center flex-1"
                                                                >

                                                                    <div className="flex flex-col items-center min-w-0">

                                                                        <div
                                                                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                                                                complete
                                                                                    ? "bg-pink-600 text-white"
                                                                                    : "bg-gray-200 text-gray-500"
                                                                            }`}
                                                                        >
                                                                            {
                                                                                index +
                                                                                1
                                                                            }
                                                                        </div>

                                                                        <span className="text-[10px] sm:text-xs text-gray-500 mt-1 text-center">
                                                                            {stage ===
                                                                            "Confirmed"
                                                                                ? "Ready"
                                                                                : stage}
                                                                        </span>

                                                                    </div>

                                                                    {index <
                                                                        STATUS_FLOW.length -
                                                                        1 && (
                                                                            <div
                                                                                className={`h-1 flex-1 mx-1 rounded ${
                                                                                    complete &&
                                                                                    currentIndex >
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

                                            </div>

                                            {/* ACTION BUTTONS */}

                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">

                                                {next && (
                                                    <button
                                                        type="button"
                                                        disabled={
                                                            updatingId ===
                                                            order.id ||
                                                            bulkUpdating
                                                        }
                                                        onClick={() =>
                                                            updateOrderStatus(
                                                                order,
                                                                next
                                                            )
                                                        }
                                                        className="bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white px-4 py-3 rounded-xl font-bold"
                                                    >
                                                        {updatingId ===
                                                        order.id
                                                            ? "⏳ Updating..."
                                                            : nextButton(
                                                                order.status
                                                            )}
                                                    </button>
                                                )}

                                                <Link
                                                    href={`/admin/orders/${order.id}`}
                                                    className="bg-gray-800 hover:bg-gray-900 text-white text-center px-4 py-3 rounded-xl font-bold"
                                                >
                                                    👁 View Order
                                                </Link>

                                                <Link
                                                    href={`/admin/orders/${order.id}/invoice`}
                                                    target="_blank"
                                                    className="bg-green-600 hover:bg-green-700 text-white text-center px-4 py-3 rounded-xl font-bold"
                                                >
                                                    🖨 Invoice
                                                </Link>

                                                {order.status !==
                                                    "Delivered" &&
                                                    order.status !==
                                                    "Cancelled" && (
                                                        <button
                                                            type="button"
                                                            disabled={
                                                                updatingId ===
                                                                order.id
                                                            }
                                                            onClick={() =>
                                                                updateOrderStatus(
                                                                    order,
                                                                    "Cancelled"
                                                                )
                                                            }
                                                            className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-3 rounded-xl font-bold"
                                                        >
                                                            ❌ Cancel
                                                        </button>
                                                    )}

                                            </div>

                                            <p className="text-xs text-gray-400 mt-3">
                                                Order placed:{" "}
                                                {formatDate(
                                                    order.created_at
                                                )}
                                            </p>

                                        </div>

                                    </article>
                                );
                            })}

                        </div>
                    )}

                    {/* PAGINATION */}

                    {totalPages > 1 && (
                        <div className="bg-white rounded-2xl shadow-md p-4 mt-5 flex items-center justify-between gap-4">

                            <button
                                type="button"
                                disabled={page <= 1}
                                onClick={() =>
                                    setPage(
                                        Math.max(
                                            1,
                                            page - 1
                                        )
                                    )
                                }
                                className="px-5 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-40 font-bold"
                            >
                                ← Previous
                            </button>

                            <p className="font-semibold text-gray-700">
                                Page {page} of{" "}
                                {totalPages}
                            </p>

                            <button
                                type="button"
                                disabled={
                                    page >=
                                    totalPages
                                }
                                onClick={() =>
                                    setPage(
                                        Math.min(
                                            totalPages,
                                            page + 1
                                        )
                                    )
                                }
                                className="px-5 py-3 rounded-xl bg-pink-600 hover:bg-pink-700 disabled:opacity-40 text-white font-bold"
                            >
                                Next →
                            </button>

                        </div>
                    )}

                </div>

            </main>

            <Footer />

        </div>
    );
}