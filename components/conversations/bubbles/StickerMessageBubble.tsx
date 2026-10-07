"use client";

import React from "react";
import { Smile } from "lucide-react";

interface StickerMessageBubbleProps {
    mediaUrl?: string | null;
    isInbound: boolean;
}

export function StickerMessageBubble({ mediaUrl, isInbound }: StickerMessageBubbleProps) {
    if (!mediaUrl) {
        return (
            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-100 text-slate-500 text-xs">
                <Smile size={16} />
                <span>Sticker</span>
            </div>
        );
    }

    return (
        <div className="p-1 select-none flex items-center justify-center">
            <img
                src={mediaUrl}
                alt="WhatsApp Sticker"
                className="w-28 h-28 sm:w-32 sm:h-32 object-contain drop-shadow-xs transition-transform hover:scale-105"
                loading="lazy"
            />
        </div>
    );
}
