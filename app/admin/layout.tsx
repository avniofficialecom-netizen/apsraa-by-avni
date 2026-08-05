"use client";

import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function AdminLayout({
                                        children,
                                    }: {
    children: ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Don't protect the login page
        if (pathname === "/admin/login") {
            return;
        }

        async function checkAuth() {
            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (!session) {
                router.replace("/admin/login");
            }
        }

        checkAuth();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            if (!session && pathname !== "/admin/login") {
                router.replace("/admin/login");
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [pathname, router]);

    return <>{children}</>;
}