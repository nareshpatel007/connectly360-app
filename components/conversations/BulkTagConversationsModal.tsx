"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Tag as TagIcon,
    Plus,
    X,
    Check,
    Loader2,
    Users,
    User,
} from "lucide-react";
import { toast } from "sonner";
import {
    useWorkspaceTags,
    useBulkTagConversations,
    WorkspaceTag,
} from "@/lib/api-client-react";

interface BulkTagConversationsModalProps {
    isOpen: boolean;
    onClose: () => void;
    conversationIds: number[];
    onSuccess?: () => void;
}

export function BulkTagConversationsModal({
    isOpen,
    onClose,
    conversationIds,
    onSuccess,
}: BulkTagConversationsModalProps) {
    const { data: workspaceTagsResponse } = useWorkspaceTags();
    const bulkTagMutation = useBulkTagConversations();

    const [tagsToAdd, setTagsToAdd] = useState<string[]>([]);
    const [tagsToRemove, setTagsToRemove] = useState<string[]>([]);
    const [customTagInput, setCustomTagInput] = useState("");

    const workspaceTags: WorkspaceTag[] = workspaceTagsResponse?.data ?? [];

    const handleToggleAdd = (name: string) => {
        // If it was marked for removal, unmark removal
        setTagsToRemove((prev) => prev.filter((t) => t.toLowerCase() !== name.toLowerCase()));

        setTagsToAdd((prev) =>
            prev.some((t) => t.toLowerCase() === name.toLowerCase())
                ? prev.filter((t) => t.toLowerCase() !== name.toLowerCase())
                : [...prev, name]
        );
    };

    const handleToggleRemove = (name: string) => {
        // If it was marked for addition, unmark addition
        setTagsToAdd((prev) => prev.filter((t) => t.toLowerCase() !== name.toLowerCase()));

        setTagsToRemove((prev) =>
            prev.some((t) => t.toLowerCase() === name.toLowerCase())
                ? prev.filter((t) => t.toLowerCase() !== name.toLowerCase())
                : [...prev, name]
        );
    };

    const handleAddCustomTag = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = customTagInput.trim();
        if (!trimmed) return;

        if (!tagsToAdd.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
            setTagsToAdd((prev) => [...prev, trimmed]);
            setTagsToRemove((prev) => prev.filter((t) => t.toLowerCase() !== trimmed.toLowerCase()));
        }
        setCustomTagInput("");
    };

    const handleSubmit = async () => {
        if (tagsToAdd.length === 0 && tagsToRemove.length === 0) {
            toast.error("Please select at least one tag to add or remove.");
            return;
        }

        try {
            await bulkTagMutation.mutateAsync({
                conversation_ids: conversationIds,
                add_tags: tagsToAdd,
                remove_tags: tagsToRemove,
            });

            toast.success(
                `Updated tags on ${conversationIds.length} conversation${conversationIds.length === 1 ? "" : "s"}.`
            );
            handleClose();
            onSuccess?.();
        } catch (err: any) {
            toast.error(err.message || "Failed to bulk update tags");
        }
    };

    const handleClose = () => {
        setTagsToAdd([]);
        setTagsToRemove([]);
        setCustomTagInput("");
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6 border-slate-200">
                <DialogHeader>
                    <DialogTitle className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                        <TagIcon size={16} className="text-[#378179]" />
                        Bulk Tag Conversations
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500">
                        Apply or remove tags across{" "}
                        <strong className="text-slate-700">{conversationIds.length}</strong> selected
                        conversation{conversationIds.length === 1 ? "" : "s"}.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Add Tags Section */}
                    <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
                            Tags to Add
                        </label>
                        <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-slate-50 border border-slate-200 rounded-xl">
                            {tagsToAdd.length === 0 ? (
                                <span className="text-[11px] text-slate-400 italic">
                                    Click available tags below or type to add...
                                </span>
                            ) : (
                                tagsToAdd.map((name) => (
                                    <Badge
                                        key={name}
                                        variant="secondary"
                                        className="bg-[#378179]/15 text-[#378179] border-[#378179]/30 text-[11px] font-medium py-0.5 px-2 rounded-lg flex items-center gap-1"
                                    >
                                        <Plus size={10} className="text-[#378179]" />
                                        <span>{name}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleToggleAdd(name)}
                                            className="hover:opacity-75 focus:outline-none p-0.5 ml-0.5 rounded-full"
                                        >
                                            <X size={10} />
                                        </button>
                                    </Badge>
                                ))
                            )}
                        </div>

                        {/* Add custom tag input */}
                        <form onSubmit={handleAddCustomTag} className="flex gap-1.5 mt-2">
                            <Input
                                placeholder="Type custom tag name and press Enter..."
                                value={customTagInput}
                                onChange={(e) => setCustomTagInput(e.target.value)}
                                className="h-7.5 text-xs rounded-lg"
                            />
                            <Button
                                type="submit"
                                variant="outline"
                                size="sm"
                                disabled={!customTagInput.trim()}
                                className="h-7.5 text-xs px-2.5 rounded-lg shrink-0 border-[#378179] text-[#378179]"
                            >
                                <Plus size={12} className="mr-1" /> Add
                            </Button>
                        </form>
                    </div>

                    {/* Available Tags to Pick From */}
                    <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
                            Workspace Tags
                        </label>
                        <div className="max-h-36 overflow-y-auto p-1 border border-slate-100 rounded-xl space-y-1">
                            {workspaceTags.length === 0 ? (
                                <div className="text-[11px] text-slate-400 p-2 text-center">
                                    No workspace tags found yet.
                                </div>
                            ) : (
                                workspaceTags.map((tag) => {
                                    const isAdded = tagsToAdd.some(
                                        (t) => t.toLowerCase() === tag.name.toLowerCase()
                                    );
                                    const isRemoved = tagsToRemove.some(
                                        (t) => t.toLowerCase() === tag.name.toLowerCase()
                                    );

                                    return (
                                        <div
                                            key={tag.id}
                                            className="flex items-center justify-between p-1.5 hover:bg-slate-50 rounded-lg text-xs"
                                        >
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <span
                                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                                    style={{ backgroundColor: tag.color || "#0d9488" }}
                                                />
                                                <span className="font-medium text-slate-800 truncate">
                                                    {tag.name}
                                                </span>
                                                {tag.routing_user && (
                                                    <span
                                                        className="text-[10px] text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200 flex items-center gap-0.5 shrink-0"
                                                        title={`Routes to user: ${tag.routing_user.name}`}
                                                    >
                                                        <User size={9} />
                                                        {tag.routing_user.name}
                                                    </span>
                                                )}
                                                {tag.routing_team && (
                                                    <span
                                                        className="text-[10px] text-indigo-700 bg-indigo-50 px-1 py-0.2 rounded border border-indigo-200 flex items-center gap-0.5 shrink-0"
                                                        title={`Routes to team: ${tag.routing_team.name}`}
                                                    >
                                                        <Users size={9} />
                                                        {tag.routing_team.name}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-1 shrink-0">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant={isAdded ? "default" : "outline"}
                                                    onClick={() => handleToggleAdd(tag.name)}
                                                    className={`h-6 text-[10px] px-2 rounded-md ${
                                                        isAdded
                                                            ? "bg-[#378179] text-white hover:bg-[#2d6f68]"
                                                            : "text-slate-600 hover:text-slate-900"
                                                    }`}
                                                >
                                                    {isAdded && <Check size={10} className="mr-0.5" />}
                                                    {isAdded ? "Added" : "+ Add"}
                                                </Button>

                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant={isRemoved ? "destructive" : "ghost"}
                                                    onClick={() => handleToggleRemove(tag.name)}
                                                    className={`h-6 text-[10px] px-1.5 rounded-md ${
                                                        isRemoved
                                                            ? ""
                                                            : "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                                    }`}
                                                    title="Strip this tag from selected conversations"
                                                >
                                                    {isRemoved ? "Remove" : "Strip"}
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Tags to Remove Section if any */}
                    {tagsToRemove.length > 0 && (
                        <div>
                            <label className="text-[11px] font-bold text-rose-700 block mb-1.5 uppercase tracking-wider">
                                Tags to Strip / Remove ({tagsToRemove.length})
                            </label>
                            <div className="flex flex-wrap gap-1.5 p-2 bg-rose-50/50 border border-rose-200 rounded-xl">
                                {tagsToRemove.map((name) => (
                                    <Badge
                                        key={name}
                                        variant="outline"
                                        className="bg-rose-100 text-rose-800 border-rose-300 text-[11px] font-medium py-0.5 px-2 rounded-lg flex items-center gap-1"
                                    >
                                        <X size={10} className="text-rose-600" />
                                        <span>{name}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleToggleRemove(name)}
                                            className="hover:opacity-75 focus:outline-none p-0.5 ml-0.5 rounded-full"
                                        >
                                            <X size={10} />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex items-center justify-end gap-2 pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleClose}
                        className="text-xs rounded-xl h-8 px-3"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        onClick={handleSubmit}
                        disabled={
                            bulkTagMutation.isPending ||
                            (tagsToAdd.length === 0 && tagsToRemove.length === 0)
                        }
                        className="bg-[#378179] hover:bg-[#2b625c] text-white font-bold text-xs rounded-xl h-8 px-4 gap-1.5"
                    >
                        {bulkTagMutation.isPending && (
                            <Loader2 size={12} className="animate-spin" />
                        )}
                        Apply to {conversationIds.length} Conversations
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
