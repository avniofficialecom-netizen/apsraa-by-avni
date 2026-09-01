import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAdmin } from "../../../../lib/supabase-admin";

export const dynamic = "force-dynamic";

type StoreSettings = {
    id: number;
    hero_image_url: string | null;
    hero_badge: string | null;
    hero_title: string | null;
    hero_description: string | null;
    hero_button_one_text: string | null;
    hero_button_one_link: string | null;
    hero_button_two_text: string | null;
    hero_button_two_link: string | null;
    hero_enabled: boolean;
    created_at: string;
    updated_at: string;
};

async function authenticateAdmin() {
    const cookieStore = await cookies();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },

                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(
                            ({ name, value, options }) => {
                                cookieStore.set(
                                    name,
                                    value,
                                    options
                                );
                            }
                        );
                    } catch {
                        // Middleware handles cookie updates.
                    }
                },
            },
        }
    );

    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error || !user) {
        return {
            success: false,
            status: 401,
            message: "Unauthorized. Admin login required.",
        };
    }

    const adminEmail =
        process.env.ADMIN_EMAIL ||
        process.env.NEXT_PUBLIC_ADMIN_EMAIL;

    if (!adminEmail) {
        return {
            success: false,
            status: 500,
            message: "Admin configuration is missing.",
        };
    }

    const loggedInEmail =
        user.email?.trim().toLowerCase();

    const configuredAdminEmail =
        adminEmail.trim().toLowerCase();

    if (
        !loggedInEmail ||
        loggedInEmail !== configuredAdminEmail
    ) {
        return {
            success: false,
            status: 403,
            message: "Forbidden. Admin access required.",
        };
    }

    return {
        success: true,
        status: 200,
        user,
    };
}

// ======================================================
// GET SETTINGS
// ======================================================

export async function GET() {
    try {
        const auth = await authenticateAdmin();

        if (!auth.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: auth.message,
                },
                {
                    status: auth.status,
                }
            );
        }

        const {
            data,
            error,
        } = await supabaseAdmin
            .from("store_settings")
            .select("*")
            .order("id", { ascending: true })
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error(
                "Store Settings GET Error:",
                error
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Unable to load store settings.",
                },
                {
                    status: 500,
                }
            );
        }

        // If the table exists but has no row, create one.
        if (!data) {
            const { data: created, error: createError } =
                await supabaseAdmin
                    .from("store_settings")
                    .insert({
                        hero_image_url:
                            "/images/product1.jpg",
                        hero_badge:
                            "✨ Premium Collection 2026",
                        hero_title:
                            "Elegance That Lasts",
                        hero_description:
                            "Premium Artificial Jewellery For Every Occasion.",
                        hero_button_one_text:
                            "Shop Collection",
                        hero_button_one_link:
                            "/shop",
                        hero_button_two_text:
                            "Explore Categories",
                        hero_button_two_link:
                            "/products/categories",
                        hero_enabled: true,
                    })
                    .select("*")
                    .single();

            if (createError || !created) {
                console.error(
                    "Store Settings Create Error:",
                    createError
                );

                return NextResponse.json(
                    {
                        success: false,
                        message:
                            "Unable to initialize store settings.",
                    },
                    {
                        status: 500,
                    }
                );
            }

            return NextResponse.json({
                success: true,
                settings: created,
            });
        }

        return NextResponse.json({
            success: true,
            settings: data as StoreSettings,
        });
    } catch (error) {
        console.error(
            "Store Settings GET API Error:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                message: "Internal server error.",
            },
            {
                status: 500,
            }
        );
    }
}

// ======================================================
// UPDATE SETTINGS
// ======================================================

export async function PUT(req: Request) {
    try {
        const auth = await authenticateAdmin();

        if (!auth.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: auth.message,
                },
                {
                    status: auth.status,
                }
            );
        }

        const formData = await req.formData();

        const heroBadge =
            String(
                formData.get("hero_badge") ?? ""
            ).trim();

        const heroTitle =
            String(
                formData.get("hero_title") ?? ""
            ).trim();

        const heroDescription =
            String(
                formData.get("hero_description") ?? ""
            ).trim();

        const heroButtonOneText =
            String(
                formData.get(
                    "hero_button_one_text"
                ) ?? ""
            ).trim();

        const heroButtonOneLink =
            String(
                formData.get(
                    "hero_button_one_link"
                ) ?? ""
            ).trim();

        const heroButtonTwoText =
            String(
                formData.get(
                    "hero_button_two_text"
                ) ?? ""
            ).trim();

        const heroButtonTwoLink =
            String(
                formData.get(
                    "hero_button_two_link"
                ) ?? ""
            ).trim();

        const heroEnabled =
            String(
                formData.get("hero_enabled") ?? "true"
            ) === "true";

        if (!heroTitle) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Hero title is required.",
                },
                {
                    status: 400,
                }
            );
        }

        if (!heroDescription) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Hero description is required.",
                },
                {
                    status: 400,
                }
            );
        }

        if (!heroButtonOneText) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "First button text is required.",
                },
                {
                    status: 400,
                }
            );
        }

        if (!heroButtonOneLink) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "First button link is required.",
                },
                {
                    status: 400,
                }
            );
        }

        if (!heroButtonTwoText) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Second button text is required.",
                },
                {
                    status: 400,
                }
            );
        }

        if (!heroButtonTwoLink) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Second button link is required.",
                },
                {
                    status: 400,
                }
            );
        }

        // ----------------------------------------------
        // Get current settings
        // ----------------------------------------------

        const {
            data: currentSettings,
            error: currentError,
        } = await supabaseAdmin
            .from("store_settings")
            .select("*")
            .order("id", { ascending: true })
            .limit(1)
            .maybeSingle();

        if (currentError) {
            console.error(
                "Current Settings Fetch Error:",
                currentError
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Unable to read current settings.",
                },
                {
                    status: 500,
                }
            );
        }

        if (!currentSettings) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Store settings record does not exist.",
                },
                {
                    status: 404,
                }
            );
        }

        let heroImageUrl =
            currentSettings.hero_image_url;

        let uploadedFilePath: string | null = null;

        // ----------------------------------------------
        // Upload new hero image if supplied
        // ----------------------------------------------

        const image = formData.get("hero_image");

        if (image instanceof File && image.size > 0) {
            const allowedTypes = [
                "image/jpeg",
                "image/jpg",
                "image/png",
                "image/webp",
                "image/avif",
            ];

            if (!allowedTypes.includes(image.type)) {
                return NextResponse.json(
                    {
                        success: false,
                        message:
                            "Only JPG, PNG, WEBP or AVIF images are allowed.",
                    },
                    {
                        status: 400,
                    }
                );
            }

            const maxSize =
                10 * 1024 * 1024;

            if (image.size > maxSize) {
                return NextResponse.json(
                    {
                        success: false,
                        message:
                            "Hero image must be 10 MB or smaller.",
                    },
                    {
                        status: 400,
                    }
                );
            }

            const extension =
                image.name
                    .split(".")
                    .pop()
                    ?.toLowerCase() || "jpg";

            const filePath =
                `hero-${Date.now()}-${Math.random()
                    .toString(36)
                    .slice(2, 9)}.${extension}`;

            uploadedFilePath = filePath;

            const arrayBuffer =
                await image.arrayBuffer();

            const buffer =
                Buffer.from(arrayBuffer);

            const {
                error: uploadError,
            } = await supabaseAdmin.storage
                .from("hero-images")
                .upload(
                    filePath,
                    buffer,
                    {
                        contentType: image.type,
                        cacheControl: "3600",
                        upsert: false,
                    }
                );

            if (uploadError) {
                console.error(
                    "Hero Image Upload Error:",
                    uploadError
                );

                return NextResponse.json(
                    {
                        success: false,
                        message:
                            "Hero image upload failed.",
                    },
                    {
                        status: 500,
                    }
                );
            }

            const {
                data: publicUrlData,
            } =
                supabaseAdmin.storage
                    .from("hero-images")
                    .getPublicUrl(filePath);

            heroImageUrl =
                publicUrlData.publicUrl;
        }

        // ----------------------------------------------
        // Update database
        // ----------------------------------------------

        const {
            data: updatedSettings,
            error: updateError,
        } = await supabaseAdmin
            .from("store_settings")
            .update({
                hero_image_url:
                heroImageUrl,
                hero_badge:
                heroBadge,
                hero_title:
                heroTitle,
                hero_description:
                heroDescription,
                hero_button_one_text:
                heroButtonOneText,
                hero_button_one_link:
                heroButtonOneLink,
                hero_button_two_text:
                heroButtonTwoText,
                hero_button_two_link:
                heroButtonTwoLink,
                hero_enabled:
                heroEnabled,
                updated_at:
                    new Date().toISOString(),
            })
            .eq(
                "id",
                currentSettings.id
            )
            .select("*")
            .single();

        if (updateError || !updatedSettings) {
            console.error(
                "Store Settings Update Error:",
                updateError
            );

            // Clean up newly uploaded image if DB update failed.
            if (uploadedFilePath) {
                await supabaseAdmin.storage
                    .from("hero-images")
                    .remove([
                        uploadedFilePath,
                    ]);
            }

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Settings could not be saved.",
                },
                {
                    status: 500,
                }
            );
        }

        return NextResponse.json({
            success: true,
            message:
                "Store settings saved successfully.",
            settings:
            updatedSettings,
        });
    } catch (error) {
        console.error(
            "Store Settings PUT API Error:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                message: "Internal server error.",
            },
            {
                status: 500,
            }
        );
    }
}