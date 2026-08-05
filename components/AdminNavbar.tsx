"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function AdminNavbar() {
    const router = useRouter();

    async function logout() {
        await supabase.auth.signOut();
        router.replace("/admin/login");
    }

    return (
        <nav className="sticky top-0 z-50 bg-gray-900 text-white shadow-lg">
            <div className="max-w-7xl mx-auto flex items-center justify-between px-8 py-5">

                <Link
                    href="/admin"
                    className="text-3xl font-bold text-pink-400"
                >
                    APSRAA ADMIN
                </Link>

                <div className="flex items-center gap-8">

                    <Link href="/admin">
                        Dashboard
                    </Link>

                    <Link href="/admin/products">
                        Products
                    </Link>

                    <Link href="/admin/orders">
                        Orders
                    </Link>

                    <Link href="/admin/customers">
                        Customers
                    </Link>

                </div>

                <button
                    onClick={logout}
                    className="bg-pink-600 px-5 py-2 rounded-xl hover:bg-pink-700 transition"
                >
                    Logout
                </button>

            </div>
        </nav>
    );
}