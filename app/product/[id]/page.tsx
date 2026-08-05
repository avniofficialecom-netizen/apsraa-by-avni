import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import ProductDetails from "../../../components/ProductDetails";
import { supabase } from "../../../lib/supabase";
import { notFound } from "next/navigation";

export default async function ProductPage({
                                              params,
                                          }: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const { data: product, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", Number(id))
        .single();

    if (error || !product) {
        notFound();
    }

    return (
        <>
            <Navbar />

            <section className="min-h-screen bg-pink-50 py-20">

                <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 px-8">

                    {/* Product Image */}
                    <img
                        src={product.image}
                        alt={product.title}
                        className="w-full rounded-3xl shadow-xl"
                    />

                    {/* Product Details */}
                    <ProductDetails product={product} />

                </div>

            </section>

            <Footer />
        </>
    );
}