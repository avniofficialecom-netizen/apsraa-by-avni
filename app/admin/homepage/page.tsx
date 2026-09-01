"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminNavbar from "../../../components/AdminNavbar";
import Footer from "../../../components/Footer";
import { supabase } from "../../../lib/supabase";

type StoreSettings = {
    id: number;
    collection_discovery_new_arrivals_image_url: string | null;
    collection_discovery_best_sellers_image_url: string | null;
    collection_discovery_trending_image_url: string | null;
};

type CardKey =
    | "newArrivals"
    | "bestSellers"
    | "trending";

type CardState = {
    key: CardKey;
    title: string;
    eyebrow: string;
    description: string;
    field:
        | "collection_discovery_new_arrivals_image_url"
        | "collection_discovery_best_sellers_image_url"
        | "collection_discovery_trending_image_url";
    value: string;
};

const CARD_META: Omit<CardState, "value">[] = [
    {
        key: "newArrivals",
        title: "New Arrivals",
        eyebrow: "Just in",
        description: "Image shown on the homepage New Arrivals card.",
        field: "collection_discovery_new_arrivals_image_url",
    },
    {
        key: "bestSellers",
        title: "Best Sellers",
        eyebrow: "Loved by customers",
        description: "Image shown on the homepage Best Sellers card.",
        field: "collection_discovery_best_sellers_image_url",
    },
    {
        key: "trending",
        title: "Trending Now",
        eyebrow: "What's catching attention",
        description: "Image shown on the homepage Trending Now card.",
        field: "collection_discovery_trending_image_url",
    },
];

export default function HomepageSettingsPage() {
    const [settings, setSettings] =
        useState<StoreSettings | null>(null);

    const [values, setValues] =
        useState<Record<CardKey, string>>({
            newArrivals: "",
            bestSellers: "",
            trending: "",
        });

    const [files, setFiles] =
        useState<Record<CardKey, File | null>>({
            newArrivals: null,
            bestSellers: null,
            trending: null,
        });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        void loadSettings();
    }, []);

    async function loadSettings() {
        setLoading(true);
        setMessage("");

        const { data, error } = await supabase
            .from("store_settings")
            .select(
                "id, collection_discovery_new_arrivals_image_url, collection_discovery_best_sellers_image_url, collection_discovery_trending_image_url"
            )
            .order("id", { ascending: true })
            .limit(1)
            .maybeSingle();

        if (error) {
            setMessage(error.message);
            setLoading(false);
            return;
        }

        if (!data) {
            setMessage(
                "No store settings row was found. Run the database migration first."
            );
            setLoading(false);
            return;
        }

        const row = data as StoreSettings;

        setSettings(row);
        setValues({
            newArrivals:
                row.collection_discovery_new_arrivals_image_url ?? "",
            bestSellers:
                row.collection_discovery_best_sellers_image_url ?? "",
            trending:
                row.collection_discovery_trending_image_url ?? "",
        });

        setLoading(false);
    }

    async function uploadImage(file: File) {
        const safeName = file.name
            .replace(/[^a-zA-Z0-9._-]/g, "-")
            .replace(/-+/g, "-");

        const fileName = `homepage-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 10)}-${safeName}`;

        const { error } = await supabase.storage
            .from("products")
            .upload(fileName, file, {
                upsert: false,
            });

        if (error) {
            throw error;
        }

        const { data } = supabase.storage
            .from("products")
            .getPublicUrl(fileName);

        return data.publicUrl;
    }

    async function saveAll() {
        if (!settings) return;

        try {
            setSaving(true);
            setMessage("");

            const nextValues = {
                ...values,
            };

            for (const card of CARD_META) {
                const file = files[card.key];

                if (file) {
                    nextValues[card.key] =
                        await uploadImage(file);
                }
            }

            const { error } = await supabase
                .from("store_settings")
                .update({
                    collection_discovery_new_arrivals_image_url:
                        nextValues.newArrivals || null,
                    collection_discovery_best_sellers_image_url:
                        nextValues.bestSellers || null,
                    collection_discovery_trending_image_url:
                        nextValues.trending || null,
                })
                .eq("id", settings.id);

            if (error) {
                throw error;
            }

            setValues(nextValues);

            setFiles({
                newArrivals: null,
                bestSellers: null,
                trending: null,
            });

            setMessage(
                "Homepage collection images saved successfully."
            );
        } catch (error) {
            console.error(
                "Homepage collection settings save error:",
                error
            );

            setMessage(
                error instanceof Error
                    ? error.message
                    : "Unable to save homepage images."
            );
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <>
                <AdminNavbar />

                <main className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                        <div className="text-4xl">💎</div>
                        <h1 className="mt-4 text-xl font-bold text-slate-900">
                            Loading Homepage Settings
                        </h1>
                        <p className="mt-2 text-sm text-slate-500">
                            Connecting to your store settings...
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

            <main className="min-h-screen bg-slate-100 pb-16">
                <section className="border-b border-slate-200 bg-white">
                    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                        <Link
                            href="/admin"
                            className="text-sm font-semibold text-pink-600 hover:underline"
                        >
                            ← Back to Dashboard
                        </Link>

                        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-pink-600">
                            APSRAA ADMIN
                        </p>

                        <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
                            Homepage Collection Discovery
                        </h1>

                        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                            Change the three collection-card images shown
                            directly below the homepage hero. You can replace
                            them whenever you want without editing page.tsx.
                        </p>
                    </div>
                </section>

                <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    <div className="grid gap-6 lg:grid-cols-3">
                        {CARD_META.map((card) => {
                            const image = values[card.key];

                            return (
                                <article
                                    key={card.key}
                                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                                >
                                    <div className="relative aspect-[4/3] bg-[#eee7e2]">
                                        {image ? (
                                            <img
                                                src={image}
                                                alt={card.title}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-sm text-slate-400">
                                                Product fallback will be used
                                            </div>
                                        )}

                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-5 pt-16">
                                            <p className="text-[9px] uppercase tracking-[0.25em] text-white/80">
                                                {card.eyebrow}
                                            </p>

                                            <h2 className="mt-2 text-2xl font-medium text-white">
                                                {card.title}
                                            </h2>
                                        </div>
                                    </div>

                                    <div className="p-5">
                                        <p className="text-xs leading-5 text-slate-500">
                                            {card.description}
                                        </p>

                                        <label className="mt-5 block text-sm font-semibold text-slate-800">
                                            Upload new image
                                        </label>

                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(event) => {
                                                const file =
                                                    event.target.files?.[0] ??
                                                    null;

                                                setFiles((current) => ({
                                                    ...current,
                                                    [card.key]: file,
                                                }));
                                            }}
                                            className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm"
                                        />

                                        <label className="mt-4 block text-sm font-semibold text-slate-800">
                                            Or use image URL
                                        </label>

                                        <input
                                            type="url"
                                            value={image}
                                            onChange={(event) =>
                                                setValues((current) => ({
                                                    ...current,
                                                    [card.key]:
                                                        event.target.value,
                                                }))
                                            }
                                            placeholder="https://..."
                                            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-pink-500"
                                        />

                                        {files[card.key] && (
                                            <p className="mt-2 text-xs text-pink-600">
                                                New file selected:{" "}
                                                {files[card.key]?.name}
                                            </p>
                                        )}
                                    </div>
                                </article>
                            );
                        })}
                    </div>

                    <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-pink-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="font-semibold text-slate-900">
                                Changes apply to the homepage
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                                The existing product fallbacks remain in place
                                if an image is removed.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => void saveAll()}
                            disabled={saving}
                            className="rounded-xl bg-pink-600 px-7 py-3.5 font-semibold text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {saving
                                ? "Saving..."
                                : "Save Homepage Images"}
                        </button>
                    </div>

                    {message && (
                        <div
                            className={`mt-5 rounded-xl border px-5 py-4 text-sm ${
                                message.includes("successfully")
                                    ? "border-green-200 bg-green-50 text-green-700"
                                    : "border-red-200 bg-red-50 text-red-700"
                            }`}
                        >
                            {message}
                        </div>
                    )}
                </section>
            </main>

            <Footer />
        </>
    );
}
