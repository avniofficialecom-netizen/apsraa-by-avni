import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function ShippingPolicy() {
    return (
        <>
            <Navbar />

            <section className="bg-pink-50 min-h-screen py-16">

                <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-xl p-10">

                    <h1 className="text-5xl font-bold text-pink-700 mb-8">
                        Shipping Policy
                    </h1>

                    <p className="text-gray-600 mb-8">
                        Last Updated: August 2026
                    </p>

                    <div className="space-y-8 text-gray-700 leading-8">

                        <div>
                            <h2 className="text-2xl font-bold text-pink-700">
                                Order Processing
                            </h2>

                            <p className="mt-3">
                                Orders are processed within 1–2 business days
                                after successful payment confirmation.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-pink-700">
                                Delivery Time
                            </h2>

                            <p className="mt-3">
                                Most orders are delivered within
                                3–7 business days depending on your location.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-pink-700">
                                Shipping Charges
                            </h2>

                            <p className="mt-3">
                                Shipping charges, if applicable, are displayed
                                during checkout before payment.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-pink-700">
                                Order Tracking
                            </h2>

                            <p className="mt-3">
                                Customers will receive shipping updates once
                                the order has been dispatched.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-pink-700">
                                Delivery Delays
                            </h2>

                            <p className="mt-3">
                                Delivery may be delayed due to weather,
                                public holidays or courier-related issues.
                            </p>
                        </div>

                    </div>

                </div>

            </section>

            <Footer />
        </>
    );
}