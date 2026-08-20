"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useCart } from "./context/CartContext";

export default function Navbar() {
    const router = useRouter();
    const { cart } = useCart();

    const [menuOpen, setMenuOpen] = useState(false);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);

    const totalItems = cart.reduce(
        (sum, item) => sum + item.quantity,
        0
    );

    // ==========================================
    // CHECK CUSTOMER / ADMIN SESSION
    // ==========================================

    useEffect(() => {
        let mounted = true;

        async function loadSession() {
            try {
                const {
                    data: { session },
                } = await supabase.auth.getSession();

                if (!mounted) return;

                const email =
                    session?.user?.email
                        ?.trim()
                        .toLowerCase() || null;

                setUserEmail(email);

                const adminEmail =
                    process.env.NEXT_PUBLIC_ADMIN_EMAIL
                        ?.trim()
                        .toLowerCase();

                setIsAdmin(
                    Boolean(
                        email &&
                        adminEmail &&
                        email === adminEmail
                    )
                );
            } catch (error) {
                console.error(
                    "Navbar auth error:",
                    error
                );
            } finally {
                if (mounted) {
                    setCheckingAuth(false);
                }
            }
        }

        loadSession();

        // ==========================================
        // WATCH AUTH CHANGES
        // ==========================================

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                if (!mounted) return;

                const email =
                    session?.user?.email
                        ?.trim()
                        .toLowerCase() || null;

                setUserEmail(email);

                const adminEmail =
                    process.env.NEXT_PUBLIC_ADMIN_EMAIL
                        ?.trim()
                        .toLowerCase();

                setIsAdmin(
                    Boolean(
                        email &&
                        adminEmail &&
                        email === adminEmail
                    )
                );
            }
        );

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    // ==========================================
    // CLOSE MOBILE MENU
    // ==========================================

    function closeMenu() {
        setMenuOpen(false);
    }

    // ==========================================
    // LOGOUT
    // ==========================================

    async function logout() {
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error(
                "Logout error:",
                error
            );
        }

        setUserEmail(null);
        setIsAdmin(false);
        setMenuOpen(false);

        router.push("/login");
    }

    return (
        <nav className="sticky top-0 z-50 bg-white shadow-md">

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* ==========================================
                    HEADER
                ========================================== */}

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

                    {/* ==========================================
                        DESKTOP NAVIGATION
                    ========================================== */}

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

                        {/* ADMIN */}

                        {isAdmin && (
                            <Link
                                href="/admin"
                                className="hover:text-pink-700 transition"
                            >
                                Admin
                            </Link>
                        )}

                        {/* CUSTOMER ACCOUNT */}

                        {!checkingAuth &&
                            userEmail &&
                            !isAdmin && (
                                <Link
                                    href="/account"
                                    className="hover:text-pink-700 transition"
                                >
                                    👤 My Account
                                </Link>
                            )}

                        {/* CUSTOMER LOGIN */}

                        {!checkingAuth &&
                            !userEmail && (
                                <Link
                                    href="/login"
                                    className="hover:text-pink-700 transition"
                                >
                                    👤 Login
                                </Link>
                            )}

                    </div>

                    {/* ==========================================
                        RIGHT SIDE
                    ========================================== */}

                    <div className="hidden md:flex items-center gap-4">

                        <Link
                            href="/shop"
                            className="bg-pink-600 text-white px-6 py-2 rounded-full hover:bg-pink-700 transition"
                        >
                            Shop Now
                        </Link>

                        {!checkingAuth &&
                            userEmail && (
                                <button
                                    type="button"
                                    onClick={logout}
                                    className="bg-gray-900 text-white px-5 py-2 rounded-full hover:bg-black transition"
                                >
                                    Logout
                                </button>
                            )}

                    </div>

                    {/* ==========================================
                        MOBILE MENU BUTTON
                    ========================================== */}

                    <button
                        type="button"
                        onClick={() =>
                            setMenuOpen(
                                !menuOpen
                            )
                        }
                        className="md:hidden flex items-center justify-center w-11 h-11 rounded-xl bg-pink-50 text-pink-700 text-2xl"
                        aria-label="Open navigation menu"
                        aria-expanded={menuOpen}
                    >
                        {menuOpen
                            ? "✕"
                            : "☰"}
                    </button>

                </div>

                {/* ==========================================
                    MOBILE MENU
                ========================================== */}

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

                            {/* ADMIN */}

                            {isAdmin && (
                                <Link
                                    href="/admin"
                                    onClick={closeMenu}
                                    className="px-4 py-3 rounded-xl text-gray-700 font-medium hover:bg-pink-50 hover:text-pink-700 transition"
                                >
                                    🔐 Admin
                                </Link>
                            )}

                            {/* CUSTOMER ACCOUNT */}

                            {!checkingAuth &&
                                userEmail &&
                                !isAdmin && (
                                    <Link
                                        href="/account"
                                        onClick={closeMenu}
                                        className="px-4 py-3 rounded-xl text-gray-700 font-medium hover:bg-pink-50 hover:text-pink-700 transition"
                                    >
                                        👤 My Account
                                    </Link>
                                )}

                            {/* CUSTOMER LOGIN */}

                            {!checkingAuth &&
                                !userEmail && (
                                    <Link
                                        href="/login"
                                        onClick={closeMenu}
                                        className="px-4 py-3 rounded-xl text-gray-700 font-medium hover:bg-pink-50 hover:text-pink-700 transition"
                                    >
                                        👤 Login
                                    </Link>
                                )}

                            <Link
                                href="/shop"
                                onClick={closeMenu}
                                className="mt-2 text-center bg-pink-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-pink-700 transition"
                            >
                                Shop Now
                            </Link>

                            {/* LOGOUT */}

                            {!checkingAuth &&
                                userEmail && (
                                    <button
                                        type="button"
                                        onClick={
                                            logout
                                        }
                                        className="text-center bg-gray-900 text-white px-6 py-3 rounded-full font-semibold hover:bg-black transition"
                                    >
                                        Logout
                                    </button>
                                )}

                        </div>
                    </div>
                )}

            </div>
        </nav>
    );
}