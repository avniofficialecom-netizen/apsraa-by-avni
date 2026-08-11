import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAdmin } from "../../../lib/supabase-admin";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const orderId = Number(body.orderId);

        const contact = String(
            body.contact || ""
        )
            .trim()
            .toLowerCase();

        // ==========================================
        // VALIDATE ORDER ID
        // ==========================================

        if (!orderId || isNaN(orderId)) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Valid Order ID is required.",
                },
                {
                    status: 400,
                }
            );
        }

        // ==========================================
        // CHECK WHETHER REQUEST IS FROM ADMIN
        // ==========================================

        let isAdmin = false;

        try {
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
                                // Middleware may handle cookie updates.
                            }
                        },
                    },
                }
            );

            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (!userError && user) {
                const adminEmail =
                    process.env.ADMIN_EMAIL;

                if (
                    adminEmail &&
                    user.email?.toLowerCase() ===
                    adminEmail.toLowerCase()
                ) {
                    isAdmin = true;
                }
            }
        } catch (authError) {
            console.warn(
                "Invoice admin authentication check failed:",
                authError
            );
        }

        console.log(
            "INVOICE REQUEST:",
            {
                orderId,
                isAdmin,
                hasContact: Boolean(contact),
            }
        );

        // ==========================================
        // CUSTOMER CONTACT REQUIRED
        // ONLY IF NOT ADMIN
        // ==========================================

        if (!isAdmin && !contact) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Email or phone number is required.",
                },
                {
                    status: 400,
                }
            );
        }

        // ==========================================
        // FETCH ORDER
        // ==========================================

        const {
            data: order,
            error: orderError,
        } = await supabaseAdmin
            .from("orders")
            .select(`
                id,
                customer_name,
                email,
                phone,
                address,
                total,
                status,
                payment_status,
                razorpay_order_id,
                razorpay_payment_id,
                created_at
            `)
            .eq("id", orderId)
            .single();

        if (orderError || !order) {
            console.error(
                "Invoice order error:",
                orderError
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Order not found.",
                },
                {
                    status: 404,
                }
            );
        }

        // ==========================================
        // CUSTOMER VERIFICATION
        // ==========================================

        // Admin does NOT need customer verification.
        if (!isAdmin) {
            const customerEmail =
                String(order.email || "")
                    .trim()
                    .toLowerCase();

            const customerPhone =
                String(order.phone || "")
                    .replace(/\D/g, "");

            const enteredPhone =
                contact.replace(/\D/g, "");

            const emailMatches =
                contact === customerEmail &&
                customerEmail !== "";

            const phoneMatches =
                enteredPhone === customerPhone &&
                customerPhone !== "";

            if (
                !emailMatches &&
                !phoneMatches
            ) {
                return NextResponse.json(
                    {
                        success: false,
                        message:
                            "The email or phone number does not match this order.",
                    },
                    {
                        status: 403,
                    }
                );
            }

            console.log(
                "✅ CUSTOMER VERIFIED FOR INVOICE:",
                orderId
            );
        } else {
            console.log(
                "✅ ADMIN VERIFIED FOR INVOICE:",
                orderId
            );
        }

        // ==========================================
        // FETCH ORDER ITEMS
        // ==========================================

        const {
            data: items,
            error: itemError,
        } = await supabaseAdmin
            .from("order_items")
            .select(`
                id,
                product_id,
                title,
                price,
                quantity
            `)
            .eq("order_id", orderId)
            .order("id", {
                ascending: true,
            });

        if (itemError) {
            console.error(
                "Invoice items error:",
                itemError
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Unable to load invoice items.",
                },
                {
                    status: 500,
                }
            );
        }

        // ==========================================
        // RETURN VERIFIED INVOICE DATA
        // ==========================================

        return NextResponse.json({
            success: true,

            order: {
                id: order.id,

                customer_name:
                order.customer_name,

                email:
                order.email,

                phone:
                order.phone,

                address:
                order.address,

                total:
                order.total,

                status:
                    order.status ||
                    "Pending",

                payment_status:
                    order.payment_status ||
                    "Pending",

                razorpay_order_id:
                order.razorpay_order_id,

                razorpay_payment_id:
                order.razorpay_payment_id,

                created_at:
                order.created_at,
            },

            items:
                items || [],

            access:
                isAdmin
                    ? "admin"
                    : "customer",
        });

    } catch (error) {
        console.error(
            "Invoice API Error:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                message:
                    error instanceof Error
                        ? error.message
                        : "Internal Server Error.",
            },
            {
                status: 500,
            }
        );
    }
}