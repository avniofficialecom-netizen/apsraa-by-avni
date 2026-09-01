 "use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminNavbar from "../../../../components/AdminNavbar";
import Footer from "../../../../components/Footer";
import { supabase } from "../../../../lib/supabase";

type Product = {
    id: number;
    title: string;
    category: string;
    price: string;
    stock: number;
    image: string;
    featured: boolean;
};

export default function FeaturedProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(
        new Set()
    );
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        loadProducts();
    }, []);

    async function loadProducts() {
        try {
            setLoading(true);
            setMessage("");

            const { data, error } = await supabase
                .from("products")
                .select(
                    "id, title, category, price, stock, image, featured"
                )
                .order("id", { ascending: false });

            if (error) {
                console.error(
                    "Featured products loading error:",
                    error
                );
                alert(error.message);
                return;
            }

            const rows = (data ?? []) as Product[];
            setProducts(rows);
            setSelectedIds(
                new Set(
                    rows
                        .filter((product) => product.featured)
                        .map((product) => product.id)
                )
            );
        } finally {
            setLoading(false);
        }
    }

    const filteredProducts = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) return products;

        return products.filter((product) =>
            [product.title, product.category]
                .filter(Boolean)
                .some((value) =>
                    value.toLowerCase().includes(query)
                )
        );
    }, [products, search]);

    const featuredCount = selectedIds.size;

    function toggleFeatured(id: number) {
        setSelectedIds((current) => {
            const next = new Set(current);

            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }

            return next;
        });

        setMessage("");
    }

    function selectAllVisible() {
        setSelectedIds((current) => {
            const next = new Set(current);

            filteredProducts.forEach((product) => {
                next.add(product.id);
            });

            return next;
        });

        setMessage("");
    }

    function clearAllVisible() {
        setSelectedIds((current) => {
            const next = new Set(current);

            filteredProducts.forEach((product) => {
                next.delete(product.id);
            });

            return next;
        });

        setMessage("");
    }

    async function saveFeaturedProducts() {
        try {
            setSaving(true);
            setMessage("");

            const originalFeatured = new Set(
                products
                    .filter((product) => product.featured)
                    .map((product) => product.id)
            );

            const changedProducts = products.filter((product) => {
                const wasFeatured = originalFeatured.has(product.id);
                const shouldBeFeatured = selectedIds.has(product.id);

                return wasFeatured !== shouldBeFeatured;
            });

            if (changedProducts.length === 0) {
                setMessage("No changes to save.");
                return;
            }

            const results = await Promise.all(
                changedProducts.map((product) =>
                    supabase
                        .from("products")
                        .update({
                            featured: selectedIds.has(product.id),
                        })
                        .eq("id", product.id)
                )
            );

            const failed = results.find((result) => result.error);

            if (failed?.error) {
                console.error(
                    "Featured products save error:",
                    failed.error
                );
                alert(failed.error.message);
                return;
            }

            setProducts((current) =>
                current.map((product) => ({
                    ...product,
                    featured: selectedIds.has(product.id),
                }))
            );

            setMessage(
                `Featured products updated. ${selectedIds.size} product${
                    selectedIds.size === 1 ? "" : "s"
                } selected.`
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-50 overflow-x-hidden">
            <AdminNavbar />

            <main>
                <section className="px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-6">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <Link
                                    href="/admin/products"
                                    className="text-sm font-semibold text-pink-600 hover:underline"
                                >
                                    ← Back to Products
                                </Link>

                                <p className="text-sm font-semibold text-pink-600 uppercase tracking-wide mt-5">
                                    APSRAA ADMIN
                                </p>

                                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-pink-700 mt-1">
                                    Featured Products
                                </h1>

                                <p className="text-sm sm:text-base text-gray-500 mt-2 max-w-2xl">
                                    Choose which products appear in the
                                    Featured Products sections across APSRAA.
                                    Products are never deleted or re-uploaded.
                                </p>
                            </div>

                            <div className="bg-white rounded-2xl border border-pink-100 shadow-sm px-5 py-4">
                                <p className="text-xs uppercase tracking-wide text-gray-400">
                                    Currently Featured
                                </p>
                                <p className="text-3xl font-bold text-pink-700 mt-1">
                                    {featuredCount}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

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
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    className="w-full border-2 border-gray-200 rounded-xl pl-11 pr-4 py-3.5 text-gray-800 placeholder-gray-400 focus:border-pink-500 focus:outline-none transition"
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
                                <p className="text-sm text-gray-500">
                                    Showing{" "}
                                    <span className="font-bold text-gray-800">
                                        {filteredProducts.length}
                                    </span>{" "}
                                    of{" "}
                                    <span className="font-bold text-gray-800">
                                        {products.length}
                                    </span>{" "}
                                    products
                                </p>

                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={selectAllVisible}
                                        disabled={filteredProducts.length === 0}
                                        className="px-4 py-2.5 rounded-xl border border-pink-200 text-pink-700 font-semibold hover:bg-pink-50 disabled:opacity-50"
                                    >
                                        Select Visible
                                    </button>

                                    <button
                                        type="button"
                                        onClick={clearAllVisible}
                                        disabled={filteredProducts.length === 0}
                                        className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Clear Visible
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="px-4 sm:px-6 lg:px-8 pb-28">
                    <div className="max-w-7xl mx-auto">
                        {loading ? (
                            <div className="bg-white rounded-3xl shadow-md p-16 text-center">
                                <div className="text-5xl mb-4">⭐</div>
                                <h2 className="text-2xl font-bold text-gray-800">
                                    Loading Products...
                                </h2>
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="bg-white rounded-3xl shadow-md p-16 text-center">
                                <div className="text-5xl mb-4">💎</div>
                                <h2 className="text-2xl font-bold text-gray-800">
                                    No Products Found
                                </h2>
                                <p className="text-gray-500 mt-2">
                                    Try a different search.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
                                {filteredProducts.map((product) => {
                                    const isFeatured = selectedIds.has(
                                        product.id
                                    );

                                    return (
                                        <article
                                            key={product.id}
                                            className={`bg-white rounded-3xl shadow-md overflow-hidden transition ${
                                                isFeatured
                                                    ? "ring-2 ring-pink-500 shadow-pink-100"
                                                    : "hover:shadow-xl"
                                            }`}
                                        >
                                            <div className="relative bg-gray-100">
                                                <img
                                                    src={product.image}
                                                    alt={product.title}
                                                    loading="lazy"
                                                    className="w-full aspect-square object-cover"
                                                />

                                                <span className="absolute top-3 left-3 bg-black/70 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                                                    #{product.id}
                                                </span>

                                                {isFeatured && (
                                                    <span className="absolute top-3 right-3 bg-pink-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow">
                                                        ⭐ Featured
                                                    </span>
                                                )}
                                            </div>

                                            <div className="p-4 sm:p-5">
                                                <h2 className="text-lg font-bold text-gray-900 leading-snug line-clamp-2">
                                                    {product.title}
                                                </h2>

                                                <p className="text-sm text-gray-500 mt-1">
                                                    {product.category}
                                                </p>

                                                <div className="flex items-center justify-between gap-3 mt-4">
                                                    <div>
                                                        <p className="text-xs text-gray-400 uppercase tracking-wide">
                                                            Price
                                                        </p>
                                                        <p className="text-2xl font-bold text-pink-700">
                                                            ₹{product.price}
                                                        </p>
                                                    </div>

                                                    <div className="text-right">
                                                        <p className="text-xs text-gray-400 uppercase tracking-wide">
                                                            Stock
                                                        </p>
                                                        <p
                                                            className={`text-lg font-bold ${
                                                                product.stock <=
                                                                5
                                                                    ? "text-red-600"
                                                                    : "text-green-600"
                                                            }`}
                                                        >
                                                            {product.stock}
                                                        </p>
                                                    </div>
                                                </div>

                                                <label
                                                    className={`mt-5 flex items-center gap-3 rounded-2xl border-2 p-4 cursor-pointer transition ${
                                                        isFeatured
                                                            ? "border-pink-500 bg-pink-50"
                                                            : "border-gray-200 hover:border-pink-300"
                                                    }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isFeatured}
                                                        onChange={() =>
                                                            toggleFeatured(
                                                                product.id
                                                            )
                                                        }
                                                        className="h-5 w-5 accent-pink-600"
                                                    />

                                                    <span className="font-bold text-gray-900">
                                                        ⭐ Featured Product
                                                    </span>
                                                </label>

                                                <Link
                                                    href={`/admin/edit-product/${product.id}`}
                                                    className="block mt-3 text-center border border-gray-200 text-gray-700 py-2.5 rounded-xl font-semibold hover:bg-gray-50"
                                                >
                                                    ✏️ Edit Product
                                                </Link>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </section>

                <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-pink-100 shadow-lg">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <p className="font-bold text-gray-900">
                                {featuredCount} featured product
                                {featuredCount === 1 ? "" : "s"}
                            </p>

                            {message && (
                                <p className="text-sm text-green-600 mt-0.5">
                                    {message}
                                </p>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={saveFeaturedProducts}
                            disabled={saving}
                            className="w-full sm:w-auto bg-pink-600 text-white px-7 py-3 rounded-xl font-bold hover:bg-pink-700 disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
                        >
                            {saving
                                ? "Saving..."
                                : "💾 Save Featured Products"}
                        </button>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
