"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

const COLOR_HEX: Record<string, string> = {
    White: "#ffffff",
    Pearl: "#eee8d8",
    Ivory: "#fff8dc",
    Cream: "#f5e8c8",
    Beige: "#d8c3a5",
    Pink: "#ec78a8",
    Blush: "#f4b6c2",
    Rose: "#d66a8a",
    Red: "#d62828",
    Coral: "#f47c6c",
    Orange: "#f28c28",
    Yellow: "#f4d03f",
    Gold: "#d4af37",
    Champagne: "#e8d3a3",
    Brown: "#795548",
    Copper: "#b87333",
    Bronze: "#cd7f32",
    Green: "#3f9b4f",
    Mint: "#98e0c0",
    Olive: "#808000",
    Emerald: "#087f5b",
    Teal: "#159a9c",
    Blue: "#4a90e2",
    "Sky Blue": "#87ceeb",
    "Royal Blue": "#4169e1",
    Navy: "#1f3a70",
    Purple: "#7e57c2",
    Lavender: "#b39ddb",
    Plum: "#7b3f6f",
    Silver: "#c0c0c0",
    Grey: "#808080",
    Black: "#111111",
};

const getColorStyle = (color: string) => {
    if (
        color.trim().toLowerCase() ===
        "multicolour"
    ) {
        return {
            background:
                "linear-gradient(135deg, #ef4444 0%, #f59e0b 25%, #22c55e 50%, #3b82f6 75%, #a855f7 100%)",
        };
    }

    return {
        backgroundColor:
            COLOR_HEX[color] || "#e5e7eb",
    };
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

    const [selectedSize, setSelectedSize] =
        useState<string | null>(null);

    const [selectedColor, setSelectedColor] =
        useState<string | null>(null);

    const [quantity, setQuantity] = useState(1);

    const [showAddedMessage, setShowAddedMessage] =
        useState(false);

    const popupTimerRef = useRef<
        ReturnType<typeof setTimeout> | null
    >(null);

    // ==========================================
    // NORMALIZE OPTION VALUES
    // ==========================================

    const normalizeOption = (
        value: string | null | undefined
    ) => {
        return String(value ?? "")
            .trim()
            .toLowerCase();
    };

    // ==========================================
    // CLEANUP
    // ==========================================

    useEffect(() => {
        return () => {
            if (popupTimerRef.current) {
                clearTimeout(
                    popupTimerRef.current
                );
            }
        };
    }, []);

    // ==========================================
    // LOAD VARIANTS
    // ==========================================

    useEffect(() => {
        async function loadVariants() {
            setVariantsLoading(true);

            const { data, error } =
                await supabase
                    .from("product_variants")
                    .select(
                        "id, product_id, sku, size, color, stock, price"
                    )
                    .eq(
                        "product_id",
                        product.id
                    )
                    .order("id", {
                        ascending: true,
                    });

            if (error) {
                console.error(
                    "Variant loading error:",
                    error
                );

                setVariants([]);
                setSelectedSize(null);
                setSelectedColor(null);
                setVariantsLoading(false);
                return;
            }

            const loadedVariants =
                (data || []) as Variant[];

            setVariants(
                loadedVariants
            );

            setSelectedSize(null);
            setSelectedColor(null);
            setQuantity(1);
            setVariantsLoading(false);
        }

        loadVariants();
    }, [product.id]);

    // ==========================================
    // AVAILABLE SIZES
    // ==========================================

    const sizes = useMemo(() => {
        return Array.from(
            new Map(
                variants
                    .filter(
                        (variant) =>
                            variant.size &&
                            String(
                                variant.size
                            ).trim() !== ""
                    )
                    .map(
                        (variant) => [
                            normalizeOption(
                                variant.size
                            ),
                            String(
                                variant.size
                            ).trim(),
                        ]
                    )
            ).values()
        );
    }, [variants]);

    // ==========================================
    // AVAILABLE COLORS
    // ==========================================

    const colors = useMemo(() => {
        return Array.from(
            new Map(
                variants
                    .filter(
                        (variant) =>
                            variant.color &&
                            String(
                                variant.color
                            ).trim() !== ""
                    )
                    .map(
                        (variant) => [
                            normalizeOption(
                                variant.color
                            ),
                            String(
                                variant.color
                            ).trim(),
                        ]
                    )
            ).values()
        );
    }, [variants]);

    const hasSizes =
        sizes.length > 0;

    const hasColors =
        colors.length > 0;

    // ==========================================
    // SELECTED VARIANT
    // ==========================================

    const selectedVariant = useMemo(() => {
        if (variants.length === 0) {
            return null;
        }

        if (
            hasSizes &&
            !selectedSize
        ) {
            return null;
        }

        if (
            hasColors &&
            !selectedColor
        ) {
            return null;
        }

        const selectedSizeNormalized =
            normalizeOption(
                selectedSize
            );

        const selectedColorNormalized =
            normalizeOption(
                selectedColor
            );

        return (
            variants.find(
                (variant) => {
                    const variantSize =
                        normalizeOption(
                            variant.size
                        );

                    const variantColor =
                        normalizeOption(
                            variant.color
                        );

                    const sizeMatches =
                        !hasSizes ||
                        variantSize ===
                            selectedSizeNormalized;

                    const colorMatches =
                        !hasColors ||
                        variantColor ===
                            selectedColorNormalized;

                    return (
                        sizeMatches &&
                        colorMatches
                    );
                }
            ) || null
        );
    }, [
        variants,
        selectedSize,
        selectedColor,
        hasSizes,
        hasColors,
    ]);

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
    // STOCK
    // ==========================================

    const effectiveStock =
        variants.length > 0
            ? selectedVariant
                ? Number(
                      selectedVariant.stock
                  ) || 0
                : 0
            : Number(product.stock) || 0;

    const availableStock = Math.max(
        0,
        effectiveStock - cartQuantity
    );

    // ==========================================
    // PRICE
    // ==========================================

    const effectivePrice =
        selectedVariant?.price !==
            null &&
        selectedVariant?.price !==
            undefined
            ? Number(
                  selectedVariant.price
              )
            : Number(product.price);

    const oldPrice = Number(
        product.old_price
    );

    const hasDiscount =
        Number.isFinite(oldPrice) &&
        oldPrice > effectivePrice &&
        effectivePrice >= 0;

    const discountPercent =
        hasDiscount
            ? Math.round(
                  ((oldPrice -
                      effectivePrice) /
                      oldPrice) *
                      100
              )
            : 0;

    // ==========================================
    // QUANTITY SAFETY
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
    // SIZE AVAILABILITY
    // ==========================================

    const isSizeAvailable = (
        size: string
    ) => {
        const normalizedSize =
            normalizeOption(size);

        return variants.some(
            (variant) => {
                if (
                    normalizeOption(
                        variant.size
                    ) !==
                    normalizedSize
                ) {
                    return false;
                }

                if (
                    Number(
                        variant.stock
                    ) <= 0
                ) {
                    return false;
                }

                if (
                    hasColors &&
                    selectedColor &&
                    normalizeOption(
                        variant.color
                    ) !==
                        normalizeOption(
                            selectedColor
                        )
                ) {
                    return false;
                }

                return true;
            }
        );
    };

    // ==========================================
    // COLOR AVAILABILITY
    // ==========================================

    const isColorAvailable = (
        color: string
    ) => {
        const normalizedColor =
            normalizeOption(color);

        return variants.some(
            (variant) => {
                if (
                    normalizeOption(
                        variant.color
                    ) !==
                    normalizedColor
                ) {
                    return false;
                }

                if (
                    Number(
                        variant.stock
                    ) <= 0
                ) {
                    return false;
                }

                if (
                    hasSizes &&
                    selectedSize &&
                    normalizeOption(
                        variant.size
                    ) !==
                        normalizeOption(
                            selectedSize
                        )
                ) {
                    return false;
                }

                return true;
            }
        );
    };

    // ==========================================
    // SELECT SIZE
    // ==========================================

    const handleSizeSelect = (
        size: string
    ) => {
        if (!isSizeAvailable(size)) {
            return;
        }

        setSelectedSize(size);
        setQuantity(1);
    };

    // ==========================================
    // SELECT COLOR
    // ==========================================

    const handleColorSelect = (
        color: string
    ) => {
        if (!isColorAvailable(color)) {
            return;
        }

        setSelectedColor(color);
        setQuantity(1);
    };

    // ==========================================
    // QUANTITY
    // ==========================================

    const decreaseQuantity = () => {
        setQuantity((current) =>
            Math.max(
                1,
                current - 1
            )
        );
    };

    const increaseQuantity = () => {
        if (
            quantity >=
            availableStock
        ) {
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
    // VALIDATION
    // ==========================================

    const validateBeforeCart =
        () => {
            if (variants.length > 0) {
                if (
                    hasSizes &&
                    !selectedSize
                ) {
                    alert(
                        "Please select a size."
                    );
                    return false;
                }

                if (
                    hasColors &&
                    !selectedColor
                ) {
                    alert(
                        "Please select a color."
                    );
                    return false;
                }

                if (!selectedVariant) {
                    alert(
                        "This combination is currently unavailable."
                    );
                    return false;
                }

                if (
                    Number(
                        selectedVariant.stock
                    ) <= 0
                ) {
                    alert(
                        "This option is currently out of stock."
                    );
                    return false;
                }
            }

            if (
                effectiveStock <= 0
            ) {
                alert(
                    "This product is currently out of stock."
                );
                return false;
            }

            if (
                availableStock <= 0
            ) {
                alert(
                    "You already have the maximum available quantity in your bag."
                );
                return false;
            }

            if (
                quantity >
                availableStock
            ) {
                alert(
                    `Only ${availableStock} item(s) are available.`
                );
                return false;
            }

            return true;
        };

    // ==========================================
    // CART DATA
    // ==========================================

    const getCartItemData =
        () => ({
            id: product.id,
            title: product.title,
            price: String(
                effectivePrice
            ),
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
    // SUCCESS MESSAGE
    // ==========================================

    const showCartSuccessMessage =
        () => {
            if (
                popupTimerRef.current
            ) {
                clearTimeout(
                    popupTimerRef.current
                );
            }

            setShowAddedMessage(
                true
            );

            popupTimerRef.current =
                setTimeout(() => {
                    setShowAddedMessage(
                        false
                    );
                }, 5000);
        };

    // ==========================================
    // ADD TO CART
    // ==========================================

    const handleAddToCart =
        async () => {
            if (
                !validateBeforeCart()
            ) {
                return;
            }

            const success =
                await addToCart(
                    getCartItemData(),
                    quantity
                );

            if (!success) {
                return;
            }

            showCartSuccessMessage();
        };

    // ==========================================
    // BUY NOW
    // ==========================================

    const handleBuyNow =
        async () => {
            if (
                !validateBeforeCart()
            ) {
                return;
            }

            const success =
                await addToCart(
                    getCartItemData(),
                    quantity
                );

            if (!success) {
                return;
            }

            router.push(
                "/checkout"
            );
        };

    // ==========================================
    // PURCHASE STATE
    // ==========================================

    const canPurchase =
        effectiveStock > 0 &&
        availableStock > 0 &&
        (
            variants.length ===
                0 ||
            Boolean(
                selectedVariant
            )
        );

    return (
        <div className="relative">

            {/* ==========================================
                CART SUCCESS
            ========================================== */}

            {showAddedMessage && (
                <div
                    className="fixed top-28 left-1/2 z-[100000] w-[calc(100vw-32px)] max-w-[420px] -translate-x-1/2 sm:left-auto sm:right-6 sm:translate-x-0"
                    role="alert"
                    aria-live="polite"
                >
                    <div className="border border-[#eadfe5] bg-white p-5 shadow-[0_20px_60px_rgba(30,20,30,0.16)]">

                        <div className="flex items-start gap-3">

                            <div className="w-11 h-11 shrink-0 rounded-full bg-green-50 text-green-600 flex items-center justify-center text-xl font-bold">
                                ✓
                            </div>

                            <div className="min-w-0 flex-1">

                                <p className="font-semibold text-gray-900">
                                    Added to your bag
                                </p>

                                <p className="text-sm text-gray-500 mt-1 truncate">
                                    {quantity} ×{" "}
                                    {product.title}
                                </p>

                                <button
                                    type="button"
                                    onClick={() =>
                                        router.push(
                                            "/cart"
                                        )
                                    }
                                    className="mt-2 text-sm font-semibold text-pink-700 hover:text-pink-900"
                                >
                                    View bag →
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

            {/* ==========================================
                PRODUCT HEADER
            ========================================== */}

            <div className="mb-7">
                <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-pink-600" />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-pink-600">
                        {product.category}
                    </span>
                </div>

                <h1 className="mt-4 text-4xl font-semibold leading-[1.02] tracking-[-0.035em] text-gray-950 sm:text-5xl lg:text-[3.35rem]">
                    {product.title}
                </h1>

                <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
                    <div className="flex items-center gap-1.5">
                        <span className="text-amber-500">★</span>
                        <span className="font-semibold text-gray-900">
                            {product.rating}
                        </span>
                    </div>

                    <span className="text-gray-300">|</span>

                    <span className="text-gray-500">
                        {product.reviews} reviews
                    </span>
                </div>
            </div>

            {/* ==========================================
                PRICE
            ========================================== */}

            <div className="border-y border-gray-200 py-7">

                <div className="flex flex-wrap items-end gap-3">

                    <span className="text-3xl font-semibold tracking-tight text-gray-950 sm:text-4xl">
                        ₹
                        {Number.isFinite(
                            effectivePrice
                        )
                            ? effectivePrice
                            : product.price}
                    </span>

                    {hasDiscount && (
                        <>
                            <span className="mb-1 text-lg text-gray-400 line-through">
                                ₹{oldPrice}
                            </span>

                            <span className="mb-1 rounded-full bg-pink-50 px-3 py-1 text-xs font-bold text-pink-700">
                                {discountPercent}%
                                {" "}OFF
                            </span>
                        </>
                    )}

                </div>

                <p className="mt-2 text-xs text-gray-500">
                    Inclusive of applicable taxes
                </p>

            </div>

            {/* ==========================================
                DESCRIPTION
            ========================================== */}

            {product.description && (
                <div className="mt-7">
                    <p className="text-[15px] leading-7 text-gray-600">
                        {product.description}
                    </p>
                </div>
            )}

            {/* ==========================================
                VARIANTS
            ========================================== */}

            {!variantsLoading &&
                variants.length > 0 && (
                    <div className="mt-8 space-y-7">

                        {/* SIZE */}

                        {hasSizes && (
                            <div>

                                <div className="flex items-center justify-between mb-3">

                                    <span className="text-sm font-semibold text-gray-900">
                                        Select size
                                    </span>

                                    {selectedSize && (
                                        <span className="text-sm text-gray-500">
                                            {selectedSize}
                                        </span>
                                    )}

                                </div>

                                <div className="flex flex-wrap gap-2">

                                    {sizes.map(
                                        (size) => {
                                            const available =
                                                isSizeAvailable(
                                                    size
                                                );

                                            const selected =
                                                normalizeOption(
                                                    selectedSize
                                                ) ===
                                                normalizeOption(
                                                    size
                                                );

                                            return (
                                                <button
                                                    key={
                                                        size
                                                    }
                                                    type="button"
                                                    disabled={
                                                        !available
                                                    }
                                                    onClick={() =>
                                                        handleSizeSelect(
                                                            size
                                                        )
                                                    }
                                                    className={[
                                                        "min-w-16 px-5 py-3 rounded-xl border text-sm font-semibold transition",
                                                        selected
                                                            ? "border-gray-950 bg-gray-950 text-white"
                                                            : available
                                                                ? "border-gray-300 bg-white text-gray-800 hover:border-gray-950"
                                                                : "border-gray-200 bg-gray-50 text-gray-300 line-through cursor-not-allowed",
                                                    ].join(
                                                        " "
                                                    )}
                                                >
                                                    {size}
                                                </button>
                                            );
                                        }
                                    )}

                                </div>

                            </div>
                        )}

                        {/* ==========================================
                            PREMIUM COLOR SWATCHES
                        ========================================== */}

                        {hasColors && (
                            <div>

                                <div className="flex items-center justify-between mb-4">

                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">
                                            Select color
                                        </p>

                                        {selectedColor && (
                                            <p className="mt-1 text-xs text-gray-500">
                                                Selected:{" "}
                                                <span className="font-semibold text-gray-800">
                                                    {selectedColor}
                                                </span>
                                            </p>
                                        )}
                                    </div>

                                </div>

                                <div className="flex flex-wrap gap-4">

                                    {colors.map(
                                        (color) => {
                                            const available =
                                                isColorAvailable(
                                                    color
                                                );

                                            const selected =
                                                normalizeOption(
                                                    selectedColor
                                                ) ===
                                                normalizeOption(
                                                    color
                                                );

                                            return (
                                                <button
                                                    key={
                                                        color
                                                    }
                                                    type="button"
                                                    disabled={
                                                        !available
                                                    }
                                                    onClick={() =>
                                                        handleColorSelect(
                                                            color
                                                        )
                                                    }
                                                    aria-label={`Select ${color}`}
                                                    aria-pressed={
                                                        selected
                                                    }
                                                    className={[
                                                        "group flex flex-col items-center gap-2",
                                                        !available &&
                                                            "cursor-not-allowed opacity-40",
                                                    ].join(
                                                        " "
                                                    )}
                                                >

                                                    <span
                                                        className={[
                                                            "relative flex h-12 w-12 items-center justify-center rounded-full border bg-white transition-all duration-200",
                                                            selected
                                                                ? "border-gray-950 ring-2 ring-gray-950 ring-offset-2 scale-105"
                                                                : available
                                                                    ? "border-gray-300 group-hover:border-gray-950 group-hover:scale-105"
                                                                    : "border-gray-200",
                                                        ].join(
                                                            " "
                                                        )}
                                                    >

                                                        <span
                                                            className="h-9 w-9 rounded-full border border-black/10 shadow-inner"
                                                            style={getColorStyle(
                                                                color
                                                            )}
                                                        />

                                                        {selected && (
                                                            <span className="absolute inset-0 flex items-center justify-center">
                                                                <span
                                                                    className={`flex h-5 w-5 items-center justify-center rounded-full ${
                                                                        [
                                                                            "White",
                                                                            "Pearl",
                                                                            "Ivory",
                                                                            "Cream",
                                                                            "Beige",
                                                                            "Yellow",
                                                                            "Champagne",
                                                                            "Silver",
                                                                        ].includes(
                                                                            color
                                                                        )
                                                                            ? "bg-gray-900 text-white"
                                                                            : "bg-white text-gray-900"
                                                                    } shadow-sm`}
                                                                >
                                                                    ✓
                                                                </span>
                                                            </span>
                                                        )}

                                                    </span>

                                                    <span
                                                        className={[
                                                            "text-[11px] font-medium",
                                                            selected
                                                                ? "text-gray-950"
                                                                : "text-gray-500",
                                                        ].join(
                                                            " "
                                                        )}
                                                    >
                                                        {color}
                                                    </span>

                                                </button>
                                            );
                                        }
                                    )}

                                </div>

                            </div>
                        )}

                        {/* SELECTED VARIANT */}

                        {selectedVariant && (
                            <div className="rounded-2xl bg-gray-50 border border-gray-200 px-4 py-3">

                                <div className="text-xs uppercase tracking-wider text-gray-400">
                                    Selected
                                </div>

                                <div className="mt-1 text-sm font-semibold text-gray-900">

                                    {selectedVariant.size &&
                                        `Size: ${selectedVariant.size}`}

                                    {selectedVariant.size &&
                                        selectedVariant.color &&
                                        "  •  "}

                                    {selectedVariant.color &&
                                        `Color: ${selectedVariant.color}`}

                                </div>

                            </div>
                        )}

                        {/* INVALID COMBINATION */}

                        {(
                            (hasSizes &&
                                selectedSize) ||
                            (hasColors &&
                                selectedColor)
                        ) &&
                            !selectedVariant && (
                                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                    This combination is currently unavailable.
                                </div>
                            )}

                    </div>
                )}

            {variantsLoading && (
                <div className="mt-7 text-sm text-gray-400">
                    Checking available options…
                </div>
            )}

            {/* ==========================================
                STOCK
            ========================================== */}

            <div className="mt-7">

                {variants.length > 0 ? (
                    selectedVariant ? (
                        effectiveStock > 0 ? (
                            effectiveStock <= 5 ? (
                                <div className="flex items-center gap-2 text-sm font-medium text-orange-700">
                                    <span className="h-2 w-2 rounded-full bg-orange-500" />
                                    Only {effectiveStock} left
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-sm font-medium text-green-700">
                                    <span className="h-2 w-2 rounded-full bg-green-500" />
                                    In stock
                                </div>
                            )
                        ) : (
                            <div className="text-sm font-medium text-red-600">
                                Currently out of stock
                            </div>
                        )
                    ) : (
                        <div className="text-sm text-gray-500">
                            Select your options to check availability.
                        </div>
                    )
                ) : effectiveStock > 0 ? (
                    effectiveStock <= 5 ? (
                        <div className="flex items-center gap-2 text-sm font-medium text-orange-700">
                            <span className="h-2 w-2 rounded-full bg-orange-500" />
                            Only {effectiveStock} left
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-sm font-medium text-green-700">
                            <span className="h-2 w-2 rounded-full bg-green-500" />
                            In stock
                        </div>
                    )
                ) : (
                    <div className="text-sm font-medium text-red-600">
                        Currently out of stock
                    </div>
                )}

            </div>

            {/* ==========================================
                CART QUANTITY NOTICE
            ========================================== */}

            {cartQuantity > 0 && (
                <div className="mt-4 rounded-xl bg-pink-50 px-4 py-3 text-sm text-pink-800">
                    {cartQuantity} item
                    {cartQuantity > 1
                        ? "s"
                        : ""}{" "}
                    already in your bag.
                </div>
            )}

            {/* ==========================================
                PURCHASE
            ========================================== */}

            {canPurchase && (
                <div className="mt-8">

                    <div className="flex items-center justify-between mb-3">

                        <span className="text-sm font-semibold text-gray-900">
                            Quantity
                        </span>

                        <span className="text-xs text-gray-400">
                            {availableStock} available
                        </span>

                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">

                        <div className="inline-flex h-14 shrink-0 items-center self-start rounded-xl border border-gray-300 bg-white">

                            <button
                                type="button"
                                onClick={
                                    decreaseQuantity
                                }
                                disabled={
                                    quantity <=
                                    1
                                }
                                className="h-full w-12 text-xl text-gray-700 hover:bg-gray-50 disabled:text-gray-300"
                                aria-label="Decrease quantity"
                            >
                                −
                            </button>

                            <span className="w-12 text-center font-semibold text-gray-900">
                                {quantity}
                            </span>

                            <button
                                type="button"
                                onClick={
                                    increaseQuantity
                                }
                                disabled={
                                    quantity >=
                                    availableStock
                                }
                                className="h-full w-12 text-xl text-gray-700 hover:bg-gray-50 disabled:text-gray-300"
                                aria-label="Increase quantity"
                            >
                                +
                            </button>

                        </div>

                        <button
                            type="button"
                            onClick={
                                handleAddToCart
                            }
                            className="h-14 flex-1 border border-gray-900 bg-white px-6 text-sm font-semibold uppercase tracking-[0.08em] text-gray-950 transition hover:bg-gray-950 hover:text-white"
                        >
                            Add to Bag
                        </button>

                        <button
                            type="button"
                            onClick={
                                handleBuyNow
                            }
                            className="h-14 flex-1 bg-pink-700 px-6 text-sm font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-pink-800"
                        >
                            Buy Now
                        </button>

                    </div>

                </div>
            )}

            {/* ==========================================
                UNAVAILABLE
            ========================================== */}

            {!canPurchase &&
                !variantsLoading && (
                    <div className="mt-8">

                        <button
                            type="button"
                            disabled
                            className="w-full h-14 rounded-xl bg-gray-200 text-gray-400 font-semibold cursor-not-allowed"
                        >
                            {variants.length > 0 &&
                            !selectedVariant
                                ? "Select Options"
                                : "Currently Unavailable"}
                        </button>

                    </div>
                )}

            {/* ==========================================
                WISHLIST
            ========================================== */}

            <button
                type="button"
                className="mt-3 h-12 w-full border border-gray-200 text-sm font-semibold text-gray-700 transition hover:border-gray-400 hover:bg-gray-50"
            >
                ♡ Add to Wishlist
            </button>

            {/* ==========================================
                TRUST
            ========================================== */}

            <div className="mt-9 border-y border-gray-200">

                <div className="grid grid-cols-2">

                    <div className="border-r border-b border-gray-200 p-4">
                        <div className="text-lg">
                            🚚
                        </div>

                        <p className="mt-2 text-sm font-semibold text-gray-900">
                            Pan-India Delivery
                        </p>

                        <p className="mt-1 text-xs leading-5 text-gray-500">
                            Delivered to your door.
                        </p>
                    </div>

                    <div className="border-b border-gray-200 p-4">
                        <div className="text-lg">
                            🔒
                        </div>

                        <p className="mt-2 text-sm font-semibold text-gray-900">
                            Secure Checkout
                        </p>

                        <p className="mt-1 text-xs leading-5 text-gray-500">
                            Safe and secure payment.
                        </p>
                    </div>

                    <div className="border-r border-gray-200 p-4">
                        <div className="text-lg">
                            📦
                        </div>

                        <p className="mt-2 text-sm font-semibold text-gray-900">
                            Carefully Packed
                        </p>

                        <p className="mt-1 text-xs leading-5 text-gray-500">
                            Packed with care before dispatch.
                        </p>
                    </div>

                    <div className="p-4">
                        <div className="text-lg">
                            💎
                        </div>

                        <p className="mt-2 text-sm font-semibold text-gray-900">
                            Jewellery Care
                        </p>

                        <p className="mt-1 text-xs leading-5 text-gray-500">
                            Careful handling keeps the finish beautiful.
                        </p>
                    </div>

                </div>

            </div>

            {/* ==========================================
                MOBILE STICKY BUY BAR
            ========================================== */}

            {canPurchase && (
                <div className="fixed bottom-0 left-0 right-0 z-[9990] border-t border-gray-200 bg-white/95 px-3 py-3 backdrop-blur md:hidden">

                    <div className="mx-auto flex max-w-lg gap-2">

                        <button
                            type="button"
                            onClick={
                                handleAddToCart
                            }
                            className="h-12 flex-1 border border-gray-950 bg-white text-sm font-semibold text-gray-950"
                        >
                            Add to Bag
                        </button>

                        <button
                            type="button"
                            onClick={
                                handleBuyNow
                            }
                            className="h-12 flex-1 bg-pink-700 text-sm font-semibold text-white"
                        >
                            Buy Now · ₹
                            {Number.isFinite(
                                effectivePrice
                            )
                                ? effectivePrice *
                                  quantity
                                : product.price}
                        </button>

                    </div>

                </div>
            )}

        </div>
    );
}