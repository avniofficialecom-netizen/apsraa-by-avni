"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "./context/CartContext";
import { supabase } from "../lib/supabase";

type Product = {
    id: number;
    title: string;
    price: string;
    old_price: string;
    image: string;
    category: string;
    rating: number;
    reviews: number;
    description: string;
    stock: number;
    featured: boolean;
    bestseller: boolean;
};

type Variant = {
    id: number;
    product_id: number;
    sku: string | null;
    size: string | null;
    color: string | null;
    stock: number;
    price: number | null;
};

export default function ProductDetails({
                                           product,
                                       }: {
    product: Product;
}) {
    const router = useRouter();
    const { cart, addToCart } = useCart();

    const [variants, setVariants] = useState<Variant[]>([]);
    const [variantsLoading, setVariantsLoading] =
        useState(true);

    const [selectedVariantId, setSelectedVariantId] =
        useState<number | null>(null);

    const [showAddedMessage, setShowAddedMessage] =
        useState(false);

    const [quantity, setQuantity] = useState(1);

    // ==========================================
    // LOAD PRODUCT VARIANTS
    // ==========================================

    useEffect(() => {
        async function loadVariants() {
            setVariantsLoading(true);

            const { data, error } = await supabase
                .from("product_variants")
                .select(
                    "id, product_id, sku, size, color, stock, price"
                )
                .eq("product_id", product.id)
                .order("id", {
                    ascending: true,
                });

            if (error) {
                console.error(
                    "Variant loading error:",
                    error
                );

                setVariants([]);
                setVariantsLoading(false);
                return;
            }

            const loadedVariants =
                (data || []) as Variant[];

            setVariants(loadedVariants);

            const firstAvailable =
                loadedVariants.find(
                    (variant) =>
                        Number(variant.stock) > 0
                );

            if (firstAvailable) {
                setSelectedVariantId(
                    firstAvailable.id
                );
            }

            setVariantsLoading(false);
        }

        loadVariants();
    }, [product.id]);

    // ==========================================
    // SELECTED VARIANT
    // ==========================================

    const selectedVariant = useMemo(() => {
        if (selectedVariantId === null) {
            return null;
        }

        return (
            variants.find(
                (variant) =>
                    variant.id ===
                    selectedVariantId
            ) || null
        );
    }, [variants, selectedVariantId]);

    // ==========================================
    // VARIANT OPTIONS
    // ==========================================

    const sizes = useMemo(() => {
        return Array.from(
            new Set(
                variants
                    .map((variant) => variant.size)
                    .filter(Boolean)
            )
        ) as string[];
    }, [variants]);

    const colors = useMemo(() => {
        return Array.from(
            new Set(
                variants
                    .map((variant) => variant.color)
                    .filter(Boolean)
            )
        ) as string[];
    }, [variants]);

    // ==========================================
    // CART ITEM
    // ==========================================

    const cartItem = cart.find(
        (item) =>
            item.id === product.id &&
            (
                selectedVariant
                    ? item.variantId ===
                    selectedVariant.id
                    : !item.variantId
            )
    );

    const cartQuantity =
        cartItem?.quantity ?? 0;

    // ==========================================
    // EFFECTIVE STOCK
    // ==========================================

    const effectiveStock =
        selectedVariant
            ? Number(selectedVariant.stock) || 0
            : Number(product.stock) || 0;

    const availableStock = Math.max(
        0,
        effectiveStock - cartQuantity
    );

    // ==========================================
    // EFFECTIVE PRICE
    // ==========================================

    const effectivePrice =
        selectedVariant &&
        selectedVariant.price !== null &&
        selectedVariant.price !== undefined
            ? Number(selectedVariant.price)
            : Number(product.price);

    // ==========================================
    // KEEP QUANTITY VALID
    // ==========================================

    useEffect(() => {
        if (availableStock <= 0) {
            setQuantity(1);
            return;
        }

        setQuantity((current) =>
            Math.min(
                Math.max(current, 1),
                availableStock
            )
        );
    }, [availableStock]);

    // ==========================================
    // CHANGE VARIANT
    // ==========================================

    const selectVariant = (
        variantId: number
    ) => {
        setSelectedVariantId(variantId);
        setQuantity(1);
    };

    // ==========================================
    // QUANTITY
    // ==========================================

    const decreaseQuantity = () => {
        setQuantity((current) =>
            Math.max(1, current - 1)
        );
    };

    const increaseQuantity = () => {
        if (quantity >= availableStock) {
            return;
        }

        setQuantity((current) =>
            Math.min(
                current + 1,
                availableStock
            )
        );
    };

    // ==========================================
    // VALIDATE SELECTION
    // ==========================================

    const validateBeforeCart = () => {
        if (
            variants.length > 0 &&
            !selectedVariant
        ) {
            alert(
                "Please select a product variant."
            );

            return false;
        }

        if (effectiveStock <= 0) {
            alert(
                "This product is currently out of stock."
            );

            return false;
        }

        if (availableStock <= 0) {
            alert(
                "You already have the maximum available quantity of this variant in your cart."
            );

            return false;
        }

        if (quantity > availableStock) {
            alert(
                `Only ${availableStock} item(s) are available.`
            );

            return false;
        }

        return true;
    };

    // ==========================================
    // CART ITEM DATA
    // ==========================================

    const getCartItemData = () => ({
        id: product.id,
        title: product.title,
        price: String(effectivePrice),
        image: product.image,
        variantId:
        selectedVariant?.id,
        sku:
            selectedVariant?.sku ||
            undefined,
        size:
            selectedVariant?.size ||
            undefined,
        color:
            selectedVariant?.color ||
            undefined,
    });

    // ==========================================
    // ADD TO CART
    // ==========================================

    const handleAddToCart = () => {
        if (!validateBeforeCart()) {
            return;
        }

        for (
            let i = 0;
            i < quantity;
            i++
        ) {
            addToCart(
                getCartItemData()
            );
        }

        setShowAddedMessage(true);

        setTimeout(() => {
            setShowAddedMessage(false);
        }, 3500);
    };

    // ==========================================
    // BUY NOW
    // ==========================================

    const handleBuyNow = () => {
        if (!validateBeforeCart()) {
            return;
        }

        for (
            let i = 0;
            i < quantity;
            i++
        ) {
            addToCart(
                getCartItemData()
            );
        }

        router.push("/checkout");
    };

    return (
        <div className="relative">

            {/* ==========================================
                ADDED TO CART POPUP
            ========================================== */}

            {showAddedMessage && (
                <div className="fixed top-6 right-6 z-[9999] w-[min(92vw,390px)]">
                    <div className="bg-white rounded-2xl shadow-2xl border border-pink-100 p-5">
                        <div className="flex items-start gap-4">

                            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-2xl flex-shrink-0">
                                ✓
                            </div>

                            <div className="flex-1">

                                <h3 className="font-bold text-gray-800 text-lg">
                                    Added to Cart!
                                </h3>

                                <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                                    {quantity} ×{" "}
                                    {product.title}
                                </p>

                                {selectedVariant && (
                                    <p className="text-xs text-gray-400 mt-1">
                                        {selectedVariant.size
                                            ? `Size: ${selectedVariant.size}`
                                            : ""}

                                        {selectedVariant.size &&
                                        selectedVariant.color
                                            ? " • "
                                            : ""}

                                        {selectedVariant.color
                                            ? `Color: ${selectedVariant.color}`
                                            : ""}
                                    </p>
                                )}

                                <button
                                    type="button"
                                    onClick={() =>
                                        router.push(
                                            "/cart"
                                        )
                                    }
                                    className="mt-3 text-pink-600 font-semibold text-sm hover:text-pink-800 transition"
                                >
                                    View Cart →
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setShowAddedMessage(
                                        false
                                    )
                                }
                                className="text-gray-400 hover:text-gray-700 text-xl"
                                aria-label="Close"
                            >
                                ×
                            </button>

                        </div>
                    </div>
                </div>
            )}

            {/* CATEGORY */}

            <span className="bg-pink-100 text-pink-700 px-4 py-2 rounded-full">
                {product.category}
            </span>

            {/* TITLE */}

            <h1 className="text-5xl font-bold text-pink-700 mt-6">
                {product.title}
            </h1>

            {/* RATING */}

            <div className="mt-4 text-lg">
                ⭐ {product.rating} (
                {product.reviews} Reviews)
            </div>

            {/* PRICE */}

            <div className="flex items-center gap-4 mt-8">

                <span className="text-4xl font-bold text-pink-700">
                    ₹
                    {Number.isFinite(
                        effectivePrice
                    )
                        ? effectivePrice
                        : product.price}
                </span>

                {product.old_price && (
                    <span className="text-2xl text-gray-400 line-through">
                        ₹{product.old_price}
                    </span>
                )}

            </div>

            {/* DESCRIPTION */}

            <p className="mt-8 text-gray-600 leading-8">
                {product.description}
            </p>

            {/* VARIANT SELECTION */}

            {!variantsLoading &&
                variants.length > 0 && (
                    <div className="mt-8 space-y-6">

                        {/* SIZE */}

                        {sizes.length > 0 && (
                            <div>

                                <div className="font-semibold text-gray-800 mb-3">
                                    Size
                                </div>

                                <div className="flex flex-wrap gap-3">

                                    {sizes.map(
                                        (size) => {
                                            const matchingVariants =
                                                variants.filter(
                                                    (
                                                        variant
                                                    ) =>
                                                        variant.size ===
                                                        size
                                                );

                                            const available =
                                                matchingVariants.some(
                                                    (
                                                        variant
                                                    ) =>
                                                        Number(
                                                            variant.stock
                                                        ) >
                                                        0
                                                );

                                            const selected =
                                                selectedVariant?.size ===
                                                size;

                                            return (
                                                <button
                                                    key={
                                                        size
                                                    }
                                                    type="button"
                                                    disabled={
                                                        !available
                                                    }
                                                    onClick={() => {
                                                        const firstAvailable =
                                                            matchingVariants.find(
                                                                (
                                                                    variant
                                                                ) =>
                                                                    Number(
                                                                        variant.stock
                                                                    ) >
                                                                    0
                                                            );

                                                        if (
                                                            firstAvailable
                                                        ) {
                                                            selectVariant(
                                                                firstAvailable.id
                                                            );
                                                        }
                                                    }}
                                                    className={`px-5 py-3 rounded-xl border-2 font-semibold transition ${
                                                        selected
                                                            ? "border-pink-600 bg-pink-600 text-white"
                                                            : available
                                                                ? "border-pink-200 text-gray-700 hover:border-pink-500"
                                                                : "border-gray-200 text-gray-300 cursor-not-allowed line-through"
                                                    }`}
                                                >
                                                    {size}
                                                </button>
                                            );
                                        }
                                    )}

                                </div>
                            </div>
                        )}

                        {/* COLOR */}

                        {colors.length > 0 && (
                            <div>

                                <div className="font-semibold text-gray-800 mb-3">
                                    Color
                                </div>

                                <div className="flex flex-wrap gap-3">

                                    {colors.map(
                                        (color) => {
                                            const matchingVariants =
                                                variants.filter(
                                                    (
                                                        variant
                                                    ) =>
                                                        variant.color ===
                                                        color
                                                );

                                            const available =
                                                matchingVariants.some(
                                                    (
                                                        variant
                                                    ) =>
                                                        Number(
                                                            variant.stock
                                                        ) >
                                                        0
                                                );

                                            const selected =
                                                selectedVariant?.color ===
                                                color;

                                            return (
                                                <button
                                                    key={
                                                        color
                                                    }
                                                    type="button"
                                                    disabled={
                                                        !available
                                                    }
                                                    onClick={() => {
                                                        const firstAvailable =
                                                            matchingVariants.find(
                                                                (
                                                                    variant
                                                                ) =>
                                                                    Number(
                                                                        variant.stock
                                                                    ) >
                                                                    0
                                                            );

                                                        if (
                                                            firstAvailable
                                                        ) {
                                                            selectVariant(
                                                                firstAvailable.id
                                                            );
                                                        }
                                                    }}
                                                    className={`px-5 py-3 rounded-xl border-2 font-semibold transition ${
                                                        selected
                                                            ? "border-pink-600 bg-pink-600 text-white"
                                                            : available
                                                                ? "border-pink-200 text-gray-700 hover:border-pink-500"
                                                                : "border-gray-200 text-gray-300 cursor-not-allowed"
                                                    }`}
                                                >
                                                    {color}
                                                </button>
                                            );
                                        }
                                    )}

                                </div>
                            </div>
                        )}

                        {/* SELECTED VARIANT */}

                        {selectedVariant && (
                            <div className="rounded-2xl bg-pink-50 border border-pink-100 p-4">

                                <div className="text-sm text-gray-500">
                                    Selected Variant
                                </div>

                                <div className="font-semibold text-gray-800 mt-1">

                                    {selectedVariant.size
                                        ? `Size: ${selectedVariant.size}`
                                        : ""}

                                    {selectedVariant.size &&
                                    selectedVariant.color
                                        ? " • "
                                        : ""}

                                    {selectedVariant.color
                                        ? `Color: ${selectedVariant.color}`
                                        : ""}

                                </div>

                                {selectedVariant.sku && (
                                    <div className="text-xs text-gray-500 mt-1">
                                        SKU:{" "}
                                        {
                                            selectedVariant.sku
                                        }
                                    </div>
                                )}

                            </div>
                        )}

                    </div>
                )}

            {/* STOCK */}

            <div className="mt-6">

                <span className="font-semibold">
                    Stock:
                </span>{" "}

                {effectiveStock > 0 ? (
                    <span className="text-green-600 font-bold">
                        {effectiveStock} Available
                    </span>
                ) : (
                    <span className="text-red-600 font-bold">
                        ❌ Out of Stock
                    </span>
                )}

            </div>

            {/* CART QUANTITY */}

            {cartQuantity > 0 && (
                <div className="mt-4 text-pink-700 font-medium">
                    🛒 {cartQuantity} item
                    {cartQuantity > 1
                        ? "s"
                        : ""}{" "}
                    already in your cart
                </div>
            )}

            {/* BADGES */}

            <div className="flex gap-3 mt-6 flex-wrap">

                {product.featured && (
                    <span className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full">
                        ⭐ Featured
                    </span>
                )}

                {product.bestseller && (
                    <span className="bg-pink-100 text-pink-700 px-4 py-2 rounded-full">
                        🔥 Bestseller
                    </span>
                )}

            </div>

            {/* QUANTITY */}

            {effectiveStock > 0 &&
                availableStock > 0 && (
                    <div className="mt-8">

                        <div className="font-semibold text-gray-800 mb-3">
                            Quantity
                        </div>

                        <div className="inline-flex items-center border-2 border-pink-200 rounded-xl overflow-hidden bg-white">

                            <button
                                type="button"
                                onClick={
                                    decreaseQuantity
                                }
                                disabled={
                                    quantity <= 1
                                }
                                className="w-14 h-12 text-2xl font-semibold text-pink-600 hover:bg-pink-50 disabled:text-gray-300 disabled:cursor-not-allowed transition"
                            >
                                −
                            </button>

                            <div className="w-16 h-12 flex items-center justify-center border-x-2 border-pink-200 text-lg font-bold text-gray-800">
                                {quantity}
                            </div>

                            <button
                                type="button"
                                onClick={
                                    increaseQuantity
                                }
                                disabled={
                                    quantity >=
                                    availableStock
                                }
                                className="w-14 h-12 text-2xl font-semibold text-pink-600 hover:bg-pink-50 disabled:text-gray-300 disabled:cursor-not-allowed transition"
                            >
                                +
                            </button>

                        </div>

                        <p className="text-sm text-gray-500 mt-2">
                            {availableStock} item
                            {availableStock !==
                            1
                                ? "s"
                                : ""}{" "}
                            available to add
                        </p>

                    </div>
                )}

            {/* ACTION BUTTONS */}

            <div className="flex gap-4 mt-10 flex-wrap">

                {effectiveStock > 0 &&
                (
                    variants.length === 0 ||
                    selectedVariant
                ) ? (
                    <>
                        <button
                            type="button"
                            onClick={
                                handleAddToCart
                            }
                            disabled={
                                availableStock <=
                                0
                            }
                            className={`flex-1 min-w-[220px] px-8 py-4 rounded-xl font-semibold text-lg transition ${
                                availableStock <=
                                0
                                    ? "bg-gray-400 text-white cursor-not-allowed"
                                    : "border-2 border-pink-600 text-pink-600 hover:bg-pink-600 hover:text-white"
                            }`}
                        >
                            {availableStock <=
                            0
                                ? "❌ Maximum Stock Added"
                                : "🛒 Add to Cart"}
                        </button>

                        <button
                            type="button"
                            onClick={
                                handleBuyNow
                            }
                            disabled={
                                availableStock <=
                                0
                            }
                            className={`flex-1 min-w-[220px] px-8 py-4 rounded-xl font-semibold text-lg transition ${
                                availableStock <=
                                0
                                    ? "bg-gray-400 text-white cursor-not-allowed"
                                    : "bg-pink-600 text-white hover:bg-pink-700 shadow-md hover:shadow-lg"
                            }`}
                        >
                            ⚡ Buy Now
                        </button>
                    </>
                ) : variants.length > 0 &&
                !selectedVariant ? (
                    <div className="w-full bg-yellow-50 border border-yellow-200 text-yellow-800 px-5 py-4 rounded-xl font-semibold">
                        Please select a variant before
                        adding this product to your
                        cart.
                    </div>
                ) : (
                    <button
                        type="button"
                        disabled
                        className="w-full bg-gray-400 text-white px-8 py-4 rounded-xl font-semibold text-lg cursor-not-allowed"
                    >
                        ❌ Out of Stock
                    </button>
                )}

                {/* WISHLIST */}

                <button
                    type="button"
                    className="w-full border-2 border-pink-200 text-pink-600 px-8 py-4 rounded-xl font-semibold hover:bg-pink-50 transition"
                >
                    ❤️ Wishlist
                </button>

            </div>

            {/* DELIVERY & TRUST */}

            <div className="mt-10 border-t border-pink-100 pt-8">

                <h2 className="text-xl font-bold text-pink-700 mb-5">
                    Why Shop With Us?
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    <div className="flex items-start gap-4 bg-white border border-pink-100 rounded-2xl p-4">
                        <div className="text-2xl">
                            🚚
                        </div>

                        <div>
                            <h3 className="font-bold text-gray-800">
                                Delivery Available
                            </h3>

                            <p className="text-sm text-gray-500 mt-1">
                                We deliver across India.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4 bg-white border border-pink-100 rounded-2xl p-4">
                        <div className="text-2xl">
                            📦
                        </div>

                        <div>
                            <h3 className="font-bold text-gray-800">
                                Carefully Packed
                            </h3>

                            <p className="text-sm text-gray-500 mt-1">
                                Your jewellery is packed carefully before dispatch.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4 bg-white border border-pink-100 rounded-2xl p-4">
                        <div className="text-2xl">
                            🔒
                        </div>

                        <div>
                            <h3 className="font-bold text-gray-800">
                                Secure Checkout
                            </h3>

                            <p className="text-sm text-gray-500 mt-1">
                                Payments are processed through our secure checkout.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4 bg-white border border-pink-100 rounded-2xl p-4">
                        <div className="text-2xl">
                            💎
                        </div>

                        <div>
                            <h3 className="font-bold text-gray-800">
                                Jewellery Care
                            </h3>

                            <p className="text-sm text-gray-500 mt-1">
                                Handle and store your jewellery carefully to maintain its finish.
                            </p>
                        </div>
                    </div>

                </div>

            </div>

        </div>
    );
}