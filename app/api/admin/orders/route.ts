import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAdmin } from "../../../../lib/supabase-admin";

const PAGE_SIZE = 50;

const allowedStatuses = [
    "Pending",
    "Confirmed",
    "Packed",
    "Shipped",
    "Delivered",
    "Cancelled",
];

export async function GET(req: Request) {
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

        // ==========================================
        // VERIFY LOGIN
        // ==========================================

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
                "Unauthorized admin orders request:",
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
        // QUERY PARAMETERS
        // ==========================================

        const { searchParams } = new URL(req.url);

        const pageParam = Number(
            searchParams.get("page") || "1"
        );

        const page = Math.max(
            1,
            Number.isFinite(pageParam)
                ? pageParam
                : 1
        );

        const search =
            searchParams.get("search")?.trim() || "";

        const productSearch =
            searchParams.get("product")?.trim() || "";

        const status =
            searchParams.get("status") || "All";

        const payment =
            searchParams.get("payment") || "All";

        const sort =
            searchParams.get("sort") || "newest";

        const archivedParam =
            searchParams.get("archived") || "false";

        const isArchived =
            archivedParam.toLowerCase() === "true";

        // ==========================================
        // VALIDATE STATUS
        // ==========================================

        if (
            status !== "All" &&
            !allowedStatuses.includes(status)
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid order status.",
                },
                {
                    status: 400,
                }
            );
        }

        // ==========================================
        // VALIDATE PAYMENT
        // ==========================================

        if (
            payment !== "All" &&
            payment !== "Paid" &&
            payment !== "Pending"
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid payment filter.",
                },
                {
                    status: 400,
                }
            );
        }

        // ==========================================
        // VALIDATE SORT
        // ==========================================

        if (
            sort !== "newest" &&
            sort !== "oldest"
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid sort option.",
                },
                {
                    status: 400,
                }
            );
        }

        // ==========================================
        // CALCULATE RANGE
        // ==========================================

        const from = (page - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        // ==========================================
        // PRODUCT SEARCH
        //
        // order_items stores the product title.
        // ==========================================

        let productOrderIds: number[] | null = null;

        if (productSearch) {
            const safeProductSearch = productSearch
                .replace(/[%_]/g, "")
                .replace(/,/g, " ")
                .trim();

            if (safeProductSearch) {
                const {
                    data: matchingItems,
                    error: itemError,
                } = await supabaseAdmin
                    .from("order_items")
                    .select("order_id")
                    .ilike(
                        "title",
                        `%${safeProductSearch}%`
                    );

                if (itemError) {
                    console.error(
                        "Product order search error:",
                        itemError
                    );

                    return NextResponse.json(
                        {
                            success: false,
                            message:
                                "Unable to search orders by product.",
                            error: itemError.message,
                        },
                        {
                            status: 500,
                        }
                    );
                }

                productOrderIds = Array.from(
                    new Set(
                        (matchingItems || [])
                            .map((item) =>
                                Number(item.order_id)
                            )
                            .filter((id) =>
                                Number.isFinite(id)
                            )
                    )
                );

                // No order contains this product.
                if (productOrderIds.length === 0) {
                    return NextResponse.json({
                        success: true,
                        orders: [],
                        totalOrders: 0,
                        totalPages: 1,
                        currentPage: page,
                        pageSize: PAGE_SIZE,
                        archived: isArchived,
                        productSearch:
                            productSearch || null,
                    });
                }
            }
        }

        // ==========================================
        // BUILD ORDERS QUERY
        // ==========================================

        let query = supabaseAdmin
            .from("orders")
            .select("*", {
                count: "exact",
            })
            .eq("archived", isArchived);

        // ==========================================
        // PRODUCT FILTER
        // ==========================================

        if (productOrderIds !== null) {
            query = query.in(
                "id",
                productOrderIds
            );
        }

        // ==========================================
        // STATUS FILTER
        // ==========================================

        if (status !== "All") {
            query = query.eq(
                "status",
                status
            );
        }

        // ==========================================
        // PAYMENT FILTER
        // ==========================================

        if (payment !== "All") {
            query = query.eq(
                "payment_status",
                payment
            );
        }

        // ==========================================
        // CUSTOMER / ORDER SEARCH
        // ==========================================

        if (search) {
            const numericSearch = Number(search);

            // Exact Order ID search
            if (
                Number.isInteger(numericSearch) &&
                numericSearch > 0
            ) {
                query = query.eq(
                    "id",
                    numericSearch
                );
            } else {
                const safeSearch = search
                    .replace(/[%_]/g, "")
                    .replace(/,/g, " ")
                    .trim();

                if (safeSearch) {
                    query = query.or(
                        `customer_name.ilike.%${safeSearch}%,phone.ilike.%${safeSearch}%,email.ilike.%${safeSearch}%`
                    );
                }
            }
        }

        // ==========================================
        // SORT
        // ==========================================

        query = query.order(
            "id",
            {
                ascending: sort === "oldest",
            }
        );

        // ==========================================
        // PAGINATION
        // ==========================================

        query = query.range(
            from,
            to
        );

        // ==========================================
        // EXECUTE ORDERS QUERY
        // ==========================================

        const {
            data: orders,
            error,
            count,
        } = await query;

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
        // FETCH ORDER ITEMS
        // ==========================================

        const orderIds = (orders || [])
            .map((order) => Number(order.id))
            .filter((id) => Number.isFinite(id));

        let orderItems: Array<{
            id: number;
            order_id: number;
            product_id: number | null;
            title: string | null;
            price: string | null;
            quantity: number | null;
        }> = [];

        if (orderIds.length > 0) {
            const {
                data: items,
                error: orderItemsError,
            } = await supabaseAdmin
                .from("order_items")
                .select(
                    "id, order_id, product_id, title, price, quantity"
                )
                .in("order_id", orderIds)
                .order("id", {
                    ascending: true,
                });

            if (orderItemsError) {
                console.error(
                    "Admin Order Items Fetch Error:",
                    orderItemsError
                );

                return NextResponse.json(
                    {
                        success: false,
                        message:
                            "Unable to load order items.",
                        error:
                        orderItemsError.message,
                    },
                    {
                        status: 500,
                    }
                );
            }

            orderItems = (items || []).map(
                (item) => ({
                    id: Number(item.id),
                    order_id: Number(item.order_id),
                    product_id:
                        item.product_id !== null &&
                        item.product_id !== undefined
                            ? Number(item.product_id)
                            : null,
                    title: item.title ?? null,
                    price: item.price ?? null,
                    quantity:
                        item.quantity !== null &&
                        item.quantity !== undefined
                            ? Number(item.quantity)
                            : null,
                })
            );
        }

        // ==========================================
        // FETCH PRODUCT IMAGES
        //
        // order_items does not store the image.
        // We use product_id -> products.id.
        // ==========================================

        const productIds = Array.from(
            new Set(
                orderItems
                    .map((item) => item.product_id)
                    .filter(
                        (id): id is number =>
                            id !== null &&
                            Number.isFinite(id)
                    )
            )
        );

        const productImageMap =
            new Map<number, string | null>();

        if (productIds.length > 0) {
            const {
                data: products,
                error: productsError,
            } = await supabaseAdmin
                .from("products")
                .select("id, image")
                .in("id", productIds);

            if (productsError) {
                console.error(
                    "Admin Product Image Fetch Error:",
                    productsError
                );

                return NextResponse.json(
                    {
                        success: false,
                        message:
                            "Unable to load product images.",
                        error:
                        productsError.message,
                    },
                    {
                        status: 500,
                    }
                );
            }

            (products || []).forEach(
                (product) => {
                    productImageMap.set(
                        Number(product.id),
                        product.image || null
                    );
                }
            );
        }

        // ==========================================
        // GROUP ITEMS BY ORDER
        // ==========================================

        const itemsByOrder = new Map<
            number,
            Array<{
                id: number;
                product_id: number | null;
                title: string | null;
                price: string | null;
                quantity: number | null;
                image: string | null;
            }>
        >();

        orderItems.forEach((item) => {
            const existing =
                itemsByOrder.get(item.order_id) || [];

            existing.push({
                id: item.id,
                product_id: item.product_id,
                title: item.title,
                price: item.price,
                quantity: item.quantity,
                image:
                    item.product_id !== null
                        ? productImageMap.get(
                        item.product_id
                    ) || null
                        : null,
            });

            itemsByOrder.set(
                item.order_id,
                existing
            );
        });

        // ==========================================
        // ATTACH ITEMS TO ORDERS
        // ==========================================

        const ordersWithItems = (orders || []).map(
            (order) => ({
                ...order,
                items:
                    itemsByOrder.get(
                        Number(order.id)
                    ) || [],
            })
        );

        // ==========================================
        // TOTALS
        // ==========================================

        const totalOrders = count ?? 0;

        const totalPages = Math.max(
            1,
            Math.ceil(
                totalOrders / PAGE_SIZE
            )
        );

        // ==========================================
        // SUCCESS
        // ==========================================

        console.log(
            `Admin Orders API: ${
                isArchived
                    ? "Archived"
                    : "Active"
            } | Page ${page}/${totalPages} | ${
                ordersWithItems.length
            } orders | Total ${totalOrders} | Product: ${
                productSearch || "All"
            }`
        );

        return NextResponse.json({
            success: true,

            orders: ordersWithItems,

            totalOrders,

            totalPages,

            currentPage: page,

            pageSize: PAGE_SIZE,

            archived: isArchived,

            productSearch:
                productSearch || null,
        });
    } catch (error) {
        console.error(
            "Admin Orders API Error:",
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