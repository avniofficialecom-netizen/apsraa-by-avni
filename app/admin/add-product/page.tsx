"use client";

import { useState } from "react";
import AdminNavbar from "../../../components/AdminNavbar";
import Footer from "../../../components/Footer";
import { supabase } from "../../../lib/supabase";

type CategoryOption = {
    value: string;
    label: string;
};

type Variant = {
    size: string;
    color: string;
    sku: string;
    stock: string;
};

const JEWELLERY_CATEGORIES: CategoryOption[] = [
    { value: "earrings", label: "Earrings" },
    { value: "jhumkas", label: "Jhumkas" },
    { value: "necklaces", label: "Necklaces" },
    { value: "chokers", label: "Chokers" },
    { value: "jewellery-sets", label: "Jewellery Sets" },
    { value: "anklets", label: "Anklets / Payal" },
    { value: "maang-tikka", label: "Maang Tikka" },
    { value: "rings", label: "Rings" },
    { value: "bangles", label: "Bangles / Bracelets" },
];

const CLOTHING_CATEGORIES: CategoryOption[] = [
    { value: "kurtis", label: "Kurtis" },
    { value: "cotton-kurtis", label: "Cotton Kurtis" },
    {
        value: "breastfeeding-kurtis",
        label: "Breastfeeding / Nursing Kurtis",
    },
    { value: "kurti-sets", label: "Kurti Sets" },
    { value: "dresses", label: "Dresses" },
    { value: "co-ord-sets", label: "Co-ord Sets" },
];

const JEWELLERY_COLORS = [
    "Gold",
    "Silver",
    "Rose Gold",
    "Black",
    "White",
    "Multicolor",
];

const CLOTHING_COLORS = [
    "Black",
    "White",
    "Pink",
    "Red",
    "Green",
    "Blue",
    "Yellow",
    "Maroon",
    "Beige",
    "Multicolor",
];

const CLOTHING_SIZES = [
    "S",
    "M",
    "L",
    "XL",
    "XXL",
    "XXXL",
];

export default function AddProduct() {
    const [title, setTitle] = useState("");

    const [department, setDepartment] =
        useState<"jewellery" | "clothing">("jewellery");

    const [category, setCategory] = useState("");

    const [price, setPrice] = useState("");
    const [oldPrice, setOldPrice] = useState("");

    const [stock, setStock] = useState("");

    const [rating, setRating] = useState(5);
    const [reviews, setReviews] = useState(0);

    const [description, setDescription] = useState("");

    const [image, setImage] = useState("");
    const [imageFile, setImageFile] =
        useState<File | null>(null);

    const [uploading, setUploading] = useState(false);

    const [featured, setFeatured] = useState(false);
    const [bestseller, setBestseller] = useState(false);
    const [trending, setTrending] = useState(false);

    // ==========================================
    // ATTRIBUTES
    // ==========================================

    const [color, setColor] = useState("");

    const [selectedColors, setSelectedColors] =
        useState<string[]>([]);

    const [selectedSizes, setSelectedSizes] =
        useState<string[]>([]);

    const [stockBySize, setStockBySize] =
        useState<Record<string, string>>({});

    const [stockByVariant, setStockByVariant] =
        useState<Record<string, string>>({});

    const [material, setMaterial] = useState("");
    const [plating, setPlating] = useState("");
    const [stone, setStone] = useState("");
    const [fabric, setFabric] = useState("");
    const [pattern, setPattern] = useState("");
    const [occasion, setOccasion] = useState("");

    const [sku, setSku] = useState("");

    const categories =
        department === "jewellery"
            ? JEWELLERY_CATEGORIES
            : CLOTHING_CATEGORIES;

    // ==========================================
    // DEPARTMENT
    // ==========================================

    function handleDepartmentChange(
        value: "jewellery" | "clothing"
    ) {
        setDepartment(value);
        setCategory("");

        setColor("");
        setSelectedColors([]);
        setSelectedSizes([]);
        setStockBySize({});
        setStockByVariant({});

        setMaterial("");
        setPlating("");
        setStone("");
        setFabric("");
        setPattern("");
        setOccasion("");
        setSku("");
    }

    // ==========================================
    // SIZE SELECTION
    // ==========================================

    function toggleSize(size: string) {
        setSelectedSizes((current) => {
            if (current.includes(size)) {
                const updated = current.filter(
                    (item) => item !== size
                );

                setStockBySize((stocks) => {
                    const next = { ...stocks };
                    delete next[size];
                    return next;
                });

                return updated;
            }

            setStockBySize((stocks) => ({
                ...stocks,
                [size]: stocks[size] || "",
            }));

            return [...current, size];
        });
    }

    function toggleColor(value: string) {
        setSelectedColors((current) => {
            if (current.includes(value)) {
                const updated = current.filter(
                    (item) => item !== value
                );

                setStockByVariant((stocks) => {
                    const next = { ...stocks };

                    Object.keys(next).forEach((key) => {
                        if (key.startsWith(`${value}__`)) {
                            delete next[key];
                        }
                    });

                    return next;
                });

                return updated;
            }

            return [...current, value];
        });
    }

    function getVariantKey(
        size: string,
        variantColor: string
    ) {
        return `${variantColor}__${size}`;
    }

    // ==========================================
    // IMAGE UPLOAD
    // ==========================================

    async function uploadImage() {
        if (!imageFile) {
            return "";
        }

        setUploading(true);

        const fileName =
            `${Date.now()}-${imageFile.name}`;

        const { error } = await supabase.storage
            .from("products")
            .upload(fileName, imageFile);

        if (error) {
            setUploading(false);
            alert(error.message);
            return "";
        }

        const {
            data: { publicUrl },
        } = supabase.storage
            .from("products")
            .getPublicUrl(fileName);

        setUploading(false);

        return publicUrl;
    }

    // ==========================================
    // SAVE PRODUCT
    // ==========================================

    const saveProduct = async () => {
        if (
            !title.trim() ||
            !price ||
            !category
        ) {
            alert(
                "Please fill Product Name, Category and Selling Price."
            );
            return;
        }

        // Clothing must have at least one size and color.
        if (
            department === "clothing" &&
            selectedSizes.length === 0
        ) {
            alert(
                "Please select at least one clothing size."
            );
            return;
        }

        if (
            department === "clothing" &&
            selectedColors.length === 0
        ) {
            alert(
                "Please select at least one clothing color."
            );
            return;
        }

        // Jewellery must have a color.
        if (
            department === "jewellery" &&
            !color
        ) {
            alert(
                "Please select a jewellery color."
            );
            return;
        }

        let imageUrl = image;

        if (imageFile) {
            imageUrl = await uploadImage();

            if (!imageUrl) {
                return;
            }
        }

        setUploading(true);

        // ==========================================
        // CREATE MAIN PRODUCT
        // ==========================================

        const totalVariantStock =
            department === "clothing"
                ? selectedColors.reduce(
                    (total, variantColor) =>
                        total +
                        selectedSizes.reduce(
                            (sizeTotal, size) =>
                                sizeTotal +
                                (Number(
                                    stockByVariant[
                                        getVariantKey(
                                            size,
                                            variantColor
                                        )
                                        ]
                                ) || 0),
                            0
                        ),
                    0
                )
                : Number(stock) || 0;

        const { data: product, error } =
            await supabase
                .from("products")
                .insert([
                    {
                        title: title.trim(),
                        category,
                        price: Number(price),
                        old_price:
                            oldPrice
                                ? Number(oldPrice)
                                : null,
                        stock: totalVariantStock,
                        image: imageUrl,
                        rating,
                        reviews,
                        description,
                        featured,
                        bestseller,
                        trending,
                    },
                ])
                .select("id")
                .single();

        if (error || !product) {
            setUploading(false);

            alert(
                error?.message ||
                "Unable to save product."
            );

            return;
        }

        // ==========================================
        // CREATE VARIANTS
        // ==========================================

        const variants: Variant[] = [];

        if (department === "clothing") {
            selectedColors.forEach(
                (variantColor) => {
                    selectedSizes.forEach((size) => {
                        const key = getVariantKey(
                            size,
                            variantColor
                        );

                        variants.push({
                            size,
                            color: variantColor,
                            sku: sku
                                ? `${sku}-${variantColor
                                    .replace(
                                        /\\s+/g,
                                        "-"
                                    )
                                    .toUpperCase()}-${size}`
                                : `${category.toUpperCase()}-${Date.now()}-${variantColor
                                    .replace(
                                        /\\s+/g,
                                        "-"
                                    )
                                    .toUpperCase()}-${size}`,
                            stock:
                                stockByVariant[key] ||
                                "0",
                        });
                    });
                }
            );
        } else {
            variants.push({
                size: "",
                color,
                sku:
                    sku ||
                    `${category.toUpperCase()}-${Date.now()}`,
                stock,
            });
        }

        const attributes = {
            department,
            material: material.trim(),
            plating: plating.trim(),
            stone: stone.trim(),
            fabric: fabric.trim(),
            pattern: pattern.trim(),
            occasion: occasion.trim(),
        };

        const variantRows = variants.map(
            (variant) => ({
                product_id: product.id,
                sku: variant.sku,
                size: variant.size || null,
                color: variant.color || null,
                attributes,
                price: Number(price),
                stock:
                    Number(variant.stock) || 0,
                image: imageUrl || null,
            })
        );

        const { error: variantError } =
            await supabase
                .from("product_variants")
                .insert(variantRows);

        if (variantError) {
            setUploading(false);

            console.error(
                "Variant creation error:",
                variantError
            );

            alert(
                "Product was created, but variants could not be saved: " +
                variantError.message
            );

            return;
        }

        setUploading(false);

        alert(
            "✅ Product and variants saved successfully!"
        );

        // ==========================================
        // RESET
        // ==========================================

        setTitle("");
        setDepartment("jewellery");
        setCategory("");

        setPrice("");
        setOldPrice("");
        setStock("");

        setRating(5);
        setReviews(0);

        setDescription("");

        setImage("");
        setImageFile(null);

        setFeatured(false);
        setBestseller(false);
        setTrending(false);

        setColor("");
        setSelectedColors([]);
        setSelectedSizes([]);
        setStockBySize({});
        setStockByVariant({});

        setMaterial("");
        setPlating("");
        setStone("");
        setFabric("");
        setPattern("");
        setOccasion("");

        setSku("");
    };

    return (
        <>
            <AdminNavbar />

            <section className="min-h-screen bg-gradient-to-br from-pink-50 to-white py-16">
                <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-xl p-6 sm:p-10">

                    <h1 className="text-4xl font-bold text-pink-700 mb-10">
                        Add New Product
                    </h1>

                    {/* ==========================================
                        BASIC PRODUCT INFORMATION
                    ========================================== */}

                    <div className="grid md:grid-cols-2 gap-6">

                        {/* PRODUCT NAME */}

                        <input
                            type="text"
                            placeholder="Product Name *"
                            value={title}
                            onChange={(e) =>
                                setTitle(e.target.value)
                            }
                            className="border rounded-xl p-4"
                        />

                        {/* DEPARTMENT */}

                        <select
                            value={department}
                            onChange={(e) =>
                                handleDepartmentChange(
                                    e.target.value as
                                        | "jewellery"
                                        | "clothing"
                                )
                            }
                            className="border rounded-xl p-4 bg-white"
                        >
                            <option value="jewellery">
                                Jewellery
                            </option>

                            <option value="clothing">
                                Clothing
                            </option>
                        </select>

                        {/* CATEGORY */}

                        <select
                            value={category}
                            onChange={(e) =>
                                setCategory(
                                    e.target.value
                                )
                            }
                            className="border rounded-xl p-4 bg-white"
                        >
                            <option value="">
                                Select Category *
                            </option>

                            {categories.map((item) => (
                                <option
                                    key={item.value}
                                    value={item.value}
                                >
                                    {item.label}
                                </option>
                            ))}
                        </select>

                        {/* PRICE */}

                        <input
                            type="number"
                            placeholder="Selling Price *"
                            value={price}
                            onChange={(e) =>
                                setPrice(e.target.value)
                            }
                            className="border rounded-xl p-4"
                        />

                        {/* OLD PRICE */}

                        <input
                            type="number"
                            placeholder="Old Price"
                            value={oldPrice}
                            onChange={(e) =>
                                setOldPrice(
                                    e.target.value
                                )
                            }
                            className="border rounded-xl p-4"
                        />

                        {/* MAIN STOCK */}

                        <input
                            type="number"
                            placeholder="Total Stock"
                            value={stock}
                            min="0"
                            onChange={(e) =>
                                setStock(
                                    e.target.value
                                )
                            }
                            className="border rounded-xl p-4"
                        />

                        {/* SKU */}

                        <input
                            type="text"
                            placeholder="Base SKU (optional)"
                            value={sku}
                            onChange={(e) =>
                                setSku(
                                    e.target.value
                                )
                            }
                            className="border rounded-xl p-4"
                        />

                        {/* IMAGE */}

                        <div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    if (
                                        e.target.files?.[0]
                                    ) {
                                        setImageFile(
                                            e.target.files[0]
                                        );
                                    }
                                }}
                                className="border rounded-xl p-4 w-full"
                            />

                            {imageFile && (
                                <p className="text-green-600 mt-2">
                                    ✅ {imageFile.name}
                                </p>
                            )}
                        </div>

                        {/* RATING */}

                        <input
                            type="number"
                            placeholder="Rating"
                            value={rating}
                            min="0"
                            max="5"
                            step="0.1"
                            onChange={(e) =>
                                setRating(
                                    Number(
                                        e.target.value
                                    )
                                )
                            }
                            className="border rounded-xl p-4"
                        />

                        {/* REVIEWS */}

                        <input
                            type="number"
                            placeholder="Reviews"
                            value={reviews}
                            min="0"
                            onChange={(e) =>
                                setReviews(
                                    Number(
                                        e.target.value
                                    )
                                )
                            }
                            className="border rounded-xl p-4"
                        />
                    </div>

                    {/* ==========================================
                        VARIANTS
                    ========================================== */}

                    <div className="mt-10 border border-pink-100 rounded-3xl p-6 bg-pink-50">

                        <h2 className="text-2xl font-bold text-pink-700">
                            Product Attributes & Variants
                        </h2>

                        <p className="text-gray-600 mt-2">
                            Add size, color and product
                            specifications for inventory.
                        </p>

                        {/* ==========================================
                            JEWELLERY
                        ========================================== */}

                        {department ===
                            "jewellery" && (
                                <div className="mt-6">

                                    <label className="block font-semibold text-gray-800 mb-2">
                                        Jewellery Color *
                                    </label>

                                    <select
                                        value={color}
                                        onChange={(e) =>
                                            setColor(
                                                e.target.value
                                            )
                                        }
                                        className="w-full border rounded-xl p-4 bg-white"
                                    >
                                        <option value="">
                                            Select Color
                                        </option>

                                        {JEWELLERY_COLORS.map(
                                            (item) => (
                                                <option
                                                    key={item}
                                                    value={item}
                                                >
                                                    {item}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>
                            )}

                        {/* ==========================================
                            CLOTHING SIZES
                        ========================================== */}

                        {department ===
                            "clothing" && (
                                <div className="mt-6">

                                    <p className="font-semibold text-gray-800 mb-3">
                                        Available Colors *
                                    </p>

                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                        {CLOTHING_COLORS.map(
                                            (item) => {
                                                const selected =
                                                    selectedColors.includes(
                                                        item
                                                    );

                                                return (
                                                    <button
                                                        type="button"
                                                        key={item}
                                                        onClick={() =>
                                                            toggleColor(
                                                                item
                                                            )
                                                        }
                                                        className={`py-3 rounded-xl border font-semibold transition ${
                                                            selected
                                                                ? "bg-pink-600 text-white border-pink-600"
                                                                : "bg-white text-gray-700 border-gray-200 hover:border-pink-400"
                                                        }`}
                                                    >
                                                        {item}
                                                    </button>
                                                );
                                            }
                                        )}
                                    </div>

                                    <p className="font-semibold text-gray-800 mb-3 mt-7">
                                        Available Sizes *
                                    </p>

                                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                                        {CLOTHING_SIZES.map(
                                            (size) => {
                                                const selected =
                                                    selectedSizes.includes(
                                                        size
                                                    );

                                                return (
                                                    <button
                                                        type="button"
                                                        key={size}
                                                        onClick={() =>
                                                            toggleSize(
                                                                size
                                                            )
                                                        }
                                                        className={`py-3 rounded-xl border font-semibold transition ${
                                                            selected
                                                                ? "bg-pink-600 text-white border-pink-600"
                                                                : "bg-white text-gray-700 border-gray-200 hover:border-pink-400"
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

                        {/* ==========================================
                            OTHER ATTRIBUTES
                        ========================================== */}

                        <div className="mt-7 grid md:grid-cols-2 gap-4">

                            {department ===
                                "jewellery" && (
                                    <>
                                        <input
                                            type="text"
                                            placeholder="Material e.g. Stainless Steel"
                                            value={material}
                                            onChange={(e) =>
                                                setMaterial(
                                                    e.target.value
                                                )
                                            }
                                            className="border rounded-xl p-4 bg-white"
                                        />

                                        <input
                                            type="text"
                                            placeholder="Plating e.g. Gold Plated"
                                            value={plating}
                                            onChange={(e) =>
                                                setPlating(
                                                    e.target.value
                                                )
                                            }
                                            className="border rounded-xl p-4 bg-white"
                                        />

                                        <input
                                            type="text"
                                            placeholder="Stone e.g. AD / Pearl / Kundan"
                                            value={stone}
                                            onChange={(e) =>
                                                setStone(
                                                    e.target.value
                                                )
                                            }
                                            className="border rounded-xl p-4 bg-white"
                                        />
                                    </>
                                )}

                            {department ===
                                "clothing" && (
                                    <>
                                        <input
                                            type="text"
                                            placeholder="Fabric e.g. Cotton"
                                            value={fabric}
                                            onChange={(e) =>
                                                setFabric(
                                                    e.target.value
                                                )
                                            }
                                            className="border rounded-xl p-4 bg-white"
                                        />

                                        <input
                                            type="text"
                                            placeholder="Pattern e.g. Printed"
                                            value={pattern}
                                            onChange={(e) =>
                                                setPattern(
                                                    e.target.value
                                                )
                                            }
                                            className="border rounded-xl p-4 bg-white"
                                        />
                                    </>
                                )}

                            <input
                                type="text"
                                placeholder="Occasion e.g. Wedding / Party / Daily"
                                value={occasion}
                                onChange={(e) =>
                                    setOccasion(
                                        e.target.value
                                    )
                                }
                                className="border rounded-xl p-4 bg-white"
                            />
                        </div>

                        {/* ==========================================
                            VARIANT PREVIEW
                        ========================================== */}

                        <div className="mt-7">

                            <p className="font-semibold text-gray-800 mb-3">
                                Inventory Variants
                            </p>

                            <div className="bg-white rounded-2xl border overflow-hidden">

                                {department ===
                                "clothing" &&
                                selectedSizes.length > 0 &&
                                selectedColors.length > 0 ? (
                                    <div className="divide-y">

                                        {selectedColors.map(
                                            (variantColor) =>
                                                selectedSizes.map(
                                                    (size) => {
                                                        const key =
                                                            getVariantKey(
                                                                size,
                                                                variantColor
                                                            );

                                                        return (
                                                            <div
                                                                key={key}
                                                                className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 items-center"
                                                            >
                                                                <div>
                                                                    <span className="font-semibold">
                                                                        {variantColor}
                                                                    </span>
                                                                </div>

                                                                <div>
                                                                    <span className="font-semibold">
                                                                        Size{" "}
                                                                        {size}
                                                                    </span>
                                                                </div>

                                                                <div className="text-sm text-gray-500">
                                                                    SKU:{" "}
                                                                    {sku
                                                                        ? `${sku}-${variantColor
                                                                            .replace(
                                                                                /\s+/g,
                                                                                "-"
                                                                            )
                                                                            .toUpperCase()}-${size}`
                                                                        : "Auto-generated"}
                                                                </div>

                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    placeholder="Stock"
                                                                    value={
                                                                        stockByVariant[
                                                                            key
                                                                            ] ||
                                                                        ""
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        setStockByVariant(
                                                                            (
                                                                                current
                                                                            ) => ({
                                                                                ...current,
                                                                                [key]:
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            })
                                                                        )
                                                                    }
                                                                    className="border rounded-xl p-3"
                                                                />
                                                            </div>
                                                        );
                                                    }
                                                )
                                        )}

                                    </div>
                                ) : department ===
                                "jewellery" &&
                                color ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 items-center">
                                        <div className="font-semibold">
                                            Color: {color}
                                        </div>

                                        <div className="text-sm text-gray-500">
                                            SKU:{" "}
                                            {sku ||
                                                "Auto-generated"}
                                        </div>

                                        <div className="text-sm font-semibold text-pink-600">
                                            Stock:{" "}
                                            {stock || 0}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-5 text-gray-500">
                                        Select the required
                                        size/color to create
                                        a variant.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ==========================================
                        DESCRIPTION
                    ========================================== */}

                    <textarea
                        placeholder="Product Description"
                        value={description}
                        onChange={(e) =>
                            setDescription(
                                e.target.value
                            )
                        }
                        className="border rounded-xl p-4 h-40 w-full mt-6"
                    />

                    {/* ==========================================
                        PRODUCT COLLECTIONS
                    ========================================== */}

                    <div className="mt-8">

                        <p className="font-semibold text-gray-800 mb-4">
                            Product Collections
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                            {/* FEATURED */}

                            <label className="flex items-center gap-3 border rounded-xl p-4 cursor-pointer hover:bg-pink-50 transition">

                                <input
                                    type="checkbox"
                                    checked={featured}
                                    onChange={(e) =>
                                        setFeatured(
                                            e.target.checked
                                        )
                                    }
                                    className="w-5 h-5"
                                />

                                <span className="font-medium">
                                    ⭐ Featured
                                </span>
                            </label>

                            {/* BESTSELLER */}

                            <label className="flex items-center gap-3 border rounded-xl p-4 cursor-pointer hover:bg-pink-50 transition">

                                <input
                                    type="checkbox"
                                    checked={bestseller}
                                    onChange={(e) =>
                                        setBestseller(
                                            e.target.checked
                                        )
                                    }
                                    className="w-5 h-5"
                                />

                                <span className="font-medium">
                                    🔥 Bestseller
                                </span>
                            </label>

                            {/* TRENDING */}

                            <label className="flex items-center gap-3 border rounded-xl p-4 cursor-pointer hover:bg-pink-50 transition">

                                <input
                                    type="checkbox"
                                    checked={trending}
                                    onChange={(e) =>
                                        setTrending(
                                            e.target.checked
                                        )
                                    }
                                    className="w-5 h-5"
                                />

                                <span className="font-medium">
                                    💕 Trending
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* ==========================================
                        SELECTED CATEGORY
                    ========================================== */}

                    {category && (
                        <div className="mt-8 bg-pink-50 border border-pink-100 rounded-2xl p-5">

                            <p className="text-sm text-gray-500">
                                Product will be added to:
                            </p>

                            <p className="text-lg font-bold text-pink-700 mt-1">
                                {
                                    categories.find(
                                        (item) =>
                                            item.value ===
                                            category
                                    )?.label
                                }
                            </p>
                        </div>
                    )}

                    {/* ==========================================
                        SAVE
                    ========================================== */}

                    <button
                        type="button"
                        onClick={saveProduct}
                        disabled={uploading}
                        className="mt-10 w-full bg-pink-600 text-white py-4 rounded-xl font-semibold hover:bg-pink-700 transition disabled:opacity-50"
                    >
                        {uploading
                            ? "Saving Product..."
                            : "Save Product"}
                    </button>
                </div>
            </section>

            <Footer />
        </>
    );
}
