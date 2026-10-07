"use client";

import React, { useState } from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    MessageTemplate,
    useDeleteTemplate,
    useDuplicateTemplate,
} from "@/lib/api-client-react";
import { TemplatePreview } from "./template-preview";
import {
    CheckCircle2,
    Clock,
    AlertOctagon,
    PauseCircle,
    HelpCircle,
    FileCode,
    Pencil,
    Copy,
    Trash2,
    RefreshCw,
    ExternalLink,
    AlertTriangle,
    Eye,
    Calendar,
    Globe,
    Layers,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface TemplateDetailDrawerProps {
    template: MessageTemplate | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onEdit: (template: MessageTemplate) => void;
}

const statusBadges: Record<string, { label: string; icon: any; classes: string }> = {
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

export function TemplateDetailDrawer({
    template,
    open,
    onOpenChange,
    onEdit,
}: TemplateDetailDrawerProps) {
    const queryClient = useQueryClient();
    const deleteMutation = useDeleteTemplate();
    const duplicateMutation = useDuplicateTemplate();
    const [viewPayload, setViewPayload] = useState(false);

    if (!template) return null;

    const statusKey = template.status?.toUpperCase() || "DRAFT";
    const status = statusBadges[statusKey] || statusBadges.DRAFT;
    const StatusIcon = status.icon;

    const canEdit = statusKey !== "PENDING";

    async function handleDuplicate() {
        if (!template) return;
        try {
            toast.loading("Duplicating template...", { id: "dup" });
            await duplicateMutation.mutateAsync({ id: template.id });
            toast.success("Template duplicated as draft.", { id: "dup" });
            queryClient.invalidateQueries({ queryKey: ["listTemplates"] });
            onOpenChange(false);
        } catch (err: any) {
            toast.error(err.message || "Failed to duplicate template", { id: "dup" });
        }
    }

    async function handleDelete() {
        if (!template) return;
        if (!confirm(`Are you sure you want to delete template "${template.name}"? This will delete it from Meta and Connectly360.`)) {
            return;
        }

        try {
            toast.loading("Deleting template...", { id: "del" });
            await deleteMutation.mutateAsync({ id: template.id });
            toast.success("Template deleted successfully.", { id: "del" });
            queryClient.invalidateQueries({ queryKey: ["listTemplates"] });
            onOpenChange(false);
        } catch (err: any) {
            toast.error(err.message || "Failed to delete template", { id: "del" });
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-xl w-full p-0 flex flex-col bg-white overflow-hidden">
                <SheetHeader className="px-6 pt-5 pb-4 border-b border-slate-100 shrink-0">
                    <div className="flex items-center justify-between gap-3">
                        <div className="space-y-1">
                            <SheetTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <span className="font-mono text-sm">{template.name}</span>
                            </SheetTitle>
                            <SheetDescription className="text-xs text-slate-500">
                                WhatsApp Template Specification & Meta Sync State
                            </SheetDescription>
                        </div>
                        <Badge className={`text-xs font-semibold border ${status.classes} flex items-center gap-1 px-2.5 py-0.5`}>
                            <StatusIcon size={12} />
                            {status.label}
                        </Badge>
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                    {/* Rejection Notice Banner */}
                    {(template.rejection_reason || template.submission_error) && (
                        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 space-y-1">
                            <div className="flex items-center gap-1.5 font-bold text-xs text-rose-700">
                                <AlertTriangle className="size-4 shrink-0" />
                                <span>Meta Review Feedback / Rejection Reason</span>
                            </div>
                            <p className="text-xs text-rose-600 leading-relaxed font-medium pl-5.5">
                                {template.rejection_reason || template.submission_error}
                            </p>
                        </div>
                    )}

                    {/* Metadata Overview Grid */}
                    <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                        <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Category</span>
                            <p className="font-semibold text-slate-800 mt-0.5">{template.category}</p>
                        </div>
                        <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Language</span>
                            <p className="font-semibold text-slate-800 mt-0.5">{template.language}</p>
                        </div>
                        <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Quality Score</span>
                            <p className="font-semibold text-slate-800 mt-0.5">
                                {template.quality_score ? (
                                    <span className={template.quality_score === "GREEN" ? "text-emerald-600 font-bold" : template.quality_score === "RED" ? "text-rose-600 font-bold" : "text-amber-600 font-bold"}>
                                        {template.quality_score}
                                    </span>
                                ) : (
                                    <span className="text-slate-400 font-normal">Not enough data</span>
                                )}
                            </p>
                        </div>
                        <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Meta Template ID</span>
                            <p className="font-mono text-[11px] text-slate-700 mt-0.5 truncate">
                                {template.meta_template_id || <span className="text-slate-400 italic font-sans">Not submitted</span>}
                            </p>
                        </div>
                        {template.waba_id && (
                            <div className="col-span-2 pt-2 border-t border-slate-200/60">
                                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">WABA ID</span>
                                <p className="font-mono text-[11px] text-slate-700 mt-0.5">{template.waba_id}</p>
                            </div>
                        )}
                    </div>

                    {/* Live WhatsApp Preview */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800">Live Client Preview</span>
                            <button
                                type="button"
                                onClick={() => setViewPayload(!viewPayload)}
                                className="text-[11px] font-semibold text-[#2F8F83] hover:underline flex items-center gap-1 cursor-pointer"
                            >
                                <FileCode className="size-3.5" />
                                <span>{viewPayload ? "Hide Meta Payload" : "View Meta Payload (JSON)"}</span>
                            </button>
                        </div>

                        {viewPayload ? (
                            <div className="p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-2xl overflow-x-auto max-h-[360px] border border-slate-800">
                                <pre>{JSON.stringify(template.meta_payload_json || template.components_json || template, null, 2)}</pre>
                            </div>
                        ) : (
                            <TemplatePreview
                                headerType={(template.header_type as any) || "none"}
                                headerContent={template.header_content || ""}
                                headerMediaUrl={template.header_media_url || ""}
                                headerSample={template.sample_values?.header?.[0] || ""}
                                bodyText={template.body_text}
                                bodySamples={template.sample_values?.body || []}
                                footerText={template.footer_text || ""}
                                buttons={template.buttons || []}
                                category={template.category}
                            />
                        )}
                    </div>

                    {/* Timeline Details */}
                    <div className="space-y-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-slate-400">
                                <Calendar className="size-3.5" /> Created:
                            </span>
                            <span className="font-medium text-slate-700">
                                {template.created_at ? new Date(template.created_at).toLocaleString() : "N/A"}
                            </span>
                        </div>
                        {template.synced_at && (
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5 text-slate-400">
                                    <RefreshCw className="size-3.5" /> Last Synced with Meta:
                                </span>
                                <span className="font-medium text-slate-700">
                                    {new Date(template.synced_at).toLocaleString()}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 shrink-0 flex items-center justify-between gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDelete}
                        className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 text-xs rounded-xl"
                    >
                        <Trash2 className="size-3.5 mr-1.5" />
                        Delete
                    </Button>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDuplicate}
                            className="text-slate-700 border-slate-200 hover:bg-white text-xs rounded-xl"
                        >
                            <Copy className="size-3.5 mr-1.5" />
                            Duplicate
                        </Button>
                        <Button
                            size="sm"
                            disabled={!canEdit}
                            onClick={() => {
                                onEdit(template);
                                onOpenChange(false);
                            }}
                            className="bg-[#2F8F83] hover:bg-[#267A70] text-white text-xs rounded-xl font-medium shadow-2xs"
                        >
                            <Pencil className="size-3.5 mr-1.5" />
                            {canEdit ? "Edit Template" : "Pending Review"}
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
