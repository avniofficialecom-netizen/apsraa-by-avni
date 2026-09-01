import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAdmin } from "../../../../../lib/supabase-admin";

export async function GET(
    req: Request,
    context: {
        params: Promise<{ id: string }>;
    }
) {
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
                { status: 401 }
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
                { status: 500 }
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
                { status: 403 }
            );
        }

        // ==========================================
        // GET ORDER ID
        // ==========================================

        const { id: rawId } = await context.params;

        const orderId = Number(rawId);

        if (
            !Number.isInteger(orderId) ||
            orderId <= 0
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid Order ID.",
                },
                { status: 400 }
            );
        }

        // ==========================================
        // GET ORDER
        // ==========================================

        const {
            data: order,
            error: orderError,
        } = await supabaseAdmin
            .from("orders")
            .select("*")
            .eq("id", orderId)
            .single();

        if (orderError || !order) {
            console.error(
                "Admin Order Fetch Error:",
                orderError
            );

            return NextResponse.json(
                {
                    success: false,
                    message: "Order not found.",
                },
                { status: 404 }
            );
        }

        // ==========================================
        // GET ORDER ITEMS
        // ==========================================

        const {
            data: rawItems,
            error: itemsError,
        } = await supabaseAdmin
            .from("order_items")
            .select(
                "id, order_id, product_id, variant_id, title, quantity, price"
            )
            .eq("order_id", orderId)
            .order("id", {
                ascending: true,
            });

        if (itemsError) {
            console.error(
                "Admin Order Items Fetch Error:",
                itemsError
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Unable to load order items.",
                },
                { status: 500 }
            );
        }

        const items = rawItems || [];

        // ==========================================
        // GET VARIANTS
        // ==========================================

        const variantIds = [
            ...new Set(
                items
                    .map(
                        (item) =>
                            item.variant_id
                    )
                    .filter(
                        (
                            id
                        ): id is number =>
                            Number.isInteger(
                                Number(id)
                            )
                    )
                    .map(Number)
            ),
        ];

        let variants: {
            id: number;
            product_id: number;
            sku: string | null;
            size: string | null;
            color: string | null;
            stock: number;
            price: number | null;
        }[] = [];

        if (variantIds.length > 0) {
            const {
                data: variantData,
                error: variantError,
            } = await supabaseAdmin
                .from("product_variants")
                .select(
                    "id, product_id, sku, size, color, stock, price"
                )
                .in("id", variantIds);

            if (variantError) {
                console.error(
                    "Admin Variant Fetch Error:",
                    variantError
                );
            } else {
                variants =
                    variantData || [];
            }
        }

        // ==========================================
        // MAP VARIANTS TO ORDER ITEMS
        // ==========================================

        const variantMap = new Map(
            variants.map((variant) => [
                Number(variant.id),
                variant,
            ])
        );

        const enrichedItems = items.map(
            (item) => {
                const variantId =
                    item.variant_id !==
                    null &&
                    item.variant_id !==
                    undefined
                        ? Number(
                            item.variant_id
                        )
                        : null;

                const variant =
                    variantId !== null
                        ? variantMap.get(
                            variantId
                        )
                        : null;

                return {
                    ...item,

                    variant_id:
                    variantId,

                    sku:
                        variant?.sku ??
                        null,

                    size:
                        variant?.size ??
                        null,

                    color:
                        variant?.color ??
                        null,

                    variant_stock:
                        variant?.stock ??
                        null,

                    variant_price:
                        variant?.price ??
                        null,
                };
            }
        );

        // ==========================================
        // SUCCESS
        // ==========================================

        return NextResponse.json({
            success: true,
            order,
            items: enrichedItems,
        });
    } catch (error) {
        console.error(
            "Admin Order Details API Error:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                message:
                    "Internal server error.",
            },
            { status: 500 }
        );
    }
}