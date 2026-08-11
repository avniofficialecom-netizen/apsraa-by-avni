"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

function SuccessContent() {
    const searchParams =
        useSearchParams();

    const orderId =
        searchParams.get("orderId");

    return (
        <>
            <Navbar />

            <section className="min-h-screen bg-pink-50 flex items-center justify-center px-6 py-20">

                <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-xl w-full text-center">

                    {/* Success Icon */}

                    <div className="text-7xl mb-6">
                        🎉
                    </div>

                    {/* Heading */}

                    <h1 className="text-4xl font-bold text-pink-700 mb-4">
                        Order Placed Successfully!
                    </h1>

                    {/* Message */}

                    <p className="text-gray-600 text-lg mb-8">
                        Thank you for shopping with
                        <br />

                        <span className="font-bold text-pink-600">
                            APSRAA BY AVNI
                        </span>
                    </p>

                    {/* Order Information */}

                    {orderId ? (
                        <div className="bg-pink-100 rounded-xl p-6 mb-8 text-left">

                            <div className="flex justify-between items-center">

                                <span className="text-gray-600">
                                    Order Number
                                </span>

                                <span className="font-bold text-pink-700 text-lg">
                                    #{orderId}
                                </span>

                            </div>

                            <p className="text-gray-600 text-sm mt-4">
                                Your payment was successfully
                                processed and your order has
                                been received.
                            </p>

                        </div>
                    ) : (
                        <div className="bg-pink-100 rounded-xl p-5 mb-8">

                            <p className="text-gray-700">
                                Your order has been received.
                            </p>

                            <p className="text-gray-700 mt-2">
                                Our team will contact you
                                shortly to confirm your order.
                            </p>

                        </div>
                    )}

                    {/* Buttons */}

                    <div className="flex flex-col gap-4">

                        {orderId && (
                            <Link
                                href={`/order/${orderId}`}
                                className="bg-pink-600 text-white py-4 rounded-full font-semibold hover:bg-pink-700 transition"
                            >
                                📦 View Your Order
                            </Link>
                        )}

                        <Link
                            href="/shop"
                            className="border-2 border-pink-600 text-pink-600 py-4 rounded-full font-semibold hover:bg-pink-50 transition"
                        >
                            Continue Shopping
                        </Link>

                        <Link
                            href="/"
                            className="text-pink-600 py-3 font-semibold hover:underline transition"
                        >
                            Back to Home
                        </Link>

                    </div>

                </div>

            </section>

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

                    <section className="min-h-screen bg-pink-50 flex items-center justify-center px-6">

                        <div className="bg-white rounded-3xl shadow-xl p-10 text-center">

                            <div className="text-6xl mb-5">
                                🎉
                            </div>

                            <p className="text-xl text-gray-600">
                                Loading your order...
                            </p>

                        </div>

                    </section>

                    <Footer />
                </>
            }
        >
            <SuccessContent />
        </Suspense>
    );
}