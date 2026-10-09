"use client";

import React, { useState } from "react";
import {
    useListSavedViews,
    useCreateSavedView,
    useDeleteSavedView,
    useSetDefaultSavedView,
    useUpdateSavedView,
    SavedViewItem,
} from "@/lib/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Bookmark,
    Plus,
    MoreVertical,
    Star,
    Trash2,
    Check,
    Users,
    Inbox,
    Flame,
    Megaphone,
    Sparkles,
    Filter,
    Layers,
    Share2,
    Lock,
    Save,
    RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

interface SavedViewsBarProps {
    entityType: "contacts" | "inbox" | "leads" | "campaigns";
    activeViewId: number | null;
    onSelectView: (view: SavedViewItem | null) => void;
    currentFilters?: Record<string, any>;
    hasActiveFilters?: boolean;
    className?: string;
}

const ENTITY_ICONS: Record<string, any> = {
    contacts: Users,
    inbox: Inbox,
    leads: Flame,
    campaigns: Megaphone,
};

export function SavedViewsBar({
    entityType,
    activeViewId,
    onSelectView,
    currentFilters = {},
    hasActiveFilters = false,
    className = "",
}: SavedViewsBarProps) {
    const { data: views = [], isLoading } = useListSavedViews(entityType);
    const createMutation = useCreateSavedView();
    const updateMutation = useUpdateSavedView();
    const deleteMutation = useDeleteSavedView();
    const setDefaultMutation = useSetDefaultSavedView();

    // Dialog state for creating new saved view
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [viewName, setViewName] = useState("");
    const [viewDescription, setViewDescription] = useState("");
    const [isShared, setIsShared] = useState(false);
    const [isDefault, setIsDefault] = useState(false);
    const [selectedColor, setSelectedColor] = useState("#378179");

    const COLOR_OPTIONS = ["#378179", "#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444", "#64748B"];

    const handleCreateView = async () => {
        if (!viewName.trim()) {
            toast.error("Please enter a name for the view");
            return;
        }

        try {
            const newView = await createMutation.mutateAsync({
                name: viewName.trim(),
                description: viewDescription.trim() || undefined,
                entity_type: entityType,
                filters: currentFilters,
                color: selectedColor,
                is_shared: isShared,
                is_default: isDefault,
            });

            toast.success("Saved view created successfully");
            setIsCreateOpen(false);
            setViewName("");
            setViewDescription("");
            setIsShared(false);
            setIsDefault(false);

            if (newView) {
                onSelectView(newView);
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to create saved view");
        }
    };

    const handleDeleteView = async (view: SavedViewItem) => {
        if (view.is_system) {
            toast.error("System default views cannot be deleted");
            return;
        }

        try {
            await deleteMutation.mutateAsync(view.id);
            toast.success(`"${view.name}" deleted`);
            if (activeViewId === view.id) {
                onSelectView(null);
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to delete saved view");
        }
    };

    const handleSetDefault = async (view: SavedViewItem) => {
        try {
            await setDefaultMutation.mutateAsync(view.id);
            toast.success(`"${view.name}" is now your default view`);
        } catch (err: any) {
            toast.error(err.message || "Failed to set default view");
        }
    };

    const handleUpdateWithCurrentFilters = async (view: SavedViewItem) => {
        try {
            await updateMutation.mutateAsync({
                id: view.id,
                data: { filters: currentFilters },
            });
            toast.success(`Updated "${view.name}" with current filters`);
        } catch (err: any) {
            toast.error(err.message || "Failed to update view");
        }
    };

    const DefaultEntityIcon = ENTITY_ICONS[entityType] || Filter;

    if (isLoading) {
        return (
            <div className={`flex items-center gap-2 overflow-x-auto py-1 scrollbar-none ${className}`}>
                <div className="h-8 w-20 animate-pulse rounded-full bg-slate-200 dark:bg-zinc-800" />
                <div className="h-8 w-28 animate-pulse rounded-full bg-slate-200 dark:bg-zinc-800" />
                <div className="h-8 w-32 animate-pulse rounded-full bg-slate-200 dark:bg-zinc-800" />
            </div>
        );
    }

    return (
        <div className={`flex items-center justify-between gap-2 overflow-x-auto py-1 text-xs scrollbar-none ${className}`}>
            <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                {/* Reset / All Pill */}
                <button
                    type="button"
                    onClick={() => onSelectView(null)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold transition-all cursor-pointer border ${
                        activeViewId === null
                            ? "bg-slate-900 text-white border-slate-900 shadow-xs dark:bg-zinc-100 dark:text-zinc-900"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                    }`}
                >
                    <DefaultEntityIcon size={13} />
                    <span>All</span>
                </button>

                {/* Saved Views Pills */}
                {views.map((view) => {
                    const isActive = activeViewId === view.id;
                    return (
                        <div
                            key={view.id}
                            className={`group inline-flex items-center rounded-full border transition-all ${
                                isActive
                                    ? "bg-[#378179]/10 border-[#378179] text-[#2F6D66] font-bold shadow-2xs dark:bg-[#378179]/20 dark:text-teal-300 dark:border-teal-500"
                                    : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800/80"
                            }`}
                        >
                            <button
                                type="button"
                                onClick={() => onSelectView(view)}
                                className="flex items-center gap-1.5 px-3 py-1.5 cursor-pointer text-left font-medium"
                            >
                                {view.color && (
                                    <span
                                        className="h-2 w-2 rounded-full shrink-0"
                                        style={{ backgroundColor: view.color }}
                                    />
                                )}
                                <span>{view.name}</span>

                                {view.is_default && (
                                    <Star size={11} className="text-amber-500 fill-amber-500 shrink-0" />
                                )}

                                {typeof view.calculated_count === "number" && (
                                    <span
                                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                                            isActive
                                                ? "bg-[#378179] text-white"
                                                : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400"
                                        }`}
                                    >
                                        {view.calculated_count}
                                    </span>
                                )}
                            </button>

                            {/* View Menu */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        className="pr-2 pl-0.5 py-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 cursor-pointer focus:outline-hidden"
                                        title="View options"
                                    >
                                        <MoreVertical size={12} />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 text-xs bg-white dark:bg-zinc-900">
                                    <DropdownMenuItem
                                        onClick={() => handleSetDefault(view)}
                                        className="gap-2 cursor-pointer"
                                    >
                                        <Star size={13} className="text-amber-500" />
                                        <span>Set as default</span>
                                    </DropdownMenuItem>

                                    {hasActiveFilters && !view.is_system && (
                                        <DropdownMenuItem
                                            onClick={() => handleUpdateWithCurrentFilters(view)}
                                            className="gap-2 cursor-pointer"
                                        >
                                            <Save size={13} className="text-teal-600" />
                                            <span>Update with current filters</span>
                                        </DropdownMenuItem>
                                    )}

                                    <DropdownMenuSeparator />

                                    <div className="px-2 py-1 text-[10px] text-slate-400 flex items-center gap-1">
                                        {view.is_shared ? (
                                            <>
                                                <Share2 size={10} />
                                                <span>Shared with workspace</span>
                                            </>
                                        ) : (
                                            <>
                                                <Lock size={10} />
                                                <span>Private to you</span>
                                            </>
                                        )}
                                    </div>

                                    {!view.is_system && (
                                        <>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={() => handleDeleteView(view)}
                                                className="gap-2 text-rose-600 focus:text-rose-600 cursor-pointer"
                                            >
                                                <Trash2 size={13} />
                                                <span>Delete view</span>
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    );
                })}
            </div>

            {/* Save Current Filters as View Button */}
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateOpen(true)}
                className="h-8 px-2.5 rounded-full text-xs font-semibold gap-1.5 shrink-0 border-dashed border-[#378179]/50 text-[#378179] hover:bg-[#378179]/10 cursor-pointer dark:border-teal-500/50 dark:text-teal-300"
            >
                <Plus size={13} />
                <span>Save View</span>
            </Button>

            {/* Create Saved View Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="max-w-md bg-white dark:bg-zinc-900 rounded-2xl p-6">
                    <DialogHeader>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="p-2 rounded-xl bg-[#378179]/10 text-[#378179] dark:bg-teal-500/20 dark:text-teal-300">
                                <Bookmark size={18} />
                            </div>
                            <DialogTitle className="text-base font-bold text-slate-900 dark:text-zinc-100">
                                Save Current Filter View
                            </DialogTitle>
                        </div>
                        <DialogDescription className="text-xs text-slate-500 dark:text-zinc-400">
                            Save your active filter criteria as a reusable view tab across Connectly360.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                                View Name *
                            </Label>
                            <Input
                                value={viewName}
                                onChange={(e) => setViewName(e.target.value)}
                                placeholder="e.g. High Value Active Customers"
                                className="h-9 text-xs"
                                autoFocus
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                                Description (Optional)
                            </Label>
                            <Input
                                value={viewDescription}
                                onChange={(e) => setViewDescription(e.target.value)}
                                placeholder="What does this view represent?"
                                className="h-9 text-xs"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                                Badge Color
                            </Label>
                            <div className="flex items-center gap-2 pt-1">
                                {COLOR_OPTIONS.map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setSelectedColor(c)}
                                        className={`h-6 w-6 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                                            selectedColor === c ? "ring-2 ring-offset-2 ring-slate-800 scale-110" : ""
                                        }`}
                                        style={{ backgroundColor: c }}
                                    >
                                        {selectedColor === c && <Check size={12} className="text-white" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <div className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                                        Share with Workspace
                                    </div>
                                    <div className="text-[11px] text-slate-500">
                                        Make this view visible to all team members
                                    </div>
                                </div>
                                <Switch checked={isShared} onCheckedChange={setIsShared} />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <div className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                                        Set as Default
                                    </div>
                                    <div className="text-[11px] text-slate-500">
                                        Open this view automatically when opening {entityType}
                                    </div>
                                </div>
                                <Switch checked={isDefault} onCheckedChange={setIsDefault} />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsCreateOpen(false)}
                            className="text-xs h-9"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleCreateView}
                            disabled={createMutation.isPending}
                            className="bg-[#378179] hover:bg-[#2F6D66] text-white text-xs h-9 px-4 font-semibold"
                        >
                            {createMutation.isPending ? "Saving..." : "Create View"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
