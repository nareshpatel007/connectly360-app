"use client";

import React from "react";
import { Clock, ShieldAlert, CheckCircle2, AlertCircle, Timer, Hourglass } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Conversation, ConversationSla } from "@workspace/api-client-react";

interface SlaThreadBadgeProps {
    thread: Conversation;
}

export function SlaThreadBadge({ thread }: SlaThreadBadgeProps) {
    const isOverdue = thread.isOverdue || thread.slaStatus === "breached";
    const isWarning = thread.slaStatus === "warning";
    const waitingFormatted = thread.waitingTimeFormatted;
    const isWaiting = (thread.waitingTimeSeconds ?? 0) > 0 && thread.lastMessageDirection === "inbound" && thread.conversationStatus !== "resolved";

    if (isOverdue) {
        return (
            <span
                title={`SLA Breached${waitingFormatted ? ` • Waiting ${waitingFormatted}` : ""}`}
                className="text-[8.5px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200/80 shrink-0 inline-flex items-center gap-0.5 animate-pulse"
            >
                <Clock size={9} className="text-rose-600" />
                Overdue{waitingFormatted ? ` ${waitingFormatted}` : ""}
            </span>
        );
    }

    if (isWarning) {
        return (
            <span
                title={`SLA Warning • Approaching deadline${waitingFormatted ? ` (${waitingFormatted})` : ""}`}
                className="text-[8.5px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200/80 shrink-0 inline-flex items-center gap-0.5"
            >
                <Clock size={9} className="text-amber-600" />
                Urgent{waitingFormatted ? ` ${waitingFormatted}` : ""}
            </span>
        );
    }

    if (isWaiting && waitingFormatted) {
        return (
            <span
                title={`Customer waiting for reply: ${waitingFormatted}`}
                className="text-[8.5px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0 inline-flex items-center gap-0.5"
            >
                <Clock size={8.5} className="text-slate-400" />
                Wait: {waitingFormatted}
            </span>
        );
    }

    return null;
}

interface SlaHeaderIndicatorProps {
    thread: Conversation;
    onConfigureSla?: () => void;
}

export function SlaHeaderIndicator({ thread, onConfigureSla }: SlaHeaderIndicatorProps) {
    const sla: ConversationSla | undefined = thread.sla;
    const slaStatus = sla?.sla_status || thread.slaStatus || "disabled";
    const isOverdue = sla?.is_overdue || thread.isOverdue || slaStatus === "breached";
    const isWarning = slaStatus === "warning";
    const isMet = slaStatus === "met";
    const isOnTrack = slaStatus === "on_track";

    // Format display texts
    const frtFormatted = sla?.first_response_time_formatted || (thread.firstResponseTimeSeconds ? `${Math.round(thread.firstResponseTimeSeconds / 60)}m` : "Pending");
    const artFormatted = sla?.average_response_time_formatted || (thread.averageResponseTimeSeconds ? `${Math.round(thread.averageResponseTimeSeconds / 60)}m` : "—");
    const resolutionFormatted = sla?.resolution_time_formatted || "—";
    const waitingFormatted = sla?.waiting_time_formatted || thread.waitingTimeFormatted || "None";

    let badgeColor = "bg-slate-100 text-slate-700 border-slate-200";
    let icon = <Timer size={12} className="text-slate-500" />;
    let label = "SLA";

    if (isOverdue) {
        badgeColor = "bg-rose-50 text-rose-700 border-rose-200 animate-pulse";
        icon = <AlertCircle size={12} className="text-rose-600" />;
        label = `Breached (${waitingFormatted})`;
    } else if (isWarning) {
        badgeColor = "bg-amber-50 text-amber-800 border-amber-200";
        icon = <Hourglass size={12} className="text-amber-600" />;
        label = `Warning (${waitingFormatted})`;
    } else if (isMet) {
        badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
        icon = <CheckCircle2 size={12} className="text-emerald-600" />;
        label = "SLA Met";
    } else if (isOnTrack) {
        badgeColor = "bg-teal-50 text-teal-700 border-teal-200";
        icon = <CheckCircle2 size={12} className="text-teal-600" />;
        label = "On Track";
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-semibold cursor-pointer transition-colors hover:shadow-2xs ${badgeColor}`}
                    title="Click to view Response Time & SLA metrics"
                >
                    {icon}
                    <span>{label}</span>
                </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 p-3 text-xs shadow-lg rounded-xl border border-slate-200 bg-white">
                <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                            <Clock size={13} className="text-[#2F8F83]" />
                            Response Time & SLA
                        </span>
                        <span
                            className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                                isOverdue
                                    ? "bg-rose-100 text-rose-800"
                                    : isWarning
                                    ? "bg-amber-100 text-amber-800"
                                    : isMet
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-slate-100 text-slate-700"
                            }`}
                        >
                            {slaStatus.replace("_", " ")}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-150">
                            <span className="text-[10px] text-slate-400 font-medium block">First Reply (FRT)</span>
                            <span className="font-bold text-slate-800 mt-0.5 block">{frtFormatted}</span>
                        </div>

                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-150">
                            <span className="text-[10px] text-slate-400 font-medium block">Avg Reply (ART)</span>
                            <span className="font-bold text-slate-800 mt-0.5 block">{artFormatted}</span>
                        </div>

                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-150">
                            <span className="text-[10px] text-slate-400 font-medium block">Waiting Time</span>
                            <span className={`font-bold mt-0.5 block ${isOverdue ? "text-rose-600" : "text-slate-800"}`}>
                                {waitingFormatted}
                            </span>
                        </div>

                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-150">
                            <span className="text-[10px] text-slate-400 font-medium block">Resolution</span>
                            <span className="font-bold text-slate-800 mt-0.5 block">{resolutionFormatted}</span>
                        </div>
                    </div>

                    {sla?.breach_reason && (
                        <div className="p-2 bg-rose-50 border border-rose-200/60 rounded-md text-[10px] text-rose-800 flex items-start gap-1.5">
                            <AlertCircle size={12} className="text-rose-600 shrink-0 mt-0.5" />
                            <span>{sla.breach_reason}</span>
                        </div>
                    )}

                    {onConfigureSla && (
                        <div className="pt-1 border-t border-slate-100 flex justify-end">
                            <button
                                type="button"
                                onClick={onConfigureSla}
                                className="text-[10.5px] font-semibold text-[#2F8F83] hover:underline cursor-pointer"
                            >
                                SLA Policy Settings →
                            </button>
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
