"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function AdminLoginPage() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);
    const [error, setError] = useState("");

    // ==========================================
    // CHECK EXISTING SESSION
    // ==========================================

    useEffect(() => {
        let mounted = true;

        async function checkSession() {
            try {
                const {
                    data: { session },
                } = await supabase.auth.getSession();

                if (!mounted) return;

                if (session?.user?.email) {
                    const adminEmail =
                        process.env.NEXT_PUBLIC_ADMIN_EMAIL
                            ?.trim()
                            .toLowerCase();

                    const userEmail =
                        session.user.email
                            .trim()
                            .toLowerCase();

                    console.log(
                        "Existing session found:",
                        userEmail
                    );

                    if (
                        adminEmail &&
                        userEmail === adminEmail
                    ) {
                        console.log(
                            "Existing admin session found."
                        );

                        router.replace("/admin");
                        return;
                    }

                    console.log(
                        "Existing session is not admin."
                    );

                    await supabase.auth.signOut();
                }
            } catch (err) {
                console.error(
                    "Session check error:",
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
    // LOGIN
    // ==========================================

    async function handleLogin(
        e: FormEvent<HTMLFormElement>
    ) {
        e.preventDefault();

        setError("");
        setLoading(true);

        const cleanEmail =
            email.trim().toLowerCase();

        try {
            if (!cleanEmail || !password) {
                setError(
                    "Please enter your email and password."
                );
                setLoading(false);
                return;
            }

            const adminEmail =
                process.env.NEXT_PUBLIC_ADMIN_EMAIL
                    ?.trim()
                    .toLowerCase();

            if (!adminEmail) {
                setError(
                    "Admin configuration is missing. Please check NEXT_PUBLIC_ADMIN_EMAIL in Vercel."
                );
                setLoading(false);
                return;
            }

            // ==========================================
            // CHECK EMAIL BEFORE LOGIN
            // ==========================================

            if (cleanEmail !== adminEmail) {
                setError(
                    "This email is not authorized as an admin."
                );
                setLoading(false);
                return;
            }

            // ==========================================
            // SUPABASE LOGIN
            // ==========================================

            const {
                data,
                error: loginError,
            } =
                await supabase.auth.signInWithPassword({
                    email: cleanEmail,
                    password,
                });

            if (loginError) {
                console.error(
                    "Login error:",
                    loginError
                );

                setError(
                    loginError.message ||
                    "Invalid email or password."
                );

                setLoading(false);
                return;
            }

            if (!data.user) {
                setError(
                    "Login failed. No user was returned."
                );

                setLoading(false);
                return;
            }

            console.log(
                "Admin login successful:",
                data.user.email
            );

            // ==========================================
            // VERIFY SESSION
            // ==========================================

            const {
                data: sessionData,
            } =
                await supabase.auth.getSession();

            if (!sessionData.session) {
                console.error(
                    "No Supabase session after login."
                );

                setError(
                    "Login succeeded but the session was not created. Please try again."
                );

                setLoading(false);
                return;
            }

            console.log(
                "Supabase session confirmed."
            );

            // ==========================================
            // REDIRECT
            // ==========================================

            router.replace("/admin");
        } catch (err) {
            console.error(
                "Unexpected login error:",
                err
            );

            setError(
                "Something went wrong while logging in."
            );

            setLoading(false);
        }
    }

    // ==========================================
    // SESSION CHECK SCREEN
    // ==========================================

    if (checkingSession) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-pink-50 to-white flex items-center justify-center px-5">

                <div className="bg-white rounded-3xl shadow-2xl p-10 text-center">

                    <div className="text-5xl mb-5">
                        🔐
                    </div>

                    <p className="text-xl font-semibold text-pink-700">
                        Checking admin session...
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

                    <div className="text-center mb-8">

                        <div className="text-6xl mb-4">
                            🔐
                        </div>

                        <h1 className="text-4xl font-bold text-pink-700">
                            Admin Login
                        </h1>

                        <p className="text-gray-500 mt-3">
                            APSRAA BY AVNI
                        </p>

                    </div>

                    {error && (
                        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    <form
                        onSubmit={handleLogin}
                        className="space-y-6"
                    >

                        <div>

                            <label
                                htmlFor="email"
                                className="block text-gray-700 font-semibold mb-2"
                            >
                                Email
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
                                placeholder="Admin email"
                                autoComplete="email"
                                required
                                disabled={loading}
                                className="w-full border-2 border-gray-200 rounded-xl px-4 py-4 text-gray-800 focus:border-pink-500 focus:outline-none transition disabled:bg-gray-100"
                            />

                        </div>

                        <div>

                            <label
                                htmlFor="password"
                                className="block text-gray-700 font-semibold mb-2"
                            >
                                Password
                            </label>

                            <div className="relative">

                                <input
                                    id="password"
                                    type={
                                        showPassword
                                            ? "text"
                                            : "password"
                                    }
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Admin password"
                                    autoComplete="current-password"
                                    required
                                    disabled={loading}
                                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-4 pr-14 text-gray-800 focus:border-pink-500 focus:outline-none transition disabled:bg-gray-100"
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(
                                            !showPassword
                                        )
                                    }
                                    disabled={loading}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xl"
                                >
                                    {showPassword
                                        ? "🙈"
                                        : "👁️"}
                                </button>

                            </div>

                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-pink-600 hover:bg-pink-700 disabled:bg-pink-300 text-white py-4 rounded-xl font-bold text-lg transition"
                        >
                            {loading
                                ? "Logging in..."
                                : "Login"}
                        </button>

                    </form>

                </div>

            </div>

        </main>
    );
}