"use client";

import React from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useListWorkspaceMembers, useAssignConversation } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { UserCheck, UserX, ChevronDown, Check, Loader2 } from "lucide-react";

interface ConversationAssigneeDropdownProps {
    customerId: number;
    currentAssigneeId?: number | null;
    currentAssigneeName?: string | null;
}

export function ConversationAssigneeDropdown({
    customerId,
    currentAssigneeId,
    currentAssigneeName,
}: ConversationAssigneeDropdownProps) {
    const { toast } = useToast();
    const { data: members = [], isLoading } = useListWorkspaceMembers();
    const assignMutation = useAssignConversation();

    const handleAssign = async (userId: number | null) => {
        try {
            await assignMutation.mutateAsync({ id: customerId, assignedTo: userId });
            toast({
                title: userId ? "Conversation Assigned" : "Conversation Unassigned",
                description: userId ? "Assigned to team member." : "Conversation is now in general queue.",
            });
        } catch (err: any) {
            toast({
                title: "Assignment failed",
                description: err.message || "Could not update assignee.",
                variant: "destructive",
            });
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild disabled={assignMutation.isPending}>
                <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
                >
                    {assignMutation.isPending ? (
                        <Loader2 size={11} className="animate-spin text-[#378179]" />
                    ) : (
                        <UserCheck size={12} className="text-[#378179]" />
                    )}
                    <span>{currentAssigneeName || "Unassigned"}</span>
                    <ChevronDown size={10} className="text-slate-400 ml-0.5" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-52 bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 z-50">
                <DropdownMenuLabel className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 py-1">
                    Assign Agent
                </DropdownMenuLabel>

                <DropdownMenuItem
                    onClick={() => handleAssign(null)}
                    className="text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer py-1.5 px-2.5 flex items-center justify-between"
                >
                    <div className="flex items-center gap-2">
                        <UserX size={13} className="text-slate-400" />
                        <span>Unassigned</span>
                    </div>
                    {!currentAssigneeId && <Check size={13} className="text-[#378179]" />}
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1 bg-slate-100" />

                {isLoading ? (
                    <div className="p-2 text-center text-xs text-slate-400">Loading members...</div>
                ) : members.length === 0 ? (
                    <div className="p-2 text-center text-xs text-slate-400">No other team members</div>
                ) : (
                    members.map((m) => (
                        <DropdownMenuItem
                            key={m.id}
                            onClick={() => handleAssign(m.id)}
                            className="text-xs font-semibold text-slate-700 hover:bg-[#378179]/05 rounded-xl cursor-pointer py-1.5 px-2.5 flex items-center justify-between"
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="h-5 w-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                                    {m.name?.charAt(0).toUpperCase() || "U"}
                                </div>
                                <span className="truncate">{m.name}</span>
                            </div>
                            {currentAssigneeId === m.id && <Check size={13} className="text-[#378179]" />}
                        </DropdownMenuItem>
                    ))
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
