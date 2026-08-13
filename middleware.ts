import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
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
                        ({ name, value, options }) => {
                            request.cookies.set(name, value);

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

    /*
     * IMPORTANT:
     * getUser() refreshes/validates the Supabase session
     * and allows the SSR client to update the cookies.
     */
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const pathname = request.nextUrl.pathname;

    const adminEmail =
        process.env.NEXT_PUBLIC_ADMIN_EMAIL
            ?.trim()
            .toLowerCase();

    const isAdminRoute =
        pathname.startsWith("/admin");

    const isLoginPage =
        pathname === "/admin/login";

    console.log(
        "MIDDLEWARE:",
        pathname,
        "USER:",
        user?.email || "none",
        "ADMIN:",
        adminEmail || "missing"
    );

    // ==========================================
    // /admin/login
    // ==========================================

    if (isLoginPage) {
        // No session → show login page
        if (!user) {
            return response;
        }

        // Correct admin → dashboard
        if (
            adminEmail &&
            user.email?.trim().toLowerCase() ===
            adminEmail
        ) {
            const url =
                request.nextUrl.clone();

            url.pathname = "/admin";

            return NextResponse.redirect(url);
        }

        // Logged-in non-admin
        await supabase.auth.signOut();

        return response;
    }

    // ==========================================
    // ALL /admin ROUTES
    // ==========================================

    if (isAdminRoute) {
        // No session → login
        if (!user) {
            const url =
                request.nextUrl.clone();

            url.pathname = "/admin/login";

            return NextResponse.redirect(url);
        }

        // Admin email missing
        if (!adminEmail) {
            console.error(
                "NEXT_PUBLIC_ADMIN_EMAIL is missing."
            );

            return response;
        }

        // Wrong user
        if (
            user.email?.trim().toLowerCase() !==
            adminEmail
        ) {
            console.warn(
                "Unauthorized admin:",
                user.email
            );

            await supabase.auth.signOut();

            const url =
                request.nextUrl.clone();

            url.pathname = "/admin/login";

            return NextResponse.redirect(url);
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