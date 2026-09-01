import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { supabaseAdmin } from "../../../lib/supabase-admin";

// ==========================================
// CUSTOMER-CANCELLABLE ORDER STATUSES
// ==========================================

const CANCELLABLE_STATUSES = [
    "Pending",
    "Confirmed",
];

// ==========================================
// NORMALIZE PHONE
// ==========================================

function normalizePhone(
    value: unknown
) {
    return String(value || "")
        .replace(/\D/g, "")
        .slice(-10);
}

// ==========================================
// POST
// ==========================================

export async function POST(req: Request) {
    try {
        const body =
            await req.json();

        const orderId =
            Number(body?.orderId);

        const customerPhone =
            normalizePhone(
                body?.phone
            );

        const reason =
            String(
                body?.reason ||
                "Customer requested cancellation."
            ).trim();

        // ==========================================
        // BASIC VALIDATION
        // ==========================================

        if (
            !Number.isInteger(orderId) ||
            orderId <= 0
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Invalid order ID.",
                },
                { status: 400 }
            );
        }

        if (
            customerPhone.length !== 10
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "A valid phone number is required.",
                },
                { status: 400 }
            );
        }

        // ==========================================
        // RAZORPAY CREDENTIALS
        // ==========================================

        const keyId =
            process.env
                .NEXT_PUBLIC_RAZORPAY_KEY_ID;

        const keySecret =
            process.env
                .RAZORPAY_KEY_SECRET;

        if (
            !keyId ||
            !keySecret
        ) {
            console.error(
                "❌ Razorpay credentials are missing."
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Razorpay is not configured correctly.",
                },
                { status: 500 }
            );
        }

        // ==========================================
        // GET ORDER
        // ==========================================

        const {
            data: order,
            error: orderError,
        } =
            await supabaseAdmin
                .from("orders")
                .select(`
                    id,
                    customer_name,
                    email,
                    phone,
                    total,
                    status,
                    payment_status,
                    payment_method,
                    razorpay_order_id,
                    razorpay_payment_id,
                    refund_status,
                    razorpay_refund_id,
                    refund_amount,
                    refund_created_at,
                    cancelled_at,
                    cancellation_reason,
                    shipping_status,
                    shipment_id,
                    awb_number,
                    stock_reduced
                `)
                .eq("id", orderId)
                .single();

        if (
            orderError ||
            !order
        ) {
            console.error(
                "Order lookup error:",
                orderError
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Order not found.",
                },
                { status: 404 }
            );
        }

        // ==========================================
        // CUSTOMER OWNERSHIP CHECK
        // ==========================================

        const orderPhone =
            normalizePhone(
                order.phone
            );

        if (
            !orderPhone ||
            orderPhone !==
                customerPhone
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Order number and phone number do not match.",
                },
                { status: 403 }
            );
        }

        console.log(
            "========== CUSTOMER ORDER CANCELLATION =========="
        );

        console.log(
            "Order:",
            order.id
        );

        console.log(
            "Current status:",
            order.status
        );

        console.log(
            "Shipping status:",
            order.shipping_status
        );

        // ==========================================
        // ALREADY CANCELLED
        // ==========================================

        if (
            String(
                order.status || ""
            ).toLowerCase() ===
            "cancelled"
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "This order is already cancelled.",
                },
                { status: 400 }
            );
        }

        // ==========================================
        // SHIPPING PROTECTION
        //
        // Once shipment processing has started,
        // customer cancellation is locked.
        // ==========================================

        const shippingStatus =
            String(
                order.shipping_status ||
                ""
            )
                .trim()
                .toLowerCase();

        const shipmentStarted =
            Boolean(
                order.shipment_id ||
                order.awb_number
            ) ||
            [
                "packed",
                "awb_assigned",
                "picked_up",
                "in_transit",
                "out_for_delivery",
                "delivered",
                "rto",
                "rto_received",
                "shipped",
            ].includes(
                shippingStatus
            );

        if (
            shipmentStarted
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "This order has entered shipping and can no longer be cancelled from the customer side.",
                },
                { status: 400 }
            );
        }

        // ==========================================
        // ORDER STATUS PROTECTION
        // ==========================================

        const currentStatus =
            String(
                order.status || ""
            ).trim();

        if (
            !CANCELLABLE_STATUSES.includes(
                currentStatus
            )
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        `This order cannot be cancelled because its current status is "${currentStatus}".`,
                },
                { status: 400 }
            );
        }

        // ==========================================
        // NEVER REFUND TWICE
        // ==========================================

        if (
            order.refund_status ===
                "processed" ||
            order.razorpay_refund_id
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "A refund has already been processed for this order.",
                },
                { status: 400 }
            );
        }

        // ==========================================
        // PAYMENT
        // ==========================================

        const paymentMethod =
            String(
                order.payment_method ||
                ""
            ).toLowerCase();

        const paymentStatus =
            String(
                order.payment_status ||
                ""
            ).toLowerCase();

        // ==========================================
        // COD
        // ==========================================

        if (
            paymentMethod ===
            "cod"
        ) {
            const {
                data: updatedOrder,
                error: updateError,
            } =
                await supabaseAdmin
                    .from("orders")
                    .update({
                        status:
                            "Cancelled",

                        refund_status:
                            null,

                        cancelled_at:
                            new Date().toISOString(),

                        cancellation_reason:
                            reason,
                    })
                    .eq(
                        "id",
                        order.id
                    )
                    .select(`
                        id,
                        status,
                        payment_status,
                        payment_method,
                        refund_status,
                        cancelled_at,
                        cancellation_reason
                    `)
                    .single();

            if (
                updateError
            ) {
                console.error(
                    "COD cancellation update error:",
                    updateError
                );

                return NextResponse.json(
                    {
                        success: false,
                        message:
                            "Unable to cancel the order.",
                    },
                    { status: 500 }
                );
            }

            console.log(
                "✅ COD ORDER CANCELLED:",
                order.id
            );

            return NextResponse.json({
                success: true,
                refundRequired:
                    false,
                message:
                    "Order cancelled successfully.",
                order:
                    updatedOrder,
            });
        }

        // ==========================================
        // ONLINE PAYMENT VALIDATION
        // ==========================================

        if (
            paymentMethod !==
            "online"
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "This order does not have a supported payment method.",
                },
                { status: 400 }
            );
        }

        if (
            paymentStatus !==
            "paid"
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "This online order is not marked as paid, so a refund cannot be created.",
                },
                { status: 400 }
            );
        }

        if (
            !order.razorpay_payment_id
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Razorpay payment ID is missing for this order.",
                },
                { status: 400 }
            );
        }

        // ==========================================
        // REFUND AMOUNT
        // ==========================================

        const totalAmount =
            Number(
                String(
                    order.total ||
                    "0"
                )
                    .replace(
                        /₹/g,
                        ""
                    )
                    .replace(
                        /,/g,
                        ""
                    )
                    .trim()
            );

        if (
            !Number.isFinite(
                totalAmount
            ) ||
            totalAmount <= 0
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Invalid order amount.",
                },
                { status: 400 }
            );
        }

        const refundAmountPaise =
            Math.round(
                totalAmount * 100
            );

        // ==========================================
        // RAZORPAY
        // ==========================================

        const razorpay =
            new Razorpay({
                key_id: keyId,
                key_secret:
                    keySecret,
            });

        // ==========================================
        // VERIFY PAYMENT
        // ==========================================

        const payment =
            await razorpay.payments.fetch(
                order.razorpay_payment_id
            );

        console.log(
            "Razorpay payment status:",
            payment.status
        );

        if (
            payment.status !==
            "captured"
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        `Razorpay payment is not captured. Current status: ${payment.status}`,
                },
                { status: 400 }
            );
        }

        // ==========================================
        // VERIFY PAYMENT AMOUNT
        // ==========================================

        if (
            Number(
                payment.amount
            ) !==
            refundAmountPaise
        ) {
            console.error(
                "❌ REFUND AMOUNT MISMATCH",
                {
                    razorpayAmount:
                        payment.amount,
                    orderAmount:
                        refundAmountPaise,
                }
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "The Razorpay payment amount does not match the order amount.",
                },
                { status: 400 }
            );
        }

        // ==========================================
        // MARK REFUND PENDING
        // ==========================================

        const {
            error:
                pendingError,
        } =
            await supabaseAdmin
                .from("orders")
                .update({
                    refund_status:
                        "pending",

                    cancellation_reason:
                        reason,
                })
                .eq(
                    "id",
                    order.id
                )
                .is(
                    "razorpay_refund_id",
                    null
                );

        if (
            pendingError
        ) {
            console.error(
                "Unable to mark refund pending:",
                pendingError
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Unable to prepare the refund.",
                },
                { status: 500 }
            );
        }

        // ==========================================
        // CREATE RAZORPAY REFUND
        // ==========================================

        let refund: any;

        try {
            refund =
                await razorpay.payments.refund(
                    order.razorpay_payment_id,
                    {
                        amount:
                            refundAmountPaise,

                        speed:
                            "normal",

                        receipt:
                            `order_${order.id}_refund`,

                        notes: {
                            order_id:
                                String(
                                    order.id
                                ),

                            reason:
                                reason,
                        },
                    }
                );
        } catch (
            refundError
        ) {
            console.error(
                "❌ RAZORPAY REFUND ERROR:",
                refundError
            );

            await supabaseAdmin
                .from("orders")
                .update({
                    refund_status:
                        "failed",
                })
                .eq(
                    "id",
                    order.id
                );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Razorpay refund could not be created.",
                },
                { status: 500 }
            );
        }

        // ==========================================
        // SAVE REFUND + CANCEL
        // ==========================================

        const {
            data:
                updatedOrder,
            error:
                finalUpdateError,
        } =
            await supabaseAdmin
                .from("orders")
                .update({
                    status:
                        "Cancelled",

                    payment_status:
                        String(
                            refund.status ||
                            "pending"
                        ).toLowerCase() === "processed"
                            ? "Refunded"
                            : order.payment_status,

                    refund_status:
                        String(
                            refund.status ||
                            "pending"
                        ).toLowerCase(),

                    razorpay_refund_id:
                        refund.id,

                    refund_amount:
                        totalAmount,

                    refund_created_at:
                        new Date().toISOString(),

                    cancelled_at:
                        new Date().toISOString(),

                    cancellation_reason:
                        reason,
                })
                .eq(
                    "id",
                    order.id
                )
                .select(`
                    id,
                    status,
                    payment_status,
                    payment_method,
                    total,
                    refund_status,
                    razorpay_refund_id,
                    refund_amount,
                    refund_created_at,
                    cancelled_at,
                    cancellation_reason
                `)
                .single();

        if (
            finalUpdateError
        ) {
            console.error(
                "❌ FINAL ORDER UPDATE ERROR:",
                finalUpdateError
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Refund was created, but the order status could not be updated automatically. Please check the admin order.",
                    refundCreated:
                        true,
                    refundId:
                        refund.id,
                },
                { status: 500 }
            );
        }

        console.log(
            "✅ ORDER CANCELLED:",
            order.id
        );

        console.log(
            "✅ REFUND CREATED:",
            refund.id
        );

        return NextResponse.json({
            success: true,

            refundRequired:
                true,

            message:
                "Order cancelled and refund initiated successfully.",

            refund: {
                id:
                    refund.id,

                status:
                    refund.status,

                amount:
                    totalAmount,

                currency:
                    refund.currency ||
                    "INR",
            },

            order:
                updatedOrder,
        });

    } catch (
        error
    ) {
        console.error(
            "❌ CANCEL ORDER ERROR:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                message:
                    error instanceof Error
                        ? error.message
                        : "Unable to cancel order.",
            },
            { status: 500 }
        );
    }
}