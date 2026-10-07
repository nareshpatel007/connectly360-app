"use client";

import React, { useState } from "react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useListQuickReplies, type QuickReplyItem } from "@workspace/api-client-react";
import { Zap, Search, Plus } from "lucide-react";

interface QuickReplyPickerProps {
    onSelect: (content: string) => void;
    trigger?: React.ReactNode;
}

export function QuickReplyPicker({ onSelect, trigger }: QuickReplyPickerProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const { data: replies = [], isLoading } = useListQuickReplies();

    const filtered = (replies || []).filter(
        (r) =>
            r.title.toLowerCase().includes(search.toLowerCase()) ||
            r.shortcut.toLowerCase().includes(search.toLowerCase()) ||
            r.content.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                {trigger || (
                    <button
                        type="button"
                        className="p-1.5 text-slate-400 hover:text-[#378179] rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Quick Replies"
                    >
                        <Zap size={15} />
                    </button>
                )}
            </PopoverTrigger>
            <PopoverContent
                className="w-80 p-3 bg-white rounded-2xl shadow-xl border border-slate-200 space-y-2.5 z-50"
                align="start"
            >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Zap size={13} className="text-[#378179]" />
                        Quick Replies
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Type '/' or pick</span>
                </div>

                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3 w-3 text-slate-400" />
                    <Input
                        type="search"
                        placeholder="Search quick replies..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-7 h-7.5 text-xs bg-slate-50 border-slate-200 rounded-lg"
                    />
                </div>

                <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 -mx-1 px-1">
                    {isLoading ? (
                        <div className="p-4 text-center text-xs text-slate-400">Loading replies...</div>
                    ) : filtered.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400">No quick replies found.</div>
                    ) : (
                        filtered.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                    onSelect(item.content);
                                    setOpen(false);
                                }}
                                className="w-full text-left p-2 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer group space-y-0.5"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-800 group-hover:text-[#378179]">
                                        {item.title}
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                        {item.shortcut}
                                    </span>
                                </div>
                                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                                    {item.content}
                                </p>
                            </button>
                        ))
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
