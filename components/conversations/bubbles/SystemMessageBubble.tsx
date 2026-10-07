"use client";

import React from "react";
import { Info, AlertCircle, HelpCircle } from "lucide-react";

interface SystemMessageBubbleProps {
    message: string;
}

export function SystemMessageBubble({ message }: SystemMessageBubbleProps) {
    return (
        <div className="flex justify-center my-2">
            <span className="inline-flex items-center gap-1.5 bg-slate-100/90 text-slate-600 px-3 py-1 rounded-full text-[11px] font-medium shadow-2xs border border-slate-200/60 max-w-md text-center">
                <Info size={12} className="text-[#2F8F83] shrink-0" />
                <span>{message}</span>
            </span>
        </div>
    );
}

interface UnsupportedMessageBubbleProps {
    rawType?: string;
    messageText?: string;
}

export function UnsupportedMessageBubble({ rawType, messageText }: UnsupportedMessageBubbleProps) {
    return (
        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs max-w-[280px]">
            <HelpCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="min-w-0">
                <p className="font-semibold text-[11px]">Unsupported WhatsApp Message</p>
                <p className="text-[10px] text-amber-700 mt-0.5">
                    Type: <span className="font-mono font-bold">{rawType || "unknown"}</span>
                </p>
                {messageText && (
                    <p className="text-[10px] text-slate-600 mt-1 truncate">{messageText}</p>
                )}
            </div>
        </div>
    );
}
