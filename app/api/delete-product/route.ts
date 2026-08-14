import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAdmin } from "../../../lib/supabase-admin";

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
                                ({ name, value, options }) => {
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
                    message: "Unauthorized. Admin login required.",
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
                    message: "Admin configuration is missing.",
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
                "Unauthorized product deletion attempt:",
                user.email
            );

            return NextResponse.json(
                {
                    success: false,
                    message: "Forbidden. Admin access required.",
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

        if (!id || Number.isNaN(id)) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Valid Product ID is required.",
                },
                {
                    status: 400,
                }
            );
        }

        // ==========================================
        // CHECK PRODUCT EXISTS
        // ==========================================

        const {
            data: product,
            error: findError,
        } = await supabaseAdmin
            .from("products")
            .select("id, title")
            .eq("id", id)
            .maybeSingle();

        if (findError) {
            console.error(
                "Find Product Error:",
                findError
            );

            return NextResponse.json(
                {
                    success: false,
                    message: findError.message,
                },
                {
                    status: 500,
                }
            );
        }

        if (!product) {
            return NextResponse.json(
                {
                    success: false,
                    message: `Product #${id} not found.`,
                },
                {
                    status: 404,
                }
            );
        }

        // ==========================================
        // DELETE PRODUCT
        // ==========================================

        const {
            error: deleteError,
        } = await supabaseAdmin
            .from("products")
            .delete()
            .eq("id", id);

        if (deleteError) {
            console.error(
                "Supabase Delete Product Error:",
                deleteError
            );

            return NextResponse.json(
                {
                    success: false,
                    message: deleteError.message,
                },
                {
                    status: 500,
                }
            );
        }

        console.log(
            `✅ Product deleted: #${id} - ${product.title}`
        );

        return NextResponse.json({
            success: true,
            message: "Product deleted successfully.",
            productId: id,
        });

    } catch (error) {
        console.error(
            "Delete Product Error:",
            error
        );

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