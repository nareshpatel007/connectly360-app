"use client";

import React from "react";
import { ShoppingBag, Tag, Package } from "lucide-react";

interface OrderMessageBubbleProps {
    orderData?: any;
    isInbound: boolean;
}

export function OrderMessageBubble({ orderData, isInbound }: OrderMessageBubbleProps) {
    const data = orderData || {};
    const catalogId = data.catalog_id;
    const items = data.product_items || [];
    const text = data.text;

    const total = items.reduce((sum: number, item: any) => {
        const price = Number(item.item_price) || 0;
        const qty = Number(item.quantity) || 1;
        return sum + price * qty;
    }, 0);

    const currency = items[0]?.currency || "INR";

    return (
        <div className="overflow-hidden rounded-xl bg-white border border-slate-200/90 shadow-2xs max-w-[280px] sm:max-w-[320px]">
            <div className="p-2.5 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <ShoppingBag size={14} className="text-[#2F8F83]" />
                    <span>WhatsApp Order</span>
                </div>
                {catalogId && (
                    <span className="text-[10px] text-slate-400 font-mono">Catalog #{catalogId}</span>
                )}
            </div>

            <div className="p-3 space-y-2 text-xs">
                {text && <p className="text-slate-700 italic">{text}</p>}

                {items.length > 0 ? (
                    <div className="space-y-1.5">
                        {items.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-1.5 rounded bg-slate-50 border border-slate-100">
                                <div className="min-w-0 flex items-center gap-2">
                                    <Package size={13} className="text-slate-400 shrink-0" />
                                    <div className="truncate">
                                        <p className="font-semibold text-slate-800 truncate">
                                            {item.product_retailer_id || `Item #${idx + 1}`}
                                        </p>
                                        <p className="text-[10px] text-slate-500">Qty: {item.quantity || 1}</p>
                                    </div>
                                </div>
                                <span className="font-bold text-slate-700 shrink-0">
                                    {currency} {item.item_price}
                                </span>
                            </div>
                        ))}

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between font-bold text-xs">
                            <span className="text-slate-600">Total Derivable</span>
                            <span className="text-[#2F8F83]">{currency} {total.toFixed(2)}</span>
                        </div>
                    </div>
                ) : (
                    <p className="text-slate-500">Order details processed from catalog</p>
                )}
            </div>
        </div>
    );
}
