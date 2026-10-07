"use client";

import React, { useState, useEffect } from "react";
import {
    Users,
    Phone,
    MapPin,
    Clock,
    X,
    Loader2,
    Calendar,
    ArrowUpRight,
    Send
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface SegmentContactsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    segmentId: string | null;
    segmentName: string;
    token: string | null;
}

export function SegmentContactsDialog({
    open,
    onOpenChange,
    segmentId,
    segmentName,
    token
}: SegmentContactsDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [contacts, setContacts] = useState<any[]>([]);
    const [targetCount, setTargetCount] = useState<number>(0);

    useEffect(() => {
        if (open && segmentId && token) {
            setIsLoading(true);
            fetch(`/api/segments/${segmentId}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then((res) => res.json())
                .then((data) => {
                    if (data.status && data.data) {
                        setContacts(data.data.sampleContacts || []);
                        setTargetCount(data.data.targetCount || 0);
                    }
                })
                .catch((err) => console.error(err))
                .finally(() => setIsLoading(false));
        }
    }, [open, segmentId, token]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col p-6 rounded-2xl bg-white border border-slate-200">
                <DialogHeader className="border-b border-slate-100 pb-3">
                    <DialogTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Users size={18} className="text-[#35877D]" />
                            <span>Audience: {segmentName}</span>
                        </div>
                        <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-teal-50 text-[#35877D] border border-teal-100 font-mono">
                            {targetCount} Contacts
                        </span>
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500">
                        Real-time contacts currently matching this segment criteria.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto py-3 space-y-2">
                    {isLoading ? (
                        <div className="space-y-2 py-1">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70 flex items-center justify-between gap-3 animate-pulse"
                                >
                                    <div className="space-y-1.5 flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <Skeleton className="h-3.5 w-28 rounded-md" />
                                            <Skeleton className="h-3.5 w-12 rounded-md" />
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Skeleton className="h-3 w-24 rounded-md" />
                                            <Skeleton className="h-3 w-16 rounded-md" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-7 w-16 rounded-lg shrink-0" />
                                </div>
                            ))}
                        </div>
                    ) : contacts.length === 0 ? (
                        <div className="py-10 text-center text-slate-400 text-xs font-semibold">
                            No contacts currently match this segment filter.
                        </div>
                    ) : (
                        contacts.map((c) => (
                            <div
                                key={c.id}
                                className="p-3 bg-slate-50 hover:bg-slate-100/70 rounded-xl border border-slate-200/70 flex items-center justify-between gap-3 transition-colors"
                            >
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-xs font-bold text-slate-900">{c.name}</h4>
                                        {c.stage && (
                                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-white text-slate-600 border border-slate-200 uppercase">
                                                {c.stage}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                                        <span className="flex items-center gap-1 font-mono">
                                            <Phone size={11} className="text-slate-400" />
                                            {c.phone}
                                        </span>
                                        {c.city && (
                                            <span className="flex items-center gap-1">
                                                <MapPin size={11} className="text-slate-400" />
                                                {c.city}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="text-right text-[10px] text-slate-400 font-medium shrink-0">
                                    {c.last_interaction ? (
                                        <span className="flex items-center gap-1">
                                            <Clock size={10} />
                                            Active {new Date(c.last_interaction).toLocaleDateString()}
                                        </span>
                                    ) : (
                                        <span>No chats yet</span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-semibold">
                        Showing up to 15 matching contacts
                    </span>
                    <div className="flex items-center gap-2">
                        <Link
                            href={`/marketing/campaigns/new?segment_id=${segmentId}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#35877D] hover:bg-[#2c6e66] text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                        >
                            <Send size={12} />
                            Launch Broadcast
                        </Link>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
