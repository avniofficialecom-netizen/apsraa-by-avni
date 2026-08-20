"use client";

import { useEffect, useState } from "react";

export default function BackToTop() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setVisible(window.scrollY > 500);
        };

        window.addEventListener(
            "scroll",
            handleScroll,
            { passive: true }
        );

        handleScroll();

        return () => {
            window.removeEventListener(
                "scroll",
                handleScroll
            );
        };
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    if (!visible) {
        return null;
    }

    return (
        <button
            type="button"
            onClick={scrollToTop}
            aria-label="Back to top"
            className="
                fixed
                bottom-6
                right-6
                z-[9998]
                w-12
                h-12
                rounded-full
                bg-pink-600
                text-white
                shadow-xl
                flex
                items-center
                justify-center
                text-2xl
                font-bold
                hover:bg-pink-700
                hover:-translate-y-1
                active:scale-95
                transition-all
                duration-200
            "
        >
            ↑
        </button>
    );
}