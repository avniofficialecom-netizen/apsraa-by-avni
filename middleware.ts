import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(
    request: NextRequest
) {
    let response = NextResponse.next({
        request,
    });

    const supabase =
        createServerClient(
            process.env
                .NEXT_PUBLIC_SUPABASE_URL!,
            process.env
                .NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll();
                    },

                    setAll(
                        cookiesToSet
                    ) {
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
    } =
        await supabase.auth.getUser();

    const pathname =
        request.nextUrl.pathname;

    const isAdminRoute =
        pathname.startsWith(
            "/admin"
        );

    const isLoginPage =
        pathname ===
        "/admin/login";

    // ==========================================
    // ADMIN EMAIL
    // ==========================================

    const adminEmail =
        process.env.ADMIN_EMAIL;

    // ==========================================
    // ADMIN LOGIN PAGE
    // ==========================================

    if (isLoginPage) {
        // No logged-in user:
        // allow the login page.
        if (!user) {
            return response;
        }

        // Logged-in user must be the admin.
        if (
            !adminEmail ||
            user.email?.toLowerCase() !==
            adminEmail.toLowerCase()
        ) {
            await supabase.auth.signOut();

            const loginUrl =
                request.nextUrl.clone();

            loginUrl.pathname =
                "/admin/login";

            return NextResponse.redirect(
                loginUrl
            );
        }

        // Admin is already logged in.
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

        // User exists but is NOT admin
        if (
            !adminEmail ||
            user.email?.toLowerCase() !==
            adminEmail.toLowerCase()
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

        // Correct admin
        return response;
    }

    return response;
}

export const config = {
    matcher: [
        "/admin/:path*",
    ],
};