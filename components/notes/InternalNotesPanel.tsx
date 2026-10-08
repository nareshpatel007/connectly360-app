"use client";

import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    useCustomerNotes,
    useCreateCustomerNote,
    useUpdateInternalNote,
    useDeleteInternalNote,
    type InternalNoteItem,
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth-context";
import {
    StickyNote,
    Pin,
    PinOff,
    Pencil,
    Trash2,
    Shield,
    Loader2,
    MessageSquare,
    User,
    Clock,
    Plus,
    Check,
    X,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";

import { MentionTextarea, MentionFormattedText } from "./MentionTextarea";

interface InternalNotesPanelProps {
    customerId: number;
    conversationId?: number | null;
    customerName?: string;
    showScopeFilter?: boolean;
}

export function InternalNotesPanel({
    customerId,
    conversationId,
    customerName,
    showScopeFilter = true,
}: InternalNotesPanelProps) {
    const { user: currentUser } = useAuth();
    const [noteContent, setNoteContent] = useState("");
    const [mentionUserIds, setMentionUserIds] = useState<number[]>([]);
    const [isPinned, setIsPinned] = useState(false);
    const [scopeFilter, setScopeFilter] = useState<"all" | "conversation">("all");

    // Edit state
    const [editingNote, setEditingNote] = useState<InternalNoteItem | null>(null);
    const [editContent, setEditContent] = useState("");
    const [editMentionUserIds, setEditMentionUserIds] = useState<number[]>([]);
    const [editPinned, setEditPinned] = useState(false);

    // Delete state
    const [deletingNote, setDeletingNote] = useState<InternalNoteItem | null>(null);

    // Queries & mutations
    const { data: notes = [], isLoading } = useCustomerNotes(customerId);
    const createMutation = useCreateCustomerNote();
    const updateMutation = useUpdateInternalNote();
    const deleteMutation = useDeleteInternalNote();

    const filteredNotes = useMemo(() => {
        if (scopeFilter === "conversation" && conversationId) {
            return notes.filter((n) => n.conversation_id === conversationId);
        }
        return notes;
    }, [notes, scopeFilter, conversationId]);

    const handleCreateNote = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = noteContent.trim();
        if (!trimmed) {
            toast.error("Note content cannot be empty.");
            return;
        }

        try {
            await createMutation.mutateAsync({
                customerId,
                conversationId: scopeFilter === "conversation" || conversationId ? (conversationId || undefined) : undefined,
                content: trimmed,
                is_pinned: isPinned,
                mention_user_ids: mentionUserIds.length > 0 ? mentionUserIds : undefined,
            });
            toast.success("Internal note added.");
            setNoteContent("");
            setMentionUserIds([]);
            setIsPinned(false);
        } catch (err: any) {
            toast.error(err.message || "Failed to add internal note.");
        }
    };

    const handleSaveEdit = async () => {
        if (!editingNote) return;
        const trimmed = editContent.trim();
        if (!trimmed) {
            toast.error("Note content cannot be empty.");
            return;
        }

        try {
            await updateMutation.mutateAsync({
                id: editingNote.id,
                content: trimmed,
                is_pinned: editPinned,
                mention_user_ids: editMentionUserIds.length > 0 ? editMentionUserIds : undefined,
            });
            toast.success("Note updated.");
            setEditingNote(null);
            setEditMentionUserIds([]);
        } catch (err: any) {
            toast.error(err.message || "Failed to update note.");
        }
    };

    const handleDeleteNote = async () => {
        if (!deletingNote) return;
        try {
            await deleteMutation.mutateAsync({
                id: deletingNote.id,
                customerId,
                conversationId: deletingNote.conversation_id || undefined,
            });
            toast.success("Note removed.");
            setDeletingNote(null);
        } catch (err: any) {
            toast.error(err.message || "Failed to delete note.");
        }
    };

    const handleTogglePin = async (note: InternalNoteItem) => {
        try {
            await updateMutation.mutateAsync({
                id: note.id,
                is_pinned: !note.is_pinned,
            });
            toast.success(note.is_pinned ? "Note unpinned." : "Note pinned to top.");
        } catch (err: any) {
            toast.error(err.message || "Failed to toggle pin.");
        }
    };

    const canModify = (note: InternalNoteItem) => {
        if (!currentUser) return false;
        if (note.user_id === currentUser.id) return true;
        if ((currentUser as any).is_admin) return true;
        const role = ((currentUser as any).role || "").toLowerCase();
        return ["owner", "admin", "manager"].includes(role);
    };


    return (
        <div className="space-y-4">
            {/* Security Notice Banner */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/60 text-amber-900 text-[11px]">
                <Shield size={14} className="text-amber-600 shrink-0" />
                <span>
                    <strong>Strictly Internal:</strong> Notes are only visible to your workspace team and are never sent to the customer on WhatsApp.
                </span>
            </div>

            {/* Scope Filter Buttons (if conversation context exists) */}
            {showScopeFilter && conversationId && (
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                    <button
                        type="button"
                        onClick={() => setScopeFilter("all")}
                        className={`flex-1 py-1 rounded-lg font-medium transition-colors text-[11px] ${
                            scopeFilter === "all"
                                ? "bg-white text-slate-800 shadow-2xs font-semibold"
                                : "text-slate-500 hover:text-slate-700"
                        }`}
                    >
                        All Contact Notes ({notes.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setScopeFilter("conversation")}
                        className={`flex-1 py-1 rounded-lg font-medium transition-colors text-[11px] flex items-center justify-center gap-1 ${
                            scopeFilter === "conversation"
                                ? "bg-white text-[#2F8F83] shadow-2xs font-semibold"
                                : "text-slate-500 hover:text-slate-700"
                        }`}
                    >
                        <MessageSquare size={11} />
                        This Conversation ({notes.filter((n) => n.conversation_id === conversationId).length})
                    </button>
                </div>
            )}

            {/* Create New Note Form */}
            <form onSubmit={handleCreateNote} className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                <MentionTextarea
                    value={noteContent}
                    onChange={setNoteContent}
                    onMentionsChange={setMentionUserIds}
                    placeholder={
                        customerName
                            ? `Add internal note about ${customerName}... Type @ to mention teammates`
                            : "Add internal note for team members... Type @ to mention teammates"
                    }
                    rows={3}
                />

                <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={isPinned}
                            onChange={(e) => setIsPinned(e.target.checked)}
                            className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-3.5 w-3.5"
                        />
                        <span className="flex items-center gap-1">
                            <Pin size={11} className={isPinned ? "text-amber-500" : "text-slate-400"} />
                            Pin to top
                        </span>
                    </label>

                    <Button
                        type="submit"
                        size="sm"
                        disabled={createMutation.isPending || !noteContent.trim()}
                        className="h-7 text-xs bg-[#2F8F83] hover:bg-[#267A70] text-white rounded-lg px-3 shadow-2xs"
                    >
                        {createMutation.isPending ? (
                            <Loader2 size={12} className="animate-spin" />
                        ) : (
                            <span className="flex items-center gap-1">
                                <Plus size={12} /> Add Note
                            </span>
                        )}
                    </Button>
                </div>
            </form>

            {/* Notes List */}
            <div className="space-y-2.5">
                {isLoading ? (
                    <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                        <Loader2 size={14} className="animate-spin text-[#2F8F83]" />
                        Loading internal notes...
                    </div>
                ) : filteredNotes.length === 0 ? (
                    <div className="py-8 text-center space-y-1.5 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                        <StickyNote size={20} className="mx-auto text-slate-300" />
                        <p className="text-xs font-semibold text-slate-600">No notes yet</p>
                        <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                            Keep track of customer requests, preferences, meeting summaries, or internal flags.
                        </p>
                    </div>
                ) : (
                    filteredNotes.map((note) => {
                        const authorName = note.user?.name || "Team Member";
                        const canEdit = canModify(note);
                        const isAttachedToConv = !!note.conversation_id;

                        let timeFormatted = "";
                        try {
                            timeFormatted = formatDistanceToNow(new Date(note.created_at), { addSuffix: true });
                        } catch {
                            timeFormatted = note.created_at;
                        }

                        return (
                            <div
                                key={note.id}
                                className={`p-3 rounded-2xl border transition-colors group space-y-2 ${
                                    note.is_pinned
                                        ? "bg-amber-50/30 border-amber-200/80 shadow-2xs"
                                        : "bg-white border-slate-200/80 hover:border-slate-300"
                                }`}
                            >
                                {/* Author & Header */}
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="h-6 w-6 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                                            {authorName.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs font-bold text-slate-800 truncate">
                                                    {authorName}
                                                </span>
                                                {note.is_pinned && (
                                                    <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-amber-700 bg-amber-100/70 px-1.5 py-0.2 rounded-full border border-amber-200 shrink-0">
                                                        <Pin size={8} /> Pinned
                                                    </span>
                                                )}
                                                {isAttachedToConv && (
                                                    <Badge
                                                        variant="secondary"
                                                        className="text-[9px] px-1.5 py-0 h-4 font-normal bg-slate-100 text-slate-600 shrink-0"
                                                    >
                                                        Chat #{note.conversation_id}
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                                <Clock size={9} />
                                                {timeFormatted}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                        {canEdit && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => handleTogglePin(note)}
                                                    className="p-1 hover:text-amber-600 text-slate-400 rounded transition-colors"
                                                    title={note.is_pinned ? "Unpin note" : "Pin note"}
                                                >
                                                    {note.is_pinned ? <PinOff size={12} /> : <Pin size={12} />}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setEditingNote(note);
                                                        setEditContent(note.content);
                                                        setEditPinned(note.is_pinned);
                                                    }}
                                                    className="p-1 hover:text-[#2F8F83] text-slate-400 rounded transition-colors"
                                                    title="Edit note"
                                                >
                                                    <Pencil size={12} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setDeletingNote(note)}
                                                    className="p-1 hover:text-red-600 text-slate-400 rounded transition-colors"
                                                    title="Delete note"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Note Content */}
                                <div className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                                    <MentionFormattedText text={note.content} mentions={note.mentions} />
                                </div>

                                {/* Tagged team members badges */}
                                {note.mentions && note.mentions.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-slate-100">
                                        <span className="text-[10px] font-semibold text-slate-400">Mentioned:</span>
                                        {note.mentions.map((m) => (
                                            <span
                                                key={m.id}
                                                className="inline-flex items-center gap-1 text-[10px] font-medium bg-teal-50 text-[#2F8F83] border border-teal-200/70 rounded-full px-2 py-0.5"
                                            >
                                                <span className="h-3.5 w-3.5 rounded-full bg-teal-200 text-[#2F8F83] text-[8px] flex items-center justify-center font-bold">
                                                    {m.name.charAt(0).toUpperCase()}
                                                </span>
                                                {m.name}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* EDIT NOTE MODAL */}
            <Dialog open={!!editingNote} onOpenChange={(o) => !o && setEditingNote(null)}>
                <DialogContent className="sm:max-w-md bg-white rounded-2xl p-5 border border-slate-200">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <Pencil size={14} className="text-[#2F8F83]" />
                            Edit Internal Note
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Update internal team note content.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 pt-2">
                        <MentionTextarea
                            value={editContent}
                            onChange={setEditContent}
                            onMentionsChange={setEditMentionUserIds}
                            rows={4}
                            placeholder="Edit note content... Type @ to mention team members"
                        />

                        <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={editPinned}
                                onChange={(e) => setEditPinned(e.target.checked)}
                                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-3.5 w-3.5"
                            />
                            <span>Pin this note to top</span>
                        </label>
                    </div>

                    <DialogFooter className="pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingNote(null)}
                            className="h-8 text-xs rounded-lg"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            disabled={updateMutation.isPending || !editContent.trim()}
                            onClick={handleSaveEdit}
                            className="h-8 text-xs bg-[#2F8F83] hover:bg-[#267A70] text-white rounded-lg"
                        >
                            {updateMutation.isPending ? (
                                <Loader2 size={13} className="animate-spin" />
                            ) : (
                                "Save Changes"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* DELETE CONFIRMATION MODAL */}
            <Dialog open={!!deletingNote} onOpenChange={(o) => !o && setDeletingNote(null)}>
                <DialogContent className="sm:max-w-[360px] bg-white rounded-2xl p-5 border border-slate-200">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <Trash2 size={15} className="text-red-500" />
                            Delete Note
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-600">
                            Are you sure you want to delete this internal note? This cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="pt-3">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setDeletingNote(null)}
                            className="h-8 text-xs rounded-lg"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            disabled={deleteMutation.isPending}
                            onClick={handleDeleteNote}
                            className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg"
                        >
                            {deleteMutation.isPending ? (
                                <Loader2 size={13} className="animate-spin" />
                            ) : (
                                "Delete"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
