"use client";

import React from "react";
import { CornerDownRight, X, Image as ImageIcon, FileText, MapPin, User } from "lucide-react";

interface ReplyQuoteBarProps {
    replyingTo: {
        id: number;
        senderName?: string;
        message?: string;
        type?: string;
        mediaType?: string;
        direction?: "inbound" | "outbound";
    } | null;
    onDismiss: () => void;
}

export function ReplyQuoteBar({ replyingTo, onDismiss }: ReplyQuoteBarProps) {
    if (!replyingTo) return null;

    const sender = replyingTo.senderName || (replyingTo.direction === "outbound" ? "You" : "Customer");
    const preview = replyingTo.message || (replyingTo.type ? `[${replyingTo.type}]` : "Message");

    const renderIcon = () => {
        const t = (replyingTo.type || replyingTo.mediaType || "").toLowerCase();
        if (t.includes("image")) return <ImageIcon size={12} className="text-[#2F8F83]" />;
        if (t.includes("document")) return <FileText size={12} className="text-[#2F8F83]" />;
        if (t.includes("location")) return <MapPin size={12} className="text-[#2F8F83]" />;
        if (t.includes("contact")) return <User size={12} className="text-[#2F8F83]" />;
        return <CornerDownRight size={12} className="text-[#2F8F83]" />;
    };

    return (
        <div className="flex items-center justify-between gap-3 px-3 py-2 bg-[#EAF7F2]/60 border-l-4 border-[#2F8F83] border-b border-t border-slate-200 text-xs">
            <div className="flex items-center gap-2 min-w-0">
                {renderIcon()}
                <div className="min-w-0">
                    <span className="font-semibold text-[11px] text-[#2F8F83] block truncate">
                        Replying to {sender}
                    </span>
                    <p className="text-[11px] text-slate-600 truncate">{preview}</p>
                </div>
            </div>

            <button
                type="button"
                onClick={onDismiss}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-200/50 transition-colors cursor-pointer shrink-0"
                title="Cancel reply"
            >
                <X size={14} />
            </button>
        </div>
    );
}
