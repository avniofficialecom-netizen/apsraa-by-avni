import { NextResponse } from "next/server";
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
                "id, status, delivered_at"
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
        // PREPARE ORDER UPDATE
        // ==========================================

        const updateData: {
            status: string;
            delivered_at?: string | null;
        } = {
            status,
        };

        // ==========================================
        // DELIVERY TIMESTAMP
        // ==========================================

        // When an order becomes Delivered for the first
        // time, save the delivery timestamp.

        if (
            status === "Delivered" &&
            !order.delivered_at
        ) {
            updateData.delivered_at =
                new Date().toISOString();
        }

        // IMPORTANT:
        //
        // We intentionally DO NOT clear delivered_at
        // when an order later becomes:
        //
        // Return Requested
        // Return Approved
        // Return Rejected
        // Return Received
        // Refunded
        //
        // The delivery timestamp is historical information
        // and should remain available.

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
                "id, status, delivered_at"
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

        // Only create a history record when the status
        // actually changes.

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

                // The order update succeeded.
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