import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";

export default function TermsPage() {
    return (
        <>
            <Navbar />

            <section className="bg-pink-50 min-h-screen py-16">

                <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-xl p-10">

                    <h1 className="text-5xl font-bold text-pink-700 mb-8">
                        Terms & Conditions
                    </h1>

                    <p className="text-gray-600 mb-8">
                        Last Updated: August 2026
                    </p>

                    <div className="space-y-8 text-gray-700 leading-8">

                        <div>
                            <h2 className="text-2xl font-bold text-pink-700">
                                Acceptance of Terms
                            </h2>

                            <p className="mt-3">
                                By using our website and placing an order,
                                you agree to these Terms & Conditions.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-pink-700">
                                Product Information
                            </h2>

                            <p className="mt-3">
                                We strive to display product images, descriptions,
                                prices and specifications accurately. Minor colour
                                variations may occur due to screen settings.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-pink-700">
                                Pricing
                            </h2>

                            <p className="mt-3">
                                All prices are displayed in Indian Rupees (INR)
                                and are subject to change without prior notice.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-pink-700">
                                Orders
                            </h2>

                            <p className="mt-3">
                                We reserve the right to accept, reject or cancel
                                any order in case of pricing errors, stock
                                unavailability or suspected fraudulent activity.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-pink-700">
                                Intellectual Property
                            </h2>

                            <p className="mt-3">
                                All content including images, logos, product
                                photographs and text belongs to APSRAA BY AVNI
                                and may not be copied without permission.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-pink-700">
                                Contact
                            </h2>

                            <p className="mt-3">
                                For any questions regarding these terms,
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