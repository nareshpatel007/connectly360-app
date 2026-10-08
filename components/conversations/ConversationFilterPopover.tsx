"use client";

import React from "react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    SlidersHorizontal,
    RotateCcw,
    Calendar,
    User,
    PhoneCall,
    FileText,
    Check,
} from "lucide-react";
import {
    useConversationFilterOptions,
} from "@/lib/api-client-react";

export interface ConversationFiltersState {
    date_preset: string;
    agent: string;
    waba: string;
    message_type: string;
}

interface ConversationFilterPopoverProps {
    filters: ConversationFiltersState;
    onChange: (updated: Partial<ConversationFiltersState>) => void;
    onReset: () => void;
}

export function ConversationFilterPopover({
    filters,
    onChange,
    onReset,
}: ConversationFilterPopoverProps) {
    const { data: optionsData } = useConversationFilterOptions();
    const options = optionsData?.data;

    const activeCount = [
        filters.date_preset && filters.date_preset !== "all_time",
        filters.agent && filters.agent !== "all",
        filters.waba && filters.waba !== "all",
        filters.message_type && filters.message_type !== "all",
    ].filter(Boolean).length;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={`h-8.5 px-2.5 rounded-lg text-xs font-semibold gap-1.5 transition-colors border-[#E5E9EE] shrink-0 ${
                        activeCount > 0
                            ? "bg-[#378179]/10 text-[#378179] border-[#378179]/40 hover:bg-[#378179]/15"
                            : "bg-[#F7F9FA] text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                    title="Filter conversations"
                >
                    <SlidersHorizontal size={13} className={activeCount > 0 ? "text-[#378179]" : "text-slate-500"} />
                    <span className="hidden sm:inline">Filters</span>
                    {activeCount > 0 && (
                        <span className="h-4 w-4 rounded-full bg-[#378179] text-white text-[10px] font-bold flex items-center justify-center">
                            {activeCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>

            <PopoverContent className="w-80 p-3.5 bg-white shadow-xl rounded-2xl border-slate-200" align="end">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                        <SlidersHorizontal size={14} className="text-[#378179]" />
                        <span className="text-xs font-bold text-slate-800">Conversation Filters</span>
                    </div>

                    {activeCount > 0 && (
                        <button
                            type="button"
                            onClick={onReset}
                            className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                        >
                            <RotateCcw size={11} />
                            Reset All
                        </button>
                    )}
                </div>

                <div className="space-y-3.5 text-xs">
                    {/* 1. Date Range Preset */}
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                            <Calendar size={11} className="text-slate-400" />
                            Date Activity
                        </label>
                        <div className="grid grid-cols-3 gap-1">
                            {[
                                { id: "all_time", label: "All Time" },
                                { id: "today", label: "Today" },
                                { id: "yesterday", label: "Yesterday" },
                                { id: "last_7_days", label: "7 Days" },
                                { id: "last_30_days", label: "30 Days" },
                                { id: "this_month", label: "This Month" },
                            ].map((preset) => {
                                const isSelected = (filters.date_preset || "all_time") === preset.id;
                                return (
                                    <button
                                        key={preset.id}
                                        type="button"
                                        onClick={() => onChange({ date_preset: preset.id })}
                                        className={`py-1 px-1.5 text-[10px] font-medium rounded-md border text-center transition-all truncate ${
                                            isSelected
                                                ? "bg-[#378179] text-white border-[#378179] font-bold"
                                                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                                        }`}
                                    >
                                        {preset.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 2. Agent Assignment */}
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                            <User size={11} className="text-slate-400" />
                            Assigned Agent
                        </label>
                        <select
                            value={filters.agent || "all"}
                            onChange={(e) => onChange({ agent: e.target.value })}
                            className="w-full text-xs h-7.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#378179]"
                        >
                            <option value="all">All Agents</option>
                            <option value="me">Assigned to Me</option>
                            <option value="unassigned">Unassigned</option>
                            {options?.agents?.map((agent) => (
                                <option key={agent.id} value={agent.id}>
                                    {agent.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* 3. WhatsApp Business Account (WABA) */}
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                            <PhoneCall size={11} className="text-slate-400" />
                            WhatsApp Account Line
                        </label>
                        <select
                            value={filters.waba || "all"}
                            onChange={(e) => onChange({ waba: e.target.value })}
                            className="w-full text-xs h-7.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#378179]"
                        >
                            <option value="all">All WhatsApp Numbers</option>
                            {options?.waba_accounts?.map((acc) => (
                                <option key={acc.id} value={acc.id}>
                                    {acc.display_name || acc.whatsapp_number} ({acc.whatsapp_number})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* 4. Message Type */}
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                            <FileText size={11} className="text-slate-400" />
                            Message Type
                        </label>
                        <select
                            value={filters.message_type || "all"}
                            onChange={(e) => onChange({ message_type: e.target.value })}
                            className="w-full text-xs h-7.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#378179]"
                        >
                            <option value="all">All Message Types</option>
                            <option value="text">Text Message</option>
                            <option value="image">Image</option>
                            <option value="video">Video</option>
                            <option value="document">Document</option>
                            <option value="audio">Audio</option>
                            <option value="template">Template</option>
                            <option value="interactive">Interactive / Button</option>
                            <option value="location">Location</option>
                            <option value="contacts">Contact Card</option>
                        </select>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
