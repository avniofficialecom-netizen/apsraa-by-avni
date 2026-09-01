import Link from "next/link";

export default function Footer() {
    return (
        <footer className="bg-gray-900 text-white">

            <div className="max-w-7xl mx-auto px-8 py-16 grid md:grid-cols-4 gap-10">

                {/* Brand */}
                <div>
                    <h2 className="text-3xl font-bold text-pink-500">
                        APSRAA BY AVNI
                    </h2>

                    <p className="mt-4 text-gray-400 leading-7">
                        Premium Artificial Jewellery crafted to make every woman
                        shine with elegance and confidence.
                    </p>
                </div>

                {/* Shop */}
                <div>
                    <h3 className="text-xl font-semibold mb-5">
                        Shop
                    </h3>

                    <ul className="space-y-3 text-gray-400">

                        {/* Necklace Sets */}
                        <li>
                            <Link
                                href={{
                                    pathname: "/shop",
                                    query: { category: "jewellery-sets" },
                                }}
                                className="hover:text-pink-500 transition"
                            >
                                Necklace Sets
                            </Link>
                        </li>

                        {/* Earrings */}
                        <li>
                            <Link
                                href={{
                                    pathname: "/shop",
                                    query: { category: "earrings" },
                                }}
                                className="hover:text-pink-500 transition"
                            >
                                Earrings
                            </Link>
                        </li>

                        {/* Bridal Collection */}
                        <li>
                            <Link
                                href={{
                                    pathname: "/shop",
                                    query: { collection: "best-sellers" },
                                }}
                                className="hover:text-pink-500 transition"
                            >
                                Bridal Collection
                            </Link>
                        </li>

                        {/* Chokers */}
                        <li>
                            <Link
                                href={{
                                    pathname: "/shop",
                                    query: { category: "chokers" },
                                }}
                                className="hover:text-pink-500 transition"
                            >
                                Chokers
                            </Link>
                        </li>

                    </ul>
                </div>

                {/* Customer Care */}
                <div>
                    <h3 className="text-xl font-semibold mb-5">
                        Customer Care
                    </h3>

                    <ul className="space-y-3 text-gray-400">

                        <li>
                            <Link
                                href="/shipping-policy"
                                className="hover:text-pink-500 transition"
                            >
                                Shipping Policy
                            </Link>
                        </li>

                        <li>
                            <Link
                                href="/refund-policy"
                                className="hover:text-pink-500 transition"
                            >
                                Refund & Cancellation Policy
                            </Link>
                        </li>

                        <li>
                            <Link
                                href="/privacy-policy"
                                className="hover:text-pink-500 transition"
                            >
                                Privacy Policy
                            </Link>
                        </li>

                        <li>
                            <Link
                                href="/terms-and-conditions"
                                className="hover:text-pink-500 transition"
                            >
                                Terms & Conditions
                            </Link>
                        </li>

                        <li>
                            <Link
                                href="/contact"
                                className="hover:text-pink-500 transition"
                            >
                                Contact Us
                            </Link>
                        </li>

                    </ul>
                </div>

                {/* Contact */}
                <div>
                    <h3 className="text-xl font-semibold mb-5">
                        Contact
                    </h3>

                    <p className="text-gray-400">
                        📧 support@apsraabyavni.com
                    </p>

                    <p className="mt-3 text-gray-400">
                        📞 +91 75058 08115
                    </p>

                    <p className="mt-3 text-gray-400">
                        📍 India
                    </p>

                </div>

            </div>

            <div className="border-t border-gray-800">

                <div className="max-w-7xl mx-auto py-6 px-8 flex flex-col md:flex-row justify-between items-center">

                    <p className="text-gray-500 text-sm">
                        © 2026 APSRAA BY AVNI. All Rights Reserved.
                    </p>

                    <div className="flex gap-6 mt-4 md:mt-0 text-gray-400">

                        <a
                            href="#"
                            className="cursor-pointer hover:text-pink-500 transition"
                        >
                            Instagram
                        </a>

                        <a
                            href="#"
                            className="cursor-pointer hover:text-pink-500 transition"
                        >
                            Facebook
                        </a>

                        <a
                            href="#"
                            className="cursor-pointer hover:text-pink-500 transition"
                        >
                            WhatsApp
                        </a>

                    </div>

                </div>

            </div>

        </footer>
    );
}