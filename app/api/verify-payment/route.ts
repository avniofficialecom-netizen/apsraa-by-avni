import { NextResponse } from "next/server";
import crypto from "crypto";
import Razorpay from "razorpay";
import { supabaseAdmin } from "../../../lib/supabase-admin";

type CartItem = {
    id: number;
    quantity: number;
    variantId?: number;
};

type Product = {
    id: number;
    title: string;
    price: number | string;
    stock: number;
};

type Variant = {
    id: number;
    product_id: number;
    sku: string | null;
    size: string | null;
    color: string | null;
    stock: number;
    price: number | string | null;
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

        if (
            !customerEmail.includes("@")
        ) {
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
                ? items.map((item: any) => ({
                    id: Number(item.id),
                    quantity: Number(
                        item.quantity
                    ),
                    variantId:
                        item.variantId !==
                        undefined &&
                        item.variantId !==
                        null &&
                        item.variantId !== ""
                            ? Number(
                                item.variantId
                            )
                            : undefined,
                }))
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
        // VALIDATE CART ITEMS
        // ==========================================

        for (const item of cartItems) {
            if (
                !Number.isInteger(item.id) ||
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

            if (
                item.variantId !==
                undefined &&
                (
                    !Number.isInteger(
                        item.variantId
                    ) ||
                    item.variantId <= 0
                )
            ) {
                return NextResponse.json(
                    {
                        success: false,
                        message:
                            "Invalid variant ID.",
                    },
                    { status: 400 }
                );
            }
        }

        // ==========================================
        // RAZORPAY CREDENTIALS
        // ==========================================

        const keyId =
            process.env
                .NEXT_PUBLIC_RAZORPAY_KEY_ID;

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

        if (
            !crypto.timingSafeEqual(
                expectedBuffer,
                receivedBuffer
            )
        ) {
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
        // 3. PAYMENT MUST BELONG TO ORDER
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
                    "id, product_id, variant_id, title, price, quantity"
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
        // 6. GET PRODUCTS
        // ==========================================

        const productIds = [
            ...new Set(
                cartItems.map(
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

        const typedProducts =
            products as Product[];

        // ==========================================
        // 7. GET VARIANTS
        // ==========================================

        const variantIds = [
            ...new Set(
                cartItems
                    .map(
                        (item) =>
                            item.variantId
                    )
                    .filter(
                        (
                            id
                        ): id is number =>
                            id !==
                            undefined
                    )
            ),
        ];

        let variants: Variant[] = [];

        if (variantIds.length > 0) {
            const {
                data: variantData,
                error: variantError,
            } = await supabaseAdmin
                .from("product_variants")
                .select(
                    "id, product_id, sku, size, color, stock, price"
                )
                .in(
                    "id",
                    variantIds
                );

            if (variantError) {
                console.error(
                    "Variant lookup error:",
                    variantError
                );

                return NextResponse.json(
                    {
                        success: false,
                        message:
                            "Unable to verify product variants.",
                    },
                    { status: 500 }
                );
            }

            variants =
                (variantData ||
                    []) as Variant[];

            if (
                variants.length !==
                variantIds.length
            ) {
                return NextResponse.json(
                    {
                        success: false,
                        message:
                            "One or more selected variants could not be found.",
                    },
                    { status: 400 }
                );
            }
        }

        // ==========================================
        // 8. SERVER-SIDE PRICE + STOCK
        // ==========================================

        let total = 0;

        const orderItems: {
            product_id: number;
            variant_id: number | null;
            title: string;
            price: string;
            quantity: number;
        }[] = [];

        for (const item of cartItems) {
            const product =
                typedProducts.find(
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

            // ==========================================
            // VARIANT PRODUCT
            // ==========================================

            if (
                item.variantId !==
                undefined
            ) {
                const variant =
                    variants.find(
                        (v) =>
                            v.id ===
                            item.variantId
                    );

                if (!variant) {
                    return NextResponse.json(
                        {
                            success: false,
                            message:
                                "Selected variant could not be found.",
                        },
                        { status: 400 }
                    );
                }

                if (
                    variant.product_id !==
                    product.id
                ) {
                    return NextResponse.json(
                        {
                            success: false,
                            message:
                                "Selected variant does not belong to this product.",
                        },
                        { status: 400 }
                    );
                }

                const variantStock =
                    Number(
                        variant.stock
                    );

                if (
                    !Number.isFinite(
                        variantStock
                    ) ||
                    variantStock <
                    item.quantity
                ) {
                    return NextResponse.json(
                        {
                            success: false,
                            message:
                                `${product.title} selected variant has only ${variantStock} item(s) available.`,
                        },
                        { status: 400 }
                    );
                }

                const variantPrice =
                    variant.price !==
                    null &&
                    variant.price !==
                    undefined &&
                    String(
                        variant.price
                    ).trim() !== ""
                        ? Number(
                            String(
                                variant.price
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
                        )
                        : Number(
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
                        variantPrice
                    ) ||
                    variantPrice < 0
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
                    variantPrice *
                    item.quantity;

                orderItems.push({
                    product_id:
                    product.id,

                    variant_id:
                    variant.id,

                    title:
                    product.title,

                    price:
                        variantPrice.toString(),

                    quantity:
                    item.quantity,
                });

                continue;
            }

            // ==========================================
            // NORMAL PRODUCT WITHOUT VARIANT
            // ==========================================

            const stock =
                Number(
                    product.stock
                );

            if (
                !Number.isFinite(
                    stock
                ) ||
                stock <
                item.quantity
            ) {
                return NextResponse.json(
                    {
                        success: false,
                        message:
                            `${product.title} has only ${stock} item(s) available.`,
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

                variant_id:
                    null,

                title:
                product.title,

                price:
                    price.toString(),

                quantity:
                item.quantity,
            });
        }

        // ==========================================
        // 9. VERIFY PAYMENT AMOUNT
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
        // 10. CREATE ORDER
        // ==========================================

        const fullAddress =
            [
                customerAddress,
                customerCity,
                customerState,
            ]
                .filter(Boolean)
                .join(", ") +
            (customerPincode
                ? ` - ${customerPincode}`
                : "");

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
        // 11. CREATE ORDER ITEMS
        // ==========================================

        const itemsToInsert =
            orderItems.map(
                (item) => ({
                    order_id:
                    order.id,

                    product_id:
                    item.product_id,

                    variant_id:
                    item.variant_id,

                    title:
                    item.title,

                    price:
                    item.price,

                    quantity:
                    item.quantity,
                })
            );

        console.log(
            "ORDER ITEMS TO INSERT:",
            itemsToInsert
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
                "id, product_id, variant_id, title, price, quantity"
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
            "✅ ORDER ITEMS CREATED:",
            savedItems
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
                savedItems || [],
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