"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Filter,
    Plus,
    Trash2,
    Users,
    Sparkles,
    CheckCircle2,
    Loader2,
    AlertCircle,
    Info,
    Layers
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export interface SegmentRule {
    field: string;
    operator: string;
    value: string;
}

export interface SegmentRulesGroup {
    combinator: "AND" | "OR";
    rules: SegmentRule[];
}

export interface SegmentData {
    id?: string;
    name: string;
    description: string;
    rules_json: SegmentRulesGroup;
    targetCount?: number;
    isSystem?: boolean;
}

interface SegmentBuilderDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    token: string | null;
    editingSegment?: SegmentData | null;
    onSaveSuccess: (segment: any) => void;
}

const FIELD_OPTIONS = [
    { value: "lead_status", label: "Lead Status / Stage", defaultOp: "equals", defaultValue: "Won" },
    { value: "whatsapp_opt_in", label: "WhatsApp Opt-in", defaultOp: "equals", defaultValue: "true" },
    { value: "created_at", label: "Created Date", defaultOp: "within_days", defaultValue: "7" },
    { value: "last_interaction", label: "Last Conversation Interaction", defaultOp: "older_than_days", defaultValue: "30" },
    { value: "city", label: "City / Location", defaultOp: "equals", defaultValue: "New York" },
    { value: "tag", label: "Customer Tag", defaultOp: "equals", defaultValue: "VIP" },
    { value: "name", label: "Customer Name", defaultOp: "contains", defaultValue: "" },
    { value: "phone", label: "Phone Number", defaultOp: "contains", defaultValue: "" },
];

const STAGE_OPTIONS = [
    { value: "Won", label: "Won / Converted" },
    { value: "New", label: "New Lead" },
    { value: "Contacted", label: "Contacted" },
    { value: "Qualified", label: "Qualified" },
    { value: "Proposal", label: "Proposal Sent" },
    { value: "Lost", label: "Lost / Closed" },
];

export function SegmentBuilderDialog({
    open,
    onOpenChange,
    token,
    editingSegment,
    onSaveSuccess
}: SegmentBuilderDialogProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [combinator, setCombinator] = useState<"AND" | "OR">("AND");
    const [rules, setRules] = useState<SegmentRule[]>([
        { field: "lead_status", operator: "equals", value: "Won" },
        { field: "whatsapp_opt_in", operator: "equals", value: "true" }
    ]);

    // Live preview state
    const [previewCount, setPreviewCount] = useState<number | null>(null);
    const [sampleContacts, setSampleContacts] = useState<any[]>([]);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Initialize state on open/edit
    useEffect(() => {
        if (open) {
            if (editingSegment) {
                setName(editingSegment.name || "");
                setDescription(editingSegment.description || "");
                const group = editingSegment.rules_json;
                if (group && Array.isArray(group.rules)) {
                    setCombinator(group.combinator || "AND");
                    setRules(group.rules.length > 0 ? group.rules : [
                        { field: "lead_status", operator: "equals", value: "Won" }
                    ]);
                } else if (Array.isArray(group)) {
                    setCombinator("AND");
                    setRules(group);
                }
            } else {
                setName("");
                setDescription("");
                setCombinator("AND");
                setRules([
                    { field: "lead_status", operator: "equals", value: "Won" },
                    { field: "whatsapp_opt_in", operator: "equals", value: "true" }
                ]);
            }
        }
    }, [open, editingSegment]);

    // Live Preview API Evaluation
    const runPreview = useCallback(async (currentRules: SegmentRule[], comb: "AND" | "OR") => {
        if (!token) return;
        setIsPreviewLoading(true);
        try {
            const rulesGroup: SegmentRulesGroup = {
                combinator: comb,
                rules: currentRules
            };

            const res = await fetch("/api/segments/preview", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ rules_json: rulesGroup })
            });

            const data = await res.json();
            if (data.status) {
                setPreviewCount(data.count ?? 0);
                setSampleContacts(data.sampleContacts || []);
            }
        } catch (err) {
            console.error("Preview error:", err);
        } finally {
            setIsPreviewLoading(false);
        }
    }, [token]);

    // Debounced trigger preview when rules change
    useEffect(() => {
        if (!open) return;
        const timer = setTimeout(() => {
            runPreview(rules, combinator);
        }, 350);
        return () => clearTimeout(timer);
    }, [rules, combinator, open, runPreview]);

    const handleFieldChange = (index: number, newField: string) => {
        const fieldMeta = FIELD_OPTIONS.find((f) => f.value === newField);
        setRules((prev) =>
            prev.map((r, i) =>
                i === index
                    ? {
                          field: newField,
                          operator: fieldMeta?.defaultOp || "equals",
                          value: fieldMeta?.defaultValue || ""
                      }
                    : r
            )
        );
    };

    const handleOperatorChange = (index: number, newOp: string) => {
        setRules((prev) =>
            prev.map((r, i) => (i === index ? { ...r, operator: newOp } : r))
        );
    };

    const handleValueChange = (index: number, newVal: string) => {
        setRules((prev) =>
            prev.map((r, i) => (i === index ? { ...r, value: newVal } : r))
        );
    };

    const handleAddRule = () => {
        setRules((prev) => [
            ...prev,
            { field: "lead_status", operator: "equals", value: "New" }
        ]);
    };

    const handleRemoveRule = (index: number) => {
        if (rules.length <= 1) {
            toast.error("Segment must have at least one condition.");
            return;
        }
        setRules((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error("Please enter a segment name.");
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                name: name.trim(),
                description: description.trim(),
                rules_json: {
                    combinator,
                    rules
                }
            };

            const url = editingSegment?.id
                ? `/api/segments/${editingSegment.id}`
                : "/api/segments";
            const method = editingSegment?.id ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (data.status) {
                toast.success(
                    editingSegment
                        ? "Segment updated successfully!"
                        : "Segment created successfully!"
                );
                onSaveSuccess(data.data);
                onOpenChange(false);
            } else {
                toast.error(data.message || "Failed to save segment");
            }
        } catch {
            toast.error("Network error saving segment");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 bg-white border border-slate-200">
                <DialogHeader className="border-b border-slate-100 pb-3">
                    <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-[#35877D]/10 text-[#35877D] flex items-center justify-center">
                            <Filter size={16} />
                        </div>
                        {editingSegment ? "Edit Customer Segment" : "Create New Customer Segment"}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500">
                        Define dynamic criteria using AND/OR logical rules. The segment engine continuously updates your contact audience.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 pt-3">
                    {/* Metadata Section */}
                    <div className="space-y-3 bg-slate-50/60 p-3.5 rounded-xl border border-slate-100">
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-slate-700">Segment Name *</Label>
                            <Input
                                required
                                placeholder="e.g. Q4 High Value Repeat Buyers"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="h-9 rounded-xl border-slate-200 bg-white text-xs font-semibold"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-slate-700">Description</Label>
                            <Textarea
                                rows={2}
                                placeholder="Purpose, audience criteria, and campaign goals..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="rounded-xl border-slate-200 bg-white text-xs font-semibold"
                            />
                        </div>
                    </div>

                    {/* Definition & Rules Section */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Layers size={15} className="text-[#35877D]" />
                                <span className="text-xs font-bold text-slate-800">Targeting Rules</span>
                            </div>

                            {/* Combinator Switcher */}
                            <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-bold">
                                <button
                                    type="button"
                                    onClick={() => setCombinator("AND")}
                                    className={`px-2.5 py-1 rounded-md text-[11px] transition-all cursor-pointer ${
                                        combinator === "AND"
                                            ? "bg-[#35877D] text-white shadow-xs"
                                            : "text-slate-600 hover:text-slate-900"
                                    }`}
                                >
                                    Match ALL (AND)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCombinator("OR")}
                                    className={`px-2.5 py-1 rounded-md text-[11px] transition-all cursor-pointer ${
                                        combinator === "OR"
                                            ? "bg-[#35877D] text-white shadow-xs"
                                            : "text-slate-600 hover:text-slate-900"
                                    }`}
                                >
                                    Match ANY (OR)
                                </button>
                            </div>
                        </div>

                        {/* Condition Rows */}
                        <div className="space-y-2">
                            {rules.map((rule, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-xl shadow-2xs group hover:border-slate-300 transition-colors"
                                >
                                    <div className="text-[10px] font-black uppercase text-slate-400 w-8 text-center shrink-0">
                                        {idx === 0 ? "IF" : combinator}
                                    </div>

                                    {/* Field Selector */}
                                    <select
                                        value={rule.field}
                                        onChange={(e) => handleFieldChange(idx, e.target.value)}
                                        className="h-8 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#35877D] shrink-0"
                                    >
                                        {FIELD_OPTIONS.map((f) => (
                                            <option key={f.value} value={f.value}>
                                                {f.label}
                                            </option>
                                        ))}
                                    </select>

                                    {/* Operator Selector */}
                                    <select
                                        value={rule.operator}
                                        onChange={(e) => handleOperatorChange(idx, e.target.value)}
                                        className="h-8 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-[#35877D] shrink-0"
                                    >
                                        {rule.field === "created_at" ? (
                                            <>
                                                <option value="within_days">is within last (days)</option>
                                                <option value="older_than_days">is older than (days)</option>
                                            </>
                                        ) : rule.field === "last_interaction" ? (
                                            <>
                                                <option value="older_than_days">older than (days ago)</option>
                                                <option value="within_days">active within last (days)</option>
                                            </>
                                        ) : rule.field === "whatsapp_opt_in" ? (
                                            <>
                                                <option value="equals">equals</option>
                                            </>
                                        ) : (
                                            <>
                                                <option value="equals">equals</option>
                                                <option value="not_equals">does not equal</option>
                                                {rule.field !== "lead_status" && (
                                                    <>
                                                        <option value="contains">contains</option>
                                                        <option value="is_not_empty">is not empty</option>
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </select>

                                    {/* Value Input */}
                                    <div className="flex-1 min-w-[120px]">
                                        {rule.field === "lead_status" ? (
                                            <select
                                                value={rule.value}
                                                onChange={(e) => handleValueChange(idx, e.target.value)}
                                                className="w-full h-8 px-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#35877D]"
                                            >
                                                {STAGE_OPTIONS.map((s) => (
                                                    <option key={s.value} value={s.value}>
                                                        {s.label}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : rule.field === "whatsapp_opt_in" ? (
                                            <select
                                                value={rule.value}
                                                onChange={(e) => handleValueChange(idx, e.target.value)}
                                                className="w-full h-8 px-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#35877D]"
                                            >
                                                <option value="true">True (Opted-in)</option>
                                                <option value="false">False (Opted-out)</option>
                                            </select>
                                        ) : rule.operator === "within_days" || rule.operator === "older_than_days" ? (
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    value={rule.value}
                                                    onChange={(e) => handleValueChange(idx, e.target.value)}
                                                    className="h-8 rounded-lg border-slate-200 text-xs font-semibold pr-12"
                                                    placeholder="e.g. 7"
                                                />
                                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">
                                                    days
                                                </span>
                                            </div>
                                        ) : (
                                            <Input
                                                type="text"
                                                value={rule.value}
                                                onChange={(e) => handleValueChange(idx, e.target.value)}
                                                className="h-8 rounded-lg border-slate-200 text-xs font-semibold"
                                                placeholder="Value..."
                                            />
                                        )}
                                    </div>

                                    {/* Delete Button */}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveRule(idx)}
                                        className="h-8 w-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
                                        title="Remove Condition"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Add Rule Button */}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddRule}
                            className="w-full rounded-xl border-dashed border-slate-300 text-slate-600 hover:text-[#35877D] hover:border-[#35877D] h-8 text-xs font-semibold gap-1.5 cursor-pointer"
                        >
                            <Plus size={14} />
                            Add Condition
                        </Button>
                    </div>

                    {/* Live Segment Engine Preview Card */}
                    <div className="bg-gradient-to-r from-teal-50/50 to-emerald-50/30 border border-teal-100 rounded-xl p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                                <Users size={14} className="text-[#35877D]" />
                                <span>Segment Engine Output:</span>
                            </div>

                            <div className="flex items-center gap-2">
                                {isPreviewLoading ? (
                                    <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                                        <Loader2 size={12} className="animate-spin text-[#35877D]" />
                                        Evaluating...
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#35877D]/10 text-[#35877D] text-xs font-black">
                                        {previewCount !== null ? previewCount : 0} Matching Contacts
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Sample contacts preview chips */}
                        {sampleContacts.length > 0 && (
                            <div className="pt-1.5 border-t border-teal-100/60">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                    Sample Audience:
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {sampleContacts.slice(0, 4).map((c, i) => (
                                        <span
                                            key={i}
                                            className="px-2 py-0.5 rounded-md bg-white border border-teal-200/80 text-[11px] font-semibold text-slate-700 shadow-2xs"
                                        >
                                            {c.name || "Contact"} <span className="text-slate-400 font-mono text-[10px]">({c.phone})</span>
                                        </span>
                                    ))}
                                    {sampleContacts.length > 4 && (
                                        <span className="px-1.5 py-0.5 text-[10px] font-bold text-slate-400 self-center">
                                            +{previewCount! - 4} more
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <DialogFooter className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="rounded-xl border-slate-200 text-slate-700 font-bold text-xs h-9"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSaving}
                            className="bg-[#35877D] hover:bg-[#2c6e66] text-white font-bold text-xs rounded-xl h-9 px-5 shadow-xs gap-1.5"
                        >
                            {isSaving && <Loader2 size={13} className="animate-spin" />}
                            {editingSegment ? "Update Segment" : "Save Segment"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
