"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { useCart } from "./context/CartContext";

export default function Navbar() {
    const router = useRouter();
    const { cart } = useCart();

    const totalItems = cart.reduce(
        (sum, item) => sum + item.quantity,
        0
    );

    async function logout() {
        await supabase.auth.signOut();
        router.push("/admin/login");
    }

    return (
        <nav className="sticky top-0 z-50 bg-white shadow-md">
            <div className="max-w-7xl mx-auto flex items-center justify-between px-8 py-5">

                {/* Logo */}
                <Link
                    href="/"
                    className="text-3xl font-bold text-pink-700 tracking-wide"
                >
                    APSRAA BY AVNI
                </Link>

                {/* Navigation */}
                <div className="flex items-center gap-8 text-gray-700 font-medium">

                    <Link
                        href="/"
                        className="hover:text-pink-700 transition"
                    >
                        Home
                    </Link>

                    <Link
                        href="/shop"
                        className="hover:text-pink-700 transition"
                    >
                        Shop
                    </Link>

                    <Link
                        href="/cart"
                        className="relative hover:text-pink-700 transition"
                    >
                        🛒 Cart

                        {totalItems > 0 && (
                            <span className="absolute -top-3 -right-5 bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {totalItems}
              </span>
                        )}
                    </Link>

                    <Link
                        href="/admin"
                        className="hover:text-pink-700 transition"
                    >
                        Admin
                    </Link>

                </div>

                {/* Right Side */}
                <div className="flex items-center gap-4">

                    <Link
                        href="/shop"
                        className="bg-pink-600 text-white px-6 py-2 rounded-full hover:bg-pink-700 transition"
                    >
                        Shop Now
                    </Link>

                    <button
                        onClick={logout}
                        className="bg-gray-900 text-white px-5 py-2 rounded-full hover:bg-black transition"
                    >
                        Logout
                    </button>

                </div>

            </div>
        </nav>
    );
}