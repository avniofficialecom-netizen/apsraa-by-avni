"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useCart } from "./context/CartContext";

function SearchIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            className="w-5 h-5"
        >
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4 4" />
        </svg>
    );
}

function UserIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            className="w-5 h-5"
        >
            <circle cx="12" cy="8" r="3.5" />
            <path d="M5 20c.8-3.5 3.2-5.5 7-5.5s6.2 2 7 5.5" />
        </svg>
    );
}

function BagIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            className="w-5 h-5"
        >
            <path d="M5 8h14l-1 12H6L5 8Z" />
            <path d="M9 9V6a3 3 0 0 1 6 0v3" />
        </svg>
    );
}

function MenuIcon({ open }: { open: boolean }) {
    return open ? (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            className="w-6 h-6"
        >
            <path d="M6 6l12 12M18 6 6 18" />
        </svg>
    ) : (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            className="w-6 h-6"
        >
            <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
    );
}

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

                const adminEmail =
                    process.env.NEXT_PUBLIC_ADMIN_EMAIL
                        ?.trim()
                        .toLowerCase();

                setUserEmail(email);

                setIsAdmin(
                    Boolean(
                        email &&
                        adminEmail &&
                        email === adminEmail
                    )
                );
            } catch (error) {
                console.error("Navbar auth error:", error);
            } finally {
                if (mounted) {
                    setCheckingAuth(false);
                }
            }
        }

        loadSession();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                if (!mounted) return;

                const email =
                    session?.user?.email
                        ?.trim()
                        .toLowerCase() || null;

                const adminEmail =
                    process.env.NEXT_PUBLIC_ADMIN_EMAIL
                        ?.trim()
                        .toLowerCase();

                setUserEmail(email);

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

    function closeMenu() {
        setMenuOpen(false);
    }

    async function logout() {
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error("Logout error:", error);
        }

        setUserEmail(null);
        setIsAdmin(false);
        setMenuOpen(false);

        router.push("/login");
    }

    return (
        <header className="sticky top-0 z-50 bg-[#fffdfb]/95 backdrop-blur-md border-b border-[#eee8e4]">

            {/* Desktop / Mobile header */}

            <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-10">

                <div className="flex h-[76px] items-center justify-between">

                    {/* LOGO */}

                    <Link
                        href="/"
                        onClick={closeMenu}
                        className="group shrink-0 cursor-pointer transition-transform duration-150 active:scale-[0.96]"
                    >
                        <div className="leading-none">
                            <div className="text-[23px] tracking-[0.28em] font-semibold text-[#222] transition-all duration-200 group-hover:tracking-[0.30em] group-active:opacity-70">
                                APSRAA
                            </div>

                            <div className="mt-1 text-[9px] tracking-[0.42em] text-[#b50063] font-medium transition-opacity duration-200 group-hover:opacity-80 group-active:opacity-60">
                                BY AVNI
                            </div>
                        </div>
                    </Link>

                    {/* DESKTOP NAV */}

                    <nav className="hidden lg:flex items-center gap-9 ml-10">

                        <Link
                            href="/"
                            className="relative py-7 text-[14px] tracking-wide text-[#333] transition-colors hover:text-[#b50063] active:opacity-60"
                        >
                            Home
                        </Link>

                        <Link
                            href="/shop"
                            className="relative py-7 text-[14px] tracking-wide text-[#333] transition-colors hover:text-[#b50063] active:opacity-60"
                        >
                            Shop
                        </Link>

                        <Link
                            href="/track-order"
                            className="relative py-7 text-[14px] tracking-wide text-[#333] transition-colors hover:text-[#b50063] active:opacity-60"
                        >
                            Track Order
                        </Link>

                        {isAdmin && (
                            <Link
                                href="/admin"
                                className="relative py-7 text-[14px] tracking-wide text-[#333] transition-colors hover:text-[#b50063] active:opacity-60"
                            >
                                Admin
                            </Link>
                        )}

                    </nav>

                    {/* RIGHT SIDE */}

                    <div className="hidden lg:flex items-center gap-2">

                        {/* SEARCH */}

                        <Link
                            href="/shop"
                            aria-label="Search products"
                            className="flex h-10 w-10 items-center justify-center rounded-full text-[#333] transition-all duration-150 hover:bg-[#f7f1f4] hover:text-[#b50063] active:scale-[0.92] active:opacity-70"
                        >
                            <SearchIcon />
                        </Link>

                        {/* ACCOUNT */}

                        {!checkingAuth && (
                            <>
                                {userEmail ? (
                                    <Link
                                        href={
                                            isAdmin
                                                ? "/admin"
                                                : "/account"
                                        }
                                        aria-label="My account"
                                        className="flex h-10 w-10 items-center justify-center rounded-full text-[#333] transition-all duration-150 hover:bg-[#f7f1f4] hover:text-[#b50063] active:scale-[0.92] active:opacity-70"
                                    >
                                        <UserIcon />
                                    </Link>
                                ) : (
                                    <Link
                                        href="/login"
                                        aria-label="Login"
                                        className="flex h-10 w-10 items-center justify-center rounded-full text-[#333] transition-all duration-150 hover:bg-[#f7f1f4] hover:text-[#b50063] active:scale-[0.92] active:opacity-70"
                                    >
                                        <UserIcon />
                                    </Link>
                                )}
                            </>
                        )}

                        {/* CART */}

                        <Link
                            href="/cart"
                            aria-label={`Shopping bag, ${totalItems} items`}
                            className="relative ml-1 flex h-10 w-10 items-center justify-center rounded-full text-[#333] transition-all duration-150 hover:bg-[#f7f1f4] hover:text-[#b50063] active:scale-[0.92] active:opacity-70"
                        >
                            <BagIcon />

                            {totalItems > 0 && (
                                <span className="absolute right-0.5 top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[#b50063] px-1 text-[9px] font-semibold text-white">
                                    {totalItems}
                                </span>
                            )}
                        </Link>

                        {/* SHOP CTA */}

                        <Link
                            href="/shop"
                            className="ml-4 rounded-full bg-[#b50063] px-6 py-2.5 text-[13px] font-medium tracking-wide text-white transition-all duration-150 hover:bg-[#920052] hover:shadow-md active:scale-[0.97] active:opacity-90"
                        >
                            Shop Collection
                        </Link>

                    </div>

                    {/* MOBILE ACTIONS */}

                    <div className="flex items-center gap-1 lg:hidden">

                        <Link
                            href="/cart"
                            aria-label="Shopping bag"
                            className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#333] transition-transform duration-150 active:scale-[0.92] active:opacity-70"
                        >
                            <BagIcon />

                            {totalItems > 0 && (
                                <span className="absolute right-0.5 top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[#b50063] px-1 text-[9px] font-semibold text-white">
                                    {totalItems}
                                </span>
                            )}
                        </Link>

                        <button
                            type="button"
                            onClick={() =>
                                setMenuOpen((open) => !open)
                            }
                            aria-label={
                                menuOpen
                                    ? "Close navigation menu"
                                    : "Open navigation menu"
                            }
                            aria-expanded={menuOpen}
                            className="flex h-10 w-10 items-center justify-center rounded-full text-[#333] transition-transform duration-150 active:scale-[0.92] active:opacity-70"
                        >
                            <MenuIcon open={menuOpen} />
                        </button>

                    </div>

                </div>

                {/* MOBILE MENU */}

                {menuOpen && (
                    <div className="lg:hidden border-t border-[#eee8e4] py-5">

                        <nav className="flex flex-col">

                            <Link
                                href="/"
                                onClick={closeMenu}
                                className="border-b border-[#f0ebe8] py-4 text-[15px] text-[#333] transition-all duration-150 active:pl-1 active:opacity-60"
                            >
                                Home
                            </Link>

                            <Link
                                href="/shop"
                                onClick={closeMenu}
                                className="border-b border-[#f0ebe8] py-4 text-[15px] text-[#333] transition-all duration-150 active:pl-1 active:opacity-60"
                            >
                                Shop
                            </Link>

                            <Link
                                href="/track-order"
                                onClick={closeMenu}
                                className="border-b border-[#f0ebe8] py-4 text-[15px] text-[#333] transition-all duration-150 active:pl-1 active:opacity-60"
                            >
                                Track Order
                            </Link>

                            {!checkingAuth && userEmail && !isAdmin && (
                                <Link
                                    href="/account"
                                    onClick={closeMenu}
                                    className="border-b border-[#f0ebe8] py-4 text-[15px] text-[#333] transition-all duration-150 active:pl-1 active:opacity-60"
                                >
                                    My Account
                                </Link>
                            )}

                            {!checkingAuth && !userEmail && (
                                <Link
                                    href="/login"
                                    onClick={closeMenu}
                                    className="border-b border-[#f0ebe8] py-4 text-[15px] text-[#333] transition-all duration-150 active:pl-1 active:opacity-60"
                                >
                                    Login
                                </Link>
                            )}

                            {isAdmin && (
                                <Link
                                    href="/admin"
                                    onClick={closeMenu}
                                    className="border-b border-[#f0ebe8] py-4 text-[15px] text-[#333] transition-all duration-150 active:pl-1 active:opacity-60"
                                >
                                    Admin Dashboard
                                </Link>
                            )}

                            <Link
                                href="/shop"
                                onClick={closeMenu}
                                className="mt-5 rounded-full bg-[#b50063] py-3.5 text-center text-[14px] font-medium tracking-wide text-white transition-all duration-150 active:scale-[0.97] active:opacity-90"
                            >
                                Shop Collection
                            </Link>

                            {userEmail && (
                                <button
                                    type="button"
                                    onClick={logout}
                                    className="mt-3 py-3 text-center text-[13px] text-[#777] transition-opacity duration-150 active:opacity-50"
                                >
                                    Sign out
                                </button>
                            )}

                        </nav>

                    </div>
                )}

            </div>

        </header>
    );
}