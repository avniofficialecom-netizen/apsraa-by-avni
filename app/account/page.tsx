"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { supabase } from "../../lib/supabase";

export default function AccountPage() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        async function loadAccount() {
            try {
                const {
                    data: { session },
                } = await supabase.auth.getSession();

                if (!mounted) return;

                if (!session?.user) {
                    router.replace("/login");
                    return;
                }

                setEmail(
                    session.user.email || ""
                );
            } catch (error) {
                console.error(
                    "Account session error:",
                    error
                );

                router.replace("/login");
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        }

        loadAccount();

        return () => {
            mounted = false;
        };
    }, [router]);

    async function logout() {
        await supabase.auth.signOut();
        router.replace("/login");
    }

    if (loading) {
        return (
            <main className="min-h-screen bg-pink-50 flex items-center justify-center">
                <div className="bg-white rounded-3xl shadow-xl p-10 text-center">
                    <div className="text-5xl mb-4">
                        👤
                    </div>

                    <p className="text-xl font-semibold text-pink-700">
                        Loading your account...
                    </p>
                </div>
            </main>
        );
    }

    return (
        <>
            <Navbar />

            <main className="min-h-screen bg-pink-50 py-12 md:py-20 px-5">

                <div className="max-w-5xl mx-auto">

                    {/* HEADER */}

                    <div className="text-center mb-10">

                        <div className="text-6xl mb-4">
                            💎
                        </div>

                        <h1 className="text-4xl md:text-5xl font-bold text-pink-700">
                            My Account
                        </h1>

                        <p className="text-gray-500 mt-3">
                            Welcome to APSRAA BY AVNI
                        </p>

                    </div>

                    {/* ACCOUNT CARD */}

                    <div className="grid md:grid-cols-2 gap-6">

                        <div className="bg-white rounded-3xl shadow-lg p-7">

                            <h2 className="text-2xl font-bold text-pink-700 mb-5">
                                Account Details
                            </h2>

                            <div className="bg-pink-50 rounded-2xl p-5">

                                <p className="text-sm text-gray-500 mb-1">
                                    Email Address
                                </p>

                                <p className="font-semibold text-gray-800 break-all">
                                    {email}
                                </p>

                            </div>

                        </div>

                        {/* ORDERS */}

                        <div className="bg-white rounded-3xl shadow-lg p-7">

                            <h2 className="text-2xl font-bold text-pink-700 mb-5">
                                My Orders
                            </h2>

                            <p className="text-gray-500 mb-6">
                                View and track your APSRAA BY AVNI orders.
                            </p>

                            <button
                                type="button"
                                onClick={() =>
                                    router.push(
                                        "/track-order"
                                    )
                                }
                                className="w-full bg-pink-600 hover:bg-pink-700 text-white py-3 rounded-xl font-semibold transition"
                            >
                                📦 Track My Orders
                            </button>

                        </div>

                    </div>

                    {/* SHOP */}

                    <div className="bg-white rounded-3xl shadow-lg p-7 mt-6 text-center">

                        <h2 className="text-2xl font-bold text-pink-700 mb-3">
                            Continue Shopping
                        </h2>

                        <p className="text-gray-500 mb-6">
                            Discover the latest APSRAA BY AVNI collections.
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                router.push("/shop")
                            }
                            className="bg-pink-600 hover:bg-pink-700 text-white px-8 py-3 rounded-full font-semibold transition"
                        >
                            Shop Now
                        </button>

                    </div>

                    {/* LOGOUT */}

                    <div className="text-center mt-8">

                        <button
                            type="button"
                            onClick={logout}
                            className="border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white px-8 py-3 rounded-full font-semibold transition"
                        >
                            Logout
                        </button>

                    </div>

                </div>

            </main>

            <Footer />
        </>
    );
}