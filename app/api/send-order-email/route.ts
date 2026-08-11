import { NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "../../../lib/supabase-admin";

const resend = new Resend(
    process.env.RESEND_API_KEY
);

// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHtml(value: unknown) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ==========================================
// SEND ORDER EMAIL
// ==========================================

export async function POST(req: Request) {
    try {
        console.log(
            "========== SEND ORDER EMAIL =========="
        );

        const body = await req.json();

        const orderId = Number(body.orderId);

        const enteredEmail = String(
            body.email || ""
        )
            .trim()
            .toLowerCase();

        const enteredPhone = String(
            body.phone || ""
        ).replace(/\D/g, "");

        console.log(
            "EMAIL REQUEST ORDER ID:",
            orderId
        );

        console.log(
            "EMAIL PROVIDED:",
            enteredEmail || "(none)"
        );

        console.log(
            "PHONE PROVIDED:",
            enteredPhone || "(none)"
        );

        // ==========================================
        // VALIDATE ORDER ID
        // ==========================================

        if (!orderId || isNaN(orderId)) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Valid Order ID is required.",
                },
                {
                    status: 400,
                }
            );
        }

        // ==========================================
        // VALIDATE CUSTOMER CONTACT
        // ==========================================

        if (!enteredEmail && !enteredPhone) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Customer email or phone is required.",
                },
                {
                    status: 400,
                }
            );
        }

        // ==========================================
        // RESEND CONFIGURATION
        // ==========================================

        if (!process.env.RESEND_API_KEY) {
            console.error(
                "❌ RESEND_API_KEY is missing"
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Resend API key is not configured.",
                },
                {
                    status: 500,
                }
            );
        }

        // ==========================================
        // VERIFIED SENDER
        // ==========================================

        const fromEmail =
            "APSRAA BY AVNI <onboarding@resend.dev>";

        console.log(
            "RESEND FROM:",
            fromEmail
        );

        // ==========================================
        // FETCH ORDER
        // ==========================================

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
                payment_status,
                status,
                created_at
            `)
            .eq("id", orderId)
            .single();

        if (orderError || !order) {
            console.error(
                "❌ ORDER FETCH ERROR:",
                orderError
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Order not found.",
                },
                {
                    status: 404,
                }
            );
        }

        console.log(
            "✅ ORDER FOUND:",
            order.id
        );

        // ==========================================
        // VERIFY CUSTOMER
        // ==========================================

        const customerEmail =
            String(order.email || "")
                .trim()
                .toLowerCase();

        const customerPhone =
            String(order.phone || "")
                .replace(/\D/g, "");

        const emailMatches =
            enteredEmail !== "" &&
            customerEmail !== "" &&
            enteredEmail === customerEmail;

        const phoneMatches =
            enteredPhone !== "" &&
            customerPhone !== "" &&
            enteredPhone === customerPhone;

        if (
            !emailMatches &&
            !phoneMatches
        ) {
            console.warn(
                "❌ CUSTOMER VERIFICATION FAILED:",
                order.id
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Customer verification failed.",
                },
                {
                    status: 403,
                }
            );
        }

        console.log(
            "✅ CUSTOMER VERIFIED:",
            order.id
        );

        // ==========================================
        // VALIDATE CUSTOMER EMAIL
        // ==========================================

        if (!customerEmail) {
            console.error(
                "❌ CUSTOMER EMAIL MISSING:",
                order.id
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Customer email is missing from this order.",
                },
                {
                    status: 400,
                }
            );
        }

        // ==========================================
        // VALIDATE PAYMENT
        // ==========================================

        const paymentStatus =
            String(
                order.payment_status ||
                "Pending"
            )
                .trim()
                .toLowerCase();

        if (paymentStatus !== "paid") {
            console.error(
                "❌ EMAIL BLOCKED - ORDER NOT PAID:",
                order.id,
                order.payment_status
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Order email can only be sent for a paid order.",
                },
                {
                    status: 400,
                }
            );
        }

        console.log(
            "✅ PAYMENT VERIFIED FOR EMAIL"
        );

        // ==========================================
        // FETCH ORDER ITEMS
        // ==========================================

        const {
            data: items,
            error: itemsError,
        } = await supabaseAdmin
            .from("order_items")
            .select(`
                id,
                title,
                price,
                quantity
            `)
            .eq("order_id", orderId)
            .order("id", {
                ascending: true,
            });

        if (itemsError) {
            console.error(
                "❌ ORDER ITEMS ERROR:",
                itemsError
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Unable to load order products.",
                },
                {
                    status: 500,
                }
            );
        }

        console.log(
            "ORDER ITEMS:",
            items?.length || 0
        );

        // ==========================================
        // SAFE VALUES
        // ==========================================

        const customerName =
            escapeHtml(
                order.customer_name ||
                "Customer"
            );

        const total =
            escapeHtml(
                order.total || "0"
            );

        const orderStatus =
            escapeHtml(
                order.status ||
                "Pending"
            );

        const safePaymentStatus =
            escapeHtml(
                order.payment_status ||
                "Paid"
            );

        // ==========================================
        // PRODUCT HTML
        // ==========================================

        const productHtml =
            items &&
            items.length > 0
                ? items
                    .map(
                        (item) => `
                            <div style="
                                border-bottom:1px solid #eee;
                                padding:14px 0;
                            ">

                                <div style="
                                    font-weight:bold;
                                    color:#333;
                                    font-size:16px;
                                ">
                                    ${escapeHtml(
                            item.title
                        )}
                                </div>

                                <div style="
                                    color:#777;
                                    margin-top:6px;
                                ">
                                    Quantity:
                                    ${escapeHtml(
                            item.quantity
                        )}
                                </div>

                                <div style="
                                    color:#be0060;
                                    font-weight:bold;
                                    margin-top:6px;
                                ">
                                    ₹${escapeHtml(
                            item.price
                        )}
                                </div>

                            </div>
                        `
                    )
                    .join("")
                : `
                    <p style="
                        color:#777;
                        padding:10px 0;
                    ">
                        No product details are available.
                    </p>
                `;

        // ==========================================
        // WEBSITE URL
        // ==========================================

        const siteUrl =
            process.env.NEXT_PUBLIC_SITE_URL ||
            "http://localhost:3000";

        // ==========================================
        // SEND EMAIL
        // ==========================================

        console.log(
            "========== CALLING RESEND =========="
        );

        console.log(
            "EMAIL TO:",
            customerEmail
        );

        console.log(
            "EMAIL FROM:",
            fromEmail
        );

        const {
            data,
            error,
        } = await resend.emails.send({
            from: fromEmail,

            to: [
                customerEmail
            ],

            subject:
                `Order #${order.id} Confirmed - APSRAA BY AVNI`,

            html: `
                <div style="
                    font-family:Arial,sans-serif;
                    background:#fff5fa;
                    padding:40px 20px;
                ">

                    <div style="
                        max-width:600px;
                        margin:auto;
                        background:white;
                        border-radius:20px;
                        padding:40px;
                        box-shadow:
                            0 10px 30px
                            rgba(0,0,0,0.08);
                    ">

                        <div style="
                            text-align:center;
                            margin-bottom:30px;
                        ">

                            <h1 style="
                                color:#be0060;
                                font-size:32px;
                                margin:0;
                            ">
                                APSRAA BY AVNI
                            </h1>

                            <p style="
                                color:#777;
                                margin-top:8px;
                            ">
                                Premium Artificial Jewellery
                            </p>

                        </div>

                        <div style="
                            text-align:center;
                            margin-bottom:30px;
                        ">

                            <div style="
                                font-size:55px;
                            ">
                                🎉
                            </div>

                            <h2 style="
                                color:#be0060;
                                font-size:28px;
                            ">
                                Thank You for Your Order!
                            </h2>

                            <p style="
                                color:#555;
                                font-size:16px;
                            ">
                                Hi ${customerName},
                            </p>

                            <p style="
                                color:#555;
                                font-size:16px;
                                line-height:1.6;
                            ">
                                Your payment has been
                                successfully received and
                                your order has been placed.
                            </p>

                        </div>

                        <div style="
                            background:#fff0f7;
                            border-radius:15px;
                            padding:25px;
                            margin-bottom:25px;
                        ">

                            <h3 style="
                                color:#be0060;
                                margin-top:0;
                            ">
                                Order Details
                            </h3>

                            <p>
                                <strong>
                                    Order Number:
                                </strong>
                                #${order.id}
                            </p>

                            <p>
                                <strong>
                                    Amount:
                                </strong>
                                ₹${total}
                            </p>

                            <p>
                                <strong>
                                    Payment:
                                </strong>

                                <span style="
                                    color:#008a3e;
                                    font-weight:bold;
                                ">
                                    ${safePaymentStatus}
                                </span>
                            </p>

                            <p>
                                <strong>
                                    Order Status:
                                </strong>
                                ${orderStatus}
                            </p>

                        </div>

                        <div style="
                            margin-bottom:30px;
                        ">

                            <h3 style="
                                color:#be0060;
                            ">
                                Products Ordered
                            </h3>

                            ${productHtml}

                        </div>

                        <div style="
                            text-align:center;
                            margin-top:30px;
                        ">

                            <p style="
                                color:#555;
                                line-height:1.6;
                            ">
                                You can track your order
                                anytime from our website.
                            </p>

                            <a
                                href="${siteUrl}/track-order"
                                style="
                                    display:inline-block;
                                    background:#e60073;
                                    color:white;
                                    padding:14px 28px;
                                    border-radius:30px;
                                    text-decoration:none;
                                    font-weight:bold;
                                    margin-top:10px;
                                "
                            >
                                Track My Order
                            </a>

                        </div>

                        <div style="
                            border-top:1px solid #eee;
                            margin-top:35px;
                            padding-top:25px;
                            text-align:center;
                        ">

                            <p style="
                                color:#888;
                                font-size:14px;
                            ">
                                Thank you for shopping with
                                APSRAA BY AVNI ❤️
                            </p>

                        </div>

                    </div>

                </div>
            `,
        });

        // ==========================================
        // RESEND ERROR
        // ==========================================

        if (error) {
            console.error(
                "❌ RESEND ERROR:",
                JSON.stringify(
                    error,
                    null,
                    2
                )
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        error.message ||
                        "Resend failed to send email.",
                    error,
                },
                {
                    status: 500,
                }
            );
        }

        // ==========================================
        // SUCCESS
        // ==========================================

        console.log(
            "========================================"
        );

        console.log(
            "✅ ORDER EMAIL SENT SUCCESSFULLY"
        );

        console.log(
            "EMAIL ID:",
            data?.id
        );

        console.log(
            "========================================"
        );

        return NextResponse.json({
            success: true,
            message:
                "Order email sent successfully.",
            emailId:
                data?.id || null,
        });

    } catch (error) {
        console.error(
            "❌ SEND ORDER EMAIL ERROR:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                message:
                    error instanceof Error
                        ? error.message
                        : "Unable to send order email.",
            },
            {
                status: 500,
            }
        );
    }
}