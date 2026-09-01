"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

type TrackingEvent = {
    id: number;
    awb_number: string | null;
    courier_name: string | null;
    current_status: string | null;
    activity: string | null;
    location: string | null;
    event_timestamp: string | null;
    etd: string | null;
};

type OrderData = {
    id: number;
    customer_name: string;
    total: number | string;
    status: string | null;
    created_at: string;
    payment_method: string | null;
    payment_status: string | null;
    shipping_status: string | null;
    shipment_id: number | null;
    awb_number: string | null;
    courier_name: string | null;
    tracking_url: string | null;
    delivered_at: string | null;
};

type TrackingResponse = {
    success: boolean;
    message?: string;
    order?: OrderData;
    events?: TrackingEvent[];
};

type CancelResponse = {
    success: boolean;
    message?: string;
    refundRequired?: boolean;
    refund?: {
        id?: string;
        status?: string;
        amount?: number;
        currency?: string;
    };
    order?: {
        id?: number;
        status?: string;
        payment_status?: string;
    };
};

const steps = [
    {
        key: "created",
        label: "Order confirmed",
        description: "We've received your order.",
    },
    {
        key: "awb_assigned",
        label: "Packed & ready",
        description: "Your parcel is being prepared.",
    },
    {
        key: "picked_up",
        label: "Picked up",
        description: "Your parcel is with the courier.",
    },
    {
        key: "in_transit",
        label: "On the way",
        description: "Your APSRAA piece is travelling to you.",
    },
    {
        key: "out_for_delivery",
        label: "Out for delivery",
        description: "Your order is almost with you.",
    },
    {
        key: "delivered",
        label: "Delivered",
        description: "Enjoy your APSRAA jewellery.",
    },
];

function normalizeStatus(
    status: string | null | undefined
) {
    return String(status || "")
        .toLowerCase()
        .replace(/\s+/g, "_")
        .trim();
}

function getStepIndex(
    shippingStatus: string | null | undefined
) {
    const status =
        normalizeStatus(shippingStatus);

    if (status === "delivered") return 5;
    if (status === "out_for_delivery") return 4;
    if (status === "in_transit") return 3;
    if (status === "picked_up") return 2;
    if (status === "awb_assigned") return 1;

    if (
        status === "cancelled" ||
        status === "rto" ||
        status === "delayed"
    ) {
        return -1;
    }

    return 0;
}

function formatStatus(
    status: string | null | undefined
) {
    if (!status) {
        return "Order confirmed";
    }

    const normalized =
        normalizeStatus(status);

    if (normalized === "confirmed") {
        return "Confirmed";
    }

    if (normalized === "created") {
        return "Confirmed";
    }

    if (normalized === "awb_assigned") {
        return "Packed & ready";
    }

    if (normalized === "picked_up") {
        return "Picked up";
    }

    if (normalized === "in_transit") {
        return "On the way";
    }

    if (normalized === "out_for_delivery") {
        return "Out for delivery";
    }

    if (normalized === "delivered") {
        return "Delivered";
    }

    if (normalized === "cancelled") {
        return "Cancelled";
    }

    if (normalized === "paid") {
        return "Paid";
    }

    if (normalized === "refunded") {
        return "Refunded";
    }

    return status
        .replace(/_/g, " ")
        .replace(
            /\b\w/g,
            (letter) => letter.toUpperCase()
        );
}

function formatDate(
    value: string | null | undefined
) {
    if (!value) return "";

    const date = new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return value;
    }

    return date.toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }
    );
}

function formatShortDate(
    value: string | null | undefined
) {
    if (!value) return "";

    const date = new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return value;
    }

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }
    );
}

function money(
    value: number | string
) {
    const amount =
        Number(value);

    return `₹${(
        Number.isFinite(amount)
            ? amount
            : 0
    ).toLocaleString(
        "en-IN",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }
    )}`;
}

export default function TrackOrderPage() {
    const [orderId, setOrderId] =
        useState("");

    const [phone, setPhone] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [result, setResult] =
        useState<TrackingResponse | null>(
            null
        );

    const [cancelling, setCancelling] =
        useState(false);

    const [cancelError, setCancelError] =
        useState("");

    const [cancelSuccess, setCancelSuccess] =
        useState("");

    const [showCancelConfirm, setShowCancelConfirm] =
        useState(false);

    async function fetchOrder(
        cleanOrderId: string,
        cleanPhone: string
    ) {
        const response =
            await fetch(
                `/api/track-order?orderId=${encodeURIComponent(
                    cleanOrderId
                )}&phone=${encodeURIComponent(
                    cleanPhone
                )}`,
                {
                    method: "GET",
                    cache: "no-store",
                }
            );

        const data =
            (await response.json()) as TrackingResponse;

        if (
            !response.ok ||
            !data.success
        ) {
            throw new Error(
                data.message ||
                    "We couldn't find that order."
            );
        }

        return data;
    }

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setError("");
        setCancelError("");
        setCancelSuccess("");
        setResult(null);

        const cleanOrderId =
            orderId.trim();

        const cleanPhone =
            phone.replace(
                /\D/g,
                ""
            );

        if (!cleanOrderId) {
            setError(
                "Please enter your order number."
            );
            return;
        }

        if (!cleanPhone) {
            setError(
                "Please enter the phone number used during checkout."
            );
            return;
        }

        setLoading(true);

        try {
            const data =
                await fetchOrder(
                    cleanOrderId,
                    cleanPhone
                );

            setResult(data);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to track your order right now."
            );
        } finally {
            setLoading(false);
        }
    }

    async function handleCancelOrder() {
        if (
            cancelling ||
            !order
        ) {
            return;
        }

        setCancelError("");
        setCancelSuccess("");
        setCancelling(true);

        try {
            const response =
                await fetch(
                    "/api/cancel-order",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body:
                            JSON.stringify({
                                orderId:
                                    order.id,
                                phone:
                                    phone,
                                reason:
                                    "Customer requested cancellation.",
                            }),
                        cache:
                            "no-store",
                    }
                );

            const data =
                (await response.json()) as CancelResponse;

            if (
                !response.ok ||
                !data.success
            ) {
                throw new Error(
                    data.message ||
                        "Unable to cancel this order."
                );
            }

            setShowCancelConfirm(
                false
            );

            setCancelSuccess(
                data.refundRequired
                    ? "Your order has been cancelled and your refund has been initiated."
                    : "Your order has been cancelled successfully."
            );

            // Refresh the order so the page
            // immediately shows Cancelled.
            const refreshed =
                await fetchOrder(
                    order.id.toString(),
                    phone.replace(
                        /\D/g,
                        ""
                    )
                );

            setResult(
                refreshed
            );
        } catch (err) {
            setCancelError(
                err instanceof Error
                    ? err.message
                    : "Unable to cancel this order."
            );
        } finally {
            setCancelling(false);
        }
    }

    const order =
        result?.order || null;

    const events =
        result?.events || [];

    const currentStep =
        getStepIndex(
            order?.shipping_status
        );

    const latestEvent =
        events.length > 0
            ? events[0]
            : null;

    const normalizedOrderStatus =
        normalizeStatus(
            order?.status
        );

    const normalizedShippingStatus =
        normalizeStatus(
            order?.shipping_status
        );

    const isCancelled =
        normalizedOrderStatus ===
            "cancelled" ||
        normalizedShippingStatus ===
            "cancelled";

    const isDelivered =
        normalizedShippingStatus ===
        "delivered";

    const shipmentStarted =
        Boolean(
            order?.shipment_id ||
            order?.awb_number
        ) ||
        [
            "awb_assigned",
            "picked_up",
            "in_transit",
            "out_for_delivery",
            "delivered",
            "rto",
            "rto_received",
            "shipped",
        ].includes(
            normalizedShippingStatus
        );

    // Customer cancellation is allowed only before shipping starts.
    // Some newly-created paid orders are stored as `paid`/`created`
    // while the customer-facing shipping status is still `pending`.
    // Use the shipping status as the source of truth for the
    // pre-shipping window, while still allowing the normal order
    // statuses.
    const preShippingOrder =
        [
            "pending",
            "confirmed",
            "created",
            "paid",
        ].includes(
            normalizedOrderStatus
        );

    const preShippingStatus =
        [
            "",
            "pending",
            "created",
            "confirmed",
        ].includes(
            normalizedShippingStatus
        );

    const canCancel =
        !isCancelled &&
        !isDelivered &&
        !shipmentStarted &&
        preShippingOrder &&
        preShippingStatus;

    return (
        <>
            <Navbar />

            <main className="min-h-screen bg-[#fbf8f6] text-[#292624]">
                {/* HERO */}
                <section className="border-b border-[#eee4e9] bg-[#fff8fb]">
                    <div className="mx-auto max-w-[1400px] px-5 py-14 sm:px-8 md:py-20 lg:px-12">
                        <div className="max-w-3xl">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#b80062]">
                                APSRAA BY AVNI
                            </p>

                            <h1 className="mt-4 text-4xl font-semibold leading-[1.02] tracking-[-0.045em] text-[#182033] sm:text-5xl md:text-6xl">
                                Your order,
                                <br />
                                <span className="text-[#b80062]">
                                    beautifully tracked.
                                </span>
                            </h1>

                            <p className="mt-5 max-w-2xl text-sm leading-7 text-[#77716d] sm:text-base">
                                Follow your APSRAA piece from our hands to
                                yours. Enter the order number and phone
                                number used at checkout.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
                    <div className="mx-auto grid max-w-[1200px] gap-8 lg:grid-cols-[360px_minmax(0,1fr)]">

                        {/* SEARCH */}
                        <aside className="h-fit lg:sticky lg:top-24">
                            <div className="border border-[#eadfe5] bg-white p-6 shadow-[0_20px_70px_rgba(30,20,30,0.05)] sm:p-7">

                                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#b80062]">
                                    Find your order
                                </p>

                                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[#182033]">
                                    Where is it now?
                                </h2>

                                <p className="mt-3 text-sm leading-6 text-[#77716d]">
                                    Use the details from your checkout to
                                    securely view your order status.
                                </p>

                                <form
                                    onSubmit={
                                        handleSubmit
                                    }
                                    className="mt-7 space-y-5"
                                >
                                    <label className="block">
                                        <span className="mb-2 block text-xs font-semibold text-[#292624]">
                                            Order number
                                        </span>

                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={orderId}
                                            onChange={(event) =>
                                                setOrderId(
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Example: 86"
                                            className="w-full border border-[#dcd3d7] bg-white px-4 py-3.5 text-sm text-[#292624] outline-none transition placeholder:text-[#aaa3a0] focus:border-[#b80062] focus:ring-1 focus:ring-[#b80062]"
                                        />
                                    </label>

                                    <label className="block">
                                        <span className="mb-2 block text-xs font-semibold text-[#292624]">
                                            Phone number
                                        </span>

                                        <input
                                            type="tel"
                                            inputMode="numeric"
                                            maxLength={10}
                                            value={phone}
                                            onChange={(event) =>
                                                setPhone(
                                                    event.target.value
                                                        .replace(
                                                            /\D/g,
                                                            ""
                                                        )
                                                        .slice(
                                                            0,
                                                            10
                                                        )
                                                )
                                            }
                                            placeholder="10-digit phone number"
                                            className="w-full border border-[#dcd3d7] bg-white px-4 py-3.5 text-sm text-[#292624] outline-none transition placeholder:text-[#aaa3a0] focus:border-[#b80062] focus:ring-1 focus:ring-[#b80062]"
                                        />
                                    </label>

                                    {error && (
                                        <div className="border border-[#f0c9d8] bg-[#fff4f8] px-4 py-3 text-sm leading-5 text-[#a00054]">
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={
                                            loading
                                        }
                                        className="flex w-full items-center justify-center bg-[#b80062] px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#182033] disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {loading
                                            ? "Finding your order…"
                                            : "Track my order →"}
                                    </button>
                                </form>

                                <div className="mt-6 border-t border-[#eee4e9] pt-5">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#292624]">
                                        Need help?
                                    </p>

                                    <p className="mt-2 text-xs leading-5 text-[#8a8380]">
                                        Keep your order number handy when
                                        contacting APSRAA support.
                                    </p>
                                </div>
                            </div>

                            <Link
                                href="/shop"
                                className="mt-4 flex items-center justify-center border border-[#dcd3d7] bg-white px-5 py-3.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#55504d] transition hover:border-[#b80062] hover:text-[#b80062]"
                            >
                                Continue shopping
                            </Link>
                        </aside>

                        {/* RESULT */}
                        <div>
                            {!order ? (
                                <div className="flex min-h-[420px] items-center justify-center border border-[#eadfe5] bg-white px-6 py-14 text-center">
                                    <div className="max-w-md">
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fff0f6] text-xl text-[#b80062]">
                                            →
                                        </div>

                                        <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#b80062]">
                                            Order tracking
                                        </p>

                                        <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[#182033]">
                                            Your journey starts here.
                                        </h2>

                                        <p className="mt-3 text-sm leading-6 text-[#77716d]">
                                            Enter your order details and
                                            we'll show you exactly where
                                            your APSRAA order stands.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-5">

                                    {/* ORDER HEADER */}
                                    <div className="border border-[#eadfe5] bg-white p-6 shadow-[0_20px_70px_rgba(30,20,30,0.05)] sm:p-8">
                                        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                                            <div>
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#b80062]">
                                                    Your APSRAA order
                                                </p>

                                                <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-2">
                                                    <h2 className="text-3xl font-semibold tracking-[-0.04em] text-[#182033]">
                                                        #{order.id}
                                                    </h2>

                                                    <span
                                                        className={`mb-1 inline-flex px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.15em] ${
                                                            isCancelled
                                                                ? "bg-[#fff0f0] text-[#b42318]"
                                                                : isDelivered
                                                                    ? "bg-[#eefaf3] text-[#16834a]"
                                                                    : "bg-[#fff0f6] text-[#b80062]"
                                                        }`}
                                                    >
                                                        {isCancelled
                                                            ? "Cancelled"
                                                            : isDelivered
                                                                ? "Delivered"
                                                                : formatStatus(
                                                                      order.shipping_status
                                                                  )}
                                                    </span>
                                                </div>

                                                <p className="mt-2 text-xs text-[#8a8380]">
                                                    Ordered on{" "}
                                                    {formatDate(
                                                        order.created_at
                                                    )}
                                                </p>
                                            </div>

                                            <div className="sm:text-right">
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a8380]">
                                                    Order total
                                                </p>

                                                <p className="mt-2 text-2xl font-semibold text-[#b80062]">
                                                    {money(
                                                        order.total
                                                    )}
                                                </p>

                                                <p className="mt-1 text-xs text-[#8a8380]">
                                                    {String(
                                                        order.payment_method ||
                                                            ""
                                                    ).toLowerCase() ===
                                                    "cod"
                                                        ? "Cash on delivery"
                                                        : "Paid online"}
                                                </p>
                                            </div>
                                        </div>

                                        {/* CANCEL ORDER */}
                                        {canCancel && (
                                            <div className="mt-7 border-t border-[#eee4e9] pt-6">
                                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                                    <div>
                                                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b80062]">
                                                            Need to change your plans?
                                                        </p>

                                                        <p className="mt-1 text-xs leading-5 text-[#8a8380]">
                                                            You can cancel this order
                                                            before it enters shipping.
                                                        </p>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setShowCancelConfirm(
                                                                true
                                                            )
                                                        }
                                                        disabled={
                                                            cancelling
                                                        }
                                                        className="inline-flex items-center justify-center border border-[#b42318] bg-white px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#b42318] transition hover:bg-[#b42318] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        Cancel Order
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* SUCCESS */}
                                    {cancelSuccess && (
                                        <div className="border border-[#cfe8da] bg-[#f3fbf6] p-5 text-sm leading-6 text-[#167a45]">
                                            {cancelSuccess}
                                        </div>
                                    )}

                                    {/* CANCEL ERROR */}
                                    {cancelError && (
                                        <div className="border border-[#f0c9d8] bg-[#fff4f8] p-5 text-sm leading-6 text-[#a00054]">
                                            {cancelError}
                                        </div>
                                    )}

                                    {/* CANCEL CONFIRMATION */}
                                    {showCancelConfirm && (
                                        <div className="border border-[#f0c9c9] bg-[#fff7f7] p-6 sm:p-8">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#b42318]">
                                                Confirm cancellation
                                            </p>

                                            <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#292624]">
                                                Cancel order #{order.id}?
                                            </h3>

                                            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#77716d]">
                                                This action cannot be undone.
                                                {String(
                                                    order.payment_method ||
                                                        ""
                                                ).toLowerCase() ===
                                                "cod"
                                                    ? " Your COD order will simply be cancelled."
                                                    : " Your online payment will be refunded through Razorpay after cancellation is processed."}
                                            </p>

                                            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                                                <button
                                                    type="button"
                                                    onClick={
                                                        handleCancelOrder
                                                    }
                                                    disabled={
                                                        cancelling
                                                    }
                                                    className="inline-flex items-center justify-center bg-[#b42318] px-6 py-3.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#8f1c13] disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {cancelling
                                                        ? "Cancelling…"
                                                        : "Yes, cancel order"}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setShowCancelConfirm(
                                                            false
                                                        )
                                                    }
                                                    disabled={
                                                        cancelling
                                                    }
                                                    className="inline-flex items-center justify-center border border-[#dcd3d7] bg-white px-6 py-3.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#55504d] transition hover:border-[#292624] hover:text-[#292624] disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    Keep my order
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* CANCELLED */}
                                    {isCancelled ? (
                                        <div className="border border-[#f0c9c9] bg-[#fff7f7] p-6 sm:p-8">
                                            <div className="flex gap-4">
                                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-lg text-[#b42318]">
                                                    ×
                                                </div>

                                                <div>
                                                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#b42318]">
                                                        Order cancelled
                                                    </p>

                                                    <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#292624]">
                                                        This order won't be shipped.
                                                    </h3>

                                                    <p className="mt-3 max-w-2xl text-sm leading-6 text-[#77716d]">
                                                        Your order has been
                                                        cancelled. If a payment
                                                        was collected, the refund
                                                        follows the refund status
                                                        shown by your payment
                                                        provider.
                                                    </p>

                                                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                                        <div className="border border-[#eadfe5] bg-white p-4">
                                                            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8a8380]">
                                                                Payment
                                                            </p>

                                                            <p className="mt-2 text-sm font-medium text-[#292624]">
                                                                {formatStatus(
                                                                    order.payment_status
                                                                )}
                                                            </p>
                                                        </div>

                                                        <div className="border border-[#eadfe5] bg-white p-4">
                                                            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8a8380]">
                                                                Order total
                                                            </p>

                                                            <p className="mt-2 text-sm font-medium text-[#292624]">
                                                                {money(
                                                                    order.total
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {/* CURRENT STATUS */}
                                            <div className="border border-[#eadfe5] bg-white p-6 shadow-[0_20px_70px_rgba(30,20,30,0.04)] sm:p-8">
                                                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                                                    <div>
                                                        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#b80062]">
                                                            Where your order is now
                                                        </p>

                                                        <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#182033]">
                                                            {formatStatus(
                                                                order.shipping_status
                                                            )}
                                                        </h3>

                                                        {latestEvent?.location && (
                                                            <p className="mt-2 text-sm text-[#77716d]">
                                                                Last update from{" "}
                                                                {
                                                                    latestEvent.location
                                                                }
                                                            </p>
                                                        )}
                                                    </div>

                                                    {order.delivered_at && (
                                                        <div className="border border-[#d7eadf] bg-[#f5fbf7] px-4 py-3 text-xs text-[#16834a]">
                                                            Delivered on{" "}
                                                            {formatShortDate(
                                                                order.delivered_at
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* DESKTOP PROGRESS */}
                                                <div className="mt-10 hidden md:block">
                                                    <div className="relative">
                                                        <div className="absolute left-[8%] right-[8%] top-5 h-px bg-[#e6dfe2]" />

                                                        <div
                                                            className="absolute left-[8%] top-5 h-px bg-[#b80062] transition-all"
                                                            style={{
                                                                width:
                                                                    currentStep <=
                                                                    0
                                                                        ? "0%"
                                                                        : `${Math.min(
                                                                              84,
                                                                              currentStep *
                                                                                  16.8
                                                                          )}%`,
                                                            }}
                                                        />

                                                        <div className="relative grid grid-cols-6 gap-2">
                                                            {steps.map(
                                                                (
                                                                    step,
                                                                    index
                                                                ) => {
                                                                    const complete =
                                                                        currentStep >=
                                                                        index;

                                                                    const active =
                                                                        currentStep ===
                                                                        index;

                                                                    return (
                                                                        <div
                                                                            key={
                                                                                step.key
                                                                            }
                                                                            className="text-center"
                                                                        >
                                                                            <div
                                                                                className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full border text-xs font-semibold transition ${
                                                                                    complete
                                                                                        ? "border-[#b80062] bg-[#b80062] text-white"
                                                                                        : "border-[#dcd3d7] bg-white text-[#aaa3a0]"
                                                                                } ${
                                                                                    active
                                                                                        ? "ring-4 ring-[#fff0f6]"
                                                                                        : ""
                                                                                }`}
                                                                            >
                                                                                {complete
                                                                                    ? "✓"
                                                                                    : index +
                                                                                      1}
                                                                            </div>

                                                                            <p
                                                                                className={`mt-3 text-[10px] font-semibold ${
                                                                                    complete
                                                                                        ? "text-[#292624]"
                                                                                        : "text-[#9a9390]"
                                                                                }`}
                                                                            >
                                                                                {
                                                                                    step.label
                                                                                }
                                                                            </p>

                                                                            <p className="mt-1 text-[9px] leading-4 text-[#aaa3a0]">
                                                                                {
                                                                                    step.description
                                                                                }
                                                                            </p>
                                                                        </div>
                                                                    );
                                                                }
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* MOBILE PROGRESS */}
                                                <div className="mt-8 space-y-4 md:hidden">
                                                    {steps.map(
                                                        (
                                                            step,
                                                            index
                                                        ) => {
                                                            const complete =
                                                                currentStep >=
                                                                index;

                                                            const active =
                                                                currentStep ===
                                                                index;

                                                            return (
                                                                <div
                                                                    key={
                                                                        step.key
                                                                    }
                                                                    className="flex gap-3"
                                                                >
                                                                    <div
                                                                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold ${
                                                                            complete
                                                                                ? "border-[#b80062] bg-[#b80062] text-white"
                                                                                : "border-[#dcd3d7] bg-white text-[#aaa3a0]"
                                                                        }`}
                                                                    >
                                                                        {complete
                                                                            ? "✓"
                                                                            : index +
                                                                              1}
                                                                    </div>

                                                                    <div>
                                                                        <p
                                                                            className={`text-sm font-medium ${
                                                                                active ||
                                                                                complete
                                                                                    ? "text-[#292624]"
                                                                                    : "text-[#9a9390]"
                                                                            }`}
                                                                        >
                                                                            {
                                                                                step.label
                                                                            }
                                                                        </p>

                                                                        <p className="mt-1 text-xs leading-5 text-[#9a9390]">
                                                                            {
                                                                                step.description
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                    )}
                                                </div>
                                            </div>

                                            {/* LATEST UPDATE */}
                                            {latestEvent && (
                                                <div className="border border-[#eadfe5] bg-white p-6 sm:p-8">
                                                    <div className="flex items-start gap-4">
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fff0f6] text-[#b80062]">
                                                            •
                                                        </div>

                                                        <div className="min-w-0">
                                                            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#b80062]">
                                                                Latest update
                                                            </p>

                                                            <h3 className="mt-2 text-lg font-semibold text-[#292624]">
                                                                {latestEvent.activity ||
                                                                    latestEvent.current_status ||
                                                                    "Shipment updated"}
                                                            </h3>

                                                            <p className="mt-1 text-xs text-[#8a8380]">
                                                                {formatDate(
                                                                    latestEvent.event_timestamp
                                                                )}
                                                            </p>

                                                            {latestEvent.location && (
                                                                <p className="mt-3 text-sm text-[#77716d]">
                                                                    Location:{" "}
                                                                    <span className="font-medium text-[#292624]">
                                                                        {
                                                                            latestEvent.location
                                                                        }
                                                                    </span>
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* SHIPMENT DETAILS */}
                                            {(order.courier_name ||
                                                order.awb_number ||
                                                order.tracking_url) && (
                                                <div className="border border-[#eadfe5] bg-white p-6 sm:p-8">
                                                    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                                                        <div>
                                                            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#b80062]">
                                                                Delivery details
                                                            </p>

                                                            <h3 className="mt-2 text-xl font-semibold tracking-[-0.025em] text-[#182033]">
                                                                Your shipment
                                                            </h3>
                                                        </div>

                                                        {order.tracking_url && (
                                                            <a
                                                                href={
                                                                    order.tracking_url
                                                                }
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="inline-flex items-center justify-center border border-[#292624] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#292624] transition hover:bg-[#292624] hover:text-white"
                                                            >
                                                                View courier tracking →
                                                            </a>
                                                        )}
                                                    </div>

                                                    <div className="mt-6 grid gap-px overflow-hidden border border-[#eadfe5] bg-[#eadfe5] sm:grid-cols-3">
                                                        <div className="bg-[#fbf8f6] p-5">
                                                            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8a8380]">
                                                                Courier
                                                            </p>

                                                            <p className="mt-2 text-sm font-medium text-[#292624]">
                                                                {order.courier_name ||
                                                                    "Being assigned"}
                                                            </p>
                                                        </div>

                                                        <div className="bg-[#fbf8f6] p-5">
                                                            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8a8380]">
                                                                AWB number
                                                            </p>

                                                            <p className="mt-2 break-all text-sm font-medium text-[#292624]">
                                                                {order.awb_number ||
                                                                    "Not assigned yet"}
                                                            </p>
                                                        </div>

                                                        <div className="bg-[#fbf8f6] p-5">
                                                            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8a8380]">
                                                                Payment
                                                            </p>

                                                            <p className="mt-2 text-sm font-medium text-[#292624]">
                                                                {formatStatus(
                                                                    order.payment_status
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* TRACKING HISTORY */}
                                            {events.length > 0 && (
                                                <div className="border border-[#eadfe5] bg-white p-6 sm:p-8">
                                                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#b80062]">
                                                        Tracking history
                                                    </p>

                                                    <h3 className="mt-2 text-xl font-semibold tracking-[-0.025em] text-[#182033]">
                                                        Every update, in one place.
                                                    </h3>

                                                    <div className="mt-7 space-y-0">
                                                        {events.map(
                                                            (
                                                                event,
                                                                index
                                                            ) => (
                                                                <div
                                                                    key={
                                                                        event.id
                                                                    }
                                                                    className="relative flex gap-4 pb-7 last:pb-0"
                                                                >
                                                                    {index <
                                                                        events.length -
                                                                            1 && (
                                                                        <div className="absolute bottom-0 left-[7px] top-4 w-px bg-[#e8e0e4]" />
                                                                    )}

                                                                    <div className="relative z-10 mt-1 h-4 w-4 shrink-0 rounded-full border-4 border-[#fff0f6] bg-[#b80062]" />

                                                                    <div className="min-w-0 flex-1">
                                                                        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                                                                            <p className="text-sm font-medium text-[#292624]">
                                                                                {event.activity ||
                                                                                    event.current_status ||
                                                                                    "Shipment update"}
                                                                            </p>

                                                                            <p className="text-[10px] text-[#9a9390]">
                                                                                {formatDate(
                                                                                    event.event_timestamp
                                                                                )}
                                                                            </p>
                                                                        </div>

                                                                        {event.location && (
                                                                            <p className="mt-1 text-xs text-[#8a8380]">
                                                                                {
                                                                                    event.location
                                                                                }
                                                                            </p>
                                                                        )}

                                                                        {event.courier_name && (
                                                                            <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[#aaa3a0]">
                                                                                {
                                                                                    event.courier_name
                                                                                }
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* REASSURANCE */}
                                    <div className="grid grid-cols-3 border border-[#eadfe5] bg-white">
                                        <div className="border-r border-[#eadfe5] px-3 py-5 text-center">
                                            <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-[#292624]">
                                                Secure
                                            </p>

                                            <p className="mt-1 text-[9px] text-[#9a9390]">
                                                Checkout
                                            </p>
                                        </div>

                                        <div className="border-r border-[#eadfe5] px-3 py-5 text-center">
                                            <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-[#292624]">
                                                Tracked
                                            </p>

                                            <p className="mt-1 text-[9px] text-[#9a9390]">
                                                Delivery
                                            </p>
                                        </div>

                                        <div className="px-3 py-5 text-center">
                                            <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-[#292624]">
                                                APSRAA
                                            </p>

                                            <p className="mt-1 text-[9px] text-[#9a9390]">
                                                Support
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </main>

            {/* CANCEL CONFIRMATION MODAL */}
            {showCancelConfirm &&
                order && (
                    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 px-5">
                        <div className="w-full max-w-md border border-[#eadfe5] bg-white p-6 shadow-2xl sm:p-8">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#b42318]">
                                Confirm cancellation
                            </p>

                            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[#182033]">
                                Cancel order #{order.id}?
                            </h2>

                            <p className="mt-3 text-sm leading-6 text-[#77716d]">
                                This action cannot be undone.
                                {String(
                                    order.payment_method ||
                                        ""
                                ).toLowerCase() ===
                                "cod"
                                    ? " Your COD order will simply be cancelled."
                                    : " Your online payment will be refunded through Razorpay after cancellation is processed."}
                            </p>

                            <div className="mt-6 flex flex-col gap-3">
                                <button
                                    type="button"
                                    onClick={
                                        handleCancelOrder
                                    }
                                    disabled={
                                        cancelling
                                    }
                                    className="w-full bg-[#b42318] px-5 py-3.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#8f1c13] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {cancelling
                                        ? "Cancelling…"
                                        : "Yes, cancel order"}
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowCancelConfirm(
                                            false
                                        )
                                    }
                                    disabled={
                                        cancelling
                                    }
                                    className="w-full border border-[#dcd3d7] bg-white px-5 py-3.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#55504d] transition hover:border-[#292624] hover:text-[#292624]"
                                >
                                    Keep my order
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            <Footer />
        </>
    );
}