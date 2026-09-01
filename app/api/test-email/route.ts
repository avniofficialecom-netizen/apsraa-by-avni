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
        // REQUIRE ADMIN
        // ==========================================

        const adminEmail =
            process.env.ADMIN_EMAIL ||
            process.env.NEXT_PUBLIC_ADMIN_EMAIL;

        if (!adminEmail) {
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

        // Current verified test order.
        const orderId = 80;

        // ==========================================
        // GET ORDER
        // ==========================================

        const {
            data: order,
            error: orderError,
        } = await supabaseAdmin
            .from("orders")
            .select(
                `
                id,
                customer_name,
                email,
                phone,
                total,
                status,
                payment_status
                `
            )
            .eq("id", orderId)
            .single();

        if (orderError || !order) {
            console.error(
                "TEST EMAIL ORDER FETCH ERROR:",
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
        // CUSTOMER CONTACT VALIDATION
        // ==========================================

        const customerEmail =
            order.email?.trim();

        const customerPhone =
            order.phone
                ?.replace(/\D/g, "")
                .trim();

        if (
            !customerEmail &&
            !customerPhone
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        `Order #${orderId} has no customer email or phone.`,
                },
                {
                    status: 400,
                }
            );
        }

        // ==========================================
        // PRODUCTION SITE URL
        // ==========================================

        const siteUrl =
            process.env.NEXT_PUBLIC_SITE_URL ||
            "https://www.apsraa.shop";

        // ==========================================
        // SEND EMAIL
        // ==========================================

        console.log(
            "=========================================="
        );

        console.log(
            "TEST ORDER EMAIL"
        );

        console.log(
            "ADMIN:",
            user.email
        );

        console.log(
            "ORDER:",
            order.id
        );

        console.log(
            "CUSTOMER EMAIL:",
            customerEmail
        );

        console.log(
            "CUSTOMER PHONE:",
            customerPhone
        );

        console.log(
            "=========================================="
        );

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

                        email:
                            customerEmail ||
                            "",

                        phone:
                            customerPhone ||
                            "",
                    }),

                    cache: "no-store",
                }
            );

        const emailText =
            await emailResponse.text();

        let emailResult: unknown;

        try {
            emailResult =
                JSON.parse(emailText);
        } catch {
            emailResult = {
                raw: emailText,
            };
        }

        console.log(
            "EMAIL HTTP STATUS:",
            emailResponse.status
        );

        console.log(
            "EMAIL RESULT:",
            emailResult
        );

        // ==========================================
        // SUCCESS
        // ==========================================

        const emailSucceeded =
            emailResponse.ok &&
            typeof emailResult === "object" &&
            emailResult !== null &&
            "success" in emailResult &&
            Boolean(
                (
                    emailResult as {
                        success?: unknown;
                    }
                ).success
            );

        return NextResponse.json({
            success:
            emailSucceeded,

            orderId:
            order.id,

            customerEmail:
                customerEmail || null,

            customerPhone:
                customerPhone || null,

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