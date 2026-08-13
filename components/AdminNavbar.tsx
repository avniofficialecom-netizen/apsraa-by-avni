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
        } finally {
            router.replace("/admin/login");
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

    return (
        <>
            <nav className="admin-navbar">

                <div className="admin-navbar-inner">

                    {/* LOGO */}

                    <Link
                        href="/admin"
                        className="admin-logo"
                        onClick={() => setMenuOpen(false)}
                    >
                        <span>APSRAA</span>
                        <span>ADMIN</span>
                    </Link>


                    {/* DESKTOP MENU */}

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
                        onClick={logout}
                        disabled={loggingOut}
                        className="admin-desktop-logout"
                    >
                        {loggingOut
                            ? "Logging..."
                            : "Logout"}
                    </button>


                    {/* MOBILE MENU BUTTON */}

                    <button
                        type="button"
                        className="admin-mobile-button"
                        onClick={() =>
                            setMenuOpen(!menuOpen)
                        }
                        aria-label="Open admin menu"
                    >
                        {menuOpen ? "✕" : "☰"}
                    </button>

                </div>


                {/* MOBILE MENU */}

                {menuOpen && (
                    <div className="admin-mobile-menu">

                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() =>
                                    setMenuOpen(false)
                                }
                                className={
                                    isActive(item.href)
                                        ? "admin-mobile-link active"
                                        : "admin-mobile-link"
                                }
                            >
                                <span className="admin-mobile-icon">
                                    {item.icon}
                                </span>

                                <span>
                                    {item.name}
                                </span>
                            </Link>
                        ))}


                        <button
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

            </nav>


            {/* RESPONSIVE CSS */}

            <style jsx>{`
                .admin-navbar {
                    position: sticky;
                    top: 0;
                    z-index: 9999;
                    width: 100%;
                    background: #0f172a;
                    color: white;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.12);
                }

                .admin-navbar-inner {
                    width: 100%;
                    max-width: 1280px;
                    height: 76px;
                    margin: 0 auto;
                    padding: 0 24px;

                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 20px;
                }

                .admin-logo {
                    display: flex;
                    flex-direction: column;
                    line-height: 0.95;
                    text-decoration: none;
                    flex-shrink: 0;
                }

                .admin-logo span {
                    color: #f472b6;
                    font-size: 28px;
                    font-weight: 800;
                    letter-spacing: -0.5px;
                }

                .admin-desktop-menu {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-left: auto;
                }

                .admin-nav-link {
                    color: #e5e7eb;
                    text-decoration: none;
                    padding: 10px 14px;
                    border-radius: 10px;
                    font-size: 15px;
                    font-weight: 500;
                    transition: 0.2s;
                }

                .admin-nav-link:hover {
                    background: #1e293b;
                    color: white;
                }

                .admin-nav-link.active {
                    background: #db2777;
                    color: white;
                }

                .admin-desktop-logout {
                    border: none;
                    background: #db2777;
                    color: white;
                    padding: 11px 20px;
                    border-radius: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    margin-left: 12px;
                    white-space: nowrap;
                }

                .admin-desktop-logout:hover {
                    background: #be185d;
                }

                .admin-mobile-button {
                    display: none;

                    width: 44px;
                    height: 44px;

                    border: none;
                    border-radius: 12px;

                    background: #db2777;
                    color: white;

                    font-size: 23px;
                    cursor: pointer;

                    align-items: center;
                    justify-content: center;
                }

                .admin-mobile-menu {
                    display: none;
                }


                /* =====================================
                   MOBILE
                   ===================================== */

                @media (max-width: 767px) {

                    .admin-navbar-inner {
                        height: 68px;
                        padding: 0 16px;
                    }

                    .admin-logo span {
                        font-size: 21px;
                    }

                    .admin-desktop-menu {
                        display: none !important;
                    }

                    .admin-desktop-logout {
                        display: none !important;
                    }

                    .admin-mobile-button {
                        display: flex !important;
                        flex-shrink: 0;
                    }

                    .admin-mobile-menu {
                        display: block;
                        width: 100%;
                        padding: 8px 12px 14px;
                        background: #0f172a;
                        border-top: 1px solid #334155;
                    }

                    .admin-mobile-link,
                    .admin-mobile-logout {
                        width: 100%;
                        min-height: 48px;

                        display: flex;
                        align-items: center;

                        gap: 12px;

                        padding: 11px 14px;
                        margin-bottom: 5px;

                        border: none;
                        border-radius: 10px;

                        background: #1e293b;
                        color: #e5e7eb;

                        text-decoration: none;
                        text-align: left;

                        font-size: 15px;
                        font-weight: 500;

                        box-sizing: border-box;
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
                        cursor: pointer;
                        margin-top: 8px;
                        margin-bottom: 0;
                    }

                    .admin-mobile-icon {
                        width: 26px;
                        text-align: center;
                        font-size: 18px;
                        flex-shrink: 0;
                    }
                }


                /* VERY SMALL PHONES */

                @media (max-width: 400px) {

                    .admin-navbar-inner {
                        padding: 0 14px;
                    }

                    .admin-logo span {
                        font-size: 20px;
                    }

                    .admin-mobile-button {
                        width: 42px;
                        height: 42px;
                    }
                }
            `}</style>
        </>
    );
}