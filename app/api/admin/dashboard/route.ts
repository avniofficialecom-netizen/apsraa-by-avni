import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAdmin } from "../../../../lib/supabase-admin";

type DashboardOrder = {
    id: number;
    customer_name: string;
    total: string | number | null;
    phone: string | null;
    status: string;
    payment_status: string | null;
    created_at: string | null;
    delivered_at: string | null;
    archived: boolean | null;
};

type DailyRevenue = {
    date: string;
    revenue: number;
    orders: number;
};

export async function GET() {
    try {
        // ==========================================
        // SUPABASE SERVER CLIENT
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
                            // Middleware can refresh cookies.
                        }
                    },
                },
            }
        );

        // ==========================================
        // AUTHENTICATION
        // ==========================================

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Unauthorized. Please login again.",
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
            process.env.NEXT_PUBLIC_ADMIN_EMAIL
                ?.trim()
                .toLowerCase();

        const loggedInEmail =
            user.email
                ?.trim()
                .toLowerCase();

        if (!adminEmail) {
            console.error(
                "NEXT_PUBLIC_ADMIN_EMAIL is missing."
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Server admin configuration is missing.",
                },
                {
                    status: 500,
                }
            );
        }

        if (
            !loggedInEmail ||
            loggedInEmail !== adminEmail
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
        // FETCH ALL ORDERS
        // ==========================================

        async function fetchAllOrders(): Promise<
            DashboardOrder[]
        > {
            const pageSize = 50;

            let from = 0;

            const allOrders: DashboardOrder[] = [];

            while (true) {
                const to =
                    from + pageSize - 1;

                const {
                    data,
                    error,
                } = await supabaseAdmin
                    .from("orders")
                    .select(
                        "id, customer_name, total, phone, status, payment_status, created_at, delivered_at, archived"
                    )
                    .order("id", {
                        ascending: true,
                    })
                    .range(from, to);

                if (error) {
                    throw new Error(
                        `Orders query failed: ${error.message}`
                    );
                }

                const page =
                    (data ??
                        []) as DashboardOrder[];

                allOrders.push(
                    ...page
                );

                console.log(
                    `Dashboard orders page: ${from}-${to}, received ${page.length}`
                );

                if (
                    page.length <
                    pageSize
                ) {
                    break;
                }

                from += pageSize;
            }

            console.log(
                `Dashboard total orders loaded: ${allOrders.length}`
            );

            return allOrders;
        }

        const allOrders =
            await fetchAllOrders();

        // ==========================================
        // INDIA DATE HELPERS
        // ==========================================

        const INDIA_TIME_ZONE =
            "Asia/Kolkata";

        function getIndiaDateKey(
            dateValue:
                string | null | undefined
        ): string | null {
            if (!dateValue) {
                return null;
            }

            const date =
                new Date(dateValue);

            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {
                return null;
            }

            const parts =
                new Intl.DateTimeFormat(
                    "en-CA",
                    {
                        timeZone:
                        INDIA_TIME_ZONE,
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                    }
                ).formatToParts(date);

            const year =
                parts.find(
                    (part) =>
                        part.type ===
                        "year"
                )?.value;

            const month =
                parts.find(
                    (part) =>
                        part.type ===
                        "month"
                )?.value;

            const day =
                parts.find(
                    (part) =>
                        part.type ===
                        "day"
                )?.value;

            if (
                !year ||
                !month ||
                !day
            ) {
                return null;
            }

            return `${year}-${month}-${day}`;
        }

        function getIndiaDateDaysAgo(
            days: number
        ): string {
            const date =
                new Date();

            date.setDate(
                date.getDate() - days
            );

            return (
                getIndiaDateKey(
                    date.toISOString()
                ) ?? ""
            );
        }

        const todayIndia =
            getIndiaDateKey(
                new Date().toISOString()
            ) ?? "";

        const sevenDaysAgo =
            getIndiaDateDaysAgo(6);

        const thirtyDaysAgo =
            getIndiaDateDaysAgo(29);

        // ==========================================
        // PERIOD FILTERS
        // ==========================================

        const ordersToday =
            allOrders.filter(
                (order) =>
                    getIndiaDateKey(
                        order.created_at
                    ) === todayIndia
            );

        const ordersLast7Days =
            allOrders.filter(
                (order) => {
                    const dateKey =
                        getIndiaDateKey(
                            order.created_at
                        );

                    return (
                        !!dateKey &&
                        dateKey >=
                        sevenDaysAgo &&
                        dateKey <=
                        todayIndia
                    );
                }
            );

        const ordersLast30Days =
            allOrders.filter(
                (order) => {
                    const dateKey =
                        getIndiaDateKey(
                            order.created_at
                        );

                    return (
                        !!dateKey &&
                        dateKey >=
                        thirtyDaysAgo &&
                        dateKey <=
                        todayIndia
                    );
                }
            );

        // ==========================================
        // REVENUE
        // ==========================================

        function calculateRevenue(
            orderList: DashboardOrder[]
        ): number {
            return orderList.reduce(
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
        }

        // ==========================================
        // AOV
        // ==========================================

        function calculateAOV(
            orderList: DashboardOrder[]
        ): number {
            const validOrders =
                orderList.filter(
                    (order) =>
                        order.status !==
                        "Cancelled"
                );

            if (
                validOrders.length ===
                0
            ) {
                return 0;
            }

            return (
                calculateRevenue(
                    validOrders
                ) /
                validOrders.length
            );
        }

        // ==========================================
        // DAILY REVENUE — LAST 30 DAYS
        // ==========================================

        const dailyRevenue: DailyRevenue[] =
            [];

        for (
            let daysAgo = 29;
            daysAgo >= 0;
            daysAgo--
        ) {
            const dateKey =
                getIndiaDateDaysAgo(
                    daysAgo
                );

            const dayOrders =
                allOrders.filter(
                    (order) =>
                        getIndiaDateKey(
                            order.created_at
                        ) === dateKey
                );

            dailyRevenue.push({
                date: dateKey,
                revenue:
                    calculateRevenue(
                        dayOrders
                    ),
                orders:
                dayOrders.length,
            });
        }

        // ==========================================
        // PERIOD ANALYTICS
        // ==========================================

        const todayRevenue =
            calculateRevenue(
                ordersToday
            );

        const sevenDayRevenue =
            calculateRevenue(
                ordersLast7Days
            );

        const thirtyDayRevenue =
            calculateRevenue(
                ordersLast30Days
            );

        const todayAOV =
            calculateAOV(
                ordersToday
            );

        const sevenDayAOV =
            calculateAOV(
                ordersLast7Days
            );

        const thirtyDayAOV =
            calculateAOV(
                ordersLast30Days
            );

        const deliveredToday =
            ordersToday.filter(
                (order) =>
                    order.status ===
                    "Delivered"
            ).length;

        const deliveredLast7Days =
            ordersLast7Days.filter(
                (order) =>
                    order.status ===
                    "Delivered"
            ).length;

        const deliveredLast30Days =
            ordersLast30Days.filter(
                (order) =>
                    order.status ===
                    "Delivered"
            ).length;

        const cancelledToday =
            ordersToday.filter(
                (order) =>
                    order.status ===
                    "Cancelled"
            ).length;

        const cancelledLast7Days =
            ordersLast7Days.filter(
                (order) =>
                    order.status ===
                    "Cancelled"
            ).length;

        const cancelledLast30Days =
            ordersLast30Days.filter(
                (order) =>
                    order.status ===
                    "Cancelled"
            ).length;

        // ==========================================
        // TOTAL ORDERS
        // ==========================================

        const orders =
            allOrders.length;

        // ==========================================
        // GROSS ORDER VALUE
        // ==========================================

        const grossOrderValue =
            calculateRevenue(
                allOrders
            );

        // ==========================================
        // PAID ORDERS
        // ==========================================

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
            calculateRevenue(
                paid
            );

        // ==========================================
        // CANCELLED ORDERS
        // ==========================================

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

        // ==========================================
        // CUSTOMERS
        // ==========================================

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

        // ==========================================
        // ORDER STATUS
        // ==========================================

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
        } = await supabaseAdmin
            .from("products")
            .select("id", {
                count: "exact",
                head: true,
            });

        if (productError) {
            throw new Error(
                `Product count failed: ${productError.message}`
            );
        }

        // ==========================================
        // LOW STOCK
        // ==========================================

        const {
            data: lowStock,
            error: lowStockError,
        } = await supabaseAdmin
            .from("products")
            .select(
                "id, title, stock"
            )
            .lte("stock", 5)
            .order("stock", {
                ascending: true,
            });

        if (lowStockError) {
            throw new Error(
                `Low stock query failed: ${lowStockError.message}`
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

                grossOrderValue,

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

                today: {
                    orders:
                    ordersToday.length,

                    revenue:
                    todayRevenue,

                    aov:
                    todayAOV,

                    delivered:
                    deliveredToday,

                    cancelled:
                    cancelledToday,
                },

                last7Days: {
                    orders:
                    ordersLast7Days.length,

                    revenue:
                    sevenDayRevenue,

                    aov:
                    sevenDayAOV,

                    delivered:
                    deliveredLast7Days,

                    cancelled:
                    cancelledLast7Days,
                },

                last30Days: {
                    orders:
                    ordersLast30Days.length,

                    revenue:
                    thirtyDayRevenue,

                    aov:
                    thirtyDayAOV,

                    delivered:
                    deliveredLast30Days,

                    cancelled:
                    cancelledLast30Days,
                },
            },

            // ======================================
            // NEW DAILY BUSINESS INSIGHTS DATA
            // ======================================

            dailyRevenue,

            recentOrders,

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
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error",
            },
            {
                status: 500,
            }
        );
    }
}