import Link from "next/link";
import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";
import Footer from "../components/Footer";

type Product = {
    id: number;
    created_at: string;
    title: string;
    image: string;
    price: string | number;
    stock: number;
    featured: boolean;
    bestseller: boolean;
    trending: boolean;
};

export const dynamic = "force-dynamic";

export default async function Home() {
    let products: Product[] = [];

    try {
        const supabaseUrl =
            process.env.NEXT_PUBLIC_SUPABASE_URL;

        const supabaseKey =
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (supabaseUrl && supabaseKey) {
            const response = await fetch(
                `${supabaseUrl}/rest/v1/products?select=*&order=created_at.desc`,
                {
                    method: "GET",
                    headers: {
                        apikey: supabaseKey,
                        Authorization: `Bearer ${supabaseKey}`,
                    },
                    cache: "no-store",
                }
            );

            if (response.ok) {
                products = await response.json();
            } else {
                console.error(
                    "Failed to fetch products:",
                    response.status
                );
            }
        }
    } catch (error) {
        console.error(
            "Products loading error:",
            error
        );
    }

    // ==========================================
    // HOMEPAGE COLLECTIONS
    // ==========================================

    const newArrivalProducts =
        products.slice(0, 8);

    const bestsellerProducts =
        products
            .filter(
                (product) => product.bestseller
            )
            .slice(0, 8);

    const trendingProducts =
        products
            .filter(
                (product) => product.trending
            )
            .slice(0, 8);

    const under299Products =
        products
            .filter(
                (product) =>
                    Number(product.price) <= 299
            )
            .slice(0, 8);

    const under499Products =
        products
            .filter(
                (product) =>
                    Number(product.price) <= 499
            )
            .slice(0, 8);

    const featuredProducts =
        products
            .filter(
                (product) => product.featured
            )
            .slice(0, 8);

    return (
        <>
            <Navbar />

            {/* ==========================================
                HERO
            ========================================== */}

            <section className="bg-gradient-to-r from-pink-50 to-white">

                <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">

                    <div className="min-h-[560px] md:min-h-[calc(100vh-88px)] flex items-center">

                        <div className="w-full md:max-w-xl py-16 md:py-20">

                            <span className="inline-block bg-pink-100 text-pink-700 px-4 sm:px-5 py-2 rounded-full font-semibold text-sm sm:text-base">
                                ✨ Premium Collection 2026
                            </span>

                            <h1 className="mt-6 text-5xl sm:text-6xl md:text-6xl font-extrabold text-pink-700 leading-[1.05]">
                                Elegance That Lasts
                            </h1>

                            <p className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed">
                                Premium Artificial Jewellery
                                <br />
                                For Every Occasion.
                            </p>

                            <div className="mt-8 md:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4">

                                <Link
                                    href="/shop"
                                    className="inline-flex items-center justify-center bg-pink-600 text-white px-7 sm:px-8 py-3.5 sm:py-4 rounded-full hover:bg-pink-700 transition font-medium"
                                >
                                    Shop Collection
                                </Link>

                                {/* EXPLORE CATEGORIES */}

                                <Link
                                    href="/products/categories"
                                    className="inline-flex items-center justify-center border-2 border-pink-600 text-pink-600 px-7 sm:px-8 py-3.5 sm:py-4 rounded-full hover:bg-pink-600 hover:text-white transition font-medium"
                                >
                                    Explore Categories
                                </Link>

                            </div>

                        </div>

                        <div className="hidden md:block flex-1 ml-10 lg:ml-16">

                            <img
                                src="/images/product1.jpg"
                                alt="APSRAA BY AVNI jewellery collection"
                                className="w-full max-w-[520px] h-[560px] lg:h-[650px] object-cover rounded-3xl shadow-2xl ml-auto"
                            />

                        </div>

                    </div>

                </div>

            </section>

            {/* ==========================================
                NEW ARRIVALS
            ========================================== */}

            <section className="py-16 md:py-24 bg-white">

                <div className="max-w-7xl mx-auto px-5 sm:px-8">

                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">

                        <div className="text-center sm:text-left">

                            <h2 className="text-4xl sm:text-5xl font-bold text-pink-700 leading-tight">
                                ✨ New Arrivals
                            </h2>

                            <p className="text-gray-500 mt-4">
                                Discover our latest additions.
                            </p>

                        </div>

                        <Link
                            href="/shop?collection=new-arrivals"
                            className="text-pink-600 font-semibold hover:text-pink-800 transition text-center sm:text-right"
                        >
                            View All New Arrivals →
                        </Link>

                    </div>

                    {newArrivalProducts.length > 0 ? (

                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 md:gap-10 mt-12 md:mt-16">

                            {newArrivalProducts.map(
                                (product) => (
                                    <ProductCard
                                        key={
                                            product.id
                                        }
                                        id={
                                            product.id
                                        }
                                        image={
                                            product.image
                                        }
                                        title={
                                            product.title
                                        }
                                        subtitle={`₹${product.price}`}
                                        stock={
                                            product.stock
                                        }
                                    />
                                )
                            )}

                        </div>

                    ) : (

                        <p className="text-center mt-16 text-gray-500">
                            No new arrivals available.
                        </p>

                    )}

                </div>

            </section>

            {/* ==========================================
                BEST SELLERS
            ========================================== */}

            <section className="py-16 md:py-24 bg-pink-50">

                <div className="max-w-7xl mx-auto px-5 sm:px-8">

                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">

                        <div className="text-center sm:text-left">

                            <h2 className="text-4xl sm:text-5xl font-bold text-pink-700 leading-tight">
                                🔥 Best Sellers
                            </h2>

                            <p className="text-gray-500 mt-4">
                                Loved by our customers.
                            </p>

                        </div>

                        <Link
                            href="/shop?collection=best-sellers"
                            className="text-pink-600 font-semibold hover:text-pink-800 transition text-center sm:text-right"
                        >
                            View All Best Sellers →
                        </Link>

                    </div>

                    {bestsellerProducts.length > 0 ? (

                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 md:gap-10 mt-12 md:mt-16">

                            {bestsellerProducts.map(
                                (product) => (
                                    <ProductCard
                                        key={
                                            product.id
                                        }
                                        id={
                                            product.id
                                        }
                                        image={
                                            product.image
                                        }
                                        title={
                                            product.title
                                        }
                                        subtitle={`₹${product.price}`}
                                        stock={
                                            product.stock
                                        }
                                    />
                                )
                            )}

                        </div>

                    ) : (

                        <p className="text-center mt-16 text-gray-500">
                            No best seller products available.
                        </p>

                    )}

                </div>

            </section>

            {/* ==========================================
                TRENDING
            ========================================== */}

            <section className="py-16 md:py-24 bg-white">

                <div className="max-w-7xl mx-auto px-5 sm:px-8">

                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">

                        <div className="text-center sm:text-left">

                            <h2 className="text-4xl sm:text-5xl font-bold text-pink-700 leading-tight">
                                💕 Trending
                            </h2>

                            <p className="text-gray-500 mt-4">
                                Styles everyone is loving right now.
                            </p>

                        </div>

                        <Link
                            href="/shop?collection=trending"
                            className="text-pink-600 font-semibold hover:text-pink-800 transition text-center sm:text-right"
                        >
                            View All Trending →
                        </Link>

                    </div>

                    {trendingProducts.length > 0 ? (

                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 md:gap-10 mt-12 md:mt-16">

                            {trendingProducts.map(
                                (product) => (
                                    <ProductCard
                                        key={
                                            product.id
                                        }
                                        id={
                                            product.id
                                        }
                                        image={
                                            product.image
                                        }
                                        title={
                                            product.title
                                        }
                                        subtitle={`₹${product.price}`}
                                        stock={
                                            product.stock
                                        }
                                    />
                                )
                            )}

                        </div>

                    ) : (

                        <p className="text-center mt-16 text-gray-500">
                            No trending products available.
                        </p>

                    )}

                </div>

            </section>

            {/* ==========================================
                UNDER ₹299
            ========================================== */}

            <section className="py-16 md:py-24 bg-pink-50">

                <div className="max-w-7xl mx-auto px-5 sm:px-8">

                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">

                        <div className="text-center sm:text-left">

                            <h2 className="text-4xl sm:text-5xl font-bold text-pink-700 leading-tight">
                                💰 Under ₹299
                            </h2>

                            <p className="text-gray-500 mt-4">
                                Beautiful jewellery at an amazing price.
                            </p>

                        </div>

                        <Link
                            href="/shop?collection=under-299"
                            className="text-pink-600 font-semibold hover:text-pink-800 transition text-center sm:text-right"
                        >
                            Shop Under ₹299 →
                        </Link>

                    </div>

                    {under299Products.length > 0 ? (

                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 md:gap-10 mt-12 md:mt-16">

                            {under299Products.map(
                                (product) => (
                                    <ProductCard
                                        key={
                                            product.id
                                        }
                                        id={
                                            product.id
                                        }
                                        image={
                                            product.image
                                        }
                                        title={
                                            product.title
                                        }
                                        subtitle={`₹${product.price}`}
                                        stock={
                                            product.stock
                                        }
                                    />
                                )
                            )}

                        </div>

                    ) : (

                        <p className="text-center mt-16 text-gray-500">
                            No products under ₹299 currently.
                        </p>

                    )}

                </div>

            </section>

            {/* ==========================================
                UNDER ₹499
            ========================================== */}

            <section className="py-16 md:py-24 bg-white">

                <div className="max-w-7xl mx-auto px-5 sm:px-8">

                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">

                        <div className="text-center sm:text-left">

                            <h2 className="text-4xl sm:text-5xl font-bold text-pink-700 leading-tight">
                                💰 Under ₹499
                            </h2>

                            <p className="text-gray-500 mt-4">
                                Premium styles at prices you'll love.
                            </p>

                        </div>

                        <Link
                            href="/shop?collection=under-499"
                            className="text-pink-600 font-semibold hover:text-pink-800 transition text-center sm:text-right"
                        >
                            Shop Under ₹499 →
                        </Link>

                    </div>

                    {under499Products.length > 0 ? (

                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 md:gap-10 mt-12 md:mt-16">

                            {under499Products.map(
                                (product) => (
                                    <ProductCard
                                        key={
                                            product.id
                                        }
                                        id={
                                            product.id
                                        }
                                        image={
                                            product.image
                                        }
                                        title={
                                            product.title
                                        }
                                        subtitle={`₹${product.price}`}
                                        stock={
                                            product.stock
                                        }
                                    />
                                )
                            )}

                        </div>

                    ) : (

                        <p className="text-center mt-16 text-gray-500">
                            No products under ₹499 currently.
                        </p>

                    )}

                </div>

            </section>

            {/* ==========================================
                FEATURED COLLECTION
            ========================================== */}

            <section className="py-16 md:py-24 bg-white">

                <div className="max-w-7xl mx-auto px-5 sm:px-8">

                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">

                        <div className="text-center sm:text-left">

                            <h2 className="text-4xl sm:text-5xl font-bold text-pink-700 leading-tight">
                                Featured Collection
                            </h2>

                            <p className="text-gray-500 mt-4">
                                Handpicked jewellery for every occasion.
                            </p>

                        </div>

                        <Link
                            href="/shop"
                            className="text-pink-600 font-semibold hover:text-pink-800 transition text-center sm:text-right"
                        >
                            View All Products →
                        </Link>

                    </div>

                    {featuredProducts.length > 0 ? (

                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 md:gap-10 mt-12 md:mt-16">

                            {featuredProducts.map(
                                (product) => (
                                    <ProductCard
                                        key={
                                            product.id
                                        }
                                        id={
                                            product.id
                                        }
                                        image={
                                            product.image
                                        }
                                        title={
                                            product.title
                                        }
                                        subtitle={`₹${product.price}`}
                                        stock={
                                            product.stock
                                        }
                                    />
                                )
                            )}

                        </div>

                    ) : (

                        <p className="text-center mt-16 text-gray-500">
                            No featured products available.
                        </p>

                    )}

                </div>

            </section>

            {/* ==========================================
                WHY CHOOSE APSRAA
            ========================================== */}

            <section className="py-16 md:py-24 bg-white">

                <div className="max-w-7xl mx-auto px-5 sm:px-8">

                    <h2 className="text-4xl sm:text-5xl font-bold text-center text-pink-700 leading-tight">
                        Why Choose APSRAA BY AVNI?
                    </h2>

                    <p className="text-center text-gray-500 mt-4">
                        We make shopping for jewellery simple, secure and delightful.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mt-12 md:mt-16">

                        <div className="bg-pink-50 rounded-3xl p-7 md:p-8 text-center shadow-md">

                            <div className="text-5xl">
                                💎
                            </div>

                            <h3 className="mt-4 text-xl md:text-2xl font-bold">
                                Premium Quality
                            </h3>

                            <p className="mt-3 text-gray-600">
                                Beautiful craftsmanship with elegant designs.
                            </p>

                        </div>

                        <div className="bg-pink-50 rounded-3xl p-7 md:p-8 text-center shadow-md">

                            <div className="text-5xl">
                                🚚
                            </div>

                            <h3 className="mt-4 text-xl md:text-2xl font-bold">
                                Fast Shipping
                            </h3>

                            <p className="mt-3 text-gray-600">
                                Quick delivery across India.
                            </p>

                        </div>

                        <div className="bg-pink-50 rounded-3xl p-7 md:p-8 text-center shadow-md">

                            <div className="text-5xl">
                                🔒
                            </div>

                            <h3 className="mt-4 text-xl md:text-2xl font-bold">
                                Secure Payment
                            </h3>

                            <p className="mt-3 text-gray-600">
                                Safe & Secure Payments.
                            </p>

                        </div>

                        <div className="bg-pink-50 rounded-3xl p-7 md:p-8 text-center shadow-md">

                            <div className="text-5xl">
                                ↩️
                            </div>

                            <h3 className="mt-4 text-xl md:text-2xl font-bold">
                                Easy Returns
                            </h3>

                            <p className="mt-3 text-gray-600">
                                Hassle-free returns on eligible products.
                            </p>

                        </div>

                    </div>

                </div>

            </section>

            <Footer />
        </>
    );
}