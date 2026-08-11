import { NextResponse } from "next/server";
import crypto from "crypto";
import Razorpay from "razorpay";
import { supabaseAdmin } from "../../../lib/supabase-admin";

type CartItem = {
    id: number;
    quantity: number;
};

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            customer,
            items,
        } = body;

        console.log(
            "========== VERIFY PAYMENT + CREATE ORDER =========="
        );

        // ==========================================
        // BASIC PAYMENT VALIDATION
        // ==========================================

        if (
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Missing Razorpay payment information.",
                },
                { status: 400 }
            );
        }

        // ==========================================
        // CUSTOMER VALIDATION
        // ==========================================

        const customerName =
            String(customer?.name || "").trim();

        const customerPhone =
            String(customer?.phone || "").trim();

        const customerEmail =
            String(customer?.email || "")
                .trim()
                .toLowerCase();

        const customerAddress =
            String(customer?.address || "").trim();

        const customerCity =
            String(customer?.city || "").trim();

        const customerState =
            String(customer?.state || "").trim();

        const customerPincode =
            String(customer?.pincode || "").trim();

        if (
            !customerName ||
            !customerPhone ||
            !customerEmail ||
            !customerAddress
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Customer details are incomplete.",
                },
                { status: 400 }
            );
        }

        if (!customerEmail.includes("@")) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Invalid customer email.",
                },
                { status: 400 }
            );
        }

        // ==========================================
        // CART VALIDATION
        // ==========================================

        const cartItems: CartItem[] =
            Array.isArray(items)
                ? items
                : [];

        if (cartItems.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Cart is empty.",
                },
                { status: 400 }
            );
        }

        // ==========================================
        // RAZORPAY CREDENTIALS
        // ==========================================

        const keyId =
            process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

        const keySecret =
            process.env.RAZORPAY_KEY_SECRET;

        if (!keyId || !keySecret) {
            console.error(
                "❌ Razorpay credentials are missing."
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Razorpay is not configured correctly.",
                },
                { status: 500 }
            );
        }

        // ==========================================
        // 1. VERIFY RAZORPAY SIGNATURE
        // ==========================================

        const signatureBody =
            razorpay_order_id +
            "|" +
            razorpay_payment_id;

        const expectedSignature =
            crypto
                .createHmac(
                    "sha256",
                    keySecret
                )
                .update(signatureBody)
                .digest("hex");

        const expectedBuffer =
            Buffer.from(
                expectedSignature,
                "utf8"
            );

        const receivedBuffer =
            Buffer.from(
                String(
                    razorpay_signature
                ),
                "utf8"
            );

        if (
            expectedBuffer.length !==
            receivedBuffer.length
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Signature mismatch.",
                },
                { status: 400 }
            );
        }

        const signaturesMatch =
            crypto.timingSafeEqual(
                expectedBuffer,
                receivedBuffer
            );

        if (!signaturesMatch) {
            console.error(
                "❌ Razorpay signature verification failed."
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Signature mismatch.",
                },
                { status: 400 }
            );
        }

        console.log(
            "✅ Razorpay signature verified."
        );

        // ==========================================
        // 2. VERIFY PAYMENT WITH RAZORPAY
        // ==========================================

        const razorpay =
            new Razorpay({
                key_id: keyId,
                key_secret: keySecret,
            });

        const payment =
            await razorpay.payments.fetch(
                razorpay_payment_id
            );

        // ==========================================
        // 3. PAYMENT MUST BELONG TO THIS ORDER
        // ==========================================

        if (
            payment.order_id !==
            razorpay_order_id
        ) {
            console.error(
                "❌ Payment/order mismatch."
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Payment and order do not match.",
                },
                { status: 400 }
            );
        }

        // ==========================================
        // 4. PAYMENT MUST BE CAPTURED
        // ==========================================

        if (
            payment.status !==
            "captured"
        ) {
            console.error(
                "❌ Payment not captured:",
                payment.status
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        `Payment is not captured. Current status: ${payment.status}`,
                },
                { status: 400 }
            );
        }

        console.log(
            "✅ Payment captured."
        );

        // ==========================================
        // 5. PREVENT DUPLICATE ORDER
        // ==========================================

        const {
            data: existingOrder,
            error: existingOrderError,
        } = await supabaseAdmin
            .from("orders")
            .select(
                "id, customer_name, email, phone, address, total, status, payment_status, razorpay_order_id, razorpay_payment_id, created_at"
            )
            .eq(
                "razorpay_payment_id",
                razorpay_payment_id
            )
            .maybeSingle();

        if (existingOrderError) {
            console.error(
                "Existing order lookup error:",
                existingOrderError
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Unable to check existing order.",
                },
                { status: 500 }
            );
        }

        if (existingOrder) {
            console.log(
                "ℹ️ Order already exists:",
                existingOrder.id
            );

            const {
                data: existingItems,
            } = await supabaseAdmin
                .from("order_items")
                .select(
                    "id, product_id, title, price, quantity"
                )
                .eq(
                    "order_id",
                    existingOrder.id
                )
                .order("id", {
                    ascending: true,
                });

            return NextResponse.json({
                success: true,
                alreadyCreated: true,
                message:
                    "Order already exists.",
                order: existingOrder,
                items:
                    existingItems || [],
            });
        }

        // ==========================================
        // 6. GET REAL PRODUCTS FROM DATABASE
        // ==========================================

        const normalizedItems =
            cartItems.map((item) => ({
                id: Number(item.id),
                quantity:
                    Number(item.quantity),
            }));

        for (const item of normalizedItems) {
            if (
                !Number.isInteger(
                    item.id
                ) ||
                item.id <= 0
            ) {
                return NextResponse.json(
                    {
                        success: false,
                        message:
                            "Invalid product ID.",
                    },
                    { status: 400 }
                );
            }

            if (
                !Number.isInteger(
                    item.quantity
                ) ||
                item.quantity <= 0
            ) {
                return NextResponse.json(
                    {
                        success: false,
                        message:
                            "Invalid product quantity.",
                    },
                    { status: 400 }
                );
            }
        }

        const productIds = [
            ...new Set(
                normalizedItems.map(
                    (item) => item.id
                )
            ),
        ];

        const {
            data: products,
            error: productsError,
        } = await supabaseAdmin
            .from("products")
            .select(
                "id, title, price, stock"
            )
            .in(
                "id",
                productIds
            );

        if (productsError) {
            console.error(
                "Product lookup error:",
                productsError
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Unable to verify products.",
                },
                { status: 500 }
            );
        }

        if (
            !products ||
            products.length !==
            productIds.length
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "One or more products could not be found.",
                },
                { status: 400 }
            );
        }

        // ==========================================
        // 7. SERVER-SIDE PRICE + STOCK CHECK
        // ==========================================

        let total = 0;

        const orderItems = [];

        for (
            const item of normalizedItems
            ) {
            const product =
                products.find(
                    (p) =>
                        p.id ===
                        item.id
                );

            if (!product) {
                return NextResponse.json(
                    {
                        success: false,
                        message:
                            "Product not found.",
                    },
                    { status: 400 }
                );
            }

            if (
                Number(product.stock) <
                item.quantity
            ) {
                return NextResponse.json(
                    {
                        success: false,
                        message:
                            `${product.title} has only ${product.stock} item(s) available.`,
                    },
                    { status: 400 }
                );
            }

            const price =
                Number(
                    String(
                        product.price
                    )
                        .replace(
                            /₹/g,
                            ""
                        )
                        .replace(
                            /,/g,
                            ""
                        )
                        .trim()
                );

            if (
                !Number.isFinite(
                    price
                ) ||
                price < 0
            ) {
                return NextResponse.json(
                    {
                        success: false,
                        message:
                            `Invalid price for ${product.title}.`,
                    },
                    { status: 400 }
                );
            }

            total +=
                price *
                item.quantity;

            orderItems.push({
                product_id:
                product.id,

                title:
                product.title,

                price:
                    String(
                        product.price
                    ),

                quantity:
                item.quantity,
            });
        }

        // ==========================================
        // 8. VERIFY PAYMENT AMOUNT
        // ==========================================

        const expectedAmount =
            Math.round(
                total * 100
            );

        const paidAmount =
            Number(
                payment.amount
            );

        if (
            paidAmount !==
            expectedAmount
        ) {
            console.error(
                "❌ PAYMENT AMOUNT MISMATCH",
                {
                    paidAmount,
                    expectedAmount,
                }
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Payment amount does not match the order total.",
                },
                { status: 400 }
            );
        }

        if (
            payment.currency &&
            payment.currency !==
            "INR"
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Invalid payment currency.",
                },
                { status: 400 }
            );
        }

        console.log(
            "✅ SERVER TOTAL VERIFIED:",
            total
        );

        // ==========================================
        // 9. CREATE ORDER
        // ==========================================

        const fullAddress =
            [
                customerAddress,
                customerCity,
                customerState,
            ]
                .filter(Boolean)
                .join(", ") +
            (
                customerPincode
                    ? ` - ${customerPincode}`
                    : ""
            );

        const {
            data: order,
            error: orderError,
        } = await supabaseAdmin
            .from("orders")
            .insert({
                customer_name:
                customerName,

                email:
                customerEmail,

                phone:
                customerPhone,

                address:
                fullAddress,

                total:
                    total.toString(),

                status:
                    "Pending",

                razorpay_order_id:
                razorpay_order_id,

                razorpay_payment_id:
                razorpay_payment_id,

                payment_status:
                    "Paid",

                stock_reduced:
                    false,
            })
            .select(
                "id, customer_name, email, phone, address, total, status, payment_status, razorpay_order_id, razorpay_payment_id, created_at"
            )
            .single();

        if (
            orderError ||
            !order
        ) {
            console.error(
                "ORDER CREATION ERROR:",
                orderError
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Payment succeeded, but the order could not be created.",
                },
                { status: 500 }
            );
        }

        console.log(
            "✅ ORDER CREATED:",
            order.id
        );

        // ==========================================
        // 10. CREATE ORDER ITEMS
        // ==========================================

        const itemsToInsert =
            orderItems.map(
                (item) => ({
                    order_id:
                    order.id,

                    product_id:
                    item.product_id,

                    title:
                    item.title,

                    price:
                    item.price,

                    quantity:
                    item.quantity,
                })
            );

        const {
            data: savedItems,
            error: itemsError,
        } = await supabaseAdmin
            .from("order_items")
            .insert(
                itemsToInsert
            )
            .select(
                "id, product_id, title, price, quantity"
            );

        if (itemsError) {
            console.error(
                "ORDER ITEMS ERROR:",
                itemsError
            );

            // Roll back the order
            await supabaseAdmin
                .from("orders")
                .delete()
                .eq(
                    "id",
                    order.id
                );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Payment succeeded, but order items could not be saved.",
                },
                { status: 500 }
            );
        }

        console.log(
            "✅ ORDER ITEMS CREATED."
        );

        // ==========================================
        // SUCCESS
        // ==========================================

        return NextResponse.json({
            success: true,

            message:
                "Payment verified and order created successfully.",

            order,

            items:
                savedItems ||
                [],
        });

    } catch (error) {
        console.error(
            "❌ VERIFY PAYMENT ERROR:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                message:
                    error instanceof Error
                        ? error.message
                        : "Unable to verify payment.",
            },
            { status: 500 }
        );
    }
}