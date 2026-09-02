"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "./context/CartContext";

type ProductCardProps = {
    id: number;
    image: string;
    title: string;
    subtitle: string;
    stock: number;
    hasVariants?: boolean;
    bestseller?: boolean;
    trending?: boolean;
    featured?: boolean;
};

export default function ProductCard({
    id,
    image,
    title,
    subtitle,
    stock,
    hasVariants = false,
    bestseller = false,
    trending = false,
    featured = false,
}: ProductCardProps) {
    const router = useRouter();
    const { addToCart } = useCart();
    const [showAddedMessage, setShowAddedMessage] = useState(false);

    const isOutOfStock = stock <= 0;
    const isLowStock = stock > 0 && stock <= 5;

    /*
     * Always normalize the price before displaying it.
     *
     * This protects the storefront from corrupted currency text such as:
     * ₹149
     * a,1 149
     * ₹149
     *
     * The actual numeric price is preserved and a real ₹ symbol is
     * always added by this component.
     */
    const numericPrice = String(subtitle ?? "")
        .replace(/,/g, "")
        .match(/-?\d+(?:\.\d+)?/)?.[0] ?? "0";

    const cleanPrice = `₹${numericPrice}`;

    const goToProduct = () => router.push(`/product/${id}`);

    const handleAddToCart = async () => {
        if (isOutOfStock) return;

        if (hasVariants) {
            router.push(`/product/${id}`);
            return;
        }

        const success = await addToCart({
            id,
            title,
            price: cleanPrice,
            image,
        });

        if (success === false) return;

        setShowAddedMessage(true);

        window.setTimeout(() => {
            setShowAddedMessage(false);
        }, 3500);
    };

    const handleBuyNow = async () => {
        if (isOutOfStock) return;

        if (hasVariants) {
            router.push(`/product/${id}`);
            return;
        }

        const success = await addToCart({
            id,
            title,
            price: cleanPrice,
            image,
        });

        if (success === false) return;

        router.push("/checkout");
    };

    const badge = isOutOfStock
        ? "Sold Out"
        : bestseller
        ? "Bestseller"
        : trending
        ? "Trending"
        : featured
        ? "Featured"
        : null;

    return (
        <article className="group relative">
            {/* IMAGE */}

            <div
                className="relative cursor-pointer overflow-hidden bg-[#f4efec]"
                onClick={goToProduct}
            >
                <div className="aspect-[4/5] w-full overflow-hidden">
                    <img
                        src={image}
                        alt={title}
                        loading="lazy"
                        className={`
                            h-full w-full object-cover
                            transition-transform duration-700 ease-out
                            group-hover:scale-[1.035]
                            ${isOutOfStock ? "opacity-65" : ""}
                        `}
                    />
                </div>

                {badge && (
                    <div className="absolute left-3 top-3">
                        <span className="inline-flex bg-white/95 px-3 py-1.5 text-[9px] font-medium uppercase tracking-[0.18em] text-[#292624] shadow-sm backdrop-blur-sm">
                            {badge}
                        </span>
                    </div>
                )}

                <button
                    type="button"
                    onClick={(event) => event.stopPropagation()}
                    aria-label={`Add ${title} to wishlist`}
                    className="
                        absolute right-3 top-3 flex h-10 w-10
                        items-center justify-center rounded-full
                        bg-white/95 text-lg text-[#6f6864] shadow-sm
                        backdrop-blur-sm transition-all duration-300
                        hover:bg-[#a9005d] hover:text-white
                    "
                >
                    ♡
                </button>

                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        goToProduct();
                    }}
                    aria-label={`View ${title}`}
                    className="
                        absolute bottom-3 right-3 flex h-10 w-10
                        items-center justify-center rounded-full
                        bg-white text-[#292624] shadow-sm
                        transition-all duration-300 hover:bg-[#a9005d]
                        hover:text-white sm:translate-y-2 sm:opacity-0
                        sm:group-hover:translate-y-0 sm:group-hover:opacity-100
                    "
                >
                    →
                </button>
            </div>

            {/* INFO */}

            <div className="pt-4">
                <div className="flex items-start justify-between gap-3">
                    <button
                        type="button"
                        onClick={goToProduct}
                        className="min-w-0 text-left"
                    >
                        <h3
                            className="
                                line-clamp-2 text-[13px] font-medium leading-[1.4]
                                text-[#292624] transition-colors hover:text-[#a9005d]
                                sm:text-[15px]
                            "
                        >
                            {title}
                        </h3>
                    </button>

                    <span className="shrink-0 text-[13px] font-semibold text-[#292624] sm:text-sm">
                        {cleanPrice}
                    </span>
                </div>

                {hasVariants && !isOutOfStock && (
                    <button
                        type="button"
                        onClick={goToProduct}
                        className="mt-1.5 text-left text-[10px] tracking-wide text-[#8a8380] transition-colors hover:text-[#a9005d] sm:text-[11px]"
                    >
                        Choose your options →
                    </button>
                )}

                {isLowStock && (
                    <p className="mt-1.5 text-[9px] font-medium uppercase tracking-[0.12em] text-[#a9005d] sm:text-[10px]">
                        Only {stock} left
                    </p>
                )}

                {isOutOfStock && (
                    <p className="mt-1.5 text-[9px] uppercase tracking-[0.12em] text-[#9a9390]">
                        Currently unavailable
                    </p>
                )}

                {!isOutOfStock && (
                    <div className="mt-4 flex gap-2">
                        <button
                            type="button"
                            onClick={handleAddToCart}
                            className="
                                flex-1 border border-[#d8d0cc] bg-white
                                px-3 py-2.5 text-[10px] font-medium uppercase
                                tracking-[0.12em] text-[#292624] transition-all
                                hover:border-[#a9005d] hover:bg-[#a9005d]
                                hover:text-white
                            "
                        >
                            {hasVariants ? "Choose options" : "Add to cart"}
                        </button>

                        <button
                            type="button"
                            onClick={handleBuyNow}
                            aria-label={`Buy ${title} now`}
                            className="
                                flex h-10 w-10 shrink-0 items-center
                                justify-center bg-[#292624] text-sm text-white
                                transition hover:bg-[#a9005d]
                            "
                        >
                            →
                        </button>
                    </div>
                )}
            </div>

            {/* ADDED TO CART */}

            {showAddedMessage && (
                <div className="fixed bottom-5 left-4 right-4 z-[9999] sm:left-auto sm:right-5 sm:w-[360px]">
                    <div className="border border-[#e7dfdb] bg-white p-4 shadow-[0_20px_60px_rgba(0,0,0,0.14)]">
                        <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-[#f7e5ef] text-sm text-[#a9005d]">
                                ✓
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-[#292624]">
                                    Added to your bag
                                </p>

                                <p className="mt-1 truncate text-xs text-[#8a8380]">
                                    {title}
                                </p>

                                <button
                                    type="button"
                                    onClick={() => router.push("/cart")}
                                    className="mt-2 text-xs font-medium text-[#a9005d] hover:underline"
                                >
                                    View bag →
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowAddedMessage(false)}
                                aria-label="Close"
                                className="text-lg leading-none text-[#aaa3a0] hover:text-[#292624]"
                            >
                                ×
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </article>
    );
}