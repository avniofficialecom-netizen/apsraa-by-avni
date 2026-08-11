import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "../../../lib/supabase-admin";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const orderId = Number(body.orderId);
        const razorpayPaymentId = String(
            body.razorpay_payment_id || ""
        ).trim();
        const razorpaySignature = String(
            body.razorpay_signature || ""
        ).trim();

        // ==========================================
        // VALIDATE ORDER ID
        // ==========================================

        if (!orderId || isNaN(orderId)) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Valid Order ID is required.",
                },
                {
                    status: 400,
                }
            );
        }

        // ==========================================
        // VALIDATE RAZORPAY PAYMENT INFORMATION
        // ==========================================

        if (
            !razorpayPaymentId ||
            !razorpaySignature
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Razorpay payment verification information is required.",
                },
                {
                    status: 400,
                }
            );
        }

        // ==========================================
        // RAZORPAY SECRET
        // ==========================================

        const secret =
            process.env.RAZORPAY_KEY_SECRET;

        if (!secret) {
            console.error(
                "❌ RAZORPAY_KEY_SECRET is missing."
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Payment security configuration is missing.",
                },
                {
                    status: 500,
                }
            );
        }

        console.log(
            "========== SECURE REDUCE ORDER STOCK =========="
        );

        console.log(
            "ORDER ID:",
            orderId
        );

        // ==========================================
        // CHECK ORDER
        // ==========================================

        const {
            data: order,
            error: orderError,
        } = await supabaseAdmin
            .from("orders")
            .select(
                `
                id,
                payment_status,
                stock_reduced,
                razorpay_order_id,
                razorpay_payment_id
                `
            )
            .eq("id", orderId)
            .single();

        if (orderError || !order) {
            console.error(
                "Order lookup error:",
                orderError
            );

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
        // PAYMENT MUST BE PAID
        // ==========================================

        if (
            String(
                order.payment_status || ""
            ).toLowerCase() !== "paid"
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Only paid orders can reduce stock.",
                },
                {
                    status: 400,
                }
            );
        }

        // ==========================================
        // VERIFY PAYMENT ID
        // ==========================================

        if (
            String(
                order.razorpay_payment_id || ""
            ) !== razorpayPaymentId
        ) {
            console.warn(
                "❌ Razorpay payment ID mismatch for order:",
                orderId
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Payment verification failed.",
                },
                {
                    status: 403,
                }
            );
        }

        // ==========================================
        // VERIFY RAZORPAY ORDER ID
        // ==========================================

        if (!order.razorpay_order_id) {
            console.error(
                "❌ Order does not contain a Razorpay Order ID:",
                orderId
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Razorpay order information is missing.",
                },
                {
                    status: 400,
                }
            );
        }

        // ==========================================
        // GENERATE EXPECTED RAZORPAY SIGNATURE
        // ==========================================

        const signatureBody =
            order.razorpay_order_id +
            "|" +
            razorpayPaymentId;

        const expectedSignature =
            crypto
                .createHmac(
                    "sha256",
                    secret
                )
                .update(signatureBody)
                .digest("hex");

        // ==========================================
        // SAFE SIGNATURE COMPARISON
        // ==========================================

        const expectedBuffer =
            Buffer.from(
                expectedSignature,
                "utf8"
            );

        const receivedBuffer =
            Buffer.from(
                razorpaySignature,
                "utf8"
            );

        const signatureMatches =
            expectedBuffer.length ===
            receivedBuffer.length &&
            crypto.timingSafeEqual(
                expectedBuffer,
                receivedBuffer
            );

        if (!signatureMatches) {
            console.warn(
                "❌ Razorpay signature verification failed for order:",
                orderId
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Payment verification failed.",
                },
                {
                    status: 403,
                }
            );
        }

        console.log(
            "✅ Razorpay payment verified for order:",
            orderId
        );

        // ==========================================
        // ALREADY REDUCED
        // ==========================================

        if (order.stock_reduced === true) {
            console.log(
                "ℹ️ Stock already reduced for order:",
                orderId
            );

            return NextResponse.json({
                success: true,
                alreadyReduced: true,
                message:
                    "Stock was already reduced for this order.",
            });
        }

        // ==========================================
        // DATABASE TRANSACTION
        // ==========================================

        const {
            data,
            error,
        } = await supabaseAdmin.rpc(
            "reduce_order_stock",
            {
                p_order_id: orderId,
            }
        );

        if (error) {
            console.error(
                "Stock reduction RPC error:",
                error
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        error.message ||
                        "Unable to reduce stock.",
                },
                {
                    status: 500,
                }
            );
        }

        console.log(
            "✅ STOCK REDUCED:",
            data
        );

        return NextResponse.json({
            success: true,
            alreadyReduced:
                data?.already_reduced ||
                false,
            message:
                data?.already_reduced
                    ? "Stock was already reduced for this order."
                    : "Stock updated successfully.",
        });

    } catch (error) {
        console.error(
            "Reduce stock error:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                message:
                    error instanceof Error
                        ? error.message
                        : "Internal server error.",
            },
            {
                status: 500,
            }
        );
    }
}