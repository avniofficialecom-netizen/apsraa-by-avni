"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
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
    Legend
);

type RecentOrder = {
    id: number;
    customer_name: string;
    total: string;
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

export default function AdminPage() {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [stats, setStats] =
        useState<DashboardStats | null>(null);

    const [dailyRevenue, setDailyRevenue] =
        useState<DailyRevenue[]>([]);

    const [recentOrders, setRecentOrders] =
        useState<RecentOrder[]>([]);

    const [lowStockProducts, setLowStockProducts] =
        useState<LowStockProduct[]>([]);

    // ==========================================
    // LOAD DASHBOARD
    // ==========================================

    useEffect(() => {
        loadDashboard();
    }, []);

    async function loadDashboard() {
        try {
            setLoading(true);

            const response = await fetch(
                "/api/admin/dashboard",
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
                router.replace(
                    "/admin/login"
                );
                return;
            }

            if (
                !response.ok ||
                !result.success
            ) {
                console.error(
                    "Dashboard API error:",
                    result
                );

                return;
            }

            setStats(result.stats);

            setDailyRevenue(
                Array.isArray(
                    result.dailyRevenue
                )
                    ? result.dailyRevenue
                    : []
            );

            setRecentOrders(
                Array.isArray(
                    result.recentOrders
                )
                    ? result.recentOrders
                    : []
            );

            setLowStockProducts(
                Array.isArray(
                    result.lowStockProducts
                )
                    ? result.lowStockProducts
                    : []
            );
        } catch (error) {
            console.error(
                "Dashboard loading error:",
                error
            );
        } finally {
            setLoading(false);
        }
    }

    // ==========================================
    // LOADING
    // ==========================================

    if (loading || !stats) {
        return (
            <>
                <AdminNavbar />

                <main className="min-h-screen bg-slate-100 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-4xl mb-3">
                            💎
                        </div>

                        <p className="text-gray-600 font-medium">
                            Loading APSRAA Dashboard...
                        </p>
                    </div>
                </main>

                <Footer />
            </>
        );
    }

    // ==========================================
    // CALCULATIONS
    // ==========================================

    const activeOrders =
        stats.pendingOrders +
        stats.confirmedOrders +
        stats.packedOrders +
        stats.shippedOrders;

    const readyToDispatch =
        stats.confirmedOrders +
        stats.packedOrders;

    const outOfStockCount =
        lowStockProducts.filter(
            (product) =>
                Number(product.stock) <= 0
        ).length;

    const lowStockCount =
        lowStockProducts.filter(
            (product) =>
                Number(product.stock) > 0
        ).length;

    const deliveryRate =
        stats.orders > 0
            ? Math.round(
                (stats.deliveredOrders /
                    stats.orders) *
                100
            )
            : 0;

    const cancellationRate =
        stats.orders > 0
            ? Math.round(
                (stats.cancelledOrders /
                    stats.orders) *
                100
            )
            : 0;

    // ==========================================
    // CHART
    // ==========================================

    const chartData = {
        labels: dailyRevenue.map(
            (item) => {
                const date = new Date(
                    `${item.date}T00:00:00`
                );

                return date.toLocaleDateString(
                    "en-IN",
                    {
                        day: "numeric",
                        month: "short",
                    }
                );
            }
        ),

        datasets: [
            {
                label: "Daily Sales",

                data: dailyRevenue.map(
                    (item) =>
                        item.revenue
                ),

                borderColor: "#e6007e",

                backgroundColor:
                    "rgba(230, 0, 126, 0.08)",

                borderWidth: 2.5,

                tension: 0.35,

                fill: true,

                pointRadius: 3,

                pointHoverRadius: 6,
            },
        ],
    };

    const chartOptions = {
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
                    title: (
                        items: any[]
                    ) =>
                        items[0]?.label ||
                        "",

                    label: (
                        context: any
                    ) =>
                        ` Sales: ₹${Number(
                            context.raw || 0
                        ).toLocaleString()}`,
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
                    color:
                        "rgba(148, 163, 184, 0.20)",
                },

                ticks: {
                    color: "#64748b",

                    callback: (
                        value: string | number
                    ) =>
                        `₹${Number(
                            value
                        ).toLocaleString()}`,
                },
            },
        },
    };

    // ==========================================
    // TODO CARDS
    // ==========================================

    const todoCards = [
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
    ];

    return (
        <>
            <AdminNavbar />

            <main className="min-h-screen bg-slate-100 pb-12">

                <div className="max-w-[1500px] mx-auto px-4 md:px-6 lg:px-7 pt-5">

                    {/* ==================================
                        WELCOME
                    ================================== */}

                    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-5 mb-4">

                        <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
                            Welcome back, APSRAA BY AVNI
                        </h1>

                        <p className="text-slate-500 mt-1.5">
                            Manage and grow your jewellery business
                        </p>

                    </section>

                    {/* ==================================
                        STORE OVERVIEW
                    ================================== */}

                    <section className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-100 rounded-2xl px-6 py-4 mb-4">

                        <div className="flex items-center gap-4">

                            <div className="text-3xl">
                                📣
                            </div>

                            <div>

                                <p className="font-bold text-pink-700">
                                    Store Overview
                                </p>

                                <p className="text-slate-700 text-sm md:text-base">
                                    You currently have{" "}
                                    <strong>
                                        {activeOrders}
                                    </strong>{" "}
                                    active order
                                    {activeOrders !== 1
                                        ? "s"
                                        : ""}{" "}
                                    requiring attention.
                                </p>

                            </div>

                        </div>

                    </section>

                    {/* ==================================
                        TO DO LIST
                    ================================== */}

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

                            {todoCards.map(
                                (card) => (
                                    <Link
                                        key={
                                            card.title
                                        }
                                        href={
                                            card.href
                                        }
                                        className={`${card.bg} border border-slate-200 rounded-xl px-5 py-4 hover:shadow-md transition`}
                                    >

                                        <div className="flex items-center gap-4">

                                            <div className="text-3xl">
                                                {
                                                    card.icon
                                                }
                                            </div>

                                            <div>

                                                <p className="text-slate-700 font-medium text-sm">
                                                    {
                                                        card.title
                                                    }
                                                </p>

                                                <div className="flex items-center gap-2">

                                                    <span
                                                        className={`text-2xl font-bold ${card.number}`}
                                                    >
                                                        {
                                                            card.value
                                                        }
                                                    </span>

                                                    <span className="text-slate-400 text-xl">
                                                        ›
                                                    </span>

                                                </div>

                                            </div>

                                        </div>

                                    </Link>
                                )
                            )}

                        </div>

                    </section>

                    {/* ==================================
                        BUSINESS INSIGHTS
                    ================================== */}

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

                            {/* CHART */}

                            <div>

                                <div className="mb-2">

                                    <p className="text-sm text-slate-500">
                                        Sales
                                    </p>

                                    <p className="text-2xl font-bold text-slate-900">
                                        ₹
                                        {stats.last30Days.revenue.toLocaleString()}
                                    </p>

                                </div>

                                <div className="h-[270px]">

                                    {dailyRevenue.length >
                                    0 ? (

                                        <Line
                                            data={
                                                chartData
                                            }
                                            options={
                                                chartOptions
                                            }
                                        />

                                    ) : (

                                        <div className="h-full flex items-center justify-center text-slate-400">
                                            No sales data available
                                        </div>

                                    )}

                                </div>

                            </div>

                            {/* INSIGHT CARDS */}

                            <div className="space-y-3">

                                <div className="border border-slate-200 rounded-xl p-4">

                                    <p className="text-sm text-slate-500">
                                        Today's Revenue
                                    </p>

                                    <p className="text-2xl font-bold text-slate-900 mt-1">
                                        ₹
                                        {stats.today.revenue.toLocaleString()}
                                    </p>

                                    <p className="text-xs text-slate-500 mt-1">
                                        {
                                            stats.today.orders
                                        }{" "}
                                        orders
                                    </p>

                                </div>

                                <div className="border border-slate-200 rounded-xl p-4">

                                    <p className="text-sm text-slate-500">
                                        Last 7 Days
                                    </p>

                                    <p className="text-2xl font-bold text-slate-900 mt-1">
                                        ₹
                                        {stats.last7Days.revenue.toLocaleString()}
                                    </p>

                                    <p className="text-xs text-slate-500 mt-1">
                                        {
                                            stats.last7Days.orders
                                        }{" "}
                                        orders
                                    </p>

                                </div>

                                <div className="border border-slate-200 rounded-xl p-4">

                                    <p className="text-sm text-slate-500">
                                        Last 30 Days
                                    </p>

                                    <p className="text-2xl font-bold text-pink-700 mt-1">
                                        ₹
                                        {stats.last30Days.revenue.toLocaleString()}
                                    </p>

                                    <p className="text-xs text-slate-500 mt-1">
                                        {
                                            stats.last30Days.orders
                                        }{" "}
                                        orders
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

                    {/* ==================================
                        SALES SNAPSHOT
                    ================================== */}

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

                            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">

                                <p className="text-slate-500 text-sm">
                                    Today
                                </p>

                                <p className="text-3xl font-bold text-slate-900 mt-1">
                                    ₹
                                    {stats.today.revenue.toLocaleString()}
                                </p>

                                <p className="text-sm text-slate-500 mt-1">
                                    {
                                        stats.today.orders
                                    }{" "}
                                    orders · AOV ₹
                                    {Math.round(
                                        stats.today.aov
                                    ).toLocaleString()}
                                </p>

                            </div>

                            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">

                                <p className="text-slate-500 text-sm">
                                    Last 7 Days
                                </p>

                                <p className="text-3xl font-bold text-slate-900 mt-1">
                                    ₹
                                    {stats.last7Days.revenue.toLocaleString()}
                                </p>

                                <p className="text-sm text-slate-500 mt-1">
                                    {
                                        stats.last7Days.orders
                                    }{" "}
                                    orders · AOV ₹
                                    {Math.round(
                                        stats.last7Days.aov
                                    ).toLocaleString()}
                                </p>

                            </div>

                            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">

                                <p className="text-slate-500 text-sm">
                                    Last 30 Days
                                </p>

                                <p className="text-3xl font-bold text-pink-700 mt-1">
                                    ₹
                                    {stats.last30Days.revenue.toLocaleString()}
                                </p>

                                <p className="text-sm text-slate-500 mt-1">
                                    {
                                        stats.last30Days.orders
                                    }{" "}
                                    orders · AOV ₹
                                    {Math.round(
                                        stats.last30Days.aov
                                    ).toLocaleString()}
                                </p>

                            </div>

                        </div>

                    </section>

                    {/* ==================================
                        DISPATCH PERFORMANCE
                    ================================== */}

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

                            <div className="border rounded-xl p-4">

                                <p className="text-sm text-slate-500">
                                    Pending
                                </p>

                                <p className="text-3xl font-bold text-yellow-600 mt-1">
                                    {
                                        stats.pendingOrders
                                    }
                                </p>

                            </div>

                            <div className="border rounded-xl p-4">

                                <p className="text-sm text-slate-500">
                                    Confirmed
                                </p>

                                <p className="text-3xl font-bold text-purple-600 mt-1">
                                    {
                                        stats.confirmedOrders
                                    }
                                </p>

                            </div>

                            <div className="border rounded-xl p-4">

                                <p className="text-sm text-slate-500">
                                    Packed
                                </p>

                                <p className="text-3xl font-bold text-blue-600 mt-1">
                                    {
                                        stats.packedOrders
                                    }
                                </p>

                            </div>

                            <div className="border rounded-xl p-4">

                                <p className="text-sm text-slate-500">
                                    Shipped
                                </p>

                                <p className="text-3xl font-bold text-indigo-600 mt-1">
                                    {
                                        stats.shippedOrders
                                    }
                                </p>

                            </div>

                            <div className="border rounded-xl p-4">

                                <p className="text-sm text-slate-500">
                                    Delivered
                                </p>

                                <p className="text-3xl font-bold text-green-600 mt-1">
                                    {
                                        stats.deliveredOrders
                                    }
                                </p>

                            </div>

                        </div>

                    </section>

                    {/* ==================================
                        BUSINESS HEALTH
                    ================================== */}

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
                                {
                                    cancellationRate
                                }%
                            </p>

                            <p className="text-sm text-slate-500 mt-1">
                                {
                                    stats.cancelledOrders
                                }{" "}
                                cancelled orders
                            </p>

                        </div>

                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">

                            <p className="text-sm text-slate-500">
                                Total Customers
                            </p>

                            <p className="text-4xl font-bold text-purple-600 mt-1">
                                {
                                    stats.customers
                                }
                            </p>

                            <p className="text-sm text-slate-500 mt-1">
                                Unique customers
                            </p>

                        </div>

                    </section>

                    {/* ==================================
                        RECENT ORDERS
                    ================================== */}

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

                                {recentOrders.length ===
                                0 ? (

                                    <tr>

                                        <td
                                            colSpan={
                                                5
                                            }
                                            className="py-8 text-center text-slate-500"
                                        >
                                            No recent orders
                                        </td>

                                    </tr>

                                ) : (

                                    recentOrders.map(
                                        (
                                            order
                                        ) => (
                                            <tr
                                                key={
                                                    order.id
                                                }
                                                className="border-b last:border-0 hover:bg-pink-50 transition"
                                            >

                                                <td className="py-3 px-3 font-bold text-slate-900">
                                                    #
                                                    {
                                                        order.id
                                                    }
                                                </td>

                                                <td className="py-3 px-3 text-slate-700">
                                                    {
                                                        order.customer_name
                                                    }
                                                </td>

                                                <td className="py-3 px-3 font-bold text-slate-900">
                                                    ₹
                                                    {Number(
                                                        order.total ||
                                                        0
                                                    ).toLocaleString()}
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
                                                            {
                                                                order.payment_status ===
                                                                "Paid"
                                                                    ? "Paid"
                                                                    : "Pending"
                                                            }
                                                        </span>

                                                </td>

                                                <td className="py-3 px-3">

                                                        <span className="inline-flex px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                                                            {
                                                                order.status
                                                            }
                                                        </span>

                                                </td>

                                            </tr>
                                        )
                                    )

                                )}

                                </tbody>

                            </table>

                        </div>

                    </section>

                    {/* ==================================
                        INVENTORY ALERTS
                    ================================== */}

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

                        {lowStockProducts.length ===
                        0 ? (

                            <div className="rounded-xl bg-green-50 border border-green-100 p-6 text-center">

                                <div className="text-3xl mb-1">
                                    ✅
                                </div>

                                <p className="font-semibold text-green-700">
                                    Inventory looks healthy
                                </p>

                            </div>

                        ) : (

                            <div className="space-y-2">

                                {lowStockProducts
                                    .slice(
                                        0,
                                        8
                                    )
                                    .map(
                                        (
                                            product
                                        ) => (
                                            <div
                                                key={
                                                    product.id
                                                }
                                                className="flex items-center justify-between border rounded-xl p-3"
                                            >

                                                <div className="flex items-center gap-3">

                                                    <div className="w-10 h-10 rounded-lg bg-pink-50 flex items-center justify-center">
                                                        💎
                                                    </div>

                                                    <div>

                                                        <p className="font-semibold text-slate-900">
                                                            {
                                                                product.title
                                                            }
                                                        </p>

                                                        <p className="text-xs text-slate-500">
                                                            Product #
                                                            {
                                                                product.id
                                                            }
                                                        </p>

                                                    </div>

                                                </div>

                                                <div className="text-right">

                                                    <p
                                                        className={`text-xl font-bold ${
                                                            Number(
                                                                product.stock
                                                            ) <=
                                                            0
                                                                ? "text-red-600"
                                                                : "text-orange-600"
                                                        }`}
                                                    >
                                                        {
                                                            product.stock
                                                        }
                                                    </p>

                                                    <p className="text-xs text-slate-500">
                                                        {Number(
                                                            product.stock
                                                        ) <=
                                                        0
                                                            ? "Out of stock"
                                                            : "Left"}
                                                    </p>

                                                </div>

                                            </div>
                                        )
                                    )}

                            </div>

                        )}

                    </section>

                </div>

            </main>

            <Footer />
        </>
    );
}