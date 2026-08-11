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

    useEffect(() => {
        checkExistingSession();
    }, []);

    async function checkExistingSession() {
        try {
            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (session) {
                router.replace("/admin");
                return;
            }
        } catch (error) {
            console.error("Session check error:", error);
        } finally {
            setCheckingSession(false);
        }
    }

    async function login() {
        setError("");

        if (!email.trim() || !password) {
            setError("Please enter your email and password.");
            return;
        }

        setLoading(true);

        try {
            const { data, error } =
                await supabase.auth.signInWithPassword({
                    email: email.trim(),
                    password,
                });

            if (error) {
                console.error("Login error:", error);
                setError(error.message);
                return;
            }

            if (!data.session) {
                setError(
                    "Login failed. No active session was created."
                );
                return;
            }

            console.log("✅ Admin login successful");

            router.replace("/admin");
        } catch (error) {
            console.error("Admin login exception:", error);

            setError(
                error instanceof Error
                    ? error.message
                    : "Unable to login. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }

    function handleKeyDown(
        e: React.KeyboardEvent<HTMLInputElement>
    ) {
        if (e.key === "Enter") {
            login();
        }
    }

    if (checkingSession) {
        return (
            <section className="min-h-screen bg-pink-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-5xl mb-4">🔐</div>

                    <p className="text-gray-600 font-medium">
                        Checking admin session...
                    </p>
                </div>
            </section>
        );
    }

    return (
        <section className="min-h-screen bg-gradient-to-br from-pink-50 to-white flex items-center justify-center px-5">

            <div className="bg-white rounded-3xl shadow-xl p-8 md:p-10 w-full max-w-md">

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
                                setEmail(e.target.value)
                            }
                            onKeyDown={handleKeyDown}
                            autoComplete="email"
                            className="w-full border-2 border-gray-200 rounded-xl p-4 focus:border-pink-500 focus:outline-none transition"
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
                                onKeyDown={handleKeyDown}
                                autoComplete="current-password"
                                className="w-full border-2 border-gray-200 rounded-xl p-4 pr-14 focus:border-pink-500 focus:outline-none transition"
                            />

                            <button
                                type="button"
                                onClick={() =>
                                    setShowPassword(
                                        !showPassword
                                    )
                                }
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-pink-600 text-xl"
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
                                className="text-sm text-pink-600 hover:text-pink-700"
                            >
                                {showPassword
                                    ? "Hide password"
                                    : "Show password"}
                            </button>
                        </div>

                    </div>

                    {/* LOGIN */}

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