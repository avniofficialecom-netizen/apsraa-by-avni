import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import ProductCard from "../../components/ProductCard";
import { supabase } from "../../lib/supabase";

export const dynamic = "force-dynamic";

export default async function Shop() {
    const {
        data: products,
        error,
    } = await supabase
        .from("products")
        .select("*")
        .order("id", {
            ascending: false,
        });

    return (
        <>
            {/* NAVBAR */}

            <div className="print:hidden">
                <Navbar />
            </div>

            {/* SHOP */}

            <section className="bg-pink-50 min-h-screen py-16">

                <div className="max-w-7xl mx-auto px-8">

                    {/* HEADING */}

                    <h1 className="text-5xl font-bold text-pink-700 text-center">
                        Shop Collection
                    </h1>

                    <p className="text-center text-gray-500 mt-4">
                        Discover our latest premium jewellery
                    </p>

                    {/* SEARCH */}

                    <div className="mt-12">

                        <input
                            type="text"
                            placeholder="Search Jewellery..."
                            className="w-full p-4 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-pink-500"
                        />

                    </div>

                    {/* DATABASE ERROR */}

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

                    {/* NO PRODUCTS */}

                    {!error &&
                        (!products ||
                            products.length === 0) && (
                            <p className="text-center text-gray-500 mt-10">
                                No products available.
                            </p>
                        )}

                    {/* PRODUCT GRID */}

                    {!error &&
                        products &&
                        products.length > 0 && (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mt-14">

                                {products.map(
                                    (product) => (
                                        <ProductCard
                                            key={product.id}
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

            {/* FOOTER */}

            <Footer />
        </>
    );
}