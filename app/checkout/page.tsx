"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { useCart } from "../../components/context/CartContext";

declare global {
    interface Window {
        Razorpay: any;
    }
}

export default function Checkout() {
    const { cart, clearCart } = useCart();
    const router = useRouter();

    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState("");
    const [city, setCity] = useState("");
    const [state, setState] = useState("");
    const [pincode, setPincode] = useState("");
    const [processing, setProcessing] = useState(false);

    const total = cart.reduce(
        (sum, item) =>
            sum +
            Number(
                String(item.price)
                    .replace("₹", "")
                    .replace(/,/g, "")
            ) * item.quantity,
        0
    );

    // ==========================================
    // LOAD RAZORPAY
    // ==========================================

    const loadRazorpay = () => {
        return new Promise<boolean>((resolve) => {
            if (window.Razorpay) {
                resolve(true);
                return;
            }

            const script =
                document.createElement("script");

            script.src =
                "https://checkout.razorpay.com/v1/checkout.js";

            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);

            document.body.appendChild(script);
        });
    };

    // ==========================================
    // PLACE ORDER
    // ==========================================

    const placeOrder = async () => {
        if (processing) return;

        // ==========================================
        // CUSTOMER VALIDATION
        // ==========================================

        if (
            !name.trim() ||
            !phone.trim() ||
            !email.trim() ||
            !address.trim()
        ) {
            alert(
                "Please fill Name, Phone, Email and Address."
            );
            return;
        }

        if (!email.includes("@")) {
            alert(
                "Please enter a valid email address."
            );
            return;
        }

        if (cart.length === 0) {
            alert("Your cart is empty.");
            return;
        }

        setProcessing(true);

        try {
            // ==========================================
            // LOAD RAZORPAY
            // ==========================================

            const loaded =
                await loadRazorpay();

            if (!loaded) {
                alert(
                    "Failed to load Razorpay."
                );

                setProcessing(false);
                return;
            }

            // ==========================================
            // CREATE RAZORPAY ORDER
            // ==========================================

            console.log(
                "========== CREATE RAZORPAY ORDER =========="
            );

            const createOrderResponse =
                await fetch(
                    "/api/create-order",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body: JSON.stringify({
                            items: cart.map(
                                (item) => ({
                                    id: item.id,
                                    quantity:
                                    item.quantity,
                                })
                            ),
                        }),
                    }
                );

            const razorpayOrder =
                await createOrderResponse.json();

            console.log(
                "RAZORPAY ORDER:",
                razorpayOrder
            );

            if (
                !createOrderResponse.ok ||
                !razorpayOrder.success
            ) {
                alert(
                    razorpayOrder.message ||
                    "Unable to create Razorpay order."
                );

                setProcessing(false);
                return;
            }

            // ==========================================
            // RAZORPAY OPTIONS
            // ==========================================

            const options = {
                key:
                process.env
                    .NEXT_PUBLIC_RAZORPAY_KEY_ID,

                amount:
                razorpayOrder.amount,

                currency:
                razorpayOrder.currency,

                name:
                    "APSRAA BY AVNI",

                description:
                    "Jewellery Purchase",

                image:
                    "/logo.png",

                order_id:
                razorpayOrder.id,

                prefill: {
                    name,
                    email,
                    contact: phone,
                },

                theme: {
                    color: "#db2777",
                },

                // ==========================================
                // PAYMENT SUCCESS
                // ==========================================

                handler: async (
                    response: any
                ) => {
                    try {
                        console.log(
                            "========== PAYMENT SUCCESS =========="
                        );

                        console.log(
                            "RAZORPAY ORDER ID:",
                            response.razorpay_order_id
                        );

                        console.log(
                            "RAZORPAY PAYMENT ID:",
                            response.razorpay_payment_id
                        );

                        // ==========================================
                        // VERIFY PAYMENT + CREATE ORDER
                        // ==========================================

                        console.log(
                            "========== VERIFY PAYMENT =========="
                        );

                        const verifyResponse =
                            await fetch(
                                "/api/verify-payment",
                                {
                                    method: "POST",

                                    headers: {
                                        "Content-Type":
                                            "application/json",
                                    },

                                    body:
                                        JSON.stringify({
                                            razorpay_order_id:
                                            response.razorpay_order_id,

                                            razorpay_payment_id:
                                            response.razorpay_payment_id,

                                            razorpay_signature:
                                            response.razorpay_signature,

                                            customer: {
                                                name,
                                                phone,
                                                email,
                                                address,
                                                city,
                                                state,
                                                pincode,
                                            },

                                            items:
                                                cart.map(
                                                    (
                                                        item
                                                    ) => ({
                                                        id: item.id,
                                                        quantity:
                                                        item.quantity,
                                                    })
                                                ),
                                        }),
                                }
                            );

                        const verify =
                            await verifyResponse.json();

                        console.log(
                            "VERIFY RESPONSE:",
                            verify
                        );

                        if (
                            !verifyResponse.ok ||
                            !verify.success ||
                            !verify.order
                        ) {
                            alert(
                                verify.message ||
                                "Payment verification failed."
                            );

                            setProcessing(false);
                            return;
                        }

                        console.log(
                            "✅ PAYMENT VERIFIED + ORDER CREATED"
                        );

                        const order =
                            verify.order;

                        // ==========================================
                        // REDUCE STOCK
                        // ==========================================

                        console.log(
                            "========== REDUCE STOCK =========="
                        );

                        const stockResponse =
                            await fetch(
                                "/api/reduce-stock",
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

                                            razorpay_payment_id:
                                            response.razorpay_payment_id,

                                            razorpay_signature:
                                            response.razorpay_signature,
                                        }),
                                }
                            );

                        const stockResult =
                            await stockResponse.json();

                        console.log(
                            "STOCK RESPONSE:",
                            stockResult
                        );

                        if (
                            !stockResponse.ok ||
                            !stockResult.success
                        ) {
                            console.error(
                                "STOCK REDUCTION FAILED:",
                                stockResult
                            );

                            alert(
                                stockResult.message ||
                                "Payment succeeded, but stock could not be updated. Please contact support."
                            );

                            setProcessing(false);
                            return;
                        }

                        console.log(
                            "✅ STOCK REDUCED"
                        );

                        // ==========================================
                        // SEND ORDER EMAIL
                        // ==========================================

                        console.log(
                            "========== ORDER EMAIL =========="
                        );

                        try {
                            const emailResponse =
                                await fetch(
                                    "/api/send-order-email",
                                    {
                                        method:
                                            "POST",

                                        headers: {
                                            "Content-Type":
                                                "application/json",
                                        },

                                        body:
                                            JSON.stringify({
                                                orderId:
                                                order.id,

                                                // Customer email
                                                email:
                                                    email.trim(),

                                                // Customer phone
                                                phone:
                                                    phone.trim(),
                                            }),
                                    }
                                );

                            const emailText =
                                await emailResponse.text();

                            let emailResult:
                                any = null;

                            try {
                                emailResult =
                                    JSON.parse(
                                        emailText
                                    );
                            } catch {
                                console.error(
                                    "EMAIL RESPONSE JSON PARSE ERROR:",
                                    emailText
                                );
                            }

                            console.log(
                                "EMAIL RESULT:",
                                emailResult
                            );

                            if (
                                !emailResponse.ok ||
                                !emailResult?.success
                            ) {
                                console.error(
                                    "❌ ORDER EMAIL FAILED:",
                                    emailResult
                                );

                                // Payment and order
                                // remain successful.
                            } else {
                                console.log(
                                    "✅ ORDER EMAIL SENT SUCCESSFULLY"
                                );

                                console.log(
                                    "EMAIL ID:",
                                    emailResult.emailId
                                );
                            }
                        } catch (
                            emailError
                            ) {
                            console.error(
                                "❌ ORDER EMAIL ERROR:",
                                emailError
                            );

                            // Payment and order
                            // remain successful.
                        }

                        // ==========================================
                        // CLEAR CART
                        // ==========================================

                        clearCart();

                        // ==========================================
                        // SUCCESS PAGE
                        // ==========================================

                        router.push(
                            `/success?orderId=${order.id}`
                        );
                    } catch (
                        error
                        ) {
                        console.error(
                            "PAYMENT HANDLER ERROR:",
                            error
                        );

                        alert(
                            "Something went wrong after payment. Please contact support."
                        );

                        setProcessing(false);
                    }
                },

                // ==========================================
                // PAYMENT MODAL
                // ==========================================

                modal: {
                    ondismiss: () => {
                        console.log(
                            "Payment cancelled"
                        );

                        setProcessing(false);
                    },
                },
            };

            // ==========================================
            // OPEN RAZORPAY
            // ==========================================

            const paymentObject =
                new window.Razorpay(
                    options
                );

            paymentObject.open();

        } catch (
            error
            ) {
            console.error(
                "CHECKOUT ERROR:",
                error
            );

            alert(
                "Something went wrong while starting payment."
            );

            setProcessing(false);
        }
    };

    // ==========================================
    // UI
    // ==========================================

    return (
        <>
            <Navbar />

            <section className="min-h-screen bg-pink-50 py-20">

                <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 px-8">

                    {/* CUSTOMER DETAILS */}

                    <div className="bg-white rounded-2xl shadow-lg p-8">

                        <h2 className="text-3xl font-bold text-pink-700 mb-6">
                            Checkout
                        </h2>

                        <input
                            type="text"
                            placeholder="Full Name"
                            value={name}
                            onChange={(e) =>
                                setName(
                                    e.target.value
                                )
                            }
                            className="w-full border rounded-lg p-3 mb-4"
                        />

                        <input
                            type="tel"
                            placeholder="Mobile Number"
                            value={phone}
                            onChange={(e) =>
                                setPhone(
                                    e.target.value
                                )
                            }
                            className="w-full border rounded-lg p-3 mb-4"
                        />

                        <input
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) =>
                                setEmail(
                                    e.target.value
                                )
                            }
                            className="w-full border rounded-lg p-3 mb-4"
                        />

                        <textarea
                            placeholder="Full Address"
                            value={address}
                            onChange={(e) =>
                                setAddress(
                                    e.target.value
                                )
                            }
                            className="w-full border rounded-lg p-3 mb-4 h-28"
                        />

                        <input
                            type="text"
                            placeholder="City"
                            value={city}
                            onChange={(e) =>
                                setCity(
                                    e.target.value
                                )
                            }
                            className="w-full border rounded-lg p-3 mb-4"
                        />

                        <input
                            type="text"
                            placeholder="State"
                            value={state}
                            onChange={(e) =>
                                setState(
                                    e.target.value
                                )
                            }
                            className="w-full border rounded-lg p-3 mb-4"
                        />

                        <input
                            type="text"
                            placeholder="Pincode"
                            value={pincode}
                            onChange={(e) =>
                                setPincode(
                                    e.target.value
                                )
                            }
                            className="w-full border rounded-lg p-3"
                        />

                    </div>

                    {/* ORDER SUMMARY */}

                    <div className="bg-white rounded-2xl shadow-lg p-8">

                        <h2 className="text-3xl font-bold text-pink-700 mb-6">
                            Order Summary
                        </h2>

                        {cart.length === 0 ? (
                            <p className="text-gray-500">
                                Your cart is empty.
                            </p>
                        ) : (
                            cart.map(
                                (item) => (
                                    <div
                                        key={
                                            item.id
                                        }
                                        className="flex justify-between mb-4"
                                    >
                                        <span>
                                            {
                                                item.title
                                            }{" "}
                                            ×{" "}
                                            {
                                                item.quantity
                                            }
                                        </span>

                                        <span>
                                            {
                                                item.price
                                            }
                                        </span>
                                    </div>
                                )
                            )
                        )}

                        <hr className="my-6" />

                        <div className="flex justify-between text-2xl font-bold">

                            <span>
                                Total
                            </span>

                            <span>
                                ₹{total}
                            </span>

                        </div>

                        <button
                            type="button"
                            onClick={
                                placeOrder
                            }
                            disabled={
                                processing
                            }
                            className="w-full mt-8 bg-pink-600 text-white py-4 rounded-full hover:bg-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {processing
                                ? "Processing..."
                                : "Proceed to Payment"}
                        </button>

                    </div>

                </div>

            </section>

            <Footer />
        </>
    );
}