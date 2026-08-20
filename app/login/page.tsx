"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function CustomerLoginPage() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");

    const [otpSent, setOtpSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);

    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    // ==========================================
    // CHECK EXISTING CUSTOMER SESSION
    // ==========================================

    useEffect(() => {
        let mounted = true;

        async function checkSession() {
            try {
                const {
                    data: { session },
                } = await supabase.auth.getSession();

                if (!mounted) return;

                if (session?.user) {
                    router.replace("/account");
                    return;
                }
            } catch (err) {
                console.error(
                    "Customer session check error:",
                    err
                );
            } finally {
                if (mounted) {
                    setCheckingSession(false);
                }
            }
        }

        checkSession();

        return () => {
            mounted = false;
        };
    }, [router]);

    // ==========================================
    // SEND OTP
    // ==========================================

    async function sendOtp(
        e: FormEvent<HTMLFormElement>
    ) {
        e.preventDefault();

        setError("");
        setMessage("");

        const cleanEmail =
            email.trim().toLowerCase();

        if (!cleanEmail) {
            setError(
                "Please enter your email address."
            );
            return;
        }

        if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                cleanEmail
            )
        ) {
            setError(
                "Please enter a valid email address."
            );
            return;
        }

        setLoading(true);

        try {
            const {
                error: otpError,
            } = await supabase.auth.signInWithOtp({
                email: cleanEmail,

                options: {
                    shouldCreateUser: true,
                },
            });

            if (otpError) {
                console.error(
                    "Send OTP error:",
                    otpError
                );

                setError(
                    otpError.message ||
                    "Unable to send OTP. Please try again."
                );

                return;
            }

            setEmail(cleanEmail);
            setOtpSent(true);

            setMessage(
                "OTP sent successfully. Please check your email."
            );
        } catch (err) {
            console.error(
                "Unexpected OTP error:",
                err
            );

            setError(
                "Something went wrong while sending the OTP."
            );
        } finally {
            setLoading(false);
        }
    }

    // ==========================================
    // VERIFY OTP
    // ==========================================

    async function verifyOtp(
        e: FormEvent<HTMLFormElement>
    ) {
        e.preventDefault();

        setError("");
        setMessage("");

        const cleanEmail =
            email.trim().toLowerCase();

        const cleanOtp =
            otp.replace(/\D/g, "");

        if (cleanOtp.length !== 6) {
            setError(
                "Please enter the 6-digit OTP."
            );
            return;
        }

        setLoading(true);

        try {
            const {
                data,
                error: verifyError,
            } = await supabase.auth.verifyOtp({
                email: cleanEmail,
                token: cleanOtp,
                type: "email",
            });

            if (verifyError) {
                console.error(
                    "OTP verification error:",
                    verifyError
                );

                setError(
                    verifyError.message ||
                    "Invalid or expired OTP."
                );

                return;
            }

            if (!data.user || !data.session) {
                setError(
                    "OTP verified, but login session was not created. Please try again."
                );

                return;
            }

            console.log(
                "Customer login successful:",
                data.user.email
            );

            setMessage(
                "Login successful! Redirecting..."
            );

            router.replace("/account");
        } catch (err) {
            console.error(
                "Unexpected verification error:",
                err
            );

            setError(
                "Something went wrong while verifying the OTP."
            );
        } finally {
            setLoading(false);
        }
    }

    // ==========================================
    // CHANGE EMAIL
    // ==========================================

    function changeEmail() {
        setOtpSent(false);
        setOtp("");
        setError("");
        setMessage("");
    }

    // ==========================================
    // SESSION CHECK
    // ==========================================

    if (checkingSession) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-pink-50 to-white flex items-center justify-center px-5">

                <div className="bg-white rounded-3xl shadow-2xl p-10 text-center">

                    <div className="text-5xl mb-5">
                        👤
                    </div>

                    <p className="text-xl font-semibold text-pink-700">
                        Checking your account...
                    </p>

                </div>

            </main>
        );
    }

    // ==========================================
    // LOGIN PAGE
    // ==========================================

    return (
        <main className="min-h-screen bg-gradient-to-br from-pink-50 to-white flex items-center justify-center px-5 py-10">

            <div className="w-full max-w-md">

                <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10">

                    {/* HEADER */}

                    <div className="text-center mb-8">

                        <div className="text-6xl mb-4">
                            💎
                        </div>

                        <h1 className="text-4xl font-bold text-pink-700">
                            Customer Login
                        </h1>

                        <p className="text-gray-500 mt-3">
                            APSRAA BY AVNI
                        </p>

                    </div>

                    {/* ERROR */}

                    {error && (
                        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    {/* SUCCESS MESSAGE */}

                    {message && (
                        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-4 text-green-700 text-sm">
                            {message}
                        </div>
                    )}

                    {!otpSent ? (

                        /* ==========================================
                           EMAIL FORM
                           ========================================== */

                        <form
                            onSubmit={sendOtp}
                            className="space-y-6"
                        >

                            <div>

                                <label
                                    htmlFor="email"
                                    className="block text-gray-700 font-semibold mb-2"
                                >
                                    Email Address
                                </label>

                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) =>
                                        setEmail(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Enter your email"
                                    autoComplete="email"
                                    required
                                    disabled={loading}
                                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-4 text-gray-800 focus:border-pink-500 focus:outline-none transition disabled:bg-gray-100"
                                />

                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-pink-600 hover:bg-pink-700 disabled:bg-pink-300 text-white py-4 rounded-xl font-bold text-lg transition"
                            >
                                {loading
                                    ? "Sending OTP..."
                                    : "Send OTP"}
                            </button>

                        </form>

                    ) : (

                        /* ==========================================
                           OTP FORM
                           ========================================== */

                        <form
                            onSubmit={verifyOtp}
                            className="space-y-6"
                        >

                            <div className="text-center">

                                <p className="text-gray-600">
                                    We sent a 6-digit OTP to
                                </p>

                                <p className="font-semibold text-gray-800 mt-1 break-all">
                                    {email}
                                </p>

                            </div>

                            <div>

                                <label
                                    htmlFor="otp"
                                    className="block text-gray-700 font-semibold mb-2"
                                >
                                    Enter OTP
                                </label>

                                <input
                                    id="otp"
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) =>
                                        setOtp(
                                            e.target.value
                                                .replace(
                                                    /\D/g,
                                                    ""
                                                )
                                                .slice(
                                                    0,
                                                    6
                                                )
                                        )
                                    }
                                    placeholder="Enter 6-digit OTP"
                                    required
                                    disabled={loading}
                                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-4 text-center text-2xl tracking-[0.5em] text-gray-800 focus:border-pink-500 focus:outline-none transition disabled:bg-gray-100"
                                />

                            </div>

                            <button
                                type="submit"
                                disabled={
                                    loading ||
                                    otp.length !== 6
                                }
                                className="w-full bg-pink-600 hover:bg-pink-700 disabled:bg-pink-300 text-white py-4 rounded-xl font-bold text-lg transition"
                            >
                                {loading
                                    ? "Verifying..."
                                    : "Verify & Login"}
                            </button>

                            <button
                                type="button"
                                onClick={changeEmail}
                                disabled={loading}
                                className="w-full border-2 border-pink-200 text-pink-700 py-3 rounded-xl font-semibold hover:bg-pink-50 transition"
                            >
                                Change Email
                            </button>

                        </form>

                    )}

                    {/* FOOTER */}

                    <div className="text-center mt-8">

                        <p className="text-sm text-gray-500">
                            New customer? No problem.
                        </p>

                        <p className="text-sm text-gray-500 mt-1">
                            Your account will be created automatically after verification.
                        </p>

                    </div>

                </div>

            </div>

        </main>
    );
}