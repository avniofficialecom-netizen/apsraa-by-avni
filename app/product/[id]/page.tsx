import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import ProductDetails from "../../../components/ProductDetails";
import { supabase } from "../../../lib/supabase";

export default async function ProductPage({
                                              params,
                                          }: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const productId = Number(id);

    const { data: product, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();

    if (error || !product) {
        console.log("=================================");
        console.log("PRODUCT LOAD ERROR");
        console.log("Product ID:", productId);
        console.log("Error:", error);
        console.log("Product:", product);
        console.log("=================================");

        return (
            <>
                <Navbar />

                <section className="min-h-screen bg-pink-50 py-20 px-8">
                    <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-10">
                        <h1 className="text-3xl font-bold text-red-600">
                            Product Could Not Be Loaded
                        </h1>

                        <p className="mt-6">
                            Product ID:{" "}
                            <strong>{productId}</strong>
                        </p>

                        <pre className="mt-6 bg-gray-100 p-5 rounded-xl overflow-auto text-sm">
                            {JSON.stringify(error, null, 2)}
                        </pre>
                    </div>
                </section>

                <Footer />
            </>
        );
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