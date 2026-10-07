"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateConversationStatus } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import {
    MoreVertical,
    User,
    CheckCircle2,
    Clock,
    RotateCcw,
    CheckSquare,
    StickyNote,
    Loader2,
} from "lucide-react";

interface ConversationHeaderMenuProps {
    customerId: number;
    customerName: string;
    customerPhone: string;
    currentStatus: string;
}

export function ConversationHeaderMenu({
    customerId,
    customerName,
    customerPhone,
    currentStatus,
}: ConversationHeaderMenuProps) {
    const router = useRouter();
    const { toast } = useToast();
    const updateStatus = useUpdateConversationStatus();

    const [noteDialogOpen, setNoteDialogOpen] = useState(false);
    const [noteText, setNoteText] = useState("");
    const [savingNote, setSavingNote] = useState(false);

    const handleStatus = async (status: string) => {
        try {
            await updateStatus.mutateAsync({ id: customerId, status });
            toast({
                title: "Status Updated",
                description: `Conversation marked as ${status}.`,
            });
        } catch (err: any) {
            toast({
                title: "Action failed",
                description: err.message || "Could not change status.",
                variant: "destructive",
            });
        }
    };

    const handleSaveNote = async () => {
        if (!noteText.trim()) return;
        setSavingNote(true);
        try {
            const token = localStorage.getItem("auth_token");
            const res = await fetch(`/api/customers/${customerId}/attributes`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    custom_attributes: {
                        internal_note: noteText.trim(),
                        note_updated_at: new Date().toISOString(),
                    },
                }),
            });

            if (res.ok) {
                toast({
                    title: "Internal Note Saved",
                    description: "Note attached to contact record. Not visible to customer.",
                });
                setNoteDialogOpen(false);
                setNoteText("");
            } else {
                throw new Error("Failed to save note");
            }
        } catch (err: any) {
            toast({
                title: "Could not save note",
                description: err.message || "Failed to update contact notes.",
                variant: "destructive",
            });
        } finally {
            setSavingNote(false);
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        type="button"
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                        title="More conversation options"
                    >
                        <MoreVertical size={16} />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-52 bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 z-50">
                    <DropdownMenuItem
                        onClick={() => router.push(`/contacts/${customerId}`)}
                        className="text-xs font-semibold text-slate-700 hover:bg-[#378179]/05 rounded-xl cursor-pointer py-2 px-2.5 flex items-center gap-2"
                    >
                        <User size={14} className="text-[#378179]" />
                        View Contact Details
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onClick={() => router.push(`/tasks?create=true&customer_id=${customerId}`)}
                        className="text-xs font-semibold text-slate-700 hover:bg-[#378179]/05 rounded-xl cursor-pointer py-2 px-2.5 flex items-center gap-2"
                    >
                        <CheckSquare size={14} className="text-blue-500" />
                        Create Follow-up Task
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onClick={() => setNoteDialogOpen(true)}
                        className="text-xs font-semibold text-slate-700 hover:bg-[#378179]/05 rounded-xl cursor-pointer py-2 px-2.5 flex items-center gap-2"
                    >
                        <StickyNote size={14} className="text-amber-500" />
                        Add Internal Note
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="my-1 bg-slate-100" />

                    {currentStatus !== "pending" && (
                        <DropdownMenuItem
                            onClick={() => handleStatus("pending")}
                            className="text-xs font-semibold text-slate-700 hover:bg-amber-50 rounded-xl cursor-pointer py-2 px-2.5 flex items-center gap-2"
                        >
                            <Clock size={14} className="text-amber-600" />
                            Mark as Pending
                        </DropdownMenuItem>
                    )}

                    {currentStatus !== "resolved" ? (
                        <DropdownMenuItem
                            onClick={() => handleStatus("resolved")}
                            className="text-xs font-semibold text-slate-700 hover:bg-emerald-50 rounded-xl cursor-pointer py-2 px-2.5 flex items-center gap-2"
                        >
                            <CheckCircle2 size={14} className="text-emerald-600" />
                            Resolve Conversation
                        </DropdownMenuItem>
                    ) : (
                        <DropdownMenuItem
                            onClick={() => handleStatus("open")}
                            className="text-xs font-semibold text-slate-700 hover:bg-[#378179]/05 rounded-xl cursor-pointer py-2 px-2.5 flex items-center gap-2"
                        >
                            <RotateCcw size={14} className="text-[#378179]" />
                            Reopen Conversation
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Internal Note Dialog */}
            <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
                <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6 border-slate-200">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                            <StickyNote size={16} className="text-amber-500" />
                            Internal Team Note
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Notes are strictly internal and will NEVER be transmitted to WhatsApp.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 pt-2">
                        <Textarea
                            rows={4}
                            placeholder="Add private note about this customer conversation..."
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            className="text-xs rounded-xl bg-slate-50 border-slate-200"
                        />

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setNoteDialogOpen(false)}
                                className="text-xs rounded-xl h-8 px-3"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                onClick={handleSaveNote}
                                disabled={savingNote || !noteText.trim()}
                                className="bg-[#378179] hover:bg-[#2b625c] text-white font-bold text-xs rounded-xl h-8 px-4"
                            >
                                {savingNote ? <Loader2 size={12} className="animate-spin" /> : "Save Note"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
