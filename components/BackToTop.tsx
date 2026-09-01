"use client";

import { useEffect, useState } from "react";

export default function BackToTop() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setVisible(window.scrollY > 200);
        };

        window.addEventListener("scroll", handleScroll, {
            passive: true,
        });

        handleScroll();

        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    const scrollToBottom = () => {
        window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: "smooth",
        });
    };

    if (!visible) {
        return null;
    }

    return (
        <div className="fixed bottom-6 right-6 z-[9998] flex flex-col gap-3">
            {/* Back to Top */}
            <button
                type="button"
                onClick={scrollToTop}
                aria-label="Back to top"
                title="Back to top"
                className="
                    flex
                    h-12
                    w-12
                    items-center
                    justify-center
                    rounded-full
                    border-0
                    bg-pink-600
                    text-2xl
                    font-bold
                    text-white
                    shadow-xl
                    transition-all
                    duration-200
                    hover:-translate-y-1
                    hover:bg-pink-700
                    active:scale-95
                "
            >
                ↑
            </button>

            {/* Scroll to Bottom */}
            <button
                type="button"
                onClick={scrollToBottom}
                aria-label="Scroll to bottom"
                title="Scroll to bottom"
                className="
                    flex
                    h-12
                    w-12
                    items-center
                    justify-center
                    rounded-full
                    border-0
                    bg-slate-900
                    text-2xl
                    font-bold
                    text-white
                    shadow-xl
                    transition-all
                    duration-200
                    hover:-translate-y-1
                    hover:bg-slate-800
                    active:scale-95
                "
            >
                ↓
            </button>
        </div>
    );
}