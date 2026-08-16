import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import ProductCard from "../../components/ProductCard";
import { supabase } from "../../lib/supabase";

export const dynamic = "force-dynamic";

type Product = {
    id: number | string;
    image?: string | null;
    title?: string | null;
    price?: number | string | null;
    stock?: number | string | null;
    category?: string | null;
};

type CategoryDefinition = {
    value: string;
    label: string;
    group: "Jewellery" | "Clothing";
};

// ==========================================
// MASTER CATEGORY LIST
//
// Categories are prepared in advance.
// Empty categories are automatically hidden.
// ==========================================

const CATEGORY_DEFINITIONS: CategoryDefinition[] = [
    // JEWELLERY
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

    // CLOTHING
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
// CATEGORY NORMALIZATION
//
// Handles common spelling variations and
// your existing "earrrings" typo.
// ==========================================

function normalizeCategory(
    value: string | null | undefined
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

function normalizeSearch(value: string) {
    return value.trim().toLowerCase();
}

// ==========================================
// SHOP PAGE
// ==========================================

export default async function Shop({
                                       searchParams,
                                   }: {
    searchParams: Promise<{
        category?: string;
        search?: string;
    }>;
}) {
    const params = await searchParams;

    const selectedCategory =
        normalizeCategory(params.category);

    const search =
        params.search?.trim() || "";

    const normalizedSearch =
        normalizeSearch(search);

    // ==========================================
    // LOAD PRODUCTS
    // ==========================================

    const {
        data: products,
        error,
    } = await supabase
        .from("products")
        .select("*")
        .order("id", {
            ascending: false,
        });

    // ==========================================
    // NORMALIZE PRODUCTS
    // ==========================================

    const allProducts: Product[] =
        (products || []).map((product) => ({
            ...product,
            id: Number(product.id),
            category: normalizeCategory(
                product.category
            ),
        }));

    // ==========================================
    // FIND AVAILABLE CATEGORIES
    //
    // Only categories containing products
    // are visible to customers.
    // ==========================================

    const availableCategoryValues =
        new Set(
            allProducts
                .map(
                    (product) =>
                        product.category
                )
                .filter(Boolean)
        );

    const availableCategories =
        CATEGORY_DEFINITIONS.filter(
            (category) =>
                availableCategoryValues.has(
                    category.value
                )
        );

    const jewelleryCategories =
        availableCategories.filter(
            (category) =>
                category.group === "Jewellery"
        );

    const clothingCategories =
        availableCategories.filter(
            (category) =>
                category.group === "Clothing"
        );

    // ==========================================
    // CATEGORY FILTER
    // ==========================================

    let filteredProducts =
        allProducts;

    if (selectedCategory) {
        filteredProducts =
            filteredProducts.filter(
                (product) =>
                    product.category ===
                    selectedCategory
            );
    }

    // ==========================================
    // SEARCH FILTER
    // ==========================================

    if (normalizedSearch) {
        filteredProducts =
            filteredProducts.filter(
                (product) => {
                    const title =
                        normalizeSearch(
                            product.title || ""
                        );

                    const category =
                        normalizeSearch(
                            product.category ||
                            ""
                        );

                    return (
                        title.includes(
                            normalizedSearch
                        ) ||
                        category.includes(
                            normalizedSearch
                        )
                    );
                }
            );
    }

    // ==========================================
    // CURRENT CATEGORY
    // ==========================================

    const currentCategory =
        CATEGORY_DEFINITIONS.find(
            (category) =>
                category.value ===
                selectedCategory
        );

    const pageTitle = currentCategory
        ? currentCategory.label
        : search
            ? `Search results for "${search}"`
            : "Shop Collection";

    return (
        <>
            {/* NAVBAR */}

            <div className="print:hidden">
                <Navbar />
            </div>

            {/* SHOP */}

            <section className="bg-pink-50 min-h-screen py-16">

                <div className="max-w-7xl mx-auto px-6 md:px-8">

                    {/* HEADING */}

                    <h1 className="text-4xl md:text-5xl font-bold text-pink-700 text-center">
                        {pageTitle}
                    </h1>

                    <p className="text-center text-gray-500 mt-4">
                        Discover our latest premium jewellery
                    </p>

                    {/* SEARCH */}

                    <form
                        action="/shop"
                        method="GET"
                        className="mt-10 max-w-3xl mx-auto"
                    >

                        {selectedCategory && (
                            <input
                                type="hidden"
                                name="category"
                                value={
                                    selectedCategory
                                }
                            />
                        )}

                        <div className="flex flex-col sm:flex-row gap-3">

                            <input
                                type="text"
                                name="search"
                                defaultValue={search}
                                placeholder="Search Jewellery..."
                                className="flex-1 p-4 rounded-xl border border-gray-300 bg-white outline-none focus:ring-2 focus:ring-pink-500"
                            />

                            <button
                                type="submit"
                                className="px-7 py-4 rounded-xl bg-pink-600 text-white font-bold hover:bg-pink-700 transition"
                            >
                                Search
                            </button>

                            {(search ||
                                selectedCategory) && (
                                <Link
                                    href="/shop"
                                    className="px-7 py-4 rounded-xl bg-white border border-gray-300 text-gray-700 font-semibold text-center hover:bg-gray-50 transition"
                                >
                                    Clear
                                </Link>
                            )}

                        </div>

                    </form>

                    {/* CATEGORY NAVIGATION */}

                    {!error && (
                        <div className="mt-10 space-y-6">

                            {/* ALL */}

                            <div className="flex flex-wrap justify-center gap-3">

                                <Link
                                    href="/shop"
                                    className={`px-5 py-2.5 rounded-full font-semibold transition ${
                                        !selectedCategory
                                            ? "bg-pink-600 text-white shadow-md"
                                            : "bg-white text-gray-700 border border-gray-200 hover:border-pink-300 hover:text-pink-600"
                                    }`}
                                >
                                    All Jewellery
                                </Link>

                            </div>

                            {/* JEWELLERY */}

                            {jewelleryCategories.length >
                                0 && (
                                    <div>

                                        <p className="text-center text-xs uppercase tracking-[0.2em] font-bold text-pink-500 mb-3">
                                            Jewellery
                                        </p>

                                        <div className="flex flex-wrap justify-center gap-3">

                                            {jewelleryCategories.map(
                                                (category) => (
                                                    <Link
                                                        key={
                                                            category.value
                                                        }
                                                        href={`/shop?category=${encodeURIComponent(
                                                            category.value
                                                        )}`}
                                                        className={`px-5 py-2.5 rounded-full font-semibold transition ${
                                                            selectedCategory ===
                                                            category.value
                                                                ? "bg-pink-600 text-white shadow-md"
                                                                : "bg-white text-gray-700 border border-gray-200 hover:border-pink-300 hover:text-pink-600"
                                                        }`}
                                                    >
                                                        {
                                                            category.label
                                                        }
                                                    </Link>
                                                )
                                            )}

                                        </div>

                                    </div>
                                )}

                            {/* CLOTHING */}

                            {clothingCategories.length >
                                0 && (
                                    <div>

                                        <p className="text-center text-xs uppercase tracking-[0.2em] font-bold text-pink-500 mb-3">
                                            Clothing
                                        </p>

                                        <div className="flex flex-wrap justify-center gap-3">

                                            {clothingCategories.map(
                                                (category) => (
                                                    <Link
                                                        key={
                                                            category.value
                                                        }
                                                        href={`/shop?category=${encodeURIComponent(
                                                            category.value
                                                        )}`}
                                                        className={`px-5 py-2.5 rounded-full font-semibold transition ${
                                                            selectedCategory ===
                                                            category.value
                                                                ? "bg-pink-600 text-white shadow-md"
                                                                : "bg-white text-gray-700 border border-gray-200 hover:border-pink-300 hover:text-pink-600"
                                                        }`}
                                                    >
                                                        {
                                                            category.label
                                                        }
                                                    </Link>
                                                )
                                            )}

                                        </div>

                                    </div>
                                )}

                        </div>
                    )}

                    {/* RESULT COUNT */}

                    {(selectedCategory ||
                        search) && (
                        <div className="mt-8 text-center text-sm text-gray-500">

                            Showing{" "}
                            <strong className="text-gray-800">
                                {
                                    filteredProducts.length
                                }
                            </strong>{" "}
                            {filteredProducts.length ===
                            1
                                ? "product"
                                : "products"}

                            {currentCategory && (
                                <>
                                    {" "}in{" "}
                                    <strong className="text-pink-700">
                                        {
                                            currentCategory.label
                                        }
                                    </strong>
                                </>
                            )}

                        </div>
                    )}

                    {/* DATABASE ERROR */}

                    {error && (
                        <div className="text-center mt-10">

                            <p className="text-red-600 font-semibold">
                                Unable to load products.
                            </p>

                            <p className="text-gray-500 text-sm mt-2">
                                {error.message}
                            </p>

                        </div>
                    )}

                    {/* NO PRODUCTS */}

                    {!error &&
                        filteredProducts.length ===
                        0 && (
                            <div className="text-center mt-14 bg-white rounded-3xl p-10 shadow-sm">

                                <p className="text-xl font-semibold text-gray-700">
                                    {selectedCategory
                                        ? `No ${
                                            currentCategory?.label ||
                                            "products"
                                        } available yet.`
                                        : search
                                            ? `No products found for "${search}".`
                                            : "No products available."}
                                </p>

                                <p className="text-gray-500 mt-2">
                                    Please check back soon for
                                    new arrivals.
                                </p>

                                {(selectedCategory ||
                                    search) && (
                                    <Link
                                        href="/shop"
                                        className="inline-block mt-5 px-6 py-3 rounded-xl bg-pink-600 text-white font-semibold hover:bg-pink-700 transition"
                                    >
                                        View All Jewellery
                                    </Link>
                                )}

                            </div>
                        )}

                    {/* PRODUCT GRID */}

                    {!error &&
                        filteredProducts.length >
                        0 && (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mt-10">

                                {filteredProducts.map(
                                    (product) => (
                                        <ProductCard
                                            key={
                                                product.id
                                            }
                                            id={Number(
                                                product.id
                                            )}
                                            image={
                                                product.image ||
                                                ""
                                            }
                                            title={
                                                product.title ||
                                                "Product"
                                            }
                                            subtitle={`₹${
                                                product.price ??
                                                0
                                            }`}
                                            stock={
                                                Number(
                                                    product.stock
                                                ) || 0
                                            }
                                        />
                                    )
                                )}

                            </div>
                        )}

                </div>

            </section>

            {/* FOOTER */}

            <Footer />
        </>
    );
}