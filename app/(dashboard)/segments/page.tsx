"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Filter,
    Plus,
    Users,
    Search,
    Clock,
    RefreshCw,
    ArrowUpRight,
    Edit3,
    Trash2,
    Eye,
    RotateCcw,
    Layers,
    Copy,
    Send,
    ShieldCheck,
    CheckCircle2
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    SegmentBuilderDialog,
    SegmentData,
    SegmentRulesGroup
} from "@/components/segments/segment-builder-dialog";
import { SegmentContactsDialog } from "@/components/segments/segment-contacts-dialog";

interface SegmentItem {
    id: string;
    name: string;
    description: string;
    type: "dynamic" | "static";
    targetCount: number;
    rules_json?: SegmentRulesGroup | any;
    conditions: {
        field: string;
        operator: string;
        value: string;
        field_label?: string;
        operator_label?: string;
        value_label?: string;
        readable?: string;
    }[];
    summaryText?: string;
    lastCalculated: string;
    usageCount?: number;
    lastUsed?: string | null;
    isSystem?: boolean;
}

function SegmentCardSkeleton() {
    return (
        <Card className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
                <div className="flex items-start justify-between">
                    <div className="space-y-1.5 flex-1 min-w-0">
                        <Skeleton className="h-4 w-40 rounded-md" />
                        <Skeleton className="h-3 w-56 rounded-md" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                    <Skeleton className="h-6 w-32 rounded-lg" />
                    <Skeleton className="h-6 w-28 rounded-lg" />
                </div>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="h-7 w-20 rounded-lg" />
            </div>
        </Card>
    );
}

export default function SegmentsPage() {
    const { token } = useAuth();
    const [segments, setSegments] = useState<SegmentItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterTab, setFilterTab] = useState<"all" | "dynamic" | "static" | "system">("all");

    // Builder modal state
    const [isBuilderOpen, setIsBuilderOpen] = useState(false);
    const [editingSegment, setEditingSegment] = useState<SegmentData | null>(null);

    // Quick Contacts Dialog
    const [inspectingSegmentId, setInspectingSegmentId] = useState<string | null>(null);
    const [inspectingSegmentName, setInspectingSegmentName] = useState<string>("");

    const fetchSegments = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/segments", {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            const data = await res.json();
            if (data.status && Array.isArray(data.data)) {
                setSegments(data.data);
            } else if (Array.isArray(data)) {
                setSegments(data);
            }
        } catch (e) {
            console.error(e);
            toast.error("Failed to load audience segments");
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchSegments();
    }, [fetchSegments]);

    const handleClone = async (id: string, name: string) => {
        try {
            const res = await fetch(`/api/segments/${id}/clone`, {
                method: "POST",
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            const data = await res.json();
            if (data.status) {
                toast.success(`Audience "${name}" cloned successfully`);
                fetchSegments();
            } else {
                toast.error(data.message || "Failed to clone audience");
            }
        } catch (e) {
            toast.error("Error cloning audience");
        }
    };

    const handleDelete = async (id: string, name: string, isSystem = false) => {
        if (isSystem) {
            toast.error("System audiences cannot be deleted.");
            return;
        }

        if (!confirm(`Are you sure you want to delete audience "${name}"?`)) return;

        try {
            const res = await fetch(`/api/segments/${id}`, {
                method: "DELETE",
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            const data = await res.json();
            if (data.status) {
                toast.success(`Audience "${name}" removed`);
                setSegments((prev) => prev.filter((s) => s.id !== id));
            } else {
                toast.error(data.message || "Failed to delete audience");
            }
        } catch (e) {
            toast.error("Error deleting audience");
        }
    };

    // Filter segments
    const filteredSegments = segments.filter((s) => {
        const matchesSearch =
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (s.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (s.summaryText || "").toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;

        if (filterTab === "dynamic") return s.type === "dynamic" && !s.isSystem;
        if (filterTab === "static") return s.type === "static";
        if (filterTab === "system") return s.isSystem;

        return true;
    });

    return (
        <div className="space-y-6 w-full max-w-[1600px] mx-auto pb-16">
            {/* Header */}
            <PageHeader
                icon={Users}
                title="Customer Segments"
                description="Create reusable audiences for campaigns and customer targeting."
                breadcrumbs={[
                    { label: "Inbox & CRM" },
                    { label: "Segments" }
                ]}
                actions={
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchSegments()}
                            className="rounded-xl border-slate-200 text-xs font-semibold"
                        >
                            <RefreshCw size={12} className="mr-1.5" /> Refresh
                        </Button>

                        <Button
                            size="sm"
                            onClick={() => {
                                setEditingSegment(null);
                                setIsBuilderOpen(true);
                            }}
                            className="rounded-xl bg-[#35877D] hover:bg-[#2c6e66] text-white font-bold text-xs shadow-xs cursor-pointer"
                        >
                            <Plus size={14} className="mr-1" /> Create Segment
                        </Button>
                    </div>
                }
            />

            {/* Filter Tabs & Search Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Tabs */}
                <div className="inline-flex rounded-xl p-1 bg-slate-100/80 border border-slate-200/60 self-start">
                    <button
                        type="button"
                        onClick={() => setFilterTab("all")}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${filterTab === "all"
                            ? "bg-white text-slate-900 shadow-2xs"
                            : "text-slate-600 hover:text-slate-900"
                            }`}
                    >
                        All ({segments.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilterTab("dynamic")}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${filterTab === "dynamic"
                            ? "bg-white text-slate-900 shadow-2xs"
                            : "text-slate-600 hover:text-slate-900"
                            }`}
                    >
                        Dynamic
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilterTab("static")}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${filterTab === "static"
                            ? "bg-white text-slate-900 shadow-2xs"
                            : "text-slate-600 hover:text-slate-900"
                            }`}
                    >
                        Static
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilterTab("system")}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${filterTab === "system"
                            ? "bg-white text-slate-900 shadow-2xs"
                            : "text-slate-600 hover:text-slate-900"
                            }`}
                    >
                        System Presets
                    </button>
                </div>

                {/* Search */}
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <Input
                        placeholder="Search audiences..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9 rounded-xl border-slate-200 text-xs bg-white"
                    />
                </div>
            </div>

            {/* Segments Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                {isLoading ? (
                    <>
                        <SegmentCardSkeleton />
                        <SegmentCardSkeleton />
                        <SegmentCardSkeleton />
                        <SegmentCardSkeleton />
                    </>
                ) : filteredSegments.length === 0 ? (
                    <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
                        <Users className="h-10 w-10 text-slate-300 mx-auto" />
                        <h3 className="text-sm font-bold text-slate-800">No audience segments found</h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                            {searchQuery
                                ? "No audiences match your search term. Try a different query."
                                : "Create your first reusable audience from your contacts using simple filters."}
                        </p>
                        {!searchQuery && (
                            <Button
                                size="sm"
                                onClick={() => setIsBuilderOpen(true)}
                                className="rounded-xl bg-[#35877D] hover:bg-[#2c6e66] text-white font-bold text-xs mt-2"
                            >
                                <Plus size={13} className="mr-1" /> Create Audience
                            </Button>
                        )}
                    </div>
                ) : (
                    filteredSegments.map((seg) => (
                        <Card
                            key={seg.id}
                            className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between gap-4"
                        >
                            <div className="space-y-3">
                                {/* Title & Badges */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="space-y-1 flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Link
                                                href={`/segments/${seg.id}`}
                                                className="text-sm font-bold text-slate-900 hover:text-[#35877D] transition-colors"
                                            >
                                                {seg.name}
                                            </Link>
                                            {seg.isSystem ? (
                                                <Badge
                                                    variant="outline"
                                                    className="text-[10px] font-bold rounded-md px-1.5 py-0 bg-amber-50 text-amber-700 border-amber-200"
                                                >
                                                    SYSTEM
                                                </Badge>
                                            ) : (
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[10px] font-bold rounded-md px-1.5 py-0 ${seg.type === "static"
                                                        ? "bg-blue-50 text-blue-700 border-blue-200"
                                                        : "bg-teal-50 text-[#35877D] border-teal-200"
                                                        }`}
                                                >
                                                    {seg.type === "static" ? "Static" : "Dynamic"}
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 line-clamp-2">
                                            {seg.description || seg.summaryText || "Audience filter criteria."}
                                        </p>
                                    </div>
                                </div>

                                {/* Human-readable Condition Summary */}
                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs">
                                    <div className="flex flex-wrap gap-1.5">
                                        {seg.conditions && seg.conditions.length > 0 ? (
                                            seg.conditions.slice(0, 3).map((cond, idx) => (
                                                <span
                                                    key={idx}
                                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] font-medium text-slate-700"
                                                >
                                                    <span className="font-bold text-[#35877D]">
                                                        {cond.field_label || cond.field}:
                                                    </span>
                                                    <span>{cond.value_label || cond.value}</span>
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-[11px] text-slate-500">All eligible contacts</span>
                                        )}
                                        {seg.conditions && seg.conditions.length > 3 && (
                                            <span className="text-[10px] font-semibold text-slate-400 self-center">
                                                +{seg.conditions.length - 3} more
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Footer: Contacts Count & Actions */}
                            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-slate-900 flex items-center gap-1 font-mono">
                                        <Users size={12} className="text-[#35877D]" />
                                        {seg.targetCount.toLocaleString()} Contacts
                                    </span>
                                    <span className="text-slate-400 text-[11px] flex items-center gap-1">
                                        <Clock size={11} /> {seg.lastCalculated}
                                    </span>
                                </div>

                                <div className="flex items-center gap-1.5">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setInspectingSegmentId(seg.id);
                                            setInspectingSegmentName(seg.name);
                                        }}
                                        className="h-7 text-xs font-semibold rounded-lg text-slate-600 hover:text-slate-900 px-2 cursor-pointer"
                                    >
                                        <Eye size={12} className="mr-1" /> View
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleClone(seg.id, seg.name)}
                                        title="Clone audience"
                                        className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                                    >
                                        <Copy size={13} />
                                    </Button>

                                    {!seg.isSystem && (
                                        <>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setEditingSegment(seg as any);
                                                    setIsBuilderOpen(true);
                                                }}
                                                title="Edit audience"
                                                className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                                            >
                                                <Edit3 size={13} />
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(seg.id, seg.name, seg.isSystem)}
                                                title="Delete audience"
                                                className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer"
                                            >
                                                <Trash2 size={13} />
                                            </Button>
                                        </>
                                    )}

                                    <Link href={`/marketing/campaigns/new?segment_id=${seg.id}`}>
                                        <Button
                                            size="sm"
                                            className="h-7 px-2.5 rounded-lg bg-[#35877D] hover:bg-[#2c6e66] text-white font-bold text-xs shadow-2xs cursor-pointer inline-flex items-center gap-1"
                                        >
                                            <Send size={11} />
                                            Broadcast
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {/* Segment Builder Dialog */}
            <SegmentBuilderDialog
                open={isBuilderOpen}
                onOpenChange={setIsBuilderOpen}
                token={token}
                editingSegment={editingSegment}
                onSaveSuccess={() => {
                    fetchSegments();
                    setEditingSegment(null);
                }}
            />

            {/* Quick Contacts Dialog */}
            <SegmentContactsDialog
                open={!!inspectingSegmentId}
                onOpenChange={(open) => {
                    if (!open) {
                        setInspectingSegmentId(null);
                    }
                }}
                segmentId={inspectingSegmentId}
                segmentName={inspectingSegmentName}
                token={token}
            />
        </div>
    );
}
