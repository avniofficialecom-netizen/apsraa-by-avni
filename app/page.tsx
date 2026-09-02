import Link from "next/link";
import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";
import Footer from "../components/Footer";
import { supabaseAdmin } from "../lib/supabase-admin";

type Product = {
    id: number;
    created_at: string;
    title: string;
    image: string;
    price: string | number;
    stock: number;
    featured: boolean;
    featured_hero?: boolean;
    bestseller: boolean;
    trending: boolean;
    home_hero?: boolean;
};

type ProductVariant = {
    product_id: number;
};

type StoreSettings = {
    id: number;
    hero_image_url: string | null;
    hero_badge: string | null;
    hero_title: string | null;
    hero_description: string | null;
    hero_button_one_text: string | null;
    hero_button_one_link: string | null;
    hero_button_two_text: string | null;
    hero_button_two_link: string | null;
    hero_enabled: boolean;
    collection_discovery_new_arrivals_image_url: string | null;
    collection_discovery_best_sellers_image_url: string | null;
    collection_discovery_trending_image_url: string | null;
};

type SafeHeroSettings = {
    hero_image_url: string;
    hero_badge: string;
    hero_title: string;
    hero_description: string;
    hero_button_one_text: string;
    hero_button_one_link: string;
    hero_button_two_text: string;
    hero_button_two_link: string;
    hero_enabled: boolean;
};

type SafeCollectionDiscoverySettings = {
    new_arrivals_image_url: string;
    best_sellers_image_url: string;
    trending_image_url: string;
};

export const dynamic = "force-dynamic";

const DEFAULT_HERO: SafeHeroSettings = {
    hero_image_url: "/images/product1.jpg",
    hero_badge: "APSRAA BY AVNI",
    hero_title: "Discover the APSRAA Collection",
    hero_description:
        "Thoughtfully chosen jewellery for the moments you want to remember.",
    hero_button_one_text: "Discover the Collection",
    hero_button_one_link: "/shop",
    hero_button_two_text: "Explore Categories",
    hero_button_two_link: "/products/categories",
    hero_enabled: true,
};

const DEFAULT_COLLECTION_DISCOVERY: SafeCollectionDiscoverySettings = {
    new_arrivals_image_url: "",
    best_sellers_image_url: "",
    trending_image_url: "",
};

export default async function Home() {
    let products: Product[] = [];
    let variantProductIds = new Set<number>();

    // ==========================================
    // LOAD PRODUCTS
    // ==========================================

    try {
        const {
            data,
            error,
        } = await supabaseAdmin
            .from("products")
            .select("*")
            .order("created_at", {
                ascending: false,
            });

        if (error) {
            console.error(
                "Failed to fetch products:",
                error
            );
        } else if (data) {
            products = data as Product[];
        }
    } catch (error) {
        console.error(
            "Products loading error:",
            error
        );
    }

    // ==========================================
    // LOAD ADMIN-SELECTED HOME HERO PRODUCT
    // ==========================================

    let homeHeroProduct: Product | null = null;

    try {
        const { data, error } = await supabaseAdmin
            .from("products")
            .select("*")
            .eq("home_hero", true)
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error("Home hero product loading error:", error);
        } else if (data) {
            homeHeroProduct = data as Product;
        }
    } catch (error) {
        console.error("Home hero product query error:", error);
    }

    // ==========================================
    // LOAD PRODUCT VARIANTS
    // ==========================================

    try {
        const {
            data,
            error,
        } = await supabaseAdmin
            .from("product_variants")
            .select("product_id");

        if (error) {
            console.error(
                "Failed to fetch product variants:",
                error
            );
        } else if (data) {
            const variants =
                data as ProductVariant[];

            variantProductIds = new Set(
                variants
                    .map((variant) =>
                        Number(
                            variant.product_id
                        )
                    )
                    .filter((id) =>
                        Number.isFinite(id)
                    )
            );
        }
    } catch (error) {
        console.error(
            "Product variants loading error:",
            error
        );
    }

    // ==========================================
    // LOAD HOMEPAGE HERO SETTINGS
    // ==========================================

    let hero: SafeHeroSettings =
        DEFAULT_HERO;

    try {
        const {
            data,
            error,
        } = await supabaseAdmin
            .from("store_settings")
            .select(
                `
                id,
                hero_image_url,
                hero_badge,
                hero_title,
                hero_description,
                hero_button_one_text,
                hero_button_one_link,
                hero_button_two_text,
                hero_button_two_link,
                hero_enabled
                `
            )
            .order("id", {
                ascending: true,
            })
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error(
                "Homepage settings loading error:",
                error
            );
        } else if (data) {
            const settings =
                data as StoreSettings;

            hero = {
                hero_image_url:
                    settings.hero_image_url ??
                    DEFAULT_HERO.hero_image_url,

                hero_badge:
                    settings.hero_badge ??
                    DEFAULT_HERO.hero_badge,

                hero_title:
                    settings.hero_title ??
                    DEFAULT_HERO.hero_title,

                hero_description:
                    settings.hero_description ??
                    DEFAULT_HERO.hero_description,

                hero_button_one_text:
                    settings.hero_button_one_text ??
                    DEFAULT_HERO.hero_button_one_text,

                hero_button_one_link:
                    settings.hero_button_one_link ??
                    DEFAULT_HERO.hero_button_one_link,

                hero_button_two_text:
                    settings.hero_button_two_text ??
                    DEFAULT_HERO.hero_button_two_text,

                hero_button_two_link:
                    settings.hero_button_two_link ??
                    DEFAULT_HERO.hero_button_two_link,

                hero_enabled:
                    settings.hero_enabled ??
                    DEFAULT_HERO.hero_enabled,
            };
        }
    } catch (error) {
        console.error(
            "Homepage hero settings error:",
            error
        );
    }

    // ==========================================
    // COLLECTION DISCOVERY SETTINGS
    // Admin-editable card images.
    // ==========================================

    let collectionDiscovery =
        DEFAULT_COLLECTION_DISCOVERY;

    try {
        const {
            data,
            error,
        } = await supabaseAdmin
            .from("store_settings")
            .select(
                `
                collection_discovery_new_arrivals_image_url,
                collection_discovery_best_sellers_image_url,
                collection_discovery_trending_image_url
                `
            )
            .order("id", {
                ascending: true,
            })
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error(
                "Collection discovery settings loading error:",
                error
            );
        } else if (data) {
            collectionDiscovery = {
                new_arrivals_image_url:
                    data.collection_discovery_new_arrivals_image_url ??
                    "",
                best_sellers_image_url:
                    data.collection_discovery_best_sellers_image_url ??
                    "",
                trending_image_url:
                    data.collection_discovery_trending_image_url ??
                    "",
            };
        }
    } catch (error) {
        console.error(
            "Collection discovery settings error:",
            error
        );
    }

    // ==========================================
    // HOMEPAGE COLLECTIONS
    // ==========================================

    const newArrivalProducts =
        products.slice(0, 8);

    const bestsellerProducts =
        products
            .filter(
                (product) =>
                    product.bestseller
            )
            .slice(0, 8);

    const trendingProducts =
        products
            .filter(
                (product) =>
                    product.trending
            )
            .slice(0, 8);

    const featuredProducts =
        products
            .filter(
                (product) =>
                    product.featured
            )
            .slice(0, 8);

    // ==========================================
    // FEATURED HERO
    // Admin-selected single Featured Hero.
    // Falls back to the first Featured Product.
    // ==========================================

    const featuredHeroProduct =
        products.find(
            (product) =>
                product.featured_hero === true &&
                Boolean(product.image)
        ) ||
        featuredProducts[0] ||
        null;

    const under299Products =
        products
            .filter(
                (product) =>
                    Number(product.price) <= 299
            )
            .slice(0, 8);

    const under499Products =
        products
            .filter(
                (product) =>
                    Number(product.price) <= 499
            )
            .slice(0, 8);

    // ==========================================
    // REUSABLE PRODUCT GRID
    // ==========================================

    function ProductGrid({
        items,
    }: {
        items: Product[];
    }) {
        if (items.length === 0) {
            return (
                <p className="py-16 text-center text-sm text-[#77716d]">
                    No products available right now.
                </p>
            );
        }

        return (
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-2 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-7 lg:gap-y-12">
                {items.map((product) => (
                    <ProductCard
                        key={product.id}
                        id={product.id}
                        image={product.image}
                        title={product.title}
                        subtitle={`â‚¹${product.price}`}
                        stock={product.stock}
                        hasVariants={variantProductIds.has(
                            product.id
                        )}
                    />
                ))}
            </div>
        );
    }

    return (
        <>
            <Navbar />

            {/* ==========================================
                HERO
            ========================================== */}

            {hero.hero_enabled && (
                <section className="relative overflow-hidden bg-[#fbf8f6]">

                    <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">

                        <div className="grid min-h-[calc(100svh-76px)] items-center gap-12 py-10 md:grid-cols-[0.88fr_1.12fr] md:gap-14 md:py-14 lg:gap-20 lg:py-16">

                            {/* CONTENT */}

                            <div className="relative z-10 max-w-xl">

                                <p className="mb-6 text-[10px] font-medium uppercase tracking-[0.36em] text-[#a9005d] sm:text-[11px]">
                                    {hero.hero_badge ||
                                        "APSRAA BY AVNI"}
                                </p>

                                <h1 className="max-w-2xl text-[clamp(3rem,5.8vw,6.1rem)] font-semibold leading-[0.92] tracking-[-0.045em] text-[#202020]">
                                    {hero.hero_title ||
                                        "Discover the APSRAA Collection"}
                                </h1>

                                <div className="mt-8 h-px w-14 bg-[#a9005d]" />

                                <p className="mt-7 max-w-md whitespace-pre-line text-base leading-7 text-[#68625f] sm:text-lg">
                                    {hero.hero_description ||
                                        "Thoughtfully chosen pieces made to bring a little more beauty to everyday moments."}
                                </p>

                                <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">

                                    <Link
                                        href={
                                            hero.hero_button_one_link ||
                                            "/shop"
                                        }
                                        className="group inline-flex items-center gap-4 bg-[#a9005d] px-7 py-4 text-sm font-medium tracking-wide text-white transition-all duration-300 hover:bg-[#87004a] hover:shadow-lg"
                                    >
                                        {hero.hero_button_one_text ||
                                            "Shop Collection"}

                                        <span className="transition-transform duration-300 group-hover:translate-x-1">
                                            â†’
                                        </span>
                                    </Link>

                                    <Link
                                        href={
                                            hero.hero_button_two_link ||
                                            "/products/categories"
                                        }
                                        className="group inline-flex items-center gap-2 border-b border-[#302d2b] pb-1 text-sm font-medium tracking-wide text-[#302d2b] transition-colors hover:border-[#a9005d] hover:text-[#a9005d]"
                                    >
                                        {hero.hero_button_two_text ||
                                            "Explore Categories"}

                                        <span className="transition-transform duration-300 group-hover:translate-x-1">
                                            â†’
                                        </span>
                                    </Link>

                                </div>

                                <div className="mt-12 hidden items-center gap-4 text-[9px] uppercase tracking-[0.25em] text-[#9a9390] sm:flex">
                                    <span>
                                        Designed with intention
                                    </span>

                                    <span className="h-px w-8 bg-[#d8d1cd]" />

                                    <span>
                                        Made for every moment
                                    </span>
                                </div>

                            </div>

                            {/* IMAGE */}

                            <div className="relative">

                                <div className="relative ml-auto w-full max-w-[720px]">

                                    <div className="absolute -right-3 -top-3 h-full w-full border border-[#ded5d0] sm:-right-5 sm:-top-5" />

                                    <div className="relative aspect-[4/5] overflow-hidden bg-[#eee7e3]">

                                        <img
                                            src={
                                                homeHeroProduct?.image ||
                                                hero.hero_image_url ||
                                                "/images/product1.jpg"
                                            }
                                            alt={
                                                homeHeroProduct?.title
                                                    ? `${homeHeroProduct.title} â€” APSRAA BY AVNI`
                                                    : "APSRAA BY AVNI jewellery collection"
                                            }
                                            className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.02]"
                                        />

                                    </div>

                                    <div className="absolute -bottom-5 left-5 hidden bg-[#fbf8f6] px-5 py-4 sm:block">
                                        <p className="text-[9px] uppercase tracking-[0.28em] text-[#8c8581]">
                                            APSRAA
                                        </p>

                                        <p className="mt-1 text-[10px] tracking-[0.24em] text-[#a9005d]">
                                            BY AVNI
                                        </p>
                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>

                </section>
            )}

            {/* ==========================================
                COLLECTION DISCOVERY
            ========================================== */}

            <section className="bg-white py-16 sm:py-20 md:py-24">
                <div className="mx-auto max-w-[1200px] px-5 sm:px-8 lg:px-12">

                    <div className="mx-auto max-w-2xl text-center">
                        <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-[#a9005d]">
                            Find your piece
                        </p>

                        <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] text-[#222] sm:text-4xl md:text-5xl">
                            Discover what feels like you.
                        </h2>

                        <p className="mt-4 text-sm leading-6 text-[#77716d] sm:text-base">
                            Start with what you're looking for, or simply follow what catches your eye.
                        </p>
                    </div>

                    <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

                        <Link
                            href="/shop?collection=new-arrivals"
                            className="group relative flex min-h-[260px] flex-col justify-end overflow-hidden bg-[#eee7e2] p-6 transition-all duration-500 hover:-translate-y-1 sm:min-h-[300px]"
                            style={{
                                backgroundImage: `url("${collectionDiscovery.new_arrivals_image_url || newArrivalProducts[0]?.image || hero.hero_image_url}")`,
                                backgroundPosition: "center",
                                backgroundSize: "cover",
                            }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-black/0 transition-all duration-500 group-hover:from-black/70" />

                            <div className="relative z-10">
                                <p className="text-[9px] font-medium uppercase tracking-[0.25em] text-white/80">
                                    Just in
                                </p>

                                <h3 className="mt-2 text-2xl font-medium tracking-[-0.025em] text-white">
                                    New Arrivals
                                </h3>

                                <span className="mt-4 inline-flex translate-y-1 text-xs font-medium text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                                    Discover â†’
                                </span>
                            </div>
                        </Link>

                        <Link
                            href="/shop?collection=best-sellers"
                            className="group relative flex min-h-[260px] flex-col justify-end overflow-hidden bg-[#eee7e2] p-6 transition-all duration-500 hover:-translate-y-1 sm:min-h-[300px]"
                            style={{
                                backgroundImage: `url("${collectionDiscovery.best_sellers_image_url || bestsellerProducts[0]?.image || newArrivalProducts[1]?.image || hero.hero_image_url}")`,
                                backgroundPosition: "center",
                                backgroundSize: "cover",
                            }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-black/0 transition-all duration-500 group-hover:from-black/70" />

                            <div className="relative z-10">
                                <p className="text-[9px] font-medium uppercase tracking-[0.25em] text-white/80">
                                    Loved by customers
                                </p>

                                <h3 className="mt-2 text-2xl font-medium tracking-[-0.025em] text-white">
                                    Best Sellers
                                </h3>

                                <span className="mt-4 inline-flex translate-y-1 text-xs font-medium text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                                    Discover â†’
                                </span>
                            </div>
                        </Link>

                        <Link
                            href="/shop?collection=trending"
                            className="group relative flex min-h-[260px] flex-col justify-end overflow-hidden bg-[#eee7e2] p-6 transition-all duration-500 hover:-translate-y-1 sm:min-h-[300px]"
                            style={{
                                backgroundImage: `url("${collectionDiscovery.trending_image_url || trendingProducts[0]?.image || bestsellerProducts[1]?.image || newArrivalProducts[2]?.image || hero.hero_image_url}")`,
                                backgroundPosition: "center",
                                backgroundSize: "cover",
                            }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-black/0 transition-all duration-500 group-hover:from-black/70" />

                            <div className="relative z-10">
                                <p className="text-[9px] font-medium uppercase tracking-[0.25em] text-white/80">
                                    What's catching attention
                                </p>

                                <h3 className="mt-2 text-2xl font-medium tracking-[-0.025em] text-white">
                                    Trending Now
                                </h3>

                                <span className="mt-4 inline-flex translate-y-1 text-xs font-medium text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                                    Discover â†’
                                </span>
                            </div>
                        </Link>

                        <Link
                            href="/shop"
                            className="group relative flex min-h-[260px] flex-col justify-end overflow-hidden bg-[#24201f] p-6 transition-all duration-500 hover:-translate-y-1 sm:min-h-[300px]"
                        >
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(169,0,93,0.18),transparent_55%)]" />

                            <div className="relative z-10">
                                <p className="text-[9px] font-medium uppercase tracking-[0.25em] text-[#e3a6c5]">
                                    APSRAA
                                </p>

                                <h3 className="mt-2 text-2xl font-medium tracking-[-0.025em] text-white">
                                    Shop All
                                </h3>

                                <p className="mt-3 max-w-[190px] text-xs leading-5 text-white/55">
                                    Explore every piece in the collection.
                                </p>

                                <span className="mt-5 inline-flex translate-y-1 text-xs font-medium text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                                    Explore collection â†’
                                </span>
                            </div>
                        </Link>

                    </div>
                </div>
            </section>

            {/* ==========================================
                BRAND PROMISE
            ========================================== */}

            <section className="border-b border-[#eee8e4] bg-white">
                <div className="mx-auto grid max-w-[1400px] grid-cols-2 px-5 sm:px-8 md:grid-cols-4 lg:px-12">

                    <div className="border-r border-[#eee8e4] px-4 py-7 text-center md:px-6">
                        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#292624]">
                            Secure Payments
                        </p>
                        <p className="mt-2 text-xs text-[#8a8380]">
                            Safe checkout
                        </p>
                    </div>

                    <div className="px-4 py-7 text-center md:border-r md:border-[#eee8e4] md:px-6">
                        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#292624]">
                            Pan-India Delivery
                        </p>
                        <p className="mt-2 text-xs text-[#8a8380]">
                            Delivered to your door
                        </p>
                    </div>

                    <div className="border-r border-t border-[#eee8e4] px-4 py-7 text-center md:border-t-0 md:px-6">
                        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#292624]">
                            Easy Returns
                        </p>
                        <p className="mt-2 text-xs text-[#8a8380]">
                            On eligible products
                        </p>
                    </div>

                    <div className="border-t border-[#eee8e4] px-4 py-7 text-center md:border-t-0 md:px-6">
                        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#292624]">
                            Support
                        </p>
                        <p className="mt-2 text-xs text-[#8a8380]">
                            We're here to help
                        </p>
                    </div>

                </div>
            </section>

            {/* ==========================================
                NEW ARRIVALS
            ========================================== */}

            <section className="bg-white py-20 md:py-28">

                <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">

                    <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between md:mb-14">

                        <div>
                            <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.3em] text-[#a9005d]">
                                Just in
                            </p>

                            <h2 className="text-3xl font-semibold tracking-[-0.03em] text-[#222] sm:text-4xl md:text-5xl">
                                New Arrivals
                            </h2>

                            <p className="mt-3 max-w-md text-sm leading-6 text-[#77716d]">
                                Discover the latest pieces added to APSRAA.
                            </p>
                        </div>

                        <Link
                            href="/shop?collection=new-arrivals"
                            className="group inline-flex items-center gap-2 text-sm font-medium text-[#302d2b] transition-colors hover:text-[#a9005d]"
                        >
                            View all
                            <span className="transition-transform group-hover:translate-x-1">
                                â†’
                            </span>
                        </Link>

                    </div>

                    <ProductGrid items={newArrivalProducts} />

                </div>

            </section>

            {/* ==========================================
                FEATURED EDITORIAL
            ========================================== */}

            <section className="bg-[#f5efec] py-20 md:py-28">

                <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">

                    <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16 lg:gap-24">

                        <div className="order-2 md:order-1">

                            <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#a9005d]">
                                The APSRAA edit
                            </p>

                            <h2 className="mt-5 max-w-lg text-4xl font-semibold leading-[1.02] tracking-[-0.04em] text-[#222] sm:text-5xl lg:text-6xl">
                                Pieces chosen for every version of you.
                            </h2>

                            <p className="mt-6 max-w-lg text-base leading-7 text-[#6f6864]">
                                From everyday elegance to moments worth dressing up for, discover jewellery that works with your style rather than competing with it.
                            </p>

                            <Link
                                href="/shop"
                                className="group mt-8 inline-flex items-center gap-4 border-b border-[#302d2b] pb-2 text-sm font-medium text-[#302d2b] transition-colors hover:border-[#a9005d] hover:text-[#a9005d]"
                            >
                                Explore the collection
                                <span className="transition-transform group-hover:translate-x-1">
                                    â†’
                                </span>
                            </Link>

                        </div>

                        <div className="order-1 md:order-2">

                            {featuredHeroProduct ? (
                                <Link
                                    href={`/product/${featuredHeroProduct.id}`}
                                    className="group block"
                                >
                                    <div className="relative overflow-hidden bg-[#e9e1dc]">

                                        <img
                                            src={
                                                featuredHeroProduct.image
                                            }
                                            alt={
                                                featuredHeroProduct.title
                                            }
                                            className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-[1.025]"
                                        />

                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-6 pt-20">

                                            <p className="text-[10px] uppercase tracking-[0.25em] text-white/80">
                                                Featured
                                            </p>

                                            <h3 className="mt-2 text-xl font-medium text-white">
                                                {
                                                    featuredHeroProduct.title
                                                }
                                            </h3>

                                        </div>

                                    </div>
                                </Link>
                            ) : (
                                <div className="flex aspect-[4/5] items-center justify-center bg-[#e9e1dc] text-sm text-[#8a8380]">
                                    Featured collection coming soon.
                                </div>
                            )}

                        </div>

                    </div>

                </div>

            </section>

            {/* ==========================================
                BESTSELLERS
            ========================================== */}

            <section className="bg-white py-20 md:py-28">

                <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">

                    <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between md:mb-14">

                        <div>
                            <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.3em] text-[#a9005d]">
                                Customer favourites
                            </p>

                            <h2 className="text-3xl font-semibold tracking-[-0.03em] text-[#222] sm:text-4xl md:text-5xl">
                                Best Sellers
                            </h2>

                            <p className="mt-3 text-sm text-[#77716d]">
                                The pieces customers keep coming back for.
                            </p>
                        </div>

                        <Link
                            href="/shop?collection=best-sellers"
                            className="group inline-flex items-center gap-2 text-sm font-medium text-[#302d2b] transition-colors hover:text-[#a9005d]"
                        >
                            View all
                            <span className="transition-transform group-hover:translate-x-1">
                                â†’
                            </span>
                        </Link>

                    </div>

                    <ProductGrid items={bestsellerProducts} />

                </div>

            </section>

            {/* ==========================================
                SHOP BY PRICE
            ========================================== */}

            <section className="border-y border-[#eee8e4] bg-[#fbf8f6] py-16 md:py-20">

                <div className="mx-auto max-w-[1100px] px-5 text-center sm:px-8">

                    <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#a9005d]">
                        Find your range
                    </p>

                    <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-[#222] sm:text-4xl">
                        Shop by price
                    </h2>

                    <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#77716d]">
                        Beautiful pieces at prices that make it easy to find something you'll love.
                    </p>

                    <div className="mt-9 flex flex-wrap justify-center gap-3">

                        <Link
                            href="/shop?collection=under-299"
                            className="border border-[#d8d0cc] bg-white px-7 py-3 text-sm font-medium text-[#302d2b] transition hover:border-[#a9005d] hover:text-[#a9005d]"
                        >
                            Under â‚¹299
                        </Link>

                        <Link
                            href="/shop?collection=under-499"
                            className="border border-[#d8d0cc] bg-white px-7 py-3 text-sm font-medium text-[#302d2b] transition hover:border-[#a9005d] hover:text-[#a9005d]"
                        >
                            Under â‚¹499
                        </Link>

                        <Link
                            href="/shop"
                            className="border border-[#302d2b] bg-[#302d2b] px-7 py-3 text-sm font-medium text-white transition hover:bg-[#a9005d] hover:border-[#a9005d]"
                        >
                            View all jewellery
                        </Link>

                    </div>

                </div>

            </section>

            {/* ==========================================
                TRENDING
            ========================================== */}

            {trendingProducts.length > 0 && (
                <section className="bg-white py-20 md:py-28">

                    <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">

                        <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between md:mb-14">

                            <div>
                                <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.3em] text-[#a9005d]">
                                    What's catching attention
                                </p>

                                <h2 className="text-3xl font-semibold tracking-[-0.03em] text-[#222] sm:text-4xl md:text-5xl">
                                    Trending Now
                                </h2>
                            </div>

                            <Link
                                href="/shop?collection=trending"
                                className="group inline-flex items-center gap-2 text-sm font-medium text-[#302d2b] transition-colors hover:text-[#a9005d]"
                            >
                                Explore trending
                                <span className="transition-transform group-hover:translate-x-1">
                                    â†’
                                </span>
                            </Link>

                        </div>

                        <ProductGrid items={trendingProducts} />

                    </div>

                </section>
            )}

            {/* ==========================================
                BRAND STORY
            ========================================== */}

            <section className="bg-[#24201f] py-20 text-white md:py-28">

                <div className="mx-auto max-w-[1000px] px-5 text-center sm:px-8">

                    <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-[#e3a6c5]">
                        The APSRAA story
                    </p>

                    <h2 className="mx-auto mt-5 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-[-0.04em] sm:text-5xl md:text-6xl">
                        Jewellery should feel personal.
                    </h2>

                    <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-white/65 sm:text-lg">
                        APSRAA BY AVNI is built around the idea that the right piece doesn't need to be loud. It simply needs to feel like you.
                    </p>

                    <Link
                        href="/about"
                        className="group mt-9 inline-flex items-center gap-4 border-b border-white/60 pb-2 text-sm font-medium text-white transition hover:border-[#e3a6c5] hover:text-[#e3a6c5]"
                    >
                        Discover our story
                        <span className="transition-transform group-hover:translate-x-1">
                            â†’
                        </span>
                    </Link>

                </div>

            </section>

            {/* ==========================================
                SHOP BY PRICE â€” PRODUCT SUPPORT
            ========================================== */}

            {(under299Products.length > 0 ||
                under499Products.length > 0) && (
                <section className="bg-white py-20 md:py-24">

                    <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">

                        <div className="mb-10 flex items-end justify-between md:mb-14">

                            <div>
                                <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.3em] text-[#a9005d]">
                                    Easy to love
                                </p>

                                <h2 className="text-3xl font-semibold tracking-[-0.03em] text-[#222] sm:text-4xl">
                                    Favourites under â‚¹499
                                </h2>
                            </div>

                            <Link
                                href="/shop?collection=under-499"
                                className="hidden text-sm font-medium text-[#302d2b] hover:text-[#a9005d] sm:inline"
                            >
                                Shop all â†’
                            </Link>

                        </div>

                        <ProductGrid
                            items={
                                under499Products.length > 0
                                    ? under499Products
                                    : under299Products
                            }
                        />

                    </div>

                </section>
            )}

            {/* ==========================================
                TRUST
            ========================================== */}

            <section className="border-t border-[#eee8e4] bg-[#fbf8f6] py-20 md:py-24">

                <div className="mx-auto max-w-[1200px] px-5 sm:px-8">

                    <div className="mx-auto max-w-2xl text-center">

                        <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#a9005d]">
                            Shop with confidence
                        </p>

                        <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-[#222] sm:text-4xl">
                            The details matter.
                        </h2>

                        <p className="mt-4 text-sm leading-6 text-[#77716d]">
                            From secure checkout to order tracking, we've designed APSRAA to make shopping feel simple from beginning to end.
                        </p>

                    </div>

                    <div className="mt-12 grid gap-px overflow-hidden border border-[#e5ded9] bg-[#e5ded9] sm:grid-cols-2 lg:grid-cols-4">

                        <div className="bg-[#fbf8f6] p-7 text-center">
                            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#292624]">
                                Secure checkout
                            </h3>

                            <p className="mt-3 text-xs leading-5 text-[#77716d]">
                                Protected online payments.
                            </p>
                        </div>

                        <div className="bg-[#fbf8f6] p-7 text-center">
                            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#292624]">
                                Delivery
                            </h3>

                            <p className="mt-3 text-xs leading-5 text-[#77716d]">
                                Shipping across India.
                            </p>
                        </div>

                        <div className="bg-[#fbf8f6] p-7 text-center">
                            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#292624]">
                                Order tracking
                            </h3>

                            <p className="mt-3 text-xs leading-5 text-[#77716d]">
                                Follow your order after purchase.
                            </p>
                        </div>

                        <div className="bg-[#fbf8f6] p-7 text-center">
                            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#292624]">
                                Support
                            </h3>

                            <p className="mt-3 text-xs leading-5 text-[#77716d]">
                                We're here when you need us.
                            </p>
                        </div>

                    </div>

                </div>

            </section>

            <Footer />
        </>
    );
}
