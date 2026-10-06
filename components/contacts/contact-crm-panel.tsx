"use client";

import React, { useState, useEffect } from "react";
import {
    X, Phone, MapPin, Calendar, ExternalLink, MessageCircle,
    ChevronRight, Plus, Trash2, Loader2, Check, Tag, CheckSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

// ─── Stage Config ──────────────────────────────────────────────────────────────

export const STAGES = [
    { key: "new_lead",      label: "New Lead",       color: "bg-teal-100 text-teal-700 border-teal-200",     dot: "bg-teal-500" },
    { key: "contacted",     label: "Contacted",      color: "bg-blue-100 text-blue-700 border-blue-200",     dot: "bg-blue-500" },
    { key: "qualified",     label: "Qualified",      color: "bg-purple-100 text-purple-700 border-purple-200", dot: "bg-purple-500" },
    { key: "proposal_sent", label: "Proposal Sent",  color: "bg-amber-100 text-amber-700 border-amber-200",  dot: "bg-amber-500" },
    { key: "won",           label: "Won",            color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
    { key: "lost",          label: "Lost",           color: "bg-slate-100 text-slate-500 border-slate-200",  dot: "bg-slate-400" },
] as const;

export type StageKey = (typeof STAGES)[number]["key"];

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface CrmContact {
    id: number;
    name?: string | null;
    phone: string;
    city?: string | null;
    stage?: StageKey;
    custom_attributes?: Record<string, string>;
    createdAt?: string;
    messageCount?: number;
}

interface ContactCrmPanelProps {
    contact: CrmContact | null;
    isOpen: boolean;
    onClose: () => void;
    onStageChange?: (id: number, stage: StageKey) => void;
    onAttributesChange?: (id: number, attrs: Record<string, string>) => void;
}

// ─── Stage Badge ───────────────────────────────────────────────────────────────

export function StageBadge({ stage }: { stage?: string }) {
    const s = STAGES.find(x => x.key === stage) ?? STAGES[0];
    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold border ${s.color}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
            {s.label}
        </span>
    );
}

// ─── Main Panel ────────────────────────────────────────────────────────────────

export function ContactCrmPanel({
    contact,
    isOpen,
    onClose,
    onStageChange,
    onAttributesChange,
}: ContactCrmPanelProps) {
    const { token } = useAuth();

    const [stage, setStage] = useState<StageKey>("new_lead");
    const [attrs, setAttrs] = useState<Record<string, string>>({});
    const [isUpdatingStage, setIsUpdatingStage] = useState(false);
    const [isSavingAttrs, setIsSavingAttrs] = useState(false);

    // Add-attribute form
    const [newKey, setNewKey] = useState("");
    const [newValue, setNewValue] = useState("");

    useEffect(() => {
        if (contact) {
            setStage((contact.stage as StageKey) ?? "new_lead");
            setAttrs(contact.custom_attributes ?? {});
            setNewKey("");
            setNewValue("");
        }
    }, [contact]);

    const formatPhone = (phone: string) => {
        const cleaned = phone.replace(/\D/g, "");
        if (cleaned.startsWith("91") && cleaned.length > 10) {
            return `+91 ${cleaned.substring(2)}`;
        }
        return `+${cleaned}`;
    };

    const handleStageClick = async (s: StageKey) => {
        if (!contact || s === stage || isUpdatingStage) return;
        setIsUpdatingStage(true);
        const prev = stage;
        setStage(s); // optimistic
        try {
            const res = await fetch(`/api/customers/${contact.id}/stage`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ stage: s }),
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.message);
            onStageChange?.(contact.id, s);
            toast.success(`Stage updated to "${STAGES.find(x => x.key === s)?.label}"`);
        } catch (err: any) {
            setStage(prev); // rollback
            toast.error(err.message || "Failed to update stage");
        } finally {
            setIsUpdatingStage(false);
        }
    };

    const handleAddAttribute = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!contact || !newKey.trim() || !newValue.trim()) return;
        const updated = { ...attrs, [newKey.trim()]: newValue.trim() };
        await saveAttributes(updated);
        setNewKey("");
        setNewValue("");
    };

    const handleDeleteAttribute = async (key: string) => {
        if (!contact) return;
        const updated = { ...attrs };
        delete updated[key];
        await saveAttributes(updated);
    };

    const saveAttributes = async (updated: Record<string, string>) => {
        if (!contact) return;
        setIsSavingAttrs(true);
        const prev = attrs;
        setAttrs(updated); // optimistic
        try {
            const res = await fetch(`/api/customers/${contact.id}/attributes`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ custom_attributes: updated }),
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.message);
            onAttributesChange?.(contact.id, updated);
            toast.success("Attributes saved");
        } catch (err: any) {
            setAttrs(prev); // rollback
            toast.error(err.message || "Failed to save attributes");
        } finally {
            setIsSavingAttrs(false);
        }
    };

    const displayName = contact?.name || "WhatsApp User";
    const initials = displayName.split(" ").slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("");

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px] transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
                onClick={onClose}
            />

            {/* Slide-over panel */}
            <div
                className={`fixed top-0 right-0 z-50 h-full w-full max-w-[440px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}
            >
                {/* ── Header ── */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-[#35877D]/5 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-[#35877D] text-white flex items-center justify-center text-sm font-bold shrink-0 shadow-sm">
                            {initials || "?"}
                        </div>
                        <div className="min-w-0">
                            <div className="font-bold text-slate-800 text-sm truncate">{displayName}</div>
                            <div className="text-[11px] text-slate-500 font-medium mt-0.5">{contact ? formatPhone(contact.phone) : ""}</div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* ── Scrollable body ── */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6">

                    {/* Contact Info */}
                    <div className="grid grid-cols-2 gap-2.5">
                        {contact?.city && (
                            <div className="flex items-center gap-2 text-[11px] text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                                <MapPin size={12} className="text-slate-400 shrink-0" />
                                <span className="font-semibold truncate">{contact.city}</span>
                            </div>
                        )}
                        {contact?.createdAt && (
                            <div className="flex items-center gap-2 text-[11px] text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                                <Calendar size={12} className="text-slate-400 shrink-0" />
                                <span className="font-semibold">{new Date(contact.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2 text-[11px] text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                            <MessageCircle size={12} className="text-slate-400 shrink-0" />
                            <span className="font-semibold">{contact?.messageCount ?? 0} messages</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                            <Phone size={12} className="text-slate-400 shrink-0" />
                            <span className="font-semibold truncate">{contact ? formatPhone(contact.phone) : ""}</span>
                        </div>
                    </div>

                    {/* ── Pipeline Stage ── */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Pipeline Stage</span>
                            {isUpdatingStage && <Loader2 size={11} className="animate-spin text-[#35877D]" />}
                        </div>

                        {/* Stage stepper */}
                        <div className="relative">
                            {/* Connector line */}
                            <div className="absolute left-3.5 top-3.5 bottom-3.5 w-px bg-slate-100" />

                            <div className="space-y-1.5">
                                {STAGES.map((s, idx) => {
                                    const isActive = stage === s.key;
                                    const stageIdx = STAGES.findIndex(x => x.key === stage);
                                    const isPast = idx < stageIdx;

                                    return (
                                        <button
                                            key={s.key}
                                            onClick={() => handleStageClick(s.key)}
                                            disabled={isUpdatingStage}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 cursor-pointer ${
                                                isActive
                                                    ? "bg-[#35877D]/8 border border-[#35877D]/25"
                                                    : "hover:bg-slate-50 border border-transparent"
                                            }`}
                                        >
                                            {/* Dot */}
                                            <div className={`relative z-10 h-7 w-7 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                                                isActive
                                                    ? "bg-[#35877D] border-[#35877D]"
                                                    : isPast
                                                    ? "bg-slate-200 border-slate-300"
                                                    : "bg-white border-slate-200"
                                            }`}>
                                                {isActive ? (
                                                    <Check size={12} className="text-white" />
                                                ) : isPast ? (
                                                    <Check size={12} className="text-slate-400" />
                                                ) : (
                                                    <span className="h-2 w-2 rounded-full bg-slate-200" />
                                                )}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className={`text-xs font-bold ${isActive ? "text-[#35877D]" : isPast ? "text-slate-400" : "text-slate-600"}`}>
                                                    {s.label}
                                                </div>
                                            </div>

                                            {isActive && (
                                                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md border ${s.color}`}>
                                                    Current
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* ── Custom Attributes ── */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Custom Attributes</span>
                            {isSavingAttrs && <Loader2 size={11} className="animate-spin text-[#35877D]" />}
                        </div>

                        {/* Existing attributes */}
                        {Object.keys(attrs).length > 0 ? (
                            <div className="space-y-1.5 mb-3">
                                {Object.entries(attrs).map(([k, v]) => (
                                    <div key={k} className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 group">
                                        <Tag size={11} className="text-[#35877D] shrink-0" />
                                        <span className="text-[11px] font-bold text-slate-500 min-w-0 max-w-[100px] truncate">{k}</span>
                                        <ChevronRight size={10} className="text-slate-300 shrink-0" />
                                        <span className="text-[11px] font-semibold text-slate-700 flex-1 min-w-0 truncate">{v}</span>
                                        <button
                                            onClick={() => handleDeleteAttribute(k)}
                                            disabled={isSavingAttrs}
                                            className="opacity-0 group-hover:opacity-100 h-5 w-5 flex items-center justify-center rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer shrink-0"
                                        >
                                            <Trash2 size={11} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-[11px] text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-xl px-3 py-3 mb-3 text-center font-medium">
                                No attributes yet. Add one below.
                            </div>
                        )}

                        {/* Add attribute row */}
                        <form onSubmit={handleAddAttribute} className="flex items-center gap-2">
                            <Input
                                value={newKey}
                                onChange={e => setNewKey(e.target.value)}
                                placeholder="Key"
                                className="h-8 text-[11px] text-slate-700 w-[35%] rounded-lg border-slate-200"
                            />
                            <Input
                                value={newValue}
                                onChange={e => setNewValue(e.target.value)}
                                placeholder="Value"
                                className="h-8 text-[11px] text-slate-700 flex-1 rounded-lg border-slate-200"
                            />
                            <Button
                                type="submit"
                                size="icon"
                                disabled={!newKey.trim() || !newValue.trim() || isSavingAttrs}
                                className="h-8 w-8 bg-[#35877D] hover:bg-[#2c6761] text-white rounded-lg border-0 shrink-0 cursor-pointer"
                            >
                                <Plus size={13} />
                            </Button>
                        </form>
                    </div>
                </div>

                {/* ── Footer actions ── */}
                <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center gap-2.5 shrink-0">
                    <Link
                        href={contact ? `/customers/inbox/${contact.id}` : "#"}
                        className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-[#35877D] text-white text-xs font-semibold hover:bg-[#2c6761] transition-colors"
                    >
                        <MessageCircle size={13} />
                        Inbox
                    </Link>
                    <Link
                        href={contact ? `/tasks?action=new&contact_id=${contact.id}&contact_name=${encodeURIComponent(contact.name || contact.phone)}` : "#"}
                        className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors"
                    >
                        <CheckSquare size={13} className="text-[#35877D]" />
                        Task
                    </Link>
                    <button
                        onClick={onClose}
                        className="h-9 px-3.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer bg-white"
                    >
                        Close
                    </button>
                </div>
            </div>
        </>
    );
}
