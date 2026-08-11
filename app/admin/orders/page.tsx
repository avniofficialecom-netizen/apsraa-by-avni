"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
    payment_status?: string | null;
    created_at: string;
};

export default function OrdersPage() {
    const [orders, setOrders] =
        useState<Order[]>([]);

    const [loading, setLoading] =
        useState(true);

    useEffect(() => {
        loadOrders();
    }, []);

    // ==========================================
    // LOAD ORDERS THROUGH SECURE ADMIN API
    // ==========================================

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

            const result =
                await response.json();

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

    // ==========================================
    // UPDATE ORDER STATUS
    // ==========================================

    async function updateStatus(
        id: number,
        status: string
    ) {
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
                        body: JSON.stringify({
                            id,
                            status,
                        }),
                    }
                );

            const result =
                await response.json();

            if (!result.success) {
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
            console.error(error);

            alert(
                "Something went wrong while updating the order."
            );
        }
    }

    return (
        <>
            <Navbar />

            <section className="min-h-screen bg-gradient-to-b from-pink-50 to-white py-16">

                <div className="max-w-7xl mx-auto px-6">

                    <div className="flex justify-between items-center mb-10">

                        <div>

                            <h1 className="text-5xl font-bold text-pink-700">
                                Customer Orders
                            </h1>

                            <p className="text-gray-500 mt-2">
                                Manage all customer orders from one place.
                            </p>

                        </div>

                        <div className="bg-pink-600 text-white px-6 py-3 rounded-2xl shadow-lg">
                            Total Orders : {orders.length}
                        </div>

                    </div>

                    {loading ? (

                        <div className="text-center py-20 text-xl">
                            Loading Orders...
                        </div>

                    ) : orders.length === 0 ? (

                        <div className="bg-white rounded-3xl shadow-lg p-16 text-center">

                            <div className="text-6xl mb-6">
                                📦
                            </div>

                            <h2 className="text-3xl font-bold text-gray-700">
                                No Orders Found
                            </h2>

                            <p className="text-gray-500 mt-3">
                                Customer orders will appear here.
                            </p>

                        </div>

                    ) : (

                        <div className="overflow-x-auto bg-white rounded-3xl shadow-xl">

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

                                            <td className="p-5 max-w-xs truncate">
                                                {
                                                    order.address
                                                }
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

                                                {order.created_at
                                                    ? new Date(
                                                        order.created_at
                                                    ).toLocaleDateString()
                                                    : "-"}

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

                    )}

                </div>

            </section>

            <Footer />
        </>
    );
}