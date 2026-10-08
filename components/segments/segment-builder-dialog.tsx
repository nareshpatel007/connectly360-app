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
    Layers,
    Send,
    HelpCircle
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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
    type?: "dynamic" | "static";
    rules_json: SegmentRulesGroup;
    targetCount?: number;
    isSystem?: boolean;
}

interface SegmentBuilderDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    token: string | null;
    editingSegment?: SegmentData | null;
    initialRules?: SegmentRule[];
    onSaveSuccess: (segment: any) => void;
}

const FIELD_OPTIONS = [
    { value: "lead_status", label: "Lead Stage", defaultOp: "equals", defaultValue: "Won", category: "CRM" },
    { value: "whatsapp_opt_in", label: "WhatsApp Marketing Permission", defaultOp: "equals", defaultValue: "true", category: "WhatsApp" },
    { value: "city", label: "City", defaultOp: "equals", defaultValue: "Ahmedabad", category: "Location" },
    { value: "state", label: "State", defaultOp: "equals", defaultValue: "Gujarat", category: "Location" },
    { value: "company", label: "Company", defaultOp: "contains", defaultValue: "", category: "Basic" },
    { value: "tag", label: "Customer Tag", defaultOp: "equals", defaultValue: "VIP", category: "CRM" },
    { value: "last_interaction", label: "Last WhatsApp Interaction", defaultOp: "within_days", defaultValue: "30", category: "Activity" },
    { value: "created_at", label: "Contact Created", defaultOp: "within_days", defaultValue: "7", category: "Activity" },
    { value: "campaign_received", label: "Received WhatsApp Campaign", defaultOp: "equals", defaultValue: "true", category: "Campaigns" },
    { value: "campaign_read", label: "Read WhatsApp Campaign", defaultOp: "equals", defaultValue: "true", category: "Campaigns" },
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
    initialRules,
    onSaveSuccess
}: SegmentBuilderDialogProps) {
    const router = useRouter();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [audienceType, setAudienceType] = useState<"dynamic" | "static">("dynamic");
    const [combinator, setCombinator] = useState<"AND" | "OR">("AND");
    const [rules, setRules] = useState<SegmentRule[]>([
        { field: "lead_status", operator: "equals", value: "Won" },
        { field: "whatsapp_opt_in", operator: "equals", value: "true" }
    ]);

    // Live preview state
    const [previewCount, setPreviewCount] = useState<number | null>(null);
    const [sampleContacts, setSampleContacts] = useState<any[]>([]);
    const [summaryText, setSummaryText] = useState<string>("");
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Initialize state on open/edit
    useEffect(() => {
        if (open) {
            if (editingSegment) {
                setName(editingSegment.name || "");
                setDescription(editingSegment.description || "");
                setAudienceType(editingSegment.type || "dynamic");
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
            } else if (initialRules && initialRules.length > 0) {
                setName("");
                setDescription("");
                setAudienceType("dynamic");
                setCombinator("AND");
                setRules(initialRules);
            } else {
                setName("");
                setDescription("");
                setAudienceType("dynamic");
                setCombinator("AND");
                setRules([
                    { field: "lead_status", operator: "equals", value: "Won" },
                    { field: "whatsapp_opt_in", operator: "equals", value: "true" }
                ]);
            }
        }
    }, [open, editingSegment, initialRules]);

    // Live Preview API Evaluation
    const runPreview = useCallback(async (currentRules: SegmentRule[], comb: "AND" | "OR") => {
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
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ rules_json: rulesGroup })
            });

            const data = await res.json();
            if (data.status) {
                setPreviewCount(data.count ?? 0);
                setSampleContacts(data.sampleContacts || []);
                setSummaryText(data.summaryText || "");
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
            { field: "city", operator: "equals", value: "Ahmedabad" }
        ]);
    };

    const handleRemoveRule = (index: number) => {
        if (rules.length <= 1) {
            toast.error("An audience must have at least one condition.");
            return;
        }
        setRules((prev) => prev.filter((_, i) => i !== index));
    };

    const saveSegment = async (redirectBroadcast = false) => {
        if (!name.trim()) {
            toast.error("Please enter an audience name.");
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                name: name.trim(),
                description: description.trim(),
                type: audienceType,
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
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (data.status) {
                toast.success(data.message || "Audience saved successfully!");
                onSaveSuccess(data.data);
                onOpenChange(false);
                if (redirectBroadcast && data.data?.id) {
                    router.push(`/marketing/campaigns/new?segment_id=${data.data.id}`);
                }
            } else {
                toast.error(data.message || "Failed to save audience");
            }
        } catch (err: any) {
            toast.error(err.message || "Network error saving audience");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-6 rounded-2xl bg-white border border-slate-200">
                <DialogHeader className="border-b border-slate-100 pb-3">
                    <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <Filter size={18} className="text-[#35877D]" />
                        <span>{editingSegment ? "Edit Audience Segment" : "Create New Customer Segment"}</span>
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500">
                        Define reusable criteria for campaigns and customer targeting.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-5 py-2 pr-1">
                    {/* Audience Name & Description */}
                    <div className="grid grid-cols-1 gap-3.5">
                        <div className="space-y-1.5">
                            <Label htmlFor="segment-name" className="text-xs font-bold text-slate-700">
                                Audience Name *
                            </Label>
                            <Input
                                id="segment-name"
                                placeholder="e.g. Ahmedabad Active Customers"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="h-9 rounded-xl border-slate-200 text-xs focus:ring-[#35877D]"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="segment-desc" className="text-xs font-bold text-slate-700">
                                Description (Optional)
                            </Label>
                            <Input
                                id="segment-desc"
                                placeholder="e.g. Customers in Ahmedabad who opted in and interacted recently"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="h-9 rounded-xl border-slate-200 text-xs"
                            />
                        </div>
                    </div>

                    {/* Audience Type: Dynamic vs Static */}
                    <div className="space-y-2 p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                        <Label className="text-xs font-bold text-slate-700 block">Audience Behavior</Label>
                        <div className="grid grid-cols-2 gap-3">
                            <div
                                onClick={() => setAudienceType("dynamic")}
                                className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                    audienceType === "dynamic"
                                        ? "border-[#35877D] bg-teal-50/40"
                                        : "border-slate-200 bg-white hover:bg-slate-50"
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        checked={audienceType === "dynamic"}
                                        onChange={() => setAudienceType("dynamic")}
                                        className="accent-[#35877D]"
                                    />
                                    <span className="text-xs font-bold text-slate-900">Dynamic Audience</span>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-1 pl-5">
                                    Automatically updates as contacts match or stop matching your conditions.
                                </p>
                            </div>

                            <div
                                onClick={() => setAudienceType("static")}
                                className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                    audienceType === "static"
                                        ? "border-[#35877D] bg-teal-50/40"
                                        : "border-slate-200 bg-white hover:bg-slate-50"
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        checked={audienceType === "static"}
                                        onChange={() => setAudienceType("static")}
                                        className="accent-[#35877D]"
                                    />
                                    <span className="text-xs font-bold text-slate-900">Static Snapshot</span>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-1 pl-5">
                                    Save current matching contacts as a fixed list that never changes.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Targeting Rules */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Label className="text-xs font-bold text-slate-700">Filter Conditions</Label>
                                <span className="text-[11px] text-slate-400">Match contacts that satisfy:</span>
                            </div>

                            {/* Combinator Toggle */}
                            <div className="inline-flex rounded-lg p-0.5 bg-slate-100 border border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setCombinator("AND")}
                                    className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                                        combinator === "AND"
                                            ? "bg-[#35877D] text-white shadow-2xs"
                                            : "text-slate-600 hover:text-slate-900"
                                    }`}
                                >
                                    Match ALL (AND)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCombinator("OR")}
                                    className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                                        combinator === "OR"
                                            ? "bg-[#35877D] text-white shadow-2xs"
                                            : "text-slate-600 hover:text-slate-900"
                                    }`}
                                >
                                    Match ANY (OR)
                                </button>
                            </div>
                        </div>

                        {/* Rules List */}
                        <div className="space-y-2">
                            {rules.map((rule, idx) => {
                                return (
                                    <div
                                        key={idx}
                                        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors"
                                    >
                                        <div className="w-10 text-[10px] font-bold text-slate-400 shrink-0 uppercase pl-1">
                                            {idx === 0 ? "IF" : combinator}
                                        </div>

                                        {/* Field Selector */}
                                        <select
                                            value={rule.field}
                                            onChange={(e) => handleFieldChange(idx, e.target.value)}
                                            className="h-8 flex-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#35877D]"
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
                                            className="h-8 w-32 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#35877D]"
                                        >
                                            {["whatsapp_opt_in", "campaign_received", "campaign_read"].includes(rule.field) ? (
                                                <>
                                                    <option value="equals">is</option>
                                                    <option value="not_equals">is not</option>
                                                </>
                                            ) : ["created_at", "last_interaction"].includes(rule.field) ? (
                                                <>
                                                    <option value="within_days">within last</option>
                                                    <option value="older_than_days">more than</option>
                                                    <option value="never">never</option>
                                                </>
                                            ) : (
                                                <>
                                                    <option value="equals">equals</option>
                                                    <option value="not_equals">does not equal</option>
                                                    <option value="contains">contains</option>
                                                    <option value="starts_with">starts with</option>
                                                </>
                                            )}
                                        </select>

                                        {/* Value Input */}
                                        <div className="flex-1">
                                            {rule.field === "lead_status" ? (
                                                <select
                                                    value={rule.value}
                                                    onChange={(e) => handleValueChange(idx, e.target.value)}
                                                    className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#35877D]"
                                                >
                                                    {STAGE_OPTIONS.map((s) => (
                                                        <option key={s.value} value={s.value}>
                                                            {s.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : ["whatsapp_opt_in", "campaign_received", "campaign_read"].includes(rule.field) ? (
                                                <select
                                                    value={rule.value}
                                                    onChange={(e) => handleValueChange(idx, e.target.value)}
                                                    className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#35877D]"
                                                >
                                                    <option value="true">Yes (Opted In / Confirmed)</option>
                                                    <option value="false">No (Not Opted In / No Activity)</option>
                                                </select>
                                            ) : ["created_at", "last_interaction"].includes(rule.field) ? (
                                                rule.operator === "never" ? (
                                                    <div className="h-8 flex items-center px-2 text-xs text-slate-400 bg-slate-50 rounded-lg">
                                                        No interaction recorded
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5">
                                                        <Input
                                                            type="number"
                                                            value={rule.value}
                                                            onChange={(e) => handleValueChange(idx, e.target.value)}
                                                            className="h-8 text-xs rounded-lg"
                                                            min={1}
                                                        />
                                                        <span className="text-[11px] text-slate-500 shrink-0">days</span>
                                                    </div>
                                                )
                                            ) : (
                                                <Input
                                                    type="text"
                                                    value={rule.value}
                                                    onChange={(e) => handleValueChange(idx, e.target.value)}
                                                    placeholder="Enter value..."
                                                    className="h-8 text-xs rounded-lg border-slate-200"
                                                />
                                            )}
                                        </div>

                                        {/* Remove condition */}
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemoveRule(idx)}
                                            className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg shrink-0 cursor-pointer"
                                        >
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Add Condition Button */}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddRule}
                            className="rounded-xl border-dashed border-slate-300 text-xs font-semibold text-slate-600 hover:text-slate-900 w-full cursor-pointer h-8"
                        >
                            <Plus size={13} className="mr-1" /> Add Condition
                        </Button>
                    </div>

                    {/* Live Result Preview */}
                    <div className="p-4 rounded-xl border border-teal-100 bg-teal-50/50 space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Users size={16} className="text-[#35877D]" />
                                <span className="text-xs font-bold text-slate-800">Audience Preview</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {isPreviewLoading ? (
                                    <span className="inline-flex items-center text-xs text-slate-400 font-semibold">
                                        <Loader2 size={12} className="animate-spin mr-1 text-[#35877D]" />
                                        Calculating...
                                    </span>
                                ) : (
                                    <Badge className="bg-[#35877D] text-white text-xs font-black px-2.5 py-0.5 rounded-full">
                                        {previewCount !== null ? `${previewCount.toLocaleString()} Contacts match` : "0 Contacts match"}
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {previewCount === 0 && !isPreviewLoading && (
                            <p className="text-[11px] text-amber-700 font-medium">
                                No contacts currently match these conditions. You can still save this dynamic segment; it will populate automatically when contacts match.
                            </p>
                        )}

                        {sampleContacts && sampleContacts.length > 0 && (
                            <div className="pt-1.5 flex flex-wrap gap-1.5 items-center">
                                <span className="text-[10px] text-slate-400 font-medium">Sample matches:</span>
                                {sampleContacts.slice(0, 4).map((c) => (
                                    <span
                                        key={c.id}
                                        className="text-[10px] font-semibold bg-white text-slate-700 px-2 py-0.5 rounded-md border border-slate-200"
                                    >
                                        {c.name} ({c.phone})
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="border-t border-slate-100 pt-3 flex items-center justify-between sm:justify-between">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        className="rounded-xl text-xs font-semibold text-slate-500"
                    >
                        Cancel
                    </Button>

                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isSaving}
                            onClick={() => saveSegment(false)}
                            className="rounded-xl border-slate-200 text-xs font-bold text-slate-700"
                        >
                            Save Audience
                        </Button>

                        <Button
                            type="button"
                            size="sm"
                            disabled={isSaving}
                            onClick={() => saveSegment(true)}
                            className="rounded-xl bg-[#35877D] hover:bg-[#2c6e66] text-white font-bold text-xs shadow-xs"
                        >
                            {isSaving ? (
                                <Loader2 size={13} className="animate-spin mr-1" />
                            ) : (
                                <Send size={13} className="mr-1" />
                            )}
                            Save & Use in Campaign
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
