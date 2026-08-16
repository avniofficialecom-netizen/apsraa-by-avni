import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import ProductCard from "../../components/ProductCard";
import { supabase } from "../../lib/supabase";

export const dynamic = "force-dynamic";

type ShopProps = {
    searchParams: Promise<{
        collection?: string;
    }>;
};

const COLLECTIONS: Record<
    string,
    {
        title: string;
        description: string;
    }
> = {
    "new-arrivals": {
        title: "✨ New Arrivals",
        description:
            "Discover our latest jewellery additions.",
    },

    "best-sellers": {
        title: "🔥 Best Sellers",
        description:
            "Our most loved jewellery pieces.",
    },

    trending: {
        title: "💕 Trending",
        description:
            "Discover the styles everyone is loving.",
    },

    "under-299": {
        title: "💰 Under ₹299",
        description:
            "Beautiful jewellery at amazing prices.",
    },

    "under-499": {
        title: "💰 Under ₹499",
        description:
            "Premium styles at prices you'll love.",
    },
};

export default async function Shop({
                                       searchParams,
                                   }: ShopProps) {
    const params = await searchParams;

    const collection =
        params?.collection || "";

    const selectedCollection =
        COLLECTIONS[collection];

    const {
        data: products,
        error,
    } = await supabase
        .from("products")
        .select("*")
        .order("created_at", {
            ascending: false,
        });

    let filteredProducts =
        products || [];

    // ==========================================
    // SMART COLLECTION FILTERS
    // ==========================================

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

    if (collection === "under-299") {
        filteredProducts =
            filteredProducts.filter(
                (product) =>
                    Number(product.price) <=
                    299
            );
    }

    if (collection === "under-499") {
        filteredProducts =
            filteredProducts.filter(
                (product) =>
                    Number(product.price) <=
                    499
            );
    }

    return (
        <>
            <div className="print:hidden">
                <Navbar />
            </div>

            <section className="bg-pink-50 min-h-screen py-12 sm:py-16">

                <div className="max-w-7xl mx-auto px-5 sm:px-8">

                    {/* ==========================================
                        HEADING
                    ========================================== */}

                    <div className="text-center">

                        <h1 className="text-4xl sm:text-5xl font-bold text-pink-700">
                            {selectedCollection
                                ? selectedCollection.title
                                : "Shop Collection"}
                        </h1>

                        <p className="text-gray-500 mt-4">
                            {selectedCollection
                                ? selectedCollection.description
                                : "Discover our latest premium jewellery"}
                        </p>

                    </div>

                    {/* ==========================================
                        COLLECTION NAVIGATION
                    ========================================== */}

                    <div className="mt-8 flex gap-3 overflow-x-auto pb-2 justify-start lg:justify-center">

                        <a
                            href="/shop"
                            className={`shrink-0 px-5 py-2.5 rounded-full font-semibold transition ${
                                !collection
                                    ? "bg-pink-600 text-white"
                                    : "bg-white text-pink-700 border border-pink-200 hover:bg-pink-100"
                            }`}
                        >
                            All Products
                        </a>

                        <a
                            href="/shop?collection=new-arrivals"
                            className={`shrink-0 px-5 py-2.5 rounded-full font-semibold transition ${
                                collection ===
                                "new-arrivals"
                                    ? "bg-pink-600 text-white"
                                    : "bg-white text-pink-700 border border-pink-200 hover:bg-pink-100"
                            }`}
                        >
                            ✨ New Arrivals
                        </a>

                        <a
                            href="/shop?collection=best-sellers"
                            className={`shrink-0 px-5 py-2.5 rounded-full font-semibold transition ${
                                collection ===
                                "best-sellers"
                                    ? "bg-pink-600 text-white"
                                    : "bg-white text-pink-700 border border-pink-200 hover:bg-pink-100"
                            }`}
                        >
                            🔥 Best Sellers
                        </a>

                        <a
                            href="/shop?collection=trending"
                            className={`shrink-0 px-5 py-2.5 rounded-full font-semibold transition ${
                                collection ===
                                "trending"
                                    ? "bg-pink-600 text-white"
                                    : "bg-white text-pink-700 border border-pink-200 hover:bg-pink-100"
                            }`}
                        >
                            💕 Trending
                        </a>

                        <a
                            href="/shop?collection=under-299"
                            className={`shrink-0 px-5 py-2.5 rounded-full font-semibold transition ${
                                collection ===
                                "under-299"
                                    ? "bg-pink-600 text-white"
                                    : "bg-white text-pink-700 border border-pink-200 hover:bg-pink-100"
                            }`}
                        >
                            💰 Under ₹299
                        </a>

                        <a
                            href="/shop?collection=under-499"
                            className={`shrink-0 px-5 py-2.5 rounded-full font-semibold transition ${
                                collection ===
                                "under-499"
                                    ? "bg-pink-600 text-white"
                                    : "bg-white text-pink-700 border border-pink-200 hover:bg-pink-100"
                            }`}
                        >
                            💰 Under ₹499
                        </a>

                    </div>

                    {/* ==========================================
                        DATABASE ERROR
                    ========================================== */}

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

                    {/* ==========================================
                        NO PRODUCTS
                    ========================================== */}

                    {!error &&
                        filteredProducts.length ===
                        0 && (
                            <div className="text-center mt-16 bg-white rounded-3xl p-10">

                                <div className="text-5xl">
                                    💎
                                </div>

                                <h2 className="text-2xl font-bold text-gray-800 mt-4">
                                    No Products Found
                                </h2>

                                <p className="text-gray-500 mt-2">
                                    There are currently no products in this collection.
                                </p>

                                <a
                                    href="/shop"
                                    className="inline-block mt-6 bg-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-pink-700 transition"
                                >
                                    View All Products
                                </a>

                            </div>
                        )}

                    {/* ==========================================
                        PRODUCT GRID
                    ========================================== */}

                    {!error &&
                        filteredProducts.length >
                        0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8 mt-12">

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
                                                "Jewellery"
                                            }
                                            subtitle={`₹${product.price ?? 0}`}
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

            <Footer />
        </>
    );
}