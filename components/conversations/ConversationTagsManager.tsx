"use client";

import React, { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Tag as TagIcon,
    Plus,
    X,
    Loader2,
    Check,
    Sparkles,
    User,
    Users,
} from "lucide-react";
import { toast } from "sonner";
import {
    useConversationTags,
    useWorkspaceTags,
    useAttachConversationTag,
    useDetachConversationTag,
    useCreateWorkspaceTag,
    WorkspaceTag,
} from "@/lib/api-client-react";

interface ConversationTagsManagerProps {
    conversationId: number;
    initialTags?: Array<{ id: number; name: string; color?: string }>;
    className?: string;
    readOnly?: boolean;
    compact?: boolean;
}

export function ConversationTagsManager({
    conversationId,
    initialTags = [],
    className = "",
    readOnly = false,
    compact = false,
}: ConversationTagsManagerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    // Queries & Mutations
    const { data: tagsResponse, isLoading: isLoadingTags } = useConversationTags(conversationId);
    const { data: workspaceTagsResponse } = useWorkspaceTags();
    const attachMutation = useAttachConversationTag();
    const detachMutation = useDetachConversationTag();
    const createTagMutation = useCreateWorkspaceTag();

    const activeTags = tagsResponse?.data ?? initialTags;
    const workspaceTags: WorkspaceTag[] = workspaceTagsResponse?.data ?? [];

    const activeTagNames = new Set(activeTags.map((t) => t.name.toLowerCase()));

    // Filtered available workspace tags
    const availableTags = workspaceTags.filter((t) => {
        const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase());
        return matchesSearch;
    });

    const isExactMatch = workspaceTags.some(
        (t) => t.name.toLowerCase() === search.trim().toLowerCase()
    );

    const handleAttach = async (tagName: string) => {
        try {
            await attachMutation.mutateAsync({
                conversationId,
                tag: tagName,
            });
            toast.success(`Tag '${tagName}' attached`);
            setSearch("");
        } catch (err: any) {
            toast.error(err.message || "Failed to attach tag");
        }
    };

    const handleDetach = async (tagName: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await detachMutation.mutateAsync({
                conversationId,
                tag: tagName,
            });
            toast.success(`Tag '${tagName}' removed`);
        } catch (err: any) {
            toast.error(err.message || "Failed to remove tag");
        }
    };

    const handleCreateAndAttach = async () => {
        const cleanName = search.trim();
        if (!cleanName) return;

        try {
            await createTagMutation.mutateAsync({
                name: cleanName,
                color: "#0d9488",
            });
            await handleAttach(cleanName);
            setSearch("");
        } catch (err: any) {
            toast.error(err.message || "Failed to create tag");
        }
    };

    return (
        <div className={`flex items-center flex-wrap gap-1.5 ${className}`}>
            {/* Active Tag Badges */}
            {activeTags.map((tag) => {
                const color = tag.color || "#0d9488";
                return (
                    <Badge
                        key={tag.id || tag.name}
                        variant="secondary"
                        style={{
                            backgroundColor: `${color}15`,
                            color: color,
                            borderColor: `${color}30`,
                        }}
                        className={`border text-[11px] font-medium py-0.5 px-2 rounded-lg flex items-center gap-1 transition-all ${
                            compact ? "text-[10px] px-1.5 py-0" : ""
                        }`}
                    >
                        <TagIcon size={compact ? 10 : 11} className="shrink-0" style={{ color }} />
                        <span>{tag.name}</span>
                        {!readOnly && (
                            <button
                                type="button"
                                onClick={(e) => handleDetach(tag.name, e)}
                                disabled={detachMutation.isPending}
                                className="hover:opacity-75 focus:outline-none p-0.5 ml-0.5 rounded-full"
                                title={`Remove ${tag.name}`}
                            >
                                <X size={10} />
                            </button>
                        )}
                    </Badge>
                );
            })}

            {/* + Add Tag Popover Trigger */}
            {!readOnly && (
                <Popover open={isOpen} onOpenChange={setIsOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`h-6 px-2 text-[11px] rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 hover:text-slate-800 hover:border-slate-400 gap-1 font-medium ${
                                compact ? "h-5 text-[10px] px-1.5" : ""
                            }`}
                        >
                            <Plus size={compact ? 10 : 12} />
                            <span>Tag</span>
                        </Button>
                    </PopoverTrigger>

                    <PopoverContent className="w-56 p-2" align="start">
                        <div className="space-y-2">
                            <div className="relative">
                                <Input
                                    ref={inputRef}
                                    placeholder="Search or create tag..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="h-7 text-xs px-2"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && search.trim()) {
                                            e.preventDefault();
                                            if (isExactMatch) {
                                                handleAttach(search.trim());
                                            } else {
                                                handleCreateAndAttach();
                                            }
                                        }
                                    }}
                                />
                            </div>

                            {/* Tags list */}
                            <div className="max-h-48 overflow-y-auto space-y-1">
                                {availableTags.length === 0 && !search.trim() ? (
                                    <div className="text-[11px] text-muted-foreground p-2 text-center">
                                        No tags yet. Type to create one.
                                    </div>
                                ) : (
                                    availableTags.map((t) => {
                                        const isAttached = activeTagNames.has(t.name.toLowerCase());
                                        const color = t.color || "#0d9488";
                                        return (
                                            <button
                                                key={t.id}
                                                type="button"
                                                onClick={() => {
                                                    if (isAttached) {
                                                        handleDetach(t.name, {} as any);
                                                    } else {
                                                        handleAttach(t.name);
                                                    }
                                                }}
                                                className={`w-full flex items-center justify-between p-1.5 rounded-md text-xs transition-colors text-left ${
                                                    isAttached
                                                        ? "bg-slate-100 dark:bg-slate-800 font-medium"
                                                        : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                                                }`}
                                            >
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <span
                                                        className="w-2.5 h-2.5 rounded-full shrink-0"
                                                        style={{ backgroundColor: color }}
                                                    />
                                                    <span className="truncate">{t.name}</span>
                                                    {t.routing_user && (
                                                        <span
                                                            className="text-[10px] text-muted-foreground flex items-center gap-0.5 ml-1"
                                                            title={`Auto-routes to ${t.routing_user.name}`}
                                                        >
                                                            <User size={10} className="text-emerald-600" />
                                                        </span>
                                                    )}
                                                    {t.routing_team && (
                                                        <span
                                                            className="text-[10px] text-muted-foreground flex items-center gap-0.5 ml-1"
                                                            title={`Auto-routes to Team ${t.routing_team.name}`}
                                                        >
                                                            <Users size={10} className="text-indigo-600" />
                                                        </span>
                                                    )}
                                                </div>
                                                {isAttached && (
                                                    <Check size={12} className="text-emerald-600 shrink-0" />
                                                )}
                                            </button>
                                        );
                                    })
                                )}

                                {/* Create Option */}
                                {search.trim() && !isExactMatch && (
                                    <button
                                        type="button"
                                        onClick={handleCreateAndAttach}
                                        disabled={createTagMutation.isPending}
                                        className="w-full flex items-center gap-1.5 p-1.5 rounded-md text-xs text-[#35877D] hover:bg-[#35877D]/10 font-medium text-left border-t border-slate-100 dark:border-slate-800 mt-1"
                                    >
                                        {createTagMutation.isPending ? (
                                            <Loader2 size={12} className="animate-spin" />
                                        ) : (
                                            <Plus size={12} />
                                        )}
                                        <span className="truncate">Create tag &quot;{search.trim()}&quot;</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            )}
        </div>
    );
}
