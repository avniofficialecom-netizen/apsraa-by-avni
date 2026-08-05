"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";
import Footer from "../components/Footer";
import { supabase } from "../lib/supabase";

type Product = {
    id: number;
    title: string;
    image: string;
    price: string;
    featured: boolean;
    bestseller: boolean;
};

export default function Home() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchProducts() {
            const { data, error } = await supabase
                .from("products")
                .select("*")
                .order("id", { ascending: false });

            if (!error && data) {
                setProducts(data);
            }

            setLoading(false);
        }

        fetchProducts();
    }, []);

    const featuredProducts = products.filter((p) => p.featured);
    const bestsellerProducts = products.filter((p) => p.bestseller);

    return (
        <>
            <Navbar />

            {/* Hero Section */}
            <section className="min-h-screen bg-gradient-to-r from-pink-50 to-white px-10">
                <div className="max-w-7xl mx-auto h-screen flex items-center justify-between">

                    <div className="max-w-xl">

                        <span className="bg-pink-100 text-pink-700 px-5 py-2 rounded-full font-semibold">
                            ✨ Premium Collection 2026
                        </span>

                        <h1 className="mt-6 text-6xl font-extrabold text-pink-700 leading-tight">
                            Elegance That Lasts
                        </h1>

                        <p className="mt-6 text-xl text-gray-600">
                            Premium Artificial Jewellery
                            <br />
                            For Every Occasion.
                        </p>

                        <div className="mt-10 flex gap-4">

                            <Link
                                href="/shop"
                                className="bg-pink-600 text-white px-8 py-4 rounded-full hover:bg-pink-700 transition"
                            >
                                Shop Collection
                            </Link>

                            <Link
                                href="/shop"
                                className="border-2 border-pink-600 text-pink-600 px-8 py-4 rounded-full hover:bg-pink-600 hover:text-white transition"
                            >
                                Explore Categories
                            </Link>

                        </div>

                    </div>

                    <div>
                        <img
                            src="/images/product1.jpg"
                            alt="APSRAA BY AVNI"
                            className="w-[520px] h-[650px] object-cover rounded-3xl shadow-2xl"
                        />
                    </div>

                </div>
            </section>

            {/* Featured Products */}
            <section className="py-24 bg-white">

                <h2 className="text-5xl font-bold text-center text-pink-700">
                    Featured Collection
                </h2>

                <p className="text-center text-gray-500 mt-4">
                    Handpicked jewellery for every occasion.
                </p>

                {loading ? (
                    <p className="text-center mt-16 text-xl">
                        Loading...
                    </p>
                ) : (
                    <div className="grid md:grid-cols-3 gap-10 max-w-7xl mx-auto mt-16 px-8">

                        {featuredProducts.map((product) => (
                            <ProductCard
                                key={product.id}
                                id={product.id}
                                image={product.image}
                                title={product.title}
                                subtitle={`₹${product.price}`}
                            />
                        ))}

                    </div>
                )}

            </section>

            {/* Best Sellers */}
            <section className="py-24 bg-pink-50">

                <h2 className="text-5xl font-bold text-center text-pink-700">
                    Best Sellers
                </h2>

                <p className="text-center text-gray-500 mt-4">
                    Loved by our customers.
                </p>

                {loading ? (
                    <p className="text-center mt-16 text-xl">
                        Loading...
                    </p>
                ) : (
                    <div className="grid md:grid-cols-3 gap-10 max-w-7xl mx-auto mt-16 px-8">

                        {bestsellerProducts.map((product) => (
                            <ProductCard
                                key={product.id}
                                id={product.id}
                                image={product.image}
                                title={product.title}
                                subtitle={`₹${product.price}`}
                            />
                        ))}

                    </div>
                )}

            </section>

            {/* Why Choose Us */}
            <section className="py-24 bg-white">

                <h2 className="text-5xl font-bold text-center text-pink-700">
                    Why Choose APSRAA BY AVNI?
                </h2>

                <p className="text-center text-gray-500 mt-4">
                    We make shopping for jewellery simple, secure and delightful.
                </p>

                <div className="grid md:grid-cols-4 gap-8 max-w-7xl mx-auto mt-16 px-8">

                    <div className="bg-pink-50 rounded-3xl p-8 text-center shadow-md">
                        <div className="text-5xl">💎</div>
                        <h3 className="mt-4 text-2xl font-bold">Premium Quality</h3>
                        <p className="mt-3 text-gray-600">
                            Beautiful craftsmanship with elegant designs.
                        </p>
                    </div>

                    <div className="bg-pink-50 rounded-3xl p-8 text-center shadow-md">
                        <div className="text-5xl">🚚</div>
                        <h3 className="mt-4 text-2xl font-bold">Fast Shipping</h3>
                        <p className="mt-3 text-gray-600">
                            Quick delivery across India.
                        </p>
                    </div>

                    <div className="bg-pink-50 rounded-3xl p-8 text-center shadow-md">
                        <div className="text-5xl">🔒</div>
                        <h3 className="mt-4 text-2xl font-bold">Secure Payment</h3>
                        <p className="mt-3 text-gray-600">
                            Safe & Secure Payments.
                        </p>
                    </div>

                    <div className="bg-pink-50 rounded-3xl p-8 text-center shadow-md">
                        <div className="text-5xl">↩️</div>
                        <h3 className="mt-4 text-2xl font-bold">Easy Returns</h3>
                        <p className="mt-3 text-gray-600">
                            Hassle-free returns on eligible products.
                        </p>
                    </div>

                </div>

            </section>

            <Footer />
        </>
    );
}