import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "../../../../lib/supabase-admin";

// Razorpay sends the raw request body. The signature must be checked
// against the raw body before parsing JSON.
function isValidSignature(rawBody: string, signature: string, secret: string) {
    const expected = crypto
        .createHmac("sha256", secret)
        .update(rawBody)
        .digest("hex");

    return crypto.timingSafeEqual(
        Buffer.from(expected),
        Buffer.from(signature)
    );
}

export async function POST(req: Request) {
    try {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

        if (!webhookSecret) {
            console.error("RAZORPAY_WEBHOOK_SECRET is missing.");
            return NextResponse.json(
                { success: false, message: "Webhook is not configured." },
                { status: 500 }
            );
        }

        const signature = req.headers.get("x-razorpay-signature") || "";
        const rawBody = await req.text();

        if (!signature) {
            return NextResponse.json(
                { success: false, message: "Missing Razorpay signature." },
                { status: 400 }
            );
        }

        if (!isValidSignature(rawBody, signature, webhookSecret)) {
            return NextResponse.json(
                { success: false, message: "Invalid Razorpay signature." },
                { status: 401 }
            );
        }

        const event = JSON.parse(rawBody);
        const eventName = String(event?.event || "");

        const refund = event?.payload?.refund?.entity;

        if (!refund?.id) {
            // Acknowledge unrelated/invalid payloads without retry loops.
            return NextResponse.json({ success: true, ignored: true });
        }

        const refundId = String(refund.id);
        const status = String(refund.status || "").toLowerCase();

        const allowedStatuses = [
            "pending",
            "processed",
            "failed",
        ];

        if (!allowedStatuses.includes(status)) {
            return NextResponse.json({
                success: true,
                ignored: true,
                refundId,
                status,
            });
        }

        const update: Record<string, unknown> = {
            refund_status: status,
        };

        if (refund.amount != null) {
            update.refund_amount =
                Number(refund.amount) / 100;
        }

        if (
            status === "processed" ||
            status === "failed"
        ) {
            update.refund_created_at =
                new Date().toISOString();
        }

        if (status === "processed") {
            update.payment_status = "Refunded";
        }

        // Match by the exact Razorpay refund ID.
        const { error } = await supabaseAdmin
            .from("orders")
            .update(update)
            .eq("razorpay_refund_id", refundId);

        if (error) {
            console.error(
                "Refund webhook database update failed:",
                error
            );

            return NextResponse.json(
                { success: false, message: "Database update failed." },
                { status: 500 }
            );
        }

        console.log(
            `✅ Razorpay refund webhook: ${eventName} ${refundId} -> ${status}`
        );

        return NextResponse.json({
            success: true,
            refundId,
            status,
        });
    } catch (error) {
        console.error("❌ Razorpay refund webhook error:", error);

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
