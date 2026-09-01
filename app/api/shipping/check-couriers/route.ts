import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase-admin";

type ShiprocketAuthResponse = {
    token?: string;
    message?: string;
};

type CourierCompany = {
    courier_company_id?: number;
    courier_name?: string;
    freight_charge?: number;
    rate?: number;
    etd?: string;
    estimated_delivery_days?: number;
    delivery_performance?: number;
    rating?: number;
    cod?: number;
    min_weight?: number;
    [key: string]: unknown;
};

type ServiceabilityResponse = {
    status?: number;
    status_code?: number;
    data?: {
        available_courier_companies?: CourierCompany[];
        child_courier_id?: number | null;
        is_recommendation_enabled?: number;
        recommended_courier_company_id?: number | null;
        [key: string]: unknown;
    };
    message?: string;
    [key: string]: unknown;
};

export async function POST(req: Request) {
    try {
        // ==========================================
        // GET ORDER ID
        // ==========================================

        const body = await req.json();

        const orderId = Number(body.orderId);

        if (
            !Number.isInteger(orderId) ||
            orderId <= 0
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Valid order ID is required.",
                },
                { status: 400 }
            );
        }

        console.log(
            "========== CHECK SHIPROCKET COURIERS =========="
        );

        console.log(
            "APSRAA ORDER ID:",
            orderId
        );

        // ==========================================
        // SHIPROCKET ENVIRONMENT
        // ==========================================

        const shiprocketEmail =
            process.env.SHIPROCKET_EMAIL;

        const shiprocketPassword =
            process.env.SHIPROCKET_PASSWORD;

        const pickupPincode =
            process.env.SHIPROCKET_PICKUP_PINCODE;

        if (
            !shiprocketEmail ||
            !shiprocketPassword
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Shiprocket credentials are missing.",
                },
                { status: 500 }
            );
        }

        if (!pickupPincode) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "SHIPROCKET_PICKUP_PINCODE is missing.",
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
                customer_name,
                phone,
                email,
                address,
                total,
                payment_status,
                payment_method,
                shipping_status,
                shipment_id,
                awb_number,
                courier_name
                `
            )
            .eq(
                "id",
                orderId
            )
            .single();

        if (
            orderError ||
            !order
        ) {
            console.error(
                "Order lookup error:",
                orderError
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Order not found.",
                },
                { status: 404 }
            );
        }

        // ==========================================
        // SHIPMENT VALIDATION
        // ==========================================

        if (!order.shipment_id) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Shiprocket shipment has not been created for this order yet.",
                },
                { status: 400 }
            );
        }

        // ==========================================
        // PREVENT UNNECESSARY COURIER CHECK
        // ==========================================

        if (
            order.awb_number
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "AWB is already assigned to this shipment.",
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
        // EXTRACT DELIVERY PINCODE
        // ==========================================

        const fullAddress =
            String(
                order.address || ""
            ).trim();

        const pincodeMatch =
            fullAddress.match(
                /(?:^|\D)(\d{6})(?:\D|$)/
            );

        const deliveryPincode =
            pincodeMatch
                ? pincodeMatch[1]
                : "";

        if (!deliveryPincode) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Customer delivery PIN code could not be detected.",
                },
                { status: 400 }
            );
        }

        // ==========================================
        // ORDER VALUE
        // ==========================================

        const declaredValue =
            Number(order.total);

        if (
            !Number.isFinite(
                declaredValue
            ) ||
            declaredValue <= 0
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Invalid order total.",
                },
                { status: 400 }
            );
        }

        // ==========================================
        // PAYMENT METHOD
        // ==========================================

        const paymentMethod =
            String(
                order.payment_method || ""
            ).toLowerCase();

        const isCOD =
            paymentMethod === "cod";

        const cod =
            isCOD ? 1 : 0;

        // ==========================================
        // TEMPORARY PACKAGE SIZE
        // ==========================================
        //
        // Same temporary package dimensions used
        // when creating the Shiprocket shipment.
        //
        // Later we can make these configurable
        // from Admin.
        //
        // ==========================================

        const weight =
            0.25;

        const length =
            15;

        const breadth =
            10;

        const height =
            5;

        // ==========================================
        // AUTHENTICATE SHIPROCKET
        // ==========================================

        console.log(
            "Authenticating with Shiprocket..."
        );

        const authResponse =
            await fetch(
                "https://apiv2.shiprocket.in/v1/external/auth/login",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body:
                        JSON.stringify({
                            email:
                            shiprocketEmail,

                            password:
                            shiprocketPassword,
                        }),

                    cache:
                        "no-store",
                }
            );

        const authData =
            (await authResponse.json()) as
                ShiprocketAuthResponse;

        if (
            !authResponse.ok ||
            !authData.token
        ) {
            console.error(
                "Shiprocket authentication failed:",
                authResponse.status
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Unable to authenticate with Shiprocket.",
                },
                { status: 502 }
            );
        }

        console.log(
            "✅ Shiprocket authentication successful."
        );

        // ==========================================
        // BUILD SERVICEABILITY URL
        // ==========================================

        const serviceabilityUrl =
            new URL(
                "https://apiv2.shiprocket.in/v1/external/courier/serviceability/"
            );

        serviceabilityUrl.searchParams.set(
            "pickup_postcode",
            pickupPincode
        );

        serviceabilityUrl.searchParams.set(
            "delivery_postcode",
            deliveryPincode
        );

        serviceabilityUrl.searchParams.set(
            "cod",
            String(cod)
        );

        serviceabilityUrl.searchParams.set(
            "weight",
            String(weight)
        );

        serviceabilityUrl.searchParams.set(
            "length",
            String(length)
        );

        serviceabilityUrl.searchParams.set(
            "breadth",
            String(breadth)
        );

        serviceabilityUrl.searchParams.set(
            "height",
            String(height)
        );

        serviceabilityUrl.searchParams.set(
            "declared_value",
            String(declaredValue)
        );

        // ==========================================
        // CHECK COURIER SERVICEABILITY
        // ==========================================

        console.log(
            "Checking courier availability:"
        );

        console.log(
            "Pickup PIN:",
            pickupPincode
        );

        console.log(
            "Delivery PIN:",
            deliveryPincode
        );

        console.log(
            "COD:",
            cod
        );

        const serviceabilityResponse =
            await fetch(
                serviceabilityUrl.toString(),
                {
                    method: "GET",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${authData.token}`,
                    },

                    cache:
                        "no-store",
                }
            );

        const serviceabilityData =
            (await serviceabilityResponse.json()) as
                ServiceabilityResponse;

        if (
            !serviceabilityResponse.ok
        ) {
            console.error(
                "Shiprocket serviceability failed:",
                serviceabilityResponse.status,
                serviceabilityData
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        serviceabilityData.message ||
                        "Unable to check courier availability.",
                },
                {
                    status: 502,
                }
            );
        }

        // ==========================================
        // EXTRACT COURIERS
        // ==========================================

        const couriers =
            serviceabilityData
                .data
                ?.available_courier_companies ||
            [];

        console.log(
            "Available couriers:",
            couriers.length
        );

        // ==========================================
        // RETURN CLEAN RESPONSE
        // ==========================================

        return NextResponse.json({
            success: true,

            order: {
                id:
                order.id,

                shipment_id:
                order.shipment_id,

                payment_method:
                paymentMethod,

                delivery_pincode:
                deliveryPincode,

                declared_value:
                declaredValue,
            },

            pickup: {
                pincode:
                pickupPincode,
            },

            package: {
                weight,
                length,
                breadth,
                height,
            },

            courier_count:
            couriers.length,

            recommended_courier_company_id:
                serviceabilityData
                    .data
                    ?.recommended_courier_company_id ||
                null,

            couriers:
                couriers.map(
                    (courier) => ({
                        courier_id:
                            courier.courier_company_id ||
                            null,

                        courier_name:
                            courier.courier_name ||
                            null,

                        rate:
                            courier.rate ??
                            courier.freight_charge ??
                            null,

                        etd:
                            courier.etd ||
                            null,

                        estimated_delivery_days:
                            courier.estimated_delivery_days ??
                            null,

                        rating:
                            courier.rating ??
                            null,

                        delivery_performance:
                            courier.delivery_performance ??
                            null,

                        cod:
                            courier.cod ??
                            null,

                        min_weight:
                            courier.min_weight ??
                            null,
                    })
                ),
        });

    } catch (error) {
        console.error(
            "Check courier error:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                message:
                    error instanceof Error
                        ? error.message
                        : "Unable to check courier availability.",
            },
            { status: 500 }
        );
    }
}