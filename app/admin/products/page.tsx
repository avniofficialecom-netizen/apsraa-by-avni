"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminNavbar from "../../../components/AdminNavbar";
import Footer from "../../../components/Footer";
import { supabase } from "../../../lib/supabase";
import DeleteProductButton from "../../../components/DeleteProductButton";

type Product = {
    id: number;
    title: string;
    category: string;
    price: string;
    stock: number;
    image: string;
    featured: boolean;
    bestseller: boolean;
};

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProducts();
    }, []);

    async function loadProducts() {
        try {
            setLoading(true);

            const { data, error } = await supabase
                .from("products")
                .select("*")
                .order("id", {
                    ascending: false,
                });

            if (error) {
                console.error(
                    "Products loading error:",
                    error
                );

                alert(error.message);
                return;
            }

            setProducts(data ?? []);
        } finally {
            setLoading(false);
        }
    }

    const filteredProducts = products.filter(
        (product) => {
            const query =
                search.trim().toLowerCase();

            if (!query) return true;

            return (
                product.title
                    ?.toLowerCase()
                    .includes(query) ||
                product.category
                    ?.toLowerCase()
                    .includes(query)
            );
        }
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-50 overflow-x-hidden">

            <AdminNavbar />

            <main>

                {/* =====================================
                    HEADER
                ===================================== */}

                <section className="px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-6">

                    <div className="max-w-7xl mx-auto">

                        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                            <div>

                                <p className="text-sm font-semibold text-pink-600 uppercase tracking-wide">
                                    APSRAA ADMIN
                                </p>

                                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-pink-700 mt-1">
                                    Products
                                </h1>

                                <p className="text-sm sm:text-base text-gray-500 mt-2">
                                    Manage your jewellery catalog
                                </p>

                            </div>

                            <Link
                                href="/admin/add-product"
                                className="w-full sm:w-auto text-center bg-pink-600 text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-pink-700 active:scale-[0.98] transition shadow-md"
                            >
                                + Add Product
                            </Link>

                        </div>

                    </div>

                </section>

                {/* =====================================
                    SEARCH + PRODUCT COUNT
                ===================================== */}

                <section className="px-4 sm:px-6 lg:px-8 pb-6">

                    <div className="max-w-7xl mx-auto">

                        <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-4 sm:p-5">

                            <div className="relative">

                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">
                                    🔎
                                </span>

                                <input
                                    type="text"
                                    placeholder="Search products or categories..."
                                    value={search}
                                    onChange={(e) =>
                                        setSearch(
                                            e.target.value
                                        )
                                    }
                                    className="w-full border-2 border-gray-200 rounded-xl pl-11 pr-4 py-3.5 text-gray-800 placeholder-gray-400 focus:border-pink-500 focus:outline-none transition"
                                />

                                {search && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setSearch("")
                                        }
                                        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    >
                                        ×
                                    </button>
                                )}

                            </div>

                            <div className="flex items-center justify-between gap-3 mt-4 text-sm">

                                <p className="text-gray-500">
                                    Showing{" "}
                                    <span className="font-bold text-gray-800">
                                        {
                                            filteredProducts.length
                                        }
                                    </span>{" "}
                                    of{" "}
                                    <span className="font-bold text-gray-800">
                                        {products.length}
                                    </span>{" "}
                                    products
                                </p>

                                {search && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setSearch("")
                                        }
                                        className="text-pink-600 font-semibold hover:underline"
                                    >
                                        Clear
                                    </button>
                                )}

                            </div>

                        </div>

                    </div>

                </section>

                {/* =====================================
                    PRODUCTS
                ===================================== */}

                <section className="px-4 sm:px-6 lg:px-8 pb-12">

                    <div className="max-w-7xl mx-auto">

                        {/* Loading */}

                        {loading ? (

                            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-md p-10 sm:p-16 text-center">

                                <div className="text-5xl mb-4">
                                    💎
                                </div>

                                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                                    Loading Products...
                                </h2>

                                <p className="text-gray-500 mt-2">
                                    Please wait.
                                </p>

                            </div>

                        ) : filteredProducts.length ===
                        0 ? (

                            /* No products */

                            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-md p-10 sm:p-16 text-center">

                                <div className="text-5xl mb-5">
                                    💎
                                </div>

                                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
                                    No Products Found
                                </h2>

                                <p className="text-gray-500 mt-3">
                                    {search
                                        ? "Try a different search."
                                        : "Add your first jewellery product."}
                                </p>

                                {search ? (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setSearch("")
                                        }
                                        className="mt-6 bg-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-pink-700 transition"
                                    >
                                        Clear Search
                                    </button>
                                ) : (
                                    <Link
                                        href="/admin/add-product"
                                        className="inline-block mt-6 bg-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-pink-700 transition"
                                    >
                                        + Add Product
                                    </Link>
                                )}

                            </div>

                        ) : (

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">

                                {filteredProducts.map(
                                    (product) => (

                                        <article
                                            key={
                                                product.id
                                            }
                                            className="bg-white rounded-2xl sm:rounded-3xl shadow-md overflow-hidden hover:shadow-xl transition"
                                        >

                                            {/* =================================
                                                IMAGE
                                            ================================= */}

                                            <div className="relative bg-gray-100">

                                                <img
                                                    src={
                                                        product.image
                                                    }
                                                    alt={
                                                        product.title
                                                    }
                                                    loading="lazy"
                                                    className="w-full aspect-square sm:aspect-[4/3] object-cover"
                                                />

                                                {/* Product ID */}

                                                <span className="absolute top-3 left-3 bg-black/70 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                                                    #
                                                    {
                                                        product.id
                                                    }
                                                </span>

                                            </div>

                                            {/* =================================
                                                DETAILS
                                            ================================= */}

                                            <div className="p-4 sm:p-6">

                                                {/* Badges */}

                                                <div className="flex flex-wrap gap-2 min-h-[28px] mb-3">

                                                    {product.featured && (
                                                        <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-xs sm:text-sm font-semibold">
                                                            ⭐ Featured
                                                        </span>
                                                    )}

                                                    {product.bestseller && (
                                                        <span className="bg-pink-100 text-pink-700 px-2.5 py-1 rounded-full text-xs sm:text-sm font-semibold">
                                                            🔥 Bestseller
                                                        </span>
                                                    )}

                                                </div>

                                                {/* Title */}

                                                <h2 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug line-clamp-2">
                                                    {
                                                        product.title
                                                    }
                                                </h2>

                                                {/* Category */}

                                                <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                                                    {
                                                        product.category
                                                    }
                                                </p>

                                                {/* Price + Stock */}

                                                <div className="flex items-end justify-between gap-3 mt-4">

                                                    <div>

                                                        <p className="text-xs text-gray-400 uppercase tracking-wide">
                                                            Price
                                                        </p>

                                                        <p className="text-2xl sm:text-3xl font-bold text-pink-700">
                                                            ₹
                                                            {
                                                                product.price
                                                            }
                                                        </p>

                                                    </div>

                                                    <div className="text-right">

                                                        <p className="text-xs text-gray-400 uppercase tracking-wide">
                                                            Stock
                                                        </p>

                                                        <p
                                                            className={`text-lg sm:text-xl font-bold ${
                                                                product.stock <=
                                                                5
                                                                    ? "text-red-600"
                                                                    : "text-green-600"
                                                            }`}
                                                        >
                                                            {
                                                                product.stock
                                                            }
                                                        </p>

                                                    </div>

                                                </div>

                                                {/* =================================
                                                    ACTION BUTTONS
                                                ================================= */}

                                                <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mt-5">

                                                    <Link
                                                        href={`/admin/edit-product/${product.id}`}
                                                        className="bg-blue-600 text-white py-3 rounded-xl text-center font-semibold hover:bg-blue-700 active:scale-[0.98] transition"
                                                    >
                                                        ✏️ Edit
                                                    </Link>

                                                    <DeleteProductButton
                                                        id={
                                                            product.id
                                                        }
                                                    />

                                                </div>

                                            </div>

                                        </article>

                                    )
                                )}

                            </div>

                        )}

                    </div>

                </section>

            </main>

            <Footer />

        </div>
    );
}