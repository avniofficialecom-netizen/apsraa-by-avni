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
            name: "Orders",
            href: "/admin/orders",
            icon: "📦",
        },
        {
            name: "Customers",
            href: "/admin/customers",
            icon: "👥",
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

    return (
        <nav className="apsraa-navbar">

            {/* ================================
                TOP BAR
            ================================= */}

            <div className="apsraa-navbar-top">

                <Link
                    href="/admin"
                    className="apsraa-logo"
                    onClick={closeMenu}
                >
                    APSRAA ADMIN
                </Link>

                {/* Desktop Navigation */}

                <div className="apsraa-desktop-nav">

                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={
                                isActive(item.href)
                                    ? "apsraa-desktop-link active"
                                    : "apsraa-desktop-link"
                            }
                        >
                            {item.name}
                        </Link>
                    ))}

                </div>

                {/* Desktop Logout */}

                <button
                    type="button"
                    onClick={logout}
                    disabled={loggingOut}
                    className="apsraa-desktop-logout"
                >
                    {loggingOut ? "Logging..." : "Logout"}
                </button>

                {/* Mobile Menu Button */}

                <button
                    type="button"
                    className="apsraa-menu-button"
                    onClick={() =>
                        setMenuOpen((value) => !value)
                    }
                    aria-label={
                        menuOpen
                            ? "Close menu"
                            : "Open menu"
                    }
                    aria-expanded={menuOpen}
                >
                    {menuOpen ? "✕" : "☰"}
                </button>

            </div>

            {/* ================================
                MOBILE MENU
            ================================= */}

            {menuOpen && (
                <div className="apsraa-mobile-menu">

                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={closeMenu}
                            className={
                                isActive(item.href)
                                    ? "apsraa-mobile-item active"
                                    : "apsraa-mobile-item"
                            }
                        >
                            <span className="apsraa-mobile-icon">
                                {item.icon}
                            </span>

                            <span className="apsraa-mobile-text">
                                {item.name}
                            </span>
                        </Link>
                    ))}

                    <button
                        type="button"
                        onClick={logout}
                        disabled={loggingOut}
                        className="apsraa-mobile-item apsraa-mobile-logout"
                    >
                        <span className="apsraa-mobile-icon">
                            🚪
                        </span>

                        <span className="apsraa-mobile-text">
                            {loggingOut
                                ? "Logging out..."
                                : "Logout"}
                        </span>
                    </button>

                </div>
            )}

            {/* ================================
                STYLES
            ================================= */}

            <style jsx>{`

                /* ==================================
                   MAIN NAVBAR
                ================================== */

                .apsraa-navbar {
                    position: sticky;
                    top: 0;
                    z-index: 9999;

                    width: 100%;

                    background: #0f172a;
                    color: white;

                    box-shadow:
                        0 4px 18px rgba(0, 0, 0, 0.16);
                }

                .apsraa-navbar-top {
                    width: 100%;
                    max-width: 1280px;

                    height: 76px;

                    margin: 0 auto;

                    padding: 0 28px;

                    display: flex;
                    align-items: center;

                    box-sizing: border-box;
                }

                /* ==================================
                   LOGO
                ================================== */

                .apsraa-logo {
                    color: #f472b6;

                    text-decoration: none;

                    font-size: 27px;
                    font-weight: 800;

                    letter-spacing: -0.6px;

                    white-space: nowrap;

                    flex-shrink: 0;
                }

                /* ==================================
                   DESKTOP NAV
                ================================== */

                .apsraa-desktop-nav {
                    display: flex;
                    align-items: center;

                    gap: 4px;

                    margin-left: auto;
                }

                .apsraa-desktop-link {
                    color: #e5e7eb;

                    text-decoration: none;

                    padding: 10px 14px;

                    border-radius: 10px;

                    font-size: 15px;
                    font-weight: 500;

                    white-space: nowrap;

                    transition:
                        background 0.2s ease,
                        color 0.2s ease;
                }

                .apsraa-desktop-link:hover {
                    background: #1e293b;
                    color: white;
                }

                .apsraa-desktop-link.active {
                    background: #db2777;
                    color: white;
                }

                /* ==================================
                   DESKTOP LOGOUT
                ================================== */

                .apsraa-desktop-logout {
                    margin-left: 18px;

                    padding: 12px 21px;

                    border: none;
                    border-radius: 12px;

                    background: #db2777;
                    color: white;

                    font-family: inherit;

                    font-size: 15px;
                    font-weight: 600;

                    cursor: pointer;

                    white-space: nowrap;
                }

                .apsraa-desktop-logout:hover {
                    background: #be185d;
                }

                .apsraa-desktop-logout:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                /* ==================================
                   MOBILE BUTTON
                ================================== */

                .apsraa-menu-button {
                    display: none;

                    width: 44px;
                    height: 44px;

                    margin-left: auto;

                    border: none;
                    border-radius: 12px;

                    background: #db2777;
                    color: white;

                    align-items: center;
                    justify-content: center;

                    font-size: 23px;

                    cursor: pointer;
                }

                /* ==================================
                   MOBILE MENU DEFAULT
                ================================== */

                .apsraa-mobile-menu {
                    display: none;
                }

                /* ==================================
                   MOBILE
                ================================== */

                @media (max-width: 767px) {

                    .apsraa-navbar-top {
                        height: 64px;

                        padding: 0 12px;
                    }

                    .apsraa-logo {
                        font-size: 20px;
                    }

                    .apsraa-desktop-nav {
                        display: none;
                    }

                    .apsraa-desktop-logout {
                        display: none;
                    }

                    .apsraa-menu-button {
                        display: flex;
                    }

                    /* ==============================
                       MOBILE MENU

                       2 COLUMNS
                    ============================== */

                    .apsraa-mobile-menu {

                        display: grid;

                        grid-template-columns:
                            repeat(2, minmax(0, 1fr));

                        gap: 8px;

                        width: 100%;

                        padding: 10px;

                        background: #0f172a;

                        border-top:
                            1px solid #334155;

                        box-sizing: border-box;
                    }

                    /* ==============================
                       MOBILE ITEMS
                    ============================== */

                    .apsraa-mobile-item {

                        width: 100%;
                        height: 48px;
                        min-height: 48px;

                        display: flex;

                        flex-direction: row;

                        align-items: center;

                        justify-content: flex-start;

                        gap: 8px;

                        padding: 0 11px;

                        margin: 0;

                        border: none;
                        border-radius: 10px;

                        background: #1e293b;

                        color: #e5e7eb;

                        text-decoration: none;

                        font-family: inherit;

                        font-size: 15px;
                        font-weight: 500;

                        line-height: 1;

                        box-sizing: border-box;

                        white-space: nowrap;

                        cursor: pointer;
                    }

                    .apsraa-mobile-item:hover {
                        background: #334155;
                    }

                    .apsraa-mobile-item.active {
                        background: #db2777;
                        color: white;
                    }

                    /* ==============================
                       ICON
                    ============================== */

                    .apsraa-mobile-icon {

                        width: 24px;
                        min-width: 24px;

                        height: 24px;

                        display: inline-flex;

                        align-items: center;
                        justify-content: center;

                        flex: 0 0 24px;

                        font-size: 17px;

                        line-height: 1;
                    }

                    /* ==============================
                       TEXT
                    ============================== */

                    .apsraa-mobile-text {

                        display: block;

                        flex: 1;

                        min-width: 0;

                        overflow: hidden;

                        text-overflow: ellipsis;

                        white-space: nowrap;

                        line-height: 1;
                    }

                    /* ==============================
                       LOGOUT

                       Full width bottom row
                    ============================== */

                    .apsraa-mobile-logout {

                        grid-column: 1 / -1;

                        width: 100%;

                        margin-top: 2px;

                        background: #1e293b;
                    }

                    .apsraa-mobile-logout:hover {
                        background: #334155;
                    }

                    .apsraa-mobile-logout:disabled {
                        opacity: 0.6;
                        cursor: not-allowed;
                    }
                }

                /* ==================================
                   VERY SMALL PHONES
                ================================== */

                @media (max-width: 400px) {

                    .apsraa-navbar-top {
                        height: 64px;

                        padding: 0 10px;
                    }

                    .apsraa-logo {
                        font-size: 19px;
                    }

                    .apsraa-menu-button {
                        width: 42px;
                        height: 42px;

                        font-size: 21px;
                    }

                    .apsraa-mobile-menu {
                        padding: 8px;
                        gap: 7px;
                    }

                    .apsraa-mobile-item {
                        height: 46px;
                        min-height: 46px;

                        padding: 0 9px;

                        gap: 7px;

                        font-size: 14px;
                    }

                    .apsraa-mobile-icon {
                        width: 23px;
                        min-width: 23px;

                        flex-basis: 23px;

                        font-size: 16px;
                    }
                }

            `}</style>

        </nav>
    );
}