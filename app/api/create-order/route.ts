import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function POST(req: Request) {
    try {
        console.log("KEY:", process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);
        console.log("SECRET:", process.env.RAZORPAY_KEY_SECRET ? "FOUND" : "NOT FOUND");

        const razorpay = new Razorpay({
            key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
            key_secret: process.env.RAZORPAY_KEY_SECRET!,
        });

        const { amount } = await req.json();

        const order = await razorpay.orders.create({
            amount: Number(amount) * 100,
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        });

        return NextResponse.json(order);
    } catch (err) {
        console.error("FULL ERROR:", err);
        return NextResponse.json(
            { error: String(err) },
            { status: 500 }
        );
    }
}