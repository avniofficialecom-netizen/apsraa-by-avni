import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAdmin } from "../../../../lib/supabase-admin";

type OrderItem = {
    id: number;
    product_id: number;
    variant_id: number | null;
    title: string;
    price: number | string;
    quantity: number;
};

type ShiprocketAuthResponse = {
    token?: string;
};

type ShiprocketOrderResponse = {
    order_id?: number;
    shipment_id?: number;
    status?: string;
    status_code?: number;
    onboarding_completed_now?: number;
    awb_code?: string | null;
    courier_name?: string | null;
    label_url?: string | null;
    channel_order_id?: string | null;
    message?: string;
};

export async function POST(req: Request) {
    try {
        // ==========================================
        // ADMIN AUTHENTICATION
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
                { status: 401 }
            );
        }

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
                { status: 500 }
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
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Forbidden. Admin access required.",
                },
                { status: 403 }
            );
        }

        // ==========================================
        // GET REQUEST
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
                    message: "Valid order ID is required.",
                },
                { status: 400 }
            );
        }

        console.log(
            "========== CREATE SHIPROCKET SHIPMENT =========="
        );

        console.log(
            "APSRAA ORDER ID:",
            orderId
        );

        console.log(
            "ADMIN:",
            user.email
        );

        // ==========================================
        // SHIPROCKET CREDENTIALS
        // ==========================================

        const shiprocketEmail =
            process.env.SHIPROCKET_EMAIL;

        const shiprocketPassword =
            process.env.SHIPROCKET_PASSWORD;

        if (
            !shiprocketEmail ||
            !shiprocketPassword
        ) {
            console.error(
                "❌ Shiprocket credentials are missing."
            );

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
        // GET ORDER
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
                status,
                payment_status,
                payment_method,
                shipping_status,
                courier_name,
                awb_number,
                shipment_id,
                tracking_url,
                cod_amount
                `
            )
            .eq("id", orderId)
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
                    message: "Order not found.",
                },
                { status: 404 }
            );
        }

        // ==========================================
        // PREVENT DUPLICATE SHIPMENT
        // ==========================================

        if (
            order.shipment_id ||
            order.awb_number
        ) {
            return NextResponse.json(
                {
                    success: false,
                    alreadyCreated: true,
                    message:
                        "A shipment already exists for this order.",
                    shipment: {
                        shipment_id:
                        order.shipment_id,
                        awb_number:
                        order.awb_number,
                        courier_name:
                        order.courier_name,
                        tracking_url:
                        order.tracking_url,
                    },
                },
                { status: 409 }
            );
        }

        // ==========================================
        // PAYMENT VALIDATION
        // ==========================================

        const paymentMethod =
            String(
                order.payment_method || ""
            ).toLowerCase();

        const paymentStatus =
            String(
                order.payment_status || ""
            ).toLowerCase();

        if (
            paymentMethod === "online" &&
            paymentStatus !== "paid"
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Online payment must be paid before shipment creation.",
                },
                { status: 400 }
            );
        }

        if (
            paymentMethod !== "cod" &&
            paymentMethod !== "online"
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Invalid payment method.",
                },
                { status: 400 }
            );
        }

        // ==========================================
        // GET ORDER ITEMS
        // ==========================================

        const {
            data: orderItems,
            error: itemsError,
        } = await supabaseAdmin
            .from("order_items")
            .select(
                `
                id,
                product_id,
                variant_id,
                title,
                price,
                quantity
                `
            )
            .eq(
                "order_id",
                orderId
            )
            .order("id", {
                ascending: true,
            });

        if (
            itemsError ||
            !orderItems ||
            orderItems.length === 0
        ) {
            console.error(
                "Order items error:",
                itemsError
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Order items not found.",
                },
                { status: 400 }
            );
        }

        const typedItems =
            orderItems as OrderItem[];

        // ==========================================
        // VALIDATE ORDER TOTAL
        // ==========================================

        const orderTotal =
            Number(order.total);

        if (
            !Number.isFinite(orderTotal) ||
            orderTotal <= 0
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
        // PARSE CUSTOMER ADDRESS
        // ==========================================

        const fullAddress =
            String(
                order.address || ""
            ).trim();

        const pincodeMatch =
            fullAddress.match(
                /(?:^|\D)(\d{6})(?:\D|$)/
            );

        const pincode =
            pincodeMatch
                ? pincodeMatch[1]
                : "";

        if (!pincode) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Customer PIN code could not be detected from the saved address.",
                },
                { status: 400 }
            );
        }

        // ==========================================
        // PARSE CITY / STATE
        // ==========================================

        let shippingAddress =
            fullAddress;

        let city =
            "Meerut";

        let state =
            "Uttar Pradesh";

        const addressParts =
            fullAddress
                .split(",")
                .map(
                    (part) =>
                        part.trim()
                )
                .filter(Boolean);

        if (
            addressParts.length >= 3
        ) {
            const lastPart =
                addressParts[
                    addressParts.length - 1
                ];

            const secondLastPart =
                addressParts[
                    addressParts.length - 2
                ];

            const stateAndPin =
                lastPart.split("-");

            if (
                stateAndPin.length >= 2
            ) {
                state =
                    stateAndPin[0].trim();
            } else {
                state =
                    lastPart.trim();
            }

            city =
                secondLastPart.trim();

            shippingAddress =
                addressParts
                    .slice(
                        0,
                        addressParts.length - 2
                    )
                    .join(", ");
        }

        if (!shippingAddress) {
            shippingAddress =
                fullAddress;
        }

        // ==========================================
        // LOGIN TO SHIPROCKET
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
                    body: JSON.stringify({
                        email:
                            shiprocketEmail,
                        password:
                            shiprocketPassword,
                    }),
                    cache: "no-store",
                }
            );

        const authData =
            (await authResponse.json()) as
                ShiprocketAuthResponse & {
                    message?: string;
                };

        if (
            !authResponse.ok ||
            !authData.token
        ) {
            console.error(
                "Shiprocket authentication failed:",
                authResponse.status,
                authData.message
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
        // PREPARE PRODUCTS
        // ==========================================

        const products =
            typedItems.map(
                (item) => ({
                    name:
                        item.title,

                    sku:
                        item.variant_id
                            ? `APSRAA-${item.product_id}-V${item.variant_id}`
                            : `APSRAA-${item.product_id}`,

                    units:
                        Number(
                            item.quantity
                        ),

                    selling_price:
                        Number(
                            item.price
                        ),

                    discount:
                        0,

                    tax:
                        0,

                    hsn:
                        "",
                })
            );

        // ==========================================
        // COD
        // ==========================================

        const isCOD =
            paymentMethod === "cod";

        const codAmount =
            isCOD
                ? orderTotal
                : 0;

        // ==========================================
        // SHIPROCKET PAYLOAD
        // ==========================================

        const shiprocketPayload = {
            order_id:
                `APSRAA-${order.id}`,

            order_date:
                new Date().toISOString(),

            pickup_location:
                "Home",

            channel_id:
                "",

            comment:
                `APSRAA Order #${order.id}`,

            billing_customer_name:
                order.customer_name,

            billing_last_name:
                "",

            billing_address:
                shippingAddress,

            billing_address_2:
                "",

            billing_isd_code:
                "91",

            billing_city:
                city,

            billing_pincode:
                pincode,

            billing_state:
                state,

            billing_country:
                "India",

            billing_email:
                order.email,

            billing_phone:
                order.phone,

            shipping_is_billing:
                true,

            shipping_customer_name:
                order.customer_name,

            shipping_last_name:
                "",

            shipping_address:
                shippingAddress,

            shipping_address_2:
                "",

            shipping_city:
                city,

            shipping_pincode:
                pincode,

            shipping_country:
                "India",

            shipping_state:
                state,

            shipping_email:
                order.email,

            shipping_phone:
                order.phone,

            order_items:
                products,

            payment_method:
                isCOD
                    ? "COD"
                    : "Prepaid",

            shipping_charges:
                0,

            giftwrap_charges:
                0,

            transaction_charges:
                0,

            total_discount:
                0,

            sub_total:
                orderTotal,

            length:
                15,

            breadth:
                10,

            height:
                5,

            weight:
                0.25,

            pickup_location_id:
                "",

            reseller_name:
                "",

            cod_amount:
                codAmount,
        };

        // ==========================================
        // CREATE SHIPROCKET ORDER
        // ==========================================

        console.log(
            "Creating Shiprocket shipment for APSRAA order:",
            order.id
        );

        const shipmentResponse =
            await fetch(
                "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc",
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
                            shiprocketPayload
                        ),

                    cache: "no-store",
                }
            );

        const shipmentData =
            (await shipmentResponse.json()) as
                ShiprocketOrderResponse;

        if (
            !shipmentResponse.ok
        ) {
            console.error(
                "Shiprocket shipment creation failed:",
                shipmentResponse.status,
                shipmentData
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        shipmentData.message ||
                        "Unable to create Shiprocket shipment.",
                },
                {
                    status: 502,
                }
            );
        }

        console.log(
            "✅ Shiprocket order created:",
            shipmentData.order_id
        );

        console.log(
            "SHIPROCKET SHIPMENT ID:",
            shipmentData.shipment_id
        );

        // ==========================================
        // SAVE SHIPMENT DETAILS
        // ==========================================

        const shipmentId =
            shipmentData.shipment_id
                ? String(
                    shipmentData.shipment_id
                )
                : null;

        const shippingStatus =
            shipmentData.status ||
            "created";

        const {
            data: updatedOrder,
            error: updateError,
        } = await supabaseAdmin
            .from("orders")
            .update({
                shipment_id:
                    shipmentId,

                shipping_status:
                    shippingStatus,

                shipping_created_at:
                    new Date().toISOString(),

                cod_amount:
                    codAmount,
            })
            .eq(
                "id",
                order.id
            )
            .select(
                `
                id,
                status,
                payment_method,
                payment_status,
                shipping_status,
                shipment_id,
                awb_number,
                courier_name,
                tracking_url,
                cod_amount
                `
            )
            .single();

        if (updateError) {
            console.error(
                "Order shipping update error:",
                updateError
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Shipment was created in Shiprocket, but APSRAA could not save the shipment details.",
                    shipment_id:
                        shipmentId,
                },
                { status: 500 }
            );
        }

        // ==========================================
        // SUCCESS
        // ==========================================

        return NextResponse.json({
            success: true,

            message:
                "Shiprocket shipment created successfully.",

            order:
                updatedOrder,

            shiprocket: {
                order_id:
                    shipmentData.order_id ||
                    null,

                shipment_id:
                    shipmentData.shipment_id ||
                    null,

                status:
                    shipmentData.status ||
                    null,

                awb_code:
                    shipmentData.awb_code ||
                    null,

                courier_name:
                    shipmentData.courier_name ||
                    null,

                label_url:
                    shipmentData.label_url ||
                    null,
            },
        });

    } catch (error) {
        console.error(
            "Create shipment error:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                message:
                    error instanceof Error
                        ? error.message
                        : "Unable to create shipment.",
            },
            { status: 500 }
        );
    }
}