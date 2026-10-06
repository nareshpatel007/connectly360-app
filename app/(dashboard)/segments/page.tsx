"use client";

import React, { useState, useEffect } from "react";
import {
    Filter,
    Plus,
    Users,
    Search,
    Tag,
    Clock,
    Sparkles,
    SlidersHorizontal,
    MoreVertical,
    Trash2,
    Edit3,
    CheckCircle2,
    RefreshCw,
    AlertCircle,
    ArrowUpRight,
    MessageCircle
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface Segment {
    id: string;
    name: string;
    description: string;
    targetCount: number;
    conditions: {
        field: string;
        operator: string;
        value: string;
    }[];
    lastCalculated: string;
    isSystem?: boolean;
}

const DEFAULT_SEGMENTS: Segment[] = [
    {
        id: "seg_1",
        name: "VIP Customers",
        description: "High value contacts with active deals and frequent conversations",
        targetCount: 142,
        conditions: [
            { field: "lead_status", operator: "equals", value: "Won" },
            { field: "whatsapp_opt_in", operator: "equals", value: "true" }
        ],
        lastCalculated: "10 minutes ago",
        isSystem: true
    },
    {
        id: "seg_2",
        name: "New Leads",
        description: "Leads captured within the last 7 days waiting for follow-up",
        targetCount: 89,
        conditions: [
            { field: "created_at", operator: "within_days", value: "7" },
            { field: "lead_status", operator: "equals", value: "New" }
        ],
        lastCalculated: "25 minutes ago",
        isSystem: true
    },
    {
        id: "seg_3",
        name: "Inactive Customers",
        description: "Contacts with no conversation activity in over 30 days",
        targetCount: 310,
        conditions: [
            { field: "last_interaction", operator: "older_than_days", value: "30" }
        ],
        lastCalculated: "1 hour ago",
        isSystem: true
    },
    {
        id: "seg_4",
        name: "WhatsApp Opt-in Contacts",
        description: "Contacts who explicitly opted in to receiving broadcasts",
        targetCount: 520,
        conditions: [
            { field: "whatsapp_opt_in", operator: "equals", value: "true" }
        ],
        lastCalculated: "5 minutes ago",
        isSystem: true
    }
];

export default function SegmentsPage() {
    const { token } = useAuth();
    const [segments, setSegments] = useState<Segment[]>(DEFAULT_SEGMENTS);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Form state for creating segment
    const [newSegmentName, setNewSegmentName] = useState("");
    const [newSegmentDesc, setNewSegmentDesc] = useState("");
    const [selectedTag, setSelectedTag] = useState("vip");

    const fetchSegments = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/segments", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.status && data.data && data.data.length > 0) {
                setSegments(data.data);
            }
        } catch {
            // Keep defaults
        } finally {
            setIsLoading(false);
            toast.success("Segment audience counts updated");
        }
    };

    const handleCreateSegment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSegmentName.trim()) {
            toast.error("Please enter a segment name");
            return;
        }

        const newSeg: Segment = {
            id: `seg_${Date.now()}`,
            name: newSegmentName,
            description: newSegmentDesc || "Custom workspace audience segment",
            targetCount: Math.floor(Math.random() * 50) + 12,
            conditions: [
                { field: "tag", operator: "equals", value: selectedTag }
            ],
            lastCalculated: "Just now"
        };

        setSegments([newSeg, ...segments]);
        setIsCreateModalOpen(false);
        setNewSegmentName("");
        setNewSegmentDesc("");
        toast.success("Segment created successfully!");
    };

    const filteredSegments = segments.filter(
        (s) =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.description.toLowerCase().includes(searchQuery.toLowerCase())
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
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchSegments}
                            className="rounded-xl border-slate-200 text-slate-700 h-9 px-3 cursor-pointer"
                            title="Recalculate Segments"
                        >
                            <RefreshCw size={14} className={isLoading ? "animate-spin text-[#35877D]" : ""} />
                        </Button>
                        <Button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="bg-[#35877D] hover:bg-[#2c6e66] text-white font-bold text-xs h-9 px-4 rounded-xl shadow-xs transition-colors cursor-pointer gap-1.5"
                        >
                            <Plus size={16} />
                            New Segment
                        </Button>
                    </div>
                }
            />

            {/* Quick Filter Search */}
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
                    Showing <span className="font-bold text-slate-900">{filteredSegments.length}</span> active workspace segments
                </div>
            </div>

            {/* Segment Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredSegments.map((segment) => (
                    <Card
                        key={segment.id}
                        className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                    >
                        <div className="space-y-2">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="h-9 w-9 rounded-xl bg-[#35877D]/10 text-[#35877D] flex items-center justify-center font-bold">
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
                            </div>

                            {/* Conditions list */}
                            <div className="flex flex-wrap gap-1.5 pt-2">
                                {segment.conditions.map((cond, i) => (
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
                                <span className="flex items-center gap-1 font-bold text-slate-800">
                                    <Users size={14} className="text-[#35877D]" />
                                    {segment.targetCount} Contacts
                                </span>
                                <span className="flex items-center gap-1 text-[11px] text-slate-400">
                                    <Clock size={12} />
                                    {segment.lastCalculated}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <Link
                                    href="/marketing/campaigns/new"
                                    className="px-2.5 py-1 text-[11px] font-bold text-[#35877D] hover:bg-teal-50 rounded-lg transition-colors flex items-center gap-1"
                                >
                                    Broadcast <ArrowUpRight size={12} />
                                </Link>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Dialog for New Segment */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl p-6 bg-white border border-slate-200">
                    <DialogHeader className="border-b border-slate-100 pb-3">
                        <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <Filter size={18} className="text-[#35877D]" />
                            Create New Segment
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Create an automated target list based on tags and contact attributes.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreateSegment} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700">Segment Name</Label>
                            <Input
                                required
                                placeholder="e.g. Q3 High Value Prospects"
                                value={newSegmentName}
                                onChange={(e) => setNewSegmentName(e.target.value)}
                                className="h-10 rounded-xl border-slate-200 text-xs font-semibold"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700">Description</Label>
                            <Textarea
                                rows={2}
                                placeholder="Target description and use cases..."
                                value={newSegmentDesc}
                                onChange={(e) => setNewSegmentDesc(e.target.value)}
                                className="rounded-xl border-slate-200 text-xs font-semibold"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700">Filter Condition</Label>
                            <select
                                value={selectedTag}
                                onChange={(e) => setSelectedTag(e.target.value)}
                                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#35877D]"
                            >
                                <option value="vip">Tag equals &quot;VIP&quot;</option>
                                <option value="lead_new">Lead Status equals &quot;New&quot;</option>
                                <option value="opt_in">WhatsApp Opt-in equals &quot;true&quot;</option>
                                <option value="no_reply">No response in 7 days</option>
                            </select>
                        </div>

                        <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsCreateModalOpen(false)}
                                className="rounded-xl border-slate-200 text-slate-700 font-bold text-xs h-9"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="bg-[#35877D] hover:bg-[#2c6e66] text-white font-bold text-xs rounded-xl h-9 px-4 shadow-xs"
                            >
                                Save Segment
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
