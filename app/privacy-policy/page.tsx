import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function PrivacyPolicy() {
    return (
        <>
            <Navbar />

            <section className="bg-pink-50 min-h-screen py-16">

                <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-xl p-10">

                    <h1 className="text-5xl font-bold text-pink-700 mb-8">
                        Privacy Policy
                    </h1>

                    <p className="text-gray-600 mb-8">
                        Last Updated: August 2026
                    </p>

                    <div className="space-y-8 text-gray-700 leading-8">

                        <div>
                            <h2 className="text-2xl font-bold text-pink-700">
                                Information We Collect
                            </h2>

                            <p className="mt-3">
                                We collect your name, phone number, email address,
                                shipping address and payment information only to
                                process your orders and provide customer support.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-pink-700">
                                How We Use Your Information
                            </h2>

                            <p className="mt-3">
                                Your information is used to process orders,
                                deliver products, provide customer service and
                                improve our shopping experience.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-pink-700">
                                Payment Security
                            </h2>

                            <p className="mt-3">
                                All online payments are processed securely through
                                Razorpay. We never store your card or banking details.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-pink-700">
                                Data Protection
                            </h2>

                            <p className="mt-3">
                                We do not sell, rent or share your personal
                                information with third parties except where
                                necessary to complete your order.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-pink-700">
                                Contact Us
                            </h2>

                            <p className="mt-3">
                                APSRAA BY AVNI
                                <br />
                                Email: support@apsraabyavni.com
                                <br />
                                Phone: +91-XXXXXXXXXX
                            </p>
                        </div>

                    </div>

                </div>

            </section>

            <Footer />
        </>
    );
}