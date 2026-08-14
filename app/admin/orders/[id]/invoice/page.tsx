"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "../../../../../components/Navbar";
import Footer from "../../../../../components/Footer";

type Order = {
    id: number;
    customer_name: string;
    email: string;
    phone: string;
    address: string;
    total: string;
    status: string;
    payment_status?: string | null;
    razorpay_order_id?: string | null;
    razorpay_payment_id?: string | null;
    created_at: string;
};

type OrderItem = {
    id: number;
    title: string;
    quantity: number;
    price: string;
};

export default function InvoicePage() {
    const { id } = useParams();

    const [order, setOrder] = useState<Order | null>(null);
    const [items, setItems] = useState<OrderItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadInvoice();
    }, [id]);

    async function loadInvoice() {
        try {
            const response = await fetch("/api/invoice", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    orderId: Number(id),
                }),
            });

            const result = await response.json();

            if (!result.success) {
                alert(result.message);
                return;
            }

            setOrder(result.order);
            setItems(result.items ?? []);
        } catch (error) {
            console.error(error);
            alert("Unable to load invoice.");
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <>
                <Navbar />

                <section className="min-h-screen flex items-center justify-center text-2xl">
                    Loading Invoice...
                </section>

                <div className="print:hidden">
                    <Footer />
                </div>
            </>
        );
    }

    if (!order) {
        return (
            <>
                <Navbar />

                <section className="min-h-screen flex items-center justify-center text-2xl">
                    Invoice Not Found
                </section>

                <Footer />
            </>
        );
    }

    const subtotal = items.reduce(
        (sum, item) =>
            sum +
            Number(item.price) * item.quantity,
        0
    );

    const isPaid = order.payment_status === "Paid";

    return (
        <>
            <Navbar />

            <section className="min-h-screen bg-gray-100 py-10 print:bg-white print:py-0">

                <div
                    id="invoice"
                    className="max-w-5xl mx-auto bg-white shadow-2xl rounded-3xl p-10 print:shadow-none print:rounded-none print:max-w-full print:p-8"
                >

                    {/* ==============================
                        HEADER
                    ============================== */}

                    <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b pb-8">

                        <div>

                            <h1 className="text-5xl font-bold text-pink-700">
                                APSRAA BY AVNI
                            </h1>

                            <p className="text-gray-500 mt-2">
                                Premium Artificial Jewellery
                            </p>

                            <p className="text-gray-500">
                                India
                            </p>

                        </div>

                        <div className="text-left md:text-right">

                            <h2 className="text-4xl font-bold">
                                INVOICE
                            </h2>

                            <p className="mt-4">
                                Invoice No:
                                <strong className="ml-2">
                                    #{order.id}
                                </strong>
                            </p>

                            <p className="mt-2">
                                Date:
                                <strong className="ml-2">
                                    {new Date(
                                        order.created_at
                                    ).toLocaleDateString()}
                                </strong>
                            </p>

                            <p className="mt-2">
                                Order Status:
                                <strong className="ml-2 text-pink-700">
                                    {order.status}
                                </strong>
                            </p>

                        </div>

                    </div>

                    {/* ==============================
                        CUSTOMER DETAILS
                    ============================== */}

                    <div className="grid md:grid-cols-2 gap-10 mt-10">

                        <div>

                            <h3 className="text-2xl font-bold mb-4">
                                Bill To
                            </h3>

                            <p>
                                <strong>Name:</strong>{" "}
                                {order.customer_name}
                            </p>

                            <p className="mt-2">
                                <strong>Email:</strong>{" "}
                                {order.email || "-"}
                            </p>

                            <p className="mt-2">
                                <strong>Phone:</strong>{" "}
                                {order.phone}
                            </p>

                            <p className="mt-2">
                                <strong>Address:</strong>
                            </p>

                            <p className="text-gray-600 mt-1 whitespace-pre-line">
                                {order.address}
                            </p>

                        </div>

                        <div className="flex items-end justify-end">

                            <div className="bg-pink-50 rounded-2xl p-6 text-right">

                                <p className="text-gray-500">
                                    Total Amount
                                </p>

                                <h2 className="text-5xl font-bold text-green-600 mt-2">
                                    ₹{order.total}
                                </h2>

                            </div>

                        </div>

                    </div>

                    {/* ==============================
                        PAYMENT DETAILS
                    ============================== */}

                    <div className="mt-10 bg-green-50 border border-green-200 rounded-2xl p-6">

                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">

                            <h2 className="text-2xl font-bold text-green-700">
                                💳 Payment Details
                            </h2>

                            <span
                                className={`inline-block px-5 py-2 rounded-full font-bold ${
                                    isPaid
                                        ? "bg-green-100 text-green-700"
                                        : "bg-yellow-100 text-yellow-700"
                                }`}
                            >
                                {isPaid
                                    ? "✅ PAID"
                                    : `🟡 ${
                                        order.payment_status ||
                                        "Payment Pending"
                                    }`}
                            </span>

                        </div>

                        <div className="grid md:grid-cols-2 gap-5">

                            <div className="bg-white rounded-xl border p-4">

                                <p className="text-gray-500 text-sm">
                                    Razorpay Order ID
                                </p>

                                <p className="font-semibold mt-1 break-all">
                                    {order.razorpay_order_id || "-"}
                                </p>

                            </div>

                            <div className="bg-white rounded-xl border p-4">

                                <p className="text-gray-500 text-sm">
                                    Razorpay Payment ID
                                </p>

                                <p className="font-semibold mt-1 break-all">
                                    {order.razorpay_payment_id || "-"}
                                </p>

                            </div>

                        </div>

                    </div>

                    {/* ==============================
                        PRODUCTS
                    ============================== */}

                    <div className="mt-12">

                        <h2 className="text-3xl font-bold text-pink-700 mb-6">
                            Ordered Products
                        </h2>

                        <div className="overflow-x-auto">

                            <table className="w-full border rounded-2xl overflow-hidden">

                                <thead className="bg-pink-600 text-white">

                                <tr>

                                    <th className="p-4 text-left">
                                        Product
                                    </th>

                                    <th className="p-4 text-center">
                                        Qty
                                    </th>

                                    <th className="p-4 text-right">
                                        Price
                                    </th>

                                    <th className="p-4 text-right">
                                        Total
                                    </th>

                                </tr>

                                </thead>

                                <tbody>

                                {items.map((item) => (

                                    <tr
                                        key={item.id}
                                        className="border-b"
                                    >

                                        <td className="p-4">
                                            {item.title}
                                        </td>

                                        <td className="p-4 text-center">
                                            {item.quantity}
                                        </td>

                                        <td className="p-4 text-right">
                                            ₹{item.price}
                                        </td>

                                        <td className="p-4 text-right font-bold">
                                            ₹
                                            {(
                                                Number(item.price) *
                                                item.quantity
                                            ).toFixed(2)}
                                        </td>

                                    </tr>

                                ))}

                                </tbody>

                            </table>

                        </div>

                    </div>

                    {/* ==============================
                        TOTALS
                    ============================== */}

                    <div className="mt-10 flex justify-end">

                        <div className="w-full max-w-md">

                            <div className="flex justify-between py-3 border-b">

                                <span className="font-semibold">
                                    Subtotal
                                </span>

                                <span>
                                    ₹{subtotal.toFixed(2)}
                                </span>

                            </div>

                            <div className="flex justify-between py-3 border-b">

                                <span className="font-semibold">
                                    Shipping
                                </span>

                                <span>
                                    ₹0.00
                                </span>

                            </div>

                            <div className="flex justify-between py-4 text-2xl font-bold text-green-600">

                                <span>
                                    Grand Total
                                </span>

                                <span>
                                    ₹
                                    {Number(
                                        order.total
                                    ).toFixed(2)}
                                </span>

                            </div>

                        </div>

                    </div>

                    {/* ==============================
                        BUTTONS
                    ============================== */}

                    <div className="mt-14 flex flex-wrap gap-4 justify-center print:hidden">

                        <button
                            onClick={() => window.print()}
                            className="bg-pink-600 hover:bg-pink-700 text-white px-8 py-4 rounded-2xl text-lg font-bold transition"
                        >
                            🖨 Print Invoice
                        </button>

                        <button
                            onClick={() => window.history.back()}
                            className="bg-gray-700 hover:bg-gray-800 text-white px-8 py-4 rounded-2xl text-lg font-bold transition"
                        >
                            ← Back
                        </button>

                    </div>

                    {/* ==============================
                        FOOTER
                    ============================== */}

                    <div className="mt-16 border-t pt-8 text-center text-gray-500">

                        <p className="font-semibold">
                            Thank you for shopping with APSRAA BY AVNI ❤️
                        </p>

                        <p className="mt-2">
                            Premium Artificial Jewellery
                        </p>

                        {isPaid && (
                            <p className="mt-3 text-green-600 font-semibold">
                                Payment received successfully.
                            </p>
                        )}

                    </div>

                </div>

            </section>

            <div className="print:hidden">
                <Footer />
            </div>
        </>
    );
}