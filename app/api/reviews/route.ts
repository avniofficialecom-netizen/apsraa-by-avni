import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    const productId = Number(
        new URL(request.url).searchParams.get("productId")
    );

    if (!Number.isInteger(productId) || productId <= 0) {
        return NextResponse.json(
            {
                success: false,
                message: "A valid product is required.",
            },
            { status: 400 }
        );
    }

    const { data, error } = await supabaseAdmin
        .from("product_reviews")
        .select(
            "id, customer_name, rating, comment, created_at"
        )
        .eq("product_id", productId)
        .eq("status", "approved")
        .order("created_at", { ascending: false });

    if (error) {
        return NextResponse.json(
            {
                success: false,
                message: "Unable to load reviews.",
            },
            { status: 500 }
        );
    }

    const reviews = data ?? [];

    const averageRating = reviews.length
        ? reviews.reduce(
              (sum, review) => sum + Number(review.rating),
              0
          ) / reviews.length
        : 0;

    return NextResponse.json({
        success: true,
        reviews,
        averageRating,
        reviewCount: reviews.length,
    });
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const productId = Number(body.productId);
        const customerName = String(
            body.customerName ?? ""
        ).trim();
        const customerEmail = String(
            body.customerEmail ?? ""
        )
            .trim()
            .toLowerCase();
        const rating = Number(body.rating);
        const comment = String(body.comment ?? "").trim();

        // --------------------------------------------------
        // Basic validation
        // --------------------------------------------------

        if (!Number.isInteger(productId) || productId <= 0) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid product.",
                },
                { status: 400 }
            );
        }

        if (
            customerName.length < 2 ||
            customerName.length > 60
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Please enter your name.",
                },
                { status: 400 }
            );
        }

        if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                customerEmail
            )
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Please enter a valid email address.",
                },
                { status: 400 }
            );
        }

        if (
            !Number.isInteger(rating) ||
            rating < 1 ||
            rating > 5
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Please select a rating.",
                },
                { status: 400 }
            );
        }

        if (
            comment.length < 10 ||
            comment.length > 1000
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Your review must be 10 to 1,000 characters.",
                },
                { status: 400 }
            );
        }

        // --------------------------------------------------
        // Verify that this customer actually purchased
        // this product.
        // --------------------------------------------------

        const { data: orders, error: orderError } =
            await supabaseAdmin
                .from("orders")
                .select("id")
                .eq("email", customerEmail)
                .eq("payment_status", "Paid");

        if (orderError) {
            console.error(
                "Review purchase verification - orders error:",
                orderError
            );

            return NextResponse.json(
                {
                    success: false,
                    message: "Unable to verify your purchase.",
                },
                { status: 500 }
            );
        }

        if (!orders || orders.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Only customers who purchased this product can leave a review.",
                },
                { status: 403 }
            );
        }

        const orderIds = orders.map((order) => order.id);

        const { data: purchasedItem, error: itemError } =
            await supabaseAdmin
                .from("order_items")
                .select("id")
                .in("order_id", orderIds)
                .eq("product_id", productId)
                .limit(1)
                .maybeSingle();

        if (itemError) {
            console.error(
                "Review purchase verification - order item error:",
                itemError
            );

            return NextResponse.json(
                {
                    success: false,
                    message: "Unable to verify your purchase.",
                },
                { status: 500 }
            );
        }

        if (!purchasedItem) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Only customers who purchased this product can leave a review.",
                },
                { status: 403 }
            );
        }

        // --------------------------------------------------
        // Create the review
        // --------------------------------------------------

        const { error } = await supabaseAdmin
            .from("product_reviews")
            .insert({
                product_id: productId,
                customer_name: customerName,
                customer_email: customerEmail,
                rating,
                comment,
                status: "pending",
            });

        if (error?.code === "23505") {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "You have already reviewed this product.",
                },
                { status: 409 }
            );
        }

        if (error) {
            console.error(
                "Review insert error:",
                error
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Unable to submit your review.",
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message:
                "Thank you. Your review is awaiting approval.",
        });
    } catch (error) {
        console.error("Review API error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Unable to submit your review.",
            },
            { status: 500 }
        );
    }
}