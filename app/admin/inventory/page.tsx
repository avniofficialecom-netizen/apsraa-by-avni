"use client";

import { useEffect, useMemo, useState } from "react";
import AdminNavbar from "../../../components/AdminNavbar";
import Footer from "../../../components/Footer";
import { supabase } from "../../../lib/supabase";

type Product = {
    id: number;
    title: string;
    category: string | null;
    price: number | null;
    image: string | null;
    stock: number | null;
};

type Variant = {
    id: number;
    product_id: number;
    sku: string | null;
    size: string | null;
    color: string | null;
    stock: number;
    price: number | null;
};

type InventoryRow = Variant & {
    productTitle: string;
    category: string;
    image: string | null;
};

type Movement = {
    id: number;
    product_id: number;
    variant_id: number | null;
    type: string;
    quantity: number;
    reason: string | null;
    order_id: number | null;
    created_at: string;
};

export default function InventoryPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [variants, setVariants] = useState<Variant[]>([]);
    const [movements, setMovements] = useState<Movement[]>([]);

    const [loading, setLoading] = useState(true);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] =
        useState("all");

    const [statusFilter, setStatusFilter] =
        useState("all");

    const [editingId, setEditingId] =
        useState<number | null>(null);

    const [editingStock, setEditingStock] =
        useState("");

    const [savingId, setSavingId] =
        useState<number | null>(null);

    // ==========================================
    // LOAD INVENTORY
    // ==========================================

    async function loadInventory() {
        setLoading(true);
        setError("");

        const [
            { data: productData, error: productError },
            { data: variantData, error: variantError },
        ] = await Promise.all([
            supabase
                .from("products")
                .select(
                    "id, title, category, price, image, stock"
                )
                .order("created_at", {
                    ascending: false,
                }),

            supabase
                .from("product_variants")
                .select(
                    "id, product_id, sku, size, color, stock, price"
                )
                .order("created_at", {
                    ascending: false,
                }),
        ]);

        if (productError) {
            setError(productError.message);
            setLoading(false);
            return;
        }

        if (variantError) {
            setError(variantError.message);
            setLoading(false);
            return;
        }

        setProducts(
            (productData || []) as Product[]
        );

        setVariants(
            (variantData || []) as Variant[]
        );

        setLoading(false);
    }

    // ==========================================
    // LOAD STOCK HISTORY
    // ==========================================

    async function loadMovements() {
        setHistoryLoading(true);

        const { data, error } = await supabase
            .from("inventory_movements")
            .select(
                "id, product_id, variant_id, type, quantity, reason, order_id, created_at"
            )
            .order("created_at", {
                ascending: false,
            })
            .limit(50);

        if (error) {
            console.error(
                "Inventory history error:",
                error
            );
            setHistoryLoading(false);
            return;
        }

        setMovements(
            (data || []) as Movement[]
        );

        setHistoryLoading(false);
    }

    // ==========================================
    // INITIAL LOAD
    // ==========================================

    useEffect(() => {
        loadInventory();
        loadMovements();
    }, []);

    // ==========================================
    // MAP VARIANTS TO PRODUCTS
    // ==========================================

    const rows: InventoryRow[] = useMemo(() => {
        const productMap = new Map(
            products.map((product) => [
                product.id,
                product,
            ])
        );

        return variants
            .map((variant) => {
                const product =
                    productMap.get(
                        variant.product_id
                    );

                if (!product) {
                    return null;
                }

                return {
                    ...variant,
                    productTitle:
                    product.title,
                    category:
                        product.category || "",
                    image: product.image,
                };
            })
            .filter(
                (
                    row
                ): row is InventoryRow =>
                    row !== null
            );
    }, [products, variants]);

    // ==========================================
    // FILTERS
    // ==========================================

    const categories = useMemo(() => {
        return Array.from(
            new Set(
                rows
                    .map((row) => row.category)
                    .filter(Boolean)
            )
        ).sort();
    }, [rows]);

    const filteredRows = useMemo(() => {
        const query =
            search.trim().toLowerCase();

        return rows.filter((row) => {
            const matchesSearch =
                !query ||
                row.productTitle
                    .toLowerCase()
                    .includes(query) ||
                String(row.sku || "")
                    .toLowerCase()
                    .includes(query) ||
                String(row.color || "")
                    .toLowerCase()
                    .includes(query) ||
                String(row.size || "")
                    .toLowerCase()
                    .includes(query);

            const matchesCategory =
                categoryFilter === "all" ||
                row.category ===
                categoryFilter;

            const stock =
                Number(row.stock) || 0;

            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "in-stock" &&
                    stock > 5) ||
                (statusFilter === "low" &&
                    stock > 0 &&
                    stock <= 5) ||
                (statusFilter === "out" &&
                    stock === 0);

            return (
                matchesSearch &&
                matchesCategory &&
                matchesStatus
            );
        });
    }, [
        rows,
        search,
        categoryFilter,
        statusFilter,
    ]);

    // ==========================================
    // SUMMARY
    // ==========================================

    const totalUnits = variants.reduce(
        (sum, variant) =>
            sum + (Number(variant.stock) || 0),
        0
    );

    const lowStock = variants.filter(
        (variant) =>
            Number(variant.stock) > 0 &&
            Number(variant.stock) <= 5
    ).length;

    const outOfStock = variants.filter(
        (variant) =>
            Number(variant.stock) === 0
    ).length;

    const totalProducts = products.length;

    // ==========================================
    // PRODUCT / VARIANT LOOKUPS FOR HISTORY
    // ==========================================

    const productMap = useMemo(() => {
        return new Map(
            products.map((product) => [
                product.id,
                product,
            ])
        );
    }, [products]);

    const variantMap = useMemo(() => {
        return new Map(
            variants.map((variant) => [
                variant.id,
                variant,
            ])
        );
    }, [variants]);

    // ==========================================
    // SAVE STOCK
    // ==========================================

    async function saveStock(variantId: number) {
        const quantity = Number(editingStock);

        if (
            !Number.isInteger(quantity) ||
            quantity < 0
        ) {
            alert(
                "Please enter a valid stock quantity."
            );
            return;
        }

        const currentVariant = variants.find(
            (variant) => variant.id === variantId
        );

        if (!currentVariant) {
            alert("Variant not found.");
            return;
        }

        const oldStock =
            Number(currentVariant.stock) || 0;

        const stockDifference =
            quantity - oldStock;

        // Nothing changed
        if (stockDifference === 0) {
            setEditingId(null);
            setEditingStock("");
            return;
        }

        setSavingId(variantId);

        // ==========================================
        // 1. UPDATE VARIANT STOCK
        // ==========================================

        const {
            data: updatedVariant,
            error,
        } = await supabase
            .from("product_variants")
            .update({
                stock: quantity,
            })
            .eq("id", variantId)
            .select(
                "id, product_id, sku, size, color, stock, price"
            )
            .single();

        if (error) {
            alert(error.message);
            setSavingId(null);
            return;
        }

        // ==========================================
        // 2. UPDATE LOCAL VARIANT STATE
        // ==========================================

        setVariants((current) =>
            current.map((variant) =>
                variant.id === variantId
                    ? (updatedVariant as Variant)
                    : variant
            )
        );

        // ==========================================
        // 3. KEEP PRODUCTS.STOCK SYNCHRONIZED
        // ==========================================

        const productId =
            updatedVariant.product_id;

        const productVariants =
            variants.map((variant) =>
                variant.id === variantId
                    ? (updatedVariant as Variant)
                    : variant
            );

        const totalProductStock =
            productVariants
                .filter(
                    (variant) =>
                        variant.product_id ===
                        productId
                )
                .reduce(
                    (sum, variant) =>
                        sum +
                        (Number(
                            variant.stock
                        ) || 0),
                    0
                );

        const {
            error: productUpdateError,
        } = await supabase
            .from("products")
            .update({
                stock: totalProductStock,
            })
            .eq("id", productId);

        if (productUpdateError) {
            console.error(
                "Product stock sync error:",
                productUpdateError
            );
        }

        // ==========================================
        // 4. RECORD INVENTORY MOVEMENT
        // ==========================================

        const {
            error: movementError,
        } = await supabase
            .from("inventory_movements")
            .insert({
                product_id: productId,
                variant_id: variantId,
                type: "adjustment",
                quantity: stockDifference,
                reason: "Manual stock update",
            });

        if (movementError) {
            console.error(
                "Inventory movement error:",
                movementError
            );

            alert(
                "Stock updated successfully, but the inventory history could not be recorded."
            );
        }

        // ==========================================
        // 5. RESET EDITING STATE
        // ==========================================

        setEditingId(null);
        setEditingStock("");
        setSavingId(null);

        // Refresh history
        await loadMovements();
    }

    // ==========================================
    // STOCK STATUS
    // ==========================================

    function getStatus(stock: number) {
        if (stock <= 0) {
            return {
                label: "Out of Stock",
                className:
                    "bg-red-100 text-red-700",
            };
        }

        if (stock <= 5) {
            return {
                label: "Low Stock",
                className:
                    "bg-orange-100 text-orange-700",
            };
        }

        return {
            label: "In Stock",
            className:
                "bg-green-100 text-green-700",
        };
    }

    // ==========================================
    // MOVEMENT TYPE DISPLAY
    // ==========================================

    function getMovementType(type: string) {
        switch (type) {
            case "adjustment":
                return {
                    label: "Adjustment",
                    className:
                        "bg-blue-100 text-blue-700",
                };

            case "sale":
                return {
                    label: "Sale",
                    className:
                        "bg-purple-100 text-purple-700",
                };

            case "restock":
                return {
                    label: "Restock",
                    className:
                        "bg-green-100 text-green-700",
                };

            case "return":
                return {
                    label: "Return",
                    className:
                        "bg-orange-100 text-orange-700",
                };

            default:
                return {
                    label: type || "Movement",
                    className:
                        "bg-gray-100 text-gray-700",
                };
        }
    }

    function formatDate(date: string) {
        return new Date(date).toLocaleString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            }
        );
    }

    return (
        <>
            <AdminNavbar />

            <main className="min-h-screen bg-gradient-to-br from-pink-50 to-white px-4 sm:px-6 py-10">

                <div className="max-w-7xl mx-auto">

                    {/* ==========================================
                        HEADER
                    ========================================== */}

                    <div className="mb-8">
                        <h1 className="text-3xl sm:text-4xl font-bold text-pink-700">
                            Inventory
                        </h1>

                        <p className="text-gray-500 mt-2">
                            Manage product variants,
                            stock, sizes, colors and
                            SKUs.
                        </p>
                    </div>

                    {/* ==========================================
                        SUMMARY CARDS
                    ========================================== */}

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

                        <div className="bg-white rounded-2xl shadow-sm border p-5">
                            <p className="text-sm text-gray-500">
                                Total Products
                            </p>

                            <p className="text-3xl font-bold text-gray-800 mt-2">
                                {totalProducts}
                            </p>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border p-5">
                            <p className="text-sm text-gray-500">
                                Total Units
                            </p>

                            <p className="text-3xl font-bold text-gray-800 mt-2">
                                {totalUnits}
                            </p>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border p-5">
                            <p className="text-sm text-gray-500">
                                Low Stock
                            </p>

                            <p className="text-3xl font-bold text-orange-600 mt-2">
                                {lowStock}
                            </p>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border p-5">
                            <p className="text-sm text-gray-500">
                                Out of Stock
                            </p>

                            <p className="text-3xl font-bold text-red-600 mt-2">
                                {outOfStock}
                            </p>
                        </div>

                    </div>

                    {/* ==========================================
                        FILTERS
                    ========================================== */}

                    <div className="bg-white rounded-2xl shadow-sm border p-5 mb-6">

                        <div className="grid md:grid-cols-3 gap-4">

                            <input
                                type="text"
                                value={search}
                                onChange={(e) =>
                                    setSearch(
                                        e.target.value
                                    )
                                }
                                placeholder="Search product, SKU, size or color..."
                                className="border rounded-xl p-3 w-full"
                            />

                            <select
                                value={
                                    categoryFilter
                                }
                                onChange={(e) =>
                                    setCategoryFilter(
                                        e.target.value
                                    )
                                }
                                className="border rounded-xl p-3 bg-white"
                            >
                                <option value="all">
                                    All Categories
                                </option>

                                {categories.map(
                                    (category) => (
                                        <option
                                            key={
                                                category
                                            }
                                            value={
                                                category
                                            }
                                        >
                                            {category}
                                        </option>
                                    )
                                )}
                            </select>

                            <select
                                value={
                                    statusFilter
                                }
                                onChange={(e) =>
                                    setStatusFilter(
                                        e.target.value
                                    )
                                }
                                className="border rounded-xl p-3 bg-white"
                            >
                                <option value="all">
                                    All Stock Status
                                </option>

                                <option value="in-stock">
                                    In Stock
                                </option>

                                <option value="low">
                                    Low Stock
                                </option>

                                <option value="out">
                                    Out of Stock
                                </option>
                            </select>

                        </div>
                    </div>

                    {/* ==========================================
                        ERROR
                    ========================================== */}

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-5 mb-6">
                            {error}
                        </div>
                    )}

                    {/* ==========================================
                        PRODUCT INVENTORY
                    ========================================== */}

                    <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">

                        <div className="px-5 py-4 border-b">
                            <h2 className="font-bold text-gray-800">
                                Product Inventory
                            </h2>

                            <p className="text-sm text-gray-500 mt-1">
                                {filteredRows.length}{" "}
                                variants shown
                            </p>
                        </div>

                        {loading ? (
                            <div className="p-10 text-center text-gray-500">
                                Loading inventory...
                            </div>
                        ) : filteredRows.length ===
                        0 ? (
                            <div className="p-10 text-center">
                                <div className="text-5xl">
                                    📦
                                </div>

                                <h3 className="mt-4 font-bold text-gray-800">
                                    No inventory found
                                </h3>

                                <p className="text-gray-500 mt-2">
                                    Try changing your
                                    search or filters.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">

                                <table className="w-full min-w-[950px]">

                                    <thead>
                                    <tr className="bg-pink-50 text-left">

                                        <th className="p-4">
                                            Product
                                        </th>

                                        <th className="p-4">
                                            Category
                                        </th>

                                        <th className="p-4">
                                            SKU
                                        </th>

                                        <th className="p-4">
                                            Size
                                        </th>

                                        <th className="p-4">
                                            Color
                                        </th>

                                        <th className="p-4">
                                            Stock
                                        </th>

                                        <th className="p-4">
                                            Status
                                        </th>

                                        <th className="p-4">
                                            Action
                                        </th>

                                    </tr>
                                    </thead>

                                    <tbody>

                                    {filteredRows.map(
                                        (row) => {
                                            const stock =
                                                Number(
                                                    row.stock
                                                ) || 0;

                                            const status =
                                                getStatus(
                                                    stock
                                                );

                                            const isEditing =
                                                editingId ===
                                                row.id;

                                            return (
                                                <tr
                                                    key={
                                                        row.id
                                                    }
                                                    className="border-t hover:bg-pink-50/40"
                                                >

                                                    {/* PRODUCT */}

                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">

                                                            {row.image ? (
                                                                <img
                                                                    src={
                                                                        row.image
                                                                    }
                                                                    alt={
                                                                        row.productTitle
                                                                    }
                                                                    className="w-12 h-12 rounded-xl object-cover border"
                                                                />
                                                            ) : (
                                                                <div className="w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center">
                                                                    💎
                                                                </div>
                                                            )}

                                                            <div>
                                                                <p className="font-semibold text-gray-800">
                                                                    {
                                                                        row.productTitle
                                                                    }
                                                                </p>
                                                            </div>

                                                        </div>
                                                    </td>

                                                    {/* CATEGORY */}

                                                    <td className="p-4 text-gray-600">
                                                        {
                                                            row.category
                                                        }
                                                    </td>

                                                    {/* SKU */}

                                                    <td className="p-4 text-gray-600">
                                                        {row.sku ||
                                                            "—"}
                                                    </td>

                                                    {/* SIZE */}

                                                    <td className="p-4">
                                                        {row.size ||
                                                            "—"}
                                                    </td>

                                                    {/* COLOR */}

                                                    <td className="p-4">
                                                        {row.color ||
                                                            "—"}
                                                    </td>

                                                    {/* STOCK */}

                                                    <td className="p-4">

                                                        {isEditing ? (
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={
                                                                    editingStock
                                                                }
                                                                onChange={(
                                                                    e
                                                                ) =>
                                                                    setEditingStock(
                                                                        e
                                                                            .target
                                                                            .value
                                                                    )
                                                                }
                                                                className="w-24 border rounded-lg p-2"
                                                                autoFocus
                                                            />
                                                        ) : (
                                                            <span className="font-bold text-gray-800">
                                                                    {
                                                                        stock
                                                                    }
                                                                </span>
                                                        )}

                                                    </td>

                                                    {/* STATUS */}

                                                    <td className="p-4">

                                                            <span
                                                                className={`inline-flex px-3 py-1.5 rounded-full text-xs font-semibold ${status.className}`}
                                                            >
                                                                {
                                                                    status.label
                                                                }
                                                            </span>

                                                    </td>

                                                    {/* ACTION */}

                                                    <td className="p-4">

                                                        {isEditing ? (
                                                            <div className="flex gap-2">

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        saveStock(
                                                                            row.id
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        savingId ===
                                                                        row.id
                                                                    }
                                                                    className="bg-pink-600 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                                                                >
                                                                    {savingId ===
                                                                    row.id
                                                                        ? "Saving..."
                                                                        : "Save"}
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setEditingId(
                                                                            null
                                                                        );
                                                                        setEditingStock(
                                                                            ""
                                                                        );
                                                                    }}
                                                                    className="border px-4 py-2 rounded-lg text-sm"
                                                                >
                                                                    Cancel
                                                                </button>

                                                            </div>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setEditingId(
                                                                        row.id
                                                                    );
                                                                    setEditingStock(
                                                                        String(
                                                                            stock
                                                                        )
                                                                    );
                                                                }}
                                                                className="border border-pink-200 text-pink-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-pink-50"
                                                            >
                                                                Edit Stock
                                                            </button>
                                                        )}

                                                    </td>

                                                </tr>
                                            );
                                        }
                                    )}

                                    </tbody>

                                </table>

                            </div>
                        )}

                    </div>

                    {/* ==========================================
                        STOCK HISTORY
                    ========================================== */}

                    <div className="bg-white rounded-2xl shadow-sm border overflow-hidden mt-8">

                        <div className="px-5 py-5 border-b">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">

                                <div>
                                    <h2 className="font-bold text-gray-800 text-lg">
                                        Stock History
                                    </h2>

                                    <p className="text-sm text-gray-500 mt-1">
                                        Latest inventory movements
                                    </p>
                                </div>

                                <div className="text-sm text-gray-500">
                                    {movements.length} records
                                </div>

                            </div>
                        </div>

                        {historyLoading ? (
                            <div className="p-10 text-center text-gray-500">
                                Loading stock history...
                            </div>
                        ) : movements.length === 0 ? (
                            <div className="p-10 text-center">

                                <div className="text-5xl">
                                    📋
                                </div>

                                <h3 className="mt-4 font-bold text-gray-800">
                                    No stock history yet
                                </h3>

                                <p className="text-gray-500 mt-2">
                                    Stock changes will appear here.
                                </p>

                            </div>
                        ) : (
                            <div className="overflow-x-auto">

                                <table className="w-full min-w-[900px]">

                                    <thead>
                                    <tr className="bg-gray-50 text-left">

                                        <th className="p-4">
                                            Date
                                        </th>

                                        <th className="p-4">
                                            Product
                                        </th>

                                        <th className="p-4">
                                            SKU
                                        </th>

                                        <th className="p-4">
                                            Type
                                        </th>

                                        <th className="p-4">
                                            Change
                                        </th>

                                        <th className="p-4">
                                            Reason
                                        </th>

                                        <th className="p-4">
                                            Order
                                        </th>

                                    </tr>
                                    </thead>

                                    <tbody>

                                    {movements.map(
                                        (movement) => {
                                            const product =
                                                productMap.get(
                                                    movement.product_id
                                                );

                                            const variant =
                                                movement.variant_id
                                                    ? variantMap.get(
                                                        movement.variant_id
                                                    )
                                                    : undefined;

                                            const movementType =
                                                getMovementType(
                                                    movement.type
                                                );

                                            const quantity =
                                                Number(
                                                    movement.quantity
                                                ) || 0;

                                            const isIncrease =
                                                quantity > 0;

                                            return (
                                                <tr
                                                    key={
                                                        movement.id
                                                    }
                                                    className="border-t hover:bg-gray-50"
                                                >

                                                    {/* DATE */}

                                                    <td className="p-4 text-sm text-gray-600 whitespace-nowrap">
                                                        {formatDate(
                                                            movement.created_at
                                                        )}
                                                    </td>

                                                    {/* PRODUCT */}

                                                    <td className="p-4">

                                                        <p className="font-semibold text-gray-800">
                                                            {product?.title ||
                                                                `Product #${movement.product_id}`}
                                                        </p>

                                                        {variant?.size ||
                                                        variant?.color ? (
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                {variant?.size
                                                                    ? `Size: ${variant.size}`
                                                                    : ""}
                                                                {variant?.size &&
                                                                variant?.color
                                                                    ? " • "
                                                                    : ""}
                                                                {variant?.color
                                                                    ? `Color: ${variant.color}`
                                                                    : ""}
                                                            </p>
                                                        ) : null}

                                                    </td>

                                                    {/* SKU */}

                                                    <td className="p-4 text-sm text-gray-600">
                                                        {variant?.sku ||
                                                            "—"}
                                                    </td>

                                                    {/* TYPE */}

                                                    <td className="p-4">

                                                            <span
                                                                className={`inline-flex px-3 py-1.5 rounded-full text-xs font-semibold ${movementType.className}`}
                                                            >
                                                                {
                                                                    movementType.label
                                                                }
                                                            </span>

                                                    </td>

                                                    {/* CHANGE */}

                                                    <td className="p-4">

                                                            <span
                                                                className={`font-bold ${
                                                                    isIncrease
                                                                        ? "text-green-600"
                                                                        : "text-red-600"
                                                                }`}
                                                            >
                                                                {isIncrease
                                                                    ? "+"
                                                                    : ""}
                                                                {
                                                                    quantity
                                                                }
                                                            </span>

                                                    </td>

                                                    {/* REASON */}

                                                    <td className="p-4 text-sm text-gray-600">
                                                        {movement.reason ||
                                                            "—"}
                                                    </td>

                                                    {/* ORDER */}

                                                    <td className="p-4 text-sm text-gray-600">
                                                        {movement.order_id
                                                            ? `#${movement.order_id}`
                                                            : "—"}
                                                    </td>

                                                </tr>
                                            );
                                        }
                                    )}

                                    </tbody>

                                </table>

                            </div>
                        )}

                    </div>

                </div>

            </main>

            <Footer />
        </>
    );
}