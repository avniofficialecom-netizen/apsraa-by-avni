"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useCart } from "./context/CartContext";

export default function Navbar() {
    const router = useRouter();
    const { cart } = useCart();
    const [menuOpen, setMenuOpen] = useState(false);

    const totalItems = cart.reduce(
        (sum, item) => sum + item.quantity,
        0
    );

    async function logout() {
        await supabase.auth.signOut();
        setMenuOpen(false);
        router.push("/admin/login");
    }

    function closeMenu() {
        setMenuOpen(false);
    }

    return (
        <nav className="sticky top-0 z-50 bg-white shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* ================= DESKTOP / MOBILE HEADER ================= */}
                <div className="flex items-center justify-between py-4 md:py-5">

                    {/* LOGO */}
                    <Link
                        href="/"
                        onClick={closeMenu}
                        className="text-2xl md:text-3xl font-bold text-pink-700 tracking-wide leading-tight"
                    >
                        <span className="md:hidden">
                            APSRAA
                            <br />
                            BY AVNI
                        </span>

                        <span className="hidden md:inline">
                            APSRAA BY AVNI
                        </span>
                    </Link>

                    {/* ================= DESKTOP NAVIGATION ================= */}
                    <div className="hidden md:flex items-center gap-6 lg:gap-8 text-gray-700 font-medium">

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
                            href="/track-order"
                            className="hover:text-pink-700 transition"
                        >
                            📦 Track Order
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

                    {/* ================= DESKTOP RIGHT SIDE ================= */}
                    <div className="hidden md:flex items-center gap-4">

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

                    {/* ================= MOBILE MENU BUTTON ================= */}
                    <button
                        type="button"
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="md:hidden flex items-center justify-center w-11 h-11 rounded-xl bg-pink-50 text-pink-700 text-2xl"
                        aria-label="Open navigation menu"
                        aria-expanded={menuOpen}
                    >
                        {menuOpen ? "✕" : "☰"}
                    </button>

                </div>

                {/* ================= MOBILE MENU ================= */}
                {menuOpen && (
                    <div className="md:hidden border-t border-gray-100 pb-5">

                        <div className="flex flex-col gap-2 pt-4">

                            <Link
                                href="/"
                                onClick={closeMenu}
                                className="px-4 py-3 rounded-xl text-gray-700 font-medium hover:bg-pink-50 hover:text-pink-700 transition"
                            >
                                🏠 Home
                            </Link>

                            <Link
                                href="/shop"
                                onClick={closeMenu}
                                className="px-4 py-3 rounded-xl text-gray-700 font-medium hover:bg-pink-50 hover:text-pink-700 transition"
                            >
                                🛍️ Shop
                            </Link>

                            <Link
                                href="/track-order"
                                onClick={closeMenu}
                                className="px-4 py-3 rounded-xl text-gray-700 font-medium hover:bg-pink-50 hover:text-pink-700 transition"
                            >
                                📦 Track Order
                            </Link>

                            <Link
                                href="/cart"
                                onClick={closeMenu}
                                className="relative px-4 py-3 rounded-xl text-gray-700 font-medium hover:bg-pink-50 hover:text-pink-700 transition"
                            >
                                🛒 Cart

                                {totalItems > 0 && (
                                    <span className="ml-2 inline-flex bg-red-600 text-white text-xs w-5 h-5 rounded-full items-center justify-center">
                                        {totalItems}
                                    </span>
                                )}
                            </Link>

                            <Link
                                href="/admin"
                                onClick={closeMenu}
                                className="px-4 py-3 rounded-xl text-gray-700 font-medium hover:bg-pink-50 hover:text-pink-700 transition"
                            >
                                🔐 Admin
                            </Link>

                            <Link
                                href="/shop"
                                onClick={closeMenu}
                                className="mt-2 text-center bg-pink-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-pink-700 transition"
                            >
                                Shop Now
                            </Link>

                            <button
                                type="button"
                                onClick={logout}
                                className="text-center bg-gray-900 text-white px-6 py-3 rounded-full font-semibold hover:bg-black transition"
                            >
                                Logout
                            </button>

                        </div>
                    </div>
                )}

            </div>
        </nav>
    );
}