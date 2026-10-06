"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
    Plus,
    Trash2,
    Loader2,
    RefreshCw,
    AlertCircle,
    X,
    Pencil,
    RotateCcw,
    Search,
    FileText,
    CheckCircle2,
    AlertOctagon,
    Clock,
    PauseCircle,
    HelpCircle,
    Megaphone,
    Bell,
    Key,
    MessageSquare,
    Phone,
    Link2,
    Copy,
    Play,
    Image as ImageIcon,
    FileCode,
    ChevronRight,
    ChevronLeft,
    Sparkles,
    Info,
} from "lucide-react";
import {
    useListTemplates,
    useCreateTemplate,
    useUpdateTemplate,
    useDeleteTemplate,
    useSyncTemplates,
    MessageTemplate,
    TemplateButton,
    TemplateSampleValues,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// -------------------------------------------------------------
// Validation Utilities (Client-side validation matching Meta Rules)
// -------------------------------------------------------------
const TEMPLATE_LIMITS = {
    bodyMaxLength: 1024,
    footerMaxLength: 60,
    headerTextMaxLength: 60,
    buttonTextMaxLength: 25,
    maxButtonsTotal: 10,
    maxUrlButtons: 2,
    maxPhoneButtons: 1,
    maxCopyCodeButtons: 1,
    nameRegex: /^[a-z0-9_]{1,512}$/,
} as const;

function extractVariableIndices(text: string): number[] {
    const matches = text.matchAll(/\{\{(\d+)\}\}/g);
    const set = new Set<number>();
    for (const m of matches) {
        const n = Number(m[1]);
        if (Number.isFinite(n) && n >= 1) set.add(n);
    }
    return [...set].sort((a, b) => a - b);
}

function validateTemplatePayload(
    name: string,
    category: string,
    language: string,
    headerFormat: string,
    headerContent: string,
    headerMediaUrl: string,
    bodyText: string,
    footerText: string,
    buttons: TemplateButton[],
    bodySamples: string[],
    headerSample: string
) {
    if (!name) throw new Error("Template name is required.");
    if (!TEMPLATE_LIMITS.nameRegex.test(name)) {
        throw new Error(
            "Template name must use only lowercase letters, digits, and underscores (1-512 chars)."
        );
    }
    if (!language?.trim()) {
        throw new Error("Language is required.");
    }
    if (!bodyText.trim()) {
        throw new Error("Body text is required.");
    }
    if (bodyText.length > TEMPLATE_LIMITS.bodyMaxLength) {
        throw new Error(`Body text exceeds ${TEMPLATE_LIMITS.bodyMaxLength} chars.`);
    }

    const bodyVars = extractVariableIndices(bodyText);
    for (let i = 0; i < bodyVars.length; i++) {
        if (bodyVars[i] !== i + 1) {
            throw new Error(`Body variables must be contiguous starting at {{1}}.`);
        }
    }

    if (footerText && footerText.length > TEMPLATE_LIMITS.footerMaxLength) {
        throw new Error(`Footer text exceeds ${TEMPLATE_LIMITS.footerMaxLength} chars.`);
    }
    if (footerText && extractVariableIndices(footerText).length > 0) {
        throw new Error("Footer text cannot contain variables.");
    }

    let headerVarCount = 0;
    if (headerFormat === "text") {
        if (!headerContent.trim()) {
            throw new Error("Text header requires header text content.");
        }
        if (headerContent.length > TEMPLATE_LIMITS.headerTextMaxLength) {
            throw new Error(`Header text exceeds ${TEMPLATE_LIMITS.headerTextMaxLength} chars.`);
        }
        const hVars = extractVariableIndices(headerContent);
        if (hVars.length > 1) {
            throw new Error("Text header supports at most one variable.");
        }
        if (hVars.length === 1 && hVars[0] !== 1) {
            throw new Error("Text header variable must be {{1}}.");
        }
        headerVarCount = hVars.length;
    } else if (headerFormat !== "none") {
        if (!headerMediaUrl?.trim()) {
            throw new Error(`Please provide a public HTTPS media URL for the ${headerFormat} header.`);
        }
        try {
            new URL(headerMediaUrl);
        } catch {
            throw new Error("Header media URL must be a valid URL.");
        }
    }

    // Button counts
    let qrCount = 0;
    let urlCount = 0;
    let phoneCount = 0;
    let copyCount = 0;
    let sawNonQR = false;

    for (let i = 0; i < buttons.length; i++) {
        const b = buttons[i];
        if (!b.text?.trim()) {
            throw new Error(`Button #${i + 1} is missing a text label.`);
        }
        if (b.text.length > TEMPLATE_LIMITS.buttonTextMaxLength) {
            throw new Error(`Button #${i + 1} text exceeds ${TEMPLATE_LIMITS.buttonTextMaxLength} chars.`);
        }

        if (b.type === "QUICK_REPLY") {
            qrCount++;
            if (sawNonQR) {
                throw new Error("Quick Reply buttons must be grouped at the start before Call-To-Action buttons.");
            }
        } else {
            sawNonQR = true;
            if (b.type === "URL") {
                urlCount++;
                if (!b.url?.trim()) {
                    throw new Error(`URL button #${i + 1} is missing its destination URL.`);
                }
                try {
                    new URL(b.url);
                } catch {
                    throw new Error(`URL button #${i + 1} has an invalid URL format.`);
                }
                const urlVars = extractVariableIndices(b.url);
                if (urlVars.length > 1) {
                    throw new Error(`URL button #${i + 1} can have at most one variable.`);
                }
                if (urlVars.length === 1) {
                    if (urlVars[0] !== 1) {
                        throw new Error(`URL button #${i + 1} variable must be {{1}}.`);
                    }
                    if (!b.example?.trim()) {
                        throw new Error(`URL button #${i + 1} uses a variable, so it requires an example value.`);
                    }
                }
            } else if (b.type === "PHONE_NUMBER") {
                phoneCount++;
                if (!b.phone_number?.trim()) {
                    throw new Error(`Phone button #${i + 1} is missing its phone number.`);
                }
            } else if (b.type === "COPY_CODE") {
                copyCount++;
                if (!b.example?.trim()) {
                    throw new Error(`Copy Code button #${i + 1} is missing a sample coupon code.`);
                }
            }
        }
    }

    if (buttons.length > TEMPLATE_LIMITS.maxButtonsTotal) {
        throw new Error(`Templates support up to ${TEMPLATE_LIMITS.maxButtonsTotal} buttons.`);
    }
    if (urlCount > TEMPLATE_LIMITS.maxUrlButtons) {
        throw new Error(`Maximum ${TEMPLATE_LIMITS.maxUrlButtons} URL buttons allowed.`);
    }
    if (phoneCount > TEMPLATE_LIMITS.maxPhoneButtons) {
        throw new Error(`Maximum ${TEMPLATE_LIMITS.maxPhoneButtons} Phone Number button allowed.`);
    }
    if (copyCount > TEMPLATE_LIMITS.maxCopyCodeButtons) {
        throw new Error(`Maximum ${TEMPLATE_LIMITS.maxCopyCodeButtons} Copy Code button allowed.`);
    }

    // Sample values check
    if (bodySamples.length !== bodyVars.length) {
        throw new Error(`Please provide sample values for all ${bodyVars.length} body variables.`);
    }
    for (let i = 0; i < bodySamples.length; i++) {
        if (!bodySamples[i]?.trim()) {
            throw new Error(`Sample value for body variable {{${i + 1}}} is empty.`);
        }
    }

    if (headerVarCount === 1 && !headerSample?.trim()) {
        throw new Error("Sample value for header variable {{1}} is empty.");
    }
}

function getReplacedBody(bodyText: string, bodySamples: string[]): string {
    if (!bodyText) return "";
    let text = bodyText;
    const bodyVars = extractVariableIndices(bodyText);
    bodyVars.forEach((v, index) => {
        const sample = bodySamples[index]?.trim() || `{{${v}}}`;
        text = text.replaceAll(`{{${v}}}`, sample);
    });
    return text;
}

function getReplacedHeader(headerContent: string, headerSample: string): string {
    if (!headerContent) return "";
    return headerContent.replaceAll("{{1}}", headerSample || "{{1}}");
}

// -------------------------------------------------------------
// Configurations
// -------------------------------------------------------------
const CATEGORIES = ["Marketing", "Utility", "Authentication"] as const;
type HeaderFormat = "none" | "text" | "image" | "video" | "document";
const HEADER_FORMATS: HeaderFormat[] = ["none", "text", "image", "video", "document"];

const categoryColors: Record<string, string> = {
    Marketing: "bg-purple-50 text-purple-700 border-purple-200",
    Utility: "bg-sky-50 text-sky-700 border-sky-200",
    Authentication: "bg-amber-50 text-amber-700 border-amber-200",
};

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

interface TemplateFormData {
    name: string;
    category: MessageTemplate["category"];
    type: string;
    language: string;
    header_format: HeaderFormat;
    header_content: string;
    header_media_url: string;
    header_sample: string;
    body_text: string;
    body_samples: string[];
    footer_text: string;
    buttons: TemplateButton[];
}

const emptyForm: TemplateFormData = {
    name: "",
    category: "Marketing",
    type: "default",
    language: "en_US",
    header_format: "none",
    header_content: "",
    header_media_url: "",
    header_sample: "",
    body_text: "",
    body_samples: [],
    footer_text: "",
    buttons: [],
};

const COMMON_LANGUAGE_CODES = [
    "en_US",
    "en_GB",
    "es_ES",
    "es_MX",
    "fr_FR",
    "de_DE",
    "it_IT",
    "pt_BR",
    "pt_PT",
    "hi_IN",
];

function emptyButton(type: TemplateButton["type"]): TemplateButton {
    switch (type) {
        case "QUICK_REPLY":
            return { type: "QUICK_REPLY", text: "" };
        case "URL":
            return { type: "URL", text: "", url: "" };
        case "PHONE_NUMBER":
            return { type: "PHONE_NUMBER", text: "", phone_number: "" };
        case "COPY_CODE":
            return { type: "COPY_CODE", text: "", example: "" };
    }
}

export default function TemplatesPage() {
    const queryClient = useQueryClient();

    // Queries & Mutations
    const { data: templates, isLoading } = useListTemplates();
    const createMutation = useCreateTemplate();
    const updateMutation = useUpdateTemplate();
    const deleteMutation = useDeleteTemplate();
    const syncMutation = useSyncTemplates();

    // Component States
    const [searchTerm, setSearchTerm] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [step, setStep] = useState(1);
    const [form, setForm] = useState<TemplateFormData>(emptyForm);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [templateToDelete, setTemplateToDelete] = useState<MessageTemplate | null>(null);

    // Variable extractors for dynamic input binding
    const bodyVarCount = useMemo(() => extractVariableIndices(form.body_text).length, [form.body_text]);
    const headerVarCount = useMemo(
        () => (form.header_format === "text" ? extractVariableIndices(form.header_content).length : 0),
        [form.header_format, form.header_content]
    );

    // Synchronize variable input rows count with variables found in body text
    useEffect(() => {
        if (form.body_samples.length !== bodyVarCount) {
            setForm((prev) => {
                const next = prev.body_samples.slice(0, bodyVarCount);
                while (next.length < bodyVarCount) next.push("");
                return { ...prev, body_samples: next };
            });
        }
    }, [bodyVarCount]);

    // Actions
    function openCreate() {
        setEditingId(null);
        setForm(emptyForm);
        setStep(1);
        setDialogOpen(true);
    }

    function openEdit(template: MessageTemplate) {
        setEditingId(template.id);
        setForm({
            name: template.name,
            category: template.category,
            type: template.category === "Authentication" ? "otp" : "default",
            language: template.language || "en_US",
            header_format: (template.header_type ?? "none") as HeaderFormat,
            header_content: template.header_content ?? "",
            header_media_url: template.header_media_url ?? "",
            header_sample: template.sample_values?.header?.[0] ?? "",
            body_text: template.body_text,
            body_samples: template.sample_values?.body ?? [],
            footer_text: template.footer_text ?? "",
            buttons: template.buttons ?? [],
        });
        setStep(1);
        setDialogOpen(true);
    }

    async function handleSyncFromMeta() {
        try {
            toast.loading("Syncing templates from Meta...", { id: "sync" });
            const res = await syncMutation.mutateAsync();
            toast.success(
                `Synced templates successfully: ${res.inserted || 0} created, ${res.updated || 0} updated.`,
                { id: "sync" }
            );
            queryClient.invalidateQueries({ queryKey: ["listTemplates"] });
        } catch (err: any) {
            toast.error(err.message || "Failed to sync templates", { id: "sync" });
        }
    }

    async function handleDelete() {
        if (!templateToDelete) return;
        try {
            toast.loading("Deleting template...", { id: "delete" });
            await deleteMutation.mutateAsync({ id: templateToDelete.id });
            toast.success("Template deleted successfully.", { id: "delete" });
            setTemplateToDelete(null);
            queryClient.invalidateQueries({ queryKey: ["listTemplates"] });
        } catch (err: any) {
            toast.error(err.message || "Failed to delete template", { id: "delete" });
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            // 1. Client-side Validation checks
            validateTemplatePayload(
                form.name,
                form.category,
                form.language,
                form.header_format,
                form.header_content,
                form.header_media_url,
                form.body_text,
                form.footer_text,
                form.buttons,
                form.body_samples,
                form.header_sample
            );

            // 2. Prepare payload
            const sample_values: TemplateSampleValues = {};
            if (form.body_samples.some((v) => v.trim())) {
                sample_values.body = form.body_samples.map((v) => v.trim());
            }
            if (form.header_format === "text" && form.header_sample.trim()) {
                sample_values.header = [form.header_sample.trim()];
            }

            const payload = {
                name: form.name.trim(),
                category: form.category,
                language: form.language.trim() || "en_US",
                header_type: form.header_format === "none" ? undefined : form.header_format,
                header_content: form.header_format === "text" ? form.header_content.trim() : undefined,
                header_media_url:
                    form.header_format !== "none" && form.header_format !== "text"
                        ? form.header_media_url.trim() || undefined
                        : undefined,
                body_text: form.body_text.trim(),
                footer_text: form.footer_text.trim() || undefined,
                buttons: form.buttons.length > 0 ? form.buttons : undefined,
                sample_values: Object.keys(sample_values).length > 0 ? sample_values : undefined,
            };

            const isEdit = editingId !== null;
            toast.loading(isEdit ? "Saving template..." : "Submitting template to Meta...", { id: "submit" });

            if (isEdit) {
                await updateMutation.mutateAsync({ id: editingId, data: payload });
                toast.success("Template updated. Meta typically reviews updates within 24 hours.", { id: "submit" });
            } else {
                await createMutation.mutateAsync({ data: payload });
                toast.success("Template submitted for approval. Meta review takes up to 24 hours.", { id: "submit" });
            }

            setDialogOpen(false);
            queryClient.invalidateQueries({ queryKey: ["listTemplates"] });
        } catch (err: any) {
            toast.error(err.message || "Failed to process template", { id: "submit" });
        }
    }

    // Button mutations helper
    function updateButton(index: number, patch: Partial<TemplateButton>) {
        setForm((prev) => {
            const current = prev.buttons[index];
            if (!current) return prev;
            const next = [...prev.buttons];
            // Keep type discrimination invariants clean
            next[index] = { ...current, ...patch } as TemplateButton;
            return { ...prev, buttons: next };
        });
    }

    function changeButtonType(index: number, type: TemplateButton["type"]) {
        setForm((prev) => {
            const next = [...prev.buttons];
            next[index] = emptyButton(type);
            return { ...prev, buttons: next };
        });
    }

    function removeButton(index: number) {
        setForm((prev) => ({
            ...prev,
            buttons: prev.buttons.filter((_, i) => i !== index),
        }));
    }

    function addButton() {
        if (form.buttons.length >= TEMPLATE_LIMITS.maxButtonsTotal) return;
        setForm((prev) => ({
            ...prev,
            buttons: [...prev.buttons, emptyButton("QUICK_REPLY")],
        }));
    }

    // Filter templates list based on search term
    const filteredTemplates = useMemo(() => {
        if (!templates) return [];
        return templates.filter(
            (t) =>
                t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.body_text.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [templates, searchTerm]);

    return (
        <div className="flex flex-col gap-6">
            {/* Page Header */}
            <PageHeader
                icon={FileText}
                title="Message Templates"
                description="Create, customize and sync WhatsApp message templates with Meta."
                breadcrumbs={[{ label: "Engagement" }, { label: "Templates" }]}
                actions={
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={handleSyncFromMeta}
                            disabled={syncMutation.isPending}
                            className="border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 rounded-xl cursor-pointer"
                        >
                            <RefreshCw size={14} className={syncMutation.isPending ? "animate-spin" : ""} />
                            {syncMutation.isPending ? "Syncing..." : "Sync from Meta"}
                        </Button>
                        <Button
                            onClick={openCreate}
                            className="bg-[#35877D] hover:bg-[#2c7169] text-white flex items-center gap-1.5 font-medium shadow-xs rounded-xl border-0 cursor-pointer"
                        >
                            <Plus size={16} />
                            Create Template
                        </Button>
                    </div>
                }
            />

            {/* Search and Filters */}
            <div className="flex items-center gap-2 max-w-md">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                        type="search"
                        placeholder="Search templates by name or content..."
                        className="pl-9 text-sm text-slate-700 h-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Main Content Area */}
            {isLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                        <Card key={i} className="border border-slate-100 bg-white/50 p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="h-6 w-32 bg-slate-100 rounded animate-pulse" />
                                <div className="h-6 w-16 bg-slate-100 rounded animate-pulse" />
                            </div>
                            <div className="h-16 w-full bg-slate-50 rounded animate-pulse" />
                            <div className="h-6 w-24 bg-slate-100 rounded animate-pulse" />
                        </Card>
                    ))}
                </div>
            ) : filteredTemplates.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-16 flex flex-col items-center justify-center gap-3 text-center min-h-[350px]">
                    <FileText size={44} className="text-slate-300" />
                    <p className="text-slate-700 text-base font-semibold">No templates found</p>
                    <p className="text-slate-400 text-sm max-w-sm">
                        {searchTerm
                            ? "We couldn't find any templates matching your search criteria. Try a different query."
                            : "Create reusable message templates for WhatsApp notifications, promotions, and transactional messages."}
                    </p>
                    {!searchTerm && (
                        <Button
                            onClick={openCreate}
                            className="bg-[#35877D] hover:bg-[#2c7169] text-white font-medium mt-2"
                        >
                            Create first template
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                    {filteredTemplates.map((template) => {
                        const statusKey = template.status || "DRAFT";
                        const status = statusConfig[statusKey] || statusConfig.DRAFT;
                        const StatusIcon = status.icon;

                        return (
                            <Card
                                key={template.id}
                                className="border border-slate-200 hover:border-slate-300 bg-white shadow-sm flex flex-col justify-between overflow-hidden transition-all duration-200"
                            >
                                <CardContent className="p-5 space-y-4 flex-1">
                                    {/* Card Header Info */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="space-y-1">
                                            <h3 className="font-bold text-slate-800 tracking-tight text-sm line-clamp-1">
                                                {template.name}
                                            </h3>
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                                    {template.language}
                                                </span>
                                                {template.quality_score && (
                                                    <span
                                                        className={`text-[10px] font-bold uppercase tracking-wider ${template.quality_score === "GREEN"
                                                            ? "text-emerald-500"
                                                            : template.quality_score === "YELLOW"
                                                                ? "text-yellow-500"
                                                                : "text-rose-500"
                                                            }`}
                                                    >
                                                        • Quality: {template.quality_score}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <Badge className={`text-[10px] font-semibold border ${categoryColors[template.category] || ""}`}>
                                            {template.category}
                                        </Badge>
                                    </div>

                                    {/* Body Text Preview */}
                                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                                        {template.header_type && template.header_type !== "none" && (
                                            <div className="text-[10px] font-bold text-[#35877D] uppercase mb-1.5 flex items-center gap-1">
                                                <span className="h-1.5 w-1.5 rounded-full bg-[#35877D]" />
                                                Header: {template.header_type}
                                            </div>
                                        )}
                                        <p className="text-xs text-slate-700 leading-relaxed font-medium line-clamp-4 whitespace-pre-wrap">
                                            {template.body_text}
                                        </p>
                                        {template.footer_text && (
                                            <p className="text-[10px] text-slate-400 mt-2 italic border-t border-slate-200/60 pt-1">
                                                {template.footer_text}
                                            </p>
                                        )}
                                    </div>

                                    {/* Buttons count/tags */}
                                    {template.buttons && template.buttons.length > 0 && (
                                        <div className="flex items-center gap-1 flex-wrap pt-1">
                                            {template.buttons.map((btn, idx) => (
                                                <Badge
                                                    key={idx}
                                                    variant="secondary"
                                                    className="bg-slate-100 hover:bg-slate-100 text-slate-600 font-medium text-[10px] px-2 py-0.5 rounded-md"
                                                >
                                                    {btn.type === "URL" ? "🔗 " : btn.type === "PHONE_NUMBER" ? "📞 " : btn.type === "COPY_CODE" ? "📋 " : "💬 "}
                                                    {btn.text}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}

                                    {/* Errors / Warnings */}
                                    {(template.rejection_reason || template.submission_error) && (
                                        <div className="flex items-start gap-1.5 text-[11px] text-rose-600 bg-rose-50 border border-rose-100 rounded-lg p-2.5">
                                            <AlertCircle className="size-3.5 mt-0.5 shrink-0 text-rose-500" />
                                            <span className="line-clamp-2 leading-normal font-medium">
                                                {template.rejection_reason || template.submission_error}
                                            </span>
                                        </div>
                                    )}
                                </CardContent>

                                {/* Card Footer Actions */}
                                <div className="bg-slate-50 border-t border-slate-100 px-5 py-3 flex items-center justify-between gap-2 shrink-0">
                                    <Badge className={`text-[10px] font-semibold border py-0.5 ${status.classes} flex items-center gap-1`}>
                                        <StatusIcon size={10} />
                                        {status.label}
                                    </Badge>

                                    <div className="flex items-center gap-1">
                                        {/* Edit Option */}
                                        {statusKey === "APPROVED" && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => openEdit(template)}
                                                className="text-slate-600 hover:text-[#35877D] hover:bg-[#35877D]/10 h-7 text-xs px-2"
                                            >
                                                <Pencil className="size-3 mr-1" />
                                                Edit
                                            </Button>
                                        )}
                                        {/* Resubmit Option */}
                                        {(statusKey === "REJECTED" || statusKey === "PAUSED") && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => openEdit(template)}
                                                className="text-slate-600 hover:text-[#35877D] hover:bg-[#35877D]/10 h-7 text-xs px-2"
                                            >
                                                <RotateCcw className="size-3 mr-1" />
                                                Resubmit
                                            </Button>
                                        )}

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setTemplateToDelete(template)}
                                            className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 h-7 w-7 rounded-md"
                                        >
                                            <Trash2 className="size-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* CREATE & EDIT DIALOG MODAL */}
            <Dialog
                open={dialogOpen}
                onOpenChange={(open) => {
                    setDialogOpen(open);
                    if (!open) {
                        setEditingId(null);
                        setForm(emptyForm);
                    }
                }}
            >
                <DialogContent className="max-w-6xl max-h-[95vh] h-[850px] overflow-hidden flex flex-col p-0 bg-white">
                    <DialogHeader className="px-6 pt-5 pb-3 border-b border-slate-100 shrink-0">
                        <DialogTitle className="text-slate-900 font-bold text-lg flex items-center justify-between">
                            <span>{editingId ? "Edit Message Template" : "Create WhatsApp Template"}</span>
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 text-xs mt-0.5 leading-normal">
                            Configure category, headers, body, footer and buttons for review by Meta.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Step indicators */}
                    <div className="flex items-center gap-6 px-6 py-3 border-b border-slate-100 bg-slate-50/50 shrink-0 select-none">
                        <div className="flex items-center gap-2">
                            <div className={`size-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step >= 1 ? "bg-[#35877D] text-white" : "bg-slate-200 text-slate-500"}`}>
                                {step > 1 ? "✓" : "1"}
                            </div>
                            <span className={`text-xs font-semibold ${step >= 1 ? "text-slate-900" : "text-slate-400"}`}>Set up template</span>
                        </div>
                        <div className="h-px bg-slate-200 flex-1" />
                        <div className="flex items-center gap-2">
                            <div className={`size-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step >= 2 ? "bg-[#35877D] text-white" : "bg-slate-200 text-slate-500"}`}>
                                {step > 2 ? "✓" : "2"}
                            </div>
                            <span className={`text-xs font-semibold ${step >= 2 ? "text-slate-900" : "text-slate-400"}`}>Edit template</span>
                        </div>
                        <div className="h-px bg-slate-200 flex-1" />
                        <div className="flex items-center gap-2">
                            <div className={`size-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 3 ? "bg-[#35877D] text-white" : "bg-slate-200 text-slate-500"}`}>
                                3
                            </div>
                            <span className={`text-xs font-semibold ${step === 3 ? "text-slate-900" : "text-slate-400"}`}>Submit for review</span>
                        </div>
                    </div>

                    {form.category === "Authentication" && step === 1 && (
                        <div className="mx-6 mt-3 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/50 p-2.5 text-xs text-amber-800 shrink-0">
                            <AlertCircle className="size-4 mt-0.5 shrink-0 text-amber-600" />
                            <p className="leading-relaxed">
                                <strong>Important:</strong> Authentication templates require a precise OTP configuration block.
                                Currently, it is recommended to create them in Meta's Business Suite manager directly and use
                                <strong> Sync from Meta</strong> to pull them in.
                            </p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 flex-1 overflow-hidden">
                            {/* LEFT COLUMN: Wizard Step Form */}
                            <div className="lg:col-span-7 p-6 overflow-y-auto border-r border-slate-100 flex flex-col gap-5 bg-white">
                                {step === 1 && (
                                    <div className="space-y-5">
                                        {/* Category tab cards layout matching the reference image */}
                                        <div className="space-y-2">
                                            <Label className="text-slate-800 font-semibold text-xs">Category</Label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {[
                                                    { id: "Marketing", label: "Marketing", icon: Megaphone },
                                                    { id: "Utility", label: "Utility", icon: Bell },
                                                    { id: "Authentication", label: "Authentication", icon: Key },
                                                ].map((cat) => {
                                                    const Icon = cat.icon;
                                                    const selected = form.category === cat.id;
                                                    return (
                                                        <button
                                                            key={cat.id}
                                                            type="button"
                                                            onClick={() => {
                                                                const defaultType = cat.id === "Authentication" ? "otp" : "default";
                                                                setForm({ ...form, category: cat.id as any, type: defaultType });
                                                            }}
                                                            className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border text-center transition-all ${selected
                                                                    ? "border-[#35877D] bg-[#35877D]/5 text-[#35877D] shadow-sm font-bold"
                                                                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-medium"
                                                                }`}
                                                        >
                                                            <Icon className="size-4" />
                                                            <span className="text-xs">{cat.label}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Type selection matching the reference image */}
                                        <div className="space-y-2">
                                            <Label className="text-slate-800 font-semibold text-xs">Choose message type</Label>
                                            <div className="space-y-2.5">
                                                {form.category === "Marketing" && (
                                                    <>
                                                        {[
                                                            { id: "default", label: "Default", desc: "Send messages with media and customized buttons to engage your customers." },
                                                            { id: "catalog", label: "Catalog", desc: "Send messages that drive sales by connecting your product catalog." },
                                                            { id: "calling_permissions", label: "Calling permissions request", desc: "Ask customers if you can call them on WhatsApp." }
                                                        ].map((t) => (
                                                            <label
                                                                key={t.id}
                                                                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${form.type === t.id
                                                                        ? "border-[#35877D] bg-[#35877D]/5"
                                                                        : "border-slate-200 hover:bg-slate-50 bg-white"
                                                                    }`}
                                                            >
                                                                <input
                                                                    type="radio"
                                                                    name="template_type"
                                                                    checked={form.type === t.id}
                                                                    onChange={() => setForm({ ...form, type: t.id })}
                                                                    className="mt-1 accent-[#35877D]"
                                                                />
                                                                <div>
                                                                    <p className="text-xs font-bold text-slate-800">{t.label}</p>
                                                                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed font-normal">{t.desc}</p>
                                                                </div>
                                                            </label>
                                                        ))}
                                                    </>
                                                )}

                                                {form.category === "Utility" && (
                                                    <>
                                                        {[
                                                            { id: "default", label: "Default", desc: "Send messages about an existing order or account." },
                                                            { id: "calling_permissions", label: "Calling permissions request", desc: "Ask customers if you can call them on WhatsApp." }
                                                        ].map((t) => (
                                                            <label
                                                                key={t.id}
                                                                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${form.type === t.id
                                                                        ? "border-[#35877D] bg-[#35877D]/5"
                                                                        : "border-slate-200 hover:bg-slate-50 bg-white"
                                                                    }`}
                                                            >
                                                                <input
                                                                    type="radio"
                                                                    name="template_type"
                                                                    checked={form.type === t.id}
                                                                    onChange={() => setForm({ ...form, type: t.id })}
                                                                    className="mt-1 accent-[#35877D]"
                                                                />
                                                                <div>
                                                                    <p className="text-xs font-bold text-slate-800">{t.label}</p>
                                                                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed font-normal">{t.desc}</p>
                                                                </div>
                                                            </label>
                                                        ))}
                                                    </>
                                                )}

                                                {form.category === "Authentication" && (
                                                    <label className="flex items-start gap-3 p-3 rounded-xl border border-[#35877D] bg-[#35877D]/5 cursor-pointer">
                                                        <input
                                                            type="radio"
                                                            name="template_type"
                                                            checked
                                                            readOnly
                                                            className="mt-1 accent-[#35877D]"
                                                        />
                                                        <div>
                                                            <p className="text-xs font-bold text-slate-800">One-time Passcode</p>
                                                            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed font-normal">Send codes to verify a transaction or login.</p>
                                                        </div>
                                                    </label>
                                                )}
                                            </div>
                                        </div>

                                        {/* Name and Language config */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                                            <div className="space-y-1.5">
                                                <Label className="text-slate-800 font-semibold text-xs">Template Name</Label>
                                                <Input
                                                    placeholder="e.g. order_completed_notification"
                                                    value={form.name}
                                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                                    disabled={editingId !== null}
                                                    className="text-slate-800 text-sm disabled:bg-slate-50 h-9"
                                                    required
                                                />
                                                <p className="text-[10px] text-slate-500">
                                                    Lowercase letters, digits, and underscores only.
                                                </p>
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label className="text-slate-800 font-semibold text-xs">Language</Label>
                                                <Input
                                                    list="languages"
                                                    placeholder="en_US"
                                                    value={form.language}
                                                    onChange={(e) => setForm({ ...form, language: e.target.value })}
                                                    disabled={editingId !== null}
                                                    className="text-slate-800 text-sm disabled:bg-slate-50 h-9"
                                                    required
                                                />
                                                <datalist id="languages">
                                                    {COMMON_LANGUAGE_CODES.map((code) => (
                                                        <option key={code} value={code} />
                                                    ))}
                                                </datalist>
                                            </div>
                                        </div>

                                        {/* Pre-approved templates banner matching image 2 & 3 layout */}
                                        {form.category !== "Authentication" && (
                                            <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 flex items-center justify-between gap-4 mt-2 select-none">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                                                        <Sparkles className="size-3.5 text-emerald-600 animate-pulse" />
                                                        Start with pre-approved templates
                                                    </div>
                                                    <p className="text-[11px] text-emerald-700 leading-normal max-w-md font-normal">
                                                        Save time and effort by using pre-approved templates from our Template Library. You can quickly build professional-looking templates without starting from scratch.
                                                    </p>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => toast.info("Template Library is coming soon!")}
                                                    className="text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-800 text-xs shrink-0 h-8 font-semibold"
                                                >
                                                    Go to template library
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {step === 2 && (
                                    <div className="space-y-5">
                                        {/* Header Select */}
                                        <div className="space-y-2">
                                            <Label className="text-slate-800 font-semibold text-xs">Header Format (Optional)</Label>
                                            <Select
                                                value={form.header_format}
                                                onValueChange={(val) =>
                                                    setForm({
                                                        ...form,
                                                        header_format: (val || "none") as HeaderFormat,
                                                    })
                                                }
                                            >
                                                <SelectTrigger className="w-full text-slate-800 text-sm bg-white border border-slate-200 h-9">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {HEADER_FORMATS.map((type) => (
                                                        <SelectItem key={type} value={type}>
                                                            {type === "none" ? "None" : type.charAt(0).toUpperCase() + type.slice(1)}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>

                                            {form.header_format === "text" && (
                                                <div className="space-y-2 mt-2 bg-slate-50 border border-slate-100 rounded-xl p-3">
                                                    <Input
                                                        placeholder="Header text content (max 60 characters, optional {{1}})"
                                                        value={form.header_content}
                                                        onChange={(e) => setForm({ ...form, header_content: e.target.value })}
                                                        maxLength={TEMPLATE_LIMITS.headerTextMaxLength}
                                                        className="text-slate-800 text-xs bg-white h-8"
                                                    />
                                                    {headerVarCount > 0 && (
                                                        <Input
                                                            placeholder="Sample value for header variable {{1}} (Required)"
                                                            value={form.header_sample}
                                                            onChange={(e) => setForm({ ...form, header_sample: e.target.value })}
                                                            className="text-slate-800 text-xs bg-white h-8"
                                                            required
                                                        />
                                                    )}
                                                </div>
                                            )}

                                            {form.header_format !== "none" && form.header_format !== "text" && (
                                                <div className="space-y-2 mt-2 bg-slate-50 border border-slate-100 rounded-xl p-3">
                                                    <Input
                                                        placeholder="https://example.com/file.jpg (Public HTTPS URL containing sample media file)"
                                                        value={form.header_media_url}
                                                        onChange={(e) => setForm({ ...form, header_media_url: e.target.value })}
                                                        className="text-slate-800 text-xs bg-white h-8"
                                                        required
                                                    />
                                                    <p className="text-[10px] text-slate-500 leading-normal font-normal">
                                                        {form.header_format === "image" && "Image format requirements: JPEG or PNG, under 5 MB size."}
                                                        {form.header_format === "video" && "Video format requirements: MP4 or 3GP, under 16 MB."}
                                                        {form.header_format === "document" && "Document format requirements: PDF, under 100 MB."}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Body text block */}
                                        <div className="space-y-2 border-t border-slate-100 pt-4">
                                            <Label className="text-slate-800 font-semibold text-xs">Body Text</Label>
                                            <Textarea
                                                placeholder="Hello {{1}}, your order ID {{2}} has been shipped!"
                                                value={form.body_text}
                                                onChange={(e) => setForm({ ...form, body_text: e.target.value })}
                                                rows={4}
                                                maxLength={TEMPLATE_LIMITS.bodyMaxLength}
                                                className="text-slate-800 text-xs resize-none font-normal"
                                                required
                                            />
                                            <p className="text-[10px] text-slate-500 font-normal">
                                                To specify dynamic parameters, use contiguous variables starting at <code>{"{{1}}"}</code> (e.g. <code>{"{{1}}"}</code>, <code>{"{{2}}"}</code>).
                                            </p>

                                            {bodyVarCount > 0 && (
                                                <div className="space-y-2 pt-2 bg-slate-50 border border-slate-100 rounded-xl p-3">
                                                    <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                                        Variable Sample Values (Required by Meta review)
                                                    </Label>
                                                    {form.body_samples.map((val, i) => (
                                                        <div key={i} className="flex items-center gap-2">
                                                            <span className="text-[11px] font-bold text-slate-400 w-10 shrink-0">
                                                                {"{{"}
                                                                {i + 1}
                                                                {"}}"}
                                                            </span>
                                                            <Input
                                                                placeholder={`Sample value for {{${i + 1}}} (e.g. John Doe)`}
                                                                value={val}
                                                                onChange={(e) => {
                                                                    const next = [...form.body_samples];
                                                                    next[i] = e.target.value;
                                                                    setForm({ ...form, body_samples: next });
                                                                }}
                                                                className="text-slate-800 text-xs bg-white h-8"
                                                                required
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Footer text */}
                                        <div className="space-y-1.5 border-t border-slate-100 pt-4">
                                            <Label className="text-slate-800 font-semibold text-xs">Footer Text (Optional)</Label>
                                            <Input
                                                placeholder="Footer subtext (max 60 characters)"
                                                value={form.footer_text}
                                                onChange={(e) => setForm({ ...form, footer_text: e.target.value })}
                                                maxLength={TEMPLATE_LIMITS.footerMaxLength}
                                                className="text-slate-800 text-xs h-9"
                                            />
                                        </div>

                                        {/* Buttons */}
                                        <div className="space-y-2 border-t border-slate-100 pt-4">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-slate-800 font-semibold text-xs">Interactive Buttons (Optional)</Label>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={addButton}
                                                    disabled={form.buttons.length >= TEMPLATE_LIMITS.maxButtonsTotal}
                                                    className="h-7 text-xs border-slate-200 text-[#35877D] hover:bg-[#35877D]/5 hover:text-[#2c7169]"
                                                >
                                                    <Plus size={12} className="mr-1" /> Add Button
                                                </Button>
                                            </div>

                                            {form.buttons.length === 0 ? (
                                                <p className="text-[11px] text-slate-500 font-normal">
                                                    Add up to {TEMPLATE_LIMITS.maxButtonsTotal} quick reply buttons, copy code offers, links, or phone CTAs.
                                                </p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {form.buttons.map((btn, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="border border-slate-200/80 bg-slate-50/50 rounded-xl p-3 space-y-2 relative animate-in fade-in duration-200"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <Select
                                                                    value={btn.type}
                                                                    onValueChange={(val) => {
                                                                        if (!val) return;
                                                                        changeButtonType(idx, val as TemplateButton["type"]);
                                                                    }}
                                                                >
                                                                    <SelectTrigger className="w-36 text-slate-800 text-xs bg-white h-8 border-slate-200">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="QUICK_REPLY">Quick Reply</SelectItem>
                                                                        <SelectItem value="URL">URL Link</SelectItem>
                                                                        <SelectItem value="PHONE_NUMBER">Phone Call</SelectItem>
                                                                        <SelectItem value="COPY_CODE">Copy Code</SelectItem>
                                                                    </SelectContent>
                                                                </Select>

                                                                <Input
                                                                    placeholder="Button Label Text"
                                                                    value={btn.text}
                                                                    maxLength={TEMPLATE_LIMITS.buttonTextMaxLength}
                                                                    onChange={(e) => updateButton(idx, { text: e.target.value })}
                                                                    className="flex-1 text-slate-800 text-xs bg-white h-8"
                                                                    required
                                                                />

                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => removeButton(idx)}
                                                                    className="h-8 w-8 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                                                                >
                                                                    <X size={14} />
                                                                </Button>
                                                            </div>

                                                            {btn.type === "URL" && (
                                                                <div className="space-y-2 pl-2 border-l-2 border-slate-200">
                                                                    <Input
                                                                        placeholder="https://example.com/track/{{1}}"
                                                                        value={btn.url}
                                                                        onChange={(e) => updateButton(idx, { url: e.target.value })}
                                                                        className="text-slate-800 text-xs bg-white h-8"
                                                                        required
                                                                    />
                                                                    {extractVariableIndices(btn.url).length > 0 && (
                                                                        <Input
                                                                            placeholder="Example parameter for {{1}} (e.g. tracking-id)"
                                                                            value={btn.example ?? ""}
                                                                            onChange={(e) => updateButton(idx, { example: e.target.value })}
                                                                            className="text-slate-800 text-xs bg-white h-8"
                                                                            required
                                                                        />
                                                                    )}
                                                                </div>
                                                            )}

                                                            {btn.type === "PHONE_NUMBER" && (
                                                                <Input
                                                                    placeholder="International Format: +15551234567"
                                                                    value={btn.phone_number}
                                                                    onChange={(e) => updateButton(idx, { phone_number: e.target.value })}
                                                                    className="text-slate-800 text-xs bg-white h-8 max-w-sm pl-2 border-l-2 border-slate-200"
                                                                    required
                                                                />
                                                            )}

                                                            {btn.type === "COPY_CODE" && (
                                                                <Input
                                                                    placeholder="Promo Sample Code (e.g. SUMMER50)"
                                                                    value={btn.example}
                                                                    onChange={(e) => updateButton(idx, { example: e.target.value })}
                                                                    className="text-slate-800 text-xs bg-white h-8 max-w-sm pl-2 border-l-2 border-slate-200"
                                                                    required
                                                                />
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {step === 3 && (
                                    <div className="space-y-5 animate-in fade-in duration-200">
                                        <div className="space-y-1">
                                            <h4 className="text-slate-800 font-bold text-sm">Review Template Details</h4>
                                            <p className="text-[11px] text-slate-500 leading-normal font-normal">
                                                Confirm the details below before submitting this template to Meta for approval.
                                            </p>
                                        </div>

                                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3.5 select-none">
                                            <div className="grid grid-cols-2 gap-4 text-xs">
                                                <div>
                                                    <span className="text-slate-400 font-medium">Template Name</span>
                                                    <p className="text-slate-800 font-bold mt-0.5">{form.name}</p>
                                                </div>
                                                <div>
                                                    <span className="text-slate-400 font-medium">Category</span>
                                                    <p className="text-slate-800 font-bold mt-0.5">{form.category}</p>
                                                </div>
                                                <div>
                                                    <span className="text-slate-400 font-medium">Language</span>
                                                    <p className="text-slate-800 font-bold mt-0.5">{form.language}</p>
                                                </div>
                                                <div>
                                                    <span className="text-slate-400 font-medium">Type</span>
                                                    <p className="text-slate-800 font-bold mt-0.5 uppercase">{form.type}</p>
                                                </div>
                                            </div>

                                            <div className="border-t border-slate-200/60 pt-3 text-xs space-y-2">
                                                <div>
                                                    <span className="text-slate-400 font-medium text-[11px]">Header Format</span>
                                                    <p className="text-slate-700 mt-0.5 font-bold uppercase text-[10px]">{form.header_format}</p>
                                                </div>
                                                <div>
                                                    <span className="text-slate-400 font-medium text-[11px]">Interactive Buttons</span>
                                                    <p className="text-slate-700 mt-0.5 font-bold text-[10px] uppercase">
                                                        {form.buttons.length > 0
                                                            ? `${form.buttons.length} button(s) (${form.buttons.map(b => b.type).join(", ")})`
                                                            : "None"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50/50 p-4 text-xs text-blue-800 select-none">
                                            <Info className="size-4 mt-0.5 shrink-0 text-blue-600" />
                                            <div className="space-y-1 leading-relaxed">
                                                <strong className="font-bold">Ready for Review</strong>
                                                <p className="text-[11px] text-blue-700 font-normal">
                                                    Meta's automated and manual review processes verify that templates adhere to WhatsApp Business policies. This check typically takes less than 24 hours.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* RIGHT COLUMN: WhatsApp Live Preview */}
                            <div className="lg:col-span-5 p-6 bg-slate-50 overflow-y-auto flex flex-col gap-6 select-none border-l border-slate-100 h-full">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Template Preview</span>

                                {/* WhatsApp Mobile Layout Screen Frame */}
                                <div className="w-full max-w-[310px] mx-auto rounded-3xl overflow-hidden border border-slate-200 shadow-md bg-[#efeae2] flex flex-col">
                                    {/* WhatsApp Top Status Bar */}
                                    <div className="bg-[#128C7E] text-white px-4 py-2.5 flex items-center gap-2">
                                        <div className="size-6 rounded-full bg-white/20 flex items-center justify-center font-bold text-[10px]">WA</div>
                                        <div>
                                            <p className="text-[10px] font-bold leading-none">Connectly360 Client</p>
                                            <p className="text-[8px] text-white/70 mt-0.5">Online</p>
                                        </div>
                                    </div>

                                    {/* Chat background and bubble */}
                                    <div className="p-3 flex-1 flex flex-col gap-3 min-h-[320px]">
                                        {/* Message Bubble */}
                                        <div className="bg-white rounded-2xl rounded-tl-none shadow-sm border border-slate-100 p-3 text-slate-800 w-full text-xs flex flex-col gap-1.5">
                                            {/* Header Section Preview */}
                                            {form.header_format !== "none" && (
                                                <div className="border-b border-slate-100 pb-2 mb-1.5">
                                                    {form.header_format === "image" && (
                                                        <div className="w-full aspect-[2/1] rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-100">
                                                            {form.header_media_url ? (
                                                                <img
                                                                    src={form.header_media_url}
                                                                    alt="Header Preview"
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => {
                                                                        (e.target as any).src = "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600";
                                                                    }}
                                                                />
                                                            ) : (
                                                                <ImageIcon className="size-6 text-slate-300" />
                                                            )}
                                                        </div>
                                                    )}

                                                    {form.header_format === "video" && (
                                                        <div className="w-full aspect-[2/1] rounded-lg bg-slate-900 flex items-center justify-center text-white relative">
                                                            <Play className="size-8 text-white/80" />
                                                            <span className="absolute bottom-1.5 right-1.5 text-[8px] bg-black/60 px-1 py-0.5 rounded text-white/90">Video</span>
                                                        </div>
                                                    )}

                                                    {form.header_format === "document" && (
                                                        <div className="w-full rounded-lg bg-slate-50 border border-slate-100 p-2 flex items-center gap-2">
                                                            <FileCode className="size-5 text-[#35877D]" />
                                                            <div className="overflow-hidden">
                                                                <p className="text-[10px] font-bold text-slate-700 truncate">Document.pdf</p>
                                                                <p className="text-[8px] text-slate-400">PDF Document</p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {form.header_format === "text" && form.header_content && (
                                                        <p className="font-bold text-slate-800 text-[11px] leading-tight">
                                                            {getReplacedHeader(form.header_content, form.header_sample)}
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            {/* Body Text Preview */}
                                            <p className="whitespace-pre-wrap text-[11px] text-slate-700 leading-relaxed">
                                                {getReplacedBody(form.body_text, form.body_samples) || "Good news! Your verification code or message layout will display here."}
                                            </p>

                                            {/* Footer Text Preview */}
                                            {form.footer_text && (
                                                <p className="text-[9px] text-slate-400 leading-tight">
                                                    {form.footer_text}
                                                </p>
                                            )}

                                            {/* Small WhatsApp Time Stamp */}
                                            <span className="text-[8px] text-slate-400 self-end mt-0.5">11:59 AM</span>
                                        </div>

                                        {/* Action/Interactive Buttons Preview attached directly below */}
                                        {form.buttons && form.buttons.length > 0 && (
                                            <div className="flex flex-col gap-1 w-full mt-[-6px]">
                                                {form.buttons.map((btn, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="w-full bg-white hover:bg-slate-50 py-2 px-3 rounded-lg border border-slate-200 shadow-sm flex items-center justify-center gap-1.5 cursor-pointer text-[#007a5c] font-bold text-[10.5px]"
                                                    >
                                                        {btn.type === "URL" && <Link2 className="size-3" />}
                                                        {btn.type === "PHONE_NUMBER" && <Phone className="size-3" />}
                                                        {btn.type === "COPY_CODE" && <Copy className="size-3" />}
                                                        {btn.type === "QUICK_REPLY" && <MessageSquare className="size-3" />}
                                                        {btn.text || `Button #${idx + 1}`}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Custom helper descriptions dynamically changing */}
                                <div className="space-y-3.5 mt-auto bg-white/70 border border-slate-200/60 rounded-2xl p-4 text-xs text-slate-600 select-none">
                                    <div>
                                        <h5 className="font-bold text-slate-800 text-[10px] uppercase tracking-wide">This template is good for</h5>
                                        <p className="text-slate-500 mt-1 leading-relaxed text-[11px] font-normal">
                                            {form.category === "Marketing" && "Welcome messages, promotions, offers, coupons, newsletters, and announcements."}
                                            {form.category === "Utility" && "Order confirmations, account updates, receipts, appointment reminders, and billing."}
                                            {form.category === "Authentication" && "One-time passwords, account recovery codes, account verification, and integrity challenges."}
                                        </p>
                                    </div>
                                    <div className="border-t border-slate-100 pt-2.5">
                                        <h5 className="font-bold text-slate-800 text-[10px] uppercase tracking-wide">Template areas you can customize</h5>
                                        <p className="text-slate-500 mt-1 leading-relaxed text-[11px] font-normal">
                                            {form.category === "Authentication" ? "Code delivery method" : "Media, header, body, footer, button"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Navigation Footer */}
                        <DialogFooter className="border-t border-slate-100 px-6 py-4 flex items-center justify-between bg-white shrink-0">
                            <div>
                                {step > 1 && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setStep((s) => s - 1)}
                                        className="border-slate-200 text-slate-700 h-9 font-semibold flex items-center gap-1"
                                    >
                                        <ChevronLeft size={16} /> Back
                                    </Button>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setDialogOpen(false)}
                                    className="border-slate-200 text-slate-700 h-9 font-semibold"
                                >
                                    Cancel
                                </Button>

                                {step < 3 ? (
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            if (step === 1) {
                                                // Validate Step 1
                                                if (!form.name.trim()) {
                                                    toast.error("Template name is required.");
                                                    return;
                                                }
                                                if (!TEMPLATE_LIMITS.nameRegex.test(form.name.trim())) {
                                                    toast.error("Template name must use only lowercase letters, digits, and underscores.");
                                                    return;
                                                }
                                                if (!form.language.trim()) {
                                                    toast.error("Language code is required.");
                                                    return;
                                                }
                                                setStep(2);
                                            } else if (step === 2) {
                                                // Validate Step 2
                                                try {
                                                    validateTemplatePayload(
                                                        form.name,
                                                        form.category,
                                                        form.language,
                                                        form.header_format,
                                                        form.header_content,
                                                        form.header_media_url,
                                                        form.body_text,
                                                        form.footer_text,
                                                        form.buttons,
                                                        form.body_samples,
                                                        form.header_sample
                                                    );
                                                    setStep(3);
                                                } catch (err: any) {
                                                    toast.error(err.message || "Please fix validation issues.");
                                                }
                                            }
                                        }}
                                        className="bg-[#35877D] hover:bg-[#2c7169] text-white font-semibold h-9 px-4 rounded-xl border-0 flex items-center gap-1"
                                    >
                                        Next <ChevronRight size={16} />
                                    </Button>
                                ) : (
                                    <Button
                                        type="submit"
                                        disabled={
                                            createMutation.isPending ||
                                            updateMutation.isPending ||
                                            form.category === "Authentication"
                                        }
                                        className="bg-[#35877D] hover:bg-[#2c7169] text-white font-bold h-9 px-5 rounded-xl border-0"
                                    >
                                        {createMutation.isPending || updateMutation.isPending ? (
                                            <span className="flex items-center gap-1">
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                Processing...
                                            </span>
                                        ) : editingId ? (
                                            "Save & Resubmit"
                                        ) : (
                                            "Submit for Approval"
                                        )}
                                    </Button>
                                )}
                            </div>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* DELETE CONFIRM DIALOG */}
            <Dialog open={templateToDelete !== null} onOpenChange={(open) => !open && setTemplateToDelete(null)}>
                <DialogContent className="sm:max-w-md p-6">
                    <DialogHeader>
                        <DialogTitle className="text-slate-900 font-bold text-base">Delete Message Template?</DialogTitle>
                        <DialogDescription className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                            Are you sure you want to delete template <strong>"{templateToDelete?.name}"</strong>?
                            {templateToDelete?.meta_template_id
                                ? " This action will delete the template locally and from Meta's servers. Active campaigns and broadcasts using this template will fail. This action cannot be undone."
                                : " This template was never submitted to Meta successfully, so it will only be removed from your local database."}
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                        <Button
                            variant="outline"
                            onClick={() => setTemplateToDelete(null)}
                            disabled={deleteMutation.isPending}
                            className="border-slate-200 text-slate-700 h-9"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDelete}
                            disabled={deleteMutation.isPending}
                            className="bg-rose-600 hover:bg-rose-700 text-white font-medium h-9 px-4 rounded-xl border-0"
                        >
                            {deleteMutation.isPending ? (
                                <span className="flex items-center gap-1">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Deleting...
                                </span>
                            ) : (
                                "Delete Template"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
