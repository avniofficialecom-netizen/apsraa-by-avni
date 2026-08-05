"use client";

import { useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function AdminLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    async function login() {
        setLoading(true);

        console.log("1. Login Started");

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        console.log("2. Data:", data);
        console.log("3. Error:", error);

        setLoading(false);

        if (error) {
            alert(error.message);
            return;
        }

        if (!data.session) {
            alert("Login failed.");
            return;
        }

        alert("✅ Login Successful");

        // Force browser navigation
        window.location.href = "/admin";
    }

    return (
        <section className="min-h-screen bg-pink-50 flex items-center justify-center">

            <div className="bg-white rounded-3xl shadow-xl p-10 w-full max-w-md">

                <h1 className="text-4xl font-bold text-pink-700 text-center mb-8">
                    Admin Login
                </h1>

                <div className="space-y-5">

                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full border rounded-xl p-4"
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full border rounded-xl p-4"
                    />

                    <button
                        onClick={login}
                        disabled={loading}
                        className="w-full bg-pink-600 text-white py-4 rounded-xl hover:bg-pink-700 disabled:opacity-50"
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>

                </div>

            </div>

        </section>
    );
}