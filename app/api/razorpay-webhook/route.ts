import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "../../../lib/supabase-admin";

type RazorpayRefundEntity = {
    id?: string;
    entity?: string;
    amount?: number;
    currency?: string;
    payment_id?: string;
    status?: string;
    created_at?: number;
};

type RazorpayWebhookPayload = {
    entity?: string;
    account_id?: string;
    event?: string;

    payload?: {
        refund?: {
            entity?: RazorpayRefundEntity;
        };

        payment?: {
            entity?: {
                id?: string;
            };
        };
    };
};

function verifySignature(
    rawBody: string,
    signature: string,
    secret: string
) {
    const expectedSignature =
        crypto
            .createHmac(
                "sha256",
                secret
            )
            .update(rawBody)
            .digest("hex");

    try {
        return crypto.timingSafeEqual(
            Buffer.from(
                expectedSignature,
                "utf8"
            ),
            Buffer.from(
                signature,
                "utf8"
            )
        );
    } catch {
        return false;
    }
}

export async function POST(
    req: Request
) {
    try {
        // ==========================================
        // RAZORPAY WEBHOOK SECRET
        // ==========================================

        const webhookSecret =
            process.env.RAZORPAY_WEBHOOK_SECRET;

        if (!webhookSecret) {
            console.error(
                "❌ RAZORPAY_WEBHOOK_SECRET is missing."
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Razorpay webhook security configuration is missing.",
                },
                { status: 500 }
            );
        }

        // ==========================================
        // READ RAW BODY
        // IMPORTANT:
        // Razorpay signature must be calculated
        // from the ORIGINAL raw request body.
        // ==========================================

        const rawBody =
            await req.text();

        // ==========================================
        // SIGNATURE
        // ==========================================

        const signature =
            req.headers.get(
                "x-razorpay-signature"
            );

        if (!signature) {
            console.warn(
                "❌ Razorpay webhook signature missing."
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Webhook signature missing.",
                },
                { status: 401 }
            );
        }

        // ==========================================
        // VERIFY SIGNATURE
        // ==========================================

        const validSignature =
            verifySignature(
                rawBody,
                signature,
                webhookSecret
            );

        if (!validSignature) {
            console.warn(
                "❌ Invalid Razorpay webhook signature."
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Invalid webhook signature.",
                },
                { status: 401 }
            );
        }

        // ==========================================
        // PARSE PAYLOAD
        // ==========================================

        let payload: RazorpayWebhookPayload;

        try {
            payload =
                JSON.parse(
                    rawBody
                ) as RazorpayWebhookPayload;
        } catch {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Invalid JSON payload.",
                },
                { status: 400 }
            );
        }

        const event =
            String(
                payload.event || ""
            ).trim();

        console.log(
            "=========================================="
        );

        console.log(
            "RAZORPAY WEBHOOK"
        );

        console.log(
            "Event:",
            event
        );

        // ==========================================
        // ONLY PROCESS REFUND EVENTS
        // ==========================================

        const refundEvents = [
            "refund.created",
            "refund.processed",
            "refund.failed",
        ];

        if (
            !refundEvents.includes(
                event
            )
        ) {
            console.log(
                "ℹ️ Ignoring non-refund Razorpay event:",
                event
            );

            return NextResponse.json({
                success: true,
                ignored: true,
                message:
                    "Event ignored.",
            });
        }

        // ==========================================
        // GET REFUND ENTITY
        // ==========================================

        const refund =
            payload.payload
                ?.refund
                ?.entity;

        if (!refund) {
            console.error(
                "❌ Refund entity missing from Razorpay webhook."
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Refund information missing.",
                },
                { status: 400 }
            );
        }

        const refundId =
            refund.id
                ? String(
                    refund.id
                ).trim()
                : "";

        const paymentId =
            refund.payment_id
                ? String(
                    refund.payment_id
                ).trim()
                : "";

        const refundStatus =
            refund.status
                ? String(
                    refund.status
                ).trim()
                : "";

        if (!refundId) {
            console.error(
                "❌ Razorpay refund ID missing."
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Refund ID missing.",
                },
                { status: 400 }
            );
        }

        console.log(
            "Refund ID:",
            refundId
        );

        console.log(
            "Payment ID:",
            paymentId
        );

        console.log(
            "Refund status:",
            refundStatus
        );

        // ==========================================
        // FIND ORDER
        // ==========================================

        let order: {
            id: number;
            razorpay_payment_id:
                | string
                | null;
            razorpay_refund_id:
                | string
                | null;
            refund_status:
                | string
                | null;
        } | null = null;

        // ------------------------------------------
        // FIRST: REFUND ID
        // ------------------------------------------

        const {
            data: refundOrder,
            error: refundLookupError,
        } = await supabaseAdmin
            .from("orders")
            .select(`
                id,
                razorpay_payment_id,
                razorpay_refund_id,
                refund_status
            `)
            .eq(
                "razorpay_refund_id",
                refundId
            )
            .maybeSingle();

        if (refundLookupError) {
            console.error(
                "Refund ID lookup error:",
                refundLookupError
            );
        } else if (
            refundOrder
        ) {
            order =
                refundOrder;
        }

        // ------------------------------------------
        // SECOND: PAYMENT ID
        // ------------------------------------------

        if (
            !order &&
            paymentId
        ) {
            const {
                data: paymentOrder,
                error: paymentLookupError,
            } = await supabaseAdmin
                .from("orders")
                .select(`
                    id,
                    razorpay_payment_id,
                    razorpay_refund_id,
                    refund_status
                `)
                .eq(
                    "razorpay_payment_id",
                    paymentId
                )
                .maybeSingle();

            if (paymentLookupError) {
                console.error(
                    "Payment ID lookup error:",
                    paymentLookupError
                );
            } else if (
                paymentOrder
            ) {
                order =
                    paymentOrder;
            }
        }

        // ==========================================
        // ORDER NOT FOUND
        // ==========================================

        if (!order) {
            console.warn(
                "⚠️ Razorpay refund received but APSRAA order was not found.",
                {
                    refundId,
                    paymentId,
                }
            );

            // Return 200 so Razorpay does not
            // repeatedly retry an event that
            // cannot currently be mapped.
            return NextResponse.json({
                success: true,
                ignored: true,
                message:
                    "Refund received but order was not found.",
            });
        }

        // ==========================================
        // MAP RAZORPAY STATUS
        // ==========================================

        let apsraaRefundStatus =
            refundStatus;

        if (
            event ===
            "refund.processed"
        ) {
            apsraaRefundStatus =
                "processed";
        }

        if (
            event ===
            "refund.failed"
        ) {
            apsraaRefundStatus =
                "failed";
        }

        if (
            event ===
            "refund.created"
        ) {
            apsraaRefundStatus =
                refundStatus ||
                "pending";
        }

        // ==========================================
        // REFUND AMOUNT
        // Razorpay amount is in paise.
        // ==========================================

        const refundAmount =
            typeof refund.amount ===
            "number"
                ? refund.amount /
                  100
                : null;

        // ==========================================
        // UPDATE ORDER
        // ==========================================

        const updateData: Record<
            string,
            unknown
        > = {
            refund_status:
                apsraaRefundStatus,
        };

        // Always save refund ID.
        updateData.razorpay_refund_id =
            refundId;

        if (refundAmount !== null) {
            updateData.refund_amount =
                refundAmount;
        }

        // ------------------------------------------
        // REFUND PROCESSED
        // ------------------------------------------

        if (
            apsraaRefundStatus ===
            "processed"
        ) {
            updateData.payment_status =
                "Refunded";

            updateData.status =
                "Cancelled";

            updateData.refund_created_at =
                new Date().toISOString();
        }

        // ------------------------------------------
        // REFUND FAILED
        // ------------------------------------------

        if (
            apsraaRefundStatus ===
            "failed"
        ) {
            updateData.refund_status =
                "failed";
        }

        const {
            error: updateError,
        } = await supabaseAdmin
            .from("orders")
            .update(
                updateData
            )
            .eq(
                "id",
                order.id
            );

        if (updateError) {
            console.error(
                "❌ Refund order update failed:",
                updateError
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Refund received but order could not be updated.",
                },
                { status: 500 }
            );
        }

        // ==========================================
        // SUCCESS
        // ==========================================

        console.log(
            "✅ Razorpay refund webhook processed."
        );

        console.log(
            "Order:",
            order.id
        );

        console.log(
            "Refund:",
            refundId
        );

        console.log(
            "Status:",
            apsraaRefundStatus
        );

        console.log(
            "Amount:",
            refundAmount
        );

        console.log(
            "=========================================="
        );

        return NextResponse.json({
            success: true,
            message:
                "Razorpay refund webhook processed successfully.",

            order_id:
                order.id,

            refund_id:
                refundId,

            refund_status:
                apsraaRefundStatus,

            refund_amount:
                refundAmount,
        });

    } catch (error) {
        console.error(
            "❌ Razorpay webhook error:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                message:
                    error instanceof Error
                        ? error.message
                        : "Webhook processing failed.",
            },
            { status: 500 }
        );
    }
}