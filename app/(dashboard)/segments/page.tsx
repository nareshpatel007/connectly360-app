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
    Layers
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
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
    targetCount: number;
    rules_json?: SegmentRulesGroup | any;
    conditions: {
        field: string;
        operator: string;
        value: string;
    }[];
    lastCalculated: string;
    isSystem?: boolean;
}

function SegmentCardSkeleton({ index = 0 }: { index?: number }) {
    const conditionWidths = [
        ["w-40", "w-48"],
        ["w-44", "w-36"],
        ["w-52", "w-32"],
        ["w-48", "w-44"],
    ];
    const widths = conditionWidths[index % conditionWidths.length];

    return (
        <Card className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-2.5">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <Skeleton className="h-9 w-9 rounded-xl shrink-0 bg-slate-200/70" />
                        <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-4 w-32 rounded-md" />
                                <Skeleton className="h-3.5 w-12 rounded-md" />
                            </div>
                            <Skeleton className="h-3 w-56 max-w-xs rounded-md" />
                        </div>
                    </div>
                </div>

                {/* Condition tags skeleton */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                    {widths.map((w, idx) => (
                        <Skeleton key={idx} className={`h-6 ${w} rounded-lg`} />
                    ))}
                </div>
            </div>

            {/* Footer skeleton */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                        <Skeleton className="h-3.5 w-3.5 rounded-full" />
                        <Skeleton className="h-3.5 w-16 rounded-md" />
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Skeleton className="h-3 w-3 rounded-full" />
                        <Skeleton className="h-3 w-20 rounded-md" />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-12 rounded-lg" />
                    <Skeleton className="h-6 w-20 rounded-lg" />
                </div>
            </div>
        </Card>
    );
}

export default function SegmentsPage() {
    const { token, isLoading: isAuthLoading } = useAuth();
    const [segments, setSegments] = useState<SegmentItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Builder modal state
    const [isBuilderOpen, setIsBuilderOpen] = useState(false);
    const [editingSegment, setEditingSegment] = useState<SegmentData | null>(null);

    // Audience contact inspector state
    const [inspectingSegmentId, setInspectingSegmentId] = useState<string | null>(null);
    const [inspectingSegmentName, setInspectingSegmentName] = useState<string>("");

    const fetchSegments = useCallback(async (showToast = false) => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/segments", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.status && Array.isArray(data.data)) {
                setSegments(data.data);
                if (showToast) toast.success("Segment audience counts updated");
            }
        } catch {
            // Keep existing
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (token) {
            fetchSegments(false);
        } else if (!isAuthLoading) {
            setIsLoading(false);
        }
    }, [token, isAuthLoading, fetchSegments]);

    const handleRecalculateSingle = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        try {
            const res = await fetch(`/api/segments/${id}/recalculate`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.status) {
                setSegments((prev) =>
                    prev.map((s) =>
                        s.id === id
                            ? {
                                  ...s,
                                  targetCount: data.cached_count,
                                  lastCalculated: "Just now"
                              }
                            : s
                    )
                );
                toast.success("Segment recalculated");
            }
        } catch {
            toast.error("Failed to recalculate segment");
        }
    };

    const handleDeleteSegment = async (e: React.MouseEvent, id: string, name: string) => {
        e.stopPropagation();
        if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

        try {
            const res = await fetch(`/api/segments/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.status) {
                setSegments((prev) => prev.filter((s) => s.id !== id));
                toast.success("Segment deleted successfully");
            } else {
                toast.error(data.message || "Failed to delete segment");
            }
        } catch {
            toast.error("Network error deleting segment");
        }
    };

    const handleDeleteAll = async () => {
        if (!confirm("Are you sure you want to delete ALL segments in this workspace? This action cannot be undone.")) return;

        setIsLoading(true);
        try {
            const res = await fetch("/api/segments/all", {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.status) {
                setSegments([]);
                toast.success(data.message || "All segments deleted successfully");
            } else {
                toast.error(data.message || "Failed to delete segments");
            }
        } catch {
            toast.error("Network error deleting all segments");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRestoreDefaults = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/segments/seed-defaults", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.status && Array.isArray(data.data)) {
                setSegments(data.data);
                toast.success("Default system segments restored!");
            } else {
                toast.error("Failed to restore presets");
            }
        } catch {
            toast.error("Network error restoring presets");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveSuccess = (savedSegment: SegmentItem) => {
        setSegments((prev) => {
            const index = prev.findIndex((s) => s.id === savedSegment.id);
            if (index >= 0) {
                const updated = [...prev];
                updated[index] = savedSegment;
                return updated;
            }
            return [savedSegment, ...prev];
        });
    };

    const handleOpenEdit = (e: React.MouseEvent, seg: SegmentItem) => {
        e.stopPropagation();
        setEditingSegment({
            id: seg.id,
            name: seg.name,
            description: seg.description,
            rules_json: seg.rules_json || {
                combinator: "AND",
                rules: seg.conditions
            },
            isSystem: seg.isSystem
        });
        setIsBuilderOpen(true);
    };

    const handleInspectContacts = (seg: SegmentItem) => {
        setInspectingSegmentId(seg.id);
        setInspectingSegmentName(seg.name);
    };

    const filteredSegments = segments.filter(
        (s) =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.conditions?.some(
                (c) =>
                    c.field.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    c.value.toLowerCase().includes(searchQuery.toLowerCase())
            )
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <PageHeader
                icon={Filter}
                title="Customer Segments"
                description="Build dynamic customer audiences for targeted WhatsApp campaigns, automations, and analytics."
                breadcrumbs={[{ label: "Segments" }]}
                actions={
                    <div className="flex items-center gap-2">
                        {segments.length > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDeleteAll}
                                className="rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 h-9 px-3 cursor-pointer text-xs font-bold gap-1.5"
                                title="Delete all segments in this workspace"
                            >
                                <Trash2 size={13} />
                                Delete All
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchSegments(true)}
                            className="rounded-xl border-slate-200 text-slate-700 h-9 px-3 cursor-pointer"
                            title="Recalculate Segments"
                        >
                            <RefreshCw size={14} className={isLoading ? "animate-spin text-[#35877D]" : ""} />
                        </Button>
                        <Button
                            onClick={() => {
                                setEditingSegment(null);
                                setIsBuilderOpen(true);
                            }}
                            className="bg-[#35877D] hover:bg-[#2c6e66] text-white font-bold text-xs h-9 px-4 rounded-xl shadow-xs transition-colors cursor-pointer gap-1.5"
                        >
                            <Plus size={16} />
                            New Segment
                        </Button>
                    </div>
                }
            />

            {/* Quick Filter Search & Stats */}
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                        type="text"
                        placeholder="Search segments by name or condition..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-10 rounded-xl border-slate-200 text-xs font-semibold"
                    />
                </div>
                <div className="text-xs text-slate-500 font-medium">
                    {isLoading ? (
                        <div className="flex items-center gap-1.5">
                            <span>Showing</span>
                            <Skeleton className="h-4 w-6 rounded inline-block" />
                            <span>active workspace segments</span>
                        </div>
                    ) : (
                        <>
                            Showing <span className="font-bold text-slate-900">{filteredSegments.length}</span> active workspace segments
                        </>
                    )}
                </div>
            </div>

            {/* Segment Grid, Skeleton, or Empty State */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <SegmentCardSkeleton key={i} index={i} />
                    ))}
                </div>
            ) : filteredSegments.length === 0 ? (
                <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-12 text-center max-w-lg mx-auto space-y-4 my-8">
                    <div className="h-14 w-14 rounded-2xl bg-[#35877D]/10 text-[#35877D] flex items-center justify-center mx-auto font-bold shadow-2xs">
                        <Layers size={26} />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-base font-bold text-slate-900">
                            {searchQuery.trim() ? "No matching segments found" : "No active customer segments"}
                        </h3>
                        <p className="text-xs text-slate-500">
                            {searchQuery.trim()
                                ? `No segments match "${searchQuery}". Try a different search term or clear the filter.`
                                : "Create custom dynamic segments with AND/OR conditions or restore default system presets."}
                        </p>
                    </div>
                    <div className="flex items-center justify-center gap-2 pt-2">
                        {searchQuery.trim() ? (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSearchQuery("")}
                                className="rounded-xl border-slate-200 text-slate-700 font-bold text-xs h-9 px-4 cursor-pointer"
                            >
                                Clear Search
                            </Button>
                        ) : (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleRestoreDefaults}
                                    className="rounded-xl border-slate-200 text-slate-700 font-bold text-xs h-9 px-4 gap-1.5 cursor-pointer"
                                >
                                    <RotateCcw size={13} />
                                    Restore Presets
                                </Button>
                                <Button
                                    onClick={() => {
                                        setEditingSegment(null);
                                        setIsBuilderOpen(true);
                                    }}
                                    className="bg-[#35877D] hover:bg-[#2c6e66] text-white font-bold text-xs h-9 px-4 rounded-xl shadow-xs gap-1.5 cursor-pointer"
                                >
                                    <Plus size={15} />
                                    New Segment
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredSegments.map((segment) => (
                        <Card
                            key={segment.id}
                            className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between group"
                        >
                            <div className="space-y-2.5">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="h-9 w-9 rounded-xl bg-[#35877D]/10 text-[#35877D] flex items-center justify-center font-bold shrink-0">
                                            <Filter size={16} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm font-bold text-slate-900">{segment.name}</h3>
                                                {segment.isSystem && (
                                                    <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md bg-teal-50 text-[#35877D] border border-teal-100">
                                                        System
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{segment.description}</p>
                                        </div>
                                    </div>

                                    {/* Action buttons on card hover */}
                                    <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => handleRecalculateSingle(e, segment.id)}
                                            className="h-7 w-7 flex items-center justify-center text-slate-400 hover:text-[#35877D] hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                                            title="Recalculate Audience"
                                        >
                                            <RefreshCw size={12} />
                                        </button>
                                        <button
                                            onClick={(e) => handleOpenEdit(e, segment)}
                                            className="h-7 w-7 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                            title="Edit Segment"
                                        >
                                            <Edit3 size={12} />
                                        </button>
                                        <button
                                            onClick={(e) => handleDeleteSegment(e, segment.id, segment.name)}
                                            className="h-7 w-7 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                            title="Delete Segment"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>

                                {/* Conditions list */}
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                    {segment.conditions?.map((cond, i) => (
                                        <span
                                            key={i}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-mono font-medium text-slate-700"
                                        >
                                            <span className="text-slate-400">#</span>
                                            <span className="font-bold">{cond.field}</span>
                                            <span className="text-slate-400">{cond.operator}</span>
                                            <span className="text-[#35877D] font-bold">{cond.value}</span>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Card Footer */}
                            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => handleInspectContacts(segment)}
                                        className="flex items-center gap-1 font-bold text-slate-800 hover:text-[#35877D] transition-colors cursor-pointer"
                                        title="View Matching Contacts"
                                    >
                                        <Users size={14} className="text-[#35877D]" />
                                        <span>{segment.targetCount} Contacts</span>
                                    </button>
                                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                                        <Clock size={12} />
                                        {segment.lastCalculated}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleInspectContacts(segment)}
                                        className="px-2 py-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                    >
                                        <Eye size={12} />
                                        View
                                    </button>
                                    <Link
                                        href={`/marketing/campaigns/new?segment_id=${segment.id}`}
                                        className="px-2.5 py-1 text-[11px] font-bold text-[#35877D] hover:bg-teal-50 rounded-lg transition-colors flex items-center gap-1"
                                    >
                                        Broadcast <ArrowUpRight size={12} />
                                    </Link>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Segment Builder Dialog */}
            <SegmentBuilderDialog
                open={isBuilderOpen}
                onOpenChange={setIsBuilderOpen}
                token={token}
                editingSegment={editingSegment}
                onSaveSuccess={handleSaveSuccess}
            />

            {/* Inspect Audience Contacts Dialog */}
            <SegmentContactsDialog
                open={!!inspectingSegmentId}
                onOpenChange={(open) => {
                    if (!open) setInspectingSegmentId(null);
                }}
                segmentId={inspectingSegmentId}
                segmentName={inspectingSegmentName}
                token={token}
            />
        </div>
    );
}
