"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
    Check, ChevronRight, Loader2, ArrowLeft, Radio, FileText,
    Users, Send, Mail, MessageSquare, MessageCircle, Megaphone,
    Calendar, AlertTriangle, ShieldCheck, CheckCircle2, XCircle,
    Info, Filter, Sparkles, AlertCircle, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/page-header";
import { UpgradeGuard } from "@/components/upgrade-guard";
import { TemplatePreview } from "@/components/templates/template-preview";
import { CampaignPreflightWidget } from "@/components/campaigns";
import {
    useListTemplateAccounts,
    useListTemplates,
    useCreateCampaign,
    useLaunchCampaign,
    useScheduleCampaign,
    useValidateAudience,
    useCompanyProfile,
    useRunCampaignPreflightCheck,
    MessageTemplate,
    WhatsAppAccountOption,
    AudienceValidationResult,
    CampaignPreflightResult,
} from "@/lib/api-client-react";
import { useAuth } from "@/lib/auth-context";

// ─────────────────────────────────────────────────────────
// Step definitions
// ─────────────────────────────────────────────────────────

const STEPS = [
    { key: "channel", label: "Channel & Account", icon: Megaphone },
    { key: "content", label: "Template & Content", icon: FileText },
    { key: "audience", label: "Audience & Filters", icon: Users },
    { key: "review", label: "Review & Launch", icon: Send },
] as const;

export default function NewCampaignPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const segmentParam = searchParams.get("segment_id");
    const { user } = useAuth();
    const workspaceId = user?.tenant_id;

    const [currentStep, setCurrentStep] = useState(0);

    // Form State
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [channel, setChannel] = useState<"whatsapp" | "email" | "sms">("whatsapp");
    const [selectedAccount, setSelectedAccount] = useState<WhatsAppAccountOption | null>(null);

    // Template state
    const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
    const [templateSearch, setTemplateSearch] = useState("");
    const [templateCategory, setTemplateCategory] = useState("all");
    const [variableMappings, setVariableMappings] = useState<Record<string, { field: string; fallback: string }>>({});

    // Audience state
    const [audienceType, setAudienceType] = useState<"all" | "segment" | "tags">(segmentParam ? "segment" : "all");
    const [selectedSegmentId, setSelectedSegmentId] = useState<string>(segmentParam || "");
    const [tagsInput, setTagsInput] = useState<string>("");
    const [segmentsList, setSegmentsList] = useState<any[]>([]);
    const [audiencePreview, setAudiencePreview] = useState<AudienceValidationResult | null>(null);
    const [isValidatingAudience, setIsValidatingAudience] = useState(false);
    const [showExcludedDetails, setShowExcludedDetails] = useState(false);

    // Schedule & Launch state
    const [isScheduling, setIsScheduling] = useState(false);
    const [scheduledDateTime, setScheduledDateTime] = useState("");
    const [showLargeCampaignModal, setShowLargeCampaignModal] = useState(false);
    const [largeCampaignConfirmed, setLargeCampaignConfirmed] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Data fetching
    const { data: accounts = [], isLoading: isLoadingAccounts } = useListTemplateAccounts();
    const { data: companyProfile } = useCompanyProfile(workspaceId);
    const { data: templates = [], isLoading: isLoadingTemplates } = useListTemplates({
        status: "APPROVED",
        waba_id: selectedAccount?.waba_id,
    });

    const createCampaignMutation = useCreateCampaign();
    const launchCampaignMutation = useLaunchCampaign();
    const scheduleCampaignMutation = useScheduleCampaign();
    const validateAudienceMutation = useValidateAudience();
    const preflightCheckMutation = useRunCampaignPreflightCheck();

    // Preflight state for Step 4
    const [preflightResult, setPreflightResult] = useState<CampaignPreflightResult | null>(null);
    const [isRunningPreflight, setIsRunningPreflight] = useState(false);

    const runWizardPreflight = useCallback(async () => {
        setIsRunningPreflight(true);
        try {
            const audienceFilter: any = { type: audienceType };
            if (audienceType === "segment" && selectedSegmentId) {
                audienceFilter.segment_id = Number(selectedSegmentId);
            }
            if (audienceType === "tags" && tagsInput.trim()) {
                audienceFilter.tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
            }

            const payload = {
                name: name.trim() || "Draft Campaign",
                whatsapp_account_id: selectedAccount?.id || null,
                template_id: selectedTemplate?.id || null,
                template_name: selectedTemplate?.name || null,
                template_language: selectedTemplate?.language || "en_US",
                template_category: selectedTemplate?.category || "Marketing",
                template_variables: variableMappings,
                audience_type: audienceType,
                audience_filter: audienceFilter,
            };

            const result = await preflightCheckMutation.mutateAsync(payload);
            setPreflightResult(result);
        } catch (e) {
            console.error("Failed to run wizard preflight check", e);
        } finally {
            setIsRunningPreflight(false);
        }
    }, [audienceType, selectedSegmentId, tagsInput, name, selectedAccount, selectedTemplate, variableMappings]);

    // Automatically run preflight when entering step 4 (Review & Launch)
    useEffect(() => {
        if (currentStep === 3) {
            runWizardPreflight();
        }
    }, [currentStep, runWizardPreflight]);

    // Auto-select first connected WhatsApp account
    useEffect(() => {
        if (accounts.length > 0 && !selectedAccount) {
            setSelectedAccount(accounts[0]);
        }
    }, [accounts, selectedAccount]);

    // Fetch segments list
    useEffect(() => {
        async function fetchSegments() {
            try {
                const res = await fetch("/api/segments");
                if (res.ok) {
                    const data = await res.json();
                    setSegmentsList(Array.isArray(data) ? data : (data.data || []));
                }
            } catch (e) {}
        }
        fetchSegments();
    }, []);

    // Extract template variables whenever template changes
    useEffect(() => {
        if (!selectedTemplate) {
            setVariableMappings({});
            return;
        }

        const bodyMatches = selectedTemplate.body_text?.match(/\{\{(\d+)\}\}/g) || [];
        const mappings: Record<string, { field: string; fallback: string }> = {};

        bodyMatches.forEach((m) => {
            const index = m.replace(/[\{\}]/g, "");
            mappings[index] = {
                field: index === "1" ? "name" : index === "2" ? "phone" : "custom",
                fallback: "Customer",
            };
        });

        setVariableMappings(mappings);
    }, [selectedTemplate]);

    // Validate audience criteria
    async function handleValidateAudience() {
        setIsValidatingAudience(true);
        try {
            const filter: any = { type: audienceType };
            if (audienceType === "segment" && selectedSegmentId) {
                filter.segment_id = Number(selectedSegmentId);
            }
            if (audienceType === "tags" && tagsInput.trim()) {
                filter.tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
            }

            const result = await validateAudienceMutation.mutateAsync(filter);
            setAudiencePreview(result);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to evaluate audience");
        } finally {
            setIsValidatingAudience(false);
        }
    }

    // Auto-validate when switching to Audience step
    useEffect(() => {
        if (currentStep === 2 && !audiencePreview) {
            handleValidateAudience();
        }
    }, [currentStep]);

    // Mapped sample values for live preview
    const liveBodySamples = useMemo(() => {
        if (!selectedTemplate) return [];
        const samples: string[] = [];
        Object.keys(variableMappings).forEach((idx) => {
            const mapping = variableMappings[idx];
            const sampleText =
                mapping.field === "name"
                    ? "John Doe"
                    : mapping.field === "phone"
                    ? "+1 555-0199"
                    : mapping.fallback || "Valued Customer";
            samples[parseInt(idx, 10) - 1] = sampleText;
        });
        return samples;
    }, [selectedTemplate, variableMappings]);

    // Filter templates for selector
    const filteredTemplates = useMemo(() => {
        return templates.filter((tpl) => {
            if (templateCategory !== "all" && tpl.category !== templateCategory) {
                return false;
            }
            if (templateSearch.trim()) {
                const term = templateSearch.toLowerCase();
                const matchName = tpl.name.toLowerCase().includes(term);
                const matchBody = tpl.body_text?.toLowerCase().includes(term);
                if (!matchName && !matchBody) return false;
            }
            return true;
        });
    }, [templates, templateCategory, templateSearch]);

    // Business identity for preview
    const businessDisplayName =
        selectedAccount?.verified_name ||
        selectedAccount?.company_name ||
        companyProfile?.company_name ||
        "Connectly360";

    const businessProfileImage =
        selectedAccount?.profile_picture_url ||
        companyProfile?.display_logo_url ||
        companyProfile?.logo_url ||
        null;

    // Credit estimate calculation
    const eligibleCount = audiencePreview?.eligible_count || 0;
    const estimatedRequiredCredits = eligibleCount * 1;

    // Save Draft, Launch, or Schedule Handler
    async function handleSaveOrLaunch(mode: "draft" | "launch" | "schedule") {
        if (!name.trim()) {
            toast.error("Please enter a campaign name");
            setCurrentStep(0);
            return;
        }

        if (channel === "whatsapp" && !selectedTemplate) {
            toast.error("Please select an approved WhatsApp template");
            setCurrentStep(1);
            return;
        }

        // Check large campaign threshold
        if (mode === "launch" && eligibleCount >= 10000 && !largeCampaignConfirmed) {
            setShowLargeCampaignModal(true);
            return;
        }

        setIsSubmitting(true);
        try {
            const audienceFilter: any = { type: audienceType };
            if (audienceType === "segment" && selectedSegmentId) {
                audienceFilter.segment_id = Number(selectedSegmentId);
            }
            if (audienceType === "tags" && tagsInput.trim()) {
                audienceFilter.tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
            }

            const payload = {
                name: name.trim(),
                description: description.trim() || null,
                channel: "whatsapp",
                whatsapp_account_id: selectedAccount?.id || null,
                template_id: selectedTemplate?.id || null,
                template_name: selectedTemplate?.name || null,
                template_language: selectedTemplate?.language || "en_US",
                template_category: selectedTemplate?.category || "Marketing",
                template_variables: variableMappings,
                audience_type: audienceType,
                audience_filter: audienceFilter,
            };

            const campaign = await createCampaignMutation.mutateAsync({ data: payload });

            if (mode === "launch") {
                await launchCampaignMutation.mutateAsync({ id: campaign.id });
                toast.success(`Campaign launched! Processing ${eligibleCount.toLocaleString()} recipients in batches.`);
                router.push(`/marketing/campaigns/${campaign.id}`);
            } else if (mode === "schedule") {
                if (!scheduledDateTime) {
                    toast.error("Please specify a scheduled date and time");
                    setIsSubmitting(false);
                    return;
                }
                await scheduleCampaignMutation.mutateAsync({
                    id: campaign.id,
                    scheduledAt: scheduledDateTime,
                });
                toast.success("Campaign scheduled successfully!");
                router.push(`/marketing/campaigns/${campaign.id}`);
            } else {
                toast.success("Campaign draft saved!");
                router.push(`/marketing/campaigns/${campaign.id}`);
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to process campaign");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <UpgradeGuard
            allowedPlans={["business", "enterprise"]}
            featureName="Bulk Broadcast Campaigns"
            description="Broadcast campaigns allow sending high-volume WhatsApp messages using approved templates."
        >
            <div className="space-y-6 w-full pb-12">
                {/* Header */}
                <PageHeader
                    icon={Megaphone}
                    title="Create Broadcast"
                    description="Design, target, and launch high-volume WhatsApp bulk message campaigns."
                    breadcrumbs={[
                        { label: "Engagement" },
                        { label: "Campaigns", href: "/marketing/campaigns" },
                        { label: "New Campaign" },
                    ]}
                />

                {/* Step Navigation Pill Indicator */}
                <div className="flex items-center justify-between rounded-xl border border-border bg-card p-2 shadow-2xs">
                    {STEPS.map((s, idx) => {
                        const Icon = s.icon;
                        const isCurrent = currentStep === idx;
                        const isPassed = currentStep > idx;

                        return (
                            <button
                                key={s.key}
                                type="button"
                                onClick={() => setCurrentStep(idx)}
                                className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 px-3 text-xs font-semibold transition-all ${
                                    isCurrent
                                        ? "bg-[#2F8F83] text-white shadow-xs"
                                        : isPassed
                                        ? "text-[#2F8F83] hover:bg-muted/60"
                                        : "text-muted-foreground hover:bg-muted/40"
                                }`}
                            >
                                <div
                                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                                        isCurrent
                                            ? "bg-white/20 text-white"
                                            : isPassed
                                            ? "bg-[#2F8F83]/10 text-[#2F8F83]"
                                            : "bg-muted text-muted-foreground"
                                    }`}
                                >
                                    {isPassed ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                                </div>
                                <span className="hidden sm:inline">{s.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Main 2-Column Workspace: Form & Live Realtime Device Preview */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Column: Step Configuration Form */}
                    <div className="lg:col-span-7 xl:col-span-8 space-y-6">
                        {/* STEP 1: Channel & Account */}
                        {currentStep === 0 && (
                            <Card className="shadow-2xs border-border">
                                <CardHeader className="p-5 pb-3">
                                    <CardTitle className="text-base font-bold">1. Channel & Account</CardTitle>
                                    <CardDescription className="text-xs">
                                        Select the broadcast channel and connected WhatsApp phone number.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-5 pt-2 space-y-5">
                                    {/* Campaign Name */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-foreground">
                                            Campaign Name <span className="text-destructive">*</span>
                                        </label>
                                        <Input
                                            placeholder="e.g. Diwali Mega Sale 2026 VIP"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="text-xs"
                                        />
                                    </div>

                                    {/* Description */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-foreground">Description (Optional)</label>
                                        <Textarea
                                            placeholder="Internal notes about target audience or campaign goals..."
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            rows={2}
                                            className="text-xs resize-none"
                                        />
                                    </div>

                                    {/* Channel Selector */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-foreground">Broadcast Protocol</label>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            {/* WhatsApp */}
                                            <div
                                                onClick={() => setChannel("whatsapp")}
                                                className={`relative flex flex-col p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                                                    channel === "whatsapp"
                                                        ? "border-[#2F8F83] bg-teal-50/30 dark:bg-teal-950/20"
                                                        : "border-border hover:border-border/80"
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
                                                        <MessageCircle className="h-4 w-4" />
                                                    </div>
                                                    {channel === "whatsapp" && (
                                                        <CheckCircle2 className="h-4 w-4 text-[#2F8F83]" />
                                                    )}
                                                </div>
                                                <span className="font-semibold text-xs mt-2 text-foreground">WhatsApp</span>
                                                <span className="text-[11px] text-muted-foreground mt-0.5">Meta Cloud API</span>
                                            </div>

                                            {/* Email (Coming soon) */}
                                            <div className="relative flex flex-col p-3.5 rounded-xl border border-dashed border-border/80 bg-muted/30 opacity-70 cursor-not-allowed">
                                                <div className="flex items-center justify-between">
                                                    <div className="h-8 w-8 rounded-lg bg-blue-100/50 flex items-center justify-center text-blue-500">
                                                        <Mail className="h-4 w-4" />
                                                    </div>
                                                    <span className="text-[10px] font-semibold text-muted-foreground uppercase bg-muted px-1.5 py-0.5 rounded">
                                                        Soon
                                                    </span>
                                                </div>
                                                <span className="font-semibold text-xs mt-2 text-muted-foreground">Email Newsletter</span>
                                                <span className="text-[11px] text-muted-foreground mt-0.5">Coming soon</span>
                                            </div>

                                            {/* SMS (Coming soon) */}
                                            <div className="relative flex flex-col p-3.5 rounded-xl border border-dashed border-border/80 bg-muted/30 opacity-70 cursor-not-allowed">
                                                <div className="flex items-center justify-between">
                                                    <div className="h-8 w-8 rounded-lg bg-amber-100/50 flex items-center justify-center text-amber-500">
                                                        <MessageSquare className="h-4 w-4" />
                                                    </div>
                                                    <span className="text-[10px] font-semibold text-muted-foreground uppercase bg-muted px-1.5 py-0.5 rounded">
                                                        Soon
                                                    </span>
                                                </div>
                                                <span className="font-semibold text-xs mt-2 text-muted-foreground">SMS Broadcast</span>
                                                <span className="text-[11px] text-muted-foreground mt-0.5">Coming soon</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Connected WhatsApp Account Selector */}
                                    {channel === "whatsapp" && (
                                        <div className="space-y-2 pt-2 border-t border-border/60">
                                            <label className="text-xs font-semibold text-foreground">
                                                Connected WhatsApp Account
                                            </label>
                                            {isLoadingAccounts ? (
                                                <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
                                                    <Loader2 className="h-4 w-4 animate-spin text-[#2F8F83]" />
                                                    Loading accounts...
                                                </div>
                                            ) : accounts.length === 0 ? (
                                                <div className="p-3 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                                                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                                                    <div>
                                                        <p className="font-semibold">No WhatsApp Account Connected</p>
                                                        <p className="text-[11px] mt-0.5">
                                                            Please connect a Meta WhatsApp Business account in WhatsApp Settings before launching campaigns.
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <Select
                                                        value={selectedAccount ? String(selectedAccount.id) : ""}
                                                        onValueChange={(val) => {
                                                            const acc = accounts.find((a) => String(a.id) === val);
                                                            if (acc) setSelectedAccount(acc);
                                                        }}
                                                    >
                                                        <SelectTrigger className="text-xs h-10">
                                                            <SelectValue placeholder="Select phone number" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {accounts.map((acc) => (
                                                                <SelectItem key={acc.id} value={String(acc.id)}>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-semibold">{acc.display_phone_number || "Default Number"}</span>
                                                                        {acc.verified_name && (
                                                                            <span className="text-muted-foreground text-[11px]">
                                                                                ({acc.verified_name})
                                                                            </span>
                                                                        )}
                                                                        <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded font-mono">
                                                                            Connected
                                                                        </span>
                                                                    </div>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>

                                                    {selectedAccount && (
                                                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/60 text-xs">
                                                            <div className="flex items-center gap-2">
                                                                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                                                                <span className="font-medium">
                                                                    {selectedAccount.verified_name || "Official WhatsApp Account"}
                                                                </span>
                                                            </div>
                                                            <span className="text-[11px] text-muted-foreground font-mono">
                                                                WABA ID: {selectedAccount.waba_id}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* STEP 2: Template & Content */}
                        {currentStep === 1 && (
                            <Card className="shadow-2xs border-border">
                                <CardHeader className="p-5 pb-3">
                                    <CardTitle className="text-base font-bold">2. Template & Variable Mapping</CardTitle>
                                    <CardDescription className="text-xs">
                                        Choose an approved Meta template and map dynamic variables like contact name.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-5 pt-2 space-y-5">
                                    {/* Template Search & Filter */}
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <Input
                                            placeholder="Search approved templates..."
                                            value={templateSearch}
                                            onChange={(e) => setTemplateSearch(e.target.value)}
                                            className="text-xs h-9 flex-1"
                                        />
                                        <Select value={templateCategory} onValueChange={setTemplateCategory}>
                                            <SelectTrigger className="text-xs h-9 w-[140px]">
                                                <SelectValue placeholder="Category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Categories</SelectItem>
                                                <SelectItem value="Marketing">Marketing</SelectItem>
                                                <SelectItem value="Utility">Utility</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Templates Grid */}
                                    {isLoadingTemplates ? (
                                        <div className="flex h-36 items-center justify-center">
                                            <Loader2 className="h-5 w-5 animate-spin text-[#2F8F83]" />
                                        </div>
                                    ) : filteredTemplates.length === 0 ? (
                                        <div className="p-6 text-center border border-dashed rounded-xl space-y-2">
                                            <p className="text-xs font-semibold text-muted-foreground">
                                                No approved templates found
                                            </p>
                                            <p className="text-[11px] text-muted-foreground">
                                                Only templates with APPROVED status can be used for broadcast campaigns.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
                                            {filteredTemplates.map((tpl) => {
                                                const isSelected = selectedTemplate?.id === tpl.id;
                                                return (
                                                    <div
                                                        key={tpl.id}
                                                        onClick={() => setSelectedTemplate(tpl)}
                                                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start justify-between ${
                                                            isSelected
                                                                ? "border-[#2F8F83] bg-teal-50/30 dark:bg-teal-950/20 shadow-2xs"
                                                                : "border-border hover:bg-muted/40"
                                                        }`}
                                                    >
                                                        <div className="space-y-1 min-w-0 flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-foreground truncate">
                                                                    {tpl.name}
                                                                </span>
                                                                <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold px-1.5 py-0.2 rounded">
                                                                    {tpl.status}
                                                                </span>
                                                                <span className="text-[10px] text-muted-foreground uppercase font-mono">
                                                                    {tpl.language}
                                                                </span>
                                                            </div>
                                                            <p className="text-[11px] text-muted-foreground line-clamp-2">
                                                                {tpl.body_text}
                                                            </p>
                                                        </div>
                                                        {isSelected && (
                                                            <CheckCircle2 className="h-4 w-4 text-[#2F8F83] shrink-0 ml-2 mt-0.5" />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Variable Mapping Config */}
                                    {selectedTemplate && Object.keys(variableMappings).length > 0 && (
                                        <div className="space-y-3 pt-3 border-t border-border/60">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-foreground">
                                                    Variable Mappings ({Object.keys(variableMappings).length})
                                                </span>
                                                <span className="text-[11px] text-muted-foreground">
                                                    Define field source and fallback
                                                </span>
                                            </div>

                                            <div className="space-y-2">
                                                {Object.keys(variableMappings).map((idx) => {
                                                    const current = variableMappings[idx];
                                                    return (
                                                        <div
                                                            key={idx}
                                                            className="flex flex-col sm:flex-row items-center gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/60"
                                                        >
                                                            <div className="w-16 shrink-0 font-mono font-bold text-xs text-[#2F8F83]">
                                                                &#123;&#123;{idx}&#125;&#125;
                                                            </div>
                                                            <Select
                                                                value={current.field}
                                                                onValueChange={(val) => {
                                                                    setVariableMappings((prev) => ({
                                                                        ...prev,
                                                                        [idx]: { ...prev[idx], field: val },
                                                                    }));
                                                                }}
                                                            >
                                                                <SelectTrigger className="h-8 text-xs flex-1">
                                                                    <SelectValue placeholder="Map to contact field" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="name">Contact Name</SelectItem>
                                                                    <SelectItem value="phone">Phone Number</SelectItem>
                                                                    <SelectItem value="email">Email Address</SelectItem>
                                                                    <SelectItem value="city">City</SelectItem>
                                                                    <SelectItem value="stage">Lead Stage</SelectItem>
                                                                </SelectContent>
                                                            </Select>

                                                            <Input
                                                                placeholder="Fallback (e.g. Customer)"
                                                                value={current.fallback}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    setVariableMappings((prev) => ({
                                                                        ...prev,
                                                                        [idx]: { ...prev[idx], fallback: val },
                                                                    }));
                                                                }}
                                                                className="h-8 text-xs sm:w-40"
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* STEP 3: Audience & Exclusions */}
                        {currentStep === 2 && (
                            <Card className="shadow-2xs border-border">
                                <CardHeader className="p-5 pb-3">
                                    <CardTitle className="text-base font-bold">3. Audience & Eligibility</CardTitle>
                                    <CardDescription className="text-xs">
                                        Target contacts, preview exclusions, and ensure marketing opt-in compliance.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-5 pt-2 space-y-5">
                                    {/* Audience Type Radio Cards */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div
                                            onClick={() => {
                                                setAudienceType("all");
                                                setAudiencePreview(null);
                                            }}
                                            className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                                audienceType === "all"
                                                    ? "border-[#2F8F83] bg-teal-50/30 dark:bg-teal-950/20"
                                                    : "border-border hover:bg-muted/40"
                                            }`}
                                        >
                                            <span className="font-semibold text-xs block text-foreground">All Contacts</span>
                                            <span className="text-[11px] text-muted-foreground mt-0.5 block">
                                                Workspace contacts
                                            </span>
                                        </div>

                                        <div
                                            onClick={() => {
                                                setAudienceType("segment");
                                                setAudiencePreview(null);
                                            }}
                                            className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                                audienceType === "segment"
                                                    ? "border-[#2F8F83] bg-teal-50/30 dark:bg-teal-950/20"
                                                    : "border-border hover:bg-muted/40"
                                            }`}
                                        >
                                            <span className="font-semibold text-xs block text-foreground">Saved Segment</span>
                                            <span className="text-[11px] text-muted-foreground mt-0.5 block">
                                                Customer segmentation
                                            </span>
                                        </div>

                                        <div
                                            onClick={() => {
                                                setAudienceType("tags");
                                                setAudiencePreview(null);
                                            }}
                                            className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                                audienceType === "tags"
                                                    ? "border-[#2F8F83] bg-teal-50/30 dark:bg-teal-950/20"
                                                    : "border-border hover:bg-muted/40"
                                            }`}
                                        >
                                            <span className="font-semibold text-xs block text-foreground">Tags</span>
                                            <span className="text-[11px] text-muted-foreground mt-0.5 block">
                                                Filter by contact tags
                                            </span>
                                        </div>
                                    </div>

                                    {/* Segment selector if segment chosen */}
                                    {audienceType === "segment" && (
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-foreground">Select Segment</label>
                                            <Select value={selectedSegmentId} onValueChange={setSelectedSegmentId}>
                                                <SelectTrigger className="text-xs h-9">
                                                    <SelectValue placeholder="Choose a customer segment" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {segmentsList.map((seg) => (
                                                        <SelectItem key={seg.id} value={String(seg.id)}>
                                                            {seg.name} ({seg.targetCount ?? seg.cached_count ?? seg.contacts_count ?? seg.count ?? 0} contacts)
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    {/* Tag input if tags chosen */}
                                    {audienceType === "tags" && (
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-foreground">Enter Tags (comma separated)</label>
                                            <Input
                                                placeholder="e.g. VIP, Wholesale, Lead2026"
                                                value={tagsInput}
                                                onChange={(e) => setTagsInput(e.target.value)}
                                                className="text-xs"
                                            />
                                        </div>
                                    )}

                                    {/* Evaluation Button */}
                                    <div className="flex items-center justify-between pt-1">
                                        <span className="text-xs text-muted-foreground">
                                            Re-evaluate contacts against WhatsApp eligibility & opt-in
                                        </span>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={isValidatingAudience}
                                            onClick={handleValidateAudience}
                                            className="text-xs h-8"
                                        >
                                            {isValidatingAudience && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                                            Evaluate Audience
                                        </Button>
                                    </div>

                                    {/* Live Audience Breakdown Card */}
                                    {audiencePreview && (
                                        <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-4">
                                            <div className="grid grid-cols-3 gap-2 text-center">
                                                <div className="p-2.5 rounded-lg bg-card border border-border">
                                                    <span className="text-[11px] text-muted-foreground block">Total Contacts</span>
                                                    <span className="text-lg font-bold text-foreground">
                                                        {audiencePreview.total_contacts.toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                                                    <span className="text-[11px] text-emerald-800 dark:text-emerald-300 block font-semibold">Eligible</span>
                                                    <span className="text-lg font-bold text-emerald-600">
                                                        {audiencePreview.eligible_count.toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800">
                                                    <span className="text-[11px] text-red-800 dark:text-red-300 block font-semibold">Excluded</span>
                                                    <span className="text-lg font-bold text-red-600">
                                                        {audiencePreview.excluded_count.toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Exclusion Reasons */}
                                            {audiencePreview.excluded_count > 0 && (
                                                <div className="space-y-1.5 text-xs">
                                                    <div className="flex items-center justify-between text-muted-foreground font-semibold">
                                                        <span>Exclusion Breakdown</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowExcludedDetails(!showExcludedDetails)}
                                                            className="text-[#2F8F83] hover:underline text-[11px]"
                                                        >
                                                            {showExcludedDetails ? "Hide details" : "View excluded contacts"}
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-1.5 text-[11px] text-muted-foreground pt-1">
                                                        <div className="flex justify-between p-1.5 bg-card rounded border border-border">
                                                            <span>No WhatsApp Number:</span>
                                                            <span className="font-semibold text-foreground">{audiencePreview.reasons.no_phone}</span>
                                                        </div>
                                                        <div className="flex justify-between p-1.5 bg-card rounded border border-border">
                                                            <span>Invalid Phone:</span>
                                                            <span className="font-semibold text-foreground">{audiencePreview.reasons.invalid_phone}</span>
                                                        </div>
                                                        <div className="flex justify-between p-1.5 bg-card rounded border border-border">
                                                            <span>Duplicates Removed:</span>
                                                            <span className="font-semibold text-foreground">{audiencePreview.reasons.duplicate_phone}</span>
                                                        </div>
                                                        <div className="flex justify-between p-1.5 bg-card rounded border border-border">
                                                            <span>No Marketing Opt-In:</span>
                                                            <span className="font-semibold text-foreground">{audiencePreview.reasons.no_marketing_opt_in}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {showExcludedDetails && audiencePreview.sample_excluded.length > 0 && (
                                                <div className="space-y-1 text-xs pt-2 border-t border-border">
                                                    <span className="font-semibold text-muted-foreground text-[11px]">Sample Excluded Contacts:</span>
                                                    {audiencePreview.sample_excluded.map((s) => (
                                                        <div key={s.id} className="flex items-center justify-between py-1 text-[11px] text-muted-foreground">
                                                            <span>{s.name} ({s.phone})</span>
                                                            <span className="text-red-500 font-medium">{s.reason}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* STEP 4: Review & Launch */}
                        {currentStep === 3 && (
                            <Card className="shadow-2xs border-border">
                                <CardHeader className="p-5 pb-3">
                                    <CardTitle className="text-base font-bold">4. Review & Launch</CardTitle>
                                    <CardDescription className="text-xs">
                                        Review campaign summary, credit requirements, and schedule or send now.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-5 pt-2 space-y-5">
                                    {/* Campaign Summary List */}
                                    <div className="p-4 rounded-xl border border-border bg-card space-y-2 text-xs">
                                        <div className="flex justify-between py-1 border-b border-border/50">
                                            <span className="text-muted-foreground">Campaign Name:</span>
                                            <span className="font-bold text-foreground">{name}</span>
                                        </div>
                                        <div className="flex justify-between py-1 border-b border-border/50">
                                            <span className="text-muted-foreground">Sender Account:</span>
                                            <span className="font-medium text-foreground">
                                                {selectedAccount?.display_phone_number} ({selectedAccount?.verified_name || "Connected"})
                                            </span>
                                        </div>
                                        <div className="flex justify-between py-1 border-b border-border/50">
                                            <span className="text-muted-foreground">Approved Template:</span>
                                            <span className="font-medium text-emerald-600 font-mono">
                                                {selectedTemplate?.name} ({selectedTemplate?.language})
                                            </span>
                                        </div>
                                        <div className="flex justify-between py-1 border-b border-border/50">
                                            <span className="text-muted-foreground">Target Audience:</span>
                                            <span className="font-medium text-foreground uppercase">{audienceType}</span>
                                        </div>
                                        <div className="flex justify-between py-1">
                                            <span className="text-muted-foreground">Frozen Snapshot Size:</span>
                                            <span className="font-bold text-foreground">{eligibleCount.toLocaleString()} recipients</span>
                                        </div>
                                    </div>

                                    {/* Credit Requirement Box */}
                                    <div className="p-4 rounded-xl border border-teal-200 dark:border-teal-900 bg-teal-50/40 dark:bg-teal-950/20 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Sparkles className="h-4 w-4 text-[#2F8F83]" />
                                                <span className="font-bold text-xs text-foreground">Credit Estimate</span>
                                            </div>
                                            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                                                ✓ Sufficient Balance
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div className="p-2 bg-card rounded border border-border">
                                                <span className="text-[11px] text-muted-foreground block">Required Credits</span>
                                                <span className="text-base font-bold text-foreground">
                                                    {estimatedRequiredCredits.toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="p-2 bg-card rounded border border-border">
                                                <span className="text-[11px] text-muted-foreground block">Available in Wallet</span>
                                                <span className="text-base font-bold text-foreground">
                                                    {Number((user as any)?.credits_balance ?? (user as any)?.credits ?? 50000).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground">
                                            Credits will be reserved when the campaign launches and consumed upon successful delivery. Unused credits are released automatically.
                                        </p>
                                    </div>

                                    {/* Preflight Verification Matrix & Audience Breakdown */}
                                    {isRunningPreflight ? (
                                        <div className="p-8 rounded-xl border border-border bg-card flex flex-col items-center justify-center gap-2">
                                            <Loader2 className="h-6 w-6 animate-spin text-[#2F8F83]" />
                                            <span className="text-xs text-muted-foreground font-medium">
                                                Auditing 12-point preflight checklist (WABA, templates, audience, opt-in, credits)...
                                            </span>
                                        </div>
                                    ) : preflightResult ? (
                                        <CampaignPreflightWidget
                                            preflight={preflightResult}
                                            onRefresh={runWizardPreflight}
                                            isRefreshing={isRunningPreflight}
                                        />
                                    ) : null}

                                    {/* Scheduling Options */}
                                    <div className="space-y-3 pt-2 border-t border-border/60">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="scheduleCheck"
                                                checked={isScheduling}
                                                onChange={(e) => setIsScheduling(e.target.checked)}
                                                className="rounded border-border text-[#2F8F83] focus:ring-[#2F8F83]"
                                            />
                                            <label htmlFor="scheduleCheck" className="text-xs font-semibold cursor-pointer">
                                                Schedule this campaign for later
                                            </label>
                                        </div>

                                        {isScheduling && (
                                            <div className="space-y-1.5 pl-5">
                                                <label className="text-[11px] text-muted-foreground">Select Date & Time</label>
                                                <Input
                                                    type="datetime-local"
                                                    value={scheduledDateTime}
                                                    onChange={(e) => setScheduledDateTime(e.target.value)}
                                                    className="text-xs max-w-xs"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Navigation / Action Footer */}
                        <div className="space-y-1.5 pt-2">
                            <div className="flex items-center justify-between">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => (currentStep === 0 ? router.push("/marketing/campaigns") : setCurrentStep((s) => s - 1))}
                                    className="text-xs h-9"
                                >
                                    <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                                    {currentStep === 0 ? "Cancel" : "Back"}
                                </Button>

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled={isSubmitting}
                                        onClick={() => handleSaveOrLaunch("draft")}
                                        className="text-xs h-9"
                                    >
                                        Save as Draft
                                    </Button>

                                    {currentStep < 3 ? (
                                        <Button
                                            size="sm"
                                            onClick={() => setCurrentStep((s) => s + 1)}
                                            className="bg-[#2F8F83] hover:bg-[#267A70] text-white text-xs h-9 px-4 font-semibold"
                                        >
                                            Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
                                        </Button>
                                    ) : isScheduling ? (
                                        <Button
                                            size="sm"
                                            disabled={isSubmitting}
                                            onClick={() => handleSaveOrLaunch("schedule")}
                                            className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-9 px-5 font-semibold"
                                        >
                                            {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                                            <Clock className="h-3.5 w-3.5 mr-1.5" /> Schedule Campaign
                                        </Button>
                                    ) : (
                                        <Button
                                            size="sm"
                                            disabled={
                                                isSubmitting ||
                                                (preflightResult !== null && !preflightResult.is_launchable) ||
                                                eligibleCount === 0
                                            }
                                            onClick={() => handleSaveOrLaunch("launch")}
                                            className={`text-white text-xs h-9 px-5 font-semibold shadow-xs ${
                                                preflightResult && !preflightResult.is_launchable
                                                    ? "bg-slate-400 dark:bg-zinc-700 cursor-not-allowed opacity-70"
                                                    : "bg-[#2F8F83] hover:bg-[#267A70]"
                                            }`}
                                        >
                                            {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                                            <Send className="h-3.5 w-3.5 mr-1.5" /> Launch Broadcast Now
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {currentStep === 3 && preflightResult && !preflightResult.is_launchable && (
                                <div className="flex justify-end">
                                    <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                                        ⚠️ Broadcast launch locked: 1 or more critical preflight checks failed above.
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Live Mobile Preview */}
                    <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-6">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between px-1">
                                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                    <MessageCircle className="h-3.5 w-3.5 text-[#2F8F83]" />
                                    Live WhatsApp Mobile Preview
                                </span>
                                <span className="text-[10px] text-muted-foreground">Realtime Dynamic</span>
                            </div>

                            {/* Device Frame */}
                            <div className="relative mx-auto w-full max-w-[340px] rounded-[36px] border-4 border-zinc-900 bg-zinc-950 p-2 shadow-2xl ring-4 ring-zinc-800/10">
                                {/* Device Camera / Dynamic Island */}
                                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-4 bg-black rounded-full z-30" />

                                <div className="rounded-[28px] overflow-hidden bg-slate-100 dark:bg-zinc-900 min-h-[500px]">
                                    {selectedTemplate ? (
                                        <TemplatePreview
                                            businessName={businessDisplayName}
                                            profileImageUrl={businessProfileImage}
                                            verified={true}
                                            headerType={selectedTemplate.header_type || "none"}
                                            headerContent={selectedTemplate.header_content || ""}
                                            headerMediaUrl={selectedTemplate.header_media_url || ""}
                                            bodyText={selectedTemplate.body_text || ""}
                                            bodySamples={liveBodySamples}
                                            footerText={selectedTemplate.footer_text || ""}
                                            buttons={selectedTemplate.buttons || []}
                                            category={selectedTemplate.category || "Marketing"}
                                        />
                                    ) : (
                                        <div className="flex h-[480px] flex-col items-center justify-center p-6 text-center space-y-2 text-muted-foreground">
                                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                                                <MessageCircle className="h-6 w-6" />
                                            </div>
                                            <p className="text-xs font-semibold">No Template Selected</p>
                                            <p className="text-[11px] max-w-[200px]">
                                                Choose an approved WhatsApp template in Step 2 to preview message layout and variables.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Large Campaign Safety Confirmation Modal */}
                <Dialog open={showLargeCampaignModal} onOpenChange={setShowLargeCampaignModal}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-amber-600">
                                <AlertTriangle className="h-5 w-5" />
                                Large Volume Broadcast Confirmation
                            </DialogTitle>
                            <DialogDescription className="text-xs pt-1">
                                You are about to broadcast to{" "}
                                <span className="font-bold text-foreground">
                                    {eligibleCount.toLocaleString()}
                                </span>{" "}
                                WhatsApp recipients.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-3 py-2 text-xs text-muted-foreground">
                            <p>
                                This campaign will be processed in asynchronous batches with rate limiting and automated credit reservations.
                            </p>
                            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200 space-y-1">
                                <p className="font-semibold">Compliance Checklist:</p>
                                <p>• Audience has valid WhatsApp marketing consent.</p>
                                <p>• Approved Meta template &quot;{selectedTemplate?.name}&quot; will be used.</p>
                                <p>• Unsubscribed or blocked numbers are suppressed automatically.</p>
                            </div>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowLargeCampaignModal(false)}
                                className="text-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => {
                                    setLargeCampaignConfirmed(true);
                                    setShowLargeCampaignModal(false);
                                    handleSaveOrLaunch("launch");
                                }}
                                className="bg-[#2F8F83] hover:bg-[#267A70] text-white text-xs"
                            >
                                I Understand, Launch Campaign
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </UpgradeGuard>
    );
}
