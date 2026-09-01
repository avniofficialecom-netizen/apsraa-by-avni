"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { useCart } from "../../components/context/CartContext";

declare global {
    interface Window {
        Razorpay: any;
    }
}

type PaymentMethod = "cod" | "online";

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

    const [paymentMethod, setPaymentMethod] =
        useState<PaymentMethod>("online");

    const [pincodeVerified, setPincodeVerified] =
        useState(false);
    const [pincodeLoading, setPincodeLoading] =
        useState(false);
    const [pincodeError, setPincodeError] =
        useState("");
    const [processing, setProcessing] =
        useState(false);

    useEffect(() => {
        const savedName =
            localStorage.getItem("apsraa_checkout_name");
        const savedEmail =
            localStorage.getItem("apsraa_checkout_email");

        if (savedName) setName(savedName);
        if (savedEmail) setEmail(savedEmail);
    }, []);

    useEffect(() => {
        if (name.trim()) {
            localStorage.setItem(
                "apsraa_checkout_name",
                name.trim()
            );
        }
    }, [name]);

    useEffect(() => {
        if (email.trim()) {
            localStorage.setItem(
                "apsraa_checkout_email",
                email.trim()
            );
        }
    }, [email]);

    const money = (value: number) =>
        `₹${value.toLocaleString("en-IN", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        })}`;

    const getPrice = (price: string | number) => {
        const value = Number(
            String(price).replace(/[₹,\s]/g, "")
        );
        return Number.isFinite(value) ? value : 0;
    };

    const total = cart.reduce(
        (sum, item) =>
            sum +
            getPrice(item.price) * item.quantity,
        0
    );

    const itemCount = cart.reduce(
        (sum, item) => sum + item.quantity,
        0
    );

    const loadRazorpay = () =>
        new Promise<boolean>((resolve) => {
            if (window.Razorpay) {
                resolve(true);
                return;
            }

            const script =
                document.createElement("script");

            script.src =
                "https://checkout.razorpay.com/v1/checkout.js";

            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);

            document.body.appendChild(script);
        });

    const handlePhoneChange = (value: string) => {
        setPhone(
            value.replace(/\D/g, "").slice(0, 10)
        );
    };

    const verifyPincode = async (value: string) => {
        const cleanPincode = value
            .replace(/\D/g, "")
            .slice(0, 6);

        setPincode(cleanPincode);
        setPincodeVerified(false);
        setPincodeError("");
        setCity("");
        setState("");

        if (cleanPincode.length !== 6) {
            return;
        }

        setPincodeLoading(true);

        try {
            const response = await fetch(
                `/api/pincode/${cleanPincode}`,
                {
                    method: "GET",
                    cache: "no-store",
                }
            );

            const data = await response.json();

            if (!response.ok || !data?.success) {
                setPincodeError(
                    data?.message ||
                    "We couldn't verify that PIN code."
                );
                return;
            }

            setCity(data.city || "");
            setState(data.state || "");
            setPincodeVerified(true);
        } catch (error) {
            console.error(
                "PIN CODE VERIFICATION ERROR:",
                error
            );

            setPincodeError(
                "We couldn't verify the PIN right now. Please try again."
            );
        } finally {
            setPincodeLoading(false);
        }
    };

    const validateCustomerDetails = () => {
        const cleanName = name.trim();
        const cleanPhone = phone.replace(/\D/g, "");
        const cleanEmail = email.trim();
        const cleanAddress = address.trim();
        const cleanCity = city.trim();
        const cleanState = state.trim();
        const cleanPincode = pincode.replace(/\D/g, "");

        if (cleanName.length < 2) {
            alert("Please enter your full name.");
            return null;
        }

        if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
            alert(
                "Please enter a valid 10-digit Indian mobile number."
            );
            return null;
        }

        if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                cleanEmail
            )
        ) {
            alert("Please enter a valid email address.");
            return null;
        }

        if (cleanAddress.length < 10) {
            alert(
                "Please enter your complete delivery address."
            );
            return null;
        }

        if (!pincodeVerified) {
            alert(
                "Please enter and verify your 6-digit PIN code."
            );
            return null;
        }

        if (cleanCity.length < 2) {
            alert("Please verify your city.");
            return null;
        }

        if (cleanState.length < 2) {
            alert("Please verify your state.");
            return null;
        }

        if (!/^\d{6}$/.test(cleanPincode)) {
            alert("Please enter a valid 6-digit PIN code.");
            return null;
        }

        if (cart.length === 0) {
            alert("Your bag is empty.");
            return null;
        }

        return {
            cleanName,
            cleanPhone,
            cleanEmail,
            cleanAddress,
            cleanCity,
            cleanState,
            cleanPincode,
        };
    };

    const sendOrderEmail = async (
        orderId: number,
        cleanEmail: string,
        cleanPhone: string
    ) => {
        try {
            const response = await fetch(
                "/api/send-order-email",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        orderId,
                        email: cleanEmail,
                        phone: cleanPhone,
                    }),
                }
            );

            const result = await response.json();

            if (!response.ok || !result?.success) {
                console.error(
                    "ORDER EMAIL FAILED:",
                    result
                );
            }
        } catch (error) {
            console.error(
                "ORDER EMAIL ERROR:",
                error
            );
        }
    };

    const placeCODOrder = async (
        customerData: NonNullable<
            ReturnType<typeof validateCustomerDetails>
        >
    ) => {
        const {
            cleanName,
            cleanPhone,
            cleanEmail,
            cleanAddress,
            cleanCity,
            cleanState,
            cleanPincode,
        } = customerData;

        const response = await fetch(
            "/api/create-cod-order",
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json",
                },
                body: JSON.stringify({
                    customer: {
                        name: cleanName,
                        phone: cleanPhone,
                        email: cleanEmail,
                        address: cleanAddress,
                        city: cleanCity,
                        state: cleanState,
                        pincode: cleanPincode,
                    },
                    items: cart.map((item) => ({
                        id: item.id,
                        quantity: item.quantity,
                        variantId:
                            item.variantId ??
                            undefined,
                    })),
                }),
            }
        );

        const result = await response.json();

        if (
            !response.ok ||
            !result.success ||
            !result.order
        ) {
            throw new Error(
                result.message ||
                "Unable to place COD order."
            );
        }

        clearCart();

        router.push(
            `/success?orderId=${result.order.id}&paymentMethod=cod`
        );
    };

    const placeOnlineOrder = async (
        customerData: NonNullable<
            ReturnType<typeof validateCustomerDetails>
        >
    ) => {
        const {
            cleanName,
            cleanPhone,
            cleanEmail,
            cleanAddress,
            cleanCity,
            cleanState,
            cleanPincode,
        } = customerData;

        const loaded = await loadRazorpay();

        if (!loaded) {
            throw new Error(
                "Secure payment could not be loaded. Please try again."
            );
        }

        const createOrderResponse =
            await fetch("/api/create-order", {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json",
                },
                body: JSON.stringify({
                    items: cart.map((item) => ({
                        id: item.id,
                        quantity: item.quantity,
                        variantId:
                            item.variantId ??
                            undefined,
                    })),
                }),
            });

        const razorpayOrder =
            await createOrderResponse.json();

        if (
            !createOrderResponse.ok ||
            !razorpayOrder.success
        ) {
            throw new Error(
                razorpayOrder.message ||
                "Unable to create the payment order."
            );
        }

        const options = {
            key:
                process.env
                    .NEXT_PUBLIC_RAZORPAY_KEY_ID,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            name: "APSRAA BY AVNI",
            description: "Jewellery Purchase",
            image: "/logo.png",
            order_id: razorpayOrder.id,

            prefill: {
                name: cleanName,
                email: cleanEmail,
                contact: cleanPhone,
            },

            theme: {
                color: "#b80062",
            },

            handler: async (response: any) => {
                try {
                    const verifyResponse =
                        await fetch(
                            "/api/verify-payment",
                            {
                                method: "POST",
                                headers: {
                                    "Content-Type":
                                        "application/json",
                                },
                                body: JSON.stringify({
                                    razorpay_order_id:
                                        response.razorpay_order_id,
                                    razorpay_payment_id:
                                        response.razorpay_payment_id,
                                    razorpay_signature:
                                        response.razorpay_signature,

                                    customer: {
                                        name: cleanName,
                                        phone: cleanPhone,
                                        email: cleanEmail,
                                        address: cleanAddress,
                                        city: cleanCity,
                                        state: cleanState,
                                        pincode: cleanPincode,
                                    },

                                    items: cart.map(
                                        (item) => ({
                                            id: item.id,
                                            quantity:
                                                item.quantity,
                                            variantId:
                                                item.variantId ??
                                                undefined,
                                        })
                                    ),
                                }),
                            }
                        );

                    const verify =
                        await verifyResponse.json();

                    if (
                        !verifyResponse.ok ||
                        !verify.success ||
                        !verify.order
                    ) {
                        throw new Error(
                            verify.message ||
                            "Payment verification failed."
                        );
                    }

                    const order = verify.order;

                    const stockResponse =
                        await fetch(
                            "/api/reduce-stock",
                            {
                                method: "POST",
                                headers: {
                                    "Content-Type":
                                        "application/json",
                                },
                                body: JSON.stringify({
                                    orderId: order.id,
                                    razorpay_payment_id:
                                        response.razorpay_payment_id,
                                    razorpay_signature:
                                        response.razorpay_signature,
                                }),
                            }
                        );

                    const stockResult =
                        await stockResponse.json();

                    if (
                        !stockResponse.ok ||
                        !stockResult.success
                    ) {
                        throw new Error(
                            stockResult.message ||
                            "Payment succeeded, but stock could not be updated."
                        );
                    }

                    await sendOrderEmail(
                        order.id,
                        cleanEmail,
                        cleanPhone
                    );

                    clearCart();

                    router.push(
                        `/success?orderId=${order.id}&paymentMethod=razorpay`
                    );
                } catch (error) {
                    console.error(
                        "PAYMENT HANDLER ERROR:",
                        error
                    );

                    alert(
                        error instanceof Error
                            ? error.message
                            : "Something went wrong after payment."
                    );

                    setProcessing(false);
                }
            },

            modal: {
                ondismiss: () => {
                    setProcessing(false);
                },
            },
        };

        const paymentObject =
            new window.Razorpay(options);

        paymentObject.open();
    };

    const placeOrder = async () => {
        if (processing) return;

        const customerData =
            validateCustomerDetails();

        if (!customerData) return;

        setProcessing(true);

        try {
            if (paymentMethod === "cod") {
                await placeCODOrder(customerData);
            } else {
                await placeOnlineOrder(customerData);
            }
        } catch (error) {
            console.error(
                "CHECKOUT ERROR:",
                error
            );

            alert(
                error instanceof Error
                    ? error.message
                    : "Something went wrong while placing your order."
            );

            setProcessing(false);
        }
    };

    if (cart.length === 0) {
        return (
            <>
                <Navbar />

                <main className="min-h-[70vh] bg-[#fffafc] px-5 py-20">
                    <div className="mx-auto max-w-2xl border border-[#eadfe5] bg-white px-6 py-16 text-center shadow-[0_20px_70px_rgba(30,20,30,0.06)]">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#b80062]">
                            APSRAA BY AVNI
                        </p>

                        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-[#182033]">
                            Your bag is empty
                        </h1>

                        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#77716d]">
                            Discover something beautiful and
                            come back here when you're ready
                            to make it yours.
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                router.push("/shop")
                            }
                            className="mt-8 bg-[#b80062] px-8 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#182033]"
                        >
                            Discover the collection
                        </button>
                    </div>
                </main>

                <Footer />
            </>
        );
    }

    return (
        <>
            <Navbar />

            <main className="min-h-screen bg-[#fffafc]">

                {/* ==========================================
                    CHECKOUT INTRO
                ========================================== */}

                <section className="border-b border-[#eee4e9] bg-[#fff7fa]">
                    <div className="mx-auto max-w-[1320px] px-5 py-9 sm:px-8 lg:px-12 lg:py-12">

                        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#b80062]">
                                    APSRAA BY AVNI
                                </p>

                                <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] text-[#182033] sm:text-5xl">
                                    Complete your order
                                </h1>

                                <p className="mt-2 text-sm text-[#77716d]">
                                    Almost yours. Add your delivery
                                    details and choose how you'd like
                                    to pay.
                                </p>
                            </div>

                            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#77716d]">
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#b80062] text-white">
                                    1
                                </span>
                                Details
                                <span className="mx-1 h-px w-8 bg-[#d9cbd2]" />
                                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#d9cbd2] bg-white text-[#77716d]">
                                    2
                                </span>
                                Payment
                            </div>

                        </div>

                    </div>
                </section>

                <section className="px-5 py-8 sm:px-8 sm:py-12 lg:px-12 lg:py-14">

                    <div className="mx-auto grid max-w-[1320px] items-start gap-8 lg:grid-cols-[minmax(0,1fr)_410px]">

                        {/* ======================================
                            CUSTOMER DETAILS
                        ====================================== */}

                        <div className="border border-[#eadfe5] bg-white p-6 shadow-[0_20px_70px_rgba(30,20,30,0.05)] sm:p-8 lg:p-9">

                            <div className="flex items-start justify-between gap-5 border-b border-[#eee4e9] pb-6">

                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#b80062]">
                                        Step 1
                                    </p>

                                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#182033]">
                                        Delivery details
                                    </h2>

                                    <p className="mt-1 text-sm text-[#77716d]">
                                        Where should we send your
                                        APSRAA pieces?
                                    </p>
                                </div>

                                <span className="hidden text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9a9390] sm:block">
                                    * Required
                                </span>

                            </div>

                            <div className="mt-7 space-y-6">

                                {/* NAME + PHONE */}

                                <div className="grid gap-5 sm:grid-cols-2">

                                    <label className="block">
                                        <span className="mb-2 block text-xs font-semibold text-[#292624]">
                                            Full name
                                            <em className="ml-1 not-italic text-[#b80062]">*</em>
                                        </span>

                                        <input
                                            type="text"
                                            placeholder="Your full name"
                                            value={name}
                                            onChange={(e) =>
                                                setName(e.target.value)
                                            }
                                            autoComplete="name"
                                            className="w-full border border-[#dcd3d7] bg-white px-4 py-3.5 text-sm text-[#292624] outline-none transition placeholder:text-[#aaa3a0] focus:border-[#b80062] focus:ring-1 focus:ring-[#b80062]"
                                        />
                                    </label>

                                    <label className="block">
                                        <span className="mb-2 block text-xs font-semibold text-[#292624]">
                                            Mobile number
                                            <em className="ml-1 not-italic text-[#b80062]">*</em>
                                        </span>

                                        <input
                                            type="tel"
                                            inputMode="numeric"
                                            maxLength={10}
                                            placeholder="10-digit mobile number"
                                            value={phone}
                                            onChange={(e) =>
                                                handlePhoneChange(
                                                    e.target.value
                                                )
                                            }
                                            autoComplete="tel"
                                            className="w-full border border-[#dcd3d7] bg-white px-4 py-3.5 text-sm text-[#292624] outline-none transition placeholder:text-[#aaa3a0] focus:border-[#b80062] focus:ring-1 focus:ring-[#b80062]"
                                        />
                                    </label>

                                </div>

                                {/* EMAIL */}

                                <label className="block">
                                    <span className="mb-2 block text-xs font-semibold text-[#292624]">
                                        Email address
                                        <em className="ml-1 not-italic text-[#b80062]">*</em>
                                    </span>

                                    <input
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) =>
                                            setEmail(e.target.value)
                                        }
                                        autoComplete="email"
                                        className="w-full border border-[#dcd3d7] bg-white px-4 py-3.5 text-sm text-[#292624] outline-none transition placeholder:text-[#aaa3a0] focus:border-[#b80062] focus:ring-1 focus:ring-[#b80062]"
                                    />

                                    <p className="mt-2 text-[11px] text-[#9a9390]">
                                        We'll use this for your order
                                        confirmation.
                                    </p>
                                </label>

                                {/* ADDRESS */}

                                <label className="block">
                                    <span className="mb-2 block text-xs font-semibold text-[#292624]">
                                        Delivery address
                                        <em className="ml-1 not-italic text-[#b80062]">*</em>
                                    </span>

                                    <textarea
                                        placeholder="House / Flat No., Street, Area / Locality"
                                        value={address}
                                        onChange={(e) =>
                                            setAddress(e.target.value)
                                        }
                                        autoComplete="street-address"
                                        rows={4}
                                        className="w-full resize-none border border-[#dcd3d7] bg-white px-4 py-3.5 text-sm text-[#292624] outline-none transition placeholder:text-[#aaa3a0] focus:border-[#b80062] focus:ring-1 focus:ring-[#b80062]"
                                    />
                                </label>

                                {/* PIN + CITY */}

                                <div className="grid gap-5 sm:grid-cols-[0.8fr_1.2fr]">

                                    <label className="block">
                                        <span className="mb-2 block text-xs font-semibold text-[#292624]">
                                            PIN code
                                            <em className="ml-1 not-italic text-[#b80062]">*</em>
                                        </span>

                                        <div className="relative">
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={6}
                                                placeholder="6-digit PIN"
                                                value={pincode}
                                                onChange={(e) =>
                                                    verifyPincode(
                                                        e.target.value
                                                    )
                                                }
                                                autoComplete="postal-code"
                                                className={`w-full border bg-white px-4 py-3.5 pr-10 text-sm text-[#292624] outline-none transition placeholder:text-[#aaa3a0] focus:ring-1 ${
                                                    pincodeVerified
                                                        ? "border-[#16834a] focus:border-[#16834a] focus:ring-[#16834a]"
                                                        : "border-[#dcd3d7] focus:border-[#b80062] focus:ring-[#b80062]"
                                                }`}
                                            />

                                            {pincodeVerified && (
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[#16834a]">
                                                    ✓
                                                </span>
                                            )}
                                        </div>

                                        {pincodeLoading && (
                                            <p className="mt-2 text-[11px] text-[#77716d]">
                                                Verifying your PIN…
                                            </p>
                                        )}

                                        {pincodeError && (
                                            <p className="mt-2 text-[11px] text-[#b42318]">
                                                {pincodeError}
                                            </p>
                                        )}

                                        {pincodeVerified && (
                                            <p className="mt-2 text-[11px] font-medium text-[#16834a]">
                                                PIN verified successfully.
                                            </p>
                                        )}
                                    </label>

                                    <div className="grid gap-5 sm:grid-cols-2">

                                        <label className="block">
                                            <span className="mb-2 block text-xs font-semibold text-[#292624]">
                                                City
                                            </span>

                                            <input
                                                type="text"
                                                value={city}
                                                readOnly
                                                placeholder="Verified from PIN"
                                                className="w-full border border-[#dcd3d7] bg-[#faf8f8] px-4 py-3.5 text-sm text-[#292624] outline-none placeholder:text-[#aaa3a0]"
                                            />
                                        </label>

                                        <label className="block">
                                            <span className="mb-2 block text-xs font-semibold text-[#292624]">
                                                State
                                            </span>

                                            <input
                                                type="text"
                                                value={state}
                                                readOnly
                                                placeholder="Verified from PIN"
                                                className="w-full border border-[#dcd3d7] bg-[#faf8f8] px-4 py-3.5 text-sm text-[#292624] outline-none placeholder:text-[#aaa3a0]"
                                            />
                                        </label>

                                    </div>

                                </div>

                            </div>

                            {/* DELIVERY NOTE */}

                            <div className="mt-7 flex gap-3 border border-[#eee4e9] bg-[#fffafc] p-4">
                                <span className="mt-0.5 text-[#b80062]">
                                    ♡
                                </span>

                                <p className="text-xs leading-5 text-[#77716d]">
                                    Your delivery details are used only
                                    to process and deliver this order.
                                </p>
                            </div>

                        </div>

                        {/* ======================================
                            ORDER + PAYMENT
                        ====================================== */}

                        <aside className="lg:sticky lg:top-24">

                            <div className="border border-[#eadfe5] bg-white p-6 shadow-[0_20px_70px_rgba(30,20,30,0.06)] sm:p-7">

                                <div className="border-b border-[#eee4e9] pb-5">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#b80062]">
                                        Your selection
                                    </p>

                                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#182033]">
                                        Order summary
                                    </h2>
                                </div>

                                {/* PRODUCTS */}

                                <div className="mt-5 max-h-[300px] space-y-4 overflow-auto pr-1">

                                    {cart.map((item) => (
                                        <div
                                            key={`${item.id}-${item.variantId ?? "product"}`}
                                            className="flex gap-3"
                                        >
                                            <div className="h-20 w-16 shrink-0 overflow-hidden bg-[#f4efec]">
                                                <img
                                                    src={item.image}
                                                    alt={item.title}
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <p className="line-clamp-2 text-sm font-medium leading-5 text-[#292624]">
                                                    {item.title}
                                                </p>

                                                <p className="mt-1 text-[11px] text-[#9a9390]">
                                                    Qty {item.quantity}
                                                    {item.color
                                                        ? ` · ${item.color}`
                                                        : ""}
                                                </p>
                                            </div>

                                            <p className="shrink-0 text-sm font-semibold text-[#292624]">
                                                {money(
                                                    getPrice(
                                                        item.price
                                                    ) *
                                                        item.quantity
                                                )}
                                            </p>
                                        </div>
                                    ))}

                                </div>

                                {/* TOTALS */}

                                <div className="mt-5 space-y-3 border-t border-[#eee4e9] pt-5 text-sm">

                                    <div className="flex justify-between">
                                        <span className="text-[#77716d]">
                                            {itemCount}{" "}
                                            {itemCount === 1
                                                ? "item"
                                                : "items"}
                                        </span>

                                        <span className="font-medium text-[#292624]">
                                            {money(total)}
                                        </span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-[#77716d]">
                                            Shipping
                                        </span>

                                        <span className="font-semibold text-[#16834a]">
                                            FREE
                                        </span>
                                    </div>

                                </div>

                                <div className="mt-5 flex items-end justify-between border-t border-[#eee4e9] pt-5">
                                    <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#77716d]">
                                            Total
                                        </p>

                                        <p className="mt-1 text-[11px] text-[#9a9390]">
                                            Inclusive of applicable taxes
                                        </p>
                                    </div>

                                    <p className="text-3xl font-semibold tracking-[-0.04em] text-[#b80062]">
                                        {money(total)}
                                    </p>
                                </div>

                                {/* PAYMENT */}

                                <div className="mt-7">

                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#b80062]">
                                                Step 2
                                            </p>

                                            <h3 className="mt-2 text-xl font-semibold tracking-[-0.025em] text-[#182033]">
                                                Payment
                                            </h3>
                                        </div>
                                    </div>

                                    <div className="mt-4 space-y-3">

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setPaymentMethod(
                                                    "online"
                                                )
                                            }
                                            className={`w-full border p-4 text-left transition ${
                                                paymentMethod ===
                                                "online"
                                                    ? "border-[#b80062] bg-[#fff5fa]"
                                                    : "border-[#dcd3d7] bg-white hover:border-[#c7aeb9]"
                                            }`}
                                        >
                                            <div className="flex gap-3">

                                                <span
                                                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                                                        paymentMethod ===
                                                        "online"
                                                            ? "border-[#b80062]"
                                                            : "border-[#c9c1bf]"
                                                    }`}
                                                >
                                                    {paymentMethod ===
                                                        "online" && (
                                                        <span className="h-2.5 w-2.5 rounded-full bg-[#b80062]" />
                                                    )}
                                                </span>

                                                <div>
                                                    <p className="text-sm font-semibold text-[#292624]">
                                                        Pay online
                                                    </p>

                                                    <p className="mt-1 text-xs leading-5 text-[#77716d]">
                                                        UPI, cards, net banking
                                                        and more through Razorpay.
                                                    </p>
                                                </div>

                                            </div>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setPaymentMethod(
                                                    "cod"
                                                )
                                            }
                                            className={`w-full border p-4 text-left transition ${
                                                paymentMethod ===
                                                "cod"
                                                    ? "border-[#16834a] bg-[#f5fbf7]"
                                                    : "border-[#dcd3d7] bg-white hover:border-[#a9cdb8]"
                                            }`}
                                        >
                                            <div className="flex gap-3">

                                                <span
                                                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                                                        paymentMethod ===
                                                        "cod"
                                                            ? "border-[#16834a]"
                                                            : "border-[#c9c1bf]"
                                                    }`}
                                                >
                                                    {paymentMethod ===
                                                        "cod" && (
                                                        <span className="h-2.5 w-2.5 rounded-full bg-[#16834a]" />
                                                    )}
                                                </span>

                                                <div>
                                                    <p className="text-sm font-semibold text-[#292624]">
                                                        Cash on delivery
                                                    </p>

                                                    <p className="mt-1 text-xs leading-5 text-[#77716d]">
                                                        Pay when your order arrives.
                                                    </p>
                                                </div>

                                            </div>
                                        </button>

                                    </div>

                                    <div
                                        className={`mt-4 border p-3.5 ${
                                            paymentMethod === "cod"
                                                ? "border-[#d7eadf] bg-[#f5fbf7]"
                                                : "border-[#ead7e1] bg-[#fff7fb]"
                                        }`}
                                    >
                                        <p className="text-[11px] leading-5 text-[#77716d]">
                                            {paymentMethod === "cod"
                                                ? "Cash on delivery is selected. You'll pay when your APSRAA order arrives."
                                                : "You'll be taken to Razorpay's secure checkout to complete your payment."}
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={placeOrder}
                                        disabled={
                                            processing ||
                                            cart.length === 0
                                        }
                                        className={`mt-5 flex w-full items-center justify-center px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                            paymentMethod === "cod"
                                                ? "bg-[#16834a] hover:bg-[#126b3c]"
                                                : "bg-[#b80062] hover:bg-[#182033]"
                                        }`}
                                    >
                                        {processing
                                            ? "Processing your order…"
                                            : paymentMethod === "cod"
                                                ? "Place COD order →"
                                                : "Continue to secure payment →"}
                                    </button>

                                    <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-[#9a9390]">
                                        <span>Secure checkout</span>
                                        <span>·</span>
                                        <span>Protected payment</span>
                                    </div>

                                </div>

                            </div>

                            {/* REASSURANCE */}

                            <div className="mt-4 grid grid-cols-3 border border-[#eadfe5] bg-white">

                                <div className="border-r border-[#eadfe5] px-2 py-3 text-center">
                                    <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#292624]">
                                        Secure
                                    </p>
                                    <p className="mt-1 text-[9px] text-[#9a9390]">
                                        Payment
                                    </p>
                                </div>

                                <div className="border-r border-[#eadfe5] px-2 py-3 text-center">
                                    <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#292624]">
                                        Free
                                    </p>
                                    <p className="mt-1 text-[9px] text-[#9a9390]">
                                        Shipping
                                    </p>
                                </div>

                                <div className="px-2 py-3 text-center">
                                    <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#292624]">
                                        Easy
                                    </p>
                                    <p className="mt-1 text-[9px] text-[#9a9390]">
                                        Tracking
                                    </p>
                                </div>

                            </div>

                        </aside>

                    </div>

                </section>

            </main>

            <Footer />
        </>
    );
}
