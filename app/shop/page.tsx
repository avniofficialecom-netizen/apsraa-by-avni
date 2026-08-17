import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import ProductCard from "../../components/ProductCard";
import { supabase } from "../../lib/supabase";

export const dynamic = "force-dynamic";

type ShopProps = {
    searchParams: Promise<{
        category?: string;
        price?: string;
        size?: string;
        color?: string;
        sort?: string;
        collection?: string;
    }>;
};

type Product = {
    id: number;
    title: string;
    price: number | null;
    image: string | null;
    stock: number | null;
    category: string | null;
    bestseller?: boolean | null;
    trending?: boolean | null;
    featured?: boolean | null;
    created_at?: string | null;
};

type Variant = {
    id: number;
    product_id: number;
    size: string | null;
    color: string | null;
    stock: number | null;
};

function formatCategory(category: string) {
    return category
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (letter) =>
            letter.toUpperCase()
        );
}

function buildShopUrl(
    params: Record<string, string | undefined>
) {
    const search = new URLSearchParams();

    Object.entries(params).forEach(
        ([key, value]) => {
            if (value) {
                search.set(key, value);
            }
        }
    );

    const query = search.toString();

    return query
        ? `/shop?${query}`
        : "/shop";
}

export default async function Shop({
                                       searchParams,
                                   }: ShopProps) {
    const params = await searchParams;

    const category = params?.category || "";
    const price = params?.price || "";
    const size = params?.size || "";
    const color = params?.color || "";
    const sort = params?.sort || "newest";
    const collection = params?.collection || "";

    // ==========================================
    // LOAD PRODUCTS
    // ==========================================

    const {
        data: productData,
        error: productError,
    } = await supabase
        .from("products")
        .select(
            "id, title, price, image, stock, category, bestseller, trending, featured, created_at"
        )
        .order("created_at", {
            ascending: false,
        });

    if (productError) {
        return (
            <>
                <Navbar />

                <section className="min-h-screen bg-pink-50 py-20">
                    <div className="max-w-4xl mx-auto px-6 text-center">
                        <div className="bg-white rounded-3xl shadow-lg p-10">
                            <div className="text-5xl">
                                ⚠️
                            </div>

                            <h1 className="text-3xl font-bold text-gray-800 mt-5">
                                Unable to load products
                            </h1>

                            <p className="text-gray-500 mt-3">
                                Please try again later.
                            </p>
                        </div>
                    </div>
                </section>

                <Footer />
            </>
        );
    }

    const products =
        (productData || []) as Product[];

    // ==========================================
    // LOAD VARIANTS
    // ==========================================

    const {
        data: variantData,
        error: variantError,
    } = await supabase
        .from("product_variants")
        .select(
            "id, product_id, size, color, stock"
        );

    if (variantError) {
        console.error(
            "Shop variant loading error:",
            variantError
        );
    }

    const variants =
        (variantData || []) as Variant[];

    // ==========================================
    // CATEGORY OPTIONS
    // ==========================================

    const categories = Array.from(
        new Set(
            products
                .map(
                    (product) =>
                        product.category
                )
                .filter(
                    (
                        value
                    ): value is string =>
                        Boolean(value)
                )
        )
    ).sort((a, b) =>
        a.localeCompare(b)
    );

    // ==========================================
    // VARIANT FILTER OPTIONS
    // ==========================================

    const relevantVariantProductIds =
        category
            ? new Set(
                products
                    .filter(
                        (product) =>
                            String(
                                product.category
                            ).toLowerCase() ===
                            category.toLowerCase()
                    )
                    .map(
                        (product) =>
                            product.id
                    )
            )
            : null;

    const relevantVariants =
        relevantVariantProductIds
            ? variants.filter((variant) =>
                relevantVariantProductIds.has(
                    variant.product_id
                )
            )
            : variants;

    const sizes = Array.from(
        new Set(
            relevantVariants
                .map(
                    (variant) =>
                        variant.size
                )
                .filter(
                    (
                        value
                    ): value is string =>
                        Boolean(value)
                )
        )
    ).sort((a, b) =>
        a.localeCompare(b)
    );

    const colors = Array.from(
        new Set(
            relevantVariants
                .map(
                    (variant) =>
                        variant.color
                )
                .filter(
                    (
                        value
                    ): value is string =>
                        Boolean(value)
                )
        )
    ).sort((a, b) =>
        a.localeCompare(b)
    );

    // ==========================================
    // FILTER PRODUCTS
    // ==========================================

    let filteredProducts = [...products];

    // ------------------------------------------
    // CATEGORY
    // ------------------------------------------

    if (category) {
        filteredProducts =
            filteredProducts.filter(
                (product) =>
                    String(
                        product.category
                    ).toLowerCase() ===
                    category.toLowerCase()
            );
    }

    // ------------------------------------------
    // PRICE
    // ------------------------------------------

    if (price === "under-299") {
        filteredProducts =
            filteredProducts.filter(
                (product) =>
                    Number(
                        product.price
                    ) <= 299
            );
    }

    if (price === "under-499") {
        filteredProducts =
            filteredProducts.filter(
                (product) =>
                    Number(
                        product.price
                    ) <= 499
            );
    }

    if (price === "300-499") {
        filteredProducts =
            filteredProducts.filter(
                (product) => {
                    const value =
                        Number(
                            product.price
                        );

                    return (
                        value >= 300 &&
                        value <= 499
                    );
                }
            );
    }

    if (price === "500-plus") {
        filteredProducts =
            filteredProducts.filter(
                (product) =>
                    Number(
                        product.price
                    ) >= 500
            );
    }

    // ------------------------------------------
    // SIZE
    // ------------------------------------------

    if (size) {
        const matchingProductIds =
            new Set(
                variants
                    .filter(
                        (variant) =>
                            variant.size ===
                            size
                    )
                    .map(
                        (variant) =>
                            variant.product_id
                    )
            );

        filteredProducts =
            filteredProducts.filter(
                (product) =>
                    matchingProductIds.has(
                        product.id
                    )
            );
    }

    // ------------------------------------------
    // COLOR
    // ------------------------------------------

    if (color) {
        const matchingProductIds =
            new Set(
                variants
                    .filter(
                        (variant) =>
                            variant.color ===
                            color
                    )
                    .map(
                        (variant) =>
                            variant.product_id
                    )
            );

        filteredProducts =
            filteredProducts.filter(
                (product) =>
                    matchingProductIds.has(
                        product.id
                    )
            );
    }

    // ------------------------------------------
    // COLLECTION
    // ------------------------------------------

    if (collection === "new-arrivals") {
        filteredProducts =
            filteredProducts.slice(0, 50);
    }

    if (collection === "best-sellers") {
        filteredProducts =
            filteredProducts.filter(
                (product) =>
                    product.bestseller === true
            );
    }

    if (collection === "trending") {
        filteredProducts =
            filteredProducts.filter(
                (product) =>
                    product.trending === true
            );
    }

    // ==========================================
    // SORT
    // ==========================================

    if (sort === "price-low") {
        filteredProducts = [
            ...filteredProducts,
        ].sort(
            (a, b) =>
                Number(a.price) -
                Number(b.price)
        );
    }

    if (sort === "price-high") {
        filteredProducts = [
            ...filteredProducts,
        ].sort(
            (a, b) =>
                Number(b.price) -
                Number(a.price)
        );
    }

    if (sort === "name") {
        filteredProducts = [
            ...filteredProducts,
        ].sort(
            (a, b) =>
                a.title.localeCompare(
                    b.title
                )
        );
    }

    if (sort === "newest") {
        filteredProducts = [
            ...filteredProducts,
        ].sort(
            (a, b) =>
                new Date(
                    b.created_at || 0
                ).getTime() -
                new Date(
                    a.created_at || 0
                ).getTime()
        );
    }

    // ==========================================
    // ACTIVE FILTER COUNT
    // ==========================================

    const activeFilterCount = [
        category,
        price,
        size,
        color,
        collection,
    ].filter(Boolean).length;

    // ==========================================
    // PAGE
    // ==========================================

    return (
        <>
            <div className="print:hidden">
                <Navbar />
            </div>

            <section className="min-h-screen bg-pink-50 py-10 sm:py-14">

                <div className="max-w-7xl mx-auto px-5 sm:px-8">

                    {/* HEADER */}

                    <div className="text-center">

                        <h1 className="text-4xl sm:text-5xl font-bold text-pink-700">
                            Shop Collection
                        </h1>

                        <p className="text-gray-500 mt-3">
                            Discover jewellery and fashion
                            styles you&apos;ll love.
                        </p>

                    </div>

                    {/* ==========================================
                        FILTER PANEL
                    ========================================== */}

                    <form
                        method="GET"
                        action="/shop"
                        className="mt-8 bg-white rounded-2xl shadow-sm border border-pink-100 p-4 sm:p-5"
                    >

                        <div className="flex flex-col lg:flex-row lg:items-center gap-3">

                            {/* CATEGORY */}

                            <select
                                name="category"
                                defaultValue={
                                    category
                                }
                                className="w-full lg:flex-1 border border-pink-200 rounded-xl px-4 py-3 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-300"
                            >
                                <option value="">
                                    Category
                                </option>

                                {categories.map(
                                    (
                                        item
                                    ) => (
                                        <option
                                            key={
                                                item
                                            }
                                            value={
                                                item
                                            }
                                        >
                                            {formatCategory(
                                                item
                                            )}
                                        </option>
                                    )
                                )}
                            </select>

                            {/* PRICE */}

                            <select
                                name="price"
                                defaultValue={
                                    price
                                }
                                className="w-full lg:flex-1 border border-pink-200 rounded-xl px-4 py-3 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-300"
                            >
                                <option value="">
                                    Price
                                </option>

                                <option value="under-299">
                                    Under ₹299
                                </option>

                                <option value="300-499">
                                    ₹300 – ₹499
                                </option>

                                <option value="500-plus">
                                    ₹500+
                                </option>
                            </select>

                            {/* SIZE */}

                            <select
                                name="size"
                                defaultValue={
                                    size
                                }
                                className="w-full lg:flex-1 border border-pink-200 rounded-xl px-4 py-3 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-300"
                            >
                                <option value="">
                                    Size
                                </option>

                                {sizes.map(
                                    (
                                        item
                                    ) => (
                                        <option
                                            key={
                                                item
                                            }
                                            value={
                                                item
                                            }
                                        >
                                            {item}
                                        </option>
                                    )
                                )}
                            </select>

                            {/* COLOR */}

                            <select
                                name="color"
                                defaultValue={
                                    color
                                }
                                className="w-full lg:flex-1 border border-pink-200 rounded-xl px-4 py-3 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-300"
                            >
                                <option value="">
                                    Color
                                </option>

                                {colors.map(
                                    (
                                        item
                                    ) => (
                                        <option
                                            key={
                                                item
                                            }
                                            value={
                                                item
                                            }
                                        >
                                            {item}
                                        </option>
                                    )
                                )}
                            </select>

                            {/* SORT */}

                            <select
                                name="sort"
                                defaultValue={
                                    sort
                                }
                                className="w-full lg:flex-1 border border-pink-200 rounded-xl px-4 py-3 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-300"
                            >
                                <option value="newest">
                                    Sort: Newest
                                </option>

                                <option value="price-low">
                                    Price: Low to High
                                </option>

                                <option value="price-high">
                                    Price: High to Low
                                </option>

                                <option value="name">
                                    Name: A–Z
                                </option>
                            </select>

                            {/* APPLY */}

                            <button
                                type="submit"
                                className="shrink-0 px-6 py-3 rounded-xl bg-pink-600 text-white font-semibold hover:bg-pink-700 transition"
                            >
                                Apply
                            </button>

                            {/* CLEAR */}

                            {activeFilterCount >
                                0 && (
                                    <Link
                                        href="/shop"
                                        className="shrink-0 text-center px-5 py-3 rounded-xl border border-red-200 text-red-600 font-semibold hover:bg-red-50 transition"
                                    >
                                        Clear
                                    </Link>
                                )}

                        </div>

                        {/* QUICK FILTERS */}

                        <div className="mt-4 pt-4 border-t border-pink-100">

                            <div className="flex flex-wrap gap-2">

                                <Link
                                    href={buildShopUrl(
                                        {
                                            category:
                                                category ||
                                                undefined,
                                            price:
                                                price ||
                                                undefined,
                                            size:
                                                size ||
                                                undefined,
                                            color:
                                                color ||
                                                undefined,
                                            sort:
                                                sort ||
                                                undefined,
                                            collection:
                                                "new-arrivals",
                                        }
                                    )}
                                    className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                                        collection ===
                                        "new-arrivals"
                                            ? "bg-pink-600 text-white"
                                            : "bg-pink-50 text-pink-700 border border-pink-200 hover:bg-pink-100"
                                    }`}
                                >
                                    ✨ New Arrivals
                                </Link>

                                <Link
                                    href={buildShopUrl(
                                        {
                                            category:
                                                category ||
                                                undefined,
                                            price:
                                                price ||
                                                undefined,
                                            size:
                                                size ||
                                                undefined,
                                            color:
                                                color ||
                                                undefined,
                                            sort:
                                                sort ||
                                                undefined,
                                            collection:
                                                "best-sellers",
                                        }
                                    )}
                                    className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                                        collection ===
                                        "best-sellers"
                                            ? "bg-pink-600 text-white"
                                            : "bg-pink-50 text-pink-700 border border-pink-200 hover:bg-pink-100"
                                    }`}
                                >
                                    🔥 Best Sellers
                                </Link>

                                <Link
                                    href={buildShopUrl(
                                        {
                                            category:
                                                category ||
                                                undefined,
                                            price:
                                                price ||
                                                undefined,
                                            size:
                                                size ||
                                                undefined,
                                            color:
                                                color ||
                                                undefined,
                                            sort:
                                                sort ||
                                                undefined,
                                            collection:
                                                "trending",
                                        }
                                    )}
                                    className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                                        collection ===
                                        "trending"
                                            ? "bg-pink-600 text-white"
                                            : "bg-pink-50 text-pink-700 border border-pink-200 hover:bg-pink-100"
                                    }`}
                                >
                                    💕 Trending
                                </Link>

                            </div>

                        </div>

                    </form>

                    {/* RESULT COUNT */}

                    <div className="flex items-center justify-between mt-8">

                        <p className="text-gray-600">
                            Showing{" "}
                            <span className="font-bold text-gray-800">
                                {
                                    filteredProducts.length
                                }
                            </span>{" "}
                            product
                            {filteredProducts.length !==
                            1
                                ? "s"
                                : ""}
                        </p>

                        {category && (
                            <span className="bg-pink-100 text-pink-700 px-4 py-2 rounded-full text-sm font-semibold">
                                {formatCategory(
                                    category
                                )}
                            </span>
                        )}

                    </div>

                    {/* NO PRODUCTS */}

                    {filteredProducts.length ===
                    0 ? (
                        <div className="text-center mt-12 bg-white rounded-3xl p-10 shadow-sm">

                            <div className="text-5xl">
                                🔍
                            </div>

                            <h2 className="text-2xl font-bold text-gray-800 mt-4">
                                No Products Found
                            </h2>

                            <p className="text-gray-500 mt-2">
                                Try changing your
                                filters.
                            </p>

                            <Link
                                href="/shop"
                                className="inline-block mt-6 bg-pink-600 text-white px-7 py-3 rounded-xl font-semibold hover:bg-pink-700 transition"
                            >
                                Clear Filters
                            </Link>

                        </div>
                    ) : (

                        /* PRODUCT GRID */

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8 mt-6">

                            {filteredProducts.map(
                                (product) => {

                                    const hasVariants =
                                        variants.some(
                                            (
                                                variant
                                            ) =>
                                                variant.product_id ===
                                                product.id
                                        );

                                    return (
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
                                            subtitle={`₹${product.price ?? 0}`}
                                            stock={
                                                Number(
                                                    product.stock
                                                ) || 0
                                            }
                                            hasVariants={
                                                hasVariants
                                            }
                                            bestseller={
                                                product.bestseller ===
                                                true
                                            }
                                        />
                                    );
                                }
                            )}

                        </div>
                    )}

                </div>

            </section>

            <Footer />
        </>
    );
}