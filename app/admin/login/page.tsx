"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function AdminLoginPage() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleLogin(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();

        setError("");
        setLoading(true);

        const cleanEmail = email.trim().toLowerCase();

        try {
            if (!cleanEmail || !password) {
                setError("Please enter your email and password.");
                setLoading(false);
                return;
            }

            // -----------------------------------------
            // SUPABASE LOGIN
            // -----------------------------------------

            const { data, error: loginError } =
                await supabase.auth.signInWithPassword({
                    email: cleanEmail,
                    password,
                });

            if (loginError) {
                console.error("Login error:", loginError);

                setError(
                    loginError.message ||
                    "Invalid email or password."
                );

                setLoading(false);
                return;
            }

            // -----------------------------------------
            // VERIFY SESSION
            // -----------------------------------------

            const { data: sessionData } =
                await supabase.auth.getSession();

            const session = sessionData.session;

            if (!session || !data.user) {
                console.error(
                    "Login succeeded but no session was created."
                );

                setError(
                    "Login succeeded, but the session could not be created. Please try again."
                );

                setLoading(false);
                return;
            }

            // -----------------------------------------
            // ADMIN EMAIL CHECK
            // -----------------------------------------

            const adminEmail =
                process.env.NEXT_PUBLIC_ADMIN_EMAIL
                    ?.trim()
                    .toLowerCase();

            if (!adminEmail) {
                console.error(
                    "NEXT_PUBLIC_ADMIN_EMAIL is missing."
                );

                setError(
                    "Admin configuration is missing."
                );

                setLoading(false);
                return;
            }

            if (data.user.email?.toLowerCase() !== adminEmail) {
                console.error(
                    "Unauthorized admin email:",
                    data.user.email
                );

                await supabase.auth.signOut();

                setError(
                    "This account is not authorized as an admin."
                );

                setLoading(false);
                return;
            }

            // -----------------------------------------
            // LOGIN SUCCESS
            // -----------------------------------------

            console.log("Admin login successful");

            /*
             * Give Supabase a moment to persist the
             * authentication session before navigating.
             */

            await new Promise((resolve) =>
                setTimeout(resolve, 300)
            );

            // Force a complete browser navigation.
            // This is more reliable on Vercel than
            // relying only on router.push().
            window.location.replace("/admin");

        } catch (err) {
            console.error("Unexpected login error:", err);

            setError(
                "Something went wrong while logging in. Please try again."
            );

            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-pink-50 to-white flex items-center justify-center px-5 py-10">

            <div className="w-full max-w-md">

                <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10">

                    {/* Header */}

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

                    {/* Error */}

                    {error && (
                        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Login Form */}

                    <form
                        onSubmit={handleLogin}
                        className="space-y-6"
                    >

                        {/* Email */}

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
                                    setEmail(e.target.value)
                                }
                                placeholder="Enter admin email"
                                autoComplete="email"
                                required
                                disabled={loading}
                                className="w-full border-2 border-gray-200 rounded-xl px-4 py-4 text-gray-800 focus:border-pink-500 focus:outline-none transition disabled:bg-gray-100"
                            />

                        </div>

                        {/* Password */}

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
                                        setPassword(e.target.value)
                                    }
                                    placeholder="Enter password"
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

                        {/* Login Button */}

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