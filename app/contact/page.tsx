import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function Contact() {
    return (
        <>
            <Navbar />

            <section className="bg-pink-50 min-h-screen py-16">

                <div className="max-w-5xl mx-auto px-6">

                    <div className="bg-white rounded-3xl shadow-xl p-10 md:p-14">

                        <h1 className="text-5xl font-bold text-pink-700">
                            Contact Us
                        </h1>

                        <p className="mt-4 text-gray-600 text-lg">
                            We're here to help. If you have any questions
                            about our products, orders, shipping or returns,
                            please contact us.
                        </p>

                        <div className="grid md:grid-cols-2 gap-8 mt-12">

                            {/* Email */}
                            <div className="bg-pink-50 rounded-3xl p-8">
                                <div className="text-4xl">
                                    📧
                                </div>

                                <h2 className="text-2xl font-bold text-pink-700 mt-4">
                                    Email Support
                                </h2>

                                <p className="text-gray-600 mt-3">
                                    For questions and customer support:
                                </p>

                                <a
                                    href="mailto:support@apsraabyavni.com"
                                    className="inline-block mt-3 text-pink-600 font-semibold hover:underline"
                                >
                                    support@apsraabyavni.com
                                </a>
                            </div>

                            {/* Phone */}
                            <div className="bg-pink-50 rounded-3xl p-8">
                                <div className="text-4xl">
                                    📞
                                </div>

                                <h2 className="text-2xl font-bold text-pink-700 mt-4">
                                    Phone Support
                                </h2>

                                <p className="text-gray-600 mt-3">
                                    For order and customer-support assistance:
                                </p>

                                <a
                                    href="tel:+917505808115"
                                    className="inline-block mt-3 text-pink-600 font-semibold hover:underline"
                                >
                                    +91 75058 08115
                                </a>
                            </div>

                        </div>

                        {/* Business Information */}
                        <div className="mt-10 border-t pt-10">

                            <h2 className="text-2xl font-bold text-pink-700">
                                Business Information
                            </h2>

                            <div className="mt-5 space-y-3 text-gray-700">

                                <p>
                                    <strong>Business Name:</strong>{" "}
                                    APSRAA BY AVNI
                                </p>

                                <p>
                                    <strong>Country:</strong>{" "}
                                    India
                                </p>

                                <p>
                                    <strong>Email:</strong>{" "}
                                    support@apsraabyavni.com
                                </p>

                                <p>
                                    <strong>Phone:</strong>{" "}
                                    +91 75058 08115
                                </p>

                            </div>

                        </div>

                        {/* Customer Support */}
                        <div className="mt-10 bg-pink-50 rounded-3xl p-8">

                            <h2 className="text-2xl font-bold text-pink-700">
                                Customer Support
                            </h2>

                            <p className="mt-3 text-gray-600 leading-7">
                                Please contact us for assistance with your
                                orders, product information, shipping,
                                cancellations and eligible returns or refunds.
                            </p>

                        </div>

                    </div>

                </div>

            </section>

            <Footer />
        </>
    );
}