import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase-admin";

type ShiprocketScan = {
    date?: string;
    activity?: string;
    location?: string;
    status?: string;
};

type ShiprocketWebhookPayload = {
    awb?: string;
    courier_name?: string;

    current_status?: string;
    current_status_id?: number | string;

    shipment_status?: string;
    shipment_status_id?: number | string;

    order_id?: string | number;
    sr_order_id?: string | number;

    etd?: string;

    scans?: ShiprocketScan[];

    [key: string]: unknown;
};

export async function POST(req: Request) {
    try {
        // ==========================================
        // WEBHOOK SECURITY
        // ==========================================

        const webhookSecret =
            process.env.SHIPROCKET_WEBHOOK_TOKEN;

        if (!webhookSecret) {
            console.error(
                "❌ SHIPROCKET_WEBHOOK_TOKEN is missing."
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Webhook security configuration is missing.",
                },
                { status: 500 }
            );
        }

        const receivedToken =
            req.headers.get("x-api-key") ||
            "";

        if (
            !receivedToken ||
            receivedToken !== webhookSecret
        ) {
            console.warn(
                "❌ Invalid Shiprocket webhook token."
            );

            return NextResponse.json(
                {
                    success: false,
                    message: "Unauthorized.",
                },
                { status: 401 }
            );
        }

        // ==========================================
        // READ PAYLOAD
        // ==========================================

        const payload =
            (await req.json()) as
                ShiprocketWebhookPayload;

        console.log(
            "========== SHIPROCKET WEBHOOK =========="
        );

        console.log(
            "AWB:",
            payload.awb
        );

        console.log(
            "Order:",
            payload.order_id
        );

        console.log(
            "Status:",
            payload.current_status
        );

        // ==========================================
        // BASIC VALIDATION
        // ==========================================

        if (
            !payload.awb &&
            !payload.order_id &&
            !payload.sr_order_id
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Invalid Shiprocket webhook payload.",
                },
                { status: 400 }
            );
        }

        // ==========================================
        // FIND APSRAA ORDER
        // ==========================================

        let order: {
            id: number;
            shipment_id: number | null;
            awb_number: string | null;
        } | null = null;

        // First try AWB
        if (payload.awb) {
            const {
                data,
                error,
            } = await supabaseAdmin
                .from("orders")
                .select(
                    `
                    id,
                    shipment_id,
                    awb_number
                    `
                )
                .eq(
                    "awb_number",
                    String(
                        payload.awb
                    )
                )
                .maybeSingle();

            if (error) {
                console.error(
                    "Order lookup by AWB failed:",
                    error
                );
            } else if (data) {
                order = data;
            }
        }

        // ==========================================
        // FALLBACK TO SHIPROCKET ORDER ID
        // ==========================================

        if (
            !order &&
            payload.order_id
        ) {
            const rawOrderId =
                String(
                    payload.order_id
                );

            const numericOrderId =
                rawOrderId.replace(
                    /^APSRAA-/i,
                    ""
                );

            if (
                /^\d+$/.test(
                    numericOrderId
                )
            ) {
                const {
                    data,
                    error,
                } = await supabaseAdmin
                    .from("orders")
                    .select(
                        `
                        id,
                        shipment_id,
                        awb_number
                        `
                    )
                    .eq(
                        "id",
                        Number(
                            numericOrderId
                        )
                    )
                    .maybeSingle();

                if (error) {
                    console.error(
                        "Order lookup by order ID failed:",
                        error
                    );
                } else if (data) {
                    order = data;
                }
            }
        }

        // ==========================================
        // ORDER NOT FOUND
        // ==========================================

        if (!order) {
            console.warn(
                "⚠️ Shiprocket webhook received for unknown order.",
                {
                    awb:
                        payload.awb ||
                        null,

                    order_id:
                        payload.order_id ||
                        null,

                    sr_order_id:
                        payload.sr_order_id ||
                        null,
                }
            );

            // Return 200 so Shiprocket does not
            // repeatedly retry a webhook we cannot map.
            return NextResponse.json({
                success: true,
                ignored: true,
                message:
                    "Webhook received but APSRAA order was not found.",
            });
        }

        // ==========================================
        // NORMALIZE STATUS
        // ==========================================

        const currentStatus =
            String(
                payload.current_status ||
                payload.shipment_status ||
                ""
            ).trim();

        const currentStatusIdRaw =
            payload.current_status_id ??
            payload.shipment_status_id ??
            null;

        const currentStatusId =
            currentStatusIdRaw !== null &&
            currentStatusIdRaw !== undefined &&
            String(
                currentStatusIdRaw
            ).trim() !== ""
                ? Number(
                    currentStatusIdRaw
                )
                : null;

        const shipmentStatus =
            String(
                payload.shipment_status ||
                payload.current_status ||
                ""
            ).trim();

        const shipmentStatusIdRaw =
            payload.shipment_status_id ??
            payload.current_status_id ??
            null;

        const shipmentStatusId =
            shipmentStatusIdRaw !== null &&
            shipmentStatusIdRaw !== undefined &&
            String(
                shipmentStatusIdRaw
            ).trim() !== ""
                ? Number(
                    shipmentStatusIdRaw
                )
                : null;

        const awb =
            payload.awb
                ? String(
                    payload.awb
                ).trim()
                : order.awb_number;

        const courierName =
            payload.courier_name
                ? String(
                    payload.courier_name
                ).trim()
                : null;

        // ==========================================
        // MAP SHIPROCKET STATUS TO APSRAA STATUS
        // ==========================================

        const statusLower =
            currentStatus.toLowerCase();

        let apsraaShippingStatus =
            currentStatus ||
            "updated";

        if (
            statusLower.includes(
                "delivered"
            )
        ) {
            apsraaShippingStatus =
                "delivered";
        } else if (
            statusLower.includes(
                "out for delivery"
            )
        ) {
            apsraaShippingStatus =
                "out_for_delivery";
        } else if (
            statusLower.includes(
                "in transit"
            )
        ) {
            apsraaShippingStatus =
                "in_transit";
        } else if (
            statusLower.includes(
                "picked up"
            ) ||
            statusLower.includes(
                "pickup"
            )
        ) {
            apsraaShippingStatus =
                "picked_up";
        } else if (
            statusLower.includes(
                "awb"
            )
        ) {
            apsraaShippingStatus =
                "awb_assigned";
        } else if (
            statusLower.includes(
                "cancel"
            )
        ) {
            apsraaShippingStatus =
                "cancelled";
        } else if (
            statusLower.includes(
                "rto"
            )
        ) {
            apsraaShippingStatus =
                "rto";
        } else if (
            statusLower.includes(
                "delay"
            )
        ) {
            apsraaShippingStatus =
                "delayed";
        }

        // ==========================================
        // EVENT TIMESTAMP
        // ==========================================

        const scans =
            Array.isArray(
                payload.scans
            )
                ? payload.scans
                : [];

        const latestScan =
            scans.length > 0
                ? scans[
                scans.length - 1
                    ]
                : null;

        const activity =
            latestScan?.activity ||
            currentStatus ||
            shipmentStatus ||
            null;

        const location =
            latestScan?.location ||
            null;

        const scanTimestamp =
            latestScan?.date
                ? new Date(
                    latestScan.date
                )
                : new Date();

        const eventTimestamp =
            Number.isNaN(
                scanTimestamp.getTime()
            )
                ? new Date().toISOString()
                : scanTimestamp.toISOString();

        // ==========================================
        // ETD
        // ==========================================

        let etd: string | null =
            null;

        if (payload.etd) {
            const etdDate =
                new Date(
                    payload.etd
                );

            if (
                !Number.isNaN(
                    etdDate.getTime()
                )
            ) {
                etd =
                    etdDate.toISOString();
            }
        }

        // ==========================================
        // SAVE TRACKING EVENT
        // ==========================================

        const {
            error: eventError,
        } = await supabaseAdmin
            .from(
                "shipment_tracking_events"
            )
            .insert({
                order_id:
                order.id,

                shipment_id:
                order.shipment_id,

                awb_number:
                awb,

                courier_name:
                courierName,

                current_status:
                    currentStatus ||
                    null,

                current_status_id:
                currentStatusId,

                shipment_status:
                    shipmentStatus ||
                    null,

                shipment_status_id:
                shipmentStatusId,

                activity:
                activity,

                location:
                location,

                event_timestamp:
                eventTimestamp,

                etd:
                etd,

                raw_payload:
                payload,
            });

        if (eventError) {
            console.error(
                "Tracking event insert failed:",
                eventError
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Unable to save tracking event.",
                },
                { status: 500 }
            );
        }

        // ==========================================
        // UPDATE ORDER
        // ==========================================

        const updateData: Record<
            string,
            unknown
        > = {
            shipping_status:
            apsraaShippingStatus,
        };

        if (awb) {
            updateData.awb_number =
                awb;
        }

        if (courierName) {
            updateData.courier_name =
                courierName;
        }

        if (
            awb &&
            !order.awb_number
        ) {
            updateData.tracking_url =
                `https://shiprocket.co/tracking/${encodeURIComponent(
                    awb
                )}`;
        }

        // Delivered timestamp
        if (
            apsraaShippingStatus ===
            "delivered"
        ) {
            updateData.delivered_at =
                eventTimestamp;
        }

        const {
            error: updateError,
        } = await supabaseAdmin
            .from("orders")
            .update(
                updateData
            )
            .eq(
                "id",
                order.id
            );

        if (updateError) {
            console.error(
                "Order shipping update failed:",
                updateError
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Tracking event saved, but order status could not be updated.",
                },
                { status: 500 }
            );
        }

        // ==========================================
        // SUCCESS
        // ==========================================

        console.log(
            "✅ Shiprocket tracking event saved."
        );

        console.log(
            "Order:",
            order.id
        );

        console.log(
            "Status:",
            apsraaShippingStatus
        );

        return NextResponse.json({
            success: true,
            message:
                "Shiprocket webhook processed successfully.",
            order_id:
            order.id,
            shipping_status:
            apsraaShippingStatus,
        });

    } catch (error) {
        console.error(
            "Shiprocket webhook error:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                message:
                    error instanceof Error
                        ? error.message
                        : "Webhook processing failed.",
            },
            { status: 500 }
        );
    }
}