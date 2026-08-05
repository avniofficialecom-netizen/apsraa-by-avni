import Link from "next/link";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import { supabase } from "../../../lib/supabase";

export default async function ProductsPage() {
    const { data: products } = await supabase
        .from("products")
        .select("*")
        .order("id", { ascending: false });

    return (
        <>
            <Navbar />

            <section className="min-h-screen bg-pink-50 py-20">

                <div className="max-w-7xl mx-auto px-8">

                    <h1 className="text-5xl font-bold text-pink-700 mb-10">
                        Manage Products
                    </h1>

                    <div className="grid md:grid-cols-3 gap-8">

                        {products?.map((product) => (
                            <div
                                key={product.id}
                                className="bg-white rounded-3xl shadow-lg overflow-hidden"
                            >

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
                                        {product.price}
                                    </p>

                                    <div className="flex gap-3 mt-6">

                                        <Link
                                            href={`/admin/products/edit/${product.id}`}
                                            className="flex-1 text-center bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700"
                                        >
                                            ✏ Edit
                                        </Link>

                                        <button className="flex-1 bg-red-600 text-white py-3 rounded-xl hover:bg-red-700">
                                            🗑 Delete
                                        </button>

                                    </div>

                                </div>

                            </div>
                        ))}

                    </div>

                </div>

            </section>

            <Footer />
        </>
    );
}