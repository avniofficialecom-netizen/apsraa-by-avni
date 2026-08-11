import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAdmin } from "../../../../lib/supabase-admin";

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
                "Unauthorized admin orders request:",
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
        // FETCH ORDERS
        // ==========================================

        const {
            data: orders,
            error,
        } = await supabaseAdmin
            .from("orders")
            .select("*")
            .order("id", {
                ascending: false,
            });

        if (error) {
            console.error(
                "Admin Orders Fetch Error:",
                error
            );

            return NextResponse.json(
                {
                    success: false,
                    message: error.message,
                },
                {
                    status: 500,
                }
            );
        }

        // ==========================================
        // SUCCESS
        // ==========================================

        return NextResponse.json({
            success: true,
            orders: orders ?? [],
        });

    } catch (error) {
        console.error(
            "Admin Orders API Error:",
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