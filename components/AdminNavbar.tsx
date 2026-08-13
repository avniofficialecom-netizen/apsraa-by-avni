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
        <nav className="admin-navbar">

            {/* ==============================
                TOP BAR
            ============================== */}

            <div className="admin-navbar-inner">

                {/* LOGO */}

                <Link
                    href="/admin"
                    className="admin-logo"
                    onClick={closeMenu}
                >
                    APSRAA ADMIN
                </Link>

                {/* DESKTOP NAVIGATION */}

                <div className="admin-desktop-menu">

                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={
                                isActive(item.href)
                                    ? "admin-nav-link active"
                                    : "admin-nav-link"
                            }
                        >
                            {item.name}
                        </Link>
                    ))}

                </div>

                {/* DESKTOP LOGOUT */}

                <button
                    type="button"
                    onClick={logout}
                    disabled={loggingOut}
                    className="admin-desktop-logout"
                >
                    {loggingOut ? "Logging..." : "Logout"}
                </button>

                {/* MOBILE MENU BUTTON */}

                <button
                    type="button"
                    className="admin-mobile-button"
                    onClick={() =>
                        setMenuOpen((current) => !current)
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

            {/* ==============================
                MOBILE MENU
            ============================== */}

            {menuOpen && (
                <div className="admin-mobile-menu">

                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={closeMenu}
                            className={
                                isActive(item.href)
                                    ? "admin-mobile-link active"
                                    : "admin-mobile-link"
                            }
                        >
                            <span className="admin-mobile-icon">
                                {item.icon}
                            </span>

                            <span className="admin-mobile-text">
                                {item.name}
                            </span>
                        </Link>
                    ))}

                    <button
                        type="button"
                        onClick={logout}
                        disabled={loggingOut}
                        className="admin-mobile-logout"
                    >
                        <span className="admin-mobile-icon">
                            🚪
                        </span>

                        <span className="admin-mobile-text">
                            {loggingOut
                                ? "Logging out..."
                                : "Logout"}
                        </span>
                    </button>

                </div>
            )}

            {/* ==============================
                CSS
            ============================== */}

            <style jsx>{`

                /* =========================================
                   NAVBAR
                ========================================= */

                .admin-navbar {
                    position: sticky;
                    top: 0;
                    z-index: 9999;

                    width: 100%;

                    background: #0f172a;
                    color: white;

                    box-shadow:
                        0 4px 18px rgba(0, 0, 0, 0.15);
                }

                .admin-navbar-inner {
                    width: 100%;
                    max-width: 1280px;

                    height: 76px;

                    margin: 0 auto;

                    padding: 0 28px;

                    display: flex;
                    align-items: center;

                    box-sizing: border-box;
                }

                /* =========================================
                   LOGO
                ========================================= */

                .admin-logo {
                    display: flex;
                    align-items: center;

                    color: #f472b6;

                    text-decoration: none;

                    font-size: 27px;
                    font-weight: 800;

                    letter-spacing: -0.7px;

                    white-space: nowrap;

                    flex-shrink: 0;
                }

                /* =========================================
                   DESKTOP MENU
                ========================================= */

                .admin-desktop-menu {
                    display: flex;
                    align-items: center;

                    gap: 5px;

                    margin-left: auto;
                }

                .admin-nav-link {
                    color: #e5e7eb;

                    text-decoration: none;

                    padding: 10px 15px;

                    border-radius: 10px;

                    font-size: 15px;
                    font-weight: 500;

                    white-space: nowrap;

                    transition:
                        background 0.2s ease,
                        color 0.2s ease;
                }

                .admin-nav-link:hover {
                    background: #1e293b;
                    color: white;
                }

                .admin-nav-link.active {
                    background: #db2777;
                    color: white;
                }

                /* =========================================
                   DESKTOP LOGOUT
                ========================================= */

                .admin-desktop-logout {
                    border: none;

                    background: #db2777;
                    color: white;

                    padding: 12px 21px;

                    border-radius: 12px;

                    font-size: 15px;
                    font-weight: 600;

                    cursor: pointer;

                    margin-left: 18px;

                    white-space: nowrap;

                    transition:
                        background 0.2s ease,
                        opacity 0.2s ease;
                }

                .admin-desktop-logout:hover {
                    background: #be185d;
                }

                .admin-desktop-logout:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                /* =========================================
                   MOBILE BUTTON
                ========================================= */

                .admin-mobile-button {
                    display: none;

                    width: 44px;
                    height: 44px;

                    border: none;
                    border-radius: 12px;

                    background: #db2777;
                    color: white;

                    font-size: 23px;

                    align-items: center;
                    justify-content: center;

                    cursor: pointer;

                    flex-shrink: 0;
                }

                /* =========================================
                   MOBILE MENU
                ========================================= */

                .admin-mobile-menu {
                    display: none;
                }

                /* =========================================
                   MOBILE
                ========================================= */

                @media (max-width: 767px) {

                    .admin-navbar-inner {
                        height: 68px;

                        padding: 0 14px;

                        justify-content: space-between;
                    }

                    .admin-logo {
                        font-size: 20px;

                        letter-spacing: -0.4px;
                    }

                    .admin-desktop-menu {
                        display: none;
                    }

                    .admin-desktop-logout {
                        display: none;
                    }

                    .admin-mobile-button {
                        display: flex;
                    }

                    /* MOBILE MENU */

                    .admin-mobile-menu {
                        display: flex;

                        flex-direction: column;

                        width: 100%;

                        padding: 10px 14px 14px;

                        background: #0f172a;

                        border-top: 1px solid #334155;

                        box-sizing: border-box;
                    }

                    /* =====================================
                       MOBILE LINKS

                       IMPORTANT:
                       flex-direction: row keeps icon
                       and text SIDE BY SIDE.
                    ===================================== */

                    .admin-mobile-link,
                    .admin-mobile-logout {

                        width: 100% !important;

                        min-height: 50px !important;

                        display: flex !important;

                        flex-direction: row !important;

                        align-items: center !important;

                        justify-content: flex-start !important;

                        gap: 12px !important;

                        padding: 10px 14px !important;

                        margin: 0 0 6px 0 !important;

                        border: none !important;

                        border-radius: 11px !important;

                        background: #1e293b;

                        color: #e5e7eb;

                        text-decoration: none;

                        text-align: left;

                        font-size: 16px;

                        font-weight: 500;

                        box-sizing: border-box;

                        cursor: pointer;
                    }

                    .admin-mobile-link.active {
                        background: #db2777;
                        color: white;
                    }

                    .admin-mobile-link:hover,
                    .admin-mobile-logout:hover {
                        background: #334155;
                    }

                    /* ICON */

                    .admin-mobile-icon {
                        width: 28px !important;
                        min-width: 28px !important;

                        height: 28px;

                        display: flex !important;

                        flex-direction: row !important;

                        align-items: center !important;

                        justify-content: center !important;

                        font-size: 19px;

                        line-height: 1;

                        flex-shrink: 0;
                    }

                    /* TEXT */

                    .admin-mobile-text {
                        display: block !important;

                        flex: 1;

                        line-height: 1.2;

                        white-space: nowrap;
                    }

                    /* LOGOUT */

                    .admin-mobile-logout {
                        margin-top: 5px !important;
                        margin-bottom: 0 !important;
                    }

                    .admin-mobile-logout:disabled {
                        opacity: 0.6;
                        cursor: not-allowed;
                    }
                }

                /* =========================================
                   SMALL PHONES
                ========================================= */

                @media (max-width: 400px) {

                    .admin-navbar-inner {
                        height: 64px;

                        padding: 0 12px;
                    }

                    .admin-logo {
                        font-size: 19px;
                    }

                    .admin-mobile-button {
                        width: 42px;
                        height: 42px;

                        border-radius: 11px;

                        font-size: 21px;
                    }

                    .admin-mobile-menu {
                        padding-left: 10px;
                        padding-right: 10px;
                    }

                    .admin-mobile-link,
                    .admin-mobile-logout {
                        min-height: 48px !important;

                        padding: 9px 12px !important;
                    }
                }

            `}</style>

        </nav>
    );
}