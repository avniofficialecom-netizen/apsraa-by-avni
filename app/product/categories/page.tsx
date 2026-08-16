import Link from "next/link";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import { supabase } from "../../../lib/supabase";

export const dynamic = "force-dynamic";

const JEWELLERY_CATEGORIES = [
    {
        name: "Earrings",
        emoji: "✨",
        value: "earrings",
        description:
            "Elegant earrings for every occasion.",
    },
    {
        name: "Jhumkas",
        emoji: "💎",
        value: "jhumkas",
        description:
            "Traditional and stylish jhumka designs.",
    },
    {
        name: "Necklaces",
        emoji: "📿",
        value: "necklaces",
        description:
            "Beautiful necklaces to complete your look.",
    },
    {
        name: "Chokers",
        emoji: "👑",
        value: "chokers",
        description:
            "Statement chokers for festive and party wear.",
    },
    {
        name: "Jewellery Sets",
        emoji: "💍",
        value: "jewellery-sets",
        description:
            "Complete jewellery sets for special occasions.",
    },
    {
        name: "Anklets / Payal",
        emoji: "✨",
        value: "anklets",
        description:
            "Beautiful anklets and payal designs.",
    },
    {
        name: "Maang Tikka",
        emoji: "👸",
        value: "maang-tikka",
        description:
            "Traditional maang tikka styles.",
    },
    {
        name: "Rings",
        emoji: "💍",
        value: "rings",
        description:
            "Elegant rings for everyday and occasion wear.",
    },
    {
        name: "Bangles / Bracelets",
        emoji: "✨",
        value: "bangles",
        description:
            "Stylish bangles and bracelets.",
    },
];

const CLOTHING_CATEGORIES = [
    {
        name: "Kurtis",
        emoji: "👗",
        value: "kurtis",
        description:
            "Stylish kurtis for everyday and festive wear.",
    },
    {
        name: "Cotton Kurtis",
        emoji: "🌸",
        value: "cotton-kurtis",
        description:
            "Comfortable cotton kurtis for everyday wear.",
    },
    {
        name: "Breastfeeding / Nursing Kurtis",
        emoji: "💕",
        value: "breastfeeding-kurtis",
        description:
            "Comfortable nursing-friendly kurti designs.",
    },
    {
        name: "Kurti Sets",
        emoji: "👗",
        value: "kurti-sets",
        description:
            "Beautiful coordinated kurti sets.",
    },
    {
        name: "Dresses",
        emoji: "✨",
        value: "dresses",
        description:
            "Elegant dresses for different occasions.",
    },
    {
        name: "Co-ord Sets",
        emoji: "🌷",
        value: "co-ord-sets",
        description:
            "Trendy coordinated outfits.",
    },
];

const ALL_CATEGORIES = [
    ...JEWELLERY_CATEGORIES,
    ...CLOTHING_CATEGORIES,
];

export default async function CategoriesPage() {
    const {
        data: products,
        error,
    } = await supabase
        .from("products")
        .select("category");

    // ==========================================
    // FIND CATEGORIES THAT ACTUALLY HAVE PRODUCTS
    // ==========================================

    const activeCategoryValues = new Set(
        (products || [])
            .map((product) =>
                String(
                    product.category || ""
                )
                    .trim()
                    .toLowerCase()
            )
            .filter(Boolean)
    );

    // Support the existing test typo:
    // "earrrings" should count as Earrings.
    if (activeCategoryValues.has("earrrings")) {
        activeCategoryValues.add("earrings");
    }

    const activeJewelleryCategories =
        JEWELLERY_CATEGORIES.filter(
            (category) =>
                activeCategoryValues.has(
                    category.value
                )
        );

    const activeClothingCategories =
        CLOTHING_CATEGORIES.filter(
            (category) =>
                activeCategoryValues.has(
                    category.value
                )
        );

    const hasJewellery =
        activeJewelleryCategories.length > 0;

    const hasClothing =
        activeClothingCategories.length > 0;

    const hasAnyCategory =
        hasJewellery || hasClothing;

    return (
        <>
            <Navbar />

            <main className="min-h-screen bg-pink-50">

                {/* ==========================================
                    HERO
                ========================================== */}

                <section className="py-16 sm:py-20">

                    <div className="max-w-7xl mx-auto px-5 sm:px-8 text-center">

                        <span className="inline-block bg-pink-100 text-pink-700 px-5 py-2 rounded-full font-semibold">
                            ✨ APSRAA COLLECTIONS
                        </span>

                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-pink-700 mt-6">
                            Explore Categories
                        </h1>

                        <p className="text-gray-600 mt-5 max-w-2xl mx-auto text-lg">
                            Discover our jewellery and fashion
                            collections.
                        </p>

                    </div>

                </section>

                {/* ==========================================
                    DATABASE ERROR
                ========================================== */}

                {error && (
                    <section className="pb-16">

                        <div className="max-w-3xl mx-auto px-5">

                            <div className="bg-white rounded-3xl p-10 text-center border border-red-100">

                                <div className="text-5xl">
                                    ⚠️
                                </div>

                                <h2 className="text-2xl font-bold text-red-600 mt-4">
                                    Unable to load categories
                                </h2>

                                <p className="text-gray-500 mt-3">
                                    {error.message}
                                </p>

                            </div>

                        </div>

                    </section>
                )}

                {/* ==========================================
                    JEWELLERY
                ========================================== */}

                {!error && hasJewellery && (
                    <section className="pb-16 sm:pb-20">

                        <div className="max-w-7xl mx-auto px-5 sm:px-8">

                            <div className="text-center mb-10">

                                <h2 className="text-3xl sm:text-4xl font-bold text-pink-700">
                                    💎 Jewellery
                                </h2>

                                <p className="text-gray-500 mt-3">
                                    Explore our jewellery collections.
                                </p>

                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

                                {activeJewelleryCategories.map(
                                    (category) => (
                                        <Link
                                            key={
                                                category.value
                                            }
                                            href={`/shop?category=${category.value}`}
                                            className="group bg-white rounded-3xl p-7 shadow-sm border border-pink-100 hover:shadow-xl hover:-translate-y-1 transition"
                                        >

                                            <div className="w-16 h-16 rounded-2xl bg-pink-50 flex items-center justify-center text-3xl group-hover:bg-pink-100 transition">
                                                {
                                                    category.emoji
                                                }
                                            </div>

                                            <h3 className="text-2xl font-bold text-gray-800 mt-5 group-hover:text-pink-700 transition">
                                                {
                                                    category.name
                                                }
                                            </h3>

                                            <p className="text-gray-500 mt-2">
                                                {
                                                    category.description
                                                }
                                            </p>

                                            <div className="mt-5 text-pink-600 font-semibold">
                                                Explore Collection →
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

                {!error && hasClothing && (
                    <section className="py-16 sm:py-20 bg-white">

                        <div className="max-w-7xl mx-auto px-5 sm:px-8">

                            <div className="text-center mb-10">

                                <h2 className="text-3xl sm:text-4xl font-bold text-pink-700">
                                    👗 Clothing
                                </h2>

                                <p className="text-gray-500 mt-3">
                                    Explore our fashion collections.
                                </p>

                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

                                {activeClothingCategories.map(
                                    (category) => (
                                        <Link
                                            key={
                                                category.value
                                            }
                                            href={`/shop?category=${category.value}`}
                                            className="group bg-pink-50 rounded-3xl p-7 shadow-sm border border-pink-100 hover:shadow-xl hover:-translate-y-1 transition"
                                        >

                                            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-3xl group-hover:bg-pink-100 transition">
                                                {
                                                    category.emoji
                                                }
                                            </div>

                                            <h3 className="text-2xl font-bold text-gray-800 mt-5 group-hover:text-pink-700 transition">
                                                {
                                                    category.name
                                                }
                                            </h3>

                                            <p className="text-gray-500 mt-2">
                                                {
                                                    category.description
                                                }
                                            </p>

                                            <div className="mt-5 text-pink-600 font-semibold">
                                                Explore Collection →
                                            </div>

                                        </Link>
                                    )
                                )}

                            </div>

                        </div>

                    </section>
                )}

                {/* ==========================================
                    NO ACTIVE CATEGORIES
                ========================================== */}

                {!error && !hasAnyCategory && (
                    <section className="pb-20">

                        <div className="max-w-3xl mx-auto px-5">

                            <div className="bg-white rounded-3xl p-10 sm:p-14 text-center shadow-sm">

                                <div className="text-6xl">
                                    💎
                                </div>

                                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mt-5">
                                    Collections Coming Soon
                                </h2>

                                <p className="text-gray-500 mt-3">
                                    Our collections are being prepared.
                                    Please check back soon.
                                </p>

                                <Link
                                    href="/shop"
                                    className="inline-flex mt-7 bg-pink-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-pink-700 transition"
                                >
                                    Shop All Products →
                                </Link>

                            </div>

                        </div>

                    </section>
                )}

                {/* ==========================================
                    ALL PRODUCTS
                ========================================== */}

                <section className="py-16">

                    <div className="max-w-3xl mx-auto px-5 text-center">

                        <h2 className="text-3xl font-bold text-pink-700">
                            Looking for something else?
                        </h2>

                        <p className="text-gray-500 mt-3">
                            Browse our complete collection.
                        </p>

                        <Link
                            href="/shop"
                            className="inline-flex mt-7 bg-pink-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-pink-700 transition"
                        >
                            Shop All Products →
                        </Link>

                    </div>

                </section>

            </main>

            <Footer />
        </>
    );
}