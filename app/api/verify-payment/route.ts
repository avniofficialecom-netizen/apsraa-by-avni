import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        } = await req.json();

        console.log("========== VERIFY PAYMENT ==========");
        console.log("ORDER ID:", razorpay_order_id);
        console.log("PAYMENT ID:", razorpay_payment_id);
        console.log("SIGNATURE:", razorpay_signature);

        const body =
            razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac(
                "sha256",
                process.env.RAZORPAY_KEY_SECRET!
            )
            .update(body)
            .digest("hex");

        console.log("EXPECTED:", expectedSignature);

        if (expectedSignature === razorpay_signature) {
            console.log("✅ Signature Verified");

            return NextResponse.json({
                success: true,
            });
        }

        console.log("❌ Signature Verification Failed");

        return NextResponse.json(
            {
                success: false,
                message: "Signature mismatch",
            },
            {
                status: 400,
            }
        );
    } catch (error) {
        console.error("VERIFY ERROR:", error);

        return NextResponse.json(
            {
                success: false,
                message: String(error),
            },
            {
                status: 500,
            }
        );
    }
}