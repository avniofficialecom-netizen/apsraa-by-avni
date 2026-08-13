import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(
    request: NextRequest
) {
    let response = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },

                setAll(cookiesToSet) {
                    cookiesToSet.forEach(
                        ({
                             name,
                             value,
                             options,
                         }) => {
                            request.cookies.set(
                                name,
                                value
                            );

                            response.cookies.set(
                                name,
                                value,
                                options
                            );
                        }
                    );
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const pathname =
        request.nextUrl.pathname;

    const isAdminRoute =
        pathname.startsWith("/admin");

    const isLoginPage =
        pathname === "/admin/login";

    // ==========================================
    // ADMIN EMAIL
    // ==========================================
    // IMPORTANT:
    // Vercel has NEXT_PUBLIC_ADMIN_EMAIL
    // ==========================================

    const adminEmail =
        process.env.NEXT_PUBLIC_ADMIN_EMAIL
            ?.trim()
            .toLowerCase();

    // ==========================================
    // ADMIN LOGIN PAGE
    // ==========================================

    if (isLoginPage) {
        // No logged-in user:
        // allow login page.
        if (!user) {
            return response;
        }

        // Admin configuration missing
        if (!adminEmail) {
            console.error(
                "NEXT_PUBLIC_ADMIN_EMAIL is missing."
            );

            return response;
        }

        // Logged-in user must be admin
        if (
            user.email?.trim().toLowerCase() !==
            adminEmail
        ) {
            console.warn(
                "Unauthorized admin user:",
                user.email
            );

            await supabase.auth.signOut();

            const loginUrl =
                request.nextUrl.clone();

            loginUrl.pathname =
                "/admin/login";

            return NextResponse.redirect(
                loginUrl
            );
        }

        // Already logged in as admin
        const adminUrl =
            request.nextUrl.clone();

        adminUrl.pathname =
            "/admin";

        return NextResponse.redirect(
            adminUrl
        );
    }

    // ==========================================
    // PROTECT ALL ADMIN ROUTES
    // ==========================================

    if (isAdminRoute) {
        // No user → login
        if (!user) {
            const loginUrl =
                request.nextUrl.clone();

            loginUrl.pathname =
                "/admin/login";

            return NextResponse.redirect(
                loginUrl
            );
        }

        // Admin configuration missing
        if (!adminEmail) {
            console.error(
                "NEXT_PUBLIC_ADMIN_EMAIL is missing."
            );

            const loginUrl =
                request.nextUrl.clone();

            loginUrl.pathname =
                "/admin/login";

            return NextResponse.redirect(
                loginUrl
            );
        }

        // User exists but is NOT admin
        if (
            user.email?.trim().toLowerCase() !==
            adminEmail
        ) {
            console.warn(
                "Unauthorized admin access:",
                user.email
            );

            await supabase.auth.signOut();

            const loginUrl =
                request.nextUrl.clone();

            loginUrl.pathname =
                "/admin/login";

            return NextResponse.redirect(
                loginUrl
            );
        }

        // ======================================
        // CORRECT ADMIN
        // ======================================

        return response;
    }

    return response;
}

export const config = {
    matcher: [
        "/admin/:path*",
    ],
};