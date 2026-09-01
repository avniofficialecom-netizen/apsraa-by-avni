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
    shop_hero?: boolean | null;
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
    if (category.toLowerCase() === "jewellery-sets") {
        return "Necklace Sets";
    }

    return category
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function buildShopUrl(
    params: Record<string, string | undefined>
) {
    const search = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value) {
            search.set(key, value);
        }
    });

    const query = search.toString();

    return query ? `/shop?${query}` : "/shop";
}

function preserveFilters(
    current: {
        category: string;
        price: string;
        size: string;
        color: string;
        sort: string;
    },
    extra: Record<string, string | undefined>
) {
    return buildShopUrl({
        category: current.category || undefined,
        price: current.price || undefined,
        size: current.size || undefined,
        color: current.color || undefined,
        sort: current.sort || undefined,
        ...extra,
    });
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

    const currentFilters = {
        category,
        price,
        size,
        color,
        sort,
    };

    // ==========================================
    // PRODUCTS
    // ==========================================

    const {
        data: productData,
        error: productError,
    } = await supabase
        .from("products")
        .select(
            "id, title, price, image, stock, category, bestseller, trending, featured, shop_hero, created_at"
        )
        .order("created_at", {
            ascending: false,
        });

    if (productError) {
        return (
            <>
                <Navbar />

                <main className="min-h-screen bg-[#fff9fc] py-16 px-5">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white rounded-3xl border border-pink-100 p-10 text-center shadow-sm">
                            <div className="text-4xl">
                                ⚠️
                            </div>

                            <h1 className="text-2xl font-bold text-gray-900 mt-4">
                                Unable to load products
                            </h1>

                            <p className="text-gray-500 mt-2">
                                Please try again later.
                            </p>
                        </div>
                    </div>
                </main>

                <Footer />
            </>
        );
    }

    const products = (productData || []) as Product[];

    // ==========================================
    // SHOP HERO
    // Admin-selected Shop Hero remains dynamic.
    // ==========================================

    const heroProduct =
        products.find(
            (product) =>
                product.shop_hero === true &&
                Boolean(product.image)
        ) ||
        products.find(
            (product) =>
                product.featured === true &&
                Boolean(product.image)
        ) ||
        products.find(
            (product) =>
                product.bestseller === true &&
                Boolean(product.image)
        ) ||
        products.find(
            (product) => Boolean(product.image)
        );

    // ==========================================
    // VARIANTS
    // ==========================================

    const {
        data: variantData,
        error: variantError,
    } = await supabase
        .from("product_variants")
        .select("id, product_id, size, color, stock");

    if (variantError) {
        console.error(
            "Shop variant loading error:",
            variantError
        );
    }

    const variants = (variantData || []) as Variant[];

    // ==========================================
    // CATEGORIES
    // ==========================================

    const categories = Array.from(
        new Set(
            products
                .map((product) => product.category)
                .filter(
                    (value): value is string =>
                        Boolean(value)
                )
        )
    ).sort((a, b) => a.localeCompare(b));

    // ==========================================
    // VARIANT OPTIONS
    // ==========================================

    const relevantVariantProductIds = category
        ? new Set(
              products
                  .filter(
                      (product) =>
                          String(product.category).toLowerCase() ===
                          category.toLowerCase()
                  )
                  .map((product) => product.id)
          )
        : null;

    const relevantVariants = relevantVariantProductIds
        ? variants.filter((variant) =>
              relevantVariantProductIds.has(
                  variant.product_id
              )
          )
        : variants;

    const sizes = Array.from(
        new Set(
            relevantVariants
                .map((variant) => variant.size)
                .filter(
                    (value): value is string =>
                        Boolean(value)
                )
        )
    ).sort((a, b) => a.localeCompare(b));

    const colors = Array.from(
        new Set(
            relevantVariants
                .map((variant) => variant.color)
                .filter(
                    (value): value is string =>
                        Boolean(value)
                )
        )
    ).sort((a, b) => a.localeCompare(b));

    // ==========================================
    // FILTER PRODUCTS
    // ==========================================

    let filteredProducts = [...products];

    if (category) {
        filteredProducts = filteredProducts.filter(
            (product) =>
                String(product.category).toLowerCase() ===
                category.toLowerCase()
        );
    }

    if (price === "under-299") {
        filteredProducts = filteredProducts.filter(
            (product) => Number(product.price) <= 299
        );
    }

    if (price === "300-499") {
        filteredProducts = filteredProducts.filter(
            (product) => {
                const value = Number(product.price);

                return value >= 300 && value <= 499;
            }
        );
    }

    if (price === "500-plus") {
        filteredProducts = filteredProducts.filter(
            (product) => Number(product.price) >= 500
        );
    }

    if (size) {
        const matchingProductIds = new Set(
            variants
                .filter((variant) => variant.size === size)
                .map((variant) => variant.product_id)
        );

        filteredProducts = filteredProducts.filter(
            (product) =>
                matchingProductIds.has(product.id)
        );
    }

    if (color) {
        const matchingProductIds = new Set(
            variants
                .filter((variant) => variant.color === color)
                .map((variant) => variant.product_id)
        );

        filteredProducts = filteredProducts.filter(
            (product) =>
                matchingProductIds.has(product.id)
        );
    }

    // ==========================================
    // COLLECTIONS
    // ==========================================

    if (collection === "new-arrivals") {
        filteredProducts = filteredProducts.slice(0, 50);
    }

    if (collection === "best-sellers") {
        filteredProducts = filteredProducts.filter(
            (product) => product.bestseller === true
        );
    }

    if (collection === "trending") {
        filteredProducts = filteredProducts.filter(
            (product) => product.trending === true
        );
    }

    // ==========================================
    // SORT
    // ==========================================

    if (sort === "price-low") {
        filteredProducts = [...filteredProducts].sort(
            (a, b) =>
                Number(a.price) - Number(b.price)
        );
    }

    if (sort === "price-high") {
        filteredProducts = [...filteredProducts].sort(
            (a, b) =>
                Number(b.price) - Number(a.price)
        );
    }

    if (sort === "name") {
        filteredProducts = [...filteredProducts].sort(
            (a, b) =>
                a.title.localeCompare(b.title)
        );
    }

    if (sort === "newest") {
        filteredProducts = [...filteredProducts].sort(
            (a, b) =>
                new Date(b.created_at || 0).getTime() -
                new Date(a.created_at || 0).getTime()
        );
    }

    const activeFilterCount = [
        category,
        price,
        size,
        color,
        collection,
    ].filter(Boolean).length;

    const totalProducts = products.length;

    return (
        <>
            <Navbar />

            <main className="min-h-screen bg-white">

                {/* ==========================================
                    EDITORIAL SHOP HERO
                ========================================== */}

                <section className="relative overflow-hidden bg-gradient-to-r from-[#fff4f7] via-[#fff9fb] to-[#f9eeee] border-b border-pink-100">

                    <div className="max-w-[1500px] mx-auto">

                        <div className="grid lg:grid-cols-2 min-h-[500px] lg:min-h-[560px]">

                            {/* ==================================
                                HERO COPY
                            ================================== */}

                            <div className="flex items-center px-6 sm:px-10 lg:px-16 xl:px-20 py-14 lg:py-20">

                                <div className="max-w-2xl">

                                    <p className="text-[10px] sm:text-xs uppercase tracking-[0.35em] font-semibold text-pink-600 mb-7">
                                        APSRAA BY AVNI
                                    </p>

                                    <div className="flex items-center gap-4 mb-6">
                                        <span className="h-px w-16 bg-[#d7aa58]" />
                                        <span className="text-[#d7aa58] text-xl">
                                            ✦
                                        </span>
                                        <span className="h-px w-16 bg-[#d7aa58]" />
                                    </div>

                                    <h1 className="font-serif text-5xl sm:text-6xl lg:text-[72px] xl:text-[82px] leading-[0.92] tracking-[-0.045em] text-[#182033]">

                                        Discover the

                                        <br />

                                        APSRAA{" "}

                                        <span className="text-pink-600">
                                            Collection
                                        </span>

                                    </h1>

                                    <div className="flex items-center gap-4 my-7">
                                        <span className="h-px w-20 bg-[#d7aa58]" />
                                        <span className="text-[#d7aa58] text-2xl">
                                            ✦
                                        </span>
                                        <span className="h-px w-20 bg-[#d7aa58]" />
                                    </div>

                                    <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-xl leading-relaxed">
                                        Handpicked jewellery that
                                        celebrates your style and
                                        adds a little extra shine
                                        to every moment.
                                    </p>

                                    {/* COLLECTION LINKS */}

                                    <div className="flex flex-wrap gap-2.5 mt-8">

                                        <Link
                                            href="/shop"
                                            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                                                !collection
                                                    ? "bg-[#182033] text-white shadow-lg"
                                                    : "bg-white text-gray-700 border border-gray-200 hover:border-pink-300"
                                            }`}
                                        >
                                            All Jewellery
                                        </Link>

                                        <Link
                                            href={preserveFilters(
                                                currentFilters,
                                                {
                                                    collection:
                                                        "new-arrivals",
                                                }
                                            )}
                                            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                                                collection ===
                                                "new-arrivals"
                                                    ? "bg-pink-600 text-white"
                                                    : "bg-white text-gray-700 border border-gray-200 hover:border-pink-300"
                                            }`}
                                        >
                                            New Arrivals
                                        </Link>

                                        <Link
                                            href={preserveFilters(
                                                currentFilters,
                                                {
                                                    collection:
                                                        "best-sellers",
                                                }
                                            )}
                                            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                                                collection ===
                                                "best-sellers"
                                                    ? "bg-pink-600 text-white"
                                                    : "bg-white text-gray-700 border border-gray-200 hover:border-pink-300"
                                            }`}
                                        >
                                            Best Sellers
                                        </Link>

                                        <Link
                                            href={preserveFilters(
                                                currentFilters,
                                                {
                                                    collection:
                                                        "trending",
                                                }
                                            )}
                                            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                                                collection ===
                                                "trending"
                                                    ? "bg-pink-600 text-white"
                                                    : "bg-white text-gray-700 border border-gray-200 hover:border-pink-300"
                                            }`}
                                        >
                                            Trending
                                        </Link>

                                    </div>

                                </div>

                            </div>

                            {/* ==================================
                                HERO IMAGE
                            ================================== */}

                            {heroProduct?.image && (
                                <Link
                                    href={`/product/${heroProduct.id}`}
                                    className="group relative min-h-[380px] lg:min-h-full overflow-hidden"
                                >

                                    <img
                                        src={heroProduct.image}
                                        alt={heroProduct.title}
                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.025]"
                                    />

                                    {/* SOFT IMAGE BLEND */}

                                    <div className="absolute inset-0 bg-gradient-to-r from-[#fff4f7]/70 via-transparent to-transparent lg:w-1/3" />

                                    {/* APSRAA EDIT */}

                                    <div className="absolute top-7 left-7 bg-white/95 backdrop-blur-sm rounded-full px-5 py-2.5 text-xs font-semibold tracking-wide text-gray-800 shadow-sm">
                                        APSRAA EDIT
                                    </div>

                                </Link>
                            )}

                        </div>

                    </div>

                </section>

                {/* ==========================================
                    SHOP CONTENT
                ========================================== */}

                <section className="max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-10 py-10 lg:py-14">

                    <div className="grid lg:grid-cols-[220px_1fr] xl:grid-cols-[240px_1fr] gap-8 xl:gap-12">

                        {/* ==================================
                            FILTER SIDEBAR
                        ================================== */}

                        <aside className="hidden lg:block">

                            <div className="sticky top-24">

                                <div className="flex items-center justify-between pb-5 border-b border-gray-200">

                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Filters
                                    </h2>

                                    <span className="text-lg text-gray-500">
                                        ☷
                                    </span>

                                </div>

                                {/* CATEGORIES */}

                                <div className="py-6 border-b border-gray-200">

                                    <div className="flex items-center justify-between mb-5">
                                        <h3 className="text-sm font-semibold text-gray-900">
                                            Categories
                                        </h3>

                                        <span className="text-gray-500">
                                            ⌃
                                        </span>
                                    </div>

                                    <div className="space-y-4">

                                        <Link
                                            href="/shop"
                                            className="flex items-center gap-3 text-sm text-gray-700"
                                        >
                                            <span
                                                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                                    !category
                                                        ? "border-pink-600"
                                                        : "border-gray-300"
                                                }`}
                                            >
                                                {!category && (
                                                    <span className="w-2 h-2 rounded-full bg-pink-600" />
                                                )}
                                            </span>

                                            All Jewellery
                                        </Link>

                                        {categories.map(
                                            (item) => (
                                                <Link
                                                    key={item}
                                                    href={preserveFilters(
                                                        currentFilters,
                                                        {
                                                            category:
                                                                item,
                                                        }
                                                    )}
                                                    className="flex items-center gap-3 text-sm text-gray-700 hover:text-pink-600 transition"
                                                >
                                                    <span
                                                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                                            category.toLowerCase() ===
                                                            item.toLowerCase()
                                                                ? "border-pink-600"
                                                                : "border-gray-300"
                                                        }`}
                                                    >
                                                        {category.toLowerCase() ===
                                                            item.toLowerCase() && (
                                                            <span className="w-2 h-2 rounded-full bg-pink-600" />
                                                        )}
                                                    </span>

                                                    {formatCategory(
                                                        item
                                                    )}
                                                </Link>
                                            )
                                        )}

                                    </div>

                                </div>

                                {/* PRICE */}

                                <div className="py-6 border-b border-gray-200">

                                    <div className="flex items-center justify-between mb-5">

                                        <h3 className="text-sm font-semibold text-gray-900">
                                            Price Range
                                        </h3>

                                        <span className="text-gray-500">
                                            ⌄
                                        </span>

                                    </div>

                                    <div className="space-y-3">

                                        <Link
                                            href={preserveFilters(
                                                currentFilters,
                                                {
                                                    price:
                                                        "under-299",
                                                }
                                            )}
                                            className={`block text-sm ${
                                                price ===
                                                "under-299"
                                                    ? "text-pink-600 font-semibold"
                                                    : "text-gray-600"
                                            }`}
                                        >
                                            Under ₹299
                                        </Link>

                                        <Link
                                            href={preserveFilters(
                                                currentFilters,
                                                {
                                                    price:
                                                        "300-499",
                                                }
                                            )}
                                            className={`block text-sm ${
                                                price ===
                                                "300-499"
                                                    ? "text-pink-600 font-semibold"
                                                    : "text-gray-600"
                                            }`}
                                        >
                                            ₹300 – ₹499
                                        </Link>

                                        <Link
                                            href={preserveFilters(
                                                currentFilters,
                                                {
                                                    price:
                                                        "500-plus",
                                                }
                                            )}
                                            className={`block text-sm ${
                                                price ===
                                                "500-plus"
                                                    ? "text-pink-600 font-semibold"
                                                    : "text-gray-600"
                                            }`}
                                        >
                                            ₹500+
                                        </Link>

                                    </div>

                                </div>

                                {/* QUICK COLLECTIONS */}

                                <div className="py-6">

                                    <h3 className="text-sm font-semibold text-gray-900 mb-4">
                                        Collections
                                    </h3>

                                    <div className="space-y-3">

                                        <Link
                                            href="/shop?collection=new-arrivals"
                                            className="block text-sm text-gray-600 hover:text-pink-600"
                                        >
                                            ✨ New Arrivals
                                        </Link>

                                        <Link
                                            href="/shop?collection=best-sellers"
                                            className="block text-sm text-gray-600 hover:text-pink-600"
                                        >
                                            🔥 Best Sellers
                                        </Link>

                                        <Link
                                            href="/shop?collection=trending"
                                            className="block text-sm text-gray-600 hover:text-pink-600"
                                        >
                                            ♡ Trending
                                        </Link>

                                    </div>

                                </div>

                            </div>

                        </aside>

                        {/* ==================================
                            PRODUCTS AREA
                        ================================== */}

                        <div className="min-w-0">

                            {/* MOBILE FILTERS */}

                            <div className="lg:hidden bg-[#fff9fc] border border-pink-100 rounded-2xl p-4 mb-7">

                                <form
                                    method="GET"
                                    action="/shop"
                                    className="grid grid-cols-2 gap-2.5"
                                >

                                    <select
                                        name="category"
                                        defaultValue={category}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-3 bg-white text-xs text-gray-700"
                                    >
                                        <option value="">
                                            All Categories
                                        </option>

                                        {categories.map(
                                            (item) => (
                                                <option
                                                    key={item}
                                                    value={item}
                                                >
                                                    {formatCategory(
                                                        item
                                                    )}
                                                </option>
                                            )
                                        )}
                                    </select>

                                    <select
                                        name="price"
                                        defaultValue={price}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-3 bg-white text-xs text-gray-700"
                                    >
                                        <option value="">
                                            Any Price
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

                                    <select
                                        name="size"
                                        defaultValue={size}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-3 bg-white text-xs text-gray-700"
                                    >
                                        <option value="">
                                            Any Size
                                        </option>

                                        {sizes.map(
                                            (item) => (
                                                <option
                                                    key={item}
                                                    value={item}
                                                >
                                                    {item}
                                                </option>
                                            )
                                        )}
                                    </select>

                                    <select
                                        name="color"
                                        defaultValue={color}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-3 bg-white text-xs text-gray-700"
                                    >
                                        <option value="">
                                            Any Color
                                        </option>

                                        {colors.map(
                                            (item) => (
                                                <option
                                                    key={item}
                                                    value={item}
                                                >
                                                    {item}
                                                </option>
                                            )
                                        )}
                                    </select>

                                    <select
                                        name="sort"
                                        defaultValue={sort}
                                        className="col-span-2 w-full border border-gray-200 rounded-xl px-3 py-3 bg-white text-xs text-gray-700"
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

                                    {collection && (
                                        <input
                                            type="hidden"
                                            name="collection"
                                            value={collection}
                                        />
                                    )}

                                    <button
                                        type="submit"
                                        className="col-span-2 bg-[#182033] text-white rounded-xl py-3 text-sm font-semibold"
                                    >
                                        Apply Filters
                                    </button>

                                </form>

                            </div>

                            {/* RESULTS HEADER */}

                            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">

                                <div>

                                    <div className="flex items-center gap-3">

                                        <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900">
                                            {collection
                                                ? formatCategory(
                                                      collection
                                                  )
                                                : category
                                                ? formatCategory(
                                                      category
                                                  )
                                                : "All Jewellery"}
                                        </h2>

                                        <span className="text-sm text-gray-400">
                                            (
                                            {
                                                filteredProducts.length
                                            }{" "}
                                            Products)
                                        </span>

                                    </div>

                                </div>

                                <div className="flex items-center gap-3">

                                    {activeFilterCount >
                                        0 && (
                                        <Link
                                            href="/shop"
                                            className="text-xs sm:text-sm font-semibold text-pink-600"
                                        >
                                            Clear all
                                        </Link>
                                    )}

                                    <form
                                        method="GET"
                                        action="/shop"
                                    >

                                        {category && (
                                            <input
                                                type="hidden"
                                                name="category"
                                                value={
                                                    category
                                                }
                                            />
                                        )}

                                        {price && (
                                            <input
                                                type="hidden"
                                                name="price"
                                                value={price}
                                            />
                                        )}

                                        {size && (
                                            <input
                                                type="hidden"
                                                name="size"
                                                value={size}
                                            />
                                        )}

                                        {color && (
                                            <input
                                                type="hidden"
                                                name="color"
                                                value={color}
                                            />
                                        )}

                                        {collection && (
                                            <input
                                                type="hidden"
                                                name="collection"
                                                value={
                                                    collection
                                                }
                                            />
                                        )}

                                        <label className="flex items-center gap-2 text-sm text-gray-500">

                                            <span>
                                                Sort by:
                                            </span>

                                            <select
                                                name="sort"
                                                defaultValue={
                                                    sort
                                                }
                                                className="border border-gray-200 rounded-xl bg-white px-4 py-2.5 text-sm text-gray-700 focus:outline-none"
                                            >
                                                <option value="newest">
                                                    Latest
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

                                            <button
                                                type="submit"
                                                className="hidden"
                                            >
                                                Sort
                                            </button>

                                        </label>

                                    </form>

                                </div>

                            </div>

                            {/* ACTIVE FILTERS */}

                            {activeFilterCount > 0 && (
                                <div className="flex flex-wrap gap-2 mb-6">

                                    {category && (
                                        <span className="px-3 py-1.5 bg-pink-50 text-pink-700 rounded-full text-xs font-semibold">
                                            {formatCategory(
                                                category
                                            )}
                                        </span>
                                    )}

                                    {price && (
                                        <span className="px-3 py-1.5 bg-pink-50 text-pink-700 rounded-full text-xs font-semibold">
                                            {price ===
                                            "under-299"
                                                ? "Under ₹299"
                                                : price ===
                                                  "300-499"
                                                ? "₹300 – ₹499"
                                                : "₹500+"}
                                        </span>
                                    )}

                                    {size && (
                                        <span className="px-3 py-1.5 bg-pink-50 text-pink-700 rounded-full text-xs font-semibold">
                                            Size: {size}
                                        </span>
                                    )}

                                    {color && (
                                        <span className="px-3 py-1.5 bg-pink-50 text-pink-700 rounded-full text-xs font-semibold">
                                            Color: {color}
                                        </span>
                                    )}

                                </div>
                            )}

                            {/* ==================================
                                PRODUCT GRID
                            ================================== */}

                            {filteredProducts.length === 0 ? (
                                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center">

                                    <div className="text-4xl">
                                        🔍
                                    </div>

                                    <h2 className="text-xl font-bold text-gray-900 mt-4">
                                        Nothing matched
                                    </h2>

                                    <p className="text-sm text-gray-500 mt-2">
                                        Try changing your
                                        filters.
                                    </p>

                                    <Link
                                        href="/shop"
                                        className="inline-flex mt-5 bg-[#182033] text-white px-6 py-3 rounded-xl text-sm font-semibold"
                                    >
                                        View All Products
                                    </Link>

                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-3 sm:gap-x-5 lg:gap-x-6 gap-y-8 sm:gap-y-10">

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
                                                <div
                                                    key={
                                                        product.id
                                                    }
                                                    className="group min-w-0"
                                                >

                                                    <ProductCard
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
                                                        hasVariants={
                                                            hasVariants
                                                        }
                                                        bestseller={
                                                            product.bestseller ===
                                                            true
                                                        }
                                                    />

                                                </div>
                                            );
                                        }
                                    )}

                                </div>
                            )}

                        </div>

                    </div>

                </section>

            </main>

            <Footer />
        </>
    );
}