"use client";

import React, { useState, useMemo } from "react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    useListQuickReplies,
    useQuickReplyCategories,
    useCreateQuickReply,
    useUpdateQuickReply,
    useDeleteQuickReply,
    type QuickReplyItem,
} from "@workspace/api-client-react";
import {
    interpolateQuickReply,
    AVAILABLE_QUICK_REPLY_VARIABLES,
    type QuickReplyVariableContext,
} from "@/lib/quick-replies";
import {
    Zap,
    Search,
    Plus,
    Pencil,
    Trash2,
    Loader2,
    Users,
    User,
    Globe,
    Sparkles,
    Check,
    Tag,
} from "lucide-react";
import { toast } from "sonner";

interface QuickReplyPickerProps {
    onSelect: (content: string) => void;
    trigger?: React.ReactNode;
    context?: QuickReplyVariableContext;
}

export function QuickReplyPicker({ onSelect, trigger, context }: QuickReplyPickerProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [scopeTab, setScopeTab] = useState<"all" | "team" | "personal">("all");

    // Dialog state for create/edit
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<QuickReplyItem | null>(null);
    const [formTitle, setFormTitle] = useState("");
    const [formShortcut, setFormShortcut] = useState("");
    const [formContent, setFormContent] = useState("");
    const [formCategory, setFormCategory] = useState("General");
    const [formScope, setFormScope] = useState<"team" | "personal">("team");

    // Dialog state for delete
    const [deletingItem, setDeletingItem] = useState<QuickReplyItem | null>(null);

    // Queries & mutations
    const { data: replies = [], isLoading } = useListQuickReplies({
        search: search.trim() || undefined,
        category: selectedCategory !== "all" ? selectedCategory : undefined,
        scope: scopeTab !== "all" ? scopeTab : undefined,
    });
    const { data: categories = [] } = useQuickReplyCategories();
    const createMutation = useCreateQuickReply();
    const updateMutation = useUpdateQuickReply();
    const deleteMutation = useDeleteQuickReply();

    const openCreateDialog = () => {
        setEditingItem(null);
        setFormTitle("");
        setFormShortcut("");
        setFormContent("");
        setFormCategory("General");
        setFormScope("team");
        setIsFormOpen(true);
    };

    const openEditDialog = (item: QuickReplyItem) => {
        setEditingItem(item);
        setFormTitle(item.title);
        setFormShortcut(item.shortcut);
        setFormContent(item.content);
        setFormCategory(item.category || "General");
        setFormScope(item.scope === "personal" ? "personal" : "team");
        setIsFormOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formTitle.trim() || !formShortcut.trim() || !formContent.trim()) {
            toast.error("Please fill in all required fields.");
            return;
        }

        try {
            if (editingItem) {
                await updateMutation.mutateAsync({
                    id: editingItem.id,
                    title: formTitle.trim(),
                    shortcut: formShortcut.trim(),
                    content: formContent.trim(),
                    category: formCategory.trim() || "General",
                    scope: formScope,
                });
                toast.success("Quick reply updated successfully.");
            } else {
                await createMutation.mutateAsync({
                    title: formTitle.trim(),
                    shortcut: formShortcut.trim(),
                    content: formContent.trim(),
                    category: formCategory.trim() || "General",
                    scope: formScope,
                });
                toast.success("Quick reply created successfully.");
            }
            setIsFormOpen(false);
        } catch (err: any) {
            toast.error(err.message || "Failed to save quick reply.");
        }
    };

    const handleDelete = async () => {
        if (!deletingItem) return;
        try {
            await deleteMutation.mutateAsync(deletingItem.id);
            toast.success("Quick reply deleted.");
            setDeletingItem(null);
        } catch (err: any) {
            toast.error(err.message || "Failed to delete quick reply.");
        }
    };

    const insertVariable = (variableKey: string) => {
        setFormContent((prev) => (prev ? `${prev} ${variableKey}` : variableKey));
    };

    const handleSelectReply = (item: QuickReplyItem) => {
        const resolvedContent = interpolateQuickReply(item.content, context);
        onSelect(resolvedContent);
        setOpen(false);
    };

    return (
        <>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    {trigger || (
                        <button
                            type="button"
                            className="p-1.5 text-slate-400 hover:text-[#378179] rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Quick Replies"
                        >
                            <Zap size={15} />
                        </button>
                    )}
                </PopoverTrigger>
                <PopoverContent
                    className="w-[360px] sm:w-[420px] p-3.5 bg-white rounded-2xl shadow-xl border border-slate-200 space-y-3 z-50"
                    align="start"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-lg bg-teal-50 text-[#2F8F83] flex items-center justify-center">
                                <Zap size={13} />
                            </div>
                            <span className="text-xs font-bold text-slate-800">Quick Replies</span>
                        </div>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={openCreateDialog}
                            className="h-7 px-2.5 text-[11px] font-semibold text-[#2F8F83] border-teal-200 hover:bg-teal-50 rounded-lg gap-1"
                        >
                            <Plus size={12} />
                            New Reply
                        </Button>
                    </div>

                    {/* Scope Tabs */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                        <button
                            type="button"
                            onClick={() => setScopeTab("all")}
                            className={`flex-1 py-1 rounded-lg font-medium transition-colors text-[11px] ${
                                scopeTab === "all"
                                    ? "bg-white text-slate-800 shadow-2xs font-semibold"
                                    : "text-slate-500 hover:text-slate-700"
                            }`}
                        >
                            All Replies
                        </button>
                        <button
                            type="button"
                            onClick={() => setScopeTab("team")}
                            className={`flex-1 py-1 rounded-lg font-medium transition-colors text-[11px] flex items-center justify-center gap-1 ${
                                scopeTab === "team"
                                    ? "bg-white text-[#2F8F83] shadow-2xs font-semibold"
                                    : "text-slate-500 hover:text-slate-700"
                            }`}
                        >
                            <Users size={11} />
                            Team
                        </button>
                        <button
                            type="button"
                            onClick={() => setScopeTab("personal")}
                            className={`flex-1 py-1 rounded-lg font-medium transition-colors text-[11px] flex items-center justify-center gap-1 ${
                                scopeTab === "personal"
                                    ? "bg-white text-[#2F8F83] shadow-2xs font-semibold"
                                    : "text-slate-500 hover:text-slate-700"
                            }`}
                        >
                            <User size={11} />
                            Personal
                        </button>
                    </div>

                    {/* Search & Category Filter */}
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                            <Input
                                type="search"
                                placeholder="Search shortcut, title, content..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-8 h-8 text-xs bg-slate-50 border-slate-200 rounded-lg"
                            />
                        </div>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="h-8 text-[11px] bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2 max-w-[110px] focus:outline-none focus:ring-1 focus:ring-teal-500"
                        >
                            <option value="all">All Cats</option>
                            {categories.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Quick Replies List */}
                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 -mx-1 px-1">
                        {isLoading ? (
                            <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                                <Loader2 size={14} className="animate-spin text-[#2F8F83]" />
                                Loading replies...
                            </div>
                        ) : replies.length === 0 ? (
                            <div className="py-8 text-center space-y-2">
                                <p className="text-xs text-slate-500">No quick replies found.</p>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={openCreateDialog}
                                    className="h-7 text-xs text-[#2F8F83]"
                                >
                                    Create one now
                                </Button>
                            </div>
                        ) : (
                            replies.map((item) => {
                                const isGlobal = !item.tenant_id;
                                const isPersonal = item.scope === "personal";
                                const previewText = interpolateQuickReply(item.content, context);

                                return (
                                    <div
                                        key={item.id}
                                        className="p-2.5 hover:bg-slate-50/80 rounded-xl transition-colors group space-y-1.5 relative border border-transparent hover:border-slate-100"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <div
                                                onClick={() => handleSelectReply(item)}
                                                className="flex items-center gap-1.5 min-w-0 cursor-pointer flex-1"
                                            >
                                                <span className="text-xs font-bold text-slate-800 group-hover:text-[#2F8F83] truncate">
                                                    {item.title}
                                                </span>
                                                <span className="text-[10px] font-mono font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200/60 shrink-0">
                                                    {item.shortcut}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-1 shrink-0">
                                                {/* Scope badge */}
                                                <Badge
                                                    variant="secondary"
                                                    className="text-[9px] px-1.5 py-0 h-4.5 font-normal capitalize bg-slate-100 text-slate-600"
                                                >
                                                    {isGlobal ? (
                                                        <span className="flex items-center gap-1">
                                                            <Globe size={9} /> Default
                                                        </span>
                                                    ) : isPersonal ? (
                                                        <span className="flex items-center gap-1 text-purple-700">
                                                            <User size={9} /> Personal
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1 text-blue-700">
                                                            <Users size={9} /> Team
                                                        </span>
                                                    )}
                                                </Badge>

                                                {/* Actions if not global */}
                                                {!isGlobal && (
                                                    <div className="opacity-0 group-hover:opacity-100 flex items-center transition-opacity ml-1">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openEditDialog(item);
                                                            }}
                                                            className="p-1 hover:text-[#2F8F83] text-slate-400 rounded transition-colors"
                                                            title="Edit reply"
                                                        >
                                                            <Pencil size={12} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setDeletingItem(item);
                                                            }}
                                                            className="p-1 hover:text-red-600 text-slate-400 rounded transition-colors"
                                                            title="Delete reply"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Content snippet */}
                                        <div
                                            onClick={() => handleSelectReply(item)}
                                            className="cursor-pointer"
                                        >
                                            <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed font-normal">
                                                {previewText}
                                            </p>
                                        </div>

                                        {item.category && item.category !== "General" && (
                                            <div className="flex items-center gap-1">
                                                <span className="text-[9px] text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded font-medium">
                                                    #{item.category}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </PopoverContent>
            </Popover>

            {/* CREATE / EDIT QUICK REPLY DIALOG */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="sm:max-w-[480px] bg-white rounded-2xl p-5 border border-slate-200">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <Zap size={16} className="text-[#2F8F83]" />
                            {editingItem ? "Edit Quick Reply" : "Create Quick Reply"}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Configure shortcut and dynamic message variables for fast responses.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSave} className="space-y-4 pt-1">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-700">Title</label>
                                <Input
                                    value={formTitle}
                                    onChange={(e) => setFormTitle(e.target.value)}
                                    placeholder="e.g. Welcome Greeting"
                                    className="h-8 text-xs bg-slate-50 border-slate-200 rounded-lg"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-700">
                                    Shortcut <span className="text-slate-400 font-normal">(/command)</span>
                                </label>
                                <Input
                                    value={formShortcut}
                                    onChange={(e) => setFormShortcut(e.target.value)}
                                    placeholder="e.g. /welcome"
                                    className="h-8 text-xs bg-slate-50 border-slate-200 rounded-lg font-mono"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-700">Category</label>
                                <Input
                                    value={formCategory}
                                    onChange={(e) => setFormCategory(e.target.value)}
                                    placeholder="e.g. Greetings, Support, Sales"
                                    className="h-8 text-xs bg-slate-50 border-slate-200 rounded-lg"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-700">Availability</label>
                                <select
                                    value={formScope}
                                    onChange={(e) => setFormScope(e.target.value as "team" | "personal")}
                                    className="w-full h-8 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                                >
                                    <option value="team">Team (All workspace members)</option>
                                    <option value="personal">Personal (Only for me)</option>
                                </select>
                            </div>
                        </div>

                        {/* Content text */}
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold text-slate-700">
                                    Reply Message
                                </label>
                                <span className="text-[10px] text-slate-400">Click variable to insert:</span>
                            </div>

                            {/* Variable Insertion Pills */}
                            <div className="flex flex-wrap gap-1 pb-1">
                                {AVAILABLE_QUICK_REPLY_VARIABLES.map((v) => (
                                    <button
                                        key={v.key}
                                        type="button"
                                        onClick={() => insertVariable(v.key)}
                                        className="text-[10px] bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 px-1.5 py-0.5 rounded font-mono transition-colors cursor-pointer"
                                        title={`Inserts ${v.sample}`}
                                    >
                                        +{v.key}
                                    </button>
                                ))}
                            </div>

                            <Textarea
                                value={formContent}
                                onChange={(e) => setFormContent(e.target.value)}
                                placeholder="Hi {{first_name}}, thanks for contacting us. How can we help you today?"
                                className="min-h-[85px] text-xs bg-slate-50 border-slate-200 rounded-xl"
                                required
                            />
                        </div>

                        {/* Live preview */}
                        {formContent.includes("{{") && (
                            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                                <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                                    <Sparkles size={11} className="text-[#2F8F83]" />
                                    Resolved Preview (with sample contact):
                                </span>
                                <p className="text-[11px] text-slate-700 italic">
                                    {interpolateQuickReply(formContent, {
                                        contactName: "John Doe",
                                        phone: "+1234567890",
                                        company: "Connectly360",
                                        agentName: "Agent",
                                    })}
                                </p>
                            </div>
                        )}

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setIsFormOpen(false)}
                                className="h-8 text-xs rounded-lg"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={createMutation.isPending || updateMutation.isPending}
                                className="h-8 text-xs bg-[#2F8F83] hover:bg-[#267A70] text-white rounded-lg"
                            >
                                {createMutation.isPending || updateMutation.isPending ? (
                                    <Loader2 size={13} className="animate-spin" />
                                ) : editingItem ? (
                                    "Save Changes"
                                ) : (
                                    "Create Reply"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* DELETE CONFIRMATION DIALOG */}
            <Dialog open={!!deletingItem} onOpenChange={(o) => !o && setDeletingItem(null)}>
                <DialogContent className="sm:max-w-[380px] bg-white rounded-2xl p-5 border border-slate-200">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <Trash2 size={15} className="text-red-500" />
                            Delete Quick Reply
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-600">
                            Are you sure you want to delete{" "}
                            <span className="font-semibold text-slate-800">
                                {deletingItem?.title} ({deletingItem?.shortcut})
                            </span>
                            ? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="pt-3">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setDeletingItem(null)}
                            className="h-8 text-xs rounded-lg"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            disabled={deleteMutation.isPending}
                            onClick={handleDelete}
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
        </>
    );
}
