"use client";

import React, { useState, useMemo } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
    Plus,
    RefreshCw,
    Search,
    FileText,
    CheckCircle2,
    AlertOctagon,
    Clock,
    PauseCircle,
    HelpCircle,
    MoreHorizontal,
    Pencil,
    Copy,
    Trash2,
    Eye,
    Filter,
    X,
    Sparkles,
    Check,
    Layers,
    Globe,
    AlertTriangle,
} from "lucide-react";
import {
    useListTemplates,
    useDeleteTemplate,
    useDuplicateTemplate,
    useSyncTemplates,
    useListTemplateAccounts,
    MessageTemplate,
} from "@/lib/api-client-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { TemplateBuilderModal } from "@/components/templates/template-builder-modal";
import { TemplateDetailDrawer } from "@/components/templates/template-detail-drawer";

const statusConfig: Record<string, { label: string; icon: any; classes: string }> = {
    APPROVED: {
        label: "Approved",
        icon: CheckCircle2,
        classes: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    PENDING: {
        label: "Pending Review",
        icon: Clock,
        classes: "bg-blue-50 text-blue-700 border-blue-200",
    },
    REJECTED: {
        label: "Rejected",
        icon: AlertOctagon,
        classes: "bg-rose-50 text-rose-700 border-rose-200",
    },
    PAUSED: {
        label: "Paused",
        icon: PauseCircle,
        classes: "bg-amber-50 text-amber-700 border-amber-200",
    },
    DISABLED: {
        label: "Disabled",
        icon: PauseCircle,
        classes: "bg-slate-100 text-slate-700 border-slate-200",
    },
    DRAFT: {
        label: "Draft",
        icon: HelpCircle,
        classes: "bg-slate-50 text-slate-600 border-slate-200",
    },
};

const categoryBadgeColors: Record<string, string> = {
    Marketing: "bg-purple-50 text-purple-700 border-purple-200",
    Utility: "bg-sky-50 text-sky-700 border-sky-200",
    Authentication: "bg-amber-50 text-amber-700 border-amber-200",
};

export default function TemplatesPage() {
    const queryClient = useQueryClient();

    // Accounts for WABA selector
    const { data: accounts = [] } = useListTemplateAccounts();

    // Filter states
    const [selectedWaba, setSelectedWaba] = useState<string>("all");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [selectedStatus, setSelectedStatus] = useState<string>("all");
    const [selectedLanguage, setSelectedLanguage] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState<string>("");

    // Queries & mutations
    const filters = useMemo(() => ({
        waba_id: selectedWaba !== "all" ? selectedWaba : undefined,
        category: selectedCategory !== "all" ? selectedCategory : undefined,
        status: selectedStatus !== "all" ? selectedStatus : undefined,
        language: selectedLanguage !== "all" ? selectedLanguage : undefined,
        search: searchQuery.trim() || undefined,
    }), [selectedWaba, selectedCategory, selectedStatus, selectedLanguage, searchQuery]);

    const { data: templates = [], isLoading } = useListTemplates(filters);
    const syncMutation = useSyncTemplates();
    const deleteMutation = useDeleteTemplate();
    const duplicateMutation = useDuplicateTemplate();

    // Modals state
    const [builderOpen, setBuilderOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
    const [detailTemplate, setDetailTemplate] = useState<MessageTemplate | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [deleteModalTemplate, setDeleteModalTemplate] = useState<MessageTemplate | null>(null);

    // Handlers
    function handleOpenCreate() {
        setEditingTemplate(null);
        setBuilderOpen(true);
    }

    function handleOpenEdit(template: MessageTemplate) {
        if (template.status === "PENDING") {
            toast.info("This template is currently pending review by Meta and cannot be modified until reviewed.", {
                description: "You can duplicate it to create a new draft if you need immediate changes.",
            });
            return;
        }
        setEditingTemplate(template);
        setBuilderOpen(true);
    }

    function handleOpenDetail(template: MessageTemplate) {
        setDetailTemplate(template);
        setDetailOpen(true);
    }

    async function handleSyncFromMeta() {
        try {
            toast.loading("Synchronizing templates from Meta Graph API...", { id: "sync-meta" });
            const res = await syncMutation.mutateAsync({
                waba_id: selectedWaba !== "all" ? selectedWaba : undefined,
            });
            toast.success(
                `Sync complete: ${res.total || 0} found (${res.inserted || 0} new, ${res.updated || 0} updated).`,
                { id: "sync-meta" }
            );
            queryClient.invalidateQueries({ queryKey: ["listTemplates"] });
        } catch (err: any) {
            toast.error(err.message || "Failed to sync templates from Meta", { id: "sync-meta" });
        }
    }

    async function handleDuplicate(template: MessageTemplate) {
        try {
            toast.loading("Duplicating template...", { id: "dup-action" });
            await duplicateMutation.mutateAsync({ id: template.id });
            toast.success("Template duplicated as draft.", { id: "dup-action" });
            queryClient.invalidateQueries({ queryKey: ["listTemplates"] });
        } catch (err: any) {
            toast.error(err.message || "Failed to duplicate template", { id: "dup-action" });
        }
    }

    async function handleConfirmDelete() {
        if (!deleteModalTemplate) return;
        try {
            toast.loading("Deleting template from Meta...", { id: "del-action" });
            await deleteMutation.mutateAsync({ id: deleteModalTemplate.id });
            toast.success("Template deleted successfully.", { id: "del-action" });
            setDeleteModalTemplate(null);
            queryClient.invalidateQueries({ queryKey: ["listTemplates"] });
        } catch (err: any) {
            toast.error(err.message || "Failed to delete template", { id: "del-action" });
        }
    }

    const hasActiveFilters = selectedCategory !== "all" || selectedStatus !== "all" || selectedLanguage !== "all" || !!searchQuery.trim();

    function clearFilters() {
        setSelectedCategory("all");
        setSelectedStatus("all");
        setSelectedLanguage("all");
        setSearchQuery("");
    }

    return (
        <div className="flex flex-col gap-6 w-full">
            {/* Page Header */}
            <PageHeader
                icon={FileText}
                title="Message Templates"
                description="Create, manage and sync WhatsApp message templates directly with Meta."
                breadcrumbs={[{ label: "Engagement" }, { label: "Templates" }]}
                actions={
                    <div className="flex items-center gap-2">
                        {/* WABA Selector if workspace has multiple accounts */}
                        {accounts.length > 1 && (
                            <Select value={selectedWaba} onValueChange={setSelectedWaba}>
                                <SelectTrigger className="h-9 text-xs rounded-xl border-slate-200 bg-white min-w-[160px]">
                                    <SelectValue placeholder="All WABA Accounts" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all" className="text-xs">All WhatsApp Accounts</SelectItem>
                                    {accounts.map((acc) => (
                                        <SelectItem key={acc.waba_id} value={acc.waba_id} className="text-xs">
                                            {acc.verified_name || acc.display_phone_number}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        <Button
                            variant="outline"
                            onClick={handleSyncFromMeta}
                            disabled={syncMutation.isPending}
                            className="border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 rounded-xl cursor-pointer text-xs h-9 px-3"
                        >
                            <RefreshCw size={13} className={syncMutation.isPending ? "animate-spin text-[#2F8F83]" : ""} />
                            <span>{syncMutation.isPending ? "Syncing..." : "Sync from Meta"}</span>
                        </Button>

                        <Button
                            onClick={handleOpenCreate}
                            className="bg-[#2F8F83] hover:bg-[#267A70] text-white flex items-center gap-1.5 font-medium shadow-2xs rounded-xl border-0 cursor-pointer h-9 px-4 text-xs"
                        >
                            <Plus size={15} />
                            <span>Create Template</span>
                        </Button>
                    </div>
                }
            />

            {/* Filter and Search Bar */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-[260px] max-w-md">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            type="search"
                            placeholder="Search by name, body text or Meta ID..."
                            className="pl-9 text-xs text-slate-700 h-8.5 rounded-xl bg-slate-50 border-slate-200 focus:bg-white"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {/* Category Filter */}
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="h-8.5 text-xs rounded-xl border-slate-200 bg-slate-50 min-w-[120px]">
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all" className="text-xs">All Categories</SelectItem>
                            <SelectItem value="Marketing" className="text-xs">Marketing</SelectItem>
                            <SelectItem value="Utility" className="text-xs">Utility</SelectItem>
                            <SelectItem value="Authentication" className="text-xs">Authentication</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Status Filter */}
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger className="h-8.5 text-xs rounded-xl border-slate-200 bg-slate-50 min-w-[125px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all" className="text-xs">All Statuses</SelectItem>
                            <SelectItem value="APPROVED" className="text-xs">Approved</SelectItem>
                            <SelectItem value="PENDING" className="text-xs">Pending Review</SelectItem>
                            <SelectItem value="REJECTED" className="text-xs">Rejected</SelectItem>
                            <SelectItem value="PAUSED" className="text-xs">Paused</SelectItem>
                            <SelectItem value="DISABLED" className="text-xs">Disabled</SelectItem>
                            <SelectItem value="DRAFT" className="text-xs">Draft</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Clear Filters */}
                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearFilters}
                            className="h-8.5 text-xs text-slate-500 hover:text-slate-800 rounded-xl px-2.5 flex items-center gap-1"
                        >
                            <X className="size-3" />
                            <span>Reset</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* Template List Table / Cards */}
            {isLoading ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 flex flex-col items-center justify-center gap-3">
                    <RefreshCw className="size-6 text-[#2F8F83] animate-spin" />
                    <p className="text-xs text-slate-500">Loading message templates...</p>
                </div>
            ) : templates.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-10 flex flex-col items-center justify-center gap-3 text-center min-h-[280px]">
                    <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                        <FileText size={24} />
                    </div>
                    <div>
                        <p className="text-slate-800 text-sm font-bold">No templates found</p>
                        <p className="text-slate-500 text-xs mt-1 max-w-sm">
                            {hasActiveFilters
                                ? "No templates match your selected filters. Try resetting the search or category filters."
                                : "Create your first WhatsApp message template or synchronize existing templates from Meta."}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                        {hasActiveFilters ? (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={clearFilters}
                                className="text-xs rounded-xl"
                            >
                                Clear filters
                            </Button>
                        ) : (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleSyncFromMeta}
                                    className="text-xs rounded-xl border-slate-200 text-slate-700"
                                >
                                    <RefreshCw className="size-3.5 mr-1.5" />
                                    Sync from Meta
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleOpenCreate}
                                    className="bg-[#2F8F83] hover:bg-[#267A70] text-white text-xs rounded-xl font-medium"
                                >
                                    <Plus className="size-3.5 mr-1" />
                                    Create Template
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                <tr>
                                    <th className="px-5 py-3.5">Template Name</th>
                                    <th className="px-4 py-3.5">Category</th>
                                    <th className="px-4 py-3.5">Language</th>
                                    <th className="px-4 py-3.5">Status</th>
                                    <th className="px-4 py-3.5">Quality</th>
                                    <th className="px-4 py-3.5">Last Updated</th>
                                    <th className="px-5 py-3.5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {templates.map((tpl) => {
                                    const statusKey = tpl.status?.toUpperCase() || "DRAFT";
                                    const status = statusConfig[statusKey] || statusConfig.DRAFT;
                                    const StatusIcon = status.icon;

                                    return (
                                        <tr
                                            key={tpl.id}
                                            onClick={() => handleOpenDetail(tpl)}
                                            className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                                        >
                                            {/* Name */}
                                            <td className="px-5 py-3.5">
                                                <div className="space-y-0.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono font-bold text-slate-900 group-hover:text-[#2F8F83] transition-colors">
                                                            {tpl.name}
                                                        </span>
                                                        {tpl.header_type && tpl.header_type !== "none" && (
                                                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-sans capitalize">
                                                                {tpl.header_type}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 line-clamp-1 max-w-xs font-normal">
                                                        {tpl.body_text}
                                                    </p>
                                                    {tpl.rejection_reason && (
                                                        <p className="text-[10px] text-rose-600 font-medium flex items-center gap-1 mt-0.5">
                                                            <AlertOctagon className="size-3 shrink-0" />
                                                            <span className="truncate max-w-xs">{tpl.rejection_reason}</span>
                                                        </p>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Category */}
                                            <td className="px-4 py-3.5">
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[10px] font-semibold border ${categoryBadgeColors[tpl.category] || ""}`}
                                                >
                                                    {tpl.category}
                                                </Badge>
                                            </td>

                                            {/* Language */}
                                            <td className="px-4 py-3.5">
                                                <span className="font-mono text-slate-600 uppercase text-[11px] font-medium">
                                                    {tpl.language}
                                                </span>
                                            </td>

                                            {/* Status Badge */}
                                            <td className="px-4 py-3.5">
                                                <Badge className={`text-[10.5px] font-semibold border py-0.5 ${status.classes} flex items-center gap-1 w-fit`}>
                                                    <StatusIcon size={11} />
                                                    <span>{status.label}</span>
                                                </Badge>
                                            </td>

                                            {/* Quality Score */}
                                            <td className="px-4 py-3.5">
                                                {tpl.quality_score ? (
                                                    <span
                                                        className={`text-[10.5px] font-bold uppercase tracking-wider ${
                                                            tpl.quality_score === "GREEN"
                                                                ? "text-emerald-600"
                                                                : tpl.quality_score === "RED"
                                                                ? "text-rose-600"
                                                                : "text-yellow-600"
                                                        }`}
                                                    >
                                                        ● {tpl.quality_score}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 text-[11px]">—</span>
                                                )}
                                            </td>

                                            {/* Updated */}
                                            <td className="px-4 py-3.5 text-slate-500 text-[11px]">
                                                {tpl.updated_at ? new Date(tpl.updated_at).toLocaleDateString() : "Just now"}
                                            </td>

                                            {/* Row Actions */}
                                            <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                                                        >
                                                            <MoreHorizontal className="size-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-44 bg-white text-xs rounded-xl shadow-lg border-slate-200">
                                                        <DropdownMenuItem
                                                            onClick={() => handleOpenDetail(tpl)}
                                                            className="text-xs cursor-pointer"
                                                        >
                                                            <Eye className="size-3.5 mr-2 text-slate-500" />
                                                            View Details
                                                        </DropdownMenuItem>

                                                        {statusKey !== "PENDING" && (
                                                            <DropdownMenuItem
                                                                onClick={() => handleOpenEdit(tpl)}
                                                                className="text-xs cursor-pointer"
                                                            >
                                                                <Pencil className="size-3.5 mr-2 text-slate-500" />
                                                                Edit Template
                                                            </DropdownMenuItem>
                                                        )}

                                                        <DropdownMenuItem
                                                            onClick={() => handleDuplicate(tpl)}
                                                            className="text-xs cursor-pointer"
                                                        >
                                                            <Copy className="size-3.5 mr-2 text-slate-500" />
                                                            Duplicate as Draft
                                                        </DropdownMenuItem>

                                                        <DropdownMenuSeparator />

                                                        <DropdownMenuItem
                                                            onClick={() => setDeleteModalTemplate(tpl)}
                                                            className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                                                        >
                                                            <Trash2 className="size-3.5 mr-2" />
                                                            Delete Template
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Table Footer info */}
                    <div className="px-5 py-3 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Showing {templates.length} templates</span>
                        <span className="font-mono text-slate-400">Multi-WABA Tenant Isolated</span>
                    </div>
                </div>
            )}

            {/* Template Builder Modal */}
            <TemplateBuilderModal
                open={builderOpen}
                onOpenChange={setBuilderOpen}
                editingTemplate={editingTemplate}
            />

            {/* Template Detail Drawer */}
            <TemplateDetailDrawer
                template={detailTemplate}
                open={detailOpen}
                onOpenChange={setDetailOpen}
                onEdit={handleOpenEdit}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteModalTemplate} onOpenChange={(open) => !open && setDeleteModalTemplate(null)}>
                <DialogContent className="max-w-md bg-white rounded-3xl p-6 border-slate-200">
                    <DialogHeader>
                        <div className="flex items-center gap-2 text-rose-600 mb-1">
                            <AlertTriangle className="size-5" />
                            <DialogTitle className="text-sm font-bold text-slate-900">
                                Delete WhatsApp Template
                            </DialogTitle>
                        </div>
                        <DialogDescription className="text-xs text-slate-500 leading-relaxed">
                            Are you sure you want to delete <span className="font-mono font-bold text-slate-800">{deleteModalTemplate?.name}</span>?
                            {deleteModalTemplate?.meta_template_id && (
                                <span className="block mt-1 text-slate-600">
                                    This will call Meta Cloud API to delete it from WhatsApp Business Account <span className="font-mono">{deleteModalTemplate.waba_id}</span> and archive it locally.
                                </span>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="mt-4 gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteModalTemplate(null)}
                            className="text-xs rounded-xl"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            disabled={deleteMutation.isPending}
                            onClick={handleConfirmDelete}
                            className="bg-rose-600 hover:bg-rose-700 text-white text-xs rounded-xl font-medium"
                        >
                            {deleteMutation.isPending ? "Deleting..." : "Delete from Meta & Local"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
