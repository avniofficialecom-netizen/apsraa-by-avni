import Link from "next/link";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import { supabase } from "../../../lib/supabase";

export const dynamic = "force-dynamic";

type Product = {
    id: number;
    category: string | null;
};

type Category = {
    value: string;
    label: string;
    emoji: string;
    aliases?: string[];
};

const JEWELLERY_CATEGORIES: Category[] = [
    {
        value: "earrings",
        label: "Earrings",
        emoji: "✨",
        aliases: ["earrings", "earrrings"],
    },
    {
        value: "jhumkas",
        label: "Jhumkas",
        emoji: "💎",
        aliases: ["jhumkas", "jhumka"],
    },
    {
        value: "necklaces",
        label: "Necklaces",
        emoji: "📿",
        aliases: ["necklaces", "necklace"],
    },
    {
        value: "chokers",
        label: "Chokers",
        emoji: "👑",
        aliases: ["chokers", "choker", "choker set", "choke set"],
    },
    {
        value: "jewellery-sets",
        label: "Jewellery Sets",
        emoji: "💍",
        aliases: [
            "jewellery-sets",
            "jewellery sets",
            "jewelry sets",
            "jewelry-set",
        ],
    },
    {
        value: "anklets",
        label: "Anklets / Payal",
        emoji: "✨",
        aliases: [
            "anklets",
            "anklet",
            "payal",
            "payals",
        ],
    },
    {
        value: "maang-tikka",
        label: "Maang Tikka",
        emoji: "👸",
        aliases: [
            "maang-tikka",
            "maang tikka",
            "maangtikka",
        ],
    },
    {
        value: "rings",
        label: "Rings",
        emoji: "💍",
        aliases: ["rings", "ring"],
    },
    {
        value: "bangles",
        label: "Bangles / Bracelets",
        emoji: "✨",
        aliases: [
            "bangles",
            "bangle",
            "bracelets",
            "bracelet",
        ],
    },
];

const CLOTHING_CATEGORIES: Category[] = [
    {
        value: "kurtis",
        label: "Kurtis",
        emoji: "👗",
        aliases: ["kurtis", "kurti"],
    },
    {
        value: "cotton-kurtis",
        label: "Cotton Kurtis",
        emoji: "🌸",
        aliases: ["cotton-kurtis", "cotton kurtis"],
    },
    {
        value: "breastfeeding-kurtis",
        label: "Breastfeeding / Nursing Kurtis",
        emoji: "💕",
        aliases: [
            "breastfeeding-kurtis",
            "breastfeeding kurtis",
            "nursing kurtis",
            "nursing kurti",
        ],
    },
    {
        value: "kurti-sets",
        label: "Kurti Sets",
        emoji: "👗",
        aliases: [
            "kurti-sets",
            "kurti sets",
            "kurti set",
        ],
    },
    {
        value: "dresses",
        label: "Dresses",
        emoji: "✨",
        aliases: ["dresses", "dress"],
    },
    {
        value: "co-ord-sets",
        label: "Co-ord Sets",
        emoji: "🌷",
        aliases: [
            "co-ord-sets",
            "co ord sets",
            "co-ord sets",
            "coord sets",
        ],
    },
];

const ALL_CATEGORIES = [
    ...JEWELLERY_CATEGORIES,
    ...CLOTHING_CATEGORIES,
];

function normalizeCategory(
    value: string | null | undefined
) {
    return String(value || "")
        .trim()
        .toLowerCase();
}

export default async function CategoriesPage() {
    let products: Product[] = [];

    try {
        const { data, error } = await supabase
            .from("products")
            .select("id, category");

        if (error) {
            console.error(
                "Categories products query error:",
                error
            );
        } else {
            products = (data || []) as Product[];
        }
    } catch (error) {
        console.error(
            "Categories page error:",
            error
        );
    }

    const categoriesWithProducts =
        ALL_CATEGORIES.map((category) => {
            const aliases = [
                category.value,
                ...(category.aliases || []),
            ].map(normalizeCategory);

            const count = products.filter(
                (product) =>
                    aliases.includes(
                        normalizeCategory(
                            product.category
                        )
                    )
            ).length;

            return {
                ...category,
                count,
            };
        }).filter(
            (category) => category.count > 0
        );

    const jewelleryCategories =
        categoriesWithProducts.filter(
            (category) =>
                JEWELLERY_CATEGORIES.some(
                    (item) =>
                        item.value ===
                        category.value
                )
        );

    const clothingCategories =
        categoriesWithProducts.filter(
            (category) =>
                CLOTHING_CATEGORIES.some(
                    (item) =>
                        item.value ===
                        category.value
                )
        );

    return (
        <>
            <Navbar />

            <main className="min-h-screen bg-pink-50">
                {/* ==========================================
                    HEADER
                ========================================== */}

                <section className="px-5 sm:px-8 pt-14 sm:pt-20 pb-10">
                    <div className="max-w-6xl mx-auto text-center">
                        <span className="inline-flex items-center bg-pink-100 text-pink-700 px-5 py-2.5 rounded-full font-semibold">
                            ✨ APSRAA COLLECTIONS
                        </span>

                        <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl font-extrabold text-pink-700">
                            Explore Categories
                        </h1>

                        <p className="mt-5 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
                            Discover our jewellery and
                            fashion collections.
                        </p>
                    </div>
                </section>

                {/* ==========================================
                    JEWELLERY
                ========================================== */}

                {jewelleryCategories.length > 0 && (
                    <section className="px-5 sm:px-8 pb-12">
                        <div className="max-w-6xl mx-auto">
                            <div className="text-center mb-7">
                                <h2 className="text-3xl sm:text-4xl font-bold text-pink-700">
                                    💎 Jewellery
                                </h2>

                                <p className="mt-2 text-gray-500">
                                    Explore our jewellery
                                    collections.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {jewelleryCategories.map(
                                    (category) => (
                                        <Link
                                            key={
                                                category.value
                                            }
                                            href={`/shop?category=${encodeURIComponent(
                                                category.value
                                            )}`}
                                            className="group bg-white rounded-3xl border border-pink-100 p-6 sm:p-7 shadow-sm hover:shadow-lg hover:-translate-y-1 transition"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="w-16 h-16 rounded-2xl bg-pink-50 flex items-center justify-center text-3xl">
                                                    {
                                                        category.emoji
                                                    }
                                                </div>

                                                <span className="text-sm font-semibold text-pink-600 bg-pink-50 px-3 py-1.5 rounded-full">
                                                    {
                                                        category.count
                                                    }{" "}
                                                    {category.count ===
                                                    1
                                                        ? "Product"
                                                        : "Products"}
                                                </span>
                                            </div>

                                            <h3 className="mt-5 text-2xl font-bold text-gray-800 group-hover:text-pink-700 transition">
                                                {
                                                    category.label
                                                }
                                            </h3>

                                            <p className="mt-2 text-gray-500">
                                                Explore our{" "}
                                                {category.label.toLowerCase()}{" "}
                                                collection.
                                            </p>

                                            <div className="mt-5 text-pink-600 font-semibold">
                                                Shop Now →
                                            </div>
                                        </Link>
                                    )
                                )}
                            </div>
                        </div>
                    </section>
                )}

                {/* ==========================================
                    CLOTHING
                ========================================== */}

                {clothingCategories.length > 0 && (
                    <section className="px-5 sm:px-8 pb-16">
                        <div className="max-w-6xl mx-auto">
                            <div className="text-center mb-7">
                                <h2 className="text-3xl sm:text-4xl font-bold text-pink-700">
                                    👗 Fashion
                                </h2>

                                <p className="mt-2 text-gray-500">
                                    Explore our fashion
                                    collections.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {clothingCategories.map(
                                    (category) => (
                                        <Link
                                            key={
                                                category.value
                                            }
                                            href={`/shop?category=${encodeURIComponent(
                                                category.value
                                            )}`}
                                            className="group bg-white rounded-3xl border border-pink-100 p-6 sm:p-7 shadow-sm hover:shadow-lg hover:-translate-y-1 transition"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="w-16 h-16 rounded-2xl bg-pink-50 flex items-center justify-center text-3xl">
                                                    {
                                                        category.emoji
                                                    }
                                                </div>

                                                <span className="text-sm font-semibold text-pink-600 bg-pink-50 px-3 py-1.5 rounded-full">
                                                    {
                                                        category.count
                                                    }{" "}
                                                    {category.count ===
                                                    1
                                                        ? "Product"
                                                        : "Products"}
                                                </span>
                                            </div>

                                            <h3 className="mt-5 text-2xl font-bold text-gray-800 group-hover:text-pink-700 transition">
                                                {
                                                    category.label
                                                }
                                            </h3>

                                            <p className="mt-2 text-gray-500">
                                                Explore our{" "}
                                                {category.label.toLowerCase()}{" "}
                                                collection.
                                            </p>

                                            <div className="mt-5 text-pink-600 font-semibold">
                                                Shop Now →
                                            </div>
                                        </Link>
                                    )
                                )}
                            </div>
                        </div>
                    </section>
                )}

                {/* ==========================================
                    NO PRODUCTS
                ========================================== */}

                {categoriesWithProducts.length ===
                    0 && (
                        <section className="px-5 pb-20">
                            <div className="max-w-xl mx-auto bg-white rounded-3xl border border-pink-100 p-10 text-center shadow-sm">
                                <div className="text-5xl">
                                    ✨
                                </div>

                                <h2 className="mt-5 text-2xl font-bold text-gray-800">
                                    Collections Coming Soon
                                </h2>

                                <p className="mt-3 text-gray-500">
                                    New jewellery and fashion
                                    collections will appear here
                                    as products are added.
                                </p>

                                <Link
                                    href="/shop"
                                    className="inline-flex mt-6 bg-pink-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-pink-700 transition"
                                >
                                    Browse All Products
                                </Link>
                            </div>
                        </section>
                    )}
            </main>

            <Footer />
        </>
    );
}