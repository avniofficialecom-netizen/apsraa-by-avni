"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type Product = {
    id: number;
    title: string;
    image: string;
    category: string;
    price: string;
    stock: number;
    featured: boolean;
    bestseller: boolean;
};

export default function AdminProductCard({
                                             product,
                                         }: {
    product: Product;
}) {
    const router = useRouter();

    async function deleteProduct() {
        const confirmDelete = window.confirm(
            `Delete "${product.title}"?`
        );

        if (!confirmDelete) return;

        const { error } = await supabase
            .from("products")
            .delete()
            .eq("id", product.id);

        if (error) {
            alert(error.message);
            return;
        }

        alert("✅ Product Deleted");

        router.refresh();
    }

    return (
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden">

            <img
                src={product.image}
                alt={product.title}
                className="w-full h-72 object-cover"
            />

            <div className="p-6">

                <h2 className="text-2xl font-bold">
                    {product.title}
                </h2>

                <p className="text-gray-500 mt-2">
                    {product.category}
                </p>

                <p className="text-pink-700 font-bold text-xl mt-3">
                    ₹{product.price}
                </p>

                <p className="mt-2">
                    Stock: {product.stock}
                </p>

                <div className="flex gap-2 mt-3">

                    {product.featured && (
                        <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm">
                            ⭐ Featured
                        </span>
                    )}

                    {product.bestseller && (
                        <span className="bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-sm">
                            🔥 Bestseller
                        </span>
                    )}

                </div>

                <div className="flex gap-3 mt-6">

                    <Link
                        href={`/admin/products/edit/${product.id}`}
                        className="flex-1 text-center bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700"
                    >
                        ✏ Edit
                    </Link>

                    <button
                        onClick={deleteProduct}
                        className="flex-1 bg-red-600 text-white py-3 rounded-xl hover:bg-red-700"
                    >
                        🗑 Delete
                    </button>

                </div>

            </div>

        </div>
    );
}