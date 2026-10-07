"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Zap, Sparkles, CheckCircle2, Loader2, ShieldCheck, Calculator, Coins, ArrowRight, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

declare global {
    interface Window {
        Razorpay?: any;
    }
}

interface CreditPack {
    id: number;
    name: string;
    credits: number;
    price: number;
    currency: string;
    bonus_credits?: number;
    total_credits?: number;
    is_popular?: boolean;
}

const DEFAULT_PACKS: CreditPack[] = [
    { id: 1, name: "Starter Pack", credits: 500, price: 99, currency: "INR", bonus_credits: 0, total_credits: 500, is_popular: false },
    { id: 2, name: "Growth Pack", credits: 2000, price: 299, currency: "INR", bonus_credits: 0, total_credits: 2000, is_popular: true },
    { id: 3, name: "Pro Pack", credits: 10000, price: 999, currency: "INR", bonus_credits: 0, total_credits: 10000, is_popular: false },
    { id: 4, name: "Enterprise Pack", credits: 50000, price: 3999, currency: "INR", bonus_credits: 0, total_credits: 50000, is_popular: false },
];

interface CustomCalc {
    amount_inr: number;
    base_credits: number;
    bonus_credits: number;
    total_credits: number;
    rate_per_credit: number;
    tier_name: string;
}

interface BuyCreditsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    highlightCredits?: number;
}

const PRESET_AMOUNTS = [500, 1000, 2500, 5000, 10000];

export function BuyCreditsModal({ open, onOpenChange, highlightCredits }: BuyCreditsModalProps) {
    const { token, login, refreshUser } = useAuth();
    const [mode, setMode] = useState<"packages" | "custom">("packages");

    // Package mode states
    const [packs, setPacks] = useState<CreditPack[]>(DEFAULT_PACKS);
    const [selectedPack, setSelectedPack] = useState<CreditPack>(DEFAULT_PACKS[1]);
    const [isLoadingPacks, setIsLoadingPacks] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Custom mode states
    const [customAmountStr, setCustomAmountStr] = useState("5000");
    const [customCalc, setCustomCalc] = useState<CustomCalc | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);

    // Load Razorpay script
    useEffect(() => {
        if (!document.getElementById("razorpay-sdk")) {
            const script = document.createElement("script");
            script.id = "razorpay-sdk";
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.async = true;
            document.body.appendChild(script);
        }
    }, []);

    // Fetch dynamic packages from backend
    useEffect(() => {
        if (open) {
            const fetchPacks = async () => {
                setIsLoadingPacks(true);
                try {
                    const isValidToken = Boolean(token && token !== "undefined" && token !== "null" && token.split(".").length === 3);
                    const res = await fetch("/api/billing/credits/packages", {
                        headers: isValidToken ? { Authorization: `Bearer ${token}` } : undefined
                    });
                    const data = await res.json();
                    if (data.status && Array.isArray(data.data) && data.data.length > 0) {
                        setPacks(data.data);
                        if (highlightCredits) {
                            const found = data.data.find((p: CreditPack) => (p.total_credits || p.credits) >= highlightCredits);
                            if (found) setSelectedPack(found);
                        } else {
                            const pop = data.data.find((p: CreditPack) => p.is_popular);
                            if (pop) setSelectedPack(pop);
                        }
                    }
                } catch {
                    // fallback to DEFAULT_PACKS
                } finally {
                    setIsLoadingPacks(false);
                }
            };
            fetchPacks();
        }
    }, [open, token, highlightCredits]);

    // Debounced custom amount calculation
    const calculateCustom = useCallback(async (amt: number) => {
        if (amt < 50 || amt > 100000) {
            setCustomCalc(null);
            return;
        }
        setIsCalculating(true);
        try {
            const isValidToken = Boolean(token && token !== "undefined" && token !== "null" && token.split(".").length === 3);
            const res = await fetch("/api/billing/credits/calculate-custom", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(isValidToken ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ amount: amt })
            });
            const data = await res.json();
            if (data.status && data.data) {
                setCustomCalc(data.data);
            }
        } catch {
            setCustomCalc(null);
        } finally {
            setIsCalculating(false);
        }
    }, [token]);

    useEffect(() => {
        const amt = parseFloat(customAmountStr);
        if (!isNaN(amt)) {
            const timer = setTimeout(() => calculateCustom(amt), 250);
            return () => clearTimeout(timer);
        } else {
            setCustomCalc(null);
        }
    }, [customAmountStr, calculateCustom]);

    const handlePackageCheckout = async () => {
        if (!selectedPack) return;
        setIsProcessing(true);

        try {
            const res = await fetch("/api/billing/credits/purchase", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    purchase_type: "package",
                    package_id: selectedPack.id
                })
            });

            const result = await res.json();
            if (!result.status) {
                throw new Error(result.message || "Failed to initiate payment.");
            }

            const orderData = result.data;

            if (orderData.is_mock || !window.Razorpay) {
                const verifyRes = await fetch("/api/billing/credits/verify", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        razorpay_payment_id: "pay_mock_" + Math.random().toString(36).substring(2, 12),
                        razorpay_order_id: orderData.order_id,
                        razorpay_signature: "sig_mock"
                    })
                });
                const verifyData = await verifyRes.json();
                if (verifyData.status) {
                    toast.success(`Successfully recharged ${(selectedPack.total_credits || selectedPack.credits).toLocaleString()} credits!`);
                    if (verifyData.data?.access_token) {
                        login(verifyData.data.access_token);
                    }
                    await refreshUser();
                    if (typeof window !== "undefined") {
                        window.dispatchEvent(new CustomEvent("creditsUpdated"));
                    }
                    onOpenChange(false);
                } else {
                    toast.error(verifyData.message || "Payment verification failed.");
                }
                setIsProcessing(false);
                return;
            }

            const options = {
                key: orderData.key,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "Connectly360",
                description: `Purchase ${selectedPack.name}`,
                image: orderData.company_logo || orderData.image || (typeof window !== "undefined" ? `${window.location.origin}/images/icon.png` : ""),
                order_id: orderData.order_id,
                handler: async function (response: any) {
                    try {
                        const verifyRes = await fetch("/api/billing/credits/verify", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_signature: response.razorpay_signature
                            })
                        });

                        const verifyData = await verifyRes.json();
                        if (verifyData.status) {
                            toast.success(`Payment verified! Added ${(selectedPack.total_credits || selectedPack.credits).toLocaleString()} credits.`);
                            if (verifyData.data?.access_token) {
                                login(verifyData.data.access_token);
                            }
                            await refreshUser();
                            if (typeof window !== "undefined") {
                                window.dispatchEvent(new CustomEvent("creditsUpdated"));
                            }
                            onOpenChange(false);
                        } else {
                            toast.error(verifyData.message || "Payment verification failed.");
                        }
                    } catch (err: any) {
                        toast.error(err.message || "Error validating payment.");
                    } finally {
                        setIsProcessing(false);
                    }
                },
                modal: {
                    ondismiss: function () {
                        setIsProcessing(false);
                    }
                },
                theme: {
                    color: "#378179"
                }
            };

            onOpenChange(false);
            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (err: any) {
            toast.error(err.message || "Failed to initiate payment.");
            setIsProcessing(false);
        }
    };

    const handleCustomCheckout = async () => {
        const amt = parseFloat(customAmountStr);
        if (isNaN(amt) || amt < 50 || amt > 100000) {
            toast.error("Custom recharge amount must be between ₹50 and ₹100,000.");
            return;
        }

        setIsProcessing(true);
        try {
            const res = await fetch("/api/billing/credits/purchase", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    purchase_type: "custom",
                    amount: amt
                })
            });

            const result = await res.json();
            if (!result.status) {
                throw new Error(result.message || "Failed to initiate custom recharge.");
            }

            const orderData = result.data;

            if (orderData.is_mock || !window.Razorpay) {
                const verifyRes = await fetch("/api/billing/credits/verify", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        razorpay_payment_id: "pay_mock_" + Math.random().toString(36).substring(2, 12),
                        razorpay_order_id: orderData.order_id,
                        razorpay_signature: "sig_mock"
                    })
                });
                const verifyData = await verifyRes.json();
                if (verifyData.status) {
                    toast.success(`Successfully recharged ${orderData.total_credits.toLocaleString()} credits!`);
                    if (verifyData.data?.access_token) {
                        login(verifyData.data.access_token);
                    }
                    await refreshUser();
                    if (typeof window !== "undefined") {
                        window.dispatchEvent(new CustomEvent("creditsUpdated"));
                    }
                    onOpenChange(false);
                } else {
                    toast.error(verifyData.message || "Payment verification failed.");
                }
                setIsProcessing(false);
                return;
            }

            const options = {
                key: orderData.key,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "Connectly360",
                description: `Custom Recharge ₹${amt.toLocaleString()}`,
                image: orderData.company_logo || orderData.image || (typeof window !== "undefined" ? `${window.location.origin}/images/icon.png` : ""),
                order_id: orderData.order_id,
                handler: async function (response: any) {
                    try {
                        const verifyRes = await fetch("/api/billing/credits/verify", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_signature: response.razorpay_signature
                            })
                        });

                        const verifyData = await verifyRes.json();
                        if (verifyData.status) {
                            toast.success(`Payment verified! Added ${orderData.total_credits.toLocaleString()} credits.`);
                            if (verifyData.data?.access_token) {
                                login(verifyData.data.access_token);
                            }
                            await refreshUser();
                            if (typeof window !== "undefined") {
                                window.dispatchEvent(new CustomEvent("creditsUpdated"));
                            }
                            onOpenChange(false);
                        } else {
                            toast.error(verifyData.message || "Payment verification failed.");
                        }
                    } catch (err: any) {
                        toast.error(err.message || "Error validating payment.");
                    } finally {
                        setIsProcessing(false);
                    }
                },
                modal: {
                    ondismiss: function () {
                        setIsProcessing(false);
                    }
                },
                theme: {
                    color: "#378179"
                }
            };

            onOpenChange(false);
            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (err: any) {
            toast.error(err.message || "Failed to initiate payment.");
            setIsProcessing(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-2xl font-sans">
                {/* Header Banner */}
                <div className="bg-gradient-to-b from-[#EAF7F2] via-[#EAF7F2]/40 to-white px-6 pt-6 pb-4 text-center border-b border-slate-100/80 relative">
                    <div className="mx-auto h-12 w-12 rounded-2xl bg-[#378179] text-white shadow-md shadow-[#378179]/20 flex items-center justify-center mb-3">
                        <Zap size={22} className="fill-white" />
                    </div>
                    <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">
                        Recharge Messaging Credits
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500 font-medium mt-1 flex items-center justify-center gap-1.5 flex-wrap">
                        <span>Instant wallet crediting</span>
                        <span className="text-slate-300">•</span>
                        <span>Zero monthly commitments</span>
                        <span className="text-slate-300">•</span>
                        <span>Razorpay 256-bit safe</span>
                    </DialogDescription>
                </div>

                {/* Tab Navigation */}
                <div className="px-6 pt-2">
                    <div className="grid grid-cols-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/60">
                        <button
                            onClick={() => setMode("packages")}
                            className={`py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                                mode === "packages"
                                    ? "bg-white text-[#378179] shadow-xs"
                                    : "text-slate-500 hover:text-slate-900"
                            }`}
                        >
                            <Sparkles size={14} className={mode === "packages" ? "text-[#378179]" : "text-slate-400"} />
                            <span>Predefined Packages</span>
                        </button>
                        <button
                            onClick={() => setMode("custom")}
                            className={`py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                                mode === "custom"
                                    ? "bg-white text-[#378179] shadow-xs"
                                    : "text-slate-500 hover:text-slate-900"
                            }`}
                        >
                            <Calculator size={14} className={mode === "custom" ? "text-[#378179]" : "text-slate-400"} />
                            <span>Custom Amount</span>
                        </button>
                    </div>
                </div>

                {/* Content Container */}
                <div className="p-6 pt-3">
                    {mode === "packages" ? (
                        /* Predefined Packages Mode */
                        <>
                            {isLoadingPacks ? (
                                <div className="py-12 flex flex-col items-center justify-center gap-3">
                                    <Loader2 className="animate-spin text-[#378179]" size={32} />
                                    <span className="text-xs text-slate-500 font-medium">Loading credit packages...</span>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
                                    {packs.map((pack) => {
                                        const isSelected = selectedPack.id === pack.id;
                                        const totalCredits = pack.total_credits || ((pack.credits || 0) + (pack.bonus_credits || 0));
                                        const perCredit = (pack.price / (pack.credits || 1)).toFixed(2);

                                        return (
                                            <div
                                                key={pack.id}
                                                onClick={() => setSelectedPack(pack)}
                                                className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between select-none ${
                                                    isSelected
                                                        ? "border-[#378179] bg-[#EAF7F2]/60 shadow-xs"
                                                        : "border-slate-200/80 hover:border-slate-300 bg-white"
                                                }`}
                                            >
                                                {pack.is_popular && (
                                                    <span className="absolute -top-2.5 right-3 bg-gradient-to-r from-[#378179] to-[#2c6f66] text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs">
                                                        Most Popular
                                                    </span>
                                                )}
                                                <div>
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">{pack.name}</h4>
                                                        {isSelected ? (
                                                            <CheckCircle2 size={18} className="text-[#378179]" />
                                                        ) : (
                                                            <div className="h-4 w-4 rounded-full border-2 border-slate-300" />
                                                        )}
                                                    </div>
                                                    <div className="mt-2 flex items-baseline gap-1">
                                                        <span className="text-2xl font-black text-slate-900">{totalCredits.toLocaleString()}</span>
                                                        <span className="text-xs font-bold text-slate-400">Credits</span>
                                                    </div>
                                                    {pack.bonus_credits && pack.bonus_credits > 0 ? (
                                                        <p className="text-[10px] font-extrabold text-[#378179] mt-0.5 flex items-center gap-1">
                                                            <Gift size={11} />
                                                            <span>+{pack.bonus_credits.toLocaleString()} Bonus Included!</span>
                                                        </p>
                                                    ) : null}
                                                </div>
                                                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                                                    <span className="text-base font-black text-slate-900">₹{pack.price.toLocaleString()}</span>
                                                    <span className="text-[10px] font-semibold text-slate-400">₹{perCredit} / credit</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <div className="pt-3 flex flex-col gap-2">
                                <Button
                                    onClick={handlePackageCheckout}
                                    disabled={isProcessing}
                                    className="w-full h-12 rounded-2xl bg-gradient-to-r from-[#378179] to-[#2c6f66] hover:opacity-95 text-white font-extrabold text-sm shadow-md shadow-[#378179]/20 flex items-center justify-center gap-2 cursor-pointer border-0"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            <span>Processing Payment...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={16} className="text-emerald-300" />
                                            <span>Recharge {selectedPack ? (selectedPack.total_credits || selectedPack.credits).toLocaleString() : ""} Credits (₹{selectedPack ? selectedPack.price.toLocaleString() : ""})</span>
                                        </>
                                    )}
                                </Button>
                                <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
                                    <ShieldCheck size={13} className="text-[#378179]" />
                                    <span>Instant delivery • Safe &amp; secure 256-bit encrypted checkout</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* Custom Recharge Mode */
                        <div className="space-y-4">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-extrabold text-slate-800">
                                        Enter INR Amount (₹)
                                    </label>
                                    <span className="text-[11px] font-semibold text-slate-400">Min ₹50 • Max ₹100,000</span>
                                </div>

                                {/* Custom Input */}
                                <div className="relative">
                                    <span className="absolute left-4 top-3 text-lg font-black text-[#378179]">₹</span>
                                    <Input
                                        type="number"
                                        min={50}
                                        max={100000}
                                        value={customAmountStr}
                                        onChange={(e) => setCustomAmountStr(e.target.value)}
                                        placeholder="5000"
                                        className="h-12 pl-9 bg-slate-50/80 border-slate-200 text-slate-900 text-lg font-black rounded-2xl focus-visible:ring-[#378179] focus-visible:bg-white transition-all shadow-inner"
                                    />
                                </div>

                                {/* Preset Quick Chips */}
                                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Quick Select:</span>
                                    {PRESET_AMOUNTS.map((amt) => {
                                        const isSelected = customAmountStr === amt.toString();
                                        return (
                                            <button
                                                key={amt}
                                                type="button"
                                                onClick={() => setCustomAmountStr(amt.toString())}
                                                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                                                    isSelected
                                                        ? "bg-[#378179] text-white border-[#378179] shadow-2xs"
                                                        : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/80"
                                                }`}
                                            >
                                                ₹{amt.toLocaleString()}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Live Calculation Display Card */}
                            {isCalculating ? (
                                <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200/80 flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
                                    <Loader2 size={16} className="animate-spin text-[#378179]" />
                                    <span>Calculating effective credit rate...</span>
                                </div>
                            ) : customCalc ? (
                                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#EAF7F2] via-emerald-50/40 to-white border border-[#A8E0D0] space-y-3 shadow-2xs">
                                    <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
                                        <span>Calculated Base Credits</span>
                                        <span className="font-extrabold text-slate-900">{customCalc.base_credits.toLocaleString()}</span>
                                    </div>
                                    {customCalc.bonus_credits > 0 ? (
                                        <div className="flex items-center justify-between text-xs text-[#378179] font-bold">
                                            <span>
                                                Bonus Credits {customCalc.tier_name ? `(${customCalc.tier_name})` : "(Volume Discount)"}
                                            </span>
                                            <span className="bg-[#378179]/15 text-[#378179] px-2 py-0.5 rounded-lg text-xs font-black">
                                                +{customCalc.bonus_credits.toLocaleString()}
                                            </span>
                                        </div>
                                    ) : null}

                                    {/* Total Highlight */}
                                    <div className="pt-3 border-t border-[#A8E0D0]/80 flex items-center justify-between bg-white/90 p-3 rounded-xl border border-[#A8E0D0]/60 shadow-2xs">
                                        <div>
                                            <p className="text-xs font-black text-slate-900">Total Credits Received</p>
                                            <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                                                Effective Rate: <span className="font-bold text-slate-700">₹{customCalc.rate_per_credit.toFixed(2)} / credit</span>
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-2xl font-black text-[#378179] tracking-tight">{customCalc.total_credits.toLocaleString()}</span>
                                            <span className="text-xs font-bold text-slate-400 ml-1">Credits</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-2xl text-center text-xs text-amber-800 font-semibold">
                                    Please enter an amount between ₹50 and ₹100,000.
                                </div>
                            )}

                            <div className="pt-1 flex flex-col gap-2">
                                <Button
                                    onClick={handleCustomCheckout}
                                    disabled={isProcessing || !customCalc}
                                    className="w-full h-12 rounded-2xl bg-gradient-to-r from-[#378179] to-[#2c6f66] hover:opacity-95 text-white font-extrabold text-sm shadow-md shadow-[#378179]/20 flex items-center justify-center gap-2 cursor-pointer border-0"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            <span>Processing Payment...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Coins size={16} className="text-emerald-300" />
                                            <span>Pay ₹{customCalc ? customCalc.amount_inr.toLocaleString() : customAmountStr} &amp; Get {customCalc ? customCalc.total_credits.toLocaleString() : 0} Credits</span>
                                        </>
                                    )}
                                </Button>
                                <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
                                    <ShieldCheck size={13} className="text-[#378179]" />
                                    <span>Instant delivery • Safe &amp; secure 256-bit encrypted checkout</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
