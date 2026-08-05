"use client";

import { useRouter } from "next/navigation";

export default function DeleteProductButton({
                                                id,
                                            }: {
    id: number;
}) {
    const router = useRouter();

    const deleteProduct = async () => {
        const confirmDelete = confirm(
            "Are you sure you want to delete this product?"
        );

        if (!confirmDelete) return;

        const response = await fetch("/api/delete-product", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                id,
            }),
        });

        const result = await response.json();

        if (result.success) {
            alert("Product deleted successfully.");
            router.refresh();
        } else {
            alert(result.message);
        }
    };

    return (
        <button
            onClick={deleteProduct}
            className="flex-1 bg-red-600 text-white py-3 rounded-xl hover:bg-red-700"
        >
            🗑 Delete
        </button>
    );
}