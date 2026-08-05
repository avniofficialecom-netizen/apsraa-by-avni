"use client";

import { supabase } from "../lib/supabase";
import { useCart } from "./context/CartContext";

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

export default function ProductDetails({
                                           product,
                                       }: {
    product: Product;
}) {
    const { addToCart } = useCart();

    const handleAddToCart = async () => {

        if (product.stock <= 0) {
            alert("This product is currently out of stock.");
            return;
        }

        addToCart({
            id: product.id,
            title: product.title,
            price: product.price,
            image: product.image,
        });

        const { data: existingItem, error: fetchError } = await supabase
            .from("cart")
            .select("id, quantity")
            .eq("product_id", product.id)
            .maybeSingle();

        if (fetchError) {
            alert(fetchError.message);
            return;
        }

        if (existingItem) {

            if (existingItem.quantity >= product.stock) {
                alert(`Only ${product.stock} item(s) available.`);
                return;
            }

            const { error } = await supabase
                .from("cart")
                .update({
                    quantity: existingItem.quantity + 1,
                })
                .eq("id", existingItem.id);

            if (error) {
                alert(error.message);
                return;
            }

        } else {

            const { error } = await supabase
                .from("cart")
                .insert([
                    {
                        product_id: product.id,
                        title: product.title,
                        price: product.price,
                        image: product.image,
                        quantity: 1,
                    },
                ]);

            if (error) {
                alert(error.message);
                return;
            }

        }

        alert(`✅ ${product.title} added to cart!`);
    };

    return (
        <div>

            <span className="bg-pink-100 text-pink-700 px-4 py-2 rounded-full">
                {product.category}
            </span>

            <h1 className="text-5xl font-bold text-pink-700 mt-6">
                {product.title}
            </h1>

            <div className="mt-4 text-lg">
                ⭐ {product.rating} ({product.reviews} Reviews)
            </div>

            <div className="flex items-center gap-4 mt-8">

                <span className="text-4xl font-bold text-pink-700">
                    ₹{product.price}
                </span>

                {product.old_price && (
                    <span className="text-2xl text-gray-400 line-through">
                        ₹{product.old_price}
                    </span>
                )}

            </div>

            <p className="mt-8 text-gray-600 leading-8">
                {product.description}
            </p>

            <div className="mt-6">

                <span className="font-semibold">
                    Stock:
                </span>{" "}

                {product.stock > 0 ? (

                    <span className="text-green-600 font-bold">
                        {product.stock} Available
                    </span>

                ) : (

                    <span className="text-red-600 font-bold">
                        ❌ Out of Stock
                    </span>

                )}

            </div>

            <div className="flex gap-3 mt-6">

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

            <div className="flex gap-4 mt-10">

                {product.stock > 0 ? (

                    <button
                        type="button"
                        onClick={handleAddToCart}
                        className="bg-pink-600 text-white px-8 py-4 rounded-full hover:bg-pink-700 transition"
                    >
                        🛒 Add to Cart
                    </button>

                ) : (

                    <button
                        type="button"
                        disabled
                        className="bg-gray-400 text-white px-8 py-4 rounded-full cursor-not-allowed"
                    >
                        ❌ Out of Stock
                    </button>

                )}

                <button
                    type="button"
                    className="border-2 border-pink-600 text-pink-600 px-8 py-4 rounded-full hover:bg-pink-600 hover:text-white transition"
                >
                    ❤️ Wishlist
                </button>

            </div>

        </div>
    );
}