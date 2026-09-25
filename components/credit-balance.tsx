"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Zap, AlertTriangle, Sparkles, Plus } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { BuyCreditsModal } from "./buy-credits-modal";

interface CreditBalanceProps {
    variant?: "header" | "widget" | "inline";
    className?: string;
    showBuyButton?: boolean;
}

export function CreditBalance({ variant = "header", className = "", showBuyButton = true }: CreditBalanceProps) {
    const { user } = useAuth();
    const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);

    const balance = typeof user?.credits === "number" ? user.credits : 0;
    const isLow = balance <= 100 && balance > 0;
    const isZero = balance === 0;

    if (variant === "inline") {
        return (
            <span className={`inline-flex items-center gap-1 font-semibold ${isZero ? "text-red-500" : isLow ? "text-amber-500" : "text-[#35877D]"} ${className}`}>
                <Zap size={14} className="shrink-0 fill-current" />
                <span>{balance.toLocaleString()} Credits</span>
            </span>
        );
    }

    if (variant === "widget") {
        return (
            <>
                <div className={`p-4 rounded-2xl border ${isZero ? "bg-red-50/70 border-red-200" : isLow ? "bg-amber-50/70 border-amber-200" : "bg-white border-slate-200 shadow-xs"} flex flex-col gap-3 ${className}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${isZero ? "bg-red-100 text-red-600" : isLow ? "bg-amber-100 text-amber-600" : "bg-[#35877D]/10 text-[#35877D]"}`}>
                                <Zap size={16} className="fill-current" />
                            </div>
                            <div>
                                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Available Credits</p>
                                <h4 className="text-xl font-black text-slate-900 leading-none mt-0.5">{balance.toLocaleString()}</h4>
                            </div>
                        </div>
                        {showBuyButton && (
                            <Button
                                size="sm"
                                onClick={() => setIsBuyModalOpen(true)}
                                className="bg-[#378179] hover:bg-[#2c6f66] text-white text-xs font-bold rounded-xl h-8 px-3 flex items-center gap-1 shadow-xs cursor-pointer border-0"
                            >
                                <Plus size={13} />
                                <span>Recharge</span>
                            </Button>
                        )}
                    </div>
                    {isZero ? (
                        <div className="flex items-center gap-1.5 text-[11px] text-red-700 font-medium bg-red-100/60 px-2.5 py-1 rounded-lg">
                            <AlertTriangle size={12} className="shrink-0" />
                            <span>Zero credits. Outbound AI & campaigns are paused.</span>
                        </div>
                    ) : isLow ? (
                        <div className="flex items-center gap-1.5 text-[11px] text-amber-700 font-medium bg-amber-100/60 px-2.5 py-1 rounded-lg">
                            <AlertTriangle size={12} className="shrink-0" />
                            <span>Credits are running low ({balance} left).</span>
                        </div>
                    ) : null}
                </div>
                <BuyCreditsModal open={isBuyModalOpen} onOpenChange={setIsBuyModalOpen} />
            </>
        );
    }

    // Default: Header variant
    return (
        <>
            <div className={`flex items-center gap-2 ${className}`}>
                <button
                    onClick={() => setIsBuyModalOpen(true)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer text-xs font-bold ${
                        isZero
                            ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                            : isLow
                            ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                            : "bg-[#35877D]/10 border-[#35877D]/20 text-[#00382B] hover:bg-[#35877D]/15"
                    }`}
                    title="Click to recharge credits"
                >
                    <Zap size={13} className={`shrink-0 ${isZero ? "fill-red-500 text-red-500" : isLow ? "fill-amber-500 text-amber-500" : "fill-[#35877D] text-[#35877D]"}`} />
                    <span>{balance.toLocaleString()} Credits</span>
                </button>

                {showBuyButton && (
                    <Button
                        size="sm"
                        onClick={() => setIsBuyModalOpen(true)}
                        className="h-7.5 px-2.5 rounded-lg bg-[#378179] hover:bg-[#2c6f66] text-white text-[11px] font-semibold flex items-center gap-1 shadow-xs cursor-pointer border-0"
                    >
                        <Sparkles size={11} className="text-emerald-300" />
                        <span>Buy Credits</span>
                    </Button>
                )}
            </div>
            <BuyCreditsModal open={isBuyModalOpen} onOpenChange={setIsBuyModalOpen} />
        </>
    );
}
