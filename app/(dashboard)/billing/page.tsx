"use client";

import { useEffect, useState } from "react";
import { 
    Zap, Sparkles, ArrowRight, History, Receipt, CreditCard, 
    CheckCircle2, Clock, ArrowUpRight, ArrowDownLeft, ShieldCheck, AlertCircle, X 
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { BuyCreditsModal } from "@/components/buy-credits-modal";

interface UsageSummary {
    balance: number;
    lifetime_earned: number;
    lifetime_purchased: number;
    lifetime_used: number;
    today_used: number;
    this_month_used: number;
    by_category: Record<string, number>;
}

export default function BillingOverviewPage() {
    const { user, token } = useAuth();
    const [summary, setSummary] = useState<UsageSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
    const [isAlertDismissed, setIsAlertDismissed] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined" && sessionStorage.getItem("low_credits_alert_dismissed") === "true") {
            setIsAlertDismissed(true);
        }
    }, []);

    const handleDismissAlert = () => {
        setIsAlertDismissed(true);
        if (typeof window !== "undefined") {
            sessionStorage.setItem("low_credits_alert_dismissed", "true");
        }
    };

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const res = await fetch("/api/billing/usage-summary", {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                const result = await res.json();
                if (result.status && result.data) {
                    setSummary(result.data);
                }
            } catch (err) {
                console.error("Failed to load usage summary", err);
            } finally {
                setIsLoading(false);
            }
        };

        if (token) {
            fetchSummary();
        }
    }, [token]);

    const balance = summary ? summary.balance : Number(user?.credits || 0);
    const isZeroCredits = balance <= 0;
    const isLowCredits = balance > 0 && balance <= 100;

    return (
        <div className="space-y-6 pb-12">
            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
                        <Zap size={24} className="text-[#35877D] fill-[#35877D]/20" />
                        Billing &amp; Credits
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Connectly360 is pure Pay-As-You-Go. Purchase credit packs anytime with no monthly commitments or lock-ins.
                    </p>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                    <Button
                        onClick={() => setIsBuyModalOpen(true)}
                        className="bg-[#00382B] hover:bg-[#35877D] text-white text-xs font-bold rounded-xl h-9 px-4 shadow-sm cursor-pointer"
                    >
                        <Zap size={14} className="mr-1.5 fill-white" />
                        Buy Credits
                    </Button>
                    <Button
                        variant="outline"
                        asChild
                        className="text-xs font-semibold text-slate-700 border-slate-200 h-9 rounded-xl cursor-pointer"
                    >
                        <Link href="/billing/credit-history">View History</Link>
                    </Button>
                </div>
            </div>

            {/* Low / Zero Alert */}
            {isZeroCredits && !isAlertDismissed ? (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="text-rose-600 shrink-0" size={20} />
                        <div>
                            <p className="text-xs font-bold text-rose-900">Wallet balance is 0 credits</p>
                            <p className="text-[11px] text-rose-700">AI replies, incoming resolutions, and broadcasts are currently paused.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button 
                            size="sm"
                            onClick={() => setIsBuyModalOpen(true)}
                            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg h-8 cursor-pointer"
                        >
                            Refill Now
                        </Button>
                        <button
                            onClick={handleDismissAlert}
                            className="text-rose-400 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer"
                            title="Dismiss alert"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            ) : isLowCredits && !isAlertDismissed ? (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="text-amber-600 shrink-0" size={20} />
                        <div>
                            <p className="text-xs font-bold text-amber-900">Low credits warning: {balance} credits left</p>
                            <p className="text-[11px] text-amber-700">Recharge before your balance reaches zero to prevent service disruptions.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button 
                            size="sm"
                            onClick={() => setIsBuyModalOpen(true)}
                            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg h-8 cursor-pointer"
                        >
                            Add Credits
                        </Button>
                        <button
                            onClick={handleDismissAlert}
                            className="text-amber-500 hover:text-amber-800 p-1.5 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer"
                            title="Dismiss alert"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            ) : null}

            {/* Top Cards: Wallet Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Available Balance Card */}
                <Card className="p-5 rounded-2xl bg-gradient-to-br from-[#00382B] via-[#004838] to-[#35877D] text-white shadow-sm relative overflow-hidden flex flex-col justify-between">
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">Current Wallet Balance</span>
                        <div className="flex items-baseline gap-2 pt-1">
                            <span className="text-3xl font-extrabold tracking-tight">{balance.toLocaleString()}</span>
                            <span className="text-xs font-semibold text-emerald-200">Credits</span>
                        </div>
                    </div>
                    <div className="pt-4 flex items-center justify-between border-t border-white/10 mt-4">
                        <span className="text-[11px] text-emerald-100/90 font-medium">Auto-renew: Disabled</span>
                        <Button 
                            size="sm" 
                            onClick={() => setIsBuyModalOpen(true)}
                            className="bg-white hover:bg-emerald-50 text-[#00382B] text-xs font-bold h-7.5 px-3 rounded-lg border-0 shadow-xs cursor-pointer"
                        >
                            + Recharge
                        </Button>
                    </div>
                </Card>

                {/* Lifetime Purchased */}
                <Card className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Lifetime Purchased</span>
                        <div className="flex items-baseline gap-2 pt-1">
                            <span className="text-2xl font-black text-slate-800 tracking-tight">
                                {summary ? summary.lifetime_purchased.toLocaleString() : "0"}
                            </span>
                            <span className="text-xs font-semibold text-slate-400">Credits</span>
                        </div>
                    </div>
                    <div className="pt-3 border-t border-slate-100 flex items-center text-xs text-slate-500 gap-1 mt-3">
                        <ArrowDownLeft size={13} className="text-emerald-500" />
                        <span>Paid packs added to balance</span>
                    </div>
                </Card>

                {/* Lifetime Used */}
                <Card className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Credits Consumed</span>
                        <div className="flex items-baseline gap-2 pt-1">
                            <span className="text-2xl font-black text-slate-800 tracking-tight">
                                {summary ? summary.lifetime_used.toLocaleString() : "0"}
                            </span>
                            <span className="text-xs font-semibold text-slate-400">Credits</span>
                        </div>
                    </div>
                    <div className="pt-3 border-t border-slate-100 flex items-center text-xs text-slate-500 gap-1 mt-3">
                        <ArrowUpRight size={13} className="text-amber-500" />
                        <span>This Month: {summary ? summary.this_month_used.toLocaleString() : "0"}</span>
                    </div>
                </Card>

                {/* Free Welcome Bonus */}
                <Card className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Free Welcome Credits</span>
                        <div className="flex items-baseline gap-2 pt-1">
                            <span className="text-2xl font-black text-[#35877D] tracking-tight">50</span>
                            <span className="text-xs font-semibold text-slate-400">Granted</span>
                        </div>
                    </div>
                    <div className="pt-3 border-t border-slate-100 flex items-center text-xs text-emerald-600 font-semibold gap-1 mt-3">
                        <CheckCircle2 size={13} />
                        <span>No monthly fee required</span>
                    </div>
                </Card>
            </div>

            {/* Quick Links & Usage Guide */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Cols: Credit Consumption Rules */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div>
                                <h2 className="text-base font-bold text-slate-900">Credit Pricing &amp; Consumption Rates</h2>
                                <p className="text-xs text-slate-500 mt-0.5">Transparent, fixed rates per action. Zero hidden fees.</p>
                            </div>
                            <span className="text-[11px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200">
                                Official Rates
                            </span>
                        </div>

                        <div className="divide-y divide-slate-100 mt-2">
                            <div className="py-3 flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <p className="text-xs font-bold text-slate-800">Incoming Messages from Customers</p>
                                    <p className="text-[11px] text-slate-400">Any inbound customer chat message</p>
                                </div>
                                <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                                    FREE (0 Credits)
                                </span>
                            </div>
                            <div className="py-3 flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <p className="text-xs font-bold text-slate-800">AI Chatbot Resolution / Reply</p>
                                    <p className="text-[11px] text-slate-400">GPT / Claude autonomous customer response</p>
                                </div>
                                <span className="text-xs font-extrabold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
                                    1 Credit
                                </span>
                            </div>
                            <div className="py-3 flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <p className="text-xs font-bold text-slate-800">Knowledge Base AI Search</p>
                                    <p className="text-[11px] text-slate-400">Deep semantic search across PDFs and documents</p>
                                </div>
                                <span className="text-xs font-extrabold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
                                    2 Credits
                                </span>
                            </div>
                            <div className="py-3 flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <p className="text-xs font-bold text-slate-800">Automated Lead Capture</p>
                                    <p className="text-[11px] text-slate-400">Extracting and saving verified contact details to CRM</p>
                                </div>
                                <span className="text-xs font-extrabold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
                                    1 Credit
                                </span>
                            </div>
                            <div className="py-3 flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <p className="text-xs font-bold text-slate-800">Media Messages (Images, Videos, PDFs)</p>
                                    <p className="text-[11px] text-slate-400">Sending documents, product brochures, or images</p>
                                </div>
                                <span className="text-xs font-extrabold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
                                    2 Credits
                                </span>
                            </div>
                            <div className="py-3 flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <p className="text-xs font-bold text-slate-800">Marketing Broadcast Campaign</p>
                                    <p className="text-[11px] text-slate-400">Mass promotional message to verified recipients</p>
                                </div>
                                <span className="text-xs font-extrabold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
                                    1 Credit / Recipient
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right 1 Col: Quick Navigation & Pack Info */}
                <div className="space-y-4">
                    {/* Navigation shortcuts */}
                    <Card className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Quick Management</h3>
                        <div className="space-y-2">
                            <Link 
                                href="/billing/recharge-credits" 
                                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-[#35877D]/30 hover:bg-[#35877D]/5 transition-all text-xs font-semibold text-slate-700 group"
                            >
                                <div className="flex items-center gap-2.5">
                                    <Zap size={15} className="text-[#35877D]" />
                                    <span>Buy Credit Packs</span>
                                </div>
                                <ArrowRight size={13} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                            <Link 
                                href="/billing/credit-history" 
                                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-[#35877D]/30 hover:bg-[#35877D]/5 transition-all text-xs font-semibold text-slate-700 group"
                            >
                                <div className="flex items-center gap-2.5">
                                    <History size={15} className="text-[#35877D]" />
                                    <span>Credit Transaction History</span>
                                </div>
                                <ArrowRight size={13} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                            <Link 
                                href="/billing/invoices" 
                                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-[#35877D]/30 hover:bg-[#35877D]/5 transition-all text-xs font-semibold text-slate-700 group"
                            >
                                <div className="flex items-center gap-2.5">
                                    <Receipt size={15} className="text-[#35877D]" />
                                    <span>Invoices &amp; Receipts</span>
                                </div>
                                <ArrowRight size={13} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                        </div>
                    </Card>

                    {/* Security & Guarantee Note */}
                    <Card className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-xs space-y-2.5">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                            <ShieldCheck size={16} className="text-[#35877D]" />
                            <span>100% Secure Payments</span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            All credit recharges are processed via Razorpay with instant wallet crediting and GST invoices. Unused credits never expire.
                        </p>
                    </Card>
                </div>
            </div>

            {/* Buy Credits Modal */}
            <BuyCreditsModal 
                open={isBuyModalOpen} 
                onOpenChange={setIsBuyModalOpen} 
            />
        </div>
    );
}
