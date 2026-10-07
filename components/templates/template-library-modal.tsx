"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    useListTemplateLibrary,
    LibraryTemplate,
    TemplateButton,
} from "@/lib/api-client-react";
import {
    Sparkles,
    Megaphone,
    Bell,
    KeyRound,
    Check,
    ArrowRight,
    Loader2,
} from "lucide-react";

interface TemplateLibraryModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelectTemplate: (template: LibraryTemplate) => void;
}

export function TemplateLibraryModal({
    open,
    onOpenChange,
    onSelectTemplate,
}: TemplateLibraryModalProps) {
    const { data: library, isLoading } = useListTemplateLibrary();
    const [selectedTab, setSelectedTab] = useState<"marketing" | "utility" | "authentication">("marketing");

    const activeTemplates: LibraryTemplate[] = library ? library[selectedTab] || [] : [];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[85vh] h-[750px] flex flex-col p-0 overflow-hidden bg-white rounded-3xl">
                <DialogHeader className="px-6 pt-5 pb-3 border-b border-slate-100 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-xl bg-[#2F8F83]/10 text-[#2F8F83] flex items-center justify-center font-bold">
                            <Sparkles className="size-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-base font-bold text-slate-900">
                                Template Starter Library
                            </DialogTitle>
                            <DialogDescription className="text-xs text-slate-500">
                                Choose from pre-crafted WhatsApp message templates compliant with Meta categories.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {/* Tabs */}
                <div className="flex items-center gap-2 px-6 py-2.5 bg-slate-50 border-b border-slate-100 shrink-0">
                    <button
                        type="button"
                        onClick={() => setSelectedTab("marketing")}
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            selectedTab === "marketing"
                                ? "bg-white text-purple-700 shadow-2xs border border-purple-200"
                                : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                        <Megaphone className="size-3.5 text-purple-600" />
                        Marketing
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedTab("utility")}
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            selectedTab === "utility"
                                ? "bg-white text-sky-700 shadow-2xs border border-sky-200"
                                : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                        <Bell className="size-3.5 text-sky-600" />
                        Utility
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedTab("authentication")}
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            selectedTab === "authentication"
                                ? "bg-white text-amber-700 shadow-2xs border border-amber-200"
                                : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                        <KeyRound className="size-3.5 text-amber-600" />
                        Authentication (OTP)
                    </button>
                </div>

                {/* Template Cards List */}
                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
                            <Loader2 className="size-6 animate-spin text-[#2F8F83]" />
                            <p className="text-xs">Loading template library...</p>
                        </div>
                    ) : activeTemplates.length === 0 ? (
                        <div className="text-center py-20 text-slate-400 text-xs">
                            No starter templates found in this category.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {activeTemplates.map((item) => (
                                <div
                                    key={item.id}
                                    className="border border-slate-200 hover:border-[#2F8F83]/60 bg-white rounded-2xl p-4 flex flex-col justify-between transition-all hover:shadow-xs group"
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <h3 className="text-xs font-bold text-slate-900 group-hover:text-[#2F8F83] transition-colors">
                                                    {item.title}
                                                </h3>
                                                <p className="text-[11px] text-slate-500 mt-0.5">{item.description}</p>
                                            </div>
                                            <Badge
                                                variant="outline"
                                                className={`text-[10px] font-semibold border ${
                                                    item.category === "Marketing"
                                                        ? "bg-purple-50 text-purple-700 border-purple-200"
                                                        : item.category === "Utility"
                                                        ? "bg-sky-50 text-sky-700 border-sky-200"
                                                        : "bg-amber-50 text-amber-700 border-amber-200"
                                                }`}
                                            >
                                                {item.category}
                                            </Badge>
                                        </div>

                                        {/* Content snippet */}
                                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs space-y-1.5 font-normal text-slate-700">
                                            {item.header_type !== "none" && (
                                                <div className="text-[10px] font-bold text-[#2F8F83] uppercase flex items-center gap-1">
                                                    <span>Header: {item.header_type}</span>
                                                </div>
                                            )}
                                            <p className="whitespace-pre-wrap leading-relaxed text-[11px] line-clamp-4">
                                                {item.body_text}
                                            </p>
                                            {item.footer_text && (
                                                <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-200/60">
                                                    {item.footer_text}
                                                </p>
                                            )}
                                        </div>

                                        {/* Button tags */}
                                        {item.buttons && item.buttons.length > 0 && (
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                {item.buttons.map((b, i) => (
                                                    <span
                                                        key={i}
                                                        className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium"
                                                    >
                                                        {b.type === "URL" ? "🔗 " : b.type === "PHONE_NUMBER" ? "📞 " : b.type === "COPY_CODE" ? "📋 " : "💬 "}
                                                        {b.text || b.type}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-end">
                                        <Button
                                            size="sm"
                                            onClick={() => {
                                                onSelectTemplate(item);
                                                onOpenChange(false);
                                            }}
                                            className="bg-[#2F8F83] hover:bg-[#267A70] text-white text-xs h-8 px-3 rounded-xl flex items-center gap-1 cursor-pointer font-medium"
                                        >
                                            <span>Use This Template</span>
                                            <ArrowRight className="size-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
