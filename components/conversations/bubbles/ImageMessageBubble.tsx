"use client";

import React, { useState } from "react";
import { Download, Maximize2, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ImageMessageBubbleProps {
    mediaUrl?: string | null;
    caption?: string | null;
    filename?: string | null;
    size?: number | null;
    isInbound: boolean;
}

export function ImageMessageBubble({
    mediaUrl,
    caption,
    filename,
    size,
    isInbound,
}: ImageMessageBubbleProps) {
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const formattedSize = size ? `${(size / 1024).toFixed(0)} KB` : null;

    // Normalize mediaUrl: if relative, prefix with API backend base
    let normalizedUrl = (mediaUrl || "").trim();
    if (normalizedUrl && normalizedUrl.startsWith("/")) {
        const apiBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/api\/?$/, "");
        if (apiBase) {
            normalizedUrl = `${apiBase}${normalizedUrl}`;
        }
    }

    const handleDownload = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!normalizedUrl) return;
        const link = document.createElement("a");
        link.href = normalizedUrl;
        link.download = filename || "whatsapp-image.jpg";
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!normalizedUrl || hasError) {
        return (
            <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-slate-100/70 border border-slate-200 text-slate-500 text-xs">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <ImageIcon size={18} className="text-slate-400" />
                        <span>{hasError ? "Unable to load image" : isInbound ? "Image downloading from WhatsApp..." : "Image attachment unavailable"}</span>
                    </div>
                    {hasError && normalizedUrl && (
                        <button
                            type="button"
                            onClick={() => {
                                setHasError(false);
                                setIsLoading(true);
                            }}
                            className="text-[11px] font-medium text-emerald-600 hover:text-emerald-700 underline"
                        >
                            Retry
                        </button>
                    )}
                </div>
                {caption && <p className="text-slate-700 italic mt-1">{caption}</p>}
            </div>
        );
    }

    return (
        <div className="space-y-1.5">
            <div className="relative group overflow-hidden rounded-xl bg-slate-900/5 max-w-[280px] sm:max-w-[340px] border border-black/5">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
                        <Loader2 size={20} className="animate-spin text-slate-400" />
                    </div>
                )}
                <img
                    src={normalizedUrl}
                    alt={caption || filename || "WhatsApp Image"}
                    className="w-full max-h-[300px] object-cover cursor-pointer transition-transform duration-200 group-hover:scale-[1.01]"
                    onLoad={() => setIsLoading(false)}
                    onError={() => {
                        setIsLoading(false);
                        setHasError(true);
                    }}
                    onClick={() => setIsLightboxOpen(true)}
                />

                {/* Overlay actions on hover */}
                <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-xs p-1 rounded-lg">
                    <button
                        type="button"
                        onClick={() => setIsLightboxOpen(true)}
                        className="p-1 text-white hover:text-slate-200 rounded transition-colors"
                        title="View Full Size"
                    >
                        <Maximize2 size={13} />
                    </button>
                    <button
                        type="button"
                        onClick={handleDownload}
                        className="p-1 text-white hover:text-slate-200 rounded transition-colors"
                        title="Download Image"
                    >
                        <Download size={13} />
                    </button>
                </div>
            </div>

            {/* Caption */}
            {caption && (
                <div className="text-xs sm:text-sm text-slate-800 leading-relaxed px-1 whitespace-pre-wrap">
                    {caption}
                </div>
            )}

            {/* Lightbox Dialog */}
            <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
                <DialogContent className="max-w-4xl p-2 bg-black/95 border-none shadow-2xl flex flex-col items-center">
                    <div className="w-full flex items-center justify-between text-white/80 p-2 text-xs">
                        <span className="truncate">{filename || caption || "WhatsApp Image"}</span>
                        <div className="flex items-center gap-3">
                            {formattedSize && <span className="text-[11px] text-white/60">{formattedSize}</span>}
                            <button
                                type="button"
                                onClick={handleDownload}
                                className="flex items-center gap-1 text-white hover:text-[#2F8F83] transition-colors"
                            >
                                <Download size={14} />
                                <span>Download</span>
                            </button>
                        </div>
                    </div>
                    <div className="relative max-h-[80vh] overflow-auto flex items-center justify-center p-2">
                        <img
                            src={normalizedUrl}
                            alt={caption || filename || "Zoomed Image"}
                            className="max-h-[75vh] max-w-full object-contain rounded"
                        />
                    </div>
                    {caption && <p className="text-white/90 text-sm p-3 text-center">{caption}</p>}
                </DialogContent>
            </Dialog>
        </div>
    );
}
