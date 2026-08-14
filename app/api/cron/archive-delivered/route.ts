import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase-admin";const ARCHIVE_AFTER_DAYS = 7;

export async function GET(req: Request) {
    try {
        // ==========================================
        // CRON SECURITY
        // ==========================================

        const authHeader = req.headers.get(
            "authorization"
        );

        const cronSecret =
            process.env.CRON_SECRET;

        if (!cronSecret) {
            console.error(
                "CRON_SECRET is not configured."
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Cron configuration is missing.",
                },
                {
                    status: 500,
                }
            );
        }

        if (
            authHeader !==
            `Bearer ${cronSecret}`
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Unauthorized.",
                },
                {
                    status: 401,
                }
            );
        }

        // ==========================================
        // CALCULATE ARCHIVE CUTOFF
        // ==========================================

        const cutoffDate = new Date();

        cutoffDate.setDate(
            cutoffDate.getDate() -
            ARCHIVE_AFTER_DAYS
        );

        const cutoffISO =
            cutoffDate.toISOString();

        // ==========================================
        // FIND DELIVERED ORDERS READY TO ARCHIVE
        // ==========================================

        const {
            data: orders,
            error: findError,
        } = await supabaseAdmin
            .from("orders")
            .select(
                "id, status, delivered_at, archived"
            )
            .eq("status", "Delivered")
            .eq("archived", false)
            .not("delivered_at", "is", null)
            .lte(
                "delivered_at",
                cutoffISO
            );

        if (findError) {
            console.error(
                "Find orders for auto-archive error:",
                findError
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                    findError.message,
                },
                {
                    status: 500,
                }
            );
        }

        // ==========================================
        // NOTHING TO ARCHIVE
        // ==========================================

        if (!orders || orders.length === 0) {
            console.log(
                "✅ Auto Archive: No orders ready to archive."
            );

            return NextResponse.json({
                success: true,
                archivedCount: 0,
                message:
                    "No orders were ready for automatic archiving.",
            });
        }

        // ==========================================
        // ARCHIVE ORDERS
        // ==========================================

        const orderIds = orders.map(
            (order) => order.id
        );

        const {
            data: archivedOrders,
            error: archiveError,
        } = await supabaseAdmin
            .from("orders")
            .update({
                archived: true,
            })
            .in("id", orderIds)
            .select(
                "id, status, delivered_at, archived"
            );

        if (archiveError) {
            console.error(
                "Auto archive update error:",
                archiveError
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                    archiveError.message,
                },
                {
                    status: 500,
                }
            );
        }

        // ==========================================
        // SUCCESS
        // ==========================================

        console.log(
            `📦 Auto Archive: ${
                archivedOrders?.length || 0
            } order(s) archived.`
        );

        console.log(
            "Archived Order IDs:",
            orderIds
        );

        return NextResponse.json({
            success: true,
            archivedCount:
                archivedOrders?.length || 0,
            orderIds,
            message:
                "Delivered orders older than 7 days were archived successfully.",
        });
    } catch (error) {
        console.error(
            "Automatic Archive Cron Error:",
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