"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import JsBarcode from "jsbarcode";
import QRCode from "react-qr-code";

type Order = {
    id: number;
    customer_name: string;
    phone: string;
    address: string;
    total: string;
    status: string;
    created_at: string;
};

type OrderItem = {
    id: number;
    title: string;
    quantity: number;
    price: string;
};

export default function ShippingLabel() {
    const { id } = useParams<{ id: string }>();

    const [order, setOrder] = useState<Order | null>(null);
    const [items, setItems] = useState<OrderItem[]>([]);
    const [loading, setLoading] = useState(true);

    const barcodeRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        loadLabel();
    }, [id]);

    useEffect(() => {
        if (order && barcodeRef.current) {
            JsBarcode(
                barcodeRef.current,
                `APS${order.id}`,
                {
                    format: "CODE128",
                    width: 2.5,
                    height: 70,
                    displayValue: true,
                    fontSize: 14,
                    margin: 0,
                }
            );
        }
    }, [order]);

    async function loadLabel() {
        try {
            setLoading(true);

            const response = await fetch(
                "/api/invoice",
                {
                    method: "POST",

                    // Important:
                    // Send the logged-in admin session.
                    credentials: "include",

                    headers: {
                        "Content-Type": "application/json",
                    },

                    body: JSON.stringify({
                        orderId: Number(id),
                    }),
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                alert(
                    result.message ||
                    "Unable to load shipping label."
                );
                return;
            }

            setOrder(result.order);
            setItems(result.items ?? []);
        } catch (error) {
            console.error(
                "Shipping Label Error:",
                error
            );

            alert(
                "Unable to load shipping label."
            );
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <section className="min-h-screen flex items-center justify-center">
                <h2 className="text-2xl font-bold">
                    Loading Shipping Label...
                </h2>
            </section>
        );
    }

    if (!order) {
        return (
            <section className="min-h-screen flex items-center justify-center">
                <h2 className="text-2xl font-bold">
                    Order Not Found
                </h2>
            </section>
        );
    }

    return (
        <section className="min-h-screen bg-gray-200 flex items-center justify-center p-6 print:bg-white print:p-0">

            <div
                id="shipping-label"
                className="w-[4in] h-[4in] bg-white border-2 border-black overflow-hidden text-black flex flex-col p-3 print:border-0 print:shadow-none"
            >

                {/* Header */}

                <div className="flex justify-between items-start border-b-2 border-black pb-2">

                    <div>

                        <h1 className="text-lg font-extrabold tracking-wide">
                            APSRAA BY AVNI
                        </h1>

                        <p className="text-[10px]">
                            Premium Artificial Jewellery
                        </p>

                        <p className="text-[10px] mt-1">
                            Order #{order.id}
                        </p>

                        <p className="text-[10px]">
                            {new Date(
                                order.created_at
                            ).toLocaleDateString()}
                        </p>

                    </div>

                    <div className="bg-white p-1 border">

                        <QRCode
                            value={`APS-ORDER-${order.id}`}
                            size={58}
                        />

                    </div>

                </div>

                {/* Customer */}

                <div className="border border-black mt-2 p-2">

                    <p className="text-[10px] font-bold">
                        SHIP TO
                    </p>

                    <h2 className="text-sm font-extrabold mt-1 uppercase">
                        {order.customer_name}
                    </h2>

                    <p className="text-[11px] font-semibold">
                        {order.phone}
                    </p>

                    <p className="text-[10px] leading-4 mt-1">
                        {order.address}
                    </p>

                </div>

                {/* Return Address */}

                <div className="border border-black mt-2 p-2">

                    <p className="text-[10px] font-bold">
                        FROM
                    </p>

                    <p className="text-[10px] leading-4 mt-1">
                        APSRAA BY AVNI
                        <br />
                        L-1193, L Block
                        <br />
                        Shastri Nagar
                        <br />
                        Meerut, UP - 250004
                    </p>

                </div>

                {/* Products */}

                <div className="border border-black mt-2 p-2 flex-1">

                    <div className="flex justify-between font-bold text-[10px] mb-1">

                        <span>
                            PRODUCT
                        </span>

                        <span>
                            QTY
                        </span>

                    </div>

                    {items
                        .slice(0, 2)
                        .map((item) => (

                            <div
                                key={item.id}
                                className="flex justify-between text-[10px] mb-1"
                            >

                                <span className="truncate max-w-[170px]">
                                    {item.title}
                                </span>

                                <span>
                                    {item.quantity}
                                </span>

                            </div>

                        ))}

                </div>

                {/* Footer */}

                <div className="border border-black mt-2 p-2">

                    <div className="flex justify-between text-[11px]">

                        <span className="font-bold">
                            Total
                        </span>

                        <span className="font-bold">
                            ₹{order.total}
                        </span>

                    </div>

                    <div className="flex justify-between text-[11px] mt-1">

                        <span>
                            Status
                        </span>

                        <span className="font-bold uppercase">
                            {order.status}
                        </span>

                    </div>

                </div>

                {/* Barcode */}

                <div className="mt-2 border border-black p-2 flex justify-center">

                    <svg
                        ref={barcodeRef}
                        className="w-full"
                    />

                </div>

            </div>

            {/* Print Button */}

            <button
                onClick={() => window.print()}
                className="fixed bottom-8 right-8 bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-xl shadow-xl print:hidden"
            >
                🖨 Print Label
            </button>

        </section>
    );
}