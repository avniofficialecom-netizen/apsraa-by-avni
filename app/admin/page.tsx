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
};

export default function AdminPage() {
    const router = useRouter();

    const [checkingAuth, setCheckingAuth] =
        useState(true);

    const [grossOrderValue, setGrossOrderValue] =
        useState(0);

    const [paidRevenue, setPaidRevenue] =
        useState(0);

    const [cancelledValue, setCancelledValue] =
        useState(0);

    const [orders, setOrders] =
        useState(0);

    const [paidOrders, setPaidOrders] =
        useState(0);

    const [customers, setCustomers] =
        useState(0);

    const [pendingOrders, setPendingOrders] =
        useState(0);

    const [confirmedOrders, setConfirmedOrders] =
        useState(0);

    const [packedOrders, setPackedOrders] =
        useState(0);

    const [shippedOrders, setShippedOrders] =
        useState(0);

    const [deliveredOrders, setDeliveredOrders] =
        useState(0);

    const [cancelledOrders, setCancelledOrders] =
        useState(0);

    const [recentOrders, setRecentOrders] =
        useState<RecentOrder[]>([]);

    const [lowStockProducts, setLowStockProducts] =
        useState<LowStockProduct[]>([]);

    const [products, setProducts] =
        useState(0);

    // ==========================================
    // EXISTING CHART DATA
    // ==========================================

    const [monthlyRevenue] =
        useState<number[]>([
            12000,
            18500,
            24500,
            17800,
            32600,
            0,
        ]);

    // ==========================================
    // ADMIN AUTHENTICATION
    // ==========================================

    useEffect(() => {
        checkAdmin();
    }, []);

    async function checkAdmin() {
        setCheckingAuth(true);

        try {
            /*
             * The dashboard data API performs the
             * actual server-side admin verification.
             *
             * We simply request the protected endpoint.
             */

            await loadDashboard();

        } catch (error) {
            console.error(
                "Admin authentication error:",
                error
            );

            router.replace(
                "/admin/login"
            );
        } finally {
            setCheckingAuth(false);
        }
    }

    // ==========================================
    // LOAD DASHBOARD
    // ==========================================

    async function loadDashboard() {
        try {
            const response =
                await fetch(
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

                alert(
                    result.message ||
                    "Unable to load dashboard."
                );

                return;
            }

            const stats: DashboardStats =
                result.stats;

            // ==================================
            // SET ORDER STATISTICS
            // ==================================

            setOrders(
                stats.orders
            );

            setGrossOrderValue(
                stats.grossOrderValue
            );

            setPaidOrders(
                stats.paidOrders
            );

            setPaidRevenue(
                stats.paidRevenue
            );

            setCancelledOrders(
                stats.cancelledOrders
            );

            setCancelledValue(
                stats.cancelledValue
            );

            setCustomers(
                stats.customers
            );

            setPendingOrders(
                stats.pendingOrders
            );

            setConfirmedOrders(
                stats.confirmedOrders
            );

            setPackedOrders(
                stats.packedOrders
            );

            setShippedOrders(
                stats.shippedOrders
            );

            setDeliveredOrders(
                stats.deliveredOrders
            );

            // ==================================
            // PRODUCTS
            // ==================================

            setProducts(
                stats.products
            );

            // ==================================
            // RECENT ORDERS
            // ==================================

            setRecentOrders(
                Array.isArray(
                    result.recentOrders
                )
                    ? result.recentOrders
                    : []
            );

            // ==================================
            // LOW STOCK
            // ==================================

            setLowStockProducts(
                Array.isArray(
                    result.lowStockProducts
                )
                    ? result.lowStockProducts
                    : []
            );

        } catch (error) {
            console.error(
                "Load Dashboard Error:",
                error
            );

            throw error;
        }
    }

    const activeOrders =
        pendingOrders +
        confirmedOrders +
        packedOrders +
        shippedOrders;

    // ==========================================
    // CHART
    // ==========================================

    const revenueChartData = {
        labels: [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
        ],

        datasets: [
            {
                label: "Revenue",

                data: monthlyRevenue,

                borderColor:
                    "#db2777",

                backgroundColor:
                    "rgba(219,39,119,0.15)",

                borderWidth: 4,

                tension: 0.4,

                fill: true,

                pointRadius: 5,
            },
        ],
    };

    const revenueChartOptions = {
        responsive: true,

        maintainAspectRatio: false,

        plugins: {
            legend: {
                display: false,
            },
        },
    };

    // ==========================================
    // STATS
    // ==========================================

    const stats = [
        {
            title: "Paid Revenue",
            value: `₹${paidRevenue.toLocaleString()}`,
            icon: "💳",
            color: "bg-green-500",
        },

        {
            title: "Gross Order Value",
            value: `₹${grossOrderValue.toLocaleString()}`,
            icon: "💰",
            color: "bg-pink-600",
        },

        {
            title: "Paid Orders",
            value: paidOrders,
            icon: "✅",
            color: "bg-emerald-600",
        },

        {
            title: "Active Orders",
            value: activeOrders,
            icon: "📦",
            color: "bg-blue-500",
        },
    ];

    // ==========================================
    // AUTH LOADING SCREEN
    // ==========================================

    if (checkingAuth) {
        return (
            <>
                <AdminNavbar />

                <section className="min-h-screen bg-pink-50 flex items-center justify-center">

                    <div className="text-center">

                        <div className="text-5xl mb-5">
                            🔐
                        </div>

                        <p className="text-xl text-gray-600">
                            Verifying admin access...
                        </p>

                    </div>

                </section>

                <Footer />
            </>
        );
    }

    // ==========================================
    // ADMIN DASHBOARD
    // ==========================================

    return (
        <>
            <AdminNavbar />

            <section className="min-h-screen bg-gradient-to-br from-pink-50 to-white py-16">

                <div className="max-w-7xl mx-auto px-6">

                    {/* Header */}

                    <h1 className="text-5xl font-bold text-pink-700 mb-2">
                        Admin Dashboard
                    </h1>

                    <p className="text-gray-500 mb-10">
                        Welcome to APSRAA BY AVNI Admin Panel
                    </p>

                    {/* Main Statistics */}

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">

                        {stats.map(
                            (card) => (
                                <div
                                    key={
                                        card.title
                                    }
                                    className="bg-white rounded-3xl shadow-lg p-8 hover:shadow-xl transition"
                                >

                                    <div
                                        className={`${card.color} w-14 h-14 rounded-2xl flex items-center justify-center text-3xl text-white mb-6`}
                                    >
                                        {
                                            card.icon
                                        }
                                    </div>

                                    <p className="text-gray-500">
                                        {
                                            card.title
                                        }
                                    </p>

                                    <h2 className="text-4xl font-bold mt-2">
                                        {
                                            card.value
                                        }
                                    </h2>

                                </div>
                            )
                        )}

                    </div>

                    {/* Financial Summary */}

                    <h2 className="text-3xl font-bold mb-6 text-gray-800">
                        Financial Summary
                    </h2>

                    <div className="grid md:grid-cols-3 gap-6 mb-12">

                        <div className="bg-green-50 rounded-3xl shadow-lg p-8">

                            <div className="text-5xl">
                                💳
                            </div>

                            <h3 className="text-xl font-bold mt-4">
                                Paid Revenue
                            </h3>

                            <p className="text-4xl font-bold text-green-600 mt-2">
                                ₹
                                {paidRevenue.toLocaleString()}
                            </p>

                        </div>

                        <div className="bg-pink-50 rounded-3xl shadow-lg p-8">

                            <div className="text-5xl">
                                💰
                            </div>

                            <h3 className="text-xl font-bold mt-4">
                                Gross Order Value
                            </h3>

                            <p className="text-4xl font-bold text-pink-700 mt-2">
                                ₹
                                {grossOrderValue.toLocaleString()}
                            </p>

                        </div>

                        <div className="bg-red-50 rounded-3xl shadow-lg p-8">

                            <div className="text-5xl">
                                ❌
                            </div>

                            <h3 className="text-xl font-bold mt-4">
                                Cancelled Value
                            </h3>

                            <p className="text-4xl font-bold text-red-600 mt-2">
                                ₹
                                {cancelledValue.toLocaleString()}
                            </p>

                            <p className="text-gray-500 mt-2">
                                {
                                    cancelledOrders
                                }{" "}
                                cancelled order(s)
                            </p>

                        </div>

                    </div>

                    {/* Revenue Chart */}

                    <div className="bg-white rounded-3xl shadow-xl p-8 mb-12">

                        <div className="mb-6">

                            <h2 className="text-3xl font-bold text-pink-700">
                                Revenue Analytics
                            </h2>

                            <p className="text-gray-500">
                                Last 6 Months Revenue
                            </p>

                        </div>

                        <div className="h-80">

                            <Line
                                data={
                                    revenueChartData
                                }
                                options={
                                    revenueChartOptions
                                }
                            />

                        </div>

                    </div>

                    {/* Order Status */}

                    <h2 className="text-3xl font-bold mb-6 text-gray-800">
                        Order Status
                    </h2>

                    <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">

                        <div className="bg-yellow-50 rounded-3xl shadow-lg p-8 text-center">

                            <div className="text-5xl">
                                ⏳
                            </div>

                            <h3 className="text-xl font-bold mt-4">
                                Pending
                            </h3>

                            <p className="text-4xl font-bold text-yellow-600 mt-2">
                                {
                                    pendingOrders
                                }
                            </p>

                        </div>

                        <div className="bg-purple-50 rounded-3xl shadow-lg p-8 text-center">

                            <div className="text-5xl">
                                🔵
                            </div>

                            <h3 className="text-xl font-bold mt-4">
                                Confirmed
                            </h3>

                            <p className="text-4xl font-bold text-purple-600 mt-2">
                                {
                                    confirmedOrders
                                }
                            </p>

                        </div>

                        <div className="bg-blue-50 rounded-3xl shadow-lg p-8 text-center">

                            <div className="text-5xl">
                                📦
                            </div>

                            <h3 className="text-xl font-bold mt-4">
                                Packed
                            </h3>

                            <p className="text-4xl font-bold text-blue-600 mt-2">
                                {
                                    packedOrders
                                }
                            </p>

                        </div>

                        <div className="bg-indigo-50 rounded-3xl shadow-lg p-8 text-center">

                            <div className="text-5xl">
                                🚚
                            </div>

                            <h3 className="text-xl font-bold mt-4">
                                Shipped
                            </h3>

                            <p className="text-4xl font-bold text-indigo-600 mt-2">
                                {
                                    shippedOrders
                                }
                            </p>

                        </div>

                        <div className="bg-green-50 rounded-3xl shadow-lg p-8 text-center">

                            <div className="text-5xl">
                                ✅
                            </div>

                            <h3 className="text-xl font-bold mt-4">
                                Delivered
                            </h3>

                            <p className="text-4xl font-bold text-green-600 mt-2">
                                {
                                    deliveredOrders
                                }
                            </p>

                        </div>

                    </div>

                    {/* Payment Summary */}

                    <h2 className="text-3xl font-bold mb-6 text-gray-800">
                        Payment Summary
                    </h2>

                    <div className="grid md:grid-cols-3 gap-6 mb-12">

                        <div className="bg-green-50 rounded-3xl shadow-lg p-8">

                            <div className="text-5xl">
                                💳
                            </div>

                            <h3 className="text-xl font-bold mt-4">
                                Paid Orders
                            </h3>

                            <p className="text-4xl font-bold text-green-600 mt-2">
                                {
                                    paidOrders
                                }
                            </p>

                        </div>

                        <div className="bg-gray-50 rounded-3xl shadow-lg p-8">

                            <div className="text-5xl">
                                ⏳
                            </div>

                            <h3 className="text-xl font-bold mt-4">
                                Unpaid / Pending Payment
                            </h3>

                            <p className="text-4xl font-bold text-gray-600 mt-2">
                                {
                                    orders -
                                    paidOrders
                                }
                            </p>

                        </div>

                        <div className="bg-blue-50 rounded-3xl shadow-lg p-8">

                            <div className="text-5xl">
                                📦
                            </div>

                            <h3 className="text-xl font-bold mt-4">
                                Active Orders
                            </h3>

                            <p className="text-4xl font-bold text-blue-600 mt-2">
                                {
                                    activeOrders
                                }
                            </p>

                        </div>

                    </div>

                    {/* Quick Actions */}

                    <h2 className="text-3xl font-bold mb-6 text-gray-800">
                        Quick Actions
                    </h2>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-14">

                        <Link
                            href="/admin/add-product"
                            className="bg-white rounded-3xl shadow-lg p-8 text-center hover:shadow-xl hover:-translate-y-1 transition"
                        >

                            <div className="text-5xl">
                                ➕
                            </div>

                            <h3 className="text-2xl font-bold mt-4">
                                Add Product
                            </h3>

                        </Link>

                        <Link
                            href="/admin/products"
                            className="bg-white rounded-3xl shadow-lg p-8 text-center hover:shadow-xl hover:-translate-y-1 transition"
                        >

                            <div className="text-5xl">
                                💎
                            </div>

                            <h3 className="text-2xl font-bold mt-4">
                                Products
                            </h3>

                        </Link>

                        <Link
                            href="/admin/orders"
                            className="bg-white rounded-3xl shadow-lg p-8 text-center hover:shadow-xl hover:-translate-y-1 transition"
                        >

                            <div className="text-5xl">
                                📋
                            </div>

                            <h3 className="text-2xl font-bold mt-4">
                                Orders
                            </h3>

                        </Link>

                        <Link
                            href="/admin/customers"
                            className="bg-white rounded-3xl shadow-lg p-8 text-center hover:shadow-xl hover:-translate-y-1 transition"
                        >

                            <div className="text-5xl">
                                👥
                            </div>

                            <h3 className="text-2xl font-bold mt-4">
                                Customers
                            </h3>

                        </Link>

                    </div>

                    {/* Recent Orders */}

                    <div className="bg-white rounded-3xl shadow-xl p-8 mb-12">

                        <div className="flex justify-between items-center mb-6">

                            <h2 className="text-3xl font-bold text-pink-700">
                                Recent Orders
                            </h2>

                            <Link
                                href="/admin/orders"
                                className="text-pink-600 font-semibold hover:underline"
                            >
                                View All →
                            </Link>

                        </div>

                        <div className="overflow-x-auto">

                            <table className="w-full">

                                <thead className="border-b">

                                <tr>

                                    <th className="text-left p-4">
                                        Order
                                    </th>

                                    <th className="text-left p-4">
                                        Customer
                                    </th>

                                    <th className="text-left p-4">
                                        Amount
                                    </th>

                                    <th className="text-left p-4">
                                        Payment
                                    </th>

                                    <th className="text-left p-4">
                                        Status
                                    </th>

                                </tr>

                                </thead>

                                <tbody>

                                {recentOrders.length ===
                                0 ? (

                                    <tr>

                                        <td
                                            colSpan={5}
                                            className="text-center py-8 text-gray-500"
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
                                                className="border-b hover:bg-pink-50"
                                            >

                                                <td className="p-4 font-bold">
                                                    #
                                                    {
                                                        order.id
                                                    }
                                                </td>

                                                <td className="p-4">
                                                    {
                                                        order.customer_name
                                                    }
                                                </td>

                                                <td className="p-4 font-bold text-green-600">
                                                    ₹
                                                    {
                                                        order.total
                                                    }
                                                </td>

                                                <td className="p-4">

                                                    {order.payment_status ===
                                                    "Paid" ? (

                                                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">
                                                                ✅ Paid
                                                            </span>

                                                    ) : (

                                                        <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-semibold">
                                                                🟡 Pending
                                                            </span>

                                                    )}

                                                </td>

                                                <td className="p-4">
                                                    {
                                                        order.status
                                                    }
                                                </td>

                                            </tr>

                                        )
                                    )

                                )}

                                </tbody>

                            </table>

                        </div>

                    </div>

                    {/* Low Stock Products */}

                    <div className="bg-white rounded-3xl shadow-xl p-8">

                        <h2 className="text-3xl font-bold text-red-600 mb-6">
                            ⚠️ Low Stock Products
                        </h2>

                        {lowStockProducts.length ===
                        0 ? (

                            <div className="text-center py-8 text-green-600 font-semibold">
                                ✅ All products are sufficiently stocked.
                            </div>

                        ) : (

                            <div className="space-y-4">

                                {lowStockProducts.map(
                                    (
                                        product
                                    ) => (

                                        <div
                                            key={
                                                product.id
                                            }
                                            className="flex justify-between items-center border rounded-2xl p-5 hover:bg-red-50"
                                        >

                                            <div>

                                                <h3 className="text-xl font-bold">
                                                    {
                                                        product.title
                                                    }
                                                </h3>

                                                <p className="text-gray-500">
                                                    Product ID: #
                                                    {
                                                        product.id
                                                    }
                                                </p>

                                            </div>

                                            <div className="text-right">

                                                <p className="text-red-600 text-2xl font-bold">
                                                    {
                                                        product.stock
                                                    }
                                                </p>

                                                <p className="text-gray-500">
                                                    Left in Stock
                                                </p>

                                            </div>

                                        </div>

                                    )
                                )}

                            </div>

                        )}

                    </div>

                </div>

            </section>

            <Footer />
        </>
    );
}