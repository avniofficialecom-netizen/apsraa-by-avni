import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import ProductDetails from "../../../components/ProductDetails";
import ProductGallery from "../../../components/ProductGallery";
import { supabase } from "../../../lib/supabase";

const SITE_URL = "https://apsraa.shop";

type Product = {
    id: number;
    title: string;
    image?: string | null;
    images?: string[] | null;
    description?: string | null;
    price?: number | string | null;
    stock?: number | null;
    category?: string | null;
    bestseller?: boolean | null;
    trending?: boolean | null;
    featured?: boolean | null;
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

                <main className="min-h-screen bg-[#fff8fb] px-5 py-20 sm:px-8">
                    <div className="mx-auto max-w-4xl rounded-[28px] border border-pink-100 bg-white p-8 shadow-sm sm:p-12">

                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-pink-600">
                            APSRAA BY AVNI
                        </p>

                        <h1 className="mt-4 text-3xl font-semibold text-[#182033]">
                            Product Could Not Be Loaded
                        </h1>

                        <p className="mt-4 text-gray-600">
                            We couldn't find this jewellery piece.
                        </p>

                        <Link
                            href="/shop"
                            className="mt-7 inline-flex rounded-full bg-[#182033] px-6 py-3 text-sm font-semibold text-white transition hover:bg-pink-600"
                        >
                            Return to collection
                        </Link>

                    </div>
                </main>

                <Footer />
            </>
        );
    }

    const typedProduct = product as Product;

    const productUrl = `${SITE_URL}/product/${productId}`;

    const productDescription =
        typedProduct.description ||
        `Shop ${typedProduct.title} from APSRAA BY AVNI.`;

    /*
     * Main image remains separate from additional gallery images.
     * This preserves the existing Admin/product gallery structure.
     */

    const galleryImages = [
        ...(typedProduct.image ? [typedProduct.image] : []),

        ...(Array.isArray(typedProduct.images)
            ? typedProduct.images.filter(
                  (image): image is string =>
                      typeof image === "string" &&
                      image.trim().length > 0
              )
            : []),
    ].filter(
        (image, index, array) =>
            array.indexOf(image) === index
    );

    const categoryLabel = typedProduct.category
        ? typedProduct.category
              .replace(/[-_]/g, " ")
              .replace(/\b\w/g, (letter) =>
                  letter.toUpperCase()
              )
        : "Jewellery";

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

    if (galleryImages.length > 0) {
        productSchema.image = galleryImages;
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

            <main className="min-h-screen bg-[#fffafc]">

                {/* ==========================================
                    BREADCRUMB
                ========================================== */}

                <div className="border-b border-pink-100 bg-white">
                    <div className="mx-auto max-w-[1400px] px-5 py-4 sm:px-8 lg:px-10">

                        <nav
                            aria-label="Breadcrumb"
                            className="flex items-center gap-2 text-xs text-gray-500"
                        >
                            <Link
                                href="/"
                                className="transition hover:text-pink-600"
                            >
                                Home
                            </Link>

                            <span>•</span>

                            <Link
                                href="/shop"
                                className="transition hover:text-pink-600"
                            >
                                Shop
                            </Link>

                            <span>•</span>

                            <span className="max-w-[220px] truncate text-gray-900">
                                {typedProduct.title}
                            </span>
                        </nav>

                    </div>
                </div>

                {/* ==========================================
                    PRODUCT
                ========================================== */}

                <section className="px-5 py-8 sm:px-8 sm:py-12 lg:px-10 lg:py-16">

                    <div className="mx-auto max-w-[1400px]">

                        {/* EDITORIAL INTRO */}

                        <div className="mb-8 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">

                            <div>

                                <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-pink-600">
                                    APSRAA EDIT
                                </p>

                                <p className="mt-2 text-sm text-gray-500">
                                    {categoryLabel}
                                </p>

                            </div>

                            <Link
                                href="/shop"
                                className="
                                    hidden
                                    text-xs
                                    font-semibold
                                    uppercase
                                    tracking-[0.14em]
                                    text-gray-500
                                    transition
                                    hover:text-pink-600
                                    sm:block
                                "
                            >
                                Continue shopping →
                            </Link>

                        </div>

                        {/* MAIN PRODUCT LAYOUT */}

                        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(380px,0.92fr)] xl:gap-14">

                            {/* ==================================
                                GALLERY
                            ================================== */}

                            <div className="overflow-hidden rounded-[28px] border border-pink-100 bg-white p-2 shadow-[0_20px_70px_rgba(30,20,30,0.08)] sm:p-3">

                                <ProductGallery
                                    images={galleryImages}
                                    title={typedProduct.title}
                                />

                            </div>

                            {/* ==================================
                                DETAILS
                            ================================== */}

                            <div className="lg:sticky lg:top-24">

                                <div className="rounded-[28px] border border-pink-100 bg-white p-6 shadow-[0_20px_70px_rgba(30,20,30,0.06)] sm:p-8 lg:p-10">

                                    {/* PRODUCT STATUS */}

                                    <div className="flex flex-wrap items-center gap-2">

                                        {typedProduct.bestseller && (
                                            <span className="rounded-full bg-[#fff0f6] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-pink-600">
                                                Bestseller
                                            </span>
                                        )}

                                        {typedProduct.trending && (
                                            <span className="rounded-full bg-[#fff7e8] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#a66a00]">
                                                Trending
                                            </span>
                                        )}

                                        {typedProduct.featured && (
                                            <span className="rounded-full bg-[#f8f4ec] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#806536]">
                                                APSRAA Edit
                                            </span>
                                        )}

                                        {Number(
                                            typedProduct.stock ?? 0
                                        ) <= 0 && (
                                            <span className="rounded-full bg-gray-100 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-gray-600">
                                                Sold Out
                                            </span>
                                        )}

                                    </div>

                                    {/* DETAILS COMPONENT */}

                                    <div className="mt-5">

                                        <ProductDetails
                                            product={product}
                                        />

                                    </div>

                                </div>

                                {/* BRAND PROMISE */}

                                <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">

                                    <div className="rounded-2xl border border-pink-100 bg-white px-3 py-4 text-center">
                                        <div className="text-lg">
                                            ✦
                                        </div>

                                        <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-gray-600">
                                            APSRAA
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border border-pink-100 bg-white px-3 py-4 text-center">
                                        <div className="text-lg">
                                            ♡
                                        </div>

                                        <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-gray-600">
                                            Made for you
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border border-pink-100 bg-white px-3 py-4 text-center">
                                        <div className="text-lg">
                                            ✓
                                        </div>

                                        <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-gray-600">
                                            Easy shopping
                                        </p>
                                    </div>

                                </div>

                            </div>

                        </div>

                        {/* ==========================================
                            PRODUCT STORY
                        ========================================== */}

                        <div className="mt-10 border-t border-pink-100 pt-10 sm:mt-14 sm:pt-14">

                            <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">

                                <div>

                                    <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-pink-600">
                                        The APSRAA story
                                    </p>

                                    <h2 className="mt-3 font-serif text-3xl leading-tight tracking-[-0.025em] text-[#182033] sm:text-4xl">
                                        Designed to be noticed.
                                    </h2>

                                </div>

                                <div className="max-w-3xl">

                                    <p className="text-sm leading-7 text-gray-600 sm:text-base">
                                        {productDescription}
                                    </p>

                                    <Link
                                        href="/shop"
                                        className="
                                            mt-6
                                            inline-flex
                                            items-center
                                            text-xs
                                            font-semibold
                                            uppercase
                                            tracking-[0.16em]
                                            text-pink-600
                                            transition
                                            hover:text-[#182033]
                                        "
                                    >
                                        Explore more jewellery →
                                    </Link>

                                </div>

                            </div>

                        </div>

                    </div>

                </section>

            </main>

            <Footer />
        </>
    );
}