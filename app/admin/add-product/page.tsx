"use client";

import { useState } from "react";
import AdminNavbar from "../../../components/AdminNavbar";
import Footer from "../../../components/Footer";
import { supabase } from "../../../lib/supabase";

export default function AddProduct() {
    const [title, setTitle] = useState("");
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

    async function uploadImage() {
        if (!imageFile) return "";

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
        if (!title || !price || !category) {
            alert("Please fill all required fields.");
            return;
        }

        let imageUrl = image;

        if (imageFile) {
            imageUrl = await uploadImage();

            if (!imageUrl) return;
        }

        const { error } = await supabase.from("products").insert([
            {
                title,
                category,
                price,
                old_price: oldPrice,
                stock: Number(stock),
                image: imageUrl,
                rating,
                reviews,
                description,
                featured,
                bestseller,
            },
        ]);

        if (error) {
            alert(error.message);
            return;
        }

        alert("✅ Product Saved Successfully!");

        setTitle("");
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

                        <input
                            type="text"
                            placeholder="Product Name *"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="border rounded-xl p-4"
                        />

                        <input
                            type="text"
                            placeholder="Category *"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="border rounded-xl p-4"
                        />

                        <input
                            type="number"
                            placeholder="Selling Price *"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="border rounded-xl p-4"
                        />

                        <input
                            type="number"
                            placeholder="Old Price"
                            value={oldPrice}
                            onChange={(e) => setOldPrice(e.target.value)}
                            className="border rounded-xl p-4"
                        />

                        <input
                            type="number"
                            placeholder="Stock"
                            value={stock}
                            onChange={(e) => setStock(e.target.value)}
                            className="border rounded-xl p-4"
                        />

                        <div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                        setImageFile(e.target.files[0]);
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

                        <input
                            type="number"
                            placeholder="Rating"
                            value={rating}
                            onChange={(e) => setRating(Number(e.target.value))}
                            className="border rounded-xl p-4"
                        />

                        <input
                            type="number"
                            placeholder="Reviews"
                            value={reviews}
                            onChange={(e) => setReviews(Number(e.target.value))}
                            className="border rounded-xl p-4"
                        />

                    </div>

                    <textarea
                        placeholder="Product Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="border rounded-xl p-4 h-40 w-full mt-6"
                    />

                    <div className="flex gap-10 mt-8">

                        <label className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                checked={featured}
                                onChange={(e) => setFeatured(e.target.checked)}
                            />
                            Featured Product
                        </label>

                        <label className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                checked={bestseller}
                                onChange={(e) => setBestseller(e.target.checked)}
                            />
                            Bestseller
                        </label>

                    </div>

                    <button
                        onClick={saveProduct}
                        disabled={uploading}
                        className="mt-10 w-full bg-pink-600 text-white py-4 rounded-xl font-semibold hover:bg-pink-700 transition disabled:opacity-50"
                    >
                        {uploading ? "Uploading..." : "Save Product"}
                    </button>

                </div>

            </section>

            <Footer />
        </>
    );
}