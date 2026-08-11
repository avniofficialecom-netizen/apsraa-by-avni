import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { supabaseAdmin } from "../../../lib/supabase-admin";

type CartItem = {
    id: number;
    quantity: number;
};

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const rawItems = Array.isArray(body.items)
            ? body.items
            : [];

        // ==========================================
        // VALIDATE CART
        // ==========================================

        if (rawItems.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Cart is empty.",
                },
                { status: 400 }
            );
        }

        // ==========================================
        // NORMALIZE CART ITEMS
        // ==========================================

        const items: CartItem[] = rawItems.map(
            (item: any) => ({
                id: Number(item.id),
                quantity: Number(item.quantity),
            })
        );

        // ==========================================
        // VALIDATE PRODUCT IDs + QUANTITIES
        // ==========================================

        for (const item of items) {
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
        }

        // ==========================================
        // PREVENT DUPLICATE PRODUCT IDs
        // ==========================================

        const productIds =
            items.map(
                (item) => item.id
            );

        const uniqueProductIds =
            new Set(productIds);

        if (
            uniqueProductIds.size !==
            productIds.length
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Duplicate products are not allowed.",
                },
                { status: 400 }
            );
        }

        // ==========================================
        // GET REAL PRODUCTS FROM DATABASE
        // ==========================================
        //
        // Never trust prices or stock values
        // supplied by the browser.
        //

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

        // ==========================================
        // VERIFY ALL PRODUCTS EXIST
        // ==========================================

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
        // CALCULATE SERVER-SIDE TOTAL
        // ==========================================

        let total = 0;

        for (const item of items) {
            const product =
                products.find(
                    (product) =>
                        product.id ===
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
            // STOCK CHECK
            // ==========================================

            const stock =
                Number(
                    product.stock
                );

            if (
                !Number.isFinite(stock) ||
                stock < 0
            ) {
                return NextResponse.json(
                    {
                        success: false,
                        message:
                            `Invalid stock for ${product.title}.`,
                    },
                    { status: 400 }
                );
            }

            if (stock <= 0) {
                return NextResponse.json(
                    {
                        success: false,
                        message:
                            `${product.title} is out of stock.`,
                    },
                    { status: 400 }
                );
            }

            if (
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

            // ==========================================
            // PRICE VALIDATION
            // ==========================================

            const price =
                Number(
                    String(
                        product.price
                    )
                        .replace(
                            /[₹,]/g,
                            ""
                        )
                        .trim()
                );

            if (
                !Number.isFinite(
                    price
                ) ||
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
        }

        // ==========================================
        // VALIDATE TOTAL
        // ==========================================

        if (
            !Number.isFinite(
                total
            ) ||
            total <= 0
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
        // RAZORPAY CONFIGURATION
        // ==========================================

        const razorpayKeyId =
            process.env
                .NEXT_PUBLIC_RAZORPAY_KEY_ID;

        const razorpaySecret =
            process.env
                .RAZORPAY_KEY_SECRET;

        if (
            !razorpayKeyId ||
            !razorpaySecret
        ) {
            console.error(
                "❌ Razorpay configuration is missing."
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Payment configuration is unavailable.",
                },
                { status: 500 }
            );
        }

        // ==========================================
        // CREATE RAZORPAY ORDER
        // ==========================================

        const razorpay =
            new Razorpay({
                key_id:
                razorpayKeyId,

                key_secret:
                razorpaySecret,
            });

        const order =
            await razorpay.orders.create(
                {
                    amount:
                        Math.round(
                            total * 100
                        ),

                    currency:
                        "INR",

                    receipt:
                        `receipt_${Date.now()}`,
                }
            );

        console.log(
            "✅ Razorpay order created:",
            order.id
        );

        return NextResponse.json({
            success: true,
            id: order.id,
            amount:
            order.amount,
            currency:
            order.currency,
        });

    } catch (error) {
        console.error(
            "Create Razorpay Order Error:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                message:
                    "Unable to create payment order.",
            },
            { status: 500 }
        );
    }
}