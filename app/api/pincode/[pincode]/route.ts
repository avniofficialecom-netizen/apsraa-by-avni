import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    context: {
        params: Promise<{
            pincode: string;
        }>;
    }
) {
    try {
        const { pincode } = await context.params;

        const cleanPincode = String(pincode || "")
            .replace(/\D/g, "")
            .slice(0, 6);

        if (cleanPincode.length !== 6) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Please enter a valid 6-digit PIN code.",
                },
                { status: 400 }
            );
        }

        const apiUrl =
            `https://api.postalpincode.in/pincode/${cleanPincode}`;

        const response = await fetch(apiUrl, {
            method: "GET",
            cache: "no-store",
        });

        if (!response.ok) {
            console.error(
                "PIN API HTTP ERROR:",
                response.status
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Unable to verify PIN code right now.",
                },
                { status: 502 }
            );
        }

        const result = await response.json();

        console.log(
            "PIN API RESPONSE:",
            JSON.stringify(result)
        );

        if (
            !Array.isArray(result) ||
            result.length === 0
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Invalid PIN Code. Please check and try again.",
                },
                { status: 404 }
            );
        }

        const postalData = result[0];

        if (
            postalData?.Status !== "Success" ||
            !Array.isArray(
                postalData?.PostOffice
            ) ||
            postalData.PostOffice.length === 0
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Invalid PIN Code. Please check and try again.",
                },
                { status: 404 }
            );
        }

        const postOffice =
            postalData.PostOffice[0];

        const city =
            postOffice.District ||
            postOffice.Block ||
            postOffice.Name ||
            "";

        const state =
            postOffice.State || "";

        return NextResponse.json({
            success: true,
            pincode: cleanPincode,
            city,
            state,
        });
    } catch (error) {
        console.error(
            "PIN ROUTE ERROR:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                message:
                    "Unable to verify PIN code right now. Please try again.",
            },
            { status: 500 }
        );
    }
}