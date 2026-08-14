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
        if (!order || !barcodeRef.current) return;

        JsBarcode(
            barcodeRef.current,
            `APS${order.id}`,
            {
                format: "CODE128",
                width: 2,
                height: 38,
                displayValue: true,
                fontSize: 10,
                margin: 0,
            }
        );
    }, [order]);

    async function loadLabel() {
        try {
            setLoading(true);

            const response = await fetch(
                "/api/invoice",
                {
                    method: "POST",
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
            setItems(result.items || []);
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
            <section className="min-h-screen flex items-center justify-center p-4">
                <h2 className="text-xl font-bold">
                    Loading Shipping Label...
                </h2>
            </section>
        );
    }

    if (!order) {
        return (
            <section className="min-h-screen flex items-center justify-center p-4">
                <h2 className="text-xl font-bold">
                    Order Not Found
                </h2>
            </section>
        );
    }

    return (
        <section className="min-h-screen bg-gray-200 flex flex-col items-center justify-center gap-6 p-4 print:bg-white print:p-0">

            {/* SHIPPING LABEL */}

            <div
                id="shipping-label"
                className="
                    shipping-label
                    w-full
                    max-w-[400px]
                    aspect-square
                    bg-white
                    border-2
                    border-black
                    text-black
                    overflow-hidden
                    flex
                    flex-col
                    p-2
                "
            >

                {/* HEADER */}

                <div className="flex justify-between items-start border-b-2 border-black pb-1 shrink-0">

                    <div className="min-w-0">

                        <h1 className="text-base font-extrabold">
                            APSRAA BY AVNI
                        </h1>

                        <p className="text-[8px]">
                            Premium Artificial Jewellery
                        </p>

                        <p className="text-[8px]">
                            Order #{order.id}
                        </p>

                        <p className="text-[8px]">
                            {new Date(
                                order.created_at
                            ).toLocaleDateString()}
                        </p>

                    </div>

                    <div className="border p-0.5 shrink-0">

                        <QRCode
                            value={`APS-ORDER-${order.id}`}
                            size={46}
                        />

                    </div>

                </div>

                {/* SHIP TO */}

                <div className="border border-black mt-1.5 p-1.5 shrink-0">

                    <p className="text-[8px] font-bold">
                        SHIP TO
                    </p>

                    <h2 className="text-xs font-extrabold uppercase">
                        {order.customer_name}
                    </h2>

                    <p className="text-[9px] font-semibold">
                        {order.phone}
                    </p>

                    <p className="text-[8px] leading-3">
                        {order.address}
                    </p>

                </div>

                {/* FROM */}

                <div className="border border-black mt-1.5 p-1.5 shrink-0">

                    <p className="text-[8px] font-bold">
                        FROM
                    </p>

                    <p className="text-[8px] leading-3">
                        APSRAA BY AVNI
                        <br />
                        L-1193, L Block
                        <br />
                        Shastri Nagar
                        <br />
                        Meerut, UP - 250004
                    </p>

                </div>

                {/* PRODUCTS */}

                <div className="border border-black mt-1.5 p-1.5 h-[55px] shrink-0 overflow-hidden">

                    <div className="flex justify-between text-[8px] font-bold border-b border-black pb-0.5">

                        <span>
                            PRODUCT
                        </span>

                        <span>
                            QTY
                        </span>

                    </div>

                    {items.slice(0, 3).map((item) => (

                        <div
                            key={item.id}
                            className="flex justify-between gap-2 text-[8px] leading-3 mt-0.5"
                        >

                            <span className="truncate">
                                {item.title}
                            </span>

                            <span className="font-bold shrink-0">
                                {item.quantity}
                            </span>

                        </div>

                    ))}

                </div>

                {/* TOTAL + STATUS */}

                <div className="border border-black mt-1.5 p-1.5 shrink-0">

                    <div className="flex justify-between text-[9px]">

                        <span className="font-bold">
                            TOTAL
                        </span>

                        <span className="font-bold">
                            ₹{order.total}
                        </span>

                    </div>

                    <div className="flex justify-between text-[9px] mt-0.5">

                        <span>
                            STATUS
                        </span>

                        <span className="font-bold uppercase">
                            {order.status}
                        </span>

                    </div>

                </div>

                {/* BARCODE */}

                <div className="border border-black mt-1.5 p-0.5 h-[54px] shrink-0 flex justify-center items-center">

                    <svg
                        ref={barcodeRef}
                        className="w-full max-w-[220px]"
                    />

                </div>

            </div>

            {/* PRINT BUTTON */}

            <button
                onClick={() => window.print()}
                className="
                    bg-pink-600
                    hover:bg-pink-700
                    text-white
                    px-7
                    py-3
                    rounded-xl
                    shadow-xl
                    font-semibold
                    print:hidden
                "
            >
                🖨 Print Label
            </button>

            {/* PRINT CSS */}

            <style>{`
                @page {
                    size: 4in 4in;
                    margin: 0;
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

                    #shipping-label,
                    #shipping-label * {
                        visibility: visible;
                    }

                    #shipping-label {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 4in !important;
                        height: 4in !important;
                        max-width: none !important;
                        aspect-ratio: auto !important;
                        margin: 0 !important;
                        padding: 0.10in !important;
                        border: 2px solid black !important;
                        box-sizing: border-box !important;
                    }
                }
            `}</style>

        </section>
    );
}