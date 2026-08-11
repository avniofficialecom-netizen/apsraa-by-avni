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
                "Unauthorized admin dashboard request:",
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
            data: orderData,
            error: orderError,
        } = await supabaseAdmin
            .from("orders")
            .select(
                "id, customer_name, total, phone, status, payment_status"
            );

        if (orderError) {
            console.error(
                "Dashboard orders error:",
                orderError
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Unable to load order data.",
                },
                {
                    status: 500,
                }
            );
        }

        const allOrders =
            orderData ?? [];

        // ==========================================
        // ORDER STATISTICS
        // ==========================================

        const orders =
            allOrders.length;

        const activeOrderValue =
            allOrders.reduce(
                (sum, order) => {
                    if (
                        order.status ===
                        "Cancelled"
                    ) {
                        return sum;
                    }

                    return (
                        sum +
                        Number(
                            order.total || 0
                        )
                    );
                },
                0
            );

        const paid =
            allOrders.filter(
                (order) =>
                    order.payment_status ===
                    "Paid" &&
                    order.status !==
                    "Cancelled"
            );

        const paidOrders =
            paid.length;

        const paidRevenue =
            paid.reduce(
                (sum, order) =>
                    sum +
                    Number(
                        order.total || 0
                    ),
                0
            );

        const cancelled =
            allOrders.filter(
                (order) =>
                    order.status ===
                    "Cancelled"
            );

        const cancelledOrders =
            cancelled.length;

        const cancelledValue =
            cancelled.reduce(
                (sum, order) =>
                    sum +
                    Number(
                        order.total || 0
                    ),
                0
            );

        const uniqueCustomers =
            new Set(
                allOrders
                    .map(
                        (order) =>
                            order.phone
                    )
                    .filter(Boolean)
            );

        const customers =
            uniqueCustomers.size;

        const pendingOrders =
            allOrders.filter(
                (order) =>
                    order.status ===
                    "Pending"
            ).length;

        const confirmedOrders =
            allOrders.filter(
                (order) =>
                    order.status ===
                    "Confirmed"
            ).length;

        const packedOrders =
            allOrders.filter(
                (order) =>
                    order.status ===
                    "Packed"
            ).length;

        const shippedOrders =
            allOrders.filter(
                (order) =>
                    order.status ===
                    "Shipped"
            ).length;

        const deliveredOrders =
            allOrders.filter(
                (order) =>
                    order.status ===
                    "Delivered"
            ).length;

        // ==========================================
        // RECENT ORDERS
        // ==========================================

        const recentOrders =
            [...allOrders]
                .sort(
                    (a, b) =>
                        Number(b.id) -
                        Number(a.id)
                )
                .slice(0, 5);

        // ==========================================
        // PRODUCT COUNT
        // ==========================================

        const {
            count: productCount,
            error: productError,
        } =
            await supabaseAdmin
                .from("products")
                .select("id", {
                    count: "exact",
                    head: true,
                });

        if (productError) {
            console.error(
                "Dashboard product count error:",
                productError
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Unable to load product count.",
                },
                {
                    status: 500,
                }
            );
        }

        // ==========================================
        // LOW STOCK PRODUCTS
        // ==========================================

        const {
            data: lowStock,
            error: lowStockError,
        } =
            await supabaseAdmin
                .from("products")
                .select(
                    "id, title, stock"
                )
                .lte("stock", 5)
                .order("stock", {
                    ascending: true,
                });

        if (lowStockError) {
            console.error(
                "Dashboard low stock error:",
                lowStockError
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Unable to load low stock products.",
                },
                {
                    status: 500
                }
            );
        }

        // ==========================================
        // SUCCESS
        // ==========================================

        return NextResponse.json({
            success: true,

            stats: {
                orders,
                paidOrders,
                paidRevenue,
                grossOrderValue:
                activeOrderValue,
                cancelledOrders,
                cancelledValue,
                customers,
                pendingOrders,
                confirmedOrders,
                packedOrders,
                shippedOrders,
                deliveredOrders,
                products:
                    productCount ?? 0,
            },

            recentOrders:
                recentOrders ?? [],

            lowStockProducts:
                lowStock ?? [],
        });

    } catch (error) {
        console.error(
            "Admin Dashboard API Error:",
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