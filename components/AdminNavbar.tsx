"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function AdminNavbar() {
    const router = useRouter();
    const pathname = usePathname();

    const [menuOpen, setMenuOpen] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    const navItems = [
        {
            name: "Dashboard",
            href: "/admin",
            icon: "📊",
        },
        {
            name: "Products",
            href: "/admin/products",
            icon: "💎",
        },
        {
            name: "Homepage",
            href: "/admin/homepage",
            icon: "🏠",
        },
        {
            name: "Inventory",
            href: "/admin/inventory",
            icon: "📋",
        },
        {
            name: "Orders",
            href: "/admin/orders",
            icon: "📦",
        },
        {
            name: "Customers",
            href: "/admin/customers",
            icon: "👥",
        },
        {
            name: "Store Settings",
            href: "/admin/settings",
            icon: "⚙️",
        },
    ];

    function isActive(href: string) {
        if (href === "/admin") {
            return pathname === "/admin";
        }

        return pathname.startsWith(href);
    }

    function closeMenu() {
        setMenuOpen(false);
    }

    async function logout() {
        if (loggingOut) return;

        setLoggingOut(true);

        try {
            await supabase.auth.signOut();
            router.replace("/admin/login");
        } catch (error) {
            console.error("Logout error:", error);
            setLoggingOut(false);
        }
    }

    return (
        <nav className="sticky top-0 z-[9999] w-full bg-slate-900 text-white shadow-[0_4px_18px_rgba(0,0,0,0.16)]">
            <div className="mx-auto flex min-h-[76px] w-full max-w-[1400px] items-center px-7 max-[1120px]:px-[18px] max-md:min-h-16 max-md:px-3">

                {/* Logo */}
                <Link
                    href="/admin"
                    onClick={closeMenu}
                    className="shrink-0 whitespace-nowrap text-[27px] font-extrabold tracking-[-0.6px] text-pink-400 no-underline max-[1120px]:text-[23px] max-md:text-xl max-[400px]:text-[19px]"
                >
                    APSRAA ADMIN
                </Link>

                {/* Desktop Navigation */}
                <div className="ml-auto mr-6 flex shrink-0 items-center justify-end gap-3 max-[1120px]:mr-3 max-[1120px]:gap-1 max-md:hidden">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={[
                                "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-3 text-[15px] font-medium no-underline transition-all",
                                "hover:-translate-y-px hover:bg-slate-800 hover:text-white",
                                "max-[1120px]:gap-1 max-[1120px]:px-2.5 max-[1120px]:py-2 max-[1120px]:text-sm",
                                isActive(item.href)
                                    ? "bg-pink-600 text-white"
                                    : "text-gray-200",
                            ].join(" ")}
                        >
                            <span className="text-base leading-none max-[1120px]:text-sm">
                                {item.icon}
                            </span>

                            <span>{item.name}</span>
                        </Link>
                    ))}
                </div>

                {/* Desktop Logout */}
                <button
                    type="button"
                    onClick={logout}
                    disabled={loggingOut}
                    className="shrink-0 whitespace-nowrap rounded-xl border-0 bg-pink-600 px-[21px] py-3 text-[15px] font-semibold text-white transition-all hover:-translate-y-px hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-60 max-[1120px]:px-3.5 max-[1120px]:py-2.5 max-[1120px]:text-sm max-md:hidden"
                >
                    {loggingOut ? "Logging..." : "Logout"}
                </button>

                {/* Mobile Menu Button */}
                <button
                    type="button"
                    onClick={() =>
                        setMenuOpen((value) => !value)
                    }
                    aria-label={
                        menuOpen
                            ? "Close menu"
                            : "Open menu"
                    }
                    aria-expanded={menuOpen}
                    className="ml-auto hidden h-11 w-11 items-center justify-center rounded-xl border-0 bg-pink-600 text-[23px] text-white max-md:flex max-[400px]:h-[42px] max-[400px]:w-[42px] max-[400px]:text-[21px]"
                >
                    {menuOpen ? "✕" : "☰"}
                </button>
            </div>

            {/* Mobile Navigation */}
            {menuOpen && (
                <div className="grid w-full grid-cols-2 gap-2 border-t border-slate-700 bg-slate-900 p-2 md:hidden">

                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={closeMenu}
                            className={[
                                "flex min-h-12 w-full items-center gap-2 rounded-xl bg-slate-800 px-3 text-[15px] font-medium text-gray-200 no-underline",
                                "hover:bg-slate-700",
                                isActive(item.href)
                                    ? "bg-pink-600 text-white"
                                    : "",
                            ].join(" ")}
                        >
                            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center text-[17px]">
                                {item.icon}
                            </span>

                            <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                                {item.name}
                            </span>
                        </Link>
                    ))}

                    <button
                        type="button"
                        onClick={logout}
                        disabled={loggingOut}
                        className="col-span-2 flex min-h-12 w-full items-center gap-2 rounded-xl border-0 bg-slate-800 px-3 text-left text-[15px] font-medium text-gray-200 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center text-[17px]">
                            🚪
                        </span>

                        <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                            {loggingOut
                                ? "Logging out..."
                                : "Logout"}
                        </span>
                    </button>

                </div>
            )}
        </nav>
    );
}