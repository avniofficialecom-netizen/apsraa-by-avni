import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { supabaseAdmin } from "../../../../../../lib/supabase-admin";
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const orderId = Number(body?.orderId);

        if (!Number.isInteger(orderId) || orderId <= 0) {
            return NextResponse.json(
                { success: false, message: "Invalid order ID." },
                { status: 400 }
            );
        }

        const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        if (!keyId || !keySecret) {
            return NextResponse.json(
                { success: false, message: "Razorpay is not configured correctly." },
                { status: 500 }
            );
        }

        const { data: order, error } = await supabaseAdmin
            .from("orders")
            .select(`
                id,
                refund_status,
                razorpay_refund_id,
                refund_amount,
                refund_created_at,
                payment_status
            `)
            .eq("id", orderId)
            .single();

        if (error || !order) {
            return NextResponse.json(
                { success: false, message: "Order not found." },
                { status: 404 }
            );
        }

        if (!order.razorpay_refund_id) {
            return NextResponse.json({
                success: true,
                synced: false,
                message: "This order has no Razorpay refund ID.",
                order,
            });
        }

        const razorpay = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
        });

        const refund = await razorpay.refunds.fetch(
            order.razorpay_refund_id
        );

        const status = String(refund.status || "").toLowerCase();

        const update: Record<string, unknown> = {
            refund_status: status,
        };

        if (refund.amount != null) {
            update.refund_amount =
                Number(refund.amount) / 100;
        }

        if (status === "processed") {
            update.payment_status = "Refunded";
        }

        const { data: updatedOrder, error: updateError } =
            await supabaseAdmin
                .from("orders")
                .update(update)
                .eq("id", orderId)
                .select(`
                    id,
                    refund_status,
                    razorpay_refund_id,
                    refund_amount,
                    refund_created_at,
                    payment_status
                `)
                .single();

        if (updateError) {
            console.error("Refund sync database update failed:", updateError);
            return NextResponse.json(
                { success: false, message: "Unable to save refund status." },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            synced: true,
            refund: {
                id: refund.id,
                status: refund.status,
                amount: Number(refund.amount || 0) / 100,
                currency: refund.currency || "INR",
            },
            order: updatedOrder,
        });
    } catch (error) {
        console.error("❌ Refund sync error:", error);

        return NextResponse.json(
            {
                success: false,
                message:
                    error instanceof Error
                        ? error.message
                        : "Unable to sync refund status.",
            },
            { status: 500 }
        );
    }
}
