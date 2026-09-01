import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase-admin";

async function findOrder(
    orderId: number,
    contact: string
) {
    const cleanContact = contact.trim();

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
            payment_method,
            payment_status,
            shipping_status,
            shipment_id,
            awb_number,
            courier_name,
            tracking_url,
            delivered_at,
            created_at,
            refund_status,
            razorpay_refund_id,
            refund_amount,
            refund_created_at,
            cancelled_at,
            cancellation_reason
        `)
        .eq("id", orderId)
        .or(
            `phone.eq.${cleanContact},email.eq.${cleanContact}`
        )
        .maybeSingle();

    if (orderError) {
        console.error(
            "Track order lookup error:",
            orderError
        );

        throw new Error(
            "Unable to retrieve order."
        );
    }

    if (!order) {
        return null;
    }

    // ==========================================
    // CUSTOMER-FACING STATUS
    // ==========================================
    //
    // Admin status controls the early order flow.
    // Real courier statuses control later shipment flow.
    //

    const adminStatus =
        String(order.status || "")
            .trim()
            .toLowerCase();

    const shippingStatus =
        String(order.shipping_status || "")
            .trim()
            .toLowerCase();

    let customerStatus =
        shippingStatus || "pending";

    // Real courier progress takes priority.
    const realShippingStatuses = [
        "awb_assigned",
        "picked_up",
        "in_transit",
        "out_for_delivery",
        "delivered",
        "rto",
        "rto_received",
        "cancelled",
    ];

    const hasRealShippingStatus =
        realShippingStatuses.includes(
            shippingStatus
        );

    if (!hasRealShippingStatus) {
        switch (adminStatus) {
            case "pending":
                customerStatus = "pending";
                break;

            case "confirmed":
                customerStatus = "confirmed";
                break;

            case "packed":
                customerStatus = "awb_assigned";
                break;

            case "shipped":
                customerStatus = "picked_up";
                break;

            case "delivered":
                customerStatus = "delivered";
                break;

            case "cancelled":
                customerStatus = "cancelled";
                break;

            default:
                customerStatus =
                    shippingStatus || "pending";
        }
    }

    return {
        ...order,

        // Customer page receives the correct
        // customer-facing status.
        shipping_status:
            customerStatus,
    };
}

async function getTrackingEvents(
    orderId: number
) {
    const {
        data: events,
        error,
    } = await supabaseAdmin
        .from(
            "shipment_tracking_events"
        )
        .select(`
            id,
            awb_number,
            courier_name,
            current_status,
            current_status_id,
            shipment_status,
            shipment_status_id,
            activity,
            location,
            event_timestamp,
            etd,
            created_at
        `)
        .eq(
            "order_id",
            orderId
        )
        .order(
            "event_timestamp",
            {
                ascending: false,
            }
        );

    if (error) {
        console.error(
            "Tracking events lookup error:",
            error
        );

        throw new Error(
            "Unable to retrieve tracking history."
        );
    }

    return events || [];
}

async function getOrderItems(
    orderId: number
) {
    const {
        data: items,
        error,
    } = await supabaseAdmin
        .from("order_items")
        .select(`
            id,
            title,
            price,
            quantity
        `)
        .eq(
            "order_id",
            orderId
        )
        .order(
            "id",
            {
                ascending: true,
            }
        );

    if (error) {
        console.error(
            "Order items lookup error:",
            error
        );

        throw new Error(
            "Unable to retrieve order items."
        );
    }

    return items || [];
}

// ==========================================
// POST
// ==========================================

export async function POST(
    req: Request
) {
    try {
        const body =
            await req.json();

        const orderId =
            Number(
                body?.orderId
            );

        const contact =
            String(
                body?.contact ||
                ""
            ).trim();

        if (
            !Number.isInteger(
                orderId
            ) ||
            orderId <= 0
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Invalid order number.",
                },
                {
                    status: 400,
                }
            );
        }

        if (!contact) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Please enter your phone number or email.",
                },
                {
                    status: 400,
                }
            );
        }

        const order =
            await findOrder(
                orderId,
                contact
            );

        if (!order) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Order not found. Please check your order number and contact details.",
                },
                {
                    status: 404,
                }
            );
        }

        const [
            items,
            events,
        ] = await Promise.all([
            getOrderItems(
                order.id
            ),
            getTrackingEvents(
                order.id
            ),
        ]);

        return NextResponse.json({
            success: true,
            order,
            items,
            events,
        });

    } catch (error) {
        console.error(
            "POST /api/track-order error:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                message:
                    error instanceof Error
                        ? error.message
                        : "Unable to track order.",
            },
            {
                status: 500,
            }
        );
    }
}

// ==========================================
// GET
// ==========================================

export async function GET(
    req: Request
) {
    try {
        const {
            searchParams,
        } = new URL(req.url);

        const orderId =
            Number(
                searchParams.get(
                    "orderId"
                )
            );

        const phone =
            String(
                searchParams.get(
                    "phone"
                ) ||
                ""
            ).trim();

        if (
            !Number.isInteger(
                orderId
            ) ||
            orderId <= 0
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Invalid order ID.",
                },
                {
                    status: 400,
                }
            );
        }

        if (!phone) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Phone number is required.",
                },
                {
                    status: 400,
                }
            );
        }

        const order =
            await findOrder(
                orderId,
                phone
            );

        if (!order) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Order not found. Please check your order number and phone number.",
                },
                {
                    status: 404,
                }
            );
        }

        const events =
            await getTrackingEvents(
                order.id
            );

        return NextResponse.json({
            success: true,
            order,
            events,
        });

    } catch (error) {
        console.error(
            "GET /api/track-order error:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                message:
                    error instanceof Error
                        ? error.message
                        : "Unable to track order.",
            },
            {
                status: 500,
            }
        );
    }
}