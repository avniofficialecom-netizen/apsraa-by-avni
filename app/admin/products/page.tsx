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

    useEffect(() => {
        loadProducts();
    }, []);

    async function loadProducts() {
        const { data, error } = await supabase
            .from("products")
            .select("*")
            .order("id", { ascending: false });

        if (error) {
            alert(error.message);
            return;
        }

        setProducts(data ?? []);
    }

    const filteredProducts = products.filter((product) =>
        product.title.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            <AdminNavbar />

            <section className="min-h-screen bg-gradient-to-br from-pink-50 to-white py-16">

                <div className="max-w-7xl mx-auto px-6">

                    <div className="flex justify-between items-center mb-10">

                        <div>
                            <h1 className="text-5xl font-bold text-pink-700">
                                Products
                            </h1>

                            <p className="text-gray-500 mt-2">
                                Manage your jewellery catalog
                            </p>
                        </div>

                        <Link
                            href="/admin/add-product"
                            className="bg-pink-600 text-white px-6 py-3 rounded-xl hover:bg-pink-700"
                        >
                            + Add Product
                        </Link>

                    </div>

                    <input
                        type="text"
                        placeholder="Search products..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full border rounded-xl p-4 mb-10"
                    />

                    {filteredProducts.length === 0 ? (
                        <div className="bg-white rounded-3xl shadow-lg p-16 text-center">

                            <h2 className="text-3xl font-bold">
                                No Products Found
                            </h2>

                            <p className="text-gray-500 mt-4">
                                Add your first jewellery product.
                            </p>

                        </div>
                    ) : (

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">

                            {filteredProducts.map((product) => (

                                <div
                                    key={product.id}
                                    className="bg-white rounded-3xl shadow-lg overflow-hidden hover:shadow-xl transition"
                                >

                                    <img
                                        src={product.image}
                                        alt={product.title}
                                        className="w-full h-72 object-cover"
                                    />

                                    <div className="p-6">

                                        <div className="flex flex-wrap gap-2 mb-3">

                                            {product.featured && (
                                                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                                                    ⭐ Featured
                                                </span>
                                            )}

                                            {product.bestseller && (
                                                <span className="bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-sm">
                                                    🔥 Bestseller
                                                </span>
                                            )}

                                        </div>

                                        <h2 className="text-2xl font-bold">
                                            {product.title}
                                        </h2>

                                        <p className="text-gray-500 mt-1">
                                            {product.category}
                                        </p>

                                        <p className="text-pink-700 text-2xl font-bold mt-4">
                                            ₹{product.price}
                                        </p>

                                        <p className="mt-2">
                                            📦 Stock:
                                            <span className="font-semibold ml-2">
                                                {product.stock}
                                            </span>
                                        </p>

                                        <div className="grid grid-cols-2 gap-3 mt-6">

                                            <Link
                                                href={`/admin/edit-product/${product.id}`}
                                                className="bg-blue-600 text-white py-3 rounded-xl text-center hover:bg-blue-700"
                                            >
                                                ✏ Edit
                                            </Link>

                                            <DeleteProductButton id={product.id} />

                                        </div>

                                    </div>

                                </div>

                            ))}

                        </div>

                    )}

                </div>

            </section>

            <Footer />
        </>
    );
}