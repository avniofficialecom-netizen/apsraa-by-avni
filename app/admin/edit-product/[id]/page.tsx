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
    const [imageFile, setImageFile] = useState<File | null>(null);

    const [galleryImages, setGalleryImages] = useState<string[]>([]);
    const [galleryFiles, setGalleryFiles] = useState<File[]>([]);

    const [featured, setFeatured] = useState(false);
    const [bestseller, setBestseller] = useState(false);

    // NEW: Hero controls
    const [homeHero, setHomeHero] = useState(false);
    const [shopHero, setShopHero] = useState(false);
    const [featuredHero, setFeaturedHero] = useState(false);

    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (id) {
            loadProduct();
        }
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

        if (Array.isArray(data.images)) {
            setGalleryImages(
                data.images.filter(
                    (item: unknown): item is string =>
                        typeof item === "string" &&
                        item.trim().length > 0
                )
            );
        } else {
            setGalleryImages([]);
        }

        setFeatured(Boolean(data.featured));
        setBestseller(Boolean(data.bestseller));

        // NEW: Load hero settings
        setHomeHero(Boolean(data.home_hero));
        setShopHero(Boolean(data.shop_hero));
        setFeaturedHero(Boolean(data.featured_hero));
    }

    async function uploadFile(file: File) {
        const safeName = file.name
            .replace(/[^a-zA-Z0-9._-]/g, "-")
            .replace(/-+/g, "-");

        const fileName = `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 10)}-${safeName}`;

        const { error } = await supabase.storage
            .from("products")
            .upload(fileName, file);

        if (error) {
            throw error;
        }

        const { data } = supabase.storage
            .from("products")
            .getPublicUrl(fileName);

        return data.publicUrl;
    }

    async function uploadMainImage() {
        if (!imageFile) {
            return image;
        }

        return await uploadFile(imageFile);
    }

    async function uploadGalleryImages() {
        if (galleryFiles.length === 0) {
            return galleryImages;
        }

        const uploadedUrls: string[] = [];

        for (const file of galleryFiles) {
            const url = await uploadFile(file);
            uploadedUrls.push(url);
        }

        return [...galleryImages, ...uploadedUrls];
    }

    function handleGalleryFiles(
        event: React.ChangeEvent<HTMLInputElement>
    ) {
        const files = Array.from(event.target.files || []);

        if (files.length === 0) {
            return;
        }

        setGalleryFiles((current) => [
            ...current,
            ...files,
        ]);

        event.target.value = "";
    }

    function removeExistingGalleryImage(index: number) {
        setGalleryImages((current) =>
            current.filter((_, imageIndex) => imageIndex !== index)
        );
    }

    function removePendingGalleryImage(index: number) {
        setGalleryFiles((current) =>
            current.filter((_, fileIndex) => fileIndex !== index)
        );
    }

    function moveGalleryImage(
        index: number,
        direction: "left" | "right"
    ) {
        setGalleryImages((current) => {
            const next = [...current];

            const targetIndex =
                direction === "left"
                    ? index - 1
                    : index + 1;

            if (
                targetIndex < 0 ||
                targetIndex >= next.length
            ) {
                return current;
            }

            const temp = next[index];
            next[index] = next[targetIndex];
            next[targetIndex] = temp;

            return next;
        });
    }

    async function updateProduct() {
        try {
            setUploading(true);

            const imageUrl = await uploadMainImage();

            const finalGalleryImages =
                await uploadGalleryImages();

            /*
             * If this product is being selected as Home Hero,
             * remove Home Hero from every other product first.
             */
            if (homeHero) {
                const { error: clearHomeHeroError } =
                    await supabase
                        .from("products")
                        .update({
                            home_hero: false,
                        })
                        .neq("id", Number(id));

                if (clearHomeHeroError) {
                    throw clearHomeHeroError;
                }
            }

            /*
             * If this product is being selected as Featured Hero,
             * remove Featured Hero from every other product first.
             */
            if (featuredHero) {
                const { error: clearFeaturedHeroError } =
                    await supabase
                        .from("products")
                        .update({
                            featured_hero: false,
                        })
                        .neq("id", Number(id));

                if (clearFeaturedHeroError) {
                    throw clearFeaturedHeroError;
                }
            }

            /*
             * If this product is being selected as Shop Hero,
             * remove Shop Hero from every other product first.
             */
            if (shopHero) {
                const { error: clearShopHeroError } =
                    await supabase
                        .from("products")
                        .update({
                            shop_hero: false,
                        })
                        .neq("id", Number(id));

                if (clearShopHeroError) {
                    throw clearShopHeroError;
                }
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
                    images: finalGalleryImages,

                    featured,
                    bestseller,

                    // Hero controls
                    home_hero: homeHero,
                    shop_hero: shopHero,
                    featured_hero: featuredHero,
                })
                .eq("id", Number(id));

            if (error) {
                throw error;
            }

            alert("✅ Product Updated Successfully!");

            router.push("/admin/products");
        } catch (e: unknown) {
            const message =
                e instanceof Error
                    ? e.message
                    : "Something went wrong while updating the product.";

            alert(message);
        } finally {
            setUploading(false);
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
                            Update your jewellery details, images,
                            gallery, stock, pricing and homepage
                            placement.
                        </p>

                        <div className="grid md:grid-cols-2 gap-6">

                            {/* PRODUCT TITLE */}

                            <div>
                                <label className="block mb-2 font-semibold text-gray-700">
                                    Product Title
                                </label>

                                <input
                                    className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-pink-500 outline-none"
                                    value={title}
                                    onChange={(e) =>
                                        setTitle(e.target.value)
                                    }
                                />
                            </div>

                            {/* PRODUCT TYPE */}

                            <div>
                                <label className="block mb-2 font-semibold text-gray-700">
                                    Product Type
                                </label>

                                <select
                                    className="w-full border p-3 rounded-lg"
                                    defaultValue="Jewellery"
                                >
                                    <option value="Jewellery">
                                        Jewellery
                                    </option>
                                </select>
                            </div>

                            {/* CATEGORY */}

                            <div>
                                <label className="block mb-2 font-semibold text-gray-700">
                                    Category
                                </label>

                                <input
                                    className="w-full border p-3 rounded-lg"
                                    value={category}
                                    onChange={(e) =>
                                        setCategory(e.target.value)
                                    }
                                />
                            </div>

                            {/* PRICE */}

                            <div>
                                <label className="block mb-2 font-semibold text-gray-700">
                                    Price
                                </label>

                                <input
                                    className="w-full border p-3 rounded-lg"
                                    value={price}
                                    onChange={(e) =>
                                        setPrice(e.target.value)
                                    }
                                />
                            </div>

                            {/* OLD PRICE */}

                            <div>
                                <label className="block mb-2 font-semibold text-gray-700">
                                    Old Price
                                </label>

                                <input
                                    className="w-full border p-3 rounded-lg"
                                    value={oldPrice}
                                    onChange={(e) =>
                                        setOldPrice(e.target.value)
                                    }
                                />
                            </div>

                            {/* STOCK */}

                            <div>
                                <label className="block mb-2 font-semibold text-gray-700">
                                    Stock
                                </label>

                                <input
                                    type="number"
                                    className="w-full border p-3 rounded-lg"
                                    value={stock}
                                    onChange={(e) =>
                                        setStock(e.target.value)
                                    }
                                />
                            </div>

                            {/* RATING */}

                            <div>
                                <label className="block mb-2 font-semibold text-gray-700">
                                    Rating
                                </label>

                                <input
                                    type="number"
                                    min={0}
                                    max={5}
                                    step="0.1"
                                    className="w-full border p-3 rounded-lg"
                                    value={rating}
                                    onChange={(e) =>
                                        setRating(
                                            Number(e.target.value)
                                        )
                                    }
                                />
                            </div>

                            {/* REVIEWS */}

                            <div>
                                <label className="block mb-2 font-semibold text-gray-700">
                                    Reviews
                                </label>

                                <input
                                    type="number"
                                    className="w-full border p-3 rounded-lg"
                                    value={reviews}
                                    onChange={(e) =>
                                        setReviews(
                                            Number(e.target.value)
                                        )
                                    }
                                />
                            </div>

                            {/* MAIN IMAGE */}

                            <div className="md:col-span-2">

                                <label className="block mb-2 font-semibold text-gray-700">
                                    Main Product Image
                                </label>

                                <input
                                    type="file"
                                    accept="image/*"
                                    className="w-full border p-3 rounded-lg"
                                    onChange={(e) =>
                                        setImageFile(
                                            e.target.files?.[0] ||
                                                null
                                        )
                                    }
                                />

                                {image && (
                                    <div className="mt-4">

                                        <p className="text-sm text-gray-500 mb-2">
                                            Current Main Image
                                        </p>

                                        <img
                                            src={image}
                                            alt="Current product"
                                            className="w-48 h-48 object-cover rounded-2xl border shadow-lg"
                                        />

                                    </div>
                                )}

                            </div>

                        </div>

                        {/* ==========================================
                            PRODUCT GALLERY
                        ========================================== */}

                        <div className="mt-10 bg-pink-50 rounded-3xl p-6">

                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">

                                <div>
                                    <h2 className="text-2xl font-bold text-pink-700">
                                        Product Gallery
                                    </h2>

                                    <p className="text-gray-600 mt-1">
                                        Add multiple product photos.
                                        These appear in the customer
                                        product gallery.
                                    </p>
                                </div>

                                <label className="inline-flex items-center justify-center cursor-pointer bg-pink-600 hover:bg-pink-700 text-white px-5 py-3 rounded-xl font-semibold transition">
                                    + Add Images

                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                        onChange={handleGalleryFiles}
                                    />
                                </label>

                            </div>

                            {/* EXISTING GALLERY */}

                            {galleryImages.length > 0 ? (
                                <div>

                                    <h3 className="font-semibold text-gray-700 mb-3">
                                        Existing Gallery Images
                                    </h3>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">

                                        {galleryImages.map(
                                            (galleryImage, index) => (
                                                <div
                                                    key={`${galleryImage}-${index}`}
                                                    className="bg-white rounded-2xl border shadow-sm p-2"
                                                >

                                                    <img
                                                        src={
                                                            galleryImage
                                                        }
                                                        alt={`Gallery image ${
                                                            index + 1
                                                        }`}
                                                        className="w-full aspect-square object-cover rounded-xl"
                                                    />

                                                    <div className="flex items-center justify-between gap-2 mt-2">

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                moveGalleryImage(
                                                                    index,
                                                                    "left"
                                                                )
                                                            }
                                                            disabled={
                                                                index ===
                                                                0
                                                            }
                                                            className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-30"
                                                            title="Move left"
                                                        >
                                                            ←
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                removeExistingGalleryImage(
                                                                    index
                                                                )
                                                            }
                                                            className="px-3 py-1 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 text-sm font-semibold"
                                                        >
                                                            Remove
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                moveGalleryImage(
                                                                    index,
                                                                    "right"
                                                                )
                                                            }
                                                            disabled={
                                                                index ===
                                                                galleryImages.length -
                                                                    1
                                                            }
                                                            className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-30"
                                                            title="Move right"
                                                        >
                                                            →
                                                        </button>

                                                    </div>

                                                </div>
                                            )
                                        )}

                                    </div>

                                </div>
                            ) : (
                                <div className="bg-white border-2 border-dashed border-pink-200 rounded-2xl p-8 text-center text-gray-500">
                                    No additional gallery images yet.
                                </div>
                            )}

                            {/* NEW / PENDING FILES */}

                            {galleryFiles.length > 0 && (
                                <div className="mt-8">

                                    <h3 className="font-semibold text-gray-700 mb-3">
                                        New Images To Upload
                                    </h3>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">

                                        {galleryFiles.map(
                                            (file, index) => (
                                                <div
                                                    key={`${file.name}-${index}`}
                                                    className="bg-white rounded-2xl border shadow-sm p-2"
                                                >

                                                    <div className="aspect-square rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden">

                                                        <img
                                                            src={URL.createObjectURL(
                                                                file
                                                            )}
                                                            alt={
                                                                file.name
                                                            }
                                                            className="w-full h-full object-cover"
                                                        />

                                                    </div>

                                                    <p className="text-xs text-gray-500 truncate mt-2">
                                                        {file.name}
                                                    </p>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            removePendingGalleryImage(
                                                                index
                                                            )
                                                        }
                                                        className="w-full mt-2 px-3 py-1 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 text-sm font-semibold"
                                                    >
                                                        Remove
                                                    </button>

                                                </div>
                                            )
                                        )}

                                    </div>

                                </div>
                            )}

                            <div className="mt-5 text-sm text-gray-500">
                                <strong>Tip:</strong>{" "}
                                The main image stays separate.
                                Gallery images are additional photos
                                shown underneath it on the product page.
                            </div>

                        </div>

                        {/* DESCRIPTION */}

                        <div className="mt-6">

                            <label className="block mb-2 font-semibold text-gray-700">
                                Description
                            </label>

                            <textarea
                                rows={5}
                                className="w-full border p-3 rounded-lg"
                                value={description}
                                onChange={(e) =>
                                    setDescription(e.target.value)
                                }
                            />

                        </div>

                        {/* ==========================================
                            PRODUCT PLACEMENT
                        ========================================== */}

                        <div className="mt-8 bg-pink-50 rounded-2xl p-6">

                            <h2 className="text-2xl font-bold text-pink-700">
                                Storefront Placement
                            </h2>

                            <p className="text-sm text-gray-600 mt-1 mb-5">
                                Choose where this product should be
                                highlighted across APSRAA.
                            </p>

                            <div className="grid md:grid-cols-2 gap-4">

                                {/* FEATURED HERO */}

                                <label
                                    className={`flex items-start gap-4 p-5 rounded-2xl border-2 cursor-pointer transition ${
                                        featuredHero
                                            ? "border-pink-500 bg-white shadow-sm"
                                            : "border-transparent bg-white/70 hover:border-pink-200"
                                    }`}
                                >

                                    <input
                                        type="checkbox"
                                        checked={featuredHero}
                                        onChange={(e) =>
                                            setFeaturedHero(
                                                e.target.checked
                                            )
                                        }
                                        className="w-5 h-5 mt-1 accent-pink-600"
                                    />

                                    <div>
                                        <p className="font-bold text-gray-900">
                                            ⭐ Featured Hero
                                        </p>

                                        <p className="text-sm text-gray-500 mt-1">
                                            Use this product as the
                                            main Featured product
                                            display.
                                        </p>

                                        {featuredHero && (
                                            <span className="inline-block mt-3 text-xs font-semibold text-pink-700 bg-pink-100 px-3 py-1 rounded-full">
                                                Active Featured Hero
                                            </span>
                                        )}
                                    </div>

                                </label>

                                {/* HOME HERO */}

                                <label
                                    className={`flex items-start gap-4 p-5 rounded-2xl border-2 cursor-pointer transition ${
                                        homeHero
                                            ? "border-pink-500 bg-white shadow-sm"
                                            : "border-transparent bg-white/70 hover:border-pink-200"
                                    }`}
                                >

                                    <input
                                        type="checkbox"
                                        checked={homeHero}
                                        onChange={(e) =>
                                            setHomeHero(
                                                e.target.checked
                                            )
                                        }
                                        className="w-5 h-5 mt-1 accent-pink-600"
                                    />

                                    <div>
                                        <p className="font-bold text-gray-900">
                                            🏠 Home Hero
                                        </p>

                                        <p className="text-sm text-gray-500 mt-1">
                                            Use this product as the
                                            main hero product on the
                                            APSRAA home page.
                                        </p>

                                        {homeHero && (
                                            <span className="inline-block mt-3 text-xs font-semibold text-pink-700 bg-pink-100 px-3 py-1 rounded-full">
                                                Active Home Hero
                                            </span>
                                        )}
                                    </div>

                                </label>

                                {/* SHOP HERO */}

                                <label
                                    className={`flex items-start gap-4 p-5 rounded-2xl border-2 cursor-pointer transition ${
                                        shopHero
                                            ? "border-pink-500 bg-white shadow-sm"
                                            : "border-transparent bg-white/70 hover:border-pink-200"
                                    }`}
                                >

                                    <input
                                        type="checkbox"
                                        checked={shopHero}
                                        onChange={(e) =>
                                            setShopHero(
                                                e.target.checked
                                            )
                                        }
                                        className="w-5 h-5 mt-1 accent-pink-600"
                                    />

                                    <div>
                                        <p className="font-bold text-gray-900">
                                            🛍️ Shop Hero
                                        </p>

                                        <p className="text-sm text-gray-500 mt-1">
                                            Use this product as the
                                            main visual hero on the
                                            Shop page.
                                        </p>

                                        {shopHero && (
                                            <span className="inline-block mt-3 text-xs font-semibold text-pink-700 bg-pink-100 px-3 py-1 rounded-full">
                                                Active Shop Hero
                                            </span>
                                        )}
                                    </div>

                                </label>

                            </div>

                            <p className="text-xs text-gray-500 mt-4">
                                Only one product can be active as
                                Featured Hero, Home Hero and Shop Hero.
                                Selecting a hero automatically clears
                                that hero role from other products.
                                ⭐ Featured Product below is separate
                                and can be used for multiple products.
                            </p>

                        </div>

                        {/* ==========================================
                            FEATURED / BESTSELLER
                        ========================================== */}

                        <div className="flex flex-wrap gap-10 mt-6 bg-pink-50 rounded-2xl p-5">

                            <label className="flex items-center gap-3 text-lg font-medium">

                                <input
                                    type="checkbox"
                                    checked={featured}
                                    onChange={(e) =>
                                        setFeatured(
                                            e.target.checked
                                        )
                                    }
                                    className="w-5 h-5 accent-pink-600"
                                />

                                ⭐ Featured Product

                            </label>

                            <label className="flex items-center gap-3 text-lg font-medium">

                                <input
                                    type="checkbox"
                                    checked={bestseller}
                                    onChange={(e) =>
                                        setBestseller(
                                            e.target.checked
                                        )
                                    }
                                    className="w-5 h-5 accent-pink-600"
                                />

                                🔥 Bestseller

                            </label>

                        </div>

                        {/* UPDATE BUTTON */}

                        <button
                            onClick={updateProduct}
                            disabled={uploading}
                            className="mt-10 w-full bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 text-white py-4 rounded-2xl text-lg font-bold shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {uploading
                                ? "📤 Saving Product..."
                                : "💾 Update Product"}
                        </button>

                    </div>
                </div>
            </section>

            <Footer />
        </>
    );
}