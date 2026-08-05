"use client";

import Link from "next/link";
import { useCart } from "./context/CartContext";

type ProductCardProps = {
    id: number;
    image: string;
    title: string;
    subtitle: string;
    stock: number;
};

export default function ProductCard({
                                        id,
                                        image,
                                        title,
                                        subtitle,
                                        stock,
                                    }: ProductCardProps) {
    const { addToCart } = useCart();

    const handleAddToCart = (
        e: React.MouseEvent<HTMLButtonElement>
    ) => {
        e.preventDefault();
        e.stopPropagation();

        if (stock <= 0) return;

        addToCart({
            id,
            title,
            price: subtitle,
            image,
        });
    };

    return (
        <Link href={`/product/${id}`}>
            <div className="group cursor-pointer bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">

                {/* Product Image */}
                <div className="relative overflow-hidden">

                    <img
                        src={image}
                        alt={title}
                        className="w-full h-80 object-cover group-hover:scale-110 transition duration-500"
                    />

                    {stock > 0 ? (
                        <span className="absolute top-4 left-4 bg-pink-600 text-white text-xs font-semibold px-4 py-2 rounded-full">
                            Bestseller
                        </span>
                    ) : (
                        <span className="absolute top-4 left-4 bg-red-600 text-white text-xs font-semibold px-4 py-2 rounded-full">
                            Out of Stock
                        </span>
                    )}

                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        className="absolute top-4 right-4 bg-white w-10 h-10 rounded-full shadow flex items-center justify-center hover:bg-pink-100"
                    >
                        🤍
                    </button>

                </div>

                {/* Product Details */}
                <div className="p-6">

                    <h3 className="text-xl font-bold text-gray-800">
                        {title}
                    </h3>

                    <div className="flex items-center mt-2">
                        <span className="text-yellow-500">★★★★★</span>

                        <span className="ml-2 text-sm text-gray-500">
                            (124)
                        </span>
                    </div>

                    <div className="mt-4 flex items-center gap-3">

                        <span className="text-2xl font-bold text-pink-700">
                            {subtitle}
                        </span>

                        <span className="text-gray-400 line-through">
                            ₹1499
                        </span>

                    </div>

                    <p className="mt-3 text-sm">
                        Stock :
                        <span
                            className={`ml-2 font-bold ${
                                stock > 0
                                    ? "text-green-600"
                                    : "text-red-600"
                            }`}
                        >
                            {stock}
                        </span>
                    </p>

                    {stock > 0 ? (
                        <button
                            type="button"
                            onClick={handleAddToCart}
                            className="mt-6 w-full bg-pink-600 text-white py-3 rounded-full font-semibold hover:bg-pink-700 transition"
                        >
                            🛒 Add to Cart
                        </button>
                    ) : (
                        <button
                            type="button"
                            disabled
                            className="mt-6 w-full bg-gray-400 text-white py-3 rounded-full font-semibold cursor-not-allowed"
                        >
                            ❌ Out of Stock
                        </button>
                    )}

                </div>

            </div>
        </Link>
    );
}