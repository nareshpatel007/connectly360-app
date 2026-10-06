"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, ChevronRight, Loader2, ArrowLeft, Radio, FileText, Users, Send, Mail, MessageSquare, MessageCircle, Megaphone, Smartphone, Wifi, Battery, Signal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useListTemplates, useListCustomers, useCreateCampaign, useSendCampaign, MessageTemplate } from "@/lib/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { UpgradeGuard } from "@/components/upgrade-guard";
import { PageHeader } from "@/components/page-header";
import { CampaignCreditConfirmDialog } from "@/components/campaign-credit-confirm-dialog";

// ─────────────────────────────────────────────────────────
// Step types
// ─────────────────────────────────────────────────────────

const STEPS = [
    { key: "channel", label: "Channel", icon: Megaphone },
    { key: "content", label: "Content", icon: FileText },
    { key: "audience", label: "Audience", icon: Users },
    { key: "review", label: "Review & Send", icon: Send },
] as const;

type CampaignType = "whatsapp" | "email" | "sms";
type AudienceType = "all" | "contacts";

interface WizardState {
    type: CampaignType;
    name: string;
    template: MessageTemplate | null;
    emailSubject: string;
    emailBody: string;
    smsBody: string;
    audienceType: AudienceType;
}

// ─────────────────────────────────────────────────────────
// Sub-components: Device Mockup Preview (The Wow Factor)
// ─────────────────────────────────────────────────────────

function DevicePreview({ state }: { state: WizardState }) {
    return (
        <div className="relative mx-auto w-[260px] h-[500px] rounded-[40px] border-2 border-zinc-900 bg-zinc-950 shadow-2xl flex flex-col overflow-hidden select-none ring-4 ring-zinc-800/10">
            {/* Dynamic Island / Notch */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-20 h-4.5 bg-black rounded-full z-30 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-900 ml-auto mr-1.5 opacity-40" />
            </div>

            {/* Side Buttons (Simulated volume / power notches) */}
            <div className="absolute left-[-10px] top-16 w-[3px] h-10 bg-zinc-700 rounded-r-md z-0" />
            <div className="absolute left-[-10px] top-28 w-[3px] h-10 bg-zinc-700 rounded-r-md z-0" />
            <div className="absolute right-[-10px] top-20 w-[3px] h-14 bg-zinc-700 rounded-l-md z-0" />

            {/* Screen Content */}
            <div className="flex-1 bg-zinc-100 dark:bg-zinc-900 rounded-[30px] overflow-hidden flex flex-col relative text-xs">
                {/* iOS Status Bar */}
                <div className="h-7 pt-2 px-6 flex items-center justify-between text-[9px] font-bold text-zinc-900 dark:text-zinc-100 z-20 bg-white dark:bg-zinc-800 shrink-0">
                    <span>9:41</span>
                    <div className="flex items-center gap-1.5">
                        <Signal className="h-2.5 w-2.5" />
                        <Wifi className="h-2.5 w-2.5" />
                        <Battery className="h-3 w-3" />
                    </div>
                </div>

                {/* Simulated App Header */}
                <div className="bg-white dark:bg-zinc-800 px-3 py-2.5 border-b border-zinc-200/60 dark:border-zinc-700/60 flex items-center gap-1.5 shrink-0 z-10">
                    {state.type === "whatsapp" && (
                        <>
                            <div className="w-5.5 h-5.5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[9px] font-bold shrink-0">W</div>
                            <div className="min-w-0">
                                <p className="font-bold truncate text-[10px] text-zinc-800 dark:text-zinc-100">WhatsApp Broadcast</p>
                                <p className="text-[8px] text-emerald-500 font-medium">Online</p>
                            </div>
                        </>
                    )}
                    {state.type === "email" && (
                        <>
                            <div className="w-5.5 h-5.5 rounded-full bg-blue-500 flex items-center justify-center text-white text-[9px] font-bold shrink-0">E</div>
                            <div className="min-w-0">
                                <p className="font-bold truncate text-[10px] text-zinc-800 dark:text-zinc-100">Mail App</p>
                                <p className="text-[8px] text-zinc-400 truncate">Inbox</p>
                            </div>
                        </>
                    )}
                    {state.type === "sms" && (
                        <>
                            <div className="w-5.5 h-5.5 rounded-full bg-amber-500 flex items-center justify-center text-white text-[9px] font-bold shrink-0">S</div>
                            <div className="min-w-0">
                                <p className="font-bold truncate text-[10px] text-zinc-800 dark:text-zinc-100">Messages</p>
                                <p className="text-[8px] text-zinc-400">SMS Channel</p>
                            </div>
                        </>
                    )}
                </div>

                {/* Device Screen Body */}
                <div className="flex-1 p-3 pb-6 overflow-y-auto space-y-3 flex flex-col justify-end bg-[#ECE5DD] dark:bg-zinc-950 relative">
                    {state.type === "whatsapp" && (
                        <div className="bg-white dark:bg-zinc-800 rounded-lg p-2.5 shadow-sm max-w-[85%] self-start relative border-l-4 border-emerald-500 text-zinc-850 dark:text-zinc-200">
                            <p className="leading-normal whitespace-pre-wrap">
                                {state.template?.body_text || "Select a template to preview message content..."}
                            </p>
                            <span className="text-[8px] text-zinc-400 float-right mt-1">10:42 AM</span>
                        </div>
                    )}

                    {state.type === "email" && (
                        <div className="bg-white dark:bg-zinc-900 rounded-lg p-3 shadow-md max-w-full w-full self-start flex flex-col h-full overflow-y-auto text-zinc-800 dark:text-zinc-200">
                            <p className="font-bold border-b border-zinc-100 dark:border-zinc-800 pb-1.5 mb-1.5 text-zinc-900 dark:text-zinc-100 text-[10px] truncate">
                                Subject: {state.emailSubject || "(Empty Subject)"}
                            </p>
                            <p className="leading-relaxed whitespace-pre-wrap flex-1 text-[9px] text-zinc-650 dark:text-zinc-400">
                                {state.emailBody || "Compose email content to preview..."}
                            </p>
                        </div>
                    )}

                    {state.type === "sms" && (
                        <div className="bg-zinc-200 dark:bg-zinc-800 rounded-2xl px-3 py-2 shadow-sm max-w-[85%] self-start relative text-zinc-800 dark:text-zinc-200">
                            <p className="leading-normal whitespace-pre-wrap">
                                {state.smsBody || "Write SMS content to preview..."}
                            </p>
                            <span className="text-[8px] text-zinc-400 block text-right mt-0.5">10:42 AM</span>
                        </div>
                    )}

                    {/* iOS Home Indicator Bar */}
                    <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-24 h-1 bg-zinc-400 dark:bg-zinc-600 rounded-full z-20 pointer-events-none" />
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────
// Step components
// ─────────────────────────────────────────────────────────

function StepChooseChannel({
    name,
    type,
    onNameChange,
    onTypeChange,
}: {
    name: string;
    type: CampaignType;
    onNameChange: (v: string) => void;
    onTypeChange: (v: CampaignType) => void;
}) {
    return (
        <div className="space-y-6">
            <div className="relative">
                <h2 className="text-xl font-bold text-foreground">Campaign Settings</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Describe your broadcast and choose the preferred delivery protocol.
                </p>
                <div className="absolute top-0 right-0 h-1.5 w-12 rounded bg-gradient-to-r from-[#35877D] to-teal-400" />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground/80">Campaign Display Name</label>
                <input
                    className="w-full rounded-xl border border-border bg-background/50 px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#35877D]/30 focus:border-[#35877D]"
                    placeholder="e.g. VIP Member Summer Discount"
                    value={name}
                    onChange={(e) => onNameChange(e.target.value)}
                />
            </div>

            <div className="space-y-3">
                <label className="text-sm font-semibold text-foreground/80">Broadcast Channel</label>
                <div className="grid gap-4 sm:grid-cols-3">
                    {(
                        [
                            {
                                key: "whatsapp" as const,
                                label: "WhatsApp Broadcast",
                                desc: "Send Meta-approved templates",
                                icon: MessageCircle,
                                color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-900/30",
                                shadow: "hover:shadow-emerald-500/5",
                            },
                            {
                                key: "email" as const,
                                label: "Email Newsletter",
                                desc: "Send custom newsletter & HTML emails",
                                icon: Mail,
                                color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-900/30",
                                shadow: "hover:shadow-blue-500/5",
                            },
                            {
                                key: "sms" as const,
                                label: "SMS Broadcast",
                                desc: "Send carrier SMS messages",
                                icon: MessageSquare,
                                color: "text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-900/30",
                                shadow: "hover:shadow-amber-500/5",
                            },
                        ] as const
                    ).map((c) => {
                        const Icon = c.icon;
                        const isSelected = type === c.key;
                        return (
                            <button
                                key={c.key}
                                onClick={() => onTypeChange(c.key)}
                                className={`flex flex-col items-start rounded-2xl border p-5 text-left transition-all duration-300 hover:scale-[1.02] ${c.shadow} ${isSelected
                                    ? "border-[#35877D] bg-gradient-to-br from-[#35877D]/10 to-teal-500/5 dark:to-transparent ring-2 ring-[#35877D]/30 shadow-lg"
                                    : "border-border bg-card"
                                    }`}
                            >
                                <span className={`p-2.5 rounded-xl ${c.color} mb-4`}>
                                    <Icon className="h-5 w-5" />
                                </span>
                                <div className="flex w-full items-start justify-between">
                                    <div className="space-y-1">
                                        <p className="font-bold text-sm text-foreground">{c.label}</p>
                                        <p className="text-xs text-muted-foreground leading-normal">{c.desc}</p>
                                    </div>
                                    {isSelected && (
                                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#35877D] shadow-sm">
                                            <Check className="h-3 w-3 text-white" />
                                        </span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function StepChooseTemplate({
    selected,
    onSelect,
}: {
    selected: MessageTemplate | null;
    onSelect: (t: MessageTemplate) => void;
}) {
    const { data: templates = [], isLoading } = useListTemplates();
    const [search, setSearch] = useState("");

    const filtered = templates.filter(
        (t) =>
            t.status === "approved" &&
            (t.name.toLowerCase().includes(search.toLowerCase()) ||
                t.body_text?.toLowerCase().includes(search.toLowerCase())),
    );

    if (isLoading) {
        return (
            <div className="flex h-48 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-[#35877D]" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-lg font-semibold">Choose WhatsApp Template</h2>
                <p className="text-sm text-muted-foreground">
                    Select an approved WhatsApp message template from your Meta account.
                </p>
            </div>
            <input
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#35877D]/30 focus:border-[#35877D]"
                placeholder="Search templates…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
            {filtered.length === 0 ? (
                <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-muted-foreground">
                    <Radio className="h-8 w-8" />
                    <p className="text-sm">No approved templates found.</p>
                </div>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                    {filtered.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => onSelect(t)}
                            className={`rounded-2xl border p-4 text-left transition-all duration-300 hover:border-[#35877D]/60 hover:shadow-md ${selected?.id === t.id
                                ? "border-[#35877D] bg-gradient-to-br from-[#35877D]/5 to-transparent ring-2 ring-[#35877D]/30"
                                : "border-border bg-card"
                                }`}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="truncate font-bold text-sm text-foreground">{t.name}</p>
                                    <p className="mt-0.5 text-xs text-muted-foreground capitalize">{t.category} · {t.language}</p>
                                </div>
                                {selected?.id === t.id && (
                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#35877D]">
                                        <Check className="h-3 w-3 text-white" />
                                    </span>
                                )}
                            </div>
                            <p className="mt-3 line-clamp-3 text-xs text-muted-foreground leading-relaxed">{t.body_text}</p>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function StepDetailsAndContent({
    state,
    onChange,
}: {
    state: WizardState;
    onChange: (updates: Partial<WizardState>) => void;
}) {
    if (state.type === "whatsapp") {
        return (
            <StepChooseTemplate
                selected={state.template}
                onSelect={(t) => onChange({ template: t })}
            />
        );
    }

    if (state.type === "email") {
        return (
            <div className="space-y-4">
                <div>
                    <h2 className="text-lg font-bold text-foreground">Email Content</h2>
                    <p className="text-sm text-muted-foreground">
                        Compose the subject and body of your broadcast email.
                    </p>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground/80">Email Subject</label>
                    <input
                        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#35877D]/30 focus:border-[#35877D]"
                        placeholder="Enter email subject line"
                        value={state.emailSubject}
                        onChange={(e) => onChange({ emailSubject: e.target.value })}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground/80">Email Body (HTML/Text)</label>
                    <textarea
                        className="w-full min-h-[220px] rounded-xl border border-border bg-background px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#35877D]/30 focus:border-[#35877D]"
                        placeholder="Write your email message here..."
                        value={state.emailBody}
                        onChange={(e) => onChange({ emailBody: e.target.value })}
                    />
                </div>
            </div>
        );
    }

    // SMS Campaign Content
    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-lg font-bold text-foreground">SMS Content</h2>
                <p className="text-sm text-muted-foreground">
                    Compose the plain text SMS message body. Keep it concise.
                </p>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground/80">SMS Message Body</label>
                <textarea
                    className="w-full min-h-[180px] rounded-xl border border-border bg-background px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#35877D]/30 focus:border-[#35877D]"
                    placeholder="Enter your plain text SMS body"
                    value={state.smsBody}
                    onChange={(e) => onChange({ smsBody: e.target.value })}
                />
                <div className="flex items-center justify-between mt-1 px-1">
                    {/* SMS Length Bar */}
                    <div className="flex-1 max-w-[150px] h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden mr-3">
                        <div
                            className={`h-full transition-all duration-300 ${state.smsBody.length > 160 ? "bg-red-500" : state.smsBody.length > 100 ? "bg-amber-500" : "bg-emerald-500"
                                }`}
                            style={{ width: `${Math.min(100, (state.smsBody.length / 160) * 100)}%` }}
                        />
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums">
                        {state.smsBody.length} / 160 chars
                    </span>
                </div>
            </div>
        </div>
    );
}

function StepSelectAudience({
    audienceType,
    onAudienceChange,
}: {
    audienceType: AudienceType;
    onAudienceChange: (v: AudienceType) => void;
}) {
    const { data: customers = [] } = useListCustomers();

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-bold text-foreground">Target Audience</h2>
                <p className="text-sm text-muted-foreground">Select the list segment to receive this campaign broadcast.</p>
            </div>

            <div className="space-y-2">
                <div className="grid gap-4 sm:grid-cols-2">
                    {(
                        [
                            { type: "all" as const, label: "All Contacts", desc: `Send to all ${customers.length} contacts on file` },
                            { type: "contacts" as const, label: "Smart List Segments", desc: "Advanced segment filters (coming soon)" },
                        ] as const
                    ).map(({ type, label, desc }) => (
                        <button
                            key={type}
                            onClick={() => onAudienceChange(type)}
                            className={`rounded-2xl border p-5 text-left transition-all duration-300 hover:scale-[1.01] ${audienceType === type
                                ? "border-[#35877D] bg-gradient-to-br from-[#35877D]/10 to-teal-500/5 dark:to-transparent ring-2 ring-[#35877D]/30 shadow-lg"
                                : "border-border bg-card"
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <p className="font-bold text-sm text-foreground">{label}</p>
                                    <p className="text-xs text-muted-foreground leading-normal">{desc}</p>
                                </div>
                                {audienceType === type && (
                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#35877D]">
                                        <Check className="h-3 w-3 text-white" />
                                    </span>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

function StepReview({
    state,
    isProcessing,
}: {
    state: WizardState;
    isProcessing: boolean;
}) {
    const { data: customers = [] } = useListCustomers();

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-bold text-foreground">Review Details</h2>
                <p className="text-sm text-muted-foreground">Confirm settings and message preview before launch.</p>
            </div>

            <Card className="border border-border shadow-md rounded-2xl overflow-hidden">
                <CardContent className="pt-4 divide-y divide-border space-y-4">
                    <Row label="Campaign Name" value={<span className="font-semibold text-foreground">{state.name}</span>} />
                    <Row label="Delivery Channel" value={
                        <span className="inline-flex items-center gap-1.5 capitalize rounded-md bg-muted px-2.5 py-0.5 text-xs font-semibold text-foreground border border-border">
                            {state.type}
                        </span>
                    } />
                    {state.type === "whatsapp" && (
                        <>
                            <Row label="Meta Template" value={state.template?.name ?? <span className="text-muted-foreground italic">Not selected</span>} />
                            <Row label="Language" value={state.template?.language ?? "—"} />
                        </>
                    )}
                    {state.type === "email" && (
                        <Row label="Subject Line" value={state.emailSubject || <span className="text-muted-foreground italic">Not set</span>} />
                    )}
                    <Row label="Audience Size" value={
                        <span className="font-bold text-foreground tabular-nums">
                            {state.audienceType === "all" ? `${customers.length} contacts` : "Selected contacts"}
                        </span>
                    } />
                </CardContent>
            </Card>

            {isProcessing && (
                <div className="flex items-center gap-2.5 text-sm text-[#35877D] bg-[#35877D]/10 p-4 rounded-xl border border-[#35877D]/20">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="font-medium">Launching campaign immediately... please keep this window open.</span>
                </div>
            )}
        </div>
    );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-4 text-sm pt-3 first:pt-0">
            <span className="text-muted-foreground shrink-0">{label}</span>
            <span className="font-medium text-right text-foreground">{value}</span>
        </div>
    );
}

// ─────────────────────────────────────────────────────────
// Wizard Page
// ─────────────────────────────────────────────────────────

export default function NewCampaignPage() {
    const router = useRouter();
    const queryClient = useQueryClient();

    const createCampaign = useCreateCampaign();
    const sendCampaign = useSendCampaign();

    const [step, setStep] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showCreditConfirm, setShowCreditConfirm] = useState(false);
    const { data: customers = [] } = useListCustomers();
    const recipientCount = customers.length || 1;
    const [state, setState] = useState<WizardState>({
        type: "whatsapp",
        name: "",
        template: null,
        emailSubject: "",
        emailBody: "",
        smsBody: "",
        audienceType: "all",
    });

    const canProceed = [
        !!state.name.trim(), // Step 0: Name and type selection
        state.type === "whatsapp" ? !!state.template : (state.type === "email" ? (!!state.emailSubject.trim() && !!state.emailBody.trim()) : !!state.smsBody.trim()), // Step 1: Content configuration
        true, // Step 2: Audience
        true, // Step 3: Review
    ][step];

    async function handleSend() {
        if (!state.name.trim()) {
            toast.error("Please enter a campaign name.");
            return;
        }
        setIsProcessing(true);
        try {
            let templateName = "";
            let templateVariables: Record<string, any> = {};

            if (state.type === "whatsapp") {
                if (!state.template) throw new Error("Template not selected");
                templateName = state.template.name;
            } else if (state.type === "email") {
                templateName = "email";
                templateVariables = {
                    subject: state.emailSubject.trim(),
                    body: state.emailBody.trim(),
                };
            } else {
                templateName = "sms";
                templateVariables = {
                    body: state.smsBody.trim(),
                };
            }

            const campaign = await createCampaign.mutateAsync({
                data: {
                    name: state.name.trim(),
                    template_name: templateName,
                    template_language: state.template?.language ?? "en",
                    template_variables: templateVariables,
                    audience_filter: { type: state.audienceType },
                    status: "draft",
                },
            });

            const result = await sendCampaign.mutateAsync({ id: campaign.id });
            toast.success(`🎉 Campaign sent! ${result.sent_count} messages delivered.`);
            queryClient.invalidateQueries({ queryKey: ["listCampaigns"] });
            queryClient.invalidateQueries({ queryKey: ["campaignStats"] });
            router.push(`/marketing/campaigns/${campaign.id}`);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to send campaign");
        } finally {
            setIsProcessing(false);
        }
    }

    async function handleSaveDraft() {
        if (!state.name.trim()) {
            toast.error("Please enter a campaign name.");
            return;
        }
        try {
            let templateName = "";
            let templateVariables: Record<string, any> = {};

            if (state.type === "whatsapp") {
                if (!state.template) throw new Error("Template not selected");
                templateName = state.template.name;
            } else if (state.type === "email") {
                templateName = "email";
                templateVariables = {
                    subject: state.emailSubject.trim(),
                    body: state.emailBody.trim(),
                };
            } else {
                templateName = "sms";
                templateVariables = {
                    body: state.smsBody.trim(),
                };
            }

            const campaign = await createCampaign.mutateAsync({
                data: {
                    name: state.name.trim(),
                    template_name: templateName,
                    template_language: state.template?.language ?? "en",
                    template_variables: templateVariables,
                    audience_filter: { type: state.audienceType },
                    status: "draft",
                },
            });
            toast.success("Draft saved");
            queryClient.invalidateQueries({ queryKey: ["listCampaigns"] });
            router.push(`/marketing/campaigns/${campaign.id}`);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to save draft");
        }
    }

    return (
        <UpgradeGuard
            allowedPlans={["business", "enterprise"]}
            featureName="Bulk Campaigns"
            description="Send broadcast campaigns, target user segments, and schedule bulk notifications to your lists."
        >
            <div className="w-full space-y-6 pb-10">
                {/* Page Header */}
                <PageHeader
                    icon={Megaphone}
                    title="Create Broadcast"
                    description="Design, target, and launch bulk message broadcasts."
                    breadcrumbs={[
                        { label: "Engagement" },
                        { label: "Campaigns", href: "/marketing/campaigns" },
                        { label: "New Campaign" },
                    ]}
                />

                {/* Two Column Layout utilizing left and right space */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                    {/* Left Side: Wizard Forms */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Step Indicator */}
                        <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-sm">
                            {STEPS.map((s, index) => {
                                const isActive = index === step;
                                const isCompleted = index < step;
                                const Icon = s.icon;
                                return (
                                    <div key={s.key} className="flex flex-1 items-center last:flex-initial">
                                        <div className="flex items-center gap-2.5">
                                            <div
                                                className={`flex h-10 w-10 items-center justify-center rounded-xl text-xs font-bold transition-all duration-300 ${isCompleted
                                                    ? "bg-[#35877D] text-white shadow-md shadow-[#35877D]/25"
                                                    : isActive
                                                        ? "border-2 border-[#35877D] bg-[#35877D]/10 text-[#35877D] shadow-sm shadow-[#35877D]/10"
                                                        : "border border-border bg-background text-muted-foreground"
                                                    }`}
                                            >
                                                {isCompleted ? <Check className="h-4.5 w-4.5" /> : <Icon className="h-4.5 w-4.5" />}
                                            </div>
                                            <span
                                                className={`hidden text-xs sm:text-sm font-bold sm:block ${isActive ? "text-foreground" : isCompleted ? "text-[#35877D]" : "text-muted-foreground"
                                                    }`}
                                            >
                                                {s.label}
                                            </span>
                                        </div>
                                        {index < STEPS.length - 1 && (
                                            <div
                                                className={`mx-3 md:mx-6 h-0.5 flex-1 rounded transition-colors duration-500 ${index < step ? "bg-[#35877D]" : "bg-muted"}`}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Step content wrapper card */}
                        <Card className="border border-border/80 shadow-lg rounded-3xl overflow-hidden bg-card/60 backdrop-blur-md">
                            <CardContent className="p-6 sm:p-8">
                                <div
                                    className="transition-all duration-300 ease-in-out"
                                    style={{ opacity: isProcessing ? 0.6 : 1, pointerEvents: isProcessing ? "none" : "auto" }}
                                >
                                    {step === 0 && (
                                        <StepChooseChannel
                                            name={state.name}
                                            type={state.type}
                                            onNameChange={(v) => setState((s) => ({ ...s, name: v }))}
                                            onTypeChange={(v) => setState((s) => ({ ...s, type: v }))}
                                        />
                                    )}
                                    {step === 1 && (
                                        <StepDetailsAndContent
                                            state={state}
                                            onChange={(updates) => setState((s) => ({ ...s, ...updates }))}
                                        />
                                    )}
                                    {step === 2 && (
                                        <StepSelectAudience
                                            audienceType={state.audienceType}
                                            onAudienceChange={(v) => setState((s) => ({ ...s, audienceType: v }))}
                                        />
                                    )}
                                    {step === 3 && (
                                        <StepReview
                                            state={state}
                                            isProcessing={isProcessing}
                                        />
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Navigation Controls */}
                        <div className="flex items-center justify-between border-t border-border pt-5">
                            <Button
                                variant="outline"
                                onClick={() => (step === 0 ? router.push("/marketing/campaigns") : setStep((s) => s - 1))}
                                disabled={isProcessing}
                                className="border-border rounded-xl shadow-sm font-medium hover:bg-muted"
                            >
                                {step === 0 ? "Cancel" : "Back"}
                            </Button>
                            <div className="flex items-center gap-3">
                                {step === 3 && (
                                    <Button
                                        variant="outline"
                                        onClick={handleSaveDraft}
                                        disabled={isProcessing}
                                        className="border-border rounded-xl shadow-sm font-semibold hover:bg-muted text-foreground"
                                    >
                                        Save Draft
                                    </Button>
                                )}
                                {step < 3 ? (
                                    <Button
                                        className="bg-[#35877D] hover:bg-[#2c6f66] text-white rounded-xl shadow-md font-semibold flex items-center gap-2"
                                        disabled={!canProceed}
                                        onClick={() => setStep((s) => s + 1)}
                                    >
                                        Next <ChevronRight className="h-4 w-4" />
                                    </Button>
                                ) : (
                                    <Button
                                        className="bg-[#35877D] hover:bg-[#2c6f66] text-white rounded-xl shadow-md font-semibold flex items-center gap-2"
                                        disabled={isProcessing || !canProceed}
                                        onClick={() => setShowCreditConfirm(true)}
                                    >
                                        {isProcessing ? (
                                            <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
                                        ) : (
                                            <><Send className="h-4 w-4" /> Launch Campaign</>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Sticky Live Preview */}
                    <div className="lg:col-span-4 lg:sticky lg:top-6">
                        <Card className="border border-border/85 shadow-md rounded-2xl p-5 bg-card/50 backdrop-blur-sm flex flex-col items-center justify-center min-h-[500px]">
                            <p className="text-xs font-bold text-muted-foreground mb-4 flex items-center gap-1.5 uppercase tracking-wider">
                                <Smartphone className="h-4 w-4 text-[#35877D]" /> Live Mobile Preview
                            </p>
                            <DevicePreview state={state} />
                        </Card>
                    </div>
                </div>
            </div>

            {/* Campaign Credit Confirmation Dialog */}
            <CampaignCreditConfirmDialog
                open={showCreditConfirm}
                onOpenChange={setShowCreditConfirm}
                recipientCount={recipientCount}
                costPerMessage={1}
                isSending={isProcessing}
                onConfirm={() => {
                    setShowCreditConfirm(false);
                    handleSend();
                }}
            />
        </UpgradeGuard>
    );
}

