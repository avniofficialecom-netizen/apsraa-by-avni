import { NextResponse } from "next/server";
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
            customer,
            items,
        } = body;

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
            !customerAddress ||
            !customerCity ||
            !customerState ||
            !customerPincode
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Customer details are incomplete.",
                },
                { status: 400 }
            );
        }

        if (!/^[6-9]\d{9}$/.test(customerPhone)) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid mobile number.",
                },
                { status: 400 }
            );
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid email address.",
                },
                { status: 400 }
            );
        }

        if (!/^\d{6}$/.test(customerPincode)) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid PIN code.",
                },
                { status: 400 }
            );
        }

        // ==========================================
        // CART
        // ==========================================

        const cartItems: CartItem[] =
            Array.isArray(items)
                ? items.map((item: any) => ({
                    id: Number(item.id),
                    quantity: Number(item.quantity),

                    variantId:
                        item.variantId !== undefined &&
                        item.variantId !== null &&
                        item.variantId !== ""
                            ? Number(item.variantId)
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
        // VALIDATE ITEMS
        // ==========================================

        for (const item of cartItems) {
            if (
                !Number.isInteger(item.id) ||
                item.id <= 0
            ) {
                return NextResponse.json(
                    {
                        success: false,
                        message: "Invalid product ID.",
                    },
                    { status: 400 }
                );
            }

            if (
                !Number.isInteger(item.quantity) ||
                item.quantity <= 0
            ) {
                return NextResponse.json(
                    {
                        success: false,
                        message: "Invalid product quantity.",
                    },
                    { status: 400 }
                );
            }

            if (
                item.variantId !== undefined &&
                (
                    !Number.isInteger(item.variantId) ||
                    item.variantId <= 0
                )
            ) {
                return NextResponse.json(
                    {
                        success: false,
                        message: "Invalid variant ID.",
                    },
                    { status: 400 }
                );
            }
        }

        // ==========================================
        // PREVENT DUPLICATE CART ITEMS
        // ==========================================

        const itemKeys = cartItems.map(
            (item) =>
                `${item.id}:${item.variantId ?? "product"}`
        );

        if (new Set(itemKeys).size !== itemKeys.length) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Duplicate cart items are not allowed.",
                },
                { status: 400 }
            );
        }

        // ==========================================
        // PRODUCTS
        // ==========================================

        const productIds = [
            ...new Set(
                cartItems.map((item) => item.id)
            ),
        ];

        const {
            data: products,
            error: productsError,
        } = await supabaseAdmin
            .from("products")
            .select("id, title, price, stock")
            .in("id", productIds);

        if (productsError) {
            console.error(
                "COD product lookup error:",
                productsError
            );

            return NextResponse.json(
                {
                    success: false,
                    message: "Unable to verify products.",
                },
                { status: 500 }
            );
        }

        if (
            !products ||
            products.length !== productIds.length
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
        // VARIANTS
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
                            id !== undefined
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
                .in("id", variantIds);

            if (variantError) {
                console.error(
                    "COD variant lookup error:",
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
                (variantData || []) as Variant[];

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
        // SERVER-SIDE TOTAL
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
                        p.id === item.id
                );

            if (!product) {
                return NextResponse.json(
                    {
                        success: false,
                        message: "Product not found.",
                    },
                    { status: 400 }
                );
            }

            // ==========================================
            // VARIANT PRODUCT
            // ==========================================

            if (item.variantId !== undefined) {
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

                const stock =
                    Number(variant.stock);

                if (
                    !Number.isFinite(stock) ||
                    stock < item.quantity
                ) {
                    return NextResponse.json(
                        {
                            success: false,
                            message:
                                `${product.title} selected variant has only ${stock} item(s) available.`,
                        },
                        { status: 400 }
                    );
                }

                const productPrice =
                    Number(
                        String(product.price)
                            .replace(/₹/g, "")
                            .replace(/,/g, "")
                            .trim()
                    );

                if (
                    !Number.isFinite(productPrice) ||
                    productPrice <= 0
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
                    productPrice *
                    item.quantity;

                orderItems.push({
                    product_id:
                    product.id,

                    variant_id:
                    variant.id,

                    title:
                    product.title,

                    price:
                        productPrice.toString(),

                    quantity:
                    item.quantity,
                });

                continue;
            }

            // ==========================================
            // NORMAL PRODUCT
            // ==========================================

            const stock =
                Number(product.stock);

            if (
                !Number.isFinite(stock) ||
                stock < item.quantity
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
                    String(product.price)
                        .replace(/₹/g, "")
                        .replace(/,/g, "")
                        .trim()
                );

            if (
                !Number.isFinite(price) ||
                price <= 0
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

        if (
            !Number.isFinite(total) ||
            total <= 0
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid order total.",
                },
                { status: 400 }
            );
        }

        // ==========================================
        // ADDRESS
        // ==========================================

        const fullAddress =
            [
                customerAddress,
                customerCity,
                customerState,
            ]
                .filter(Boolean)
                .join(", ") +
            ` - ${customerPincode}`;

        // ==========================================
        // CREATE COD ORDER
        // ==========================================

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

                // IMPORTANT:
                // COD is not paid yet.
                payment_status:
                    "Pending",

                // IMPORTANT:
                // Explicitly mark this order as COD.
                payment_method:
                    "cod",

                stock_reduced:
                    false,
            })
            .select(
                "id, customer_name, email, phone, address, total, status, payment_status, payment_method, created_at"
            )
            .single();

        if (
            orderError ||
            !order
        ) {
            console.error(
                "COD order creation error:",
                orderError
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Unable to create COD order.",
                },
                { status: 500 }
            );
        }

        // ==========================================
        // CREATE ORDER ITEMS
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

        const {
            data: savedItems,
            error: itemsError,
        } = await supabaseAdmin
            .from("order_items")
            .insert(itemsToInsert)
            .select(
                "id, product_id, variant_id, title, price, quantity"
            );

        if (itemsError) {
            console.error(
                "COD order items error:",
                itemsError
            );

            await supabaseAdmin
                .from("orders")
                .delete()
                .eq("id", order.id);

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Unable to save COD order items.",
                },
                { status: 500 }
            );
        }

        // ==========================================
        // REDUCE STOCK
        // ==========================================

        const {
            data: stockResult,
            error: stockError,
        } = await supabaseAdmin.rpc(
            "reduce_order_stock",
            {
                p_order_id:
                order.id,
            }
        );

        if (
            stockError ||
            !stockResult?.success
        ) {
            console.error(
                "COD stock reduction error:",
                stockError ||
                stockResult
            );

            await supabaseAdmin
                .from("order_items")
                .delete()
                .eq(
                    "order_id",
                    order.id
                );

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
                        stockError?.message ||
                        "Unable to reserve stock for this COD order.",
                },
                { status: 500 }
            );
        }

        // ==========================================
        // SEND ORDER EMAIL
        // ==========================================

        try {
            const origin =
                new URL(req.url).origin;

            await fetch(
                `${origin}/api/send-order-email`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body:
                        JSON.stringify({
                            orderId:
                            order.id,

                            email:
                            customerEmail,

                            phone:
                            customerPhone,
                        }),
                }
            );
        } catch (emailError) {
            console.error(
                "COD order email error:",
                emailError
            );

            // Email failure must not cancel
            // an already-created COD order.
        }

        // ==========================================
        // SUCCESS
        // ==========================================

        return NextResponse.json({
            success: true,

            message:
                "COD order placed successfully.",

            order,

            items:
                savedItems || [],
        });
    } catch (error) {
        console.error(
            "Create COD order error:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                message:
                    error instanceof Error
                        ? error.message
                        : "Unable to create COD order.",
            },
            { status: 500 }
        );
    }
}
