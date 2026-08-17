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

    const [pincodeVerified, setPincodeVerified] =
        useState(false);

    const [pincodeLoading, setPincodeLoading] =
        useState(false);

    const [pincodeError, setPincodeError] =
        useState("");

    const [processing, setProcessing] =
        useState(false);

    // ==========================================
    // CART TOTAL
    // ==========================================

    const total = cart.reduce(
        (sum, item) => {
            const price = Number(
                String(item.price)
                    .replace("₹", "")
                    .replace(/,/g, "")
            );

            return sum + price * item.quantity;
        },
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
    // PHONE NUMBER
    // ==========================================

    const handlePhoneChange = (
        value: string
    ) => {
        const cleanValue =
            value
                .replace(/\D/g, "")
                .slice(0, 10);

        setPhone(cleanValue);
    };

    // ==========================================
    // PIN CODE VERIFICATION
    // ==========================================

    const verifyPincode = async (
        value: string
    ) => {
        const cleanPincode =
            value
                .replace(/\D/g, "")
                .slice(0, 6);

        setPincode(cleanPincode);
        setPincodeVerified(false);
        setPincodeError("");
        setCity("");
        setState("");

        if (cleanPincode.length !== 6) {
            return;
        }

        setPincodeLoading(true);

        try {
            const response = await fetch(
                `/api/pincode/${cleanPincode}`,
                {
                    method: "GET",
                    cache: "no-store",
                }
            );

            const data =
                await response.json();

            if (
                !response.ok ||
                !data?.success
            ) {
                setPincodeVerified(false);

                setPincodeError(
                    data?.message ||
                    "Unable to verify PIN code."
                );

                return;
            }

            setCity(data.city || "");
            setState(data.state || "");
            setPincodeVerified(true);
            setPincodeError("");

            console.log(
                "PIN CODE VERIFIED:",
                cleanPincode,
                data.city,
                data.state
            );
        } catch (error) {
            console.error(
                "PIN CODE VERIFICATION ERROR:",
                error
            );

            setPincodeVerified(false);

            setPincodeError(
                "Unable to verify PIN code right now. Please try again."
            );

            setCity("");
            setState("");
        } finally {
            setPincodeLoading(false);
        }
    };

    // ==========================================
    // PLACE ORDER
    // ==========================================

    const placeOrder = async () => {
        if (processing) {
            return;
        }

        // ==========================================
        // CLEAN CUSTOMER DATA
        // ==========================================

        const cleanName =
            name.trim();

        const cleanPhone =
            phone.replace(/\D/g, "");

        const cleanEmail =
            email.trim();

        const cleanAddress =
            address.trim();

        const cleanCity =
            city.trim();

        const cleanState =
            state.trim();

        const cleanPincode =
            pincode.replace(/\D/g, "");

        // ==========================================
        // CUSTOMER VALIDATION
        // ==========================================

        if (cleanName.length < 2) {
            alert(
                "Please enter your full name."
            );
            return;
        }

        if (
            !/^[6-9]\d{9}$/.test(
                cleanPhone
            )
        ) {
            alert(
                "Please enter a valid 10-digit Indian mobile number."
            );
            return;
        }

        if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                cleanEmail
            )
        ) {
            alert(
                "Please enter a valid email address."
            );
            return;
        }

        if (
            cleanAddress.length < 10
        ) {
            alert(
                "Please enter your complete delivery address, including house/flat number and street/locality."
            );
            return;
        }

        const addressWords =
            cleanAddress
                .split(/[\s,]+/)
                .filter(Boolean);

        if (addressWords.length < 3) {
            alert(
                "Please enter a more complete delivery address."
            );
            return;
        }

        if (!pincodeVerified) {
            alert(
                "Please enter and verify a valid PIN code before proceeding."
            );
            return;
        }

        if (cleanCity.length < 2) {
            alert(
                "Please enter your city."
            );
            return;
        }

        if (cleanState.length < 2) {
            alert(
                "Please enter your state."
            );
            return;
        }

        if (
            !/^\d{6}$/.test(
                cleanPincode
            )
        ) {
            alert(
                "Please enter a valid 6-digit PIN code."
            );
            return;
        }

        if (cart.length === 0) {
            alert(
                "Your cart is empty."
            );
            return;
        }

        // ==========================================
        // START PROCESSING
        // ==========================================

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
            // PREPARE CART ITEMS
            // ==========================================

            const orderItems =
                cart.map((item) => ({
                    id: item.id,
                    quantity: item.quantity,

                    // IMPORTANT:
                    // Carry selected variant
                    // into the payment flow.
                    variantId:
                        item.variantId ??
                        undefined,
                }));

            console.log(
                "CHECKOUT ITEMS:",
                orderItems
            );

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

                        body:
                            JSON.stringify({
                                items:
                                orderItems,
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
                    name:
                    cleanName,

                    email:
                    cleanEmail,

                    contact:
                    cleanPhone,
                },

                theme: {
                    color:
                        "#db2777",
                },

                // ==========================================
                // PAYMENT SUCCESS
                // ==========================================

                handler:
                    async (
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
                            // VERIFY PAYMENT
                            // ==========================================

                            console.log(
                                "========== VERIFY PAYMENT =========="
                            );

                            const verifyResponse =
                                await fetch(
                                    "/api/verify-payment",
                                    {
                                        method:
                                            "POST",

                                        headers: {
                                            "Content-Type":
                                                "application/json",
                                        },

                                        body:
                                            JSON.stringify(
                                                {
                                                    razorpay_order_id:
                                                    response.razorpay_order_id,

                                                    razorpay_payment_id:
                                                    response.razorpay_payment_id,

                                                    razorpay_signature:
                                                    response.razorpay_signature,

                                                    customer:
                                                        {
                                                            name:
                                                            cleanName,

                                                            phone:
                                                            cleanPhone,

                                                            email:
                                                            cleanEmail,

                                                            address:
                                                            cleanAddress,

                                                            city:
                                                            cleanCity,

                                                            state:
                                                            cleanState,

                                                            pincode:
                                                            cleanPincode,
                                                        },

                                                    // IMPORTANT:
                                                    // Send variantId
                                                    // to verify-payment.
                                                    items:
                                                        cart.map(
                                                            (
                                                                item
                                                            ) => ({
                                                                id:
                                                                item.id,

                                                                quantity:
                                                                item.quantity,

                                                                variantId:
                                                                    item.variantId ??
                                                                    undefined,
                                                            })
                                                        ),
                                                }
                                            ),
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
                                        method:
                                            "POST",

                                        headers: {
                                            "Content-Type":
                                                "application/json",
                                        },

                                        body:
                                            JSON.stringify(
                                                {
                                                    orderId:
                                                    order.id,

                                                    razorpay_payment_id:
                                                    response.razorpay_payment_id,

                                                    razorpay_signature:
                                                    response.razorpay_signature,
                                                }
                                            ),
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
                                                JSON.stringify(
                                                    {
                                                        orderId:
                                                        order.id,

                                                        email:
                                                        cleanEmail,

                                                        phone:
                                                        cleanPhone,
                                                    }
                                                ),
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
                            }

                            // ==========================================
                            // CLEAR CART
                            // ==========================================

                            clearCart();

                            // ==========================================
                            // SUCCESS PAGE
                            // ==========================================

                            router.push(
                                "/success?orderId=" +
                                order.id
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
                    ondismiss:
                        () => {
                            console.log(
                                "Payment cancelled"
                            );

                            setProcessing(
                                false
                            );
                        },
                },
            };

            // ==========================================
            // OPEN RAZORPAY
            // ==========================================

            console.log(
                "========== OPENING RAZORPAY =========="
            );

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

            <section className="min-h-screen bg-pink-50 py-12 md:py-20">

                <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 md:gap-10 px-4 md:px-8">

                    {/* CUSTOMER DETAILS */}

                    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">

                        <h2 className="text-3xl font-bold text-pink-700 mb-2">
                            Checkout
                        </h2>

                        <p className="text-gray-500 mb-7">
                            Enter your delivery details
                        </p>

                        {/* FULL NAME */}

                        <div className="mb-5">

                            <label className="block text-gray-700 font-semibold mb-2">
                                Full Name
                                <span className="text-pink-600">
                                    {" "}*
                                </span>
                            </label>

                            <input
                                type="text"
                                placeholder="Enter your full name"
                                value={name}
                                onChange={(e) =>
                                    setName(
                                        e.target.value
                                    )
                                }
                                autoComplete="name"
                                className="w-full border-2 border-gray-200 rounded-xl p-4 focus:border-pink-500 focus:outline-none transition"
                            />

                        </div>

                        {/* MOBILE NUMBER */}

                        <div className="mb-5">

                            <label className="block text-gray-700 font-semibold mb-2">
                                Mobile Number
                                <span className="text-pink-600">
                                    {" "}*
                                </span>
                            </label>

                            <input
                                type="tel"
                                inputMode="numeric"
                                maxLength={10}
                                placeholder="10-digit mobile number"
                                value={phone}
                                onChange={(e) =>
                                    handlePhoneChange(
                                        e.target.value
                                    )
                                }
                                autoComplete="tel"
                                className="w-full border-2 border-gray-200 rounded-xl p-4 focus:border-pink-500 focus:outline-none transition"
                            />

                            <p className="text-xs text-gray-500 mt-2">
                                Enter a valid 10-digit Indian mobile number.
                            </p>

                        </div>

                        {/* EMAIL */}

                        <div className="mb-5">

                            <label className="block text-gray-700 font-semibold mb-2">
                                Email Address
                                <span className="text-pink-600">
                                    {" "}*
                                </span>
                            </label>

                            <input
                                type="email"
                                placeholder="Enter your email address"
                                value={email}
                                onChange={(e) =>
                                    setEmail(
                                        e.target.value
                                    )
                                }
                                autoComplete="email"
                                className="w-full border-2 border-gray-200 rounded-xl p-4 focus:border-pink-500 focus:outline-none transition"
                            />

                        </div>

                        {/* FULL ADDRESS */}

                        <div className="mb-5">

                            <label className="block text-gray-700 font-semibold mb-2">
                                Full Delivery Address
                                <span className="text-pink-600">
                                    {" "}*
                                </span>
                            </label>

                            <textarea
                                placeholder="House/Flat No., Street, Area/Locality"
                                value={address}
                                onChange={(e) =>
                                    setAddress(
                                        e.target.value
                                    )
                                }
                                autoComplete="street-address"
                                rows={4}
                                className="w-full border-2 border-gray-200 rounded-xl p-4 focus:border-pink-500 focus:outline-none transition resize-none"
                            />

                            <p className="text-xs text-gray-500 mt-2">
                                Please include your house/flat number, street and area/locality.
                            </p>

                        </div>

                        {/* CITY */}

                        <div className="mb-5">

                            <label className="block text-gray-700 font-semibold mb-2">
                                City
                                <span className="text-pink-600">
                                    {" "}*
                                </span>
                            </label>

                            <input
                                type="text"
                                placeholder="City will be filled automatically"
                                value={city}
                                readOnly
                                autoComplete="address-level2"
                                className="w-full border-2 border-gray-200 rounded-xl p-4 bg-gray-50 text-gray-700 focus:outline-none"
                            />

                        </div>

                        {/* STATE */}

                        <div className="mb-5">

                            <label className="block text-gray-700 font-semibold mb-2">
                                State
                                <span className="text-pink-600">
                                    {" "}*
                                </span>
                            </label>

                            <input
                                type="text"
                                placeholder="State will be filled automatically"
                                value={state}
                                readOnly
                                autoComplete="address-level1"
                                className="w-full border-2 border-gray-200 rounded-xl p-4 bg-gray-50 text-gray-700 focus:outline-none"
                            />

                        </div>

                        {/* PIN CODE */}

                        <div>

                            <label className="block text-gray-700 font-semibold mb-2">
                                PIN Code
                                <span className="text-pink-600">
                                    {" "}*
                                </span>
                            </label>

                            <input
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                placeholder="Enter 6-digit PIN code"
                                value={pincode}
                                onChange={(e) =>
                                    verifyPincode(
                                        e.target.value
                                    )
                                }
                                autoComplete="postal-code"
                                className="w-full border-2 border-gray-200 rounded-xl p-4 focus:border-pink-500 focus:outline-none transition"
                            />

                            {pincodeLoading && (
                                <p className="text-sm text-gray-500 mt-2">
                                    🔄 Verifying PIN code...
                                </p>
                            )}

                            {pincodeVerified &&
                                !pincodeLoading && (
                                    <div className="mt-3 bg-green-50 border border-green-200 rounded-xl p-3">

                                        <p className="text-green-700 font-semibold text-sm">
                                            ✓ PIN Code Verified
                                        </p>

                                        <p className="text-green-600 text-sm mt-1">
                                            {city},{" "}
                                            {state}
                                        </p>

                                    </div>
                                )}

                            {pincodeError && (
                                <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3">

                                    <p className="text-red-600 text-sm">
                                        {pincodeError}
                                    </p>

                                </div>
                            )}

                        </div>

                    </div>

                    {/* ORDER SUMMARY */}

                    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 h-fit">

                        <h2 className="text-3xl font-bold text-pink-700 mb-6">
                            Order Summary
                        </h2>

                        {cart.length === 0 ? (

                            <p className="text-gray-500">
                                Your cart is empty.
                            </p>

                        ) : (

                            <div className="space-y-4">

                                {cart.map(
                                    (item) => (

                                        <div
                                            key={`${item.id}-${item.variantId ?? "product"}`}
                                            className="flex justify-between gap-4 border-b border-gray-100 pb-4"
                                        >

                                            <div className="flex-1">

                                                <p className="font-medium text-gray-800">
                                                    {item.title}
                                                </p>

                                                {(item.size ||
                                                    item.color ||
                                                    item.sku) && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {item.size
                                                            ? `Size: ${item.size}`
                                                            : ""}
                                                        {item.size &&
                                                        item.color
                                                            ? " • "
                                                            : ""}
                                                        {item.color
                                                            ? `Color: ${item.color}`
                                                            : ""}
                                                        {item.sku
                                                            ? ` • SKU: ${item.sku}`
                                                            : ""}
                                                    </p>
                                                )}

                                                <p className="text-sm text-gray-500 mt-1">
                                                    Qty:{" "}
                                                    {item.quantity}
                                                </p>

                                            </div>

                                            <span className="font-semibold text-gray-800 whitespace-nowrap">
                                                ₹
                                                {Number(
                                                        String(
                                                            item.price
                                                        )
                                                            .replace(
                                                                "₹",
                                                                ""
                                                            )
                                                            .replace(
                                                                /,/g,
                                                                ""
                                                            )
                                                    ) *
                                                    item.quantity}
                                            </span>

                                        </div>

                                    )
                                )}

                            </div>

                        )}

                        <hr className="my-6" />

                        <div className="flex justify-between text-2xl font-bold">

                            <span>
                                Total
                            </span>

                            <span className="text-pink-700">
                                ₹
                                {total.toFixed(2)}
                            </span>

                        </div>

                        <div className="mt-5 bg-pink-50 rounded-xl p-4">

                            <p className="text-sm text-gray-600">
                                🔒 Secure payment powered by Razorpay
                            </p>

                        </div>

                        <button
                            type="button"
                            onClick={placeOrder}
                            disabled={
                                processing
                            }
                            className="w-full mt-6 bg-pink-600 text-white py-4 rounded-full font-semibold hover:bg-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
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