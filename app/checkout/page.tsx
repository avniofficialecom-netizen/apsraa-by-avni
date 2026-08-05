"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { useCart } from "../../components/context/CartContext";

declare global {
    interface Window {
        Razorpay: any;
    }
}

export default function Checkout() {
    const { cart, clearCart } = useCart();
    const router = useRouter();

    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState("");
    const [city, setCity] = useState("");
    const [state, setState] = useState("");
    const [pincode, setPincode] = useState("");

    const total = cart.reduce(
        (sum, item) =>
            sum +
            Number(item.price.replace("₹", "")) *
            item.quantity,
        0
    );

    const loadRazorpay = () => {
        return new Promise((resolve) => {
            const script =
                document.createElement("script");

            script.src =
                "https://checkout.razorpay.com/v1/checkout.js";

            script.onload = () => resolve(true);

            script.onerror = () => resolve(false);

            document.body.appendChild(script);
        });
    };

    const placeOrder = async () => {
        if (!name || !phone || !address) {
            alert("Please fill Name, Phone and Address.");
            return;
        }

        if (cart.length === 0) {
            alert("Your cart is empty.");
            return;
        }

        const loaded = await loadRazorpay();

        if (!loaded) {
            alert("Failed to load Razorpay.");
            return;
        }

        const createOrderResponse = await fetch("/api/create-order", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                amount: total,
            }),
        });

        if (!createOrderResponse.ok) {
            alert("Unable to create Razorpay order.");
            return;
        }

        const razorpayOrder = await createOrderResponse.json();

        const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,

            amount: razorpayOrder.amount,

            currency: razorpayOrder.currency,

            name: "APSRAA BY AVNI",

            description: "Jewellery Purchase",

            image: "/logo.png",

            order_id: razorpayOrder.id,

            prefill: {
                name,
                email,
                contact: phone,
            },

            theme: {
                color: "#db2777",
            },

            handler: async (response: any) => {

                const verifyResponse = await fetch("/api/verify-payment", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(response),
                });

                const verify = await verifyResponse.json();
                console.log("VERIFY:", verify);

                if (!verify.success) {
                    alert("Payment verification failed.");
                    return;
                }

                // Save Order
                // ==============================
// Verify Latest Stock
// ==============================

                for (const item of cart) {

                    const { data: product, error } = await supabase
                        .from("products")
                        .select("stock,title")
                        .eq("id", item.id)
                        .single();

                    if (error) {
                        alert("Unable to verify stock.");
                        return;
                    }

                    if (product.stock <= 0) {
                        alert(`${product.title} is now Out of Stock.`);
                        return;
                    }

                    if (product.stock < item.quantity) {
                        alert(
                            `${product.title} has only ${product.stock} item(s) left in stock.`
                        );
                        return;
                    }

                }
                const { data: order, error: orderError } = await supabase
                    .from("orders")
                    .insert([
                        {
                            customer_name: name,
                            phone,
                            address: `${address}, ${city}, ${state} - ${pincode}`,
                            total: total.toString(),
                            status: "Pending",
                        },
                    ])
                    .select()
                    .single();

                if (orderError) {
                    alert(orderError.message);
                    return;
                }
                // Save Order Items
                const orderItems = cart.map((item) => ({
                    order_id: order.id,
                    product_id: item.id,
                    title: item.title,
                    price: item.price,
                    quantity: item.quantity,
                }));

                const { error: itemsError } = await supabase
                    .from("order_items")
                    .insert(orderItems);

                if (itemsError) {
                    alert(itemsError.message);
                    return;
                }

                // Reduce Stock
                for (const item of cart) {

                    const { data: product, error } = await supabase
                        .from("products")
                        .select("stock")
                        .eq("id", item.id)
                        .single();

                    if (error) {
                        console.error(error);
                        continue;
                    }

                    const newStock = Math.max(
                        0,
                        product.stock - item.quantity
                    );

                    await supabase
                        .from("products")
                        .update({
                            stock: newStock,
                        })
                        .eq("id", item.id);
                }

                clearCart();

                router.push("/success");
            },

            modal: {
                ondismiss: () => {
                    console.log("Payment cancelled");
                },
            },
        };

        const paymentObject = new window.Razorpay(options);

        paymentObject.open();

    };
    return (
        <>
            <Navbar />

            <section className="min-h-screen bg-pink-50 py-20">

                <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 px-8">

                    {/* Customer Details */}

                    <div className="bg-white rounded-2xl shadow-lg p-8">

                        <h2 className="text-3xl font-bold text-pink-700 mb-6">
                            Checkout
                        </h2>

                        <input
                            type="text"
                            placeholder="Full Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full border rounded-lg p-3 mb-4"
                        />

                        <input
                            type="tel"
                            placeholder="Mobile Number"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full border rounded-lg p-3 mb-4"
                        />

                        <input
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full border rounded-lg p-3 mb-4"
                        />

                        <textarea
                            placeholder="Full Address"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full border rounded-lg p-3 mb-4 h-28"
                        />

                        <input
                            type="text"
                            placeholder="City"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="w-full border rounded-lg p-3 mb-4"
                        />

                        <input
                            type="text"
                            placeholder="State"
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            className="w-full border rounded-lg p-3 mb-4"
                        />

                        <input
                            type="text"
                            placeholder="Pincode"
                            value={pincode}
                            onChange={(e) => setPincode(e.target.value)}
                            className="w-full border rounded-lg p-3"
                        />

                    </div>

                    {/* Order Summary */}

                    <div className="bg-white rounded-2xl shadow-lg p-8">

                        <h2 className="text-3xl font-bold text-pink-700 mb-6">
                            Order Summary
                        </h2>

                        {cart.length === 0 ? (

                            <p className="text-gray-500">
                                Your cart is empty.
                            </p>

                        ) : (

                            cart.map((item) => (

                                <div
                                    key={item.id}
                                    className="flex justify-between mb-4"
                                >

                                    <span>
                                        {item.title} × {item.quantity}
                                    </span>

                                    <span>{item.price}</span>

                                </div>

                            ))

                        )}

                        <hr className="my-6" />

                        <div className="flex justify-between text-2xl font-bold">

                            <span>Total</span>

                            <span>₹{total}</span>

                        </div>

                        <button
                            type="button"
                            onClick={placeOrder}
                            className="w-full mt-8 bg-pink-600 text-white py-4 rounded-full hover:bg-pink-700 transition"
                        >
                            Proceed to Payment
                        </button>
                    </div>

                </div>

            </section>

            <Footer />
        </>
    );
}