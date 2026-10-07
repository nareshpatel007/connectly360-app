"use client";

import React from "react";
import {
    ExternalLink,
    Phone,
    Copy,
    MessageSquare,
    CheckCheck,
    FileText,
    Play,
    Image as ImageIcon,
    ShieldCheck,
    Lock,
} from "lucide-react";
import { TemplateButton } from "@/lib/api-client-react";

interface TemplatePreviewProps {
    businessName?: string;
    verified?: boolean;
    headerType: "none" | "text" | "image" | "video" | "document";
    headerContent?: string;
    headerMediaUrl?: string;
    headerSample?: string;
    bodyText: string;
    bodySamples?: string[];
    footerText?: string;
    buttons?: TemplateButton[];
    category?: "Marketing" | "Utility" | "Authentication";
}

function replaceVariables(text: string, samples: string[] = []): string {
    if (!text) return "";
    return text.replace(/\{\{(\d+)\}\}/g, (match, indexStr) => {
        const idx = parseInt(indexStr, 10) - 1;
        const sample = samples[idx]?.trim();
        return sample && sample.length > 0 ? sample : match;
    });
}

export function TemplatePreview({
    businessName = "Connectly360",
    verified = true,
    headerType,
    headerContent = "",
    headerMediaUrl = "",
    headerSample = "",
    bodyText,
    bodySamples = [],
    footerText = "",
    buttons = [],
    category = "Marketing",
}: TemplatePreviewProps) {
    const renderedBody = replaceVariables(bodyText, bodySamples);
    const renderedHeader = headerType === "text" && headerContent
        ? replaceVariables(headerContent, headerSample ? [headerSample] : [])
        : "";

    const hasContent = !!bodyText.trim() || (headerType !== "none" && (!!headerContent.trim() || !!headerMediaUrl.trim()));

    return (
        <div className="w-full flex flex-col rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm bg-white select-none">
            {/* WhatsApp Chat Header */}
            <div className="bg-[#075E54] text-white px-3.5 py-2.5 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative">
                        <div className="h-8 w-8 rounded-full bg-emerald-700 border border-white/20 flex items-center justify-center font-bold text-xs text-white uppercase tracking-wider shrink-0">
                            {businessName.substring(0, 2)}
                        </div>
                        <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-400 ring-1 ring-white" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-1">
                            <p className="text-xs font-semibold leading-tight truncate text-white">{businessName}</p>
                            {verified && (
                                <svg className="h-3.5 w-3.5 text-emerald-300 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            )}
                        </div>
                        <p className="text-[10px] text-emerald-100/90 leading-none">Official Business Account</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 text-white/80">
                    <span className="text-[10px] bg-emerald-800/60 px-2 py-0.5 rounded-full font-medium text-emerald-100">
                        {category}
                    </span>
                </div>
            </div>

            {/* Chat Body Wallpaper Background */}
            <div
                className="p-4 min-h-[360px] flex flex-col justify-start relative bg-[#efeae2]"
                style={{
                    backgroundImage: `radial-gradient(#dfd8cc 1px, transparent 1px)`,
                    backgroundSize: "16px 16px",
                }}
            >
                {/* Security notice watermark for WhatsApp chats */}
                <div className="self-center bg-[#ffeecd] text-[#54656f] text-[10.5px] px-3 py-1 rounded-lg max-w-[85%] text-center shadow-2xs mb-3 border border-amber-200/50 flex items-center justify-center gap-1.5">
                    <Lock className="size-2.5 text-amber-700 shrink-0" />
                    <span>Messages and calls are end-to-end encrypted.</span>
                </div>

                {/* Message Bubble Container */}
                <div className="max-w-[92%] sm:max-w-[86%] self-start flex flex-col gap-1 drop-shadow-xs">
                    <div className="bg-white rounded-2xl rounded-tl-sm p-3 border border-slate-200/80 space-y-2 relative">
                        {/* HEADER SECTION */}
                        {headerType !== "none" && (
                            <div className="overflow-hidden rounded-xl">
                                {headerType === "text" && (
                                    <h4 className="font-bold text-slate-900 text-xs leading-snug">
                                        {renderedHeader || <span className="text-slate-400 italic font-normal">Header text here...</span>}
                                    </h4>
                                )}

                                {headerType === "image" && (
                                    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200/60 flex items-center justify-center">
                                        {headerMediaUrl ? (
                                            <img
                                                src={headerMediaUrl}
                                                alt="Header"
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    // Fallback placeholder on image load failure
                                                    (e.currentTarget as HTMLImageElement).style.display = "none";
                                                }}
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                                                <ImageIcon className="size-8 text-slate-300 mb-1" />
                                                <span className="text-[10px] font-medium text-slate-500">Image Header</span>
                                                <span className="text-[9px] text-slate-400">Sample image will render here</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {headerType === "video" && (
                                    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center text-white">
                                        <div className="h-10 w-10 rounded-full bg-black/50 backdrop-blur-xs flex items-center justify-center">
                                            <Play className="size-5 fill-white text-white ml-0.5" />
                                        </div>
                                        <span className="absolute bottom-2 right-2 text-[9px] bg-black/70 px-1.5 py-0.5 rounded text-white/90 font-mono">
                                            VIDEO
                                        </span>
                                    </div>
                                )}

                                {headerType === "document" && (
                                    <div className="w-full rounded-xl bg-slate-50 border border-slate-200/70 p-2.5 flex items-center gap-2.5">
                                        <div className="h-9 w-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs shrink-0 border border-rose-100">
                                            <FileText className="size-5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[11px] font-semibold text-slate-800 truncate">Document Attachment.pdf</p>
                                            <p className="text-[9px] text-slate-400">PDF • 1.2 MB</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* BODY SECTION */}
                        <div className="text-[11.5px] text-slate-800 leading-relaxed whitespace-pre-wrap font-normal break-words">
                            {hasContent ? (
                                renderedBody || <span className="text-slate-400 italic">Body message text...</span>
                            ) : (
                                <span className="text-slate-400 italic">Type your template message body to preview here...</span>
                            )}
                        </div>

                        {/* FOOTER SECTION */}
                        {footerText && (
                            <p className="text-[10px] text-slate-400 leading-tight border-t border-slate-100 pt-1.5 italic">
                                {footerText}
                            </p>
                        )}

                        {/* META TIMESTAMP & TICKS */}
                        <div className="flex items-center justify-end gap-1 pt-0.5">
                            <span className="text-[9px] text-slate-400 font-sans">12:45 PM</span>
                            <CheckCheck className="size-3 text-sky-500" />
                        </div>
                    </div>

                    {/* BUTTONS ROW / STACK */}
                    {buttons && buttons.length > 0 && (
                        <div className="flex flex-col gap-1 w-full pt-0.5">
                            {buttons.map((btn, idx) => {
                                const bType = btn.type;
                                const isAction = bType === "URL" || bType === "PHONE_NUMBER" || bType === "COPY_CODE" || bType === "OTP";

                                return (
                                    <div
                                        key={idx}
                                        className="w-full bg-white hover:bg-slate-50/90 py-2 px-3 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-center gap-1.5 text-[#00a884] font-semibold text-[11px] transition-colors"
                                    >
                                        {bType === "URL" && <ExternalLink className="size-3.5 shrink-0" />}
                                        {bType === "PHONE_NUMBER" && <Phone className="size-3.5 shrink-0" />}
                                        {bType === "COPY_CODE" && <Copy className="size-3.5 shrink-0" />}
                                        {bType === "OTP" && <ShieldCheck className="size-3.5 shrink-0" />}
                                        {bType === "QUICK_REPLY" && <MessageSquare className="size-3.5 shrink-0" />}
                                        <span className="truncate">
                                            {btn.text || (bType === "COPY_CODE" ? `Copy code (${btn.example || "CODE"})` : `Button #${idx + 1}`)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom preview info footer */}
            <div className="bg-slate-50 border-t border-slate-200/80 px-3 py-2 flex items-center justify-between text-[10px] text-slate-500">
                <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Live WhatsApp Client Simulator
                </span>
                <span className="text-slate-400 font-mono">Meta Graph v22.0</span>
            </div>
        </div>
    );
}
