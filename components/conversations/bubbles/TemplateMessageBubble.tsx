"use client";

import React from "react";
import { BookOpen, ExternalLink, Phone, MessageSquare } from "lucide-react";

interface TemplateMessageBubbleProps {
    templateName?: string | null;
    templateData?: any;
    bodyText?: string;
    isInbound: boolean;
}

export function TemplateMessageBubble({
    templateName,
    templateData,
    bodyText,
    isInbound,
}: TemplateMessageBubbleProps) {
    const data = templateData || {};
    const components = Array.isArray(data.components) ? data.components : [];

    const header = components.find((c: any) => c.type === "HEADER");
    const body = components.find((c: any) => c.type === "BODY") || { text: bodyText };
    const footer = components.find((c: any) => c.type === "FOOTER");
    const buttonsComp = components.find((c: any) => c.type === "BUTTONS");
    const buttons = buttonsComp?.buttons || [];

    return (
        <div className="space-y-2 max-w-[320px]">
            {/* Template Header Badge */}
            <div className="flex items-center gap-1.5 text-[10px] text-[#2F8F83] font-bold uppercase tracking-wider bg-[#2F8F83]/10 px-2 py-0.5 rounded w-fit">
                <BookOpen size={10} />
                <span>Template: {templateName || "Approved Meta Template"}</span>
            </div>

            {/* Header Content */}
            {header?.text && (
                <div className="font-bold text-xs sm:text-sm text-slate-800">
                    {header.text}
                </div>
            )}

            {/* Body */}
            <div className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                {body?.text || bodyText || "Template message"}
            </div>

            {/* Footer */}
            {footer?.text && (
                <div className="text-[10px] text-slate-400 italic">
                    {footer.text}
                </div>
            )}

            {/* Template Action Buttons */}
            {buttons.length > 0 && (
                <div className="space-y-1.5 pt-1 border-t border-slate-100">
                    {buttons.map((btn: any, idx: number) => {
                        const isUrl = btn.type === "URL";
                        const isPhone = btn.type === "PHONE_NUMBER";
                        return (
                            <div
                                key={idx}
                                className="w-full py-1.5 px-3 rounded-lg bg-white border border-[#2F8F83]/30 text-[#2F8F83] font-semibold text-xs flex items-center justify-center gap-1.5 shadow-2xs select-none"
                            >
                                {isUrl && <ExternalLink size={12} />}
                                {isPhone && <Phone size={12} />}
                                {!isUrl && !isPhone && <MessageSquare size={12} />}
                                <span>{btn.text || `Button ${idx + 1}`}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
