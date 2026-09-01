"use client";

import { useState } from "react";

type ProductGalleryProps = {
    images: string[];
    title: string;
};

export default function ProductGallery({
    images,
    title,
}: ProductGalleryProps) {
    const safeImages =
        images.length > 0
            ? images
            : ["/placeholder-product.jpg"];

    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectedImage =
        safeImages[selectedIndex] || safeImages[0];

    return (
        <div className="w-full">

            {/* ==========================================
                MAIN PRODUCT IMAGE
                No white card
                No forced square
                No cropping
                Natural image dimensions
            ========================================== */}

            <div className="relative w-full overflow-hidden rounded-3xl">

                <img
                    src={selectedImage}
                    alt={`${title} - image ${selectedIndex + 1}`}
                    className="block w-full h-auto max-h-[80vh] object-contain transition-all duration-300"
                />

                {/* MOBILE IMAGE COUNTER */}

                {safeImages.length > 1 && (
                    <div className="absolute bottom-4 right-4 md:hidden bg-black/70 text-white text-xs font-semibold px-3 py-2 rounded-full">
                        {selectedIndex + 1} / {safeImages.length}
                    </div>
                )}

            </div>

            {/* ==========================================
                THUMBNAILS
            ========================================== */}

            {safeImages.length > 1 && (
                <div className="mt-4 flex gap-3 overflow-x-auto pb-2">

                    {safeImages.map((image, index) => {
                        const isSelected =
                            selectedIndex === index;

                        return (
                            <button
                                key={`${image}-${index}`}
                                type="button"
                                onClick={() =>
                                    setSelectedIndex(index)
                                }
                                aria-label={`View image ${
                                    index + 1
                                }`}
                                aria-current={
                                    isSelected
                                        ? "true"
                                        : undefined
                                }
                                className={`relative flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all bg-white ${
                                    isSelected
                                        ? "border-pink-600 ring-2 ring-pink-100"
                                        : "border-transparent hover:border-pink-300"
                                }`}
                            >
                                <div className="w-20 h-20 md:w-24 md:h-24 flex items-center justify-center">
                                    <img
                                        src={image}
                                        alt={`${title} thumbnail ${
                                            index + 1
                                        }`}
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                            </button>
                        );
                    })}

                </div>
            )}

            {/* ==========================================
                MOBILE DOTS
            ========================================== */}

            {safeImages.length > 1 && (
                <div className="flex md:hidden justify-center gap-1.5 mt-2">

                    {safeImages.map((_, index) => (
                        <button
                            key={index}
                            type="button"
                            onClick={() =>
                                setSelectedIndex(index)
                            }
                            aria-label={`Go to image ${
                                index + 1
                            }`}
                            className={`h-1.5 rounded-full transition-all ${
                                selectedIndex === index
                                    ? "w-5 bg-pink-600"
                                    : "w-1.5 bg-gray-300"
                            }`}
                        />
                    ))}

                </div>
            )}

        </div>
    );
}