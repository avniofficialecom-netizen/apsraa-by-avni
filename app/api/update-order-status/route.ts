import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAdmin } from "../../../lib/supabase-admin";

// ==========================================
// ALLOWED ORDER STATUSES
// ==========================================

const allowedStatuses = [
    // Normal order flow
    "Pending",
    "Confirmed",
    "Packed",
    "Shipped",
    "Delivered",

    // Cancellation
    "Cancelled",

    // Customer return flow
    "Return Requested",
    "Return Approved",
    "Return Rejected",
    "Return Received",
    "Refunded",

    // RTO flow
    "RTO",
    "RTO Received",
];

// ==========================================
// MAP ADMIN ORDER STATUS
// TO CUSTOMER SHIPPING STATUS
// ==========================================

function getShippingStatusForOrderStatus(
    status: string
): string | null {
    switch (status) {
        case "Pending":
            return "pending";

        case "Confirmed":
            // Customer tracking:
            // Order confirmed
            return "created";

        case "Packed":
            // Customer tracking:
            // Packed & ready
            return "awb_assigned";

        case "Shipped":
            // Customer tracking:
            // Picked up
            return "picked_up";

        case "Delivered":
            // Customer tracking:
            // Delivered
            return "delivered";

        case "Cancelled":
            return "cancelled";

        default:
            // Return/RTO statuses should not
            // overwrite the real shipment status.
            return null;
    }
}

export async function POST(req: Request) {
    try {
        // ==========================================
        // AUTHENTICATION
        // ==========================================

        const cookieStore = await cookies();

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },

                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(
                                ({
                                    name,
                                    value,
                                    options,
                                }) => {
                                    cookieStore.set(
                                        name,
                                        value,
                                        options
                                    );
                                }
                            );
                        } catch {
                            // Cookie updates may be handled by middleware.
                        }
                    },
                },
            }
        );

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Unauthorized. Admin login required.",
                },
                {
                    status: 401,
                }
            );
        }

        // ==========================================
        // ADMIN AUTHORIZATION
        // ==========================================

        const adminEmail =
            process.env.ADMIN_EMAIL ||
            process.env.NEXT_PUBLIC_ADMIN_EMAIL;

        if (!adminEmail) {
            console.error(
                "Admin email environment variable is missing."
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Admin configuration is missing.",
                },
                {
                    status: 500,
                }
            );
        }

        const loggedInEmail =
            user.email?.trim().toLowerCase();

        const configuredAdminEmail =
            adminEmail.trim().toLowerCase();

        if (
            !loggedInEmail ||
            loggedInEmail !== configuredAdminEmail
        ) {
            console.warn(
                "Unauthorized admin API attempt:",
                user.email
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Forbidden. Admin access required.",
                },
                {
                    status: 403,
                }
            );
        }

        // ==========================================
        // READ REQUEST
        // ==========================================

        const body = await req.json();

        const id = Number(body.id);
        const status = body.status;

        // ==========================================
        // VALIDATE ORDER ID
        // ==========================================

        if (!Number.isInteger(id) || id <= 0) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid Order ID.",
                },
                {
                    status: 400,
                }
            );
        }

        // ==========================================
        // VALIDATE STATUS
        // ==========================================

        if (!status) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Order status is required.",
                },
                {
                    status: 400,
                }
            );
        }

        if (!allowedStatuses.includes(status)) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Invalid order status.",
                },
                {
                    status: 400,
                }
            );
        }

        // ==========================================
        // CHECK ORDER EXISTS
        // ==========================================

        const {
            data: order,
            error: findError,
        } = await supabaseAdmin
            .from("orders")
            .select(
                `
                id,
                status,
                shipping_status,
                delivered_at,
                payment_status,
                payment_method,
                total,
                razorpay_payment_id,
                refund_status,
                razorpay_refund_id,
                refund_amount,
                refund_created_at,
                cancelled_at,
                cancellation_reason
                `
            )
            .eq("id", id)
            .single();

        if (findError || !order) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Order not found.",
                },
                {
                    status: 404,
                }
            );
        }

        // ==========================================
        // ADMIN CANCELLATION
        //
        // Cancellation must use the same refund-safe
        // flow as /api/cancel-order.
        // Never silently mark a paid order cancelled
        // without recording the Razorpay refund.
        // ==========================================

        if (status === "Cancelled") {
            const paymentMethod =
                String(order.payment_method || "").trim().toLowerCase();

            const paymentStatus =
                String(order.payment_status || "").trim().toLowerCase();

            const existingRefundId =
                String(order.razorpay_refund_id || "").trim();

            const existingRefundStatus =
                String(order.refund_status || "").trim().toLowerCase();

            // Never cancel twice or refund twice.
            if (String(order.status).toLowerCase() === "cancelled") {
                return NextResponse.json(
                    {
                        success: false,
                        message: "This order is already cancelled.",
                    },
                    { status: 400 }
                );
            }

            if (
                existingRefundId ||
                existingRefundStatus === "processed"
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

            const reason =
                String(
                    body.reason ||
                    "Admin cancelled order."
                ).trim();

            // ------------------------------------------
            // COD: cancel only, no refund required.
            // ------------------------------------------

            if (paymentMethod === "cod") {
                const now =
                    new Date().toISOString();

                const {
                    data: updatedOrder,
                    error: cancelError,
                } = await supabaseAdmin
                    .from("orders")
                    .update({
                        status: "Cancelled",
                        shipping_status: "cancelled",
                        cancelled_at: now,
                        cancellation_reason: reason,
                        refund_status: null,
                    })
                    .eq("id", id)
                    .select(`
                        id,
                        status,
                        shipping_status,
                        payment_status,
                        payment_method,
                        refund_status,
                        razorpay_refund_id,
                        refund_amount,
                        refund_created_at,
                        cancelled_at,
                        cancellation_reason
                    `)
                    .single();

                if (cancelError) {
                    console.error(
                        "COD Admin Cancellation Error:",
                        cancelError
                    );

                    return NextResponse.json(
                        {
                            success: false,
                            message:
                                "Unable to cancel the COD order.",
                        },
                        { status: 500 }
                    );
                }

                const {
                    error: historyError,
                } = await supabaseAdmin
                    .from("order_status_history")
                    .insert({
                        order_id: id,
                        status: "Cancelled",
                        changed_at: now,
                    });

                if (historyError) {
                    console.error(
                        "COD cancellation history error:",
                        historyError
                    );
                }

                return NextResponse.json({
                    success: true,
                    message: "COD order cancelled successfully.",
                    refundRequired: false,
                    order: updatedOrder,
                });
            }

            // ------------------------------------------
            // PAID ONLINE ORDER
            // ------------------------------------------

            if (!order.razorpay_payment_id) {
                return NextResponse.json(
                    {
                        success: false,
                        message:
                            "This paid order has no Razorpay payment ID, so it cannot be refunded automatically.",
                    },
                    { status: 400 }
                );
            }

            const keyId =
                process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

            const keySecret =
                process.env.RAZORPAY_KEY_SECRET;

            if (!keyId || !keySecret) {
                console.error(
                    "Razorpay credentials are missing."
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

            const totalAmount = Number(order.total);

            if (
                !Number.isFinite(totalAmount) ||
                totalAmount <= 0
            ) {
                return NextResponse.json(
                    {
                        success: false,
                        message: "Invalid order amount.",
                    },
                    { status: 400 }
                );
            }

            const refundAmountPaise =
                Math.round(totalAmount * 100);

            const razorpay =
                new Razorpay({
                    key_id: keyId,
                    key_secret: keySecret,
                });

            // Verify the Razorpay payment before refunding.
            let payment: any;

            try {
                payment =
                    await razorpay.payments.fetch(
                        order.razorpay_payment_id
                    );
            } catch (paymentError) {
                console.error(
                    "Razorpay payment lookup error:",
                    paymentError
                );

                return NextResponse.json(
                    {
                        success: false,
                        message:
                            "Unable to verify the Razorpay payment before cancellation.",
                    },
                    { status: 500 }
                );
            }

            if (payment.status !== "captured") {
                return NextResponse.json(
                    {
                        success: false,
                        message:
                            `Razorpay payment is not captured. Current status: ${payment.status}`,
                    },
                    { status: 400 }
                );
            }

            if (
                Number(payment.amount) !==
                refundAmountPaise
            ) {
                console.error(
                    "Admin refund amount mismatch:",
                    {
                        razorpayAmount: payment.amount,
                        orderAmount: refundAmountPaise,
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

            // Mark pending before calling Razorpay.
            const {
                error: pendingError,
            } = await supabaseAdmin
                .from("orders")
                .update({
                    refund_status: "pending",
                    cancellation_reason: reason,
                })
                .eq("id", id)
                .is("razorpay_refund_id", null);

            if (pendingError) {
                console.error(
                    "Unable to mark admin refund pending:",
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

            let refund: any;

            try {
                refund =
                    await razorpay.payments.refund(
                        order.razorpay_payment_id,
                        {
                            amount: refundAmountPaise,
                            speed: "normal",
                            notes: {
                                order_id: String(id),
                                reason,
                            },
                        }
                    );
            } catch (refundError) {
                console.error(
                    "Razorpay admin refund error:",
                    refundError
                );

                await supabaseAdmin
                    .from("orders")
                    .update({
                        refund_status: "failed",
                    })
                    .eq("id", id)
                    .is("razorpay_refund_id", null);

                return NextResponse.json(
                    {
                        success: false,
                        message:
                            "Razorpay refund could not be created. The order was not cancelled.",
                    },
                    { status: 500 }
                );
            }

            const now =
                new Date().toISOString();

            const {
                data: updatedOrder,
                error: finalUpdateError,
            } = await supabaseAdmin
                .from("orders")
                .update({
                    status: "Cancelled",
                    shipping_status: "cancelled",
                    payment_status: "Refunded",
                    refund_status:
                        refund.status || "processed",
                    razorpay_refund_id: refund.id,
                    refund_amount: totalAmount,
                    refund_created_at: now,
                    cancelled_at: now,
                    cancellation_reason: reason,
                })
                .eq("id", id)
                .select(`
                    id,
                    status,
                    shipping_status,
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

            if (finalUpdateError) {
                console.error(
                    "Refund created but final order update failed:",
                    finalUpdateError
                );

                return NextResponse.json(
                    {
                        success: false,
                        message:
                            "Refund was created, but the order could not be updated automatically. Check the order and Razorpay refund before retrying.",
                        refundCreated: true,
                        refundId: refund.id,
                    },
                    { status: 500 }
                );
            }

            const {
                error: historyError,
            } = await supabaseAdmin
                .from("order_status_history")
                .insert({
                    order_id: id,
                    status: "Cancelled",
                    changed_at: now,
                });

            if (historyError) {
                console.error(
                    "Admin cancellation history error:",
                    historyError
                );
            }

            console.log(
                `✅ Admin cancelled order #${id}; refund ${refund.id} (${refund.status || "processed"})`
            );

            return NextResponse.json({
                success: true,
                message:
                    "Order cancelled and refund initiated successfully.",
                refundRequired: true,
                refund: {
                    id: refund.id,
                    status: refund.status,
                    amount: totalAmount,
                    currency:
                        refund.currency || "INR",
                },
                order: updatedOrder,
            });
        }

        // ==========================================
        // PREPARE ORDER UPDATE
        // ==========================================

        const updateData: {
            status: string;
            shipping_status?: string;
            delivered_at?: string | null;
        } = {
            status,
        };

        // ==========================================
        // SYNC CUSTOMER SHIPPING STATUS
        // ==========================================

        const shippingStatus =
            getShippingStatusForOrderStatus(status);

        if (shippingStatus) {
            updateData.shipping_status =
                shippingStatus;
        }

        // ==========================================
        // DELIVERY TIMESTAMP
        // ==========================================

        if (
            status === "Delivered" &&
            !order.delivered_at
        ) {
            updateData.delivered_at =
                new Date().toISOString();
        }

        // ==========================================
        // UPDATE ORDER
        // ==========================================

        const {
            data: updatedOrder,
            error: updateError,
        } = await supabaseAdmin
            .from("orders")
            .update(updateData)
            .eq("id", id)
            .select(
                `
                id,
                status,
                shipping_status,
                delivered_at,
                payment_status,
                payment_method,
                refund_status,
                razorpay_refund_id,
                refund_amount,
                refund_created_at,
                cancelled_at,
                cancellation_reason
                `
            )
            .single();

        if (updateError) {
            console.error(
                "Supabase Update Error:",
                updateError
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        updateError.message,
                },
                {
                    status: 500,
                }
            );
        }

        // ==========================================
        // SAVE STATUS HISTORY
        // ==========================================

        if (order.status !== status) {
            const {
                error: historyError,
            } = await supabaseAdmin
                .from("order_status_history")
                .insert({
                    order_id: id,
                    status,
                    changed_at:
                        new Date().toISOString(),
                });

            if (historyError) {
                console.error(
                    "Order Status History Error:",
                    historyError
                );

                // The main order update succeeded.
                // Keep the status change even if history
                // saving fails.
            } else {
                console.log(
                    `📝 Order #${id} history saved: ${status}`
                );
            }
        }

        // ==========================================
        // LOG STATUS CHANGE
        // ==========================================

        console.log(
            `✅ Order #${id} status changed from ${order.status} to ${status}`
        );

        console.log(
            `🚚 Order #${id} shipping status: ${updatedOrder.shipping_status}`
        );

        if (status === "Delivered") {
            console.log(
                `📅 Order #${id} delivered_at: ${updatedOrder.delivered_at}`
            );
        }

        // ==========================================
        // SUCCESS RESPONSE
        // ==========================================

        return NextResponse.json({
            success: true,
            message:
                "Order status updated successfully.",
            order: updatedOrder,
        });

    } catch (error) {
        console.error(
            "Update Order Status Error:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                message:
                    "Internal server error.",
            },
            {
                status: 500,
            }
        );
    }
}