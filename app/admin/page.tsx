"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
    Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import Link from "next/link";
import AdminNavbar from "../../components/AdminNavbar";
import Footer from "../../components/Footer";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
    Filler
);

type RecentOrder = {
    id: number;
    customer_name: string;
    total: string | number | null;
    status: string;
    payment_status?: string | null;
};

type LowStockProduct = {
    id: number;
    title: string;
    stock: number;
};

type PeriodAnalytics = {
    orders: number;
    revenue: number;
    aov: number;
    delivered: number;
    cancelled: number;
};

type DailyRevenue = {
    date: string;
    revenue: number;
    orders: number;
};

type DashboardStats = {
    orders: number;
    paidOrders: number;
    paidRevenue: number;
    grossOrderValue: number;
    cancelledOrders: number;
    cancelledValue: number;
    customers: number;
    pendingOrders: number;
    confirmedOrders: number;
    packedOrders: number;
    shippedOrders: number;
    deliveredOrders: number;
    products: number;
    today: PeriodAnalytics;
    last7Days: PeriodAnalytics;
    last30Days: PeriodAnalytics;
};

type DashboardResponse = {
    success?: boolean;
    message?: string;
    stats?: DashboardStats;
    dailyRevenue?: DailyRevenue[];
    recentOrders?: RecentOrder[];
    lowStockProducts?: LowStockProduct[];
};

export default function AdminPage() {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [loadingSeconds, setLoadingSeconds] = useState(0);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([]);
    const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
    const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);

    // Prevent duplicate dashboard requests during React development/Strict Mode.
    const requestInProgress = useRef(false);

    const loadDashboard = useCallback(async () => {
        if (requestInProgress.current) return;

        requestInProgress.current = true;
        setLoading(true);
        setError(null);
        setLoadingSeconds(0);

        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), 30000);

        let timerId: number | undefined;

        try {
            timerId = window.setInterval(() => {
                setLoadingSeconds((seconds) => seconds + 1);
            }, 1000);

            const response = await fetch("/api/admin/dashboard", {
                method: "GET",
                credentials: "include",
                cache: "no-store",
                headers: {
                    Accept: "application/json",
                },
                signal: controller.signal,
            });

            const text = await response.text();

            let result: DashboardResponse = {};

            try {
                result = text ? JSON.parse(text) : {};
            } catch {
                throw new Error(
                    `Dashboard returned an invalid response (${response.status}).`
                );
            }

            if (response.status === 401 || response.status === 403) {
                router.replace("/admin/login");
                return;
            }

            if (!response.ok || !result.success || !result.stats) {
                console.error("Dashboard API error:", result);
                setError(
                    result.message ||
                    `Unable to load dashboard (${response.status}).`
                );
                return;
            }

            setStats(result.stats);
            setDailyRevenue(
                Array.isArray(result.dailyRevenue) ? result.dailyRevenue : []
            );
            setRecentOrders(
                Array.isArray(result.recentOrders) ? result.recentOrders : []
            );
            setLowStockProducts(
                Array.isArray(result.lowStockProducts)
                    ? result.lowStockProducts
                    : []
            );
        } catch (err) {
            console.error("Dashboard loading error:", err);

            if (err instanceof DOMException && err.name === "AbortError") {
                setError(
                    "The dashboard took too long to respond. Please try again."
                );
            } else {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load the dashboard. Please try again."
                );
            }
        } finally {
            window.clearTimeout(timeoutId);
            if (timerId !== undefined) window.clearInterval(timerId);
            requestInProgress.current = false;
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        void loadDashboard();
    }, [loadDashboard]);

    const activeOrders = useMemo(() => {
        if (!stats) return 0;
        return (
            stats.pendingOrders +
            stats.confirmedOrders +
            stats.packedOrders +
            stats.shippedOrders
        );
    }, [stats]);

    const readyToDispatch = useMemo(() => {
        if (!stats) return 0;
        return stats.confirmedOrders + stats.packedOrders;
    }, [stats]);

    const outOfStockCount = useMemo(
        () =>
            lowStockProducts.filter(
                (product) => Number(product.stock) <= 0
            ).length,
        [lowStockProducts]
    );

    const lowStockCount = useMemo(
        () =>
            lowStockProducts.filter(
                (product) => Number(product.stock) > 0
            ).length,
        [lowStockProducts]
    );

    const deliveryRate = useMemo(() => {
        if (!stats || stats.orders <= 0) return 0;
        return Math.round((stats.deliveredOrders / stats.orders) * 100);
    }, [stats]);

    const cancellationRate = useMemo(() => {
        if (!stats || stats.orders <= 0) return 0;
        return Math.round((stats.cancelledOrders / stats.orders) * 100);
    }, [stats]);

    const chartData = useMemo(
        () => ({
            labels: dailyRevenue.map((item) => {
                const date = new Date(`${item.date}T00:00:00`);
                return date.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                });
            }),
            datasets: [
                {
                    label: "Daily Sales",
                    data: dailyRevenue.map((item) => item.revenue),
                    borderColor: "#e6007e",
                    backgroundColor: "rgba(230, 0, 126, 0.08)",
                    borderWidth: 2.5,
                    tension: 0.35,
                    fill: true,
                    pointRadius: 3,
                    pointHoverRadius: 6,
                },
            ],
        }),
        [dailyRevenue]
    );

    const chartOptions = useMemo(
        () => ({
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: "index" as const,
            },
            plugins: {
                legend: {
                    display: false,
                },
                tooltip: {
                    displayColors: false,
                    callbacks: {
                        title: (items: { label?: string }[]) =>
                            items[0]?.label || "",
                        label: (context: { raw?: unknown }) =>
                            ` Sales: ₹${Number(context.raw || 0).toLocaleString(
                                "en-IN"
                            )}`,
                    },
                },
            },
            scales: {
                x: {
                    grid: {
                        display: false,
                    },
                    ticks: {
                        color: "#64748b",
                        maxRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 8,
                    },
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: "rgba(148, 163, 184, 0.20)",
                    },
                    ticks: {
                        color: "#64748b",
                        callback: (value: string | number) =>
                            `₹${Number(value).toLocaleString("en-IN")}`,
                    },
                },
            },
        }),
        []
    );

    const todoCards = stats
        ? [
            {
                title: "Pending Orders",
                value: stats.pendingOrders,
                icon: "📦",
                bg: "bg-yellow-50",
                number: "text-yellow-600",
                href: "/admin/orders",
            },
            {
                title: "Ready to Dispatch",
                value: readyToDispatch,
                icon: "🚚",
                bg: "bg-blue-50",
                number: "text-blue-600",
                href: "/admin/orders",
            },
            {
                title: "Out of Stock",
                value: outOfStockCount,
                icon: "❌",
                bg: "bg-red-50",
                number: "text-red-600",
                href: "/admin/products",
            },
            {
                title: "Low Stock",
                value: lowStockCount,
                icon: "⚠️",
                bg: "bg-orange-50",
                number: "text-orange-600",
                href: "/admin/products",
            },
        ]
        : [];

    if (loading) {
        return (
            <>
                <AdminNavbar />

                <main className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center max-w-md w-full">
                        <div className="text-5xl mb-4 animate-pulse">💎</div>

                        <h1 className="text-xl font-bold text-slate-900">
                            Loading APSRAA Dashboard
                        </h1>

                        <p className="text-slate-500 mt-2">
                            Connecting to your store data...
                        </p>

                        <div className="mt-5 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full w-1/2 bg-pink-600 rounded-full animate-pulse" />
                        </div>

                        <p className="text-xs text-slate-400 mt-3">
                            {loadingSeconds > 0
                                ? `Loading for ${loadingSeconds}s`
                                : "Please wait..."}
                        </p>
                    </div>
                </main>

                <Footer />
            </>
        );
    }

    if (error || !stats) {
        return (
            <>
                <AdminNavbar />

                <main className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
                    <div className="bg-white border border-red-200 rounded-2xl shadow-sm p-8 text-center max-w-md w-full">
                        <div className="text-4xl mb-3">⚠️</div>

                        <h1 className="text-xl font-bold text-slate-900 mb-2">
                            Dashboard could not be loaded
                        </h1>

                        <p className="text-slate-500 mb-5">
                            {error || "No dashboard data was returned."}
                        </p>

                        <button
                            type="button"
                            onClick={() => void loadDashboard()}
                            className="bg-pink-600 hover:bg-pink-700 text-white px-5 py-2.5 rounded-lg font-semibold transition"
                        >
                            Try Again
                        </button>
                    </div>
                </main>

                <Footer />
            </>
        );
    }

    return (
        <>
            <AdminNavbar />

            <main className="min-h-screen bg-slate-100 pb-12">
                <div className="max-w-[1500px] mx-auto px-4 md:px-6 lg:px-7 pt-5">
                    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-5 mb-4">
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
                            Welcome back, APSRAA BY AVNI
                        </h1>
                        <p className="text-slate-500 mt-1.5">
                            Manage and grow your jewellery business
                        </p>
                    </section>

                    <section className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-100 rounded-2xl px-6 py-4 mb-4">
                        <div className="flex items-center gap-4">
                            <div className="text-3xl">📣</div>
                            <div>
                                <p className="font-bold text-pink-700">
                                    Store Overview
                                </p>
                                <p className="text-slate-700 text-sm md:text-base">
                                    You currently have{" "}
                                    <strong>{activeOrders}</strong> active
                                    order
                                    {activeOrders !== 1 ? "s" : ""} requiring
                                    attention.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xl">
                                ☷
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900">
                                To do list
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {todoCards.map((card) => (
                                <Link
                                    key={card.title}
                                    href={card.href}
                                    className={`${card.bg} border border-slate-200 rounded-xl px-5 py-4 hover:shadow-md transition`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="text-3xl">
                                            {card.icon}
                                        </div>
                                        <div>
                                            <p className="text-slate-700 font-medium text-sm">
                                                {card.title}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`text-2xl font-bold ${card.number}`}
                                                >
                                                    {card.value}
                                                </span>
                                                <span className="text-slate-400 text-xl">
                                                    ›
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>

                    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xl">
                                    📈
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900">
                                        Business Insights
                                    </h2>
                                    <p className="text-sm text-slate-500">
                                        Daily sales performance
                                    </p>
                                </div>
                            </div>
                            <span className="text-sm font-semibold text-pink-700">
                                Last 30 Days
                            </span>
                        </div>

                        <div className="grid lg:grid-cols-[1fr_210px] gap-5">
                            <div>
                                <div className="mb-2">
                                    <p className="text-sm text-slate-500">
                                        Sales
                                    </p>
                                    <p className="text-2xl font-bold text-slate-900">
                                        ₹
                                        {stats.last30Days.revenue.toLocaleString(
                                            "en-IN"
                                        )}
                                    </p>
                                </div>

                                <div className="h-[270px]">
                                    {dailyRevenue.length > 0 ? (
                                        <Line
                                            data={chartData}
                                            options={chartOptions}
                                        />
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-slate-400">
                                            No sales data available
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="border border-slate-200 rounded-xl p-4">
                                    <p className="text-sm text-slate-500">
                                        Today's Revenue
                                    </p>
                                    <p className="text-2xl font-bold text-slate-900 mt-1">
                                        ₹
                                        {stats.today.revenue.toLocaleString(
                                            "en-IN"
                                        )}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {stats.today.orders} orders
                                    </p>
                                </div>

                                <div className="border border-slate-200 rounded-xl p-4">
                                    <p className="text-sm text-slate-500">
                                        Last 7 Days
                                    </p>
                                    <p className="text-2xl font-bold text-slate-900 mt-1">
                                        ₹
                                        {stats.last7Days.revenue.toLocaleString(
                                            "en-IN"
                                        )}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {stats.last7Days.orders} orders
                                    </p>
                                </div>

                                <div className="border border-slate-200 rounded-xl p-4">
                                    <p className="text-sm text-slate-500">
                                        Last 30 Days
                                    </p>
                                    <p className="text-2xl font-bold text-pink-700 mt-1">
                                        ₹
                                        {stats.last30Days.revenue.toLocaleString(
                                            "en-IN"
                                        )}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {stats.last30Days.orders} orders
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4">
                            <Link
                                href="/admin/orders"
                                className="inline-flex border border-pink-600 text-pink-700 px-5 py-2 rounded-lg font-semibold text-sm hover:bg-pink-50 transition"
                            >
                                View More Details
                            </Link>
                        </div>
                    </section>

                    <section className="mb-4">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xl">
                                💰
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900">
                                Sales Snapshot
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {[
                                { label: "Today", period: stats.today },
                                { label: "Last 7 Days", period: stats.last7Days },
                                { label: "Last 30 Days", period: stats.last30Days },
                            ].map(({ label, period }) => {
                                const isLast30 = label === "Last 30 Days";

                                return (
                                    <div
                                        key={label}
                                        className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"
                                    >
                                        <p className="text-slate-500 text-sm">
                                            {label}
                                        </p>
                                        <p
                                            className={`text-3xl font-bold mt-1 ${
                                                isLast30
                                                    ? "text-pink-700"
                                                    : "text-slate-900"
                                            }`}
                                        >
                                            ₹
                                            {period.revenue.toLocaleString(
                                                "en-IN"
                                            )}
                                        </p>
                                        <p className="text-sm text-slate-500 mt-1">
                                            {period.orders} orders · AOV ₹
                                            {Math.round(
                                                period.aov
                                            ).toLocaleString("en-IN")}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 mb-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xl">
                                🚚
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">
                                    Dispatch Performance & Insights
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Current order pipeline
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            {[
                                ["Pending", stats.pendingOrders, "text-yellow-600"],
                                ["Confirmed", stats.confirmedOrders, "text-purple-600"],
                                ["Packed", stats.packedOrders, "text-blue-600"],
                                ["Shipped", stats.shippedOrders, "text-indigo-600"],
                                ["Delivered", stats.deliveredOrders, "text-green-600"],
                            ].map(([label, value, color]) => (
                                <div key={label} className="border rounded-xl p-4">
                                    <p className="text-sm text-slate-500">
                                        {label}
                                    </p>
                                    <p
                                        className={`text-3xl font-bold mt-1 ${color}`}
                                    >
                                        {value}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                            <p className="text-sm text-slate-500">
                                Delivery Rate
                            </p>
                            <p className="text-4xl font-bold text-green-600 mt-1">
                                {deliveryRate}%
                            </p>
                            <p className="text-sm text-slate-500 mt-1">
                                Based on all orders
                            </p>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                            <p className="text-sm text-slate-500">
                                Cancellation Rate
                            </p>
                            <p className="text-4xl font-bold text-red-600 mt-1">
                                {cancellationRate}%
                            </p>
                            <p className="text-sm text-slate-500 mt-1">
                                {stats.cancelledOrders} cancelled orders
                            </p>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                            <p className="text-sm text-slate-500">
                                Total Customers
                            </p>
                            <p className="text-4xl font-bold text-purple-600 mt-1">
                                {stats.customers}
                            </p>
                            <p className="text-sm text-slate-500 mt-1">
                                Unique customers
                            </p>
                        </div>
                    </section>

                    <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 mb-4">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">
                                    Recent Orders
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Latest customer activity
                                </p>
                            </div>

                            <Link
                                href="/admin/orders"
                                className="text-pink-700 font-semibold text-sm hover:underline"
                            >
                                View all →
                            </Link>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[700px]">
                                <thead>
                                <tr className="border-b">
                                    <th className="text-left py-3 px-3 text-sm text-slate-500 font-medium">
                                        Order
                                    </th>
                                    <th className="text-left py-3 px-3 text-sm text-slate-500 font-medium">
                                        Customer
                                    </th>
                                    <th className="text-left py-3 px-3 text-sm text-slate-500 font-medium">
                                        Amount
                                    </th>
                                    <th className="text-left py-3 px-3 text-sm text-slate-500 font-medium">
                                        Payment
                                    </th>
                                    <th className="text-left py-3 px-3 text-sm text-slate-500 font-medium">
                                        Status
                                    </th>
                                </tr>
                                </thead>

                                <tbody>
                                {recentOrders.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="py-8 text-center text-slate-500"
                                        >
                                            No recent orders
                                        </td>
                                    </tr>
                                ) : (
                                    recentOrders.map((order) => (
                                        <tr
                                            key={order.id}
                                            className="border-b last:border-0 hover:bg-pink-50 transition"
                                        >
                                            <td className="py-3 px-3 font-bold text-slate-900">
                                                #{order.id}
                                            </td>
                                            <td className="py-3 px-3 text-slate-700">
                                                {order.customer_name}
                                            </td>
                                            <td className="py-3 px-3 font-bold text-slate-900">
                                                ₹
                                                {Number(
                                                    order.total || 0
                                                ).toLocaleString("en-IN")}
                                            </td>
                                            <td className="py-3 px-3">
                                                    <span
                                                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                            order.payment_status ===
                                                            "Paid"
                                                                ? "bg-green-100 text-green-700"
                                                                : "bg-yellow-100 text-yellow-700"
                                                        }`}
                                                    >
                                                        {order.payment_status ===
                                                        "Paid"
                                                            ? "Paid"
                                                            : "Pending"}
                                                    </span>
                                            </td>
                                            <td className="py-3 px-3">
                                                    <span className="inline-flex px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                                                        {order.status}
                                                    </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">
                                    Inventory Alerts
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Products that need attention
                                </p>
                            </div>

                            <Link
                                href="/admin/products"
                                className="text-pink-700 font-semibold text-sm hover:underline"
                            >
                                View products →
                            </Link>
                        </div>

                        {lowStockProducts.length === 0 ? (
                            <div className="rounded-xl bg-green-50 border border-green-100 p-6 text-center">
                                <div className="text-3xl mb-1">✅</div>
                                <p className="font-semibold text-green-700">
                                    Inventory looks healthy
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {lowStockProducts.slice(0, 8).map((product) => (
                                    <div
                                        key={product.id}
                                        className="flex items-center justify-between border rounded-xl p-3"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-pink-50 flex items-center justify-center">
                                                💎
                                            </div>

                                            <div>
                                                <p className="font-semibold text-slate-900">
                                                    {product.title}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    Product #{product.id}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <p
                                                className={`text-xl font-bold ${
                                                    Number(product.stock) <= 0
                                                        ? "text-red-600"
                                                        : "text-orange-600"
                                                }`}
                                            >
                                                {product.stock}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {Number(product.stock) <= 0
                                                    ? "Out of stock"
                                                    : "Left"}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </main>

            <Footer />
        </>
    );
}

