"use client";

import React, { useState } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useUpdateConversationStatus } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { ChevronDown, Check, Loader2, Clock, CheckCircle2, AlertCircle } from "lucide-react";

interface ConversationStatusDropdownProps {
    customerId: number;
    currentStatus: "open" | "pending" | "resolved" | "closed" | string;
    onStatusChange?: (newStatus: string) => void;
    disabled?: boolean;
}

export function ConversationStatusDropdown({
    customerId,
    currentStatus = "open",
    onStatusChange,
    disabled = false,
}: ConversationStatusDropdownProps) {
    const { toast } = useToast();
    const updateStatus = useUpdateConversationStatus();
    const [localStatus, setLocalStatus] = useState(currentStatus);

    // Sync when currentStatus changes from server
    React.useEffect(() => {
        setLocalStatus(currentStatus);
    }, [currentStatus]);

    const activeStatus = (localStatus || "open").toLowerCase();

    const handleSelectStatus = async (status: string) => {
        if (status === activeStatus) return;

        const previous = localStatus;
        // Optimistic UI update
        setLocalStatus(status);
        if (onStatusChange) onStatusChange(status);

        try {
            await updateStatus.mutateAsync({ id: customerId, status });
            toast({
                title: "Status Updated",
                description: `Conversation set to ${status.toUpperCase()}.`,
            });
        } catch (err: any) {
            setLocalStatus(previous);
            if (onStatusChange) onStatusChange(previous);
            toast({
                title: "Failed to update status",
                description: err.message || "Could not change status.",
                variant: "destructive",
            });
        }
    };

    const getBadgeStyle = (st: string) => {
        switch (st) {
            case "open":
                return "bg-[#378179]/10 text-[#378179] hover:bg-[#378179]/15 border-[#378179]/20";
            case "pending":
                return "bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200";
            case "resolved":
            case "closed":
                return "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200";
            default:
                return "bg-slate-100 text-slate-700 border-slate-200";
        }
    };

    const getStatusLabel = (st: string) => {
        switch (st) {
            case "open": return "Open";
            case "pending": return "Pending";
            case "resolved": return "Resolved";
            case "closed": return "Closed";
            default: return st;
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild disabled={disabled || updateStatus.isPending}>
                <button
                    type="button"
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold cursor-pointer transition-colors shadow-2xs ${getBadgeStyle(activeStatus)}`}
                >
                    {updateStatus.isPending ? (
                        <Loader2 size={11} className="animate-spin" />
                    ) : activeStatus === "open" ? (
                        <span className="h-1.5 w-1.5 rounded-full bg-[#378179]" />
                    ) : activeStatus === "pending" ? (
                        <Clock size={11} className="text-amber-600" />
                    ) : (
                        <CheckCircle2 size={11} className="text-emerald-600" />
                    )}
                    <span>{getStatusLabel(activeStatus)}</span>
                    <ChevronDown size={11} className="opacity-60 ml-0.5" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-44 bg-white rounded-2xl shadow-xl border border-slate-200 p-1 z-50">
                <DropdownMenuItem
                    onClick={() => handleSelectStatus("open")}
                    className="text-xs font-semibold text-slate-700 hover:bg-[#378179]/05 rounded-xl cursor-pointer py-2 px-2.5 flex items-center justify-between"
                >
                    <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[#378179]" />
                        <span>Open</span>
                    </div>
                    {activeStatus === "open" && <Check size={13} className="text-[#378179]" />}
                </DropdownMenuItem>

                <DropdownMenuItem
                    onClick={() => handleSelectStatus("pending")}
                    className="text-xs font-semibold text-slate-700 hover:bg-amber-50 rounded-xl cursor-pointer py-2 px-2.5 flex items-center justify-between"
                >
                    <div className="flex items-center gap-2">
                        <Clock size={13} className="text-amber-600" />
                        <span>Pending</span>
                    </div>
                    {activeStatus === "pending" && <Check size={13} className="text-amber-600" />}
                </DropdownMenuItem>

                <DropdownMenuItem
                    onClick={() => handleSelectStatus("resolved")}
                    className="text-xs font-semibold text-slate-700 hover:bg-emerald-50 rounded-xl cursor-pointer py-2 px-2.5 flex items-center justify-between"
                >
                    <div className="flex items-center gap-2">
                        <CheckCircle2 size={13} className="text-emerald-600" />
                        <span>Resolved</span>
                    </div>
                    {activeStatus === "resolved" && <Check size={13} className="text-emerald-600" />}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
