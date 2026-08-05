import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase-admin";

const allowedStatuses = [
    "Pending",
    "Confirmed",
    "Packed",
    "Shipped",
    "Delivered",
    "Cancelled",
];

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const id = Number(body.id);
        const status = body.status;

        if (!id || isNaN(id)) {
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

        if (!status) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Order status is required.",
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
                    message: "Invalid order status.",
                },
                {
                    status: 400,
                }
            );
        }

        // Check if order exists
        const { data: order, error: findError } = await supabaseAdmin
            .from("orders")
            .select("id")
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

        // Update order status
        const { error: updateError } = await supabaseAdmin
            .from("orders")
            .update({
                status: status,
            })
            .eq("id", id);

        if (updateError) {
            console.error("Supabase Update Error:", updateError);

            return NextResponse.json(
                {
                    success: false,
                    message: updateError.message,
                },
                {
                    status: 500,
                }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Order status updated successfully.",
        });

    } catch (error) {
        console.error("Update Order Status Error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Internal server error.",
            },
            {
                status: 500,
            }
        );
    }
}