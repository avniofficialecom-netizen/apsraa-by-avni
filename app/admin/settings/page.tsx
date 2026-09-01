"use client";

import {
    ChangeEvent,
    FormEvent,
    useEffect,
    useState,
} from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "../../../components/AdminNavbar";
import Footer from "../../../components/Footer";

type Settings = {
    hero_image_url: string;
    hero_badge: string;
    hero_title: string;
    hero_description: string;
    hero_button_one_text: string;
    hero_button_one_link: string;
    hero_button_two_text: string;
    hero_button_two_link: string;
    hero_enabled: boolean;
};

const DEFAULT_SETTINGS: Settings = {
    hero_image_url: "/images/product1.jpg",
    hero_badge: "✨ Premium Collection 2026",
    hero_title: "Elegance That Lasts",
    hero_description:
        "Premium Artificial Jewellery For Every Occasion.",
    hero_button_one_text: "Shop Collection",
    hero_button_one_link: "/shop",
    hero_button_two_text: "Explore Categories",
    hero_button_two_link: "/products/categories",
    hero_enabled: true,
};

export default function StoreSettingsPage() {
    const router = useRouter();

    const [settings, setSettings] =
        useState<Settings>(DEFAULT_SETTINGS);

    const [selectedFile, setSelectedFile] =
        useState<File | null>(null);

    const [previewUrl, setPreviewUrl] =
        useState<string>(
            DEFAULT_SETTINGS.hero_image_url
        );

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [message, setMessage] =
        useState("");

    const [error, setError] =
        useState("");

    // =====================================================
    // LOAD SETTINGS
    // =====================================================

    useEffect(() => {
        let cancelled = false;

        async function loadSettings() {
            try {
                setLoading(true);
                setError("");

                const response = await fetch(
                    "/api/admin/settings",
                    {
                        method: "GET",
                        credentials: "include",
                        cache: "no-store",
                        headers: {
                            Accept:
                                "application/json",
                        },
                    }
                );

                const result =
                    await response.json();

                if (
                    response.status === 401 ||
                    response.status === 403
                ) {
                    router.replace(
                        "/admin/login"
                    );
                    return;
                }

                if (
                    !response.ok ||
                    !result.success
                ) {
                    throw new Error(
                        result.message ||
                        "Unable to load store settings."
                    );
                }

                if (
                    !cancelled &&
                    result.settings
                ) {
                    const loaded: Settings = {
                        ...DEFAULT_SETTINGS,
                        ...result.settings,
                    };

                    setSettings(loaded);

                    setPreviewUrl(
                        loaded.hero_image_url
                    );
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Unable to load store settings."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        void loadSettings();

        return () => {
            cancelled = true;
        };
    }, [router]);

    // =====================================================
    // UPDATE FIELD
    // =====================================================

    function updateField(
        field: keyof Settings,
        value: string | boolean
    ) {
        setSettings((current) => ({
            ...current,
            [field]: value,
        }));

        setMessage("");
        setError("");
    }

    // =====================================================
    // IMAGE SELECT
    // =====================================================

    function handleImageChange(
        event: ChangeEvent<HTMLInputElement>
    ) {
        const file =
            event.target.files?.[0];

        if (!file) {
            return;
        }

        if (!file.type.startsWith("image/")) {
            setError(
                "Please select a valid image file."
            );
            return;
        }

        if (
            file.size >
            10 * 1024 * 1024
        ) {
            setError(
                "Image must be smaller than 10 MB."
            );
            return;
        }

        setSelectedFile(file);
        setMessage("");
        setError("");

        const objectUrl =
            URL.createObjectURL(file);

        setPreviewUrl(objectUrl);
    }

    // =====================================================
    // SAVE SETTINGS
    // =====================================================

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        try {
            setSaving(true);
            setMessage("");
            setError("");

            const formData =
                new FormData();

            formData.append(
                "hero_badge",
                settings.hero_badge
            );

            formData.append(
                "hero_title",
                settings.hero_title
            );

            formData.append(
                "hero_description",
                settings.hero_description
            );

            formData.append(
                "hero_button_one_text",
                settings.hero_button_one_text
            );

            formData.append(
                "hero_button_one_link",
                settings.hero_button_one_link
            );

            formData.append(
                "hero_button_two_text",
                settings.hero_button_two_text
            );

            formData.append(
                "hero_button_two_link",
                settings.hero_button_two_link
            );

            formData.append(
                "hero_enabled",
                String(settings.hero_enabled)
            );

            if (selectedFile) {
                formData.append(
                    "hero_image",
                    selectedFile
                );
            }

            // IMPORTANT:
            // API route uses PUT, not POST.
            const response =
                await fetch(
                    "/api/admin/settings",
                    {
                        method: "PUT",
                        credentials: "include",
                        body: formData,
                    }
                );

            const result =
                await response.json();

            if (
                response.status === 401 ||
                response.status === 403
            ) {
                router.replace(
                    "/admin/login"
                );
                return;
            }

            if (
                !response.ok ||
                !result.success
            ) {
                throw new Error(
                    result.message ||
                    "Unable to save store settings."
                );
            }

            if (result.settings) {
                const saved: Settings = {
                    ...DEFAULT_SETTINGS,
                    ...result.settings,
                };

                setSettings(saved);

                setPreviewUrl(
                    saved.hero_image_url
                );
            }

            setSelectedFile(null);

            setMessage(
                "Homepage settings saved successfully."
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to save store settings."
            );
        } finally {
            setSaving(false);
        }
    }

    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {
        return (
            <>
                <AdminNavbar />

                <main className="min-h-screen bg-slate-100 flex items-center justify-center">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 px-8 py-10 text-center">

                        <div className="text-5xl mb-4 animate-pulse">
                            💎
                        </div>

                        <h1 className="text-xl font-bold text-slate-900">
                            Loading Store Settings
                        </h1>

                        <p className="text-slate-500 mt-2">
                            Please wait...
                        </p>

                    </div>
                </main>

                <Footer />
            </>
        );
    }

    return (
        <>
            <AdminNavbar />

            <main className="min-h-screen bg-slate-100 py-8">

                <div className="max-w-6xl mx-auto px-4">

                    {/* HEADER */}

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">

                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                            <div>

                                <h1 className="text-3xl font-bold text-slate-900">
                                    Store Settings
                                </h1>

                                <p className="text-slate-500 mt-1">
                                    Manage your homepage hero section.
                                </p>

                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    router.push("/")
                                }
                                className="border border-slate-300 px-5 py-2.5 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 transition"
                            >
                                View Homepage
                            </button>

                        </div>

                    </div>

                    {/* SUCCESS */}

                    {message && (
                        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-5 py-4 mb-5">
                            ✅ {message}
                        </div>
                    )}

                    {/* ERROR */}

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4 mb-5">
                            ⚠️ {error}
                        </div>
                    )}

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-6"
                    >

                        {/* =================================================
                            HERO IMAGE
                        ================================================= */}

                        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">

                            <div className="mb-5">

                                <h2 className="text-xl font-bold text-slate-900">
                                    Homepage Hero Image
                                </h2>

                                <p className="text-sm text-slate-500 mt-1">
                                    Upload the main image displayed on your homepage.
                                </p>

                            </div>

                            <div className="grid lg:grid-cols-2 gap-6">

                                <div>

                                    <div className="border-2 border-dashed border-slate-300 rounded-2xl p-4 bg-slate-50">

                                        <img
                                            src={previewUrl}
                                            alt="Homepage hero preview"
                                            className="w-full h-[420px] object-cover rounded-xl"
                                        />

                                    </div>

                                </div>

                                <div className="flex flex-col justify-center">

                                    <label className="block">

                                        <span className="text-sm font-semibold text-slate-700">
                                            Choose New Image
                                        </span>

                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp,image/avif"
                                            onChange={
                                                handleImageChange
                                            }
                                            className="mt-2 block w-full text-sm text-slate-600 border border-slate-300 rounded-lg p-3 bg-white cursor-pointer"
                                        />

                                    </label>

                                    {selectedFile && (
                                        <div className="mt-4 bg-pink-50 border border-pink-100 rounded-xl p-4">

                                            <p className="font-semibold text-pink-700">
                                                New image selected
                                            </p>

                                            <p className="text-sm text-slate-600 mt-1 break-all">
                                                {selectedFile.name}
                                            </p>

                                            <p className="text-xs text-slate-500 mt-1">
                                                {(
                                                    selectedFile.size /
                                                    1024 /
                                                    1024
                                                ).toFixed(
                                                    2
                                                )}{" "}
                                                MB
                                            </p>

                                        </div>
                                    )}

                                    <p className="text-xs text-slate-500 mt-4">
                                        Recommended: high-quality JPG, PNG, WebP or AVIF.
                                        Maximum size: 10 MB.
                                    </p>

                                </div>

                            </div>

                        </section>

                        {/* =================================================
                            HERO CONTENT
                        ================================================= */}

                        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">

                            <h2 className="text-xl font-bold text-slate-900 mb-5">
                                Hero Content
                            </h2>

                            <div className="space-y-5">

                                <div>

                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Collection Badge
                                    </label>

                                    <input
                                        type="text"
                                        value={
                                            settings.hero_badge
                                        }
                                        onChange={(event) =>
                                            updateField(
                                                "hero_badge",
                                                event.target.value
                                            )
                                        }
                                        className="w-full border border-slate-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-pink-500"
                                    />

                                </div>

                                <div>

                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Main Heading
                                    </label>

                                    <input
                                        type="text"
                                        value={
                                            settings.hero_title
                                        }
                                        onChange={(event) =>
                                            updateField(
                                                "hero_title",
                                                event.target.value
                                            )
                                        }
                                        className="w-full border border-slate-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-pink-500"
                                    />

                                </div>

                                <div>

                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Description
                                    </label>

                                    <textarea
                                        value={
                                            settings.hero_description
                                        }
                                        onChange={(event) =>
                                            updateField(
                                                "hero_description",
                                                event.target.value
                                            )
                                        }
                                        rows={4}
                                        className="w-full border border-slate-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-pink-500 resize-y"
                                    />

                                </div>

                            </div>

                        </section>

                        {/* =================================================
                            HERO BUTTONS
                        ================================================= */}

                        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">

                            <h2 className="text-xl font-bold text-slate-900 mb-5">
                                Hero Buttons
                            </h2>

                            <div className="grid md:grid-cols-2 gap-6">

                                {/* PRIMARY */}

                                <div className="border border-slate-200 rounded-xl p-5">

                                    <h3 className="font-bold text-slate-900 mb-4">
                                        Primary Button
                                    </h3>

                                    <div className="space-y-4">

                                        <div>

                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                Button Text
                                            </label>

                                            <input
                                                type="text"
                                                value={
                                                    settings.hero_button_one_text
                                                }
                                                onChange={(event) =>
                                                    updateField(
                                                        "hero_button_one_text",
                                                        event.target.value
                                                    )
                                                }
                                                className="w-full border border-slate-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-pink-500"
                                            />

                                        </div>

                                        <div>

                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                Button Link
                                            </label>

                                            <input
                                                type="text"
                                                value={
                                                    settings.hero_button_one_link
                                                }
                                                onChange={(event) =>
                                                    updateField(
                                                        "hero_button_one_link",
                                                        event.target.value
                                                    )
                                                }
                                                className="w-full border border-slate-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-pink-500"
                                            />

                                        </div>

                                    </div>

                                </div>

                                {/* SECONDARY */}

                                <div className="border border-slate-200 rounded-xl p-5">

                                    <h3 className="font-bold text-slate-900 mb-4">
                                        Secondary Button
                                    </h3>

                                    <div className="space-y-4">

                                        <div>

                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                Button Text
                                            </label>

                                            <input
                                                type="text"
                                                value={
                                                    settings.hero_button_two_text
                                                }
                                                onChange={(event) =>
                                                    updateField(
                                                        "hero_button_two_text",
                                                        event.target.value
                                                    )
                                                }
                                                className="w-full border border-slate-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-pink-500"
                                            />

                                        </div>

                                        <div>

                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                Button Link
                                            </label>

                                            <input
                                                type="text"
                                                value={
                                                    settings.hero_button_two_link
                                                }
                                                onChange={(event) =>
                                                    updateField(
                                                        "hero_button_two_link",
                                                        event.target.value
                                                    )
                                                }
                                                className="w-full border border-slate-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-pink-500"
                                            />

                                        </div>

                                    </div>

                                </div>

                            </div>

                        </section>

                        {/* =================================================
                            HERO ENABLE
                        ================================================= */}

                        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">

                            <div className="flex items-center justify-between gap-4">

                                <div>

                                    <h2 className="font-bold text-slate-900">
                                        Homepage Hero
                                    </h2>

                                    <p className="text-sm text-slate-500 mt-1">
                                        Turn the hero section on or off.
                                    </p>

                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        updateField(
                                            "hero_enabled",
                                            !settings.hero_enabled
                                        )
                                    }
                                    className={`relative inline-flex h-7 w-14 items-center rounded-full transition ${
                                        settings.hero_enabled
                                            ? "bg-pink-600"
                                            : "bg-slate-300"
                                    }`}
                                    aria-label="Toggle homepage hero"
                                >

                                    <span
                                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                                            settings.hero_enabled
                                                ? "translate-x-8"
                                                : "translate-x-1"
                                        }`}
                                    />

                                </button>

                            </div>

                        </section>

                        {/* =================================================
                            SAVE
                        ================================================= */}

                        <div className="flex justify-end pb-10">

                            <button
                                type="submit"
                                disabled={saving}
                                className="bg-pink-600 hover:bg-pink-700 disabled:bg-pink-300 text-white px-8 py-3.5 rounded-xl font-bold shadow-sm transition"
                            >
                                {saving
                                    ? "Saving..."
                                    : "💾 Save Changes"}
                            </button>

                        </div>

                    </form>

                </div>

            </main>

            <Footer />
        </>
    );
}