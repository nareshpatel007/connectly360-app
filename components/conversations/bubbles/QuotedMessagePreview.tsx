"use client";

import React from "react";
import { CornerDownRight, FileText, Image as ImageIcon, MapPin, User as UserIcon } from "lucide-react";

interface QuotedMessagePreviewProps {
    senderName?: string;
    messageText?: string;
    mediaType?: string;
    direction?: "inbound" | "outbound";
    onClick?: () => void;
}

export function QuotedMessagePreview({
    senderName,
    messageText,
    mediaType,
    direction = "inbound",
    onClick,
}: QuotedMessagePreviewProps) {
    if (!messageText && !mediaType) return null;

    const isOutbound = direction === "outbound";

    const renderMediaIcon = () => {
        if (!mediaType) return null;
        switch (mediaType.toLowerCase()) {
            case "image":
                return <ImageIcon size={12} className="shrink-0 text-slate-500" />;
            case "document":
                return <FileText size={12} className="shrink-0 text-slate-500" />;
            case "location":
                return <MapPin size={12} className="shrink-0 text-slate-500" />;
            case "contacts":
                return <UserIcon size={12} className="shrink-0 text-slate-500" />;
            default:
                return null;
        }
    };

    return (
        <div
            onClick={onClick}
            className={`flex items-start gap-2 mb-2 p-2 rounded-lg text-xs border-l-4 transition-colors cursor-pointer select-none ${
                isOutbound
                    ? "bg-[#dbeee9]/80 border-[#2F8F83] text-slate-800 hover:bg-[#d4e9e3]"
                    : "bg-slate-100/90 border-slate-400 text-slate-800 hover:bg-slate-200/80"
            }`}
        >
            <CornerDownRight size={13} className="shrink-0 text-slate-400 mt-0.5" />
            <div className="flex-1 min-w-0">
                <span className="font-semibold text-[11px] block text-[#2F8F83] truncate">
                    {senderName || (isOutbound ? "You" : "Customer")}
                </span>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-600 truncate mt-0.5">
                    {renderMediaIcon()}
                    <span className="truncate">{messageText || (mediaType ? `[${mediaType}]` : "Quoted message")}</span>
                </div>
            </div>
        </div>
    );
}
