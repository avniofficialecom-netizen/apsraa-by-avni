"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminNavbar from "../../../../components/AdminNavbar";
import Footer from "../../../../components/Footer";
import { supabase } from "../../../../lib/supabase";

export default function EditProduct() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();

    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("");
    const [price, setPrice] = useState("");
    const [oldPrice, setOldPrice] = useState("");
    const [stock, setStock] = useState("");
    const [rating, setRating] = useState(5);
    const [reviews, setReviews] = useState(0);
    const [description, setDescription] = useState("");
    const [image, setImage] = useState("");
    const [featured, setFeatured] = useState(false);
    const [bestseller, setBestseller] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (id) loadProduct();
    }, [id]);

    async function loadProduct() {
        setLoading(true);

        const { data, error } = await supabase
            .from("products")
            .select("*")
            .eq("id", Number(id))
            .single();

        setLoading(false);

        if (error || !data) {
            alert(error?.message || "Product not found");
            return;
        }

        setTitle(data.title ?? "");
        setCategory(data.category ?? "");
        setPrice(String(data.price ?? ""));
        setOldPrice(String(data.old_price ?? ""));
        setStock(String(data.stock ?? ""));
        setRating(Number(data.rating ?? 5));
        setReviews(Number(data.reviews ?? 0));
        setDescription(data.description ?? "");
        setImage(data.image ?? "");
        setFeatured(Boolean(data.featured));
        setBestseller(Boolean(data.bestseller));
    }

    async function uploadImage() {
        if (!imageFile) return image;

        setUploading(true);

        const fileName = `${Date.now()}-${imageFile.name}`;

        const { error } = await supabase.storage
            .from("products")
            .upload(fileName, imageFile);

        if (error) {
            setUploading(false);
            throw error;
        }

        const { data } = supabase.storage
            .from("products")
            .getPublicUrl(fileName);

        setUploading(false);

        return data.publicUrl;
    }

    async function updateProduct() {
        try {
            let imageUrl = image;

            if (imageFile) {
                imageUrl = await uploadImage();
            }

            const { error } = await supabase
                .from("products")
                .update({
                    title,
                    category,
                    price,
                    old_price: oldPrice,
                    stock: Number(stock),
                    rating: Number(rating),
                    reviews: Number(reviews),
                    description,
                    image: imageUrl,
                    featured,
                    bestseller,
                })
                .eq("id", Number(id));

            if (error) throw error;

            alert("✅ Product Updated Successfully!");
            router.push("/admin/products");
        } catch (e: any) {
            alert(e.message);
        }
    }

    if (loading) {
        return (
            <>
                <AdminNavbar />

                <section className="min-h-screen flex items-center justify-center">
                    <h2 className="text-2xl font-semibold text-pink-700">
                        Loading Product...
                    </h2>
                </section>

                <Footer />
            </>
        );
    }

    return (
        <>
            <AdminNavbar />

            <section className="min-h-screen bg-gradient-to-br from-pink-50 to-white py-16">
                <div className="max-w-5xl mx-auto px-6">
                    <div className="bg-white rounded-3xl shadow-xl p-10">

                        <h1 className="text-4xl font-bold text-pink-700 mb-2">
                            Edit Jewellery Product
                        </h1>

                        <p className="text-gray-500 mb-8">
                            Update your jewellery details, image, stock and pricing.
                        </p>

                        <div className="grid md:grid-cols-2 gap-6">

                            <div>
                                <label className="block mb-2 font-semibold text-gray-700">
                                    Product Title
                                </label>

                                <input
                                    className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-pink-500 outline-none"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>

                            <div>
                                <label>Category</label>
                                <input
                                    className="w-full border p-3 rounded-lg"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                />
                            </div>

                            <div>
                                <label>Price</label>
                                <input
                                    className="w-full border p-3 rounded-lg"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                />
                            </div>

                            <div>
                                <label>Old Price</label>
                                <input
                                    className="w-full border p-3 rounded-lg"
                                    value={oldPrice}
                                    onChange={(e) => setOldPrice(e.target.value)}
                                />
                            </div>

                            <div>
                                <label>Stock</label>
                                <input
                                    type="number"
                                    className="w-full border p-3 rounded-lg"
                                    value={stock}
                                    onChange={(e) => setStock(e.target.value)}
                                />
                            </div>

                            <div>
                                <label>Rating</label>
                                <input
                                    type="number"
                                    min={0}
                                    max={5}
                                    step="0.1"
                                    className="w-full border p-3 rounded-lg"
                                    value={rating}
                                    onChange={(e) => setRating(Number(e.target.value))}
                                />
                            </div>

                            <div>
                                <label>Reviews</label>
                                <input
                                    type="number"
                                    className="w-full border p-3 rounded-lg"
                                    value={reviews}
                                    onChange={(e) => setReviews(Number(e.target.value))}
                                />
                            </div>

                            <div>
                                <label>Image</label>

                                <input
                                    type="file"
                                    accept="image/*"
                                    className="w-full border p-3 rounded-lg"
                                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                                />

                                {image && (
                                    <div className="mt-4">
                                        <p className="text-sm text-gray-500 mb-2">
                                            Current Image
                                        </p>

                                        <img
                                            src={image}
                                            alt="Preview"
                                            className="w-48 h-48 object-cover rounded-2xl border shadow-lg"
                                        />
                                    </div>
                                )}
                            </div>

                        </div>

                        <div className="mt-6">
                            <label>Description</label>

                            <textarea
                                rows={5}
                                className="w-full border p-3 rounded-lg"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        <div className="flex flex-wrap gap-10 mt-8 bg-pink-50 rounded-2xl p-5">

                            <label className="flex items-center gap-3 text-lg font-medium">
                                <input
                                    type="checkbox"
                                    checked={featured}
                                    onChange={(e) => setFeatured(e.target.checked)}
                                    className="w-5 h-5"
                                />
                                ⭐ Featured Product
                            </label>

                            <label className="flex items-center gap-3 text-lg font-medium">
                                <input
                                    type="checkbox"
                                    checked={bestseller}
                                    onChange={(e) => setBestseller(e.target.checked)}
                                    className="w-5 h-5"
                                />
                                🔥 Bestseller
                            </label>

                        </div>

                        <button
                            onClick={updateProduct}
                            disabled={uploading}
                            className="mt-10 w-full bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 text-white py-4 rounded-2xl text-lg font-bold shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {uploading ? "📤 Uploading Image..." : "💾 Update Product"}
                        </button>

                    </div>
                </div>
            </section>

            <Footer />
        </>
    );
}