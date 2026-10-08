"use client";

import React from "react";
import { Eye, Edit3, AlertTriangle, Users, AlertCircle, Clock } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ConversationPresenceData, ActiveAgentPresence } from "@workspace/api-client-react";

interface ViewingAgentsHeaderProps {
    presenceData?: ConversationPresenceData | null;
}

export function ViewingAgentsHeader({ presenceData }: ViewingAgentsHeaderProps) {
    if (!presenceData) return null;

    const viewingAgents = presenceData.viewing_agents || [];
    const composingAgents = presenceData.composing_agents || [];
    const allOthers = [...composingAgents, ...viewingAgents];

    if (allOthers.length === 0) return null;

    return (
        <TooltipProvider delayDuration={200}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200/80 text-[10.5px] font-medium text-slate-700 cursor-default animate-in fade-in duration-200">
                        <Eye size={12} className="text-slate-500 shrink-0" />
                        <div className="flex -space-x-1.5 items-center">
                            {allOthers.slice(0, 3).map((agent) => (
                                <div
                                    key={agent.id}
                                    title={agent.name}
                                    className={`h-4.5 w-4.5 rounded-full flex items-center justify-center text-[9px] font-bold text-white border border-white shadow-2xs shrink-0 ${
                                        agent.state === "composing" ? "bg-amber-500 animate-pulse" : "bg-[#2F8F83]"
                                    }`}
                                >
                                    {agent.name.charAt(0).toUpperCase()}
                                </div>
                            ))}
                        </div>
                        <span className="text-[10px] text-slate-600 hidden sm:inline">
                            {allOthers.length === 1
                                ? `${allOthers[0].name.split(" ")[0]} viewing`
                                : `${allOthers.length} viewing`}
                        </span>
                    </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="end" className="text-xs bg-slate-900 text-white p-2 rounded-lg max-w-xs shadow-lg">
                    <p className="font-semibold text-[11px] mb-1">Active Colleagues in this chat:</p>
                    <ul className="space-y-1 text-[10.5px]">
                        {allOthers.map((agent) => (
                            <li key={agent.id} className="flex items-center gap-1.5">
                                <span className={`h-1.5 w-1.5 rounded-full ${agent.state === "composing" ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
                                <span className="font-medium">{agent.name}</span>
                                <span className="text-slate-400 text-[9.5px]">
                                    ({agent.state === "composing" ? "typing..." : "viewing"})
                                </span>
                            </li>
                        ))}
                    </ul>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

interface ComposingIndicatorBannerProps {
    presenceData?: ConversationPresenceData | null;
}

export function ComposingIndicatorBanner({ presenceData }: ComposingIndicatorBannerProps) {
    if (!presenceData) return null;

    const composingAgents = presenceData.composing_agents || [];
    if (composingAgents.length === 0) return null;

    const names = composingAgents.map((a) => a.name).join(", ");

    return (
        <div className="px-3 py-1 bg-amber-50 border-t border-amber-200/80 flex items-center justify-between text-xs text-amber-900 animate-in slide-in-from-bottom-1 duration-150 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
                <Edit3 size={13} className="text-amber-600 shrink-0 animate-bounce" />
                <span className="text-[11px] font-medium truncate">
                    <strong className="font-bold">{names}</strong> is composing a reply...
                </span>
            </div>
            <span className="text-[10px] text-amber-700 bg-amber-100/80 px-1.5 py-0.2 rounded font-semibold shrink-0">
                Live Presence
            </span>
        </div>
    );
}

interface CollisionWarningBannerProps {
    presenceData?: ConversationPresenceData | null;
}

export function CollisionWarningBanner({ presenceData }: CollisionWarningBannerProps) {
    if (!presenceData || !presenceData.has_collision) return null;

    const warning = presenceData.collision_warning;
    if (!warning) return null;

    const isRecentReply = presenceData.collision_type === "recent_reply";

    return (
        <div
            className={`px-3 py-1.5 border-t flex items-center justify-between text-xs gap-2 shrink-0 ${
                isRecentReply
                    ? "bg-rose-50 border-rose-200 text-rose-900"
                    : "bg-amber-50 border-amber-200 text-amber-900"
            }`}
        >
            <div className="flex items-center gap-2 min-w-0">
                <AlertTriangle size={14} className={isRecentReply ? "text-rose-600 shrink-0" : "text-amber-600 shrink-0"} />
                <span className="text-[11px] font-medium truncate">
                    {warning}
                </span>
            </div>
            <span
                className={`text-[9.5px] uppercase font-bold px-1.5 py-0.2 rounded shrink-0 ${
                    isRecentReply ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                }`}
            >
                Collision Risk
            </span>
        </div>
    );
}

interface CollisionConfirmModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    errorDetails?: {
        message: string;
        agent_name?: string;
        seconds_ago?: number;
        recent_message?: { message: string };
    } | null;
    onConfirmSend: () => void;
}

export function CollisionConfirmModal({
    open,
    onOpenChange,
    errorDetails,
    onConfirmSend,
}: CollisionConfirmModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md p-5 bg-white border border-slate-200 rounded-xl shadow-xl">
                <DialogHeader className="text-left space-y-1.5">
                    <div className="h-9 w-9 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-1">
                        <AlertCircle size={20} />
                    </div>
                    <DialogTitle className="text-base font-bold text-slate-900">
                        Simultaneous Reply Collision Warning
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-600 leading-relaxed">
                        Another agent recently replied to this customer. Sending another message immediately might confuse the customer or duplicate efforts.
                    </DialogDescription>
                </DialogHeader>

                {errorDetails && (
                    <div className="my-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span className="font-semibold text-slate-700">
                                {errorDetails.agent_name || "Another Agent"}
                            </span>
                            {errorDetails.seconds_ago !== undefined && (
                                <span className="flex items-center gap-1 text-[10px] text-rose-600 font-bold">
                                    <Clock size={10} />
                                    {errorDetails.seconds_ago}s ago
                                </span>
                            )}
                        </div>
                        {errorDetails.recent_message?.message && (
                            <p className="text-slate-800 italic bg-white p-2 rounded border border-slate-150 text-[11px]">
                                &quot;{errorDetails.recent_message.message}&quot;
                            </p>
                        )}
                    </div>
                )}

                <DialogFooter className="flex items-center justify-between pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        className="text-xs h-8"
                    >
                        Review Thread First
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                            onOpenChange(false);
                            onConfirmSend();
                        }}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs h-8 px-4"
                    >
                        Send Anyway
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
