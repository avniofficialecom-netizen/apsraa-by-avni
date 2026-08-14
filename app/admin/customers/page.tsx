"use client";

import { useEffect, useState } from "react";
import AdminNavbar from "../../../components/AdminNavbar";
import Footer from "../../../components/Footer";

type Customer = {
    id: number;
    customer_name: string;
    email: string;
    phone: string;
    address: string;
    total: string;
    status: string;
    created_at: string;
};

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCustomers();
    }, []);

    async function loadCustomers() {
        try {
            setLoading(true);

            const response = await fetch("/api/admin/orders", {
                method: "GET",
                credentials: "include",
                cache: "no-store",
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                alert(result.message || "Unable to load customers.");
                return;
            }

            const orders: Customer[] = Array.isArray(result.orders)
                ? result.orders
                : [];

            // Remove duplicate customers using email/phone
            const uniqueCustomers = orders.reduce(
                (acc: Customer[], order: Customer) => {
                    const exists = acc.some(
                        (customer) =>
                            customer.email &&
                            order.email &&
                            customer.email.toLowerCase() ===
                            order.email.toLowerCase()
                    );

                    if (!exists) {
                        acc.push(order);
                    }

                    return acc;
                },
                []
            );

            setCustomers(uniqueCustomers);
        } catch (error) {
            console.error("Load Customers Error:", error);
            alert("Something went wrong while loading customers.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <AdminNavbar />

            <main className="min-h-screen bg-gradient-to-br from-pink-50 to-white py-12">
                <div className="max-w-7xl mx-auto px-6">

                    <div className="mb-10">
                        <p className="text-pink-600 font-semibold text-lg">
                            APSRAA ADMIN
                        </p>

                        <h1 className="text-5xl font-bold text-pink-700 mt-2">
                            Customers
                        </h1>

                        <p className="text-gray-500 mt-2">
                            Manage your customer information
                        </p>
                    </div>

                    <div className="bg-white rounded-3xl shadow-lg p-6 mb-8">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-gray-500">
                                    Total Customers
                                </p>

                                <h2 className="text-4xl font-bold text-pink-700 mt-2">
                                    {customers.length}
                                </h2>
                            </div>

                            <div className="w-16 h-16 rounded-2xl bg-purple-500 flex items-center justify-center text-3xl">
                                👥
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="bg-white rounded-3xl shadow-lg p-16 text-center">
                            <p className="text-xl text-gray-500">
                                Loading customers...
                            </p>
                        </div>
                    ) : customers.length === 0 ? (
                        <div className="bg-white rounded-3xl shadow-lg p-16 text-center">
                            <div className="text-6xl mb-6">
                                👥
                            </div>

                            <h2 className="text-3xl font-bold">
                                No Customers Found
                            </h2>

                            <p className="text-gray-500 mt-3">
                                Customers will appear here after orders are placed.
                            </p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

                            {customers.map((customer) => (
                                <div
                                    key={customer.id}
                                    className="bg-white rounded-3xl shadow-lg p-6 hover:shadow-xl transition"
                                >

                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-14 h-14 rounded-2xl bg-pink-100 flex items-center justify-center text-2xl">
                                            👤
                                        </div>

                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">
                                                {customer.customer_name}
                                            </h2>

                                            <p className="text-gray-400 text-sm">
                                                Customer
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">

                                        <div>
                                            <p className="text-xs uppercase text-gray-400">
                                                Email
                                            </p>

                                            <p className="text-gray-800 break-all">
                                                {customer.email || "Not provided"}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs uppercase text-gray-400">
                                                Phone
                                            </p>

                                            <p className="text-gray-800">
                                                {customer.phone || "Not provided"}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs uppercase text-gray-400">
                                                Address
                                            </p>

                                            <p className="text-gray-700">
                                                {customer.address || "Not provided"}
                                            </p>
                                        </div>

                                        <div className="border-t pt-4 flex justify-between">
                                            <div>
                                                <p className="text-xs uppercase text-gray-400">
                                                    Last Order
                                                </p>

                                                <p className="font-bold text-pink-700">
                                                    #{customer.id}
                                                </p>
                                            </div>

                                            <div className="text-right">
                                                <p className="text-xs uppercase text-gray-400">
                                                    Order Amount
                                                </p>

                                                <p className="font-bold text-green-600">
                                                    ₹{customer.total}
                                                </p>
                                            </div>
                                        </div>

                                    </div>

                                </div>
                            ))}

                        </div>
                    )}

                </div>
            </main>

            <Footer />
        </>
    );
}