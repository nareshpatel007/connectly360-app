"use client";

import React, { useState } from "react";
import {
    Download,
    FileSpreadsheet,
    Check,
    Loader2,
    Users,
    Filter
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface ContactExportModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    totalCount: number;
    selectedCount: number;
    selectedIds: number[];
    activeFiltersCount: number;
    searchQuery: string;
    token?: string | null;
}

export function ContactExportModal({
    open,
    onOpenChange,
    totalCount,
    selectedCount,
    selectedIds,
    activeFiltersCount,
    searchQuery,
    token
}: ContactExportModalProps) {
    const [scope, setScope] = useState<"all" | "selected" | "filtered">(
        selectedCount > 0 ? "selected" : activeFiltersCount > 0 ? "filtered" : "all"
    );
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const params = new URLSearchParams();
            params.set("scope", scope);

            if (scope === "selected" && selectedIds.length > 0) {
                params.set("ids", selectedIds.join(","));
            } else if (scope === "filtered" && searchQuery) {
                params.set("search", searchQuery);
            }

            const exportUrl = `/api/customers/export?${params.toString()}`;

            const link = document.createElement("a");
            link.href = exportUrl;
            link.setAttribute("download", `contacts_${scope}_${new Date().toISOString().slice(0, 10)}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success("Export initiated! Your CSV download will start momentarily.");
            onOpenChange(false);
        } catch (err: any) {
            toast.error(err.message || "Failed to trigger export.");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-white rounded-2xl border-slate-200">
                <DialogHeader className="p-6 pb-4 bg-slate-50/70 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#35877D]/10 text-[#35877D] flex items-center justify-center font-bold">
                            <Download size={20} />
                        </div>
                        <div>
                            <DialogTitle className="text-base font-bold text-slate-900">
                                Export Contacts
                            </DialogTitle>
                            <DialogDescription className="text-xs text-slate-500">
                                Download customer database as an Excel-friendly CSV.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6 space-y-4">
                    <Label className="text-xs font-bold text-slate-800">
                        Choose Export Scope:
                    </Label>

                    <div className="space-y-2.5">
                        {/* Option 1: Selected (if any selected) */}
                        <label
                            className={`border rounded-xl p-3 flex items-center justify-between cursor-pointer transition-all ${
                                selectedCount === 0
                                    ? "opacity-50 cursor-not-allowed border-slate-100 bg-slate-50/50"
                                    : scope === "selected"
                                    ? "border-[#35877D] bg-teal-50/30 ring-1 ring-[#35877D]"
                                    : "border-slate-200 hover:border-slate-300"
                            }`}
                        >
                            <div className="flex items-center gap-2.5">
                                <input
                                    type="radio"
                                    name="export_scope"
                                    checked={scope === "selected"}
                                    disabled={selectedCount === 0}
                                    onChange={() => setScope("selected")}
                                    className="accent-[#35877D]"
                                />
                                <div>
                                    <div className="text-xs font-bold text-slate-800">Selected Contacts Only</div>
                                    <div className="text-[11px] text-slate-500">
                                        Only the {selectedCount} contacts currently checked in table
                                    </div>
                                </div>
                            </div>
                            <Badge variant="outline" className="text-xs font-bold">
                                {selectedCount}
                            </Badge>
                        </label>

                        {/* Option 2: Current Filtered / Searched */}
                        <label
                            className={`border rounded-xl p-3 flex items-center justify-between cursor-pointer transition-all ${
                                scope === "filtered"
                                    ? "border-[#35877D] bg-teal-50/30 ring-1 ring-[#35877D]"
                                    : "border-slate-200 hover:border-slate-300"
                            }`}
                        >
                            <div className="flex items-center gap-2.5">
                                <input
                                    type="radio"
                                    name="export_scope"
                                    checked={scope === "filtered"}
                                    onChange={() => setScope("filtered")}
                                    className="accent-[#35877D]"
                                />
                                <div>
                                    <div className="text-xs font-bold text-slate-800">Current Filtered Results</div>
                                    <div className="text-[11px] text-slate-500">
                                        {searchQuery || activeFiltersCount > 0
                                            ? `Contacts matching search "${searchQuery || 'active filters'}"`
                                            : "Contacts currently visible on page"}
                                    </div>
                                </div>
                            </div>
                            <Badge className="bg-teal-50 text-teal-800 border-teal-200 text-xs font-bold">
                                Active Filter
                            </Badge>
                        </label>

                        {/* Option 3: All Contacts */}
                        <label
                            className={`border rounded-xl p-3 flex items-center justify-between cursor-pointer transition-all ${
                                scope === "all"
                                    ? "border-[#35877D] bg-teal-50/30 ring-1 ring-[#35877D]"
                                    : "border-slate-200 hover:border-slate-300"
                            }`}
                        >
                            <div className="flex items-center gap-2.5">
                                <input
                                    type="radio"
                                    name="export_scope"
                                    checked={scope === "all"}
                                    onChange={() => setScope("all")}
                                    className="accent-[#35877D]"
                                />
                                <div>
                                    <div className="text-xs font-bold text-slate-800">All Workspace Contacts</div>
                                    <div className="text-[11px] text-slate-500">
                                        Full database export including all CRM fields and opt-in status
                                    </div>
                                </div>
                            </div>
                            <Badge variant="outline" className="text-xs font-bold">
                                {totalCount} Total
                            </Badge>
                        </label>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px] text-slate-600 flex items-start gap-2">
                        <FileSpreadsheet size={16} className="text-[#35877D] shrink-0 mt-0.5" />
                        <div>
                            Formatted with UTF-8 BOM encoding for seamless viewing in Microsoft Excel, Google Sheets, and Apple Numbers without character corruptions.
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-4 px-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        className="h-9 text-xs"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        disabled={isExporting}
                        onClick={handleExport}
                        className="bg-[#35877D] hover:bg-[#2d736a] text-white h-9 text-xs font-semibold gap-1.5 shadow-sm"
                    >
                        {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                        Download CSV
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
