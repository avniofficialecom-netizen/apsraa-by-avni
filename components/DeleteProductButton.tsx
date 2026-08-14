"use client";

export default function DeleteProductButton({
                                                id,
                                                onDeleted,
                                            }: {
    id: number;
    onDeleted: (id: number) => void;
}) {
    const deleteProduct = async () => {
        const confirmDelete = confirm(
            "Are you sure you want to delete this product?"
        );

        if (!confirmDelete) return;

        try {
            const response = await fetch(
                "/api/delete-product",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        id,
                    }),
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                alert(
                    result.message ||
                    "Unable to delete product."
                );
                return;
            }

            // Immediately remove the product
            // from the Products page.
            onDeleted(id);

        } catch (error) {
            console.error(
                "Delete Product Error:",
                error
            );

            alert(
                "Something went wrong while deleting the product."
            );
        }
    };

    return (
        <button
            onClick={deleteProduct}
            className="flex-1 bg-red-600 text-white py-3 rounded-xl hover:bg-red-700 transition"
        >
            🗑 Delete
        </button>
    );
}