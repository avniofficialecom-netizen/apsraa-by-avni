import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase-admin";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const orderId = Number(body.orderId);

        const contact = String(
            body.contact || ""
        )
            .trim()
            .toLowerCase();

        console.log(
            "========== TRACK ORDER =========="
        );

        console.log(
            "ORDER ID:",
            orderId
        );

        // ==========================================
        // VALIDATE ORDER ID
        // ==========================================

        if (!orderId || isNaN(orderId)) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Valid Order Number is required.",
                },
                {
                    status: 400,
                }
            );
        }

        // ==========================================
        // VALIDATE CONTACT
        // ==========================================

        if (!contact) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Phone number or email is required.",
                },
                {
                    status: 400,
                }
            );
        }

        // ==========================================
        // FETCH ORDER
        // ==========================================

        const {
            data: order,
            error: orderError,
        } = await supabaseAdmin
            .from("orders")
            .select(`
                id,
                customer_name,
                email,
                phone,
                address,
                total,
                status,
                payment_status,
                created_at
            `)
            .eq("id", orderId)
            .single();

        if (orderError || !order) {
            console.error(
                "❌ ORDER FETCH ERROR:",
                orderError
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Order not found. Please check your Order Number.",
                },
                {
                    status: 404,
                }
            );
        }

        console.log(
            "✅ ORDER FOUND:",
            order.id
        );

        // ==========================================
        // CUSTOMER EMAIL
        // ==========================================

        const customerEmail =
            String(order.email || "")
                .trim()
                .toLowerCase();

        // ==========================================
        // CUSTOMER PHONE
        // ==========================================

        const customerPhone =
            String(order.phone || "").replace(
                /\D/g,
                ""
            );

        const enteredPhone =
            contact.replace(/\D/g, "");

        // ==========================================
        // VERIFY EMAIL
        // ==========================================

        const emailMatches =
            contact === customerEmail &&
            customerEmail !== "";

        // ==========================================
        // VERIFY PHONE
        // ==========================================

        const phoneMatches =
            enteredPhone === customerPhone &&
            customerPhone !== "";

        // ==========================================
        // SECURITY CHECK
        // ==========================================

        if (
            !emailMatches &&
            !phoneMatches
        ) {
            console.warn(
                "❌ CUSTOMER VERIFICATION FAILED FOR ORDER:",
                orderId
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "The phone number or email does not match this order.",
                },
                {
                    status: 403,
                }
            );
        }

        console.log(
            "✅ CUSTOMER VERIFIED FOR ORDER:",
            orderId
        );

        // ==========================================
        // FETCH ORDER ITEMS
        // ==========================================

        const {
            data: items,
            error: itemsError,
        } = await supabaseAdmin
            .from("order_items")
            .select(`
                id,
                title,
                quantity,
                price
            `)
            .eq("order_id", orderId)
            .order("id", {
                ascending: true,
            });

        if (itemsError) {
            console.error(
                "❌ ORDER ITEMS ERROR:",
                itemsError
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Unable to load order products.",
                },
                {
                    status: 500,
                }
            );
        }

        console.log(
            "ORDER ITEMS COUNT:",
            items?.length || 0
        );

        // ==========================================
        // RETURN SAFE ORDER DATA
        // ==========================================

        return NextResponse.json({
            success: true,

            order: {
                id: order.id,

                customer_name:
                order.customer_name,

                email:
                order.email,

                phone:
                order.phone,

                address:
                order.address,

                total:
                order.total,

                status:
                    order.status ||
                    "Pending",

                payment_status:
                    order.payment_status ||
                    "Pending",

                created_at:
                order.created_at,
            },

            items:
                items || [],
        });

    } catch (error) {
        console.error(
            "❌ TRACK ORDER API ERROR:",
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