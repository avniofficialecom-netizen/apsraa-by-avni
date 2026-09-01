import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase-admin";

type ShiprocketAuthResponse = {
    token?: string;
    message?: string;
};

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const orderId = Number(body.orderId);
        const courierId = Number(body.courierId);

        if (
            !Number.isInteger(orderId) ||
            orderId <= 0
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Valid order ID is required.",
                },
                { status: 400 }
            );
        }

        if (
            !Number.isInteger(courierId) ||
            courierId <= 0
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Valid courier ID is required.",
                },
                { status: 400 }
            );
        }

        const email =
            process.env.SHIPROCKET_EMAIL;

        const password =
            process.env.SHIPROCKET_PASSWORD;

        if (!email || !password) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Shiprocket configuration is missing.",
                },
                { status: 500 }
            );
        }

        // ==========================================
        // GET APSRAA ORDER
        // ==========================================

        const {
            data: order,
            error: orderError,
        } = await supabaseAdmin
            .from("orders")
            .select(
                `
                id,
                payment_method,
                payment_status,
                shipping_status,
                shipment_id,
                awb_number,
                courier_name,
                tracking_url
                `
            )
            .eq("id", orderId)
            .single();

        if (orderError || !order) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Order not found.",
                },
                { status: 404 }
            );
        }

        if (!order.shipment_id) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Shiprocket shipment does not exist for this order.",
                },
                { status: 400 }
            );
        }

        if (order.awb_number) {
            return NextResponse.json(
                {
                    success: false,
                    alreadyAssigned: true,
                    message:
                        "AWB is already assigned.",
                    shipment: {
                        shipment_id:
                        order.shipment_id,
                        awb_number:
                        order.awb_number,
                        courier_name:
                        order.courier_name,
                    },
                },
                { status: 409 }
            );
        }

        // ==========================================
        // SHIPROCKET LOGIN
        // ==========================================

        const authResponse =
            await fetch(
                "https://apiv2.shiprocket.in/v1/external/auth/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        email,
                        password,
                    }),
                    cache: "no-store",
                }
            );

        const authText =
            await authResponse.text();

        let authData: ShiprocketAuthResponse =
            {};

        try {
            authData =
                JSON.parse(
                    authText
                );
        } catch {
            // Keep empty object if Shiprocket
            // doesn't return JSON.
        }

        if (
            !authResponse.ok ||
            !authData.token
        ) {
            return NextResponse.json(
                {
                    success: false,
                    stage: "authentication",
                    message:
                        authData.message ||
                        "Shiprocket authentication failed.",
                    shiprocket_status:
                    authResponse.status,
                    shiprocket_response:
                    authText,
                },
                { status: 502 }
            );
        }

        // ==========================================
        // ASSIGN AWB
        // ==========================================

        const payload = {
            shipment_id:
                Number(
                    order.shipment_id
                ),

            courier_id:
            courierId,
        };

        console.log(
            "Shiprocket AWB request:",
            payload
        );

        const assignResponse =
            await fetch(
                "https://apiv2.shiprocket.in/v1/external/courier/assign/awb",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${authData.token}`,
                    },

                    body:
                        JSON.stringify(
                            payload
                        ),

                    cache: "no-store",
                }
            );

        const assignText =
            await assignResponse.text();

        let assignData: Record<
            string,
            unknown
        > = {};

        try {
            assignData =
                JSON.parse(
                    assignText
                );
        } catch {
            // Keep raw response below.
        }

        console.log(
            "Shiprocket AWB response status:",
            assignResponse.status
        );

        console.log(
            "Shiprocket AWB response:",
            assignData
        );

        if (!assignResponse.ok) {
            return NextResponse.json(
                {
                    success: false,
                    stage: "awb_assignment",

                    message:
                        typeof assignData.message ===
                        "string"
                            ? assignData.message
                            : typeof assignData.response ===
                            "string"
                                ? assignData.response
                                : "Shiprocket rejected the AWB assignment.",

                    shiprocket_status:
                    assignResponse.status,

                    shiprocket_response:
                    assignData,

                    raw_response:
                    assignText,
                },
                { status: 502 }
            );
        }

        // ==========================================
        // GET AWB
        // ==========================================

        const awb =
            typeof assignData.awb_code ===
            "string"
                ? assignData.awb_code.trim()
                : "";

        const courierName =
            typeof assignData.courier_name ===
            "string"
                ? assignData.courier_name
                : `Courier ${courierId}`;

        if (!awb) {
            return NextResponse.json(
                {
                    success: false,
                    stage: "awb_assignment",
                    message:
                        "Shiprocket accepted the request but did not return an AWB.",
                    shiprocket_response:
                    assignData,
                },
                { status: 502 }
            );
        }

        // ==========================================
        // SAVE AWB
        // ==========================================

        const trackingUrl =
            `https://shiprocket.co/tracking/${encodeURIComponent(
                awb
            )}`;

        const {
            data: updatedOrder,
            error: updateError,
        } = await supabaseAdmin
            .from("orders")
            .update({
                awb_number:
                awb,

                courier_name:
                courierName,

                tracking_url:
                trackingUrl,

                shipping_status:
                    "awb_assigned",
            })
            .eq("id", orderId)
            .select(
                `
                id,
                shipping_status,
                shipment_id,
                awb_number,
                courier_name,
                tracking_url
                `
            )
            .single();

        if (updateError) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "AWB was created in Shiprocket, but APSRAA could not save it.",
                    awb_number:
                    awb,
                    courier_name:
                    courierName,
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,

            message:
                "Courier assigned and AWB generated successfully.",

            order:
            updatedOrder,

            shipment: {
                shipment_id:
                order.shipment_id,

                awb_number:
                awb,

                courier_id:
                courierId,

                courier_name:
                courierName,

                tracking_url:
                trackingUrl,

                pickup_scheduled_date:
                    assignData.pickup_scheduled_date ||
                    null,
            },
        });

    } catch (error) {
        console.error(
            "Assign AWB error:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                message:
                    error instanceof Error
                        ? error.message
                        : "Unable to assign courier/AWB.",
            },
            { status: 500 }
        );
    }
}