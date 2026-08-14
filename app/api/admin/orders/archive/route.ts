import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAdmin } from "../../../../../lib/supabase-admin";export async function POST(req: Request) {
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
                "Unauthorized archive API attempt:",
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
        const archived = body.archived;

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
        // VALIDATE ARCHIVED VALUE
        // ==========================================

        if (typeof archived !== "boolean") {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Archived value must be true or false.",
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
            .select("id, archived")
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
        // UPDATE ARCHIVE STATUS
        // ==========================================

        const {
            data: updatedOrder,
            error: updateError,
        } = await supabaseAdmin
            .from("orders")
            .update({
                archived,
            })
            .eq("id", id)
            .select("id, archived")
            .single();

        if (updateError) {
            console.error(
                "Supabase Archive Update Error:",
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
        // SUCCESS
        // ==========================================

        const action = archived
            ? "archived"
            : "restored";

        console.log(
            `✅ Order #${id} ${action}`
        );

        return NextResponse.json({
            success: true,
            message: archived
                ? "Order archived successfully."
                : "Order restored successfully.",
            order: updatedOrder,
        });
    } catch (error) {
        console.error(
            "Order Archive API Error:",
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