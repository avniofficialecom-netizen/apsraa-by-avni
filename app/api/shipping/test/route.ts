import { NextResponse } from "next/server";

export async function GET() {
    try {
        const email = process.env.SHIPROCKET_EMAIL;
        const password = process.env.SHIPROCKET_PASSWORD;

        if (!email || !password) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Shiprocket credentials are missing.",
                },
                { status: 500 }
            );
        }

        const response = await fetch(
            "https://apiv2.shiprocket.in/v1/external/auth/login",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    password,
                }),
                cache: "no-store",
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("Shiprocket authentication failed:", data);

            return NextResponse.json(
                {
                    success: false,
                    message: "Shiprocket authentication failed.",
                    shiprocketStatus: response.status,
                },
                { status: 502 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Shiprocket API connection successful.",
            authenticated: true,
        });
    } catch (error) {
        console.error("Shiprocket test error:", error);

        return NextResponse.json(
            {
                success: false,
                message:
                    error instanceof Error
                        ? error.message
                        : "Shiprocket connection failed.",
            },
            { status: 500 }
        );
    }
}