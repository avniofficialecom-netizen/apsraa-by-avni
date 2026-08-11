import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
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
            process.env.ADMIN_EMAIL;

        if (
            !adminEmail ||
            user.email?.toLowerCase() !==
            adminEmail.toLowerCase()
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
            .select("id, status")
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
        // UPDATE ORDER STATUS
        // ==========================================

        const {
            data: updatedOrder,
            error: updateError,
        } = await supabaseAdmin
            .from("orders")
            .update({
                status,
            })
            .eq("id", id)
            .select("id, status")
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

        console.log(
            `✅ Order #${id} status changed from ${order.status} to ${status}`
        );

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