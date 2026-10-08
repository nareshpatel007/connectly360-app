"use client";

import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    ShieldCheck,
    ShieldAlert,
    CheckCircle2,
    XCircle,
    Info,
    Calendar,
    FileText,
    Loader2,
    Check,
} from "lucide-react";
import { toast } from "sonner";
import { useCustomerOptIn, useCustomerOptOut } from "@/lib/api-client-react";

interface ManageConsentModalProps {
    isOpen: boolean;
    onClose: () => void;
    customer: {
        id: number;
        name?: string;
        phone: string;
        whatsapp_opt_in?: boolean;
        whatsapp_opt_in_at?: string;
        whatsapp_opt_in_source?: string;
        whatsapp_opt_in_evidence?: string;
        whatsapp_opt_in_categories?: string[];
        whatsapp_opt_out?: boolean;
        whatsapp_opt_out_at?: string;
        whatsapp_opt_out_reason?: string;
    } | null;
}

const OPT_IN_SOURCES = [
    { value: "web_form_checkout", label: "Web Form / Checkout Page" },
    { value: "inbound_keyword", label: "Inbound Keyword (START / SUBSCRIBE)" },
    { value: "written_agreement", label: "Written Agreement / Signed Form" },
    { value: "verbal_consent", label: "Verbal Consent (Call / Support)" },
    { value: "pos_signup", label: "Point of Sale / Loyalty Program" },
    { value: "manual_admin", label: "Manual Agent / Admin Record" },
];

const OPT_OUT_REASONS = [
    { value: "user_request", label: "Customer Requested Opt-out" },
    { value: "stop_keyword", label: "Inbound Keyword (STOP / CANCEL / UNSUBSCRIBE)" },
    { value: "unsubscribed_link", label: "Clicked Unsubscribe Link" },
    { value: "spam_complaint", label: "Spam Complaint / Negative Feedback" },
    { value: "compliance_suppression", label: "Compliance / Internal Suppression List" },
    { value: "dnd_registry", label: "Do Not Disturb (DND) Registry" },
];

export function ManageConsentModal({
    isOpen,
    onClose,
    customer,
}: ManageConsentModalProps) {
    const isCurrentlyOptedIn = Boolean(customer?.whatsapp_opt_in && !customer?.whatsapp_opt_out);

    const [actionType, setActionType] = useState<"opt_in" | "opt_out">(
        isCurrentlyOptedIn ? "opt_out" : "opt_in"
    );

    // Opt-in fields
    const [optInSource, setOptInSource] = useState<string>("web_form_checkout");
    const [optInEvidence, setOptInEvidence] = useState<string>("");
    const [selectedCategories, setSelectedCategories] = useState<string[]>([
        "MARKETING",
        "UTILITY",
    ]);

    // Opt-out fields
    const [optOutReason, setOptOutReason] = useState<string>("user_request");

    const optInMutation = useCustomerOptIn();
    const optOutMutation = useCustomerOptOut();

    useEffect(() => {
        if (customer) {
            const optedIn = Boolean(customer.whatsapp_opt_in && !customer.whatsapp_opt_out);
            setActionType(optedIn ? "opt_out" : "opt_in");
            setOptInSource(customer.whatsapp_opt_in_source || "web_form_checkout");
            setOptInEvidence(customer.whatsapp_opt_in_evidence || "");
            if (Array.isArray(customer.whatsapp_opt_in_categories) && customer.whatsapp_opt_in_categories.length > 0) {
                setSelectedCategories(customer.whatsapp_opt_in_categories);
            } else {
                setSelectedCategories(["MARKETING", "UTILITY"]);
            }
            setOptOutReason(customer.whatsapp_opt_out_reason || "user_request");
        }
    }, [customer, isOpen]);

    if (!customer) return null;

    const isSubmitting = optInMutation.isPending || optOutMutation.isPending;

    const toggleCategory = (cat: string) => {
        if (selectedCategories.includes(cat)) {
            if (selectedCategories.length > 1) {
                setSelectedCategories(selectedCategories.filter((c) => c !== cat));
            }
        } else {
            setSelectedCategories([...selectedCategories, cat]);
        }
    };

    const handleSaveConsent = async () => {
        try {
            if (actionType === "opt_in") {
                await optInMutation.mutateAsync({
                    customerId: customer.id,
                    source: optInSource,
                    evidence: optInEvidence.trim() || undefined,
                    categories: selectedCategories,
                });
                toast.success(`Marketing consent granted for ${customer.name || customer.phone}`);
            } else {
                await optOutMutation.mutateAsync({
                    customerId: customer.id,
                    reason: optOutReason,
                });
                toast.success(`Marketing opt-out recorded for ${customer.name || customer.phone}`);
            }
            onClose();
        } catch (err: any) {
            toast.error(err.message || "Failed to update consent status");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl border-slate-200">
                <DialogHeader className="p-6 pb-4 bg-slate-50/80 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-xl bg-[#35877D]/10 text-[#35877D] flex items-center justify-center font-bold">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-bold text-slate-900">
                                    Manage WhatsApp Consent
                                </DialogTitle>
                                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                                    {customer.name || "WhatsApp User"} ({customer.phone})
                                </DialogDescription>
                            </div>
                        </div>

                        {isCurrentlyOptedIn ? (
                            <Badge className="bg-teal-50 border-teal-200 text-teal-800 text-[11px] font-semibold gap-1">
                                <CheckCircle2 className="w-3 h-3 text-[#35877D]" />
                                Currently Opted-In
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="bg-rose-50 border-rose-200 text-rose-700 text-[11px] font-semibold gap-1">
                                <XCircle className="w-3 h-3 text-rose-500" />
                                Currently Opted-Out
                            </Badge>
                        )}
                    </div>
                </DialogHeader>

                <div className="p-6 space-y-5">
                    {/* Action Selector Segmented Control */}
                    <div>
                        <Label className="text-xs font-semibold text-slate-700 mb-2 block">
                            Consent Action
                        </Label>
                        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                            <button
                                type="button"
                                onClick={() => setActionType("opt_in")}
                                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                                    actionType === "opt_in"
                                        ? "bg-white text-emerald-700 shadow-xs"
                                        : "text-slate-500 hover:text-slate-800"
                                }`}
                            >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                Grant Marketing Opt-In
                            </button>
                            <button
                                type="button"
                                onClick={() => setActionType("opt_out")}
                                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                                    actionType === "opt_out"
                                        ? "bg-white text-rose-700 shadow-xs"
                                        : "text-slate-500 hover:text-slate-800"
                                }`}
                            >
                                <ShieldAlert className="w-3.5 h-3.5" />
                                Record Opt-Out
                            </button>
                        </div>
                    </div>

                    {/* Form Fields: Opt-In */}
                    {actionType === "opt_in" && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                            <div>
                                <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                                    Opt-In Source <span className="text-rose-500">*</span>
                                </Label>
                                <select
                                    value={optInSource}
                                    onChange={(e) => setOptInSource(e.target.value)}
                                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-[#35877D]"
                                >
                                    {OPT_IN_SOURCES.map((s) => (
                                        <option key={s.value} value={s.value}>
                                            {s.label}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-[11px] text-slate-400 mt-1">
                                    Document how the contact originally gave consent for WhatsApp marketing messages.
                                </p>
                            </div>

                            <div>
                                <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                                    Consent Categories
                                </Label>
                                <div className="flex flex-wrap gap-2">
                                    {["MARKETING", "UTILITY", "AUTHENTICATION"].map((cat) => {
                                        const isSelected = selectedCategories.includes(cat);
                                        return (
                                            <button
                                                type="button"
                                                key={cat}
                                                onClick={() => toggleCategory(cat)}
                                                className={`text-xs px-3 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 transition-all ${
                                                    isSelected
                                                        ? "bg-teal-50 border-[#35877D] text-[#35877D]"
                                                        : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                                                }`}
                                            >
                                                {isSelected && <Check className="w-3 h-3 text-[#35877D]" />}
                                                {cat}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                                    Proof / Audit Evidence (Optional)
                                </Label>
                                <Textarea
                                    rows={2}
                                    placeholder="e.g. Checkout submission ID #8492, signed terms link, or agent log reference..."
                                    value={optInEvidence}
                                    onChange={(e) => setOptInEvidence(e.target.value)}
                                    className="text-xs rounded-xl border-slate-200 focus:bg-white resize-none"
                                />
                                <p className="text-[11px] text-slate-400 mt-1">
                                    Saved in audit log to maintain WhatsApp Business compliance.
                                </p>
                            </div>

                            <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl text-xs text-emerald-800 flex items-start gap-2.5">
                                <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                <div>
                                    <div className="font-semibold text-emerald-950">Broadcast Permission</div>
                                    <div className="text-[11px] text-emerald-800 mt-0.5">
                                        Granting opt-in enables this contact to be included in marketing campaigns and segment filters.
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Form Fields: Opt-Out */}
                    {actionType === "opt_out" && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                            <div>
                                <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                                    Opt-Out Reason <span className="text-rose-500">*</span>
                                </Label>
                                <select
                                    value={optOutReason}
                                    onChange={(e) => setOptOutReason(e.target.value)}
                                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-rose-500"
                                >
                                    {OPT_OUT_REASONS.map((r) => (
                                        <option key={r.value} value={r.value}>
                                            {r.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="p-3.5 bg-rose-50/70 border border-rose-100 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
                                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                                <div>
                                    <div className="font-semibold text-rose-950">Marketing Broadcast Suppression</div>
                                    <div className="text-[11px] text-rose-800 mt-0.5 leading-relaxed">
                                        Once opted out, all automated marketing broadcasts and promotional campaigns will strictly exclude this contact. One-to-one inbox customer service replies are still permitted.
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Audit History Snapshot */}
                    {(customer.whatsapp_opt_in_at || customer.whatsapp_opt_out_at) && (
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Last Consent Event:
                            </span>
                            <span className="font-mono text-slate-600">
                                {customer.whatsapp_opt_out_at
                                    ? `Opt-out: ${new Date(customer.whatsapp_opt_out_at).toLocaleString()}`
                                    : customer.whatsapp_opt_in_at
                                    ? `Opt-in: ${new Date(customer.whatsapp_opt_in_at).toLocaleString()}`
                                    : "—"}
                            </span>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isSubmitting}
                        onClick={onClose}
                        className="text-xs rounded-xl"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        disabled={isSubmitting}
                        onClick={handleSaveConsent}
                        className={`text-xs rounded-xl font-bold gap-1.5 shadow-sm text-white ${
                            actionType === "opt_in"
                                ? "bg-[#35877D] hover:bg-[#2d736a]"
                                : "bg-rose-600 hover:bg-rose-700"
                        }`}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Saving...
                            </>
                        ) : actionType === "opt_in" ? (
                            <>
                                <Check className="w-3.5 h-3.5" />
                                Confirm Opt-In
                            </>
                        ) : (
                            <>
                                <ShieldAlert className="w-3.5 h-3.5" />
                                Confirm Opt-Out
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
