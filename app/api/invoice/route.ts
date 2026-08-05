import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase-admin";

export async function POST(req: Request) {
    try {
        const { orderId } = await req.json();

        if (!orderId) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Order ID is required.",
                },
                {
                    status: 400,
                }
            );
        }

        // Fetch Order
        const { data: order, error: orderError } = await supabaseAdmin
            .from("orders")
            .select("*")
            .eq("id", orderId)
            .single();

        if (orderError || !order) {
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

        // Fetch Order Items
        const { data: items, error: itemError } = await supabaseAdmin
            .from("order_items")
            .select("*")
            .eq("order_id", orderId);

        if (itemError) {
            return NextResponse.json(
                {
                    success: false,
                    message: itemError.message,
                },
                {
                    status: 500,
                }
            );
        }

        return NextResponse.json({
            success: true,
            order,
            items,
        });

    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                success: false,
                message: "Internal Server Error",
            },
            {
                status: 500,
            }
        );
    }
}