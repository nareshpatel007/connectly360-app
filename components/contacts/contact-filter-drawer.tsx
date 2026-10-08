"use client";

import React, { useState, useEffect } from "react";
import {
    Filter,
    X,
    RotateCcw,
    Check,
    Users,
    Loader2,
    BookmarkPlus,
    Calendar,
    MapPin,
    ShieldCheck,
    Briefcase
} from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { STAGES } from "@/components/contacts/contact-crm-panel";

export interface ContactFilterState {
    search?: string;
    city?: string;
    stage?: string;
    whatsapp_opt_in?: string; // "true", "false", or ""
    last_interaction?: string; // "7", "30", "older_30", "never", ""
    created_within?: string; // "7", "30", ""
    company?: string;
}

interface ContactFilterDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    filters: ContactFilterState;
    onApplyFilters: (filters: ContactFilterState) => void;
    onResetFilters: () => void;
    onSaveAsSegment: (filters: ContactFilterState) => void;
    matchingCount?: number | null;
}

export function ContactFilterDrawer({
    open,
    onOpenChange,
    filters,
    onApplyFilters,
    onResetFilters,
    onSaveAsSegment,
    matchingCount
}: ContactFilterDrawerProps) {
    const [localFilters, setLocalFilters] = useState<ContactFilterState>(filters);

    useEffect(() => {
        setLocalFilters(filters);
    }, [filters, open]);

    const activeFilterCount = Object.values(localFilters).filter((v) => v && v !== "").length;

    const handleApply = () => {
        onApplyFilters(localFilters);
        onOpenChange(false);
    };

    const handleReset = () => {
        setLocalFilters({});
        onResetFilters();
        onOpenChange(false);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col bg-white border-l border-slate-200">
                <SheetHeader className="p-5 border-b border-slate-100 flex flex-row items-center justify-between">
                    <div>
                        <SheetTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <Filter size={16} className="text-[#35877D]" />
                            <span>Filter Contacts</span>
                            {activeFilterCount > 0 && (
                                <Badge className="bg-[#35877D] text-white text-[10px] font-bold px-1.5 py-0 h-4 rounded-full">
                                    {activeFilterCount}
                                </Badge>
                            )}
                        </SheetTitle>
                        <SheetDescription className="text-xs text-slate-500 mt-0.5">
                            Find specific customer groups and build audiences.
                        </SheetDescription>
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
                    {/* Category: WhatsApp Marketing Permission */}
                    <div className="space-y-2 p-3 rounded-xl bg-slate-50/70 border border-slate-200/60">
                        <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <ShieldCheck size={14} className="text-[#35877D]" />
                            WhatsApp Marketing Permission
                        </Label>
                        <div className="grid grid-cols-3 gap-1.5">
                            <button
                                type="button"
                                onClick={() => setLocalFilters((prev) => ({ ...prev, whatsapp_opt_in: "" }))}
                                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                                    !localFilters.whatsapp_opt_in
                                        ? "bg-white text-slate-900 border border-slate-300 shadow-2xs"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200/60"
                                }`}
                            >
                                All
                            </button>
                            <button
                                type="button"
                                onClick={() => setLocalFilters((prev) => ({ ...prev, whatsapp_opt_in: "true" }))}
                                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                                    localFilters.whatsapp_opt_in === "true"
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-2xs"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200/60"
                                }`}
                            >
                                Opted-in
                            </button>
                            <button
                                type="button"
                                onClick={() => setLocalFilters((prev) => ({ ...prev, whatsapp_opt_in: "false" }))}
                                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                                    localFilters.whatsapp_opt_in === "false"
                                        ? "bg-red-50 text-red-700 border border-red-300 shadow-2xs"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200/60"
                                }`}
                            >
                                No Opt-in
                            </button>
                        </div>
                    </div>

                    {/* Category: CRM Lead Stage */}
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-800">Lead Stage</Label>
                        <div className="grid grid-cols-2 gap-1.5">
                            {STAGES.map((s) => {
                                const isSelected = localFilters.stage === s.key;
                                return (
                                    <button
                                        key={s.key}
                                        type="button"
                                        onClick={() =>
                                            setLocalFilters((prev) => ({
                                                ...prev,
                                                stage: isSelected ? "" : s.key
                                            }))
                                        }
                                        className={`flex items-center gap-1.5 p-2 rounded-xl text-xs font-semibold border transition-all text-left ${
                                            isSelected
                                                ? "bg-teal-50/60 border-[#35877D] text-slate-900 shadow-2xs"
                                                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                                        }`}
                                    >
                                        <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                                        <span className="truncate">{s.label}</span>
                                        {isSelected && <Check size={12} className="ml-auto text-[#35877D]" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Category: Location & Company */}
                    <div className="space-y-3">
                        <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <MapPin size={14} className="text-[#35877D]" />
                            Location & Organization
                        </Label>
                        <div className="space-y-2">
                            <div>
                                <span className="text-[11px] font-semibold text-slate-500 mb-1 block">City</span>
                                <Input
                                    placeholder="e.g. Ahmedabad, Mumbai"
                                    value={localFilters.city || ""}
                                    onChange={(e) => setLocalFilters((prev) => ({ ...prev, city: e.target.value }))}
                                    className="h-8 text-xs rounded-lg border-slate-200"
                                />
                            </div>
                            <div>
                                <span className="text-[11px] font-semibold text-slate-500 mb-1 block">Company</span>
                                <Input
                                    placeholder="e.g. Acme Corp"
                                    value={localFilters.company || ""}
                                    onChange={(e) => setLocalFilters((prev) => ({ ...prev, company: e.target.value }))}
                                    className="h-8 text-xs rounded-lg border-slate-200"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Category: WhatsApp Interaction Activity */}
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <Calendar size={14} className="text-[#35877D]" />
                            Last Conversation Activity
                        </Label>
                        <div className="grid grid-cols-2 gap-1.5">
                            {[
                                { key: "7", label: "Active in last 7 days" },
                                { key: "30", label: "Active in last 30 days" },
                                { key: "older_30", label: "Inactive for 30+ days" },
                                { key: "never", label: "Never interacted" },
                            ].map((item) => {
                                const isSelected = localFilters.last_interaction === item.key;
                                return (
                                    <button
                                        key={item.key}
                                        type="button"
                                        onClick={() =>
                                            setLocalFilters((prev) => ({
                                                ...prev,
                                                last_interaction: isSelected ? "" : item.key
                                            }))
                                        }
                                        className={`p-2 rounded-xl text-[11px] font-semibold border transition-all text-left ${
                                            isSelected
                                                ? "bg-teal-50/60 border-[#35877D] text-slate-900 shadow-2xs"
                                                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                                        }`}
                                    >
                                        {item.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Matching Count Preview */}
                    {matchingCount !== undefined && matchingCount !== null && (
                        <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                <Users size={14} className="text-[#35877D]" />
                                Matching Contacts
                            </span>
                            <Badge className="bg-[#35877D] text-white text-xs font-black px-2 py-0.5 rounded-full">
                                {matchingCount.toLocaleString()} Contacts
                            </Badge>
                        </div>
                    )}
                </div>

                <SheetFooter className="p-4 border-t border-slate-100 flex flex-col gap-2 bg-slate-50/60">
                    <div className="flex items-center gap-2 w-full">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleReset}
                            className="flex-1 rounded-xl border-slate-200 text-xs font-bold text-slate-600 cursor-pointer"
                        >
                            <RotateCcw size={12} className="mr-1.5" />
                            Reset
                        </Button>

                        <Button
                            type="button"
                            size="sm"
                            onClick={handleApply}
                            className="flex-1 rounded-xl bg-[#35877D] hover:bg-[#2c6e66] text-white font-bold text-xs shadow-xs cursor-pointer"
                        >
                            Apply Filters
                        </Button>
                    </div>

                    {activeFilterCount > 0 && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onSaveAsSegment(localFilters)}
                            className="w-full rounded-xl border-teal-200 bg-white text-[#35877D] hover:bg-teal-50 font-bold text-xs shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
                        >
                            <BookmarkPlus size={13} />
                            Save as Reusable Segment
                        </Button>
                    )}
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
