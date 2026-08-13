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
        } finally {
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
                NAVBAR TOP
            ============================== */}

            <div className="admin-navbar-inner">

                {/* LOGO */}

                <Link
                    href="/admin"
                    className="admin-logo"
                    onClick={closeMenu}
                >
                    <span>APSRAA</span>
                    <span>ADMIN</span>
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
                    onClick={() => setMenuOpen((value) => !value)}
                    aria-label={
                        menuOpen
                            ? "Close admin menu"
                            : "Open admin menu"
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

                            <span>{item.name}</span>
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

                        <span>
                            {loggingOut
                                ? "Logging out..."
                                : "Logout"}
                        </span>
                    </button>

                </div>
            )}

            {/* ==============================
                RESPONSIVE CSS
            ============================== */}

            <style jsx>{`

                /* ==============================
                   MAIN NAVBAR
                ============================== */

                .admin-navbar {
                    position: sticky;
                    top: 0;
                    z-index: 9999;
                    width: 100%;
                    background: #0f172a;
                    color: white;
                    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.15);
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

                /* ==============================
                   LOGO
                ============================== */

                .admin-logo {
                    display: flex;
                    flex-direction: column;

                    text-decoration: none;

                    line-height: 0.9;

                    flex-shrink: 0;

                    min-width: 150px;
                }

                .admin-logo span {
                    color: #f472b6;

                    font-size: 27px;
                    font-weight: 800;

                    letter-spacing: -0.6px;
                }

                /* ==============================
                   DESKTOP MENU
                ============================== */

                .admin-desktop-menu {
                    display: flex;
                    align-items: center;

                    gap: 4px;

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

                /* ==============================
                   DESKTOP LOGOUT
                ============================== */

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

                    transition: background 0.2s ease;
                }

                .admin-desktop-logout:hover {
                    background: #be185d;
                }

                .admin-desktop-logout:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                /* ==============================
                   MOBILE BUTTON
                ============================== */

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

                /* ==============================
                   MOBILE MENU
                ============================== */

                .admin-mobile-menu {
                    display: none;
                }

                /* ==============================
                   TABLET / MOBILE
                ============================== */

                @media (max-width: 767px) {

                    .admin-navbar-inner {
                        height: 68px;

                        padding: 0 16px;

                        justify-content: space-between;
                    }

                    .admin-logo {
                        min-width: 0;
                    }

                    .admin-logo span {
                        font-size: 21px;
                        letter-spacing: -0.3px;
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

                    .admin-mobile-menu {
                        display: flex;

                        flex-direction: column;

                        width: 100%;

                        padding: 10px 14px 15px;

                        background: #0f172a;

                        border-top: 1px solid #334155;

                        box-sizing: border-box;
                    }

                    .admin-mobile-link,
                    .admin-mobile-logout {

                        width: 100%;

                        min-height: 50px;

                        display: flex;

                        align-items: center;

                        gap: 13px;

                        padding: 12px 15px;

                        margin: 0 0 6px 0;

                        border: none;

                        border-radius: 11px;

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

                    .admin-mobile-logout {
                        margin-top: 5px;
                        margin-bottom: 0;
                    }

                    .admin-mobile-logout:disabled {
                        opacity: 0.6;
                        cursor: not-allowed;
                    }

                    .admin-mobile-icon {
                        width: 26px;

                        display: flex;
                        align-items: center;
                        justify-content: center;

                        font-size: 19px;

                        flex-shrink: 0;
                    }
                }

                /* ==============================
                   SMALL PHONES
                ============================== */

                @media (max-width: 400px) {

                    .admin-navbar-inner {
                        height: 64px;
                        padding: 0 14px;
                    }

                    .admin-logo span {
                        font-size: 20px;
                    }

                    .admin-mobile-button {
                        width: 42px;
                        height: 42px;

                        border-radius: 11px;

                        font-size: 21px;
                    }
                }

            `}</style>

        </nav>
    );
}