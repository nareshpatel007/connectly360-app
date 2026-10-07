"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Zap, AlertTriangle, Sparkles, Plus } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useQueryClient } from "@tanstack/react-query";
import { creditQueryKey } from "@/lib/realtime-credits";
import { Button } from "@/components/ui/button";
import { BuyCreditsModal } from "./buy-credits-modal";

interface CreditBalanceProps {
    variant?: "header" | "widget" | "inline";
    className?: string;
    showBuyButton?: boolean;
}

export function CreditBalance({ variant = "header", className = "", showBuyButton = true }: CreditBalanceProps) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);

    const queryData = user?.tenant_id ? queryClient.getQueryData<any>(creditQueryKey(user.tenant_id)) : null;
    const cachedBalance = typeof queryData?.balance === "number" ? queryData.balance : undefined;
    const balance = typeof cachedBalance === "number" ? cachedBalance : (typeof user?.credits === "number" ? user.credits : 0);
    const isLow = balance <= 100 && balance > 0;
    const isZero = balance === 0;

    if (variant === "inline") {
        return (
            <span className={`inline-flex items-center gap-1 font-medium text-xs ${isZero ? "text-rose-600" : isLow ? "text-amber-600" : "text-[#2F8F83]"} ${className}`}>
                <Zap size={13} className="shrink-0 fill-current" />
                <span><strong className="font-semibold">{balance.toLocaleString()}</strong> Credits</span>
            </span>
        );
    }

    if (variant === "widget") {
        return (
            <>
                <div className={`p-4 rounded-xl border ${isZero ? "bg-rose-50/70 border-rose-200" : isLow ? "bg-amber-50/70 border-amber-200" : "bg-white border-[#E5E9EE] shadow-2xs"} flex flex-col gap-3 ${className}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isZero ? "bg-rose-100 text-rose-600" : isLow ? "bg-amber-100 text-amber-600" : "bg-[#E8F6F3] text-[#2F8F83]"}`}>
                                <Zap size={15} className="fill-current" />
                            </div>
                            <div>
                                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Available Credits</p>
                                <h4 className="text-lg font-semibold text-slate-900 leading-none mt-0.5">{balance.toLocaleString()}</h4>
                            </div>
                        </div>
                        {showBuyButton && (
                            <Button
                                size="sm"
                                onClick={() => setIsBuyModalOpen(true)}
                                className="bg-[#2F8F83] hover:bg-[#267A70] text-white text-xs font-medium rounded-lg h-8 px-3 flex items-center gap-1 shadow-2xs cursor-pointer border-0"
                            >
                                <Plus size={13} />
                                <span>Recharge</span>
                            </Button>
                        )}
                    </div>
                    {isZero ? (
                        <div className="flex items-center gap-1.5 text-[11px] text-rose-700 font-medium bg-rose-100/60 px-2.5 py-1 rounded-md">
                            <AlertTriangle size={12} className="shrink-0" />
                            <span>Zero credits. Outbound AI & campaigns are paused.</span>
                        </div>
                    ) : isLow ? (
                        <div className="flex items-center gap-1.5 text-[11px] text-amber-700 font-medium bg-amber-100/60 px-2.5 py-1 rounded-md">
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
                    className={`h-9 flex items-center gap-1.5 px-3 rounded-lg border transition-all cursor-pointer text-xs ${
                        isZero
                            ? "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100"
                            : isLow
                            ? "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100"
                            : "bg-[#E8F6F3] border-[#BFE4DD] text-[#2F8F83] hover:bg-[#ddf2ee]"
                    }`}
                    title="Click to recharge credits"
                >
                    <Zap size={13} className={`shrink-0 ${isZero ? "fill-rose-500 text-rose-500" : isLow ? "fill-amber-500 text-amber-500" : "fill-[#2F8F83] text-[#2F8F83]"}`} />
                    <span className="font-semibold">{balance.toLocaleString()}</span>
                    <span className="font-normal opacity-90 hidden sm:inline">Credits</span>
                </button>

                {showBuyButton && (
                    <Button
                        size="sm"
                        onClick={() => setIsBuyModalOpen(true)}
                        className="h-9 px-3 rounded-lg bg-[#2F8F83] hover:bg-[#267A70] text-white text-xs font-medium flex items-center gap-1.5 shadow-2xs cursor-pointer border-0"
                    >
                        <Sparkles size={12} className="text-emerald-200" />
                        <span>Buy Credits</span>
                    </Button>
                )}
            </div>
            <BuyCreditsModal open={isBuyModalOpen} onOpenChange={setIsBuyModalOpen} />
        </>
    );
}
