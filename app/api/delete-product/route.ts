import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase-admin";

export async function POST(req: Request) {
    try {
        const { id } = await req.json();

        if (!id) {
            return NextResponse.json(
                { success: false, message: "Product ID is required." },
                { status: 400 }
            );
        }

        const { error } = await supabaseAdmin
            .from("products")
            .delete()
            .eq("id", id);

        if (error) {
            return NextResponse.json(
                {
                    success: false,
                    message: error.message,
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Product deleted successfully.",
        });

    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                success: false,
                message: "Internal server error.",
            },
            { status: 500 }
        );
    }
}