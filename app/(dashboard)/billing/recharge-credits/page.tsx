"use client";

import { useEffect, useState, useCallback } from "react";
import { Sparkles, Zap, Loader2, Coins, ShieldCheck, CheckCircle2, RefreshCw, Settings, Wallet, Gift } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

interface CustomCalc {
    amount_inr: number;
    base_credits: number;
    bonus_credits: number;
    total_credits: number;
    rate_per_credit: number;
    tier_name: string;
}

const DEFAULT_PACKAGES: CreditPack[] = [
    { id: 1, name: "Starter Pack", credits: 500, price: 99, currency: "INR", bonus_credits: 0, total_credits: 500, is_popular: false },
    { id: 2, name: "Growth Pack", credits: 2000, price: 299, currency: "INR", bonus_credits: 0, total_credits: 2000, is_popular: true },
    { id: 3, name: "Pro Pack", credits: 10000, price: 999, currency: "INR", bonus_credits: 0, total_credits: 10000, is_popular: false },
    { id: 4, name: "Enterprise Pack", credits: 50000, price: 3999, currency: "INR", bonus_credits: 0, total_credits: 50000, is_popular: false },
];

const PRESET_AMOUNTS = [500, 1000, 2500, 5000, 10000];

export default function RechargeCreditsPage() {
    const { user, token, login } = useAuth();
    const [packs, setPacks] = useState<CreditPack[]>(DEFAULT_PACKAGES);
    const [loadingPack, setLoadingPack] = useState<number | null>(null);

    // Custom Recharge state
    const [customAmountStr, setCustomAmountStr] = useState("500");
    const [customCalc, setCustomCalc] = useState<CustomCalc | null>(null);
    const [isCalculatingCustom, setIsCalculatingCustom] = useState(false);
    const [isProcessingCustom, setIsProcessingCustom] = useState(false);

    // Auto Recharge state
    const [autoEnabled, setAutoEnabled] = useState(false);
    const [autoStatus, setAutoStatus] = useState("NOT_CONFIGURED");
    const [autoThreshold, setAutoThreshold] = useState(500);
    const [autoAmount, setAutoAmount] = useState(500);
    const [autoMaxDaily, setAutoMaxDaily] = useState(3);
    const [autoRechargesToday, setAutoRechargesToday] = useState(0);
    const [autoConsent, setAutoConsent] = useState(true);
    const [paymentSourceInfo, setPaymentSourceInfo] = useState<any>(null);
    const [isSavingAuto, setIsSavingAuto] = useState(false);

    // Inject Razorpay CDN
    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);
        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, []);

    // Load dynamic packages & auto recharge settings
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [packsRes, autoRes] = await Promise.all([
                    fetch("/api/billing/credits/packages", { headers: token ? { Authorization: `Bearer ${token}` } : undefined }),
                    fetch("/api/billing/credits/auto-recharge", { headers: token ? { Authorization: `Bearer ${token}` } : undefined })
                ]);

                const packsData = await packsRes.json();
                if (packsData.status && Array.isArray(packsData.data) && packsData.data.length > 0) {
                    setPacks(packsData.data);
                }

                const autoData = await autoRes.json();
                if (autoData.status && autoData.data) {
                    setAutoEnabled(!!autoData.data.enabled);
                    setAutoStatus(autoData.data.status || (autoData.data.enabled ? "ACTIVE" : "NOT_CONFIGURED"));
                    setAutoThreshold(autoData.data.threshold_credits || autoData.data.auto_recharge_threshold || 500);
                    setAutoAmount(autoData.data.recharge_amount || autoData.data.auto_recharge_amount || 500);
                    setAutoMaxDaily(autoData.data.max_recharges_per_day || autoData.data.auto_recharge_max_per_day || 3);
                    setAutoRechargesToday(autoData.data.recharges_today || 0);
                    setPaymentSourceInfo(autoData.data.payment_source || null);
                }
            } catch (err) {
                console.error("Failed to load credit data", err);
            }
        };

        if (token) {
            fetchData();
        }
    }, [token]);

    // Calculate Custom Recharge
    const calculateCustom = useCallback(async (amt: number) => {
        if (amt < 50 || amt > 100000) {
            setCustomCalc(null);
            return;
        }
        setIsCalculatingCustom(true);
        try {
            const res = await fetch("/api/billing/credits/calculate-custom", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: token ? `Bearer ${token}` : ""
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
            setIsCalculatingCustom(false);
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

    // Package Purchase Handler
    const handlePackagePurchase = async (pkg: CreditPack) => {
        setLoadingPack(pkg.id);
        try {
            const res = await fetch("/api/billing/credits/purchase", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ purchase_type: "package", package_id: pkg.id })
            });

            const result = await res.json();
            if (!result.status) {
                throw new Error(result.message || "Failed to create order.");
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
                    toast.success(`Successfully added ${(pkg.total_credits || pkg.credits).toLocaleString()} credits!`);
                    if (verifyData.data?.access_token) {
                        login(verifyData.data.access_token);
                    }
                } else {
                    toast.error(verifyData.message || "Payment verification failed.");
                }
                setLoadingPack(null);
                return;
            }

            const options = {
                key: orderData.key,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "Connectly360",
                description: `Purchase ${pkg.name}`,
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
                            toast.success(`Payment verified! Added ${(pkg.total_credits || pkg.credits).toLocaleString()} credits.`);
                            if (verifyData.data?.access_token) {
                                login(verifyData.data.access_token);
                            }
                        } else {
                            toast.error(verifyData.message || "Verification failed.");
                        }
                    } catch (err: any) {
                        toast.error(err.message || "Verification error.");
                    } finally {
                        setLoadingPack(null);
                    }
                },
                modal: {
                    ondismiss: () => setLoadingPack(null)
                },
                theme: { color: "#378179" }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (err: any) {
            toast.error(err.message || "Purchase failed.");
            setLoadingPack(null);
        }
    };

    // Custom Purchase Handler
    const handleCustomPurchase = async () => {
        const amt = parseFloat(customAmountStr);
        if (isNaN(amt) || amt < 50 || amt > 100000) {
            toast.error("Custom recharge amount must be between ₹50 and ₹100,000.");
            return;
        }

        setIsProcessingCustom(true);
        try {
            const res = await fetch("/api/billing/credits/purchase", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ purchase_type: "custom", amount: amt })
            });

            const result = await res.json();
            if (!result.status) {
                throw new Error(result.message || "Failed to create custom purchase order.");
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
                } else {
                    toast.error(verifyData.message || "Payment verification failed.");
                }
                setIsProcessingCustom(false);
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
                        } else {
                            toast.error(verifyData.message || "Verification failed.");
                        }
                    } catch (err: any) {
                        toast.error(err.message || "Verification error.");
                    } finally {
                        setIsProcessingCustom(false);
                    }
                },
                modal: {
                    ondismiss: () => setIsProcessingCustom(false)
                },
                theme: { color: "#378179" }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (err: any) {
            toast.error(err.message || "Custom recharge failed.");
            setIsProcessingCustom(false);
        }
    };

    // Save Auto Recharge Settings
    const handleAuthorizeAutoRecharge = async () => {
        if (!autoConsent) {
            toast.error("Please check the explicit authorization consent checkbox.");
            return;
        }
        setIsSavingAuto(true);
        try {
            const res = await fetch("/api/billing/credits/auto-recharge/authorize", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    threshold_credits: autoThreshold,
                    recharge_amount: autoAmount,
                    max_recharges_per_day: autoMaxDaily,
                    consent_given: autoConsent
                })
            });
            const data = await res.json();
            if (!data.status) {
                toast.error(data.message || "Authorization initialization failed.");
                setIsSavingAuto(false);
                return;
            }

            const authData = data.data;

            if (authData.is_mock || !window.Razorpay) {
                const confirmRes = await fetch("/api/billing/credits/auto-recharge/confirm", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        razorpay_payment_id: "pay_mock_" + Math.random().toString(36).substring(2, 12),
                        razorpay_order_id: authData.order_id,
                        razorpay_signature: "sig_mock",
                        payment_method_type: "upi_autopay"
                    })
                });
                const confirmJson = await confirmRes.json();
                if (confirmJson.status) {
                    toast.success("Auto Recharge successfully authorized & activated!");
                    setAutoStatus(confirmJson.data.status);
                    setAutoEnabled(true);
                    setPaymentSourceInfo(confirmJson.data.payment_source);
                } else {
                    toast.error(confirmJson.message || "Failed to confirm authorization.");
                }
                setIsSavingAuto(false);
                return;
            }

            const options = {
                key: authData.key,
                amount: authData.amount,
                currency: authData.currency,
                name: authData.name || "Connectly360",
                description: authData.description,
                image: authData.company_logo || (typeof window !== "undefined" ? `${window.location.origin}/images/icon.png` : ""),
                order_id: authData.order_id,
                handler: async function (response: any) {
                    try {
                        const confirmRes = await fetch("/api/billing/credits/auto-recharge/confirm", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_signature: response.razorpay_signature,
                                payment_method_type: "upi_autopay"
                            })
                        });
                        const confirmJson = await confirmRes.json();
                        if (confirmJson.status) {
                            toast.success("Auto Recharge successfully authorized & activated!");
                            setAutoStatus(confirmJson.data.status);
                            setAutoEnabled(true);
                            setPaymentSourceInfo(confirmJson.data.payment_source);
                        } else {
                            toast.error(confirmJson.message || "Failed to confirm authorization.");
                        }
                    } catch (err: any) {
                        toast.error(err.message || "Error confirming authorization.");
                    } finally {
                        setIsSavingAuto(false);
                    }
                },
                modal: {
                    ondismiss: function () {
                        setIsSavingAuto(false);
                    }
                },
                theme: { color: "#378179" }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err: any) {
            toast.error(err.message || "Failed to initiate authorization.");
            setIsSavingAuto(false);
        }
    };

    const handleDisableAutoRecharge = async () => {
        setIsSavingAuto(true);
        try {
            const res = await fetch("/api/billing/credits/auto-recharge/disable", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ reason: "Disabled by user" })
            });
            const data = await res.json();
            if (data.status) {
                toast.success("Auto Recharge has been disabled.");
                setAutoEnabled(false);
                setAutoStatus("DISABLED");
            } else {
                toast.error(data.message || "Failed to disable.");
            }
        } catch {
            toast.error("Error disabling Auto Recharge.");
        } finally {
            setIsSavingAuto(false);
        }
    };

    const handleSaveAutoRecharge = async () => {
        setIsSavingAuto(true);
        try {
            const res = await fetch("/api/billing/credits/auto-recharge", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    threshold_credits: autoThreshold,
                    recharge_amount: autoAmount,
                    max_recharges_per_day: autoMaxDaily,
                })
            });

            const data = await res.json();
            if (data.status) {
                toast.success(data.message || "Auto recharge settings updated successfully.");
            } else {
                toast.error(data.message || "Failed to update settings.");
            }
        } catch {
            toast.error("Auto recharge update error.");
        } finally {
            setIsSavingAuto(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto py-2 pb-12 font-sans">
            <PageHeader
                icon={Zap}
                title="Recharge Credits"
                description="Purchase predefined packages, enter a custom recharge amount, or configure auto recharge safety thresholds."
                actions={
                    <div className="flex items-center gap-2 bg-[#EAF7F2] border border-[#A8E0D0] px-4 py-2 rounded-2xl text-xs font-bold text-[#0B2E1E] shadow-2xs">
                        <Coins size={15} className="text-[#378179]" />
                        <span>Wallet Balance: <strong className="text-[#378179] font-black">{user?.credits !== undefined ? Number(user.credits).toLocaleString() : 0} Credits</strong></span>
                    </div>
                }
            />

            {/* Predefined Credit Packages Grid */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <Sparkles size={16} className="text-[#378179]" />
                        Predefined Credit Packages
                    </h2>
                    <span className="text-[11px] font-semibold text-slate-400">Instant Wallet Delivery • No Commitments</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {packs.map((pkg) => {
                        const isLoading = loadingPack === pkg.id;
                        const totalCredits = pkg.total_credits || (pkg.credits + (pkg.bonus_credits || 0));
                        const perCredit = (pkg.price / totalCredits).toFixed(2);

                        return (
                            <Card
                                key={pkg.id}
                                className={`rounded-[24px] border p-5 flex flex-col justify-between transition-all duration-200 bg-white relative ${
                                    pkg.is_popular
                                        ? "border-[#378179] shadow-md ring-2 ring-[#378179]/15 bg-gradient-to-b from-[#EAF7F2]/40 to-white"
                                        : "border-slate-200/80 shadow-2xs hover:border-slate-300 hover:shadow-xs"
                                }`}
                            >
                                {pkg.is_popular && (
                                    <div className="absolute top-0 right-0 bg-gradient-to-r from-[#378179] to-[#2c6f66] text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-2xl shadow-2xs">
                                        Most Popular
                                    </div>
                                )}

                                <div className="space-y-1">
                                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">{pkg.name}</span>
                                    <p className="text-3xl font-black text-slate-900 tracking-tight mt-1">{totalCredits.toLocaleString()}</p>
                                    <p className="text-xs text-slate-400 font-extrabold uppercase tracking-wider">Credits</p>
                                </div>

                                {pkg.bonus_credits && pkg.bonus_credits > 0 ? (
                                    <p className="text-[11px] font-extrabold text-[#378179] mt-2 flex items-center gap-1 bg-[#EAF7F2] p-1.5 rounded-xl border border-[#A8E0D0]/60">
                                        <Gift size={12} />
                                        <span>+{pkg.bonus_credits.toLocaleString()} Bonus Included!</span>
                                    </p>
                                ) : (
                                    <div className="h-6" />
                                )}

                                <div className="py-2.5 my-2 border-y border-slate-100 flex items-baseline justify-between">
                                    <span className="text-2xl font-black text-slate-900">₹{pkg.price.toLocaleString()}</span>
                                    <span className="text-[10px] font-semibold text-slate-400">₹{perCredit} / credit</span>
                                </div>

                                <Button
                                    onClick={() => handlePackagePurchase(pkg)}
                                    disabled={!!loadingPack}
                                    className="w-full h-11 rounded-2xl text-xs font-extrabold transition-all bg-[#378179] hover:bg-[#2c6f66] text-white shadow-xs flex items-center justify-center gap-2 cursor-pointer border-0 mt-1"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin" />
                                            <span>Processing...</span>
                                        </>
                                    ) : (
                                        <span>Purchase Pack</span>
                                    )}
                                </Button>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Custom Recharge & Auto Recharge Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2">
                {/* Custom Recharge Card (7 cols) */}
                <div className="lg:col-span-7">
                    <Card className="p-6 bg-white border border-slate-200/80 rounded-[24px] space-y-5 shadow-2xs">
                        <CardHeader className="p-0 pb-3 border-b border-slate-100">
                            <CardTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                                <Coins size={18} className="text-[#378179]" />
                                Custom Credit Recharge
                            </CardTitle>
                            <CardDescription className="text-xs text-slate-500 font-medium">
                                Enter any custom INR amount to purchase credits with automated tier bonus calculation.
                            </CardDescription>
                        </CardHeader>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-extrabold text-slate-800">
                                        Enter Amount in INR (₹)
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
                                        placeholder="500"
                                        className="h-12 pl-9 bg-slate-50/80 border-slate-200 text-slate-900 text-lg font-black rounded-2xl focus-visible:ring-[#378179] focus-visible:bg-white transition-all shadow-inner"
                                    />
                                </div>

                                {/* Quick Presets */}
                                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mr-1">Quick Select:</span>
                                    {PRESET_AMOUNTS.map((amt) => {
                                        const isSelected = customAmountStr === amt.toString();
                                        return (
                                            <button
                                                key={amt}
                                                type="button"
                                                onClick={() => setCustomAmountStr(amt.toString())}
                                                className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all cursor-pointer border ${
                                                    isSelected
                                                        ? "bg-[#378179] text-white border-[#378179] shadow-2xs"
                                                        : "bg-slate-100/80 text-slate-700 border-slate-200/80 hover:bg-slate-200/80"
                                                }`}
                                            >
                                                ₹{amt.toLocaleString()}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Live calculation display */}
                            {isCalculatingCustom ? (
                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
                                    <Loader2 size={16} className="animate-spin text-[#378179]" />
                                    <span>Calculating effective rates...</span>
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
                                <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-2xl text-xs text-amber-800 font-semibold text-center">
                                    Enter an amount between ₹50 and ₹100,000.
                                </div>
                            )}

                            <Button
                                onClick={handleCustomPurchase}
                                disabled={isProcessingCustom || !customCalc}
                                className="w-full h-12 bg-gradient-to-r from-[#378179] to-[#2c6f66] hover:opacity-95 text-white rounded-2xl text-xs font-extrabold shadow-md shadow-[#378179]/20 cursor-pointer border-0 transition-all flex items-center justify-center gap-2"
                            >
                                {isProcessingCustom ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        <span>Initiating Custom Payment...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={16} className="text-emerald-300" />
                                        <span>Continue to Razorpay Checkout (₹{customCalc ? customCalc.amount_inr.toLocaleString() : customAmountStr})</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </Card>
                </div>

                {/* Auto Recharge Settings Card (5 cols) */}
                <div className="lg:col-span-5">
                    <Card className="p-6 bg-white border border-slate-200/80 rounded-[24px] space-y-4 shadow-2xs">
                        <CardHeader className="p-0 pb-3 border-b border-slate-100">
                            <CardTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                                <Settings size={18} className="text-[#378179]" />
                                Auto Recharge Controls
                            </CardTitle>
                            <CardDescription className="text-xs text-slate-500 font-medium">
                                Automatically trigger recharges when balance falls below threshold.
                            </CardDescription>
                        </CardHeader>

                        <div className="space-y-4 pt-1">
                            {autoEnabled && (autoStatus === "ACTIVE" || autoStatus === "AUTHORIZED") ? (
                                <>
                                    <div className="flex items-center justify-between p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200">
                                        <div>
                                            <p className="text-xs font-extrabold text-emerald-950 flex items-center gap-1.5">
                                                <CheckCircle2 size={15} className="text-emerald-600" />
                                                Auto Recharge Active
                                            </p>
                                            <p className="text-[10px] text-emerald-700 font-medium mt-0.5">
                                                {paymentSourceInfo?.masked_display || "UPI AutoPay / Card"}
                                            </p>
                                        </div>
                                        <span className="bg-emerald-600 text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
                                            ✓ Authorized
                                        </span>
                                    </div>

                                    <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs space-y-2 text-slate-700">
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500 font-medium">Recharge Threshold:</span>
                                            <span className="font-extrabold text-slate-900">{autoThreshold} credits</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500 font-medium">Recharge Amount:</span>
                                            <span className="font-extrabold text-slate-900">₹{autoAmount}</span>
                                        </div>
                                        <div className="flex justify-between items-center border-t border-slate-200/60 pt-2">
                                            <span className="text-slate-500 font-medium">Today's Auto Charges:</span>
                                            <span className="font-extrabold text-[#378179]">{autoRechargesToday} / {autoMaxDaily}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-800">Recharge Threshold (Credits)</label>
                                        <Input
                                            type="number"
                                            value={autoThreshold}
                                            onChange={(e) => setAutoThreshold(parseInt(e.target.value) || 0)}
                                            className="h-10 bg-slate-50/80 border-slate-200 text-xs font-extrabold rounded-xl focus-visible:ring-[#378179]"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-800">Recharge Amount (₹)</label>
                                        <Input
                                            type="number"
                                            value={autoAmount}
                                            onChange={(e) => setAutoAmount(parseInt(e.target.value) || 0)}
                                            className="h-10 bg-slate-50/80 border-slate-200 text-xs font-extrabold rounded-xl focus-visible:ring-[#378179]"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-800">Max Auto Recharges Per Day</label>
                                        <Input
                                            type="number"
                                            value={autoMaxDaily}
                                            onChange={(e) => setAutoMaxDaily(parseInt(e.target.value) || 1)}
                                            className="h-10 bg-slate-50/80 border-slate-200 text-xs font-semibold rounded-xl focus-visible:ring-[#378179]"
                                        />
                                    </div>

                                    <div className="space-y-2 pt-2">
                                        <Button
                                            onClick={handleSaveAutoRecharge}
                                            disabled={isSavingAuto}
                                            className="w-full h-10 bg-[#378179] hover:bg-[#2c6f66] text-white text-xs font-extrabold rounded-xl cursor-pointer shadow-xs border-0"
                                        >
                                            {isSavingAuto ? "Saving..." : "Save Settings"}
                                        </Button>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button
                                                variant="outline"
                                                onClick={handleDisableAutoRecharge}
                                                disabled={isSavingAuto}
                                                className="h-9 border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold cursor-pointer"
                                            >
                                                Disable Auto Recharge
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={handleAuthorizeAutoRecharge}
                                                disabled={isSavingAuto}
                                                className="h-9 border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold cursor-pointer"
                                            >
                                                Re-Authorize
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80">
                                        <div>
                                            <p className="text-xs font-extrabold text-slate-900">Auto Recharge</p>
                                            <p className="text-[10px] text-slate-500 font-medium">Prevent campaign &amp; AI interruption</p>
                                        </div>
                                        <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full">
                                            Not Authorized
                                        </span>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-800">Recharge Threshold (Credits)</label>
                                        <Input
                                            type="number"
                                            value={autoThreshold}
                                            onChange={(e) => setAutoThreshold(parseInt(e.target.value) || 0)}
                                            placeholder="500"
                                            className="h-10 bg-slate-50/80 border-slate-200 text-xs font-extrabold rounded-xl focus-visible:ring-[#378179]"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-800">Recharge Amount (₹)</label>
                                        <Input
                                            type="number"
                                            value={autoAmount}
                                            onChange={(e) => setAutoAmount(parseInt(e.target.value) || 0)}
                                            placeholder="500"
                                            className="h-10 bg-slate-50/80 border-slate-200 text-xs font-extrabold rounded-xl focus-visible:ring-[#378179]"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-800">Max Auto Recharges Per Day</label>
                                        <Input
                                            type="number"
                                            value={autoMaxDaily}
                                            onChange={(e) => setAutoMaxDaily(parseInt(e.target.value) || 1)}
                                            placeholder="3"
                                            className="h-10 bg-slate-50/80 border-slate-200 text-xs font-semibold rounded-xl focus-visible:ring-[#378179]"
                                        />
                                    </div>

                                    <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl space-y-2">
                                        <label className="flex items-start gap-2 cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={autoConsent}
                                                onChange={(e) => setAutoConsent(e.target.checked)}
                                                className="h-4 w-4 mt-0.5 accent-[#378179] rounded cursor-pointer shrink-0"
                                            />
                                            <span className="text-[11px] text-amber-900 font-medium leading-tight">
                                                I explicitly authorize Connectly360 to automatically charge my authorized Razorpay payment method when my wallet balance drops below {autoThreshold} credits.
                                            </span>
                                        </label>
                                    </div>

                                    <Button
                                        onClick={handleAuthorizeAutoRecharge}
                                        disabled={isSavingAuto}
                                        className="w-full h-11 bg-[#378179] hover:bg-[#2c6f66] text-white text-xs font-extrabold rounded-xl cursor-pointer shadow-xs border-0"
                                    >
                                        {isSavingAuto ? "Initiating Razorpay Authorization..." : "Authorize Auto Recharge"}
                                    </Button>
                                </>
                            )}
                        </div>
                    </Card>
                </div>
            </div>

            {/* Security Guarantee Note */}
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                    <ShieldCheck size={18} className="text-[#378179]" />
                    <span className="font-semibold">Razorpay Verified 256-bit Encrypted Payments</span>
                </div>
                <span className="font-medium text-slate-500">Official GST invoice generated automatically after purchase.</span>
            </div>
        </div>
    );
}
