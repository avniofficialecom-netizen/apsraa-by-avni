"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function AdminLogin() {
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
        checkExistingSession();
    }, []);

    async function checkExistingSession() {
        try {
            const {
                data: { session },
                error,
            } = await supabase.auth.getSession();

            if (error) {
                console.error(
                    "Session check error:",
                    error
                );

                setCheckingSession(false);
                return;
            }

            if (session) {
                console.log(
                    "✅ Existing session found:",
                    session.user.email
                );

                // Force browser navigation.
                window.location.href = "/admin";
                return;
            }
        } catch (error) {
            console.error(
                "Session check exception:",
                error
            );
        } finally {
            setCheckingSession(false);
        }
    }

    // ==========================================
    // LOGIN
    // ==========================================

    async function login() {
        setError("");

        const cleanEmail = email.trim().toLowerCase();

        if (!cleanEmail || !password) {
            setError(
                "Please enter your email and password."
            );
            return;
        }

        setLoading(true);

        try {
            console.log(
                "================================"
            );
            console.log("ADMIN LOGIN START");
            console.log(
                "EMAIL:",
                cleanEmail
            );
            console.log(
                "================================"
            );

            // ==================================
            // SUPABASE LOGIN
            // ==================================

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
                    "❌ Supabase login error:",
                    loginError
                );

                setError(loginError.message);
                setLoading(false);
                return;
            }

            if (!data.user) {
                console.error(
                    "❌ Login succeeded but user is missing."
                );

                setError(
                    "Login failed. User information was not returned."
                );

                setLoading(false);
                return;
            }

            if (!data.session) {
                console.error(
                    "❌ Login succeeded but session is missing."
                );

                setError(
                    "Login failed. No active session was created."
                );

                setLoading(false);
                return;
            }

            console.log(
                "✅ Supabase login successful"
            );

            console.log(
                "USER:",
                data.user.email
            );

            console.log(
                "SESSION EXISTS:",
                !!data.session
            );

            // ==================================
            // VERIFY ADMIN EMAIL
            // ==================================

            const adminEmail =
                process.env.NEXT_PUBLIC_ADMIN_EMAIL
                    ?.trim()
                    .toLowerCase();

            console.log(
                "ADMIN EMAIL CONFIGURED:",
                !!adminEmail
            );

            if (!adminEmail) {
                console.error(
                    "❌ NEXT_PUBLIC_ADMIN_EMAIL is missing."
                );

                await supabase.auth.signOut();

                setError(
                    "Admin configuration is missing. Please check NEXT_PUBLIC_ADMIN_EMAIL in your .env.local file."
                );

                setLoading(false);
                return;
            }

            if (
                data.user.email?.toLowerCase() !==
                adminEmail
            ) {
                console.error(
                    "❌ Unauthorized admin email."
                );

                console.error(
                    "Logged in:",
                    data.user.email
                );

                console.error(
                    "Allowed:",
                    adminEmail
                );

                await supabase.auth.signOut();

                setError(
                    "This account is not authorized as an admin."
                );

                setLoading(false);
                return;
            }

            console.log(
                "✅ Admin email verified"
            );

            // ==================================
            // VERIFY SESSION AGAIN
            // ==================================

            const {
                data: sessionData,
                error: sessionError,
            } =
                await supabase.auth.getSession();

            if (sessionError) {
                console.error(
                    "❌ Session verification error:",
                    sessionError
                );

                setError(
                    "Unable to verify your admin session."
                );

                setLoading(false);
                return;
            }

            if (!sessionData.session) {
                console.error(
                    "❌ Session disappeared after login."
                );

                setError(
                    "Admin session could not be established."
                );

                setLoading(false);
                return;
            }

            console.log(
                "✅ Admin session verified"
            );

            console.log(
                "================================"
            );
            console.log(
                "✅ ADMIN LOGIN SUCCESSFUL"
            );
            console.log(
                "➡️ Redirecting to /admin"
            );
            console.log(
                "================================"
            );

            // ==================================
            // FORCE FULL NAVIGATION
            // ==================================

            window.location.href = "/admin";

        } catch (error) {
            console.error(
                "❌ Admin login exception:",
                error
            );

            setError(
                error instanceof Error
                    ? error.message
                    : "Unable to login. Please try again."
            );

            setLoading(false);
        }
    }

    // ==========================================
    // ENTER KEY
    // ==========================================

    function handleKeyDown(
        e: React.KeyboardEvent<HTMLInputElement>
    ) {
        if (e.key === "Enter") {
            login();
        }
    }

    // ==========================================
    // SESSION CHECK SCREEN
    // ==========================================

    if (checkingSession) {
        return (
            <section className="min-h-screen bg-pink-50 flex items-center justify-center">
                <div className="text-center">

                    <div className="text-5xl mb-4">
                        🔐
                    </div>

                    <p className="text-gray-600 font-medium">
                        Checking admin session...
                    </p>

                </div>
            </section>
        );
    }

    // ==========================================
    // LOGIN PAGE
    // ==========================================

    return (
        <section className="min-h-screen bg-gradient-to-br from-pink-50 to-white flex items-center justify-center px-5">

            <div className="bg-white rounded-3xl shadow-xl p-8 md:p-10 w-full max-w-md">

                {/* HEADER */}

                <div className="text-center mb-8">

                    <div className="text-5xl mb-4">
                        🔐
                    </div>

                    <h1 className="text-4xl font-bold text-pink-700">
                        Admin Login
                    </h1>

                    <p className="text-gray-500 mt-2">
                        APSRAA BY AVNI
                    </p>

                </div>

                {/* ERROR */}

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 mb-5 text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-5">

                    {/* EMAIL */}

                    <div>

                        <label className="block text-gray-700 font-semibold mb-2">
                            Email
                        </label>

                        <input
                            type="email"
                            placeholder="Admin email"
                            value={email}
                            onChange={(e) =>
                                setEmail(
                                    e.target.value
                                )
                            }
                            onKeyDown={
                                handleKeyDown
                            }
                            autoComplete="email"
                            disabled={loading}
                            className="w-full border-2 border-gray-200 rounded-xl p-4 focus:border-pink-500 focus:outline-none transition disabled:bg-gray-100"
                        />

                    </div>

                    {/* PASSWORD */}

                    <div>

                        <label className="block text-gray-700 font-semibold mb-2">
                            Password
                        </label>

                        <div className="relative">

                            <input
                                type={
                                    showPassword
                                        ? "text"
                                        : "password"
                                }
                                placeholder="Admin password"
                                value={password}
                                onChange={(e) =>
                                    setPassword(
                                        e.target.value
                                    )
                                }
                                onKeyDown={
                                    handleKeyDown
                                }
                                autoComplete="current-password"
                                disabled={loading}
                                className="w-full border-2 border-gray-200 rounded-xl p-4 pr-14 focus:border-pink-500 focus:outline-none transition disabled:bg-gray-100"
                            />

                            <button
                                type="button"
                                onClick={() =>
                                    setShowPassword(
                                        !showPassword
                                    )
                                }
                                disabled={loading}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-pink-600 text-xl disabled:opacity-50"
                                aria-label={
                                    showPassword
                                        ? "Hide password"
                                        : "Show password"
                                }
                            >
                                {showPassword
                                    ? "🙈"
                                    : "👁️"}
                            </button>

                        </div>

                        <div className="text-right mt-2">

                            <button
                                type="button"
                                onClick={() =>
                                    setShowPassword(
                                        !showPassword
                                    )
                                }
                                disabled={loading}
                                className="text-sm text-pink-600 hover:text-pink-700 disabled:opacity-50"
                            >
                                {showPassword
                                    ? "Hide password"
                                    : "Show password"}
                            </button>

                        </div>

                    </div>

                    {/* LOGIN BUTTON */}

                    <button
                        onClick={login}
                        disabled={loading}
                        className="w-full bg-pink-600 text-white py-4 rounded-xl font-bold hover:bg-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading
                            ? "Logging in..."
                            : "Login"}
                    </button>

                </div>

            </div>

        </section>
    );
}