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
            console.error("Invoice loading error:", error);
            alert("Unable to load invoice.");
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <>
                <div className="print:hidden">
                    <Navbar />
                </div>

                <section className="min-h-screen flex items-center justify-center p-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-center">
                        Loading Invoice...
                    </h2>
                </section>
            </>
        );
    }

    if (!order) {
        return (
            <>
                <div className="print:hidden">
                    <Navbar />
                </div>

                <section className="min-h-screen flex items-center justify-center p-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-center">
                        Invoice Not Found
                    </h2>
                </section>
            </>
        );
    }

    const subtotal = items.reduce(
        (sum, item) =>
            sum + Number(item.price) * item.quantity,
        0
    );

    const isPaid = order.payment_status === "Paid";

    return (
        <>
            {/* NAVBAR */}
            <div className="print:hidden">
                <Navbar />
            </div>

            {/* PAGE */}
            <main className="invoice-page bg-gray-100 min-h-screen py-4 sm:py-6 lg:py-10 px-2 sm:px-4">

                {/* INVOICE */}
                <div
                    id="invoice"
                    className="
                        invoice
                        mx-auto
                        w-full
                        max-w-5xl
                        bg-white
                        p-4
                        sm:p-6
                        lg:p-10
                        shadow-xl
                        sm:shadow-2xl
                        rounded-xl
                        sm:rounded-3xl
                    "
                >

                    {/* HEADER */}
                    <div
                        className="
                            flex
                            flex-col
                            sm:flex-row
                            justify-between
                            gap-5
                            sm:gap-8
                            items-start
                            border-b
                            pb-5
                            sm:pb-6
                        "
                    >

                        <div className="w-full sm:w-auto">

                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-pink-700">
                                APSRAA BY AVNI
                            </h1>

                            <p className="text-sm sm:text-base text-gray-500 mt-1">
                                Premium Artificial Jewellery
                            </p>

                            <p className="text-sm sm:text-base text-gray-500">
                                India
                            </p>

                        </div>

                        <div className="w-full sm:w-auto text-left sm:text-right">

                            <h2 className="text-2xl sm:text-3xl font-bold">
                                INVOICE
                            </h2>

                            <p className="mt-2 sm:mt-3 text-sm sm:text-base">
                                Invoice No:
                                <strong className="ml-2">
                                    #{order.id}
                                </strong>
                            </p>

                            <p className="text-sm sm:text-base">
                                Date:
                                <strong className="ml-2">
                                    {new Date(
                                        order.created_at
                                    ).toLocaleDateString()}
                                </strong>
                            </p>

                            <p className="text-sm sm:text-base">
                                Order Status:
                                <strong className="ml-2 text-pink-700">
                                    {order.status}
                                </strong>
                            </p>

                        </div>
                    </div>

                    {/* CUSTOMER */}
                    <div
                        className="
                            grid
                            grid-cols-1
                            lg:grid-cols-2
                            gap-5
                            sm:gap-7
                            lg:gap-8
                            mt-5
                            sm:mt-7
                        "
                    >

                        <div>

                            <h3 className="text-lg sm:text-xl font-bold mb-3">
                                Bill To
                            </h3>

                            <div className="space-y-1 text-sm sm:text-base">

                                <p>
                                    <strong>Name:</strong>{" "}
                                    {order.customer_name}
                                </p>

                                <p className="break-all">
                                    <strong>Email:</strong>{" "}
                                    {order.email || "-"}
                                </p>

                                <p>
                                    <strong>Phone:</strong>{" "}
                                    {order.phone}
                                </p>

                                <p>
                                    <strong>Address:</strong>
                                </p>

                                <p className="text-gray-600 whitespace-pre-line leading-5">
                                    {order.address}
                                </p>

                            </div>

                        </div>

                        <div className="flex justify-start lg:justify-end items-start">

                            <div className="bg-pink-50 rounded-xl p-4 sm:p-5 text-left sm:text-right w-full sm:w-auto">

                                <p className="text-sm sm:text-base text-gray-500">
                                    Total Amount
                                </p>

                                <h2 className="text-3xl sm:text-4xl font-bold text-green-600">
                                    ₹{order.total}
                                </h2>

                            </div>

                        </div>

                    </div>

                    {/* PAYMENT */}
                    <div className="mt-5 sm:mt-7 bg-green-50 border border-green-200 rounded-xl p-3 sm:p-5">

                        <div
                            className="
                                flex
                                flex-col
                                sm:flex-row
                                justify-between
                                gap-3
                                sm:items-center
                                mb-4
                            "
                        >

                            <h2 className="text-lg sm:text-xl font-bold text-green-700">
                                💳 Payment Details
                            </h2>

                            <span
                                className={
                                    isPaid
                                        ? "bg-green-100 text-green-700 px-4 py-2 rounded-full font-bold text-sm w-fit"
                                        : "bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full font-bold text-sm w-fit"
                                }
                            >
                                {isPaid
                                    ? "PAID"
                                    : order.payment_status ||
                                    "Payment Pending"}
                            </span>

                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">

                            <div className="bg-white border rounded-lg p-3">

                                <p className="text-gray-500 text-xs sm:text-sm">
                                    Razorpay Order ID
                                </p>

                                <p className="font-semibold text-sm break-all">
                                    {order.razorpay_order_id || "-"}
                                </p>

                            </div>

                            <div className="bg-white border rounded-lg p-3">

                                <p className="text-gray-500 text-xs sm:text-sm">
                                    Razorpay Payment ID
                                </p>

                                <p className="font-semibold text-sm break-all">
                                    {order.razorpay_payment_id || "-"}
                                </p>

                            </div>

                        </div>
                    </div>

                    {/* PRODUCTS */}
                    <div className="mt-5 sm:mt-7">

                        <h2 className="text-xl sm:text-2xl font-bold text-pink-700 mb-3">
                            Ordered Products
                        </h2>

                        {/* Desktop/tablet */}
                        <div className="hidden sm:block overflow-x-auto">

                            <table className="w-full border-collapse">

                                <thead>
                                <tr className="bg-pink-600 text-white">

                                    <th className="p-3 text-left">
                                        Product
                                    </th>

                                    <th className="p-3 text-center">
                                        Qty
                                    </th>

                                    <th className="p-3 text-right">
                                        Price
                                    </th>

                                    <th className="p-3 text-right">
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

                                        <td className="p-3">
                                            {item.title}
                                        </td>

                                        <td className="p-3 text-center">
                                            {item.quantity}
                                        </td>

                                        <td className="p-3 text-right">
                                            ₹{item.price}
                                        </td>

                                        <td className="p-3 text-right font-bold">
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

                        {/* Mobile */}
                        <div className="sm:hidden space-y-2">

                            {items.map((item) => (

                                <div
                                    key={item.id}
                                    className="border rounded-lg p-3"
                                >

                                    <p className="font-semibold text-sm">
                                        {item.title}
                                    </p>

                                    <div className="flex justify-between mt-2 text-sm">

                                        <span>
                                            Qty: {item.quantity}
                                        </span>

                                        <span>
                                            ₹{item.price} each
                                        </span>

                                    </div>

                                    <div className="flex justify-between mt-1 font-bold text-sm">

                                        <span>
                                            Item Total
                                        </span>

                                        <span>
                                            ₹
                                            {(
                                                Number(item.price) *
                                                item.quantity
                                            ).toFixed(2)}
                                        </span>

                                    </div>

                                </div>

                            ))}

                        </div>

                    </div>

                    {/* TOTAL */}
                    <div className="mt-5 sm:mt-6 flex justify-end">

                        <div className="w-full sm:w-80">

                            <div className="flex justify-between border-b py-2 text-sm sm:text-base">
                                <span>
                                    Subtotal
                                </span>

                                <span>
                                    ₹{subtotal.toFixed(2)}
                                </span>
                            </div>

                            <div className="flex justify-between border-b py-2 text-sm sm:text-base">
                                <span>
                                    Shipping
                                </span>

                                <span>
                                    ₹0.00
                                </span>
                            </div>

                            <div className="flex justify-between py-3 text-lg sm:text-xl font-bold text-green-600">
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

                    {/* BUTTONS */}
                    <div
                        className="
                            print-hidden-buttons
                            mt-6
                            sm:mt-8
                            flex
                            flex-col
                            sm:flex-row
                            justify-center
                            gap-3
                        "
                    >

                        <button
                            onClick={() =>
                                window.print()
                            }
                            className="
                                bg-pink-600
                                hover:bg-pink-700
                                text-white
                                px-6
                                sm:px-8
                                py-3
                                rounded-xl
                                font-bold
                                w-full
                                sm:w-auto
                            "
                        >
                            🖨 Print Invoice
                        </button>

                        <button
                            onClick={() =>
                                window.history.back()
                            }
                            className="
                                bg-gray-700
                                hover:bg-gray-800
                                text-white
                                px-6
                                sm:px-8
                                py-3
                                rounded-xl
                                font-bold
                                w-full
                                sm:w-auto
                            "
                        >
                            ← Back
                        </button>

                    </div>

                    {/* FOOTER */}
                    <div className="invoice-footer mt-6 sm:mt-8 border-t pt-4 sm:pt-5 text-center text-gray-500">

                        <p className="font-semibold text-sm sm:text-base">
                            Thank you for shopping with APSRAA BY AVNI ❤️
                        </p>

                        <p className="mt-1 text-sm">
                            Premium Artificial Jewellery
                        </p>

                        {isPaid && (
                            <p className="mt-2 text-green-600 font-semibold text-sm">
                                Payment received successfully.
                            </p>
                        )}

                    </div>

                </div>
            </main>

            {/* WEB FOOTER */}
            <div className="print:hidden">
                <Footer />
            </div>

            {/* PRINT CSS */}
            <style>{`
                @page {
                    size: A4;
                    margin: 10mm;
                }

                @media print {

                    html,
                    body {
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                    }

                    body * {
                        visibility: hidden;
                    }

                    #invoice,
                    #invoice * {
                        visibility: visible;
                    }

                    #invoice {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        max-width: none !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                        box-shadow: none !important;
                        border-radius: 0 !important;
                    }

                    .print-hidden-buttons {
                        display: none !important;
                    }

                    .invoice-footer {
                        margin-top: 10px !important;
                    }

                    table {
                        page-break-inside: auto;
                    }

                    tr {
                        page-break-inside: avoid;
                    }
                }
            `}</style>
        </>
    );
}