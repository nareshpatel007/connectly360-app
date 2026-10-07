"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    useCreateTemplate,
    useUpdateTemplate,
    useSaveTemplateDraft,
    useListTemplateAccounts,
    useWhatsAppBusinessProfile,
    useCompanyProfile,
    MessageTemplate,
    TemplateButton,
    LibraryTemplate,
} from "@/lib/api-client-react";
import { TemplatePreview } from "./template-preview";
import { TemplateLibraryModal } from "./template-library-modal";
import {
    Plus,
    Trash2,
    Loader2,
    Sparkles,
    Megaphone,
    Bell,
    KeyRound,
    CheckCircle2,
    AlertCircle,
    FileCode,
    ChevronRight,
    ChevronLeft,
    ExternalLink,
    HelpCircle,
    Info,
    Check,
    X,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface TemplateBuilderModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingTemplate?: MessageTemplate | null;
}

const COMMON_LOCALES = [
    { code: "en_US", label: "English (US)" },
    { code: "en_GB", label: "English (UK)" },
    { code: "es_ES", label: "Spanish (Spain)" },
    { code: "es_MX", label: "Spanish (Mexico)" },
    { code: "pt_BR", label: "Portuguese (Brazil)" },
    { code: "fr_FR", label: "French (France)" },
    { code: "de_DE", label: "German" },
    { code: "it_IT", label: "Italian" },
    { code: "hi_IN", label: "Hindi (India)" },
    { code: "ar", label: "Arabic" },
    { code: "id_ID", label: "Indonesian" },
];

export function TemplateBuilderModal({
    open,
    onOpenChange,
    editingTemplate,
}: TemplateBuilderModalProps) {
    const queryClient = useQueryClient();
    const { data: accounts = [] } = useListTemplateAccounts();
    const createMutation = useCreateTemplate();
    const updateMutation = useUpdateTemplate();
    const saveDraftMutation = useSaveTemplateDraft();

    // Active account and company profile for real preview
    const activeAccount = accounts.find((a) => a.waba_id === wabaId) || accounts[0];
    const { data: waProfile } = useWhatsAppBusinessProfile(activeAccount?.phone_number_id || undefined);
    const { data: companyProfile } = useCompanyProfile();

    const clientBusinessName =
        activeAccount?.verified_name ||
        waProfile?.business_name ||
        activeAccount?.company_name ||
        companyProfile?.company_name ||
        "Official Business Account";

    const clientProfileImage =
        activeAccount?.profile_picture_url ||
        waProfile?.profile_picture_url ||
        companyProfile?.display_logo_url ||
        companyProfile?.logo_url ||
        null;

    // Steps: 1: Basics, 2: Content & Structure, 3: Validation & Submit
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [libraryOpen, setLibraryOpen] = useState(false);
    const [previewTabMobile, setPreviewTabMobile] = useState<"builder" | "preview">("builder");
    const [showPayloadModal, setShowPayloadModal] = useState(false);

    // Form state
    const [wabaId, setWabaId] = useState<string>("");
    const [category, setCategory] = useState<"Marketing" | "Utility" | "Authentication">("Marketing");
    const [templateType, setTemplateType] = useState<string>("STANDARD");
    const [name, setName] = useState<string>("");
    const [language, setLanguage] = useState<string>("en_US");

    // Content fields
    const [headerType, setHeaderType] = useState<"none" | "text" | "image" | "video" | "document">("none");
    const [headerContent, setHeaderContent] = useState<string>("");
    const [headerSample, setHeaderSample] = useState<string>("");
    const [headerMediaUrl, setHeaderMediaUrl] = useState<string>("");
    const [bodyText, setBodyText] = useState<string>("");
    const [bodySamples, setBodySamples] = useState<string[]>([]);
    const [footerText, setFooterText] = useState<string>("");
    const [buttons, setButtons] = useState<TemplateButton[]>([]);

    // Auto-select initial account when accounts load
    useEffect(() => {
        if (!wabaId && accounts.length > 0) {
            setWabaId(accounts[0].waba_id);
        }
    }, [accounts, wabaId]);

    // Populate when editing template changes
    useEffect(() => {
        if (editingTemplate) {
            setWabaId(editingTemplate.waba_id || (accounts[0]?.waba_id ?? ""));
            setCategory(editingTemplate.category);
            setTemplateType(editingTemplate.template_type || "STANDARD");
            setName(editingTemplate.name);
            setLanguage(editingTemplate.language || "en_US");
            setHeaderType((editingTemplate.header_type as any) || "none");
            setHeaderContent(editingTemplate.header_content || "");
            setHeaderSample(editingTemplate.sample_values?.header?.[0] || "");
            setHeaderMediaUrl(editingTemplate.header_media_url || "");
            setBodyText(editingTemplate.body_text || "");
            setBodySamples(editingTemplate.sample_values?.body || []);
            setFooterText(editingTemplate.footer_text || "");
            setButtons(editingTemplate.buttons || []);
            setStep(1);
        } else {
            resetForm();
        }
    }, [editingTemplate, open]);

    function resetForm() {
        setWabaId(accounts[0]?.waba_id ?? "");
        setCategory("Marketing");
        setTemplateType("STANDARD");
        setName("");
        setLanguage("en_US");
        setHeaderType("none");
        setHeaderContent("");
        setHeaderSample("");
        setHeaderMediaUrl("");
        setBodyText("");
        setBodySamples([]);
        setFooterText("");
        setButtons([]);
        setStep(1);
    }

    // Load from Starter Template Library
    function handleApplyLibraryTemplate(tpl: LibraryTemplate) {
        setCategory(tpl.category);
        setTemplateType(tpl.template_type || "STANDARD");
        setHeaderType(tpl.header_type || "none");
        setHeaderContent(tpl.header_content || "");
        setHeaderSample(tpl.sample_values?.header?.[0] || "");
        setHeaderMediaUrl(tpl.header_media_url || "");
        setBodyText(tpl.body_text || "");
        setBodySamples(tpl.sample_values?.body || []);
        setFooterText(tpl.footer_text || "");
        setButtons(tpl.buttons || []);
        if (!name) {
            const sanitized = tpl.title.toLowerCase().replace(/[^a-z0-9_]/g, "_");
            setName(sanitized);
        }
        setStep(2);
        toast.success(`Loaded "${tpl.title}" into builder.`);
    }

    // Variable extraction & synchronisation
    const detectedBodyVars = useMemo(() => {
        const matches = bodyText.matchAll(/\{\{(\d+)\}\}/g);
        const set = new Set<number>();
        for (const m of matches) {
            const n = Number(m[1]);
            if (Number.isFinite(n) && n >= 1) set.add(n);
        }
        return [...set].sort((a, b) => a - b);
    }, [bodyText]);

    useEffect(() => {
        if (bodySamples.length !== detectedBodyVars.length) {
            setBodySamples((prev) => {
                const next = [...prev].slice(0, detectedBodyVars.length);
                while (next.length < detectedBodyVars.length) {
                    next.push("");
                }
                return next;
            });
        }
    }, [detectedBodyVars.length]);

    function handleAddVariableToBody() {
        const nextIdx = detectedBodyVars.length + 1;
        setBodyText((prev) => prev + ` {{${nextIdx}}}`);
    }

    // Live validation checks
    const validationIssues = useMemo(() => {
        const issues: string[] = [];

        // Name
        if (!name.trim()) {
            issues.push("Template name is required.");
        } else if (!/^[a-z0-9_]{1,512}$/.test(name)) {
            issues.push("Template name must contain only lowercase letters, digits, and underscores.");
        }

        // Body
        if (!bodyText.trim()) {
            issues.push("Body message text is required.");
        } else if (bodyText.length > 1024) {
            issues.push(`Body text exceeds 1024 characters (${bodyText.length}/1024).`);
        }

        // Contiguous variables
        for (let i = 0; i < detectedBodyVars.length; i++) {
            if (detectedBodyVars[i] !== i + 1) {
                issues.push(`Body variables must be sequential starting at {{1}} (found {{${detectedBodyVars[i]}}}).`);
                break;
            }
        }

        // Sample values
        for (let i = 0; i < detectedBodyVars.length; i++) {
            if (!bodySamples[i]?.trim()) {
                issues.push(`Provide a sample value for body variable {{${i + 1}}}.`);
                break;
            }
        }

        // Header
        if (headerType === "text") {
            if (!headerContent.trim()) {
                issues.push("Header text content is required when Text header is selected.");
            } else if (headerContent.length > 60) {
                issues.push(`Header text exceeds 60 characters (${headerContent.length}/60).`);
            }
            if (headerContent.includes("{{1}}") && !headerSample.trim()) {
                issues.push("Provide a sample value for header variable {{1}}.");
            }
        } else if (headerType !== "none") {
            if (!headerMediaUrl.trim()) {
                issues.push(`Provide a public HTTPS URL for the ${headerType} header.`);
            }
        }

        // Footer
        if (footerText && footerText.length > 60) {
            issues.push(`Footer text exceeds 60 characters (${footerText.length}/60).`);
        }

        // Buttons
        let urlCount = 0;
        let phoneCount = 0;
        buttons.forEach((b, i) => {
            if (b.type !== "COPY_CODE" && !b.text?.trim()) {
                issues.push(`Button #${i + 1} text is required.`);
            }
            if (b.text && b.text.length > 25) {
                issues.push(`Button #${i + 1} text exceeds 25 characters.`);
            }
            if (b.type === "URL") {
                urlCount++;
                if (!b.url?.trim()) issues.push(`Button #${i + 1} URL is required.`);
            }
            if (b.type === "PHONE_NUMBER") {
                phoneCount++;
                if (!b.phone_number?.trim()) issues.push(`Button #${i + 1} phone number is required.`);
            }
        });

        if (urlCount > 2) issues.push("Maximum 2 URL buttons allowed.");
        if (phoneCount > 1) issues.push("Maximum 1 Phone Number button allowed.");
        if (buttons.length > 10) issues.push("Maximum 10 buttons allowed.");

        return issues;
    }, [
        name,
        bodyText,
        detectedBodyVars,
        bodySamples,
        headerType,
        headerContent,
        headerSample,
        headerMediaUrl,
        footerText,
        buttons,
    ]);

    const isStep1Valid = name.trim().length > 0 && /^[a-z0-9_]{1,512}$/.test(name);
    const isStep2Valid = bodyText.trim().length > 0 && validationIssues.length === 0;

    // Compiled Meta payload for inspection & submission
    const compiledMetaPayload = useMemo(() => {
        const components: any[] = [];

        if (headerType !== "none") {
            if (headerType === "text") {
                const comp: any = {
                    type: "HEADER",
                    format: "TEXT",
                    text: headerContent.trim(),
                };
                if (headerSample.trim()) {
                    comp.example = { header_text: [headerSample.trim()] };
                }
                components.push(comp);
            } else {
                const comp: any = {
                    type: "HEADER",
                    format: headerType.toUpperCase(),
                };
                if (headerMediaUrl.trim()) {
                    comp.example = { header_url: [headerMediaUrl.trim()] };
                }
                components.push(comp);
            }
        }

        const bodyComp: any = {
            type: "BODY",
            text: bodyText.trim(),
        };
        if (bodySamples.length > 0 && bodySamples.some((s) => s.trim())) {
            bodyComp.example = {
                body_text: [bodySamples.map((s) => s.trim())],
            };
        }
        components.push(bodyComp);

        if (footerText.trim()) {
            components.push({
                type: "FOOTER",
                text: footerText.trim(),
            });
        }

        if (buttons.length > 0) {
            components.push({
                type: "BUTTONS",
                buttons: buttons.map((b) => {
                    if (b.type === "URL") {
                        const res: any = { type: "URL", text: b.text, url: b.url };
                        if (b.example) res.example = [b.example];
                        return res;
                    }
                    if (b.type === "PHONE_NUMBER") {
                        return { type: "PHONE_NUMBER", text: b.text, phone_number: b.phone_number };
                    }
                    if (b.type === "COPY_CODE") {
                        return { type: "COPY_CODE", example: b.example || "CODE" };
                    }
                    if (b.type === "OTP") {
                        return { type: "OTP", text: b.text || "Copy Code", otp_type: b.otp_type || "COPY_CODE" };
                    }
                    return { type: "QUICK_REPLY", text: b.text };
                }),
            });
        }

        return {
            name: name.trim(),
            category: category.toUpperCase(),
            language,
            components,
        };
    }, [
        name,
        category,
        language,
        headerType,
        headerContent,
        headerSample,
        headerMediaUrl,
        bodyText,
        bodySamples,
        footerText,
        buttons,
    ]);

    // Handle submit for Meta approval
    async function handleSubmitToMeta() {
        if (validationIssues.length > 0) {
            toast.error(validationIssues[0]);
            return;
        }

        const sample_values: any = {};
        if (bodySamples.some((s) => s.trim())) {
            sample_values.body = bodySamples.map((s) => s.trim());
        }
        if (headerType === "text" && headerSample.trim()) {
            sample_values.header = [headerSample.trim()];
        }

        const payload = {
            waba_id: wabaId,
            name: name.trim(),
            category,
            template_type: templateType,
            language,
            header_type: headerType,
            header_content: headerType === "text" ? headerContent.trim() : null,
            header_media_url: headerType !== "none" && headerType !== "text" ? headerMediaUrl.trim() : null,
            body_text: bodyText.trim(),
            footer_text: footerText.trim() || null,
            buttons: buttons.length > 0 ? buttons : null,
            sample_values: Object.keys(sample_values).length > 0 ? sample_values : null,
        };

        try {
            if (editingTemplate) {
                toast.loading("Submitting updated template to Meta...", { id: "builder-submit" });
                await updateMutation.mutateAsync({ id: editingTemplate.id, data: payload });
                toast.success("Template submitted for Meta review.", { id: "builder-submit" });
            } else {
                toast.loading("Submitting template to Meta...", { id: "builder-submit" });
                await createMutation.mutateAsync({ data: payload });
                toast.success("Template submitted to Meta successfully! Status is Pending Review.", { id: "builder-submit" });
            }

            queryClient.invalidateQueries({ queryKey: ["listTemplates"] });
            onOpenChange(false);
            resetForm();
        } catch (err: any) {
            toast.error(err.message || "Meta submission failed", { id: "builder-submit" });
        }
    }

    // Handle save as local draft
    async function handleSaveDraft() {
        if (!name.trim()) {
            toast.error("Template name is required to save as draft.");
            return;
        }

        const sample_values: any = {};
        if (bodySamples.some((s) => s.trim())) {
            sample_values.body = bodySamples.map((s) => s.trim());
        }
        if (headerType === "text" && headerSample.trim()) {
            sample_values.header = [headerSample.trim()];
        }

        const payload = {
            waba_id: wabaId,
            name: name.trim(),
            category,
            template_type: templateType,
            language,
            header_type: headerType,
            header_content: headerType === "text" ? headerContent.trim() : null,
            header_media_url: headerType !== "none" && headerType !== "text" ? headerMediaUrl.trim() : null,
            body_text: bodyText.trim(),
            footer_text: footerText.trim() || null,
            buttons: buttons.length > 0 ? buttons : null,
            sample_values: Object.keys(sample_values).length > 0 ? sample_values : null,
        };

        try {
            toast.loading("Saving local draft...", { id: "builder-draft" });
            await saveDraftMutation.mutateAsync({ data: payload });
            toast.success("Template draft saved locally.", { id: "builder-draft" });
            queryClient.invalidateQueries({ queryKey: ["listTemplates"] });
            onOpenChange(false);
            resetForm();
        } catch (err: any) {
            toast.error(err.message || "Failed to save draft", { id: "builder-draft" });
        }
    }

    // Button helpers
    function addButton(type: TemplateButton["type"]) {
        if (buttons.length >= 10) return;
        if (type === "QUICK_REPLY") {
            setButtons((prev) => [...prev, { type: "QUICK_REPLY", text: "" }]);
        } else if (type === "URL") {
            setButtons((prev) => [...prev, { type: "URL", text: "", url: "" }]);
        } else if (type === "PHONE_NUMBER") {
            setButtons((prev) => [...prev, { type: "PHONE_NUMBER", text: "", phone_number: "" }]);
        } else if (type === "COPY_CODE") {
            setButtons((prev) => [...prev, { type: "COPY_CODE", text: "Copy code", example: "CODE123" }]);
        }
    }

    function removeButton(idx: number) {
        setButtons((prev) => prev.filter((_, i) => i !== idx));
    }

    function updateButton(idx: number, patch: Partial<TemplateButton>) {
        setButtons((prev) => {
            const next = [...prev];
            next[idx] = { ...next[idx], ...patch } as TemplateButton;
            return next;
        });
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-[1280px] w-[95vw] max-h-[92vh] h-[860px] flex flex-col p-0 overflow-hidden bg-white rounded-3xl border-slate-200 shadow-2xl">
                    {/* Top Bar Header */}
                    <DialogHeader className="px-6 pt-5 pb-3.5 border-b border-slate-100 shrink-0 flex flex-row items-center justify-between">
                        <div>
                            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <span>{editingTemplate ? "Edit WhatsApp Message Template" : "Create WhatsApp Message Template"}</span>
                                <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-600 font-mono">
                                    Meta Cloud API v22.0
                                </Badge>
                            </DialogTitle>
                            <DialogDescription className="text-xs text-slate-500 mt-0.5">
                                Configure Meta-compatible message components for submission and real-time review.
                            </DialogDescription>
                        </div>

                        {/* Top quick actions */}
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                type="button"
                                onClick={() => setLibraryOpen(true)}
                                className="h-8 text-xs border-[#2F8F83]/30 text-[#2F8F83] hover:bg-[#2F8F83]/10 rounded-xl flex items-center gap-1.5 cursor-pointer"
                            >
                                <Sparkles className="size-3.5 text-[#2F8F83]" />
                                <span>Template Library</span>
                            </Button>
                        </div>
                    </DialogHeader>

                    {/* Step Navigation Bar */}
                    <div className="px-6 py-2.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between shrink-0 select-none">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                                    step === 1 ? "bg-white text-[#2F8F83] shadow-2xs border border-[#2F8F83]/30" : "text-slate-500 hover:text-slate-800"
                                }`}
                            >
                                <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                    step === 1 ? "bg-[#2F8F83] text-white" : "bg-slate-200 text-slate-600"
                                }`}>1</span>
                                <span>Set up template</span>
                            </button>

                            <ChevronRight className="size-3.5 text-slate-300" />

                            <button
                                type="button"
                                onClick={() => isStep1Valid && setStep(2)}
                                disabled={!isStep1Valid}
                                className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                                    step === 2 ? "bg-white text-[#2F8F83] shadow-2xs border border-[#2F8F83]/30" : "text-slate-500 hover:text-slate-800"
                                }`}
                            >
                                <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                    step === 2 ? "bg-[#2F8F83] text-white" : "bg-slate-200 text-slate-600"
                                }`}>2</span>
                                <span>Edit components</span>
                            </button>

                            <ChevronRight className="size-3.5 text-slate-300" />

                            <button
                                type="button"
                                onClick={() => isStep1Valid && setStep(3)}
                                disabled={!isStep1Valid}
                                className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                                    step === 3 ? "bg-white text-[#2F8F83] shadow-2xs border border-[#2F8F83]/30" : "text-slate-500 hover:text-slate-800"
                                }`}
                            >
                                <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                    step === 3 ? "bg-[#2F8F83] text-white" : "bg-slate-200 text-slate-600"
                                }`}>3</span>
                                <span>Review & Submit</span>
                            </button>
                        </div>

                        {/* Mobile preview toggle */}
                        <div className="lg:hidden flex items-center gap-1 bg-slate-200/60 p-0.5 rounded-lg text-xs">
                            <button
                                type="button"
                                onClick={() => setPreviewTabMobile("builder")}
                                className={`px-2.5 py-1 rounded-md font-medium text-xs ${previewTabMobile === "builder" ? "bg-white text-slate-800 shadow-2xs" : "text-slate-600"}`}
                            >
                                Builder
                            </button>
                            <button
                                type="button"
                                onClick={() => setPreviewTabMobile("preview")}
                                className={`px-2.5 py-1 rounded-md font-medium text-xs ${previewTabMobile === "preview" ? "bg-white text-slate-800 shadow-2xs" : "text-slate-600"}`}
                            >
                                Preview
                            </button>
                        </div>
                    </div>

                    {/* Main Split Grid: 60% Left Form / 40% Right Preview */}
                    <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
                        {/* LEFT COLUMN: BUILDER */}
                        <div className={`lg:col-span-7 h-full overflow-y-auto p-6 space-y-6 ${previewTabMobile === "preview" ? "hidden lg:block" : "block"}`}>
                            {/* STEP 1: BASICS */}
                            {step === 1 && (
                                <div className="space-y-6 max-w-xl">
                                    {/* Account / WABA Selector */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-slate-700">WhatsApp Business Account (WABA)</Label>
                                        <Select value={wabaId} onValueChange={setWabaId}>
                                            <SelectTrigger className="w-full text-xs rounded-xl h-9.5 bg-slate-50 border-slate-200">
                                                <SelectValue placeholder="Select connected WhatsApp account" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {accounts.map((acc) => (
                                                    <SelectItem key={acc.waba_id} value={acc.waba_id} className="text-xs">
                                                        {acc.verified_name || "WhatsApp Account"} ({acc.display_phone_number || acc.waba_id})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-[11px] text-slate-400">Templates belong to and are reviewed by Meta under this WABA.</p>
                                    </div>

                                    {/* Category Cards */}
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-slate-700">Template Category*</Label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {/* Marketing */}
                                            <div
                                                onClick={() => {
                                                    setCategory("Marketing");
                                                    setTemplateType("STANDARD");
                                                }}
                                                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                                                    category === "Marketing"
                                                        ? "border-[#2F8F83] bg-[#2F8F83]/5 ring-1 ring-[#2F8F83]"
                                                        : "border-slate-200 hover:border-slate-300 bg-white"
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="h-7 w-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                                                        <Megaphone className="size-4" />
                                                    </div>
                                                    {category === "Marketing" && <Check className="size-4 text-[#2F8F83]" />}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-900">Marketing</p>
                                                    <p className="text-[10px] text-slate-500 leading-tight mt-0.5">Promotions, offers, news and product updates</p>
                                                </div>
                                            </div>

                                            {/* Utility */}
                                            <div
                                                onClick={() => {
                                                    setCategory("Utility");
                                                    setTemplateType("STANDARD");
                                                }}
                                                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                                                    category === "Utility"
                                                        ? "border-[#2F8F83] bg-[#2F8F83]/5 ring-1 ring-[#2F8F83]"
                                                        : "border-slate-200 hover:border-slate-300 bg-white"
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="h-7 w-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                                                        <Bell className="size-4" />
                                                    </div>
                                                    {category === "Utility" && <Check className="size-4 text-[#2F8F83]" />}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-900">Utility</p>
                                                    <p className="text-[10px] text-slate-500 leading-tight mt-0.5">Order updates, shipping, invoices and alerts</p>
                                                </div>
                                            </div>

                                            {/* Authentication */}
                                            <div
                                                onClick={() => {
                                                    setCategory("Authentication");
                                                    setTemplateType("AUTHENTICATION");
                                                    setHeaderType("none");
                                                    if (!bodyText) {
                                                        setBodyText("{{1}} is your verification code. For your security, do not share this code with anyone.");
                                                        setBodySamples(["492810"]);
                                                        setButtons([{ type: "COPY_CODE", text: "Copy Code", example: "492810" }]);
                                                        setFooterText("Expires in 10 minutes");
                                                    }
                                                }}
                                                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                                                    category === "Authentication"
                                                        ? "border-[#2F8F83] bg-[#2F8F83]/5 ring-1 ring-[#2F8F83]"
                                                        : "border-slate-200 hover:border-slate-300 bg-white"
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="h-7 w-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                                                        <KeyRound className="size-4" />
                                                    </div>
                                                    {category === "Authentication" && <Check className="size-4 text-[#2F8F83]" />}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-900">Authentication</p>
                                                    <p className="text-[10px] text-slate-500 leading-tight mt-0.5">One-time passwords, codes & login tokens</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Template Name */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs font-semibold text-slate-700">Template Name*</Label>
                                            <span className="text-[11px] text-slate-400 font-mono">e.g. order_confirmation</span>
                                        </div>
                                        <Input
                                            value={name}
                                            disabled={!!editingTemplate}
                                            onChange={(e) => {
                                                const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_");
                                                setName(val);
                                            }}
                                            placeholder="e.g. seasonal_sale_discount"
                                            className="text-xs h-9.5 rounded-xl font-mono bg-slate-50 border-slate-200 focus:bg-white"
                                        />
                                        <p className="text-[11px] text-slate-400">
                                            Lowercase letters, digits, and underscores only. Cannot be changed once submitted.
                                        </p>
                                    </div>

                                    {/* Language Selector */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-slate-700">Template Language*</Label>
                                        <Select value={language} onValueChange={setLanguage} disabled={!!editingTemplate}>
                                            <SelectTrigger className="w-full text-xs rounded-xl h-9.5 bg-slate-50 border-slate-200">
                                                <SelectValue placeholder="Select language" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {COMMON_LOCALES.map((loc) => (
                                                    <SelectItem key={loc.code} value={loc.code} className="text-xs">
                                                        {loc.label} ({loc.code})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-[11px] text-slate-400">Specifies the Meta language locale code for message dispatch.</p>
                                    </div>

                                    {/* Starter CTA */}
                                    <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between gap-3">
                                        <div className="space-y-0.5">
                                            <p className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                                                <Sparkles className="size-3.5 text-emerald-700" />
                                                <span>Want inspiration?</span>
                                            </p>
                                            <p className="text-[11px] text-emerald-700 leading-snug">
                                                Explore our pre-crafted Meta templates for orders, alerts, discounts, and OTPs.
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setLibraryOpen(true)}
                                            className="bg-white border-emerald-200 text-emerald-800 hover:bg-emerald-50 text-xs h-8 px-3 rounded-xl shrink-0 font-medium"
                                        >
                                            Browse Library
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: EDIT CONTENT */}
                            {step === 2 && (
                                <div className="space-y-6 max-w-xl">
                                    {/* HEADER BUILDER */}
                                    {category !== "Authentication" && (
                                        <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-xs font-bold text-slate-800">Header (Optional)</Label>
                                                <span className="text-[10px] text-slate-400">Text or media at the top</span>
                                            </div>

                                            <div className="grid grid-cols-5 gap-1.5 p-1 bg-slate-100 rounded-xl">
                                                {(["none", "text", "image", "video", "document"] as const).map((fmt) => (
                                                    <button
                                                        key={fmt}
                                                        type="button"
                                                        onClick={() => setHeaderType(fmt)}
                                                        className={`text-xs py-1.5 rounded-lg capitalize font-medium transition-all cursor-pointer ${
                                                            headerType === fmt
                                                                ? "bg-white text-[#2F8F83] shadow-2xs font-bold"
                                                                : "text-slate-600 hover:text-slate-900"
                                                        }`}
                                                    >
                                                        {fmt}
                                                    </button>
                                                ))}
                                            </div>

                                            {headerType === "text" && (
                                                <div className="space-y-2 pt-1">
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between text-[11px]">
                                                            <span className="text-slate-600">Header Text</span>
                                                            <span className={headerContent.length > 60 ? "text-rose-600 font-bold" : "text-slate-400"}>
                                                                {headerContent.length} / 60
                                                            </span>
                                                        </div>
                                                        <Input
                                                            value={headerContent}
                                                            onChange={(e) => setHeaderContent(e.target.value)}
                                                            placeholder="e.g. Special offer for {{1}}"
                                                            maxLength={60}
                                                            className="text-xs h-9 rounded-xl bg-slate-50"
                                                        />
                                                    </div>

                                                    {headerContent.includes("{{1}}") && (
                                                        <div className="space-y-1 pt-1">
                                                            <span className="text-[11px] text-slate-600">Sample value for header variable {"{{1}}"}:</span>
                                                            <Input
                                                                value={headerSample}
                                                                onChange={(e) => setHeaderSample(e.target.value)}
                                                                placeholder="e.g. VIP Member"
                                                                className="text-xs h-8.5 rounded-xl bg-slate-50"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {(headerType === "image" || headerType === "video" || headerType === "document") && (
                                                <div className="space-y-1 pt-1">
                                                    <Label className="text-[11px] text-slate-600">Sample Media Public URL (HTTPS)*</Label>
                                                    <Input
                                                        value={headerMediaUrl}
                                                        onChange={(e) => setHeaderMediaUrl(e.target.value)}
                                                        placeholder="https://example.com/assets/sample-image.jpg"
                                                        className="text-xs h-9 rounded-xl bg-slate-50"
                                                    />
                                                    <p className="text-[10px] text-slate-400">
                                                        Required by Meta as an example asset during review.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* BODY BUILDER */}
                                    <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs font-bold text-slate-800">Body Message*</Label>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={handleAddVariableToBody}
                                                    className="h-6 px-2 text-[11px] text-[#2F8F83] hover:bg-[#2F8F83]/10 rounded-md font-semibold"
                                                >
                                                    <Plus className="size-3 mr-0.5" />
                                                    Add Variable
                                                </Button>
                                                <span className={`text-[11px] ${bodyText.length > 1024 ? "text-rose-600 font-bold" : "text-slate-400"}`}>
                                                    {bodyText.length} / 1024
                                                </span>
                                            </div>
                                        </div>

                                        <Textarea
                                            value={bodyText}
                                            onChange={(e) => setBodyText(e.target.value)}
                                            placeholder="Hi {{1}}, your order {{2}} has been confirmed."
                                            rows={5}
                                            maxLength={1024}
                                            className="text-xs rounded-xl bg-slate-50 font-normal leading-relaxed resize-none"
                                        />

                                        {/* Dynamic Variables Configuration */}
                                        {detectedBodyVars.length > 0 && (
                                            <div className="pt-2 border-t border-slate-100 space-y-2">
                                                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                                                    <span>Variable Sample Values ({detectedBodyVars.length})</span>
                                                    <HelpCircle className="size-3 text-slate-400" />
                                                </span>
                                                <div className="space-y-1.5">
                                                    {detectedBodyVars.map((vIdx, i) => (
                                                        <div key={vIdx} className="flex items-center gap-2">
                                                            <span className="text-xs font-mono font-bold text-slate-600 w-12 shrink-0">
                                                                {`{{${vIdx}}}`}
                                                            </span>
                                                            <Input
                                                                value={bodySamples[i] || ""}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    setBodySamples((prev) => {
                                                                        const next = [...prev];
                                                                        next[i] = val;
                                                                        return next;
                                                                    });
                                                                }}
                                                                placeholder={`Example for {{${vIdx}}} (e.g. John)`}
                                                                className="text-xs h-8.5 rounded-xl bg-slate-50"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* FOOTER BUILDER */}
                                    <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs font-bold text-slate-800">Footer Text (Optional)</Label>
                                            <span className={`text-[11px] ${footerText.length > 60 ? "text-rose-600 font-bold" : "text-slate-400"}`}>
                                                {footerText.length} / 60
                                            </span>
                                        </div>
                                        <Input
                                            value={footerText}
                                            onChange={(e) => setFooterText(e.target.value)}
                                            placeholder="e.g. Reply STOP to unsubscribe."
                                            maxLength={60}
                                            className="text-xs h-9 rounded-xl bg-slate-50"
                                        />
                                        <p className="text-[10px] text-slate-400">Footers cannot contain variables.</p>
                                    </div>

                                    {/* BUTTONS BUILDER */}
                                    <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <Label className="text-xs font-bold text-slate-800">Interactive Buttons (Optional)</Label>
                                                <p className="text-[10px] text-slate-400">Up to 10 buttons total (max 2 URLs, 1 Phone)</p>
                                            </div>

                                            {buttons.length < 10 && (
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => addButton("QUICK_REPLY")}
                                                        className="h-7 text-[11px] rounded-lg px-2"
                                                    >
                                                        + Quick Reply
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => addButton("URL")}
                                                        className="h-7 text-[11px] rounded-lg px-2"
                                                    >
                                                        + URL
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => addButton("PHONE_NUMBER")}
                                                        className="h-7 text-[11px] rounded-lg px-2"
                                                    >
                                                        + Phone
                                                    </Button>
                                                </div>
                                            )}
                                        </div>

                                        {buttons.length === 0 ? (
                                            <p className="text-xs text-slate-400 italic py-2 text-center bg-slate-50 rounded-xl">
                                                No buttons configured. Click above to attach Call-to-Action or Quick Reply buttons.
                                            </p>
                                        ) : (
                                            <div className="space-y-2.5">
                                                {buttons.map((btn, idx) => (
                                                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[11px] font-bold text-slate-700">
                                                                #{idx + 1} - {btn.type}
                                                            </span>
                                                            <Button
                                                                type="button"
                                                                size="icon"
                                                                variant="ghost"
                                                                onClick={() => removeButton(idx)}
                                                                className="h-6 w-6 text-slate-400 hover:text-rose-600 rounded-md"
                                                            >
                                                                <Trash2 className="size-3.5" />
                                                            </Button>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div className="space-y-1">
                                                                <span className="text-[10px] text-slate-500">Button Label (max 25 chars)</span>
                                                                <Input
                                                                    value={btn.text}
                                                                    onChange={(e) => updateButton(idx, { text: e.target.value })}
                                                                    placeholder="e.g. Visit Website"
                                                                    maxLength={25}
                                                                    className="text-xs h-8 rounded-lg bg-white"
                                                                />
                                                            </div>

                                                            {btn.type === "URL" && (
                                                                <div className="space-y-1">
                                                                    <span className="text-[10px] text-slate-500">Destination URL</span>
                                                                    <Input
                                                                        value={btn.url}
                                                                        onChange={(e) => updateButton(idx, { url: e.target.value })}
                                                                        placeholder="https://example.com/order/{{1}}"
                                                                        className="text-xs h-8 rounded-lg bg-white"
                                                                    />
                                                                </div>
                                                            )}

                                                            {btn.type === "PHONE_NUMBER" && (
                                                                <div className="space-y-1">
                                                                    <span className="text-[10px] text-slate-500">Phone (with country code)</span>
                                                                    <Input
                                                                        value={btn.phone_number}
                                                                        onChange={(e) => updateButton(idx, { phone_number: e.target.value })}
                                                                        placeholder="+18005550199"
                                                                        className="text-xs h-8 rounded-lg bg-white"
                                                                    />
                                                                </div>
                                                            )}

                                                            {btn.type === "COPY_CODE" && (
                                                                <div className="space-y-1">
                                                                    <span className="text-[10px] text-slate-500">Sample Promo / OTP Code</span>
                                                                    <Input
                                                                        value={btn.example}
                                                                        onChange={(e) => updateButton(idx, { example: e.target.value })}
                                                                        placeholder="CODE123"
                                                                        className="text-xs h-8 rounded-lg bg-white"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: REVIEW & SUBMIT */}
                            {step === 3 && (
                                <div className="space-y-6 max-w-xl">
                                    {/* Validation Overview Card */}
                                    <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                                        <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                            {validationIssues.length === 0 ? (
                                                <CheckCircle2 className="size-4 text-emerald-600" />
                                            ) : (
                                                <AlertCircle className="size-4 text-rose-600" />
                                            )}
                                            <span>Meta Compliance Verification</span>
                                        </h3>

                                        {validationIssues.length === 0 ? (
                                            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-800 space-y-1">
                                                <p className="font-semibold">All Meta template requirements satisfied!</p>
                                                <p className="text-[11px] text-emerald-700">
                                                    Your template specification is ready to be sent to Meta for official WhatsApp review.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-xs text-rose-800 space-y-1.5">
                                                <p className="font-bold">Issues requiring attention before Meta submission:</p>
                                                <ul className="list-disc pl-4 space-y-1 text-[11px] text-rose-700">
                                                    {validationIssues.map((err, i) => (
                                                        <li key={i}>{err}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                                <span className="text-[10px] text-slate-400 font-bold uppercase">Name</span>
                                                <p className="font-mono text-slate-800 font-semibold">{name}</p>
                                            </div>
                                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                                <span className="text-[10px] text-slate-400 font-bold uppercase">Category</span>
                                                <p className="text-slate-800 font-semibold">{category}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Meta Graph Payload Viewer */}
                                    <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <p className="text-xs font-bold text-slate-900">Meta API Payload</p>
                                                <p className="text-[10px] text-slate-400">Exact JSON dispatched to POST /{wabaId || "{WABA-ID}"}/message_templates</p>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setShowPayloadModal(!showPayloadModal)}
                                                className="text-xs h-7 rounded-lg"
                                            >
                                                <FileCode className="size-3 mr-1" />
                                                {showPayloadModal ? "Hide JSON" : "Inspect JSON"}
                                            </Button>
                                        </div>

                                        {showPayloadModal && (
                                            <div className="p-3 bg-slate-900 rounded-xl text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-52 border border-slate-800">
                                                <pre>{JSON.stringify(compiledMetaPayload, null, 2)}</pre>
                                            </div>
                                        )}
                                    </div>

                                    {/* Submission Tips */}
                                    <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100 text-sky-900 text-xs space-y-1">
                                        <p className="font-bold flex items-center gap-1.5">
                                            <Info className="size-3.5 text-sky-700" />
                                            <span>Meta Review Lifecycle</span>
                                        </p>
                                        <p className="text-[11px] text-sky-800 leading-relaxed">
                                            Meta reviews templates through automated policies and human inspection. Approval typically takes from a few minutes up to 24 hours. The Connectly360 webhook will automatically update the status to Approved or Rejected in real time.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* RIGHT COLUMN: REALTIME WHATSAPP PREVIEW (40% width) */}
                        <div className={`lg:col-span-5 h-full bg-slate-50 border-l border-slate-100 p-6 flex flex-col justify-start overflow-y-auto ${previewTabMobile === "builder" ? "hidden lg:flex" : "flex"}`}>
                            <div className="space-y-3 sticky top-0">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                        Live WhatsApp Preview
                                    </span>
                                    <span className="text-[10px] bg-slate-200/70 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                                        Updates Realtime
                                    </span>
                                </div>

                                <TemplatePreview
                                    businessName={clientBusinessName}
                                    profileImageUrl={clientProfileImage}
                                    headerType={headerType}
                                    headerContent={headerContent}
                                    headerMediaUrl={headerMediaUrl}
                                    headerSample={headerSample}
                                    bodyText={bodyText}
                                    bodySamples={bodySamples}
                                    footerText={footerText}
                                    buttons={buttons}
                                    category={category}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/90 shrink-0 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onOpenChange(false)}
                                className="text-xs rounded-xl h-9"
                            >
                                Cancel
                            </Button>

                            {step > 1 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    type="button"
                                    onClick={() => setStep((s) => (s - 1) as any)}
                                    className="text-xs rounded-xl h-9 flex items-center gap-1"
                                >
                                    <ChevronLeft className="size-3.5" />
                                    Back
                                </Button>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Save Draft Option */}
                            <Button
                                variant="outline"
                                size="sm"
                                type="button"
                                onClick={handleSaveDraft}
                                disabled={saveDraftMutation.isPending || !name.trim()}
                                className="text-xs rounded-xl h-9 border-slate-200 text-slate-700 hover:bg-white"
                            >
                                {saveDraftMutation.isPending ? <Loader2 className="size-3.5 animate-spin mr-1" /> : null}
                                Save as Draft
                            </Button>

                            {step < 3 ? (
                                <Button
                                    size="sm"
                                    type="button"
                                    onClick={() => setStep((s) => (s + 1) as any)}
                                    disabled={step === 1 ? !isStep1Valid : !isStep2Valid}
                                    className="bg-[#2F8F83] hover:bg-[#267A70] text-white text-xs rounded-xl h-9 px-4 font-medium flex items-center gap-1 shadow-2xs cursor-pointer"
                                >
                                    <span>Next Step</span>
                                    <ChevronRight className="size-3.5" />
                                </Button>
                            ) : (
                                <Button
                                    size="sm"
                                    type="button"
                                    onClick={handleSubmitToMeta}
                                    disabled={createMutation.isPending || updateMutation.isPending || validationIssues.length > 0}
                                    className="bg-[#2F8F83] hover:bg-[#267A70] text-white text-xs rounded-xl h-9 px-5 font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                >
                                    {(createMutation.isPending || updateMutation.isPending) && (
                                        <Loader2 className="size-3.5 animate-spin" />
                                    )}
                                    <span>Submit for Review</span>
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Template Library Modal */}
            <TemplateLibraryModal
                open={libraryOpen}
                onOpenChange={setLibraryOpen}
                onSelectTemplate={handleApplyLibraryTemplate}
            />
        </>
    );
}
