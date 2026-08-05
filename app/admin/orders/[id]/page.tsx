"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";import Navbar from "../../../../components/Navbar";
import Footer from "../../../../components/Footer";

type Order = {
    id: number;
    customer_name: string;
    phone: string;
    address: string;
    total: string;
    status: string;
    created_at?: string;
};

type OrderItem = {
    id: number;
    title: string;
    quantity: number;
    price: string;
};

export default function OrderDetails() {
    const { id } = useParams();

    const [order, setOrder] = useState<Order | null>(null);
    const [items, setItems] = useState<OrderItem[]>([]);
    const [status, setStatus] = useState("");

    useEffect(() => {
        loadOrder();
    }, []);

    async function loadOrder() {
        const { data: orderData } = await supabase
            .from("orders")
            .select("*")
            .eq("id", id)
            .single();

        if (orderData) {
            setOrder(orderData);
            setStatus(orderData.status || "Pending");
        }

        const { data: itemData } = await supabase
            .from("order_items")
            .select("*")
            .eq("order_id", id);

        if (itemData) {
            setItems(itemData);
        }
    }

    async function updateStatus() {
        const { data, error } = await supabase
            .from("orders")
            .update({ status })
            .eq("id", id)
            .select();

        console.log("ID:", id);
        console.log("Status:", status);
        console.log("Data:", data);
        console.log("Error:", error);

        if (error) {
            alert(error.message);
            return;
        }

        alert("Updated");
        loadOrder();
    }

    if (!order) {
        return (
            <>
                <Navbar />
                <section className="min-h-screen flex items-center justify-center text-2xl">
                    Loading Order...
                </section>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Navbar />

            <section className="min-h-screen bg-gradient-to-b from-pink-50 to-white py-16">
                <div className="max-w-6xl mx-auto px-6">

                    <div className="bg-white rounded-3xl shadow-xl p-10">

                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <h1 className="text-5xl font-bold text-pink-700">
                                    Order #{order.id}
                                </h1>

                                <p className="text-gray-500 mt-2">
                                    {order.created_at
                                        ? new Date(order.created_at).toLocaleString()
                                        : "Date unavailable"}
                                </p>
                            </div>

                            <div className="text-right">
                                <p className="text-gray-500">Order Total</p>

                                <h2 className="text-4xl font-bold text-green-600">
                                    ₹{order.total}
                                </h2>
                            </div>
                        </div>

                        <div className="grid lg:grid-cols-2 gap-8 mb-10">

                            <div className="bg-pink-50 rounded-2xl p-6">

                                <h2 className="text-2xl font-bold mb-5">
                                    Customer Details
                                </h2>

                                <div className="space-y-3">
                                    <p><strong>Name:</strong> {order.customer_name}</p>
                                    <p><strong>Phone:</strong> {order.phone}</p>
                                    <p><strong>Address:</strong> {order.address}</p>
                                </div>

                            </div>

                            <div className="bg-pink-50 rounded-2xl p-6">

                                <h2 className="text-2xl font-bold mb-5">
                                    Order Status
                                </h2>

                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full border rounded-xl p-3"
                                >
                                    <option>Pending</option>
                                    <option>Packed</option>
                                    <option>Shipped</option>
                                    <option>Delivered</option>
                                    <option>Cancelled</option>
                                </select>

                                <button
                                    onClick={updateStatus}
                                    className="w-full mt-5 bg-pink-600 text-white py-3 rounded-xl hover:bg-pink-700 transition"
                                >
                                    Save Status
                                </button>

                            </div>

                        </div>

                        <h2 className="text-3xl font-bold text-pink-700 mb-6">
                            Products Ordered
                        </h2>

                        <div className="space-y-5">

                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className="bg-white border rounded-2xl p-6 flex justify-between items-center"
                                >
                                    <div>
                                        <h3 className="text-xl font-bold">
                                            {item.title}
                                        </h3>

                                        <p className="text-gray-500 mt-2">
                                            Quantity : {item.quantity}
                                        </p>
                                    </div>

                                    <div className="text-2xl font-bold text-pink-700">
                                        {item.price}
                                    </div>

                                </div>
                            ))}

                        </div>

                    </div>

                </div>
            </section>

            <Footer />
        </>
    );
}