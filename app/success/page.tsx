"use client";

import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function SuccessPage() {
    return (
        <>
            <Navbar />

            <section className="min-h-screen bg-pink-50 flex items-center justify-center px-6">

                <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-xl w-full text-center">

                    <div className="text-7xl mb-6">
                        🎉
                    </div>

                    <h1 className="text-4xl font-bold text-pink-700 mb-4">
                        Order Placed Successfully!
                    </h1>

                    <p className="text-gray-600 text-lg mb-8">
                        Thank you for shopping with
                        <br />
                        <span className="font-bold text-pink-600">
                            APSRAA BY AVNI
                        </span>
                    </p>

                    <div className="bg-pink-100 rounded-xl p-5 mb-8">

                        <p className="text-gray-700">
                            Your order has been received.
                        </p>

                        <p className="text-gray-700 mt-2">
                            Our team will contact you shortly to confirm your order.
                        </p>

                    </div>

                    <div className="flex flex-col gap-4">

                        <Link
                            href="/shop"
                            className="bg-pink-600 text-white py-4 rounded-full font-semibold hover:bg-pink-700 transition"
                        >
                            Continue Shopping
                        </Link>

                        <Link
                            href="/"
                            className="border-2 border-pink-600 text-pink-600 py-4 rounded-full font-semibold hover:bg-pink-50 transition"
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