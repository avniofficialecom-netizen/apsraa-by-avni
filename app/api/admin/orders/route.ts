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

        // ==========================================
        // VERIFY LOGIN
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
        // READ QUERY PARAMETERS
        // ==========================================

        const { searchParams } =
            new URL(req.url);

        const pageParam =
            Number(
                searchParams.get("page") || "1"
            );

        const page = Math.max(
            1,
            Number.isFinite(pageParam)
                ? pageParam
                : 1
        );

        const search =
            searchParams
                .get("search")
                ?.trim() || "";

        const status =
            searchParams.get("status") || "All";

        const payment =
            searchParams.get("payment") || "All";

        const sort =
            searchParams.get("sort") || "newest";

        const archivedParam =
            searchParams.get("archived") || "false";

        const isArchived =
            archivedParam.toLowerCase() ===
            "true";

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
                    message:
                        "Invalid order status.",
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
                    message:
                        "Invalid payment filter.",
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
                    message:
                        "Invalid sort option.",
                },
                {
                    status: 400,
                }
            );
        }

        // ==========================================
        // CALCULATE RANGE
        // ==========================================

        const from =
            (page - 1) * PAGE_SIZE;

        const to =
            from + PAGE_SIZE - 1;

        // ==========================================
        // BUILD QUERY
        // ==========================================

        let query = supabaseAdmin
            .from("orders")
            .select("*", {
                count: "exact",
            })
            .eq(
                "archived",
                isArchived
            );

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
        // SEARCH
        // ==========================================

        if (search) {
            const numericSearch =
                Number(search);

            // Exact Order ID search
            if (
                Number.isInteger(
                    numericSearch
                ) &&
                numericSearch > 0
            ) {
                query = query.eq(
                    "id",
                    numericSearch
                );
            } else {
                // Text search
                const safeSearch =
                    search
                        .replace(
                            /[%_]/g,
                            ""
                        )
                        .replace(
                            /,/g,
                            " "
                        );

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
                ascending:
                    sort === "oldest",
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
        // EXECUTE
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
                    message:
                    error.message,
                },
                {
                    status: 500,
                }
            );
        }

        // ==========================================
        // TOTALS
        // ==========================================

        const totalOrders =
            count ?? 0;

        const totalPages =
            Math.max(
                1,
                Math.ceil(
                    totalOrders /
                    PAGE_SIZE
                )
            );

        // ==========================================
        // SUCCESS
        // ==========================================

        console.log(
            `Admin Orders API: ${isArchived ? "Archived" : "Active"} | Page ${page}/${totalPages} | ${orders?.length || 0} orders | Total ${totalOrders}`
        );

        return NextResponse.json({
            success: true,

            orders:
                orders ?? [],

            totalOrders,

            totalPages,

            currentPage: page,

            pageSize: PAGE_SIZE,

            archived: isArchived,
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