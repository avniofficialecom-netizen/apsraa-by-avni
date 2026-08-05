import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";

export default function RefundPolicy() {
    return (
        <>
            <Navbar />

            <section className="bg-pink-50 min-h-screen py-16">

                <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-xl p-10">

                    <h1 className="text-5xl font-bold text-pink-700 mb-8">
                        Refund & Cancellation Policy
                    </h1>

                    <p className="text-gray-600 mb-8">
                        Last Updated: August 2026
                    </p>

                    <div className="space-y-8 text-gray-700 leading-8">

                        <div>
                            <h2 className="text-2xl font-bold text-pink-700">
                                Order Cancellation
                            </h2>

                            <p className="mt-3">
                                Orders can be cancelled before they are packed or shipped.
                                Once shipped, cancellation requests cannot be accepted.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-pink-700">
                                Refund Policy
                            </h2>

                            <p className="mt-3">
                                Refunds are processed only for damaged, defective,
                                incorrect or missing products after verification.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-pink-700">
                                Return Request
                            </h2>

                            <p className="mt-3">
                                Return requests should be raised within 7 days
                                of receiving the order along with product photos.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-pink-700">
                                Refund Processing Time
                            </h2>

                            <p className="mt-3">
                                Approved refunds are processed within
                                5–7 business days to the original payment method.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-pink-700">
                                Contact Us
                            </h2>

                            <p className="mt-3">
                                For refund or cancellation assistance,
                                please contact our customer support.
                            </p>
                        </div>

                    </div>

                </div>

            </section>

            <Footer />
        </>
    );
}