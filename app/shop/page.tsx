import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import ProductCard from "../../components/ProductCard";
import { supabase } from "../../lib/supabase";

export default async function Shop() {
    const { data: products, error } = await supabase
        .from("products")
        .select("*")
        .order("id", { ascending: false });

    return (
        <>
            <div className="print:hidden">
                <Navbar />
            </div>

            <section className="bg-pink-50 min-h-screen py-16">

                <div className="max-w-7xl mx-auto px-8">

                    <h1 className="text-5xl font-bold text-pink-700 text-center">
                        Shop Collection
                    </h1>

                    <p className="text-center text-gray-500 mt-4">
                        Discover our latest premium jewellery
                    </p>

                    <div className="mt-12">
                        <input
                            type="text"
                            placeholder="Search Jewellery..."
                            className="w-full p-4 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-pink-500"
                        />
                    </div>

                    {error && (
                        <p className="text-center text-red-600 mt-10">
                            {error.message}
                        </p>
                    )}

                    {!error && products?.length === 0 && (
                        <p className="text-center text-gray-500 mt-10">
                            No products available.
                        </p>
                    )}

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mt-14">

                        {products?.map((product) => (
                            <ProductCard
                                key={product.id}
                                id={product.id}
                                image={product.image}
                                title={product.title}
                                subtitle={`₹${product.price}`}
                                stock={product.stock}
                            />
                        ))}

                    </div>

                </div>

            </section>

            <Footer />
        </>
    );
}