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

const CORE_COLORS = [
    "White",
    "Pearl",
    "Ivory",
    "Cream",
    "Beige",
    "Pink",
    "Blush",
    "Rose",
    "Red",
    "Coral",
    "Orange",
    "Yellow",
    "Gold",
    "Champagne",
    "Brown",
    "Copper",
    "Bronze",
    "Green",
    "Mint",
    "Olive",
    "Emerald",
    "Teal",
    "Blue",
    "Sky Blue",
    "Royal Blue",
    "Navy",
    "Purple",
    "Lavender",
    "Plum",
    "Silver",
    "Grey",
    "Black",
    "Multicolour",
];

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
    Multicolour:
        "linear-gradient(135deg,#ef4444,#f59e0b,#22c55e,#3b82f6,#a855f7)",
};

const JEWELLERY_CATEGORIES: CategoryOption[] = [
    { value: "earrings", label: "Earrings" },
    { value: "jhumkas", label: "Jhumkas" },
    { value: "necklaces", label: "Necklaces" },
    { value: "chains", label: "Chains" },
    { value: "chokers", label: "Chokers" },
    { value: "jewellery-sets", label: "Necklace Sets" },
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
    const [imageFile, setImageFile] = useState<File | null>(null);

    const [uploading, setUploading] = useState(false);

    const [featured, setFeatured] = useState(false);
    const [bestseller, setBestseller] = useState(false);
    const [trending, setTrending] = useState(false);

    // ==========================================
    // MANUAL COLORS
    // ==========================================

    const [color, setColor] = useState("");

    const [selectedColors, setSelectedColors] =
        useState<string[]>([]);

    // ==========================================
    // CLOTHING SIZES
    // ==========================================

    const [selectedSizes, setSelectedSizes] =
        useState<string[]>([]);

    const [stockByVariant, setStockByVariant] =
        useState<Record<string, string>>({});

    // ==========================================
    // ATTRIBUTES
    // ==========================================

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
    // DEPARTMENT CHANGE
    // ==========================================

    function handleDepartmentChange(
        value: "jewellery" | "clothing"
    ) {
        setDepartment(value);
        setCategory("");

        setColor("");
        setSelectedColors([]);
        setSelectedSizes([]);
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
    // IMAGE
    // ==========================================

    function handleImageChange(
        event: React.ChangeEvent<HTMLInputElement>
    ) {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        setImageFile(file);
    }

    // ==========================================
    // SIZE
    // ==========================================

    function toggleSize(size: string) {
        setSelectedSizes((current) => {
            if (current.includes(size)) {
                const updated = current.filter(
                    (item) => item !== size
                );

                setStockByVariant((stocks) => {
                    const next = { ...stocks };

                    Object.keys(next).forEach((key) => {
                        if (key.endsWith(`__${size}`)) {
                            delete next[key];
                        }
                    });

                    return next;
                });

                return updated;
            }

            return [...current, size];
        });
    }

    // ==========================================
    // CLOTHING COLOR
    // ==========================================

    function toggleColor(value: string) {
        setSelectedColors((current) => {
            if (current.includes(value)) {
                return current.filter(
                    (item) => item !== value
                );
            }

            return [...current, value];
        });
    }

    // ==========================================
    // VARIANT KEY
    // ==========================================

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

    async function saveProduct() {
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

        if (!imageFile && !image) {
            alert("Please upload a product image.");

            return;
        }

        // ------------------------------------------
        // JEWELLERY COLOR
        // ------------------------------------------

        if (
            department === "jewellery" &&
            !color
        ) {
            alert(
                "Please select the product color."
            );

            return;
        }

        // ------------------------------------------
        // CLOTHING COLOR
        // ------------------------------------------

        if (
            department === "clothing" &&
            selectedColors.length === 0
        ) {
            alert(
                "Please select at least one product color."
            );

            return;
        }

        // ------------------------------------------
        // CLOTHING SIZE
        // ------------------------------------------

        if (
            department === "clothing" &&
            selectedSizes.length === 0
        ) {
            alert(
                "Please select at least one clothing size."
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
        // TOTAL STOCK
        // ==========================================

        const totalVariantStock =
            department === "clothing"
                ? selectedColors.reduce(
                    (total, variantColor) =>
                        total +
                        selectedSizes.reduce(
                            (sizeTotal, size) =>
                                sizeTotal +
                                (
                                    Number(
                                        stockByVariant[
                                            getVariantKey(
                                                size,
                                                variantColor
                                            )
                                        ]
                                    ) || 0
                                ),
                            0
                        ),
                    0
                )
                : Number(stock) || 0;

        // ==========================================
        // PRODUCT
        // ==========================================

        const {
            data: product,
            error,
        } = await supabase
            .from("products")
            .insert([
                {
                    title: title.trim(),

                    category,

                    price: Number(price),

                    old_price: oldPrice
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
        // BUILD VARIANTS
        // ==========================================

        const variants: Variant[] = [];

        if (department === "clothing") {
            selectedColors.forEach(
                (variantColor) => {
                    selectedSizes.forEach((size) => {
                        const key =
                            getVariantKey(
                                size,
                                variantColor
                            );

                        variants.push({
                            size,

                            color: variantColor,

                            sku: sku
                                ? `${sku}-${variantColor
                                    .replace(
                                        /\s+/g,
                                        "-"
                                    )
                                    .toUpperCase()}-${size}`
                                : `${category.toUpperCase()}-${Date.now()}-${variantColor
                                    .replace(
                                        /\s+/g,
                                        "-"
                                    )
                                    .toUpperCase()}-${size}`,

                            stock:
                                stockByVariant[
                                    key
                                ] || "0",
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

        // ==========================================
        // ATTRIBUTES
        // ==========================================

        const attributes = {
            department,

            material: material.trim(),

            plating: plating.trim(),

            stone: stone.trim(),

            fabric: fabric.trim(),

            pattern: pattern.trim(),

            occasion: occasion.trim(),

            /*
             * MANUAL COLOR SYSTEM
             *
             * No image detection.
             */
            colors:
                department === "jewellery"
                    ? [color]
                    : selectedColors,

            color_source: "manual",
        };

        // ==========================================
        // SAVE VARIANTS
        // ==========================================

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

        const {
            error: variantError,
        } = await supabase
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
        setStockByVariant({});

        setMaterial("");
        setPlating("");
        setStone("");
        setFabric("");
        setPattern("");
        setOccasion("");

        setSku("");
    }

    return (
        <>
            <AdminNavbar />

            <section className="min-h-screen bg-gradient-to-br from-pink-50 to-white py-16">

                <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-xl p-6 sm:p-10">

                    <h1 className="text-4xl font-bold text-pink-700 mb-10">
                        Add New Product
                    </h1>

                    {/* ==========================================
                        BASIC INFORMATION
                    ========================================== */}

                    <div className="grid md:grid-cols-2 gap-6">

                        <input
                            type="text"
                            placeholder="Product Name *"
                            value={title}
                            onChange={(e) =>
                                setTitle(
                                    e.target.value
                                )
                            }
                            className="border rounded-xl p-4"
                        />

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

                            {categories.map(
                                (item) => (
                                    <option
                                        key={
                                            item.value
                                        }
                                        value={
                                            item.value
                                        }
                                    >
                                        {
                                            item.label
                                        }
                                    </option>
                                )
                            )}
                        </select>

                        <input
                            type="number"
                            placeholder="Selling Price *"
                            value={price}
                            onChange={(e) =>
                                setPrice(
                                    e.target.value
                                )
                            }
                            className="border rounded-xl p-4"
                        />

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

                        <div className="md:col-span-2">

                            <label className="block font-semibold text-gray-800 mb-2">
                                Product Image *
                            </label>

                            <input
                                type="file"
                                accept="image/*"
                                onChange={
                                    handleImageChange
                                }
                                className="border rounded-xl p-4 w-full"
                            />

                            {imageFile && (
                                <div className="mt-4 rounded-2xl overflow-hidden border bg-gray-50">

                                    <img
                                        src={URL.createObjectURL(
                                            imageFile
                                        )}
                                        alt="Product preview"
                                        className="w-full max-h-80 object-contain"
                                    />

                                </div>
                            )}

                        </div>

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
                        PRODUCT ATTRIBUTES
                    ========================================== */}

                    <div className="mt-10 border border-pink-100 rounded-3xl p-6 bg-pink-50">

                        <h2 className="text-2xl font-bold text-pink-700">
                            Product Attributes & Variants
                        </h2>

                        <p className="text-gray-600 mt-2">
                            Choose the product color manually.
                            APSRAA will never guess your product color from the photograph.
                        </p>

                        {/* ==========================================
                            JEWELLERY COLOR
                        ========================================== */}

                        {department === "jewellery" && (
                            <div className="mt-7">

                                <p className="font-semibold text-gray-800 mb-4">
                                    Product Color *
                                </p>

                                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">

                                    {CORE_COLORS.map(
                                        (item) => {
                                            const selected =
                                                color ===
                                                item;

                                            return (
                                                <button
                                                    type="button"
                                                    key={item}
                                                    onClick={() =>
                                                        setColor(
                                                            item
                                                        )
                                                    }
                                                    className={`rounded-2xl border-2 p-3 bg-white transition ${
                                                        selected
                                                            ? "border-pink-600 shadow-md"
                                                            : "border-gray-200 hover:border-pink-300"
                                                    }`}
                                                >

                                                    <span
                                                        className="mx-auto block w-9 h-9 rounded-full border border-gray-300 shadow-sm"
                                                        style={{
                                                            background:
                                                                COLOR_HEX[
                                                                    item
                                                                ],
                                                        }}
                                                    />

                                                    <span
                                                        className={`block mt-2 text-xs font-semibold ${
                                                            selected
                                                                ? "text-pink-700"
                                                                : "text-gray-700"
                                                        }`}
                                                    >
                                                        {
                                                            item
                                                        }
                                                    </span>

                                                </button>
                                            );
                                        }
                                    )}

                                </div>

                                {color && (
                                    <div className="mt-5 bg-white border rounded-2xl p-4 flex items-center gap-3">

                                        <span
                                            className="w-8 h-8 rounded-full border"
                                            style={{
                                                background:
                                                    COLOR_HEX[
                                                        color
                                                    ],
                                            }}
                                        />

                                        <div>
                                            <p className="text-xs text-gray-500">
                                                SELECTED COLOR
                                            </p>

                                            <p className="font-bold">
                                                {
                                                    color
                                                }
                                            </p>
                                        </div>

                                    </div>
                                )}

                            </div>
                        )}

                        {/* ==========================================
                            CLOTHING COLORS
                        ========================================== */}

                        {department === "clothing" && (
                            <div className="mt-7">

                                <p className="font-semibold text-gray-800 mb-4">
                                    Product Colors *
                                </p>

                                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">

                                    {CORE_COLORS.map(
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
                                                    className={`rounded-2xl border-2 p-3 bg-white transition ${
                                                        selected
                                                            ? "border-pink-600 shadow-md"
                                                            : "border-gray-200 hover:border-pink-300"
                                                    }`}
                                                >

                                                    <span
                                                        className="mx-auto block w-9 h-9 rounded-full border border-gray-300 shadow-sm"
                                                        style={{
                                                            background:
                                                                COLOR_HEX[
                                                                    item
                                                                ],
                                                        }}
                                                    />

                                                    <span
                                                        className={`block mt-2 text-xs font-semibold ${
                                                            selected
                                                                ? "text-pink-700"
                                                                : "text-gray-700"
                                                        }`}
                                                    >
                                                        {
                                                            item
                                                        }
                                                    </span>

                                                </button>
                                            );
                                        }
                                    )}

                                </div>

                            </div>
                        )}

                        {/* ==========================================
                            CLOTHING SIZES
                        ========================================== */}

                        {department === "clothing" && (
                            <div className="mt-8">

                                <p className="font-semibold text-gray-800 mb-3">
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
                                                    {
                                                        size
                                                    }
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

                        <div className="mt-8 grid md:grid-cols-2 gap-4">

                            {department === "jewellery" && (
                                <>
                                    <input
                                        type="text"
                                        placeholder="Material e.g. Stainless Steel"
                                        value={material}
                                        onChange={(e) =>
                                            setMaterial(
                                                e.target
                                                    .value
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
                                                e.target
                                                    .value
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
                                                e.target
                                                    .value
                                            )
                                        }
                                        className="border rounded-xl p-4 bg-white"
                                    />
                                </>
                            )}

                            {department === "clothing" && (
                                <>
                                    <input
                                        type="text"
                                        placeholder="Fabric e.g. Cotton"
                                        value={fabric}
                                        onChange={(e) =>
                                            setFabric(
                                                e.target
                                                    .value
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
                                                e.target
                                                    .value
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

                        <div className="mt-8">

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
                                                                key={
                                                                    key
                                                                }
                                                                className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 items-center"
                                                            >

                                                                <div className="flex items-center gap-2">

                                                                    <span
                                                                        className="w-6 h-6 rounded-full border"
                                                                        style={{
                                                                            background:
                                                                                COLOR_HEX[
                                                                                    variantColor
                                                                                ],
                                                                        }}
                                                                    />

                                                                    <span className="font-semibold">
                                                                        {
                                                                            variantColor
                                                                        }
                                                                    </span>

                                                                </div>

                                                                <div>
                                                                    <span className="font-semibold">
                                                                        Size{" "}
                                                                        {
                                                                            size
                                                                        }
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

                                        <div className="flex items-center gap-2 font-semibold">

                                            <span
                                                className="w-7 h-7 rounded-full border"
                                                style={{
                                                    background:
                                                        COLOR_HEX[
                                                            color
                                                        ],
                                                }}
                                            />

                                            Color:{" "}
                                            {color}

                                        </div>

                                        <div className="text-sm text-gray-500">
                                            SKU:{" "}
                                            {sku ||
                                                "Auto-generated"}
                                        </div>

                                        <div className="text-sm font-semibold text-pink-600">
                                            Stock:{" "}
                                            {stock ||
                                                0}
                                        </div>

                                    </div>
                                ) : (
                                    <div className="p-5 text-gray-500">
                                        Select a product color to create the variant.
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
                        COLLECTIONS
                    ========================================== */}

                    <div className="mt-8">

                        <p className="font-semibold text-gray-800 mb-4">
                            Product Collections
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                            <label className="flex items-center gap-3 border rounded-xl p-4 cursor-pointer hover:bg-pink-50">

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

                            <label className="flex items-center gap-3 border rounded-xl p-4 cursor-pointer hover:bg-pink-50">

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

                            <label className="flex items-center gap-3 border rounded-xl p-4 cursor-pointer hover:bg-pink-50">

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
                        CATEGORY
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