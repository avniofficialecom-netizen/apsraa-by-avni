import type { Metadata } from "next";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import ProductDetails from "../../../components/ProductDetails";
import { supabase } from "../../../lib/supabase";

const SITE_URL = "https://apsraa.shop";

type Product = {
    id: number;
    title: string;
    image?: string | null;
    description?: string | null;
    price?: number | string | null;
    stock?: number | null;
};

async function getProduct(id: number) {
    const { data: product, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

    return { product, error };
}

export async function generateMetadata({
                                           params,
                                       }: {
    params: Promise<{ id: string }>;
}): Promise<Metadata> {
    const { id } = await params;
    const productId = Number(id);

    if (!Number.isFinite(productId)) {
        return {
            title: "Product | APSRAA BY AVNI",
            description:
                "Shop premium artificial jewellery from APSRAA BY AVNI.",
        };
    }

    const { product } = await getProduct(productId);

    if (!product) {
        return {
            title: "Product Not Found | APSRAA BY AVNI",
            description:
                "The requested product could not be found at APSRAA BY AVNI.",
            robots: {
                index: false,
                follow: true,
            },
        };
    }

    const typedProduct = product as Product;

    const title = typedProduct.title || "Jewellery";
    const description =
        typedProduct.description ||
        `Shop ${title} from APSRAA BY AVNI. Discover elegant artificial jewellery designed for stylish everyday and occasion wear.`;

    return {
        title: `${title} | APSRAA BY AVNI`,
        description: description.slice(0, 160),

        alternates: {
            canonical: `${SITE_URL}/product/${productId}`,
        },

        openGraph: {
            title: `${title} | APSRAA BY AVNI`,
            description: description.slice(0, 160),
            url: `${SITE_URL}/product/${productId}`,
            siteName: "APSRAA BY AVNI",
            type: "website",
            ...(typedProduct.image
                ? {
                    images: [
                        {
                            url: typedProduct.image,
                            alt: title,
                        },
                    ],
                }
                : {}),
        },

        twitter: {
            card: "summary_large_image",
            title: `${title} | APSRAA BY AVNI`,
            description: description.slice(0, 160),
            ...(typedProduct.image
                ? {
                    images: [typedProduct.image],
                }
                : {}),
        },

        robots: {
            index: true,
            follow: true,
        },
    };
}

export default async function ProductPage({
                                              params,
                                          }: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const productId = Number(id);

    const { product, error } = await getProduct(productId);

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
                            Product ID: <strong>{productId}</strong>
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

    const typedProduct = product as Product;

    const productUrl = `${SITE_URL}/product/${productId}`;

    const productDescription =
        typedProduct.description ||
        `Shop ${typedProduct.title} from APSRAA BY AVNI.`;

    const productSchema: Record<string, unknown> = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: typedProduct.title,
        description: productDescription,
        url: productUrl,
        brand: {
            "@type": "Brand",
            name: "APSRAA BY AVNI",
        },
    };

    if (typedProduct.image) {
        productSchema.image = [typedProduct.image];
    }

    if (
        typedProduct.price !== null &&
        typedProduct.price !== undefined &&
        typedProduct.price !== ""
    ) {
        const numericPrice = Number(typedProduct.price);

        if (Number.isFinite(numericPrice)) {
            productSchema.offers = {
                "@type": "Offer",
                url: productUrl,
                priceCurrency: "INR",
                price: numericPrice.toFixed(2),
                availability:
                    Number(typedProduct.stock ?? 0) > 0
                        ? "https://schema.org/InStock"
                        : "https://schema.org/OutOfStock",
                seller: {
                    "@type": "Organization",
                    name: "APSRAA BY AVNI",
                },
            };
        }
    }

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(productSchema),
                }}
            />

            <Navbar />

            <main>
                <section className="min-h-screen bg-pink-50 py-20">
                    <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 px-8">
                        {/* Product Image */}
                        <img
                            src={typedProduct.image || ""}
                            alt={typedProduct.title}
                            className="w-full rounded-3xl shadow-xl"
                        />

                        {/* Product Details */}
                        <ProductDetails product={product} />
                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
}