"use client";

import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { useCart } from "../../components/context/CartContext";

type CartItem = {
    id: number;
    title: string;
    price: string | number;
    image: string;
    quantity: number;
    variantId?: number;
    sku?: string;
    size?: string;
    color?: string;
};

export default function Cart() {
    const { cart, increaseQuantity, decreaseQuantity, removeFromCart, clearCart } = useCart();
    const items = cart as CartItem[];

    const getNumericPrice = (price: string | number) => {
        const value = Number(String(price).replace(/[₹,\s]/g, ""));
        return Number.isFinite(value) ? value : 0;
    };

    const money = (value: number) => `₹${value.toLocaleString("en-IN")}`;

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce(
        (sum, item) => sum + getNumericPrice(item.price) * item.quantity,
        0
    );

    return (
        <>
            <Navbar />

            <main className="min-h-screen bg-[#fffafc]">
                <section className="border-b border-[#eee4e9] bg-[#fff7fa]">
                    <div className="mx-auto max-w-[1400px] px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#a9005d]">
                            APSRAA BY AVNI
                        </p>

                        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <h1 className="text-4xl font-semibold tracking-[-0.04em] text-[#182033] sm:text-5xl">
                                    Your bag
                                </h1>
                                {totalItems > 0 && (
                                    <p className="mt-2 text-sm text-[#77716d]">
                                        {totalItems} {totalItems === 1 ? "piece" : "pieces"} selected for you.
                                    </p>
                                )}
                            </div>

                            <Link
                                href="/shop"
                                className="text-xs font-semibold uppercase tracking-[0.16em] text-[#77716d] transition hover:text-[#a9005d]"
                            >
                                Continue shopping →
                            </Link>
                        </div>
                    </div>
                </section>

                {items.length === 0 ? (
                    <section className="px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
                        <div className="mx-auto max-w-2xl border border-[#eadfe5] bg-white px-6 py-16 text-center shadow-[0_20px_70px_rgba(30,20,30,0.06)] sm:px-12">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#fff0f6] text-2xl text-[#a9005d]">
                                ♡
                            </div>

                            <p className="mt-7 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#a9005d]">
                                Your APSRAA bag
                            </p>

                            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[#182033]">
                                Nothing here yet.
                            </h2>

                            <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#77716d]">
                                Discover pieces chosen to add a little shine to everyday moments.
                            </p>

                            <Link
                                href="/shop"
                                className="mt-8 inline-flex bg-[#a9005d] px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.15em] text-white transition hover:bg-[#182033]"
                            >
                                Discover the collection
                            </Link>
                        </div>
                    </section>
                ) : (
                    <section className="px-5 py-8 sm:px-8 sm:py-12 lg:px-12 lg:py-16">
                        <div className="mx-auto grid max-w-[1400px] items-start gap-8 lg:grid-cols-[minmax(0,1fr)_390px]">

                            <div>
                                <div className="mb-4 flex items-center justify-between">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#77716d]">
                                        Selected pieces
                                    </p>

                                    <button
                                        type="button"
                                        onClick={clearCart}
                                        className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#9a9390] transition hover:text-[#a9005d]"
                                    >
                                        Clear bag
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {items.map((item) => {
                                        const unitPrice = getNumericPrice(item.price);
                                        const lineTotal = unitPrice * item.quantity;

                                        return (
                                            <article
                                                key={`${item.id}-${item.variantId ?? "base"}`}
                                                className="border border-[#eadfe5] bg-white p-4 sm:p-5"
                                            >
                                                <div className="flex gap-4 sm:gap-6">
                                                    <Link
                                                        href={`/product/${item.id}`}
                                                        className="block h-28 w-24 shrink-0 overflow-hidden bg-[#f4efec] sm:h-36 sm:w-32"
                                                    >
                                                        <img
                                                            src={item.image}
                                                            alt={item.title}
                                                            className="h-full w-full object-cover transition duration-500 hover:scale-[1.025]"
                                                        />
                                                    </Link>

                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div className="min-w-0">
                                                                <Link
                                                                    href={`/product/${item.id}`}
                                                                    className="block text-base font-medium leading-6 text-[#292624] transition hover:text-[#a9005d] sm:text-lg"
                                                                >
                                                                    {item.title}
                                                                </Link>

                                                                {(item.color || item.size || item.sku) && (
                                                                    <div className="mt-2 space-y-1 text-xs text-[#77716d]">
                                                                        {item.color && <p>Color: <span className="text-[#292624]">{item.color}</span></p>}
                                                                        {item.size && <p>Size: <span className="text-[#292624]">{item.size}</span></p>}
                                                                        {item.sku && <p>SKU: <span className="text-[#8a8380]">{item.sku}</span></p>}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <button
                                                                type="button"
                                                                onClick={() => removeFromCart(item.id, item.variantId)}
                                                                className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9a9390] transition hover:text-[#a9005d]"
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>

                                                        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                                                            <div className="inline-flex h-10 items-center border border-[#dcd3d7] bg-white">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => decreaseQuantity(item.id, item.variantId)}
                                                                    className="h-full w-10 text-lg text-[#55504d] transition hover:bg-[#fff0f6] hover:text-[#a9005d]"
                                                                    aria-label={`Decrease quantity of ${item.title}`}
                                                                >
                                                                    −
                                                                </button>

                                                                <span className="w-10 text-center text-sm font-medium text-[#292624]">
                                                                    {item.quantity}
                                                                </span>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => increaseQuantity(item.id, item.variantId)}
                                                                    className="h-full w-10 text-lg text-[#55504d] transition hover:bg-[#fff0f6] hover:text-[#a9005d]"
                                                                    aria-label={`Increase quantity of ${item.title}`}
                                                                >
                                                                    +
                                                                </button>
                                                            </div>

                                                            <div className="text-right">
                                                                <p className="text-base font-semibold text-[#292624]">
                                                                    {money(lineTotal)}
                                                                </p>

                                                                {item.quantity > 1 && (
                                                                    <p className="mt-1 text-[10px] text-[#9a9390]">
                                                                        {money(unitPrice)} each
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>

                                <div className="mt-6 grid grid-cols-3 border border-[#eadfe5] bg-white">
                                    <div className="border-r border-[#eadfe5] px-3 py-4 text-center">
                                        <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#292624]">Secure</p>
                                        <p className="mt-1 text-[9px] text-[#9a9390]">Payments</p>
                                    </div>
                                    <div className="border-r border-[#eadfe5] px-3 py-4 text-center">
                                        <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#292624]">Free</p>
                                        <p className="mt-1 text-[9px] text-[#9a9390]">Shipping</p>
                                    </div>
                                    <div className="px-3 py-4 text-center">
                                        <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#292624]">Track</p>
                                        <p className="mt-1 text-[9px] text-[#9a9390]">Your order</p>
                                    </div>
                                </div>
                            </div>

                            <aside className="lg:sticky lg:top-24">
                                <div className="border border-[#eadfe5] bg-white p-6 shadow-[0_20px_70px_rgba(30,20,30,0.06)] sm:p-7">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#a9005d]">
                                        Your order
                                    </p>

                                    <h2 className="mt-3 text-2xl font-semibold tracking-[-0.025em] text-[#182033]">
                                        Order summary
                                    </h2>

                                    <div className="mt-7 space-y-4 border-b border-[#eee4e9] pb-6">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-[#77716d]">Items</span>
                                            <span className="font-medium text-[#292624]">{totalItems}</span>
                                        </div>

                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-[#77716d]">Subtotal</span>
                                            <span className="font-medium text-[#292624]">{money(subtotal)}</span>
                                        </div>

                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-[#77716d]">Shipping</span>
                                            <span className="font-semibold text-[#138a48]">FREE</span>
                                        </div>

                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-[#77716d]">Taxes</span>
                                            <span className="text-[#292624]">Included</span>
                                        </div>
                                    </div>

                                    <div className="flex items-end justify-between py-6">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#77716d]">
                                            Total
                                        </p>

                                        <p className="text-3xl font-semibold tracking-[-0.03em] text-[#a9005d]">
                                            {money(subtotal)}
                                        </p>
                                    </div>

                                    <Link
                                        href="/checkout"
                                        className="flex w-full items-center justify-center bg-[#a9005d] px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#182033]"
                                    >
                                        Proceed to checkout →
                                    </Link>

                                    <p className="mt-4 text-center text-[10px] leading-5 text-[#9a9390]">
                                        Secure checkout · Your details are protected
                                    </p>
                                </div>

                                <Link
                                    href="/shop"
                                    className="mt-4 flex items-center justify-center border border-[#dcd3d7] bg-white px-6 py-3.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#55504d] transition hover:border-[#a9005d] hover:text-[#a9005d]"
                                >
                                    Continue shopping
                                </Link>
                            </aside>
                        </div>
                    </section>
                )}
            </main>

            <Footer />
        </>
    );
}
