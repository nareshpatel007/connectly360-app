"use client";

import React from "react";
import { Check, CheckCircle2, ChevronRight, Layers, ListFilter } from "lucide-react";

interface InteractiveMessageBubbleProps {
    interactiveType?: string | null;
    interactiveData?: any;
    bodyText?: string;
    isInbound: boolean;
}

export function InteractiveMessageBubble({
    interactiveType,
    interactiveData,
    bodyText,
    isInbound,
}: InteractiveMessageBubbleProps) {
    const data = interactiveData || {};

    // 1. Inbound Customer Selection Response
    if (isInbound || interactiveType === "button_reply" || interactiveType === "list_reply") {
        const title =
            data?.button_reply?.title ||
            data?.list_reply?.title ||
            data?.title ||
            bodyText ||
            "Option selected";
        const id = data?.button_reply?.id || data?.list_reply?.id || data?.id;

        return (
            <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EAF7F2] text-[#2F8F83] text-xs font-semibold border border-[#2F8F83]/30">
                    <CheckCircle2 size={13} className="text-[#2F8F83]" />
                    <span>Customer selected:</span>
                    <span className="font-bold underline">{title}</span>
                </div>
                {id && <p className="text-[10px] text-slate-400 font-mono px-1">ID: {id}</p>}
            </div>
        );
    }

    // 2. Outbound Interactive Reply Buttons
    const buttons = data?.action?.buttons || data?.buttons || [];
    const sections = data?.action?.sections || [];
    const headerText = data?.header?.text;
    const bodyContent = data?.body?.text || bodyText;
    const footerText = data?.footer?.text;

    return (
        <div className="space-y-2 max-w-[320px]">
            {headerText && (
                <div className="font-bold text-xs text-slate-800 pb-0.5 border-b border-slate-100">
                    {headerText}
                </div>
            )}

            {bodyContent && (
                <div className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {bodyContent}
                </div>
            )}

            {footerText && (
                <div className="text-[10px] text-slate-400 italic">
                    {footerText}
                </div>
            )}

            {/* Reply Buttons */}
            {buttons.length > 0 && (
                <div className="space-y-1.5 pt-1">
                    {buttons.map((btn: any, idx: number) => {
                        const title = btn?.reply?.title || btn?.title || `Button ${idx + 1}`;
                        return (
                            <div
                                key={idx}
                                className="w-full py-1.5 px-3 rounded-lg bg-white border border-[#2F8F83]/40 text-[#2F8F83] font-semibold text-xs text-center shadow-2xs select-none"
                            >
                                {title}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* List Menu Sections */}
            {sections.length > 0 && (
                <div className="pt-1 space-y-1.5">
                    <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2F8F83] bg-[#EAF7F2] px-2 py-0.5 rounded">
                        <ListFilter size={11} />
                        <span>Interactive Menu List ({sections.length} sections)</span>
                    </div>
                    {sections.map((sec: any, sIdx: number) => (
                        <div key={sIdx} className="bg-white/80 border border-slate-200 rounded-lg p-2 space-y-1">
                            {sec.title && (
                                <p className="text-[11px] font-bold text-slate-700">{sec.title}</p>
                            )}
                            <div className="space-y-1">
                                {(sec.rows || []).map((row: any, rIdx: number) => (
                                    <div
                                        key={rIdx}
                                        className="text-xs flex items-center justify-between p-1 rounded bg-slate-50 border border-slate-100"
                                    >
                                        <div className="min-w-0">
                                            <p className="font-medium text-slate-800 truncate">{row.title}</p>
                                            {row.description && (
                                                <p className="text-[10px] text-slate-500 truncate">{row.description}</p>
                                            )}
                                        </div>
                                        <ChevronRight size={12} className="text-slate-400 shrink-0" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
