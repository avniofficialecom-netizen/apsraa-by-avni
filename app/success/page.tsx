"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

function SuccessContent() {
    const searchParams = useSearchParams();

    const orderId = searchParams.get("orderId");

    const paymentMethod =
        (
            searchParams.get("paymentMethod") ||
            ""
        ).toLowerCase();

    const isCOD =
        paymentMethod === "cod" ||
        paymentMethod === "cash_on_delivery" ||
        paymentMethod === "cashondelivery";

    return (
        <>
            <Navbar />

            <main className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-pink-50 px-4 py-12 md:py-20">

                <div className="max-w-2xl mx-auto">

                    {/* SUCCESS CARD */}

                    <div className="bg-white rounded-3xl shadow-xl border border-pink-100 overflow-hidden">

                        {/* TOP SUCCESS AREA */}

                        <div className="text-center px-6 md:px-10 pt-10 md:pt-14">

                            {/* Success Icon */}

                            <div
                                className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center text-5xl mb-6 ${
                                    isCOD
                                        ? "bg-yellow-100"
                                        : "bg-green-100"
                                }`}
                            >
                                {isCOD ? "📦" : "✓"}
                            </div>

                            {/* Heading */}

                            <h1 className="text-3xl md:text-4xl font-bold text-pink-700">
                                Order Placed Successfully!
                            </h1>

                            <p className="text-gray-600 text-base md:text-lg mt-4 leading-relaxed">
                                Thank you for shopping with
                                <br />

                                <span className="font-bold text-pink-600">
                                    APSRAA BY AVNI
                                </span>
                            </p>

                        </div>


                        {/* ORDER INFORMATION */}

                        {orderId ? (

                            <div className="px-6 md:px-10 mt-8">

                                <div className="bg-pink-50 border border-pink-100 rounded-2xl p-5 md:p-6">

                                    <div className="text-center">

                                        <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold">
                                            Your Order Number
                                        </p>

                                        <p className="text-3xl md:text-4xl font-bold text-pink-700 mt-2">
                                            #{orderId}
                                        </p>

                                    </div>

                                    <div className="border-t border-pink-200 my-5" />

                                    {/* PAYMENT STATUS */}

                                    <div className="flex items-center gap-3">

                                        <div
                                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                                isCOD
                                                    ? "bg-yellow-100"
                                                    : "bg-green-100"
                                            }`}
                                        >
                                            {isCOD ? "₹" : "✓"}
                                        </div>

                                        <div>

                                            {isCOD ? (
                                                <>
                                                    <p className="font-semibold text-gray-800">
                                                        Payment Pending
                                                    </p>

                                                    <p className="text-sm text-gray-500">
                                                        Cash on Delivery selected. You will pay when your order is delivered.
                                                    </p>
                                                </>
                                            ) : (
                                                <>
                                                    <p className="font-semibold text-gray-800">
                                                        Payment Successful
                                                    </p>

                                                    <p className="text-sm text-gray-500">
                                                        Your payment has been received and your order has been created.
                                                    </p>
                                                </>
                                            )}

                                        </div>

                                    </div>

                                </div>

                            </div>

                        ) : (

                            <div className="px-6 md:px-10 mt-8">

                                <div className="bg-pink-50 border border-pink-100 rounded-2xl p-5 text-center">

                                    <p className="text-gray-700 font-medium">
                                        Your order has been received successfully.
                                    </p>

                                    <p className="text-sm text-gray-500 mt-2">
                                        Please keep your order number available for tracking.
                                    </p>

                                </div>

                            </div>

                        )}


                        {/* WHAT HAPPENS NEXT */}

                        <div className="px-6 md:px-10 mt-8">

                            <h2 className="text-lg font-bold text-gray-800 mb-4">
                                What happens next?
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

                                <div className="bg-gray-50 rounded-2xl p-4 text-center">

                                    <div className="text-2xl mb-2">
                                        📦
                                    </div>

                                    <p className="font-semibold text-gray-800 text-sm">
                                        Order Confirmed
                                    </p>

                                    <p className="text-xs text-gray-500 mt-1">
                                        Your order is being prepared.
                                    </p>

                                </div>


                                <div className="bg-gray-50 rounded-2xl p-4 text-center">

                                    <div className="text-2xl mb-2">
                                        🚚
                                    </div>

                                    <p className="font-semibold text-gray-800 text-sm">
                                        Shipped
                                    </p>

                                    <p className="text-xs text-gray-500 mt-1">
                                        We will dispatch your order.
                                    </p>

                                </div>


                                <div className="bg-gray-50 rounded-2xl p-4 text-center">

                                    <div className="text-2xl mb-2">
                                        🏠
                                    </div>

                                    <p className="font-semibold text-gray-800 text-sm">
                                        Delivered
                                    </p>

                                    <p className="text-xs text-gray-500 mt-1">
                                        Enjoy your APSRAA jewellery.
                                    </p>

                                </div>

                            </div>

                        </div>


                        {/* ACTION BUTTONS */}

                        <div className="px-6 md:px-10 mt-8 pb-10 md:pb-12">

                            <div className="flex flex-col gap-3">

                                {orderId && (
                                    <Link
                                        href={`/order/${orderId}`}
                                        className="w-full text-center bg-pink-600 text-white py-4 rounded-full font-semibold hover:bg-pink-700 transition shadow-md"
                                    >
                                        📦 View Your Order
                                    </Link>
                                )}

                                <Link
                                    href="/track-order"
                                    className="w-full text-center border-2 border-pink-600 text-pink-600 py-4 rounded-full font-semibold hover:bg-pink-50 transition"
                                >
                                    🔍 Track Your Order
                                </Link>

                                <Link
                                    href="/shop"
                                    className="w-full text-center border border-gray-300 text-gray-700 py-4 rounded-full font-semibold hover:bg-gray-50 transition"
                                >
                                    🛍️ Continue Shopping
                                </Link>

                                <Link
                                    href="/"
                                    className="text-center text-pink-600 py-2 font-semibold hover:underline transition"
                                >
                                    Back to Home
                                </Link>

                            </div>

                        </div>

                    </div>


                    {/* SECURITY / PAYMENT MESSAGE */}

                    <div className="text-center mt-6 px-4">

                        {isCOD ? (
                            <p className="text-sm text-gray-500">
                                📦 Cash on Delivery — Please pay when your order is delivered.
                            </p>
                        ) : (
                            <p className="text-sm text-gray-500">
                                🔒 Your payment was processed securely by Razorpay.
                            </p>
                        )}

                        <p className="text-xs text-gray-400 mt-2">
                            Please keep your order number for future reference.
                        </p>

                    </div>

                </div>

            </main>

            <Footer />
        </>
    );
}


export default function SuccessPage() {

    return (
        <Suspense
            fallback={
                <>
                    <Navbar />

                    <main className="min-h-screen bg-pink-50 flex items-center justify-center px-5">

                        <div className="bg-white rounded-3xl shadow-xl p-10 text-center max-w-md w-full">

                            <div className="text-6xl mb-5">
                                🎉
                            </div>

                            <h1 className="text-2xl font-bold text-pink-700">
                                Processing Your Order
                            </h1>

                            <p className="text-gray-500 mt-3">
                                Please wait while we load your order confirmation.
                            </p>

                        </div>

                    </main>

                    <Footer />
                </>
            }
        >
            <SuccessContent />
        </Suspense>
    );
}