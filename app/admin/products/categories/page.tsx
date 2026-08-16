"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminNavbar from "../../../../components/AdminNavbar";
import Footer from "../../../../components/Footer";
import { supabase } from "../../../../lib/supabase";

type Product = {
    id: number;
    category: string | null;
};

type Category = {
    value: string;
    label: string;
    group: "Jewellery" | "Clothing";
};

const CATEGORIES: Category[] = [
    // ==========================================
    // JEWELLERY
    // ==========================================

    {
        value: "earrings",
        label: "Earrings",
        group: "Jewellery",
    },
    {
        value: "jhumkas",
        label: "Jhumkas",
        group: "Jewellery",
    },
    {
        value: "necklaces",
        label: "Necklaces",
        group: "Jewellery",
    },
    {
        value: "chokers",
        label: "Chokers",
        group: "Jewellery",
    },
    {
        value: "jewellery-sets",
        label: "Jewellery Sets",
        group: "Jewellery",
    },
    {
        value: "anklets",
        label: "Anklets / Payal",
        group: "Jewellery",
    },
    {
        value: "maang-tikka",
        label: "Maang Tikka",
        group: "Jewellery",
    },
    {
        value: "rings",
        label: "Rings",
        group: "Jewellery",
    },
    {
        value: "bangles",
        label: "Bangles / Bracelets",
        group: "Jewellery",
    },

    // ==========================================
    // CLOTHING
    // ==========================================

    {
        value: "kurtis",
        label: "Kurtis",
        group: "Clothing",
    },
    {
        value: "cotton-kurtis",
        label: "Cotton Kurtis",
        group: "Clothing",
    },
    {
        value: "breastfeeding-kurtis",
        label: "Breastfeeding / Nursing Kurtis",
        group: "Clothing",
    },
    {
        value: "kurti-sets",
        label: "Kurti Sets",
        group: "Clothing",
    },
    {
        value: "dresses",
        label: "Dresses",
        group: "Clothing",
    },
    {
        value: "co-ord-sets",
        label: "Co-ord Sets",
        group: "Clothing",
    },
];

// ==========================================
// NORMALIZE CATEGORY
// Handles old spellings such as earrrings.
// ==========================================

function normalizeCategory(
    value: string | null
) {
    const category = (value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-");

    const aliases: Record<string, string> = {
        // Earrings
        earrrings: "earrings",
        earring: "earrings",
        earrings: "earrings",

        // Jhumkas
        jhumka: "jhumkas",
        jhumkas: "jhumkas",

        // Necklaces
        necklace: "necklaces",
        necklaces: "necklaces",

        // Chokers
        choker: "chokers",
        chokers: "chokers",

        // Jewellery Sets
        "jewellery-set": "jewellery-sets",
        "jewelry-set": "jewellery-sets",
        "jewellery-sets": "jewellery-sets",
        "jewelry-sets": "jewellery-sets",

        // Anklets
        anklet: "anklets",
        anklets: "anklets",
        payal: "anklets",

        // Maang Tikka
        "maang-tikka": "maang-tikka",
        "maang-tika": "maang-tikka",
        mangtikka: "maang-tikka",

        // Rings
        ring: "rings",
        rings: "rings",

        // Bangles / Bracelets
        bangle: "bangles",
        bangles: "bangles",
        bracelet: "bangles",
        bracelets: "bangles",

        // Kurtis
        kurti: "kurtis",
        kurtis: "kurtis",

        // Cotton Kurtis
        "cotton-kurti": "cotton-kurtis",
        "cotton-kurtis": "cotton-kurtis",

        // Breastfeeding / Nursing Kurtis
        "breastfeeding-kurti":
            "breastfeeding-kurtis",
        "breastfeeding-kurtis":
            "breastfeeding-kurtis",
        "nursing-kurti":
            "breastfeeding-kurtis",
        "nursing-kurtis":
            "breastfeeding-kurtis",

        // Kurti Sets
        "kurti-set": "kurti-sets",
        "kurti-sets": "kurti-sets",

        // Dresses
        dress: "dresses",
        dresses: "dresses",

        // Co-ord Sets
        "co-ord": "co-ord-sets",
        "co-ord-set": "co-ord-sets",
        "co-ord-sets": "co-ord-sets",
    };

    return aliases[category] || category;
}

export default function CategoriesPage() {
    const [products, setProducts] =
        useState<Product[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    // ==========================================
    // LOAD PRODUCTS
    // ==========================================

    useEffect(() => {
        loadProducts();
    }, []);

    async function loadProducts() {
        try {
            setLoading(true);
            setError("");

            const { data, error } =
                await supabase
                    .from("products")
                    .select("id, category");

            if (error) {
                console.error(
                    "Category loading error:",
                    error
                );

                setError(error.message);
                return;
            }

            setProducts(data ?? []);
        } finally {
            setLoading(false);
        }
    }

    // ==========================================
    // PRODUCT COUNT
    // ==========================================

    function getProductCount(
        categoryValue: string
    ) {
        return products.filter(
            (product) =>
                normalizeCategory(
                    product.category
                ) === categoryValue
        ).length;
    }

    const jewelleryCategories =
        CATEGORIES.filter(
            (category) =>
                category.group === "Jewellery"
        );

    const clothingCategories =
        CATEGORIES.filter(
            (category) =>
                category.group === "Clothing"
        );

    const totalActiveCategories =
        CATEGORIES.filter(
            (category) =>
                getProductCount(
                    category.value
                ) > 0
        ).length;

    // ==========================================
    // CATEGORY CARD
    // ==========================================

    function CategoryCard({
                              category,
                          }: {
        category: Category;
    }) {
        const count = getProductCount(
            category.value
        );

        const active = count > 0;

        return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition">

                <div className="flex items-center justify-between gap-4">

                    <div>

                        <h3 className="font-bold text-gray-900 text-lg">
                            {category.label}
                        </h3>

                        <p className="text-sm text-gray-500 mt-1">
                            {count}{" "}
                            {count === 1
                                ? "product"
                                : "products"}
                        </p>

                    </div>

                    <span
                        className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold ${
                            active
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-500"
                        }`}
                    >
                        {active
                            ? "🟢 Active"
                            : "⚪ Empty"}
                    </span>

                </div>

            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-50">

            <AdminNavbar />

            <main className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

                <div className="max-w-7xl mx-auto">

                    {/* ==================================
                        HEADER
                    ================================== */}

                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                        <div>

                            <p className="text-sm font-semibold text-pink-600 uppercase tracking-wide">
                                APSRAA ADMIN
                            </p>

                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-pink-700 mt-1">
                                Product Categories
                            </h1>

                            <p className="text-gray-500 mt-2">
                                See all prepared categories and where your products belong.
                            </p>

                        </div>

                        <Link
                            href="/admin/products"
                            className="bg-white border-2 border-pink-200 text-pink-700 px-6 py-3 rounded-xl font-semibold hover:bg-pink-50 transition text-center"
                        >
                            ← Back to Products
                        </Link>

                    </div>

                    {/* ==================================
                        SUMMARY
                    ================================== */}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">

                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-100">

                            <p className="text-sm text-gray-500">
                                Total Categories
                            </p>

                            <p className="text-3xl font-bold text-gray-900 mt-1">
                                {CATEGORIES.length}
                            </p>

                        </div>

                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-100">

                            <p className="text-sm text-gray-500">
                                Categories With Products
                            </p>

                            <p className="text-3xl font-bold text-green-600 mt-1">
                                {
                                    totalActiveCategories
                                }
                            </p>

                        </div>

                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-100">

                            <p className="text-sm text-gray-500">
                                Total Products
                            </p>

                            <p className="text-3xl font-bold text-pink-700 mt-1">
                                {products.length}
                            </p>

                        </div>

                    </div>

                    {/* ==================================
                        ERROR
                    ================================== */}

                    {error && (
                        <div className="mt-8 bg-red-50 border border-red-200 rounded-2xl p-5 text-red-700">
                            Unable to load product
                            categories:
                            {" "}
                            {error}
                        </div>
                    )}

                    {/* ==================================
                        LOADING
                    ================================== */}

                    {loading ? (

                        <div className="mt-8 bg-white rounded-3xl shadow-md p-16 text-center">

                            <div className="text-5xl mb-4">
                                🗂️
                            </div>

                            <h2 className="text-2xl font-bold text-gray-800">
                                Loading Categories...
                            </h2>

                        </div>

                    ) : (

                        <>

                            {/* ==================================
                                JEWELLERY
                            ================================== */}

                            <section className="mt-10">

                                <div className="flex items-center justify-between mb-4">

                                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                                        💎 Jewellery
                                    </h2>

                                    <span className="text-sm text-gray-500">
                                        {
                                            jewelleryCategories.length
                                        }{" "}
                                        categories
                                    </span>

                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                                    {jewelleryCategories.map(
                                        (
                                            category
                                        ) => (
                                            <CategoryCard
                                                key={
                                                    category.value
                                                }
                                                category={
                                                    category
                                                }
                                            />
                                        )
                                    )}

                                </div>

                            </section>

                            {/* ==================================
                                CLOTHING
                            ================================== */}

                            <section className="mt-12">

                                <div className="flex items-center justify-between mb-4">

                                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                                        👗 Clothing
                                    </h2>

                                    <span className="text-sm text-gray-500">
                                        {
                                            clothingCategories.length
                                        }{" "}
                                        categories
                                    </span>

                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                                    {clothingCategories.map(
                                        (
                                            category
                                        ) => (
                                            <CategoryCard
                                                key={
                                                    category.value
                                                }
                                                category={
                                                    category
                                                }
                                            />
                                        )
                                    )}

                                </div>

                            </section>

                        </>
                    )}

                    {/* ==================================
                        ADD PRODUCT
                    ================================== */}

                    <div className="mt-10 bg-pink-600 rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">

                        <div>

                            <h2 className="text-xl sm:text-2xl font-bold">
                                Ready to add a product?
                            </h2>

                            <p className="text-pink-100 mt-1">
                                Choose the category directly from the Add Product page.
                            </p>

                        </div>

                        <Link
                            href="/admin/add-product"
                            className="bg-white text-pink-700 px-6 py-3 rounded-xl font-bold text-center hover:bg-pink-50 transition"
                        >
                            + Add Product
                        </Link>

                    </div>

                </div>

            </main>

            <Footer />

        </div>
    );
}