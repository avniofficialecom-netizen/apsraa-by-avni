import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAdmin } from "../../../lib/supabase-admin";

export async function GET() {
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
                            // Middleware handles cookie updates.
                        }
                    },
                },
            }
        );

        const {
            data: { user },
            error: userError,
        } =
            await supabase.auth.getUser();

        // ==========================================
        // REQUIRE LOGIN
        // ==========================================

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
        // REQUIRE ADMIN ACCOUNT
        // ==========================================

        const adminEmail =
            process.env.ADMIN_EMAIL;

        if (
            !adminEmail ||
            user.email?.toLowerCase() !==
            adminEmail.toLowerCase()
        ) {
            console.warn(
                "Unauthorized test-email attempt:",
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
        // TEST ORDER
        // ==========================================

        const orderId = 47;

        console.log(
            "========== TEST REAL ORDER EMAIL =========="
        );

        console.log(
            "ADMIN:",
            user.email
        );

        console.log(
            "TEST ORDER:",
            orderId
        );

        // ==========================================
        // GET EXISTING ORDER
        // ==========================================

        const {
            data: order,
            error: orderError,
        } =
            await supabaseAdmin
                .from("orders")
                .select(`
                    id,
                    customer_name,
                    email,
                    total,
                    status,
                    payment_status
                `)
                .eq("id", orderId)
                .single();

        if (orderError || !order) {
            console.error(
                "ORDER FETCH ERROR:",
                orderError
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        `Order #${orderId} not found.`,
                },
                {
                    status: 404,
                }
            );
        }

        // ==========================================
        // CUSTOMER EMAIL
        // ==========================================

        if (!order.email) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        `Order #${orderId} does not have a customer email.`,
                },
                {
                    status: 400,
                }
            );
        }

        // ==========================================
        // SEND TEST EMAIL
        // ==========================================

        const siteUrl =
            process.env.NEXT_PUBLIC_SITE_URL ||
            "http://localhost:3000";

        const emailResponse =
            await fetch(
                `${siteUrl}/api/send-order-email`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({
                        orderId:
                        order.id,
                    }),
                }
            );

        const emailResult =
            await emailResponse.json();

        console.log(
            "EMAIL STATUS:",
            emailResponse.status
        );

        console.log(
            "EMAIL RESULT:",
            emailResult
        );

        // ==========================================
        // RETURN RESULT
        // ==========================================

        return NextResponse.json({
            success:
                emailResponse.ok &&
                emailResult.success,

            orderId:
            order.id,

            email:
            order.email,

            emailResult,
        });

    } catch (error) {
        console.error(
            "TEST EMAIL ERROR:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                message:
                    error instanceof Error
                        ? error.message
                        : "Unable to test email.",
            },
            {
                status: 500,
            }
        );
    }
}