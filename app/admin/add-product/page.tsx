"use client";

import { useState } from "react";
import AdminNavbar from "../../../components/AdminNavbar";
import Footer from "../../../components/Footer";
import { supabase } from "../../../lib/supabase";

type CategoryOption = {
    value: string;
    label: string;
};

const JEWELLERY_CATEGORIES: CategoryOption[] = [
    {
        value: "earrings",
        label: "Earrings",
    },
    {
        value: "jhumkas",
        label: "Jhumkas",
    },
    {
        value: "necklaces",
        label: "Necklaces",
    },
    {
        value: "chokers",
        label: "Chokers",
    },
    {
        value: "jewellery-sets",
        label: "Jewellery Sets",
    },
    {
        value: "anklets",
        label: "Anklets / Payal",
    },
    {
        value: "maang-tikka",
        label: "Maang Tikka",
    },
    {
        value: "rings",
        label: "Rings",
    },
    {
        value: "bangles",
        label: "Bangles / Bracelets",
    },
];

const CLOTHING_CATEGORIES: CategoryOption[] = [
    {
        value: "kurtis",
        label: "Kurtis",
    },
    {
        value: "cotton-kurtis",
        label: "Cotton Kurtis",
    },
    {
        value: "breastfeeding-kurtis",
        label: "Breastfeeding / Nursing Kurtis",
    },
    {
        value: "kurti-sets",
        label: "Kurti Sets",
    },
    {
        value: "dresses",
        label: "Dresses",
    },
    {
        value: "co-ord-sets",
        label: "Co-ord Sets",
    },
];

export default function AddProduct() {
    const [title, setTitle] = useState("");

    const [department, setDepartment] =
        useState<"jewellery" | "clothing">(
            "jewellery"
        );

    const [category, setCategory] = useState("");

    const [price, setPrice] = useState("");
    const [oldPrice, setOldPrice] = useState("");
    const [stock, setStock] = useState("");

    const [rating, setRating] = useState(5);
    const [reviews, setReviews] = useState(0);

    const [description, setDescription] =
        useState("");

    const [image, setImage] = useState("");
    const [imageFile, setImageFile] =
        useState<File | null>(null);

    const [uploading, setUploading] =
        useState(false);

    const [featured, setFeatured] =
        useState(false);

    const [bestseller, setBestseller] =
        useState(false);

    const [trending, setTrending] =
        useState(false);

    const categories =
        department === "jewellery"
            ? JEWELLERY_CATEGORIES
            : CLOTHING_CATEGORIES;

    function handleDepartmentChange(
        value: "jewellery" | "clothing"
    ) {
        setDepartment(value);
        setCategory("");
    }

    async function uploadImage() {
        if (!imageFile) {
            return "";
        }

        setUploading(true);

        const fileName = `${Date.now()}-${imageFile.name}`;

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

        let imageUrl = image;

        if (imageFile) {
            imageUrl = await uploadImage();

            if (!imageUrl) {
                return;
            }
        }

        const { error } = await supabase
            .from("products")
            .insert([
                {
                    title: title.trim(),
                    category,
                    price,
                    old_price: oldPrice,
                    stock: Number(stock) || 0,
                    image: imageUrl,
                    rating,
                    reviews,
                    description,
                    featured,
                    bestseller,
                    trending,
                },
            ]);

        if (error) {
            alert(error.message);
            return;
        }

        alert(
            "✅ Product Saved Successfully!"
        );

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
    };

    return (
        <>
            <AdminNavbar />

            <section className="min-h-screen bg-gradient-to-br from-pink-50 to-white py-16">

                <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-xl p-10">

                    <h1 className="text-4xl font-bold text-pink-700 mb-10">
                        Add New Product
                    </h1>

                    <div className="grid md:grid-cols-2 gap-6">

                        {/* PRODUCT NAME */}

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
                                        {item.label}
                                    </option>
                                )
                            )}
                        </select>

                        {/* PRICE */}

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

                        {/* STOCK */}

                        <input
                            type="number"
                            placeholder="Stock"
                            value={stock}
                            onChange={(e) =>
                                setStock(
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
                                        e.target
                                            .files?.[0]
                                    ) {
                                        setImageFile(
                                            e.target
                                                .files[0]
                                        );
                                    }
                                }}
                                className="border rounded-xl p-4 w-full"
                            />

                            {imageFile && (
                                <p className="text-green-600 mt-2">
                                    ✅{" "}
                                    {
                                        imageFile.name
                                    }
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
                                        e.target
                                            .value
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
                                        e.target
                                            .value
                                    )
                                )
                            }
                            className="border rounded-xl p-4"
                        />

                    </div>

                    {/* DESCRIPTION */}

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

                    {/* PRODUCT COLLECTIONS */}

                    <div className="mt-8">

                        <p className="font-semibold text-gray-800 mb-4">
                            Product Collections
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                            {/* FEATURED */}

                            <label className="flex items-center gap-3 border rounded-xl p-4 cursor-pointer hover:bg-pink-50 transition">

                                <input
                                    type="checkbox"
                                    checked={
                                        featured
                                    }
                                    onChange={(e) =>
                                        setFeatured(
                                            e.target
                                                .checked
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
                                    checked={
                                        bestseller
                                    }
                                    onChange={(e) =>
                                        setBestseller(
                                            e.target
                                                .checked
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
                                    checked={
                                        trending
                                    }
                                    onChange={(e) =>
                                        setTrending(
                                            e.target
                                                .checked
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

                    {/* SELECTED CATEGORY */}

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

                    {/* SAVE */}

                    <button
                        onClick={saveProduct}
                        disabled={uploading}
                        className="mt-10 w-full bg-pink-600 text-white py-4 rounded-xl font-semibold hover:bg-pink-700 transition disabled:opacity-50"
                    >
                        {uploading
                            ? "Uploading..."
                            : "Save Product"}
                    </button>

                </div>

            </section>

            <Footer />
        </>
    );
}